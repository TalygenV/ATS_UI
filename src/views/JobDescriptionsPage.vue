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

const API_BASE_URL = '/api';

export default {
  name: 'JobDescriptionsPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    return { hasWriteAccess };
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
        requirements: ''
      }
    };
  },
  mounted() {
    this.fetchJobDescriptions();
  },
  methods: {
    async fetchJobDescriptions() {
      this.loading = true;
      this.error = null;
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
      }
    },
    async saveJob() {
      this.saving = true;
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
      }
    },
    editJob(job) {
      this.currentJob = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements || ''
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
        requirements: ''
      };
    },
    truncateText(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
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
.job-descriptions-page {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #1976d2;
}

h2 {
  color: #333;
  margin: 0;
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #f44336;
}

.job-descriptions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.job-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.job-card:hover {
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
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
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
</style>

