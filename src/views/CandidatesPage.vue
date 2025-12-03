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
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
          <option value="pending">Pending</option>
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
          <div v-if="candidate.interviewer" class="info-row">
            <span class="label">Interviewer:</span>
            <span class="value">{{ candidate.interviewer.full_name || candidate.interviewer.email || 'N/A' }}</span>
          </div>
          <div v-if="candidate.interview_date" class="info-row">
            <span class="label">Interview Date:</span>
            <span class="value">{{ formatDateTime(candidate.interview_date) }}</span>
          </div>
          <div v-if="candidate.interviewer_status" class="info-row">
            <span class="label">Interview Status:</span>
            <span :class="['status-badge', 'interviewer-' + candidate.interviewer_status]">
              {{ candidate.interviewer_status }}
            </span>
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
            <button v-if="hasWriteAccess && !candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn btn-assign">
              Assign Interviewer
            </button>
            <button v-if="hasWriteAccess && candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn btn-assign">
              Reassign
            </button>
            <button v-if="hasWriteAccess && candidate.interviewer_status && candidate.interviewer_status !== 'pending'" @click="openHRDecisionModal(candidate)" class="btn btn-hr-decision">
              HR Decision
            </button>
            <button v-if="candidate.hr_final_status === 'on_hold' || candidate.interviewer_status === 'on_hold'" @click="viewHoldDetails(candidate)" class="btn btn-hold">
              View Hold Details
            </button>
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

    <!-- Assign Interviewer Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click="showAssignModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Assign Interviewer</h2>
          <button @click="showAssignModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="assignInterviewer">
            <div class="form-group">
              <label>Interviewer *</label>
              <select v-model="assignmentData.interviewer_id" @change="fetchAvailableSlots" required class="form-input">
                <option value="">Select Interviewer</option>
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Available Slots *</label>
              <select v-model="assignmentData.slot_id" required class="form-input">
                <option value="">Select Time Slot</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                  {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }} 
                  ({{ slot.interviewer?.full_name || slot.interviewer?.email || 'Interviewer' }})
                </option>
              </select>
              <p v-if="availableSlots.length === 0" class="hint-text">
                No available slots found for the selected interviewer. Ask interviewer to add availability.
              </p>
            </div>
            <div class="form-actions">
              <button type="button" @click="showAssignModal = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Assign</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- HR Decision Modal -->
    <div v-if="showHRDecisionModal" class="modal-overlay" @click="showHRDecisionModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Final HR Decision</h2>
          <button @click="showHRDecisionModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitHRDecision">
            <div class="form-group">
              <label>Final Status *</label>
              <select v-model="hrDecisionData.status" required class="form-input">
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div v-if="hrDecisionData.status === 'rejected' || hrDecisionData.status === 'on_hold'" class="form-group">
              <label>Reason *</label>
              <textarea v-model="hrDecisionData.reason" required rows="4" class="form-textarea" placeholder="Enter reason..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="showHRDecisionModal = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Decision</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- On Hold Details Modal -->
    <div v-if="showHoldModal && holdCandidate" class="modal-overlay" @click="showHoldModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>On Hold - Candidate Details</h2>
          <button @click="showHoldModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Candidate Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ holdCandidate.candidate_name || holdCandidate.resume?.name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ holdCandidate.email || holdCandidate.resume?.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ holdCandidate.contact_number || holdCandidate.resume?.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div v-if="holdCandidate.interviewer_hold_reason" class="detail-section">
            <h3>Interviewer Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.interviewer_hold_reason }}</p>
          </div>
          <div v-if="holdCandidate.hr_final_reason" class="detail-section">
            <h3>HR Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.hr_final_reason }}</p>
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
  name: 'CandidatesPage',
  setup() {
    const { hasWriteAccess, user } = useAuth();
    return { hasWriteAccess, user };
  },
  data() {
    return {
      candidates: [],
      loading: false,
      error: null,
      jobTitle: '',
      statusFilter: '',
      sortBy: 'match',
      selectedCandidate: null,
      showAssignModal: false,
      showHRDecisionModal: false,
      showHoldModal: false,
      interviewers: [],
      assignmentData: {
        evaluation_id: null,
        interviewer_id: null,
        slot_id: ''
      },
      hrDecisionData: {
        evaluation_id: null,
        status: '',
        reason: ''
      },
      holdCandidate: null
    };
  },
  mounted() {
    const jobId = this.$route.params.jobId;
    if (jobId) {
      this.fetchJobDescription(jobId);
      this.fetchCandidates();
    }
    if (this.hasWriteAccess) {
      this.fetchInterviewers();
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
        'status-selected': status === 'selected' || status === 'accepted',
        'status-pending': status === 'pending',
        'status-rejected': status === 'rejected',
        'status-on-hold': status === 'on_hold'
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
    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    },
    async fetchInterviewers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users?role=Interviewer`);
        if (response.data.success) {
          this.interviewers = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      }
    },
    openAssignModal(candidate) {
      this.assignmentData = {
        evaluation_id: candidate.id,
        interviewer_id: candidate.interviewer_id || null,
        slot_id: ''
      };
      this.availableSlots = [];
      this.showAssignModal = true;
    },
    async fetchAvailableSlots() {
      if (!this.assignmentData.interviewer_id) {
        this.availableSlots = [];
        return;
      }
      try {
        const jobId = this.$route.params.jobId;
        const response = await axios.get(
          `${API_BASE_URL}/interviews/available-slots`,
          {
            params: {
              job_description_id: jobId,
              interviewer_id: this.assignmentData.interviewer_id
            }
          }
        );
        if (response.data.success) {
          this.availableSlots = response.data.data || [];
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        this.availableSlots = [];
      }
    },
    async assignInterviewer() {
      if (!this.assignmentData.interviewer_id || !this.assignmentData.slot_id) {
        alert('Please fill in all required fields');
        return;
      }

      try {
        let response;
        if (this.assignmentData.evaluation_id && this.candidates.find(c => c.id === this.assignmentData.evaluation_id)?.interviewer_id) {
          // Reassign
          response = await axios.put(
            `${API_BASE_URL}/interviews/assign/${this.assignmentData.evaluation_id}`,
            {
              interviewer_id: this.assignmentData.interviewer_id,
              interview_date: null,
              slot_id: this.assignmentData.slot_id
            }
          );
        } else {
          // New assignment
          response = await axios.post(
            `${API_BASE_URL}/interviews/assign`,
            {
              evaluation_id: this.assignmentData.evaluation_id,
              interviewer_id: this.assignmentData.interviewer_id,
              interview_date: null,
              slot_id: this.assignmentData.slot_id
            }
          );
        }

        if (response.data.success) {
          await this.fetchCandidates();
          this.showAssignModal = false;
          alert('Interview assigned successfully!');
        }
      } catch (error) {
        console.error('Error assigning interviewer:', error);
        alert('Failed to assign interviewer. Please try again.');
      }
    },
    openHRDecisionModal(candidate) {
      this.hrDecisionData = {
        evaluation_id: candidate.id,
        status: candidate.hr_final_status || 'pending',
        reason: candidate.hr_final_reason || ''
      };
      this.showHRDecisionModal = true;
    },
    async submitHRDecision() {
      if (!this.hrDecisionData.status || this.hrDecisionData.status === 'pending') {
        alert('Please select a status');
        return;
      }

      if ((this.hrDecisionData.status === 'rejected' || this.hrDecisionData.status === 'on_hold') && !this.hrDecisionData.reason.trim()) {
        alert('Please provide a reason for ' + this.hrDecisionData.status);
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.hrDecisionData.evaluation_id}/hr-decision`,
          {
            status: this.hrDecisionData.status,
            reason: this.hrDecisionData.reason
          }
        );

        if (response.data.success) {
          await this.fetchCandidates();
          this.showHRDecisionModal = false;
          alert('Final decision updated successfully!');
        }
      } catch (error) {
        console.error('Error updating HR decision:', error);
        alert('Failed to update decision. Please try again.');
      }
    },
    viewHoldDetails(candidate) {
      this.holdCandidate = candidate;
      this.showHoldModal = true;
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

.status-badge.selected {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.on_hold {
  background: #fff3e0;
  color: #e65100;
}

.status-badge.interviewer-selected {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.interviewer-rejected {
  background: #ffebee;
  color: #c62828;
}

.status-badge.interviewer-on_hold {
  background: #fff3e0;
  color: #e65100;
}

.candidate-card.status-on-hold {
  border-left-color: #ff9800;
}

.candidate-card.status-selected {
  border-left-color: #4caf50;
}

.btn-assign {
  background: #2196f3;
  color: white;
}

.btn-assign:hover {
  background: #1976d2;
}

.btn-hr-decision {
  background: #ff9800;
  color: white;
}

.btn-hr-decision:hover {
  background: #f57c00;
}

.btn-hold {
  background: #ff9800;
  color: white;
}

.btn-hold:hover {
  background: #f57c00;
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
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}

.detail-text.hold {
  background: #fff3e0;
  color: #e65100;
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

