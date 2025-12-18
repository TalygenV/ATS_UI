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

    <nav v-if="isAuthenticated" class="navbar navbar-expand-lg navbar-ats">
      <div class="container-fluid px-4 py-2">
        <h1 class="logo-ats mb-0">ATS System</h1>
        <div class="d-flex flex-wrap align-items-center gap-4">
          <router-link :to="{ name: 'JobDescriptions' }" class="nav-link-ats">Job Descriptions</router-link>
          <router-link v-if="user?.role !== 'Interviewer'" to="/resumes" class="nav-link-ats">All Resumes</router-link>
          <router-link to="/" class="nav-link-ats">Dashboard</router-link>
          <router-link v-if="isAdmin" to="/register" class="nav-link-ats">Create User</router-link>
          <div class="d-flex align-items-center gap-3 ms-auto ps-4 border-start border-light border-opacity-25">
            <span class="text-white fw-medium">{{ user?.full_name || user?.email }}</span>
            <span class="user-role-badge">{{ user?.role }}</span>
            <button @click="handleLogout" class="logout-btn-ats">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="main-content container-fluid">
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

#app {
  min-height: 100vh;
}

.main-content {
  max-width: 90%;
  margin: 0 auto;
  padding: 0 2.5rem;
  padding-top: 10px !important;
}

@media screen and (max-width: 1440px) {
  .main-content { max-width: 100%; }
}

@media (max-width: 768px) {
  .main-content {
    padding: 0 1.5rem;
    padding-top: 10px !important;
  }
}
</style>
