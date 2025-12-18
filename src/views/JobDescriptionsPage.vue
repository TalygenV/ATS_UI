<template>
  <div class="job-descriptions-page jdp_base">
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
              <span data-v-368fdc2f="" class="status-badge pending">Decision Pending {{job.totalDecisionPending || 0}}</span>
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


@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
</style>

