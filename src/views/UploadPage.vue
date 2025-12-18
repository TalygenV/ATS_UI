<template>
  <div class="upload-page">

    <div v-if="!hasWriteAccess" class="card">
      <div class="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to upload resumes. Only HR and Admin users can upload resumes.</p>
        <button @click="$router.push('/job-descriptions')" class="btn btn-primary">Go to Job Descriptions</button>
      </div>
    </div>
    <div v-else class="card">
      <h2>Upload Resumes</h2>
      <p class="subtitle">Select a job description and upload resume files (PDF, DOC, DOCX, TXT)</p>

      <div class="job-description-section">
        <label for="jobDescription" class="form-label">Select Job Description *</label>
        <div class="job-select-wrapper">
          <select 
            id="jobDescription"
            v-model="selectedJobDescriptionId" 
            class="job-select"
            required>
            <option value="">-- Select a job description --</option>
            <option v-for="job in jobDescriptions" :key="job.id" :value="job.id">
              {{ job.title }}
            </option>
          </select>
          <button @click="$router.push('/job-descriptions')" class="btn-link" type="button">
            + Create New
          </button>
        </div>
        <div v-if="selectedJobDescription" class="job-preview">
          <h4>{{ selectedJobDescription.title }}</h4>
          <p>{{ truncateText(selectedJobDescription.description, 200) }}</p>
        </div>
      </div>

      <div class="upload-section">
        <div class="upload-area" 
             :class="{ 'drag-over': isDragOver }"
             @drop="handleDrop"
             @dragover.prevent="isDragOver = true"
             @dragleave="isDragOver = false"
             @click="triggerFileInput">
          <input 
            ref="fileInput"
            type="file" 
            multiple 
            accept=".pdf,.doc,.docx,.txt"
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="upload-icon">📄</div>
          <p class="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="upload-hint">Supports PDF, DOC, DOCX, and TXT files</p>
        </div>

        <div v-if="selectedFiles.length > 0" class="selected-files">
          <h3>Selected Files ({{ selectedFiles.length }})</h3>
          <div class="file-list">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
              <button @click="removeFile(index)" class="remove-btn">×</button>
            </div>
          </div>
        </div>

        <div class="upload-actions">
          <button 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0 || uploading || !selectedJobDescriptionId"
            class="btn btn-primary">
            <span v-if="uploading">Processing...</span>
            <span v-else>Upload & Parse Resumes</span>
          </button>
          <button 
            @click="clearFiles" 
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn btn-secondary">
            Clear
          </button>
        </div>
      </div>

      <div v-if="uploadResults.length > 0" class="results-section">
        <h3>Upload Results</h3>
        <div class="results-summary">
          <div class="summary-item success">
            <span class="summary-label">Success:</span>
            <span class="summary-value">{{ successCount }}</span>
          </div>
          <div class="summary-item error">
            <span class="summary-label">Failed:</span>
            <span class="summary-value">{{ errorCount }}</span>
          </div>
        </div>
        <div class="results-list">
          <div 
            v-for="(result, index) in uploadResults" 
            :key="index" 
            :class="['result-item', result.success ? 'success' : 'error']">
            <div class="result-header">
              <span class="result-file">{{ result.fileName }}</span>
              <span :class="['result-status', result.success ? 'success' : 'error']">
                {{ result.success ? '✓ Success' : '✗ Failed' }}
              </span>
            </div>
            <div v-if="result.error" class="result-error">{{ result.error }}</div>
            <div v-if="result.isDuplicate" class="duplicate-warning">
              ⚠️ Duplicate detected! Linked to parent resume ID: {{ result.parentId }}
            </div>
            <div v-if="result.data" class="result-preview">
              <p><strong>Name:</strong> {{ result.data.name || 'N/A' }}</p>
              <p><strong>Email:</strong> {{ result.data.email || 'N/A' }}</p>
              <p><strong>Location:</strong> {{ result.data.location || 'N/A' }}</p>
              <p v-if="result.data.total_experience !== null && result.data.total_experience !== undefined">
                <strong>Total Experience:</strong> {{ formatExperience(result.data.total_experience) }}
              </p>
              <div v-if="result.matchScores" class="match-scores">
                <h4>Match Scores:</h4>
                <div class="scores-row">
                  <div class="score-item">
                    <span class="score-label">Overall:</span>
                    <span class="score-value">{{ formatScore(result.matchScores.overall_match) }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Skills:</span>
                    <span class="score-value">{{ formatScore(result.matchScores.skills_match) }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Experience:</span>
                    <span class="score-value">{{ formatScore(result.matchScores.experience_match) }}%</span>
                  </div>
                  <div class="score-item">
                    <span class="score-label">Education:</span>
                    <span class="score-value">{{ formatScore(result.matchScores.education_match) }}%</span>
                  </div>
                </div>
                <div class="status-badge" :class="result.matchScores.status">
                  Status: {{ result.matchScores.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useAuth } from '../composables/useAuth';
import { useLoader } from '../composables/useLoader';
import { API_BASE_URL } from '../config/api';

export default {
  name: 'UploadPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, showLoader, hideLoader };
  },
  data() {
    return {
      selectedFiles: [],
      isDragOver: false,
      uploading: false,
      uploadResults: [],
      jobDescriptions: [],
      selectedJobDescriptionId: '',
      loadingJobs: false
    };
  },
  computed: {
    selectedJobDescription() {
      return this.jobDescriptions.find(job => job.id === parseInt(this.selectedJobDescriptionId));
    },
    successCount() {
      return this.uploadResults.filter(r => r.success).length;
    },
    errorCount() {
      return this.uploadResults.filter(r => !r.success).length;
    }
  },
  mounted() {
    this.fetchJobDescriptions();
  },
  methods: {
    async fetchJobDescriptions() {
      this.loadingJobs = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions`);
        if (response.data.success) {
          this.jobDescriptions = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching job descriptions:', error);
      } finally {
        this.loadingJobs = false;
      }
    },
    truncateText(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.addFiles(files);
    },
    handleDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    },
    addFiles(files) {
      const validFiles = files.filter(file => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        return validTypes.includes(file.type) || 
               file.name.endsWith('.pdf') || 
               file.name.endsWith('.doc') || 
               file.name.endsWith('.docx') || 
               file.name.endsWith('.txt');
      });
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    clearFiles() {
      this.selectedFiles = [];
      this.uploadResults = [];
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    formatExperience(years) {
      if (!years && years !== 0) return 'N/A';
      const totalYears = parseFloat(years);
      if (isNaN(totalYears)) return 'N/A';
      
      const wholeYears = Math.floor(totalYears);
      const months = Math.round((totalYears - wholeYears) * 12);
      
      if (wholeYears === 0 && months === 0) return 'Less than 1 month';
      if (wholeYears === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
      if (months === 0) return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
      return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    },
    async uploadFiles() {
      if (this.selectedFiles.length === 0) return;

      if (!this.selectedJobDescriptionId) {
        alert('Please select a job description first');
        return;
      }

      // Set uploading state immediately to show fullscreen loader
      this.uploading = true;
      this.uploadResults = [];
      
      const fileCount = this.selectedFiles.length;
      const message = fileCount === 1 
        ? 'Processing Resume' 
        : `Processing ${fileCount} Resumes`;
      const subMessage = fileCount === 1
        ? 'Please wait while we upload and parse your resume'
        : `Processing ${fileCount} resumes. This may take a few moments...`;
      
      this.showLoader(message, subMessage);
      
      // Small delay to ensure the loader is rendered and visible
      await this.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const formData = new FormData();
        formData.append('job_description_id', this.selectedJobDescriptionId);
        
        if (this.selectedFiles.length === 1) {
          // Single file upload
          formData.append('resume', this.selectedFiles[0]);
          const response = await axios.post(`${API_BASE_URL}/upload/single`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            this.uploadResults.push({
              fileName: this.selectedFiles[0].name,
              success: true,
              data: response.data.data,
              isDuplicate: response.data.isDuplicate || false,
              parentId: response.data.parentId || null,
              matchScores: response.data.matchScores || null
            });
          }
        } else {
          // Bulk upload
          this.selectedFiles.forEach(file => {
            formData.append('resumes', file);
          });

          const response = await axios.post(`${API_BASE_URL}/upload/bulk`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            // Add successful results
            response.data.results.forEach(result => {
              this.uploadResults.push({
                fileName: result.fileName,
                success: true,
                data: result.data,
                isDuplicate: result.isDuplicate || false,
                parentId: result.parentId || null,
                matchScores: result.matchScores || null
              });
            });

            // Add error results
            response.data.errors.forEach(error => {
              this.uploadResults.push({
                fileName: error.fileName,
                success: false,
                error: error.error
              });
            });
          }
        }

        // Clear files after successful upload
        if (this.uploadResults.every(r => r.success)) {
          setTimeout(() => {
            this.clearFiles();
          }, 3000);
        }
      } catch (error) {
        console.error('Upload error:', error);
        
        // Check for the specific "already applied" error
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Upload failed';
        
        if (errorMessage.includes('already applied within the last 6 months')) {
          // Show alert instead of treating as failure
          alert(errorMessage);
          return;
        }
        
        // Handle other errors normally
        this.selectedFiles.forEach(file => {
          this.uploadResults.push({
            fileName: file.name,
            success: false,
            error: errorMessage
          });
        });
      } finally {
        this.uploading = false;
        this.hideLoader();
      }
    }
  }
};
</script>

<style scoped>
.upload-page {
  padding: 2rem 0;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

h2 {
  color: #1a202c;
  margin-bottom: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.job-description-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.job-select-wrapper {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.job-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.job-select:focus {
  outline: none;
  border-color: #1976d2;
}

.btn-link {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.5rem;
}

.btn-link:hover {
  color: #1565c0;
}

.job-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #1976d2;
}

.job-preview h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.job-preview p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.upload-section {
  margin-bottom: 2rem;
}

.upload-area {
  border: 3px dashed #cbd5e0;
  border-radius: 20px;
  padding: 4rem 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
}

.upload-area:hover {
  border-color: #4299e1;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6edff 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.15);
}

.upload-area.drag-over {
  border-color: #4299e1;
  background: linear-gradient(135deg, #e6edff 0%, #d6e2ff 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 40px rgba(66, 153, 225, 0.25);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.upload-hint {
  color: #999;
  font-size: 0.9rem;
}

.selected-files {
  margin-top: 2rem;
}

.file-list {
  margin-top: 1rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.file-name {
  flex: 1;
  color: #333;
}

.file-size {
  color: #666;
  font-size: 0.9rem;
}

.remove-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: background 0.3s;
}

.remove-btn:hover {
  background: #cc0000;
}

.upload-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.results-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.results-summary {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
}

.summary-item.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.summary-item.error {
  background: #ffebee;
  color: #c62828;
}

.summary-label {
  font-weight: 500;
  margin-right: 0.5rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid;
}

.result-item.success {
  background: #f1f8f4;
  border-color: #4caf50;
}

.result-item.error {
  background: #fff5f5;
  border-color: #f44336;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.result-file {
  font-weight: 500;
  color: #333;
}

.result-status {
  font-weight: 600;
  font-size: 0.9rem;
}

.result-status.success {
  color: #4caf50;
}

.result-status.error {
  color: #f44336;
}

.result-error {
  color: #c62828;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.result-preview {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ddd;
}

.result-preview p {
  margin: 0.25rem 0;
  color: #555;
  font-size: 0.9rem;
}

.duplicate-warning {
  background: #fff3e0;
  border-left: 3px solid #ff9800;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border-radius: 4px;
  color: #e65100;
  font-size: 0.9rem;
  font-weight: 500;
}

.match-scores {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.match-scores h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.scores-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.score-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.score-value {
  font-weight: 600;
  color: #1976d2;
  font-size: 1rem;
}

/* .status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.accepted {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.pending {
  background: #fff3e0;
  color: #e65100;
}

.status-badge.rejected {
  background: #ffebee;
  color: #c62828;
} */

.access-denied {
  text-align: center;
  padding: 3rem;
}

.access-denied h2 {
  color: #f44336;
  margin-bottom: 1rem;
}

.access-denied p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

