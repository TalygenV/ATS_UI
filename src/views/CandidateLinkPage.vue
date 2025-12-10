<template>
  <div class="candidate-link-page">
    <div class="card" v-if="loading">
      <p>Loading interview information...</p>
    </div>

    <div class="card error" v-else-if="error">
      <h2>Link Error</h2>
      <p>{{ error }}</p>
    </div>

    <div class="card" v-else-if="link && job">
      <h2> {{ job.title }}</h2>
      <p class="subtitle">
        Please upload your resume and answer the questions below to continue the interview process.
      </p>

      <div class="section">
        <h3>Job Summary</h3>
        <p class="job-text">{{ job.description }}</p>
        <p v-if="job.requirements" class="job-text"><strong>Requirements:</strong> {{ job.requirements }}</p>
      </div>

      <form v-if="!submitted" @submit.prevent="submitApplication" class="form">
        <div class="form-group">
          <label>Resume *</label>
          <input type="file" accept=".pdf,.doc,.docx,.txt" @change="onFileChange" required />
        </div>

        <div class="section" v-if="questions && questions.length">
          <h3>Questions</h3>
          <div
            v-for="(q, index) in questions"
            :key="index"
            class="form-group"
          >
            <label>{{ q.question || q }}</label>
            <textarea
              v-model="answers[index]"
              rows="3"
              class="textarea"
              required
            ></textarea>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="submitting || !resumeFile">
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit</span>
          </button>
        </div>
      </form>

      <div v-else class="section">
        <!-- <h3>Evaluation Result</h3>
        <p>Your profile has been evaluated for this position.</p>
        <p><strong>Overall Match:</strong> {{ formatScore(result.overall_match) }}%</p> -->

        <div v-if="result.status === 'rejected'" class="alert alert-warning">
          <p>
            Based on the current information, this position may not be the best fit.
          </p>
        </div>

        <div v-if="result.can_select_slot && result.available_slots.length" class="section">
          <h3>Select Interview Slot</h3>
          <p>Please choose one of the available time slots below:</p>

          <div class="slots-list">
            <button
              v-for="slot in result.available_slots"
              :key="slot.id"
              class="slot-btn"
              :class="{ selected: selectedSlotId === slot.id }"
              @click="selectedSlotId = slot.id"
            >
              <div class="slot-time">
                {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }}
              </div>
              <!-- <div class="slot-interviewer" v-if="slot.interviewer">
                Interviewer: {{ slot.interviewer.full_name || slot.interviewer.email }}
              </div> -->
            </button>
          </div>

          <div class="actions">
            <button
              class="btn btn-primary"
              :disabled="booking || !selectedSlotId"
              @click="bookSlot"
            >
              <span v-if="booking">Booking...</span>
              <span v-else>Confirm Slot</span>
            </button>
          </div>
        </div>

        <div v-else class="section">
          <p>
            Our HR team will review your profile and contact you regarding next steps.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useLoader } from '../composables/useLoader';
import { API_BASE_URL } from '../config/api';

