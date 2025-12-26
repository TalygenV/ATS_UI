<template>
  <div class="my-4" @click="onBack">
    <button class="btn-back">← Back</button>
  </div>

  <div class="ats-card mb-4">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
      <h3 class="fs-5 fw-bold mb-0">
        {{
          decision === "pending"
            ? "Decision Pending Assignments"
            : "Decision Done Assignments"
        }}
      </h3>
      <div class="d-flex gap-4">
      <select
        v-model="statusFilter"
        @change="onStatusFilterChange"
        class="form-select-ats"
        style="width: auto"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="selected">Selected</option>
        <option value="rejected">Rejected</option>
        <option value="on_hold">On Hold</option>
      </select>

      <select
  v-model.number="limit"
  @change="onLimitChange"
  class="form-select-ats"
  style="width: auto"
>
  <option :value="5">5 / page</option>
  <option :value="10">10 / page</option>
  <option :value="20">20 / page</option>
  <option :value="50">50 / page</option>
</select>
</div>
    </div>
  </div>

  <div v-if="loading" class="loading-state-ats">Loading assignments...</div>
  <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
  <div v-else-if="filteredAssignments.length === 0" class="ats-card text-center py-5">
    <p class="text-muted">No interview assignments found.</p>
  </div>
  <div v-else class="row g-4">
    <!-- Decision Pending -->
    <div v-if="decision === 'pending'" class="col-12">
      <div class="d-flex flex-row flex-wrap gap-3">
        <div
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="ats-card ats-card-top-warning"
          style="min-width: 350px; width: fit-content"
        >
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 class="fs-6 fw-semibold text-dark mb-1">
                {{
                  assignment.resume?.name ||
                  assignment.candidate_name ||
                  "Unknown Candidate"
                }}
              </h4>
              <span class="badge-ats badge-ats-pending">{{
                (assignment.interviewer_status || "pending").replace(/_/g, " ")
              }}</span>
            </div>
            <div v-if="assignment.job_description" class="text-muted small">
              {{ assignment.job_description.title }}
            </div>
          </div>
          <div class="info-row-ats">
            <span class="info-label-ats">Email:</span>
            <span class="info-value-ats">{{
              assignment.resume?.email || assignment.email || "N/A"
            }}</span>
          </div>
          <div class="info-row-ats">
            <span class="info-label-ats">Contact:</span>
            <span class="info-value-ats">{{
              assignment.resume?.phone || assignment.contact_number || "N/A"
            }}</span>
          </div>
          <div v-if="assignment.interview_date" class="info-row-ats">
            <span class="info-label-ats">Interview:</span>
            <span class="info-value-ats">{{
              formatDateTime(assignment.interview_date)
            }}</span>
          </div>
          <div v-if="assignment.interviewer_feedback" class="mt-3 pt-3 border-top">
            <strong class="small text-dark">Feedback Submitted</strong>
            <div class="row g-2 mt-2">
              <div
                v-for="([key, rating]) in Object.entries(
                  assignment.interviewer_feedback
                ).filter(
                  ([k, v]) =>
                    k !== 'interviewer_remarks' && typeof v === 'number'
                )"
                :key="key"
                class="col-6"
              >
                <div class="d-flex justify-content-between small p-2 bg-light rounded-2">
                  <span class="text-muted">{{ key.replace(/_/g, " ") }}:</span>
                  <span class="text-primary fw-semibold">{{ rating }}/10</span>
                </div>
              </div>
            </div>
            <div v-if="assignment.interviewer_feedback.interviewer_remarks" class="mt-3">
              <strong class="small text-dark">Remarks:</strong>
              <p class="small text-muted mt-1 mb-0">
                {{ assignment.interviewer_feedback.interviewer_remarks }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button
              v-if="assignment.interviewer_status === 'pending'"
              @click="openFeedbackModal(assignment)"
               
              class="btn-ats-primary btn-ats-sm"
            >
              Submit Feedback
            </button>
         
            <button
              @click="viewCandidateDetails(assignment)"
              class="btn-ats-secondary btn-ats-sm"
            >
              View Resume
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Decision Done -->
    <div v-if="decision === 'complete'" class="col-12">
      <div class="d-flex flex-row flex-wrap gap-3">
        <div
          v-for="assignment in filteredAssignments"
          :key="assignment.id"
          class="ats-card ats-card-top-success"
          style="min-width: 350px; width: fit-content"
        >
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 class="fs-6 fw-semibold text-dark mb-1">
                {{
                  assignment.resume?.name ||
                  assignment.candidate_name ||
                  "Unknown Candidate"
                }}
              </h4>
              <span
                class="badge-ats"
                :class="'badge-ats-' + assignment.interviewer_status"
                >{{
                  (assignment.interviewer_status || "pending").replace(
                    /_/g,
                    " "
                  )
                }}</span
              >
            </div>
            <div v-if="assignment.job_description" class="text-muted small">
              {{ assignment.job_description.title }}
            </div>
          </div>
          <div class="info-row-ats">
            <span class="info-label-ats">Email:</span>
            <span class="info-value-ats">{{
              assignment.resume?.email || assignment.email || "N/A"
            }}</span>
          </div>
          <div class="info-row-ats">
            <span class="info-label-ats">Contact:</span>
            <span class="info-value-ats">{{
              assignment.resume?.phone || assignment.contact_number || "N/A"
            }}</span>
          </div>
          <div v-if="assignment.interview_date" class="info-row-ats">
            <span class="info-label-ats">Interview:</span>
            <span class="info-value-ats">{{
              formatDateTime(assignment.interview_date)
            }}</span>
          </div>
          <div v-if="assignment.interviewer_feedback" class="mt-3 pt-3 border-top">
            <strong class="small text-dark">Feedback Submitted</strong>
            <div class="row g-2 mt-2">
              <div
                v-for="([key, rating]) in Object.entries(
                  assignment.interviewer_feedback
                ).filter(
                  ([k, v]) =>
                    k !== 'interviewer_remarks' && typeof v === 'number'
                )"
                :key="key"
                class="col-6"
              >
                <div class="d-flex justify-content-between small p-2 bg-light rounded-2">
                  <span class="text-muted">{{ key.replace(/_/g, " ") }}:</span>
                  <span class="text-primary fw-semibold">{{ rating }}/10</span>
                </div>
              </div>
            </div>
            <div v-if="assignment.interviewer_feedback.interviewer_remarks" class="mt-3">
              <strong class="small text-dark">Remarks:</strong>
              <p class="small text-muted mt-1 mb-0">
                {{ assignment.interviewer_feedback.interviewer_remarks }}
              </p>
            </div>
          </div>
          <div class="d-flex gap-2 mt-3 pt-3 border-top">
            <button
             v-if="!disableEditButton(assignment)"
              @click="openFeedbackModal(assignment)"
                :disabled="disableEditButton(assignment)"
              class="btn-ats-secondary btn-ats-sm"
            >
              View/Edit Feedback
            </button>
            <button
              @click="viewCandidateDetails(assignment)"
              class="btn-ats-secondary btn-ats-sm"
            >
              View Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Pagination -->
  <div
    v-if="pagination.totalPages > 1"
    class="d-flex justify-content-center align-items-center gap-3 mt-4 pt-4 border-top"
  >
    <button
      @click="goToPage(pagination.page - 1)"
      :disabled="pagination.page === 1 || loading"
      class="btn-ats-secondary btn-ats-sm"
    >
      Previous
    </button>
    <span class="text-muted small">
      Page {{ pagination.page }} of {{ pagination.totalPages }} ({{
        pagination.total
      }}
      total assignments)
    </span>
    <button
      @click="goToPage(pagination.page + 1)"
      :disabled="pagination.page >= pagination.totalPages || loading"
      class="btn-ats-secondary btn-ats-sm"
    >
      Next
    </button>
  </div>

  <!-- Feedback Modal -->
  <div
    v-if="showFeedbackModal && selectedAssignment"
    class="modal-overlay-ats"
    @click="showFeedbackModal = false"
  >
    <div class="modal-content-ats" style="max-width: 900px" @click.stop>
      <div class="modal-header-ats">
        <h2 class="fs-4 fw-semibold">Interview Feedback</h2>
        <button @click="showFeedbackModal = false" class="close-btn-ats">
          ×
        </button>
      </div>
      <div class="modal-body-ats">
        <form @submit.prevent="submitFeedback">
          <div class="mb-4">
            <h3 class="section-title-gradient">
              Candidate Ratings (1-10 scale)
            </h3>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label fw-medium small">Technical Skills</label>
                <input
                  v-model.number="feedbackData.ratings.technical_skills"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium small">Communication</label>
                <input
                  v-model.number="feedbackData.ratings.communication"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium small">Problem Solving</label>
                <input
                  v-model.number="feedbackData.ratings.problem_solving"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium small">Cultural Fit</label>
                <input
                  v-model.number="feedbackData.ratings.cultural_fit"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium small">Experience Relevance</label>
                <input
                  v-model.number="feedbackData.ratings.experience_relevance"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-medium small">Overall Assessment</label>
                <input
                  v-model.number="feedbackData.ratings.overall"
                  type="number"
                  min="1"
                  max="10"
                  class="form-control-ats"
                  required
                />
              </div>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="section-title-gradient">Final Decision</h3>
            <div class="mb-3">
              <label class="form-label fw-medium small">Status *</label>
              <select
                v-model="feedbackData.status"
                required
                class="form-select-ats"
                @change="onStatusChange"
              >
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div v-if="feedbackData.status === 'on_hold'" class="mb-3">
              <label class="form-label fw-medium small">Hold Reason *</label>
              <textarea
                v-model="feedbackData.hold_reason"
                required
                rows="4"
                class="form-control-ats form-textarea-ats"
                placeholder="Please provide a reason..."
              ></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label fw-medium small">Remarks</label>
              <textarea
                v-model="feedbackData.remarks"
                rows="4"
                class="form-control-ats form-textarea-ats"
                placeholder="Additional remarks (optional)"
              ></textarea>
            </div>
          </div>

          <div class="d-flex gap-3 justify-content-end">
            <button
              type="button"
              @click="showFeedbackModal = false"
              class="btn-ats-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="btn-ats-primary"
            >
              <span v-if="submitting">Submitting...</span>
              <span v-else>Submit Feedback</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { formatDateTime } from '../utils/datetimeUtils';
