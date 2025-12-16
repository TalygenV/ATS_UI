<template>
  <div class="job-descriptions-page">
    <div class="page-header">
      <h2>Job Descriptions</h2>
      <button v-if="hasWriteAccess" @click="showCreateModal = true" class="btn btn-primary">+ Add Job Description</button>
    </div>

    <div class="search-section">
      <input 
        v-model="searchQuery" 
        @input="filterJobs"
        type="text" 
        placeholder="Search by job title..." 
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">Loading job descriptions...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="filteredJobs.length === 0" class="empty-state">
      <p>{{ searchQuery ? 'No job descriptions found matching your search.' : 'No job descriptions found. Create one to get started!' }}</p>
    </div>
    <div v-else class="job-descriptions-grid">
      <div v-for="job in filteredJobs" :key="job.id" class="job-card">
        <div class="card-header">
          <h3>{{ job.title }}</h3>
          <div v-if="hasWriteAccess" class="card-actions">
            <button @click="editJob(job)" class="btn-icon" title="Edit">✏️</button>
            <button @click="deleteJob(job.id)" class="btn-icon" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="card-body">
          <div class="description-preview">
            <p>{{ truncateText(job.description, 200) }}</p>
          </div>
          <div v-if="job.requirements" class="requirements-preview">
            <strong>Requirements:</strong>
            <p>{{ truncateText(job.requirements, 150) }}</p>
          </div>
          <div v-if="job.interviewers && job.interviewers.length > 0" class="interviewers-preview">
            <strong>Assigned Interviewers:</strong>
            <span class="interviewer-count">{{ job.interviewers.length }} interviewer(s)</span>
          </div>
          <div class="resume-count-preview">
            <strong>Parsed Resumes:</strong>
            <span class="resume-count">{{ job.resume_count || 0 }} resume(s)</span>
               <span style="font-weight:bold">Parse Status :</span>
              <span data-v-368fdc2f="" class="status-badge accepted">accepted {{job.accepted || 0}}</span>
            <span data-v-368fdc2f="" class="status-badge pending">pending {{job.pending || 0}}</span>
            <span data-v-368fdc2f="" class="status-badge rejected">rejected {{job.rejected || 0}}</span>
          </div >
          
          <div v-if="hasWriteAccess" class="resume-count-preview"> 
                <strong style="font-weight:bold"> Application Status :</strong>
                <div class="application-count-wrapper">
                  <span data-v-368fdc2f="" class="status-badge accepted"> Scheduled Interview {{job.scheduledInterview || 0}}</span>
                 <span data-v-368fdc2f="" class="status-badge pending"> Total Pending {{job.totalPending || 0}}</span>
            <span data-v-368fdc2f="" class="status-badge on_hold">On Hold {{job.onhold || 0}}</span>
              <span data-v-368fdc2f="" class="status-badge pending">Dession Pending {{job.totalDecisionPending || 0}}</span>
            <span data-v-368fdc2f="" class="status-badge rejected">Rejected {{job.finalRejected || 0}}</span>
            <span data-v-368fdc2f="" class="status-badge accepted">Final Accepted {{job.finalSelected || 0}}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="date">{{ formatDate(job.created_at) }}</span>
          <button @click="viewJobDetail(job.id)" class="btn btn-secondary">View Details</button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Job Description' : 'Create Job Description' }}</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveJob">
            <div class="form-group">
              <label for="title">Job Title *</label>
              <input
                id="title"
                v-model="currentJob.title"
                type="text"
                required
                placeholder="e.g., Senior Software Engineer"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="description">Job Description *</label>
              <textarea
                id="description"
                v-model="currentJob.description"
                required
                rows="8"
                placeholder="Enter the full job description..."
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="requirements">Requirements (Optional)</label>
              <textarea
                id="requirements"
                v-model="currentJob.requirements"
                rows="6"
                placeholder="Enter specific requirements, qualifications, etc..."
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="interviewers">Assign Interviewers (Optional)</label>
              <select
                id="interviewers"
                v-model="currentJob.interviewers"
                multiple
                class="form-select"
                style="min-height: 120px;"
              >
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
              <small class="form-hint">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn btn-primary">
                <span v-if="saving">Saving...</span>
                <span v-else>{{ showEditModal ? 'Update' : 'Create' }}</span>
              </button>
            </div>
          </form>
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
import { formatDate } from '../utils/datetimeUtils';

