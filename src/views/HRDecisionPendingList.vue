


<template>
        <div class="row g-4">
       
<div class="col-12 col-md-6 col-xl-3"  v-for="assignment in pastDecissionPendingSlots" :key="assignment.id">
          <div class="ats-card ats-card-top-warning ">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 class="fs-6 fw-semibold text-dark mb-1">{{ assignment.resume?.name || assignment.candidate_name || 'Unknown Candidate' }}</h4>
                <!-- <span class="badge-ats badge-ats-pending">{{ (assignment.interviewer_status || 'pending').replace(/_/g, ' ') }}</span> -->
              </div>
              <div v-if="assignment.title" class="text-muted small">{{ assignment.title }}</div>
            </div>
            <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ assignment.resume?.email || assignment.email || 'N/A' }}</span></div>
            <div class="info-row-ats"><span class="info-label-ats">Contact:</span><span class="info-value-ats">{{ assignment.resume?.phone || assignment.contact_number || 'N/A' }}</span></div>
             
            <div v-if="assignment.interview_date" class="info-row-ats"><span class="info-label-ats">Interview:</span><span class="info-value-ats">{{ formatDateTime(assignment.interview_date) }}</span></div>
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              <button  class="btn-ats-primary btn-ats-sm" @click="openHRDecisionModal(assignment)">HR Decision</button>
             
              <button @click="viewCandidateDetails(assignment)" class="btn-ats-secondary btn-ats-sm">View Resume</button>
            </div>
          </div>
  </div>

          <div v-if="pastDecissionPendingSlots.length === 0" style="width: 100%;" class="ats-card text-center py-4 text-muted">No decision pending interviews found.</div>
       
         
      </div>


        <!-- HR Decision Modal -->
    <div v-if="showHRDecisionModal && selectedCandidateForFeedback" class="modal-overlay-ats" >
      <div class="modal-content-ats modal-content-lg" @click.stop>
        <div class="modal-header-ats" style="    position: sticky;
    top: 0;
    background-color: white;" >
          <h2>Final HR Decision</h2>
          <button @click="popupClose" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          
          <!-- Show All Interviewers Feedback -->
          <div v-if="JSON.parse(selectedCandidateForFeedback.interviewers)?.length > 0" class="interviewer-feedback-section">
            <h3>Interviewer Feedback</h3>
            <div v-for="(interviewDetail, index) in JSON.parse(selectedCandidateForFeedback.interviewers)" :key="interviewDetail.id || index" class="feedback-display mb-4" style="border-bottom: 1px solid #e0e0e0; padding-bottom: 1.5rem;">
              <div class="feedback-interviewer-header mb-3">
                <h4>
                  Interviewer {{ index + 1 }}: 
                  {{ interviewDetail.interviewer_name || 'N/A' }}
                </h4>
              </div>
              
              <div v-if="interviewDetail.interviewer_feedback || interviewDetail.interviewer_status !== 'pending'">
                <div v-if="interviewDetail.interviewer_feedback" class="feedback-ratings mb-3">
                  <h5>Ratings (1-10 scale):</h5>
                  <div class="ratings-display-grid">
                    <div v-for="(rating, key) in getFilteredRatings(interviewDetail.interviewer_feedback)" :key="key" class="rating-display-item">
                      <span class="rating-display-label">{{ key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }}:</span>
                      <span class="rating-display-value">{{ rating }}/10</span>
                    </div>
                  </div>
                     <div v-if="
    Object.values(interviewDetail.interviewer_feedback)
      .every(value => value === '' || value === null || value === undefined)
  "> 
                        <span class="rating-display-value">Not Submitted Rating</span>
                      </div>
                </div>
                <div v-if="interviewDetail.interviewer_feedback && interviewDetail.interviewer_feedback.interviewer_remarks" class="feedback-remarks mb-3">
                  <h5>Interviewer Remarks:</h5>
                  <p>{{ interviewDetail.interviewer_feedback.interviewer_remarks }}</p>
                </div>
                <div class="feedback-status mb-3">
                  <h5>Interviewer's Decision:</h5>
                  <span :class="['status-badge', 'interviewer-' + (interviewDetail.interviewer_status || 'pending')]">
                    {{ (interviewDetail.interviewer_status || 'pending').replace(/_/g, ' ').toUpperCase() }}
                  </span>
                </div>
                <div v-if="interviewDetail.interviewer_hold_reason" class="feedback-hold-reason mb-3">
                  <h5>Hold Reason:</h5>
                  <p>{{ interviewDetail.interviewer_hold_reason }}</p>
                </div>
              </div>
              <div v-else class="feedback-pending">
                <p class="text-muted">Feedback not yet submitted</p>
              </div>
            </div>
          </div>
          <!-- Fallback for backward compatibility (single interviewer) -->
          <!-- <div v-else-if="selectedCandidateForFeedback.interviewer_feedback" class="interviewer-feedback-section">
            <h3>Interviewer Feedback</h3>
            <div class="feedback-display">
              <div class="feedback-ratings">
                <h4>Ratings (1-10 scale):</h4>
                <div class="ratings-display-grid">
                  <div v-for="(rating, key) in getFilteredRatings(selectedCandidateForFeedback.interviewer_feedback)" :key="key" class="rating-display-item">
                    <span class="rating-display-label">{{ key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }}:</span>
                    <span class="rating-display-value">{{ rating }}/10</span>
                  </div>
                </div>
                  <div v-if="
    Object.values(selectedCandidateForFeedback.interviewer_feedback)
      .every(value => value === '' || value === null || value === undefined)
  "> 
                        <span class="rating-display-value">Not Submitted Rating</span>
                      </div>
                
              </div>
              <div v-if="selectedCandidateForFeedback.interviewer_feedback && selectedCandidateForFeedback.interviewer_feedback.interviewer_remarks" class="feedback-remarks">
                <h4>Interviewer Remarks:</h4>
                <p>{{ selectedCandidateForFeedback.interviewer_feedback.interviewer_remarks }}</p>
              </div>
              <div class="feedback-status">
                <h4>Interviewer's Decision:</h4>
                <span :class="['status-badge', 'interviewer-' + selectedCandidateForFeedback.interviewer_status]">
                  {{ selectedCandidateForFeedback.interviewer_status }}
                </span>
              </div>
              <div v-if="selectedCandidateForFeedback.interviewer_hold_reason" class="feedback-hold-reason">
                <h4>Hold Reason:</h4>
                <p>{{ selectedCandidateForFeedback.interviewer_hold_reason }}</p>
              </div>
            </div>
          </div> -->

          <!-- HR Decision Form -->
          <div class="form-section">
            <h3>Your Final Decision</h3>
            <div class="mb-4">
              <label>Final Status *</label>
              <select v-model="hrDecisionData.status" required class="form-control-ats" @change="onHRStatusChange">
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <!-- Show reason field if:
                 1. Status is rejected or on_hold (always required)
                 2. Status is selected AND no interviewer selected (override case) -->
            <div v-if="hrDecisionData.status === 'rejected' || hrDecisionData.status === 'on_hold' || (hrDecisionData.status === 'selected' && !hasAnyInterviewerSelected(selectedCandidateForFeedback))" class="mb-4">
              <label>Reason *</label>
              <textarea 
                v-model="hrDecisionData.reason" 
                required 
                rows="4" 
                class="form-control-ats form-textarea-ats" 
                :placeholder="getReasonPlaceholder()"
              ></textarea>
              <small v-if="hrDecisionData.status === 'selected' && !hasAnyInterviewerSelected(selectedCandidateForFeedback)" class="reason-hint">
                Reason is required when overriding interviewer's decision to select this candidate.
              </small>
            </div>
            <div class="mb-4">
              <label>Remarks</label>
              <textarea 
                v-model="hrDecisionData.hrRemarks" 
                rows="4" 
                class="form-control-ats form-textarea-ats" 
                placeholder="Additional remarks (optional)"
              ></textarea>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="popupClose" class="btn-ats-secondary">Cancel</button>
              <button type="button" @click="submitHRDecision" class="btn-ats-primary">Submit Decision</button>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
