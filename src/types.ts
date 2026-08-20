export type Department =
  | 'Front of House'
  | 'Back of House'
  | 'Bar & Beverage'
  | 'Kitchen Prep & Dish'
  | 'Management';

export type RestaurantRole =
  | 'Server'
  | 'Head Server'
  | 'Host / Hostess'
  | 'Food Runner'
  | 'Busser'
  | 'Cashier'
  | 'Head Chef'
  | 'Sous Chef'
  | 'Line Cook'
  | 'Grill Cook'
  | 'Prep Cook'
  | 'Dishwasher'
  | 'Lead Bartender'
  | 'Bartender'
  | 'Barback'
  | 'General Manager'
  | 'Assistant GM'
  | 'Shift Supervisor';

export interface AlcoholHandlerCard {
  cardNumber: string;
  issuingAuthority?: string; // e.g. "California RBS", "ServSafe Alcohol", "TIPS", "Texas TABC", "Illinois BASSET"
  state: string;
  issueDate: string;
  expirationDate: string;
  verified: boolean;
  cardImageUrl?: string;
  certificateUrl?: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing' | 'pending_verification';
}

export interface FoodHandlerCard {
  cardNumber: string;
  issuingAuthority?: string; // e.g. "ServSafe Food Handler", "State Dept of Health", "National Registry"
  issueDate: string;
  expirationDate: string;
  verified: boolean;
  cardImageUrl?: string;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing' | 'pending_verification';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  role: RestaurantRole;
  hourlyWage: number;
  maxHoursPerWeek: number;
  color: string; // Distinctive color for calendar schedule display
  status: 'active' | 'on_leave' | 'inactive';
  avatarUrl?: string;
  hireDate: string;
  alcoholHandlerCard?: AlcoholHandlerCard;
  foodHandlerCard?: FoodHandlerCard;
  kudosPoints?: number;
  fiveStarMentionCount?: number;
  adpEmployeeId?: string;
  posServerId?: string;
  posServerCode?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
  organizationId?: string;
  hierarchyPath?: string; // e.g. "ShiftForce Corp > North America > Pacific Coast > Bay Area District > SF Flagship #104"
  locationId?: string;
  districtId?: string;
  regionId?: string;
}

export type ShiftStatus = 'draft' | 'published' | 'completed' | 'swapped' | 'sick_cover';

export type BreakType = 'meal_30' | 'rest_15' | 'rest_10' | 'recovery_20';

export interface ScheduledBreak {
  id: string;
  type: BreakType;
  label: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  isPaid: boolean;
  isCompleted?: boolean;
  coverageEmployeeId?: string;
  coverageEmployeeName?: string;
  notes?: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  role: RestaurantRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (e.g. "09:00", "16:30")
  endTime: string; // HH:MM (e.g. "17:00", "23:30")
  breakMinutes: number;
  hourlyWage: number;
  status: ShiftStatus;
  color: string;
  notes?: string;
  scheduledBreaks?: ScheduledBreak[];
  rotationCycleId?: string;
  rotationWeekIndex?: number; // 0 for Week A, 1 for Week B, etc.
  organizationId?: string;
  hierarchyPath?: string; // e.g. "ShiftForce Corp > North America > Pacific Coast > Bay Area District > SF Flagship #104"
  locationId?: string;
  districtId?: string;
  regionId?: string;
}

export type ShiftPatternTag = 'Opening' | 'Mid' | 'Closing' | 'Rush' | 'Overnight' | 'Custom';

export interface ShiftTemplate {
  id: string;
  name: string;
  patternTag: ShiftPatternTag;
  department: Department;
  role: RestaurantRole;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  defaultBreaks?: Omit<ScheduledBreak, 'id'>[];
  notes?: string;
  color?: string;
  isFavorite?: boolean;
  stationName?: string;
}

export interface RotationSlotTemplate {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  shiftTemplateId?: string;
  templateName: string;
  role: RestaurantRole;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isOffDay?: boolean;
}

