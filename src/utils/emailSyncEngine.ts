import {
  BusinessEmailConnection,
  EmailMessage,
  EmailTemplate,
  EmailSignature,
  EmailAuditEvent,
  EmailSyncLog,
  CustomRole
} from '../types';

// ====================================================
// INITIAL SAMPLE BUSINESS EMAIL CONNECTIONS
// ====================================================
export const INITIAL_EMAIL_CONNECTIONS: BusinessEmailConnection[] = [
  {
    id: 'conn-org-google',
    organizationId: 'org-workqora-primary',
    scopeLevel: 'organization',
    provider: 'google',
    emailAddress: 'operations@workqora-hospitality.com',
    displayName: 'Corporate Operations (Wongwai Group)',
    category: 'operations',
    connectionStatus: 'connected',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ],
    isDefaultOrgSender: true,
    autoSyncIntervalMinutes: 15,
    lastSyncedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-region-east',
    organizationId: 'org-workqora-primary',
    regionId: 'reg-east-coast',
    scopeLevel: 'region',
    provider: 'google',
    emailAddress: 'eastregion@workqora-hospitality.com',
    displayName: 'Region East Operations',
    category: 'operations',
    connectionStatus: 'connected',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ],
    autoSyncIntervalMinutes: 15,
    lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-store101-google',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-dtla-main',
    scopeLevel: 'location',
    provider: 'google',
    emailAddress: 'store101@workqora-hospitality.com',
    displayName: 'Location #101 - Downtown LA Store',
    category: 'general',
    connectionStatus: 'connected',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose'
    ],
    isDefaultLocationSender: true,
    autoSyncIntervalMinutes: 15,
    lastSyncedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-store104-msft',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    scopeLevel: 'location',
    provider: 'microsoft',
    emailAddress: 'store104@workqora-hospitality.com',
    displayName: 'Location #104 - SF Flagship Store',
    category: 'general',
    connectionStatus: 'connected',
    scopes: [
      'Mail.Read',
      'Mail.Send',
      'Mail.ReadWrite',
      'User.Read'
    ],
    isDefaultLocationSender: true,
    autoSyncIntervalMinutes: 15,
    lastSyncedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    createdAt: '2026-08-12T11:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-store104-gm',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    scopeLevel: 'location',
    provider: 'microsoft',
    emailAddress: 'gm104@workqora-hospitality.com',
    displayName: 'Location #104 - General Manager',
    category: 'manager',
    connectionStatus: 'connected',
    scopes: [
      'Mail.Read',
      'Mail.Send',
      'Mail.ReadWrite'
    ],
    autoSyncIntervalMinutes: 30,
    lastSyncedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: '2026-08-12T11:30:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-store104-hiring',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    scopeLevel: 'department',
    provider: 'microsoft',
    emailAddress: 'jobs104@workqora-hospitality.com',
    displayName: 'Location #104 - Hiring & Talent',
    category: 'hiring',
    connectionStatus: 'connected',
    scopes: [
      'Mail.Read',
      'Mail.Send',
      'Mail.ReadWrite'
    ],
    autoSyncIntervalMinutes: 15,
    lastSyncedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    createdAt: '2026-08-14T14:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'conn-store104-inventory',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    scopeLevel: 'department',
    provider: 'microsoft',
    emailAddress: 'inventory104@workqora-hospitality.com',
    displayName: 'Location #104 - Receiving & Purchasing',
    category: 'inventory',
    connectionStatus: 'connected',
    scopes: [
      'Mail.Read',
      'Mail.Send'
    ],
    autoSyncIntervalMinutes: 30,
    lastSyncedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    createdAt: '2026-08-14T14:30:00Z',
    updatedAt: new Date().toISOString()
  }
];

