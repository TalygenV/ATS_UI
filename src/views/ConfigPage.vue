<template>
  <div class="py-4">
    <div class="page-header-ats">
      <h2 class="page-title-ats">System Configuration</h2>
    </div>

    <!-- Tabs Navigation -->
    <div class="ats-card mb-4">
      <ul class="nav nav-tabs border-0" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'smtp' }"
            @click="activeTab = 'smtp'"
            type="button"
            role="tab"
          >
            SMTP Configuration
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'zoom' }"
            @click="activeTab = 'zoom'"
            type="button"
            role="tab"
          >
            Zoom Credentials
          </button>
        </li>

        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'Groq' }"
            @click="activeTab = 'Groq'"
            type="button"
            role="tab"
          >
            Groq Credentials
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
            :class="{ active: activeTab === 'Kpi' }"
            @click="activeTab = 'Kpi'"
            type="button"
            role="tab"
          >
          Recruitment Process Metrics Target
          </button>
        </li>
      </ul>
    </div>

    <!-- SMTP Config Tab -->
    <div v-show="activeTab === 'smtp'" class="ats-card">
      <h3 class="fs-5 fw-semibold mb-4">SMTP Settings</h3>
      
      <div v-if="smtpError" class="alert-ats-danger mb-3">{{ smtpError }}</div>
      <div v-if="smtpSuccess" class="alert-ats-success mb-3">{{ smtpSuccess }}</div>

      <form @submit.prevent="handleSmtpSubmit" class="d-flex flex-column gap-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="smtp_server" class="fw-semibold text-dark small">
                SMTP Server <span class="text-danger">*</span>
              </label>
              <input
                id="smtp_server"
                v-model="smtpForm.smtp_server"
                type="text"
                required
                placeholder="e.g., smtp.gmail.com"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="smtp_port" class="fw-semibold text-dark small">
                SMTP Port <span class="text-danger">*</span>
              </label>
              <input
                id="smtp_port"
                v-model="smtpForm.smtp_port"
                type="text"
                required
                placeholder="e.g., 587 or 465"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="smtp_user_name" class="fw-semibold text-dark small">
                SMTP Username <span class="text-danger">*</span>
              </label>
              <input
                id="smtp_user_name"
                v-model="smtpForm.smtp_user_name"
                type="text"
                required
                placeholder="Enter SMTP username"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="smtp_password" class="fw-semibold text-dark small">
                SMTP Password <span class="text-danger">*</span>
              </label>
              <input
                id="smtp_password"
                v-model="smtpForm.smtp_password"
                type="password"
                required
                placeholder="Enter SMTP password"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="from_email" class="fw-semibold text-dark small">
                From Email <span class="text-danger">*</span>
              </label>
              <input
                id="from_email"
                v-model="smtpForm.from_email"
                type="email"
                required
                placeholder="e.g., noreply@example.com"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="smtp_type" class="fw-semibold text-dark small">
                SMTP Type <span class="text-danger">*</span>
              </label>
              <select
                id="smtp_type"
                v-model="smtpForm.smtp_type"
                required
                class="form-select-ats"
              >
                <option value="">Select SMTP type</option>
                <option value="Normal">Normal</option>
                <option value="TLS">TLS</option>
                <option value="SSL">SSL</option>
                <option value="STARTTLS">STARTTLS</option>
              </select>
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label class="fw-semibold text-dark small">Secure SMTP</label>
              <div class="form-check form-switch">
                <input
                  id="is_secure_smtp"
                  v-model="smtpForm.is_secure_smtp"
                  type="checkbox"
                  class="form-check-input"
                  style="cursor: pointer;"
                />
                <label for="is_secure_smtp" class="form-check-label" style="cursor: pointer;">
                  Enable secure SMTP connection
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button type="submit" :disabled="smtpLoading" class="btn-ats-primary">
            <span v-if="smtpLoading">Saving...</span>
            <span v-else>Save SMTP Settings</span>
          </button>
          <button type="button" @click="fetchSmtpSettings" :disabled="smtpLoading" class="btn-ats-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>

    <!-- Zoom Creds Tab -->
    <div v-show="activeTab === 'zoom'" class="ats-card">
      <h3 class="fs-5 fw-semibold mb-4">Zoom Credentials</h3>
      
      <div v-if="zoomError" class="alert-ats-danger mb-3">{{ zoomError }}</div>
      <div v-if="zoomSuccess" class="alert-ats-success mb-3">{{ zoomSuccess }}</div>

      <form @submit.prevent="handleZoomSubmit" class="d-flex flex-column gap-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="ZOOM_ACCOUNT_ID" class="fw-semibold text-dark small">
                Zoom Account ID <span class="text-danger">*</span>
              </label>
              <input
                id="ZOOM_ACCOUNT_ID"
                v-model="zoomForm.ZOOM_ACCOUNT_ID"
                type="text"
                required
                placeholder="Enter Zoom Account ID"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="ZOOM_CLIENT_ID" class="fw-semibold text-dark small">
                Zoom Client ID <span class="text-danger">*</span>
              </label>
              <input
                id="ZOOM_CLIENT_ID"
                v-model="zoomForm.ZOOM_CLIENT_ID"
                type="text"
                required
                placeholder="Enter Zoom Client ID"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="ZOOM_CLIENT_SECRET" class="fw-semibold text-dark small">
                Zoom Client Secret <span class="text-danger">*</span>
              </label>
              <input
                id="ZOOM_CLIENT_SECRET"
                v-model="zoomForm.ZOOM_CLIENT_SECRET"
                type="password"
                required
                placeholder="Enter Zoom Client Secret"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="Zoom_Email" class="fw-semibold text-dark small">
                Zoom Email
              </label>
              <input
                id="Zoom_Email"
                v-model="zoomForm.Zoom_Email"
                type="email"
                placeholder="Enter Zoom Email (optional)"
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label class="fw-semibold text-dark small">Join Before Host</label>
              <div class="form-check form-switch">
                <input
                  id="Zoom_join_before_host"
                  v-model="zoomForm.Zoom_join_before_host"
                  type="checkbox"
                  class="form-check-input"
                  style="cursor: pointer;"
                />
                <label for="Zoom_join_before_host" class="form-check-label" style="cursor: pointer;">
                  Allow participants to join before host
                </label>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label class="fw-semibold text-dark small">Waiting Room</label>
              <div class="form-check form-switch">
                <input
                  id="Zoom_waiting_room"
                  v-model="zoomForm.Zoom_waiting_room"
                  type="checkbox"
                  class="form-check-input"
                  style="cursor: pointer;"
                />
                <label for="Zoom_waiting_room" class="form-check-label" style="cursor: pointer;">
                  Enable waiting room for participants
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button type="submit" :disabled="zoomLoading" class="btn-ats-primary">
            <span v-if="zoomLoading">Saving...</span>
            <span v-else>Save Zoom Settings</span>
          </button>
          <button type="button" @click="fetchZoomSettings" :disabled="zoomLoading" class="btn-ats-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>

    <!-- Groq Creds Tab -->