import { useLoader } from '../composables/useLoader';
import moment from 'moment';

const router = useRouter();
const route = useRoute();
const { showLoader, hideLoader } = useLoader();

/* ---------------- State ---------------- */
const showFeedbackModal = ref(false);
const selectedAssignment = ref(null);
const submitting = ref(false);
const feedbackData = ref({
  ratings: {
    technical_skills: null,
    communication: null,
    problem_solving: null,
    cultural_fit: null,
    experience_relevance: null,
    overall: null
  },
  status: 'pending',
  hold_reason: '',
  remarks: ''
});

const assignments = ref([]);
const loading = ref(false);
const error = ref(null);
const page = ref(1);
const limit = ref(10);
const statusFilter = ref("");
const MAX_EDIT_MINUTES = 7 * 24 * 60; 

const pagination = ref({
  page: page,
  limit: limit,
  total: 0,
  totalPages: 0
});

/* ---------------- Computed ---------------- */
const decision = computed(() => route.query.decision || 'pending');


const disableEditButton = (assignment) => {
  if (!assignment?.interview_date) return true;

  const interviewUtc = moment.utc(assignment.interview_date);
  const nowUtc = moment.utc();

  return nowUtc.diff(interviewUtc, 'minutes') > MAX_EDIT_MINUTES;
};


