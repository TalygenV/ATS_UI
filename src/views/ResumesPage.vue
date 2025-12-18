<template>
  <div class="py-4">
    <div class="page-header-ats">
      <h2 class="page-title-ats">Resume Database</h2>
      <div class="d-flex gap-3 align-items-center">
        <input 
          v-model="searchQuery" 
          @input="searchResumes"
          type="text" 
          placeholder="Search resumes..." 
          class="search-input-ats"
          style="min-width: 280px;"
        />
        <button @click="fetchResumes" class="btn-ats-primary" style="width: 45px; padding: 0.75rem;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 20px; height: 20px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992V4.356M19.016 14.657a7.5 7.5 0 11-1.43-7.585" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state-ats">Loading resumes...</div>
    <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="resumes.length === 0" class="empty-state-ats">
      <p>No resumes found. Upload some resumes to get started!</p>
    </div>
    <div v-else class="row g-4">
      <div v-for="resume in resumes" :key="resume.id" class="col-12 col-md-6 col-xl-4">
        <div class="ats-card h-100" :class="{ 'ats-card-border-warning': resume.parent_id }">
          <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <div class="d-flex align-items-center gap-2">
              <h3 class="fs-5 fw-bold text-dark mb-0">{{ resume.name || 'Unknown' }}</h3>
              <span v-if="resume.parent_id" class="duplicate-badge-ats">Duplicate</span>
            </div>
          </div>
          <div class="mb-3">
            <div class="info-row-ats">
              <span class="info-label-ats">Email:</span>
              <span class="info-value-ats">{{ resume.email || 'N/A' }}</span>
            </div>
            <div class="info-row-ats">
              <span class="info-label-ats">Phone:</span>
              <span class="info-value-ats">{{ resume.phone || 'N/A' }}</span>
            </div>
            <div class="info-row-ats">
              <span class="info-label-ats">Location:</span>
              <span class="info-value-ats">{{ resume.location || 'N/A' }}</span>
            </div>
            <div v-if="resume.total_experience !== null && resume.total_experience !== undefined" class="info-row-ats">
              <span class="info-label-ats">Experience:</span>
              <span class="experience-badge-ats">{{ formatExperience(resume.total_experience) }}</span>
            </div>
            <div v-if="resume.skills && resume.skills.length > 0" class="mt-3 pt-3 border-top">
              <span class="info-label-ats d-block mb-2">Skills:</span>
              <div class="d-flex flex-wrap gap-2">
                <span v-for="(skill, index) in resume.skills.slice(0, 5)" :key="index" class="tag-ats">{{ skill }}</span>
                <span v-if="resume.skills.length > 5" class="tag-ats">+{{ resume.skills.length - 5 }} more</span>
              </div>
            </div>
            <div v-if="resume.experience && resume.experience.length > 0" class="mt-3 pt-3 border-top">
              <span class="info-label-ats d-block mb-2">Experience:</span>
              <div v-for="(exp, index) in resume.experience.slice(0, 2)" :key="index" class="small text-secondary mb-1">
                <strong>{{ exp.position }}</strong> at {{ exp.company }}
                <span v-if="exp.duration" class="text-muted">({{ exp.duration }})</span>
              </div>
            </div>
            <div v-if="resume.education && resume.education.length > 0" class="mt-3 pt-3 border-top">
              <span class="info-label-ats d-block mb-2">Education:</span>
              <div v-for="(edu, index) in resume.education.slice(0, 2)" :key="index" class="small text-secondary mb-1">
                {{ edu.degree }} in {{ edu.field }}
                <span v-if="edu.institution"> - {{ edu.institution }}</span>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center pt-3 border-top">
            <div class="d-flex flex-column gap-1">
              <button @click="downloadResume(resume.id, resume)" class="btn-icon" title="Download Resume">⬇️</button>
              <span v-if="resume.parent_id" class="small text-warning fw-medium">Original ID: {{ resume.parent_id }}</span>
            </div>
            <span class="text-muted small">{{ formatDate(resume.created_at) }}</span>
          </div>
          <button @click="viewDetails(resume)" class="btn-ats-primary w-100 mt-3">View Details</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedResume" class="modal-overlay-ats" @click="closeModal">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Resume Details</h2>
          <button @click="closeModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div v-if="selectedResume.parent_id" class="duplicate-notice-ats mb-4">
            <strong>⚠️ Duplicate Resume:</strong> This resume is linked to parent resume ID {{ selectedResume.parent_id }}
          </div>
          <div class="mb-4">
            <h3 class="section-title-gradient">Personal Information</h3>
            <div class="row">
              <div class="col-6 mb-3">
                <span class="info-label-ats d-block">Name:</span>
                <span class="text-dark">{{ selectedResume.name || 'N/A' }}</span>
              </div>
              <div class="col-6 mb-3">
                <span class="info-label-ats d-block">Email:</span>
                <span class="text-dark">{{ selectedResume.email || 'N/A' }}</span>
              </div>
              <div class="col-6 mb-3">
                <span class="info-label-ats d-block">Phone:</span>
                <span class="text-dark">{{ selectedResume.phone || 'N/A' }}</span>
              </div>
              <div class="col-6 mb-3">
                <span class="info-label-ats d-block">Location:</span>
                <span class="text-dark">{{ selectedResume.location || 'N/A' }}</span>
              </div>
              <div v-if="selectedResume.total_experience !== null && selectedResume.total_experience !== undefined" class="col-6 mb-3">
                <span class="info-label-ats d-block">Total Experience:</span>
                <span class="experience-badge-ats">{{ formatExperience(selectedResume.total_experience) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.summary" class="mb-4">
            <h3 class="section-title-gradient">Summary</h3>
            <p class="text-secondary">{{ selectedResume.summary }}</p>
          </div>

          <div v-if="selectedResume.skills && selectedResume.skills.length > 0" class="mb-4">
            <h3 class="section-title-gradient">Skills</h3>
            <div class="d-flex flex-wrap gap-2">
              <span v-for="(skill, index) in selectedResume.skills" :key="index" class="tag-ats">{{ skill }}</span>
            </div>
          </div>

          <div v-if="selectedResume.experience && selectedResume.experience.length > 0" class="mb-4">
            <h3 class="section-title-gradient">Experience</h3>
            <div class="d-flex flex-column gap-3">
              <div v-for="(exp, index) in selectedResume.experience" :key="index" class="p-3 bg-light rounded-3 border">
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ exp.position }}</h4>
                <p class="text-secondary mb-1">{{ exp.company }}</p>
                <p v-if="exp.duration" class="text-muted small mb-1">{{ exp.duration }}</p>
                <p v-if="exp.description" class="text-secondary small mb-0">{{ exp.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.education && selectedResume.education.length > 0" class="mb-4">
            <h3 class="section-title-gradient">Education</h3>
            <div class="d-flex flex-column gap-3">
              <div v-for="(edu, index) in selectedResume.education" :key="index" class="p-3 bg-light rounded-3 border">
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ edu.degree }}</h4>
                <p v-if="edu.field" class="text-secondary mb-1">Field: {{ edu.field }}</p>
                <p v-if="edu.institution" class="text-secondary mb-1">Institution: {{ edu.institution }}</p>
                <p v-if="edu.year" class="text-muted small mb-0">Year: {{ edu.year }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.certifications && selectedResume.certifications.length > 0">
            <h3 class="section-title-gradient">Certifications</h3>
            <ul class="list-unstyled">
              <li v-for="(cert, index) in selectedResume.certifications" :key="index" class="py-2 border-bottom text-secondary">{{ cert }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';
import { formatDate } from '../utils/datetimeUtils';

export default {
  name: 'ResumesPage',
  setup() {
    const { showLoader, hideLoader } = useLoader();
    return { showLoader, hideLoader };
  },
  data() {
    return {
      resumes: [],
      loading: false,
      error: null,
      searchQuery: '',
      selectedResume: null
    };
  },
  mounted() {
    this.fetchResumes();
  },
  methods: {
    async fetchResumes() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Resumes', 'Fetching resume database...');
      try {
        const response = await axios.get(`${API_BASE_URL}/resumes`);
        if (response.data.success) {
          this.resumes = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching resumes:', error);
        this.error = 'Failed to fetch resumes. Please try again.';
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    async searchResumes() {
      if (!this.searchQuery.trim()) {
        this.fetchResumes();
        return;
      }

      this.loading = true;
      this.error = null;
      this.showLoader('Searching Resumes', `Searching for "${this.searchQuery}"...`);
      try {
        const response = await axios.get(`${API_BASE_URL}/resumes/search/${encodeURIComponent(this.searchQuery)}`);
        if (response.data.success) {
          this.resumes = response.data.data;
        }
      } catch (error) {
        console.error('Error searching resumes:', error);
        this.error = 'Failed to search resumes. Please try again.';
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    viewDetails(resume) {
      this.selectedResume = resume;
    },
    closeModal() {
      this.selectedResume = null;
    },
    async downloadResume(resumeId, resume = null) {
      try {
        if (!resumeId && resume) {
          resumeId = resume.id;
        }

        if (!resumeId) {
          alert('Resume ID is missing. Cannot download resume.');
          return;
        }

        const BEARER_TOKEN = localStorage.getItem('auth_token');

        const apiResponse = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'json',
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        const externalFileUrl = apiResponse.data.file_path;
        const fileName = apiResponse.data.file_name || resume?.file_name || 'download.pdf';

        const urlParts = externalFileUrl.split('https://appfilemedia.talygen.com');
        if (urlParts.length !== 2) {
          console.error('Invalid external file path format:', externalFileUrl);
          alert('Unable to download resume file.');
          return;
        }

        const proxyPath = externalFileUrl;

        const fileResponse = await axios.get(proxyPath, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading resume from ResumesPage:', error);
        alert('Failed to download resume. Please try again.');
      }
    },
    formatDate,
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
    }
  }
};
</script>
