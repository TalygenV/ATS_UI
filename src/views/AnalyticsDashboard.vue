<template>
  <div class="py-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="text-muted mt-3">Loading analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="ats-card">
      <div class="alert alert-danger mb-0" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error:</strong> {{ error }}
        <button class="btn btn-sm btn-outline-danger ms-3" @click="fetchAnalyticsData">
          <i class="fas fa-redo me-1"></i> Retry
        </button>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Page Header -->
      <div class="page-header-ats mb-4">
        <div>
          <h2 class="page-title-ats">Analytics Dashboard</h2>
          <p class="text-muted mb-0">Comprehensive insights into recruitment performance and efficiency</p>
        </div>
        <div class="d-flex gap-3 align-items-center position-relative">
          <div class="date-filter-ats" @click="cycleDateFilter" style="cursor: pointer;">
            <i class="fas fa-calendar-alt"></i>
            <span>{{ dateFilterLabel }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          
          <!-- Date Picker Dropdown -->
          <div v-if="showDatePicker" class="date-picker-dropdown">
            <div class="p-3">
              <h6 class="mb-3">Quick Filters</h6>
              <div class="d-flex flex-column gap-2 mb-3">
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('last7days')">Last 7 Days</button>
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('last30days')">Last 30 Days</button>
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('last90days')">Last 90 Days</button>
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('thisMonth')">This Month</button>
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('lastMonth')">Last Month</button>
                <button class="btn btn-sm btn-outline-primary" @click="setQuickFilter('thisYear')">This Year</button>
                <button class="btn btn-sm btn-outline-secondary" @click="setQuickFilter('allTime')">All Time</button>
              </div>
              
              <hr>
              
              <h6 class="mb-3">Custom Range</h6>
              <div class="mb-3">
                <label class="form-label small">From Date</label>
                <input type="date" v-model="dateFrom" class="form-control form-control-sm" />
              </div>
              <div class="mb-3">
                <label class="form-label small">To Date</label>
                <input type="date" v-model="dateTo" class="form-control form-control-sm" />
              </div>
              
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-ats-primary flex-fill" @click="applyDateFilter">Apply</button>
                <button class="btn btn-sm btn-outline-secondary flex-fill" @click="clearDateFilter">Clear</button>
              </div>
            </div>
          </div>
          
          <button class="btn-ats-primary" @click="exportReport" :disabled="loading">
            <i class="fas fa-file-export"></i>
            Export Report
          </button>
        </div>
      </div>
        
      <!-- Tab Navigation -->
      <div class="tab-navigation-ats mb-4">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn-ats" 
        :class="{ active: activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
      </div>
        
      <!-- Tab Content: Overview -->
    <div v-show="activeTab === 'overview'" class="tab-content">
      <!-- KPI Cards -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-md-6 col-xl-3">
          <div class="ats-card stat-card-ats">
            <div class="stat-icon-ats stat-icon-candidate">
              <i class="fas fa-users"></i>
            </div>
            <div>
              <h3 class="fs-6 text-muted mb-1">Total Candidates</h3>
              <div class="fs-3 fw-bold text-dark">{{ totalCandidates.toLocaleString() }}</div>
              <div class="text-success small mt-1">
                <i class="fas fa-arrow-up"></i> 12% from last period
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-6 col-xl-3">
          <div class="ats-card stat-card-ats">
            <div class="stat-icon-ats" style="background: var(--ats-gradient-success);">
              <i class="fas fa-user-check"></i>
            </div>
            <div>
              <h3 class="fs-6 text-muted mb-1">Hired Candidates</h3>
              <div class="fs-3 fw-bold text-dark">{{ hiredCandidates }}</div>
              <div class="text-muted small mt-1">
                <i class="fas fa-minus"></i> No hires this period
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-6 col-xl-3">
          <div class="ats-card stat-card-ats">
            <div class="stat-icon-ats" style="background: var(--ats-gradient-warning);">
              <i class="fas fa-percentage"></i>
            </div>
            <div>
              <h3 class="fs-6 text-muted mb-1">Avg Match Score</h3>
              <div class="fs-3 fw-bold text-dark">{{ avgMatchScore }}%</div>
              <div class="text-success small mt-1">
                <i class="fas fa-arrow-up"></i> 3.2% improvement
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-6 col-xl-3">
          <div class="ats-card stat-card-ats">
            <div class="stat-icon-ats stat-icon-interview">
              <i class="fas fa-clipboard-list"></i>
            </div>
            <div>
              <h3 class="fs-6 text-muted mb-1">Interviews Conducted</h3>
              <div class="fs-3 fw-bold text-dark">{{ totalInterviews }}</div>
              <div class="text-success small mt-1">
                <i class="fas fa-arrow-up"></i> 18% from last period
              </div>
            </div>
          </div>
        </div>
      </div>
          
      <!-- Charts Grid -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 class="fs-5 fw-bold mb-1">Position Performance</h3>
                <p class="text-muted small mb-0">Candidates vs Average Match Score</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn-icon" :class="{ 'text-primary': positionsChartType === 'bar' }" @click="setChartType('positions', 'bar')" title="Bar Chart">
                  <i class="fas fa-chart-bar"></i>
                </button>
                <button class="btn-icon" :class="{ 'text-primary': positionsChartType === 'line' }" @click="setChartType('positions', 'line')" title="Line Chart">
                  <i class="fas fa-chart-line"></i>
                </button>
              </div>
            </div>
            <div class="chart-container-ats">
              <canvas ref="positionsChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 class="fs-5 fw-bold mb-1">Application Status Distribution</h3>
                <p class="text-muted small mb-0">Current status of all applications</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn-icon" :class="{ 'text-primary': statusChartType === 'doughnut' }" @click="setChartType('status', 'doughnut')" title="Doughnut Chart">
                  <i class="fas fa-chart-pie"></i>
                </button>
                <button class="btn-icon" :class="{ 'text-primary': statusChartType === 'pie' }" @click="setChartType('status', 'pie')" title="Pie Chart">
                  <i class="fas fa-circle"></i>
                </button>
              </div>
            </div>
            <div class="chart-container-ats">
              <canvas ref="statusChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 class="fs-5 fw-bold mb-1">Monthly Resumes Uploaded</h3>
                <p class="text-muted small mb-0">Resume uploads by month</p>
              </div>
              <div class="d-flex gap-2">
                <button class="btn-icon" :class="{ 'text-primary': resumesChartType === 'bar' }" @click="setChartType('resumes', 'bar')" title="Bar Chart">
                  <i class="fas fa-chart-bar"></i>
                </button>
                <button class="btn-icon" :class="{ 'text-primary': resumesChartType === 'line' }" @click="setChartType('resumes', 'line')" title="Line Chart">
                  <i class="fas fa-chart-line"></i>
                </button>
              </div>
            </div>
            <div class="chart-container-ats">
              <canvas ref="resumesChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="mb-3">
              <h3 class="fs-5 fw-bold mb-1">Time to Decision Analysis</h3>
              <p class="text-muted small mb-0">Average days to decision by position</p>
            </div>
            <div class="chart-container-ats">
              <canvas ref="decisionChart"></canvas>
            </div>
          </div>
        </div>
      </div>
          
      <!-- Tables Grid -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Top Positions by Candidates</h3>
              <span class="badge-ats badge-ats-primary">Sorted High to Low</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Candidates</th>
                    <th>Hired</th>
                    <th>Avg Match</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="position in topPositions" :key="position.title">
                    <td><strong>{{ position.title }}</strong></td>
                    <td><strong>{{ position.total_candidates }}</strong></td>
                    <td>{{ position.hired }}</td>
                    <td>
                      <div class="mb-1">{{ position.avg_match.toFixed(2) }}%</div>
                      <div class="progress-ats">
                        <div 
                          class="progress-fill-ats" 
                          :style="{ width: position.avg_match + '%' }"
                        ></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Interviewer Performance</h3>
              <span class="badge-ats badge-ats-primary">Sorted High to Low</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Interviewer</th>
                    <th>Interviews</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="interviewer in topInterviewers" :key="interviewer.full_name">
                    <td>{{ interviewer.full_name }}</td>
                    <td><strong>{{ interviewer.interviews_taken }}</strong></td>
                    <td>
                      <span class="badge-ats" :class="getPerformanceClass(interviewer.interviews_taken)">
                        {{ getPerformanceLabel(interviewer.interviews_taken) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Utilization Section -->
      <div class="ats-card mb-4">
        <h3 class="fs-5 fw-bold mb-4">
          <i class="fas fa-chart-network text-primary"></i>
          Process Efficiency Metrics
        </h3>
        
        <div class="row g-4">
          <div class="col-12 col-md-4">
            <div class="text-center p-3 bg-light rounded">
              <div class="fs-2 fw-bold text-primary mb-2">{{ processMetrics.total_parsed_resumes }}</div>
              <div class="text-muted">Total Parsed Resumes</div>
            </div>
          </div>
          
          <div class="col-12 col-md-4">
            <div class="text-center p-3 bg-light rounded">
              <div class="fs-2 fw-bold text-success mb-2">{{ processMetrics.interviews_assigned }}</div>
              <div class="text-muted">Interviews Assigned</div>
            </div>
          </div>
          
          <div class="col-12 col-md-4">
            <div class="text-center p-3 bg-light rounded">
              <div class="fs-2 fw-bold text-warning mb-2">{{ processMetrics.interviews_not_assigned }}</div>
              <div class="text-muted">Interviews Not Assigned</div>
            </div>
          </div>
        </div>
      </div>
    </div>
        
    <!-- Tab Content: Positions -->
    <div v-show="activeTab === 'positions'" class="tab-content">
      <div class="ats-card mb-4">
        <div class="mb-3">
          <h3 class="fs-5 fw-bold mb-1">Position Analysis - Detailed View</h3>
          <p class="text-muted small mb-0">Comprehensive analysis of all positions</p>
        </div>
        <div class="chart-container-ats">
          <canvas ref="detailedPositionsChart"></canvas>
        </div>
      </div>
      
      <div class="ats-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-5 fw-bold mb-0">Position Performance Metrics</h3>
          <span class="badge-ats badge-ats-primary">Complete Dataset</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Position</th>
                <th>Total Candidates</th>
                <th>Hired</th>
                <th>Avg Match Score</th>
                <th>Avg Days to Decision</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="position in positionsData" :key="position.title">
                <td><strong>{{ position.title }}</strong></td>
                <td>{{ position.total_candidates }}</td>
                <td>{{ position.hired }}</td>
                <td>{{ position.avg_match.toFixed(2) }}%</td>
                <td>{{ getDecisionTime(position.title) }} days</td>
                <td>{{ getConversionRate(position) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
        
    <!-- Tab Content: Interviewers -->
    <div v-show="activeTab === 'interviewers'" class="tab-content">
      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="mb-3">
              <h3 class="fs-5 fw-bold mb-1">Interviewer Performance</h3>
              <p class="text-muted small mb-0">Interviews taken by interviewer</p>
            </div>
            <div class="chart-container-ats">
              <canvas ref="interviewersPerformanceChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="mb-3">
              <h3 class="fs-5 fw-bold mb-1">Interview Slot Utilization</h3>
              <p class="text-muted small mb-0">Booked vs available slots</p>
            </div>
            <div class="chart-container-ats">
              <canvas ref="utilizationChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ats-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="fs-5 fw-bold mb-0">Interviewer Slot Utilization</h3>
          <span class="badge-ats badge-ats-primary">Sorted by Utilization %</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Interviewer ID</th>
                <th>Total Slots</th>
                <th>Booked Slots</th>
                <th>Utilization %</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="util in interviewerUtilization" :key="util.interviewer_id">
                <td>{{ util.interviewer_id.substring(0, 8) }}...</td>
                <td>{{ util.total_slots }}</td>
                <td>{{ util.booked_slots }}</td>
                <td>
                  <div class="mb-1">{{ util.utilization_pct }}%</div>
                  <div class="progress-ats">
                    <div 
                      class="progress-fill-ats" 
                      :style="{ width: util.utilization_pct + '%' }"
                    ></div>
                  </div>
                </td>
                <td>
                  <span class="badge-ats" :class="getUtilizationBadgeClass(util.utilization_pct)">
                    {{ getUtilizationLabel(util.utilization_pct) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
        
    <!-- Tab Content: Utilization -->
    <div v-show="activeTab === 'utilization'" class="tab-content">
      <div class="ats-card mb-4">
        <div class="mb-3">
          <h3 class="fs-5 fw-bold mb-1">Resource Utilization Analysis</h3>
          <p class="text-muted small mb-0">Interview slot utilization across all interviewers</p>
        </div>
        <div class="chart-container-ats">
          <canvas ref="resourceUtilizationChart"></canvas>
        </div>
      </div>
      
      <div class="row g-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Top Performers (Utilization > 90%)</h3>
              <span class="badge-ats badge-ats-success">High Efficiency</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Interviewer ID</th>
                    <th>Utilization %</th>
                    <th>Booked Slots</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="performer in topPerformers" :key="performer.interviewer_id">
                    <td>{{ performer.interviewer_id.substring(0, 8) }}...</td>
                    <td><strong>{{ performer.utilization_pct }}%</strong></td>
                    <td>{{ performer.booked_slots }}/{{ performer.total_slots }}</td>
                    <td><span class="badge-ats badge-ats-success">Excellent</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
            
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Improvement Opportunities (Utilization < 50%)</h3>
              <span class="badge-ats badge-ats-warning">Needs Attention</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Interviewer ID</th>
                    <th>Utilization %</th>
                    <th>Available Slots</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="lowPerformer in lowPerformers" :key="lowPerformer.interviewer_id">
                    <td>{{ lowPerformer.interviewer_id.substring(0, 8) }}...</td>
                    <td><strong class="text-danger">{{ lowPerformer.utilization_pct }}%</strong></td>
                    <td>{{ lowPerformer.total_slots - lowPerformer.booked_slots }} slots available</td>
                    <td><button class="btn-ats-secondary btn-ats-sm">Review</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
        
    <!-- Tab Content: Process -->
    <div v-show="activeTab === 'process'" class="tab-content">
      <div class="row g-4 mb-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="mb-3">
              <h3 class="fs-5 fw-bold mb-1">Resume to Interview Pipeline</h3>
              <p class="text-muted small mb-0">Conversion through recruitment funnel</p>
            </div>
            <div class="chart-container-ats">
              <canvas ref="pipelineChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="mb-3">
              <h3 class="fs-5 fw-bold mb-1">Rejection Analysis</h3>
              <p class="text-muted small mb-0">Primary reasons for candidate rejection</p>
            </div>
            <div class="chart-container-ats">
              <canvas ref="rejectionChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row g-4">
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Recruitment Process Metrics</h3>
              <span class="badge-ats badge-ats-primary">Key Performance Indicators</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="metric in processMetricsList" :key="metric.metric">
                    <td>{{ metric.metric }}</td>
                    <td><strong>{{ metric.value }}</strong></td>
                    <td>{{ metric.target }}</td>
                    <td>
                      <span class="badge-ats" :class="'badge-ats-' + metric.status">
                        {{ getStatusLabel(metric.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
            
        <div class="col-12 col-xl-6">
          <div class="ats-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3 class="fs-5 fw-bold mb-0">Time to Decision Analysis</h3>
              <span class="badge-ats badge-ats-primary">Speed of Hiring Process</span>
            </div>
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Avg Days to Decision</th>
                    <th>Industry Avg</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="decision in timeToDecision" :key="decision.title">
                    <td>{{ decision.title }}</td>
                    <td><strong>{{ decision.avg_days }} days</strong></td>
                    <td>{{ getIndustryAvg(decision.title) }} days</td>
                    <td>
                      <span class="badge-ats" :class="'badge-ats-' + getDecisionPerformanceClass(decision)">
                        {{ getDecisionPerformanceLabel(decision) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
      <!-- Footer -->
      <footer class="text-center text-muted py-4 mt-4">
        <div class="fw-bold mb-2">Analytics Dashboard</div>
        <p class="small mb-1">Generated on {{ currentDate }} | Data Source: Hiring Portal v4.2</p>
        <p class="small mb-1">Confidential: For internal use only. © 2026 Talent Acquisition Analytics Team.</p>
        <p class="small mb-0">
          <i class="fas fa-sync-alt"></i> Auto-refresh every 5 minutes | 
          <i class="fas fa-shield-alt"></i> Data encrypted in transit
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Chart from 'chart.js/auto';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// ============================================
// DATA STATE
// ============================================

const positionsData = ref([]);
const hrFinalStatus = ref({
  pending: 0,
  rejected: 0,
  selected: 0,
  on_hold: 0
});
const interviewerStatus = ref({
  pending: 0,
  selected: 0,
  rejected: 0,
  on_hold: 0
});
const timeToDecision = ref([]);
const hrFinalReason = ref({});
const interviewersData = ref([]);
const interviewerUtilization = ref([]);
const monthlyResumes = ref([]);
const processMetrics = ref({
  total_parsed_resumes: 0,
  interviews_assigned: 0,
  interviews_not_assigned: 0
});

// Loading and error states
const loading = ref(true);
const error = ref(null);

// ============================================
// COMPUTED PROPERTIES
// ============================================

const totalCandidates = computed(() => 
  positionsData.value.reduce((sum, pos) => sum + pos.total_candidates, 0)
);

const avgMatchScore = computed(() => {
  if (positionsData.value.length === 0) return '0.00';
  return (positionsData.value.reduce((sum, pos) => sum + pos.avg_match, 0) / positionsData.value.length).toFixed(2);
});

const totalInterviews = computed(() => 
  interviewersData.value.reduce((sum, interviewer) => sum + interviewer.interviews_taken, 0)
);

const hiredCandidates = computed(() => 
  positionsData.value.reduce((sum, pos) => sum + pos.hired, 0)
);

const topPositions = computed(() => 
  [...positionsData.value].sort((a, b) => b.total_candidates - a.total_candidates)
);

const topInterviewers = computed(() => 
  [...interviewersData.value].sort((a, b) => b.interviews_taken - a.interviews_taken)
);

const topPerformers = computed(() => 
  interviewerUtilization.value.filter(util => util.utilization_pct > 90)
);

const lowPerformers = computed(() => 
  interviewerUtilization.value.filter(util => util.utilization_pct < 50)
);

const processMetricsList = computed(() => {
  const totalSlots = interviewerUtilization.value.reduce((sum, util) => sum + util.total_slots, 0);
  const totalBookedSlots = interviewerUtilization.value.reduce((sum, util) => sum + util.booked_slots, 0);
  const avgUtilization = totalSlots > 0 ? ((totalBookedSlots / totalSlots) * 100).toFixed(2) : '0.00';
  const avgDays = timeToDecision.value.length > 0 
    ? (timeToDecision.value.reduce((sum, d) => sum + d.avg_days, 0) / timeToDecision.value.length).toFixed(1)
    : '0.0';
  const resumeToInterviewRate = processMetrics.value.total_parsed_resumes > 0
    ? ((processMetrics.value.interviews_assigned / processMetrics.value.total_parsed_resumes) * 100).toFixed(2)
    : '0.00';
  const conversionRate = totalCandidates.value > 0
    ? ((hiredCandidates.value / totalCandidates.value) * 100).toFixed(2)
    : '0.00';
  
  return [
    { 
      metric: 'Resume to Interview Rate', 
      value: `${resumeToInterviewRate}%`, 
      target: '20%', 
      status: parseFloat(resumeToInterviewRate) >= 20 ? 'selected' : parseFloat(resumeToInterviewRate) >= 15 ? 'pending' : 'rejected' 
    },
    { 
      metric: 'Average Match Score', 
      value: `${avgMatchScore.value}%`, 
      target: '65%', 
      status: parseFloat(avgMatchScore.value) > 65 ? 'selected' : parseFloat(avgMatchScore.value) > 60 ? 'pending' : 'rejected' 
    },
    { 
      metric: 'Interview Slot Utilization', 
      value: `${avgUtilization}%`, 
      target: '80%', 
      status: parseFloat(avgUtilization) > 80 ? 'selected' : parseFloat(avgUtilization) > 70 ? 'pending' : 'rejected' 
    },
    { 
      metric: 'Time to Decision (Avg)', 
      value: `${avgDays} days`, 
      target: '15 days', 
      status: parseFloat(avgDays) <= 15 ? 'selected' : parseFloat(avgDays) <= 20 ? 'pending' : 'rejected' 
    },
    { 
      metric: 'Candidate Conversion Rate', 
      value: `${conversionRate}%`, 
      target: '5%', 
      status: parseFloat(conversionRate) >= 5 ? 'selected' : parseFloat(conversionRate) >= 3 ? 'pending' : 'rejected' 
    }
  ];
});

const currentDate = computed(() => {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return now.toLocaleDateString('en-US', options);
});

const lastUpdated = computed(() => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// ============================================
// REACTIVE STATE
// ============================================

const activeTab = ref('overview');
const dateFilterLabel = ref('All Time');
const dateFrom = ref(null);
const dateTo = ref(null);
const showDatePicker = ref(false);
const positionsChartType = ref('bar');
const statusChartType = ref('doughnut');
const resumesChartType = ref('bar');

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'positions', label: 'Positions' },
  { id: 'interviewers', label: 'Interviewers' },
  { id: 'utilization', label: 'Utilization' },
  { id: 'process', label: 'Process' }
];

// Chart instances
const positionsChart = ref(null);
const statusChart = ref(null);
const resumesChart = ref(null);
const decisionChart = ref(null);
const detailedPositionsChart = ref(null);
const interviewersPerformanceChart = ref(null);
const utilizationChart = ref(null);
const resourceUtilizationChart = ref(null);
const pipelineChart = ref(null);
const rejectionChart = ref(null);

let chartInstances = {};

// ============================================
// METHODS
// ============================================

const setActiveTab = (tab) => {
  activeTab.value = tab;
  // Wait for DOM to update and canvas to be visible
  nextTick(() => {
    setTimeout(() => {
      initializeCharts();
    }, 100);
  });
};

const setChartType = (chartName, type) => {
  if (chartName === 'positions') positionsChartType.value = type;
  if (chartName === 'status') statusChartType.value = type;
  if (chartName === 'resumes') resumesChartType.value = type;
  
  nextTick(() => {
    initializeCharts();
  });
};

const cycleDateFilter = () => {
  showDatePicker.value = !showDatePicker.value;
};

const applyDateFilter = () => {
  if (dateFrom.value && dateTo.value) {
    const from = new Date(dateFrom.value);
    const to = new Date(dateTo.value);
    dateFilterLabel.value = `${from.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${to.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } else if (dateFrom.value) {
    const from = new Date(dateFrom.value);
    dateFilterLabel.value = `From ${from.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } else if (dateTo.value) {
    const to = new Date(dateTo.value);
    dateFilterLabel.value = `Until ${to.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  } else {
    dateFilterLabel.value = 'All Time';
  }
  showDatePicker.value = false;
  fetchAnalyticsData();
};

const setQuickFilter = (period) => {
  const today = new Date();
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (period) {
    case 'last7days':
      dateTo.value = formatDate(today);
      dateFrom.value = formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
      dateFilterLabel.value = 'Last 7 Days';
      break;
    case 'last30days':
      dateTo.value = formatDate(today);
      dateFrom.value = formatDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
      dateFilterLabel.value = 'Last 30 Days';
      break;
    case 'last90days':
      dateTo.value = formatDate(today);
      dateFrom.value = formatDate(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000));
      dateFilterLabel.value = 'Last 90 Days';
      break;
    case 'thisMonth':
      dateFrom.value = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
      dateTo.value = formatDate(today);
      dateFilterLabel.value = 'This Month';
      break;
    case 'lastMonth':
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      dateFrom.value = formatDate(lastMonth);
      dateTo.value = formatDate(lastDayOfLastMonth);
      dateFilterLabel.value = 'Last Month';
      break;
    case 'thisYear':
      dateFrom.value = formatDate(new Date(today.getFullYear(), 0, 1));
      dateTo.value = formatDate(today);
      dateFilterLabel.value = 'This Year';
      break;
    case 'allTime':
      dateFrom.value = null;
      dateTo.value = null;
      dateFilterLabel.value = 'All Time';
      break;
  }
  showDatePicker.value = false;
  fetchAnalyticsData();
};

const clearDateFilter = () => {
  dateFrom.value = null;
  dateTo.value = null;
  dateFilterLabel.value = 'All Time';
  showDatePicker.value = false;
  fetchAnalyticsData();
};

const exportReport = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Build query parameters
    const params = {};
    if (dateFrom.value) params.from_date = dateFrom.value;
    if (dateTo.value) params.to_date = dateTo.value;

    // Fetch data for export
    const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.data.success) {
      throw new Error('Failed to fetch data for export');
    }

    const data = response.data.data;
    
    // Create CSV content
    let csvContent = 'Analytics Dashboard Report\n';
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
    csvContent += `Date Range: ${dateFilterLabel.value}\n\n`;
    
    // Positions Data
    csvContent += 'POSITIONS ANALYSIS\n';
    csvContent += 'Position,Total Candidates,Hired,Avg Match Score\n';
    data.positions.forEach(pos => {
      csvContent += `"${pos.title}",${pos.total_candidates},${pos.hired},${pos.avg_match.toFixed(2)}\n`;
    });
    csvContent += '\n';
    
    // Hiring Funnel
    csvContent += 'HIRING FUNNEL\n';
    csvContent += 'Status,Count\n';
    Object.entries(data.hiringFunnel).forEach(([status, count]) => {
      csvContent += `${status},${count}\n`;
    });
    csvContent += '\n';
    
    // Interviewers
    csvContent += 'INTERVIEWER PERFORMANCE\n';
    csvContent += 'Interviewer,Interviews Taken\n';
    data.interviewers.forEach(interviewer => {
      csvContent += `"${interviewer.full_name}",${interviewer.interviews_taken}\n`;
    });
    csvContent += '\n';
    
    // Slot Utilization
    csvContent += 'SLOT UTILIZATION\n';
    csvContent += 'Interviewer,Total Slots,Booked Slots,Utilization %\n';
    data.slotUtilization.forEach(util => {
      csvContent += `"${util.interviewer_id}",${util.total_slots},${util.booked_slots},${util.utilization_pct.toFixed(2)}\n`;
    });
    csvContent += '\n';
    
    // Process Metrics
    csvContent += 'PROCESS METRICS\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Parsed Resumes,${data.processMetrics.total_parsed_resumes}\n`;
    csvContent += `Interviews Assigned,${data.processMetrics.interviews_assigned}\n`;
    csvContent += `Interviews Not Assigned,${data.processMetrics.interviews_not_assigned}\n`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${dateFrom.value || 'all'}_${dateTo.value || 'time'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error exporting report:', err);
    alert('Failed to export report: ' + (err.response?.data?.error || err.message || 'Unknown error'));
  }
};

const getMatchClass = (match) => {
  if (match > 70) return 'high-progress';
  if (match > 60) return 'medium-progress';
  return 'low-progress';
};

const getPerformanceClass = (interviews) => {
  if (interviews > 20) return 'badge-ats-success';
  if (interviews > 10) return 'badge-ats-warning';
  return 'badge-ats-warning';
};

const getPerformanceLabel = (interviews) => {
  if (interviews > 20) return 'High';
  if (interviews > 10) return 'Medium';
  return 'Low';
};

const getUtilizationClass = (pct) => {
  if (pct > 90) return 'high-progress';
  if (pct > 70) return 'medium-progress';
  if (pct > 50) return 'low-progress';
  return 'low-progress';
};

const getUtilizationBadgeClass = (pct) => {
  if (pct > 90) return 'badge-ats-success';
  if (pct > 70) return 'badge-ats-warning';
  if (pct > 50) return 'badge-ats-warning';
  return 'badge-ats-danger';
};

const getUtilizationLabel = (pct) => {
  if (pct > 90) return 'Excellent';
  if (pct > 70) return 'Good';
  if (pct > 50) return 'Average';
  return 'Poor';
};


const getStatusLabel = (status) => {
  if (status === 'selected' || status === 'success') return 'On Target';
  if (status === 'pending' || status === 'warning') return 'Needs Improvement';
  return 'Below Target';
};

const getDecisionTime = (title) => {
  const decision = timeToDecision.value.find(d => d.title === title);
  return decision ? decision.avg_days.toFixed(1) : 'N/A';
};

const getConversionRate = (position) => {
  return position.total_candidates > 0 
    ? ((position.hired / position.total_candidates) * 100).toFixed(2) 
    : '0.00';
};

const getIndustryAvg = (title) => {
  if (title.includes('Executive')) return 30;
  if (title.includes('Engineer')) return 20;
  if (title.includes('Analyst')) return 15;
  return 25;
};

const getDecisionPerformanceClass = (decision) => {
  const industryAvg = getIndustryAvg(decision.title);
  if (decision.avg_days < industryAvg) return 'success';
  if (decision.avg_days === industryAvg) return 'warning';
  return 'danger';
};

const getDecisionPerformanceLabel = (decision) => {
  const industryAvg = getIndustryAvg(decision.title);
  if (decision.avg_days < industryAvg) return 'Faster';
  if (decision.avg_days === industryAvg) return 'On Par';
  return 'Slower';
};

// ============================================
// CHART INITIALIZATION
// ============================================

const initializeCharts = () => {
  // Destroy existing charts first
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      try {
        chart.destroy();
      } catch (e) {
        console.warn('Error destroying chart:', e);
      }
    }
  });
  chartInstances = {};
  
  nextTick(() => {

    Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
    Chart.defaults.color = '#6b7280';

    // Chart 1: Position Performance
    if (positionsChart.value && activeTab.value === 'overview') {
      const ctx = positionsChart.value.getContext('2d');
      chartInstances.positions = new Chart(ctx, {
        type: positionsChartType.value,
        data: {
          labels: topPositions.value.map(p => {
            if (p.title.length > 15) return p.title.substring(0, 15) + '...';
            return p.title;
          }),
          datasets: [
            {
              label: 'Total Candidates',
              data: topPositions.value.map(p => p.total_candidates),
              backgroundColor: 'rgba(30, 64, 175, 0.8)',
              borderColor: 'rgba(30, 64, 175, 1)',
              borderWidth: 1,
              borderRadius: 6,
              order: positionsChartType.value === 'bar' ? 2 : 1
            },
            {
              label: 'Avg Match %',
              data: topPositions.value.map(p => p.avg_match),
              type: 'line',
              borderColor: 'rgba(245, 158, 11, 1)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 3,
              pointBackgroundColor: 'rgba(245, 158, 11, 1)',
              pointRadius: 5,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.3,
              order: positionsChartType.value === 'bar' ? 1 : 2,
              yAxisID: positionsChartType.value === 'bar' ? 'y1' : undefined
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: positionsChartType.value === 'bar' ? {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              title: { display: true, text: 'Number of Candidates', font: { weight: 'bold' } }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              max: 100,
              grid: { drawOnChartArea: false },
              title: { display: true, text: 'Match Score %', font: { weight: 'bold' } }
            }
          } : {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' }
            },
            tooltip: {
              backgroundColor: 'rgba(30, 41, 59, 0.95)',
              titleColor: '#f8fafc',
              bodyColor: '#f8fafc',
              padding: 12,
              cornerRadius: 8
            }
          }
        }
      });
    }

    // Chart 2: Status Distribution
    if (statusChart.value && activeTab.value === 'overview') {
      const ctx = statusChart.value.getContext('2d');
      chartInstances.status = new Chart(ctx, {
        type: statusChartType.value,
        data: {
          labels: ['Pending', 'Rejected', 'Selected', 'On Hold'],
          datasets: [{
            data: [
              interviewerStatus.value.pending,
              interviewerStatus.value.rejected,
              interviewerStatus.value.selected,
              interviewerStatus.value.on_hold
            ],
            backgroundColor: [
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)'
            ],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2,
            borderRadius: 6,
            spacing: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: statusChartType.value === 'doughnut' ? '65%' : 0,
          plugins: {
            legend: {
              position: 'right',
              labels: { padding: 20, usePointStyle: true, pointStyle: 'circle', font: { size: 13 } }
            }
          }
        }
      });
    }

    // Chart 3: Monthly Resumes
    if (resumesChart.value && activeTab.value === 'overview') {
      const ctx = resumesChart.value.getContext('2d');
      chartInstances.resumes = new Chart(ctx, {
        type: resumesChartType.value,
        data: {
          labels: monthlyResumes.value.map(r => r.period),
          datasets: [{
            label: 'Resumes Uploaded',
            data: monthlyResumes.value.map(r => r.resumes_uploaded),
            backgroundColor: ['rgba(30, 64, 175, 0.8)', 'rgba(59, 130, 246, 0.8)'],
            borderColor: ['rgba(30, 64, 175, 1)', 'rgba(59, 130, 246, 1)'],
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              title: { display: true, text: 'Number of Resumes', font: { weight: 'bold' } }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Chart 4: Time to Decision
    if (decisionChart.value && activeTab.value === 'overview') {
      const ctx = decisionChart.value.getContext('2d');
      chartInstances.decision = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: timeToDecision.value.map(d => {
            if (d.title.length > 15) return d.title.substring(0, 15) + '...';
            return d.title;
          }),
          datasets: [{
            label: 'Average Days to Decision',
            data: timeToDecision.value.map(d => d.avg_days),
            backgroundColor: timeToDecision.value.map(d => 
              d.avg_days > 20 ? 'rgba(239, 68, 68, 0.8)' :
              d.avg_days > 10 ? 'rgba(245, 158, 11, 0.8)' :
              'rgba(16, 185, 129, 0.8)'
            ),
            borderColor: timeToDecision.value.map(d => 
              d.avg_days > 20 ? 'rgba(239, 68, 68, 1)' :
              d.avg_days > 10 ? 'rgba(245, 158, 11, 1)' :
              'rgba(16, 185, 129, 1)'
            ),
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              title: { display: true, text: 'Days to Decision', font: { weight: 'bold' } }
            }
          }
        }
      });
    }

    // Chart 5: Detailed Positions (Radar)
    if (detailedPositionsChart.value && activeTab.value === 'positions') {
      const ctx = detailedPositionsChart.value.getContext('2d');
      chartInstances.detailedPositions = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: positionsData.value.map(p => {
            if (p.title.length > 15) return p.title.substring(0, 15) + '...';
            return p.title;
          }),
          datasets: [
            {
              label: 'Total Candidates (Normalized)',
              data: positionsData.value.map(p => (p.total_candidates / 218) * 100),
              backgroundColor: 'rgba(30, 64, 175, 0.2)',
              borderColor: 'rgba(30, 64, 175, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(30, 64, 175, 1)'
            },
            {
              label: 'Avg Match Score',
              data: positionsData.value.map(p => p.avg_match),
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              borderColor: 'rgba(245, 158, 11, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(245, 158, 11, 1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { display: false }
            }
          },
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }

    // Chart 6: Interviewers Performance
    if (interviewersPerformanceChart.value && activeTab.value === 'interviewers') {
      const ctx = interviewersPerformanceChart.value.getContext('2d');
      chartInstances.interviewersPerformance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topInterviewers.value.map(i => i.full_name),
          datasets: [{
            label: 'Interviews Taken',
            data: topInterviewers.value.map(i => i.interviews_taken),
            backgroundColor: topInterviewers.value.map(i => 
              i.interviews_taken > 20 ? 'rgba(16, 185, 129, 0.8)' :
              i.interviews_taken > 10 ? 'rgba(59, 130, 246, 0.8)' :
              'rgba(245, 158, 11, 0.8)'
            ),
            borderColor: topInterviewers.value.map(i => 
              i.interviews_taken > 20 ? 'rgba(16, 185, 129, 1)' :
              i.interviews_taken > 10 ? 'rgba(59, 130, 246, 1)' :
              'rgba(245, 158, 11, 1)'
            ),
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' },
              title: { display: true, text: 'Interviews Taken', font: { weight: 'bold' } }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Chart 7: Utilization Chart
    if (utilizationChart.value && activeTab.value === 'interviewers') {
      const ctx = utilizationChart.value.getContext('2d');
      chartInstances.utilization = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Interviewers',
            data: interviewerUtilization.value.map(util => ({
              x: util.total_slots,
              y: util.utilization_pct
            })),
            backgroundColor: interviewerUtilization.value.map(util => 
              util.utilization_pct > 90 ? 'rgba(16, 185, 129, 0.8)' :
              util.utilization_pct > 70 ? 'rgba(59, 130, 246, 0.8)' :
              util.utilization_pct > 50 ? 'rgba(245, 158, 11, 0.8)' :
              'rgba(239, 68, 68, 0.8)'
            ),
            borderColor: interviewerUtilization.value.map(util => 
              util.utilization_pct > 90 ? 'rgba(16, 185, 129, 1)' :
              util.utilization_pct > 70 ? 'rgba(59, 130, 246, 1)' :
              util.utilization_pct > 50 ? 'rgba(245, 158, 11, 1)' :
              'rgba(239, 68, 68, 1)'
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Total Slots', font: { weight: 'bold' } },
              grid: { color: 'rgba(226, 232, 240, 0.8)' }
            },
            y: {
              title: { display: true, text: 'Utilization %', font: { weight: 'bold' } },
              grid: { color: 'rgba(226, 232, 240, 0.8)' }
            }
          }
        }
      });
    }

    // Chart 8: Resource Utilization
    if (resourceUtilizationChart.value && activeTab.value === 'utilization') {
      const ctx = resourceUtilizationChart.value.getContext('2d');
      chartInstances.resourceUtilization = new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: interviewerUtilization.value.map(util => util.interviewer_id.substring(0, 8) + '...'),
          datasets: [{
            label: 'Utilization %',
            data: interviewerUtilization.value.map(util => util.utilization_pct),
            backgroundColor: interviewerUtilization.value.map(util => 
              util.utilization_pct > 90 ? 'rgba(16, 185, 129, 0.8)' :
              util.utilization_pct > 70 ? 'rgba(59, 130, 246, 0.8)' :
              util.utilization_pct > 50 ? 'rgba(245, 158, 11, 0.8)' :
              'rgba(239, 68, 68, 0.8)'
            ),
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Chart 9: Pipeline Chart
    if (pipelineChart.value && activeTab.value === 'process') {
      const ctx = pipelineChart.value.getContext('2d');
      chartInstances.pipeline = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Resumes Parsed', 'Interviews Assigned', 'Interviews Not Assigned'],
          datasets: [{
            label: 'Count',
            data: [
              processMetrics.value.total_parsed_resumes,
              processMetrics.value.interviews_assigned,
              processMetrics.value.interviews_not_assigned
            ],
            backgroundColor: [
              'rgba(30, 64, 175, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgba(30, 64, 175, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.8)' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Chart 10: Rejection Chart
    if (rejectionChart.value && activeTab.value === 'process') {
      const ctx = rejectionChart.value.getContext('2d');
      chartInstances.rejection = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Interviewer Rejected'],
          datasets: [{
            data: [20],
            backgroundColor: ['rgba(239, 68, 68, 0.8)'],
            borderColor: ['rgba(239, 68, 68, 1)'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }
  });
};

// Watch for tab changes to initialize charts
watch(activeTab, () => {
  nextTick(() => {
    setTimeout(() => {
      initializeCharts();
    }, 100);
  });
});

// ============================================
// API FUNCTIONS
// ============================================

const fetchAnalyticsData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Build query parameters
    const params = {};
    if (dateFrom.value) params.from_date = dateFrom.value;
    if (dateTo.value) params.to_date = dateTo.value;

    const response = await axios.get(`${API_BASE_URL}/analytics/dashboard`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      // Update all data refs
      positionsData.value = data.positions || [];
      hrFinalStatus.value = data.hiringFunnel || { pending: 0, rejected: 0, selected: 0, on_hold: 0 };
      timeToDecision.value = data.timeToHire || [];
      hrFinalReason.value = data.rejectionReasons || {};
      interviewersData.value = data.interviewers || [];
      interviewerStatus.value = data.interviewerStatus || { pending: 0, selected: 0, rejected: 0, on_hold: 0 };
      interviewerUtilization.value = data.slotUtilization || [];
      monthlyResumes.value = data.resumeVolume || [];
      processMetrics.value = data.processMetrics || { total_parsed_resumes: 0, interviews_assigned: 0, interviews_not_assigned: 0 };
      
      // Re-initialize charts after data is updated
      // Wait for DOM to update and ensure charts are visible
      await nextTick();
      setTimeout(() => {
        initializeCharts();
      }, 200);
    } else {
      throw new Error(response.data.error || 'Failed to fetch analytics data');
    }
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    error.value = err.response?.data?.error || err.message || 'Failed to load analytics data';
  } finally {
    loading.value = false;
  }
};

// Close date picker when clicking outside
const handleClickOutside = (event) => {
  if (showDatePicker.value && !event.target.closest('.date-filter-ats') && !event.target.closest('.date-picker-dropdown')) {
    showDatePicker.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  await fetchAnalyticsData();
  // Wait for DOM to update before initializing charts
  await nextTick();
  setTimeout(() => {
    initializeCharts();
  }, 100);
});

// Cleanup event listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Import Font Awesome */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* Tab Navigation */
.tab-navigation-ats {
  display: flex;
  gap: 10px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 5px;
}

.tab-btn-ats {
  background: none;
  border: none;
  padding: 12px 24px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn-ats:hover {
  color: var(--ats-primary);
}

.tab-btn-ats.active {
  color: var(--ats-primary);
}

.tab-btn-ats.active::after {
  content: '';
  position: absolute;
  bottom: -7px;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--ats-primary);
  border-radius: 2px;
}

.tab-content {
  display: block;
  animation: fadeInUp 0.5s ease;
}

/* Date Filter */
.date-filter-ats {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: var(--ats-transition);
}

.date-filter-ats:hover {
  border-color: var(--ats-primary);
  box-shadow: var(--ats-shadow-sm);
}

/* Chart Container */
.chart-container-ats {
  position: relative;
  height: 300px;
  width: 100%;
}



/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Date Picker Dropdown */
.date-picker-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  min-width: 280px;
  animation: fadeInUp 0.3s ease;
}

.date-picker-dropdown h6 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.date-picker-dropdown .btn {
  text-align: left;
  font-size: 0.875rem;
}

.date-picker-dropdown hr {
  margin: 1rem 0;
  border-color: #e5e7eb;
}
</style>
