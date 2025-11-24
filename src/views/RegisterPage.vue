<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <h1 class="register-title">Register New User</h1>
        <p class="register-subtitle">Admin Only</p>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="Enter email address"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              placeholder="Enter password"
              class="form-input"
              minlength="6"
            />
          </div>
          
          <div class="form-group">
            <label for="full_name">Full Name (Optional)</label>
            <input
              id="full_name"
              v-model="full_name"
              type="text"
              placeholder="Enter full name"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="role">Role</label>
            <select
              id="role"
              v-model="role"
              required
              class="form-input"
            >
              <option value="">Select a role</option>
              <option value="HR">HR - Full Access</option>
              <option value="Interviewer">Interviewer - View Only</option>
              <option value="Admin">Admin - All Access</option>
            </select>
          </div>
          
          <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
            <span v-if="loading">Registering...</span>
            <span v-else>Register User</span>
          </button>
          
          <button type="button" @click="$router.push('/')" class="btn btn-secondary btn-block">
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

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  padding: 2rem;
}

.register-container {
  width: 100%;
  max-width: 500px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.register-title {
  text-align: center;
  color: #1976d2;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.register-subtitle {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #c33;
  font-size: 0.9rem;
}

.success-message {
  background: #efe;
  color: #3c3;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 4px solid #3c3;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-block {
  width: 100%;
}
</style>