// ====================================================
// INITIAL SAMPLE BUSINESS EMAILS & THREADS
// ====================================================
export const INITIAL_EMAIL_MESSAGES: EmailMessage[] = [
  {
    id: 'msg-vendor-001',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    connectionId: 'conn-store104-inventory',
    threadId: 'thread-vendor-001',
    providerMessageId: 'prov-msg-sysco-7721',
    from: {
      name: 'Sysco Foodservice Operations',
      email: 'logistics.norcal@sysco-orders.com'
    },
    to: [
      { name: 'Location #104 Inventory', email: 'inventory104@workqora-hospitality.com' },
      { name: 'General Manager', email: 'gm104@workqora-hospitality.com' }
    ],
    subject: '🚚 Delivery Confirmation: Produce & Dairy Order #PO-88421 Scheduled Friday 6:30 AM',
    snippet: 'Your upcoming delivery for Location #104 is confirmed for Friday morning between 06:30 - 07:30 AM. Total items: 48 cases...',
    bodyText: `Hello Workqora Team at SF Flagship,\n\nWe have scheduled your weekly produce, dairy, and dry storage delivery for Order #PO-88421.\n\nDelivery Details:\n• Date: Friday, August 28, 2026\n• Estimated Arrival: 06:30 AM - 07:30 AM PST\n• Receiving Bay: Rear Loading Dock (Gate 2)\n• Driver: Carlos Gutierrez (Phone: 415-555-0199)\n• Total Cargo: 48 temperature-monitored cases (12 refrigerated dairy, 24 produce, 12 dry dry goods)\n• Invoice Total: $3,428.50\n\nPlease ensure receiving kitchen staff is on-site to inspect temperature logs and sign the manifest.\n\nThank you,\nSysco NorCal Distribution Logistics`,
    date: '2026-08-22T05:45:00Z',
    isRead: false,
    isStarred: true,
    isArchived: false,
    isDraft: false,
    isSent: false,
    folder: 'inbox',
    category: 'inventory',
    labels: ['Vendor', 'Priority', 'Receiving'],
    attachments: [
      {
        id: 'att-sysco-po',
        filename: 'Sysco_Manifest_PO-88421.pdf',
        contentType: 'application/pdf',
        sizeBytes: 245760,
        isSafe: true
      }
    ],
    aiSummary: 'Sysco confirmed delivery of 48 cases ($3,428.50) for Location #104 on Friday, August 28 between 6:30 AM and 7:30 AM.',
    aiActionItems: [
      'Schedule receiving staff on duty for Friday 6:00 AM clock-in',
      'Verify walk-in refrigeration space for 12 dairy cases',
      'Log invoice #PO-88421 in Workqora Food Costing Ledger'
    ],
    aiSuggestedAction: {
      actionType: 'inventory',
      title: 'Add Inventory Delivery Event: Sysco Order #PO-88421',
      description: 'Scheduled delivery arrival Friday 6:30 AM - 7:30 AM for 48 cases ($3,428.50)',
      prefilledData: {
        vendorName: 'Sysco Foodservice',
        deliveryDate: '2026-08-28',
        deliveryTime: '06:30',
        amount: 3428.50
      }
    }
  },
  {
    id: 'msg-equip-002',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    connectionId: 'conn-store104-gm',
    threadId: 'thread-equip-002',
    providerMessageId: 'prov-msg-hvac-3310',
    from: {
      name: 'Pacific Refrigeration & HVAC Techs',
      email: 'dispatch@pacific-ref-service.com'
    },
    to: [
      { name: 'Store #104 Management', email: 'gm104@workqora-hospitality.com' },
      { name: 'Corporate Operations', email: 'operations@workqora-hospitality.com' }
    ],
    subject: '🔧 Preventive Maintenance Notice: Walk-In Cooler Compressor Inspection Tuesday 9:00 AM',
    snippet: 'Our technician Dave Martinez will arrive at Location #104 on Tuesday at 09:00 AM to perform quarterly refrigerant pressure test and coil cleaning...',
    bodyText: `Good morning Workqora Management,\n\nThis is a confirmation of your scheduled quarterly preventive maintenance visit for Location #104.\n\nService Summary:\n• Target Asset: Traulsen 2-Door Walk-In Cooler & Glycol Beer Line Chiller\n• Scheduled Date: Tuesday, August 25, 2026 at 09:00 AM\n• Assigned Technician: Dave Martinez (EPA Certified #849102)\n• Estimated Service Duration: 2.0 hours\n• Scope: Clean condenser coils, inspect door gaskets, verify defrost cycle timer, and pressure test refrigerant lines.\n\nNo interruption to kitchen prep or main dining is anticipated.\n\nBest regards,\nDispatch Operations | Pacific Refrigeration & HVAC`,
    date: '2026-08-21T18:20:00Z',
    isRead: true,
    isStarred: true,
    isArchived: false,
    isDraft: false,
    isSent: false,
    folder: 'inbox',
    category: 'maintenance',
    labels: ['Equipment', 'HVAC', 'Maintenance'],
    attachments: [
      {
        id: 'att-pm-checklist',
        filename: 'Quarterly_Ref_PM_Protocol.pdf',
        contentType: 'application/pdf',
        sizeBytes: 184320,
        isSafe: true
      }
    ],
    aiSummary: 'Technician Dave Martinez will arrive Tuesday at 9:00 AM for quarterly walk-in cooler & beer line PM (2.0 hrs duration).',
    aiActionItems: [
      'Grant technician access to roof condenser unit and basement beer cellar',
      'Log completed PM into Workqora Equipment Lifecycle record'
    ],
    aiSuggestedAction: {
      actionType: 'maintenance',
      title: 'Create Equipment Work Order: Walk-in Cooler PM',
      description: 'Quarterly refrigerant test & coil cleaning with Dave Martinez (Tuesday 9:00 AM)',
      prefilledData: {
        equipmentName: 'Walk-In Cooler (Traulsen)',
        dueDate: '2026-08-25',
        vendor: 'Pacific Refrigeration & HVAC'
      }
    }
  },
  {
    id: 'msg-hiring-003',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    connectionId: 'conn-store104-hiring',
    threadId: 'thread-hiring-003',
    providerMessageId: 'prov-msg-job-app-9912',
    from: {
      name: 'Marcus Vance',
      email: 'marcus.vance.hospitality@gmail.com'
    },
    to: [
      { name: 'Location #104 Hiring', email: 'jobs104@workqora-hospitality.com' }
    ],
    subject: '🍹 Job Application: Lead Bartender / Beverage Captain - Marcus Vance (7 Yrs Experience)',
    snippet: 'Dear Hiring Manager, I am applying for the Lead Bartender position at Workqora SF Flagship. I have 7 years of craft cocktail and high-volume experience...',
    bodyText: `Dear Workqora SF Flagship Hiring Team,\n\nI am writing to submit my application for the Lead Bartender / Beverage Captain position recently posted on your career board.\n\nMy Background:\n• 7+ years craft cocktail, inventory management, and hospitality experience at Michelin-recommended and high-volume cocktail lounges in SF and Oakland.\n• Current California RBS (Responsible Beverage Service) Certification & ServSafe Food Handler certification (valid through 2028).\n• Proven track record reducing liquor pour cost from 22.4% down to 18.2% via precise batching and prep par management.\n• Full open availability for evening and weekend closing shifts.\n\nI have attached my resume and professional references. I would welcome the opportunity to interview with your General Manager or Bar Manager.\n\nSincerely,\nMarcus Vance\nPhone: (415) 555-7382\nLinkedIn: linkedin.com/in/marcus-vance-bar`,
    date: '2026-08-21T15:10:00Z',
    isRead: false,
    isStarred: false,
    isArchived: false,
    isDraft: false,
    isSent: false,
    folder: 'inbox',
    category: 'hiring',
    labels: ['Applicant', 'Bar & Beverage', 'Certified'],
    attachments: [
      {
        id: 'att-resume-marcus',
        filename: 'Marcus_Vance_Resume_Lead_Bartender.pdf',
        contentType: 'application/pdf',
        sizeBytes: 154000,
        isSafe: true
      },
      {
        id: 'att-rbs-cert',
        filename: 'CA_RBS_Certification_MarcusVance.pdf',
        contentType: 'application/pdf',
        sizeBytes: 98304,
        isSafe: true
      }
    ],
    aiSummary: 'Marcus Vance applied for Lead Bartender. 7 yrs experience, valid CA RBS & ServSafe certificates, open night/weekend availability.',
    aiActionItems: [
      'Review attached resume and verify CA RBS certificate',
      'Schedule a 20-minute phone screen or in-person bar interview'
    ],
    aiSuggestedAction: {
      actionType: 'hiring',
      title: 'Create Candidate Record: Marcus Vance (Lead Bartender)',
      description: 'Candidate for Lead Bartender (7 yrs experience, RBS Certified, Open Availability)',
      prefilledData: {
        name: 'Marcus Vance',
        role: 'Lead Bartender',
        department: 'Bar & Beverage',
        email: 'marcus.vance.hospitality@gmail.com',
        phone: '(415) 555-7382'
      }
    }
  },
  {
    id: 'msg-corp-004',
    organizationId: 'org-workqora-primary',
    connectionId: 'conn-org-google',
    threadId: 'thread-corp-004',
    providerMessageId: 'prov-msg-corp-ann-1102',
    from: {
      name: 'Corporate Executive Operations',
      email: 'operations@workqora-hospitality.com'
    },
    to: [
      { name: 'All General Managers', email: 'general-managers@workqora-hospitality.com' },
      { name: 'Regional Directors', email: 'regional-directors@workqora-hospitality.com' }
    ],
    subject: '📢 Q3 Labor Cost Optimization & Overtime Guard Policy Update',
    snippet: 'Team, please review the updated Q3 labor guidelines. All restaurant locations must target <28.5% blended prime labor with mandatory overtime pre-approvals...',
    bodyText: `Dear Workqora General Managers & Regional Leadership,\n\nAs we enter the peak fall season, Executive Operations has published updated labor cost guardrails:\n\nKey Directives:\n1. Blended Prime Labor Target: 28.5% across all FOH and BOH operations.\n2. Overtime Pre-Clearance: Any scheduled overtime >40 hrs must be pre-approved via Workqora Schedule Approvals 48 hrs prior.\n3. Smart Auto-Fill Adoption: Ensure all managers utilize the Smart Auto-Fill & Labor Cost Guard engine before publishing 7-day rosters.\n4. Meal Break Compliance: Enforce 30-minute California and regional meal breaks prior to the 5th hour to avoid meal break penalty premiums.\n\nThank you for your leadership in running efficient, guest-centric dining operations.\n\nWorkqora Executive Operations`,
    date: '2026-08-20T10:00:00Z',
    isRead: true,
    isStarred: true,
    isArchived: false,
    isDraft: false,
    isSent: true,
    folder: 'sent',
    category: 'operations',
    labels: ['Corporate', 'Policy', 'Labor'],
    attachments: [],
    aiSummary: 'Corporate announcement regarding Q3 labor target (28.5%), mandatory overtime pre-approvals, and meal break compliance.',
    aiActionItems: [
      'Audit current published schedule against 28.5% target',
      'Verify manager awareness of overtime pre-approval workflow'
    ]
  },
  {
    id: 'msg-catering-005',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-dtla-main',
    connectionId: 'conn-store101-google',
    threadId: 'thread-catering-005',
    providerMessageId: 'prov-msg-event-5510',
    from: {
      name: 'Claire Kensington (Aura Media Corp)',
      email: 'ckensington@auramedia.la'
    },
    to: [
      { name: 'Location #101 Store Email', email: 'store101@workqora-hospitality.com' }
    ],
    subject: '🥂 Private Buyout Inquiry: 85-Guest Tech Product Launch on September 12th',
    snippet: 'Hello, we are looking to host our annual product launch party at your Downtown LA venue on Saturday, September 12 from 6:00 PM to 10:30 PM...',
    bodyText: `Hi Workqora DTLA Event Team,\n\nWe love your rooftop patio and main dining space! Aura Media is planning an 85-guest private cocktail reception and seated dinner.\n\nEvent Specs:\n• Date: Saturday, September 12, 2026\n• Time: 06:00 PM - 10:30 PM (plus 1 hr setup at 5 PM)\n• Guest Count: 85 attendees\n• Food & Beverage: Heavy passed appetizers, open premium bar, custom dessert station.\n• Budget: $16,000 - $18,000 F&B minimum.\n\nCould you let us know if the date is available and provide your private dining package menus?\n\nWarmly,\nClaire Kensington\nVP Events, Aura Media Los Angeles`,
    date: '2026-08-22T04:15:00Z',
    isRead: false,
    isStarred: true,
    isArchived: false,
    isDraft: false,
    isSent: false,
    folder: 'inbox',
    category: 'operations',
    labels: ['Private Event', 'Catering', 'VIP'],
    attachments: [
      {
        id: 'att-event-brief',
        filename: 'AuraMedia_Launch_EventBrief.pdf',
        contentType: 'application/pdf',
        sizeBytes: 312000,
        isSafe: true
      }
    ],
    aiSummary: 'Aura Media requested an 85-guest buyout on Saturday, Sept 12 ($16k-$18k budget).',
    aiActionItems: [
      'Check Workqora Calendar for Saturday, Sept 12 date availability',
      'Send private buyout catering menu package & contract template',
      'Notify General Manager and Head Chef of potential $17k F&B revenue event'
    ],
    aiSuggestedAction: {
      actionType: 'meeting',
      title: 'Add Calendar Event: Aura Media Private Buyout ($17k)',
      description: 'Private 85-guest buyout on Saturday, Sept 12 from 6:00 PM - 10:30 PM',
      prefilledData: {
        title: 'Aura Media Private Buyout (85 Guests)',
        date: '2026-09-12',
        startTime: '18:00',
        endTime: '22:30',
        revenueForecast: 17000,
        attendeesCount: 85
      }
    }
  }
];

