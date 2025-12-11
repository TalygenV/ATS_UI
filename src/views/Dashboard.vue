<template>
    
    <HrAdminDashboard v-if="['HR', 'Admin'].includes(user.role)" />
    <InterviewerDashboard v-else-if="user.role === 'Interviewer'" />
</template>
<script setup>
import { useAuth }from '../composables/useAuth';
import HrAdminDashboard from './HrAdminDashboard.vue';
import InterviewerDashboard from './InterviewerDashboard.vue';


const { user } = useAuth();

</script>