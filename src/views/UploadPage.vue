<template>
  <div class="py-4">
    <div v-if="!hasWriteAccess" class="ats-card ats-card-xl text-center py-5">
      <h2 class="text-danger mb-3">Access Denied</h2>
      <p class="text-secondary fs-5 mb-4">You don't have permission to upload resumes. Only HR and Admin users can upload resumes.</p>
      <button @click="$router.push('/job-descriptions')" class="btn-ats-primary">Go to Job Descriptions</button>
    </div>
    <div v-else class="ats-card ats-card-xl">
      <h2 class="page-title-ats mb-2">Upload Resumes</h2>
      <p class="text-muted mb-4">Select a job description and upload resume files (PDF, DOC, DOCX, TXT)</p>

      <div class="bg-light p-4 rounded-3 mb-4">
        <label for="jobDescription" class="form-label fw-medium text-dark">Select Job Description *</label>
        <div class="d-flex gap-3 align-items-center">
          <select 
            id="jobDescription"
            v-model="selectedJobDescriptionId" 
            class="form-select-ats flex-grow-1"
            required>
            <option value="">-- Select a job description --</option>
            <option v-for="job in jobDescriptions" :key="job.id" :value="job.id">
              {{ job.title }}
            </option>
          </select>
          <button @click="$router.push('/job-descriptions')" class="btn-back" type="button">+ Create New</button>
        </div>
        <div v-if="selectedJobDescription" class="mt-3 p-3 bg-white rounded-3 border-start border-4 border-primary">
          <h4 class="fs-6 fw-semibold text-dark mb-2">{{ selectedJobDescription.title }}</h4>
          <p class="text-secondary mb-0">{{ truncateText(selectedJobDescription.description, 200) }}</p>
        </div>
      </div>

      <div class="mb-4">
        <div 
          class="upload-area-ats" 
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
          <div class="fs-1 mb-3">📄</div>
          <p class="fs-5 text-dark mb-2"><strong>Click to upload</strong> or drag and drop</p>
          <p class="text-muted">Supports PDF, DOC, DOCX, and TXT files</p>
        </div>

        <div v-if="selectedFiles.length > 0" class="mt-4">
          <h3 class="fs-5 fw-semibold mb-3">Selected Files ({{ selectedFiles.length }})</h3>
          <div class="d-flex flex-column gap-2">
            <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
              <div class="file-icon">📄</div>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button @click="removeFile(index)" class="btn-remove-file">×</button>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 mt-4">
          <button 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0 || uploading || !selectedJobDescriptionId"
            class="btn-ats-primary">
            <span v-if="uploading">Processing...</span>
            <span v-else>Upload & Parse Resumes</span>
          </button>
          <button 
            @click="clearFiles" 
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn-ats-secondary">
            Clear
          </button>
        </div>
      </div>

      <div v-if="uploadResults.length > 0" class="pt-4 border-top">
        <h3 class="fs-5 fw-semibold mb-3">Upload Results</h3>
        <div class="d-flex gap-4 mb-4">
          <div class="px-4 py-2 rounded-3 bg-success bg-opacity-10 text-success">
            <span class="fw-medium me-2">Success:</span>
            <span class="fw-bold">{{ successCount }}</span>
          </div>
          <div class="px-4 py-2 rounded-3 bg-danger bg-opacity-10 text-danger">
            <span class="fw-medium me-2">Failed:</span>
            <span class="fw-bold">{{ errorCount }}</span>
          </div>
        </div>
        <div class="d-flex flex-column gap-3">
          <div 
            v-for="(result, index) in uploadResults" 
            :key="index" 
            class="p-3 rounded-3"
            :class="result.success ? 'result-item-success' : 'result-item-error'">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fw-medium text-dark">{{ result.fileName }}</span>
              <span :class="result.success ? 'text-success' : 'text-danger'" class="fw-semibold">
                {{ result.success ? '✓ Success' : '✗ Failed' }}
              </span>
            </div>
            <div v-if="result.error" class="text-danger small mt-2">{{ result.error }}</div>
            <div v-if="result.isDuplicate" class="duplicate-notice-ats mt-2">
              ⚠️ Duplicate detected! Linked to parent resume ID: {{ result.parentId }}
            </div>
            <div v-if="result.data" class="mt-3 pt-3 border-top">
              <p class="mb-1 small text-secondary"><strong>Name:</strong> {{ result.data.name || 'N/A' }}</p>
              <p class="mb-1 small text-secondary"><strong>Email:</strong> {{ result.data.email || 'N/A' }}</p>
              <p class="mb-1 small text-secondary"><strong>Location:</strong> {{ result.data.location || 'N/A' }}</p>
              <p v-if="result.data.total_experience !== null && result.data.total_experience !== undefined" class="mb-1 small text-secondary">
                <strong>Total Experience:</strong> {{ formatExperience(result.data.total_experience) }}
              </p>
              <div v-if="result.matchScores" class="mt-3 pt-3 border-top">
                <h4 class="small fw-semibold text-dark mb-2">Match Scores:</h4>
                <div class="row g-2 mb-2">
                  <div class="col-6">
                    <div class="d-flex justify-content-between p-2 bg-light rounded-2 small">
                      <span class="text-muted">Overall:</span>
                      <span class="text-primary fw-semibold">{{ formatScore(result.matchScores.overall_match) }}%</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex justify-content-between p-2 bg-light rounded-2 small">
                      <span class="text-muted">Skills:</span>
                      <span class="text-primary fw-semibold">{{ formatScore(result.matchScores.skills_match) }}%</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex justify-content-between p-2 bg-light rounded-2 small">
                      <span class="text-muted">Experience:</span>
                      <span class="text-primary fw-semibold">{{ formatScore(result.matchScores.experience_match) }}%</span>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="d-flex justify-content-between p-2 bg-light rounded-2 small">
                      <span class="text-muted">Education:</span>
                      <span class="text-primary fw-semibold">{{ formatScore(result.matchScores.education_match) }}%</span>
                    </div>
                  </div>
                </div>
                <span class="badge-ats" :class="'badge-ats-' + result.matchScores.status">
                  Status: {{ result.matchScores.status }}
                </span>
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
      
      await this.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        const formData = new FormData();
        formData.append('job_description_id', this.selectedJobDescriptionId);
        
        if (this.selectedFiles.length === 1) {
          formData.append('resume', this.selectedFiles[0]);
          const response = await axios.post(`${API_BASE_URL}/upload/single`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
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
          this.selectedFiles.forEach(file => {
            formData.append('resumes', file);
          });

          const response = await axios.post(`${API_BASE_URL}/upload/bulk`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (response.data.success) {
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

            response.data.errors.forEach(error => {
              this.uploadResults.push({
                fileName: error.fileName,
                success: false,
                error: error.error
              });
            });
          }
        }

        if (this.uploadResults.every(r => r.success)) {
          setTimeout(() => {
            this.clearFiles();
          }, 3000);
        }
      } catch (error) {
        console.error('Upload error:', error);
        
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Upload failed';
        
        if (errorMessage.includes('already applied within the last 6 months')) {
          alert(errorMessage);
          return;
        }
        
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
