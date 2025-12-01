<template>
  <div class="resumes-page">
    <div class="page-header">
      <h2>Resume Database</h2>
      <div class="header-actions">
        <input 
          v-model="searchQuery" 
          @input="searchResumes"
          type="text" 
          placeholder="Search resumes..." 
          class="search-input"
        />
        <button @click="fetchResumes" class="btn btn-primary">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading resumes...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="resumes.length === 0" class="empty-state">
      <p>No resumes found. Upload some resumes to get started!</p>
    </div>
    <div v-else class="resumes-grid">
      <div v-for="resume in resumes" :key="resume.id" class="resume-card" :class="{ 'duplicate-card': resume.parent_id }">
        <div class="card-header">
          <div class="header-left">
            <h3>{{ resume.name || 'Unknown' }}</h3>
            <span v-if="resume.parent_id" class="duplicate-badge">Duplicate</span>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">{{ resume.email || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Phone:</span>
            <span class="value">{{ resume.phone || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Location:</span>
            <span class="value">{{ resume.location || 'N/A' }}</span>
          </div>
          <div v-if="resume.total_experience !== null && resume.total_experience !== undefined" class="info-row">
            <span class="label">Total Experience:</span>
            <span class="value experience-badge">{{ formatExperience(resume.total_experience) }}</span>
          </div>
          <div v-if="resume.skills && resume.skills.length > 0" class="info-section">
            <span class="label">Skills:</span>
            <div class="tags">
              <span v-for="(skill, index) in resume.skills.slice(0, 5)" :key="index" class="tag">
                {{ skill }}
              </span>
              <span v-if="resume.skills.length > 5" class="tag">+{{ resume.skills.length - 5 }} more</span>
            </div>
          </div>
          <div v-if="resume.experience && resume.experience.length > 0" class="info-section">
            <span class="label">Experience:</span>
            <div class="experience-list">
              <div v-for="(exp, index) in resume.experience.slice(0, 2)" :key="index" class="exp-item">
                <strong>{{ exp.position }}</strong> at {{ exp.company }}
                <span v-if="exp.duration" class="duration">({{ exp.duration }})</span>
              </div>
            </div>
          </div>
          <div v-if="resume.education && resume.education.length > 0" class="info-section">
            <span class="label">Education:</span>
            <div class="education-list">
              <div v-for="(edu, index) in resume.education.slice(0, 2)" :key="index" class="edu-item">
                {{ edu.degree }} in {{ edu.field }}
                <span v-if="edu.institution"> - {{ edu.institution }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="footer-left">
            <button
              @click="downloadResume(resume.id, resume)"
              class="btn btn-icon"
              title="Download Resume"
            >
              ⬇️
            </button>
            <span v-if="resume.parent_id" class="parent-link">Original ID: {{ resume.parent_id }}</span>
          </div>
          <span class="date">{{ formatDate(resume.created_at) }}</span>
        </div>
        <button @click="viewDetails(resume)" class="view-details-btn">View Details</button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedResume" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Resume Details</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedResume.parent_id" class="duplicate-notice">
            <strong>⚠️ Duplicate Resume:</strong> This resume is linked to parent resume ID {{ selectedResume.parent_id }}
          </div>
          <div class="detail-section">
            <h3>Personal Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedResume.name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedResume.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedResume.phone || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Location:</span>
                <span class="detail-value">{{ selectedResume.location || 'N/A' }}</span>
              </div>
              <div v-if="selectedResume.total_experience !== null && selectedResume.total_experience !== undefined" class="detail-item">
                <span class="detail-label">Total Experience:</span>
                <span class="detail-value experience-badge">{{ formatExperience(selectedResume.total_experience) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.summary" class="detail-section">
            <h3>Summary</h3>
            <p>{{ selectedResume.summary }}</p>
          </div>

          <div v-if="selectedResume.skills && selectedResume.skills.length > 0" class="detail-section">
            <h3>Skills</h3>
            <div class="tags">
              <span v-for="(skill, index) in selectedResume.skills" :key="index" class="tag">
                {{ skill }}
              </span>
            </div>
          </div>

          <div v-if="selectedResume.experience && selectedResume.experience.length > 0" class="detail-section">
            <h3>Experience</h3>
            <div class="experience-details">
              <div v-for="(exp, index) in selectedResume.experience" :key="index" class="exp-detail">
                <h4>{{ exp.position }}</h4>
                <p class="company">{{ exp.company }}</p>
                <p v-if="exp.duration" class="duration">{{ exp.duration }}</p>
                <p v-if="exp.description" class="description">{{ exp.description }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.education && selectedResume.education.length > 0" class="detail-section">
            <h3>Education</h3>
            <div class="education-details">
              <div v-for="(edu, index) in selectedResume.education" :key="index" class="edu-detail">
                <h4>{{ edu.degree }}</h4>
                <p v-if="edu.field">Field: {{ edu.field }}</p>
                <p v-if="edu.institution">Institution: {{ edu.institution }}</p>
                <p v-if="edu.year">Year: {{ edu.year }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedResume.certifications && selectedResume.certifications.length > 0" class="detail-section">
            <h3>Certifications</h3>
            <ul>
              <li v-for="(cert, index) in selectedResume.certifications" :key="index">{{ cert }}</li>
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

export default {
  name: 'ResumesPage',
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
      }
    },
    async searchResumes() {
      if (!this.searchQuery.trim()) {
        this.fetchResumes();
        return;
      }

      this.loading = true;
      this.error = null;
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
        // Fallback: try to infer resumeId from resume object if not provided
        if (!resumeId && resume) {
          resumeId = resume.id;
        }

        if (!resumeId) {
          alert('Resume ID is missing. Cannot download resume.');
          return;
        }

        const BEARER_TOKEN = localStorage.getItem('auth_token');

        // Step 1: Get the external file path from the API
        const apiResponse = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'json',
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        const externalFileUrl = apiResponse.data.file_path;
        const fileName = apiResponse.data.file_name || resume?.file_name || 'download.pdf';

        // Extract the path after the Talygen domain
        const urlParts = externalFileUrl.split('https://stagefilemedia.talygen.com');
        if (urlParts.length !== 2) {
          console.error('Invalid external file path format:', externalFileUrl);
          alert('Unable to download resume file.');
          return;
        }

        const proxyPath = `/talygen${urlParts[1]}`;

        // Step 2: Use proxy to download the file as BLOB
        const fileResponse = await axios.get(proxyPath, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        // Step 3: Trigger browser download
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
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
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
    }
  }
};
</script>

<style scoped>
.resumes-page {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  min-width: 250px;
}

.search-input:focus {
  outline: none;
  border-color: #1976d2;
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #f44336;
}

.resumes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.resume-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.resume-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0;
}

.duplicate-badge {
  background: #ff9800;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}


.card-body {
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.value {
  color: #333;
  flex: 1;
}

.experience-badge {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-block;
}

.info-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.experience-list, .education-list {
  margin-top: 0.5rem;
}

.exp-item, .edu-item {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.duration {
  color: #999;
  font-size: 0.85rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  font-size: 0.85rem;
  color: #999;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.parent-link {
  font-size: 0.75rem;
  color: #ff9800;
  font-weight: 500;
}

.duplicate-card {
  border-left: 4px solid #ff9800;
}

.duplicate-notice {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  color: #e65100;
}

.view-details-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.view-details-btn:hover {
  background: #1565c0;
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
  max-width: 800px;
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

.detail-section {
  margin-bottom: 2rem;
}

.detail-section h3 {
  color: #1976d2;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.detail-value {
  color: #333;
}

.experience-details, .education-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exp-detail, .edu-detail {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.exp-detail h4, .edu-detail h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.company {
  color: #666;
  margin: 0.25rem 0;
}

.description {
  color: #555;
  margin-top: 0.5rem;
  line-height: 1.6;
}

ul {
  list-style: none;
  padding: 0;
}

ul li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

ul li:last-child {
  border-bottom: none;
}
</style>

