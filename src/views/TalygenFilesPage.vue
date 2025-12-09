<template>
  <div class="talygen-files-page">
    <div class="page-header">
      <h1>Talygen File Management</h1>
      <p class="subtitle">Upload and manage files stored in Talygen</p>
    </div>

    <!-- Upload Section (HR and Admin only) -->
    <div v-if="hasWriteAccess" class="card upload-card">
      <h2>Upload File to Talygen</h2>
      
      <div class="upload-section">
        <div 
          class="upload-area" 
          :class="{ 'drag-over': isDragOver, 'uploading': uploading }"
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
          <div class="upload-icon">📁</div>
          <p class="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="upload-hint">Any file type supported</p>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: uploadProgress + '%' }">
            </div>
          </div>
          <p class="progress-text">Uploading... {{ uploadProgress }}%</p>
        </div>

        <!-- Selected File Info -->
        <div v-if="selectedFile && !uploading" class="selected-file-info">
          <div class="file-info-item">
            <span class="file-label">Selected File:</span>
            <span class="file-value">{{ selectedFile.name }}</span>
          </div>
          <div class="file-info-item">
            <span class="file-label">Size:</span>
            <span class="file-value">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
          <button 
            @click="clearSelectedFile" 
            class="btn btn-secondary btn-sm">
            Clear
          </button>
        </div>

        <!-- Upload Button -->
        <div v-if="selectedFile && !uploading" class="upload-actions">
          <button 
            @click="handleUpload" 
            :disabled="!selectedFile || uploading"
            class="btn btn-primary">
            Upload to Talygen
          </button>
        </div>

        <!-- Upload Success Message -->
        <div v-if="uploadSuccess" class="success-message">
          <div class="message-icon">✓</div>
          <div class="message-content">
            <h3>File uploaded successfully!</h3>
            <div v-if="uploadedFileData" class="upload-details">
              <p><strong>File Name:</strong> {{ uploadedFileData.fileName }}</p>
              <p><strong>File Path:</strong> 
                <a :href="uploadedFileData.filePath" target="_blank" class="file-link">
                  {{ uploadedFileData.filePath }}
                </a>
              </p>
              <p v-if="uploadedFileData.fileThumbPath">
                <strong>Thumbnail:</strong> 
                <a :href="uploadedFileData.fileThumbPath" target="_blank" class="file-link">
                  View Thumbnail
                </a>
              </p>
              <p><strong>File Size:</strong> {{ formatFileSize(uploadedFileData.fileSize) }}</p>
              <p><strong>Upload Status:</strong> 
                <span :class="getUploadStatusClass(uploadedFileData.uploadStatus)">
                  {{ getUploadStatus(uploadedFileData.uploadStatus) }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Upload Error Message -->
        <div v-if="uploadError" class="error-message">
          <div class="message-icon">✗</div>
          <div class="message-content">
            <h3>Upload Failed</h3>
            <p>{{ uploadError }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Access Denied Message -->
    <div v-else class="card access-denied">
      <h2>Access Denied</h2>
      <p>You don't have permission to upload files. Only HR and Admin users can upload files to Talygen.</p>
      <button @click="$router.push('/job-descriptions')" class="btn btn-primary">
        Go to Job Descriptions
      </button>
    </div>

    <!-- Files List Section (All authenticated users) -->
    <div class="card files-list-card">
      <div class="list-header">
        <h2>Uploaded Files</h2>
        <button 
          @click="refreshFiles" 
          :disabled="loading"
          class="btn btn-secondary btn-sm">
          <span v-if="loading">Loading...</span>
          <span v-else>Refresh</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && files.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Loading files...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error && files.length === 0" class="error-state">
        <p class="error-text">{{ error }}</p>
        <button @click="refreshFiles" class="btn btn-primary">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="files.length === 0" class="empty-state">
        <p>No files uploaded yet.</p>
      </div>

      <!-- Files Table -->
      <div v-else class="files-table-container">
        <table class="files-table">
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
            <tr v-for="file in files" :key="file.id" class="file-row">
              <td class="thumbnail-cell">
                <img 
                  v-if="file.file_thumb_path || file.fileThumbPath" 
                  :src="file.file_thumb_path || file.fileThumbPath" 
                  :alt="file.file_name || file.fileName"
                  class="thumbnail"
                  @error="handleImageError"
                />
                <span v-else class="no-thumbnail">—</span>
              </td>
              <td class="file-name-cell">
                <div class="file-name">{{ file.original_file_name || file.originalFileName || file.file_name || file.fileName }}</div>
                <div v-if="file.file_path || file.filePath" class="file-path">
                  <a :href="file.file_path || file.filePath" target="_blank" class="file-link-small">
                    View File
                  </a>
                </div>
              </td>
              <td class="file-size-cell">{{ formatFileSize(file.file_size || file.fileSize) }}</td>
              <td class="status-cell">
                <span :class="['status-badge', getUploadStatusClass(file.upload_status || file.uploadStatus)]">
                  {{ getUploadStatus(file.upload_status || file.uploadStatus) }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(file.created_at || file.createdAt) }}</td>
              <td class="actions-cell">
                <button 
                  @click="handleDownload(file.id, file.original_file_name || file.originalFileName || file.file_name || file.fileName)"
                  :disabled="downloadingFileId === file.id"
                  class="btn btn-primary btn-sm">
                  <span v-if="downloadingFileId === file.id">Downloading...</span>
                  <span v-else>Download</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button 
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page === 1 || loading"
            class="btn btn-secondary btn-sm">
            Previous
          </button>
          <span class="page-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }} 
            ({{ pagination.total }} total files)
          </span>
          <button 
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page >= pagination.totalPages || loading"
            class="btn btn-secondary btn-sm">
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

    // Initialize - fetch files on mount
    onMounted(async () => {
      await fetchFiles();
    });

    // File selection handlers
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

    // Upload handler
    const handleUpload = async () => {
      if (!selectedFile.value) return;

      uploadSuccess.value = false;
      uploadError.value = null;
      uploadedFileData.value = null;

      const result = await uploadFile(selectedFile.value);

      if (result.success) {
        uploadSuccess.value = true;
        uploadedFileData.value = result.data;
        // Clear selected file after successful upload
        setTimeout(() => {
          clearSelectedFile();
        }, 5000);
      } else {
        uploadError.value = result.error;
      }
    };

    // Download handler
    const handleDownload = async (fileId, fileName) => {
      downloadingFileId.value = fileId;
      const result = await downloadFile(fileId, fileName);
      downloadingFileId.value = null;

      if (!result.success) {
        alert(`Download failed: ${result.error}`);
      }
    };

    // Refresh files list
    const refreshFiles = async () => {
      await fetchFiles(pagination.value.page, pagination.value.limit);
    };

    // Pagination
    const goToPage = async (page) => {
      if (page >= 1 && page <= pagination.value.totalPages) {
        await fetchFiles(page, pagination.value.limit);
      }
    };

    // Handle image load errors
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

<style scoped>
.talygen-files-page {
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  color: #1a202c;
  margin-bottom: 0.75rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  margin-bottom: 2rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.upload-card h2,
.files-list-card h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.upload-section {
  margin-top: 1rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #1976d2;
  background: #f0f0ff;
}

.upload-area.drag-over {
  border-color: #1976d2;
  background: #e8e8ff;
}

.upload-area.uploading {
  opacity: 0.6;
  cursor: not-allowed;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.upload-hint {
  color: #999;
  font-size: 0.9rem;
}

.upload-progress {
  margin-top: 1.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #1976d2 0%, #455a64 100%);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.selected-file-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.file-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-label {
  font-weight: 500;
  color: #666;
}

.file-value {
  color: #333;
}

.upload-actions {
  margin-top: 1.5rem;
}

.success-message,
.error-message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.success-message {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.error-message {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.message-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.success-message .message-icon {
  color: #4caf50;
}

.error-message .message-icon {
  color: #f44336;
}

.message-content h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.message-content p {
  margin: 0.25rem 0;
  color: #555;
}

.upload-details {
  margin-top: 0.5rem;
}

.file-link {
  color: #1976d2;
  text-decoration: none;
  word-break: break-all;
}

.file-link:hover {
  text-decoration: underline;
}

.access-denied {
  text-align: center;
  padding: 3rem;
}

.access-denied h2 {
  color: #f44336;
  margin-bottom: 1rem;
}

.access-denied p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
} 

.error-text {
  color: #f44336;
  margin-bottom: 1rem;
}

.files-table-container {
  overflow-x: auto;
}

.files-table {
  width: 100%;
  border-collapse: collapse;
}

.files-table thead {
  background: #f5f5f5;
}

.files-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

.files-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.file-row:hover {
  background: #f9f9f9;
}

.thumbnail-cell {
  width: 80px;
}

.thumbnail {
  max-width: 60px;
  max-height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.no-thumbnail {
  color: #999;
}

.file-name-cell {
  min-width: 200px;
}

.file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.file-path {
  font-size: 0.85rem;
}

.file-link-small {
  color: #1976d2;
  text-decoration: none;
}

.file-link-small:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-pending {
  background: #fff3e0;
  color: #e65100;
}

.status-failed {
  background: #ffebee;
  color: #c62828;
}

.actions-cell {
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}
</style>

