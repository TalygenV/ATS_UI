<template>
  <div class="py-4">
    <div class="page-header-ats">
      <div>
        <button @click="$router.push('/job-descriptions')" class="btn-back">← Back</button>
        <h2 class="page-title-ats">{{ jobTitle || 'Candidates' }}</h2>
      </div>
      <div class="d-flex gap-3">
        <select v-model="statusFilter" @change="fetchCandidates" class="form-select-ats">
          <option value="">All Status</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
          <option value="pending">Pending</option>
        </select>
        <select v-model="sortBy" @change="fetchCandidates" class="form-select-ats">
          <option value="match">Sort by Match Score</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state-ats">Loading candidates...</div>
    <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="candidates.length === 0" class="empty-state-ats">
      <p>No candidates found for this job description.</p>
    </div>
    <div v-else class="row g-4">
      <div v-for="candidate in candidates" :key="candidate.id" class="col-12 col-lg-6">
        <div class="ats-card" :class="getStatusClass(candidate.status)">
          <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <div class="d-flex align-items-center gap-3 flex-grow-1">
              <h3 class="fs-5 fw-semibold text-dark mb-0">{{ candidate.candidate_name || 'Unknown' }}</h3>
              <span class="badge-ats" :class="'badge-ats-' + candidate.status">{{ candidate.status }}</span>
            </div>
            <div class="match-score-badge">
              <div class="score-value">{{ formatScore(candidate.overall_match) }}%</div>
              <div class="score-label">Match</div>
            </div>
          </div>
          <div class="mb-3">
            <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ candidate.email || 'N/A' }}</span></div>
            <div class="info-row-ats"><span class="info-label-ats">Contact:</span><span class="info-value-ats">{{ candidate.contact_number || 'N/A' }}</span></div>
            <div v-if="candidate.interviewer" class="info-row-ats"><span class="info-label-ats">Interviewer:</span><span class="info-value-ats">{{ candidate.interviewer.full_name || candidate.interviewer.email || 'N/A' }}</span></div>
            <div v-if="candidate.interview_date" class="info-row-ats"><span class="info-label-ats">Interview:</span><span class="info-value-ats">{{ formatDateTime(candidate.interview_date) }}</span></div>
            <div v-if="candidate.interviewer_status" class="info-row-ats">
              <span class="info-label-ats">Status:</span>
              <span class="badge-ats" :class="'badge-ats-' + candidate.interviewer_status">{{ candidate.interviewer_status }}</span>
            </div>
            <div v-if="hasWriteAccess && candidate.totalVersions > 1" class="info-row-ats">
              <span class="info-label-ats">Versions:</span>
              <span class="version-badge-ats">v{{ candidate.versionNumber }} of {{ candidate.totalVersions }}</span>
            </div>
            <div class="mt-3 pt-3 border-top">
              <div class="mb-2">
                <span class="info-label-ats d-block small mb-1">Skills:</span>
                <div class="match-bar-container">
                  <div class="match-bar"><div class="match-bar-fill" :style="{ width: formatScore(candidate.skills_match) + '%' }"></div></div>
                  <span class="match-percentage">{{ formatScore(candidate.skills_match) }}%</span>
                </div>
              </div>
              <div class="mb-2">
                <span class="info-label-ats d-block small mb-1">Experience:</span>
                <div class="match-bar-container">
                  <div class="match-bar"><div class="match-bar-fill" :style="{ width: formatScore(candidate.experience_match) + '%' }"></div></div>
                  <span class="match-percentage">{{ formatScore(candidate.experience_match) }}%</span>
                </div>
              </div>
              <div>
                <span class="info-label-ats d-block small mb-1">Education:</span>
                <div class="match-bar-container">
                  <div class="match-bar"><div class="match-bar-fill" :style="{ width: formatScore(candidate.education_match) + '%' }"></div></div>
                  <span class="match-percentage">{{ formatScore(candidate.education_match) }}%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 border-top">
            <span class="text-muted small">{{ formatDate(candidate.created_at) }}</span>
            <div class="d-flex flex-wrap gap-2">
              <button v-if="hasWriteAccess && !candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn-ats-primary btn-ats-sm">Assign</button>
              <button v-if="hasWriteAccess && candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn-ats-primary btn-ats-sm">Reassign</button>
              <button v-if="hasWriteAccess && candidate.interviewer_status && candidate.interviewer_status !== 'pending'" @click="openHRDecisionModal(candidate)" class="btn-ats-warning btn-ats-sm">HR Decision</button>
              <button v-if="candidate.hr_final_status === 'on_hold' || candidate.interviewer_status === 'on_hold'" @click="viewHoldDetails(candidate)" class="btn-ats-secondary btn-ats-sm">Hold Details</button>
              <button v-if="hasWriteAccess && candidate.totalVersions > 1" @click="viewVersions(candidate)" class="btn-ats-purple btn-ats-sm">Versions</button>
              <button @click="viewDetails(candidate)" class="btn-ats-secondary btn-ats-sm">Details</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedCandidate" class="modal-overlay-ats" @click="closeModal">
      <div class="modal-content-ats modal-content-lg" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Candidate Evaluation Details</h2>
          <button @click="closeModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div class="mb-4">
            <h3 class="section-title-gradient">Candidate Information</h3>
            <div class="row">
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Name:</span><span class="text-dark">{{ selectedCandidate.candidate_name || 'N/A' }}</span></div>
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Email:</span><span class="text-dark">{{ selectedCandidate.email || 'N/A' }}</span></div>
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Contact:</span><span class="text-dark">{{ selectedCandidate.contact_number || 'N/A' }}</span></div>
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Status:</span><span class="badge-ats" :class="'badge-ats-' + selectedCandidate.status">{{ selectedCandidate.status }}</span></div>
            </div>
          </div>
          <div class="mb-4">
            <h3 class="section-title-gradient">Match Scores</h3>
            <div class="row g-3">
              <div class="col-6 col-md-3"><div class="score-card-ats"><div class="score-value-ats">{{ formatScore(selectedCandidate.overall_match) }}%</div><div class="score-label-ats">Overall</div></div></div>
              <div class="col-6 col-md-3"><div class="score-card-ats"><div class="score-value-ats">{{ formatScore(selectedCandidate.skills_match) }}%</div><div class="score-label-ats">Skills</div></div></div>
              <div class="col-6 col-md-3"><div class="score-card-ats"><div class="score-value-ats">{{ formatScore(selectedCandidate.experience_match) }}%</div><div class="score-label-ats">Experience</div></div></div>
              <div class="col-6 col-md-3"><div class="score-card-ats"><div class="score-value-ats">{{ formatScore(selectedCandidate.education_match) }}%</div><div class="score-label-ats">Education</div></div></div>
            </div>
          </div>
          <div v-if="selectedCandidate.skills_details" class="mb-4"><h3 class="section-title-gradient">Skills Analysis</h3><p class="p-3 bg-light rounded-3 text-secondary">{{ selectedCandidate.skills_details }}</p></div>
          <div v-if="selectedCandidate.experience_details" class="mb-4"><h3 class="section-title-gradient">Experience Analysis</h3><p class="p-3 bg-light rounded-3 text-secondary">{{ selectedCandidate.experience_details }}</p></div>
          <div v-if="selectedCandidate.education_details" class="mb-4"><h3 class="section-title-gradient">Education Analysis</h3><p class="p-3 bg-light rounded-3 text-secondary">{{ selectedCandidate.education_details }}</p></div>
          <div v-if="selectedCandidate.rejection_reason"><h3 class="section-title-gradient">Rejection Reason</h3><p class="p-3 rounded-3 bg-danger bg-opacity-10 text-danger">{{ selectedCandidate.rejection_reason }}</p></div>
        </div>
      </div>
    </div>

    <!-- Assign Interviewer Modal -->
    <div v-if="showAssignModal" class="modal-overlay-ats" @click="showAssignModal = false">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Assign Interviewer</h2>
          <button @click="showAssignModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="assignInterviewer">
            <div class="mb-4">
              <label class="form-label fw-medium text-dark">Interviewer *</label>
              <select v-model="assignmentData.interviewer_id" @change="fetchAvailableSlots" required class="form-select-ats w-100">
                <option value="">Select Interviewer</option>
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">{{ interviewer.full_name || interviewer.email }}</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="form-label fw-medium text-dark">Available Slots *</label>
              <select v-model="assignmentData.slot_id" required class="form-select-ats w-100">
                <option value="">Select Time Slot</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">{{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }} ({{ slot.interviewer?.full_name || slot.interviewer?.email || 'Interviewer' }})</option>
              </select>
              <p v-if="availableSlots.length === 0" class="text-muted small mt-2">No available slots found. Ask interviewer to add availability.</p>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="showAssignModal = false" class="btn-ats-secondary">Cancel</button>
              <button type="submit" class="btn-ats-primary">Assign</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- HR Decision Modal -->
    <div v-if="showHRDecisionModal" class="modal-overlay-ats" @click="showHRDecisionModal = false">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Final HR Decision</h2>
          <button @click="showHRDecisionModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="submitHRDecision">
            <div class="mb-4">
              <label class="form-label fw-medium text-dark">Final Status *</label>
              <select v-model="hrDecisionData.status" required class="form-select-ats w-100">
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div v-if="hrDecisionData.status === 'rejected' || hrDecisionData.status === 'on_hold'" class="mb-4">
              <label class="form-label fw-medium text-dark">Reason *</label>
              <textarea v-model="hrDecisionData.reason" required rows="4" class="form-control-ats form-textarea-ats" placeholder="Enter reason..."></textarea>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="showHRDecisionModal = false" class="btn-ats-secondary">Cancel</button>
              <button type="submit" class="btn-ats-primary">Submit Decision</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- On Hold Details Modal -->
    <div v-if="showHoldModal && holdCandidate" class="modal-overlay-ats" @click="showHoldModal = false">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">On Hold - Candidate Details</h2>
          <button @click="showHoldModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div class="mb-4">
            <h3 class="section-title-gradient">Candidate Information</h3>
            <div class="row">
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Name:</span><span class="text-dark">{{ holdCandidate.candidate_name || holdCandidate.resume?.name || 'N/A' }}</span></div>
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Email:</span><span class="text-dark">{{ holdCandidate.email || holdCandidate.resume?.email || 'N/A' }}</span></div>
              <div class="col-6 mb-3"><span class="info-label-ats d-block">Contact:</span><span class="text-dark">{{ holdCandidate.contact_number || holdCandidate.resume?.phone || 'N/A' }}</span></div>
            </div>
          </div>
          <div v-if="holdCandidate.interviewer_hold_reason" class="mb-4"><h3 class="section-title-gradient">Interviewer Hold Reason</h3><p class="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">{{ holdCandidate.interviewer_hold_reason }}</p></div>
          <div v-if="holdCandidate.hr_final_reason"><h3 class="section-title-gradient">HR Hold Reason</h3><p class="p-3 rounded-3 bg-warning bg-opacity-10 text-warning">{{ holdCandidate.hr_final_reason }}</p></div>
        </div>
      </div>
    </div>

    <!-- Versions Modal -->
    <div v-if="showVersionsModal && selectedCandidateForVersions" class="modal-overlay-ats" @click="showVersionsModal = false">
      <div class="modal-content-ats" style="max-width: 800px;" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Resume Versions - {{ selectedCandidateForVersions.candidate_name || selectedCandidateForVersions.resume?.name || 'Unknown' }}</h2>
          <button @click="showVersionsModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div v-if="loadingVersions" class="loading-state-ats">Loading versions...</div>
          <div v-else-if="versionsError" class="alert-ats-danger">{{ versionsError }}</div>
          <div v-else-if="versions.length === 0" class="empty-state-ats"><p>No versions found.</p></div>
          <div v-else class="d-flex flex-column gap-3">
            <div v-for="version in versions" :key="version.resume_id" class="p-4 rounded-3 border" :class="{ 'bg-primary bg-opacity-10 border-primary': version.version === (selectedCandidateForVersions.versionNumber || 1) }">
              <div class="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center gap-2">
                  <span class="fs-6 fw-bold text-dark">Version {{ version.version }}</span>
                  <span v-if="version.version === (selectedCandidateForVersions.versionNumber || 1)" class="version-badge-ats">Current</span>
                </div>
                <span class="text-muted small">{{ formatDateTime(version.uploaded_on) }}</span>
              </div>
              <div class="info-row-ats"><span class="info-label-ats">File Name:</span><span class="info-value-ats">{{ version.file_name || 'N/A' }}</span></div>
              <div v-if="version.results">
                <div class="info-row-ats"><span class="info-label-ats">Name:</span><span class="info-value-ats">{{ version.results.name || 'N/A' }}</span></div>
                <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ version.results.email || 'N/A' }}</span></div>
                <div v-if="version.results.phone" class="info-row-ats"><span class="info-label-ats">Phone:</span><span class="info-value-ats">{{ version.results.phone }}</span></div>
                <div v-if="version.results.location" class="info-row-ats"><span class="info-label-ats">Location:</span><span class="info-value-ats">{{ version.results.location }}</span></div>
                <div v-if="version.results.total_experience" class="info-row-ats"><span class="info-label-ats">Experience:</span><span class="info-value-ats">{{ version.results.total_experience }}</span></div>
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
      availableSlots: [],
      assignmentData: { evaluation_id: null, interviewer_id: null, slot_id: '' },
      hrDecisionData: { evaluation_id: null, status: '', reason: '' },
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
        if (this.statusFilter) params.append('status', this.statusFilter);
        params.append('sort_by', this.sortBy);
        
        const response = await axios.get(`${API_BASE_URL}/evaluations/job/${jobId}?${params.toString()}`);
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
    viewDetails(candidate) { this.selectedCandidate = candidate; },
    closeModal() { this.selectedCandidate = null; },
    getStatusClass(status) {
      return {
        'ats-card-border-success': status === 'selected' || status === 'accepted',
        'ats-card-border-warning': status === 'pending' || status === 'on_hold',
        'ats-card-border-danger': status === 'rejected'
      };
    },
    formatDate, formatDateTime, formatTime,
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    },
    async fetchInterviewers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users?role=Interviewer`);
        if (response.data.success) this.interviewers = response.data.data;
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      }
    },
    openAssignModal(candidate) {
      this.assignmentData = { evaluation_id: candidate.id, interviewer_id: candidate.interviewer_id || null, slot_id: '' };
      this.availableSlots = [];
      this.showAssignModal = true;
    },
    async fetchAvailableSlots() {
      if (!this.assignmentData.interviewer_id) { this.availableSlots = []; return; }
      try {
        const jobId = this.$route.params.jobId;
        const response = await axios.get(`${API_BASE_URL}/interviews/available-slots`, { params: { job_description_id: jobId, interviewer_id: this.assignmentData.interviewer_id } });
        if (response.data.success) this.availableSlots = response.data.data || [];
      } catch (error) {
        console.error('Error fetching available slots:', error);
        this.availableSlots = [];
      }
    },
    async assignInterviewer() {
      if (!this.assignmentData.interviewer_id || !this.assignmentData.slot_id) { alert('Please fill in all required fields'); return; }
      this.showLoader('Assigning Interviewer', 'Setting up interview assignment...');
      try {
        let response;
        if (this.assignmentData.evaluation_id && this.candidates.find(c => c.id === this.assignmentData.evaluation_id)?.interviewer_id) {
          response = await axios.put(`${API_BASE_URL}/interviews/assign/${this.assignmentData.evaluation_id}`, { interviewer_id: this.assignmentData.interviewer_id, interview_date: null, slot_id: this.assignmentData.slot_id });
        } else {
          response = await axios.post(`${API_BASE_URL}/interviews/assign`, { evaluation_id: this.assignmentData.evaluation_id, interviewer_id: this.assignmentData.interviewer_id, interview_date: null, slot_id: this.assignmentData.slot_id });
        }
        if (response.data.success) { await this.fetchCandidates(); this.showAssignModal = false; alert('Interview assigned successfully!'); }
      } catch (error) {
        console.error('Error assigning interviewer:', error);
        alert('Failed to assign interviewer. Please try again.');
      } finally { this.hideLoader(); }
    },
    openHRDecisionModal(candidate) {
      this.hrDecisionData = { evaluation_id: candidate.id, status: candidate.hr_final_status || 'pending', reason: candidate.hr_final_reason || '' };
      this.showHRDecisionModal = true;
    },
    async submitHRDecision() {
      if (!this.hrDecisionData.status || this.hrDecisionData.status === 'pending') { alert('Please select a status'); return; }
      if ((this.hrDecisionData.status === 'rejected' || this.hrDecisionData.status === 'on_hold') && !this.hrDecisionData.reason.trim()) { alert('Please provide a reason for ' + this.hrDecisionData.status); return; }
      this.showLoader('Submitting Decision', 'Updating candidate status...');
      try {
        const response = await axios.post(`${API_BASE_URL}/evaluations/${this.hrDecisionData.evaluation_id}/hr-decision`, { status: this.hrDecisionData.status, reason: this.hrDecisionData.reason });
        if (response.data.success) { await this.fetchCandidates(); this.showHRDecisionModal = false; alert('Final decision updated successfully!'); }
      } catch (error) {
        console.error('Error updating HR decision:', error);
        alert('Failed to update decision. Please try again.');
      } finally { this.hideLoader(); }
    },
    viewHoldDetails(candidate) { this.holdCandidate = candidate; this.showHoldModal = true; },
    async viewVersions(candidate) {
      this.selectedCandidateForVersions = candidate;
      this.showVersionsModal = true;
      this.loadingVersions = true;
      this.versionsError = null;
      this.versions = [];
      try {
        const resumeId = candidate.resume_id || candidate.resume?.id;
        if (!resumeId) { this.versionsError = 'Resume ID not found'; this.loadingVersions = false; return; }
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/versions`);
        if (response.data.success) this.versions = response.data.data || [];
        else this.versionsError = 'Failed to fetch versions';
      } catch (error) {
        console.error('Error fetching versions:', error);
        this.versionsError = 'Failed to load versions. Please try again.';
      } finally { this.loadingVersions = false; }
    }
  }
};
</script>
