<template>
  <div class="py-4">
    <div v-if="loading" class="loading-state-ats">Loading dashboard...</div>
    <header class="mb-4">
      <h1 class="page-title-ats">{{user.role}} Interview Dashboard</h1>
    </header>

    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="stat-card-ats">
          <div class="stat-info-ats">
            <h3 class="fs-2 fw-bold text-dark mb-1">{{ totalInterviews }}</h3>
            <p class="text-muted mb-0">Today's Interviews</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card-ats">
          <div class="stat-info-ats">
            <h3 class="fs-2 fw-bold text-dark mb-1">{{ newCandidates.length }}</h3>
            <p class="text-muted mb-0">New Candidates</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="stat-card-ats">
          <div class="stat-info-ats">
            <h3 class="fs-2 fw-bold text-dark mb-1">{{ totalJobPositions }}</h3>
            <p class="text-muted mb-0">Open Positions</p>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <!-- Today's Interviews -->
      <div class="col-lg-4">
        <div class="ats-card h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fs-5 fw-bold mb-0">Today's Scheduled Interviews</h2>
            <button class="btn-back small">View All</button>
          </div>
          <div class="d-flex flex-column gap-3">
            <template v-if="todayInterviews.length === 0">
              <div class="text-center py-4 text-muted">
                <i class="fas fa-calendar-times fs-1 opacity-50 mb-3 d-block"></i>
                <p class="mb-0">No interviews scheduled for today</p>
              </div>
            </template>
            <template v-else>
              <div
                v-for="interview in todayInterviews"
                :key="interview.id"
                class="ats-card ats-card-top-danger p-3"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="info-row-ats"><span class="info-label-ats">Candidate:</span><span class="info-value-ats">{{ interview.name || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Job Discription:</span><span class="info-value-ats">{{ interview.position || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Interviewer:</span><span class="info-value-ats">{{ interview.interviewer || 'N/A' }}</span></div>
                                <a
                                v-if="!hideJoinButton(interview)"
    :href="interview.interview_start_url"
    target="_blank"
  >
    <button class="btn-ats-primary btn-ats-sm">
      {{ getInterviewButtonText(interview) }}
    </button>
  </a>
                  </div>
                  <div class="interview-time-badge-inline">
                    <span class="time">{{ interview.time }}</span>
                    <span class="status">{{ interview.status === 'ongoing' ? 'In Progress' : 'Scheduled' }}</span>
                  </div>
        
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Ongoing Interviews -->
      <div class="col-lg-4">
        <div class="ats-card h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fs-5 fw-bold mb-0">Ongoing Interviews</h2>
            <button class="btn-back small" @click="refreshOngoing">Refresh</button>
          </div>
          <div class="d-flex flex-column gap-3">
            <template v-if="ongoingInterviews.length === 0">
              <div class="text-center py-4 text-muted">
                <i class="fas fa-clock fs-1 opacity-50 mb-3 d-block"></i>
                <p class="mb-0">No ongoing interviews at the moment</p>
              </div>
            </template>
            <template v-else>
              <div
                v-for="interview in ongoingInterviews"
                :key="interview.id"
                class="ats-card ats-card-top-primary p-3"
              >
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="info-row-ats"><span class="info-label-ats">Candidate:</span><span class="info-value-ats">{{ interview.name || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Job Discription:</span><span class="info-value-ats">{{ interview.position || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Interviewer:</span><span class="info-value-ats">{{ interview.interviewer || 'N/A' }}</span></div>
                                              <a
    :href="interview.interview_start_url"
    target="_blank"
  >
    <button class="btn-ats-primary btn-ats-sm">
      {{ getInterviewButtonText(interview) }}
    </button>
  </a>
                  </div>
                  <div class="interview-time-badge-inline in-progress">
                    <span class="time">{{ interview.time }}</span>
                    <span class="status">In Progress</span>
                  </div>
      
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- New Candidates -->
      <div class="col-lg-4">
        <div class="ats-card h-100">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fs-5 fw-bold mb-0">New Candidates</h2>
            <router-link to="/resumes">
              <button class="btn-back small">View All</button>
            </router-link>
          </div>
          <div class="d-flex flex-column gap-3">
            <template v-if="newCandidates.length === 0">
              <div class="text-center py-4 text-muted">
                <i class="fas fa-users fs-1 opacity-50 mb-3 d-block"></i>
                <p class="mb-0">No new candidates</p>
              </div>
            </template>
            <template v-else>
              <div v-for="cand in newCandidates" :key="cand.id" class="ats-card ats-card-top-success p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="info-row-ats"><span class="info-label-ats">Name:</span><span class="info-value-ats">{{ cand.name || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Email:</span><span class="info-value-ats">{{ cand.email || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Applied:</span><span class="info-value-ats">{{ cand.appliedDate || 'N/A' }}</span></div>
                    <div class="info-row-ats"><span class="info-label-ats">Experience:</span><span class="info-value-ats">{{ formatExperience(cand.experience) }}</span></div>
                  </div>
                  <div class="d-none d-md-flex status-pill-available flex-column align-items-center">
                    <span class="small">NEW</span>
                    <span class="small">Candidates</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import moment from 'moment';
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';
import { useAuth } from '../composables/useAuth';

const { showLoader, hideLoader } = useLoader();
const { user } = useAuth();

const todayInterviews = ref([]);
const ongoingInterviews = ref([]); 
const totalInterviews = ref(0);
const totalJobPositions = ref(0);
const loading = ref(false);
const newCandidates = ref([]);

function formatTimeFromISO(isoString) {
  if (!isoString) return '';
  return moment(isoString).format('h:mm A');
}

function formatDate(isoString) {
  if (!isoString) return '';
  return moment(isoString).format('MMMM D, YYYY');
}
 
 function hideJoinButton(assignment){
         const nowUtc = new Date(); // current UTC
    const interviewendUtc = new Date(assignment.end_time);

     if(nowUtc > interviewendUtc)
       {
          return true
       }
       return false
 }
  function  getInterviewButtonText(assignment) {
    if (!assignment.start_time) {
      return 'Start Interview';
    }

    const nowUtc = new Date(); // current UTC
    const interviewUtc = new Date(assignment.start_time);
    console.log(assignment.start_time , "assignment.interview_date")
    console.log(interviewUtc , "interviewUtc")
    console.log(nowUtc , "nowUtc")
    // Before interview time
    if (nowUtc < interviewUtc) {
      return 'Start Interview';
    }
    // At or after interview time
    return 'Join Interview';
  }

function computeStatusFromISOWithMoment(start_time, end_time) {
  const start = moment(start_time);
  const end = moment(end_time);
  const now = moment();
  return now.isBetween(start, end, null, '[]') ? 'ongoing' : 'scheduled';
}

const getTodayInterview = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/interviews/today-avaiable-interviews`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response?.data?.success && Array.isArray(response.data.data)) {
      const mapped = response.data.data.map((item, idx) => {
        const id = item.id ?? `${item.candidate_name}-${idx}-${item.interview_date}`;
        const time = formatTimeFromISO(item.start_time);
        const date = formatDate(item.start_time);
        const status = computeStatusFromISOWithMoment(item.start_time, item.end_time);

        return {
          id,
          name: item.candidate_name || 'Unknown Candidate',
          position: item.title || 'Unknown Position',
          interviewer: item.interviewer_name || 'TBD',
          time,
          date,
          rawDate: item.interview_date,
          type: item.type || '',
          status,
          start_time: item.start_time,
          end_time: item.end_time,
          interview_start_url : item.interview_start_url
        };
      });
      totalInterviews.value = response?.data?.count || 0;
      todayInterviews.value = mapped.filter(i => i.status === 'scheduled');
      ongoingInterviews.value = mapped.filter(i => i.status === 'ongoing');
    } else {
      todayInterviews.value = [];
      ongoingInterviews.value = [];
    }
  } catch (error) {
    console.error('Error fetching today interviews:', error);
    todayInterviews.value = [];
    ongoingInterviews.value = [];
  }
};

const fetchJobDescriptions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/job-descriptions`);
    if (response.data.success) {
      totalJobPositions.value = response.data.data?.length || 0;
    }
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
  }
};

const getLatestCandidates = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/resumes/new/new-resumes`);

    if (response?.data?.success && Array.isArray(response.data.data)) {
      const mapped = response.data.data.map((item, idx) => {
        const id = item.id ?? `${item.candidate_name}-${idx}`;
        const appliedDate = formatDate(item.created_at);
        return {
          id,
          name: item.name || 'Unknown Candidate',
          email: item.email || 'Unknown Position',
          appliedDate,
          experience: item.total_experience || 'N/A',
          initials: item.name ? item.name.split(' ').map(n => n[0]).join('') : 'NA'
        };
      });
      newCandidates.value = mapped;
    } else {
      newCandidates.value = [];
    }
  } catch (error) {
    console.error('Error fetching candidates:', error);
  }
};

const formatExperience = (years) => {
  if (!years && years !== 0) return 'N/A';
  const totalYears = parseFloat(years);
  if (isNaN(totalYears)) return 'N/A';
  
  const wholeYears = Math.floor(totalYears);
  const months = Math.round((totalYears - wholeYears) * 12);
  
  if (wholeYears === 0 && months === 0) return 'Less than 1 month';
  if (wholeYears === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
  if (months === 0) return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
  return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
};

onMounted(async () => {
  showLoader('Loading Dashboard...');
  await fetchJobDescriptions();
  await getLatestCandidates();
  await getTodayInterview();
  hideLoader();
});

function refreshOngoing() {
  const allInterviews = [...todayInterviews.value, ...ongoingInterviews.value];
  const nowOngoing = [];
  const nowScheduled = [];
  
  allInterviews.forEach(interview => {
    const status = computeStatusFromISOWithMoment(interview.start_time, interview.end_time);
    interview.status = status;
    if (status === 'ongoing') {
      nowOngoing.push(interview);
    } else {
      nowScheduled.push(interview);
    }
  });
  
  ongoingInterviews.value = nowOngoing;
  todayInterviews.value = nowScheduled;
}
</script>
