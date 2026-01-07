<template>
   <div class="page-wrapper">
   <div class="content pb-0">
      <!-- Page Header -->
      <div class="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
         <div>
            <h4 class="mb-1">Job Descriptions</h4>
            <nav aria-label="breadcrumb">
               <ol class="breadcrumb mb-0 p-0">
                  <li class="breadcrumb-item"><a href="/">Dashboard</a></li>
                  <li class="breadcrumb-item active" aria-current="page">Job Descriptions</li>
               </ol>
            </nav>
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
      <!-- table header -->
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
         <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="input-icon input-icon-start position-relative">
               <span class="input-icon-addon text-dark"><i class="ti ti-search"></i></span>
               <input      v-model="searchQuery" 
                  @input="filterJobs"
                  type="text" 
                  placeholder="Search by job title..." 
                  class="form-control"
                  />
            </div>
         </div>
         <div class="d-flex align-items-center gap-2 flex-wrap"> 
            <a href="javascript:void(0);" class="btn btn-primary" v-if="hasWriteAccess" @click="showCreateModal = true" data-bs-toggle="offcanvas" data-bs-target="#offcanvas_add"><i class="ti ti-square-rounded-plus-filled me-1"></i>Add Job Description</a>
         </div>
      </div>
      <!-- table header --> 
      <div class="row"  v-if="loading">
         <div class="col-xxl-3 col-xl-4 col-md-6">
            <div class="card border shadow">
               <div class="card-body">
                  <div class="loading-state-ats">Loading job descriptions...</div>
               </div>
            </div>
         </div>
      </div>
      <div class="row"  v-else-if="error">
         <div class="col-xxl-3 col-xl-4 col-md-6">
            <div class="card border shadow">
               <div class="card-body">
                  <div  class="alert-ats-danger">{{ error }}</div>
               </div>
            </div>
         </div>
      </div>
      <div class="row"  v-else-if="filteredJobs.length === 0">
         <div class="col-xxl-3 col-xl-4 col-md-6">
            <div class="card border shadow">
               <div class="card-body">
                  <div  class="empty-state-ats">
                     <p>{{ searchQuery ? 'No job descriptions found matching your search.' : 'No job descriptions found. Create one to get started!' }}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <div v-else class="row">
         <div v-for="job in filteredJobs" :key="job.id" class="col-xxl-4 col-xl-4 col-md-6">
            <div class="card border shadow h-100">
               <div class="card-body">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                     <div class="d-flex align-items-center">
                        <div>
                           <h4 class="fs-22">{{ job.title }} </h4>
                        </div>
                     </div>
                     <div class="dropdown table-action fs-16 text-dark">
                        <strong class=" btn btn-outline-light shadow">{{ formatDate(job.created_at) }}</strong>                          
                     </div>
                  </div>
                  <div class="d-block">
                     <div class="d-flex flex-column">
                        <p class="text-default d-flex align-items-center mb-3">{{ truncateText(job.description, 200) }}</p>
                        <p v-if="job.requirements" class="text-default d-flex mb-2 flex-wrap">
                           <strong class="text-primary d-block w-100">Requirements:</strong>{{ truncateText(job.requirements, 150) }}
                        </p>
                        <p v-if="job.interviewers && job.interviewers.length > 0" class="text-default d-flex mb-2 flex-wrap">
                           <strong class="d-block w-100 text-dark">Assigned Interviewers: </strong>{{ job.interviewers.length }} interviewer(s)
                        </p>
                     </div>
                  </div>
                  <div  class="d-flex flex-wrap align-items-center mt-3  border-top pt-3">
                     <p class="text-default d-flex mb-2 flex-wrap w-100">
                        <strong class="text-dark d-block w-100">Parsed Resumes: </strong>
                     </p>
                     <div class="d-flex align-items-center">
                        <span class="badge badge-soft-info border border-info me-2">{{ job.resume_count || 0 }} Resume(s)</span>                           
                     </div>
                     <p class="text-default d-flex mb-2 flex-wrap w-100 mt-2">
                        <strong class="text-dark d-block w-100">Parse Status:</strong>
                     </p>
                     <div class="d-flex align-items-center">
                        <span class="badge badge-tag badge-outline-success me-2">Accepted {{job.accepted || 0}}</span>
                        <span class="badge badge-tag badge-outline-secondary me-2">Pending {{job.pending || 0}}</span>
                        <span class="badge badge-tag badge-outline-danger">Rejected {{job.rejected || 0}}</span>
                     </div>
                  </div>
                  <div  class="d-flex flex-wrap align-items-center mt-0 pt-3 mt-3 border-top">
                     <p class="text-default d-flex mb-2 flex-wrap w-100">
                        <strong class="text-dark d-block w-100">Application Status:</strong>
                     </p>
                     <div class="d-flex align-items-center flex-wrap">
                        <span class="badge bg-dark my-1 me-2">Scheduled {{job.scheduledInterview || 0}}</span>
                        <span class="badge bg-secondary my-1 me-2">Pending {{job.totalPending || 0}}</span>
                        <span class="badge bg-warning my-1 me-2">On Hold {{job.onhold || 0}}</span>
                        <span class="badge bg-info my-1 me-2">Decision Pending {{job.totalDecisionPending || 0}}</span>
                        <span class="badge bg-danger my-1 me-2">Rejected {{job.finalRejected || 0}}</span>
                        <span class="badge bg-success my-1 me-2">Accepted {{job.finalSelected || 0}}</span>
                     </div>
                  </div>
                  <div  class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                     <div class="d-flex align-items-center grid-social-links">
                        <a class="btn btn-dark me-2 shadow" href="javascript:;" @click="viewJobDetail(job.id)">
                        <i class="ti ti-eye me-1"></i> View
                        </a>   
                        <a class="btn btn-success me-2" href="javascript:;" @click="editJob(job)">
                        <i class="ti ti-edit me-1"></i> Edit
                        </a>
                        <a class="btn btn-danger" href="javascript:;" @click="deleteJob(job.id)">
                        <i class="ti ti-trash me-1"></i> Delete
                        </a>
                     </div>
                     <div class="d-flex align-items-center">
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <!-- Add New Job -->
      <div class="offcanvas offcanvas-end offcanvas-large show" id="offcanvas_add" v-if="showCreateModal || showEditModal">
         <div class="offcanvas-header border-bottom">
            <h5 class="mb-0">{{ showEditModal ? 'Edit Job Description' : 'Create Job Description' }}</h5>
            <button type="button" class="btn-close custom-btn-close border p-1 me-0 d-flex align-items-center justify-content-center rounded-circle" data-bs-dismiss="offcanvas" aria-label="Close" @click="closeModal">
            </button>
         </div>
         <div class="offcanvas-body">
            <form @submit.prevent="saveJob">
               <div>
                  <div class="row">
                     <div class="col-md-12">
                        <div class="mb-3">
                           <label class="form-label">Job Title <span class="text-danger">*</span></label>
                           <input id="title" v-model="currentJob.title" type="text" required 	placeholder="e.g., Senior Software Engineer" class="form-control"/>   
                        </div>
                     </div>
                     <div class="col-md-12">
                        <div class="mb-3">
                           <label class="form-label">Job Description <span class="text-danger">*</span></label>
                           <textarea id="description" v-model="currentJob.description" required rows="8" placeholder="Enter the full job description..." class="form-control" ></textarea> 
                        </div>
                     </div>
                     <div class="col-md-12">
                        <div class="mb-3">
                           <label class="form-label">Requirements (Optional)</label>
                           <textarea id="requirements" v-model="currentJob.requirements" rows="6" placeholder="Enter specific requirements, qualifications, etc..." class="form-control" ></textarea>
                        </div>
                     </div>
                     <div class="col-md-12">
                        <div class="mb-3">
                           <label class="form-label">Assign Interviewers (Optional)</label>
                           <select class="select form-control" id="interviewers" v-model="currentJob.interviewers" multiple>
                              <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                                 {{ interviewer.full_name || interviewer.email }}
                              </option>
                           </select>
                           <small class="text-muted">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
                        </div>
                     </div>
                  </div>
               </div>
               <div class="d-flex align-items-center justify-content-end">
                  <button type="button" data-bs-dismiss="offcanvas" class="btn btn-light me-2" @click="closeModal">Cancel</button>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                  <span v-if="saving">Saving...</span>
                  <span v-else>{{ showEditModal ? 'Update' : 'Create' }}</span>
                  </button>
               </div>
            </form>
         </div>
      </div>
      <!-- /Add New Job -->
      <div class="offcanvas-backdrop fade show" v-if="showCreateModal || showEditModal" @click="closeModal"></div>
   </div>