// ====================================================
// INITIAL SAMPLE EMAIL TEMPLATES
// ====================================================
export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-sched-pub',
    organizationId: 'org-workqora-primary',
    name: 'Schedule Published (7-Day)',
    category: 'scheduling',
    subject: '📅 Your Workqora Schedule for {{week_dates}} is Now Published',
    body: `Hello {{employee_name}},\n\nYour upcoming work schedule for {{location_name}} covering {{week_dates}} has been published.\n\nYour Scheduled Shifts:\n{{shifts_summary}}\n\nPlease review your assigned stations and clock-in times in the Workqora Employee Portal. If you require a shift swap or have availability updates, please submit your request at least 48 hours prior.\n\nBest regards,\n{{manager_name}}\n{{location_name}} Management`,
    variables: ['{{employee_name}}', '{{location_name}}', '{{week_dates}}', '{{shifts_summary}}', '{{manager_name}}'],
    isSystem: true,
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'tmpl-shift-changed',
    organizationId: 'org-workqora-primary',
    name: 'Shift Time / Station Update',
    category: 'scheduling',
    subject: '⚠️ Shift Update Notice: {{shift_date}} at {{location_name}}',
    body: `Hi {{employee_name}},\n\nYour shift on {{shift_date}} has been updated by management.\n\nNew Shift Details:\n• Role: {{shift_role}}\n• Station: {{shift_station}}\n• Time: {{shift_time}}\n• Reason: {{change_reason}}\n\nPlease check your Workqora app to confirm acknowledgment.\n\nThank you,\n{{location_name}} Scheduling Team`,
    variables: ['{{employee_name}}', '{{shift_date}}', '{{shift_role}}', '{{shift_station}}', '{{shift_time}}', '{{change_reason}}', '{{location_name}}'],
    isSystem: true,
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'tmpl-pto-approved',
    organizationId: 'org-workqora-primary',
    name: 'Time-Off / PTO Request Approved',
    category: 'hr',
    subject: '✅ Time-Off Request Approved: {{pto_start_date}} to {{pto_end_date}}',
    body: `Hello {{employee_name}},\n\nGood news! Your requested time off from {{pto_start_date}} to {{pto_end_date}} has been APPROVED by {{manager_name}}.\n\nYour calendar has been updated in Workqora, and you will not be scheduled for shifts during this period.\n\nEnjoy your time off!\n{{location_name}} Management`,
    variables: ['{{employee_name}}', '{{pto_start_date}}', '{{pto_end_date}}', '{{manager_name}}', '{{location_name}}'],
    isSystem: true,
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'tmpl-interview-invite',
    organizationId: 'org-workqora-primary',
    name: 'Interview Invitation (Candidate)',
    category: 'hr',
    subject: '🎉 Interview Invitation: {{role_applied}} at {{location_name}}',
    body: `Dear {{candidate_name}},\n\nThank you for applying for the {{role_applied}} position at {{location_name}} (Workqora Hospitality Group).\n\nWe were impressed by your background and would like to invite you for an interview with our management team.\n\nProposed Times:\n1. {{interview_slot_1}}\n2. {{interview_slot_2}}\n\nLocation: {{location_address}}\nPlease reply to this email with your preferred time, and bring a copy of your food/beverage handler certifications.\n\nWe look forward to meeting you!\n\nBest regards,\n{{recruiter_name}}\nTalent & Operations | Workqora`,
    variables: ['{{candidate_name}}', '{{role_applied}}', '{{location_name}}', '{{interview_slot_1}}', '{{interview_slot_2}}', '{{location_address}}', '{{recruiter_name}}'],
    isSystem: true,
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'tmpl-equip-pm',
    organizationId: 'org-workqora-primary',
    name: 'Equipment Maintenance Work Order Notice',
    category: 'maintenance',
    subject: '🛠️ Service Scheduled: {{equipment_name}} at {{location_name}}',
    body: `Hello {{vendor_name}},\n\nThis email confirms the dispatch of Work Order #{{work_order_id}} for {{equipment_name}} at {{location_name}}.\n\nScheduled Date: {{service_date}} at {{service_time}}\nLocation Address: {{location_address}}\nIssue / Scope: {{service_scope}}\nOn-Site Contact: {{manager_name}} (Phone: {{manager_phone}})\n\nPlease check in at the manager station upon arrival.\n\nThank you,\nWorkqora Facilities Management`,
    variables: ['{{vendor_name}}', '{{work_order_id}}', '{{equipment_name}}', '{{location_name}}', '{{service_date}}', '{{service_time}}', '{{location_address}}', '{{service_scope}}', '{{manager_name}}', '{{manager_phone}}'],
    isSystem: true,
    updatedAt: '2026-08-01T00:00:00Z'
  }
];