<div v-show="activeTab === 'Groq'" class="ats-card">
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h3 class="fs-5 fw-semibold mb-0">Groq API Keys</h3>

    <button class="btn-ats-primary" @click="openAddKeyModal">
      + Add Key
    </button>
  </div>

  <!-- Search -->
  <input
    v-model="GroqSearch"
    type="text"
    placeholder="Search by key..."
    class="form-control-ats mb-3"
  />

  <div v-if="GroqSuccess" class="alert-ats-success mb-3">{{ GroqSuccess }}</div>

  <!-- Listing -->
  <table class="table table-sm">
    <thead>
      <tr>
        <th>Key</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="item in filteredGroqKeys" :key="item.id">
        <td>{{ maskKey(item.api_key) }}</td>
        <td>
          <span
            class="badge"
            :class="item.is_active ? 'bg-success' : 'bg-secondary'"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </span>
        </td>
        <td>
          <button
            class="btn btn-sm btn-outline-primary me-2"
            @click="toggleGroqStatus(item)"
          >
            {{ item.is_active ? 'Disable' : 'Enable' }}
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            @click="deleteGroqKey(item)"
          >
            Delete
          </button>
        </td>
      </tr>

      <tr v-if="!filteredGroqKeys?.length">
        <td colspan="3" class="text-center text-muted">
          No keys found
        </td>
      </tr>
    </tbody>
  </table>
