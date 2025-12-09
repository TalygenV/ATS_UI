<template>
  <div id="app">
    <!-- Global Fullscreen Loader -->
    <Teleport to="body">
      <div v-if="isLoading" class="global-loader">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <p class="loader-text">{{ loaderMessage }}</p>
          <p v-if="loaderSubMessage" class="loader-subtext">{{ loaderSubMessage }}</p>
        </div>
      </div>
    </Teleport>

    <nav v-if="isAuthenticated" class="navbar">
      <div class="container">
        <h1 class="logo">ATS System</h1>
        <div class="nav-links">
          <router-link :to="{ name: 'JobDescriptions' }" class="nav-link">Job Descriptions</router-link>
          <router-link v-if="user?.role !== 'Interviewer'" to="/resumes" class="nav-link">All Resumes</router-link>
          <!-- For interviewers, show a clear dashboard link for managing availability and interviews -->
          <router-link
            v-if="user?.role === 'Interviewer'"
            :to="{ name: 'InterviewerDashboard' }"
            class="nav-link"
          >
            Dashboard
          </router-link>
          
          <router-link v-if="isAdmin" to="/register" class="nav-link">Create User</router-link>
          <div class="user-info">
            <span class="user-name">{{ user?.full_name || user?.email }}</span>
            <span class="user-role">{{ user?.role }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="w-100">
      <router-view />
    </main>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth';
import { useLoader } from './composables/useLoader';

export default {
  name: 'App',
  setup() {
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, hasRole, logout, init } = useAuth();
    const { isLoading, loaderMessage, loaderSubMessage } = useLoader();
    
    onMounted(async () => {
      await init();
    });
    
    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };
    
    return {
      user,
      isAuthenticated,
      isAdmin,
      hasRole,
      handleLogout,
      isLoading,
      loaderMessage,
      loaderSubMessage
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  background-attachment: fixed;
  color: #1a1a1a;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  padding: 1.25rem 0;
  box-shadow: 0 4px 20px rgba(66, 153, 225, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 999;
  backdrop-filter: blur(10px);
}

.navbar .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 2.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.5rem 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: white;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
  color: white;
  transform: translateY(-1px);
}

.nav-link:hover::after {
  width: 100%;
}

.nav-link.router-link-active {
  color: white;
  font-weight: 600;
}

.nav-link.router-link-active::after {
  width: 100%;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-left: auto;
  padding-left: 2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.user-name {
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
}

.user-role {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2.5rem;
  padding-top: 90px !important;
}

@media (max-width: 768px) {
  .navbar .container {
    padding: 0 1.5rem;
  }
  
  .nav-links {
    gap: 1.5rem;
  }
  
  .user-info {
    gap: 0.75rem;
    padding-left: 1.5rem;
  }
  
  .main-content {
    padding: 0 1.5rem;
    padding-top: 90px !important;
  }
}

/* Global Fullscreen Loader */
.global-loader {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(8px);
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 99999 !important;
  animation: fadeIn 0.2s ease-in;
  margin: 0 !important;
  padding: 0 !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loader-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.loader-spinner {
  width: 70px;
  height: 70px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loader-text {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: white;
  letter-spacing: 0.3px;
}

.loader-subtext {
  font-size: 1.1rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
}
</style>

