<template>
  <div class="py-4">
    <div class="page-header-ats mb-4">
      <h2 class="page-title-ats">Interviewer Dashboard</h2>
    </div>

    <!-- Availability Management -->
    <div class="availability-card row m-0 mb-4">
      <!-- My Availability -->
      <div class="my-availability col-md-12 col-lg-6 col-xxl-5">
        <h3 class="fs-5 fw-bold mb-3">My Availability</h3>
        <form @submit.prevent="generateSlots">
          <div class="form-group-inline row  mb-3 ">
            <div class="form-group col-12 col-md-6 col-xl-3 px-2">
              <label class="form-label fw-medium text-dark small">Date *</label>
              <input v-model="slotForm.date" type="date" :min="minDate" required class="form-control-ats" />
            </div>
            <div class="form-group col-12 col-md-6 col-xl-3 px-2">
              <label class="form-label fw-medium text-dark small">From</label>
              <input v-model="slotForm.start_time" type="time" class="form-control-ats" />
            </div>
            <div class="form-group col-12 col-md-6 col-xl-3 px-2">
              <label class="form-label fw-medium text-dark small">To</label>
              <input v-model="slotForm.end_time" type="time" class="form-control-ats" />
            </div>
            <div class="form-group col-12 col-md-6 col-xl-3 px-2">
              <label class="form-label fw-medium text-dark small">Max Slots</label>
              <input v-model.number="slotForm.max_slots" type="number" min="1" class="form-control-ats" placeholder="No limit"  />
            </div>
          </div>
          <div class="row">
            <div class="col-12 col-md-8 px-2">
              <p class="text-muted small mb-2">System will generate 30-minute slots between the selected times (default 9:00–18:00). You can select which slots to make available.</p>
            </div>
            <div class="col-12 col-md-4 px-2">
              <button type="submit" class="btn-ats-primary w-100" :disabled="generatingSlots">
                <span v-if="generatingSlots">Generating...</span>
                <span v-else>Generate Slots</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Upcoming Slots -->
      <div class="slots-section col-md-12 col-lg-6 col-xxl-7">
        <h4 class="fs-5 fw-bold mb-3">Upcoming Slots</h4>
        <div v-if="loadingSlots" class="loading-state-ats">Loading slots...</div>
        <div v-else-if="slots.length === 0" class="text-center py-4 text-muted">
          <p>No upcoming availability created.</p>
        </div>
        <div v-else class="slots-list" ref="slotsList">
          <div
            v-for="slot in slots"
            :key="slot.id"
            class="slot-row col-11 col-md-6 col-lg-9 col-xl-6"
            :class="{ 'booked': slot.is_booked }"
          >
            <div class="slot-info">
              <div class="slot-time">{{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }}</div>
              <div class="slot-status mt-2">
                <span v-if="slot.is_booked" class="status-badge-booked">Booked</span>
                <span v-else class="status-badge-available">Available</span>
              </div>
            </div>
            <button v-if="!slot.is_booked" class="btn-slot-remove" @click="deleteSlot(slot.id)">Remove</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignments Section -->
    <div class="ats-card mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h3 class="fs-5 fw-bold mb-0">My Interview Assignments</h3>
        <select v-model="statusFilter" @change="fetchAssignments" class="form-select-ats" style="width: auto;">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state-ats">Loading assignments...</div>
    <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="assignments.length === 0" class="ats-card text-center py-5">
      <p class="text-muted">No interview assignments found.</p>
    </div>
    <div v-else class="row g-4">
      <!-- Upcoming Interviews -->
      <div class="col-xl-4">
        <div class="ats-card mb-3">
          <h3 class="fs-5 fw-bold mb-3">Upcoming Interviews</h3>
        </div>
        <div class="d-flex flex-column gap-3">
          <div v-for="assignment in upcomingSlots" :key="assignment.id" class="ats-card ats-card-top-primary">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h4>
                <span class="badge-ats badge-ats-pending">{{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}</span>
              </div>
              <div v-if="assignment.job_description" class="text-muted small">{{ assignment.job_description.title }}</div>
            </div>
            <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ assignment.resume?.email || assignment.email || 'N/A' }}</span></div>
            <div class="info-row-ats"><span class="info-label-ats">Contact:</span><span class="info-value-ats">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span></div>
            <div v-if="assignment.interview_date" class="info-row-ats"><span class="info-label-ats">Interview:</span><span class="info-value-ats">{{ formatDateTime(assignment.interview_date) }}</span></div>
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              <button @click="viewCandidateDetails(assignment)" class="btn-ats-secondary btn-ats-sm">View Resume</button>
            </div>
          </div>
          <div v-if="upcomingSlots.length === 0" class="ats-card text-center py-4 text-muted">No upcoming interviews found.</div>
        </div>
      </div>

      <!-- Decision Pending -->
      <div class="col-xl-4">
        <div class="ats-card mb-3">
          <h3 class="fs-5 fw-bold mb-3">Decision Pending</h3>
        </div>
        <div class="d-flex flex-column gap-3">
          <div v-for="assignment in pastDecissionPendingSlots" :key="assignment.id" class="ats-card ats-card-top-warning">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h4>
                <span class="badge-ats badge-ats-pending">{{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}</span>
              </div>
              <div v-if="assignment.job_description" class="text-muted small">{{ assignment.job_description.title }}</div>
            </div>
            <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ assignment.resume?.email || assignment.email || 'N/A' }}</span></div>
            <div class="info-row-ats"><span class="info-label-ats">Contact:</span><span class="info-value-ats">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span></div>
            <div v-if="assignment.interview_date" class="info-row-ats"><span class="info-label-ats">Interview:</span><span class="info-value-ats">{{ formatDateTime(assignment.interview_date) }}</span></div>
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              <button v-if="assignment.interviewer_status === 'pending'" @click="openFeedbackModal(assignment)" class="btn-ats-primary btn-ats-sm">Submit Feedback</button>
              <button v-else @click="openFeedbackModal(assignment)" class="btn-ats-secondary btn-ats-sm">View/Edit Feedback</button>
              <button @click="viewCandidateDetails(assignment)" class="btn-ats-secondary btn-ats-sm">View Resume</button>
            </div>
          </div>
          <div v-if="pastDecissionPendingSlots.length === 0" class="ats-card text-center py-4 text-muted">No decision pending interviews found.</div>
        </div>
      </div>

      <!-- Decision Done -->
      <div class="col-xl-4">
        <div class="ats-card mb-3">
          <h3 class="fs-5 fw-bold mb-3">Decision Done</h3>
        </div>
        <div class="d-flex flex-column gap-3">
          <div v-for="assignment in pastDecissionDoneSlots" :key="assignment.id" class="ats-card ats-card-top-success">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h4>
                <span class="badge-ats" :class="'badge-ats-' + assignment.interviewer_status">{{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}</span>
              </div>
              <div v-if="assignment.job_description" class="text-muted small">{{ assignment.job_description.title }}</div>
            </div>
            <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ assignment.resume?.email || assignment.email || 'N/A' }}</span></div>
            <div class="info-row-ats"><span class="info-label-ats">Contact:</span><span class="info-value-ats">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span></div>
            <div v-if="assignment.interview_date" class="info-row-ats"><span class="info-label-ats">Interview:</span><span class="info-value-ats">{{ formatDateTime(assignment.interview_date) }}</span></div>
            <div v-if="assignment.interviewer_feedback" class="mt-3 pt-3 border-top">
              <strong class="small text-dark">Feedback Submitted</strong>
              <div class="row g-2 mt-2">
                <div v-for="(rating, key) in assignment.interviewer_feedback" :key="key" class="col-6">
                  <div class="d-flex justify-content-between small p-2 bg-light rounded-2">
                    <span class="text-muted">{{ key }}:</span>
                    <span class="text-primary fw-semibold">{{ rating }}/10</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              <button v-if="assignment.interviewer_status === 'pending'" @click="openFeedbackModal(assignment)" class="btn-ats-primary btn-ats-sm">Submit Feedback</button>
              <button v-else @click="openFeedbackModal(assignment)" class="btn-ats-secondary btn-ats-sm">View/Edit Feedback</button>
              <button @click="viewCandidateDetails(assignment)" class="btn-ats-secondary btn-ats-sm">View Resume</button>
            </div>
          </div>
          <div v-if="pastDecissionDoneSlots.length === 0" class="ats-card text-center py-4 text-muted">No decision done interviews found.</div>
        </div>
      </div>
    </div>

    <!-- Slot Selection Modal -->
    <div v-if="showSlotSelectionModal" class="modal-overlay-ats" @click="showSlotSelectionModal = false">
      <div class="modal-content-ats" style="max-width: 900px;" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Select Available Slots</h2>
          <button @click="showSlotSelectionModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div class="bg-light p-3 rounded-3 mb-4">
            <p class="mb-1"><strong>Date:</strong> {{ formatDate(slotForm.date) }}</p>
            <p class="mb-1"><strong>Time Range:</strong> {{ slotForm.start_time || '09:00' }} – {{ slotForm.end_time || '18:00' }}</p>
            <p v-if="slotForm.max_slots > 0" class="mb-0 fw-medium">
              <strong>Max Slots:</strong> {{ slotForm.max_slots }} 
              <span v-if="selectedSlotsCount > slotForm.max_slots" class="text-danger">({{ selectedSlotsCount }} selected - exceeds limit!)</span>
              <span v-else class="text-success">({{ selectedSlotsCount }} selected)</span>
            </p>
            <p v-else class="mb-0 fw-medium"><strong>Selected:</strong> {{ selectedSlotsCount }} slots</p>
          </div>
          <div class="row g-3 mb-4" style="max-height: 400px; overflow-y: auto;">
            <div v-for="(slot, index) in generatedSlots" :key="index" class="col-12 col-md-6 col-lg-4">
              <label class="slot-checkbox-ats w-100" :class="{ disabled: slotForm.max_slots > 0 && selectedSlotsCount >= slotForm.max_slots && !slot.selected }">
                <input type="checkbox" v-model="slot.selected" :disabled="slotForm.max_slots > 0 && selectedSlotsCount >= slotForm.max_slots && !slot.selected" @change="onSlotToggle" />
                <span>{{ formatSlotTime(slot.start_time) }} – {{ formatSlotTime(slot.end_time) }}</span>
              </label>
            </div>
          </div>
          <div class="d-flex gap-3 justify-content-end">
            <button type="button" @click="showSlotSelectionModal = false" class="btn-ats-secondary">Cancel</button>
            <button type="button" @click="confirmSlotSelection" :disabled="selectedSlotsCount === 0 || (slotForm.max_slots > 0 && selectedSlotsCount > slotForm.max_slots)" class="btn-ats-primary">
              Create Selected Slots ({{ selectedSlotsCount }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal && selectedAssignment" class="modal-overlay-ats" @click="showFeedbackModal = false">
      <div class="modal-content-ats" style="max-width: 900px;" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Interview Feedback</h2>
          <button @click="showFeedbackModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="submitFeedback">
            <div class="mb-4">
              <h3 class="section-title-gradient">Candidate Ratings (1-10 scale)</h3>
              <div class="row g-3">
                <div class="col-md-4"><label class="form-label fw-medium small">Technical Skills</label><input v-model.number="feedbackData.ratings.technical_skills" type="number" min="1" max="10" class="form-control-ats" required /></div>
                <div class="col-md-4"><label class="form-label fw-medium small">Communication</label><input v-model.number="feedbackData.ratings.communication" type="number" min="1" max="10" class="form-control-ats" required /></div>
                <div class="col-md-4"><label class="form-label fw-medium small">Problem Solving</label><input v-model.number="feedbackData.ratings.problem_solving" type="number" min="1" max="10" class="form-control-ats" required /></div>
                <div class="col-md-4"><label class="form-label fw-medium small">Cultural Fit</label><input v-model.number="feedbackData.ratings.cultural_fit" type="number" min="1" max="10" class="form-control-ats" required /></div>
                <div class="col-md-4"><label class="form-label fw-medium small">Experience Relevance</label><input v-model.number="feedbackData.ratings.experience_relevance" type="number" min="1" max="10" class="form-control-ats" required /></div>
                <div class="col-md-4"><label class="form-label fw-medium small">Overall Assessment</label><input v-model.number="feedbackData.ratings.overall" type="number" min="1" max="10" class="form-control-ats" required /></div>
              </div>
            </div>

            <div class="mb-4">
              <h3 class="section-title-gradient">Final Decision</h3>
              <div class="mb-3">
                <label class="form-label fw-medium small">Status *</label>
                <select v-model="feedbackData.status" required class="form-select-ats" @change="onStatusChange">
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div v-if="feedbackData.status === 'on_hold'" class="mb-3">
                <label class="form-label fw-medium small">Hold Reason *</label>
                <textarea v-model="feedbackData.hold_reason" required rows="4" class="form-control-ats form-textarea-ats" placeholder="Please provide a reason..."></textarea>
              </div>
            </div>

            <div class="d-flex gap-3 justify-content-end">
              <button type="button" @click="showFeedbackModal = false" class="btn-ats-secondary">Cancel</button>
              <button type="submit" :disabled="submitting" class="btn-ats-primary">
                <span v-if="submitting">Submitting...</span>
                <span v-else>Submit Feedback</span>
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
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';
import { formatDateTime, formatTime, formatSlotTime, toUTCISOString } from '../utils/datetimeUtils';

export default {
  name: 'InterviewerDashboard',
  setup() {
    const { showLoader, hideLoader } = useLoader();
    return { showLoader, hideLoader };
  },
  data() {
    return {
      assignments: [],
      loading: false,
      error: null,
      statusFilter: '',
      slots: [],
      loadingSlots: false,
      generatingSlots: false,
      slotForm: { date: '', start_time: '09:00', end_time: '18:00', max_slots: null },
      showSlotSelectionModal: false,
      generatedSlots: [],
      showFeedbackModal: false,
      selectedAssignment: null,
      submitting: false,
      feedbackData: {
        ratings: { technical_skills: null, communication: null, problem_solving: null, cultural_fit: null, experience_relevance: null, overall: null },
        status: 'pending',
        hold_reason: ''
      }
    };
  },
  mounted() {
    const today = new Date();
    this.slotForm.date = today.toISOString().slice(0, 10);
    this.fetchAssignments();
    this.fetchSlots();
  },
  computed: {
    minDate() { return new Date().toISOString().slice(0, 10); },
    selectedSlotsCount() { return (this.generatedSlots || []).filter(slot => slot.selected).length; },
    upcomingSlots() {
      const now = new Date();
      return this.assignments.filter(slot => new Date(slot.interview_date) > now);
    },
    pastDecissionPendingSlots() {
      const now = new Date();
      return this.assignments.filter(slot => new Date(slot.interview_date) <= now && slot.interviewer_feedback === null);
    },
    pastDecissionDoneSlots() {
      const now = new Date();
      return this.assignments.filter(slot => new Date(slot.interview_date) <= now && slot.interviewer_feedback !== null);
    }
  },
  methods: {
    async fetchSlots() {
      this.loadingSlots = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/interviews/my-slots`);
        if (response.data.success) this.slots = response.data.data || [];
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally { this.loadingSlots = false; }
    },
    generateSlots() {
      if (!this.slotForm.date) return;
      const startTime = this.slotForm.start_time || '09:00';
      const endTime = this.slotForm.end_time || '18:00';
      const [year, month, day] = this.slotForm.date.split('-').map(Number);
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startDateTime = new Date(year, month - 1, day, startHour, startMin, 0);
      const endDateTime = new Date(year, month - 1, day, endHour, endMin, 0);
      if (endDateTime <= startDateTime) { alert('End time must be after start time'); return; }
      const slotMinutes = 30;
      const now = new Date();
      const selectedDate = new Date(year, month - 1, day);
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      const existingSlots = this.slots.map(s => ({ start: new Date(s.start_time), end: new Date(s.end_time) }));
      const slots = [];
      let currentStart = new Date(startDateTime);
      while (currentStart < endDateTime) {
        const currentEnd = new Date(currentStart.getTime() + slotMinutes * 60000);
        if (currentEnd > endDateTime) break;
        if (isToday && currentStart <= now) { currentStart = currentEnd; continue; }
        const hasConflict = existingSlots.some(es => currentStart < es.end && currentEnd > es.start);
        if (!hasConflict) {
          slots.push({ start_time: toUTCISOString(currentStart), end_time: toUTCISOString(currentEnd), selected: false });
        }
        currentStart = currentEnd;
      }
      if (!slots.length) { alert('No available 30-minute slots (all clash with existing ones).'); return; }
      this.generatedSlots = slots;
      this.showSlotSelectionModal = true;
    },
    onSlotToggle() {},
    async confirmSlotSelection() {
      if (this.selectedSlotsCount === 0) { alert('Please select at least one slot'); return; }
      if (this.slotForm.max_slots > 0 && this.selectedSlotsCount > this.slotForm.max_slots) { alert(`You can only select up to ${this.slotForm.max_slots} slots`); return; }
      this.generatingSlots = true;
      this.showLoader('Creating Availability Slots', `Setting up ${this.selectedSlotsCount} time slot(s)...`);
      try {
        const selectedSlots = this.generatedSlots.filter(slot => slot.selected).map(slot => ({ start_time: slot.start_time, end_time: slot.end_time }));
        const response = await axios.post(`${API_BASE_URL}/interviews/slots/create-selected`, { slots: selectedSlots });
        if (response.data.success) { await this.fetchSlots(); this.showSlotSelectionModal = false; alert(`Successfully created ${this.selectedSlotsCount} availability slot(s).`); this.generatedSlots = []; }
      } catch (error) {
        console.error('Error creating slots:', error);
        alert(error.response?.data?.error || 'Failed to create slots.');
      } finally { this.generatingSlots = false; this.hideLoader(); }
    },
    formatSlotTime,
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    async deleteSlot(id) {
      if (!confirm('Remove this available slot?')) return;
      try {
        const response = await axios.delete(`${API_BASE_URL}/interviews/slots/${id}`);
        if (response.data.success) this.slots = this.slots.filter(s => s.id !== id);
      } catch (error) {
        console.error('Error deleting slot:', error);
        alert(error.response?.data?.error || 'Failed to delete slot.');
      }
    },
    async fetchAssignments() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Assignments', 'Fetching your interview assignments...');
      try {
        const params = this.statusFilter ? `?status=${this.statusFilter}` : '';
        const response = await axios.get(`${API_BASE_URL}/interviews/my-assignments${params}`);
        if (response.data.success) this.assignments = response.data.data;
      } catch (error) {
        console.error('Error fetching assignments:', error);
        this.error = 'Failed to fetch assignments. Please try again.';
      } finally { this.loading = false; this.hideLoader(); }
    },
    openFeedbackModal(assignment) {
      this.selectedAssignment = assignment;
      if (assignment.interviewer_feedback) {
        this.feedbackData = { ratings: { ...assignment.interviewer_feedback }, status: assignment.interviewer_status || 'pending', hold_reason: assignment.interviewer_hold_reason || '' };
      } else {
        this.feedbackData = { ratings: { technical_skills: null, communication: null, problem_solving: null, cultural_fit: null, experience_relevance: null, overall: null }, status: 'pending', hold_reason: '' };
      }
      this.showFeedbackModal = true;
    },
    onStatusChange() { if (this.feedbackData.status !== 'on_hold') this.feedbackData.hold_reason = ''; },
    async submitFeedback() {
      for (const [key, value] of Object.entries(this.feedbackData.ratings)) {
        if (value === null || value < 1 || value > 10) { alert(`Please provide a valid rating (1-10) for ${key.replace('_', ' ')}`); return; }
      }
      if (this.feedbackData.status === 'on_hold' && !this.feedbackData.hold_reason.trim()) { alert('Please provide a reason for putting the candidate on hold'); return; }
      this.submitting = true;
      this.showLoader('Submitting Feedback', 'Saving interview evaluation...');
      try {
        const response = await axios.post(`${API_BASE_URL}/evaluations/${this.selectedAssignment.id}/interviewer-feedback`, { ratings: this.feedbackData.ratings, status: this.feedbackData.status, hold_reason: this.feedbackData.status === 'on_hold' ? this.feedbackData.hold_reason : null });
        if (response.data.success) { await this.fetchAssignments(); this.showFeedbackModal = false; alert('Feedback submitted successfully!'); }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      } finally { this.submitting = false; this.hideLoader(); }
    },
    viewCandidateDetails(assignment) {
      if (assignment.resume_id) {
        this.$router.push({ name: 'ResumeDetail', params: { jobId: assignment.job_description_id, evaluationId: assignment.id } });
      }
    },
    formatDateTime, formatTime
  },
  watch: {
    slots(newSlots) {
      if (!newSlots || newSlots.length === 0) return;
      this.$nextTick(() => {
        const el = this.$refs.slotsList;
        if (!el || el.__wheelBound) return;
        el.addEventListener('wheel', (e) => { if (e.deltaY !== 0) { e.preventDefault(); el.scrollLeft += e.deltaY; } }, { passive: false });
        el.__wheelBound = true;
      });
    }
  }
};
</script>