export interface RecurringRotationCycle {
  id: string;
  name: string;
  description: string;
  department: Department;
  cycleLengthWeeks: 2 | 3 | 4; // e.g. 2-week A/B rotation, 4-week monthly rotation
  startDate: string; // Base reference Monday/Sunday YYYY-MM-DD
  assignedEmployeeIds: string[];
  weekSchedules: {
    weekIndex: number; // 0 = Week A, 1 = Week B, 2 = Week C, 3 = Week D
    weekLabel: string; // "Week A (Opening Focus)", "Week B (Closing/Weekend Focus)"
    slots: RotationSlotTemplate[];
  }[];
  isActive: boolean;
  autoRollForward: boolean;
  createdAt: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface TimeOffRequest {
  id: string;
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
  employeeId: string;
  employeeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: 'vacation' | 'personal' | 'unpaid' | 'medical';
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface ShiftSwapRequest {
  id: string;
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
  requesterEmployeeId: string;
  requesterEmployeeName: string;
  requesterShiftId: string;
  requesterShiftDate: string;
  requesterShiftTime: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  targetShiftId?: string;
  targetShiftDate?: string;
  targetShiftTime?: string;
  reason: string;
  peerApprovalStatus: 'pending' | 'accepted' | 'declined';
  adminApprovalStatus: RequestStatus;
  createdAt: string;
  adminNotes?: string;
}

export interface SickDayReport {
  id: string;
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  department: Department;
  symptomsSummary: string;
  needsImmediateCoverage: boolean;
  coverageEmployeeId?: string;
  coverageEmployeeName?: string;
  status: 'reported' | 'acknowledged' | 'covered';
  createdAt: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DayAvailability {
  status: 'open' | 'preferred' | 'morning_only' | 'evening_only' | 'unavailable';
  notes?: string;
}

export interface AvailabilityRequest {
  id: string;
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
  employeeId: string;
  employeeName: string;
  weeklyPreferences: Record<DayOfWeek, DayAvailability>;
  effectiveDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewedBy?: string;
}

export interface ShiftSlotRequest {
  id: string;
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
  shiftId?: string; // Reference to specific shift if claiming existing slot
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  role: RestaurantRole;
  department: Department;
  employeeId: string;
  employeeName: string;
  reason?: string;
  status: RequestStatus;
  createdAt: string;
  adminNotes?: string;
}

export interface PriorityCandidateAnalysis {
  employeeId: string;
  employeeName: string;
  requestId: string;
  priorityScore: number; // 0 - 100
  isRecommendedPriority: boolean;
  availabilityHistory: {
    statedPreference: 'preferred' | 'open' | 'evening_only' | 'morning_only' | 'unavailable' | 'neutral';
    availabilityAdherenceRate: number; // percentage
    historicalPreferenceMatch: boolean;
    details: string;
  };
  attendanceReliability: {
    onTimeRate: number; // percentage
    totalShiftsLogged: number;
    lateCount: number;
    excusedCount: number;
    noShowCount: number;
  };
  workloadFactors: {
    currentScheduledHours: number;
    projectedHoursIfAssigned: number;
    overtimeRisk: boolean;
    overtimeHoursExcess: number;
  };
  seniorityMonths: number;
  keyFactors: string[];
}

export interface ShiftSlotContention {
  contentionKey: string; // composite key e.g. "2026-08-16_16:00-23:30_Server"
  date: string;
  startTime: string;
  endTime: string;
  role: RestaurantRole;
  department: Department;
  shiftId?: string;
  requests: ShiftSlotRequest[];
  contenderEmployeeIds: string[];
  contenderEmployeeNames: string[];
  analysis: PriorityCandidateAnalysis[];
  recommendedCandidateId: string;
  recommendedCandidateName: string;
  recommendationReason: string;
  status: 'contested' | 'resolved';
  resolvedAssignedEmployeeId?: string;
}

export type PortalType = 'admin' | 'employee';
export type ActiveTab =
  | 'command_center'
  | 'intelligence_agent'
  | 'enterprise'
  | 'schedule'
  | 'employees'
  | 'payroll'
  | 'learn'
  | 'performance'
  | 'integrations'
  | 'analytics'
  | 'requests'
  | 'tardiness'
  | 'announcements'
  | 'hr_payroll';

export interface Announcement {
  id: string;
  organizationId?: string;
  title: string;
  content: string;
  authorName: string;
  authorRole?: string;
  priority: 'normal' | 'urgent' | 'highlight' | 'emergency';
  targetDepartment?: Department | 'all';
  targetDepartments?: Department[] | 'all';
  publishedAt?: string;
  createdAt?: string;
  channels: ('in_app' | 'sms' | 'email' | 'app')[];
  readBy?: string[]; // employeeIds
  readByEmployeeIds?: string[];
  isPinned?: boolean;
}

export interface NotificationDispatch {
  id: string;
  recipientEmployeeId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  type: 'schedule_publish_7day' | 'announcement' | 'shift_24hr_reminder' | 'shift_1hr_countdown' | 'swap_approval' | 'tardiness_alert' | 'timeoff_status' | 'sick_call' | 'shift_slot_contention';
  title: string;
  message: string;
  channels: ('app' | 'sms' | 'whatsapp' | 'email')[];
  timestamp: string;
  status: 'sent' | 'delivered' | 'preview_not_sent' | 'failed';
  metadata?: {
    shiftId?: string;
    shiftDate?: string;
    shiftStartTime?: string;
    role?: string;
    department?: string;
    isAutomatedCron?: boolean;
    whatsappMessageSid?: string;
  };
}

export interface ScheduledReminderTask {
  id: string;
  shiftId: string;
  employeeId: string;
  employeeName: string;
  employeePhone: string;
  employeeEmail: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  role: RestaurantRole;
  department: Department;
  targetWindow: '24hr' | '1hr';
  scheduledTriggerTime: string;
  status: 'scheduled' | 'triggered' | 'delivered' | 'skipped';
  channels: ('whatsapp' | 'sms' | 'app' | 'email')[];
  previewMessage: string;
  triggeredAt?: string;
  deliverySid?: string;
}

export interface ReminderSchedulerConfig {
  enable24HrReminder: boolean;
  enable1HrAlert: boolean;
  channels24Hr: ('whatsapp' | 'sms' | 'app' | 'email')[];
  channels1Hr: ('whatsapp' | 'sms' | 'app' | 'email')[];
  autoTriggerIntervalSeconds: number; // e.g., 30s background scan
  whatsappTemplate: string;
  smsTemplate: string;
  lastRunTimestamp?: string;
  totalAutoSentCount: number;
  isDaemonActive: boolean;
}

export interface TardinessRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftDate: string;
  scheduledStartTime: string;
  actualClockInTime: string;
  lateMinutes: number;
  status: 'on_time' | 'late' | 'excused' | 'no_show';
  reason?: string;
  managerNote?: string;
}

export type HiringPlatformId =
  | 'linkedin'
  | 'indeed'
  | 'craigslist'
  | 'facebook_jobs'
  | 'ziprecruiter'
  | 'snagajob'
  | 'culinary_agents'
  | 'glassdoor'
  | 'google_jobs'
  | 'direct_qr';

export interface HiringPlatformConnection {
  id: HiringPlatformId;
  name: string;
  category: 'Professional Network' | 'General Job Board' | 'Local Classifieds' | 'Social & Mobile' | 'Hospitality Specialist' | 'Search Engine';
  tagline: string;
  brandColor: string;
  badgeBg: string;
  badgeText: string;
  status: 'connected' | 'syncing' | 'disconnected' | 'error';
  apiKeyConfigured: boolean;
  apiKeyMasked?: string;
  webhookEndpoint?: string;
  syncFrequency: 'instant_webhook' | 'every_15m' | 'hourly' | 'manual';
  lastSyncedAt?: string;
  activePostingsCount: number;
  inboundApplicantsCount: number;
  features: string[];
  externalUrl: string;
  authType: 'oauth2' | 'api_key' | 'xml_feed' | 'posting_assistant';
  accountName?: string;
  autoImportApplicants: boolean;
  dailySponsorshipBudget?: number;
}

export interface JobOpening {
  id: string;
  title: string;
  department: Department;
  role: RestaurantRole;
  jobType: 'full_time' | 'part_time' | 'seasonal' | 'weekend_only' | 'on_call';
  hourlyMin: number;
  hourlyMax: number;
  tipEligible: boolean;
  locationName: string;
  hierarchyPath?: string;
  locationId?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  targetPlatforms: HiringPlatformId[];
  status: 'active' | 'draft' | 'paused' | 'filled';
  createdAt: string;
  publishedAt?: string;
  viewsCount: number;
  applicantsCount: number;
  shortlistedCount: number;
  directApplyCode: string;
  urgency: 'urgent_hire' | 'standard' | 'pipeline_building';
}

export interface HiringSyncLog {
  id: string;
  platformId: HiringPlatformId;
  timestamp: string;
  type: 'candidate_imported' | 'job_broadcasted' | 'status_synced' | 'webhook_received' | 'posting_updated';
  message: string;
  candidateName?: string;
  jobTitle?: string;
  status: 'success' | 'warning' | 'info';
}

export interface OnboardingCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RestaurantRole;
  department: Department;
  stage: 'applied' | 'interview_scheduled' | 'offer_sent' | 'onboarding' | 'active';
  appliedAt: string;
  sourcePlatform?: HiringPlatformId;
  sourceJobId?: string;
  sourceJobTitle?: string;
  resumeSnippet?: string;
  yearsExperience?: number;
  certificationsSummary?: string[];
  aiMatchScore?: number; // 0 - 100
  hourlyWageExpectation?: number;
  externalProfileUrl?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewScore?: number; // 1-5
  interviewNotes?: string;
  documents: {
    i9Verified: boolean;
    foodHandlerCertified: boolean;
    alcoholCardCertified: boolean;
    directDeposit: boolean;
    uniformAssigned: boolean;
  };
  organizationId?: string;
  hierarchyPath?: string;
  locationId?: string;
}

export interface PricingPlan {
  id: string;
  minLocations?: number;
  maxLocations?: number | null;
  maxEmployees: number; // -1 = unlimited
  label: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualPrice?: number;
  trialDays?: number;
  isPopular?: boolean;
  features: string[];
}

export interface UserSubscriptionState {
  currentTierId: string;
  activeLocationCount: number;
  activeEmployeeCount: number;
  billingCycle: 'monthly' | 'annual';
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialStartDate: string;
  trialEndDate: string;
  nextBillingDate: string;
}

export type SupportedLanguage =
  | 'en' // English
  | 'es' // Spanish
  | 'zh' // Chinese
  | 'th' // Thai
  | 'ko' // Korean
  | 'ja' // Japanese
  | 'vi' // Vietnamese
  | 'fr'; // French

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export type DepartmentBudgetsMap = Record<Department, number>;

export interface DepartmentBudgetInfo {
  department: Department;
  weeklyBudget: number;
  scheduledCost: number;
  scheduledHours: number;
  remainingBudget: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'over_budget';
}

export interface OpenSlot {
  id: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  role: RestaurantRole;
  department: Department;
  patternTag?: ShiftPatternTag;
  notes?: string;
  source: 'unassigned_shift' | 'template_requirement' | 'understaffed_gap' | 'custom';
}

export interface SmartMatchCandidate {
  employeeId: string;
  employeeName: string;
  role: RestaurantRole;
  department: Department;
  hourlyWage: number;
  color: string;
  matchScore: number; // 0 - 100
  availabilityStatus: 'preferred' | 'available' | 'morning_only' | 'evening_only' | 'unavailable' | 'neutral';
  availabilityReason: string;
  currentWeeklyHours: number;
  projectedWeeklyHours: number;
  shiftHours: number;
  shiftCost: number;
  causesOvertime: boolean;
  overtimeHours: number;
  departmentBudgetRemainingBefore: number;
  departmentBudgetRemainingAfter: number;
  budgetFit: 'ideal' | 'acceptable' | 'tight' | 'exceeds';
  reasons: string[];
  warnings: string[];
}

export interface SmartAutoFillSlotRecommendation {
  slotId: string;
  date: string;
  dayName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  role: RestaurantRole;
  department: Department;
  patternTag?: ShiftPatternTag;
  notes?: string;
  topCandidates: SmartMatchCandidate[];
  selectedCandidateId: string | null;
  isIncluded: boolean;
  source: 'unassigned_shift' | 'template_requirement' | 'understaffed_gap' | 'custom';
}

export interface SmartAutoFillPlan {
  recommendations: SmartAutoFillSlotRecommendation[];
  summary: {
    totalSlots: number;
    includedSlotsCount: number;
    assignedSlotsCount: number;
    totalEstimatedCost: number;
    totalEstimatedHours: number;
    budgetImpactByDepartment: Record<Department, { costAdded: number; newRemaining: number; isOverBudget: boolean }>;
    overtimePreventedCount: number;
  };
  aiRationale?: string;
}

// ----------------------------------------------------
// WorkForce & Payroll Integration Hub Types (ADP, UKG, Workday, etc.)
// ----------------------------------------------------
export type WorkforcePlatformId =
  | 'adp_workforce_now'
  | 'adp_run'
  | 'ukg_pro'
  | 'workday'
  | 'paychex_flex'
  | 'gusto'
  | 'seven_shifts'
  | 'quickbooks_payroll'
  | 'bamboohr';

export interface WorkforcePlatformInfo {
  id: WorkforcePlatformId;
  name: string;
  category: 'Payroll & HCM' | 'Workforce Management' | 'Small Business Payroll' | 'Enterprise ERP';
  logoUrl?: string;
  iconName: string;
  description: string;
  popularFor: string;
  supportedFeatures: {
    twoWayEmployeeSync: boolean;
    timesheetExport: boolean;
    overtimeBreakdown: boolean;
    jobCodeMapping: boolean;
    taxWithholdingSync: boolean;
    autoScheduledCron: boolean;
  };
  status: 'connected' | 'syncing' | 'disconnected' | 'error';
  lastSyncTimestamp?: string;
  syncedEmployeeCount?: number;
  syncedPayPeriod?: string;
  apiVersion?: string;
  companyCodeOrTenant?: string;
  autoSyncDaily: boolean;
  environment: 'production' | 'sandbox';
}

export interface WorkforceSyncLog {
  id: string;
  platformId: WorkforcePlatformId;
  platformName: string;
  action: 'employee_sync' | 'payroll_export' | 'wage_rate_update' | 'timecard_push';
  status: 'success' | 'warning' | 'failed';
  recordsProcessed: number;
  timestamp: string;
  summary: string;
  details?: string;
  downloadPayloadUrl?: string;
}

// ----------------------------------------------------
// Universal POS Integration Hub Types (Toast, Square, Clover, Aloha, etc.)
// ----------------------------------------------------
export type POSPlatformId =
  | 'toast'
  | 'square'
  | 'clover'
  | 'lightspeed'
  | 'ncr_aloha'
  | 'revel'
  | 'spoton'
  | 'micros_simphony';

export interface POSPlatformInfo {
  id: POSPlatformId;
  name: string;
  tier: 'Cloud Native' | 'Hybrid Legacy' | 'Mobile & Tablet' | 'Enterprise ERP';
  iconName: string;
  description: string;
  marketShare: string;
  status: 'connected' | 'live_streaming' | 'disconnected' | 'standby';
  lastHeartbeat: string;
  restaurantLocationId: string;
  capabilities: {
    realtimeNetSales: boolean;
    liveLaborCostPercent: boolean;
    timeclockPunchSync: boolean;
    serverSalesAndTips: boolean;
    tableTurnoverVelocity: boolean;
    orderVolumeForecast: boolean;
  };
  metricsToday: {
    netSales: number;
    laborCost: number;
    laborPercent: number; // e.g. 18.5
    targetLaborPercent: number; // e.g. 22.0
    openGuestChecks: number;
    closedChecksCount: number;
    avgTicketSize: number;
    activeClockedInStaff: number;
  };
}

export interface POSServerSalesMetric {
  employeeId: string;
  employeeName: string;
  posServerCode: string;
  role: RestaurantRole;
  netSales: number;
  tipsEarned: number;
  tipPercent: number;
  tablesServed: number;
  guestCount: number;
  clockInTime: string;
  shiftHours: number;
  salesPerHour: number;
}

export interface POSTimeclockPunch {
  id: string;
  employeeId: string;
  employeeName: string;
  posPlatform: POSPlatformId;
  scheduledTime: string;
  actualPunchTime: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  varianceMinutes: number; // positive = late, negative = early
  status: 'matched' | 'variance_flagged' | 'unmatched';
}

// ----------------------------------------------------
// Restaurant Performance Score, Reviews & Community Recognition Types
// ----------------------------------------------------
export type ReviewSource = 'google' | 'yelp' | 'opentable' | 'tripadvisor';

export interface GuestReview {
  id: string;
  source: ReviewSource;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1 - 5
  publishedDate: string;
  reviewText: string;
  sentiment: 'positive' | 'delighted' | 'neutral' | 'critical';
  mentionedEmployeeIds?: string[];
  mentionedEmployeeNames?: string[];
  dishTags?: string[];
  serviceTags?: string[];
  snapshotGenerated: boolean;
  postedToCommunity: boolean;
  communityPostId?: string;
  verifiedDiner?: boolean;
}

export interface RestaurantPerformanceScore {
  overallScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'C';
  trendDirection: 'up' | 'stable' | 'down';
  trendPercentage: number;

