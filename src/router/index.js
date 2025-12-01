import { createRouter, createWebHistory } from 'vue-router';
import UploadPage from '../views/UploadPage.vue';
import ResumesPage from '../views/ResumesPage.vue';
import JobDescriptionsPage from '../views/JobDescriptionsPage.vue';
import JobDetailPage from '../views/JobDetailPage.vue';
import ResumeDetailPage from '../views/ResumeDetailPage.vue';
import CandidatesPage from '../views/CandidatesPage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import TalygenFilesPage from '../views/TalygenFilesPage.vue';
import { useAuth } from '../composables/useAuth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/',
    name: 'JobDescriptions',
    component: JobDescriptionsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/job-descriptions',
    name: 'JobDescriptionsList',
    component: JobDescriptionsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/job-descriptions/:id',
    name: 'JobDetail',
    component: JobDetailPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/job-descriptions/:jobId/resumes/:evaluationId',
    name: 'ResumeDetail',
    component: ResumeDetailPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: UploadPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/resumes',
    name: 'Resumes',
    component: ResumesPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/candidates/:jobId',
    name: 'Candidates',
    component: CandidatesPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/talygen-files',
    name: 'TalygenFiles',
    component: TalygenFilesPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/interviewer-dashboard',
    name: 'InterviewerDashboard',
    component: () => import('../views/InterviewerDashboard.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isAdmin, init, fetchCurrentUser } = useAuth();
  
  // Initialize auth state
  await init();
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!isAuthenticated.value) {
      // Not authenticated, redirect to login
      next({ name: 'Login', query: { redirect: to.fullPath } });
      return;
    }
    
    // Check if route requires admin
    if (to.meta.requiresAdmin && !isAdmin.value) {
      // Not admin, redirect to home
      next({ name: 'JobDescriptions' });
      return;
    }
  } else if (to.name === 'Login' && isAuthenticated.value) {
    // Already logged in, redirect to home
    next({ name: 'JobDescriptions' });
    return;
  }
  
  next();
});

export default router;

