<template>
  <div class="candidates-page cpage_base">
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
          <div v-if="hasWriteAccess && candidate.totalVersions > 1" class="info-row version-info">
            <span class="label">Versions:</span>
            <span class="value">
              <span class="version-badge">v{{ candidate.versionNumber }} of {{ candidate.totalVersions }}</span>
            </span>
          </div>
          <div v-if="hasWriteAccess && candidate.totalVersions === 1 && candidate.versionNumber" class="info-row version-info">
            <span class="label">Version:</span>
            <span class="value">
              <span class="version-badge">v{{ candidate.versionNumber }}</span>
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
            <button v-if="hasWriteAccess && candidate.totalVersions > 1" @click="viewVersions(candidate)" class="btn btn-versions">
              View Versions
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

    <!-- Versions Modal -->
    <div v-if="showVersionsModal && selectedCandidateForVersions" class="modal-overlay" @click="showVersionsModal = false">
      <div class="modal-content versions-modal" @click.stop>
        <div class="modal-header">
          <h2>Resume Versions - {{ selectedCandidateForVersions.candidate_name || selectedCandidateForVersions.resume?.name || 'Unknown' }}</h2>
          <button @click="showVersionsModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingVersions" class="loading">Loading versions...</div>
          <div v-else-if="versionsError" class="error-message">{{ versionsError }}</div>
          <div v-else-if="versions.length === 0" class="empty-state">
            <p>No versions found.</p>
          </div>
          <div v-else class="versions-list">
            <div v-for="version in versions" :key="version.resume_id" class="version-item" :class="{ 'version-current': version.version === (selectedCandidateForVersions.versionNumber || 1) }">
              <div class="version-header">
                <div class="version-title">
                  <span class="version-number">Version {{ version.version }}</span>
                  <span v-if="version.version === (selectedCandidateForVersions.versionNumber || 1)" class="current-badge">Current</span>
                </div>
                <div class="version-date">{{ formatDateTime(version.uploaded_on) }}</div>
              </div>
              <div class="version-details">
                <div class="version-info-row">
                  <span class="version-label">File Name:</span>
                  <span class="version-value">{{ version.file_name || 'N/A' }}</span>
                </div>
                <div v-if="version.results" class="version-results">
                  <div class="version-info-row">
                    <span class="version-label">Name:</span>
                    <span class="version-value">{{ version.results.name || 'N/A' }}</span>
                  </div>
                  <div class="version-info-row">
                    <span class="version-label">Email:</span>
                    <span class="version-value">{{ version.results.email || 'N/A' }}</span>
                  </div>
                  <div v-if="version.results.phone" class="version-info-row">
                    <span class="version-label">Phone:</span>
                    <span class="version-value">{{ version.results.phone }}</span>
                  </div>
                  <div v-if="version.results.location" class="version-info-row">
                    <span class="version-label">Location:</span>
                    <span class="version-value">{{ version.results.location }}</span>
                  </div>
                  <div v-if="version.results.total_experience" class="version-info-row">
                    <span class="version-label">Total Experience:</span>
                    <span class="version-value">{{ version.results.total_experience }}</span>
                  </div>
                </div>
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
import { useLoader } from '../composables/useLoader';
import { API_BASE_URL } from '../config/api';
import { formatDate, formatDateTime, formatTime } from '../utils/datetimeUtils';

