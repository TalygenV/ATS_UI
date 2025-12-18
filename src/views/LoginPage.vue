<template>
  <div class="auth-page-bg">
    <div class="w-100" style="max-width: 450px; position: relative; z-index: 1;">
      <div class="auth-card">
        <h1 class="auth-title">ATS System</h1>
        <h2 class="text-center text-secondary fs-5 mb-4">Sign In</h2>

        <form @submit.prevent="handleLogin" class="d-flex flex-column gap-4">
          <div v-if="error" class="alert-ats-danger">{{ error }}</div>

          <div class="d-flex flex-column gap-2">
            <label for="email" class="fw-semibold text-dark small">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              placeholder="Enter your email"
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
              placeholder="Enter your password"
              class="form-control-ats"
            />
          </div>

          <button type="submit" :disabled="loading" class="btn-ats-primary w-100">
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const { login, loading, error, hasRole } = useAuth();
    
    const email = ref('');
    const password = ref('');
    
    const handleLogin = async () => {
      const result = await login(email.value, password.value);
      if (result.success) {
        router.push('/');
      }
    };
    
    return {
      email,
      password,
      loading,
      error,
      handleLogin
    };
  }
};
</script>
