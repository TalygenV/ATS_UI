<template>
  <div class="job-detail-page py-4" :class="{ 'processing': uploading }">
    <div class="mb-4">
      <button @click="$router.push('/walkin')" class="btn-back">← Back to Walk-In Descriptions</button>
    </div>

    <div v-if="loading" class="loading-state-ats">Loading...</div>
    <div v-else-if="error" class="alert-ats-danger">{{ error }}</div>
    <div v-else-if="jobDescription" class="d-flex flex-column gap-4">
      <!-- <span data-v-368fdc2f="" class="status-badge ">accepted 5</span> -->

      <!-- <span :class="['status-badge', canditateOnholdCount.key]">{{ canditateOnholdCount.key }} {{ canditateOnholdCount.value }}</span>
                       <span :class="['status-badge', canditateSelectedCount.key]">{{ canditateSelectedCount.key }} {{ canditateSelectedCount.value }}</span> -->

      <!-- Job Description Info -->
      <div class="ats-card ats-card-xl">
        <div class="d-flex gap-2 mb-3 flex-wrap">
          <span class="badge-ats badge-ats-success text-uppercase">{{ canditateAcceptCount.key }} {{
            canditateAcceptCount.value }}</span>
          <span class="badge-ats badge-ats-pending text-uppercase">{{ canditatePendingCount.key }} {{
            canditatePendingCount.value }}</span>
          <span class="badge-ats badge-ats-danger text-uppercase">{{ canditateRejectedCount.key }} {{
            canditateRejectedCount.value }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 pb-3 mb-3 border-bottom">
          <div>
            <h2 class="page-title-ats mb-0">{{ jobDescription.title }}</h2>
            <div class="mt-2">
              <span :class="['badge-ats', jobDescription.status === 'Open' ? 'badge-ats-success' : 'badge-ats-warning']"
                style="font-size: 0.875rem;">
                {{ jobDescription.status || 'Open' }}
              </span>
            </div>
          </div>
          <div v-if="hasWriteAccess" class="d-flex gap-2 flex-wrap">
            <button v-if="jobDescription.status !== 'On Hold' && !candidateLinkUrl" @click="generateCandidateLink"
              class="btn-copy-link" :disabled="candidateLinkLoading">
              <span v-if="candidateLinkLoading">Generating...</span>
              <span v-else>Generate Candidate Link</span>
            </button>
            <button v-if="jobDescription.status !== 'On Hold' && candidateLinkUrl" @click="copyCandidateLink"
              class="btn-copy-link">
              Copy Candidate Link
            </button>
            <button @click="editJob" class="btn-edit">Edit</button>
            <button @click="deleteJob" class="btn-delete">Delete</button>
          </div>
        </div>
        <div class="">

          <div class="mb-4">
            <h3 class="section-title-gradient">Job Description</h3>
            <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.7;">{{ jobDescription.description }}
            </p>
          </div>
          <div v-if="jobDescription.requirements" class="mb-4">
            <h3 class="section-title-gradient">Requirements</h3>
            <p class="text-secondary" style="white-space: pre-wrap; line-height: 1.7;">{{ jobDescription.requirements }}
            </p>
          </div>
          <div class="mb-4">
            <p class="text-muted small">Created: {{ formatDate(jobDescription.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Upload Resumes Section -->
      <div v-if="hasWriteAccess" class="ats-card ats-card-xl">
        <h3 class="fs-5 fw-bold text-dark mb-4">Upload Resumes</h3>
        <div class="upload-area-ats" :class="{ 'drag-over': isDragOver }" @drop="handleDrop"
          @dragover.prevent="isDragOver = true" @dragleave="isDragOver = false" @click="triggerFileInput">
          <input ref="fileInput" type="file" multiple accept=".pdf,.doc,.docx,.txt" @change="handleFileSelect"
            style="display: none" />
          <div class="upload-icon">📄</div>
          <p class="upload-text">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="upload-hint">Supports PDF, DOC, DOCX, and TXT files</p>
          <p class="upload-limit">Maximum 5 files allowed for bulk upload</p>
        </div>

        <div v-if="selectedFiles.length > 0" class="selected-files">
          <h4>Selected Files ({{ selectedFiles.length }}/5)</h4>
          <div class="file-list">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">({{ formatFileSize(file.size) }})</span>
              <button @click="removeFile(index)" class="remove-btn">×</button>
            </div>
          </div>
        </div>

        <div class="d-flex gap-3 mt-4">
          <button @click="uploadFiles" :disabled="selectedFiles.length === 0 || uploading || selectedFiles.length > 5"
            class="btn-ats-primary">
            Upload & Parse Resumes
          </button>
          <button @click="clearFiles" :disabled="selectedFiles.length === 0 || uploading" class="btn-ats-secondary">
            Clear
          </button>
        </div>

        <div v-if="uploadResults.length > 0" class="upload-results">
          <h4>Upload Results</h4>
          <div class="results-summary">
            <div class="summary-item success">
              <span class="summary-label">Success:</span>
              <span class="summary-value">{{ successCount }}</span>
            </div>
            <div class="summary-item error">
              <span class="summary-label">Failed:</span>
              <span class="summary-value">{{ errorCount }}</span>
            </div>
          </div>
        </div>

        <div v-if="uploadResults.length > 0">
          <h4>Detailed Results</h4>
          <div v-for="(result, index) in uploadResults" :key="index" class="upload-result-item"
            :class="{ 'success': result.success, 'error': !result.success }">
            <p class="result-file-name mb-0"> File Name : {{ result.fileName }}</p>
            <span v-if="result.success" class="result-success"> Message : Uploaded Successfully</span>
            <span v-else class="result-error"> Message : {{ result.error }}</span>
          </div>
        </div>
      </div>

      <!-- Candidates List -->
      <div class="ats-card ats-card-xl">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <h3 class="fs-5 fw-bold text-dark mb-0">Candidates ({{ candidates.length }})</h3>
          <div class="d-flex gap-2 flex-wrap">
            <select class="form-select-ats" v-model="interviewerFilter" @change="fetchCandidates">
              <option value="">All Interview Status</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
              <option value="pending">Pending</option>
            </select>

            <select v-model="statusFilter" @change="fetchCandidates" class="form-select-ats">

              <option value="">All Application Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select v-model="sortBy" @change="fetchCandidates" class="form-select-ats">
              <option value="match">Sort by Match Score</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        <div v-if="loadingCandidates" class="loading-state-ats">Loading candidates...</div>
        <div v-else-if="candidates.length === 0" class="empty-state-ats">
          <p>No candidates found. Upload resumes to get started!</p>
        </div>
        <!-- v-show="hasRole('Interviewer') ? candidate.interviewer_id === user?.id : true "  -->
        <!-- New Candidate Cards Grid -->
        <div v-else class="candidates-grid">
          <div v-for="candidate in candidates" :key="candidate.id" class="candidate-card-new"
            :class="'status-' + candidate.status" v-show="hasRole('Interviewer')
              ? ((candidate.interview_details && candidate.interview_details.some(id => id.interviewer_id === user?.id)) || candidate.isDuplicate)
              : true">
            <!-- Header: Name, Email, Match Score -->
            <div class="candidate-card-header">
              <div class="candidate-basic-info">
                <h4 class="candidate-name">
                  {{ candidate.candidate_name || 'Unknown' }}
                  <span v-if="candidate.isVersion || candidate.isDuplicate" class="version-badge-new">
                    V{{ candidate.versionNumber || 1 }}
                  </span>
                </h4>
                <p class="candidate-email-new">{{ candidate.email || 'N/A' }}</p>
              </div>
              <div class="match-score-badge-new">
                <span class="match-score-value">{{ formatScore(candidate.overall_match) }}%</span>
                <span class="match-score-label">MATCH</span>
              </div>
            </div>

            <!-- Interviewer Info Section -->
            <div class="candidate-interview-info">
              <div class="interview-info-row">
                <span class="interview-info-label">Interviewer{{ candidate.interview_details &&
                  candidate.interview_details.length > 1 ? 's' : '' }}:</span>
                <span class="interview-info-value" :class="{ 'na': !getInterviewerName(candidate) }">
                  <template v-if="candidate.interview_details && candidate.interview_details.length > 0">
                    <template v-if="candidate.interview_details.length === 1">
                      {{ candidate.interview_details[0].interviewer?.full_name ||
                        candidate.interview_details[0].interviewer?.email || 'N/A' }}
                    </template>
                    <template v-else>
                      {{ candidate.interview_details.length }} Interviewer(s)
                      <button @click="openInterviewerDetailsModal(candidate)" class="btn-action-details"
                        style="margin-left: 8px; padding: 4px 8px; font-size: 0.85em;" title="View Interviewer Details">
                        View Details
                      </button>
                    </template>
                  </template>
                  <template v-else>
                    {{ getInterviewerName(candidate) || 'N/A' }}
                  </template>
                </span>
              </div>
              <div
                v-if="candidate.interview_date || (candidate.interview_details && candidate.interview_details.length > 0)"
                class="interview-info-row">
                <span class="interview-info-label">Interview:</span>
                <span class="interview-info-value">
                  <template v-if="candidate.interview_details && candidate.interview_details.length > 0">
                    {{ formatDateTime(candidate.interview_details[0].interview_date) }}
                    <template v-if="candidate.interview_details.length > 1">
                      <span class="text-muted"> (+{{ candidate.interview_details.length - 1 }} more)</span>
                    </template>
                  </template>
                  <template v-else>
                    {{ formatDateTime(candidate.interview_date) }}
                  </template>
                </span>
              </div>
            </div>

            <!-- Decision Badges -->
            <div class="decision-badges">
              <div
                v-if="(candidate.interviewer_status && candidate.interviewer_status !== 'pending') || (candidate.interview_details && candidate.interview_details.length > 0)"
                class="decision-badge">
                <span class="label">Interviewer Decision:</span>
                <span class="value" :class="getInterviewerDecisionClass(candidate)">
                  {{ getInterviewerDecisionText(candidate) }}
                </span>
              </div>
              <div
                v-if="!['Interviewer'].includes(user.role) && candidate.hr_final_status && candidate.hr_final_status !== 'pending'"
                class="decision-badge">
                <span class="label">HR Final Decision:</span>
                <span class="value" :class="candidate.hr_final_status">
                  {{ candidate.hr_final_status.replace(/_/g, ' ').toUpperCase() }}
                </span>
              </div>
            </div>

            <!-- Main Status Badge -->
            <div class="status-badge-main">
              <span class="status-badge-pill" :class="candidate.status">
                {{ candidate.status.toUpperCase() }}
              </span>
            </div>

            <!-- Match Breakdown Progress Bars -->
            <div class="match-breakdown-section">
              <div class="match-progress-item">
                <div class="match-progress-header">
                  <span class="match-progress-label">Skills</span>
                  <span class="match-progress-value">{{ formatScore(candidate.skills_match) }}%</span>
                </div>
                <div class="match-progress-bar">
                  <div class="match-progress-fill" :style="{ width: formatScore(candidate.skills_match) + '%' }"></div>
                </div>
              </div>
              <div class="match-progress-item">
                <div class="match-progress-header">
                  <span class="match-progress-label">Experience</span>
                  <span class="match-progress-value">{{ formatScore(candidate.experience_match) }}%</span>
                </div>
                <div class="match-progress-bar">
                  <div class="match-progress-fill" :style="{ width: formatScore(candidate.experience_match) + '%' }">
                  </div>
                </div>
              </div>
              <div class="match-progress-item">
                <div class="match-progress-header">
                  <span class="match-progress-label">Education</span>
                  <span class="match-progress-value">{{ formatScore(candidate.education_match) }}%</span>
                </div>
                <div class="match-progress-bar">
                  <div class="match-progress-fill" :style="{ width: formatScore(candidate.education_match) + '%' }">
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer: Date and Actions -->
            <div class="candidate-card-footer">
              <span class="card-date">{{ formatDate(candidate.created_at) }}</span>
              <div class="card-actions">
                <!-- HR/Admin: Assignment buttons -->

                <button
                  v-if="hasWriteAccess && (!candidate.interview_details || candidate.interview_details.length === 0)"
                  @click="openAssignModal(candidate)" class="btn-action-assign">
                  Assign Interviewer
                </button>
                <button v-if="hasWriteAccess && candidate.interview_details && candidate.interview_details.length > 0"
                  @click="openAssignModal(candidate)" class="btn-action-assign">
                  Reassign
                </button>
                <!-- Interviewer: Feedback button (only for assigned candidates) -->
                <!--  -->
                <button
                  v-if="hasRole('Interviewer') && candidate.interview_details && candidate.interview_details.some(id => id.interviewer_id === user?.id && id.interviewer_status === 'pending' && id.interview_date && new Date() > new Date(id.interview_date))"
                  @click="openFeedbackModal(candidate)" class="btn-action-feedback">
                  Submit Feedback
                </button>
                <button
                  v-if="hasRole('Interviewer') && candidate.interview_details && candidate.interview_details.some(id => id.interviewer_id === user?.id && id.interviewer_status !== 'pending' && id.interview_date && new Date() > new Date(id.interview_date))"
                  @click="openFeedbackModal(candidate)" class="btn-action-feedback">
                  View/Edit Feedback
                </button>
                <!-- HR/Admin: Final Decision button (after interviewer feedback) -->
                <button
                  v-if="hasWriteAccess && ((candidate.interviewer_status && candidate.interviewer_status !== 'pending') || (candidate.interview_details && candidate.interview_details.some(id => id.interviewer_status && id.interviewer_status !== 'pending'))) && (!candidate.hr_final_status || candidate.hr_final_status === 'pending')"
                  @click="openHRDecisionModal(candidate)" class="btn-action-hr-decision">
                  HR Decision
                </button>
                <!-- On Hold Details button -->
                <button
                  v-if="candidate.hr_final_status === 'on_hold' || candidate.interviewer_status === 'on_hold' || (candidate.interview_details && candidate.interview_details.some(id => id.interviewer_status === 'on_hold'))"
                  @click="viewHoldDetails(candidate)" class="btn-action-hold">
                  View Hold Details
                </button>
                <button @click="downloadResume(candidate.resume_id, candidate)" class="btn-action-icon"
                  title="Download Resume">
                  ⬇️
                </button>
                <button v-if="candidate.isVersion || candidate.isDuplicate" @click="viewVersionHistory(candidate)"
                  class="btn-action-version" title="View Version History">
                  📜 Versions
                </button>
                <button @click="viewResumeDetail(candidate)" class="btn-action-details">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay-ats">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats" style="    position: sticky;
    top: 0;
    background-color: white;">
          <h2>Edit Job Description</h2>
          <button @click="closeEditModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="saveJob">
            <div class="mb-4">
              <label for="title">Job Title *</label>
              <input id="title" v-model="editForm.title" type="text" required class="form-control-ats" />
            </div>
            <div class="mb-4">
              <label for="description">Job Description *</label>
              <textarea id="description" v-model="editForm.description" required rows="8"
                class="form-control-ats form-textarea-ats"></textarea>
            </div>
            <div class="mb-4">
              <label for="requirements">Requirements (Optional)</label>
              <textarea id="requirements" v-model="editForm.requirements" rows="6"
                class="form-control-ats form-textarea-ats"></textarea>
            </div>
            <div class="mb-4">
              <label for="interviewers">Assign Interviewers (Optional)</label>
              <select id="interviewers" v-model="editForm.interviewers" multiple class="form-select-ats"
                style="min-height: 120px;">
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
              <small class="form-hint">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
            </div>
            <div class="mb-4">
              <label for="status">Job Status *</label>
              <select id="status" v-model="editForm.status" required class="form-select-ats">
                <option value="Open">Open</option>
                <option value="On Hold">On Hold</option>
              </select>
              <small class="form-hint">When set to "On Hold", candidate links cannot be generated or used</small>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="closeEditModal" class="btn-ats-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-ats-primary">
                <span v-if="saving">Saving...</span>
                <span v-else>Update</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Resume Detail Modal -->
    <div v-if="showResumeModal" class="resume-modal-overlay">
      <div class="resume-modal-content" @click.stop>
        <div class="resume-modal-header">
          <button @click="closeResumeModal" class="close-btn-ats">×</button>
        </div>
        <div class="resume-modal-body">
          <div v-if="loadingResumeDetail" class="loading">Loading resume details...</div>
          <div v-else-if="errorResumeDetail && !resumeDetailEvaluation" class="error-message">{{ errorResumeDetail }}
          </div>
          <div v-else-if="resumeDetailEvaluation" class="resume-detail-content">
            <!-- Header Section -->
            <div class="resume-header-card">
              <div class="resume-header-content">
                <h1>{{ resumeDetailEvaluation.candidate_name || 'Unknown Candidate' }}</h1>
                <p class="candidate-contact">
                  <span v-if="resumeDetailEvaluation.email">📧 {{ resumeDetailEvaluation.email }}</span>
                  <span v-if="resumeDetailEvaluation.contact_number"> | 📞 {{ resumeDetailEvaluation.contact_number
                    }}</span>
                </p>
                <div class="resume-header-actions">
                  <button @click="downloadResumeFromModal" class="btn-ats-primary">⬇️Download Resume</button>
                  <select v-if="hasWriteAccess && !showVersionHistoryModal" v-model="resumeDetailEvaluation.status"
                    @change="updateResumeStatus" class="status-select">
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <span v-else class="status-display">{{ resumeDetailEvaluation.status }}</span>
                </div>
              </div>
              <div class="match-score-large">
                <div class="score-value-large">{{ formatScore(resumeDetailEvaluation.overall_match) }}%</div>
                <div class="score-label-large">Overall Match</div>
              </div>
            </div>

            <!-- Match Scores Section -->
            <div class="resume-scores-card">
              <h2>Match Scores</h2>
              <div class="scores-grid">
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.skills_match) }}%</div>
                  <div class="score-label">Skills Match</div>
                </div>
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.experience_match) }}%</div>
                  <div class="score-label">Experience Match</div>
                </div>
                <div class="score-card">
                  <div class="score-value">{{ formatScore(resumeDetailEvaluation.education_match) }}%</div>
                  <div class="score-label">Education Match</div>
                </div>
              </div>
            </div>

            <!-- Detailed Analysis Section -->
            <div class="resume-analysis-card">
              <h2>Detailed Analysis</h2>

              <div class="analysis-section">
                <h3>Skills Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.skills_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div class="analysis-section">
                <h3>Experience Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.experience_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div class="analysis-section">
                <h3>Education Analysis</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.education_details || 'No analysis available' }}</p>
                </div>
              </div>

              <div v-if="resumeDetailEvaluation.rejection_reason" class="analysis-section rejection">
                <h3>Rejection Reason</h3>
                <div class="analysis-content">
                  <p>{{ resumeDetailEvaluation.rejection_reason }}</p>
                </div>
              </div>
            </div>

            <!-- Resume Information Section -->
            <!-- <div class="resume-info-card">
              <h2>Resume Information</h2>
              
              <div v-if="errorResumeDetail && resumeDetailEvaluation" class="error-notice">
                <p>{{ errorResumeDetail }}</p>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.name) || resumeDetailEvaluation.candidate_name || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.email) || resumeDetailEvaluation.email || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.phone) || resumeDetailEvaluation.contact_number || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location:</span>
                  <span class="info-value">{{ (resumeDetail && resumeDetail.location) || 'N/A' }}</span>
                </div>
                <div v-if="resumeDetail && resumeDetail.total_experience !== null && resumeDetail.total_experience !== undefined" class="info-item">
                  <span class="info-label">Total Experience:</span>
                  <span class="info-value">{{ formatExperience(resumeDetail.total_experience) }}</span>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.summary" class="mb-4">
                <h3>Summary</h3>
                <p class="summary-text">{{ resumeDetail.summary }}</p>
              </div>

              <div v-if="resumeDetail && resumeDetail.skills && resumeDetail.skills.length > 0" class="mb-4">
                <h3>Skills</h3>
                <div class="tags">
                  <span v-for="(skill, index) in resumeDetail.skills" :key="index" class="tag">
                    {{ skill }}
                  </span>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.experience && resumeDetail.experience.length > 0" class="mb-4">
                <h3>Work Experience</h3>
                <div class="experience-list">
                  <div v-for="(exp, index) in resumeDetail.experience" :key="index" class="experience-item">
                    <h4>{{ exp.position }}</h4>
                    <p class="company">{{ exp.company }}</p>
                    <p v-if="exp.duration" class="duration">{{ exp.duration }}</p>
                    <p v-if="exp.startDate && exp.endDate" class="dates">
                      {{ formatDateRange(exp.startDate, exp.endDate) }}
                    </p>
                    <p v-if="exp.description" class="description">{{ exp.description }}</p>
                  </div>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.education && resumeDetail.education.length > 0" class="mb-4">
                <h3>Education</h3>
                <div class="education-list">
                  <div v-for="(edu, index) in resumeDetail.education" :key="index" class="education-item">
                    <h4>{{ edu.degree }}</h4>
                    <p v-if="edu.field">Field: {{ edu.field }}</p>
                    <p v-if="edu.institution">Institution: {{ edu.institution }}</p>
                    <p v-if="edu.year">Year: {{ edu.year }}</p>
                  </div>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.certifications && resumeDetail.certifications.length > 0" class="mb-4">
                <h3>Certifications</h3>
                <ul class="certifications-list">
                  <li v-for="(cert, index) in resumeDetail.certifications" :key="index">{{ cert }}</li>
                </ul>
              </div>

              <div class="mb-4">
                <h3>Raw Resume Text</h3>
                <div class="raw-text-container">
                  <pre class="raw-text">{{ resumeDetailEvaluation.resume_text || (resumeDetail && resumeDetail.raw_text) || 'No text available' }}</pre>
                </div>
              </div>
            </div> -->

            <!-- Job Description Section -->
            <div class="job-description-card">
              <!-- <h2>Job Description</h2> -->
              <div class="job-description-content analysis-section">
                <h3 class="section-title-gradient">Job Title :</h3>
                <p class="job-description-text"> {{ resumeDetailEvaluation.job_description.title || 'No job description available' }}</p>
                <h3 class="section-title-gradient">Job Description</h3>
                <p class="job-description-text" style="white-space: pre-wrap; line-height: 1.7;">{{
                  resumeDetailEvaluation.job_description.description }}</p>
                <h3 v-if="resumeDetailEvaluation?.job_description?.requirements" class="section-title-gradient">Job
                  Requirements</h3>
                <p class="job-description-text" style="white-space: pre-wrap; line-height: 1.7;">{{
                  resumeDetailEvaluation.job_description.requirements }}</p>
              </div>
            </div>

            <!-- Process Timeline Section -->
            <div class="timeline-card">
              <h2>Process Timeline</h2>
              <div v-if="loadingTimeline" class="loading">Loading timeline...</div>
              <div v-else-if="timeline.length === 0" class="empty-timeline">
                <p>No timeline events available.</p>
              </div>
              <div v-else class="timeline-container">
                <div v-for="(event, index) in timeline" :key="index" class="timeline-item">
                  <div class="timeline-marker" :class="getTimelineMarkerClass(event.type)"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h3 class="timeline-title">{{ event.title }}</h3>
                      <span class="timeline-date">{{ formatDateTime(event.timestamp) }} </span>
                    </div>

                    <p v-if="event.type === 'interview_scheduled' && event.details.interviewer"
                      class="timeline-description">{{ event.description.replace(/_/g, ' ') }} {{
                        formatDateTime(event.timestamp) }}</p>
                    <p v-else class="timeline-description">{{ event.description.replace(/_/g, ' ') }}</p>
                    <!-- Event-specific details -->
                    <div v-if="event.details" class="timeline-details">
                      <!-- Resume uploaded details -->
                      <div v-if="event.type === 'resume_uploaded' && event.details.overall_match" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Overall Match:</span>
                          <span class="detail-value">{{ formatScore(event.details.overall_match) }}%</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Skills:</span>
                          <span class="detail-value">{{ formatScore(event.details.skills_match) }}%</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Experience:</span>
                          <span class="detail-value">{{ formatScore(event.details.experience_match) }}%</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-label">Education:</span>
                          <span class="detail-value">{{ formatScore(event.details.education_match) }}%</span>
                        </div>
                      </div>

                      <!-- Interview assignment details -->
                      <div
                        v-if="(event.type === 'interviewer_assigned' || event.type === 'interviewer_reassigned') && event.details.interviewer"
                        class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Interviewer:</span>
                          <span class="detail-value">{{ event.details.interviewer.full_name || N / A }}</span>
                        </div>
                        <div v-if="event.user" class="detail-row">
                          <span class="detail-label">Assigned by:</span>
                          <span class="detail-value">{{ event.user.full_name || event.user.email }}</span>
                        </div>
                        <div v-if="event.details.notes" class="detail-row">
                          <span class="detail-label">Note:</span>
                          <span class="detail-value">{{ event.details.notes }}</span>
                        </div>
                      </div>

                      <!-- Interview scheduled details -->
                      <div v-if="event.type === 'interview_scheduled' && event.details.interviewer" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Interviewer:</span>
                          <span class="detail-value">{{ event.details.interviewer.full_name || N / A }}</span>
                        </div>
                      </div>

                      <!-- Feedback details -->
                      <div v-if="event.type === 'feedback_submitted' && event.details.ratings" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Decision:</span>
                          <span :class="['status-badge', 'timeline-status', event.details.status]">
                            {{ event.details.status.replace(/_/g, ' ') }}
                          </span>
                        </div>
                        <div
                          v-if="event.details.ratings && typeof event.details.ratings === 'object' && Object.keys(event.details.ratings).filter(key => key !== 'interviewer_remarks' && event.details.ratings[key]).length > 0"
                          class="ratings-detail">
                          <strong>Ratings:</strong>
                          <div class="ratings-list">
                            <div v-for="(rating, key) in getFilteredRatings(event.details.ratings)" :key="key"
                              class="rating-detail-item">
                              <span class="rating-key">{{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                }}:</span>
                              <span class="rating-value">{{ rating }}/10</span>
                            </div>
                          </div>
                        </div>
                        <div v-if="event.details.ratings && event.details.ratings.interviewer_remarks"
                          class="remarks-detail">
                          <strong>Remarks:</strong>
                          <p>{{ event.details.ratings.interviewer_remarks }}</p>
                        </div>
                        <div v-if="event.details.hold_reason" class="hold-reason-detail">
                          <strong>Hold Reason:</strong>
                          <p>{{ event.details.hold_reason }}</p>
                        </div>
                      </div>

                      <!-- HR decision details -->
                      <div v-if="event.type === 'hr_decision'" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Final Decision:</span>
                          <span :class="['status-badge', 'timeline-status', 'hr-' + event.details.status]">
                            {{ event.details.status }}
                          </span>
                        </div>
                        <div v-if="event.details.reason" class="decision-reason-detail">
                          <strong>Reason:</strong>
                          <p>{{ event.details.reason }}</p>
                        </div>
                        <div v-if="event.details.hr_remarks" class="hr-remarks-detail">
                          <strong>HR Remarks:</strong>
                          <p>{{ event.details.hr_remarks }}</p>
                        </div>
                      </div>
                    </div>

                    <!-- User who performed the action -->
                    <div v-if="event.user" class="timeline-user">
                      <span class="user-label">By:</span>
                      <span class="user-name">{{ event.user.full_name || event.user.email }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Interviewer Modal -->
    <div v-if="showAssignModal" class="modal-overlay-ats assign-modal">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2>Assign Interviewer</h2>
          <button @click="showAssignModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="d-flex gap-2 ms-4 ">
          <div class="btn-group" role="group">
               <input type="radio" class="btn-check" id="faceToFace" :value="3" v-model="assignmentData.isVideoCall" />
            <label class="btn btn-outline-danger" for="faceToFace">Walk In Interview</label>
          </div>
          <div style="flex:auto" class="d-flex gap-2 justify-content-end me-4">
            <input type="radio" class="btn-check" name="assignType" id="opt1" :value="true"
              v-model="assignMultipleInterviwer" />
            <label class="btn btn-outline-success" for="opt1">
              Panel Assign
            </label>
            <input type="radio" class="btn-check" name="assignType" id="opt2" :value="false"
              v-model="assignMultipleInterviwer" />
            <label class="btn btn-outline-success" for="opt2">
              Single Assign
            </label>
          </div>
        </div>

        <!-- // Single Assign //  -->
        <div v-if="!assignMultipleInterviwer" class="modal-body-ats">
          <form @submit.prevent="assignInterviewer">
            <div class="form-group">
              <label>Interviewer *</label>
              <select v-model="assignmentData.interviewer_id" required
                class="form-select-clean">
                <option value="">Select Interviewer</option>
                <option v-for="interviewer in assignInterviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
            </div>
            <!-- <div class="form-group">
              <label>Available Slots *</label>
              <select v-model="assignmentData.slot_id" required class="form-select-clean">
                <option value="">Select Time Slot</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                  {{ formatDateTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
                  ({{ slot.interviewer?.full_name || slot.interviewer?.email || 'Interviewer' }})
                </option>
              </select>
              <p v-if="availableSlots.length === 0 && assignmentData.interviewer_id" class="hint-text">
                No available slots found for the selected interviewer. Ask interviewer to add availability.
              </p>
            </div> -->
            <div class="modal-actions">
              <button type="button" @click="showAssignModal = false" class="btn-modal-cancel">Cancel</button>
              <button type="submit" class="btn-modal-primary">Assign</button>
            </div>
          </form>
        </div>


        <!-- // Bulk Assign // -->
        <div v-if="assignMultipleInterviwer" class="modal-body-ats">
          <form @submit.prevent="assignInterviewerGroup">

            <!-- SECTION 1: Interviewer -->


            <div class="form-group">
              <label>Interviewer *</label>

              <select v-model="selectedInterviewersforAssign" multiple class="form-select-ats"
                 style="min-height: 120px;">
                <option value="">Select Interviewer</option>
                <option v-for="interviewer in assignInterviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
              <small class="form-hint">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
            </div>


            <!-- SECTION 2: Available Slots -->


            <!-- <div class="form-group">
              <label>Available Slots *</label>
              <select v-model="selectedTimeSlotforBulkAssign" required class="form-select-clean">
                <option value="">Select Time Slot</option>
                <option v-for="(slot, index) in availableSlots" :key="index" :value="JSON.stringify(slot.slot_ids)">
                  {{ formatDateTime(slot.start_time) }} - {{ formatTime(slot.end_time) }}
                  ({{ slot.interviewer_ids?.length || 0 }} interviewer(s))
                </option>
              </select>
              <p v-if="availableSlots.length === 0" class="hint-text">
                No available slots found for the selected interviewer. Ask interviewer to add availability.
              </p>
            </div> -->
            <!-- SECTION 3: Actions -->
            <section class="modal-actions">
              <button type="button" @click="showAssignModal = false" class="btn-modal-cancel">
                Cancel
              </button>
              <button type="submit" class="btn-modal-primary">
                Assign
              </button>
            </section>

          </form>
        </div>

      </div>
    </div>

    <!-- Interviewer Feedback Modal -->
    <div v-if="showFeedbackModal && selectedCandidateForFeedback" class="modal-overlay-ats">
      <div class="modal-content-ats modal-content-lg" @click.stop>
        <div class="modal-header-ats">
          <h2>Interview Feedback</h2>
          <button @click="showFeedbackModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <form @submit.prevent="submitFeedback">
            <div class="form-section">
              <h3>Candidate Ratings (1-10 scale)</h3>
              <div class="ratings-grid">
                <div class="rating-group">
                  <label>Technical Skills</label>
                  <input v-model.number="feedbackData.ratings.technical_skills" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
                <div class="rating-group">
                  <label>Communication</label>
                  <input v-model.number="feedbackData.ratings.communication" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
                <div class="rating-group">
                  <label>Problem Solving</label>
                  <input v-model.number="feedbackData.ratings.problem_solving" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
                <div class="rating-group">
                  <label>Cultural Fit</label>
                  <input v-model.number="feedbackData.ratings.cultural_fit" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
                <div class="rating-group">
                  <label>Experience Relevance</label>
                  <input v-model.number="feedbackData.ratings.experience_relevance" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
                <div class="rating-group">
                  <label>Overall Assessment</label>
                  <input v-model.number="feedbackData.ratings.overall" type="number" min="1" max="10"
                    class="rating-input" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Remarks</h3>
              <div class="mb-4">
                <textarea v-model="feedbackData.remarks" rows="4" class="form-control-ats form-textarea-ats"
                  placeholder="Additional remarks (optional)"></textarea>
              </div>
            </div>

            <div class="form-section">
              <h3>Final Decision</h3>
              <div class="mb-4">
                <label>Status *</label>
                <select v-model="feedbackData.status" required class="form-control-ats" @change="onStatusChange">
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div v-if="feedbackData.status === 'on_hold'" class="mb-4">
                <label>Hold Reason *</label>
                <textarea v-model="feedbackData.hold_reason" required rows="4"
                  class="form-control-ats form-textarea-ats"
                  placeholder="Please provide a reason for putting this candidate on hold..."></textarea>
              </div>
            </div>

            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="showFeedbackModal = false" class="btn-ats-secondary">Cancel</button>
              <button type="submit" :disabled="submittingFeedback" class="btn-ats-primary">
                <span v-if="submittingFeedback">Submitting...</span>
                <span v-else>Submit Feedback</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- HR Decision Modal -->
    <div v-if="showHRDecisionModal && selectedCandidateForFeedback" class="modal-overlay-ats">
      <div class="modal-content-ats modal-content-lg" @click.stop>
        <div class="modal-header-ats" style="    position: sticky;
    top: 0;
    background-color: white;">
          <h2>Final HR Decision</h2>
          <button @click="showHRDecisionModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <!-- Show All Interviewers Feedback -->
          <div
            v-if="selectedCandidateForFeedback.interview_details && selectedCandidateForFeedback.interview_details.length > 0"
            class="interviewer-feedback-section">
            <h3>Interviewer Feedback</h3>
            <div v-for="(interviewDetail, index) in selectedCandidateForFeedback.interview_details"
              :key="interviewDetail.id || index" class="feedback-display mb-4"
              style="border-bottom: 1px solid #e0e0e0; padding-bottom: 1.5rem;">
              <div class="feedback-interviewer-header mb-3">
                <h4>
                  Interviewer {{ index + 1 }}:
                  {{ interviewDetail.interviewer?.full_name || interviewDetail.interviewer?.email || 'N/A' }}
                </h4>
              </div>

              <div v-if="interviewDetail.interviewer_feedback || interviewDetail.interviewer_status !== 'pending'">
                <div v-if="interviewDetail.interviewer_feedback" class="feedback-ratings mb-3">
                  <h5>Ratings (1-10 scale):</h5>
                  <div class="ratings-display-grid">
                    <div v-for="(rating, key) in getFilteredRatings(interviewDetail.interviewer_feedback)" :key="key"
                      class="rating-display-item">
                      <span class="rating-display-label">{{key.replace(/_/g, ' ').replace(/\b\w/g, l =>
                        l.toUpperCase())
                        }}:</span>
                      <span class="rating-display-value">{{ rating }}/10</span>
                    </div>
                  </div>
                  <div v-if="
                    Object.values(interviewDetail.interviewer_feedback)
                      .every(value => value === '' || value === null || value === undefined)
                  ">
                    <span class="rating-display-value">Not Submitted Rating</span>
                  </div>
                </div>
                <div
                  v-if="interviewDetail.interviewer_feedback && interviewDetail.interviewer_feedback.interviewer_remarks"
                  class="feedback-remarks mb-3">
                  <h5>Interviewer Remarks:</h5>
                  <p>{{ interviewDetail.interviewer_feedback.interviewer_remarks }}</p>
                </div>
                <div class="feedback-status mb-3">
                  <h5>Interviewer's Decision:</h5>
                  <span :class="['status-badge', 'interviewer-' + (interviewDetail.interviewer_status || 'pending')]">
                    {{ (interviewDetail.interviewer_status || 'pending').replace(/_/g, ' ').toUpperCase() }}
                  </span>
                </div>
                <div v-if="interviewDetail.interviewer_hold_reason" class="feedback-hold-reason mb-3">
                  <h5>Hold Reason:</h5>
                  <p>{{ interviewDetail.interviewer_hold_reason }}</p>
                </div>
              </div>
              <div v-else class="feedback-pending">
                <p class="text-muted">Feedback not yet submitted</p>
              </div>
            </div>
          </div>
          <!-- Fallback for backward compatibility (single interviewer) -->
          <div v-else-if="selectedCandidateForFeedback.interviewer_feedback" class="interviewer-feedback-section">
            <h3>Interviewer Feedback</h3>
            <div class="feedback-display">
              <div class="feedback-ratings">
                <h4>Ratings (1-10 scale):</h4>
                <div class="ratings-display-grid">
                  <div v-for="(rating, key) in getFilteredRatings(selectedCandidateForFeedback.interviewer_feedback)"
                    :key="key" class="rating-display-item">
                    <span class="rating-display-label">{{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }}:</span>
                    <span class="rating-display-value">{{ rating }}/10</span>
                  </div>
                </div>
                <div v-if="
                  Object.values(selectedCandidateForFeedback.interviewer_feedback)
                    .every(value => value === '' || value === null || value === undefined)
                ">
                  <span class="rating-display-value">Not Submitted Rating</span>
                </div>

              </div>
              <div
                v-if="selectedCandidateForFeedback.interviewer_feedback && selectedCandidateForFeedback.interviewer_feedback.interviewer_remarks"
                class="feedback-remarks">
                <h4>Interviewer Remarks:</h4>
                <p>{{ selectedCandidateForFeedback.interviewer_feedback.interviewer_remarks }}</p>
              </div>
              <div class="feedback-status">
                <h4>Interviewer's Decision:</h4>
                <span :class="['status-badge', 'interviewer-' + selectedCandidateForFeedback.interviewer_status]">
                  {{ selectedCandidateForFeedback.interviewer_status }}
                </span>
              </div>
              <div v-if="selectedCandidateForFeedback.interviewer_hold_reason" class="feedback-hold-reason">
                <h4>Hold Reason:</h4>
                <p>{{ selectedCandidateForFeedback.interviewer_hold_reason }}</p>
              </div>
            </div>
          </div>

          <!-- HR Decision Form -->
          <div class="form-section">
            <h3>Your Final Decision</h3>
            <div class="mb-4">
              <label>Final Status *</label>
              <select v-model="hrDecisionData.status" required class="form-control-ats" @change="onHRStatusChange">
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <!-- Show reason field if:
                 1. Status is rejected or on_hold (always required)
                 2. Status is selected AND no interviewer selected (override case) -->
            <div
              v-if="hrDecisionData.status === 'rejected' || hrDecisionData.status === 'on_hold' || (hrDecisionData.status === 'selected' && !hasAnyInterviewerSelected(selectedCandidateForFeedback))"
              class="mb-4">
              <label>Reason *</label>
              <textarea v-model="hrDecisionData.reason" required rows="4" class="form-control-ats form-textarea-ats"
                :placeholder="getReasonPlaceholder()"></textarea>
              <small
                v-if="hrDecisionData.status === 'selected' && !hasAnyInterviewerSelected(selectedCandidateForFeedback)"
                class="reason-hint">
                Reason is required when overriding interviewer's decision to select this candidate.
              </small>
            </div>
            <div class="mb-4">
              <label>Remarks</label>
              <textarea v-model="hrDecisionData.hrRemarks" rows="4" class="form-control-ats form-textarea-ats"
                placeholder="Additional remarks (optional)"></textarea>
            </div>
            <div class="d-flex gap-3 justify-content-end mt-4">
              <button type="button" @click="showHRDecisionModal = false" class="btn-ats-secondary">Cancel</button>
              <button type="button" @click="submitHRDecision" class="btn-ats-primary">Submit Decision</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interviewer Details Modal -->
    <div v-if="showInterviewerDetailsModal && selectedCandidateForInterviewerDetails"
      class="modal-overlay-ats interviewer-details-scope">
      <div class="modal-content-ats modal-content-lg p-4" @click.stop>
        <div class="modal-header-ats">
          <h2>Interviewer Details</h2>
          <button @click="showInterviewerDetailsModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div
            v-if="selectedCandidateForInterviewerDetails.interview_details && selectedCandidateForInterviewerDetails.interview_details.length > 0"
            class="interviewer-details-list">
            <div v-for="(interviewDetail, index) in selectedCandidateForInterviewerDetails.interview_details"
              :key="interviewDetail.id || index" class="interviewer-detail-item">
              <div class="interviewer-detail-header">
                <h3>
                  Interviewer {{ index + 1 }}:
                  {{ interviewDetail.interviewer?.full_name || interviewDetail.interviewer?.email || 'N/A' }}
                </h3>
                <span :class="['status-badge', '' + (interviewDetail.interviewer_status || 'pending')]">
                  {{ (interviewDetail.interviewer_status || 'pending').replace(/_/g, ' ').toUpperCase() }}
                </span>
              </div>

              <div class="interviewer-detail-info">
                <div class="detail-row">
                  <span class="detail-label">Interview Date:</span>
                  <span class="detail-value">{{ formatDateTime(interviewDetail.interview_date) }}</span>
                </div>
                <!-- <div v-if="interviewDetail.interview_end_time" class="detail-row">
                  <span class="detail-label">End Time:</span>
                  <span class="detail-value">{{ formatDateTime(interviewDetail.interview_end_time) }}</span>
                </div> -->
                <div v-if="interviewDetail.interviewer?.email" class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">{{ interviewDetail.interviewer.email }}</span>
                </div>
              </div>

              <!-- Interviewer Feedback Section -->
              <div v-if="interviewDetail.interviewer_feedback || interviewDetail.interviewer_status !== 'pending'"
                class="interviewer-feedback-section">
                <h4>Interviewer Feedback</h4>
                <div class="feedback-display">
                  <div v-if="interviewDetail.interviewer_feedback" class="feedback-ratings">
                    <h5>Ratings (1-10 scale):</h5>
                    <div class="ratings-display-grid">
                      <div v-for="(rating, key) in getFilteredRatings(interviewDetail.interviewer_feedback)" :key="key"
                        class="rating-display-item">
                        <span class="rating-display-label">{{key.replace(/_/g, ' ').replace(/\b\w/g, l =>
                          l.toUpperCase())
                          }}:</span>
                        <span class="rating-display-value">{{ rating }}/10</span>
                      </div>



                    </div>
                    <div v-if="
                      Object.values(interviewDetail.interviewer_feedback)
                        .every(value => value === '' || value === null || value === undefined)
                    ">
                      <span class="rating-display-value">Not Submitted Rating</span>
                    </div>
                    <div
                      v-if="interviewDetail.interviewer_feedback && interviewDetail.interviewer_feedback.interviewer_remarks"
                      class="remarks-detail">
                      <span class="m-0 ">Remarks:</span>
                      <span class="mx-2">{{ interviewDetail.interviewer_feedback.interviewer_remarks }}</span>
                    </div>
                  </div>
                  <div class="feedback-status">
                    <h5>Interviewer's Decision:</h5>
                    <span :class="['status-badge', '' + (interviewDetail.interviewer_status || 'pending')]">
                      {{ (interviewDetail.interviewer_status || 'pending').replace(/_/g, ' ').toUpperCase() }}
                    </span>
                  </div>
                  <div v-if="interviewDetail.interviewer_hold_reason" class="feedback-hold-reason">
                    <h5>Hold Reason:</h5>
                    <p>{{ interviewDetail.interviewer_hold_reason }}</p>
                  </div>
                  <div v-if="!interviewDetail.interviewer_feedback && interviewDetail.interviewer_status === 'pending'"
                    class="feedback-pending">
                    <p class="text-muted">Feedback not yet submitted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-interviewers">
            <p>No interviewers assigned yet.</p>
          </div>
        </div>
        <div class="d-flex gap-3 justify-content-end mt-4">
          <button type="button" @click="showInterviewerDetailsModal = false" class="btn-ats-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- On Hold Details Modal -->
    <div v-if="showHoldModal && holdCandidate" class="modal-overlay-ats">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats">
          <h2>On Hold - Candidate Details</h2>
          <button @click="showHoldModal = false" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div class="detail-section">
            <h3>Candidate Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ holdCandidate.candidate_name || holdCandidate.resume?.name || 'N/A'
                  }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ holdCandidate.email || holdCandidate.resume?.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ holdCandidate.contact_number || holdCandidate.resume?.phone || 'N/A'
                  }}</span>
              </div>
            </div>
          </div>
          <div
            v-if="holdCandidate.interview_details && holdCandidate.interview_details.some(d => d.interviewer_status === 'on_hold')"
            class="detail-section">
            <h3>Interviewer Hold Reasons</h3>
            <div
              v-for="(detail, index) in holdCandidate.interview_details.filter(d => d.interviewer_status === 'on_hold')"
              :key="detail.id || index" class="hold-reason-item">
              <strong>{{ detail.interviewer?.full_name || detail.interviewer?.email || 'Interviewer' }}:</strong>
              <p class="detail-text hold">{{ detail.interviewer_hold_reason }}</p>
            </div>
          </div>
          <!-- <div v-if="holdCandidate.interviewer_hold_reason" class="detail-section">
            <h3>Interviewer Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.interviewer_hold_reason }}</p>
          </div> -->
          <div v-if="holdCandidate.hr_final_reason" class="detail-section">
            <h3>HR Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.hr_final_reason }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Version History Modal -->
    <div v-if="showVersionHistoryModal" class="modal-overlay-ats">
      <div class="modal-content-ats" @click.stop>
        <div class="modal-header-ats" style="    position: sticky;
    top: 0;
    background-color: white;">
          <h2>Resume Version History</h2>
          <button @click="closeVersionHistoryModal" class="close-btn-ats">×</button>
        </div>
        <div class="modal-body-ats">
          <div v-if="selectedCandidateForVersions" class="candidate-info-header">

            <h3>{{ selectedCandidateForVersions.candidate_name || selectedCandidateForVersions.resume?.name || 'Unknown Candidate' }}</h3>
            <p class="candidate-email">{{ selectedCandidateForVersions.email ||
              selectedCandidateForVersions.resume?.email
              || 'N/A' }}</p>
          </div>

          <div v-if="loadingVersionHistory" class="loading">Loading version history...</div>
          <div v-else-if="versionHistory.length === 0" class="empty-state-ats">
            <p>No version history found.</p>
          </div>
          <div v-else class="version-list">
            <div v-for="version in versionHistory" :key="version.resume_id" class="version-item"
              :class="{ 'current-version': version.version === (selectedCandidateForVersions?.versionNumber || 1) }">
              <div class="version-header">

                <div class="version-number-badge">
                  <span class="version-label">Version</span>
                  <span class="version-number">{{ version.version }}</span>
                </div>
                <span class="version-date">{{ formatDateTime(version.uploaded_on) }}</span>
              </div>

              <button v-if="!hasRole('Interviewer')" @click="viewResumeDetail(version)" class="btn-action-details mb-4">
                Check Interview Record For this Version </button>
              <div class="version-details">
                <div class="version-info">
                  <div class="info-row">
                    <span class="info-label">File:</span>
                    <span class="info-value">{{ version.file_name }}</span>
                  </div>
                  <div v-if="version.results" class="version-results">
                    <div class="results-section">
                      <h4>Extracted Results:</h4>
                      <!-- <div v-if="version.title" class="result-item">
                        <strong>Job Title:</strong> {{ version.title }}
                      </div> -->
                      <div v-if="version.results.name" class="result-item">
                        <strong>Name:</strong> {{ version.results.name }}
                      </div>

                      <div v-if="version.results.email" class="result-item">
                        <strong>Email:</strong> {{ version.results.email }}
                      </div>
                      <div v-if="version.results.phone" class="result-item">
                        <strong>Phone:</strong> {{ version.results.phone }}
                      </div>
                      <div v-if="version.results.location" class="result-item">
                        <strong>Location:</strong> {{ version.results.location }}
                      </div>
                      <div v-if="version.results.total_experience" class="result-item d-none">
                        <strong>Total Experience:</strong> {{ formatExperience(version.results.total_experience) }}
                      </div>
                      <div v-if="version.results.skills && version.results.skills.length > 0" class="result-item">
                        <strong>Skills:</strong>
                        <div class="skills-tags">
                          <span v-for="(skill, idx) in version.results.skills" :key="idx" class="skill-tag">
                            {{ skill }}
                          </span>
                        </div>
                      </div>
                      <!-- //Check at here and all pages -->
                      <div v-if="version.results.experience && version.results.experience.length > 0"
                        class="result-item">
                        <strong>Experience:</strong>
                        <ul class="experience-list">
                          <li v-for="(exp, idx) in version.results.experience" :key="idx">
                            {{ exp.position || exp.title || 'Position' }} at {{ exp.company || 'Company' }}
                            <span v-if="exp.duration"> ({{ exp.duration }})</span>
                          </li>
                        </ul>
                      </div>
                      <div v-if="version.results.education && version.results.education.length > 0" class="result-item">
                        <strong>Education:</strong>
                        <ul class="education-list">
                          <li v-for="(edu, idx) in version.results.education" :key="idx">
                            {{ edu.degree || 'Degree' }}
                            <span v-if="edu.institution"> from {{ edu.institution }}</span>
                            <span v-if="edu.year"> ({{ edu.year }})</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeVersionHistoryModal" class="btn-ats-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useAuth } from '../composables/useAuth';
