<template>
  <div class="job-detail-page" :class="{ 'processing': uploading }">
    <div class="page-header">
      <button @click="$router.push('/job-descriptions')" class="btn-back">← Back to Job Descriptions</button>
    </div>

    <!-- Full Screen Loader -->
    <div v-if="uploading" class="full-screen-loader">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="loader-text">Processing Resumes...</p>
        <p class="loader-subtext">Please wait while we upload and parse your resumes</p>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="jobDescription" class="content">
      <!-- Job Description Info -->
      <div class="job-info-card">
        <div class="card-header">
          <h2>{{ jobDescription.title }}</h2>
          <div v-if="hasWriteAccess" class="header-actions">
            <button @click="editJob" class="btn btn-secondary">Edit</button>
            <button @click="deleteJob" class="btn btn-danger">Delete</button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-section">
            <h3>Job Description</h3>
            <p class="description-text">{{ jobDescription.description }}</p>
          </div>
          <div v-if="jobDescription.requirements" class="info-section">
            <h3>Requirements</h3>
            <p class="description-text">{{ jobDescription.requirements }}</p>
          </div>
          <div class="info-section">
            <p class="meta-info">Created: {{ formatDate(jobDescription.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Upload Resumes Section -->
      <div v-if="hasWriteAccess" class="upload-section-card">
        <h3>Upload Resumes</h3>
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
          <h4>Selected Files ({{ selectedFiles.length }})</h4>
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
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn btn-primary">
            Upload & Parse Resumes
          </button>
          <button 
            @click="clearFiles" 
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn btn-secondary">
            Clear
          </button>
        </div>

        <div v-if="uploadResults.length > 0" class="upload-results">
          <h4>Upload Results</h4>
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
        </div>
      </div>

      <!-- Candidates List -->
      <div class="candidates-section-card">
        <div class="section-header">
          <h3>Candidates ({{ candidates.length }})</h3>
          <div class="header-actions">
            <select v-model="statusFilter" @change="fetchCandidates" class="filter-select">
              <option value="">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select v-model="sortBy" @change="fetchCandidates" class="filter-select">
              <option value="match">Sort by Match Score</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        <div v-if="loadingCandidates" class="loading">Loading candidates...</div>
        <div v-else-if="candidates.length === 0" class="empty-state">
          <p>No candidates found. Upload resumes to get started!</p>
        </div>
        <div v-else class="candidates-grid">
          <div v-for="candidate in candidates" :key="candidate.id" class="candidate-card" :class="getStatusClass(candidate.status)">
            <div class="card-header-section">
              <div class="candidate-header">
                <div class="candidate-info">
                  <h4>{{ candidate.candidate_name || 'Unknown' }}</h4>
                  <span class="candidate-email">{{ candidate.email || 'N/A' }}</span>
                </div>
                <div class="match-score-circle">
                  <div class="score-value-small">{{ formatScore(candidate.overall_match) }}%</div>
                  <div class="score-label-small">Match</div>
                </div>
              </div>
              <div class="status-badge-top">
                <span v-if="candidate.isDuplicate" class="duplicate-badge">Duplicate ({{ candidate.duplicateCount }})</span>
                <span :class="['status-badge', candidate.status]">{{ candidate.status }}</span>
              </div>
            </div>
            
            <div class="card-body-section">
              <div class="match-breakdown">
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Skills</span>
                    <span class="match-percentage">{{ formatScore(candidate.skills_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: formatScore(candidate.skills_match) + '%' }"></div>
                  </div>
                </div>
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Experience</span>
                    <span class="match-percentage">{{ formatScore(candidate.experience_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: formatScore(candidate.experience_match) + '%' }"></div>
                  </div>
                </div>
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Education</span>
                    <span class="match-percentage">{{ formatScore(candidate.education_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: candidate.education_match + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-footer-section">
              <span class="date">{{ formatDate(candidate.created_at) }}</span>
              <div class="footer-actions">
                <button @click="downloadResume(candidate.resume_id, candidate)" class="btn btn-icon" title="Download Resume">
                  ⬇️
                </button>
                <button @click="viewResumeDetail(candidate)" class="btn btn-primary-small">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Job Description</h2>
          <button @click="closeEditModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveJob">
            <div class="form-group">
              <label for="title">Job Title *</label>
              <input
                id="title"
                v-model="editForm.title"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="description">Job Description *</label>
              <textarea
                id="description"
                v-model="editForm.description"
                required
                rows="8"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="requirements">Requirements (Optional)</label>
              <textarea
                id="requirements"
                v-model="editForm.requirements"
                rows="6"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeEditModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn btn-primary">
                <span v-if="saving">Saving...</span>
                <span v-else>Update</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Resume Detail Modal -->
    <div v-if="showResumeModal" class="resume-modal-overlay" @click="closeResumeModal">
      <div class="resume-modal-content" @click.stop>
        <div class="resume-modal-header">
          <button @click="closeResumeModal" class="close-btn">×</button>
        </div>
        <div class="resume-modal-body">
          <div v-if="loadingResumeDetail" class="loading">Loading resume details...</div>
          <div v-else-if="errorResumeDetail && !resumeDetailEvaluation" class="error-message">{{ errorResumeDetail }}</div>
          <div v-else-if="resumeDetailEvaluation" class="resume-detail-content">
            <!-- Header Section -->
            <div class="resume-header-card">
              <div class="resume-header-content">
                <h1>{{ resumeDetailEvaluation.candidate_name || 'Unknown Candidate' }}</h1>
                <p class="candidate-contact">
                  <span v-if="resumeDetailEvaluation.email">📧 {{ resumeDetailEvaluation.email }}</span>
                  <span v-if="resumeDetailEvaluation.contact_number"> | 📞 {{ resumeDetailEvaluation.contact_number }}</span>
                </p>
                <div class="resume-header-actions">
                  <button @click="downloadResumeFromModal" class="btn btn-primary">⬇️ Download Resume</button>
                  <select v-if="hasWriteAccess" v-model="resumeDetailEvaluation.status" @change="updateResumeStatus" class="status-select">
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span v-else class="status-display">{{ resumeDetailEvaluation.status }}</span>
                </div>
              </div>
              <div class="match-score-large">
                <div class="score-value-large">{{ formatScore(resumeDetailEvaluation.overall_match) }}%</div>
                <div class="score-label-large">Overall Match</div>
              </div>
            </div>

            <!-- Match Scores Section -->
            <div class="resume-scores-card">
              <h2>Match Scores</h2>
              <div class="scores-grid">
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.skills_match) }}%</div>
                  <div class="score-label">Skills Match</div>
                </div>
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.experience_match) }}%</div>
                  <div class="score-label">Experience Match</div>
                </div>
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.education_match) }}%</div>
                  <div class="score-label">Education Match</div>
                </div>
              </div>
            </div>

            <!-- Detailed Analysis Section -->
            <div class="resume-analysis-card">
              <h2>Detailed Analysis</h2>
              
              <div class="analysis-section">
                <h3>Skills Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.skills_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div class="analysis-section">
                <h3>Experience Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.experience_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div class="analysis-section">
                <h3>Education Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.education_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div v-if="resumeDetailEvaluation.rejection_reason" class="analysis-section rejection">
                <h3>Rejection Reason</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.rejection_reason }}</p>
                </div>
              </div>
            </div>

            <!-- Resume Information Section -->
            <div class="resume-info-card">
              <h2>Resume Information</h2>
              
              <div v-if="errorResumeDetail && resumeDetailEvaluation" class="error-notice">
                <p>⚠️ {{ errorResumeDetail }}</p>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.name) || resumeDetailEvaluation.candidate_name || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.email) || resumeDetailEvaluation.email || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.phone) || resumeDetailEvaluation.contact_number || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.location) || 'N/A' }}</span>
                </div>
                <div v-if="resumeDetail && resumeDetail.total_experience !== null && resumeDetail.total_experience !== undefined" class="info-item">
                  <span class="info-label">Total Experience:</span>
                  <span class="info-value">{{ formatExperience(resumeDetail.total_experience) }}</span>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.summary" class="info-section">
                <h3>Summary</h3>
                <p class="summary-text">{{ resumeDetail.summary }}</p>
              </div>

              <div v-if="resumeDetail && resumeDetail.skills && resumeDetail.skills.length > 0" class="info-section">
                <h3>Skills</h3>
                <div class="tags">
                  <span v-for="(skill, index) in resumeDetail.skills" :key="index" class="tag">
                    {{ skill }}
                  </span>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.experience && resumeDetail.experience.length > 0" class="info-section">
                <h3>Work Experience</h3>
                <div class="experience-list">
                  <div v-for="(exp, index) in resumeDetail.experience" :key="index" class="experience-item">
                    <h4>{{ exp.position }}</h4>
                    <p class="company">{{ exp.company }}</p>
                    <p v-if="exp.duration" class="duration">{{ exp.duration }}</p>
                    <p v-if="exp.startDate && exp.endDate" class="dates">
                      {{ formatDateRange(exp.startDate, exp.endDate) }}
                    </p>
                    <p v-if="exp.description" class="description">{{ exp.description }}</p>
                  </div>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.education && resumeDetail.education.length > 0" class="info-section">
                <h3>Education</h3>
                <div class="education-list">
                  <div v-for="(edu, index) in resumeDetail.education" :key="index" class="education-item">
                    <h4>{{ edu.degree }}</h4>
                    <p v-if="edu.field">Field: {{ edu.field }}</p>
                    <p v-if="edu.institution">Institution: {{ edu.institution }}</p>
                    <p v-if="edu.year">Year: {{ edu.year }}</p>
                  </div>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.certifications && resumeDetail.certifications.length > 0" class="info-section">
                <h3>Certifications</h3>
                <ul class="certifications-list">
                  <li v-for="(cert, index) in resumeDetail.certifications" :key="index">{{ cert }}</li>
                </ul>
              </div>

              <div class="info-section">
                <h3>Raw Resume Text</h3>
                <div class="raw-text-container">
                  <pre class="raw-text">{{ resumeDetailEvaluation.resume_text || (resumeDetail && resumeDetail.raw_text) || 'No text available' }}</pre>
                </div>
              </div>
            </div>

            <!-- Job Description Section -->
            <div class="job-description-card">
              <h2>Job Description</h2>
              <div class="job-description-content">
                <pre class="job-description-text">{{ resumeDetailEvaluation.job_description.description || 'No job description available' }}</pre>
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
import { API_BASE_URL } from '../config/api';