// ====================================================
// INITIAL SAMPLE EMAIL SIGNATURES
// ====================================================
export const INITIAL_EMAIL_SIGNATURES: EmailSignature[] = [
  {
    id: 'sig-corp',
    organizationId: 'org-workqora-primary',
    title: 'Corporate Operations Signature',
    content: `Operations Management | Wongwai Hospitality Group\nWorkqora Enterprise Workforce Platform\noperations@workqora-hospitality.com • www.workqora.com\n"Smarter Work. Better Operations."`,
    isDefault: true
  },
  {
    id: 'sig-store104',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    title: 'Location #104 General Manager Signature',
    content: `Johnathan Cole | General Manager\nWorkqora SF Flagship #104 • 850 Market Street, San Francisco, CA\ngm104@workqora-hospitality.com • (415) 555-0104\nWorkqora Workforce Operations`,
    isDefault: true
  }
];

// ====================================================
// INITIAL EMAIL AUDIT LOGS
// ====================================================
export const INITIAL_EMAIL_AUDIT_LOGS: EmailAuditEvent[] = [
  {
    id: 'audit-em-001',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    actorName: 'Johnathan Cole',
    actorRole: 'General Manager',
    action: 'Email Sent',
    details: 'Sent schedule broadcast to 24 employees from store104@workqora-hospitality.com',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 'audit-em-002',
    organizationId: 'org-workqora-primary',
    locationId: 'loc-sf-flagship',
    actorName: 'System Synchronizer',
    actorRole: 'Automated Worker',
    action: 'Inbox Synchronized',
    details: 'Pulled 6 new messages from Microsoft 365 Exchange Online (delta token: ms-sync-881)',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 'audit-em-003',
    organizationId: 'org-workqora-primary',
    actorName: 'Khomchat Wongwai',
    actorRole: 'Corporate Administrator',
    action: 'Integration Connected',
    details: 'Connected Google Workspace account operations@workqora-hospitality.com with OAuth 2.0 PKCE',
    timestamp: '2026-08-01T08:00:00Z',
    status: 'success'
  }
];

