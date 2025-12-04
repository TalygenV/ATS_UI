<template>
  <div class="resume-detail-page">
    <div class="page-header">
      <button @click="goBack" class="btn-back">← Back</button>
    </div>

    <div v-if="loading" class="loading">Loading resume details...</div>
    <div v-else-if="error && !evaluation" class="error-message">{{ error }}</div>
    <div v-else-if="evaluation" class="content">
      <!-- Header Section -->
      <div class="header-card">
        <div class="header-content">
          <h1>{{ evaluation.candidate_name || 'Unknown Candidate' }}</h1>
          <p class="candidate-contact">
            <span v-if="evaluation.email">📧 {{ evaluation.email }}</span>
            <span v-if="evaluation.contact_number"> | 📞 {{ evaluation.contact_number }}</span>
          </p>
          <div class="header-actions">
            <button @click="downloadResume" class="btn btn-primary">⬇️ Download Resume</button>
            <select v-if="hasWriteAccess" v-model="evaluation.status" @change="updateStatus" class="status-select">
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <span v-else class="status-display">{{ evaluation.status }}</span>
          </div>
        </div>
        <div class="match-score-large">
          <div class="score-value-large">{{ formatScore(evaluation.overall_match) }}%</div>
          <div class="score-label-large">Overall Match</div>
        </div>
      </div>

      <!-- Match Scores Section -->
      <div class="scores-card">
        <h2>Match Scores</h2>
        <div class="scores-grid">
          <div class="score-card">
            <div class="score-value">{{ formatScore(evaluation.skills_match) }}%</div>
            <div class="score-label">Skills Match</div>
          </div>
          <div class="score-card">
            <div class="score-value">{{ formatScore(evaluation.experience_match) }}%</div>
            <div class="score-label">Experience Match</div>
          </div>
          <div class="score-card">
            <div class="score-value">{{ formatScore(evaluation.education_match) }}%</div>
            <div class="score-label">Education Match</div>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis Section -->
      <div class="analysis-card">
        <h2>Detailed Analysis</h2>
        
        <div class="analysis-section">
          <h3>Skills Analysis</h3>
          <div class="analysis-content">
            <p>{{ evaluation.skills_details || 'No analysis available' }}</p>
          </div>
        </div>

        <div class="analysis-section">
          <h3>Experience Analysis</h3>
          <div class="analysis-content">
            <p>{{ evaluation.experience_details || 'No analysis available' }}</p>
          </div>
        </div>

        <div class="analysis-section">
          <h3>Education Analysis</h3>
          <div class="analysis-content">
            <p>{{ evaluation.education_details || 'No analysis available' }}</p>
          </div>
        </div>

        <div v-if="evaluation.rejection_reason" class="analysis-section rejection">
          <h3>Rejection Reason</h3>
          <div class="analysis-content">
            <p>{{ evaluation.rejection_reason }}</p>
          </div>
        </div>
      </div>

      <!-- Resume Information Section -->
      <div class="resume-info-card">
        <h2>Resume Information</h2>
        
        <div v-if="error && evaluation" class="error-notice">
          <p>⚠️ {{ error }}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Name:</span>
            <span class="info-value">{{ (resume && resume.name) || evaluation.candidate_name || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ (resume && resume.email) || evaluation.email || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">{{ (resume && resume.phone) || evaluation.contact_number || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Location:</span>
            <span class="info-value">{{ (resume && resume.location) || 'N/A' }}</span>
          </div>
          <div v-if="resume && resume.total_experience !== null && resume.total_experience !== undefined" class="info-item">
            <span class="info-label">Total Experience:</span>
            <span class="info-value">{{ formatExperience(resume.total_experience) }}</span>
          </div>
        </div>

        <div v-if="resume && resume.summary" class="info-section">
          <h3>Summary</h3>
          <p class="summary-text">{{ resume.summary }}</p>
        </div>

        <div v-if="resume && resume.skills && resume.skills.length > 0" class="info-section">
          <h3>Skills</h3>
          <div class="tags">
            <span v-for="(skill, index) in resume.skills" :key="index" class="tag">
              {{ skill }}
            </span>
          </div>
        </div>

        <div v-if="resume && resume.experience && resume.experience.length > 0" class="info-section">
          <h3>Work Experience</h3>
          <div class="experience-list">
            <div v-for="(exp, index) in resume.experience" :key="index" class="experience-item">
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

        <div v-if="resume && resume.education && resume.education.length > 0" class="info-section">
          <h3>Education</h3>
          <div class="education-list">
            <div v-for="(edu, index) in resume.education" :key="index" class="education-item">
              <h4>{{ edu.degree }}</h4>
              <p v-if="edu.field">Field: {{ edu.field }}</p>
              <p v-if="edu.institution">Institution: {{ edu.institution }}</p>
              <p v-if="edu.year">Year: {{ edu.year }}</p>
            </div>
          </div>
        </div>

        <div v-if="resume && resume.certifications && resume.certifications.length > 0" class="info-section">
          <h3>Certifications</h3>
          <ul class="certifications-list">
            <li v-for="(cert, index) in resume.certifications" :key="index">{{ cert }}</li>
          </ul>
        </div>

        <div class="info-section">
          <h3>Raw Resume Text</h3>
          <div class="raw-text-container">
            <pre class="raw-text">{{ evaluation.resume_text || (resume && resume.raw_text) || 'No text available' }}</pre>
          </div>
        </div>
      </div>

      <!-- Job Description Section -->
      <div class="job-description-card">
        <h2>Job Description</h2>
        <div class="job-description-content">
          <pre class="job-description-text">{{ evaluation.job_description || 'No job description available' }}</pre>
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

export default {
  name: 'ResumeDetailPage',
  setup() {
    const { hasWriteAccess } = useAuth();
    const { showLoader, hideLoader } = useLoader();
    return { hasWriteAccess, showLoader, hideLoader };
  },
  data() {
    return {
      evaluation: null,
      resume: null,
      loading: false,
      error: null
    };
  },
  mounted() {
    console.log('🚀 ResumeDetailPage mounted, fetching resume detail...');
    this.fetchResumeDetail();
  },
  watch: {
    loading(newVal) {
      console.log('🔄 Loading state changed to:', newVal);
    },
    evaluation(newVal) {
      console.log('🔄 Evaluation changed:', newVal ? `ID: ${newVal.id}` : 'null');
    },
    resume(newVal) {
      console.log('🔄 Resume changed:', newVal ? `ID: ${newVal.id}` : 'null');
    }
  },
  methods: {
    async fetchResumeDetail() {
      this.loading = true;
      this.error = null;
      this.showLoader('Loading Resume Details', 'Fetching candidate information...');
      try {
        const evaluationId = this.$route.params.evaluationId;
        console.log('📋 Fetching resume detail for evaluation ID:', evaluationId);
        console.log('📍 Route params:', this.$route.params);
        //debugger;
        if (!evaluationId) {
          this.error = 'Evaluation ID is missing from the URL.';
          this.loading = false;
          this.hideLoader();
          return;
        }
        
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          this.error = 'Not authenticated. Please login again.';
          this.$router.push('/login');
          this.loading = false;
          return;
        }
        
        console.log('🔑 Making API request to:', `${API_BASE_URL}/evaluations/${evaluationId}`);
        const response = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('✅ API Response Status:', response.status);
        console.log('✅ API Response Data:', response.data);
        console.log('✅ Response Headers:', response.headers);
        
        // Handle 304 Not Modified - browser might use cached data
        if (response.status === 200) {
          console.log('⚠️ Received 304 Not Modified - checking if data is available');
          // For 304, axios should still have the data from cache
          if (!response.data || !response.data.success) {
            // Force a fresh request without cache
            console.log('🔄 Forcing fresh request due to 304 without data');
            const freshResponse = await axios.get(`${API_BASE_URL}/evaluations/${evaluationId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              params: {
                _t: Date.now() // Cache buster
              }
            });
            this.processEvaluationData(freshResponse.data);
            return;
          }
        }
        
        if (response.data && response.data.success) {
          console.log('✅ Processing evaluation data...');
          this.processEvaluationData(response.data);
          console.log('✅ Evaluation data processed successfully');
        } else if (response.data && response.data.error) {
          this.error = response.data.error || 'Failed to fetch resume details. Please try again.';
        } else {
          this.error = 'Invalid response from server. Please try again.';
          console.error('Invalid response structure:', response.data);
        }
      } catch (error) {
        console.error('❌ Error fetching resume detail:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        
        if (error.response?.status === 401) {
          this.error = 'Session expired. Please login again.';
          this.$router.push('/login');
        } else if (error.response?.status === 404) {
          this.error = `Evaluation with ID ${this.$route.params.evaluationId} not found. Please check the URL and try again.`;
        } else {
          this.error = error.response?.data?.error || error.message || 'Failed to fetch resume details. Please try again.';
        }
      } finally {
        this.loading = false;
        this.hideLoader();
      }
    },
    processEvaluationData(responseData) {
      console.log('🔧 processEvaluationData called with:', responseData);
      
      if (!responseData || !responseData.success) {
        console.error('❌ Invalid response data:', responseData);
        this.error = responseData?.error || 'Failed to fetch resume details. Please try again.';
        return;
      }
      
      try {
        this.evaluation = responseData.data;
        // Backend returns 'resume' (singular), not 'resumes'
        this.resume = responseData.data?.resume;
        
        console.log('📄 Evaluation data set:', {
          evaluation_id: this.evaluation?.id,
          candidate_name: this.evaluation?.candidate_name,
          has_resume: !!this.resume,
          resume_id: this.resume?.id,
          evaluation_object: this.evaluation,
          resume_object: this.resume
        });
        
        if (!this.resume) {
          console.warn('⚠️ No resume data found in evaluation', responseData.data);
          this.error = 'Resume data not found for this evaluation. The evaluation may not be linked to a resume.';
          // Still show evaluation data even if resume is missing
          this.resume = {
            id: null,
            name: this.evaluation?.candidate_name || 'N/A',
            email: this.evaluation?.email || 'N/A',
            phone: this.evaluation?.contact_number || 'N/A',
            location: null,
            skills: [],
            experience: [],
            education: [],
            certifications: []
          };
        }
        
        console.log('✅ Data processing complete');
        console.log('✅ Final state - loading:', this.loading, 'evaluation:', !!this.evaluation, 'resume:', !!this.resume);
      } catch (error) {
        console.error('❌ Error in processEvaluationData:', error);
        this.error = 'Error processing evaluation data. Please try again.';
        throw error; // Re-throw to be caught by the outer catch block
      }
    },
    async updateStatus() {
      this.showLoader('Updating Status', 'Saving candidate status...');
      try {
        const response = await axios.patch(
          `${API_BASE_URL}/evaluations/${this.$route.params.evaluationId}/status`,
          { status: this.evaluation.status }
        );
        if (response.data.success) {
          this.evaluation = response.data.data;
        }
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      } finally {
        this.hideLoader();
      }
    },
    async downloadResume() {
      this.showLoader('Downloading Resume', 'Preparing file download...');
      try {
        if (!this.resume || !this.resume.id) {
          alert('Resume file not available for download.');
          this.hideLoader();
          return;
        }
        const resumeId = this.resume.id;
        const response = await axios.get(`${API_BASE_URL}/resumes/${resumeId}/download`, {
          responseType: 'blob'
        });
        
        // Get filename and content type from headers
        const contentDisposition = response.headers['content-disposition'];
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        let filename = this.resume.file_name || `resume-${resumeId}`;
        
        if (contentDisposition) {
          // Try to extract filename from Content-Disposition header
          // Handle both filename="..." and filename*=UTF-8''encoded format
          let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
          if (filenameMatch) {
            // Decode URI-encoded filename
            try {
              filename = decodeURIComponent(filenameMatch[1]);
            } catch (e) {
              // If decoding fails, try regular filename
              filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }
          } else {
            // Try regular filename format
            filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            if (filenameMatch) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
        }
        
        // Create blob with the correct MIME type
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
      } finally {
        this.hideLoader();
      }
    },
    goBack() {
      const jobId = this.$route.params.jobId || this.$route.params.id;
      if (jobId) {
        this.$router.push({ name: 'JobDetail', params: { id: jobId } });
      } else {
        this.$router.push('/job-descriptions');
      }
    },
    formatScore(score) {
      if (score === null || score === undefined) return '0';
      return Math.round(parseFloat(score));
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
    formatDateRange(startDate, endDate) {
      const start = new Date(startDate);
      const end = endDate === 'Present' ? new Date() : new Date(endDate);
      return `${start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endDate === 'Present' ? 'Present' : end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  }
};
</script>

<style scoped>
.resume-detail-page {
  padding: 2rem 0;
}

.btn-back {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  transition: color 0.3s;
}

.btn-back:hover {
  color: #1565c0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header-card {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  border-radius: 24px;
  padding: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  box-shadow: 0 8px 30px rgba(66, 153, 225, 0.3);
}

.header-content {
  flex: 1;
}

.header-content h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.candidate-contact {
  margin: 0 0 1.5rem 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.match-score-large {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.score-value-large {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.score-label-large {
  font-size: 1.1rem;
  opacity: 0.9;
}

.scores-card,
.analysis-card,
.resume-info-card,
.job-description-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05) inset;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.scores-card h2,
.analysis-card h2,
.resume-info-card h2,
.job-description-card h2 {
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.score-card {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 20px rgba(66, 153, 225, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.score-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(66, 153, 225, 0.4);
}

.score-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.score-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.analysis-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.analysis-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.analysis-section.rejection {
  background: #ffebee;
  padding: 1.5rem;
  border-radius: 8px;
  border: none;
}

.analysis-section h3 {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.analysis-content {
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.info-value {
  color: #333;
}

.info-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

.info-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.info-section h3 {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 1.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.summary-text {
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: linear-gradient(135deg, #e6edff 0%, #d6e2ff 100%);
  color: #4299e1;
  padding: 0.5rem 1.25rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.experience-list,
.education-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.experience-item,
.education-item {
  padding: 1.75rem;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.experience-item:hover,
.education-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.experience-item h4,
.education-item h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.company {
  color: #666;
  margin: 0.25rem 0;
  font-weight: 500;
}

.duration,
.dates {
  color: #999;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.description {
  color: #555;
  margin-top: 0.75rem;
  line-height: 1.6;
}

.certifications-list {
  list-style: none;
  padding: 0;
}

.certifications-list li {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  color: #555;
}

.certifications-list li:last-child {
  border-bottom: none;
}

.raw-text-container {
  max-height: 400px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
}

.raw-text {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.job-description-content {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
}

.job-description-text {
  margin: 0;
  color: #555;
  line-height: 1.8;
  white-space: pre-wrap;
  font-family: inherit;
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

.btn-primary {
  background: white;
  color: #1976d2;
}

.btn-primary:hover {
  background: #f5f5f5;
}

.status-select {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.status-select option {
  background: white;
  color: #333;
}

.status-display {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-transform: capitalize;
}

.loading, .error-message {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-message {
  color: #f44336;
}

.error-notice {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  color: #e65100;
}

.error-notice p {
  margin: 0;
  font-weight: 500;
}
</style>

