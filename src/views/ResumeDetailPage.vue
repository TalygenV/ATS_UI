<template>
  <div class="py-4">
    <div class="mb-4">
      <button @click="goBack" class="btn-back">← Back</button>
    </div>

    <div v-if="loading" class="loading-state-ats">Loading resume details...</div>
    <div v-else-if="error && !evaluation" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="evaluation" class="d-flex flex-column gap-4">
      <!-- Header Section -->
      <div class="header-card-gradient d-flex justify-content-between align-items-center flex-wrap gap-4">
        <div class="flex-grow-1">
          <h1 class="fs-3 fw-bold text-white mb-2">{{ evaluation.candidate_name || 'Unknown Candidate' }}</h1>
          <p class="text-white-50 mb-3">
            <span v-if="evaluation.email">📧 {{ evaluation.email }}</span>
            <span v-if="evaluation.contact_number"> | 📞 {{ evaluation.contact_number }}</span>
          </p>
          <div class="d-flex gap-3 align-items-center flex-wrap">
            <button @click="downloadResume" class="btn btn-light text-primary fw-medium">⬇️ Download Resume</button>
            <select v-if="hasWriteAccess" v-model="evaluation.status" @change="updateStatus" 
              class="form-select bg-white bg-opacity-25 text-white border-0" style="width: auto; min-width: 150px;">
              <option value="pending" class="text-dark">Pending</option>
              <option value="accepted" class="text-dark">Accepted</option>
              <option value="rejected" class="text-dark">Rejected</option>
            </select>
            <span v-else class="badge bg-white bg-opacity-25 text-white px-3 py-2 text-capitalize">{{ evaluation.status }}</span>
          </div>
        </div>
        <div class="header-score-box">
          <div class="fs-1 fw-bold text-white mb-1">{{ formatScore(evaluation.overall_match) }}%</div>
          <div class="text-white-50">Overall Match</div>
        </div>
      </div>

      <!-- Match Scores Section -->
      <div class="ats-card ats-card-xl">
        <h2 class="fs-4 fw-semibold text-dark mb-4">Match Scores</h2>
        <div class="row g-3">
          <div class="col-md-4">
            <div class="score-card-ats">
              <div class="score-value-ats">{{ formatScore(evaluation.skills_match) }}%</div>
              <div class="score-label-ats">Skills Match</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="score-card-ats">
              <div class="score-value-ats">{{ formatScore(evaluation.experience_match) }}%</div>
              <div class="score-label-ats">Experience Match</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="score-card-ats">
              <div class="score-value-ats">{{ formatScore(evaluation.education_match) }}%</div>
              <div class="score-label-ats">Education Match</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis Section -->
      <div class="ats-card ats-card-xl">
        <h2 class="fs-4 fw-semibold text-dark mb-4">Detailed Analysis</h2>
        
        <div class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Skills Analysis</h3>
          <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">{{ evaluation.skills_details || 'No analysis available' }}</p>
        </div>

        <div class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Experience Analysis</h3>
          <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">{{ evaluation.experience_details || 'No analysis available' }}</p>
        </div>

        <div class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Education Analysis</h3>
          <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">{{ evaluation.education_details || 'No analysis available' }}</p>
        </div>

        <div v-if="evaluation.rejection_reason" class="p-4 rounded-3 bg-danger bg-opacity-10">
          <h3 class="section-title-gradient text-danger">Rejection Reason</h3>
          <p class="text-danger mb-0">{{ evaluation.rejection_reason }}</p>
        </div>
      </div>

      <!-- Resume Information Section -->
      <div class="ats-card ats-card-xl">
        <h2 class="fs-4 fw-semibold text-dark mb-4">Resume Information</h2>
        
        <div v-if="error && evaluation" class="alert-ats-warning mb-4">
          <p class="mb-0">⚠️ {{ error }}</p>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6 mb-3">
            <span class="info-label-ats d-block">Name:</span>
            <span class="text-dark">{{ (resume && resume.name) || evaluation.candidate_name || 'N/A' }}</span>
          </div>
          <div class="col-md-6 mb-3">
            <span class="info-label-ats d-block">Email:</span>
            <span class="text-dark">{{ (resume && resume.email) || evaluation.email || 'N/A' }}</span>
          </div>
          <div class="col-md-6 mb-3">
            <span class="info-label-ats d-block">Phone:</span>
            <span class="text-dark">{{ (resume && resume.phone) || evaluation.contact_number || 'N/A' }}</span>
          </div>
          <div class="col-md-6 mb-3">
            <span class="info-label-ats d-block">Location:</span>
            <span class="text-dark">{{ (resume && resume.location) || 'N/A' }}</span>
          </div>
          <div v-if="resume && resume.total_experience !== null && resume.total_experience !== undefined" class="col-md-6 mb-3">
            <span class="info-label-ats d-block">Total Experience:</span>
            <span class="experience-badge-ats">{{ formatExperience(resume.total_experience) }}</span>
          </div>
        </div>

        <div v-if="resume && resume.summary" class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Summary</h3>
          <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.8;">{{ resume.summary }}</p>
        </div>

        <div v-if="resume && resume.skills && resume.skills.length > 0" class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Skills</h3>
          <div class="d-flex flex-wrap gap-2">
            <span v-for="(skill, index) in resume.skills" :key="index" class="tag-ats">{{ skill }}</span>
          </div>
        </div>

        <div v-if="resume && resume.experience && resume.experience.length > 0" class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Work Experience</h3>
          <div class="d-flex flex-column gap-3">
            <div v-for="(exp, index) in resume.experience" :key="index" class="p-4 bg-light rounded-3 border">
              <h4 class="fs-6 fw-semibold text-dark mb-2">{{ exp.position }}</h4>
              <p class="text-secondary fw-medium mb-1">{{ exp.company }}</p>
              <p v-if="exp.duration" class="text-muted small mb-1">{{ exp.duration }}</p>
              <p v-if="exp.startDate && exp.endDate" class="text-muted small mb-1">{{ formatDateRange(exp.startDate, exp.endDate) }}</p>
              <p v-if="exp.description" class="text-secondary small mb-0 mt-2">{{ exp.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="resume && resume.education && resume.education.length > 0" class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Education</h3>
          <div class="d-flex flex-column gap-3">
            <div v-for="(edu, index) in resume.education" :key="index" class="p-4 bg-light rounded-3 border">
              <h4 class="fs-6 fw-semibold text-dark mb-2">{{ edu.degree }}</h4>
              <p v-if="edu.field" class="text-secondary mb-1">Field: {{ edu.field }}</p>
              <p v-if="edu.institution" class="text-secondary mb-1">Institution: {{ edu.institution }}</p>
              <p v-if="edu.year" class="text-muted small mb-0">Year: {{ edu.year }}</p>
            </div>
          </div>
        </div>

        <div v-if="resume && resume.certifications && resume.certifications.length > 0" class="mb-4 pb-4 border-bottom">
          <h3 class="section-title-gradient">Certifications</h3>
          <ul class="list-unstyled">
            <li v-for="(cert, index) in resume.certifications" :key="index" class="py-2 border-bottom text-secondary">{{ cert }}</li>
          </ul>
        </div>

        <div>
          <h3 class="section-title-gradient">Raw Resume Text</h3>
          <div class="raw-text-container">
            <pre class="raw-text">{{ evaluation.resume_text || (resume && resume.raw_text) || 'No text available' }}</pre>
          </div>
        </div>
      </div>

      <!-- Job Description Section -->
      <div class="ats-card ats-card-xl">
        <h2 class="fs-4 fw-semibold text-dark mb-4">Job Description</h2>
        <div class="bg-light p-4 rounded-3">
          <pre class="mb-0 text-secondary" style="white-space: pre-wrap; font-family: inherit; line-height: 1.8;">{{ evaluation.job_description || 'No job description available' }}</pre>
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
import { formatDateRange } from '../utils/datetimeUtils';

export default {
  name: 'ResumeDetailPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, showLoader, hideLoader };
  },
  data() {
    return {
      evaluation: null,
      resume: null,
      loading: false,
      error: null
    };
  },
  mounted() {
    this.fetchResumeDetail();
  },
  methods: {
    async fetchResumeDetail() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Resume Details', 'Fetching candidate information...');
      try {
        const evaluationId = this.$route.params.evaluationId;
        
        if (!evaluationId) {
          this.error = 'Evaluation ID is missing from the URL.';
          this.loading = false;
          this.hideLoader();
          return;
        }
        
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          this.error = 'Not authenticated. Please login again.';
          this.$router.push('/login');
          this.loading = false;
          return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.status === 200) {
          if (!response.data || !response.data.success) {
            const freshResponse = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              params: { _t: Date.now() }
            });
            this.processEvaluationData(freshResponse.data);
            return;
          }
        }
        
        if (response.data && response.data.success) {
          this.processEvaluationData(response.data);
        } else if (response.data && response.data.error) {
          this.error = response.data.error || 'Failed to fetch resume details. Please try again.';
        } else {
          this.error = 'Invalid response from server. Please try again.';
        }
      } catch (error) {
        console.error('Error fetching resume detail:', error);
        
        if (error.response?.status === 401) {
          this.error = 'Session expired. Please login again.';
          this.$router.push('/login');
        } else if (error.response?.status === 404) {
          this.error = `Evaluation with ID ${this.$route.params.evaluationId} not found. Please check the URL and try again.`;
        } else {
          this.error = error.response?.data?.error || error.message || 'Failed to fetch resume details. Please try again.';
        }
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    processEvaluationData(responseData) {
      if (!responseData || !responseData.success) {
        this.error = responseData?.error || 'Failed to fetch resume details. Please try again.';
        return;
      }
      
      this.evaluation = responseData.data;
      this.resume = responseData.data?.resume;
      
      if (!this.resume) {
        this.error = 'Resume data not found for this evaluation.';
        this.resume = {
          id: null,
          name: this.evaluation?.candidate_name || 'N/A',
          email: this.evaluation?.email || 'N/A',
          phone: this.evaluation?.contact_number || 'N/A',
          location: null,
          skills: [],
          experience: [],
          education: [],
          certifications: []
        };
      }
    },
    async updateStatus() {
      this.showLoader('Updating Status', 'Saving candidate status...');
      try {
        const response = await axios.patch(
          `${API_BASE_URL}/evaluations/${this.$route.params.evaluationId}/status`,
          { status: this.evaluation.status }
        );
        if (response.data.success) {
          this.evaluation = response.data.data;
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      } finally {
        this.hideLoader();
      }
    },
    async downloadResume() {
      this.showLoader('Downloading Resume', 'Preparing file download...');
      try {
        if (!this.resume || !this.resume.id) {
          alert('Resume file not available for download.');
          this.hideLoader();
          return;
        }
        const resumeId = this.resume.id;
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'blob'
        });
        
        const contentDisposition = response.headers['content-disposition'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        let filename = this.resume.file_name || `resume-${resumeId}`;
        
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
      } finally {
        this.hideLoader();
      }
    },
    goBack() {
      const jobId = this.$route.params.jobId || this.$route.params.id;
      if (jobId) {
        this.$router.push({ name: 'JobDetail', params: { id: jobId } });
      } else {
        this.$router.push('/job-descriptions');
      }
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
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
    formatDateRange
  }
};
</script>
