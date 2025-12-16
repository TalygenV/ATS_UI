<template>
  <div class="">
        <div v-if="loading" class="loading">Loading dashboard...</div>
    <header>
      <div class="logo-own">
        <i class="fas fa-user-tie"></i>
        <span>{{user.role}} Interview Dashboard</span>
      </div>

    </header>

    <div class="stats">
      <div class="stat-card">
        <!-- <div class="stat-icon interview">
          <i class="fas fa-calendar-day"></i>
        </div> -->
        <div class="stat-info">
          <h3>{{ totalInterviews }}</h3>
          <p>Today's Interviews</p>
        </div>
      </div>

      <div class="stat-card">
        <!-- <div class="stat-icon candidate">
          <i class="fas fa-users"></i>
        </div> -->
       
        <div class="stat-info">
          <h3>{{ newCandidates.length }}</h3>
          <p >New Candidates</p>
        </div>
      </div>

      <div class="stat-card">
        <!-- <div class="stat-icon position">
          <i class="fas fa-briefcase"></i>
        </div> -->
        <div class="stat-info">
          <h3>{{totalJobPositions}}</h3>
          <p>Open Positions</p>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class=" today-interviews">
        <div class=" card-header-own">
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
              class="interview-item scheduled-interviews"
              :class="{ ongoing: interview.status === 'ongoing' }"
            >
              <div class="interview-info">
                <div class="info-row">
                    <span class="label">Candidate:</span>
                    <span class="value">{{ interview.name  || 'N/A' }}</span>
                </div>
                 <div class="info-row">
                    <span class="label">Job Discription:</span>
                    <span class="value">{{ interview.position  || 'N/A' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Interviewer:</span>
                    <span class="value">{{ interview.interviewer  || 'N/A' }}</span>
                  </div>
                <!-- <p class="mb-0">Candidate : {{ interview.name }}</p> -->
                <!-- <p class="mb-0"> Job Discription : {{ interview.position }}</p> -->
                <!-- <p>
                   Interviewer :  {{ interview.interviewer }} 
                </p> -->
              </div>
              <div class="interview-time">
                <span>{{ interview.time }}</span>
                <span>{{ interview.status === 'ongoing' ? 'In Progress' : 'Scheduled' }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="ongoing-interviews">
        <div class="card-header-own">
          <h2 class="card-title">Ongoing Interviews</h2>
          <button class="card-action" @click="refreshOngoing">Refresh</button>
        </div>
        <div class="interview-list">
          <template v-if="ongoingInterviews.length === 0">
            <div class="empty-state ">
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
              <!-- <div class="interview-info">
                <p class="mb-0">{{ interview.name }}</p>
                <p class="mb-0"> {{ interview.position }}</p>
                <p class="mb-0"> {{ interview.interviewer }} • {{ interview.type }}</p>
              </div> -->
                   <div class="interview-info">
                <div class="info-row">
                    <span class="label">Candidate:</span>
                    <span class="value">{{ interview.name  || 'N/A' }}</span>
                </div>
                 <div class="info-row">
                    <span class="label">Job Discription:</span>
                    <span class="value">{{ interview.position  || 'N/A' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Interviewer:</span>
                    <span class="value">{{ interview.interviewer  || 'N/A' }}</span>
                  </div>
                <!-- <p class="mb-0">Candidate : {{ interview.name }}</p> -->
                <!-- <p class="mb-0"> Job Discription : {{ interview.position }}</p> -->
                <!-- <p>
                   Interviewer :  {{ interview.interviewer }} 
                </p> -->
              </div>
              <div class="in-progress">
                <span>{{ interview.time }}</span>
                <span>In Progress</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="new-candidates">
        <div class="card-header-own">
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
            <div v-for="cand in newCandidates" :key="cand.id" class="candidate-item new-candidate">
              <!-- <div
                class="candidate-avatar"
                :style="{ backgroundColor: cand.bg + '20', color: cand.bg }
                "
              >
                {{ cand.initials }}
              </div> -->
              <div class="candidate-details ">
                 <div class="interview-info">
                <div class="info-row">
                    <span class="label">Name:</span>
                    <span class="value">{{ cand.name  || 'N/A' }}</span>
                </div>

                   <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">{{ cand.email  || 'N/A' }}</span>
                </div>

                   <div class="info-row">
                    <span class="label">Applied:</span>
                    <span class="value">{{ cand.appliedDate  || 'N/A' }}</span>
                </div>

                   <div class="info-row">
                    <span class="label">Experience:</span>
                    <span class="value">{{ formatExperience(cand.experience) }}</span>
                </div>
                 </div>
                <!-- <p class="mb-0"> :  {{ cand.email }}</p>
                <p class="mb-0"> Applied: {{ cand.appliedDate }}</p>
                <p class="mb-0"> Experience : {{ formatExperience(cand.experience) }} </p> -->
              </div>

              

               <!-- <div class="interview-info"> -->
                
                 <!-- <div class="info-row">
                    <span class="label">Job Discription:</span>
                    <span class="value">{{ interview.position  || 'N/A' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Interviewer:</span>
                    <span class="value">{{ interview.interviewer  || 'N/A' }}</span>
                  </div> -->
                <!-- <p class="mb-0">Candidate : {{ interview.name }}</p> -->
                <!-- <p class="mb-0"> Job Discription : {{ interview.position }}</p> -->
                <!-- <p>
                   Interviewer :  {{ interview.interviewer }} 
                </p> -->
              <!-- </div> -->







              <div class="status-badge status-new">
                 
                <span>NEW</span>
                <span>Candidates</span>
              
              </div>
              
            </div>
          </template>
        </div>
      </div>

      <!-- <div class="card schedule-interview">
        <div class="card-header-own">
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
            // bg: ['#4361ee', '#3f37c9', '#4cc9f0', '#f72585', '#7209b7'][Math.floor(Math.random() * 5)]
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


/* .container {
  max-width: 80%;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Poppins', sans-serif;
  color: #1a202c;
} */

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* margin-bottom: 30px; */
  padding-bottom: 20px;
  /* border-bottom: 1px solid #eaeaea; */
}

.logo-own { 
  display:flex; 
  align-items:center; 
  gap:10px; 
  font-weight:700; 
  font-size:1.8rem; 
  margin-top: 2rem;
  /* color:#4361ee; */
      margin-bottom: 2rem;
  letter-spacing: -0.5px;
}
.logo-own i { font-size:2rem; }
.logo-own span 

.header-right { 
  display:flex; 
  align-items:center; 
  gap:20px; 
}

.date-display, .user-profile { 
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding:8px 15px; 
  border-radius:12px; 
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.date-display:hover, .user-profile:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.user-profile { 
  display:flex; 
  align-items:center; 
  gap:10px;
}
.user-profile img { 
  width:35px; 
  height:35px; 
  border-radius:50%; 
  object-fit:cover;
}

.dashboard-content { 
  display:grid; 
  grid-template-columns: repeat(12, 1fr); 
  gap:25px; 
}

.card { 
  background: rgba(255, 255, 255, 0.95);
  /* backdrop-filter: blur(10px); */
  border: none;
  border-radius:20px; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  padding:25px; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  /* border-top:4px solid #4361ee; */
}

.card:hover { 
  transform:translateY(-6px); 
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.card-header-own { 
  display:flex; 
  justify-content:space-between; 
  align-items:center; 
  margin-bottom:20px;
    background: rgba(255, 255, 255, 0.95);
  /* backdrop-filter: blur(10px); */
  border: none;
  border-radius:20px; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  padding:25px; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 

}

.card-title { 

  letter-spacing: -0.3px;
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
}

.card-action { 
  /* color:#4361ee;  */
  background:none; 
  border:none; 
  font-size:0.9rem; 
  font-weight:500; 
  cursor:pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* .card-action:hover { 
  color:#3f37c9;
} */

.today-interviews { grid-column: span 4 }
.ongoing-interviews { grid-column: span 4 }
.new-candidates { grid-column: span 4 }
.schedule-interview { grid-column: span 6 }

.interview-list { 
  display:flex; 
  flex-direction:column; 
  gap:15px;
}

.interview-item { 
  display: flex; 
  align-items:center; 
  justify-content:space-between;
  padding:15px; 
  border-radius:16px; 
      background: rgba(255, 255, 255, 0.95);
  /* backdrop-filter: blur(10px); */
  border: none;
  border-radius:20px; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  padding:25px; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  /* background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); */
      /* background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); */
 border-top:4px solid #d7d7d7;
  /* border: 1px solid #e2e8f0; */
  /* border-left:4px solid #4361ee; */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.interview-item.scheduled-interviews{
      border-top-color: #9c2a2a;
}

.interview-item.ongoing { 
      border-top-color: #1976d2;
}

.candidate-item.new-candidate { 
      border-top-color: #4caf50;
}


.interview-info h4 { 
  font-size:1rem; 
  margin-bottom:5px;
  color: #1a202c;
}

.interview-info p { 
  font-size:0.9rem; 
  color:#718096; 
  display:flex; 
  align-items:center; 
  gap:8px;
}


.info-row {
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
  margin-right: 10px;
}

.value {
  color: #333;
  flex: 1;
  text-align: right;
}


.interview-time { 
  display:flex; 
  flex-direction:column; 
  align-items:center; 
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
  justify-content: center;
  padding:10px 15px; 
  border-radius:12px; 
  min-width:100px;
  border: 1px solid rgba(66, 153, 225, 0.2);
      border-color: #fed7aa;
}
 .in-progress{  

    display: flex;
    flex-direction: column;
    align-items: center;
   background: #e3f2fd; 
   color: #1976d2; 
    padding: 10px 15px;
    border-radius: 12px;
    min-width: 100px;
    border: 1px solid rgba(66, 153, 225, 0.2);
    border-color: #aed7ff;

 }


.in-progress span[data-v-91557d31]:first-child {
    font-weight: 600;
    color: #1976d2;
}

.in-progress span:last-child {
    font-size: 0.8rem;
    color: #1976d2;
}






.interview-time span:first-child { 
  font-weight:600; 
   color:#742a2a; 
       padding-right: 10px;
       

}

.interview-time span:last-child { 
  font-size:0.8rem; 
  color:#742a2a;
  font-size: 1rem;
}

.candidate-list { 
  display:flex; 
  flex-direction:column; 
  gap:8px;
}

.candidate-item { 
  display:flex; 
  align-items:center; 
  gap:15px; 
  padding:15px; 
  border-radius:16px; 
       /* background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); */
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.95);
  /* backdrop-filter: blur(10px); */
  border: none;
  border-radius:20px; 
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  padding:25px; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  border-top: 4px solid #ddd;
}

.candidate-item:hover {
  transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.candidate-avatar { 
  width:50px; 
  height:50px; 
  border-radius:50%; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  font-weight:600; 
  font-size:1.2rem;
}

.candidate-details h4 { 
  font-size:1rem; 
  margin-bottom:5px;
  color: #1a202c;
}

.candidate-details p { 
  font-size:0.9rem; 
  color:#718096; 
  display:flex; 
  align-items:center; 
  gap:8px;
}

.status-badge { 
  padding:5px 10px; 
  border-radius:20px; 
  font-size:0.8rem; 
  font-weight:600; 
  margin-left:auto;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-new { 
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color:#22543d;
display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 15px;
    border-radius: 12px;
    min-width: 100px;
    border: 1px solid rgb(132 222 161);

}

.form-group { 
  margin-bottom:20px;
}

.form-group label { 
  display:block; 
  margin-bottom:8px; 
  font-weight:500; 
  font-size:0.9rem;
  color: #2d3748;
  letter-spacing: 0.3px;
}

.form-control { 
  width:100%; 
  padding:12px 15px; 
  border:2px solid #e2e8f0; 
  border-radius:12px; 
  font-size:0.95rem;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-control:focus { 
  outline:none; 
  /* border-color:#4361ee;  */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.form-row { 
  display:grid; 
  grid-template-columns:1fr 1fr; 
  gap:15px;
}

.btn { 
  padding:12px 25px; 
  border:none; 
  border-radius:12px; 
  font-weight:600; 
  font-size:1rem; 
  cursor:pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
}

.btn-primary { 
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color:white;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.btn-primary:hover { 
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-block { 
  width:100%;
}

.stats { 
  display:grid; 
  grid-template-columns:repeat(3,1fr); 
  gap:20px; 
  margin-bottom:24px;
}

.stat-card { 
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius:20px; 
  box-shadow:0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset; 
  padding:20px; 
  display:flex; 
  align-items:center; 
  gap:15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
}

.stat-icon { 
  width:60px; 
  height:60px; 
  border-radius:50%; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  font-size:1.5rem; 
  color:white;
}

.stat-icon.interview { 
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);
}

.stat-icon.candidate { 
  background: linear-gradient(135deg, #4cc9f0 0%, #38b6b6 100%);
  box-shadow: 0 4px 15px rgba(76, 201, 240, 0.4);
}

.stat-icon.position { 
  background: linear-gradient(135deg, #f72585 0%, #d61a6f 100%);
  box-shadow: 0 4px 15px rgba(247, 37, 133, 0.4);
}

.stat-info h3 { 
  font-size:1.8rem; 
  margin-bottom:5px;
  color: #1a202c;
  font-weight: 700;
}

.stat-info p { 
  font-size:0.9rem; 
  color:#718096;
}

.empty-state { 
  text-align:center; 
  padding:30px; 
  color:#718096;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
        padding: 25px;
}

.empty-state i { 
  font-size:3rem; 

  margin-bottom:15px; 
  opacity:0.5;
}

.name {
  color: #333;
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
}

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