</div>


<div v-show="activeTab === 'Kpi'" class="ats-card">
      <h3 class="fs-5 fw-semibold mb-4">Recruitment Process Metrics Target</h3>
      
      <div v-if="kpiError" class="alert-ats-danger mb-3">{{ kpiError }}</div>
      <div v-if="kpiSuccess" class="alert-ats-success mb-3">{{ kpiSuccess }}</div>

      <form @submit.prevent="handlekpiSubmit" class="d-flex flex-column gap-4">
        <div class="row g-3">
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="resumetoInterviewRate" class="fw-semibold text-dark small">
                Resume to Interview Rate <span class="text-danger">*</span>
              </label>
              <input
                id="resumetoInterviewRate"
                v-model="kpiForm.resumetoInterviewRate"
                type="text"
                required
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="averageMatchScore" class="fw-semibold text-dark small">
                Average Match Score <span class="text-danger">*</span>
              </label>
              <input
                id="averageMatchScore"
                v-model="kpiForm.averageMatchScore"
                type="text"
                required
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="interviewSlotUtilization" class="fw-semibold text-dark small">
                Interview Slot Utilization<span class="text-danger">*</span>
              </label>
              <input
                id="interviewSlotUtilization"
                v-model="kpiForm.interviewSlotUtilization"
                type="text"
                required
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="timetoDecision" class="fw-semibold text-dark small">
                Time to Decision <span class="text-danger">*</span>
              </label>
              <input
                id="timetoDecision"
                v-model="kpiForm.timetoDecision"
                type="text"
                required
                class="form-control-ats"
              />
            </div>
          </div>

          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="candidateConversionRate" class="fw-semibold text-dark small">
                Candidate Conversion Rate <span class="text-danger">*</span>
              </label>
              <input
                id="candidateConversionRate"
                v-model="kpiForm.candidateConversionRate"
                type="text"
                required
                class="form-control-ats"
              />
            </div>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button type="submit" :disabled="kpiLoading" class="btn-ats-primary">
            <span v-if="kpiLoading">Saving...</span>
            <span v-else>Save kpi Settings</span>
          </button>
          <button type="button" @click="fetchkpiSettings" :disabled="kpiLoading" class="btn-ats-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>




<!-- Add Key Modal -->
<div v-if="showAddKeyModal" class="modal-overlay-ats" >
  <div class="modal-content-ats modal-content-sm" @click.stop>
    <div class="modal-header-ats">
      <h5 class="modal-title-ats">Add Groq API Key</h5>
      <button type="button" @click="closeAddKeyModal" class="close-btn-ats">×</button>
    </div>

    <div class="modal-body-ats">
      <input
        v-model="newGroqKey"
        type="text"
        placeholder="Enter Groq API Key"
        class="form-control-ats mb-3"
      />

      <div class="d-flex gap-2 justify-content-end">
        <button type="button" @click="closeAddKeyModal" class="btn-ats-secondary">
          Cancel
        </button>
        <button
          type="button"
          class="btn-ats-primary"
          @click="addGroqKey"
        >
          {{ 'Save' }}
        </button>
      </div>
    </div>
  </div>
</div>


  
  </div>
</template>

