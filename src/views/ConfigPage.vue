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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export default {
  name: 'ConfigPage',
  setup() {
    const router = useRouter();
    const { isAdmin, fetchCurrentUser } = useAuth();
    
    const activeTab = ref('smtp');
    
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
    
    const smtpLoading = ref(false);
    const smtpError = ref('');
    const smtpSuccess = ref('');
    
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
        const response = await axios.put(
          `${API_BASE_URL}/config/smtp`,
          smtpForm.value,
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
        const response = await axios.put(
          `${API_BASE_URL}/config/zoom`,
          zoomForm.value,
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
      fetchSmtpSettings,
      handleSmtpSubmit,
      zoomForm,
      zoomLoading,
      zoomError,
      zoomSuccess,
      fetchZoomSettings,
      handleZoomSubmit
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
