import {
  ShiftRescueEvent,
  NoShowRiskShift,
  ScheduleHealthPillars,
  DemandHourlyForecast,
  WhatIfScenarioConfig,
  ShiftBiddingListing,
  ManagerMorningBriefingData,
  EndOfDayReportData,
  CrossTrainingBottleneck,
  MultiLocationUnitSummary,
  HierarchyNode,
  WorkqoraAIAgent,
  WorkqoraIntelligenceOverview,
  EnterpriseModuleTier,
  CorporateTaskChecklist,
  EnterpriseAuditLogEntry,
  ProactiveIntelligenceInsight,
  LaborOptimizationStrategy,
  WorkforceCriticalAlertItem,
  ModuleHealthScorecard
} from '../types';

export const INITIAL_SHIFT_RESCUE_EVENTS: ShiftRescueEvent[] = [
  {
    id: 'rescue-001',
    calledOutEmployeeId: 'emp-4',
    calledOutEmployeeName: 'Mateo Morales',
    calledOutRole: 'Line Cook',
    calledOutDepartment: 'Back of House',
    shiftId: 'shift-rescue-today-dinner',
    shiftDate: '2026-08-14',
    shiftTime: '16:30 - 23:00 (Dinner Rush)',
    reason: 'Sudden high fever & sore throat (BOH Food Safety Protocol)',
    urgency: 'critical',
    status: 'active_rescue',
    rankedCandidates: [
      {
        employeeId: 'emp-9',
        name: 'Kenji Takahashi',
        role: 'Sous Chef',
        department: 'Back of House',
        hourlyWage: 27.0,
        matchScore: 98,
        availabilityStatus: 'open',
        overtimeRisk: 'none',
        currentWeeklyHours: 29.5,
        projectedWeeklyHours: 36.0,
        distanceMiles: 2.1,
        estimatedTravelMins: 12,
        seniorityMonths: 45,
        certifications: ['ServSafe Food Protection Manager', 'Sauté/Grill Master', 'Knife Skills Lead'],
        estimatedCostDelta: 84.50,
        fitSummary: 'Highest rated replacement: Available tonight, 0 overtime impact (36h max), lives 12 min away, master sauté certified.',
        contactChannels: ['sms', 'app', 'whatsapp']
      },
      {
        employeeId: 'emp-11',
        name: 'Somchai Prasert',
        role: 'Prep Cook',
        department: 'Kitchen Prep & Dish',
        hourlyWage: 19.5,
        matchScore: 89,
        availabilityStatus: 'preferred',
        overtimeRisk: 'none',
        currentWeeklyHours: 28.0,
        projectedWeeklyHours: 34.5,
        distanceMiles: 3.4,
        estimatedTravelMins: 18,
        seniorityMonths: 34,
        certifications: ['State Health Dept Food Handler', 'Line Prep Cross-Trained'],
        estimatedCostDelta: 58.50,
        fitSummary: 'Strong cost-effective match: Fully cross-trained on dinner grill/line, 0 overtime, 18 min travel time.',
        contactChannels: ['sms', 'app']
      },
      {
        employeeId: 'emp-2',
        name: 'Marcus Vance',
        role: 'Head Chef',
        department: 'Back of House',
        hourlyWage: 32.0,
        matchScore: 82,
        availabilityStatus: 'neutral',
        overtimeRisk: 'low',
        currentWeeklyHours: 34.0,
        projectedWeeklyHours: 40.5,
        distanceMiles: 4.8,
        estimatedTravelMins: 22,
        seniorityMonths: 47,
        certifications: ['Executive Culinary Manager', 'ServSafe Master'],
        estimatedCostDelta: 112.00,
        fitSummary: 'Executive backup: Expert chef, incurs minor 0.5h overtime, high reliability.',
        contactChannels: ['app', 'whatsapp']
      }
    ]
  },
  {
    id: 'rescue-002',
    calledOutEmployeeId: 'emp-10',
    calledOutEmployeeName: 'Priya Sharma',
    calledOutRole: 'Bartender',
    calledOutDepartment: 'Bar & Beverage',
    shiftId: 'shift-rescue-tomorrow-bar',
    shiftDate: '2026-08-15',
    shiftTime: '17:00 - 01:00 (Weekend Night)',
    reason: 'Family transportation emergency',
    urgency: 'high',
    status: 'active_rescue',
    rankedCandidates: [
      {
        employeeId: 'emp-3',
        name: 'Sophia Chen',
        role: 'Lead Bartender',
        department: 'Bar & Beverage',
        hourlyWage: 26.0,
        matchScore: 96,
        availabilityStatus: 'open',
        overtimeRisk: 'none',
        currentWeeklyHours: 24.0,
        projectedWeeklyHours: 32.0,
        distanceMiles: 1.8,
        estimatedTravelMins: 10,
        seniorityMonths: 43,
        certifications: ['TIPS On-Premise', 'California RBS Certified', 'Cocktail Lead'],
        estimatedCostDelta: 92.00,
        fitSummary: 'Prime match: Lead mixologist, open availability, California RBS verified, 0 overtime risk.',
        contactChannels: ['sms', 'app', 'whatsapp']
      },
      {
        employeeId: 'emp-1',
        name: 'Elena Rostova',
        role: 'Head Server',
        department: 'Front of House',
        hourlyWage: 24.5,
        matchScore: 84,
        availabilityStatus: 'preferred',
        overtimeRisk: 'none',
        currentWeeklyHours: 28.0,
        projectedWeeklyHours: 36.0,
        distanceMiles: 2.5,
        estimatedTravelMins: 14,
        seniorityMonths: 40,
        certifications: ['California RBS', 'Sommelier L1', 'Bar Cross-Trained'],
        estimatedCostDelta: 88.00,
        fitSummary: 'Cross-trained beverage lead: Certified sommelier & RBS valid, perfect for Saturday wine and craft cocktails.',
        contactChannels: ['sms', 'app']
      }
    ]
  }
];