</div>

</template>
<script>
import axios from 'axios';
import { useAuth } from '../composables/useAuth';
import { useLoader } from '../composables/useLoader';
import { API_BASE_URL } from '../config/api';
import { formatDate } from '../utils/datetimeUtils';

export default {
  name: 'JobDescriptionsPage',
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
      currentJob: {
        id: null,
        title: '',
        description: '',
        requirements: '',
        interviewers: []
      },
      interviewers: [],
      loadingInterviewers: false
    };
  },
  mounted() {
    this.fetchJobDescriptions();
    if (this.hasWriteAccess) {
      this.fetchInterviewers();
    }
  },
  methods: {
    async fetchJobDescriptions() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Job Descriptions', 'Fetching available positions...');
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions`);
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
    async saveJob() {
      this.saving = true;
      const action = this.showEditModal ? 'Updating' : 'Creating';
      this.showLoader(`${action} Job Description`, 'Saving job details...');
      try {
        if (this.showEditModal) {
          const response = await axios.put(
            `${API_BASE_URL}/job-descriptions/${this.currentJob.id}`,
            this.currentJob
          );
          if (response.data.success) {
            await this.fetchJobDescriptions();
            this.closeModal();
          }
        } else {
          const response = await axios.post(
            `${API_BASE_URL}/job-descriptions`,
            this.currentJob
          );
          if (response.data.success) {
            await this.fetchJobDescriptions();
            this.closeModal();
          }
        }
      } catch (error) {
        console.error('Error saving job description:', error);
        alert('Failed to save job description. Please try again.');
      } finally {
        this.saving = false;
        this.hideLoader();
      }
    },
    async fetchInterviewers() {
      this.loadingInterviewers = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users?role=Interviewer`);
        if (response.data.success) {
          this.interviewers = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      } finally {
        this.loadingInterviewers = false;
      }
    },
    editJob(job) {
      this.currentJob = {
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements || '',
        interviewers: job.interviewers || []
      };
      this.showEditModal = true;
    },
    async deleteJob(id) {
      if (!confirm('Are you sure you want to delete this job description? This will also delete all associated candidate evaluations.')) {
        return;
      }

      try {
        await axios.delete(`${API_BASE_URL}/job-descriptions/${id}`);
        await this.fetchJobDescriptions();
      } catch (error) {
        console.error('Error deleting job description:', error);
        alert('Failed to delete job description. Please try again.');
      }
    },
    viewJobDetail(jobId) {
      this.$router.push({ name: 'JobDetail', params: { id: jobId } });
    },
    filterJobs() {
      if (!this.searchQuery.trim()) {
        this.filteredJobs = this.jobDescriptions;
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredJobs = this.jobDescriptions.filter(job => 
        job.title.toLowerCase().includes(query)
      );
    },
    closeModal() {
      this.showCreateModal = false;
      this.showEditModal = false;
      this.currentJob = {
        id: null,
        title: '',
        description: '',
        requirements: '',
        interviewers: []
      };
    },
    truncateText(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    },
    formatDate
  }
};
</script>