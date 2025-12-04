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
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.register-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 20s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.register-container {
  width: 100%;
  max-width: 550px;
  position: relative;
  z-index: 1;
}

.register-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-title {
  text-align: center;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  letter-spacing: -1px;
}

.register-subtitle {
  text-align: center;
  color: #718096;
  font-size: 0.95rem;
  margin-bottom: 2.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-group label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
}

.form-input {
  padding: 1rem 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  color: #1a202c;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.1);
  transform: translateY(-1px);
}

.form-input::placeholder {
  color: #a0aec0;
}

.error-message {
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  color: #c53030;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border-left: 4px solid #c53030;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(197, 48, 48, 0.1);
}

.success-message {
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #22543d;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border-left: 4px solid #38a169;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(56, 161, 105, 0.1);
}

.btn {
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(66, 153, 225, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 153, 225, 0.5);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f7fafc;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.btn-block {
  width: 100%;
}

@media (max-width: 480px) {
  .register-card {
    padding: 2rem 1.5rem;
  }
  
  .register-title {
    font-size: 1.75rem;
  }
}
</style>