export const INITIAL_NO_SHOW_RISK_SHIFTS: NoShowRiskShift[] = [
  {
    shiftId: 'shift-risk-001',
    employeeId: 'emp-12',
    employeeName: 'Hannah Brooks',
    role: 'Busser',
    department: 'Front of House',
    date: '2026-08-15',
    startTime: '08:00',
    endTime: '15:30',
    riskLevel: 'elevated',
    riskScore: 78,
    primaryRiskDrivers: [
      'Close-Open Clopening shift (Friday closes at 23:30, Saturday opens at 08:00 - only 8.5h turnaround)',
      'High transit congestion predicted on coastal bus route Saturday morning',
      '4th consecutive working day'
    ],
    preventativeMitigations: [
      'Send automated 12-hour pre-shift check-in SMS with 1-tap confirmation',
      'Offer optional +30 min delayed start (08:30) with morning host covering initial opening',
      'Auto-queue standby replacement (Liam O\'Connor) on gentle standby'
    ],
    dispatchedCheckIn: false
  },
  {
    shiftId: 'shift-risk-002',
    employeeId: 'emp-7',
    employeeName: 'Liam O\'Connor',
    role: 'Dishwasher',
    department: 'Kitchen Prep & Dish',
    date: '2026-08-16',
    startTime: '17:00',
    endTime: '23:30',
    riskLevel: 'moderate',
    riskScore: 54,
    primaryRiskDrivers: [
      'Scheduled 5th consecutive evening shift',
      'Historical Sunday evening tardiness cluster'
    ],
    preventativeMitigations: [
      'Proactive WhatsApp shift reminder dispatched 24h prior',
      'Assign closing team helper for final 45-min station breakdown'
    ],
    dispatchedCheckIn: true
  }
];

export const INITIAL_SCHEDULE_HEALTH_PILLARS: ScheduleHealthPillars = {
  overallScore: 93,
  coverageScore: 96,
  overtimeScore: 91,
  fairnessScore: 94,
  employeePreferenceScore: 89,
  skillCoverageScore: 97,
  laborCostScore: 92,
  detectedIssues: [
    {
      type: 'clopening',
      severity: 'medium',
      title: 'Clopening Turnaround Warning (< 10h)',
      description: 'Hannah Brooks is scheduled to close Friday at 23:30 and open Saturday at 08:00 (8.5h rest).',
      affectedEmployees: ['Hannah Brooks'],
      suggestedFix: 'Swap Saturday morning busser shift to Liam O\'Connor or delay opening to 09:00.'
    },
    {
      type: 'overtime',
      severity: 'low',
      title: 'Overtime Threshold Warning (38.5h)',
      description: 'Marcus Vance is projected at 39.5 hours. A 30-minute unscheduled extension would trigger 1.5x overtime.',
      affectedEmployees: ['Marcus Vance'],
      suggestedFix: 'Cap Sunday kitchen prep shift at 5.5 hours to lock weekly total at 38.0h.'
    },
    {
      type: 'skill_gap',
      severity: 'low',
      title: 'Sunday Brunch RBS Bar Coverage',
      description: 'Sunday 11:00 AM - 14:00 PM has 1 bartender scheduled during high-volume mimosa rush.',
      affectedEmployees: ['Sophia Chen'],
      suggestedFix: 'Add 1 cross-trained RBS certified server (Elena Rostova) for peak 2-hour rush.'
    }
  ],
  fairnessDistribution: {
    weekendShiftsVariance: 'Low (±0.4 shifts per team member)',
    closingShiftsVariance: 'Even (Equal 2-close rotation per FOH server)',
    holidayParityRating: '98% Equitable Historical Distribution',
    hoursEquityIndex: '0.94 (Near perfect target hour matching)'
  }
};

