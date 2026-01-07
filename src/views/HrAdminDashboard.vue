<template>
   <div v-if="loading" class="loading-state-ats">Loading dashboard...</div>
   <!-- Page Header -->
   <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
      <div>
         <h4 class="mb-1">{{user.role}} Interview Dashboard</h4>
      </div>
      <div class="gap-2 d-flex align-items-center flex-wrap">
         <div id="reportrange" class="reportrange-picker d-flex align-items-center shadow">
            <i class="ti ti-calendar-due text-dark fs-14 me-1"></i><span class="reportrange-picker-field">9 Jun 25 - 9 Jun 25</span>
         </div>
         <a href="javascript:void(0);" class="btn btn-icon btn-outline-light shadow" data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Refresh" data-bs-original-title="Refresh"><i class="ti ti-refresh"></i></a>
         <a href="javascript:void(0);" class="btn btn-icon btn-outline-light shadow" data-bs-toggle="tooltip" data-bs-placement="top" aria-label="Collapse" data-bs-original-title="Collapse" id="collapse-header"><i class="ti ti-transition-top"></i></a>
      </div>
   </div>
   <!-- End Page Header -->
   <!-- Start Welcome Wrap -->
   <div class="welcome-wrap mb-4">
      <div class=" d-flex align-items-center justify-content-between flex-wrap gap-3 bg-dark rounded p-4">
         <div>
            <h2 class="mb-1 text-white fs-24">Welcome Back, {{ user?.full_name }} </h2>
            <p class="text-light fs-14 mb-0">{{ totalInterviews }} Interviews Scheduled For Today !!!</p>
         </div>
         <div class="d-flex align-items-center flex-wrap gap-2">
            <a href="javascript:;" class="btn btn-primary btn-sm">View All New Candidates</a>
            <a href="Javascript:;" class="btn btn-light btn-sm">View All</a>
         </div>
      </div>
   </div>
   <!-- Endc Welcome Wrap -->
   <div class="row row-gap-3 mb-4">
      <div class="col-xl-3 col-sm-6 d-flex">
         <div class="card flex-fill mb-0 position-relative overflow-hidden">
            <div class="card-body position-relative z-1">
               <div class="d-flex align-items-start justify-content-between">
                  <div class="d-flex align-items-start justify-content-between">
                     <div>
                        <h2 class="mb-1 fs-30">{{ totalInterviews }}</h2>
                        <p class="fs-16 mb-1">Today's Interviews</p>                        
                        <!-- <p class="text-success mb-0 fs-13"> <i class="ti ti-arrow-bar-up me-1"></i>5.62%<span class="text-body ms-1">from last month</span></p> -->
                     </div>
                  </div>
                  <div class="d-flex align-items-center justify-content-between">
                     <span class="avatar avatar-md rounded-circle bg-soft-primary border border-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#096fc5">
                        <rect x="3" y="4" width="18" height="17" rx="2" ry="2" fill="none" stroke="#096fc5" stroke-width="2"/>
                        <line x1="3" y1="9" x2="21" y2="9" stroke="#096fc5" stroke-width="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="#096fc5" stroke-width="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="#096fc5" stroke-width="2"/>
                        <circle cx="12" cy="14" r="2"/>
                        <path d="M9 18c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5"/>
                        </svg>
                     </span>
                  </div>
               </div>
            </div>
            <img :src="widgeticon" alt="elemnt-04" class="img-fluid position-absolute top-0 Start-0">
         </div>
      </div>
      <div class="col-xl-3 col-sm-6 d-flex">
         <div class="card flex-fill mb-0 position-relative overflow-hidden">
            <div class="card-body position-relative z-1">
               <div class="d-flex align-items-start justify-content-between">
                  <div class="d-flex align-items-start justify-content-between">
                     <div>
                        <h2 class="mb-1 fs-30">{{ newCandidates.length }}</h2>
                        <p class="fs-16 mb-1">New Candidates</p>
                        <!-- <p class="text-danger mb-0 fs-13"> <i class="ti ti-arrow-bar-down me-1"></i>12%<span class="text-body ms-1">from last month</span></p> -->
                     </div>
                  </div>
                  <div class="d-flex align-items-center justify-content-between">
                     <span class="avatar avatar-md rounded-circle bg-soft-success border border-success">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#27ae60">
                     <circle cx="10" cy="8" r="4"/>
                     <path d="M3 20c0-4 4-6 7-6s7 2 7 6"/>
                     <circle cx="18" cy="6" r="4"/>
                     <line x1="18" y1="4.5" x2="18" y2="7.5" stroke="#fff" stroke-width="2"/>
                     <line x1="16.5" y1="6" x2="19.5" y2="6" stroke="#fff" stroke-width="2"/>
                     </svg>

                     </span>
                  </div>
               </div>
            </div>
            <img :src="widgeticon2" alt="elemnt-04" class="img-fluid position-absolute top-0 Start-0">
         </div>
      </div>
      <div class="col-xl-3 col-sm-6 d-flex">
         <div class="card flex-fill mb-0 position-relative overflow-hidden">
            <div class="card-body position-relative z-1">
               <div class="d-flex align-items-start justify-content-between">
                  <div class="d-flex align-items-start justify-content-between">
                     <div>                        
                        <h2 class="mb-1 fs-30">{{ totalJobPositions }}</h2>
                        <p class="fs-16 mb-1">Open Positions</p>
                        <!-- <p class="text-success mb-0 fs-13"> <i class="ti ti-arrow-bar-up me-1"></i>6%<span class="text-body ms-1">from last month</span></p> -->
                     </div>
                  </div>
                  <div class="d-flex align-items-center justify-content-between">
                     <span class="avatar avatar-md rounded-circle bg-soft-warning border border-warning">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#e2b93b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="7" width="18" height="13" rx="2"/>
                        <path d="M9 7V5a3 3 0 0 1 6 0v2"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="12" y1="15" x2="12" y2="18"/>
                        <line x1="10.5" y1="16.5" x2="13.5" y2="16.5"/>
                        </svg>
                     </span>
                  </div>
               </div>
            </div>
            <img :src="widgeticon3" alt="elemnt-04" class="img-fluid position-absolute top-0 Start-0">
         </div>
      </div>
   </div>
   <div class="row">
      <div class="col-xxl-4 col-xl-12 d-flex">
         <div class="card flex-fill">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
               <h5 class="mb-0 fs-16 fw-bold">Today's Scheduled Interviews</h5>
               <a href="javascript:;" class="btn btn-primary btn-xs">View All</a>
            </div>
            <div class="card-body pb-2">
               <!-- Item-1 -->
               <template v-if="todayInterviews.length === 0">
                  <div class="text-center py-4 text-muted">
                     <i class="fas fa-calendar-times fs-1 opacity-50 mb-3 d-block"></i>
                     <p class="mb-0">No interviews scheduled for today</p>
                  </div>
               </template>
               <template v-else>
                  <div  v-for="interview in todayInterviews"
                     :key="interview.id" class="d-sm-flex justify-content-between flex-wrap mb-3 iconclrbx1">
                     <div class="d-flex align-items-center">
                        <a href="javscript:void(0);" class="avatar avatar-md border rounded-circle flex-shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#ffffff">
                              <circle cx="12" cy="8" r="4"/>
                              <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                           </svg>
                        </a>
                        <div class="ms-2 flex-fill">
                           <h6 class="fw-medium text-truncate mb-1 fs-14">{{ interview.name || 'N/A' }}</h6>
                           <p class="fs-13 mb-0">Job Description:- {{ interview.position || 'N/A' }}</p>
                           <p class="fs-13 mb-0">Interviewer:- {{ interview.interviewer || 'N/A' }}</p>
                           
                        </div>
                     </div>
                     <div class="text-sm-end mb-0">
                        <h6 class="fw-medium text-truncate mb-1 fs-14">{{ interview.time }}</h6>
                        <p class="fs-13 mb-0">{{ interview.status === 'ongoing' ? 'In Progress' : 'Scheduled' }}</p>
                        <h6 class="fw-medium text-truncate mb-1 fs-13 mt-2"><a
                              v-if="!hideJoinButton(interview)"
                              :href="interview.interview_start_url"
                              target="_blank"
                              >
                           <span class="badge bg-teal">{{ getInterviewButtonText(interview) }}</span>    
                           
                           </a></h6>
                     </div>
                  </div>
               </template>
            </div>
         </div>
      </div>
      <div class="col-xxl-4 col-xl-12 d-flex">
         <div class="card flex-fill">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
               <h5 class="mb-0 fs-16 fw-bold">Ongoing Interviews</h5>
               <a href="javascript:;" @click="refreshOngoing" class="btn btn-primary btn-xs">Refresh</a>
            </div>
            <div class="card-body pb-2">
               <!-- Item-1 -->
               <template v-if="ongoingInterviews.length === 0">
                  <div class="text-center py-4 text-muted">
                     <i class="fas fa-clock fs-1 opacity-50 mb-3 d-block"></i>
                     <p class="mb-0">No ongoing interviews at the moment</p>
                  </div>
               </template>
               <template v-else>
                  <div  v-for="interview in ongoingInterviews"
                     :key="interview.id" class="d-sm-flex justify-content-between flex-wrap mb-3 iconclrbx2">
                     <div class="d-flex align-items-center">
                        <a href="javscript:void(0);" class="avatar avatar-md border rounded-circle flex-shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#ffffff">
                              <circle cx="12" cy="8" r="4"/>
                              <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                           </svg>
                        </a>
                        <div class="ms-2 flex-fill">
                           <h6 class="fw-medium text-truncate mb-1 fs-14">{{ interview.name || 'N/A' }}</h6>
                           <p class="fs-13 mb-0">Job Description:- {{ interview.position || 'N/A' }}</p>
                           <p class="fs-13 mb-0">Interviewer:- {{ interview.interviewer || 'N/A' }}</p>
                           
                        </div>
                     </div>
                     <div class="text-sm-end mb-0">
                        <h6 class="fw-medium text-truncate mb-1 fs-14">{{ interview.time }}</h6>
                        <p class="fs-13 mb-0">In Progress</p>
                        <h6 class="fw-medium text-truncate mb-1 fs-13 mt-2"><a
                              :href="interview.interview_start_url"
                              target="_blank"
                              >  
                              <span class="badge bg-success"> {{ getInterviewButtonText(interview) }}</span>   
                           </a></h6>
                     </div>
                  </div>
               </template>
            </div>
         </div>
      </div>
      <div class="col-xxl-4 col-xl-12 d-flex">
         <div class="card flex-fill">
            <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
               <h5 class="mb-0 fs-16 fw-bold">New Candidates</h5>
               <router-link to="/resumes" class="btn btn-primary btn-xs">
                  View All
               </router-link>
            </div>
            <div class="card-body pb-2">
               <template v-if="newCandidates.length === 0">
                  <div class="text-center py-4 text-muted">
                     <i class="fas fa-users fs-1 opacity-50 mb-3 d-block"></i>
                     <p class="mb-0">No new candidates</p>
                  </div>
               </template>
               <template v-else>
                  <div  v-for="cand in newCandidates" :key="cand.id" class="d-sm-flex justify-content-between flex-wrap mb-3 iconclr">
                     <div class="d-flex align-items-center">
                        <a href="javscript:void(0);" class="avatar avatar-md border rounded-circle flex-shrink-0">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="#ffffff">
                              <circle cx="12" cy="8" r="4"/>
                              <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
                           </svg>
                        </a>
                        <div class="ms-2 flex-fill">
                           <h6 class="fw-medium text-truncate mb-1 fs-14">{{ cand.name || 'N/A' }}</h6>
                           <p class="fs-13 mb-0">Email:- {{ cand.email || 'N/A' }}</p>
                           <p class="fs-13 mb-0">Applied:- {{ cand.appliedDate || 'N/A' }}</p>
                        </div>
                     </div>
                     <div class="text-sm-end mb-0">
                        <h6 class="fw-medium text-truncate mb-1 fs-14">{{ formatExperience(cand.experience) }}</h6>
                        <p class="fs-13 mb-0">New Candidates</p>
                     </div>
                  </div>
               </template>
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
import widgeticon from '../img/icons/elemnt-01.svg';
import widgeticon2 from '../img/icons/elemnt-02.svg';
import widgeticon3 from '../img/icons/elemnt-03.svg';

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
