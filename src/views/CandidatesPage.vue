<template>
  <div class="candidates-page">
    <div class="page-header">
      <div>
        <button @click="$router.push('/job-descriptions')" class="btn-back">← Back</button>
        <h2>{{ jobTitle || 'Candidates' }}</h2>
      </div>
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

    <div v-if="loading" class="loading">Loading candidates...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="candidates.length === 0" class="empty-state">
      <p>No candidates found for this job description.</p>
    </div>
    <div v-else class="candidates-grid">
      <div v-for="candidate in candidates" :key="candidate.id" class="candidate-card" :class="getStatusClass(candidate.status)">
        <div class="card-header">
          <div class="header-left">
            <h3>{{ candidate.candidate_name || 'Unknown' }}</h3>
            <span :class="['status-badge', candidate.status]">{{ candidate.status }}</span>
          </div>
          <div class="match-score">
            <div class="score-value">{{ formatScore(candidate.overall_match) }}%</div>
            <div class="score-label">Match</div>
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Email:</span>
            <span class="value">{{ candidate.email || 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Contact:</span>
            <span class="value">{{ candidate.contact_number || 'N/A' }}</span>
          </div>
          <div class="match-breakdown">
            <div class="match-item">
              <span class="match-label">Skills:</span>
              <div class="match-bar">
                <div class="match-fill" :style="{ width: formatScore(candidate.skills_match) + '%' }"></div>
                <span class="match-percentage">{{ formatScore(candidate.skills_match) }}%</span>
              </div>
            </div>
            <div class="match-item">
              <span class="match-label">Experience:</span>
              <div class="match-bar">
                <div class="match-fill" :style="{ width: formatScore(candidate.experience_match) + '%' }"></div>
                <span class="match-percentage">{{ formatScore(candidate.experience_match) }}%</span>
              </div>
            </div>
            <div class="match-item">
              <span class="match-label">Education:</span>
              <div class="match-bar">
                <div class="match-fill" :style="{ width: formatScore(candidate.education_match) + '%' }"></div>
                <span class="match-percentage">{{ formatScore(candidate.education_match) }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <span class="date">{{ formatDate(candidate.created_at) }}</span>
          <div class="footer-actions">
            <select v-model="candidate.status" @change="updateStatus(candidate.id, candidate.status)" class="status-select">
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <button @click="viewDetails(candidate)" class="btn btn-secondary">View Details</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedCandidate" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Candidate Evaluation Details</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Candidate Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedCandidate.candidate_name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedCandidate.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ selectedCandidate.contact_number || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span :class="['status-badge', selectedCandidate.status]">{{ selectedCandidate.status }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Match Scores</h3>
            <div class="scores-grid">
              <div class="score-card">
                <div class="score-value-large">{{ formatScore(selectedCandidate.overall_match) }}%</div>
                <div class="score-label-large">Overall Match</div>
              </div>
              <div class="score-card">
                <div class="score-value-large">{{ formatScore(selectedCandidate.skills_match) }}%</div>
                <div class="score-label-large">Skills Match</div>
              </div>
              <div class="score-card">
                <div class="score-value-large">{{ formatScore(selectedCandidate.experience_match) }}%</div>
                <div class="score-label-large">Experience Match</div>
              </div>
              <div class="score-card">
                <div class="score-value-large">{{ formatScore(selectedCandidate.education_match) }}%</div>
                <div class="score-label-large">Education Match</div>
              </div>
            </div>
          </div>

          <div v-if="selectedCandidate.skills_details" class="detail-section">
            <h3>Skills Analysis</h3>
            <p class="detail-text">{{ selectedCandidate.skills_details }}</p>
          </div>

          <div v-if="selectedCandidate.experience_details" class="detail-section">
            <h3>Experience Analysis</h3>
            <p class="detail-text">{{ selectedCandidate.experience_details }}</p>
          </div>

          <div v-if="selectedCandidate.education_details" class="detail-section">
            <h3>Education Analysis</h3>
            <p class="detail-text">{{ selectedCandidate.education_details }}</p>
          </div>

          <div v-if="selectedCandidate.rejection_reason" class="detail-section">
            <h3>Rejection Reason</h3>
            <p class="detail-text rejection">{{ selectedCandidate.rejection_reason }}</p>
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
  name: 'CandidatesPage',
  data() {
    return {
      candidates: [],
      loading: false,
      error: null,
      jobTitle: '',
      statusFilter: '',
      sortBy: 'match',
      selectedCandidate: null
    };
  },
  mounted() {
    const jobId = this.$route.params.jobId;
    if (jobId) {
      this.fetchJobDescription(jobId);
      this.fetchCandidates();
    }
  },
  methods: {
    async fetchJobDescription(jobId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions/${jobId}`);
        if (response.data.success) {
          this.jobTitle = response.data.data.title;
        }
      } catch (error) {
        console.error('Error fetching job description:', error);
      }
    },
    async fetchCandidates() {
      this.loading = true;
      this.error = null;
      try {
        const jobId = this.$route.params.jobId;
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
        this.error = 'Failed to fetch candidates. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    async updateStatus(id, status) {
      try {
        const response = await axios.patch(
          `${API_BASE_URL}/evaluations/${id}/status`,
          { status }
        );
        if (response.data.success) {
          await this.fetchCandidates();
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      }
    },
    viewDetails(candidate) {
      this.selectedCandidate = candidate;
    },
    closeModal() {
      this.selectedCandidate = null;
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
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    }
  }
};
</script>

<style scoped>
.candidates-page {
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

.btn-back {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  transition: color 0.3s;
}

.btn-back:hover {
  color: #1565c0;
}

h2 {
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #f44336;
}

.candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.candidate-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 4px solid #ddd;
}

.candidate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.candidate-card.status-accepted {
  border-left-color: #4caf50;
}

.candidate-card.status-pending {
  border-left-color: #ff9800;
}

.candidate-card.status-rejected {
  border-left-color: #f44336;
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
  flex: 1;
}

.card-header h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0;
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

.match-score {
  text-align: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 8px;
  color: white;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.score-label {
  font-size: 0.75rem;
  opacity: 0.9;
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

.match-breakdown {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.match-item {
  margin-bottom: 0.75rem;
}

.match-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.match-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.match-fill {
  flex: 1;
  height: 8px;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.match-percentage {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  min-width: 45px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 1rem;
}

.date {
  color: #999;
  font-size: 0.85rem;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
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

.btn-secondary {
  background: #1976d2;
  color: white;
}

.btn-secondary:hover {
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
  max-width: 900px;
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

.scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.score-card {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  border-radius: 8px;
  color: white;
}

.score-value-large {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.score-label-large {
  font-size: 0.9rem;
  opacity: 0.9;
}

.detail-text {
  color: #555;
  line-height: 1.6;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.detail-text.rejection {
  background: #ffebee;
  color: #c62828;
}
</style>