const filteredAssignments = computed(() => {
  if (decision.value === 'pending') {
    return assignments.value.filter(a => !a.interviewer_feedback);
  }
  if (decision.value === 'complete') {
    return assignments.value.filter(a => a.interviewer_feedback);
  }
  return assignments.value;
});

/* ---------------- API ---------------- */
const fetchAssignments = async () => {
  loading.value = true;
  error.value = null;
  showLoader('Loading Assignments', 'Fetching interview assignments...');

  try {
    const params = new URLSearchParams({
      decision: decision.value,
      page: page.value,
      limit: limit.value
    });

    if (statusFilter.value) {
      params.append('status', statusFilter.value);
    }

    const res = await axios.get(
      `${API_BASE_URL}/interviews/my-assignments/decision?${params}`
    );

    if (res.data.success) {
      assignments.value = res.data.data || [];
      pagination.value = res.data.pagination;
    }
  } catch (e) {
    error.value = 'Failed to fetch assignments.';
  } finally {
    loading.value = false;
    hideLoader();
  }
};

/* ---------------- Handlers ---------------- */
const onStatusFilterChange = () => {
  page.value = 1; // Reset page

  router.push({
    query: {
      ...route.query,
      page: 1,
      limit: limit.value,
      status: statusFilter.value || ''
    }
  });
};