const props = defineProps({
  pastDecissionPendingSlots: {
    type: Array,
    required: true
  }
 
});
  import { ref, onMounted } from 'vue';
  
import axios from 'axios';
import moment from 'moment';
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';
import { useAuth } from '../composables/useAuth';
import { useRouter } from 'vue-router';
const router = useRouter();
const { showLoader, hideLoader } = useLoader();
const emit = defineEmits(['decision-done']);

const loading = ref(false);
const showHRDecisionModal = ref(false);
const selectedCandidateForFeedback = ref(null);


  function viewCandidateDetails(assignment) {
      if (assignment.resume_id) {
        router.push({ name: 'ResumeDetail', params: { jobId: assignment.job_description_id, evaluationId: assignment.resume_id } });
      }
    }


const popupClose = ()=> {
  showHRDecisionModal.value = false;
  hrDecisionData.value = {
        evaluation_id: null,
        status: 'pending',
        reason: '',
        hrRemarks: ''
      };
}
const hrDecisionData = ref({
        evaluation_id: null,
        status: 'pending',
        reason: '',
        hrRemarks: ''
      });

         function hasAnyInterviewerSelected(candidate) {
      // Check if any interviewer selected the candidate
      if (JSON.parse(candidate.interviewers)?.length > 0) {
        return JSON.parse(candidate.interviewers).some(id => id.interviewer_status === 'selected');
      }
      // Fallback for backward compatibility
      return candidate.interviewer_status === 'selected';
    }


       async function submitHRDecision() {
      if (!hrDecisionData.value.status || hrDecisionData.value.status === 'pending') {
        alert('Please select a status');
        return;
      }

      // Check if reason is required
      const requiresReason = 
        hrDecisionData.value.status === 'rejected' || 
        hrDecisionData.value.status === 'on_hold' ||
        (hrDecisionData.value.status === 'selected' && 
         !hasAnyInterviewerSelected(selectedCandidateForFeedback.value));

      if (requiresReason && !hrDecisionData.value.reason.trim()) {
        if (hrDecisionData.value.status === 'selected') {
          alert('Please provide a reason for selecting this candidate (overriding interviewer\'s decision).');
        } else {
          alert('Please provide a reason for ' + hrDecisionData.value.status);
        }
        return;
      }

      showLoader('Submitting Decision', 'Saving HR final decision...');
      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${selectedCandidateForFeedback.value.id}/hr-decision`,
          {
            status: hrDecisionData.value.status,
            reason: hrDecisionData.value.reason,
            hrRemarks: hrDecisionData.value.hrRemarks
          }
        );
         debugger;
        if (response.data.success) {
           emit('decision-done');

          showHRDecisionModal.value = false;
       
          alert('Final decision updated successfully!');
        }
        else {
          const errorMsg = response.data.error || 'Failed to update decision. Please try again.';
          alert(errorMsg);
        }
      } catch (error) {
        console.error('Error updating HR decision:', error);
        alert('Failed to update decision. Please try again.');
      } finally {
           hrDecisionData.value = {
            evaluation_id: null,
            status: 'pending',
            reason: '',
            hrRemarks: ''
          };
        hideLoader();
      }
    }

     function onHRStatusChange() {
      // Clear reason if status is pending
      if (hrDecisionData.value.status === 'pending') {
        hrDecisionData.value.reason = '';
      }
    }

   function  getReasonPlaceholder() {
      if (hrDecisionData.value.status === 'selected' && 
          !hasAnyInterviewerSelected(selectedCandidateForFeedback.value)) {
        return 'Please provide a reason for selecting this candidate (overriding interviewer\'s decision)...';
      } else if (hrDecisionData.value.status === 'rejected') {
        return 'Enter rejection reason...';
      } else if (hrDecisionData.value.status === 'on_hold') {
        return 'Enter hold reason...';
      }
      return 'Enter reason...';
    }



  function getFilteredRatings(ratings) {
      if (!ratings || typeof ratings !== 'object') return {};
      const filtered = {};
      for (const [key, value] of Object.entries(ratings)) {
        if (key !== 'interviewer_remarks' && value !== null && value !== undefined && value !== '') {
          filtered[key] = value;
        }
      }
      return filtered;
    }




 function openHRDecisionModal(candidate) {
     
      selectedCandidateForFeedback.value = candidate;
      showHRDecisionModal.value = true;
    }
</script>
   
<style>

</style>