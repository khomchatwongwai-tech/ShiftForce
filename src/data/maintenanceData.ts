import {
  MaintenanceTicket,
  MaintenanceVendor,
  PreventiveMaintenanceSchedule,
  RepairVsReplaceAnalysis
} from '../types/maintenance';

export const INITIAL_VENDORS: MaintenanceVendor[] = [
  {
    id: 'vnd-001',
    name: 'Pacific Commercial Refrigeration & HVAC',
    serviceType: 'Refrigeration & HVAC',
    contactName: 'Dave Miller',
    phone: '(555) 234-8901',
    email: 'dispatch@pacificrefrig.com',
    emergencyContactPhone: '(555) 234-8999',
    serviceArea: ['Greater Metro', 'Downtown District', 'Westside'],
    assignedLocationIds: ['loc-001', 'loc-002', 'loc-003'],
    rating: 4.9,
    notes: 'Primary 24/7 commercial emergency vendor with 2-hour response SLA contract.'
  },
  {
    id: 'vnd-002',
    name: 'Apex Commercial Kitchen Equipment Repair',
    serviceType: 'Kitchen & Cooking Equipment',
    contactName: 'Carlos Ramirez',
    phone: '(555) 456-1122',
    email: 'service@apexkitchenpros.com',
    emergencyContactPhone: '(555) 456-9911',
    serviceArea: ['Greater Metro', 'Valley District'],
    assignedLocationIds: ['loc-001', 'loc-002'],
    rating: 4.8,
    notes: 'Certified for Rational Combi Ovens, Pitco Fryers, and Hobart Dishwashers.'
  },
  {
    id: 'vnd-003',
    name: 'Metro Flow Emergency Commercial Plumbing',
    serviceType: 'Plumbing & Grease Traps',
    contactName: 'Frankie Sullivan',
    phone: '(555) 789-3344',
    email: 'support@metroflowplumbing.com',
    emergencyContactPhone: '(555) 789-9900',
    serviceArea: ['Greater Metro', 'Airport District'],
    assignedLocationIds: ['loc-001', 'loc-002', 'loc-003'],
    rating: 4.7,
    notes: 'Handles grease trap jetting, sewer line snaking, and backflow preventer tests.'
  },
  {
    id: 'vnd-004',
    name: 'Square & Toast POS Hardware Direct',
    serviceType: 'IT & POS Hardware',
    contactName: 'Sarah Lin',
    phone: '(800) 555-0199',
    email: 'hardware-support@toasttab-partner.com',
    serviceArea: ['All Corporate Locations'],
    assignedLocationIds: ['loc-001', 'loc-002', 'loc-003', 'loc-004'],
    rating: 4.9,
    notes: 'Next-day replacement terminal swap and receipt printer warranty repair.'
  }
];

