<template>
    <div class="py-4">
      <div class="page-header-ats">
        <h2 class="page-title-ats">WalkIn Drive</h2>
        <button v-if="hasWriteAccess" @click="showCreateModal = true" class="btn-ats-primary">+ Add WalkIn Drive</button>
      </div>
  
      <div class="mb-4">
        <input 
          v-model="searchQuery" 
          @input="filterJobs"
          type="text" 
          placeholder="Search by job title..." 
          class="search-input-ats"
        />
      </div>
  
      <div v-if="loading" class="loading-state-ats">Loading Drives...</div>
      <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
      <div v-else-if="filteredJobs.length === 0" class="empty-state-ats">
        <p>{{ searchQuery ? 'No WalkIn Drive found matching your search.' : 'No WalkIn Drive found. Create one to get started!' }}</p>
      </div>
      <div v-else class="row g-4">
        <div v-for="job in filteredJobs" :key="job.id" class="col-12 col-md-6 col-xl-4">
          <div class="ats-card h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
              <div class="flex-grow-1">
                <!-- <h3 class="fs-5 fw-semibold text-dark mb-0">{{ job.title }}</h3> -->
                 <h3 class="fs-5 fw-semibold text-dark mb-0">{{ job.drive_name }}</h3>
                <div class="mt-2">
                  <span 
                    :class="['badge-ats', job.status === 'Open' ? 'badge-ats-success' : 'badge-ats-warning']"
                    style="font-size: 0.75rem;"
                  >
                    <!-- {{ job.status || 'Open' }} -->
                    {{ getDrviveStatus(job) }}
                  </span>
                </div>
              </div>
              <div v-if="hasWriteAccess" class="d-flex gap-2">
                <button :disabled="isDriveEnded(job)" @click="editJob(job)" class="btn-icon" title="Edit">✏️</button>
               
                <button :disabled="isDriveEnded(job)"  @click="deleteJob(job.walkinDriveId)" class="btn-icon" title="Delete">🗑️</button>
              </div>
            </div>
            <div class="flex-grow-1">
              <!-- <p class="text-secondary mb-3">{{ truncateText(job.description, 200) }}</p> -->
                  <p class="text-secondary mb-3">{{ truncateText(job.drive_description, 200) }}</p>
              <!-- <div v-if="job.requirements" class="pt-3 border-top mb-3">
                <strong class="text-dark d-block mb-2">Requirements:</strong>
                <p class="text-secondary small mb-0">{{ truncateText(job.requirements, 150) }}</p>
              </div> -->
                  <h3 class="fs-5 mb-3"><span style="font-weight:600" class="text-dark">Job Title :</span> <span class="text-secondary">{{ job.title }}</span></h3>
                 <p class="text-secondary mb-3"><span style="font-weight:600" class="text-dark">Description :</span> {{ truncateText(job.description, 200) }}</p>
              <div v-if="job.interviewers && job.interviewers.length > 0" class="pt-3 border-top mb-3">
                <strong class="text-dark d-block mb-2">Assigned Interviewers:</strong>
                <span class="badge-ats badge-ats-primary">{{ job.interviewers.length }} interviewer(s)</span>
              </div>
              <!-- <div class="pt-3 border-top mb-3">
                <strong class="text-dark d-block mb-2">Parsed Resumes:</strong>
                <span class="badge bg-success text-white me-1">{{ (job.accepted || 0) + (job.pending || 0) + (job.rejected || 0) }} resume(s)</span>
                <div class="mt-2">
                  <span class="fw-bold small">Parse Status:</span>
                  <span class="badge-ats badge-ats-success ms-1">accepted {{job.accepted || 0}}</span>
                  <span class="badge-ats badge-ats-pending ms-1">pending {{job.pending || 0}}</span>
                  <span class="badge-ats badge-ats-danger ms-1">rejected {{job.rejected || 0}}</span>
                </div>
              </div> -->
              <!-- <div v-if="hasWriteAccess" class="pt-3 border-top">
                <strong class="text-dark d-block mb-2">Application Status:</strong>
                <div class="d-flex flex-wrap gap-1">
                  <span class="badge-ats badge-ats-pending">Pending {{job.totalPending || 0}}</span>
                  <span class="badge-ats badge-ats-success">Scheduled {{job.scheduledInterview || 0}}</span>
                  <span class="badge-ats badge-ats-pending">Decision Pending {{job.totalDecisionPending || 0}}</span>
                  <span class="badge-ats badge-ats-success">Selected {{job.finalSelected || 0}}</span>
                  <span class="badge-ats badge-ats-warning">On Hold {{job.onhold || 0}}</span>
              
                  <span class="badge-ats badge-ats-danger">Rejected {{job.finalRejected || 0}}</span>
             
                </div>
              </div> -->
            </div>
                                <p class="text-muted small">
  Start From: {{ formatDateTime(job.from_date) }}