export default {
  name: 'CandidatesPage',
  setup() {
    const { hasWriteAccess, user } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, user, showLoader, hideLoader };
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
      showVersionsModal: false,
      selectedCandidateForVersions: null,
      versions: [],
      loadingVersions: false,
      versionsError: null,
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
      this.showLoader('Loading Candidates', 'Fetching candidate evaluations...');
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
        this.hideLoader();
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
    formatDate,
    formatDateTime,
    formatTime,
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

      this.showLoader('Assigning Interviewer', 'Setting up interview assignment...');
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
      } finally {
        this.hideLoader();
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

      this.showLoader('Submitting Decision', 'Updating candidate status...');
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
      } finally {
        this.hideLoader();
      }
    },
    viewHoldDetails(candidate) {
      this.holdCandidate = candidate;
      this.showHoldModal = true;
    },
    async viewVersions(candidate) {
      this.selectedCandidateForVersions = candidate;
      this.showVersionsModal = true;
      this.loadingVersions = true;
      this.versionsError = null;
      this.versions = [];

      try {
        // Get the resume ID from the candidate
        // The resume_id is directly on the candidate object from evaluations
        const resumeId = candidate.resume_id || candidate.resume?.id;
        if (!resumeId) {
          this.versionsError = 'Resume ID not found';
          this.loadingVersions = false;
          return;
        }

        // Fetch versions from the API
        // Use the resume ID to get all versions
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/versions`);
        if (response.data.success) {
          this.versions = response.data.data || [];
        } else {
          this.versionsError = 'Failed to fetch versions';
        }
      } catch (error) {
        console.error('Error fetching versions:', error);
        this.versionsError = 'Failed to load versions. Please try again.';
      } finally {
        this.loadingVersions = false;
      }
    }
  }
};
</script>

<style scoped>
.cpage_base .candidates-page {padding: 2rem 0;}
.cpage_base .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;  flex-wrap: wrap;  gap: 1rem;}
.cpage_base .btn-back {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  transition: color 0.3s;
}

.cpage_base .btn-back:hover {
  color: #1565c0;
}

.cpage_base h2 {
  color: #333;
  margin: 0;
}

.cpage_base .header-actions {
  display: flex;
  gap: 1rem;
}

.cpage_base .filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.cpage_base .loading, .cpage_base .error-message, .cpage_base .empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.cpage_base .error-message {
  color: #f44336;
}

.cpage_base .candidates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.cpage_base .candidate-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid #e2e8f0;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.cpage_base .candidate-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.cpage_base .candidate-card.status-accepted {
  border-left-color: #4caf50;
}

.cpage_base .candidate-card.status-pending {
  border-left-color: #ff9800;
}

.cpage_base .candidate-card.status-rejected {
  border-left-color: #f44336;
}

.cpage_base .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.cpage_base .header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.cpage_base .card-header h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0;
}

/* .status-badge {
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
} */

.cpage_base .candidate-card.status-on-hold { border-left-color: #ff9800;}
.cpage_base .candidate-card.status-selected { border-left-color: #4caf50;}
.cpage_base .btn-assign { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);}
.cpage_base .btn-assign:hover:not(:disabled) {  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);  transform: translateY(-2px);  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);}
.cpage_base .btn-assign:disabled { opacity: 0.6; cursor: not-allowed; transform: none;}
.cpage_base .btn-hr-decision { background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); color: white; box-shadow: 0 4px 15px rgba(246, 173, 85, 0.4);}
.cpage_base .btn-hr-decision:hover:not(:disabled) { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); transform: translateY(-2px);  box-shadow: 0 8px 25px rgba(246, 173, 85, 0.5);}
.cpage_base .btn-hr-decision:disabled { opacity: 0.6; cursor: not-allowed;  transform: none;}
.cpage_base .btn-hold { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);}
.cpage_base .btn-hold:hover:not(:disabled) {  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);  transform: translateY(-2px);  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.5);}

.cpage_base .btn-hold:disabled { opacity: 0.6; cursor: not-allowed; transform: none;}
.cpage_base .form-group {  margin-bottom: 1.5rem;}
.cpage_base .form-group label {  display: block;  margin-bottom: 0.5rem;  font-weight: 500;  color: #333;}
.cpage_base .form-input, .cpage_base .form-textarea {
  width: 100%;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.cpage_base .form-input:focus,
.cpage_base .form-textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
}

.cpage_base .form-textarea {  resize: vertical;  min-height: 100px;}
.cpage_base .form-actions {  display: flex;  gap: 1rem;  justify-content: flex-end;  margin-top: 2rem;}
.cpage_base .btn-primary {  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);  color: white;  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);}
.cpage_base .btn-primary:hover:not(:disabled) {  transform: translateY(-2px);  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);}
.cpage_base .detail-text.hold {  background: #fff3e0;  color: #e65100;}
.cpage_base .match-score {  text-align: center;  padding: 0.75rem 1.25rem;  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);  border-radius: 16px;  color: white;  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);}
.cpage_base .score-value {  font-size: 1.5rem;  font-weight: 700;}
.cpage_base .score-label {  font-size: 0.75rem;  opacity: 0.9;}
.cpage_base .card-body {  margin-bottom: 1rem;}
.cpage_base .info-row {  display: flex;  margin-bottom: 0.75rem;  font-size: 0.9rem;}
.cpage_base .label {  font-weight: 500;  color: #666;  min-width: 80px;}
.cpage_base .value {  color: #333;  flex: 1;}

.cpage_base .match-breakdown {  margin-top: 1rem;  padding-top: 1rem;  border-top: 1px solid #f0f0f0;}
.cpage_base .match-item {  margin-bottom: 0.75rem;}
.cpage_base .match-label {  display: block;  font-size: 0.85rem;  color: #666;  margin-bottom: 0.25rem;}
.cpage_base .match-bar {  display: flex;  align-items: center;  gap: 0.5rem;}
.cpage_base .match-fill {  flex: 1;  height: 10px;  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);  border-radius: 8px;  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.cpage_base .match-percentage {  font-size: 0.85rem;  font-weight: 600;  color: #333;  min-width: 45px;}
.cpage_base .card-footer {  display: flex;  justify-content: space-between;  align-items: center;  padding-top: 1rem;  border-top: 1px solid #eee;  flex-wrap: wrap;  gap: 1rem;}
.cpage_base .date {  color: #999;  font-size: 0.85rem;}
.cpage_base .footer-actions {  display: flex;  gap: 0.5rem;  align-items: center;}
.cpage_base .status-select {  padding: 0.5rem;  border: 1px solid #ddd;  border-radius: 6px;  font-size: 0.9rem;  cursor: pointer;}
.cpage_base .btn {  padding: 0.75rem 1.25rem;  border: none;  border-radius: 12px;  font-size: 0.9rem;  font-weight: 600;  cursor: pointer;  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);  letter-spacing: 0.3px;}
.cpage_base .btn:active:not(:disabled) {  transform: translateY(0);}
.cpage_base .btn-secondary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);
}

.cpage_base .btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);
}

.cpage_base .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cpage_base .modal-overlay {
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



.cpage_base .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.cpage_base .modal-header h2 {
  margin: 0;
  color: #333;
}

.cpage_base .close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  transition: color 0.3s;
}

.cpage_base .close-btn:hover {
  color: #333;
}

.cpage_base .modal-body {
  padding: 1.5rem;
}

.cpage_base .detail-section {
  margin-bottom: 2rem;
}

.cpage_base .detail-section h3 {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.25rem;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.cpage_base .detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.cpage_base .detail-item {
  display: flex;
  flex-direction: column;
}

.cpage_base .detail-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.cpage_base .detail-value {
  color: #333;
}

.cpage_base .scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.cpage_base .score-card {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cpage_base .score-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.cpage_base .score-value-large {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.cpage_base .score-label-large {
  font-size: 0.9rem;
  opacity: 0.9;
}

.cpage_base .detail-text {
  color: #555;
  line-height: 1.6;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.cpage_base .detail-text.rejection {
  background: #ffebee;
  color: #c62828;
}

.cpage_base .version-info {
  margin-top: 0.5rem;
}

.cpage_base .version-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.cpage_base .btn-versions {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.cpage_base .btn-versions:hover:not(:disabled) {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.cpage_base .versions-modal {
  max-width: 800px;
}

.cpage_base .versions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cpage_base .version-item {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cpage_base .version-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.cpage_base .version-item.version-current {
  background: linear-gradient(135deg, #e8f0fe 0%, #f3e8ff 100%);
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.cpage_base .version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.cpage_base .version-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cpage_base .version-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.cpage_base .current-badge {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.cpage_base .version-date {
  color: #666;
  font-size: 0.9rem;
}

.cpage_base .version-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cpage_base .version-info-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.cpage_base .version-label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.cpage_base .version-value {
  color: #333;
  flex: 1;
}

.cpage_base .version-results {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cpage_base .modal-content {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  max-width: 950px;
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
</style>