export default {
  name: 'JobDetailPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    return { hasWriteAccess };
  },
  data() {
    return {
      jobDescription: null,
      candidates: [],
      loading: false,
      loadingCandidates: false,
      error: null,
      selectedFiles: [],
      isDragOver: false,
      uploading: false,
      uploadResults: [],
      statusFilter: '',
      sortBy: 'match',
      showEditModal: false,
      saving: false,
      editForm: {
        title: '',
        description: '',
        requirements: ''
      },
      showResumeModal: false,
      resumeDetailEvaluation: null,
      resumeDetail: null,
      loadingResumeDetail: false,
      errorResumeDetail: null
    };
  },
  computed: {
    successCount() {
      return this.uploadResults.filter(r => r.success).length;
    },
    errorCount() {
      return this.uploadResults.filter(r => !r.success).length;
    }
  },
  mounted() {
    this.fetchJobDescription();
    this.fetchCandidates();
  },
  methods: {
    async fetchJobDescription() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions/${this.$route.params.id}`);
        if (response.data.success) {
          this.jobDescription = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching job description:', error);
        this.error = 'Failed to fetch job description. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    async fetchCandidates() {
      this.loadingCandidates = true;
      try {
        const jobId = this.$route.params.id;
        const params = new URLSearchParams();
        if (this.statusFilter) {
          params.append('status', this.statusFilter);
        }
        params.append('sort_by', this.sortBy);
        
        const response = await axios.get(
          `${API_BASE_URL}/evaluations/job/${jobId}?${params.toString()}`
        );
        if (response.data.success) {
          this.candidates = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        this.loadingCandidates = false;
      }
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
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    },
    async uploadFiles() {
      if (this.selectedFiles.length === 0) return;

      this.uploading = true;
      this.uploadResults = [];

      try {
        const formData = new FormData();
        formData.append('job_description_id', this.$route.params.id);
        
        if (this.selectedFiles.length === 1) {
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
              data: response.data.data
            });
          }
        } else {
          this.selectedFiles.forEach(file => {
            formData.append('resumes', file);
          });

          const response = await axios.post(`${API_BASE_URL}/upload/bulk`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            response.data.results.forEach(result => {
              this.uploadResults.push({
                fileName: result.fileName,
                success: true,
                data: result.data
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

        // Refresh candidates list
        await this.fetchCandidates();

        // Clear files after successful upload
        if (this.uploadResults.every(r => r.success)) {
          setTimeout(() => {
            this.clearFiles();
          }, 3000);
        }
      } catch (error) {
        console.error('Upload error:', error);
        this.selectedFiles.forEach(file => {
          this.uploadResults.push({
            fileName: file.name,
            success: false,
            error: error.response?.data?.message || error.message || 'Upload failed'
          });
        });
      } finally {
        this.uploading = false;
      }
    },
    async downloadResume(resumeId, candidate = null) {
      console.log('\n==========================================');
      console.log('📥 FRONTEND: Download Resume Request');
      console.log('==========================================');
      console.log('Resume ID (from parameter):', resumeId);
      console.log('Resume ID Type:', typeof resumeId);
      console.log('Candidate Object:', candidate);
      if (candidate) {
        console.log('Candidate Keys:', Object.keys(candidate));
        console.log('Candidate.resume_id:', candidate.resume_id);
        console.log('Candidate.resume:', candidate.resume);
        console.log('Candidate.resume?.id:', candidate.resume?.id);
      }
      console.log('API Base URL:', API_BASE_URL);
      
      // If resumeId is not provided, try to get it from candidate object
      if (!resumeId && candidate) {
        resumeId = candidate.resume_id || candidate.resume?.id;
        console.log('Resume ID (after fallback):', resumeId);
      }
      
      if (!resumeId) {
        console.error('❌ Resume ID is missing or undefined');
        console.error('Cannot determine resume ID from:', {
          parameter: resumeId,
          candidate_resume_id: candidate?.resume_id,
          candidate_resume_id_nested: candidate?.resume?.id
        });
        alert('Resume ID is missing. Cannot download resume.');
        return;
      }
      
      console.log('Full URL:', `${API_BASE_URL}/resumes/${resumeId}/download`);
      
      try {
        // console.log('Making axios GET request...');
        // const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
        //   responseType: 'json',
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        //   }
        // });
        debugger;
        // const fileUrl = response.data.file_path;
        // const fileName = response.data.file_name || 'download.pdf';

        // const link = document.createElement('a');
        // link.href = fileUrl;
        // link.download = fileUrl; // browser will try to download if allowed
        // link.target = '_blank';   // avoid replacing current tab
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        const BEARER_TOKEN = localStorage.getItem('auth_token');

    // --- STEP 1: Get the external file path from your local API ---
    const apiResponse = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
        // We still expect JSON from your local API
        responseType: 'json', 
        headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
        }
    });

    const externalFileUrl = apiResponse.data.file_path;
    const fileName = apiResponse.data.file_name || 'download.pdf';

    // Extract the path *after* the domain (e.g., /files/DocStorage//...)
    const urlParts = externalFileUrl.split('https://stagefilemedia.talygen.com');
    if (urlParts.length !== 2) {
        console.error("Invalid external file path format:", externalFileUrl);
        return;
    }
    // The path the proxy needs to see is '/files/DocStorage//...'
    const proxyPath = `/talygen${urlParts[1]}`; 

    // --- STEP 2: Use the proxy to download the file as a BLOB ---
    const fileResponse = await axios.get(proxyPath, {
        // 🚨 CRITICAL: Must be 'blob' to handle binary file content
        responseType: 'blob', 
        headers: {
            // Include your auth token only if the API requires it for this proxy request
            // In most cases, external file hosts don't need this, but we'll include it defensively.
            'Authorization': `Bearer ${BEARER_TOKEN}` 
        }
    });

    // --- STEP 3: Trigger the download using the BLOB ---
    const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
    const link = document.createElement('a');
    
    // Set up the download
    link.href = url;
    link.download = fileName; // Use the file name retrieved from the API

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL to free up memory
    window.URL.revokeObjectURL(url);



      } catch (error) {
        console.error('\n❌ ERROR downloading resume:');
        console.error('   - Error Message:', error.message);
        console.error('   - Error Response:', error.response);
        console.error('   - Error Status:', error.response?.status);
        console.error('   - Error Status Text:', error.response?.statusText);
        console.error('   - Error Data:', error.response?.data);
        console.error('   - Error Config:', error.config);
        console.error('==========================================\n');
        
        let errorMessage = 'Failed to download resume. ';
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage += 'Resume not found.';
          } else if (error.response.status === 401) {
            errorMessage += 'Authentication failed. Please login again.';
          } else if (error.response.status === 403) {
            errorMessage += 'You do not have permission to download this resume.';
          } else {
            errorMessage += `Server error (${error.response.status}).`;
          }
        } else if (error.request) {
          errorMessage += 'No response from server. Please check your connection.';
        } else {
          errorMessage += error.message || 'Unknown error occurred.';
        }
        
        alert(errorMessage);
      }
    },
    async viewResumeDetail(candidate) {
      this.showResumeModal = true;
      this.resumeDetailEvaluation = null;
      this.resumeDetail = null;
      this.errorResumeDetail = null;
      await this.fetchResumeDetail(candidate.id);
    },
    async fetchResumeDetail(evaluationId) {
      this.loadingResumeDetail = true;
      this.errorResumeDetail = null;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.data && response.data.success) {
          this.resumeDetailEvaluation = response.data.data;
          this.resumeDetail = response.data.data?.resume;
          
          if (!this.resumeDetail) {
            this.resumeDetail = {
              id: null,
              name: this.resumeDetailEvaluation?.candidate_name || 'N/A',
              email: this.resumeDetailEvaluation?.email || 'N/A',
              phone: this.resumeDetailEvaluation?.contact_number || 'N/A',
              location: null,
              skills: [],
              experience: [],
              education: [],
              certifications: []
            };
          }
        } else {
          this.errorResumeDetail = response.data?.error || 'Failed to fetch resume details. Please try again.';
        }
      } catch (error) {
        console.error('Error fetching resume detail:', error);
        if (error.response?.status === 401) {
          this.errorResumeDetail = 'Session expired. Please login again.';
        } else if (error.response?.status === 404) {
          this.errorResumeDetail = `Evaluation with ID ${evaluationId} not found.`;
        } else {
          this.errorResumeDetail = error.response?.data?.error || error.message || 'Failed to fetch resume details. Please try again.';
        }
      } finally {
        this.loadingResumeDetail = false;
      }
    },
    async updateResumeStatus() {
      try {
        const response = await axios.patch(
          `${API_BASE_URL}/evaluations/${this.resumeDetailEvaluation.id}/status`,
          { status: this.resumeDetailEvaluation.status }
        );
        if (response.data.success) {
          this.resumeDetailEvaluation = response.data.data;
          // Refresh candidates list to reflect status change
          await this.fetchCandidates();
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      }
    },
    async downloadResumeFromModal() {
      try {
        if (!this.resumeDetail || !this.resumeDetail.id) {
          alert('Resume file not available for download.');
          return;
        }
        const resumeId = this.resumeDetail.id;
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'blob'
        });
        
        const contentDisposition = response.headers['content-disposition'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        let filename = this.resumeDetail.file_name || `resume-${resumeId}`;
        
        if (contentDisposition) {
          let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
          if (filenameMatch) {
            try {
              filename = decodeURIComponent(filenameMatch[1]);
            } catch (e) {
              filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }
          } else {
            filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
        }
        
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading resume:', error);
        alert('Failed to download resume. Please try again.');
      }
    },
    closeResumeModal() {
      this.showResumeModal = false;
      this.resumeDetailEvaluation = null;
      this.resumeDetail = null;
      this.errorResumeDetail = null;
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
    formatDateRange(startDate, endDate) {
      const start = new Date(startDate);
      const end = endDate === 'Present' ? new Date() : new Date(endDate);
      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate === 'Present' ? 'Present' : end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    },
    editJob() {
      this.editForm = {
        title: this.jobDescription.title,
        description: this.jobDescription.description,
        requirements: this.jobDescription.requirements || ''
      };
      this.showEditModal = true;
    },
    async saveJob() {
      this.saving = true;
      try {
        const response = await axios.put(
          `${API_BASE_URL}/job-descriptions/${this.$route.params.id}`,
          this.editForm
        );
        if (response.data.success) {
          await this.fetchJobDescription();
          this.closeEditModal();
        }
      } catch (error) {
        console.error('Error updating job description:', error);
        alert('Failed to update job description. Please try again.');
      } finally {
        this.saving = false;
      }
    },
    async deleteJob() {
      if (!confirm('Are you sure you want to delete this job description? This will also delete all associated candidate evaluations.')) {
        return;
      }

      try {
        await axios.delete(`${API_BASE_URL}/job-descriptions/${this.$route.params.id}`);
        this.$router.push('/job-descriptions');
      } catch (error) {
        console.error('Error deleting job description:', error);
        alert('Failed to delete job description. Please try again.');
      }
    },
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        title: '',
        description: '',
        requirements: ''
      };
    },
    getStatusClass(status) {
      return {
        'status-accepted': status === 'accepted',
        'status-pending': status === 'pending',
        'status-rejected': status === 'rejected'
      };
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.job-detail-page {
  padding: 2rem 0;
  transition: opacity 0.3s ease;
}

.job-detail-page.processing {
  opacity: 0.5;
  pointer-events: none;
}

.full-screen-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.loader-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #e0e0e0;
  border-top: 5px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loader-subtext {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.btn-back {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color 0.3s;
}

.btn-back:hover {
  color: #1565c0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.job-info-card,
.upload-section-card,
.candidates-section-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.card-header h2 {
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section h3 {
  color: #1976d2;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.description-text {
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
}

.meta-info {
  color: #999;
  font-size: 0.9rem;
}

.upload-section-card h3,
.candidates-section-card h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
  margin-bottom: 1.5rem;
}

.upload-area:hover {
  border-color: #1976d2;
  background: #f0f0ff;
}

.upload-area.drag-over {
  border-color: #1976d2;
  background: #e8e8ff;
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
  margin-bottom: 1.5rem;
}

.selected-files h4 {
  margin-bottom: 1rem;
  color: #333;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
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
}

.upload-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.upload-results {
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.upload-results h4 {
  margin-bottom: 1rem;
  color: #333;
}

.results-summary {
  display: flex;
  gap: 2rem;
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

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.candidate-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border-top: 4px solid #ddd;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.candidate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.candidate-card.status-accepted {
  border-top-color: #4caf50;
}

.candidate-card.status-pending {
  border-top-color: #ff9800;
}

.candidate-card.status-rejected {
  border-top-color: #f44336;
}

.card-header-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.candidate-info {
  flex: 1;
}

.candidate-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.candidate-email {
  color: #666;
  font-size: 0.85rem;
  display: block;
}

.match-score-circle {
  text-align: center;
  padding: 0.75rem;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 12px;
  color: white;
  min-width: 70px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.score-value-large {
  font-size: 2rem;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 0.5rem;
}

.score-label-small {
  font-size: 0.7rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge-top {
  display: flex;
  justify-content: flex-end;
}

.card-body-section {
  flex: 1;
  margin-bottom: 1rem;
}

.match-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.match-percentage {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.match-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.match-fill {
  height: 100%;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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
}

.duplicate-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #fff3e0;
  color: #e65100;
  margin-right: 0.5rem;
}

.card-footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: auto;
}

.date {
  color: #999;
  font-size: 0.8rem;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-primary-small {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary-small:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}

.btn-secondary {
  background: #1976d2;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-icon {
  background: #e0e0e0;
  color: #333;
}

.btn-icon:hover:not(:disabled) {
  background: #d0d0d0;
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #f44336;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

/* Resume Detail Modal Styles */
.resume-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  overflow-y: auto;
}

.resume-modal-content {
  background: white;
  border-radius: 12px;
  max-width: 1200px;
  width: 100%;
  max-height: calc(100vh - 2rem);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  margin: auto;
  overflow: hidden;
  position: relative;
}

.resume-modal-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.resume-modal-header .close-btn {
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
}

.resume-modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  background: transparent;
}

.resume-detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.resume-header-card {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  width: 100%;
  box-sizing: border-box;
}

.resume-header-content {
  flex: 1;
  min-width: 250px;
}

.resume-header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  word-wrap: break-word;
  font-weight: 600;
}

.candidate-contact {
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.resume-header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.resume-header-actions .btn {
  white-space: nowrap;
}

.resume-header-actions .btn-primary {
  background: white;
  color: #1976d2;
  border: none;
}

.resume-header-actions .btn-primary:hover {
  background: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.match-score-large {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  min-width: 150px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.score-value-large {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.score-label-large {
  font-size: 1.1rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.resume-scores-card,
.resume-analysis-card,
.resume-info-card,
.job-description-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.resume-scores-card h2,
.resume-analysis-card h2,
.resume-info-card h2,
.job-description-card h2 {
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.score-card {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 8px;
  color: white;
  min-width: 0;
  box-sizing: border-box;
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.score-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.analysis-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.analysis-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.analysis-section.rejection {
  background: #ffebee;
  padding: 1.5rem;
  border-radius: 8px;
  border: none;
}

.analysis-section h3 {
  color: #1976d2;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.analysis-content {
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.info-value {
  color: #333;
}

.info-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.info-section h3 {
  color: #1976d2;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.summary-text {
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.experience-list,
.education-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.experience-item,
.education-item {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.experience-item h4,
.education-item h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.company {
  color: #666;
  margin: 0.25rem 0;
  font-weight: 500;
}

.duration,
.dates {
  color: #999;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.description {
  color: #555;
  margin-top: 0.75rem;
  line-height: 1.6;
}

.certifications-list {
  list-style: none;
  padding: 0;
}

.certifications-list li {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  color: #555;
}

.certifications-list li:last-child {
  border-bottom: none;
}

.raw-text-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
}

.raw-text {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.job-description-content {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
}

.job-description-text {
  margin: 0;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: inherit;
}

.status-select {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 500;
  transition: all 0.3s;
}

.status-select:hover {
  background: rgba(255, 255, 255, 0.3);
}

.status-select option {
  background: white;
  color: #333;
}

.status-display {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-transform: capitalize;
  font-weight: 500;
}

.error-notice {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  color: #e65100;
}

.error-notice p {
  margin: 0;
  font-weight: 500;
}

/* Responsive Styles for Resume Modal */
@media (max-width: 768px) {
  .resume-modal-overlay {
    padding: 0.5rem;
  }

  .resume-modal-content {
    max-height: calc(100vh - 1rem);
    border-radius: 8px;
  }

  .resume-modal-body {
    padding: 1rem;
  }

  .resume-header-card {
    flex-direction: column;
    align-items: stretch;
    padding: 1.5rem;
  }

  .resume-header-content h1 {
    font-size: 1.5rem;
  }

  .match-score-large {
    width: 100%;
    min-width: auto;
  }

  .score-value-large {
    font-size: 2.5rem;
  }

  .scores-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .score-card {
    padding: 1.25rem;
  }

  .score-value {
    font-size: 2.25rem;
  }

  .resume-header-actions {
    flex-direction: column;
    width: 100%;
  }

  .resume-header-actions button,
  .resume-header-actions select,
  .resume-header-actions span {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .resume-scores-card,
  .resume-analysis-card,
  .resume-info-card,
  .job-description-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .resume-modal-overlay {
    padding: 0;
    align-items: flex-start;
  }

  .resume-modal-content {
    max-height: 100vh;
    border-radius: 0;
    max-width: 100%;
  }

  .resume-header-content h1 {
    font-size: 1.25rem;
  }

  .score-value-large {
    font-size: 2rem;
  }

  .score-value {
    font-size: 1.75rem;
  }

  .resume-scores-card h2,
  .resume-analysis-card h2,
  .resume-info-card h2,
  .job-description-card h2 {
    font-size: 1.25rem;
  }

  .resume-header-card {
    padding: 1.25rem;
  }

  .match-score-large {
    padding: 1.25rem;
  }
}
</style>