export default {
  name: 'CandidateLinkPage',
  setup() {
    const { showLoader, hideLoader } = useLoader();
    return { showLoader, hideLoader };
  },
  data() {
    return {
      loading: true,
      error: null,
      link: null,
      job: null,
      questions: [],
      answers: {},
      resumeFile: null,
      submitting: false,
      submitted: false,
      result: null,
      selectedSlotId: null,
      booking: false
    };
  },
  async mounted() {
    const token = this.$route.params.token;
    this.showLoader('Loading Application', 'Fetching job details...');
    try {
      const response = await axios.get(`${API_BASE_URL}/candidate-links/${token}`);
      if (response.data.success) {
        this.link = response.data.data;
        this.job = this.link.job;
        this.questions = this.link.questions || [];
      } else {
        this.error = 'Unable to load link information.';
      }
    } catch (err) {
      console.error('Error loading candidate link:', err);
      this.error =
        err.response?.data?.error ||
        'This link is invalid or has expired.';
    } finally {
      this.loading = false;
      this.hideLoader();
    }
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      this.resumeFile = file || null;
    },
    formatScore(score) {
      if (score === null || score === undefined) return 0;
      return Math.round(parseFloat(score));
    },
    formatDateTime(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatTime(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    async submitApplication() {
      if (!this.resumeFile) return;
      this.submitting = true;
      this.error = null;
      this.showLoader('Submitting Application', 'Processing your resume and answers...');

      try {
        const token = this.$route.params.token;
        const formData = new FormData();
        formData.append('resume', this.resumeFile);

        const qa = {};
        this.questions.forEach((q, index) => {
          qa[q.question || q] = this.answers[index] || '';
        });

        formData.append('question_answers', JSON.stringify(qa));

        const response = await axios.post(
          `${API_BASE_URL}/candidate-links/${token}/submit`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (response.data.success) {
          this.result = response.data.data;
          this.submitted = true;
        } else {
          const errorMsg = response.data.error || 'Submission failed.';
           alert(errorMsg);
          // Check for the specific "already applied" error
          // if (errorMsg.includes('already applied within the last 6 months')) {
           
          //   return;
          // }
          // this.error = errorMsg;
        }
      } catch (err) {
        // console.error('Error submitting application:', err);
        // const errorMessage =
        //   err.response?.data?.message ||
        //   err.response?.data?.error ||
        //   'Failed to submit application.';
         const errorMessage =  'Failed to submit application.';
        // Check for the specific "already applied" error
         alert(errorMessage);
        // if (errorMessage.includes('already applied within the last 6 months')) {
         
        //   return;
        // }
        
        this.error = errorMessage;
      } finally {
        this.submitting = false;
        this.hideLoader();
      }
    },
    async bookSlot() {
      if (!this.selectedSlotId || !this.result) return;
      this.booking = true;
      this.error = null;
      this.showLoader('Booking Interview Slot', 'Confirming your selected time slot...');

      try {
        const token = this.$route.params.token;
        const response = await axios.post(`${API_BASE_URL}/candidate-links/${token}/book-slot`, {
          slot_id: this.selectedSlotId,
          evaluation_id: this.result.evaluation_id
        });

        if (response.data.success) {
          // Get the selected slot details
          const selectedSlot = this.result.available_slots.find(s => s.id === this.selectedSlotId);
          
          // Redirect to success screen with booking details
          this.$router.push({
            name: 'InterviewBookingSuccess',
            query: {
              jobTitle: this.job?.title || '',
              interviewDate: selectedSlot?.start_time || '',
              interviewerName: selectedSlot?.interviewer?.full_name || selectedSlot?.interviewer?.email || ''
            }
          });
        }
      } catch (err) {
        console.error('Error booking slot:', err);
        this.error =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to book slot. Please try another one.';
      } finally {
        this.booking = false;
        this.hideLoader();
      }
    }
  }
};
</script>

<style scoped>
.candidate-link-page {
  padding: 2rem 0;
  display: flex;
  justify-content: center;
}

.card {
  max-width: 850px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.card.error {
  border-left: 4px solid #e53e3e;
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
}

h2 {
  margin: 0 0 0.75rem 0;
  color: #1a202c;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.section {
  margin-top: 1.5rem;
}

.job-text {
  white-space: pre-line;
  color: #555;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: 500;
  color: #333;
}

input[type='file'] {
  display: block;
}

.textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  resize: vertical;
}

.actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.75rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.slot-btn {
  text-align: left;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fafafa;
  cursor: pointer;
}

.slot-btn.selected {
  border-color: #1976d2;
  background: #e3f2fd;
}

.slot-time {
  font-weight: 500;
  color: #333;
}

.slot-interviewer {
  font-size: 0.9rem;
  color: #555;
  margin-top: 0.25rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 0.75rem;
}

.alert-warning {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}
</style>