export const INITIAL_DEMAND_HOURLY_FORECAST: DemandHourlyForecast[] = [
  { hour: '10:00', projectedSales: 450, reservationsCovers: 12, weatherImpact: '+2% Sunny 74°F', recommendedStaffCount: 4, scheduledStaffCount: 4, clockedInStaffCount: 4, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 1, 'Back of House': 2, 'Bar & Beverage': 0, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '11:00', projectedSales: 1100, reservationsCovers: 28, weatherImpact: '+4% Lunch Traffic', recommendedStaffCount: 6, scheduledStaffCount: 6, clockedInStaffCount: 6, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 2, 'Back of House': 2, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '12:00', projectedSales: 2200, reservationsCovers: 55, weatherImpact: '+6% Peak Lunch Rush', recommendedStaffCount: 9, scheduledStaffCount: 9, clockedInStaffCount: 9, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 4, 'Back of House': 3, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '13:00', projectedSales: 1800, reservationsCovers: 42, weatherImpact: '+3% Regular', recommendedStaffCount: 8, scheduledStaffCount: 8, clockedInStaffCount: 8, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 3, 'Back of House': 3, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '14:00', projectedSales: 750, reservationsCovers: 16, weatherImpact: 'Midday Slowdown', recommendedStaffCount: 4, scheduledStaffCount: 5, clockedInStaffCount: 5, varianceStatus: 'overstaffed', suggestedDepartmentAllocation: { 'Front of House': 1, 'Back of House': 1, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '15:00', projectedSales: 600, reservationsCovers: 10, weatherImpact: 'Midday Prep Block', recommendedStaffCount: 4, scheduledStaffCount: 4, clockedInStaffCount: 4, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 1, 'Back of House': 1, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '16:00', projectedSales: 1200, reservationsCovers: 30, weatherImpact: '+5% Happy Hour Start', recommendedStaffCount: 7, scheduledStaffCount: 7, clockedInStaffCount: 7, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 2, 'Back of House': 2, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '17:00', projectedSales: 2800, reservationsCovers: 68, weatherImpact: '+8% Dinner Opening', recommendedStaffCount: 11, scheduledStaffCount: 11, clockedInStaffCount: 10, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 4, 'Back of House': 4, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '18:00', projectedSales: 4100, reservationsCovers: 94, weatherImpact: '+12% Prime Dinner Rush', recommendedStaffCount: 14, scheduledStaffCount: 13, clockedInStaffCount: 13, varianceStatus: 'understaffed', suggestedDepartmentAllocation: { 'Front of House': 6, 'Back of House': 5, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '19:00', projectedSales: 4600, reservationsCovers: 105, weatherImpact: '+14% Concert Event Downtown', recommendedStaffCount: 15, scheduledStaffCount: 14, clockedInStaffCount: 14, varianceStatus: 'understaffed', suggestedDepartmentAllocation: { 'Front of House': 6, 'Back of House': 5, 'Bar & Beverage': 3, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '20:00', projectedSales: 3900, reservationsCovers: 82, weatherImpact: '+10% Dinner Service', recommendedStaffCount: 13, scheduledStaffCount: 13, clockedInStaffCount: 13, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 5, 'Back of House': 4, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 2, 'Management': 0 } },
  { hour: '21:00', projectedSales: 2400, reservationsCovers: 45, weatherImpact: '+5% Late Dining & Bar', recommendedStaffCount: 9, scheduledStaffCount: 9, clockedInStaffCount: 9, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 3, 'Back of House': 3, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '22:00', projectedSales: 1300, reservationsCovers: 20, weatherImpact: 'Bar Lounge & Closing', recommendedStaffCount: 6, scheduledStaffCount: 6, clockedInStaffCount: 6, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 2, 'Back of House': 1, 'Bar & Beverage': 2, 'Kitchen Prep & Dish': 1, 'Management': 0 } },
  { hour: '23:00', projectedSales: 600, reservationsCovers: 5, weatherImpact: 'Kitchen Breakdown', recommendedStaffCount: 4, scheduledStaffCount: 4, clockedInStaffCount: 4, varianceStatus: 'optimal', suggestedDepartmentAllocation: { 'Front of House': 1, 'Back of House': 1, 'Bar & Beverage': 1, 'Kitchen Prep & Dish': 1, 'Management': 0 } }
];

export const INITIAL_WHAT_IF_CONFIG: WhatIfScenarioConfig = {
  salesDeltaPercent: 20,
  weatherCondition: 'major_sports_event',
  specialEventMultiplier: 1.25,
  targetLaborCostPct: 18.8,
  recalculatedLaborCostPct: 18.4,
  recalculatedWeeklyBudget: 38400,
  additionalStaffNeededByDept: {
    'Front of House': 2,
    'Back of House': 2,
    'Bar & Beverage': 1,
    'Kitchen Prep & Dish': 1,
    'Management': 0
  },
  simulationNotes: 'If Saturday sales surge +20% due to the Downtown Stadium playoff game, revenue increases from $27,400 to $32,880. Adding +2 Servers, +2 Line Cooks, +1 Bartender, and +1 Dishwasher ($1,140 total labor) maintains labor efficiency at a superior 18.4% (well below the 19% target) while guaranteeing table turnover speed under 42 minutes.'
};

export const INITIAL_SHIFT_BIDDING_LISTINGS: ShiftBiddingListing[] = [
  {
    id: 'bid-001',
    shiftId: 'shift-bid-sat-rush',
    date: '2026-08-15',
    startTime: '17:30',
    endTime: '23:30',
    role: 'Server',
    department: 'Front of House',
    hourlyRate: 20.00,
    incentiveBonus: 35.00,
    stationNotes: 'Saturday Main Patio & VIP Section. High tip potential ($180-$260 estimated).',
    postedBy: 'Jordan Rivera (GM)',
    status: 'open',
    bids: [
      {
        employeeId: 'emp-5',
        employeeName: 'Chloe Dubois',
        bidTimestamp: '2026-08-14 09:15',
        qualificationsMet: true,
        causesOvertime: false,
        overtimeHours: 0,
        seniorityRank: 2
      },
      {
        employeeId: 'emp-8',
        employeeName: 'Aaliyah Washington',
        bidTimestamp: '2026-08-14 09:42',
        qualificationsMet: true,
        causesOvertime: false,
        overtimeHours: 0,
        seniorityRank: 4
      }
    ]
  },
  {
    id: 'bid-002',
    shiftId: 'shift-bid-sun-grill',
    date: '2026-08-16',
    startTime: '16:00',
    endTime: '22:30',
    role: 'Grill Cook',
    department: 'Back of House',
    hourlyRate: 22.50,
    incentiveBonus: 25.00,
    stationNotes: 'Prime Rib & Seafood sauté rush station.',
    postedBy: 'Marcus Vance (Head Chef)',
    status: 'open',
    bids: [
      {
        employeeId: 'emp-4',
        employeeName: 'Mateo Morales',
        bidTimestamp: '2026-08-14 10:20',
        qualificationsMet: true,
        causesOvertime: false,
        overtimeHours: 0,
        seniorityRank: 1
      }
    ]
  }
];

export const INITIAL_MORNING_BRIEFING: ManagerMorningBriefingData = {
  date: 'Today • Friday, August 14, 2026',
  totalScheduledEmployees: 23,
  lateRiskCount: 2,
  openShiftsCount: 1,
  projectedSales: 27850,
  projectedLaborCostPct: 18.7,
  understaffedWindows: ['6:00 PM – 8:00 PM (Dinner Rush +1 Server needed)'],
  vipReservationsCount: 14,
  weatherForecast: '☀️ 78°F Sunny • Patio Seating 100% Open',
  supervisorOnDuty: 'Jordan Rivera (General Manager)',
  urgentActionItems: [
    'Resolve Mateo Morales sick call for 16:30 Line Cook shift (AI Rescue ranked Kenji Takahashi #1 match).',
    'Review 6 PM - 8 PM dinner rush FOH station assignment for private wine dining party of 16.',
    'Verify Hannah Brooks 12-hour pre-shift check-in response for Saturday morning opening.'
  ]
};

export const INITIAL_END_OF_DAY_REPORT: EndOfDayReportData = {
  date: 'Yesterday • Thursday, August 13, 2026',
  attendanceRatePct: 98.4,
  onTimeClockIns: 21,
  tardinessCount: 1,
  noShowCount: 0,
  totalActualLaborCost: 4892.50,
  totalActualSales: 26140.00,
  laborEfficiencyPct: 18.71,
  overtimeHoursLogged: 0.0,
  guestReviewHighlights: 'Received 3 verified 5-star reviews praising cocktail speed and table turnover.',
  managerHandoffSummary: 'BOH walk-in restocked and temp-logged at 37°F. POS sales closed at $26,140 (104% to budget). Dish sanitation chemical cycle completed.'
};

export const INITIAL_CROSS_TRAINING_BOTTLENECK: CrossTrainingBottleneck[] = [
  {
    department: 'Bar & Beverage',
    criticalSkill: 'California RBS Certified Lead Bartender',
    currentCertifiedCount: 2,
    requiredMinimum: 3,
    riskStatus: 'bottleneck',
    recommendedCandidatesToCrossTrain: [
      { employeeId: 'emp-1', name: 'Elena Rostova', currentRole: 'Head Server', trainingReadinessScore: 96, estimatedTrainingHours: 6 },
      { employeeId: 'emp-5', name: 'Chloe Dubois', currentRole: 'Server', trainingReadinessScore: 88, estimatedTrainingHours: 8 }
    ]
  },
  {
    department: 'Back of House',
    criticalSkill: 'ServSafe Food Protection Manager (Expediter)',
    currentCertifiedCount: 2,
    requiredMinimum: 3,
    riskStatus: 'bottleneck',
    recommendedCandidatesToCrossTrain: [
      { employeeId: 'emp-4', name: 'Mateo Morales', currentRole: 'Line Cook', trainingReadinessScore: 92, estimatedTrainingHours: 12 },
      { employeeId: 'emp-11', name: 'Somchai Prasert', currentRole: 'Prep Cook', trainingReadinessScore: 84, estimatedTrainingHours: 15 }
    ]
  }
];

export const INITIAL_MULTI_LOCATION_SUMMARY: MultiLocationUnitSummary[] = [
  {
    locationId: 'loc-01',
    name: 'Workqora Downtown Flagship',
    address: '742 Market St, San Francisco, CA',
    activeStaffCount: 24,
    scheduledLaborPct: 18.7,
    targetLaborPct: 19.0,
    openUncoveredShifts: 1,
    overtimeRiskEmployees: 1,
    healthScore: 94,
    sharedEmployeesAvailable: 5
  },
  {
    locationId: 'loc-02',
    name: 'Workqora Westside Bistro & Lounge',
    address: '1182 Wilshire Blvd, Santa Monica, CA',
    activeStaffCount: 18,
    scheduledLaborPct: 19.2,
    targetLaborPct: 19.5,
    openUncoveredShifts: 0,
    overtimeRiskEmployees: 0,
    healthScore: 96,
    sharedEmployeesAvailable: 4
  },
  {
    locationId: 'loc-03',
    name: 'Workqora Marina Bay Waterfront',
    address: '400 Yacht Club Way, San Diego, CA',
    activeStaffCount: 28,
    scheduledLaborPct: 20.1,
    targetLaborPct: 19.0,
    openUncoveredShifts: 2,
    overtimeRiskEmployees: 2,
    healthScore: 89,
    sharedEmployeesAvailable: 6
  },
  {
    locationId: 'loc-04',
    name: 'Workqora Airport Express Terminal 2',
    address: 'SFO International Terminal Hub, CA',
    activeStaffCount: 14,
    scheduledLaborPct: 17.9,
    targetLaborPct: 18.5,
    openUncoveredShifts: 0,
    overtimeRiskEmployees: 0,
    healthScore: 98,
    sharedEmployeesAvailable: 3
  }
];

export const INITIAL_AI_AGENTS_SWARM: WorkqoraAIAgent[] = [
  {
    id: 'scheduling_agent',
    name: 'Aura-Schedule',
    title: 'Scheduling & Constraint Agent',
    avatarIcon: 'Calendar',
    status: 'active',
    description: 'Builds, balances, and repairs schedules with zero violation of worker availability or rest periods.',
    specialization: 'Constraint Satisfaction & Clopening Prevention',
    recentAction: 'Auto-balanced 186 shifts for next week, achieving 94% preference satisfaction.',
    autonomousCapability: 'Autonomous Schedule Repair on demand shifts and employee swaps.'
  },
  {
    id: 'coverage_agent',
    name: 'Beacon-Rescue',
    title: 'Coverage & Call-Out Agent',
    avatarIcon: 'UserCheck',
    status: 'active',
    description: 'Instantly identifies, ranks, and broadcasts shift offers when call-outs occur.',
    specialization: 'Multi-Factor Candidate Ranking & 1-Tap Rescue',
    recentAction: 'Ranked 3 candidates for Mateo Morales call-out; Kenji Takahashi identified as #1 (0 OT, $84 cost).',
    autonomousCapability: 'Instant candidate matching across proximity, skills, and overtime impact.'
  },
  {
    id: 'labor_agent',
    name: 'Vault-Labor',
    title: 'Labor & Payroll Optimization Agent',
    avatarIcon: 'TrendingDown',
    status: 'analyzing',
    description: 'Monitors real-time Sales Per Labor Hour (SPLH), hourly labor %, and flags overtime creep.',
    specialization: 'Real-Time Labor Efficiency & Dynamic Budgeting',
    recentAction: 'Locked projected Friday labor at 18.7% ($480 under budget limit).',
    autonomousCapability: 'Dynamic mid-shift labor rebalancing suggestions.'
  },
  {
    id: 'compliance_agent',
    name: 'Guardian-Law',
    title: 'Labor Law & Policy Guardrail Agent',
    avatarIcon: 'ShieldAlert',
    status: 'active',
    description: 'Validates minor labor laws, meal break windows, rest periods, and predictable scheduling policies.',
    specialization: 'Predictive Scheduling Compliance & Rest Interval Auditing',
    recentAction: 'Prevented 1 clopening violation (<10h rest) on Saturday opening roster.',
    autonomousCapability: 'Automated policy exception escalation and audit reporting.'
  },
  {
    id: 'training_agent',
    name: 'Catalyst-LMS',
    title: 'Training & Certification Agent',
    avatarIcon: 'GraduationCap',
    status: 'active',
    description: 'Tracks certifications (ServSafe, RBS, TIPS), onboarding curricula, and cross-training readiness.',
    specialization: 'Skill Bottleneck Detection & Automated Learning Checklists',
    recentAction: 'Identified Bar & Beverage RBS bottleneck; nominated Elena Rostova for 6-hr fast track.',
    autonomousCapability: 'Automated onboarding pairing with certified trainers.'
  },
  {
    id: 'operations_agent',
    name: 'Nexus-Ops',
    title: 'Operations & Shift Handoff Agent',
    avatarIcon: 'CheckSquare',
    status: 'active',
    description: 'Compiles shift notes, equipment checklists, photo audits, and manager handoff briefings.',
    specialization: 'Daily Digital Logbook & Manager Shift Summaries',
    recentAction: 'Synthesized opening-to-dinner manager handoff with 3 critical food safety reminders.',
    autonomousCapability: 'Automated voice/text note extraction into actionable manager tasks.'
  },
  {
    id: 'analytics_agent',
    name: 'Spectra-Analytics',
    title: 'Forecasting & Workforce Analytics Agent',
    avatarIcon: 'BarChart2',
    status: 'collaborating',
    description: 'Analyzes weather, historical footfall, reservation covers, and multi-unit sales data.',
    specialization: 'Demand Forecasting & What-If Scenario Modeling',
    recentAction: 'Projected +20% dinner sales surge for downtown stadium event (+6 staff recommended).',
    autonomousCapability: 'Continuous multi-variable sales and labor demand modeling.'
  },
  {
    id: 'executive_agent',
    name: 'Apex-Executive',
    title: 'Corporate Executive & Enterprise Intelligence Agent',
    avatarIcon: 'Cpu',
    status: 'analyzing',
    description: 'Aggregates enterprise-wide KPIs across corporate, regions, districts, and stores.',
    specialization: 'Multi-Unit Telemetry & $184k Opportunity Identification',
    recentAction: 'Flagged 11.4% overtime surge across Northeast Region; prepared 1-tap district directive.',
    autonomousCapability: 'Autonomous multi-location variance anomaly detection.'
  }
];

export const INITIAL_ENTERPRISE_INTELLIGENCE: WorkqoraIntelligenceOverview = {
  analyzedLocationsCount: 847,
  projectedBudgetOveragesCount: 31,
  seriousStaffingShortagesCount: 14,
  employeesApproachingOvertimeCount: 127,
  expiringCertificationsCount: 38,
  regionalOvertimeVariancePct: 11.4,
  regionalOvertimeVarianceName: 'Northeast Region',
  monthlyOptimizationOpportunityDollars: 184000,
  topInsights: [
    {
      id: 'ins-01',
      title: 'Northeast Region Overtime Spike (+11.4%)',
      description: '31 stores in the Boston and NYC districts are scheduling 127 employees into 1.5x overtime due to unexpected summer tourist surges. Cross-location deployment from nearby sub-districts can eliminate $42,500 in weekly premium pay.',
      impactLevel: 'critical',
      agentSource: 'executive_agent',
      actionLabel: 'Deploy Cross-Location Staffing Pool',
      suggestedActionCommand: 'Activate cross-location staffing pool for 31 Northeast locations'
    },
    {
      id: 'ins-02',
      title: '38 Mandated Certifications Expiring Within 30 Days',
      description: 'California RBS and ServSafe Food Protection Manager certs expiring across West Coast region. Automatic training reminders and LMS modules ready for dispatch.',
      impactLevel: 'high',
      agentSource: 'training_agent',
      actionLabel: 'Dispatch Fast-Track Training Modules',
      suggestedActionCommand: 'Send renewal checklists to all 38 certified staff members'
    },
    {
      id: 'ins-03',
      title: '$184,000 / Month Labor Optimization Opportunity',
      description: 'AI Labor Agent identified 14-location recurring mid-day overstaffing between 14:00 and 16:00. Shifting 1.5 hours per store to prime dinner rush improves SPLH by 8.4%.',
      impactLevel: 'high',
      agentSource: 'labor_agent',
      actionLabel: 'Apply Optimal Daypart Curve',
      suggestedActionCommand: 'Apply recommended daypart staffing adjustments'
    }
  ]
};

export const INITIAL_ENTERPRISE_HIERARCHY: HierarchyNode[] = [
  {
    id: 'node-corp-01',
    name: 'Workqora Global Hospitality Corp',
    level: 'organization',
    locationsCount: 847,
    activeHeadcount: 14250,
    laborTargetPct: 18.5,
    actualLaborPct: 18.8,
    weeklyBudgetDollars: 4250000,
    overtimeRiskCount: 127,
    healthScore: 92
  },
  {
    id: 'node-brand-01',
    name: 'Workqora Prime Steakhouses & Grills',
    level: 'brand',
    parentId: 'node-corp-01',
    locationsCount: 420,
    activeHeadcount: 7800,
    laborTargetPct: 18.2,
    actualLaborPct: 18.4,
    weeklyBudgetDollars: 2450000,
    overtimeRiskCount: 58,
    healthScore: 94
  },
  {
    id: 'node-brand-02',
    name: 'Workqora Bistro & Cocktail Lounges',
    level: 'brand',
    parentId: 'node-corp-01',
    locationsCount: 427,
    activeHeadcount: 6450,
    laborTargetPct: 18.8,
    actualLaborPct: 19.1,
    weeklyBudgetDollars: 1800000,
    overtimeRiskCount: 69,
    healthScore: 91
  },
  {
    id: 'node-region-01',
    name: 'Pacific West Coast Region (CA, WA, OR)',
    level: 'region',
    parentId: 'node-brand-01',
    locationsCount: 142,
    activeHeadcount: 2650,
    laborTargetPct: 18.5,
    actualLaborPct: 18.6,
    weeklyBudgetDollars: 850000,
    overtimeRiskCount: 18,
    healthScore: 95
  },
  {
    id: 'node-region-02',
    name: 'Northeast Region (NY, MA, NJ, CT)',
    level: 'region',
    parentId: 'node-brand-01',
    locationsCount: 156,
    activeHeadcount: 2950,
    laborTargetPct: 18.0,
    actualLaborPct: 19.4,
    weeklyBudgetDollars: 980000,
    overtimeRiskCount: 64,
    healthScore: 86
  },
  {
    id: 'node-district-01',
    name: 'San Francisco Bay Area District #4',
    level: 'district',
    parentId: 'node-region-01',
    locationsCount: 22,
    activeHeadcount: 420,
    laborTargetPct: 18.5,
    actualLaborPct: 18.7,
    weeklyBudgetDollars: 135000,
    overtimeRiskCount: 4,
    healthScore: 94
  },
  {
    id: 'node-loc-01',
    name: 'Downtown Flagship #101',
    level: 'location',
    parentId: 'node-district-01',
    locationsCount: 1,
    activeHeadcount: 24,
    laborTargetPct: 18.8,
    actualLaborPct: 18.7,
    weeklyBudgetDollars: 8850,
    overtimeRiskCount: 1,
    healthScore: 94
  }
];

export const INITIAL_ENTERPRISE_MODULES: EnterpriseModuleTier[] = [
  {
    id: 'mod-schedule',
    moduleName: 'Workqora Schedule',
    tagline: 'AI Scheduling, Smart Availability, and Fair Roster Generation',
    category: 'core',
    includedInTiers: ['employee', 'manager', 'ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['Auto-Fill Algorithm', 'Fairness Engine', 'Open-Shift Marketplace', 'Clopening Detection']
  },
  {
    id: 'mod-time',
    moduleName: 'Workqora Time',
    tagline: 'Geofenced Mobile Clock-in, NFC/QR Kiosk, and Real-Time Punch Verification',
    category: 'core',
    includedInTiers: ['employee', 'manager', 'ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['Geofencing with Privacy Consent', 'QR/NFC Punch Stations', 'Missing Punch Auto-Fix', 'Late Alerts']
  },
  {
    id: 'mod-teams',
    moduleName: 'Workqora Teams',
    tagline: 'Targeted Team Communications, Read Receipts, and Emergency Broadcasts',
    category: 'operations',
    includedInTiers: ['employee', 'manager', 'ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['Location & Role Targeting', 'Emergency 1-Tap Broadcast', 'Anonymous Pulse Surveys', 'Shift Chatter']
  },
  {
    id: 'mod-tasks',
    moduleName: 'Workqora Tasks',
    tagline: 'Daily Operations Logbook, Opening/Closing Checklists & Photo Audits',
    category: 'operations',
    includedInTiers: ['manager', 'ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['Digital Manager Logbook', 'Photo Verification', 'Sanitation Checklists', 'Equipment Handoff']
  },
  {
    id: 'mod-learn',
    moduleName: 'Workqora Learn',
    tagline: 'LMS Module, SOP Knowledge Base, and Automated Employee Onboarding',
    category: 'growth',
    includedInTiers: ['ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['AI Training Quiz Generator', 'Digital Employee Handbook', 'Certification Tracking', 'Trainer Buddy Matching']
  },
  {
    id: 'mod-payroll',
    moduleName: 'Workqora Payroll',
    tagline: 'Live Payroll Preview, Tip Pooling, Compliance Guardrails & 1-Click Sync',
    category: 'core',
    includedInTiers: ['manager', 'ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['Gross Wage Preview', 'Tip Distribution Matrix', 'State Break Penalty Rules', 'Direct HRIS Sync']
  },
  {
    id: 'mod-insights',
    moduleName: 'Workqora Insights',
    tagline: 'Real-Time Labor-to-Sales Telemetry, Demand Curves & What-If Simulations',
    category: 'growth',
    includedInTiers: ['ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['POS Sales Integration', 'What-If Revenue Simulator', 'SPLH Benchmarking', 'Tardiness Heatmaps']
  },
  {
    id: 'mod-ai',
    moduleName: 'Workqora AI',
    tagline: 'Autonomous AI Shift Rescue, No-Show Early Warning & Copilot Swarm',
    category: 'growth',
    includedInTiers: ['ai_pro', 'enterprise'],
    isActive: true,
    featureHighlights: ['AI Shift Rescue (1-Tap Offer)', 'No-Show Probability Engine', 'Multi-Agent Swarm', 'Manager Morning Briefing']
  },
  {
    id: 'mod-enterprise',
    moduleName: 'Workqora Enterprise',
    tagline: 'Corporate Hierarchy, SCIM / SSO, Custom RBAC & Multi-Unit Command Center',
    category: 'enterprise',
    includedInTiers: ['enterprise'],
    isActive: true,
    featureHighlights: ['8-Tier Org Hierarchy', 'Cross-Location Staffing Pool', 'Enterprise Security & Audit Logs', 'Webhooks & REST API']
  }
];

export const INITIAL_CORPORATE_CHECKLISTS: CorporateTaskChecklist[] = [
  {
    id: 'chk-01',
    title: 'Daily Opening Food Safety & Temp Log',
    assignedScope: 'All 847 Locations',
    cadence: 'daily_opening',
    requiresPhotoVerification: true,
    completionRatePct: 98.6,
    totalSubmissions: 835,
    criticalIssuesFlagged: 2,
    lastUpdated: 'Today at 08:30 AM'
  },
  {
    id: 'chk-02',
    title: 'Peak Dinner Prep & Line Station Setup',
    assignedScope: 'Pacific West Coast Region',
    cadence: 'daily_opening',
    requiresPhotoVerification: false,
    completionRatePct: 100.0,
    totalSubmissions: 142,
    criticalIssuesFlagged: 0,
    lastUpdated: 'Today at 03:45 PM'
  },
  {
    id: 'chk-03',
    title: 'Closing Sanitation & Chemical Cycle',
    assignedScope: 'All 847 Locations',
    cadence: 'daily_closing',
    requiresPhotoVerification: true,
    completionRatePct: 97.2,
    totalSubmissions: 823,
    criticalIssuesFlagged: 5,
    lastUpdated: 'Yesterday at 11:50 PM'
  }
];

export const INITIAL_ENTERPRISE_AUDIT_LOGS: EnterpriseAuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-08-14 10:14:22',
    actorName: 'Jordan Rivera',
    actorRole: 'General Manager (Store #101)',
    scopeLocation: 'Downtown Flagship',
    actionCategory: 'agent_action',
    details: 'Triggered AI Shift Rescue for Mateo Morales (Line Cook, 16:30); dispatched offer to Kenji Takahashi.',
    ipAddress: '198.51.100.42',
    status: 'success'
  },
  {
    id: 'audit-002',
    timestamp: '2026-08-14 09:30:10',
    actorName: 'Aura-Schedule (AI Agent)',
    actorRole: 'Autonomous AI Agent',
    scopeLocation: 'San Francisco Bay Area District #4',
    actionCategory: 'schedule_override',
    details: 'Prevented clopening shift violation for Hannah Brooks on Saturday opening roster.',
    ipAddress: 'Internal Agent Engine',
    status: 'prevented_by_guardrail'
  },
  {
    id: 'audit-003',
    timestamp: '2026-08-14 08:45:00',
    actorName: 'Corporate Admin (Sarah Jenkins)',
    actorRole: 'VP Operations',
    scopeLocation: 'Northeast Region',
    actionCategory: 'policy_update',
    details: 'Updated maximum allowable weekly overtime ceiling to 40.0h strict with GM approval mandatory.',
    ipAddress: '172.56.21.90',
    status: 'success'
  },
  {
    id: 'audit-004',
    timestamp: '2026-08-13 22:30:15',
    actorName: 'Elena Rostova',
    actorRole: 'Head Server',
    scopeLocation: 'Downtown Flagship',
    actionCategory: 'punch_edit',
    details: 'Requested miss-punch adjustment for break end (15:30 -> 15:45); approved by GM.',
    ipAddress: '198.51.100.42',
    status: 'success'
  }
];

export const INITIAL_PROACTIVE_INSIGHTS: ProactiveIntelligenceInsight[] = [
  {
    id: 'insight-agg-001',
    title: 'Predicted Overtime Avalanche in Front of House (Friday & Saturday)',
    category: 'labor_cost',
    impactLevel: 'critical',
    agentSource: 'labor_agent',
    sourceModule: 'schedule',
    headlineMetric: '+$1,420 Cost',
    metricLabel: 'Potential Overtime Penalty',
    description: 'Cross-module correlation between POS reservation surge (+44%) and active shift schedules detects 4 servers (Elena, Hannah, Carlos, David) projected to exceed 40.0 hours by Friday 8 PM.',
    rootCauseAnalysis: 'Recent call-outs forced unplanned shift extensions, escalating weekly base hours to 37.8 avg before weekend rush.',
    suggestedActionCommand: 'Rebalance weekend dinner floor plan with available part-time certified runners and execute 2 smart shift swaps.',
    actionLabel: 'Deploy Smart Shift Swaps (Save $1,420)',
    estimatedFinancialImpact: 1420,
    confidenceScore: 97,
    urgency: 'immediate'
  },
  {
    id: 'insight-agg-002',
    title: 'POS Lunch Sales Mismatch: 3.5 Idle Labor Hours on Tuesdays & Wednesdays',
    category: 'labor_cost',
    impactLevel: 'high',
    agentSource: 'analytics_agent',
    sourceModule: 'pos_sales',
    headlineMetric: '33.8% Labor %',
    metricLabel: 'Tuesday Midday Target is 26.0%',
    description: 'Comparing 8 weeks of Toast POS hourly sales receipts against scheduled clock-ins reveals overstaffing between 1:30 PM - 4:00 PM on weekdays with only $310/hr revenue average.',
    rootCauseAnalysis: 'Default template maintains 5 BOH kitchen prep cooks through low-volume afternoon lull instead of staggered afternoon breaks.',
    suggestedActionCommand: 'Adjust weekday prep shift start times to 15:30 and trim 1.5h per cook to align with actual order velocity.',
    actionLabel: 'Auto-Trim Midday Template (-$680/wk)',
    estimatedFinancialImpact: 2720,
    confidenceScore: 94,
    urgency: 'weekly_cycle'
  },
  {
    id: 'insight-agg-003',
    title: 'Customer Review Rating Drops (3.8★) Linked to Sunday Brunch Bartender Deficit',
    category: 'guest_experience',
    impactLevel: 'critical',
    agentSource: 'operations_agent',
    sourceModule: 'performance_reviews',
    headlineMetric: '-0.7★ Drop',
    metricLabel: 'Sunday Drink Wait Time Correlation',
    description: 'AI sentiment extraction from 18 new Google & Yelp reviews indicates guest complaints about cocktail wait times (16+ mins) exclusively during 11:30 AM - 2:30 PM Sunday brunch.',
    rootCauseAnalysis: 'Single bartender scheduled despite 130 covers booked; barback cross-trained staff was scheduled on dishwasher duty.',
    suggestedActionCommand: 'Promote cross-trained barback Chloe to dual bartender role on Sunday mornings and notify GM.',
    actionLabel: 'Reassign Chloe to Dual Bar Staffing',
    estimatedFinancialImpact: 3100,
    confidenceScore: 96,
    urgency: 'within_24h'
  },
  {
    id: 'insight-agg-004',
    title: 'Mandatory Food Safety Certification Expiring for 3 BOH Staff (<14 Days)',
    category: 'compliance_guard',
    impactLevel: 'high',
    agentSource: 'compliance_agent',
    sourceModule: 'compliance',
    headlineMetric: '3 Staff',
    metricLabel: 'Expiring ServSafe Food Handler',
    description: 'Compliance auditor flagged ServSafe credentials expiring before month-end for Mateo, Marcus, and Kenji. Uncertified kitchen shifts risk health inspection penalties.',
    rootCauseAnalysis: 'Recertification renewal cycle was pending corporate HR upload.',
    suggestedActionCommand: 'Dispatch automated digital renewal vouchers and schedule 45-minute training modules.',
    actionLabel: 'Issue Renewal Vouchers & Alerts',
    estimatedFinancialImpact: 1500,
    confidenceScore: 99,
    urgency: 'within_24h'
  },
  {
    id: 'insight-agg-005',
    title: 'Fatigue & Clopening Risk: 2 Staff Scheduled with Only 8.5h Rest',
    category: 'wellbeing_retention',
    impactLevel: 'high',
    agentSource: 'scheduling_agent',
    sourceModule: 'schedule',
    headlineMetric: '2 Violations',
    metricLabel: 'Fair Workweek Rest Hazard',
    description: 'Aura-Schedule detected closing shift (ends 23:30 Friday) followed by opening shift (08:00 Saturday) for Hannah Brooks and Jordan Lee.',
    rootCauseAnalysis: 'Manual shift trade bypassed default 10-hour rest constraint.',
    suggestedActionCommand: 'Re-assign Saturday 08:00 opener to rested standby server with zero overtime impact.',
    actionLabel: 'Fix Rest Gap Automatically',
    estimatedFinancialImpact: 850,
    confidenceScore: 98,
    urgency: 'immediate'
  }
];

export const INITIAL_LABOR_OPTIMIZATION_STRATEGIES: LaborOptimizationStrategy[] = [
  {
    id: 'strat-01',
    strategyName: 'Dynamic Midday Staggering (Weekday Lulls)',
    category: 'midday_trimming',
    monthlySavings: 2840,
    implementationEffort: 'automated_1_click',
    description: 'Shift 4 afternoon kitchen preparation slots from 13:00 to 15:30 on Tue/Wed/Thu to reduce idle clock-in overlap during quiet hours.',
    projectedLaborPctImpact: -1.8,
    targetDepartment: 'Back of House',
    affectedShiftsCount: 12,
    status: 'recommended'
  },
  {
    id: 'strat-02',
    strategyName: 'Fair Overtime Equalizer (Pre-emptive Cap at 38h)',
    category: 'overtime_reduction',
    monthlySavings: 3650,
    implementationEffort: 'automated_1_click',
    description: 'Redistribute weekend closing shifts from full-time employees approaching 38.5h to highly rated part-time servers seeking extra shifts.',
    projectedLaborPctImpact: -2.3,
    targetDepartment: 'Front of House',
    affectedShiftsCount: 18,
    status: 'recommended'
  },
  {
    id: 'strat-03',
    strategyName: 'Cross-Training Barback Flex Fill',
    category: 'cross_training_fill',
    monthlySavings: 1950,
    implementationEffort: 'manager_approval_required',
    description: 'Utilize multi-skilled barbacks for 2-hour peak dinner cocktail surges instead of scheduling separate premium third-party bartenders.',
    projectedLaborPctImpact: -1.1,
    targetDepartment: 'Bar & Lounge',
    affectedShiftsCount: 8,
    status: 'recommended'
  },
  {
    id: 'strat-04',
    strategyName: 'Sunny Weekend Patio Surge Capture',
    category: 'rush_hour_capture',
    monthlySavings: 4200,
    implementationEffort: 'schedule_tweak',
    description: 'Auto-schedule 2 flex on-call outdoor runners for Saturday 17:00 when weather forecast exceeds 72°F and patio capacity reaches 100%.',
    projectedLaborPctImpact: +0.6,
    targetDepartment: 'Front of House',
    affectedShiftsCount: 6,
    status: 'applied'
  }
];

export const INITIAL_CRITICAL_WORKFORCE_ALERTS: WorkforceCriticalAlertItem[] = [
  {
    id: 'alert-crit-001',
    severity: 'critical',
    timestamp: '12 mins ago',
    alertType: 'overtime_velocity',
    title: 'Overtime Velocity Exceeding Threshold',
    affectedEntity: 'Elena Rostova (Head Server)',
    department: 'Front of House',
    details: 'Elena clocked 36.4 hours through Thursday. Friday and Saturday scheduled shifts will generate 7.6 hours of 1.5x overtime ($285 premium).',
    mitigationPlaybook: 'Swap Saturday closing shift with Maya Lin (22.5h this week).',
    actionCommand: 'SWAP_SHIFT: Elena -> Maya (Saturday 17:00)',
    actionButtonLabel: 'Swap to Maya Lin',
    isResolved: false
  },
  {
    id: 'alert-crit-002',
    severity: 'critical',
    timestamp: '35 mins ago',
    alertType: 'clopening_violation',
    title: 'Zero-Rest Clopening Hazard Detected',
    affectedEntity: 'Hannah Brooks (Server)',
    department: 'Front of House',
    details: 'Closing shift on Friday ends at 23:45; opening breakfast shift starts at 07:30 Saturday (7h 45m rest interval, legal minimum is 10h).',
    mitigationPlaybook: 'Reassign Saturday morning opener to rested standby server David Kim.',
    actionCommand: 'REASSIGN_SHIFT: Saturday 07:30 to David Kim',
    actionButtonLabel: 'Reassign to David Kim',
    isResolved: false
  },
  {
    id: 'alert-crit-003',
    severity: 'high',
    timestamp: '1 hour ago',
    alertType: 'expiring_certification',
    title: 'Food Safety ServSafe Expiration in 11 Days',
    affectedEntity: 'Mateo Morales (Line Cook)',
    department: 'Back of House',
    details: 'California Food Handler Card expires on Aug 25, 2026. Required for all active BOH hot line shifts.',
    mitigationPlaybook: 'Issue instant LMS course voucher and schedule 1-hour renewal session.',
    actionCommand: 'DISPATCH_TRAINING: ServSafe Renewal Voucher to Mateo',
    actionButtonLabel: 'Send Renewal Voucher',
    isResolved: false
  },
  {
    id: 'alert-crit-004',
    severity: 'notice',
    timestamp: '2 hours ago',
    alertType: 'weather_demand_surge',
    title: 'Weather Demand Surge (+25% Patio Volume)',
    affectedEntity: 'Patio & Outdoor Seating Zone',
    department: 'Front of House',
    details: 'Forecast updated to 78°F sunny for Saturday afternoon. Historical POS data projects +$3,200 revenue increase requiring +2 runners.',
    mitigationPlaybook: 'Activate 2 standby shift bids to certified servers with zero overtime.',
    actionCommand: 'ACTIVATE_STANDBY: Open 2 Patio Shift Bids',
    actionButtonLabel: 'Open 2 Standby Bids',
    isResolved: false
  }
];

export const INITIAL_MODULE_HEALTH_SCORECARDS: ModuleHealthScorecard[] = [
  {
    moduleId: 'mod-schedule',
    moduleName: 'Smart Scheduling & Shift Engine',
    healthScore: 94,
    status: 'optimal',
    activeMetricsSummary: '58 shifts filled • 2 open standby slots • 0 unassigned critical shifts',
    syncStatus: 'real_time_synced',
    dataPointsAnalyzedCount: 1420
  },
  {
    moduleId: 'mod-labor-pos',
    moduleName: 'Toast POS & Sales Velocity Sync',
    healthScore: 89,
    status: 'attention_needed',
    activeMetricsSummary: 'Labor at 29.4% (Target: 28.0%) • Midday lull variance identified',
    syncStatus: 'real_time_synced',
    dataPointsAnalyzedCount: 3890
  },
  {
    moduleId: 'mod-compliance',
    moduleName: 'Labor Guardrails & Certifications',
    healthScore: 92,
    status: 'attention_needed',
    activeMetricsSummary: '1 rest violation flagged • 3 certs expiring <14 days • 100% meal break compliance',
    syncStatus: 'synced_5m_ago',
    dataPointsAnalyzedCount: 680
  },
  {
    moduleId: 'mod-reviews',
    moduleName: 'Guest Sentiment & Performance Score',
    healthScore: 96,
    status: 'optimal',
    activeMetricsSummary: 'Restaurant Score: 94/100 (4.8★ Avg) • Sunday brunch speed bottleneck flagged',
    syncStatus: 'real_time_synced',
    dataPointsAnalyzedCount: 450
  },
  {
    moduleId: 'mod-attendance',
    moduleName: 'Time Clock & Geofenced Punches',
    healthScore: 97,
    status: 'optimal',
    activeMetricsSummary: '98.8% on-time punch rate • Geofencing active • 0 unverified punch edits',
    syncStatus: 'real_time_synced',
    dataPointsAnalyzedCount: 1120
  },
  {
    moduleId: 'mod-payroll',
    moduleName: 'ADP & WorkForce Payroll Connector',
    healthScore: 99,
    status: 'optimal',
    activeMetricsSummary: 'Pay period closes in 3 days • $18,420 projected gross • Zero unmapped wages',
    syncStatus: 'synced_5m_ago',
    dataPointsAnalyzedCount: 890
  }
];