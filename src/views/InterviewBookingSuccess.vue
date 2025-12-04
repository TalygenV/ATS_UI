<template>
  <div class="success-page">
    <div class="success-card">
      <div class="success-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4caf50" opacity="0.2"/>
          <path d="M9 12l2 2 4-4" stroke="#4caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="12" r="10" stroke="#4caf50" stroke-width="2"/>
        </svg>
      </div>
      <h1>Interview Slot Booked Successfully!</h1>
      <p class="success-message">
        Your interview slot has been confirmed. A confirmation email with all the details will be sent to you shortly.
      </p>
      
      <div v-if="bookingDetails" class="booking-details">
        <div class="detail-item">
          <strong>Job Position:</strong>
          <span>{{ bookingDetails.jobTitle || 'N/A' }}</span>
        </div>
        <div class="detail-item">
          <strong>Interview Date & Time:</strong>
          <span>{{ formatDateTime(bookingDetails.interviewDate) }}</span>
        </div>
        <div v-if="bookingDetails.interviewerName" class="detail-item">
          <strong>Interviewer:</strong>
          <span>{{ bookingDetails.interviewerName }}</span>
        </div>
      </div>

      <!-- <div class="actions">
        <button @click="closeWindow" class="btn btn-primary">
          Close Window
        </button>
      </div> -->
    </div>
  </div>
</template>

<script>
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
    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateString;
      }
    },
    closeWindow() {
      // Try to close the window/tab
      // Note: This will only work if the window was opened by JavaScript
      // Otherwise, it will just navigate back or do nothing
      if (window.opener) {
        window.close();
      } else {
        // If we can't close, try to go back or show a message
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // Just show a message that they can close manually
          alert('You can now close this window. A confirmation email will be sent to you shortly.');
        }
      }
    }
  }
};
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.success-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.success-icon {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

h1 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.success-message {
  color: #666;
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.booking-details {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #333;
  font-weight: 600;
  min-width: 150px;
}

.detail-item span {
  color: #555;
  text-align: right;
  flex: 1;
}

.actions {
  margin-top: 2rem;
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 600px) {
  .success-card {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .detail-item {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item strong {
    min-width: auto;
  }

  .detail-item span {
    text-align: left;
  }
}
</style>