  // Pillars breakdown
  googleRating: number; // e.g. 4.9
  googleReviewCount: number;
  yelpRating: number; // e.g. 4.8
  yelpReviewCount: number;
  openTableRating: number; // e.g. 4.9
  tripAdvisorRating: number; // e.g. 4.7

  hospitalityDelightScore: number; // 0 - 100
  foodAndCocktailQualityScore: number; // 0 - 100
  foodAndAlcoholComplianceScore: number; // 0 - 100 (based on valid RBS & Food Handler cards)
  laborBudgetEfficiencyScore: number; // 0 - 100
  teamMoraleSatisfactionScore: number; // 0 - 100 (e.g. 98%)

  recent5StarCountThisMonth: number;
  totalKudosSharedThisMonth: number;
}

export interface ReviewSnapshotCardData {
  id: string;
  review: GuestReview;
  restaurantName: string;
  themeStyle: 'gold_luxury' | 'bistro_neon' | 'emerald_vip' | 'sunset_chic';
  customHeadline?: string;
  highlightedQuote?: string;
  celebratedEmployeeName?: string;
  celebratedEmployeeRole?: string;
  celebratedEmployeeAvatar?: string;
  awardedKudosPoints: number;
  generatedAt: string;
}

export interface CommunityCelebrationReaction {
  type: 'clap' | 'fire' | 'heart' | 'star' | 'rocket';
  count: number;
  employeeIds: string[];
}

// ----------------------------------------------------
// POS Department Mapping & Live Labor-to-Sales Tracking Types
// (Toast, Square, Clover, NCR Aloha)
// ----------------------------------------------------
export interface POSRevenueCenterMapping {
  id: string;
  posRevenueCenter: string; // e.g. "Main Dining Room", "Patio Garden", "Main Bar", "Takeout / Delivery", "Private Dining"
  department: Department;
  salesAllocationPct: number; // 0 - 100%
  description?: string;
  active: boolean;
}

export interface POSJobCodeMapping {
  id: string;
  posJobCode: string; // e.g. "SRV_101", "BART_201", "COOK_301", "PREP_401", "MGR_501"
  posJobTitle: string; // e.g. "Dining Room Server", "Craft Bartender", "Line Cook", "Dishwasher", "Floor Supervisor"
  department: Department;
  defaultHourlyWage: number;
  targetLaborPct: number; // e.g. 10.5%
  active: boolean;
}

export interface POSSalesCategoryMapping {
  id: string;
  posCategory: string; // e.g. "Entrees & Steaks", "Cocktails & Spirits", "Draft & Bottled Beer", "Wine by Bottle", "Appetizers", "Desserts", "Takeout Catering"
  department: Department;
  contributionPct: number; // e.g. 100%
  targetLaborRatioPct: number; // expected labor ratio for this category
  active: boolean;
}

export interface DepartmentEfficiencyConfig {
  targetLaborPct: number; // e.g. FOH: 10.0%, BOH: 11.0%, Bar: 4.5%, Prep/Dish: 2.5%, Management: 3.5%
  targetSplh: number; // Sales per labor hour ($/hr), e.g. FOH: $280, Bar: $340, BOH: $210, Prep: $450, Mgmt: $550
  maxOvertimeHours: number; // Overtime warning threshold
  minActiveStaff: number; // Minimum staffing floor
}

export interface POSDepartmentMapping {
  posPlatformId: POSPlatformId;
  posPlatformName: string;
  locationId: string;
  locationName: string;
  presetTemplate: 'bistro_full_service' | 'high_volume_bar_grill' | 'fast_casual_counter' | 'fine_dining_lounge' | 'custom';
  lastUpdated: string;
  autoSyncEnabled: boolean;
  revenueCenterMappings: POSRevenueCenterMapping[];
  jobCodeMappings: POSJobCodeMapping[];
  salesCategoryMappings: POSSalesCategoryMapping[];
  departmentTargets: Record<Department, DepartmentEfficiencyConfig>;
}

export interface DepartmentLiveEfficiencyMetric {
  department: Department;
  posPlatformId: POSPlatformId;
  activeStaffClockedIn: number;
  totalHoursToday: number;
  avgHourlyWage: number;
  liveLaborCost: number;
  liveMappedSales: number;
  liveLaborPct: number;
  targetLaborPct: number;
  varianceLaborPct: number; // positive = over target, negative = under target (good)
  liveSplh: number; // Sales per labor hour ($/hr)
  targetSplh: number;
  splhEfficiencyIndex: number; // 0 - 100 score
  salesSharePct: number; // % of restaurant total sales
  laborSharePct: number; // % of restaurant total labor cost
  status: 'optimal' | 'lean_floor_risk' | 'high_labor_warning';
  activeJobCodesCount: number;
  activeRevenueCentersCount: number;
  recommendation: string;
}

export type ReminderCategory = 'pre_shift' | 'training' | 'station_task' | 'compliance' | 'personal' | 'team_huddle';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EmployeeDailyReminder {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  title: string;
  description?: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  isCompleted: boolean;
  notifyApp: boolean;
  notifySms?: boolean;
}

export type HabitCategory = 'punctuality' | 'service_excellence' | 'station_readiness' | 'wellness_hydration' | 'learning_upsell';

export interface EmployeeHabit {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  category: HabitCategory;
  iconName?: string;
  targetDaysPerWeek: number; // 1-7
  streakCount: number;
  bestStreak: number;
  createdAt: string;
  active: boolean;
}

export interface EmployeeHabitLog {
  id: string;
  habitId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export type GoalCategory = 'hospitality_service' | 'speed_efficiency' | 'career_promotion' | 'certification' | 'financial_tips';
export type GoalStatus = 'in_progress' | 'completed' | 'on_track' | 'needs_focus';

export interface EmployeeGoal {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string; // YYYY-MM-DD
  progressPct: number; // 0 to 100
  status: GoalStatus;
  metrics?: {
    currentValue: number;
    targetValue: number;
    unit: string;
  };
  milestones: {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
  actionPlan: string;
}

// ----------------------------------------------------
// AI Command Center & Autonomous Operations Types
// ----------------------------------------------------

export type ShiftForceTier = 'employee' | 'manager' | 'ai_pro' | 'enterprise';

export interface RescueCandidateRanked {
  employeeId: string;
  name: string;
  role: RestaurantRole;
  department: Department;
  hourlyWage: number;
  matchScore: number; // 0-100
  availabilityStatus: 'open' | 'preferred' | 'neutral';
  overtimeRisk: 'none' | 'low' | 'high';
  currentWeeklyHours: number;
  projectedWeeklyHours: number;
  distanceMiles: number;
  estimatedTravelMins: number;
  seniorityMonths: number;
  certifications: string[];
  estimatedCostDelta: number; // e.g. +$84
  fitSummary: string;
  contactChannels: ('sms' | 'app' | 'whatsapp')[];
}

export interface ShiftRescueEvent {
  id: string;
  calledOutEmployeeId: string;
  calledOutEmployeeName: string;
  calledOutRole: RestaurantRole;
  calledOutDepartment: Department;
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  reason: string;
  urgency: 'critical' | 'high' | 'medium';
  rankedCandidates: RescueCandidateRanked[];
  selectedCandidateId?: string;
  status: 'active_rescue' | 'broadcast_sent' | 'accepted' | 'resolved';
  offerBroadcastSentAt?: string;
  offerExpiresInSeconds?: number;
}

export interface NoShowRiskShift {
  shiftId: string;
  employeeId: string;
  employeeName: string;
  role: RestaurantRole;
  department: Department;
  date: string;
  startTime: string;
  endTime: string;
  riskLevel: 'elevated' | 'moderate' | 'nominal';
  riskScore: number; // 0-100
  primaryRiskDrivers: string[];
  preventativeMitigations: string[];
  dispatchedCheckIn: boolean;
}

export interface ScheduleHealthPillars {
  overallScore: number; // 0-100
  coverageScore: number;
  overtimeScore: number;
  fairnessScore: number;
  employeePreferenceScore: number;
  skillCoverageScore: number;
  laborCostScore: number;
  detectedIssues: {
    type: 'burnout' | 'fairness' | 'skill_gap' | 'overtime' | 'clopening' | 'compliance';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    affectedEmployees?: string[];
    suggestedFix?: string;
  }[];
  fairnessDistribution: {
    weekendShiftsVariance: string;
    closingShiftsVariance: string;
    holidayParityRating: string;
    hoursEquityIndex: string;
  };
}

export interface DemandHourlyForecast {
  hour: string; // e.g. "11:00", "12:00"
  projectedSales: number;
  reservationsCovers: number;
  weatherImpact: string; // "+5% Sunny"
  recommendedStaffCount: number;
  scheduledStaffCount: number;
  clockedInStaffCount?: number;
  varianceStatus: 'optimal' | 'understaffed' | 'overstaffed';
  suggestedDepartmentAllocation: Record<Department, number>;
}

export interface WhatIfScenarioConfig {
  salesDeltaPercent: number; // e.g. +20%
  weatherCondition: 'normal' | 'rainy' | 'extreme_heat' | 'major_sports_event' | 'holiday_rush';
  specialEventMultiplier: number;
  targetLaborCostPct: number;
  recalculatedLaborCostPct: number;
  recalculatedWeeklyBudget: number;
  additionalStaffNeededByDept: Record<Department, number>;
  simulationNotes: string;
}

export interface ShiftBiddingListing {
  id: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: RestaurantRole;
  department: Department;
  hourlyRate: number;
  incentiveBonus?: number; // e.g. +$25 rush bonus
  stationNotes?: string;
  bids: {
    employeeId: string;
    employeeName: string;
    bidTimestamp: string;
    qualificationsMet: boolean;
    causesOvertime: boolean;
    overtimeHours: number;
    seniorityRank: number;
    managerApproved?: boolean;
  }[];
  status: 'open' | 'awarded' | 'expired';
  postedBy: string;
}

export interface ManagerMorningBriefingData {
  date: string;
  totalScheduledEmployees: number;
  lateRiskCount: number;
  openShiftsCount: number;
  projectedSales: number;
  projectedLaborCostPct: number;
  understaffedWindows: string[];
  vipReservationsCount: number;
  weatherForecast: string;
  supervisorOnDuty: string;
  urgentActionItems: string[];
}

export interface EndOfDayReportData {
  date: string;
  attendanceRatePct: number;
  onTimeClockIns: number;
  tardinessCount: number;
  noShowCount: number;
  totalActualLaborCost: number;
  totalActualSales: number;
  laborEfficiencyPct: number;
  overtimeHoursLogged: number;
  guestReviewHighlights: string;
  managerHandoffSummary: string;
}

export interface CrossTrainingBottleneck {
  department: Department;
  criticalSkill: string;
  currentCertifiedCount: number;
  requiredMinimum: number;
  riskStatus: 'bottleneck' | 'adequate' | 'robust';
  recommendedCandidatesToCrossTrain: {
    employeeId: string;
    name: string;
    currentRole: RestaurantRole;
    trainingReadinessScore: number;
    estimatedTrainingHours: number;
  }[];
}

export interface MultiLocationUnitSummary {
  locationId: string;
  name: string;
  address: string;
  activeStaffCount: number;
  scheduledLaborPct: number;
  targetLaborPct: number;
  openUncoveredShifts: number;
  overtimeRiskEmployees: number;
  healthScore: number;
  sharedEmployeesAvailable: number;
}

// ----------------------------------------------------
// Enterprise Hierarchy & Multi-Agent Swarm Types
// ----------------------------------------------------

export type HierarchyLevel = 'organization' | 'brand' | 'country' | 'region' | 'district' | 'location' | 'department' | 'team';

export interface HierarchyNode {
  id: string;
  name: string;
  level: HierarchyLevel;
  parentId?: string;
  childrenCount?: number;
  locationsCount: number;
  activeHeadcount: number;
  laborTargetPct: number;
  actualLaborPct: number;
  weeklyBudgetDollars: number;
  overtimeRiskCount: number;
  healthScore: number;
}

export type AIAgentRole =
  | 'scheduling_agent'
  | 'coverage_agent'
  | 'labor_agent'
  | 'compliance_agent'
  | 'training_agent'
  | 'operations_agent'
  | 'analytics_agent'
  | 'executive_agent';

export interface ShiftForceAIAgent {
  id: AIAgentRole;
  name: string;
  title: string;
  avatarIcon: string;
  status: 'active' | 'analyzing' | 'collaborating' | 'standby';
  description: string;
  specialization: string;
  recentAction: string;
  autonomousCapability: string;
}

export interface ShiftForceIntelligenceOverview {
  analyzedLocationsCount: number;
  projectedBudgetOveragesCount: number;
  seriousStaffingShortagesCount: number;
  employeesApproachingOvertimeCount: number;
  expiringCertificationsCount: number;
  regionalOvertimeVariancePct: number;
  regionalOvertimeVarianceName: string;
  monthlyOptimizationOpportunityDollars: number;
  topInsights: {
    id: string;
    title: string;
    description: string;
    impactLevel: 'high' | 'medium' | 'critical';
    agentSource: AIAgentRole;
    actionLabel: string;
    suggestedActionCommand: string;
  }[];
}

export interface EnterpriseModuleTier {
  id: string;
  moduleName: string;
  tagline: string;
  category: 'core' | 'operations' | 'growth' | 'enterprise';
  includedInTiers: ShiftForceTier[];
  isActive: boolean;
  featureHighlights: string[];
}

export interface CorporateTaskChecklist {
  id: string;
  title: string;
  assignedScope: string; // e.g. "All 847 Locations" | "Northeast District"
  cadence: 'daily_opening' | 'daily_closing' | 'weekly_deep_clean' | 'food_safety_audit';
  requiresPhotoVerification: boolean;
  completionRatePct: number;
  totalSubmissions: number;
  criticalIssuesFlagged: number;
  lastUpdated: string;
}

export interface EnterpriseAuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  scopeLocation: string;
  actionCategory: 'schedule_override' | 'rate_adjustment' | 'policy_update' | 'punch_edit' | 'agent_action' | 'sso_provision';
  details: string;
  ipAddress: string;
  status: 'success' | 'flagged_for_review' | 'prevented_by_guardrail';
}

export interface ProactiveIntelligenceInsight {
  id: string;
  title: string;
  category: 'labor_cost' | 'coverage_staffing' | 'wellbeing_retention' | 'compliance_guard' | 'guest_experience';
  impactLevel: 'critical' | 'high' | 'medium';
  agentSource: AIAgentRole;
  sourceModule: 'schedule' | 'pos_sales' | 'performance_reviews' | 'compliance' | 'hr_payroll' | 'attendance';
  headlineMetric: string;
  metricLabel: string;
  description: string;
  rootCauseAnalysis: string;
  suggestedActionCommand: string;
  actionLabel: string;
  estimatedFinancialImpact: number; // e.g. monthly savings or upside in USD
  confidenceScore: number; // e.g. 96 (%)
  urgency: 'immediate' | 'within_24h' | 'weekly_cycle';
}

export interface LaborOptimizationStrategy {
  id: string;
  strategyName: string;
  category: 'overtime_reduction' | 'midday_trimming' | 'cross_training_fill' | 'rush_hour_capture' | 'break_staggering';
  monthlySavings: number;
  implementationEffort: 'automated_1_click' | 'schedule_tweak' | 'manager_approval_required';
  description: string;
  projectedLaborPctImpact: number; // e.g. -1.4%
  targetDepartment: string;
  affectedShiftsCount: number;
  status: 'recommended' | 'applied' | 'dismissed';
}

export interface WorkforceCriticalAlertItem {
  id: string;
  severity: 'critical' | 'high' | 'notice';
  timestamp: string;
  alertType: 'clopening_violation' | 'overtime_velocity' | 'expiring_certification' | 'weather_demand_surge' | 'repeated_late_punch' | 'minor_curfew_risk';
  title: string;
  affectedEntity: string;
  department: string;
  details: string;
  mitigationPlaybook: string;
  actionCommand: string;
  actionButtonLabel: string;
  isResolved: boolean;
}

export interface ModuleHealthScorecard {
  moduleId: string;
  moduleName: string;
  healthScore: number; // 0-100
  status: 'optimal' | 'attention_needed' | 'critical_variance';
  activeMetricsSummary: string;
  syncStatus: 'real_time_synced' | 'synced_5m_ago' | 'simulated_live';
  dataPointsAnalyzedCount: number;
}

// ----------------------------------------------------
// Role-Based Access Control (RBAC) & Hierarchy Scoping Types
// ----------------------------------------------------

export interface RBACPermission {
  allowedTabs: ActiveTab[];
  canViewWagesAndBudgets: boolean;
  canEditSchedules: boolean;
  canApproveTimeOff: boolean;
  canManageEmployees: boolean;
  canExecuteAIActions: boolean;
  canExportPayroll: boolean;
  canManageRBAC: boolean;
  canViewAllLocations: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  code: string;
  description: string;
  badgeColor: string;
  hierarchyScopeLevel: HierarchyLevel;
  assignedHierarchyPath: string; // e.g. "ShiftForce Global Hospitality Corp" or "Pacific West Coast Region (CA, WA, OR)" or "Downtown Flagship #101"
  assignedNodeId: string; // e.g. "node-corp-01", "node-region-01", "node-loc-01"
  authorizedLocationIds?: string[];
  permissions: RBACPermission;
  isCustom: boolean;
  userCount: number;
  createdAt?: string;
  createdBy?: string;
}

export interface RBACManagerState {
  roles: CustomRole[];
  activeRoleId: string;
  simulationModeActive: boolean;
  auditTrail: {
    id: string;
    timestamp: string;
    action: string;
    roleName: string;
    details: string;
  }[];
}

// ----------------------------------------------------
// Authentication & Dual Login Session Types
// ----------------------------------------------------

export type AuthPortalMode = 'admin' | 'employee';

export interface AdminLoginCredentials {
  email: string;
  password?: string;
  roleId: string;
  twoFactorCode?: string;
  rememberDevice: boolean;
}

export interface EmployeeLoginCredentials {
  employeeIdOrPhone: string;
  pinCode?: string;
  selectedEmployeeId?: string;
  rememberDevice: boolean;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorUserId: string;
  actorEmployeeId?: string;
  actorDisplayName?: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AttendancePunch {
  id: string;
  organizationId?: string;
  employeeId: string;
  employeeName: string;
  shiftId?: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: string;
  location?: string;
  isVerified?: boolean;
  notes?: string;
}

export interface ShiftTradeRequest {
  id: string;
  organizationId?: string;
  requesterId: string;
  requesterName: string;
  requesterShiftId: string;
  targetId?: string;
  targetName?: string;
  targetShiftId?: string;
  status: 'pending' | 'accepted' | 'approved' | 'rejected' | 'declined';
  reason?: string;
  createdAt: string;
}

export interface AuthUserSession {
  isAuthenticated: boolean;
  organizationId?: string;
  userType: AuthPortalMode;
  adminRole?: CustomRole;
  employee?: Employee;
  displayName: string;
  displayEmail: string;
  avatarUrl?: string;
  loginTimestamp: string;
  sessionToken: string;
  authMethod: 'credentials' | 'pin' | 'sso' | 'quick_select' | 'google_oauth';
  isHostOrAdminPayer: boolean;
}

export interface POSLaborAlert {
  id: string;
  department: Department;
  severity: 'critical' | 'warning' | 'info';
  liveLaborPct: number;
  budgetThresholdPct: number;
  variancePct: number;
  dollarVariance: number;
  liveSales: number;
  liveLaborCost: number;
  timestamp: string;
  posPlatformId: POSPlatformId;
  message: string;
  recommendedAction: string;
  acknowledged?: boolean;
  acknowledgedAt?: string;
}



export type EnterpriseAccessLevel = 'company' | 'region' | 'location' | 'department' | 'employee';

export interface CompanyLocation {
  id: string;
  organizationId: string;
  name: string;
  code?: string;
  regionId?: string;
  districtId?: string;
  address?: string;
  timezone: string;
  active: boolean;
  createdAt: string;
}

export interface CompanyRegion {
  id: string;
  organizationId: string;
  name: string;
  active: boolean;
  locationIds: string[];
}

export interface EnterpriseOrganization {
  id: string;
  name: string;
  legalName?: string;
  active: boolean;
  ownerUid: string;
  regionIds: string[];
  locationIds: string[];
  subscriptionTierId: string;
  billingCycle: 'monthly' | 'annual';
  createdAt: string;
}

export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';

export interface OrganizationBillingState {
  organizationId: string;
  tierId: string;
  billingCycle: 'monthly' | 'annual';
  status: SubscriptionStatus;
  activeLocationCount: number;
  employeeLimit: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt: string;
}

export interface OrganizationMembership {
  organizationId: string;
  userUid: string;
  accessLevel: EnterpriseAccessLevel;
  roleCode: string;
  authorizedRegionIds: string[];
  authorizedLocationIds: string[] | ['*'];
  canViewAllLocations: boolean;
  active: boolean;
}