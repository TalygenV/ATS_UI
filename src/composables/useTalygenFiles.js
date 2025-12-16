import { ref, computed } from 'vue';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { formatDateTime as formatDateUTC } from '../utils/datetimeUtils';

// Reactive state
const files = ref([]);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref(null);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
});

export function useTalygenFiles() {
  // Upload file to Talygen
  const uploadFile = async (file) => {
    uploading.value = true;
    uploadProgress.value = 0;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/upload/talygen`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        }
      });

      if (response.data.success) {
        // Refresh the file list
        await fetchFiles(pagination.value.page, pagination.value.limit);
        return {
          success: true,
          data: response.data.data,
          apiResponse: response.data.apiResponse
        };
      } else {
        error.value = response.data.message || 'Upload failed';
        return {
          success: false,
          error: error.value
        };
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed';
      return {
        success: false,
        error: error.value
      };
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  };

  // Download file from Talygen
  const downloadFile = async (fileId, fileName) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_BASE_URL}/upload/talygen/${fileId}/download`, {
        responseType: 'blob'
      });

      // Get filename from Content-Disposition header or use provided filename
      let downloadFileName = fileName;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Download failed';
      return {
        success: false,
        error: error.value
      };
    } finally {
      loading.value = false;
    }
  };

  // Fetch list of uploaded files
  const fetchFiles = async (page = 1, limit = 20) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_BASE_URL}/upload/talygen`, {
        params: {
          page,
          limit
        }
      });

      if (response.data.success) {
        files.value = response.data.data || [];
        pagination.value = {
          page: response.data.pagination?.page || page,
          limit: response.data.pagination?.limit || limit,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        };
        return { success: true };
      } else {
        error.value = response.data.message || 'Failed to fetch files';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch files';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date to readable format (using UTC utility)
  const formatDate = (dateString) => formatDateUTC(dateString);

  // Get upload status text
  const getUploadStatus = (status) => {
    if (status === 1) return 'Success';
    if (status === 0) return 'Pending';
    return 'Failed';
  };

  // Get upload status class for styling
  const getUploadStatusClass = (status) => {
    if (status === 1) return 'status-success';
    if (status === 0) return 'status-pending';
    return 'status-failed';
  };

  return {
    // State
    files: computed(() => files.value),
    loading: computed(() => loading.value),
    uploading: computed(() => uploading.value),
    uploadProgress: computed(() => uploadProgress.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),

    // Methods
    uploadFile,
    downloadFile,
    fetchFiles,
    formatFileSize,
    formatDate,
    getUploadStatus,
    getUploadStatusClass
  };
}