</p>
<p class="text-muted small">
  End Date: {{ formatDateTime(job.to_date) }}
</p>
            <div class="d-flex justify-content-between align-items-center pt-3 mt-3 border-top">
              <span class="text-muted small invisible">{{ formatDate(job.created_at) }}</span>
      
              <button @click="viewJobDetail(job.dobDescription_id , job.walkinDriveId)" class="btn-ats-secondary btn-ats-sm">View Details</button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Create/Edit Modal -->
      <div v-if="showCreateModal || showEditModal" class="modal-overlay-ats" >
        <div class="modal-content-ats" @click.stop>
          <div class="modal-header-ats" style="    position: sticky;
      top: 0;
      background-color: white;" >
            <h2 class="fs-4 fw-semibold">{{ showEditModal ? 'Edit Walk In Drive' : 'Create Walk In Drive' }}</h2>
            <button @click="closeModal" class="close-btn-ats">×</button>
          </div>
          <div class="modal-body-ats">
            <form @submit.prevent="saveDrive">
              <div class="mb-4">
                <label for="drive_name" class="form-label fw-medium text-dark">Drive Title *</label>
                <input
                  id="drive_name"
                  v-model="currentDrive.drive_name"
                  type="text"
                  required
                  placeholder="e.g., Senior Software Engineer"
                  class="form-control-ats"
                />
              </div>
              <div class="mb-4">
                <label for="drive_description" class="form-label fw-medium text-dark">Drive Description *</label>
                <textarea
                  id="drive_description"
                  v-model="currentDrive.drive_description"
                  required
                  rows="8"
                  placeholder="Enter the full description..."
                  class="form-control-ats form-textarea-ats"
                ></textarea>
              </div>
              <div class="mb-4">
                <label for="from_date" class="form-label fw-medium text-dark">
                    From Date & Time *
                </label>
                <input
                    id="from_date"
                    v-model="currentDrive.from_date"
                    type="datetime-local"
                    required
                    class="form-control-ats"
                />
                </div>

                <div class="mb-4">
                <label for="to_date" class="form-label fw-medium text-dark">
                    To Date & Time *
                </label>
                <input
                    id="to_date"
                    v-model="currentDrive.to_date"
                    type="datetime-local"
                    required
                    class="form-control-ats"
                    :min="currentDrive.from_date"
                />
                </div>
              <div class="mb-4">
                <label for="forJd" class="form-label fw-medium text-dark">Assign Job Description </label>
                <select
                   :disabled="currentDrive.id"
                  id="forJd"
                  v-model="currentDrive.dobDescription_id"
                  required
                  class="form-select-ats"
                >
                  <option v-for="forJd in forJd" :key="forJd.id" :value="forJd.id">
                    {{ forJd.title }}
                  </option>
                </select>
              </div>
              <div class="d-flex gap-3 justify-content-end mt-4">
                <button type="button" @click="closeModal" class="btn-ats-secondary">Cancel</button>
                <button type="submit" :disabled="saving" class="btn-ats-primary">
                  <span v-if="saving">Saving...</span>
                  <span v-else>{{ showEditModal ? 'Update' : 'Create' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { useAuth } from '../composables/useAuth';
  import { useLoader } from '../composables/useLoader';
  import { API_BASE_URL } from '../config/api';
  import { formatDate , toUTCISOString , formatDateTime } from '../utils/datetimeUtils';
import moment from 'moment';
  
  export default {
    name: 'walkininterview',
    setup() {
      const { hasWriteAccess } = useAuth();
      const { showLoader, hideLoader } = useLoader();
      return { hasWriteAccess, showLoader, hideLoader };
    },
    data() {
      return {
        jobDescriptions: [],
        filteredJobs: [],
        searchQuery: '',
        loading: false,
        error: null,
        showCreateModal: false,
        showEditModal: false,
        saving: false,
        currentDrive: {
          id: null,
          drive_name: '',
          drive_description: '',
          from_date: null,
          to_date:null,
          dobDescription_id:null,
          status: 'active'
        },
        forJd: [],
        loadingInterviewers: false
      };
    },
    mounted() {
      this.fetchWalkinDrive();
      if (this.hasWriteAccess) {
        this.fetchInterviewers();
      }
    },
    methods: {
      formatForDatetimeLocal(value) {
    if (!value) return null;

    const d = new Date(value);

    // local time, not UTC
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  },
            getDrviveStatus(currentDrive) {
            if(this.isUpcomingDrive(currentDrive)) {
                return 'Upcoming';
            } else if(this.isOngoingDrive(currentDrive)) {
                return 'Ongoing';
            } else if(this.isDriveEnded(currentDrive)) {
                return 'Ended';
            }
            return 'Unknown';

    },
        isUpcomingDrive(currentDrive) {
            let now = moment()
            let driveStart = moment(currentDrive.from_date);
            return now.isBefore(driveStart);
         },
         isOngoingDrive(currentDrive) {
            let now = moment()
            let driveStart = moment(currentDrive.from_date);
            let driveEnd = moment(currentDrive.to_date);
            return now.isBetween(driveStart, driveEnd);
         },

         isDriveEnded(currentDrive) {
            let now = moment()
            let driveEnd = moment(currentDrive.to_date);
            return now.isAfter(driveEnd);
         },
      formatDateTime,
      
      async fetchWalkinDrive() {
        this.loading = true;
        this.error = null;
        this.showLoader('Loading Walk In Drives', 'Fetching available positions...');
        try {
          const response = await axios.get(`${API_BASE_URL}/walkIn`);
          if (response.data.success) {
            this.jobDescriptions = response.data.data;
            this.filteredJobs = response.data.data;
          }
        } catch (error) {
          console.error('Error fetching job descriptions:', error);
          this.error = 'Failed to fetch job descriptions. Please try again.';
        } finally {
          this.loading = false;
          this.hideLoader();
        }
      },
      async saveDrive() {
        this.saving = true;
        const action = this.showEditModal ? 'Updating' : 'Creating';
        this.showLoader(`${action} Walk In Drive`, 'Saving Drive details...');
        try {
                   const payload = {
            ...this.currentDrive,
      from_date: toUTCISOString(this.currentDrive.from_date),
      to_date: toUTCISOString(this.currentDrive.to_date),
    };

          if (this.showEditModal) {
            const response = await axios.put(
              `${API_BASE_URL}/walkIn/${this.currentDrive.id}`,
              payload
            );
            if (response.data.success) {
              await this.fetchWalkinDrive();
              this.closeModal();
            }
          } else {
            const response = await axios.post(
              `${API_BASE_URL}/walkIn`,
              payload
            );
            if (response.data.success) {
              await this.fetchWalkinDrive();
              this.closeModal();
            }
          }
        } catch (error) {
          console.error('Error saving Walk In Drive:', error);
          alert('Failed to save Walk In Drive. Please try again.');
        } finally {
          this.saving = false;
          this.hideLoader();
        }
      },
      async fetchInterviewers() {
        this.loadingInterviewers = true;
        try {
          const response = await axios.get(`${API_BASE_URL}/walkIn/jobDescList`);
          if (response.data.success) {
            this.forJd = response.data.data;
          }
        } catch (error) {
          console.error('Error fetching interviewers:', error);
        } finally {
          this.loadingInterviewers = false;
        }
      },
      editJob(job) {
        this.currentDrive = {
          id: job.walkinDriveId,
          drive_name: job.drive_name,
          drive_description: job.drive_description,
          from_date: job.from_date ? this.formatForDatetimeLocal(job.from_date) : null,
          to_date: job.to_date ? this.formatForDatetimeLocal(job.to_date) : null,
          dobDescription_id: job.dobDescription_id ,
          status: job.status || 'active'
        };
        this.showEditModal = true;
      },

      async deleteJob(id) {
        if (!confirm('Are you sure you want to delete this job description? This will also delete all associated candidate evaluations.')) {
          return;
        }
  
        try {
          await axios.delete(`${API_BASE_URL}/walkIn/${id}`);
          await this.fetchWalkinDrive();
        } catch (error) {
          console.error('Error deleting job description:', error);
          alert('Failed to delete job description. Please try again.');
        }
      },
      viewJobDetail(dobDescription_id, walkinDriveId) {
        this.$router.push({ name: 'WalkInInterviewDetailsPage', params: { id: dobDescription_id, walkinId: walkinDriveId } });
      },
      filterJobs() {
        if (!this.searchQuery.trim()) {
          this.filteredJobs = this.jobDescriptions;
          return;
        }
        const query = this.searchQuery.toLowerCase();
        this.filteredJobs = this.jobDescriptions.filter(job => 
          job.drive_name.toLowerCase().includes(query)
        );
      },
      closeModal() {
        this.showCreateModal = false;
        this.showEditModal = false;
        this.currentDrive = {
          id: null,
          drive_name: '',
          drive_description: '',
          from_date: null,
          to_date: null,
          dobDescription_id: null,
          status: 'active'
        };
      },


      truncateText(text, length) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
      },
      formatDate
    },
  
  };
  </script>
  