<script>
import { ref, onMounted , computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';


export default {
  name: 'ConfigPage',
  setup() {
    const router = useRouter();
    const { isAdmin, fetchCurrentUser } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    const activeTab = ref('smtp');
    const GroqKeys = ref([]);
const GroqSearch = ref('');
const showAddKeyModal = ref(false);
const newGroqKey = ref('');
const GroqSuccess = ref('');
    
    // SMTP form state
    const smtpForm = ref({
      smtp_server: '',
      smtp_port: '',
      smtp_user_name: '',
      smtp_password: '',
      from_email: '',
      smtp_type: '',
      is_secure_smtp: false
    });


    const kpiForm = ref({
      resumetoInterviewRate: '',
      averageMatchScore: '',
      interviewSlotUtilization: '',
      timetoDecision: '',
      candidateConversionRate: ''
    });
    
    const smtpLoading = ref(false);
    const smtpError = ref('');
    const smtpSuccess = ref('');

    const kpiLoading = ref(false);
    const kpiError = ref('');
    const kpiSuccess = ref('');
    
    // Zoom form state
    const zoomForm = ref({
      ZOOM_ACCOUNT_ID: '',
      ZOOM_CLIENT_ID: '',
      ZOOM_CLIENT_SECRET: '',
      Zoom_Email: '',
      Zoom_join_before_host: false,
      Zoom_waiting_room: false
    });
    
    const zoomLoading = ref(false);
    const zoomError = ref('');
    const zoomSuccess = ref('');

    const filteredGroqKeys = computed(() => {
  return GroqKeys.value.filter(k =>
    k.api_key.toLowerCase().includes(GroqSearch.value.toLowerCase())
  );
});

const maskKey = (key) => {
  if (!key) return '';
  return key.slice(0, 6) + '****' + key.slice(-6);
};

   const fetchGroqKeys = async () => {
      showLoader('Loading Groq keys...');
  try {
    const token = localStorage.getItem('auth_token');
    const res = await axios.get(`${API_BASE_URL}/config/groq`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.data.success) {
      GroqKeys.value = res.data.data || [];
    }
  } catch (e) {
    console.error(e);
    alert('Failed to load Groq keys');
  } finally {
    hideLoader();
  }
};


const toggleGroqStatus = async (item) => {
     showLoader('Changing Status Groq keys...');
  try {
    const token = localStorage.getItem('auth_token');
  let res =   await axios.patch(
      `${API_BASE_URL}/config/groq/${item.id}/status`,
      { is_active: !item.is_active },
      { headers: { Authorization: `Bearer ${token}` } }
    );
        if(res?.data?.success === false){
      alert(res.data.error || 'Failed to delete API key');
    }

   
  } catch (e) {
    console.error(e);
    alert( e.response.data.error || 'Failed to update Groq key status');
   
  } finally {
    // hideLoader();
     fetchGroqKeys(); // 🔁 refetch list
  }
};

const deleteGroqKey = async (item) => {
  if (!confirm('Are you sure you want to delete this API key?')) return;
    showLoader('Deleting Groq keys...');
  try {
    const token = localStorage.getItem('auth_token');
   let res =  await axios.delete(`${API_BASE_URL}/config/groq/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if(res?.data?.success === false){
      alert(res.data.error || 'Failed to delete API key');
    }

  } catch (e) {
    console.error(e);
    alert( e.response.data.error || 'Failed to delete API key');
  } finally {
    fetchGroqKeys();
    // hideLoader();
  }
};
const openAddKeyModal = () => {
  newGroqKey.value = '';
  GroqSuccess.value = '';
  showAddKeyModal.value = true;
};

const closeAddKeyModal = () => {
  showAddKeyModal.value = false;
};

const addGroqKey = async () => {
 
  if (!newGroqKey.value) return;

  GroqSuccess.value = '';
    showLoader('Adding Groq keys...');
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(
      `${API_BASE_URL}/config/groq`,
      { api_key: newGroqKey.value.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      GroqSuccess.value = 'Groq API key added successfully!';
      closeAddKeyModal();
      fetchGroqKeys();
      setTimeout(() => {
        GroqSuccess.value = '';
      }, 3000);
    } else {
      alert(response.data.error || 'Failed to add Groq API key');
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message || 'Failed to add Groq API key');
  } finally {
    hideLoader()
  }
};


const fetchKpiSettings = async () => {
      kpiLoading.value = true;
      kpiError.value = '';
      kpiSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/config/kpi`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          if (response.data.data) {
            kpiForm.value = {
              resumetoInterviewRate: response.data.data.resumetoInterviewRate || '',
              averageMatchScore: response.data.data.averageMatchScore || '',
              interviewSlotUtilization: response.data.data.interviewSlotUtilization || '',
              timetoDecision: response.data.data.timetoDecision || '',
              candidateConversionRate: response.data.data.candidateConversionRate || ''
            };
          }
        } else {
          kpiError.value = response.data.error || 'Failed to fetch kpi settings';
        }
      } catch (err) {
        kpiError.value = err.response?.data?.error || err.message || 'Failed to fetch kpi settings';
      } finally {
        kpiLoading.value = false;
      }
    };


    const handlekpiSubmit = async () => {
      kpiLoading.value = true;
      kpiError.value = '';
      kpiSuccess.value = '';
      debugger;
      try {
        const token = localStorage.getItem('auth_token');
        const trimmedForm = {
          ...kpiForm.value,
          resumetoInterviewRate: kpiForm.value.resumetoInterviewRate.trim(),
          averageMatchScore: kpiForm.value.averageMatchScore.trim(),
          interviewSlotUtilization: kpiForm.value.interviewSlotUtilization.trim(),
          timetoDecision: kpiForm.value.timetoDecision.trim(),
          candidateConversionRate: kpiForm.value.candidateConversionRate.trim()
        };
        const response = await axios.put(
          `${API_BASE_URL}/config/kpi`,
          trimmedForm,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.success) {
          kpiSuccess.value = 'KPI settings saved successfully!';
        } else {
          kpiError.value = response.data.error || 'Failed to save KPI settings';
        }
      } catch (err) {
        kpiError.value = err.response?.data?.error || err.message || 'Failed to save KPI settings';
      } finally {
        kpiLoading.value = false;
      }
    };




    
    const fetchSmtpSettings = async () => {
      smtpLoading.value = true;
      smtpError.value = '';
      smtpSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/config/smtp`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          if (response.data.data) {
            smtpForm.value = {
              smtp_server: response.data.data.smtp_server || '',
              smtp_port: response.data.data.smtp_port || '',
              smtp_user_name: response.data.data.smtp_user_name || '',
              smtp_password: response.data.data.smtp_password || '',
              from_email: response.data.data.from_email || '',
              smtp_type: response.data.data.smtp_type || '',
              is_secure_smtp: Boolean(response.data.data.is_secure_smtp)
            };
          }
        } else {
          smtpError.value = response.data.error || 'Failed to fetch SMTP settings';
        }
      } catch (err) {
        smtpError.value = err.response?.data?.error || err.message || 'Failed to fetch SMTP settings';
      } finally {
        smtpLoading.value = false;
      }
    };
    
    const handleSmtpSubmit = async () => {
      smtpLoading.value = true;
      smtpError.value = '';
      smtpSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const trimmedForm = {
          ...smtpForm.value,
          smtp_server: smtpForm.value.smtp_server.trim(),
          smtp_port: smtpForm.value.smtp_port.trim(),
          smtp_user_name: smtpForm.value.smtp_user_name.trim(),
          smtp_password: smtpForm.value.smtp_password.trim(),
          from_email: smtpForm.value.from_email.trim(),
          smtp_type: smtpForm.value.smtp_type.trim(),
        };
        const response = await axios.put(
          `${API_BASE_URL}/config/smtp`,
          trimmedForm,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          smtpSuccess.value = 'SMTP settings saved successfully!';
          // Update form with returned data (password will be masked)
          if (response.data.data) {
            smtpForm.value.smtp_password = response.data.data.smtp_password || smtpForm.value.smtp_password;
          }
          // Clear success message after 3 seconds
          setTimeout(() => {
            smtpSuccess.value = '';
          }, 3000);
        } else {
          smtpError.value = response.data.error || 'Failed to save SMTP settings';
        }
      } catch (err) {
        smtpError.value = err.response?.data?.error || err.message || 'Failed to save SMTP settings';
      } finally {
        smtpLoading.value = false;
      }
    };
    
    // Check if user is admin, redirect if not
    onMounted(async () => {
      await fetchCurrentUser();
      
      if (!isAdmin.value) {
        router.push('/');
        return;
      }
      
      // Fetch existing settings
      await fetchSmtpSettings();
      await fetchZoomSettings();
        await fetchGroqKeys(); 
        await fetchKpiSettings();
    });
    
    const fetchZoomSettings = async () => {
      zoomLoading.value = true;
      zoomError.value = '';
      zoomSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/config/zoom`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          if (response.data.data) {
            zoomForm.value = {
              ZOOM_ACCOUNT_ID: response.data.data.ZOOM_ACCOUNT_ID || '',
              ZOOM_CLIENT_ID: response.data.data.ZOOM_CLIENT_ID || '',
              ZOOM_CLIENT_SECRET: response.data.data.ZOOM_CLIENT_SECRET || '',
              Zoom_Email: response.data.data.Zoom_Email || '',
              Zoom_join_before_host: Boolean(response.data.data.Zoom_join_before_host),
              Zoom_waiting_room: Boolean(response.data.data.Zoom_waiting_room)
            };
          }
        } else {
          zoomError.value = response.data.error || 'Failed to fetch Zoom settings';
        }
      } catch (err) {
        zoomError.value = err.response?.data?.error || err.message || 'Failed to fetch Zoom settings';
      } finally {
        zoomLoading.value = false;
      }
    };
    
    const handleZoomSubmit = async () => {
      zoomLoading.value = true;
      zoomError.value = '';
      zoomSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const trimmedForm = {
          ...zoomForm.value,
          ZOOM_ACCOUNT_ID: zoomForm.value.ZOOM_ACCOUNT_ID.trim(),
          ZOOM_CLIENT_ID: zoomForm.value.ZOOM_CLIENT_ID.trim(),
          ZOOM_CLIENT_SECRET: zoomForm.value.ZOOM_CLIENT_SECRET.trim(),
          Zoom_Email: zoomForm.value.Zoom_Email.trim(),
        };
        const response = await axios.put(
          `${API_BASE_URL}/config/zoom`,
          trimmedForm,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          zoomSuccess.value = 'Zoom settings saved successfully!';
          // Update form with returned data (secret will be masked)
          if (response.data.data) {
            zoomForm.value.ZOOM_CLIENT_SECRET = response.data.data.ZOOM_CLIENT_SECRET || zoomForm.value.ZOOM_CLIENT_SECRET;
          }
          // Clear success message after 3 seconds
          setTimeout(() => {
            zoomSuccess.value = '';
          }, 3000);
        } else {
          zoomError.value = response.data.error || 'Failed to save Zoom settings';
        }
      } catch (err) {
        zoomError.value = err.response?.data?.error || err.message || 'Failed to save Zoom settings';
      } finally {
        zoomLoading.value = false;
      }
    };
    
    return {
      activeTab,
      smtpForm,
      smtpLoading,
      smtpError,
      smtpSuccess,
      kpiForm,
      kpiLoading,
      kpiError,
      kpiSuccess,
      fetchSmtpSettings,
      fetchKpiSettings,
      handleSmtpSubmit,
      handlekpiSubmit,
      zoomForm,
      zoomLoading,
      zoomError,
      zoomSuccess,
      fetchZoomSettings,
      handleZoomSubmit,
      openAddKeyModal,
      closeAddKeyModal,
      addGroqKey,
      GroqKeys,
      GroqSearch,
      showAddKeyModal,
      GroqSuccess,
      filteredGroqKeys,
      maskKey,
      toggleGroqStatus,
      deleteGroqKey,
      fetchGroqKeys,
      newGroqKey,

    };
  }
};
</script>

<style scoped>
.nav-tabs {
  background: transparent;
  border-bottom: 2px solid #e5e7eb;
}

.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-tabs .nav-link:hover {
  color: #4299e1;
  border-bottom-color: #cbd5e0;
}

.nav-tabs .nav-link.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
  background: transparent;
}

.alert-ats-info {
  background-color: #e0f2fe;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 1rem;
  border-radius: 8px;
}

.form-check-input {
  width: 2.5rem;
  height: 1.25rem;
}

.form-check-input:checked {
  background-color: #4299e1;
  border-color: #4299e1;
}
</style>
