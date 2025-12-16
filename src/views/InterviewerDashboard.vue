<template>
  <div class="interviewer-dashboard">
    <div class="page-header">
      <h2>Interviewer Dashboard</h2>
    </div>

    <div class="interviewer-dashboard">
      <!-- Availability management -->
      <div class="availability-card row m-0">

        <div class="my-availability col-5">

            <div class="card-header">
              <h3>My Availability</h3>
            </div>
              <div class="card-body">
                <form class="slot-form" @submit.prevent="generateSlots">
                  <div class="form-group-inline">
                    <div class="form-group">
                      <label>Date *</label>
                      <input v-model="slotForm.date" type="date" :min="minDate" required class="form-input" />
                    </div>
                    <div class="form-group">
                      <label>From</label>
                      <input v-model="slotForm.start_time" type="time" class="form-input" />
                    </div>
                  
                 
                    <div class="form-group">
                      <label>To</label>
                      <input v-model="slotForm.end_time" type="time" class="form-input" />
                    </div>
                    <div class="form-group">
                      <label>Max Slots</label>
                      <input v-model.number="slotForm.max_slots" type="number" min="1" class="form-input" placeholder="No limit" />
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-8">
                      <p class="hint-text">System will generate 45-minute slots between the selected times (default 9:00–18:00). You can select which slots to make available.</p>
                    </div>
                    <div class="col-4">
                      <div class="form-actions mt-2">
                        <button type="submit" class="btn btn-primary" :disabled="generatingSlots">
                          <span v-if="generatingSlots">Generating...</span>
                          <span v-else>Generate Slots</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </form>

              
              </div>
        </div>
       

         <div class="slots-section col-7">
            <h4>Upcoming Slots</h4>
            <div v-if="loadingSlots" class="loading">Loading slots...</div>
            <div v-else-if="slots.length === 0" class="empty-state">
              <p>No upcoming availability created.</p>
            </div>
            <div v-else class="slots-list">
              <div
                v-for="slot in slots"
                :key="slot.id"
                class="slot-row col-4"
                :class="{ booked: slot.is_booked }"
              >
                <div class="slot-info">
                  <div class="slot-time">
                    {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }}
                  </div>
                  <div class="slot-status mt-3">
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

      <!-- Assignments -->
       <div class="assignments-card my-4">
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
       </div>
      <div class="">
       

    <div v-if="loading" class="loading">Loading assignments...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="assignments.length === 0" class="empty-state assignments-card">
      <p>No interview assignments found.</p>
    </div>
    <div v-else class="row ">
         
        <div class="col-4 assignments-card1">
           <h3 class="assignments-card-header" > Upcoming Interviews </h3>  
          <div v-for="assignment in upcomingSlots" :key="assignment.id" class="assignment-card my-2">
            <div class="card-header">
              <div>
                <h3>{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h3>
                <span :class="['status-badge', 'interviewer-' + assignment.interviewer_status]">
                  {{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}
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
                <span class="label">Contact: </span>
                <span class="value">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span>
              </div>
              <div v-if="assignment.interview_date" class="info-row">
                <span class="label">Interview Date: </span>
                <span class="value">{{ formatDateTime(assignment.interview_date) }}</span>
              </div>
              <!-- <div v-if="assignment.interviewer_feedback" class="feedback-summary">
                <strong>Feedback Submitted</strong>
                <div v-if="assignment.interviewer_feedback" class="ratings-preview">
                  <div v-for="(rating, key) in assignment.interviewer_feedback" :key="key" class="rating-item">
                    <span class="rating-label">{{ key }}:</span>
                    <span class="rating-value">{{ rating }}/10</span>
                  </div>
                </div>
              </div> -->
            </div>
            <div class="card-footer">
              <!-- <button 
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
              </button> -->
              <button @click="viewCandidateDetails(assignment)" class="btn btn-secondary">
                View Resume
              </button>
            </div>
        </div>
                <div v-if="upcomingSlots.length === 0" class="empty-state assignments-card">
      <p>No upcoming interview  found.</p>
    </div>

       

        
         
        </div>

        <div class="col-4 assignments-card1">
            <h3 class="assignments-card-header" > Dession Pending  </h3>
          <div v-for="assignment in pastDecissionPendingSlots" :key="assignment.id" class="assignment-card my-2">
          
            
  
              <div class="card-header">
                <div>
                  <h3>{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h3>
                  <span :class="['status-badge', 'interviewer-' + assignment.interviewer_status]">
                    {{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}
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
           <div v-if="pastDecissionPendingSlots.length === 0" class="empty-state assignments-card">
      <p>No dession pending interview  found.</p>
    </div>
        </div>

        <div class="col-4 assignments-card1">
              <h3 class="assignments-card-header" > Dession Done</h3>
          <div v-for="assignment in pastDecissionDoneSlots" :key="assignment.id" class="assignment-card my-2">
        
         

            <div class="card-header">
              <div>
                <h3>{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h3>
                <span :class="['status-badge', 'interviewer-' + assignment.interviewer_status]">
                  {{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}
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
              <div v-if="pastDecissionDoneSlots.length === 0" class="empty-state assignments-card">
      <p>No dession done interview  found.</p>
    </div>

        </div>
    </div>
      </div>
    </div>

    <!-- Slot Selection Modal -->
    <div v-if="showSlotSelectionModal" class="modal-overlay" @click="showSlotSelectionModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Select Available Slots</h2>
          <button @click="showSlotSelectionModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="slot-selection-info">
            <p><strong>Date:</strong> {{ formatDate(slotForm.date) }}</p>
            <p><strong>Time Range:</strong> {{ slotForm.start_time || '09:00' }} – {{ slotForm.end_time || '18:00' }}</p>
            <p v-if="slotForm.max_slots" class="max-slots-info">
              <strong>Max Slots:</strong> {{ slotForm.max_slots }} 
              <span v-if="selectedSlotsCount > slotForm.max_slots" class="error-text">
                ({{ selectedSlotsCount }} selected - exceeds limit!)
              </span>
              <span v-else class="success-text">
                ({{ selectedSlotsCount }} selected)
              </span>
            </p>
            <p v-else class="max-slots-info">
              <strong>Selected:</strong> {{ selectedSlotsCount }} slots
            </p>
          </div>
          <div class="slots-selection-grid">
            <label
              v-for="(slot, index) in generatedSlots"
              :key="index"
              class="slot-checkbox-label"
              :class="{ disabled: slotForm.max_slots && selectedSlotsCount >= slotForm.max_slots && !slot.selected }"
            >
              <input
                type="checkbox"
                v-model="slot.selected"
                :disabled="slotForm.max_slots && selectedSlotsCount >= slotForm.max_slots && !slot.selected"
                @change="onSlotToggle"
              />
              <span class="slot-time-display">
                {{ formatSlotTime(slot.start_time) }} – {{ formatSlotTime(slot.end_time) }}
              </span>
            </label>
          </div>
          <div class="form-actions">
            <button type="button" @click="showSlotSelectionModal = false" class="btn btn-secondary">Cancel</button>
            <button 
              type="button" 
              @click="confirmSlotSelection" 
              :disabled="selectedSlotsCount === 0 || (slotForm.max_slots && selectedSlotsCount > slotForm.max_slots)"
              class="btn btn-primary"
            >
              Create Selected Slots ({{ selectedSlotsCount }})
            </button>
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
import { useLoader } from '../composables/useLoader';
import { formatDateTime, formatTime, formatSlotTime, toUTCISOString, createUTCDate } from '../utils/datetimeUtils';

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
      slotForm: {
        date: '',
        start_time: '09:00',
        end_time: '18:00',
        max_slots: null
      },
      showSlotSelectionModal: false,
      generatedSlots: [],
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
  computed: {
    minDate() {
      const today = new Date();
      return today.toISOString().slice(0, 10);
    },
    selectedSlotsCount() {
      return (this.generatedSlots || []).filter(slot => slot.selected).length;
    },
        upcomingSlots() {
       const now = new Date();
       return this.assignments.filter(slot => new Date(slot.interview_date) > now);
     },
    
    // pastSlots () {
    //   const now = new Date();
    //   return this.assignments.filter(slot => new Date(slot.interview_date) <= now);
    // },

    pastDecissionPendingSlots() {
      const now = new Date();
      return this.assignments.filter(
        slot => new Date(slot.interview_date) <= now && slot.interviewer_feedback === null
      );
    },

    pastDecissionDoneSlots() {
      const now = new Date();
      return this.assignments.filter(
        slot => new Date(slot.interview_date) <= now && slot.interviewer_feedback !== null
      );
    }

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
    generateSlots() {
      if (!this.slotForm.date) return;
      
      // Generate slots client-side
      const startTime = this.slotForm.start_time || '09:00';
      const endTime = this.slotForm.end_time || '18:00';
      
      // Parse date and time - treat as local time, then convert to UTC for API
      const [year, month, day] = this.slotForm.date.split('-').map(Number);
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      // Create dates in local timezone first
      const startDateTime = new Date(year, month - 1, day, startHour, startMin, 0);
      const endDateTime = new Date(year, month - 1, day, endHour, endMin, 0);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        alert('Invalid date or time format');
        return;
      }
      
      if (endDateTime <= startDateTime) {
        alert('End time must be after start time');
        return;
      }
      
      const slots = [];
      let currentStart = new Date(startDateTime);
      const slotMinutes = 45;
      const now = new Date();
      
      // Check if selected date is today
      const selectedDate = new Date(year, month - 1, day);
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      
      while (currentStart < endDateTime) {
        const currentEnd = new Date(currentStart.getTime() + slotMinutes * 60000);
        if (currentEnd > endDateTime) break;
        
        // Skip past time slots if the selected date is today
        if (isToday && currentStart <= now) {
          currentStart = currentEnd;
          continue;
        }
        
        // Convert to UTC ISO strings for API
        slots.push({
          start_time: toUTCISOString(currentStart),
          end_time: toUTCISOString(currentEnd),
          selected: false
        });
        currentStart = currentEnd;
      }
      
      if (slots.length === 0) {
        alert('No 45-minute slots could be generated for the given range. Please check if the time range includes future times.');
        return;
      }
      
      this.generatedSlots = slots;
      this.showSlotSelectionModal = true;
    },
    onSlotToggle() {
      // This method is called when a checkbox is toggled
      // The max slots validation is handled by the disabled attribute
    },
    async confirmSlotSelection() {
      if (this.selectedSlotsCount === 0) {
        alert('Please select at least one slot');
        return;
      }
      
      if (this.slotForm.max_slots && this.selectedSlotsCount > this.slotForm.max_slots) {
        alert(`You can only select up to ${this.slotForm.max_slots} slots`);
        return;
      }
      
      this.generatingSlots = true;
      this.showLoader('Creating Availability Slots', `Setting up ${this.selectedSlotsCount} time slot(s)...`);
      try {
        const selectedSlots = this.generatedSlots
          .filter(slot => slot.selected)
          .map(slot => ({
            start_time: slot.start_time,
            end_time: slot.end_time
          }));
        
        const response = await axios.post(
          `${API_BASE_URL}/interviews/slots/create-selected`,
          { slots: selectedSlots }
        );
        
        if (response.data.success) {
          await this.fetchSlots();
          this.showSlotSelectionModal = false;
          alert(`Successfully created ${this.selectedSlotsCount} availability slot(s).`);
          // Reset form
          this.generatedSlots = [];
        }
      } catch (error) {
        console.error('Error creating slots:', error);
        alert(error.response?.data?.error || 'Failed to create slots.');
      } finally {
        this.generatingSlots = false;
        this.hideLoader();
      }
    },
    formatSlotTime,
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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
      this.showLoader('Loading Assignments', 'Fetching your interview assignments...');
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
        this.hideLoader();
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
      this.showLoader('Submitting Feedback', 'Saving interview evaluation...');
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
        this.hideLoader();
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
    formatDateTime,
    formatTime,
    formatSlotTime,
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
  margin-bottom: 2rem;
}

h2 {
  color: #1a202c;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr);
  gap: 2rem;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.availability-card,
.assignments-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.assignments-card-header {
      font-size: 1.25rem;
      font-weight: 700;
  background-color: white;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
    border-radius: 20px;
}

.availability-card:hover,
.assignments-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-bottom: 1.5rem; */
  /* padding-bottom: 1.25rem; */
  /* border-bottom: 2px solid #f0f4f8; */
}

.card-header h3 {
  color: #1a202c;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.3px;
}

.filter-select {
  padding: 0.75rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  cursor: pointer;
  background: white;
  color: #2d3748;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #718096;
  font-size: 1rem;
}

.error-message {
  color: #e53e3e;
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border-radius: 12px;
  border-left: 4px solid #e53e3e;
  padding: 1.5rem;
  font-weight: 500;
}

.assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .assignments-grid {
    grid-template-columns: 1fr;
  }
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
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
}

.hint-text {
  font-size: 0.85rem;
  color: #718096;
  margin-top: 0.5rem;
  line-height: 1.5;
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
  flex-direction: row;
  gap: 0.5rem;
  margin-top: 0.75rem;
    height: 100%;
    overflow: auto;
    max-height: 180px;
}

.slot-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slot-row:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.slot-row.booked {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
  border-color: #fed7aa;
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
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pill.available {
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #22543d;
  box-shadow: 0 2px 8px rgba(56, 161, 105, 0.2);
}

.status-pill.booked {
  background: linear-gradient(135deg, #fed7aa 0%, #feb2b2 100%);
  color: #742a2a;
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.2);
}

.btn-small {
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
}

.assignment-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.assignment-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

/* .card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
} */

.card-header h3 {
  color: #333;
  font-size: 1.5rem;
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
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
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

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
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
  max-width: 700px;
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
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.slot-selection-info {
  background: #f8f9fb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.slot-selection-info p {
  margin: 0.5rem 0;
  color: #333;
}

.max-slots-info {
  font-weight: 500;
}

.error-text {
  color: #f44336;
  font-weight: 600;
}

.success-text {
  color: #2e7d32;
}

.slots-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.slot-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
}

.slot-checkbox-label:hover:not(.disabled) {
  border-color: #4299e1;
  background: linear-gradient(135deg, #f0f4ff 0%, #e6edff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.slot-checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.slot-checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.slot-checkbox-label input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.slot-checkbox-label input[type="checkbox"]:checked + .slot-time-display {
  font-weight: 600;
  color: #1976d2;
}

.slot-time-display {
  font-size: 0.95rem;
  color: #333;
}
</style>