// ====================================================
// RBAC PERMISSION HELPER FOR MAILBOXES
// ====================================================
export function canUserAccessMailbox(
  role: CustomRole | null | undefined,
  connection: BusinessEmailConnection
): boolean {
  if (!role) return false;

  // Corporate Admin or Super Admin has access across all org mailboxes
  if (role.hierarchyScopeLevel === 'organization' || role.code === 'super_admin' || role.code === 'corporate_admin') {
    return true;
  }

  // Regional Manager can access regional mailboxes and stores within their authorized locations
  if (role.hierarchyScopeLevel === 'region') {
    if (connection.scopeLevel === 'region' && connection.regionId === role.assignedNodeId) return true;
    if (connection.locationId && role.authorizedLocationIds?.includes(connection.locationId)) return true;
    return false;
  }

  // HR Manager can access hiring / HR mailboxes
  if (role.code === 'hr_manager' || role.name.toLowerCase().includes('hr') || role.name.toLowerCase().includes('hiring')) {
    if (connection.category === 'hiring' || connection.displayName.toLowerCase().includes('hiring')) return true;
  }

  // Location Manager / General Manager can only access mailboxes belonging to their assigned location
  if (connection.locationId && role.authorizedLocationIds?.includes(connection.locationId)) {
    return true;
  }

  return false;
}

