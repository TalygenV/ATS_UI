<template>
  <div class="container">
        <div v-if="loading" class="loading">Loading dashboard...</div>
    <header>
      <div class="logo">
        <i class="fas fa-user-tie"></i>
        <span>{{user.role}} Interview Dashboard</span>
      </div>
      <div class="header-right">
        <div class="date-display" id="current-date">{{ currentDate }}</div>
        <div class="user-profile">
          <!-- <img :src="profileAvatar" alt="HR Manager" /> -->
          <span>{{ user.full_name }}</span>
        </div>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-icon interview">
          <i class="fas fa-calendar-day"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalInterviews }}</h3>
          <p>Today's Interviews</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon candidate">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ newCandidates.length }}</h3>
          <p>New Candidates</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon position">
          <i class="fas fa-briefcase"></i>
        </div>
        <div class="stat-info">
          <h3>{{totalJobPositions}}</h3>
          <p>Open Positions</p>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="card today-interviews">
        <div class="card-header">
          <h2 class="card-title">Today's Scheduled Interviews</h2>
          <button class="card-action">View All</button>
        </div>
        <div class="interview-list">
          <template v-if="todayInterviews.length === 0">
            <div class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>No interviews scheduled for today</p>
            </div>
          </template>

          <template v-else>
            <div
              v-for="interview in todayInterviews"
              :key="interview.id"
              class="interview-item"
              :class="{ ongoing: interview.status === 'ongoing' }"
            >
              <div class="interview-info">
                <h4>Candidate : {{ interview.name }}</h4>
                <p><i class="fas fa-briefcase"></i> Job Discription : {{ interview.position }}</p>
                <p><i class="fas fa-user-tie"></i>
                   Interviewer :  {{ interview.interviewer }} 
                </p>
              </div>
              <div class="interview-time">
                <span>{{ interview.time }}</span>
                <span>{{ interview.status === 'ongoing' ? 'In Progress' : 'Scheduled' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="card ongoing-interviews">
        <div class="card-header">
          <h2 class="card-title">Ongoing Interviews</h2>
          <button class="card-action" @click="refreshOngoing">Refresh</button>
        </div>
        <div class="interview-list">
          <template v-if="ongoingInterviews.length === 0">
            <div class="empty-state">
              <i class="fas fa-clock"></i>
              <p>No ongoing interviews at the moment</p>
            </div>
          </template>

          <template v-else>
            <div
              v-for="interview in ongoingInterviews"
              :key="interview.id"
              class="interview-item ongoing"
            >
              <div class="interview-info">
                <h4>{{ interview.name }}</h4>
                <p><i class="fas fa-briefcase"></i> {{ interview.position }}</p>
                <p><i class="fas fa-user-tie"></i> {{ interview.interviewer }} • {{ interview.type }}</p>
              </div>
              <div class="interview-time">
                <span>{{ interview.time }}</span>
                <span>In Progress</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="card new-candidates">
        <div class="card-header">
          <h2 class="card-title">New Candidates</h2>
          <router-link to="/resumes">
          <button class="card-action">View All</button>
          </router-link>
        </div>
        <div class="candidate-list">
          <template v-if="newCandidates.length === 0">
            <div class="empty-state">
              <i class="fas fa-users"></i>
              <p>No new candidates</p>
            </div>
          </template>

          <template v-else>
            <div v-for="cand in newCandidates" :key="cand.id" class="candidate-item">
              <!-- <div
                class="candidate-avatar"
                :style="{ backgroundColor: cand.bg + '20', color: cand.bg }
                "
              >
                {{ cand.initials }}
              </div> -->
              <div class="candidate-details">
                <h4>{{ cand.name }}</h4>
                <p><i class="fas fa-briefcase"></i> Email:  {{ cand.email }}</p>
                <p><i class="fas fa-calendar-alt"></i> Applied: {{ cand.appliedDate }}</p>
                <p><i class="fas fa-chart-line"></i> {{ formatExperience(cand.experience) }} experience</p>
              </div>
              <div class="status-badge status-new">NEW</div>
            </div>
          </template>
        </div>
      </div>

      <!-- <div class="card schedule-interview">
        <div class="card-header">
          <h2 class="card-title">Schedule New Interview</h2>
        </div>
        <form @submit.prevent="scheduleInterview">
          <div class="form-row">
            <div class="form-group">
              <label for="candidate-name">Candidate Name</label>
              <input v-model="form.candidateName" type="text" id="candidate-name" class="form-control" placeholder="Enter candidate name" required />
            </div>

            <div class="form-group">
              <label for="position">Position</label>
              <select v-model="form.position" id="position" class="form-control" required>
                <option value="">Select position</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="UX Designer">UX Designer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Data Analyst">Data Analyst</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="interview-date">Interview Date</label>
              <input v-model="form.interviewDate" :min="minDate" type="date" id="interview-date" class="form-control" required />
            </div>

            <div class="form-group">
              <label for="interview-time">Interview Time</label>
              <input v-model="form.interviewTime" type="time" id="interview-time" class="form-control" required />
            </div>
          </div>

          <div class="form-group">
            <label for="interviewer">Interviewer</label>
            <input v-model="form.interviewer" type="text" id="interviewer" class="form-control" placeholder="Enter interviewer name" required />
          </div>

          <div class="form-group">
            <label for="interview-type">Interview Type</label>
            <select v-model="form.interviewType" id="interview-type" class="form-control" required>
              <option value="">Select interview type</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Managerial">Managerial</option>
              <option value="Cultural Fit">Cultural Fit</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Schedule Interview</button>
        </form>
      </div> -->
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

// Profile
  const { showLoader, hideLoader } = useLoader();
       const { user  } = useAuth();


// Data refs used in template
const todayInterviews = ref([]);
const ongoingInterviews = ref([]); 
const totalInterviews = ref(0);
const totalJobPositions = ref(0)

const loading = ref(false);
const newCandidates = ref([]);

const currentDate = moment().format('dddd, MMMM D, YYYY');

function formatTimeFromISO(isoString) {
  if (!isoString) return '';
  return moment(isoString).format('h:mm A');
}

function formatDate(isoString) {
  if (!isoString) return '';
  return moment(isoString).format('MMMM D, YYYY');
}


function computeStatusFromISOWithMoment(start_time , end_time) {
  
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
      // Map server shape to UI shape
      const mapped = response.data.data.map((item, idx) => {
        const id = item.id ?? `${item.candidate_name}-${idx}-${item.interview_date}`;
        const time = formatTimeFromISO(item.start_time);
        const date = formatDate(item.start_time);
        const status = computeStatusFromISOWithMoment(item.start_time , item.end_time);

        return {
          id,
          name: item.candidate_name || 'Unknown Candidate',
          position: item.title || 'Unknown Position',
          interviewer: item.interviewer_name || 'TBD',
          time,       // displayed in the UI
          date,       // for optionally showing date
          rawDate: item.interview_date,
          type: item.type || '',
          status,
          start_time: item.start_time,   // Keep raw start time for refreshOngoing
          end_time: item.end_time         // Keep raw end time for refreshOngoing
        };
      });
       totalInterviews.value = response?.data?.count || 0;
      todayInterviews.value = mapped.filter(i => i.status === 'scheduled');

      // Filter ongoing using computed status (Moment-based)
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
       
      } finally {
      
        
      }
    }

const getLatestCandidates = async ()=> {
      
      try {
      
    const response = await axios.get(`${API_BASE_URL}/resumes/new/new-resumes`,);

      if (response?.data?.success && Array.isArray(response.data.data)) {
        // Map server shape to UI shape
        const mapped = response.data.data.map((item, idx) => {
          const id = item.id ?? `${item.candidate_name}-${idx}`;
          const appliedDate = formatDate(item.created_at);
          return {
            id,
            name: item.name || 'Unknown Candidate',
            email: item.email || 'Unknown Position',
            appliedDate,
            experience: item.total_experience  || 'N/A',
            initials: item.name ? item.name.split(' ').map(n => n[0]).join('') : 'NA',
            bg: ['#4361ee', '#3f37c9', '#4cc9f0', '#f72585', '#7209b7'][Math.floor(Math.random() * 5)]
          };
        });
        newCandidates.value = mapped;
      } else {
        newCandidates.value = [];
      }
      } catch (error) {
        
      }
}   

  const  formatExperience =(years)=> {
      if (!years && years !== 0) return 'N/A';
      const totalYears = parseFloat(years);
      if (isNaN(totalYears)) return 'N/A';
      
      const wholeYears = Math.floor(totalYears);
      const months = Math.round((totalYears - wholeYears) * 12);
      
      if (wholeYears === 0 && months === 0) return 'Less than 1 month';
      if (wholeYears === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
      if (months === 0) return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
      return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    }

onMounted(async () => {
  // fetch interviews
  showLoader('Loading Dashboard...');
   await fetchJobDescriptions()
   await getLatestCandidates()
  await getTodayInterview();
  hideLoader()
});

/** Manual refresh that re-evaluates ongoing interviews (useful if clock/time changes) */
function refreshOngoing() {
  // Get all interviews (both today and ongoing)
  const allInterviews = [...todayInterviews.value, ...ongoingInterviews.value];
  
  // Separate into ongoing and scheduled based on current time
  const nowOngoing = [];
  const nowScheduled = [];
  
  allInterviews.forEach(interview => {
    const status = computeStatusFromISOWithMoment(interview.start_time, interview.end_time);
    
    if (status === 'ongoing') {
      // Update the interview object status and move to ongoing
      interview.status = 'ongoing';
      nowOngoing.push(interview);
    } else {
      // Update the interview object status and move to scheduled
      interview.status = 'scheduled';
      nowScheduled.push(interview);
    }
  });
  
  // Update both arrays
  ongoingInterviews.value = nowOngoing;
  todayInterviews.value = nowScheduled;
  
  
}
</script>

<style scoped>
/* :root {
  --primary-color: #4361ee;
  --primary-light: #e6ebff;
  --secondary-color: #3f37c9;
  --success-color: #4cc9f0;
  --warning-color: #f72585;
  --dark-color: #2b2d42;
  --light-color: #f8f9fa;
  --gray-color: #adb5bd;
  --border-radius: 10px;
  --box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  --transition: all 0.3s ease;
} */

* { box-sizing: border-box; }

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Poppins', sans-serif;
  color: var(--dark-color);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.logo { display:flex; align-items:center; gap:10px; font-weight:700; font-size:1.8rem; color:#4361ee; }
.logo i { font-size:2rem; }
.logo span { color:#081d7c;  }

.header-right { display:flex; align-items:center; gap:20px; }
.date-display, .user-profile { background:white; padding:8px 15px; border-radius:var(--border-radius); box-shadow:var(--box-shadow); }
.user-profile { display:flex; align-items:center; gap:10px }
.user-profile img { width:35px; height:35px; border-radius:50%; object-fit:cover }

.dashboard-content { display:grid; grid-template-columns: repeat(12, 1fr); gap:25px; }
.card { background:white; border-radius:var(--border-radius); box-shadow:var(--box-shadow); padding:25px; transition:var(--transition); border-top:4px solid var(--primary-color); }
.card:hover { transform:translateY(-5px); box-shadow:0 10px 20px rgba(0,0,0,0.1); }
.card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px }
.card-title { font-size:1.3rem; font-weight:600 }
.card-action { color:var(--primary-color); background:none; border:none; font-size:0.9rem; font-weight:500; cursor:pointer }
.card-action:hover { color:var(--secondary-color) }

.today-interviews { grid-column: span 8 }
.ongoing-interviews { grid-column: span 4 }
.new-candidates { grid-column: span 6 }
.schedule-interview { grid-column: span 6 }

.interview-list { display:flex; flex-direction:column; gap:15px }
.interview-item { display:flex; justify-content:space-between; align-items:center; padding:15px; border-radius:var(--border-radius); background-color:var(--light-color); border-left:4px solid var(--primary-color) }
.interview-item.ongoing { border-left-color:var(--warning-color) }
.interview-info h4 { font-size:1rem; margin-bottom:5px }
.interview-info p { font-size:0.9rem; color:var(--gray-color); display:flex; align-items:center; gap:8px }
.interview-time { display:flex; flex-direction:column; align-items:center; background-color:var(--primary-light); padding:10px 15px; border-radius:var(--border-radius); min-width:100px }
.interview-time span:first-child { font-weight:600; color:var(--primary-color) }
.interview-time span:last-child { font-size:0.8rem; color:var(--gray-color) }

.candidate-list { display:flex; flex-direction:column; gap:15px }
.candidate-item { display:flex; align-items:center; gap:15px; padding:15px; border-radius:var(--border-radius); background-color:var(--light-color) }
.candidate-avatar { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:1.2rem }
.candidate-details h4 { font-size:1rem; margin-bottom:5px }
.candidate-details p { font-size:0.9rem; color:var(--gray-color); display:flex; align-items:center; gap:8px }
.status-badge { padding:5px 10px; border-radius:20px; font-size:0.8rem; font-weight:500; margin-left:auto }
.status-new { background-color:#e3f2fd; color:var(--primary-color) }

.form-group { margin-bottom:20px }
.form-group label { display:block; margin-bottom:8px; font-weight:500; font-size:0.9rem }
.form-control { width:100%; padding:12px 15px; border:1px solid #e0e0e0; border-radius:var(--border-radius); font-size:0.95rem }
.form-control:focus { outline:none; border-color:var(--primary-color); box-shadow:0 0 0 3px rgba(67,97,238,0.2) }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:15px }
.btn { padding:12px 25px; border:none; border-radius:var(--border-radius); font-weight:500; font-size:1rem; cursor:pointer }
.btn-primary { background-color:var(--primary-color); color:white }
.btn-primary:hover { background-color:var(--secondary-color) }
.btn-block { width:100% }

.stats { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px }
.stat-card { background:white; border-radius:var(--border-radius); box-shadow:var(--box-shadow); padding:20px; display:flex; align-items:center; gap:15px }
.stat-icon { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; color:white }
.stat-icon.interview { background-color:var(--primary-color) }
.stat-icon.candidate { background-color:var(--success-color) }
.stat-icon.position { background-color:var(--warning-color) }
.stat-info h3 { font-size:1.8rem; margin-bottom:5px }
.stat-info p { font-size:0.9rem; color:var(--gray-color) }

.empty-state { text-align:center; padding:30px; color:var(--gray-color) }
.empty-state i { font-size:3rem; margin-bottom:15px; opacity:0.5 }

@media (max-width: 1200px) {
  .today-interviews, .new-candidates, .schedule-interview { grid-column: span 12 }
  .ongoing-interviews { grid-column: span 12 }
}

@media (max-width: 768px) {
  .form-row { grid-template-columns:1fr }
  .stats { grid-template-columns:1fr }
  .header-right { flex-direction:column; gap:10px; align-items:flex-end }
  .interview-item { flex-direction:column; align-items:flex-start; gap:15px }
  .interview-time { align-self:flex-end }
}

@media (max-width: 576px) {
  .card { padding:20px 15px }
  .dashboard-content { gap:15px }
  header { flex-direction:column; align-items:flex-start; gap:15px }
  .header-right { align-items:flex-start; width:100% }
}
</style>