export const INITIAL_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'WQ-MNT-104-00284',
    organizationId: 'org-kura-us',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104 (Downtown Flagship)',
    departmentId: 'dept-kitchen',
    departmentName: 'Kitchen / BOH',
    assetId: 'eq-001',
    assetName: 'Walk-In Freezer #2 (Primary Protein Storage)',
    assetCategory: 'Refrigeration',
    assetSerialNumber: 'WIF-2018-9921',
    assetModel: 'Master-Bilt MB-400X',
    assetManufacturer: 'Master-Bilt Refrigeration',
    assetAgeYears: 6.2,
    assetWarrantyActive: false,
    title: 'Temperature not holding below 41°F (Holding at 44.5°F)',
    description: 'Walk-in freezer temperature alarm triggered during morning check. Compressor fan is running intermittently with clicking noise. Product temporarily moved to Aux Freezer #1.',
    requestType: 'Repair',
    category: 'Refrigeration',
    priority: 'Critical',
    safetyRisk: true,
    safetyRiskDescription: 'Food safety hazard: raw seafood and protein core temperature cannot exceed 41°F under Health Code Title 22.',
    operationalImpact: 'Major Shutdown',
    isOutOfService: true,
    status: 'In Progress',
    reportedById: 'emp-001',
    reportedByName: 'Marcus Vance',
    reportedByRole: 'General Manager',
    reportedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    preferredServiceDate: new Date().toISOString().split('T')[0],
    assignedToRole: 'Facilities Manager',
    assignedToName: 'Dave Miller (Pacific Refrigeration)',
    assignedVendorId: 'vnd-001',
    assignedVendorName: 'Pacific Commercial Refrigeration & HVAC',
    estimatedCostUsd: 1200,
    actualCostUsd: 0,
    laborCostUsd: 450,
    partsCostUsd: 750,
    vendorCostUsd: 1200,
    replacementRequested: false,
    slaTargetMinutes: 60,
    slaAcknowledgedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    slaDueAt: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
    isSlaOverdue: false,
    outOfServiceStart: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    attachments: [
      {
        id: 'att-1',
        name: 'digital_temp_probe_reading.jpg',
        url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
        type: 'image',
        uploadedBy: 'Marcus Vance',
        uploadedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    parts: [
      {
        id: 'prt-1',
        partName: 'Defrost Timer Control Board & Sensor',
        partNumber: 'MB-DT-449',
        quantity: 1,
        costUsd: 480,
        vendorName: 'Pacific Refrigeration',
        status: 'Ordered',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDelivery: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
      }
    ],
    comments: [
      {
        id: 'com-1',
        authorId: 'emp-001',
        authorName: 'Marcus Vance (GM)',
        authorRole: 'General Manager',
        isInternalOnly: false,
        content: 'Technician Dave is on route. ETA is 11:30 AM before lunch rush starts.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'com-2',
        authorId: 'usr-tech-01',
        authorName: 'Dave Miller',
        authorRole: 'HVAC Certified Tech',
        isInternalOnly: false,
        content: 'On site. Checked refrigerant pressure (R404A) - pressure is normal. Defrost timer board relay failed. Replacing board now.',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ],
    approvals: [
      {
        id: 'appr-1',
        requiredLevel: 'GM',
        thresholdUsd: 500,
        status: 'Approved',
        approverName: 'Marcus Vance',
        approvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        notes: 'Emergency service authorized under critical food safety protocol.'
      }
    ],
    appointments: [
      {
        id: 'apt-1',
        vendorId: 'vnd-001',
        vendorName: 'Pacific Commercial Refrigeration & HVAC',
        technicianName: 'Dave Miller',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '11:00 AM',
        estimatedDurationHours: 2,
        notes: 'Priority emergency dispatch',
        status: 'In Progress'
      }
    ],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'tkt-002',
    ticketNumber: 'WQ-MNT-104-00281',
    organizationId: 'org-kura-us',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104 (Downtown Flagship)',
    departmentId: 'dept-foh',
    departmentName: 'Front of House',
    assetId: 'eq-004',
    assetName: 'Main Terminal POS #1 & Cash Drawer',
    assetCategory: 'IT / POS',
    assetSerialNumber: 'POS-TST-8834',
    assetModel: 'Toast Flex 14-inch',
    assetManufacturer: 'Toast Inc.',
    assetAgeYears: 2.1,
    assetWarrantyActive: true,
    title: 'Touchscreen digitizer unresponsive in lower right quadrant',
    description: 'Servers unable to select Payment/Close Check buttons on Terminal #1. Restarted 3 times without resolution.',
    requestType: 'Repair',
    category: 'IT / POS',
    priority: 'High',
    safetyRisk: false,
    operationalImpact: 'Partial Disruption',
    isOutOfService: false,
    status: 'Parts Ordered',
    reportedById: 'emp-002',
    reportedByName: 'Elena Rostova',
    reportedByRole: 'Floor Manager',
    reportedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    assignedToRole: 'IT Support',
    assignedToName: 'Sarah Lin (Toast Hardware)',
    assignedVendorId: 'vnd-004',
    assignedVendorName: 'Square & Toast POS Hardware Direct',
    estimatedCostUsd: 0,
    actualCostUsd: 0,
    laborCostUsd: 0,
    partsCostUsd: 0,
    vendorCostUsd: 0,
    replacementRequested: false,
    slaTargetMinutes: 240,
    slaDueAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    isSlaOverdue: false,
    attachments: [],
    parts: [
      {
        id: 'prt-2',
        partName: 'Toast Flex Replacement Screen Display Unit',
        partNumber: 'TST-FLX-DP',
        quantity: 1,
        costUsd: 0,
        vendorName: 'Toast Direct Warranty',
        status: 'Shipped',
        orderDate: new Date(Date.now() - 18 * 3600 * 1000).toISOString().split('T')[0],
        expectedDelivery: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
      }
    ],
    comments: [
      {
        id: 'com-201',
        authorId: 'usr-tech-04',
        authorName: 'Sarah Lin (Toast)',
        authorRole: 'Hardware Specialist',
        isInternalOnly: false,
        content: 'FedEx Overnight tracking #77491028441 dispatched. Includes return box for defective unit under RMA #66291.',
        createdAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
      }
    ],
    approvals: [],
    appointments: [],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString()
  },
  {
    id: 'tkt-003',
    ticketNumber: 'WQ-MNT-104-00279',
    organizationId: 'org-kura-us',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104 (Downtown Flagship)',
    departmentId: 'dept-dish',
    departmentName: 'Dish & Sanitation',
    assetId: 'eq-003',
    assetName: 'Hobart Commercial High-Temp Conveyor Dishwasher',
    assetCategory: 'Kitchen Equipment',
    assetSerialNumber: 'HOB-CONV-5510',
    assetModel: 'Hobart CL44e',
    assetManufacturer: 'Hobart Corporation',
    assetAgeYears: 8.4,
    assetWarrantyActive: false,
    title: 'Rinse Booster Heater Tripping Circuit Breaker & Spray Arm Wear',
    description: 'High-temp sanitizing rinse failing to reach mandatory 180°F. Breaker tripped twice during heavy Friday dinner rush.',
    requestType: 'Replacement',
    category: 'Kitchen Equipment',
    priority: 'High',
    safetyRisk: true,
    safetyRiskDescription: 'High-temp sanitization requires sustained 180°F final rinse water per FDA Food Code §4-703.11.',
    operationalImpact: 'Partial Disruption',
    isOutOfService: false,
    status: 'Waiting for Approval',
    reportedById: 'emp-001',
    reportedByName: 'Marcus Vance',
    reportedByRole: 'General Manager',
    reportedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    assignedToRole: 'Regional Facilities Director',
    assignedToName: 'Kenji Takahashi (Regional Ops)',
    assignedVendorId: 'vnd-002',
    assignedVendorName: 'Apex Commercial Kitchen Equipment Repair',
    estimatedCostUsd: 3400,
    actualCostUsd: 0,
    laborCostUsd: 600,
    partsCostUsd: 2800,
    vendorCostUsd: 3400,
    replacementRequested: true,
    replacementReason: 'Unit is 8.4 years old. Has required 5 repair calls totaling $4,850 in past 14 months. Booster tank has hairline stress fracture.',
    estimatedReplacementCostUsd: 8500,
    slaTargetMinutes: 480,
    slaDueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    isSlaOverdue: false,
    attachments: [],
    parts: [],
    comments: [
      {
        id: 'com-301',
        authorId: 'emp-001',
        authorName: 'Marcus Vance (GM)',
        authorRole: 'General Manager',
        isInternalOnly: true,
        content: 'Workqora AI recommends replacement analysis review rather than spending another $3,400 on repair.',
        createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
      }
    ],
    approvals: [
      {
        id: 'appr-301',
        requiredLevel: 'Regional Manager',
        thresholdUsd: 2500,
        status: 'Pending',
        notes: 'Submitted to Regional Director for Capex vs Repair authorization.'
      }
    ],
    appointments: [],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
  }
];

export const INITIAL_PREVENTIVE_SCHEDULES: PreventiveMaintenanceSchedule[] = [
  {
    id: 'pm-001',
    assetId: 'eq-001',
    assetName: 'Walk-In Freezer & Cooler Condenser Coil Cleaning',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104',
    taskTitle: 'Quarterly Condenser Coil Brush & Pressure Wash',
    description: 'Clean evaporator and rooftop condenser coils to maintain thermodynamic efficiency and prevent compressor overload.',
    frequency: 'Quarterly',
    intervalDays: 90,
    lastPerformedDate: '2026-05-15',
    nextDueDate: '2026-08-15',
    assignedRoleOrVendor: 'Pacific Commercial Refrigeration',
    estimatedCostUsd: 350,
    isOverdue: true,
    autoCreateTicket: true
  },
  {
    id: 'pm-002',
    assetId: 'eq-005',
    assetName: 'Main Kitchen Grease Trap Interceptor',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104',
    taskTitle: 'Monthly 500-Gallon Grease Trap Pump-Out & Jetting',
    description: 'Certified grease interceptor hydro-jetting and municipal FOG compliance log certification.',
    frequency: 'Monthly',
    intervalDays: 30,
    lastPerformedDate: '2026-07-28',
    nextDueDate: '2026-08-28',
    assignedRoleOrVendor: 'Metro Flow Emergency Commercial Plumbing',
    estimatedCostUsd: 420,
    isOverdue: false,
    autoCreateTicket: true
  },
  {
    id: 'pm-003',
    assetId: 'eq-006',
    assetName: 'Kitchen Hood Fire Suppression & Extinguishers (Ansul R-102)',
    locationId: 'loc-001',
    locationName: 'Kura Sushi #104',
    taskTitle: 'Semi-Annual Fire Marshal Compliance Certification',
    description: 'Verify fusible link integrity, nozzle caps, hydrostatic cylinder certification, and manual pull station.',
    frequency: 'Quarterly',
    intervalDays: 180,
    lastPerformedDate: '2026-03-10',
    nextDueDate: '2026-09-10',
    assignedRoleOrVendor: 'Guardian Fire Safety Pros',
    estimatedCostUsd: 280,
    isOverdue: false,
    autoCreateTicket: true
  }
];

export const INITIAL_REPAIR_VS_REPLACE_ANALYSES: RepairVsReplaceAnalysis[] = [
  {
    assetId: 'eq-003',
    assetName: 'Hobart Commercial High-Temp Conveyor Dishwasher (CL44e)',
    ageYears: 8.4,
    initialPurchasePriceUsd: 9200,
    repairsLast12MonthsCount: 5,
    totalRepairCostLast12MonthsUsd: 4850,
    estimatedReplacementCostUsd: 8500,
    repairToReplacementRatioPercent: 57,
    aiRecommendation: 'Replace',
    reasoning: 'Cumulative 12-month repair spend ($4,850) exceeds 50% of brand-new machine replacement cost ($8,500). High probability of repetitive booster failure and water damage risk.'
  },
  {
    assetId: 'eq-001',
    assetName: 'Master-Bilt Walk-In Freezer #2',
    ageYears: 6.2,
    initialPurchasePriceUsd: 14000,
    repairsLast12MonthsCount: 2,
    totalRepairCostLast12MonthsUsd: 1680,
    estimatedReplacementCostUsd: 15500,
    repairToReplacementRatioPercent: 11,
    aiRecommendation: 'Repair',
    reasoning: 'Compressor box and insulated panels remain in good condition. Repairing the defrost board ($1,200) is cost-efficient and preserves asset life for another 4–5 years.'
  }
];
