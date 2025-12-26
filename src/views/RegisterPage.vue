<template>
  <div class="py-4">
    <div class="page-header-ats">
      <h2 class="page-title-ats">User Management</h2>
    </div>

    <!-- Create User Section -->
    <div class="ats-card mb-4">
      <h3 class="fs-5 fw-semibold mb-4">Create New User</h3>
      
      <form @submit.prevent="handleRegister" class="d-flex flex-column gap-4">
        <div v-if="error" class="alert-ats-danger">{{ error }}</div>
        <div v-if="success" class="alert-ats-success">{{ success }}</div>
        
        <div class="row g-3">
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="email" class="fw-semibold text-dark small">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="Enter email address"
                class="form-control-ats"
              />
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="password" class="fw-semibold text-dark small">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                placeholder="Enter password"
                class="form-control-ats"
                minlength="6"
              />
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="full_name" class="fw-semibold text-dark small">Full Name (Optional)</label>
              <input
                id="full_name"
                v-model="full_name"
                type="text"
                placeholder="Enter full name"
                class="form-control-ats"
              />
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="d-flex flex-column gap-2">
              <label for="role" class="fw-semibold text-dark small">Role</label>
              <select
                id="role"
                v-model="role"
                required
                class="form-select-ats"
              >
                <option value="">Select a role</option>
                <option value="HR">HR - Full Access</option>
                <option value="Interviewer">Interviewer - View Only</option>
                <option value="Admin">Admin - All Access</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-2">
          <button type="submit" :disabled="loading" class="btn-ats-primary">
            <span v-if="loading">Registering...</span>
            <span v-else>Register User</span>
          </button>
          <button type="button" @click="$router.push('/')" class="btn-ats-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Users Listing Section -->
    <div class="ats-card">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="fs-5 fw-semibold mb-0">All Users</h3>
        <button @click="fetchUsers" class="btn-ats-secondary btn-ats-sm" :disabled="loadingUsers">
          <span v-if="loadingUsers">Loading...</span>
          <span v-else>Refresh</span>
        </button>
      </div>

      <div v-if="loadingUsers" class="loading-state-ats">Loading users...</div>
      <div v-else-if="usersError" class="alert-ats-danger">{{ usersError }}</div>
      <div v-else-if="users.length === 0" class="empty-state-ats">
        <p>No users found.</p>
      </div>
      <div v-else class="table-responsive">
        <table class="table-ats">
          <thead>
            <tr>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.full_name || 'N/A' }}</td>
              <td>
                <span class="badge-ats" :class="'badge-ats-' + user.role.toLowerCase()">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span class="badge-ats" :class="user.status === 'active' ? 'badge-ats-success' : 'badge-ats-danger'">
                  {{ user.status || 'active' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <button @click="openEditModal(user)" class="btn-ats-primary btn-ats-sm">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay-ats" @click="closeEditModal">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2 class="fs-4 fw-semibold">Edit User</h2>
          <button @click="closeEditModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="handleUpdateUser">
            <div v-if="updateError" class="alert-ats-danger mb-3">{{ updateError }}</div>
            <div v-if="updateSuccess" class="alert-ats-success mb-3">{{ updateSuccess }}</div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">Email</label>
              <input
                type="email"
                :value="editingUser.email"
                disabled
                class="form-control-ats"
              />
              <small class="text-muted">Email cannot be changed</small>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">Full Name</label>
              <input
                v-model="editForm.full_name"
                type="text"
                placeholder="Enter full name"
                class="form-control-ats"
              />
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">Password</label>
              <input
                v-model="editForm.password"
                type="password"
                placeholder="Leave blank to keep current password"
                class="form-control-ats"
                minlength="6"
              />
              <small class="text-muted">Leave blank to keep current password</small>
            </div>

            <div class="mb-3">
              <label class="form-label fw-medium text-dark">Status</label>
              <select v-model="editForm.status" class="form-select-ats">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <small class="text-muted">Inactive users cannot login or be assigned interviews</small>
            </div>

            <div class="d-flex gap-2 justify-content-end">
              <button type="button" @click="closeEditModal" class="btn-ats-secondary">Cancel</button>
              <button type="submit" :disabled="updating" class="btn-ats-primary">
                <span v-if="updating">Updating...</span>
                <span v-else>Update User</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter();
    const auth = useAuth();
    const { register, loading, error: authError, isAdmin, fetchCurrentUser } = auth;
    
    // Registration form
    const email = ref('');
    const password = ref('');
    const full_name = ref('');
    const role = ref('');
    const error = ref('');
    const success = ref('');
    
    // Users listing
    const users = ref([]);
    const loadingUsers = ref(false);
    const usersError = ref('');
    
    // Edit modal
    const showEditModal = ref(false);
    const editingUser = ref(null);
    const editForm = ref({
      full_name: '',
      password: '',
      status: 'active'
    });
    const updating = ref(false);
    const updateError = ref('');
    const updateSuccess = ref('');
    
    const handleRegister = async () => {
      error.value = '';
      success.value = '';
      
      const result = await register(email.value, password.value, role.value, full_name.value);
      
      if (result.success) {
        success.value = 'User registered successfully!';
        // Reset form
        email.value = '';
        password.value = '';
        full_name.value = '';
        role.value = '';
        
        // Refresh users list
        await fetchUsers();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          success.value = '';
        }, 3000);
      } else {
        error.value = result.error || 'Registration failed';
      }
    };
    
    const fetchUsers = async () => {
      loadingUsers.value = true;
      usersError.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/auth/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          users.value = response.data.data;
        } else {
          usersError.value = response.data.error || 'Failed to fetch users';
        }
      } catch (err) {
        usersError.value = err.response?.data?.error || err.message || 'Failed to fetch users';
      } finally {
        loadingUsers.value = false;
      }
    };
    
    const openEditModal = (user) => {
      editingUser.value = user;
      editForm.value = {
        full_name: user.full_name || '',
        password: '',
        status: user.status || 'active'
      };
      updateError.value = '';
      updateSuccess.value = '';
      showEditModal.value = true;
    };
    
    const closeEditModal = () => {
      showEditModal.value = false;
      editingUser.value = null;
      editForm.value = {
        full_name: '',
        password: '',
        status: 'active'
      };
      updateError.value = '';
      updateSuccess.value = '';
    };
    
    const handleUpdateUser = async () => {
      if (!editingUser.value) return;
      
      updating.value = true;
      updateError.value = '';
      updateSuccess.value = '';
      
      try {
        const token = localStorage.getItem('auth_token');
        const updateData = {};
        
        if (editForm.value.full_name !== editingUser.value.full_name) {
          updateData.full_name = editForm.value.full_name;
        }
        
        if (editForm.value.password) {
          updateData.password = editForm.value.password;
        }
        
        if (editForm.value.status !== (editingUser.value.status || 'active')) {
          updateData.status = editForm.value.status;
        }
        
        if (Object.keys(updateData).length === 0) {
          updateError.value = 'No changes to update';
          updating.value = false;
          return;
        }
        
        const response = await axios.put(
          `${API_BASE_URL}/auth/users/${editingUser.value.id}`,
          updateData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          updateSuccess.value = 'User updated successfully!';
          // Refresh users list
          await fetchUsers();
          // Close modal after 1.5 seconds
          setTimeout(() => {
            closeEditModal();
          }, 1500);
        } else {
          updateError.value = response.data.error || 'Failed to update user';
        }
      } catch (err) {
        updateError.value = err.response?.data?.error || err.message || 'Failed to update user';
      } finally {
        updating.value = false;
      }
    };
    
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    // Check if user is admin, redirect if not
    onMounted(async () => {
      await fetchCurrentUser();
      
      if (!isAdmin.value) {
        router.push('/');
        return;
      }
      
      await fetchUsers();
    });
    
    return {
      email,
      password,
      full_name,
      role,
      loading,
      error: computed(() => error.value || authError.value),
      success,
      handleRegister,
      users,
      loadingUsers,
      usersError,
      fetchUsers,
      showEditModal,
      editingUser,
      editForm,
      updating,
      updateError,
      updateSuccess,
      openEditModal,
      closeEditModal,
      handleUpdateUser,
      formatDate
    };
  }
};
</script>

<style scoped>
.table-ats {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.table-ats thead {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
}

.table-ats th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-ats td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
}

.table-ats tbody tr:hover {
  background-color: #f9fafb;
}

.table-ats tbody tr:last-child td {
  border-bottom: none;
}

.badge-ats-hr {
  background-color: #3b82f6;
  color: white;
}

.badge-ats-interviewer {
  background-color: #8b5cf6;
  color: white;
}

.badge-ats-admin {
  background-color: #ef4444;
  color: white;
}
</style>