import { useLoader } from '../composables/useLoader';
import { API_BASE_URL } from '../config/api';
import { formatDate, formatDateTime, formatTime, formatDateRange } from '../utils/datetimeUtils';

export default {
  name: 'JobDetailPage',
  setup() {
    const { hasWriteAccess, user, hasRole } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, user, hasRole, showLoader, hideLoader, formatDateRange };
  },
  data() {
    return {
      selectedInterviewersforAssign: [],
      selectedTimeSlotforBulkAssign: '',
      assignMultipleInterviwer: false,
      jobDescription: null,
      candidates: [],
      loading: false,
      loadingCandidates: false,
      error: null,
      selectedFiles: [],
      isDragOver: false,
      uploading: false,
      uploadResults: [],
      interviewerFilter: '',
      statusFilter: '',
      sortBy: 'match',
      showEditModal: false,
      saving: false,
      walkInJobDetails: null,
      editForm: {
        title: '',
        description: '',
        requirements: '',
        interviewers: [],
        status: 'Open'
      },
      showResumeModal: false,
      resumeDetailEvaluation: null,
      resumeDetail: null,
      loadingResumeDetail: false,
      errorResumeDetail: null,
      timeline: [],
      loadingTimeline: false,
      showAssignModal: false,
      showFeedbackModal: false,
      interviewers: [],
      assignInterviewers: [],
      assignmentData: {
        evaluation_id: null,
        interviewer_id: null,
        slot_id: '',
        isVideoCall: 1
      },
      availableSlots: [],
      selectedCandidateForFeedback: null,
      feedbackData: {
        ratings: {
          technical_skills: null,
          communication: null,
          problem_solving: null,
          cultural_fit: null,
          experience_relevance: null,
          overall: null
        },
        status: 'pending',
        hold_reason: '',
        remarks: ''
      },
      submittingFeedback: false,
      showHRDecisionModal: false,
      showInterviewerDetailsModal: false,
      selectedCandidateForInterviewerDetails: null,
      showHoldModal: false,
      holdCandidate: null,
      hrDecisionData: {
        evaluation_id: null,
        status: '',
        reason: '',
        hrRemarks: ''
      },
      candidateLinkUrl: '',
      candidateLinkLoading: false,
      showVersionHistoryModal: false,
      versionHistory: [],
      loadingVersionHistory: false,
      selectedCandidateForVersions: null
    };
  },
  computed: {
    successCount() {
      return this.uploadResults.filter(r => r.success).length;
    },
    errorCount() {
      return this.uploadResults.filter(r => !r.success).length;
    },
    canditateAcceptCount() {
      return {
        key: 'accepted',
        value: this.candidates.filter(c => c.status === 'accepted').length
      }
    },
    canditatePendingCount() {
      return {
        key: 'pending',
        value: this.candidates.filter(c => c?.status === 'pending').length
      }
    },
    canditateRejectedCount() {
      return {
        key: 'rejected',
        value: this.candidates.filter(c => c?.status === 'rejected').length
      }
    },
  },
  mounted() {
    this.fetchJobDescription();
    this.fetchWalkInInterviewDetails();
    this.fetchCandidates();
    if (this.hasWriteAccess) {
      this.fetchInterviewers();
      this.fetchAssignInterviewers()
    }
  },
  methods: {
    getInterviewerName(candidate) {
      if (!candidate.interviewer) return null;
      const name = candidate.interviewer.full_name || candidate.interviewer.email;
      return name && name.trim() ? name : null;
    },
    async fetchWalkInInterviewDetails() {
    
        try {
             let response = await axios.get(`${API_BASE_URL}/walkIn/single/${this.$route.params.id}`);
             if (response.data.success && response.data.data.length > 0) {
               this.walkInJobDetails = response.data.data[0];
             }
        } catch (error) {
            
        }
      // This method can be used to fetch additional walk-in interview details if needed
    },

    async fetchJobDescription() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Job Details', 'Fetching job description...');
      try {
        const response = await axios.get(`${API_BASE_URL}/job-descriptions/${this.$route.params.id}`);
        if (response.data.success) {
          this.jobDescription = response.data.data;
          // Fetch existing candidate link after job description is loaded
          if (this.hasWriteAccess) {
            this.fetchExistingCandidateLink();
          }
        }
      } catch (error) {
        console.error('Error fetching job description:', error);
        this.error = 'Failed to fetch job description. Please try again.';
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    async fetchExistingCandidateLink() {
      if (!this.jobDescription || !this.jobDescription.id) return;

      // Don't fetch link if job is on hold
      if (this.jobDescription.status === 'On Hold') {
        this.candidateLinkUrl = '';
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/candidate-links/job/${this.jobDescription.id}`);
        if (response.data.success && response.data.data && response.data.data.url) {
          // Check if job status from response is on hold
          const jobStatus = response.data.data.job?.status;
          if (jobStatus === 'On Hold') {
            this.candidateLinkUrl = '';
            return;
          }
          this.candidateLinkUrl = response.data.data.url;
        }
      } catch (error) {
        // Silently fail - link might not exist yet
        console.log('No existing candidate link found for this job post');
      }
    },
    async generateCandidateLink() {
      if (!this.jobDescription) return;

      // Check if job is on hold
      if (this.jobDescription.status === 'On Hold') {
        alert('Cannot generate candidate link. Job description is currently On Hold.');
        return;
      }

      this.candidateLinkLoading = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/candidate-links/generate`, {
          job_description_id: this.jobDescription.id
        });
        if (response.data.success && response.data.data.url) {
          this.candidateLinkUrl = response.data.data.url;
        } else {
          alert(response.data.error || 'Failed to generate candidate link.');
        }
      } catch (error) {
        console.error('Error generating candidate link:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to generate candidate link.';
        alert(errorMessage);

        // If error is 403 (Forbidden), it means job is on hold
        if (error.response?.status === 403) {
          // Refresh job description to get updated status
          this.fetchJobDescription();
        }
      } finally {
        this.candidateLinkLoading = false;
      }
    },
    async copyCandidateLink() {
      if (!this.candidateLinkUrl) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(`${location.origin}${this.candidateLinkUrl}`);
          alert('Candidate link copied to clipboard.');
        } else {
          // Fallback
          window.prompt('Copy this link:', `${location.origin}${this.candidateLinkUrl}`);
        }
      } catch (error) {
        console.error('Error copying candidate link:', error);
        window.prompt('Copy this link:', `${location.origin}${this.candidateLinkUrl}`);
      }
    },
    async fetchCandidates() {
      this.loadingCandidates = true;
      this.showLoader('Loading Candidates', 'Fetching candidate evaluations...');
      try {
        const jobId = this.$route.params.id;
        const params = new URLSearchParams();
        if (this.statusFilter) {
          params.append('status', this.statusFilter);
        }

        if (this.interviewerFilter) {
          params.append('interviewer_status', this.interviewerFilter);
        }
        params.append('sort_by', this.sortBy);

        const response = await axios.get(
          `${API_BASE_URL}/evaluations/job/${jobId}?${params.toString()}`
        );
        if (response.data.success) {
          // Parse interviewer_feedback if it's a string
          this.candidates = response.data.data.map(candidate => {
            if (candidate.interviewer_feedback && typeof candidate.interviewer_feedback === 'string') {
              try {
                candidate.interviewer_feedback = JSON.parse(candidate.interviewer_feedback);
              } catch (e) {
                console.error('Error parsing interviewer_feedback:', e);
              }
            }
            return candidate;
          });
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        this.loadingCandidates = false;
        this.hideLoader();
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.addFiles(files);
    },
    handleDrop(event) {
      event.preventDefault();
      this.isDragOver = false;
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    },
    addFiles(files) {
      const MAX_FILES = 5;
      const validFiles = files.filter(file => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        return validTypes.includes(file.type) ||
          file.name.endsWith('.pdf') ||
          file.name.endsWith('.doc') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.txt');
      });

      // Check if adding these files would exceed the limit
      const currentCount = this.selectedFiles.length;
      const remainingSlots = MAX_FILES - currentCount;

      if (remainingSlots <= 0) {
        alert(`Maximum ${MAX_FILES} files allowed for bulk upload. Please remove some files first.`);
        return;
      }

      if (validFiles.length > remainingSlots) {
        alert(`You can only add ${remainingSlots} more file(s). Maximum ${MAX_FILES} files allowed for bulk upload.`);
        const filesToAdd = validFiles.slice(0, remainingSlots);
        this.selectedFiles = [...this.selectedFiles, ...filesToAdd];
      } else {
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
      }
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
    },
    clearFiles() {
      this.selectedFiles = [];
      this.uploadResults = [];
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
    },
    async uploadFiles() {
      if (this.selectedFiles.length === 0) return;

      // Enforce 5 file limit for bulk uploads
      if (this.selectedFiles.length > 5) {
        alert('Maximum 5 files allowed for bulk upload. Please select 5 or fewer files.');
        return;
      }

      this.uploading = true;
      this.uploadResults = [];

      const fileCount = this.selectedFiles.length;
      const message = fileCount === 1
        ? 'Processing Resume'
        : `Processing ${fileCount} Resumes`;
      const subMessage = fileCount === 1
        ? 'Please wait while we upload and parse your resume'
        : `Processing ${fileCount} resumes. This may take a few moments...`;

      this.showLoader(message, subMessage);

      try {
        const formData = new FormData();
        formData.append('job_description_id', this.$route.params.id);

        if (this.selectedFiles.length === 1) {
          formData.append('resume', this.selectedFiles[0]);
          const response = await axios.post(`${API_BASE_URL}/upload/single`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            this.uploadResults.push({
              fileName: this.selectedFiles[0].name,
              success: true,
              data: response.data.data
            });
          }
          else {
            this.uploadResults.push({
              fileName: this.selectedFiles[0].name,
              success: false,
              error: response.data.error || 'Upload failed'
            });
          }
        }

        else {
          this.selectedFiles.forEach(file => {
            formData.append('resumes', file);
          });

          const response = await axios.post(`${API_BASE_URL}/upload/bulk`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.data.success) {
            response.data.results.forEach(result => {
              this.uploadResults.push({
                fileName: result.fileName,
                success: true,
                data: result.data
              });
            });
            response.data.errors.forEach(error => {
              this.uploadResults.push({
                fileName: error.fileName,
                success: false,
                error: error.error
              });
            });
          }
        }

        // Refresh candidates list
        await this.fetchCandidates();
        this.selectedFiles = [];

        // Clear files after successful upload
        // if (this.uploadResults.every(r => r.success)) {
        //   setTimeout(() => {
        //     this.clearFiles();
        //   }, 3000);
        // }
      } catch (error) {
        console.error('Upload error:', error);

        // Check for the specific "already applied" error
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Upload failed';

        if (errorMessage.includes('already applied within the last 6 months')) {
          // Show alert instead of treating as failure
          alert(errorMessage);
          return;
        }

        // Handle other errors normally
        this.selectedFiles.forEach(file => {
          this.uploadResults.push({
            fileName: file.name,
            success: false,
            error: errorMessage
          });
        });
      } finally {
        setTimeout(() => {
          this.clearFiles();
        }, 10000);
        this.uploading = false;
        this.hideLoader();
      }
    },
    async downloadResume(resumeId, candidate = null) {
      console.log('\n==========================================');
      console.log('ðŸ“¥ FRONTEND: Download Resume Request');
      console.log('==========================================');
      console.log('Resume ID (from parameter):', resumeId);
      console.log('Resume ID Type:', typeof resumeId);
      console.log('Candidate Object:', candidate);
      if (candidate) {
        console.log('Candidate Keys:', Object.keys(candidate));
        console.log('Candidate.resume_id:', candidate.resume_id);
        console.log('Candidate.resume:', candidate.resume);
        console.log('Candidate.resume?.id:', candidate.resume?.id);
      }
      console.log('API Base URL:', API_BASE_URL);

      // If resumeId is not provided, try to get it from candidate object
      if (!resumeId && candidate) {
        resumeId = candidate.resume_id || candidate.resume?.id;
        console.log('Resume ID (after fallback):', resumeId);
      }

      if (!resumeId) {
        console.error('âŒ Resume ID is missing or undefined');
        console.error('Cannot determine resume ID from:', {
          parameter: resumeId,
          candidate_resume_id: candidate?.resume_id,
          candidate_resume_id_nested: candidate?.resume?.id
        });
        alert('Resume ID is missing. Cannot download resume.');
        return;
      }

      console.log('Full URL:', `${API_BASE_URL}/resumes/${resumeId}/download`);
      this.showLoader('', 'Downloading Resume...');
      try {
        // console.log('Making axios GET request...');
        // const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
        //   responseType: 'json',
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        //   }
        // });

        // const fileUrl = response.data.file_path;
        // const fileName = response.data.file_name || 'download.pdf';

        // const link = document.createElement('a');
        // link.href = fileUrl;
        // link.download = fileUrl; // browser will try to download if allowed
        // link.target = '_blank';   // avoid replacing current tab
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
        const BEARER_TOKEN = localStorage.getItem('auth_token');

        // --- STEP 1: Get the external file path from your local API ---
        const apiResponse = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          // We still expect JSON from your local API
          responseType: 'json',
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        const externalFileUrl = apiResponse.data.file_path;
        const fileName = apiResponse.data.file_name || 'download.pdf';

        // Validate that we have a valid file path
        if (!externalFileUrl) {
          console.error("No file path returned from API:", apiResponse.data);
          throw new Error('Resume file path not found in API response');
        }

        // Extract the path *after* the domain (e.g., /files/DocStorage//...)
        const urlParts = externalFileUrl.split('https://appfilemedia.talygen.com');
        if (urlParts.length !== 2) {
          console.error("Invalid external file path format:", externalFileUrl);
          return;
        }
        // The path the proxy needs to see is '/files/DocStorage//...'
        // const proxyPath = `/talygen${urlParts[1]}`; 
        const proxyPath = externalFileUrl;
        // --- STEP 2: Use the proxy to download the file as a BLOB ---
        const fileResponse = await axios.get(proxyPath, {
          // ðŸš¨ CRITICAL: Must be 'blob' to handle binary file content
          responseType: 'blob',
          headers: {
            // Include your auth token only if the API requires it for this proxy request
            // In most cases, external file hosts don't need this, but we'll include it defensively.
            'Authorization': `Bearer ${BEARER_TOKEN}`
          }
        });

        // --- STEP 3: Trigger the download using the BLOB ---
        const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
        const link = document.createElement('a');

        // Set up the download
        link.href = url;
        link.download = fileName; // Use the file name retrieved from the API

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL to free up memory
        window.URL.revokeObjectURL(url);



      } catch (error) {
        console.error('\nâŒ ERROR downloading resume:');
        console.error('   - Error Message:', error.message);
        console.error('   - Error Response:', error.response);
        console.error('   - Error Status:', error.response?.status);
        console.error('   - Error Status Text:', error.response?.statusText);
        console.error('   - Error Data:', error.response?.data);
        console.error('   - Error Config:', error.config);
        console.error('==========================================\n');

        let errorMessage = 'Failed to download resume. ';
        if (error.response) {
          if (error.response.status === 404) {
            errorMessage += 'Resume not found.';
          } else if (error.response.status === 401) {
            errorMessage += 'Authentication failed. Please login again.';
          } else if (error.response.status === 403) {
            errorMessage += 'You do not have permission to download this resume.';
          } else {
            errorMessage += `Server error (${error.response.status}).`;
          }
        } else if (error.request) {
          errorMessage += 'No response from server. Please check your connection.';
        } else {
          errorMessage += error.message || 'Unknown error occurred.';
        }

        alert(errorMessage);
      } finally {
        this.hideLoader()
      }
    },
    async viewVersionHistory(candidate) {
      this.showLoader('Loading Version History', 'Fetching resume versions...');
      this.selectedCandidateForVersions = candidate;
      this.versionHistory = [];
      this.loadingVersionHistory = true;

      try {
        const resumeId = candidate.resume_id || candidate.resume?.id;
        if (!resumeId) {
          this.hideLoader();
          alert('Resume ID not found. Cannot fetch version history.');
          this.loadingVersionHistory = false;
          return;
        }

        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/versions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          this.versionHistory = response.data.data || [];
        } else {
          alert(response.data?.error || 'Failed to fetch version history.');
        }
      } catch (error) {
        console.error('Error fetching version history:', error);
        alert(error.response?.data?.error || 'Failed to fetch version history.');
      } finally {
        this.loadingVersionHistory = false;
        this.showVersionHistoryModal = true;
        this.hideLoader();
      }
    },
    closeVersionHistoryModal() {
      this.showVersionHistoryModal = false;
      this.versionHistory = [];
      this.selectedCandidateForVersions = null;
    },


    async viewResumeDetail(candidate) {
      this.showLoader('Loading Candidate Details', 'Fetching resume and evaluation data...');
      this.resumeDetailEvaluation = null;
      this.resumeDetail = null;
      this.errorResumeDetail = null;

      //change evaluationId id into resume_id
      await this.fetchResumeDetail(candidate.resume_id);
      this.showResumeModal = true;
      this.hideLoader();
    },
    async fetchResumeDetail(evaluationId) {
      this.loadingResumeDetail = true;
      this.errorResumeDetail = null;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.data && response.data.success) {
          this.resumeDetailEvaluation = response.data.data;
          this.resumeDetail = response.data.data?.resume;

          if (!this.resumeDetail) {
            this.resumeDetail = {
              id: null,
              name: this.resumeDetailEvaluation?.candidate_name || 'N/A',
              email: this.resumeDetailEvaluation?.email || 'N/A',
              phone: this.resumeDetailEvaluation?.contact_number || 'N/A',
              location: null,
              skills: [],
              experience: [],
              education: [],
              certifications: []
            };
          }

          // Fetch timeline
          await this.fetchTimeline(evaluationId);
        } else {
          this.errorResumeDetail = response.data?.error || 'Failed to fetch resume details. Please try again.';
        }
      } catch (error) {
        console.error('Error fetching resume detail:', error);
        if (error.response?.status === 401) {
          this.errorResumeDetail = 'Session expired. Please login again.';
        } else if (error.response?.status === 404) {
          this.errorResumeDetail = `Evaluation with ID ${evaluationId} not found.`;
        } else {
          this.errorResumeDetail = error.response?.data?.error || error.message || 'Failed to fetch resume details. Please try again.';
        }
      } finally {
        this.loadingResumeDetail = false;
      }
    },
    async fetchTimeline(evaluationId) {
      this.loadingTimeline = true;
      try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}/timeline`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          this.timeline = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
        // Don't show error for timeline, just log it
      } finally {
        this.loadingTimeline = false;
      }
    },
    async updateResumeStatus() {
      try {
        const response = await axios.patch(
          `${API_BASE_URL}/evaluations/${this.resumeDetailEvaluation.id}/status`,
          { status: this.resumeDetailEvaluation.status }
        );
        if (response.data.success) {
          this.resumeDetailEvaluation = response.data.data;
          // Refresh candidates list to reflect status change
          await this.fetchCandidates();
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      }
    },
    async downloadResumeFromModal() {
      if (!this.resumeDetail || !this.resumeDetail.id) {
        alert('Resume file not available for download.');
        return;
      }
      const resumeId = this.resumeDetail.id;
      this.downloadResume(resumeId)

    },
    closeResumeModal() {
      this.showResumeModal = false;
      this.resumeDetailEvaluation = null;
      this.resumeDetail = null;
      this.errorResumeDetail = null;
      this.timeline = [];
    },
    formatExperience(years) {
      if (!years && years !== 0) return 'N/A';
      const totalYears = parseFloat(years);
      if (isNaN(totalYears)) return 'N/A';

      const wholeYears = Math.floor(totalYears);
      const months = Math.round((totalYears - wholeYears) * 12);

      if (wholeYears === 0 && months === 0) return 'Less than 1 month';
      if (wholeYears === 0) return `${months} ${months === 1 ? 'month' : 'months'}`;
      if (months === 0) return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
      return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
    },
    editJob() {
      this.editForm = {
        title: this.jobDescription.title,
        description: this.jobDescription.description,
        requirements: this.jobDescription.requirements || '',
        interviewers: this.jobDescription.interviewers || [],
        status: this.jobDescription.status || 'Open'
      };

      this.showEditModal = true;
    },
    async saveJob() {
      this.saving = true;
      try {
        const response = await axios.put(
          `${API_BASE_URL}/job-descriptions/${this.$route.params.id}`,
          this.editForm
        );
        if (response.data.success) {
          await this.fetchJobDescription();
          await this.fetchAssignInterviewers()
          this.closeEditModal();
        }
      } catch (error) {
        console.error('Error updating job description:', error);
        alert('Failed to update job description. Please try again.');
      } finally {
        this.saving = false;
      }
    },
    async deleteJob() {
      if (!confirm('Are you sure you want to delete this job description? This will also delete all associated candidate evaluations.')) {
        return;
      }

      try {
        await axios.delete(`${API_BASE_URL}/job-descriptions/${this.$route.params.id}`);
        this.$router.push('/job-descriptions');
      } catch (error) {
        console.error('Error deleting job description:', error);
        alert('Failed to delete job description. Please try again.');
      }
    },
    closeEditModal() {
      this.showEditModal = false;
      this.editForm = {
        title: '',
        description: '',
        requirements: '',
        interviewers: [],
        status: 'Open'
      };
    },
    getStatusClass(status) {
      return {
        'status-selected': status === 'selected' || status === 'accepted',
        'status-pending': status === 'pending',
        'status-rejected': status === 'rejected',
        'status-on-hold': status === 'on_hold'
      };
    },
    formatDate,
    formatDateTime,
    formatTime,
    async fetchInterviewers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/users?role=Interviewer`);
        if (response.data.success) {
          this.interviewers = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      }
    },
    async fetchAssignInterviewers() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/already-assigned-interviewer-list/${this.$route.params.id}`);
        if (response.data.success) {
          this.assignInterviewers = response.data.data;
        }
      } catch (error) {
        console.error('Error fetching interviewers:', error);
      }
    },

    async openAssignModal(candidate) {
      let videoCall = candidate.is_video_call == 0 ? false : true
      this.assignmentData = {
        evaluation_id: candidate.id,
        interviewer_id: null,
        slot_id: '',
        isVideoCall: videoCall,
      };
      this.selectedInterviewersforAssign = [];
      this.selectedTimeSlotforBulkAssign = '';
      this.availableSlots = [];
      this.is_video_call = videoCall;

   
     
     
        this.assignMultipleInterviwer = false;
      

      this.showAssignModal = true;
    },


  

  


    async assignInterviewer() {
      if (!this.assignmentData.interviewer_id || !this.assignmentData.slot_id) {
        alert('Please fill in all required fields');
        return;
      }
      this.loading = true;
      this.showLoader('Assigning to interviewer...');
      debugger;
      try {
        let response;
        if (this.assignmentData.evaluation_id && this.candidates.find(c => c.id === this.assignmentData.evaluation_id)?.interviewer_id) {
          // Reassign
          response = await axios.put(
            `${API_BASE_URL}/interviews/assign/${this.assignmentData.evaluation_id}`,
            {
              interviewer_id: this.assignmentData.interviewer_id,
              interview_date: null,
              slot_id: this.assignmentData.slot_id,
              is_video_call: this.assignmentData.isVideoCall
            }
          );
        } else {
          // New assignment
          response = await axios.post(
            `${API_BASE_URL}/interviews/assign`,
            {
              evaluation_id: this.assignmentData.evaluation_id,
              interviewer_id: this.assignmentData.interviewer_id,
              interview_date: null,
              slot_id: this.assignmentData.slot_id,
              is_video_call: this.assignmentData.isVideoCall
            }
          );
        }

        if (response.data.success) {
          await this.fetchCandidates();
          // Refresh timeline if resume detail modal is open
          if (this.showResumeModal && this.resumeDetailEvaluation) {
            await this.fetchTimeline(this.resumeDetailEvaluation.id);
          }
          this.showAssignModal = false;
          alert('Interview assigned successfully!');
        }
        else {
          alert(response.data.error || 'Failed to assign interviewer. Please try again.');
        }
      } catch (error) {
        console.error('Error assigning interviewer:', error);
        alert('Failed to assign interviewer. Please try again.');
      } finally {

        this.loading = false;
        this.hideLoader();

      }
    },
    async assignInterviewerGroup() {
      if (!this.selectedTimeSlotforBulkAssign || !this.selectedInterviewersforAssign.length) {
        alert('Please select interviewers and a time slot');
        return;
      }

      this.loading = true;
      this.showLoader('Assigning to interviewers...');

      try {
        // Parse the selected slot_ids from the dropdown value
        let selectedSlotIds;
        try {
          selectedSlotIds = JSON.parse(this.selectedTimeSlotforBulkAssign);
        } catch (e) {
          console.error('Error parsing selected slot:', e);
          alert('Invalid time slot selection. Please try again.');
          return;
        }

        if (!Array.isArray(selectedSlotIds) || selectedSlotIds.length === 0) {
          alert('Invalid slot selection. Please select a valid time slot.');
          return;
        }

        // Find the selected slot from available slots by comparing slot_ids arrays
        const selectedSlot = this.availableSlots.find(item => {
          const itemSlotIds = Array.isArray(item.slot_ids)
            ? item.slot_ids
            : (typeof item.slot_ids === 'string' ? JSON.parse(item.slot_ids) : []);

          if (!Array.isArray(itemSlotIds) || itemSlotIds.length !== selectedSlotIds.length) {
            return false;
          }

          // Compare arrays - sort and compare to handle different orders
          const sortedSelected = [...selectedSlotIds].sort().join(',');
          const sortedItem = [...itemSlotIds].sort().join(',');
          return sortedSelected === sortedItem;
        });

        if (!selectedSlot) {
          console.error('Selected slot not found.');
          console.error('Selected slot_ids:', selectedSlotIds);
          console.error('Available slots:', this.availableSlots.map(s => ({
            start_time: s.start_time,
            slot_ids: s.slot_ids,
            interviewer_ids: s.interviewer_ids
          })));
          alert('Selected time slot not found. Please try selecting again.');
          return;
        }

        // Ensure slot_ids and interviewer_ids are arrays
        const slotIds = Array.isArray(selectedSlot.slot_ids)
          ? selectedSlot.slot_ids
          : (typeof selectedSlot.slot_ids === 'string' ? JSON.parse(selectedSlot.slot_ids) : []);

        const interviewerIds = Array.isArray(selectedSlot.interviewer_ids)
          ? selectedSlot.interviewer_ids
          : (typeof selectedSlot.interviewer_ids === 'string' ? JSON.parse(selectedSlot.interviewer_ids) : []);

        if (!Array.isArray(slotIds) || slotIds.length === 0) {
          alert('Invalid slot data. Please try again.');
          return;
        }

        if (!Array.isArray(interviewerIds) || interviewerIds.length === 0) {
          alert('Invalid interviewer data. Please try again.');
          return;
        }

        // Use interviewer_ids from the selected slot (they should match the selected interviewers)
        // The slot already contains the correct interviewer_ids for that time slot
        const response = await axios.post(
          `${API_BASE_URL}/interviews/assign/bulk`,
          {
            evaluation_id: this.assignmentData.evaluation_id,
            interviewer_ids: interviewerIds,
            interview_date: selectedSlot.start_time,
            slot_ids: slotIds,
            is_video_call: this.assignmentData.isVideoCall
          }
        );

        if (response.data.success) {
          await this.fetchCandidates();
          // Refresh timeline if resume detail modal is open
          if (this.showResumeModal && this.resumeDetailEvaluation) {
            await this.fetchTimeline(this.resumeDetailEvaluation.id);
          }
          this.showAssignModal = false;
          this.selectedInterviewersforAssign = [];
          this.selectedTimeSlotforBulkAssign = '';
          alert(`Successfully assigned ${interviewerIds.length} interviewer(s)!`);
        }
        else {
          alert(response.data.error || 'Failed to assign interviewers. Please try again.');
        }
      } catch (error) {
        console.error('Error assigning interviewers:', error);
        alert(error.response?.data?.error || 'Failed to assign interviewers. Please try again.');
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    openFeedbackModal(candidate) {
      this.selectedCandidateForFeedback = candidate;
      // Get the current user's interview detail if exists
      const userInterviewDetail = candidate.interview_details && candidate.interview_details.find(id => id.interviewer_id === this.user?.id);
      const feedbackSource = userInterviewDetail || candidate;

      if (feedbackSource.interviewer_feedback) {
        this.feedbackData = {
          ratings: { ...feedbackSource.interviewer_feedback },
          status: feedbackSource.interviewer_status || 'pending',
          hold_reason: feedbackSource.interviewer_hold_reason || '',
          remarks: feedbackSource.interviewer_feedback.interviewer_remarks || ''
        };
      } else {
        this.feedbackData = {
          ratings: {
            technical_skills: null,
            communication: null,
            problem_solving: null,
            cultural_fit: null,
            experience_relevance: null,
            overall: null
          },
          status: 'pending',
          hold_reason: '',
          remarks: ''
        };
      }
      this.showFeedbackModal = true;
    },
    onStatusChange() {
      if (this.feedbackData.status !== 'on_hold') {
        this.feedbackData.hold_reason = '';
      }
    },
    async submitFeedback() {
      // Validate ratings
      // for (const [key, value] of Object.entries(this.feedbackData.ratings)) {
      //   if (value === null || value < 0 || value > 10) {
      //     alert(`Please provide a valid rating (1-10) for ${key.replace('_', ' ')}`);
      //     return;
      //   }
      // }

      if (this.feedbackData.status === 'on_hold' && !this.feedbackData.hold_reason.trim()) {
        alert('Please provide a reason for putting the candidate on hold');
        return;
      }

      if (this.feedbackData.status === 'pending') {
        alert('Please select a status (Selected, Rejected, or On Hold)');
        return;
      }

      this.submittingFeedback = true;
      this.showLoader('Submitting Feedback', 'Saving your interview feedback...');

      //   let ratingData  = {

      //     technical_skills: this.feedbackData.ratings.technical_skills ?? 1 ,
      //     communication:  this.feedbackData.ratings.communication ?? 1 ,
      //             problem_solving: this.feedbackData.ratings.problem_solving ?? 1 ,
      //     cultural_fit:  this.feedbackData.ratings.cultural_fit ?? 1 ,
      //     experience_relevance: this.feedbackData.ratings.experience_relevance ?? 1 ,
      //     overall: this.feedbackData.ratings.overall ?? 1 ,
      // };

      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.selectedCandidateForFeedback.id}/interviewer-feedback`,
          {
            ratings: { ...this.feedbackData.ratings, interviewer_remarks: this.feedbackData.remarks },
            status: this.feedbackData.status,
            hold_reason: this.feedbackData.status === 'on_hold' ? this.feedbackData.hold_reason : null
          }
        );

        if (response.data.success) {
          await this.fetchCandidates();
          // Refresh timeline if resume detail modal is open
          if (this.showResumeModal && this.resumeDetailEvaluation) {
            await this.fetchTimeline(this.resumeDetailEvaluation.id);
          }
          this.showFeedbackModal = false;
          alert('Feedback submitted successfully!');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      } finally {
        this.submittingFeedback = false;
        this.hideLoader();
      }
    },
    openHRDecisionModal(candidate) {
      this.hrDecisionData = {
        evaluation_id: candidate.id,
        status: candidate.hr_final_status || 'pending',
        reason: candidate.hr_final_reason || '',
        hrRemarks: candidate.hr_remarks || ''
      };
      this.selectedCandidateForFeedback = candidate; // Reuse this to show interviewer feedback
      this.showHRDecisionModal = true;
    },
    async submitHRDecision() {
      if (!this.hrDecisionData.status || this.hrDecisionData.status === 'pending') {
        alert('Please select a status');
        return;
      }

      // Check if reason is required
      const requiresReason =
        this.hrDecisionData.status === 'rejected' ||
        this.hrDecisionData.status === 'on_hold' ||
        (this.hrDecisionData.status === 'selected' &&
          !this.hasAnyInterviewerSelected(this.selectedCandidateForFeedback));

      if (requiresReason && !this.hrDecisionData.reason.trim()) {
        if (this.hrDecisionData.status === 'selected') {
          alert('Please provide a reason for selecting this candidate (overriding interviewer\'s decision).');
        } else {
          alert('Please provide a reason for ' + this.hrDecisionData.status);
        }
        return;
      }

      this.showLoader('Submitting Decision', 'Saving HR final decision...');
      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.hrDecisionData.evaluation_id}/hr-decision`,
          {
            status: this.hrDecisionData.status,
            reason: this.hrDecisionData.reason,
            hrRemarks: this.hrDecisionData.hrRemarks
          }
        );

        if (response.data.success) {
          await this.fetchCandidates();
          // Refresh timeline if resume detail modal is open
          if (this.showResumeModal && this.resumeDetailEvaluation) {
            await this.fetchTimeline(this.resumeDetailEvaluation.id);
          }
          this.showHRDecisionModal = false;
          alert('Final decision updated successfully!');
        }
      } catch (error) {
        console.error('Error updating HR decision:', error);
        alert('Failed to update decision. Please try again.');
      } finally {
        this.hideLoader();
      }
    },
    openInterviewerDetailsModal(candidate) {
      this.selectedCandidateForInterviewerDetails = candidate;
      this.showInterviewerDetailsModal = true;
    },
    viewHoldDetails(candidate) {
      this.holdCandidate = candidate;
      this.showHoldModal = true;
    },
    onHRStatusChange() {
      // Clear reason if status changes to selected and any interviewer also selected
      if (this.hrDecisionData.status === 'selected' &&
        this.hasAnyInterviewerSelected(this.selectedCandidateForFeedback)) {
        this.hrDecisionData.reason = '';
      }
    },
    getReasonPlaceholder() {
      if (this.hrDecisionData.status === 'selected' &&
        !this.hasAnyInterviewerSelected(this.selectedCandidateForFeedback)) {
        return 'Please provide a reason for selecting this candidate (overriding interviewer\'s decision)...';
      } else if (this.hrDecisionData.status === 'rejected') {
        return 'Enter rejection reason...';
      } else if (this.hrDecisionData.status === 'on_hold') {
        return 'Enter hold reason...';
      }
      return 'Enter reason...';
    },
    hasAnyInterviewerSelected(candidate) {
      // Check if any interviewer selected the candidate
      if (candidate.interview_details && candidate.interview_details.length > 0) {
        return candidate.interview_details.some(id => id.interviewer_status === 'selected');
      }
      // Fallback for backward compatibility
      return candidate.interviewer_status === 'selected';
    },
    getInterviewerDecisionText(candidate) {
      // Handle multiple interviewers
      if (candidate.interview_details && candidate.interview_details.length > 0) {
        const submittedFeedbacks = candidate.interview_details.filter(id => id.interviewer_status && id.interviewer_status !== 'pending');
        const totalInterviewers = candidate.interview_details.length;

        // If multiple interviewers assigned
        if (totalInterviewers > 1) {
          // Check if all have submitted feedback
          if (submittedFeedbacks.length === totalInterviewers) {
            // All feedback submitted - show comma-separated statuses
            const statuses = submittedFeedbacks.map(id => id.interviewer_status.replace(/_/g, ' ').toUpperCase());
            return statuses.join(', ');
          } else {
            // Not all feedback submitted - show awaited
            return `AWAITED (${submittedFeedbacks.length}/${totalInterviewers})`;
          }
        } else {
          // Single interviewer - show their status
          const status = candidate.interview_details[0].interviewer_status || 'pending';
          return status.replace(/_/g, ' ').toUpperCase();
        }
      }

      // Fallback for backward compatibility (old single interviewer field)
      if (candidate.interviewer_status && candidate.interviewer_status !== 'pending') {
        return candidate.interviewer_status.replace(/_/g, ' ').toUpperCase();
      }

      return 'PENDING';
    },
    getInterviewerDecisionClass(candidate) {
      // Handle multiple interviewers
      if (candidate.interview_details && candidate.interview_details.length > 0) {
        const submittedFeedbacks = candidate.interview_details.filter(id => id.interviewer_status && id.interviewer_status !== 'pending');
        const totalInterviewers = candidate.interview_details.length;

        // If multiple interviewers assigned
        if (totalInterviewers > 1) {
          // Check if all have submitted feedback
          if (submittedFeedbacks.length === totalInterviewers) {
            // All feedback submitted - use first status for class (or create a combined class)
            const firstStatus = submittedFeedbacks[0]?.interviewer_status || 'pending';
            return `interviewer-${firstStatus}`;
          } else {
            // Not all feedback submitted - use 'pending' or 'awaited' class
            return 'interviewer-pending';
          }
        } else {
          // Single interviewer - use their status
          const status = candidate.interview_details[0].interviewer_status || 'pending';
          return `interviewer-${status}`;
        }
      }

      // Fallback for backward compatibility
      if (candidate.interviewer_status && candidate.interviewer_status !== 'pending') {
        return `interviewer-${candidate.interviewer_status}`;
      }

      return 'interviewer-pending';
    },
    getFilteredRatings(ratings) {
      if (!ratings || typeof ratings !== 'object') return {};
      const filtered = {};
      for (const [key, value] of Object.entries(ratings)) {
        if (key !== 'interviewer_remarks' && value !== null && value !== undefined && value !== '') {
          filtered[key] = value;
        }
      }
      return filtered;
    },
    getTimelineMarkerClass(eventType) {
      return {
        'marker-upload': eventType === 'resume_uploaded',
        'marker-assign': eventType === 'interviewer_assigned' || eventType === 'interviewer_reassigned',
        'marker-schedule': eventType === 'interview_scheduled',
        'marker-feedback': eventType === 'feedback_submitted',
        'marker-decision': eventType === 'hr_decision'
      };
    }
  }
};
</script>
