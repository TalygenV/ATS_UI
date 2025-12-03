<template>
  <div class="interviewer-dashboard">
    <div class="page-header">
      <h2>Interviewer Dashboard</h2>
    </div>

    <div class="dashboard-grid">
      <!-- Availability management -->
      <div class="availability-card">
        <div class="card-header">
          <h3>My Availability</h3>
        </div>
        <div class="card-body">
          <form class="slot-form" @submit.prevent="generateSlots">
            <div class="form-group-inline">
              <div class="form-group">
                <label>Date *</label>
                <input v-model="slotForm.date" type="date" required class="form-input" />
              </div>
              <div class="form-group">
                <label>From</label>
                <input v-model="slotForm.start_time" type="time" class="form-input" />
              </div>
              <div class="form-group">
                <label>To</label>
                <input v-model="slotForm.end_time" type="time" class="form-input" />
              </div>
            </div>
            <p class="hint-text">System will generate 45-minute slots between the selected times (default 9:00–18:00).</p>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="generatingSlots">
                <span v-if="generatingSlots">Generating...</span>
                <span v-else>Generate Slots</span>
              </button>
            </div>
          </form>

          <div class="slots-section">
            <h4>Upcoming Slots</h4>
            <div v-if="loadingSlots" class="loading">Loading slots...</div>
            <div v-else-if="slots.length === 0" class="empty-state">
              <p>No upcoming availability created.</p>
            </div>
            <div v-else class="slots-list">
              <div
                v-for="slot in slots"
                :key="slot.id"
                class="slot-row"
                :class="{ booked: slot.is_booked }"
              >
                <div class="slot-info">
                  <div class="slot-time">
                    {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }}
                  </div>
                  <div class="slot-status">
                    <span v-if="slot.is_booked" class="status-pill booked">Booked</span>
                    <span v-else class="status-pill available">Available</span>
                  </div>
                </div>
                <button
                  v-if="!slot.is_booked"
                  class="btn btn-secondary btn-small"
                  @click="deleteSlot(slot.id)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Assignments -->
      <div class="assignments-card">
        <div class="card-header">
          <h3>My Interview Assignments</h3>
          <select v-model="statusFilter" @change="fetchAssignments" class="filter-select">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

    <div v-if="loading" class="loading">Loading assignments...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="assignments.length === 0" class="empty-state">
      <p>No interview assignments found.</p>
    </div>
        <div v-else class="assignments-grid">
          <div v-for="assignment in assignments" :key="assignment.id" class="assignment-card">
            <div class="card-header">
              <div>
                <h3>{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h3>
                <span :class="['status-badge', 'interviewer-' + assignment.interviewer_status]">
                  {{ assignment.interviewer_status || 'pending' }}
                </span>
              </div>
              <div v-if="assignment.job_description" class="job-title">
                {{ assignment.job_description.title }}
              </div>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{{ assignment.resume?.email || assignment.email || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Contact:</span>
                <span class="value">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span>
              </div>
              <div v-if="assignment.interview_date" class="info-row">
                <span class="label">Interview Date:</span>
                <span class="value">{{ formatDateTime(assignment.interview_date) }}</span>
              </div>
              <div v-if="assignment.interviewer_feedback" class="feedback-summary">
                <strong>Feedback Submitted</strong>
                <div v-if="assignment.interviewer_feedback" class="ratings-preview">
                  <div v-for="(rating, key) in assignment.interviewer_feedback" :key="key" class="rating-item">
                    <span class="rating-label">{{ key }}:</span>
                    <span class="rating-value">{{ rating }}/10</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <button 
                v-if="assignment.interviewer_status === 'pending'" 
                @click="openFeedbackModal(assignment)" 
                class="btn btn-primary"
              >
                Submit Feedback
              </button>
              <button 
                v-else 
                @click="openFeedbackModal(assignment)" 
                class="btn btn-secondary"
              >
                View/Edit Feedback
              </button>
              <button @click="viewCandidateDetails(assignment)" class="btn btn-secondary">
                View Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div v-if="showFeedbackModal && selectedAssignment" class="modal-overlay" @click="showFeedbackModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Interview Feedback</h2>
          <button @click="showFeedbackModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitFeedback">
            <div class="form-section">
              <h3>Candidate Ratings (1-10 scale)</h3>
              <div class="ratings-grid">
                <div class="rating-group">
                  <label>Technical Skills</label>
                  <input 
                    v-model.number="feedbackData.ratings.technical_skills" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Communication</label>
                  <input 
                    v-model.number="feedbackData.ratings.communication" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Problem Solving</label>
                  <input 
                    v-model.number="feedbackData.ratings.problem_solving" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Cultural Fit</label>
                  <input 
                    v-model.number="feedbackData.ratings.cultural_fit" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Experience Relevance</label>
                  <input 
                    v-model.number="feedbackData.ratings.experience_relevance" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Overall Assessment</label>
                  <input 
                    v-model.number="feedbackData.ratings.overall" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Final Decision</h3>
              <div class="form-group">
                <label>Status *</label>
                <select v-model="feedbackData.status" required class="form-input" @change="onStatusChange">
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div v-if="feedbackData.status === 'on_hold'" class="form-group">
                <label>Hold Reason *</label>
                <textarea 
                  v-model="feedbackData.hold_reason" 
                  required 
                  rows="4" 
                  class="form-textarea"
                  placeholder="Please provide a reason for putting this candidate on hold..."
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="showFeedbackModal = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="submitting" class="btn btn-primary">
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

export default {
  name: 'InterviewerDashboard',
  data() {
    return {
      assignments: [],
      loading: false,
      error: null,
      statusFilter: '',
      slots: [],
      loadingSlots: false,
      generatingSlots: false,
      slotForm: {
        date: '',
        start_time: '09:00',
        end_time: '18:00'
      },
      showFeedbackModal: false,
      selectedAssignment: null,
      submitting: false,
      feedbackData: {
        ratings: {
          technical_skills: null,
          communication: null,
          problem_solving: null,
          cultural_fit: null,
          experience_relevance: null,
          overall: null
        },
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
  methods: {
    async fetchSlots() {
      this.loadingSlots = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/interviews/my-slots`);
        if (response.data.success) {
          this.slots = response.data.data || [];
        }
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        this.loadingSlots = false;
      }
    },
    async generateSlots() {
      if (!this.slotForm.date) return;
      this.generatingSlots = true;
      try {
        const payload = {
          date: this.slotForm.date,
          start_time: this.slotForm.start_time || undefined,
          end_time: this.slotForm.end_time || undefined
        };
        const response = await axios.post(`${API_BASE_URL}/interviews/slots/generate`, payload);
        if (response.data.success) {
          await this.fetchSlots();
          alert('Availability slots generated successfully.');
        }
      } catch (error) {
        console.error('Error generating slots:', error);
        alert(error.response?.data?.error || 'Failed to generate slots.');
      } finally {
        this.generatingSlots = false;
      }
    },
    async deleteSlot(id) {
      if (!confirm('Remove this available slot?')) return;
      try {
        const response = await axios.delete(`${API_BASE_URL}/interviews/slots/${id}`);
        if (response.data.success) {
          this.slots = this.slots.filter(s => s.id !== id);
        }
      } catch (error) {
        console.error('Error deleting slot:', error);
        alert(error.response?.data?.error || 'Failed to delete slot.');
      }
    },
    async fetchAssignments() {
      this.loading = true;
      this.error = null;
      try {
        const params = this.statusFilter ? `?status=${this.statusFilter}` : '';
        const response = await axios.get(`${API_BASE_URL}/interviews/my-assignments${params}`);
        if (response.data.success) {
          this.assignments = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        this.error = 'Failed to fetch assignments. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    openFeedbackModal(assignment) {
      this.selectedAssignment = assignment;
      if (assignment.interviewer_feedback) {
        this.feedbackData = {
          ratings: { ...assignment.interviewer_feedback },
          status: assignment.interviewer_status || 'pending',
          hold_reason: assignment.interviewer_hold_reason || ''
        };
      } else {
        this.feedbackData = {
          ratings: {
            technical_skills: null,
            communication: null,
            problem_solving: null,
            cultural_fit: null,
            experience_relevance: null,
            overall: null
          },
          status: 'pending',
          hold_reason: ''
        };
      }
      this.showFeedbackModal = true;
    },
    onStatusChange() {
      if (this.feedbackData.status !== 'on_hold') {
        this.feedbackData.hold_reason = '';
      }
    },
    async submitFeedback() {
      // Validate ratings
      for (const [key, value] of Object.entries(this.feedbackData.ratings)) {
        if (value === null || value < 1 || value > 10) {
          alert(`Please provide a valid rating (1-10) for ${key.replace('_', ' ')}`);
          return;
        }
      }

      if (this.feedbackData.status === 'on_hold' && !this.feedbackData.hold_reason.trim()) {
        alert('Please provide a reason for putting the candidate on hold');
        return;
      }

      this.submitting = true;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.selectedAssignment.id}/interviewer-feedback`,
          {
            ratings: this.feedbackData.ratings,
            status: this.feedbackData.status,
            hold_reason: this.feedbackData.status === 'on_hold' ? this.feedbackData.hold_reason : null
          }
        );

        if (response.data.success) {
          await this.fetchAssignments();
          this.showFeedbackModal = false;
          alert('Feedback submitted successfully!');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      } finally {
        this.submitting = false;
      }
    },
    viewCandidateDetails(assignment) {
      if (assignment.resume_id) {
        this.$router.push({
          name: 'ResumeDetail',
          params: {
            jobId: assignment.job_description_id,
            evaluationId: assignment.id
          }
        });
      }
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
    formatTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.interviewer-dashboard {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

h2 {
  color: #333;
  margin: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr);
  gap: 1.5rem;
  align-items: flex-start;
}

.availability-card,
.assignments-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.slot-form {
  margin-bottom: 1.5rem;
}

.form-group-inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.hint-text {
  font-size: 0.85rem;
  color: #777;
  margin-top: 0.25rem;
}

.form-actions {
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-start;
}

.slots-section {
  margin-top: 1rem;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.slot-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: #f8f9fb;
}

.slot-row.booked {
  background: #fff3e0;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.slot-time {
  font-weight: 500;
  color: #333;
}

.status-pill {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill.available {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-pill.booked {
  background: #fff3e0;
  color: #e65100;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.assignment-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.assignment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.card-header h3 {
  color: #333;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.job-title {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  margin-top: 0.5rem;
}

.status-badge.interviewer-pending {
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
  min-width: 100px;
}

.value {
  color: #333;
  flex: 1;
}

.feedback-summary {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.ratings-preview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.rating-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.rating-label {
  color: #666;
}

.rating-value {
  font-weight: 600;
  color: #1976d2;
}

.card-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
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

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
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

.modal-content.large {
  max-width: 900px;
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

.form-section {
  margin-bottom: 2rem;
}

.form-section h3 {
  color: #1976d2;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.ratings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.rating-group {
  display: flex;
  flex-direction: column;
}

.rating-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.rating-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  width: 100%;
}

.rating-input:focus {
  outline: none;
  border-color: #1976d2;
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
</style>

