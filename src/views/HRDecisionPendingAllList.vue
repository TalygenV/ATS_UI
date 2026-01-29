

<template>



         <div class="row g-4 mt-4">
              <div class="my-4" @click="onBack">
    <button class="btn-back">← Back</button>
  </div>
            
          <!--<div  class="col-12 d-flex justify-content-between align-items-center ats-card mb-3">
          <h3 class="fs-5 fw-bold mb-3">Decision Pending</h3>
        </div> -->

        <h2 class="page-title-ats">Decision Pending</h2>



         <HRDecisionPendingList :pastDecissionPendingSlots="pastDecissionPendingSlots"   @decision-done="descisionDoneTrigger = !descisionDoneTrigger"/>

           <!-- Load More Button -->
    <div v-if="canLoadMore" class="col-12 text-center mt-3">
      <button
        class="btn btn-outline-primary"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
    


</template>

<script setup>
import { ref, onMounted, watch , computed } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useLoader } from '../composables/useLoader';
import HRDecisionPendingList from './HRDecisionPendingList.vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const { showLoader, hideLoader } = useLoader();

const pageNumber = ref(1);
const pageSize = ref(10);

const totalCount = ref(0);
const loadingMore = ref(false);
const pastDecissionPendingSlots = ref([]);

const descisionDoneTrigger = ref(false);
const onBack = () => router.push('/');
watch(descisionDoneTrigger, async () => {
  resetAndReload();
});

const viewAllPending = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true;
    showLoader('Loading Next Page ....')
  } else {
    showLoader('Loading Decision Pending Interviews...');
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/evaluations/hr/all_hr_pending_feedback`,
      {
        params: {
          pageNumber: pageNumber.value,
          pageSize: pageSize.value
        }
      }
    );

    if (response?.data?.success) {
      totalCount.value = response.data.count || 0;

      if (isLoadMore) {
        pastDecissionPendingSlots.value.push(...response.data.data);
      } else {
        pastDecissionPendingSlots.value = response.data.data;
      }
    }
  } catch (error) {
    console.error('Error fetching decision pending interviews:', error);
  } finally {
    hideLoader();
    loadingMore.value = false;
  }
};

const loadMore = async () => {
  pageNumber.value++;
  await viewAllPending(true);
};

const resetAndReload = async () => {
  pageNumber.value = 1;
  pastDecissionPendingSlots.value = [];
  await viewAllPending();
};

const onDecisionDone = () => {
  descisionDoneTrigger.value = !descisionDoneTrigger.value;
};

const canLoadMore = computed(() => {
  return pastDecissionPendingSlots.value.length < totalCount.value;
});

onMounted(async () => {
  await viewAllPending();
});
</script>

