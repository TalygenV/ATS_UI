import { ref } from 'vue';

// Global loader state
const isLoading = ref(false);
const loaderMessage = ref('');
const loaderSubMessage = ref('');

export function useLoader() {
  const showLoader = (message = 'Loading...', subMessage = '') => {
    isLoading.value = true;
    loaderMessage.value = message;
    loaderSubMessage.value = subMessage;
  };

  const hideLoader = () => {
    isLoading.value = false;
    loaderMessage.value = '';
    loaderSubMessage.value = '';
  };

  return {
    isLoading,
    loaderMessage,
    loaderSubMessage,
    showLoader,
    hideLoader
  };
}