export function canUserSendFromMailbox(
  role: CustomRole | null | undefined,
  connection: BusinessEmailConnection
): boolean {
  if (!role) return false;

  // Check read permission first
  if (!canUserAccessMailbox(role, connection)) return false;

  // General employees cannot send from business mailboxes
  if (role.code === 'employee' || role.hierarchyScopeLevel === 'team') return false;

  return true;
}

// ====================================================
// AI ASSISTANT UTILITY FUNCTIONS
// ====================================================
export function generateEmailAISummary(message: EmailMessage): {
  summary: string;
  actionItems: string[];
  suggestedAction?: {
    actionType: 'task' | 'meeting' | 'maintenance' | 'hiring' | 'inventory';
    title: string;
    description: string;
    prefilledData?: any;
  };
} {
  const text = (message.subject + ' ' + message.bodyText).toLowerCase();

  let summary = `Email from ${message.from.name} regarding ${message.subject}.`;
  let actionItems: string[] = ['Review message details and reply if necessary'];
  let suggestedAction: any = undefined;

  if (text.includes('delivery') || text.includes('produce') || text.includes('order') || text.includes('sysco') || text.includes('us foods')) {
    summary = `Vendor notification regarding incoming food/supplies delivery (${message.from.name}).`;
    actionItems = [
      'Coordinate receiving team at delivery bay',
      'Verify invoice against purchase order manifest',
      'Check temperature compliance upon cargo arrival'
    ];
    suggestedAction = {
      actionType: 'inventory',
      title: `Inventory Delivery: ${message.from.name}`,
      description: `Delivery follow-up for ${message.subject}`,
      prefilledData: {
        vendorName: message.from.name,
        deliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        deliveryTime: '07:00'
      }
    };
  } else if (text.includes('maintenance') || text.includes('repair') || text.includes('cooler') || text.includes('hvac') || text.includes('compressor') || text.includes('technician')) {
    summary = `Equipment service or preventive maintenance update from ${message.from.name}.`;
    actionItems = [
      'Ensure on-duty manager greets technician upon arrival',
      'Inspect completed equipment repair and record sign-off log'
    ];
    suggestedAction = {
      actionType: 'maintenance',
      title: `Equipment Maintenance: ${message.subject}`,
      description: `Technician dispatch for ${message.from.name}`,
      prefilledData: {
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        vendor: message.from.name
      }
    };
  } else if (text.includes('application') || text.includes('resume') || text.includes('interview') || text.includes('bartender') || text.includes('server') || text.includes('cook') || text.includes('experience')) {
    summary = `Candidate job application received from ${message.from.name}.`;
    actionItems = [
      'Verify candidate certifications (RBS, Food Handler)',
      'Schedule screening interview with hiring manager'
    ];
    suggestedAction = {
      actionType: 'hiring',
      title: `Candidate: ${message.from.name}`,
      description: `Job applicant for ${message.subject}`,
      prefilledData: {
        name: message.from.name,
        email: message.from.email
      }
    };
  } else if (text.includes('buyout') || text.includes('catering') || text.includes('party') || text.includes('private dining') || text.includes('meeting') || text.includes('reservation')) {
    summary = `Private dining or event inquiry from ${message.from.name}.`;
    actionItems = [
      'Check venue calendar availability for requested date and guest count',
      'Send custom menu pricing and banquet agreement',
      'Collect deposit and secure event block'
    ];
    suggestedAction = {
      actionType: 'meeting',
      title: `Private Event: ${message.from.name}`,
      description: `Event reservation: ${message.subject}`,
      prefilledData: {
        title: message.subject,
        date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        startTime: '18:00',
        endTime: '22:00'
      }
    };
  }

  return { summary, actionItems, suggestedAction };
}

