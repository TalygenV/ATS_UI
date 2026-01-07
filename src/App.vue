<template>
   <div class="main-wrapper">
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
      <!-- Topbar Start -->
      <header class="navbar-header" v-if="isAuthenticated" >
         <div class="page-container topbar-menu">
            <div class="d-flex align-items-center gap-2">
               <a href="javascript:;" class="logo">
               <span class="logo-light">
               <span class="logo-lg"><img :src="logimg" alt="Logo" /></span>
               <span class="logo-sm"><img :src="logimg" alt="small Logo" /></span>
               </span>
               <span class="logo-dark">
               <span class="logo-lg"><img :src="logimg" alt="Dark Logo" /></span>
               </span>
               </a>
               <a id="mobile_btn" class="mobile-btn" href="#sidebar">
               <i class="ti ti-menu-deep fs-24"></i>
               </a>
               <button class="sidenav-toggle-btn btn border-0 p-0" id="toggle_btn2"> 
               <i class="ti ti-arrow-bar-to-right"></i>
               </button> 
               <div class="me-auto d-flex align-items-center header-search d-lg-flex d-none">
                  <div class="input-icon position-relative me-2">
                     <input type="text" class="form-control" placeholder="Search Keyword">
                     <span class="input-icon-addon d-inline-flex p-0 header-search-icon"><i class="ti ti-command"></i></span>
                  </div>
               </div>
            </div>
            <div class="d-flex align-items-center">
               <div class="header-item d-flex d-lg-none me-2">
                  <button class="topbar-link btn" data-bs-toggle="modal" data-bs-target="#searchModal" type="button">
                  <i class="ti ti-search fs-16"></i>
                  </button>
               </div>
               <div class="header-item">
                  <div class="dropdown me-2">
                     <a href="javascript:void(0);" class="btn topbar-link btnFullscreen"><i class="ti ti-maximize"></i></a>
                  </div>
               </div>
               <div class="header-item d-none d-sm-flex me-2">
                  <button class="topbar-link btn topbar-link" id="light-dark-mode" type="button">
                  <i class="ti ti-moon fs-16"></i>
                  </button>
               </div>
               <div class="header-item d-none d-sm-flex">
                  <div class="dropdown me-2">
                     <a href="faq.html" class="btn topbar-link topbar-indigo-link"><i class="ti ti-help-hexagon"></i></a>
                  </div>
               </div>
               <!-- report -->
               <div class="header-item d-none d-sm-flex">
                  <div class="dropdown me-2">
                     <a href="lead-reports.html" class="btn topbar-link topbar-warning-link"><i class="ti ti-chart-pie"></i></a>
                  </div>
               </div>
               <div class="header-item  me-2">		
                  <button class="topbar-link btn topbar-link dropdown-toggle drop-arrow-none" data-bs-toggle="dropdown" data-bs-offset="0,24" type="button" aria-haspopup="false" aria-expanded="false">
                  <i class="ti ti-bell-check fs-16 animate-ring"></i>
                  <span class="badge rounded-pill">10</span>
                  </button>
               </div>
               <div class="dropdown profile-dropdown d-flex align-items-center justify-content-center">
                  <a href="javascript:void(0);" class="topbar-link dropdown-toggle drop-arrow-none position-relative" data-bs-toggle="dropdown" data-bs-offset="0,22" aria-haspopup="false" aria-expanded="false">
                  <img :src="userimg" width="38" class="rounded-1 d-flex" alt="user"/>
                  <span class="online text-success"><i class="ti ti-circle-filled d-flex bg-white rounded-circle border border-1 border-white"></i></span>
                  </a>
                  <div class="dropdown-menu dropdown-menu-end dropdown-menu-md p-2">
                     <div class="d-flex align-items-center bg-light rounded-3 p-2 mb-2">
                        <img :src="userimg" class="rounded-circle" width="42" height="42" alt="Img">
                        <div class="ms-2">
                           <p class="fw-medium text-dark mb-0">{{ user?.full_name || user?.email }}</p>
                           <span class="d-block fs-13">{{ user?.role }}</span>
                        </div>
                     </div>
                     <button @click="handleLogout" class="dropdown-item"><i class="ti ti-user-circle me-1 align-middle"></i> Logout</button>                 
                  </div>
               </div>
            </div>
         </div>
      </header>
      <!-- Topbar End -->
      <!-- Sidenav Menu Start -->
      <div class="sidebar" id="sidebar" v-if="isAuthenticated">
         <div class="sidebar-logo">
            <div>
               <a href="/" class="logo logo-normal">
               <img :src="logimg" alt="Logo" />
               </a>
               <a href="/" class="logo-small">
               <img :src="logimg" alt="Logo" />
               </a>
               <a href="/" class="dark-logo">
               <img :src="logimg" alt="Logo" />
               </a>
            </div>
            <button class="sidenav-toggle-btn btn border-0 p-0 active" id="toggle_btn"> 
            <i class="ti ti-arrow-bar-to-left"></i>
            </button>
            <button class="sidebar-close">
            <i class="ti ti-x align-middle"></i>
            </button>				               
         </div>
         <div class="sidebar-inner" data-simplebar>
            <div id="sidebar-menu" class="sidebar-menu">
               <ul>
                  <li class="menu-title"><span>Main Menu</span></li>
                  <li>
                     <ul>
                        <li><a href="/" class="active">
                           <i class="ti ti-user-star"></i><span>Dashboard</span>
                           </a>
                        </li>
                        <li>
                           <router-link :to="{ name: 'JobDescriptions' }" class="nav-link"><i class="ti ti-user-up"></i><span>Job Descriptions</span></router-link>
                        </li>
                        <li>
                           <router-link v-if="user?.role !== 'Interviewer'" to="/resumes" class="nav-link"><i class="ti ti-building-community"></i><span>All Resumes</span></router-link>
                        </li>
                        <!-- For interviewers, show a clear dashboard link for managing availability and interviews -->
                        <li>
                           <router-link
                              v-if="user?.role === 'Interviewer'"
                              :to="{ name: 'InterviewerDashboard' }"
                              class="nav-link"
                              >
                              <i class="ti ti-medal"></i><span>Deals</span>
                           </router-link>
                        </li>
                        <li>
                           <router-link v-if="isAdmin" to="/register" class="nav-link"><i class="ti ti-chart-arcs"></i><span>Create User</span></router-link>
                        </li>
                        <li>
                           <a @click="handleLogout" class="nav-link"><i class="ti ti-timeline-event-exclamation"></i><span>Logout</span></a>                  
                        </li>
                     </ul>
                  </li>
               </ul>
            </div>
         </div>
      </div>
      <!-- <nav v-if="isAuthenticated" class="navbar">
         <div class="container">
            <h1 class="logo">ATS System</h1>
            <div class="nav-links">
               
              
               
               
               <div class="user-info">
                  <span class="user-name">{{ user?.full_name || user?.email }}</span>
                  <span class="user-role">{{ user?.role }}</span>
                  
               </div>
            </div>
         </div>
         </nav> -->   
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
import logimg from './img/logo.png';
import userimg from './img/user-15.jpg';

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
      logimg,
      userimg,
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

