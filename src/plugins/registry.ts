import {
  Calendar,
  Users,
  Zap,
  Sparkles,
  Building2,
  DollarSign,
  GraduationCap,
  Star,
  Layers,
  BarChart3,
  FileText,
  Clock,
  Megaphone,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Bot,
  Wrench,
  Mail
} from 'lucide-react';
import { PluginDefinition, EnterpriseFeatureManagerState } from './types';

export const ALL_SYSTEM_PLUGINS: PluginDefinition[] = [
  {
    id: 'core_scheduling',
    name: 'Core Shift Scheduler',
    shortCode: 'SCHED',
    tagline: 'Multi-Department Restaurant Roster & Shift Builder',
    description: 'Real-time drag-and-drop shift calendar with shift slots, budget caps, conflict detectors, and automated SMS/Email publishing.',
    version: '4.2.0',
    category: 'core_scheduling',
    icon: Calendar,
    isCore: true,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Core Systems',
    minTierRequired: 'starter',
    features: [
      'Visual multi-department timeline & grid',
      'Instant shift slot contention resolution',
      'Department budget guardrails & live calculation',
      '1-Click automated SMS / Email shift broadcast'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Weekly Shifts',
      value: '142 Active',
      trend: '+12% vs last week'
    }
  },
  {
    id: 'employees',
    name: 'Workforce Roster & Scale Engine',
    shortCode: 'STAFF',
    tagline: '1 to 100,000 High-Capacity Staff Management',
    description: 'Enterprise employee database with certification tracking, POS server IDs, custom wage rates, and high-performance pagination.',
    version: '3.8.0',
    category: 'operations',
    icon: Users,
    isCore: true,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Core Systems',
    minTierRequired: 'starter',
    features: [
      'Scale anywhere from 1 to 100,000 active staff',
      'Health code & alcohol certification tracking',
      'Hourly wage & overtime threshold management',
      'Multi-unit department role assignments'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Staff Scale',
      value: '100k Ready',
      trend: 'Zero Latency'
    }
  },
  {
    id: 'payroll',
    name: 'Workqora Payroll Engine',
    shortCode: 'PAYROLL',
    tagline: 'Live Wage, Tip Pool & Tax Compliance Engine',
    description: 'Automated gross-to-net pay calculation, tip pool distribution (FOH/BOH share), tax withholding, and 2-way ADP/Gusto export.',
    version: '2.1.4',
    category: 'payroll_finance',
    icon: DollarSign,
    badge: 'Popular Add-on',
    tabId: 'payroll',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'purchased',
    monthlyAddonPrice: 49,
    author: 'Workqora Financial Cloud',
    minTierRequired: 'pro',
    features: [
      'Automated bi-weekly gross-to-net calculations',
      'Dynamic FOH & BOH kitchen tip pool splitting',
      'FICA, Federal & State tax compliance estimates',
      'Direct ACH journal export & ADP/Gusto sync'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Processed Payroll',
      value: '$24,850.00',
      trend: '100% Verified'
    }
  },
  {
    id: 'learn',
    name: 'Workqora Learn & LMS',
    shortCode: 'LEARN',
    tagline: 'Hospitality Training & Certification Academy',
    description: 'Interactive ServSafe Food Handler, California RBS Alcohol compliance, culinary knife skills, and OSHA restaurant safety micro-modules.',
    version: '1.9.2',
    category: 'learning_academy',
    icon: GraduationCap,
    badge: 'Enterprise Certified',
    tabId: 'learn',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'purchased',
    monthlyAddonPrice: 39,
    author: 'Workqora Academy',
    minTierRequired: 'pro',
    features: [
      'ServSafe & California RBS certification modules',
      'Digital badge issuing & certification wallet',
      '1-Click departmental roster assignments',
      'OSHA workplace safety & fire drill compliance'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Active Learners',
      value: '91.4% Rate',
      trend: '332 Certs Issued'
    }
  },
  {
    id: 'intelligence_agent',
    name: 'Workqora AI Intelligence Agent',
    shortCode: 'AI-AGENT',
    tagline: 'Proactive Cross-Module Autonomous Optimization',
    description: 'Gemini-powered operational copilot that analyzes weather forecasts, local events, overtime risks, and auto-generates optimized rosters.',
    version: '5.0.0',
    category: 'ai_intelligence',
    icon: Sparkles,
    badge: 'AI Powered',
    tabId: 'intelligence_agent',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora AI Labs',
    minTierRequired: 'starter',
    features: [
      'Real-time staffing gap & overtime risk detection',
      'Predictive weather & event customer traffic surges',
      '1-Click automated schedule auto-fill & balancing',
      'Multi-lingual interactive voice/text prompt assistant'
    ],
    capabilities: {
      realtimeSync: true,
      aiGrounding: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Agent Accuracy',
      value: '99.4%',
      trend: 'Autonomous'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise Multi-Unit Hub',
    shortCode: 'MULTI-UNIT',
    tagline: 'Regional & National Franchise Command Center',
    description: 'Centralized telemetry across 8+ international store locations (SF, Chicago, Manhattan, Austin, Seattle, London, Tokyo, Sydney).',
    version: '3.5.0',
    category: 'operations',
    icon: Building2,
    badge: 'Multi-Location',
    tabId: 'enterprise',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Global Systems',
    minTierRequired: 'enterprise',
    features: [
      'Multi-city restaurant telemetry & revenue tracking',
      'Cross-location labor efficiency comparisons',
      'Global compliance & overtime benchmarking',
      'Regional district manager broadcast announcements'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Active Stores',
      value: '8 Locations',
      trend: 'Global Fleet'
    }
  },
  {
    id: 'performance',
    name: 'Score, Reviews & Kudos',
    shortCode: 'PERF',
    tagline: 'Guest Feedback & Staff Performance Scorecard',
    description: '360° guest review monitoring (Google, Yelp, OpenTable), employee kudos leaderboards, and speed-of-service recognition badges.',
    version: '2.4.0',
    category: 'performance_hr',
    icon: Star,
    tabId: 'performance',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Guest Insights',
    minTierRequired: 'starter',
    features: [
      'Aggregated Yelp, Google & OpenTable guest reviews',
      'Employee peer-to-peer Kudos & recognition points',
      'Real-time restaurant cleanliness & service rating',
      'Shift-by-shift performance analytics'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Guest Rating',
      value: '4.8 / 5.0',
      trend: '1,280 Reviews'
    }
  },
  {
    id: 'integrations',
    name: 'WorkForce & POS Universal Hub',
    shortCode: 'POS-SYNC',
    tagline: 'Toast, Square, Clover, ADP & Gusto Sync Bridge',
    description: 'Enterprise API connectors for Toast POS, Square POS, Clover, ADP Workforce Now, Gusto, and 7shifts bidirectional synchronization.',
    version: '4.1.0',
    category: 'integrations',
    icon: Layers,
    badge: 'Universal API',
    tabId: 'integrations',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Integration Network',
    minTierRequired: 'starter',
    features: [
      'Live Toast / Square / Clover sales & timeclock feed',
      'Real-time labor % cost vs net restaurant sales',
      'ADP & Gusto employee roster synchronization',
      'Automated POS department category mapping'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'POS Sync Stream',
      value: 'Active 2s',
      trend: '100% Uptime'
    }
  },
  {
    id: 'analytics',
    name: 'Executive Analytics & BI Dashboard',
    shortCode: 'BI-STATS',
    tagline: 'Labor Forecasting & Cost Optimization Engine',
    description: 'Visual D3/Recharts breakdown of labor cost percentage, overtime risks, department hour distribution, and weekly sales forecasting.',
    version: '3.2.0',
    category: 'operations',
    icon: BarChart3,
    tabId: 'analytics',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Analytics',
    minTierRequired: 'starter',
    features: [
      'Target labor percentage tracking (e.g. 24.5% target)',
      'Projected hourly sales vs scheduled labor curves',
      'Overtime hazard alerts before schedules are locked',
      'Exportable CSV / PDF executive summaries'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Labor % Target',
      value: '22.8%',
      trend: '-1.4% Under Budget'
    }
  },
  {
    id: 'requests',
    name: 'Requests & Shift Swap Approvals',
    shortCode: 'REQ',
    tagline: 'Time-Off, Sick Leaves & Peer Shift Swaps',
    description: 'Centralized manager inbox for approving employee time-off, availability adjustments, sick day notifications, and shift swaps.',
    version: '2.9.0',
    category: 'operations',
    icon: FileText,
    tabId: 'requests',
    isCore: true,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Core Systems',
    minTierRequired: 'starter',
    features: [
      'Peer-to-peer shift swap approval workflows',
      'PTO & unpaid time-off conflict verification',
      'Emergency sick day coverage dispatch',
      'Availability schedule preference updates'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Pending Approvals',
      value: '3 Pending',
      trend: 'Fast Track'
    }
  },
  {
    id: 'tardiness',
    name: 'Attendance & Tardiness Tracker',
    shortCode: 'ATTEND',
    tagline: 'Clock-In Punctuality & Attendance Scoring',
    description: 'Track late arrivals, unexcused absences, no-shows, and positive punctuality trends across all shifts with disciplinary point logs.',
    version: '2.0.1',
    category: 'performance_hr',
    icon: Clock,
    tabId: 'tardiness',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Operations',
    minTierRequired: 'starter',
    features: [
      'Late clock-in penalty & punctuality scoring',
      'Automated SMS warning alerts for tardy staff',
      'No-show / call-out replacement broadcast',
      'Historical punctuality reports per employee'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'On-Time Score',
      value: '96.2%',
      trend: '+2.1% this month'
    }
  },
  {
    id: 'announcements',
    name: 'Notice Board & Team Broadcasts',
    shortCode: 'NOTICE',
    tagline: 'Emergency Push, SMS & In-App Bulletins',
    description: 'Post daily specials, 86-item lists, VIP party alerts, policy updates, and mandatory acknowledgment notices to your team.',
    version: '2.3.0',
    category: 'operations',
    icon: Megaphone,
    tabId: 'announcements',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Team Comms',
    minTierRequired: 'starter',
    features: [
      'Daily 86-lists & chef special announcements',
      'Read receipts & required staff acknowledgments',
      'Targeted department bulletins (e.g. Bar only)',
      'Multi-channel SMS & Mobile push dispatch'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Read Rate',
      value: '98.0%',
      trend: 'Instant Delivery'
    }
  },
  {
    id: 'hr_payroll',
    name: 'HR, Hiring & Onboarding Pipeline',
    shortCode: 'HR-HIRE',
    tagline: 'Applicant Tracking, Interviews & I-9 Compliance',
    description: 'End-to-end recruitment funnel for restaurant applicants from review to interview scheduling, digital offer letters, and I-9 verification.',
    version: '3.1.0',
    category: 'performance_hr',
    icon: UserPlus,
    tabId: 'hr_payroll',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora HR Systems',
    minTierRequired: 'starter',
    features: [
      'Interactive Kanban recruitment pipeline',
      'Digital I-9, W-4 & direct deposit paperless upload',
      '1-Click convert applicant into active employee',
      'Interview scheduling & candidate rating scorecard'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Active Candidates',
      value: '6 in Pipeline',
      trend: '2 Ready to Hire'
    }
  },
  {
    id: 'equipment',
    name: 'Equipment & Facilities Manager',
    shortCode: 'EQUIP',
    tagline: '22-Module Commercial Restaurant Equipment & CMMS Suite',
    description: 'Comprehensive preventive maintenance, IoT temperature sensors, breakdown dispatch, QR lookup, warranties, spare parts, and CapEx analytics.',
    version: '3.1.0',
    category: 'operations',
    icon: Wrench,
    badge: '22 Sub-Tabs',
    tabId: 'equipment',
    isCore: false,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Facility Systems',
    minTierRequired: 'starter',
    features: [
      '22 dedicated operational sub-sections from QR scanner to IoT',
      'Automated PM scheduling & checklist audits',
      'Instant breakdown dispatch & contractor SLA tracking',
      'Lifecycle depreciation & CapEx repair ROI analytics'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Monitored Assets',
      value: '48 Active Machines',
      trend: '99.4% Uptime'
    }
  },
  {
    id: 'email',
    name: 'Business Email Integration Suite',
    shortCode: 'EMAIL',
    tagline: 'Multi-Tenant Unified Email Inbox & AI Workflow Center',
    description: 'Enterprise email connectivity for Google Workspace, Microsoft 365, and IMAP/SMTP with AI-powered summaries, smart drafting, and 1-click email-to-task conversion.',
    version: '2.0.0',
    category: 'operations',
    icon: Mail,
    badge: 'Enterprise Ready',
    tabId: 'email',
    isCore: true,
    enabledByDefault: true,
    licenseStatus: 'included_in_plan',
    monthlyAddonPrice: 0,
    author: 'Workqora Communications',
    minTierRequired: 'starter',
    features: [
      'Multi-tenant Google Workspace, M365 & IMAP/SMTP mailboxes',
      'Unified multi-mailbox inbox with instant search and filtering',
      'AI-powered action item detection and smart draft responses',
      '1-Click Email-to-Task / Work Order / Schedule Event conversion'
    ],
    capabilities: {
      realtimeSync: true,
      exportableReports: true,
      mobileOptimized: true
    },
    metrics: {
      label: 'Mailbox Accounts',
      value: '6 Connected',
      trend: 'Real-time sync'
    }
  }
];

export const INITIAL_FEATURE_MANAGER_STATE: EnterpriseFeatureManagerState = {
  enabledPluginIds: [
    'core_scheduling',
    'email',
    'employees',
    'equipment',
    'payroll',
    'learn',
    'intelligence_agent',
    'enterprise',
    'performance',
    'integrations',
    'analytics',
    'requests',
    'tardiness',
    'announcements',
    'hr_payroll'
  ],
  purchasedPluginIds: [
    'core_scheduling',
    'email',
    'employees',
    'equipment',
    'payroll',
    'learn',
    'intelligence_agent',
    'enterprise',
    'performance',
    'integrations',
    'analytics',
    'requests',
    'tardiness',
    'announcements',
    'hr_payroll'
  ],
  lastModifiedTimestamp: new Date().toISOString(),
  activePlanTier: 'enterprise'
};