export function generateAIDraftReply(
  message: EmailMessage,
  tone: 'professional' | 'concise' | 'friendly' | 'schedule_confirm' = 'professional'
): string {
  const senderFirstName = message.from.name.split(' ')[0] || 'there';

  if (message.category === 'inventory') {
    return `Hi ${senderFirstName},\n\nThank you for the delivery update for Order ${message.subject}.\n\nOur kitchen receiving team will be ready at the loading dock for the scheduled window. Please instruct the driver to call the manager line upon arrival.\n\nBest regards,\nWorkqora Operations Team`;
  }

  if (message.category === 'maintenance') {
    return `Hello ${senderFirstName},\n\nThank you for confirming the maintenance visit for ${message.subject}.\n\nWe have scheduled the time window in our Workqora Facilities Calendar and will have our on-duty manager greet your technician.\n\nThank you,\nWorkqora Management`;
  }

  if (message.category === 'hiring') {
    return `Dear ${senderFirstName},\n\nThank you for applying to Workqora Hospitality Group. We have received your application and resume.\n\nOur hiring team is currently reviewing applicant qualifications, and we will reach out shortly regarding next steps and potential interview scheduling.\n\nBest regards,\nWorkqora Talent Acquisition`;
  }

  if (tone === 'schedule_confirm') {
    return `Hi ${senderFirstName},\n\nThank you for your note. We have updated our records in the Workqora Schedule Management system accordingly.\n\nBest regards,\nManagement Team`;
  }

  return `Hello ${senderFirstName},\n\nThank you for contacting Workqora Hospitality. We have received your message regarding "${message.subject}" and are reviewing the details.\n\nWe will follow up with you promptly.\n\nBest regards,\nWorkqora Operations Team`;
}