const onLimitChange = () => {
  page.value = 1; // reset to first page

  router.push({
    query: {
      ...route.query,
      page: 1,
      limit: limit.value
    }
  });
};

const goToPage = (p) => {
  if (p < 1 || p > pagination.value.totalPages) return;

  page.value = p;
  router.push({
    query: {
      ...route.query,
      page: p,
      limit: limit.value
    }
  });
};

const onBack = () => router.push('/');

const viewCandidateDetails = (assignment) => {
  if (assignment.resume_id) {
    router.push({
      name: 'ResumeDetail',
      params: {
        jobId: assignment.job_description_id,
        evaluationId: assignment.id
      }
    });
  }
};

const openFeedbackModal = (assignment) => {
  selectedAssignment.value = assignment;
  if (assignment.interviewer_feedback) {
    feedbackData.value = {
      ratings: { ...assignment.interviewer_feedback },
      status: assignment.interviewer_status || 'pending',
      hold_reason: assignment.interviewer_hold_reason || '',
      remarks: assignment.interviewer_feedback.interviewer_remarks || ''
    };
  } else {
    feedbackData.value = {
      ratings: {
        technical_skills: null,
        communication: null,
        problem_solving: null,
        cultural_fit: null,
        experience_relevance: null,
        overall: null
      },
      status: 'pending',
      hold_reason: '',
      remarks: ''
    };
  }
  showFeedbackModal.value = true;
};

const onStatusChange = () => {
  if (feedbackData.value.status !== 'on_hold') {
    feedbackData.value.hold_reason = '';
  }
};

const submitFeedback = async () => {
  if (feedbackData.value.status === 'on_hold' && !feedbackData.value.hold_reason.trim()) {
    alert('Please provide a reason for putting the candidate on hold');
    return;
  }

  submitting.value = true;
  showLoader('Submitting Feedback', 'Saving interview evaluation...');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/evaluations/${selectedAssignment.value.id}/interviewer-feedback`,
      {
        ratings: {
          ...feedbackData.value.ratings,
          interviewer_remarks: feedbackData.value.remarks
        },
        status: feedbackData.value.status,
        hold_reason: feedbackData.value.status === 'on_hold' ? feedbackData.value.hold_reason : null
      }
    );

    if (response.data.success) {
      await fetchAssignments();
      showFeedbackModal.value = false;
      alert('Feedback submitted successfully!');
    }
  } catch (err) {
    console.error('Error submitting feedback:', err);
    alert('Failed to submit feedback. Please try again.');
  } finally {
    submitting.value = false;
    hideLoader();
  }
};

/* ---------------- Sync route ---------------- */
watch(
  () => route.query,
  (q) => {
    page.value = parseInt(q.page) || 1;
    limit.value = parseInt(q.limit) || 10;
    statusFilter.value = q.status || '';
    fetchAssignments();
  }
);

onMounted(() => {
  if (route.query.page) {
    page.value = parseInt(route.query.page) || 1;
  }

  if (route.query.limit) {
    limit.value = parseInt(route.query.limit) || 10;
  }

  if (route.query.status) {
    statusFilter.value = route.query.status || '';
  }

  fetchAssignments();
});
</script>