export default {
  name: 'JobDescriptionsPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, showLoader, hideLoader };
  },
  data() {
    return {
      jobDescriptions: [],
      filteredJobs: [],
      searchQuery: '',
      loading: false,
      error: null,
      showCreateModal: false,
      showEditModal: false,
      saving: false,
      currentJob: {
        id: null,
        title: '',
        description: '',
        requirements: '',
        interviewers: []
      },
      interviewers: [],
      loadingInterviewers: false
    };
  },
  mounted() {
    this.fetchJobDescriptions();
    if (this.hasWriteAccess) {
      this.fetchInterviewers();
    }
  },
  methods: {
    async fetchJobDescriptions() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Job Descriptions', 'Fetching available positions...');
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions`);
        if (response.data.success) {
          this.jobDescriptions = response.data.data;
          this.filteredJobs = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching job descriptions:', error);
        this.error = 'Failed to fetch job descriptions. Please try again.';
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    async saveJob() {
      this.saving = true;
      const action = this.showEditModal ? 'Updating' : 'Creating';
      this.showLoader(`${action} Job Description`, 'Saving job details...');
      try {
        if (this.showEditModal) {
          // Update existing job
          const response = await axios.put(
            `${API_BASE_URL}/job-descriptions/${this.currentJob.id}`,
            this.currentJob
          );
          if (response.data.success) {
            await this.fetchJobDescriptions();
            this.closeModal();
          }
        } else {
          // Create new job
          const response = await axios.post(
            `${API_BASE_URL}/job-descriptions`,
            this.currentJob
          );
          if (response.data.success) {
            await this.fetchJobDescriptions();
            this.closeModal();
          }
        }
      } catch (error) {
        console.error('Error saving job description:', error);
        alert('Failed to save job description. Please try again.');
      } finally {
        this.saving = false;
        this.hideLoader();
      }
    },
    async fetchInterviewers() {
      this.loadingInterviewers = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users?role=Interviewer`);
        if (response.data.success) {
          this.interviewers = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      } finally {
        this.loadingInterviewers = false;
      }
    },
    editJob(job) {
      this.currentJob = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        interviewers: job.interviewers || []
      };
      this.showEditModal = true;
    },
    async deleteJob(id) {
      if (!confirm('Are you sure you want to delete this job description? This will also delete all associated candidate evaluations.')) {
        return;
      }

      try {
        await axios.delete(`${API_BASE_URL}/job-descriptions/${id}`);
        await this.fetchJobDescriptions();
      } catch (error) {
        console.error('Error deleting job description:', error);
        alert('Failed to delete job description. Please try again.');
      }
    },
    viewJobDetail(jobId) {
      this.$router.push({ name: 'JobDetail', params: { id: jobId } });
    },
    filterJobs() {
      if (!this.searchQuery.trim()) {
        this.filteredJobs = this.jobDescriptions;
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredJobs = this.jobDescriptions.filter(job => 
        job.title.toLowerCase().includes(query)
      );
    },
    closeModal() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.currentJob = {
        id: null,
        title: '',
        description: '',
        requirements: '',
        interviewers: []
      };
    },
    truncateText(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    },
    formatDate
  }
};
</script>

<style scoped>
.job-descriptions-page {
  padding: 2rem 0;
}

.application-count-wrapper {
     display: flex;
    flex-wrap: wrap;
    gap: 0.5rem
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.page-header h2 {
  color: #1a202c;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin: 0;
}

.search-section {
  margin-bottom: 2.5rem;
}

.search-input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.on_hold {
  background: #fff3e0;
  color: #e65100;
}

.search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
  font-size: 1.1rem;
}

.error-message {
  color: #e53e3e;
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border-radius: 12px;
  border-left: 4px solid #e53e3e;
  font-weight: 500;
}

.job-descriptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 2rem;
}

@media (max-width: 768px) {
  .job-descriptions-grid {
    grid-template-columns: 1fr;
  }
}

.job-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.job-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0;
  flex: 1;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.1);
}

.card-body {
  margin-bottom: 1rem;
}

.description-preview {
  color: #555;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.requirements-preview {
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  color: #555;
  font-size: 0.9rem;
}

.requirements-preview strong {
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
}

.interviewers-preview {
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  color: #555;
  font-size: 0.9rem;
}

.interviewers-preview strong {
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
}

.interviewer-count {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.resume-count-preview {
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
  color: #555;
  font-size: 0.9rem;
}

.resume-count-preview strong {
  color: #333;
  display: block;
  margin-bottom: 0.5rem;
}

.resume-count {
  display: inline-block;
  background: #f0fdf4;
  color: #16a34a;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.date {
  color: #999;
  font-size: 0.85rem;
}

.btn {
  padding: 0.75rem 1.5rem;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  max-width: 750px;
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  background: white;
}

.form-select:focus {
  outline: none;
  border-color: #1976d2;
}

.form-hint {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
</style>

