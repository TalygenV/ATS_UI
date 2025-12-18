<template>
  <div class="job-detail-page jdetpage" :class="{ 'processing': uploading }">
    <div class="page-header">
      <button @click="$router.push('/job-descriptions')" class="btn-back">← Back to Job Descriptions</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="jobDescription" class="content">
          <!-- <span data-v-368fdc2f="" class="status-badge ">accepted 5</span> -->
          
                       <!-- <span :class="['status-badge', canditateOnholdCount.key]">{{ canditateOnholdCount.key }} {{ canditateOnholdCount.value }}</span>
                       <span :class="['status-badge', canditateSelectedCount.key]">{{ canditateSelectedCount.key }} {{ canditateSelectedCount.value }}</span> -->

      <!-- Job Description Info -->
      <div class="job-info-card">
           <div class="mb-3">
           <span :class="['status-badge', canditateAcceptCount.key]">{{ canditateAcceptCount.key }} {{ canditateAcceptCount.value }}</span>
               <span :class="['status-badge', canditatePendingCount.key]">{{ canditatePendingCount.key }} {{ canditatePendingCount.value }}</span>
                   <span :class="['status-badge', canditateRejectedCount.key]">{{ canditateRejectedCount.key }} {{ canditateRejectedCount.value }}</span>
          </div>  
        <div class="card-header">
          <h2>{{ jobDescription.title }}</h2>
          <div v-if="hasWriteAccess" class="header-actions">
            <button
              v-if="!candidateLinkUrl"
              @click="generateCandidateLink"
              class="btn btn-primary"
              :disabled="candidateLinkLoading"
            >
              <span v-if="candidateLinkLoading">Generating Link...</span>
              <span v-else>Generate Candidate Link</span>
            </button>
            <button
              v-else
              @click="copyCandidateLink"
              class="btn btn-primary"
            >
              Copy Candidate Link
            </button>
            <button @click="editJob" class="btn btn-secondary">Edit</button>
            <button @click="deleteJob" class="btn btn-danger">Delete</button>
          </div>
        </div>
        <div class="card-body">
      
          <div class="info-section">
            <h3>Job Description</h3>
            <p class="description-text">{{ jobDescription.description }}</p>
          </div>
          <div v-if="jobDescription.requirements" class="info-section">
            <h3>Requirements</h3>
            <p class="description-text">{{ jobDescription.requirements }}</p>
          </div>
          <div class="info-section">
            <p class="meta-info">Created: {{ formatDate(jobDescription.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Upload Resumes Section -->
      <div v-if="hasWriteAccess" class="upload-section-card">
        <h3>Upload Resumes</h3>
        <div class="upload-area" 
             :class="{ 'drag-over': isDragOver }"
             @drop="handleDrop"
             @dragover.prevent="isDragOver = true"
             @dragleave="isDragOver = false"
             @click="triggerFileInput">
          <input 
            ref="fileInput"
            type="file" 
            multiple 
            accept=".pdf,.doc,.docx,.txt"
            @change="handleFileSelect"
            style="display: none"
          />
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

        <div class="upload-actions">
          <button 
            @click="uploadFiles" 
            :disabled="selectedFiles.length === 0 || uploading || selectedFiles.length > 5"
            class="btn btn-primary">
            Upload & Parse Resumes
          </button>
          <button 
            @click="clearFiles" 
            :disabled="selectedFiles.length === 0 || uploading"
            class="btn btn-secondary">
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

        <div v-if="uploadResults.length > 0" > 
          <h4>Detailed Results</h4>
            <div v-for="(result, index) in uploadResults" :key="index" class="upload-result-item" :class="{ 'success': result.success, 'error': !result.success }">
              <p class="result-file-name mb-0"> File Name : {{ result.fileName }}</p>
              <span v-if="result.success" class="result-success"> Message :  Uploaded Successfully</span>
              <span v-else class="result-error"> Message : {{ result.error }}</span>
            </div>
          </div>
      </div>

      <!-- Candidates List -->
      <div class="candidates-section-card">
        <div class="section-header">
          <h3>Candidates ({{ candidates.length }})</h3>
          <div class="header-actions">
            <select v-model="statusFilter" @change="fetchCandidates" class="filter-select">
              <!-- <option value="">All Status</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
              <option value="pending">Pending</option> -->
                <option value="">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <select v-model="sortBy" @change="fetchCandidates" class="filter-select">
              <option value="match">Sort by Match Score</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        <div v-if="loadingCandidates" class="loading">Loading candidates...</div>
        <div v-else-if="candidates.length === 0" class="empty-state">
          <p>No candidates found. Upload resumes to get started!</p>
        </div>
              <!-- v-show="hasRole('Interviewer') ? candidate.interviewer_id === user?.id : true "  -->
        <div v-else class="candidates-grid">
          <div 
            v-for="candidate in candidates" 
            :key="candidate.id" 
            class="candidate-card" 
            :class="getStatusClass(candidate.status)"
      
            v-show="hasRole('Interviewer')
  ? (candidate.interviewer_id === user?.id || candidate.isDuplicate)
  : true"
          >
            <div class="card-header-section">
              <div class="candidate-header">
              <div class="candidate-info">
                <h4>{{ candidate.candidate_name || 'Unknown' }}</h4>
                  <!-- <h4>{{ candidate.resume_id || 'Unknown' }}</h4> -->
                <span class="candidate-email">{{ candidate.email || 'N/A' }}</span>
                <div v-if="candidate.interviewer" class="interviewer-info">
                  <span class="interviewer-label">Interviewer:</span>
                  <span class="interviewer-name">{{ candidate.interviewer.full_name || candidate.interviewer.email || 'N/A' }}</span>
                </div>
                <div v-if="candidate.interview_date" class="interview-date">
                  <span class="date-label">Interview:</span>
                  <span class="date-value">{{ formatDateTime(candidate.interview_date) }}</span>
                </div>
                <div v-if="candidate.interviewer_status && candidate.interviewer_status !== 'pending'" class="interviewer-status">
                  <span class="status-label">Interviewer Decision:</span>
                  <span :class="['status-badge-small', 'interviewer-' + candidate.interviewer_status]">
                    {{ candidate.interviewer_status.replace(/_/g, ' ') }}
                  </span>
                </div>
                <div v-if="!['Interviewer'].includes(user.role) && candidate.hr_final_status && candidate.hr_final_status !== 'pending'" class="interviewer-status">
                  <span class="status-label">HR Final Decision:</span>
                  <span :class="['status-badge-small', 'interviewer-' + candidate.hr_final_status]">
                    {{ candidate.hr_final_status.replace(/_/g, ' ') }}
                  </span>
                </div>
              </div>
                <div class="match-score-circle">
                  <div class="score-value-small">{{ formatScore(candidate.overall_match) }}%</div>
                  <div class="score-label-small">Match</div>
                </div>
              </div>
              <div class="status-badge-top">
                <span v-if="candidate.isVersion || candidate.isDuplicate" class="version-badge">
                  Version {{ candidate.versionNumber || 1 }}
                  <span v-if="candidate.totalVersions > 1" class="version-count">({{ candidate.totalVersions }} total)</span>
                </span>
                <span :class="['status-badge', candidate.status]">{{ candidate.status }}</span>
              </div>
            </div>
            
            <div class="card-body-section">
              <div class="match-breakdown">
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Skills</span>
                    <span class="match-percentage">{{ formatScore(candidate.skills_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: formatScore(candidate.skills_match) + '%' }"></div>
                  </div>
                </div>
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Experience</span>
                    <span class="match-percentage">{{ formatScore(candidate.experience_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: formatScore(candidate.experience_match) + '%' }"></div>
                  </div>
                </div>
                <div class="match-item">
                  <div class="match-header">
                    <span class="match-label">Education</span>
                    <span class="match-percentage">{{ formatScore(candidate.education_match) }}%</span>
                  </div>
                  <div class="match-bar">
                    <div class="match-fill" :style="{ width: candidate.education_match + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-footer-section">
              <span class="date">{{ formatDate(candidate.created_at) }}</span>
              <div class="footer-actions">
                <!-- HR/Admin: Assignment buttons -->
                <button v-if="hasWriteAccess && !candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn btn-assign">
                  Assign Interviewer
                </button>
                <button v-if="hasWriteAccess && candidate.interviewer_id" @click="openAssignModal(candidate)" class="btn btn-assign">
                  Reassign
                </button>
                <!-- Interviewer: Feedback button (only for assigned candidates) -->
                <button 
                  v-if="hasRole('Interviewer') && candidate.interviewer_id === user?.id && candidate.interviewer_status === 'pending'" 
                  @click="openFeedbackModal(candidate)" 
                  class="btn btn-feedback"
                >
                  Submit Feedback
                </button>
                <button 
                  v-if="hasRole('Interviewer') && candidate.interviewer_id === user?.id && candidate.interviewer_status !== 'pending'" 
                  @click="openFeedbackModal(candidate)" 
                  class="btn btn-feedback"
                >
                  View/Edit Feedback
                </button>
                <!-- HR/Admin: Final Decision button (after interviewer feedback) -->
                <button 
                  v-if="hasWriteAccess && candidate.interviewer_status && candidate.interviewer_status !== 'pending' && (!candidate.hr_final_status || candidate.hr_final_status === 'pending')" 
                  @click="openHRDecisionModal(candidate)" 
                  class="btn btn-hr-decision"
                >
                  HR Decision
                </button>
                <!-- On Hold Details button -->
                <button 
                  v-if="candidate.hr_final_status === 'on_hold' || candidate.interviewer_status === 'on_hold'" 
                  @click="viewHoldDetails(candidate)" 
                  class="btn btn-hold"
                >
                  View Hold Details
                </button>
                <button @click="downloadResume(candidate.resume_id, candidate)" class="btn btn-icon" title="Download Resume">
                  ⬇️
                </button>
                <button 
                  v-if="candidate.isVersion || candidate.isDuplicate" 
                  @click="viewVersionHistory(candidate)" 
                  class="btn btn-version-history"
                  title="View Version History"
                >
                  📜 Versions 
                </button>
                <button @click="viewResumeDetail(candidate)" class="btn btn-primary-small">View Details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Job Description</h2>
          <button @click="closeEditModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveJob">
            <div class="form-group">
              <label for="title">Job Title *</label>
              <input
                id="title"
                v-model="editForm.title"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="description">Job Description *</label>
              <textarea
                id="description"
                v-model="editForm.description"
                required
                rows="8"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="requirements">Requirements (Optional)</label>
              <textarea
                id="requirements"
                v-model="editForm.requirements"
                rows="6"
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="interviewers">Assign Interviewers (Optional)</label>
              <select
                id="interviewers"
                v-model="editForm.interviewers"
                multiple
                class="form-select"
                style="min-height: 120px;"
              >
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
              <small class="form-hint">Hold Ctrl (or Cmd on Mac) to select multiple interviewers</small>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeEditModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn btn-primary">
                <span v-if="saving">Saving...</span>
                <span v-else>Update</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Resume Detail Modal -->
    <div v-if="showResumeModal" class="resume-modal-overlay" @click="closeResumeModal">
      <div class="resume-modal-content" @click.stop>
        <div class="resume-modal-header">
          <button @click="closeResumeModal" class="close-btn">×</button>
        </div>
        <div class="resume-modal-body">
          <div v-if="loadingResumeDetail" class="loading">Loading resume details...</div>
          <div v-else-if="errorResumeDetail && !resumeDetailEvaluation" class="error-message">{{ errorResumeDetail }}</div>
          <div v-else-if="resumeDetailEvaluation" class="resume-detail-content">
            <!-- Header Section -->
            <div class="resume-header-card">
              <div class="resume-header-content">
                <h1>{{ resumeDetailEvaluation.candidate_name || 'Unknown Candidate' }}</h1>
                <p class="candidate-contact">
                  <span v-if="resumeDetailEvaluation.email">📧 {{ resumeDetailEvaluation.email }}</span>
                  <span v-if="resumeDetailEvaluation.contact_number"> | 📞 {{ resumeDetailEvaluation.contact_number }}</span>
                </p>
                <div class="resume-header-actions">
                  <button @click="downloadResumeFromModal" class="btn btn-primary">⬇️ Download Resume</button>
                  <select v-if="hasWriteAccess" v-model="resumeDetailEvaluation.status" @change="updateResumeStatus" class="status-select">
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
            <div class="resume-info-card">
              <h2>Resume Information</h2>
              
              <div v-if="errorResumeDetail && resumeDetailEvaluation" class="error-notice">
                <p>⚠️ {{ errorResumeDetail }}</p>
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

              <div v-if="resumeDetail && resumeDetail.summary" class="info-section">
                <h3>Summary</h3>
                <p class="summary-text">{{ resumeDetail.summary }}</p>
              </div>

              <div v-if="resumeDetail && resumeDetail.skills && resumeDetail.skills.length > 0" class="info-section">
                <h3>Skills</h3>
                <div class="tags">
                  <span v-for="(skill, index) in resumeDetail.skills" :key="index" class="tag">
                    {{ skill }}
                  </span>
                </div>
              </div>

              <div v-if="resumeDetail && resumeDetail.experience && resumeDetail.experience.length > 0" class="info-section">
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

              <div v-if="resumeDetail && resumeDetail.education && resumeDetail.education.length > 0" class="info-section">
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

              <div v-if="resumeDetail && resumeDetail.certifications && resumeDetail.certifications.length > 0" class="info-section">
                <h3>Certifications</h3>
                <ul class="certifications-list">
                  <li v-for="(cert, index) in resumeDetail.certifications" :key="index">{{ cert }}</li>
                </ul>
              </div>

              <div class="info-section">
                <h3>Raw Resume Text</h3>
                <div class="raw-text-container">
                  <pre class="raw-text">{{ resumeDetailEvaluation.resume_text || (resumeDetail && resumeDetail.raw_text) || 'No text available' }}</pre>
                </div>
              </div>
            </div>

            <!-- Job Description Section -->
            <div class="job-description-card">
              <h2>Job Description</h2>
              <div class="job-description-content">
                <pre class="job-description-text">{{ resumeDetailEvaluation.job_description.description || 'No job description available' }}</pre>
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
                      <span class="timeline-date">{{ formatDateTime(event.timestamp) }}</span>
                    </div>
                    <p class="timeline-description">{{ event.description }}</p>
                    
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
                      <div v-if="(event.type === 'interviewer_assigned' || event.type === 'interviewer_reassigned') && event.details.interviewer" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Interviewer:</span>
                          <span class="detail-value">{{ event.details.interviewer.full_name || event.details.interviewer.email }}</span>
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
                          <span class="detail-value">{{ event.details.interviewer.full_name || event.details.interviewer.email }}</span>
                        </div>
                      </div>

                      <!-- Feedback details -->
                      <div v-if="event.type === 'feedback_submitted' && event.details.ratings" class="detail-box">
                        <div class="detail-row">
                          <span class="detail-label">Decision:</span>
                          <span :class="['status-badge', 'timeline-status', 'interviewer-' + event.details.status]">
                            {{ event.details.status }}
                          </span>
                        </div>
                        <div v-if="event.details.ratings" class="ratings-detail">
                          <strong>Ratings:</strong>
                          <div class="ratings-list">
                            <div v-for="(rating, key) in event.details.ratings" :key="key" class="rating-detail-item">
                              <span class="rating-key">{{ key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }}:</span>
                              <span class="rating-value">{{ rating }}/10</span>
                            </div>
                          </div>
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
    <div v-if="showAssignModal" class="modal-overlay" @click="showAssignModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Assign Interviewer</h2>
          <button @click="showAssignModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="assignInterviewer">
            <div class="form-group">
              <label>Interviewer *</label>
              <select v-model="assignmentData.interviewer_id" @change="fetchAvailableSlots" required class="form-input">
                <option value="">Select Interviewer</option>
                <option v-for="interviewer in interviewers" :key="interviewer.id" :value="interviewer.id">
                  {{ interviewer.full_name || interviewer.email }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Available Slots *</label>
              <select v-model="assignmentData.slot_id" required class="form-input">
                <option value="">Select Time Slot</option>
                <option v-for="slot in availableSlots" :key="slot.id" :value="slot.id">
                  {{ formatDateTime(slot.start_time) }} – {{ formatTime(slot.end_time) }} 
                  ({{ slot.interviewer?.full_name || slot.interviewer?.email || 'Interviewer' }})
                </option>
              </select>
              <p v-if="availableSlots.length === 0 && assignmentData.interviewer_id" class="hint-text">
                No available slots found for the selected interviewer. Ask interviewer to add availability.
              </p>
            </div>
            <div class="form-actions">
              <button type="button" @click="showAssignModal = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Assign</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Interviewer Feedback Modal -->
    <div v-if="showFeedbackModal && selectedCandidateForFeedback" class="modal-overlay" @click="showFeedbackModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Interview Feedback</h2>
          <button @click="showFeedbackModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitFeedback">
            <div class="form-section">
              <h3>Candidate Ratings (1-10 scale)</h3>
              <div class="ratings-grid">
                <div class="rating-group">
                  <label>Technical Skills</label>
                  <input 
                    v-model.number="feedbackData.ratings.technical_skills" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Communication</label>
                  <input 
                    v-model.number="feedbackData.ratings.communication" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Problem Solving</label>
                  <input 
                    v-model.number="feedbackData.ratings.problem_solving" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Cultural Fit</label>
                  <input 
                    v-model.number="feedbackData.ratings.cultural_fit" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Experience Relevance</label>
                  <input 
                    v-model.number="feedbackData.ratings.experience_relevance" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
                <div class="rating-group">
                  <label>Overall Assessment</label>
                  <input 
                    v-model.number="feedbackData.ratings.overall" 
                    type="number" 
                    min="1" 
                    max="10" 
                    class="rating-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3>Final Decision</h3>
              <div class="form-group">
                <label>Status *</label>
                <select v-model="feedbackData.status" required class="form-input" @change="onStatusChange">
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div v-if="feedbackData.status === 'on_hold'" class="form-group">
                <label>Hold Reason *</label>
                <textarea 
                  v-model="feedbackData.hold_reason" 
                  required 
                  rows="4" 
                  class="form-textarea"
                  placeholder="Please provide a reason for putting this candidate on hold..."
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" @click="showFeedbackModal = false" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="submittingFeedback" class="btn btn-primary">
                <span v-if="submittingFeedback">Submitting...</span>
                <span v-else>Submit Feedback</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- HR Decision Modal -->
    <div v-if="showHRDecisionModal && selectedCandidateForFeedback" class="modal-overlay" @click="showHRDecisionModal = false">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h2>Final HR Decision</h2>
          <button @click="showHRDecisionModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <!-- Show Interviewer Feedback -->
          <div v-if="selectedCandidateForFeedback.interviewer_feedback" class="interviewer-feedback-section">
            <h3>Interviewer Feedback</h3>
            <div class="feedback-display">
              <div class="feedback-ratings">
                <h4>Ratings (1-10 scale):</h4>
                <div class="ratings-display-grid">
                  <div v-for="(rating, key) in selectedCandidateForFeedback.interviewer_feedback" :key="key" class="rating-display-item">
                    <span class="rating-display-label">{{ key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }}:</span>
                    <span class="rating-display-value">{{ rating }}/10</span>
                  </div>
                </div>
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
            <div class="form-group">
              <label>Final Status *</label>
              <select v-model="hrDecisionData.status" required class="form-input" @change="onHRStatusChange">
                <option value="pending">Pending</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <!-- Show reason field if:
                 1. Status is rejected or on_hold (always required)
                 2. Status is selected AND interviewer didn't select (override case) -->
            <div v-if="hrDecisionData.status === 'rejected' || hrDecisionData.status === 'on_hold' || (hrDecisionData.status === 'selected' && selectedCandidateForFeedback.interviewer_status && selectedCandidateForFeedback.interviewer_status !== 'selected')" class="form-group">
              <label>Reason *</label>
              <textarea 
                v-model="hrDecisionData.reason" 
                required 
                rows="4" 
                class="form-textarea" 
                :placeholder="getReasonPlaceholder()"
              ></textarea>
              <small v-if="hrDecisionData.status === 'selected' && selectedCandidateForFeedback.interviewer_status && selectedCandidateForFeedback.interviewer_status !== 'selected'" class="reason-hint">
                Reason is required when overriding interviewer's decision to select this candidate.
              </small>
            </div>
            <div class="form-actions">
              <button type="button" @click="showHRDecisionModal = false" class="btn btn-secondary">Cancel</button>
              <button type="button" @click="submitHRDecision" class="btn btn-primary">Submit Decision</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- On Hold Details Modal -->
    <div v-if="showHoldModal && holdCandidate" class="modal-overlay" @click="showHoldModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>On Hold - Candidate Details</h2>
          <button @click="showHoldModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>Candidate Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ holdCandidate.candidate_name || holdCandidate.resume?.name || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ holdCandidate.email || holdCandidate.resume?.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Contact:</span>
                <span class="detail-value">{{ holdCandidate.contact_number || holdCandidate.resume?.phone || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div v-if="holdCandidate.interviewer_hold_reason" class="detail-section">
            <h3>Interviewer Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.interviewer_hold_reason }}</p>
          </div>
          <div v-if="holdCandidate.hr_final_reason" class="detail-section">
            <h3>HR Hold Reason</h3>
            <p class="detail-text hold">{{ holdCandidate.hr_final_reason }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Version History Modal -->
    <div v-if="showVersionHistoryModal" class="modal-overlay" @click="closeVersionHistoryModal">
      <div class="modal-content version-history-modal" @click.stop>
        <div class="modal-header">
          <h2>Resume Version History</h2>
          <button @click="closeVersionHistoryModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedCandidateForVersions" class="candidate-info-header">
            <h3>{{ selectedCandidateForVersions.candidate_name || selectedCandidateForVersions.resume?.name || 'Unknown Candidate' }}</h3>
            <p class="candidate-email">{{ selectedCandidateForVersions.email || selectedCandidateForVersions.resume?.email || 'N/A' }}</p>
          </div>
          
          <div v-if="loadingVersionHistory" class="loading">Loading version history...</div>
          <div v-else-if="versionHistory.length === 0" class="empty-state">
            <p>No version history found.</p>
          </div>
          <div v-else class="version-list">
            <div 
              v-for="version in versionHistory" 
              :key="version.resume_id" 
              class="version-item"
              :class="{ 'current-version': version.version === (selectedCandidateForVersions?.versionNumber || 1) }"
            >
              <div class="version-header">
                <div class="version-number-badge">
                  <span class="version-label">Version</span>
                  <span class="version-number">{{ version.version }}</span>
                </div>
                <span class="version-date">{{ formatDateTime(version.uploaded_on) }}</span>
              </div>
              
              <div class="version-details">
                <div class="version-info">
                  <div class="info-row">
                    <span class="info-label">File:</span>
                    <span class="info-value">{{ version.file_name }}</span>
                  </div>
                  <div v-if="version.results" class="version-results">
                    <div class="results-section">
                      <h4>Extracted Results:</h4>
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
                      <div v-if="version.results.total_experience" class="result-item">
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
                      <div v-if="version.results.experience && version.results.experience.length > 0" class="result-item">
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
          <button @click="closeVersionHistoryModal" class="btn btn-primary">Close</button>
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
      jobDescription: null,
      candidates: [],
      loading: false,
      loadingCandidates: false,
      error: null,
      selectedFiles: [],
      isDragOver: false,
      uploading: false,
      uploadResults: [],
      statusFilter: '',
      sortBy: 'match',
      showEditModal: false,
      saving: false,
      editForm: {
        title: '',
        description: '',
        requirements: '',
         interviewers:  []
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
      assignmentData: {
        evaluation_id: null,
        interviewer_id: null,
        slot_id: ''
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
        hold_reason: ''
      },
      submittingFeedback: false,
      showHRDecisionModal: false,
      showHoldModal: false,
      holdCandidate: null,
      hrDecisionData: {
        evaluation_id: null,
        status: '',
        reason: ''
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
           key : 'accepted',
           value :this.candidates.filter(c => c.status === 'accepted').length
      }
    },
       canditatePendingCount() {
      return {
           key : 'pending',
           value :this.candidates.filter(c =>  c?.status === 'pending').length
      }
    },   
     canditateRejectedCount() {
      return {
           key : 'rejected',
           value :this.candidates.filter(c =>  c?.status === 'rejected').length
      }
    },
    //     canditateOnholdCount() {
    //   return {
    //        key : 'on_hold',
    //        value :this.candidates.filter(c => c?.interviewer_status === 'on_hold' ||  c?.status === 'on_hold').length
    //   }
    // },

    //         canditateSelectedCount() {
    //   return {
    //        key : 'selected',
    //        value :this.candidates.filter(c => c?.interviewer_status === 'selected' ||  c?.status === 'selected').length
    //   }
    // },

 
 
  },
  mounted() {
    this.fetchJobDescription();
    this.fetchCandidates();
    if (this.hasWriteAccess) {
      this.fetchInterviewers();
    }
  },
  methods: {
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
      try {
        const response = await axios.get(`${API_BASE_URL}/candidate-links/job/${this.jobDescription.id}`);
        if (response.data.success && response.data.data && response.data.data.url) {
          this.candidateLinkUrl = response.data.data.url;
        }
      } catch (error) {
        // Silently fail - link might not exist yet
        console.log('No existing candidate link found for this job post');
      }
    },
    async generateCandidateLink() {
      if (!this.jobDescription) return;
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
        alert(error.response?.data?.error || 'Failed to generate candidate link.');
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
      console.log('📥 FRONTEND: Download Resume Request');
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
        console.error('❌ Resume ID is missing or undefined');
        console.error('Cannot determine resume ID from:', {
          parameter: resumeId,
          candidate_resume_id: candidate?.resume_id,
          candidate_resume_id_nested: candidate?.resume?.id
        });
        alert('Resume ID is missing. Cannot download resume.');
        return;
      }
      
      console.log('Full URL:', `${API_BASE_URL}/resumes/${resumeId}/download`);
      
      try {
        // console.log('Making axios GET request...');
        // const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
        //   responseType: 'json',
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        //   }
        // });
        debugger;
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
        // 🚨 CRITICAL: Must be 'blob' to handle binary file content
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
        console.error('\n❌ ERROR downloading resume:');
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
      }
    },
    async viewVersionHistory(candidate) {
      this.showVersionHistoryModal = true;
      this.selectedCandidateForVersions = candidate;
      this.versionHistory = [];
      this.loadingVersionHistory = true;
      
      try {
        const resumeId = candidate.resume_id || candidate.resume?.id;
        if (!resumeId) {
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
      }
    },
    closeVersionHistoryModal() {
      this.showVersionHistoryModal = false;
      this.versionHistory = [];
      this.selectedCandidateForVersions = null;
    },
    async viewResumeDetail(candidate) {
      this.showResumeModal = true;
      this.resumeDetailEvaluation = null;
      this.resumeDetail = null;
      this.errorResumeDetail = null;
      await this.fetchResumeDetail(candidate.id);
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
      try {
        if (!this.resumeDetail || !this.resumeDetail.id) {
          alert('Resume file not available for download.');
          return;
        }
        const resumeId = this.resumeDetail.id;
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'blob'
        });
        
        const contentDisposition = response.headers['content-disposition'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        let filename = this.resumeDetail.file_name || `resume-${resumeId}`;
        
        if (contentDisposition) {
          let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
          if (filenameMatch) {
            try {
              filename = decodeURIComponent(filenameMatch[1]);
            } catch (e) {
              filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }
          } else {
            filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
        }
        
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading resume:', error);
        alert('Failed to download resume. Please try again.');
      }
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
        interviewers: this.jobDescription.interviewers || []
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
        requirements: ''
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
    openAssignModal(candidate) {
      this.assignmentData = {
        evaluation_id: candidate.id,
        interviewer_id: candidate.interviewer_id || null,
        slot_id: ''
      };
      this.availableSlots = [];
      if (candidate.interviewer_id) {
        this.fetchAvailableSlots();
      }
      this.showAssignModal = true;
    },
    async fetchAvailableSlots() {
      if (!this.assignmentData.interviewer_id) {
        this.availableSlots = [];
        return;
      }
      try {
        const jobId = this.$route.params.id;
        const response = await axios.get(
          `${API_BASE_URL}/interviews/available-slots`,
          {
            params: {
              job_description_id: jobId,
              interviewer_id: this.assignmentData.interviewer_id
            }
          }
        );
        if (response.data.success) {
          this.availableSlots = response.data.data || [];
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        this.availableSlots = [];
      }
    },
    async assignInterviewer() {
      if (!this.assignmentData.interviewer_id || !this.assignmentData.slot_id) {
        alert('Please fill in all required fields');
        return;
      }
       this.loading = true;
      this.showLoader('Assigning to interviewer...');

      try {
        let response;
        if (this.assignmentData.evaluation_id && this.candidates.find(c => c.id === this.assignmentData.evaluation_id)?.interviewer_id) {
          // Reassign
          response = await axios.put(
            `${API_BASE_URL}/interviews/assign/${this.assignmentData.evaluation_id}`,
            {
              interviewer_id: this.assignmentData.interviewer_id,
              interview_date: null,
              slot_id: this.assignmentData.slot_id
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
              slot_id: this.assignmentData.slot_id
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
      } catch (error) {
        console.error('Error assigning interviewer:', error);
        alert('Failed to assign interviewer. Please try again.');
      } finally {
      
        this.loading = false;
        this.hideLoader();
      
      }
    },
    openFeedbackModal(candidate) {
      this.selectedCandidateForFeedback = candidate;
      if (candidate.interviewer_feedback) {
        this.feedbackData = {
          ratings: { ...candidate.interviewer_feedback },
          status: candidate.interviewer_status || 'pending',
          hold_reason: candidate.interviewer_hold_reason || ''
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
          hold_reason: ''
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
      for (const [key, value] of Object.entries(this.feedbackData.ratings)) {
        if (value === null || value < 1 || value > 10) {
          alert(`Please provide a valid rating (1-10) for ${key.replace('_', ' ')}`);
          return;
        }
      }

      if (this.feedbackData.status === 'on_hold' && !this.feedbackData.hold_reason.trim()) {
        alert('Please provide a reason for putting the candidate on hold');
        return;
      }

      if (this.feedbackData.status === 'pending') {
        alert('Please select a status (Selected, Rejected, or On Hold)');
        return;
      }

      this.submittingFeedback = true;
      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.selectedCandidateForFeedback.id}/interviewer-feedback`,
          {
            ratings: this.feedbackData.ratings,
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
      }
    },
    openHRDecisionModal(candidate) {
      this.hrDecisionData = {
        evaluation_id: candidate.id,
        status: candidate.hr_final_status || 'pending',
        reason: candidate.hr_final_reason || ''
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
         this.selectedCandidateForFeedback.interviewer_status && 
         this.selectedCandidateForFeedback.interviewer_status !== 'selected');

      if (requiresReason && !this.hrDecisionData.reason.trim()) {
        if (this.hrDecisionData.status === 'selected') {
          alert('Please provide a reason for selecting this candidate (overriding interviewer\'s decision).');
        } else {
          alert('Please provide a reason for ' + this.hrDecisionData.status);
        }
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/evaluations/${this.hrDecisionData.evaluation_id}/hr-decision`,
          {
            status: this.hrDecisionData.status,
            reason: this.hrDecisionData.reason
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
      }
    },
    viewHoldDetails(candidate) {
      this.holdCandidate = candidate;
      this.showHoldModal = true;
    },
    onHRStatusChange() {
      // Clear reason if status changes to selected and interviewer also selected
      if (this.hrDecisionData.status === 'selected' && 
          this.selectedCandidateForFeedback.interviewer_status === 'selected') {
        this.hrDecisionData.reason = '';
      }
    },
    getReasonPlaceholder() {
      if (this.hrDecisionData.status === 'selected' && 
          this.selectedCandidateForFeedback.interviewer_status && 
          this.selectedCandidateForFeedback.interviewer_status !== 'selected') {
        return 'Please provide a reason for selecting this candidate (overriding interviewer\'s decision)...';
      } else if (this.hrDecisionData.status === 'rejected') {
        return 'Enter rejection reason...';
      } else if (this.hrDecisionData.status === 'on_hold') {
        return 'Enter hold reason...';
      }
      return 'Enter reason...';
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

<style scoped>

</style>

