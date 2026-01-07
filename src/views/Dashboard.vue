<template>
<div class="page-wrapper">
<div class="content pb-0">
  <HrAdminDashboard v-if="user && ['HR', 'Admin'].includes(user.role)" />
  <InterviewerDashboard v-else-if="user?.role === 'Interviewer'" />
</div>
</div>  
</template>

<script setup>
import { useAuth } from '../composables/useAuth';
import HrAdminDashboard from './HrAdminDashboard.vue';
import InterviewerDashboard from './InterviewerDashboard.vue';

const { user } = useAuth();

import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'Dashboard | Hiring Portal'
})
</script>