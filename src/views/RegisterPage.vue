<template>
  <div class="auth-page-bg">
    <div class="w-100" style="max-width: 550px; position: relative; z-index: 1;">
      <div class="auth-card">
        <h1 class="auth-title">Register New User</h1>
        <p class="text-center text-muted small text-uppercase mb-4" style="letter-spacing: 1px;">Admin Only</p>
        
        <form @submit.prevent="handleRegister" class="d-flex flex-column gap-4">
          <div v-if="error" class="alert-ats-danger">{{ error }}</div>
          <div v-if="success" class="alert-ats-success">{{ success }}</div>
          
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
          
          <button type="submit" :disabled="loading" class="btn-ats-primary w-100">
            <span v-if="loading">Registering...</span>
            <span v-else>Register User</span>
          </button>
          
          <button type="button" @click="$router.push('/')" class="btn-ats-secondary w-100">
            Cancel
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter();
    const { register, loading, error: authError } = useAuth();
    
    const email = ref('');
    const password = ref('');
    const full_name = ref('');
    const role = ref('');
    const error = ref('');
    const success = ref('');
    
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
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          success.value = '';
        }, 3000);
      } else {
        error.value = result.error || 'Registration failed';
      }
    };
    
    return {
      email,
      password,
      full_name,
      role,
      loading,
      error: computed(() => error.value || authError.value),
      success,
      handleRegister
    };
  }
};
</script>
