import { ref, computed } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Reactive state
const user = ref(null);
const token = ref(localStorage.getItem('auth_token') || null);
const loading = ref(false);
const error = ref(null);

// Initialize axios with auth token if available
if (token.value) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
}

export function useAuth() {
  // Check if user is authenticated
  const isAuthenticated = computed(() => !!user.value && !!token.value);

  // Check user role
  const hasRole = (role) => {
    return user.value?.role === role;
  };

  // Check if user has write access (HR or Admin)
  const hasWriteAccess = computed(() => {
    return user.value && ['HR', 'Admin'].includes(user.value.role);
  });

  // Check if user is admin
  const isAdmin = computed(() => {
    return user.value?.role === 'Admin';
  });

  // Login
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, session } = response.data.data;
        user.value = userData;
        token.value = session.access_token;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        
        return { success: true };
      } else {
        error.value = response.data.error || 'Login failed';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // Register (Admin only)
  const register = async (email, password, role, full_name) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        role,
        full_name
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        error.value = response.data.error || 'Registration failed';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.response?.data?.error || err.message || 'Registration failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state regardless of API response
      user.value = null;
      token.value = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      loading.value = false;
    }
  };

  // Get current user
  const fetchCurrentUser = async () => {
    if (!token.value) {
      return { success: false };
    }

    loading.value = true;
    error.value = null;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);

      if (response.data.success) {
        user.value = response.data.data;
        return { success: true, user: user.value };
      } else {
        // Token might be invalid, clear it
        token.value = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        delete axios.defaults.headers.common['Authorization'];
        return { success: false };
      }
    } catch (err) {
      // Token might be invalid, clear it
      token.value = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      return { success: false };
    } finally {
      loading.value = false;
    }
  };

  // Initialize auth state on app load
  const init = async () => {
    if (token.value) {
      await fetchCurrentUser();
    }
  };

  return {
    // State
    user: computed(() => user.value),
    token: computed(() => token.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Computed
    isAuthenticated,
    hasWriteAccess,
    isAdmin,
    
    // Methods
    login,
    register,
    logout,
    fetchCurrentUser,
    hasRole,
    init
  };
}

