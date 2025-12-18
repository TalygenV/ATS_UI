<template>
  <div class="py-4 d-flex justify-content-center">
    <div class="ats-card ats-card-xl" style="max-width: 850px; width: 100%;" v-if="loading">
      <p>Loading interview information...</p>
    </div>

    <div class="ats-card ats-card-xl ats-card-border-danger" style="max-width: 850px; width: 100%;" v-else-if="error">
      <h2 class="text-dark fs-4 fw-bold mb-3">Link Error</h2>
      <p class="text-danger">{{ error }}</p>
    </div>

    <div class="ats-card ats-card-xl" style="max-width: 850px; width: 100%;" v-else-if="link && job">
      <h2 class="text-dark fs-3 fw-bold mb-2">{{ job.title }}</h2>
      <p class="text-muted mb-4">
        Please upload your resume and answer the questions below to continue the interview process.
      </p>

      <div class="mt-4">
        <h3 class="section-title-gradient">Job Summary</h3>
        <p class="text-secondary" style="white-space: pre-line;">{{ job.description }}</p>
        <p v-if="job.requirements" class="text-secondary"><strong>Requirements:</strong> {{ job.requirements }}</p>
      </div>

      <form v-if="!submitted" @submit.prevent="submitApplication" class="mt-4">
        <div class="mb-3">
          <label class="form-label fw-medium text-dark">Resume *</label>
          <input type="file" accept=".pdf,.doc,.docx,.txt" @change="onFileChange" required class="form-control" />
        </div>

        <div v-if="questions && questions.length" class="mt-4">
          <h3 class="section-title-gradient">Questions</h3>
          <div
            v-for="(q, index) in questions"
            :key="index"
            class="mb-3"
          >
            <label class="form-label fw-medium text-dark">{{ q.question || q }}</label>
            <textarea
              v-model="answers[index]"
              rows="3"
              class="form-control-ats form-textarea-ats"
              required
            ></textarea>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button type="submit" class="btn-ats-primary" :disabled="submitting || !resumeFile">
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit</span>
          </button>
        </div>
      </form>

      <div v-else class="mt-4">
        <div v-if="result.status === 'rejected'" class="alert-ats-warning">
          <p class="mb-0">
            Based on the current information, this position may not be the best fit.
          </p>
        </div>

        <div v-if="result.can_select_slot && result.available_slots.length" class="mt-4">
          <h3 class="section-title-gradient">Select Interview Slot</h3>
          <p class="text-secondary">Please choose one of the available time slots below:</p>

          <div class="d-flex flex-column gap-2 mt-3">
            <button
              v-for="slot in result.available_slots"
              :key="slot.id"
              class="slot-btn-ats"
              :class="{ selected: selectedSlotId === slot.id }"
              @click="selectedSlotId = slot.id"
            >
              <div class="fw-medium text-dark">
                {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }}
              </div>
            </button>
          </div>

          <div class="d-flex justify-content-end mt-4">
            <button
              class="btn-ats-primary"
              :disabled="booking || !selectedSlotId"
              @click="bookSlot"
            >
              <span v-if="booking">Booking...</span>
              <span v-else>Confirm Slot</span>
            </button>
          </div>
        </div>

        <div v-else class="mt-4">
          <p class="text-secondary">
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
import { formatDateTime, formatTime } from '../utils/datetimeUtils';

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
    formatDateTime,
    formatTime,
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
        }
      } catch (err) {
        const errorMessage = 'Failed to submit application.';
        alert(errorMessage);
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
          const selectedSlot = this.result.available_slots.find(s => s.id === this.selectedSlotId);
          
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
