<template>
  <div class="auth-page-bg">
    <div class="auth-card text-center" style="max-width: 650px;">
      <div class="mb-4 d-flex justify-content-center" style="animation: scaleIn 0.5s ease-out;">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4caf50" opacity="0.2"/>
          <path d="M9 12l2 2 4-4" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="#4caf50" stroke-width="2"/>
        </svg>
      </div>
      <h1 class="text-dark fs-3 fw-semibold mb-3">Interview Slot Booked Successfully!</h1>
      <p class="text-secondary fs-6 mb-4">
        Your interview slot has been confirmed. A confirmation email with all the details will be sent to you shortly.
      </p>
      
      <div v-if="bookingDetails" class="bg-light rounded-3 p-4 text-start my-4">
        <div class="d-flex justify-content-between py-2 border-bottom">
          <strong class="text-dark">Job Position:</strong>
          <span class="text-secondary">{{ bookingDetails.jobTitle || 'N/A' }}</span>
        </div>
        <div class="d-flex justify-content-between py-2">
          <strong class="text-dark">Interview Date & Time:</strong>
          <span class="text-secondary">{{ formatDateTime(bookingDetails.interviewDate) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDateTime } from '../utils/datetimeUtils';

export default {
  name: 'InterviewBookingSuccess',
  data() {
    return {
      bookingDetails: null
    };
  },
  mounted() {
    // Get booking details from route query params
    const { jobTitle, interviewDate, interviewerName } = this.$route.query;
    if (jobTitle || interviewDate) {
      this.bookingDetails = {
        jobTitle: jobTitle || null,
        interviewDate: interviewDate || null,
        interviewerName: interviewerName || null
      };
    }

    // Auto-close after 10 seconds if user doesn't interact
    this.autoCloseTimer = setTimeout(() => {
      this.closeWindow();
    }, 10000);
  },
  beforeUnmount() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  },
  methods: {
    formatDateTime,
    closeWindow() {
      if (window.opener) {
        window.close();
      } else {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          alert('You can now close this window. A confirmation email will be sent to you shortly.');
        }
      }
    }
  }
};
</script>
