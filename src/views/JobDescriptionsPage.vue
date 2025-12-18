<template>
  <div class="py-4">
    <div class="page-header-ats">
      <h2 class="page-title-ats">Job Descriptions</h2>
      <button v-if="hasWriteAccess" @click="showCreateModal = true" class="btn-ats-primary">+ Add Job Description</button>
    </div>

    <div class="mb-4">
      <input 
        v-model="searchQuery" 
        @input="filterJobs"
        type="text" 
        placeholder="Search by job title..." 
        class="search-input-ats"
      />
    </div>

    <div v-if="loading" class="loading-state-ats">Loading job descriptions...</div>
    <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="filteredJobs.length === 0" class="empty-state-ats">
      <p>{{ searchQuery ? 'No job descriptions found matching your search.' : 'No job descriptions found. Create one to get started!' }}</p>
    </div>
    <div v-else class="row g-4">
      <div v-for="job in filteredJobs" :key="job.id" class="col-12 col-md-6 col-xl-4">
        <div class="ats-card h-100 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <h3 class="fs-5 fw-semibold text-dark mb-0 flex-grow-1">{{ job.title }}</h3>
            <div v-if="hasWriteAccess" class="d-flex gap-2">
              <button @click="editJob(job)" class="btn-icon" title="Edit">✏️</button>
              <button @click="deleteJob(job.id)" class="btn-icon" title="Delete">🗑️</button>
            </div>
          </div>
          <div class="flex-grow-1">
            <p class="text-secondary mb-3">{{ truncateText(job.description, 200) }}</p>
            <div v-if="job.requirements" class="pt-3 border-top mb-3">
              <strong class="text-dark d-block mb-2">Requirements:</strong>
              <p class="text-secondary small mb-0">{{ truncateText(job.requirements, 150) }}</p>
            </div>
            <div v-if="job.interviewers && job.interviewers.length > 0" class="pt-3 border-top mb-3">
              <strong class="text-dark d-block mb-2">Assigned Interviewers:</strong>
              <span class="badge-ats badge-ats-primary">{{ job.interviewers.length }} interviewer(s)</span>
            </div>
            <div class="pt-3 border-top mb-3">
              <strong class="text-dark d-block mb-2">Parsed Resumes:</strong>
              <span class="badge bg-success text-white me-1">{{ job.resume_count || 0 }} resume(s)</span>
              <div class="mt-2">
                <span class="fw-bold small">Parse Status:</span>
                <span class="badge-ats badge-ats-success ms-1">accepted {{job.accepted || 0}}</span>
                <span class="badge-ats badge-ats-pending ms-1">pending {{job.pending || 0}}</span>
                <span class="badge-ats badge-ats-danger ms-1">rejected {{job.rejected || 0}}</span>
              </div>
            </div>
            <div v-if="hasWriteAccess" class="pt-3 border-top">
              <strong class="text-dark d-block mb-2">Application Status:</strong>
              <div class="d-flex flex-wrap gap-1">
                <span class="badge-ats badge-ats-success">Scheduled {{job.scheduledInterview || 0}}</span>
                <span class="badge-ats badge-ats-pending">Pending {{job.totalPending || 0}}</span>
                <span class="badge-ats badge-ats-warning">On Hold {{job.onhold || 0}}</span>
                <span class="badge-ats badge-ats-pending">Decision Pending {{job.totalDecisionPending || 0}}</span>
                <span class="badge-ats badge-ats-danger">Rejected {{job.finalRejected || 0}}</span>
                <span class="badge-ats badge-ats-success">Accepted {{job.finalSelected || 0}}</span>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center pt-3 mt-3 border-top">
            <span class="text-muted small">{{ formatDate(job.created_at) }}</span>
            <button @click="viewJobDetail(job.id)" class="btn-ats-secondary btn-ats-sm">View Details</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay-ats" @click="closeModal">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">{{ showEditModal ? 'Edit Job Description' : 'Create Job Description' }}</h2>
          <button @click="closeModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="saveJob">
            <div class="mb-4">
              <label for="title" class="form-label fw-medium text-dark">Job Title *</label>
              <input
                id="title"
                v-model="currentJob.title"
                type="text"
                required
                placeholder="e.g., Senior Software Engineer"
                class="form-control-ats"
              />
            </div>
            <div class="mb-4">
              <label for="description" class="form-label fw-medium text-dark">Job Description *</label>
              <textarea
                id="description"
                v-model="currentJob.description"
                required
                rows="8"
                placeholder="Enter the full job description..."
                class="form-control-ats form-textarea-ats"
              ></textarea>
            </div>
            <div class="mb-4">
              <label for="requirements" class="form-label fw-medium text-dark">Requirements (Optional)</label>
              <textarea
                id="requirements"
                v-model="currentJob.requirements"
                rows="6"
                placeholder="Enter specific requirements, qualifications, etc..."
                class="form-control-ats form-textarea-ats"
              ></textarea>
            </div>
            <div class="mb-4">
              <label for="interviewers" class="form-label fw-medium text-dark">Assign Interviewers (Optional)</label>
              <select
                id="interviewers"
                v-model="currentJob.interviewers"
                multiple
                class="form-select-ats"
                style="min-height: 120px;"
              >
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
              <small class="text-muted">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="closeModal" class="btn-ats-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-ats-primary">
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
          const response = await axios.put(
            `${API_BASE_URL}/job-descriptions/${this.currentJob.id}`,
            this.currentJob
          );
          if (response.data.success) {
            await this.fetchJobDescriptions();
            this.closeModal();
          }
        } else {
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
