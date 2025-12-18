<template>
  <div class="py-4" style="max-width: 1200px; margin: 0 auto;">
    <div class="mb-4">
      <h1 class="page-title-ats">Talygen File Management</h1>
      <p class="text-muted">Upload and manage files stored in Talygen</p>
    </div>

    <!-- Upload Section (HR and Admin only) -->
    <div v-if="hasWriteAccess" class="ats-card ats-card-xl mb-4">
      <h2 class="fs-4 fw-semibold mb-4">Upload File to Talygen</h2>
      
      <div>
        <div 
          class="upload-area-ats" 
          :class="{ 'drag-over': isDragOver }"
          @drop="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @click="triggerFileInput">
          <input 
            ref="fileInput"
            type="file" 
            accept="*/*"
            @change="handleFileSelect"
            style="display: none"
          />
          <div class="fs-1 mb-3">📁</div>
          <p class="fs-5 text-dark mb-2"><strong>Click to upload</strong> or drag and drop</p>
          <p class="text-muted">Any file type supported</p>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="mt-4">
          <div class="progress-ats">
            <div class="progress-fill-ats" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <p class="text-center text-muted small mt-2">Uploading... {{ uploadProgress }}%</p>
        </div>

        <!-- Selected File Info -->
        <div v-if="selectedFile && !uploading" class="d-flex align-items-center gap-3 flex-wrap bg-light p-3 rounded-3 mt-4">
          <div class="d-flex align-items-center gap-2">
            <span class="fw-medium text-muted">Selected File:</span>
            <span class="text-dark">{{ selectedFile.name }}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="fw-medium text-muted">Size:</span>
            <span class="text-dark">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <button @click="clearSelectedFile" class="btn-ats-secondary btn-ats-sm">Clear</button>
        </div>

        <!-- Upload Button -->
        <div v-if="selectedFile && !uploading" class="mt-4">
          <button @click="handleUpload" :disabled="!selectedFile || uploading" class="btn-ats-primary">
            Upload to Talygen
          </button>
        </div>

        <!-- Upload Success Message -->
        <div v-if="uploadSuccess" class="alert-ats-success mt-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="fs-4 fw-bold text-success">✓</div>
            <div>
              <h3 class="fs-6 fw-semibold text-dark mb-2">File uploaded successfully!</h3>
              <div v-if="uploadedFileData" class="small text-secondary">
                <p class="mb-1"><strong>File Name:</strong> {{ uploadedFileData.fileName }}</p>
                <p class="mb-1"><strong>File Path:</strong> 
                  <a :href="uploadedFileData.filePath" target="_blank" class="text-primary">{{ uploadedFileData.filePath }}</a>
                </p>
                <p v-if="uploadedFileData.fileThumbPath" class="mb-1">
                  <strong>Thumbnail:</strong> <a :href="uploadedFileData.fileThumbPath" target="_blank" class="text-primary">View Thumbnail</a>
                </p>
                <p class="mb-1"><strong>File Size:</strong> {{ formatFileSize(uploadedFileData.fileSize) }}</p>
                <p class="mb-0"><strong>Upload Status:</strong> 
                  <span :class="'badge-ats badge-ats-' + getUploadStatusClass(uploadedFileData.uploadStatus)">
                    {{ getUploadStatus(uploadedFileData.uploadStatus) }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Error Message -->
        <div v-if="uploadError" class="alert-ats-danger mt-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="fs-4 fw-bold text-danger">✗</div>
            <div>
              <h3 class="fs-6 fw-semibold text-dark mb-2">Upload Failed</h3>
              <p class="mb-0 text-secondary">{{ uploadError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Access Denied Message -->
    <div v-else class="ats-card ats-card-xl text-center py-5">
      <h2 class="text-danger mb-3">Access Denied</h2>
      <p class="text-secondary fs-5 mb-4">You don't have permission to upload files. Only HR and Admin users can upload files to Talygen.</p>
      <button @click="$router.push('/job-descriptions')" class="btn-ats-primary">Go to Job Descriptions</button>
    </div>

    <!-- Files List Section -->
    <div class="ats-card ats-card-xl">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fs-4 fw-semibold mb-0">Uploaded Files</h2>
        <button @click="refreshFiles" :disabled="loading" class="btn-ats-secondary btn-ats-sm">
          <span v-if="loading">Loading...</span>
          <span v-else>Refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && files.length === 0" class="loading-state-ats">
        <div class="spinner-ats"></div>
        <p>Loading files...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error && files.length === 0" class="text-center py-4">
        <p class="text-danger mb-3">{{ error }}</p>
        <button @click="refreshFiles" class="btn-ats-primary">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="files.length === 0" class="empty-state-ats">
        <p>No files uploaded yet.</p>
      </div>

      <!-- Files Table -->
      <div v-else class="table-responsive">
        <table class="table table-ats w-100">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>File Name</th>
              <th>Size</th>
              <th>Status</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file.id">
              <td style="width: 80px;">
                <img 
                  v-if="file.file_thumb_path || file.fileThumbPath" 
                  :src="file.file_thumb_path || file.fileThumbPath" 
                  :alt="file.file_name || file.fileName"
                  class="thumbnail-ats"
                  @error="handleImageError"
                />
                <span v-else class="text-muted">—</span>
              </td>
              <td style="min-width: 200px;">
                <div class="fw-medium text-dark mb-1">{{ file.original_file_name || file.originalFileName || file.file_name || file.fileName }}</div>
                <div v-if="file.file_path || file.filePath" class="small">
                  <a :href="file.file_path || file.filePath" target="_blank" class="text-primary">View File</a>
                </div>
              </td>
              <td>{{ formatFileSize(file.file_size || file.fileSize) }}</td>
              <td>
                <span :class="'badge-ats badge-ats-' + getUploadStatusClass(file.upload_status || file.uploadStatus)">
                  {{ getUploadStatus(file.upload_status || file.uploadStatus) }}
                </span>
              </td>
              <td class="text-muted small">{{ formatDate(file.created_at || file.createdAt) }}</td>
              <td>
                <button 
                  @click="handleDownload(file.id, file.original_file_name || file.originalFileName || file.file_name || file.fileName)"
                  :disabled="downloadingFileId === file.id"
                  class="btn-ats-primary btn-ats-sm">
                  <span v-if="downloadingFileId === file.id">Downloading...</span>
                  <span v-else>Download</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="d-flex justify-content-center align-items-center gap-3 mt-4 pt-4 border-top">
          <button 
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page === 1 || loading"
            class="btn-ats-secondary btn-ats-sm">
            Previous
          </button>
          <span class="text-muted small">
            Page {{ pagination.page }} of {{ pagination.totalPages }} ({{ pagination.total }} total files)
          </span>
          <button 
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages || loading"
            class="btn-ats-secondary btn-ats-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useTalygenFiles } from '../composables/useTalygenFiles';
import { useAuth } from '../composables/useAuth';

export default {
  name: 'TalygenFilesPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    const {
      files,
      loading,
      uploading,
      uploadProgress,
      error,
      pagination,
      uploadFile,
      downloadFile,
      fetchFiles,
      formatFileSize,
      formatDate,
      getUploadStatus,
      getUploadStatusClass
    } = useTalygenFiles();

    const selectedFile = ref(null);
    const isDragOver = ref(false);
    const fileInput = ref(null);
    const uploadSuccess = ref(false);
    const uploadError = ref(null);
    const uploadedFileData = ref(null);
    const downloadingFileId = ref(null);

    onMounted(async () => {
      await fetchFiles();
    });

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedFile.value = file;
        uploadSuccess.value = false;
        uploadError.value = null;
      }
    };

    const handleDrop = (event) => {
      event.preventDefault();
      isDragOver.value = false;
      const file = event.dataTransfer.files[0];
      if (file) {
        selectedFile.value = file;
        uploadSuccess.value = false;
        uploadError.value = null;
      }
    };

    const clearSelectedFile = () => {
      selectedFile.value = null;
      uploadSuccess.value = false;
      uploadError.value = null;
      uploadedFileData.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };

    const handleUpload = async () => {
      if (!selectedFile.value) return;

      uploadSuccess.value = false;
      uploadError.value = null;
      uploadedFileData.value = null;

      const result = await uploadFile(selectedFile.value);

      if (result.success) {
        uploadSuccess.value = true;
        uploadedFileData.value = result.data;
        setTimeout(() => {
          clearSelectedFile();
        }, 5000);
      } else {
        uploadError.value = result.error;
      }
    };

    const handleDownload = async (fileId, fileName) => {
      downloadingFileId.value = fileId;
      const result = await downloadFile(fileId, fileName);
      downloadingFileId.value = null;

      if (!result.success) {
        alert(`Download failed: ${result.error}`);
      }
    };

    const refreshFiles = async () => {
      await fetchFiles(pagination.value.page, pagination.value.limit);
    };

    const goToPage = async (page) => {
      if (page >= 1 && page <= pagination.value.totalPages) {
        await fetchFiles(page, pagination.value.limit);
      }
    };

    const handleImageError = (event) => {
      event.target.style.display = 'none';
    };

    return {
      hasWriteAccess,
      files,
      loading,
      uploading,
      uploadProgress,
      error,
      pagination,
      selectedFile,
      isDragOver,
      fileInput,
      uploadSuccess,
      uploadError,
      uploadedFileData,
      downloadingFileId,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      clearSelectedFile,
      handleUpload,
      handleDownload,
      refreshFiles,
      goToPage,
      handleImageError,
      formatFileSize,
      formatDate,
      getUploadStatus,
      getUploadStatusClass
    };
  }
};
</script>
