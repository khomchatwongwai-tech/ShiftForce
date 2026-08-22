import { EquipmentItem, EquipmentWorkOrder, PreventiveMaintenanceTask, EquipmentSubTab } from '../types';

export interface EquipmentSubTabDef {
  id: EquipmentSubTab;
  name: string;
  shortLabel: string;
  iconName: string;
  category: 'core' | 'maintenance' | 'monitoring' | 'specialized' | 'finance_governance';
  badgeCount?: number;
  description: string;
}

export const EQUIPMENT_SUB_TABS: EquipmentSubTabDef[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    name: '1. Executive Health Dashboard',
    shortLabel: 'Dashboard',
    iconName: 'LayoutDashboard',
    category: 'core',
    description: 'Real-time telemetry, equipment uptime KPIs, open work orders, and health metrics.'
  },
  // 2. All Equipment
  {
    id: 'all_equipment',
    name: '2. All Equipment Master Directory',
    shortLabel: 'All Equipment',
    iconName: 'Cpu',
    category: 'core',
    badgeCount: 24,
    description: 'Complete centralized registry of all commercial kitchen, bar, HVAC, and POS assets.'
  },
  // 3. QR Scanner
  {
    id: 'qr_scanner',
    name: '3. QR Scanner & Fast Lookup',
    shortLabel: 'QR Scanner',
    iconName: 'QrCode',
    category: 'core',
    description: 'Instant barcode & QR camera scanner for mobile equipment auditing, logs, and fast dispatch.'
  },
  // 4. Preventive Maintenance
  {
    id: 'preventive_maintenance',
    name: '4. Preventive Maintenance (PM)',
    shortLabel: 'Preventive Maint.',
    iconName: 'CalendarCheck',
    category: 'maintenance',
    badgeCount: 4,
    description: 'Automated recurring maintenance cycles, recurring task calendars, and filter schedules.'
  },
  // 5. Work Orders
  {
    id: 'work_orders',
    name: '5. Work Orders & Repair Tickets',
    shortLabel: 'Work Orders',
    iconName: 'Wrench',
    category: 'maintenance',
    badgeCount: 3,
    description: 'Active repair tickets, technician assignment, priority triage, and work status kanban.'
  },
  // 6. Breakdown Reports
  {
    id: 'breakdown_reports',
    name: '6. Emergency Breakdown Reports',
    shortLabel: 'Breakdowns',
    iconName: 'AlertTriangle',
    category: 'maintenance',
    badgeCount: 1,
    description: 'Rapid incident logging for line-down emergencies with automatic contractor dispatch.'
  },
  // 7. Vendors & Technicians
  {
    id: 'vendors_technicians',
    name: '7. Vendors & Certified Technicians',
    shortLabel: 'Vendors & Techs',
    iconName: 'Users2',
    category: 'maintenance',
    description: 'Authorized service contractors, emergency hotlines, SLA agreements, and hourly rates.'
  },
  // 8. Spare Parts & Consumables
  {
    id: 'spare_parts',
    name: '8. Spare Parts & Gaskets Inventory',
    shortLabel: 'Spare Parts',
    iconName: 'Package',
    category: 'maintenance',
    badgeCount: 18,
    description: 'Stock levels of replacement valves, door gaskets, heating elements, and water filters.'
  },
  // 9. Warranties & Service Contracts
  {
    id: 'warranties_contracts',
    name: '9. Warranties & AMC Contracts',
    shortLabel: 'Warranties & AMC',
    iconName: 'FileCheck',
    category: 'finance_governance',
    description: 'Manufacturer warranty coverage, annual maintenance contract dates, and claim tracking.'
  },
  // 10. Inspections & Checklists
  {
    id: 'inspections_checklists',
    name: '10. Daily Inspections & Checklists',
    shortLabel: 'Inspections & Audits',
    iconName: 'ClipboardList',
    category: 'monitoring',
    description: 'Daily opening/closing machine audit checklists, deep fryer boil-out, and hood logs.'
  },
  // 11. IoT & Temperature Sensors
  {
    id: 'iot_temperature',
    name: '11. IoT Live Temperature Telemetry',
    shortLabel: 'IoT Telemetry',
    iconName: 'Activity',
    category: 'monitoring',
    badgeCount: 2,
    description: 'Wireless IoT probe monitoring for walk-in chillers, blast freezers, and HACCP limits.'
  },
  // 12. Safety & Compliance
  {
    id: 'safety_compliance',
    name: '12. Safety, OSHA & Fire Standards',
    shortLabel: 'Safety & Compliance',
    iconName: 'ShieldAlert',
    category: 'finance_governance',
    description: 'Ansul fire suppression certifications, NSF standards, gas safety valves, and electrical audits.'
  },
  // 13. Lifecycle & Depreciation
  {
    id: 'lifecycle_depreciation',
    name: '13. Asset Lifecycle & Depreciation',
    shortLabel: 'Lifecycle & Depr.',
    iconName: 'TrendingDown',
    category: 'finance_governance',
    description: 'Straight-line book value depreciation, estimated scrap timeline, and replacement year.'
  },
  // 14. Service History
  {
    id: 'service_history',
    name: '14. Service & Historical Work Log',
    shortLabel: 'Service History',
    iconName: 'History',
    category: 'maintenance',
    description: 'Immutable historical audit trail of all repairs, parts swapped, and costs incurred.'
  },
  // 15. Energy & Utilities
  {
    id: 'energy_utilities',
    name: '15. Energy, Gas & Water Utilities',
    shortLabel: 'Energy & Utilities',
    iconName: 'Zap',
    category: 'monitoring',
    description: 'Kilowatt-hour, therms, and gallon consumption tracking per kitchen line and station.'
  },
  // 16. Smallwares & Tools
  {
    id: 'smallwares_tools',
    name: '16. Smallwares & Culinary Tools',
    shortLabel: 'Smallwares & Tools',
    iconName: 'Utensils',
    category: 'specialized',
    description: 'Chef knives, induction pans, vitamix blenders, precision thermometers, and checkout logs.'
  },
  // 17. POS & IT Hardware
  {
    id: 'pos_hardware',
    name: '17. POS, Terminals & KDS Displays',
    shortLabel: 'POS & KDS IT',
    iconName: 'Monitor',
    category: 'specialized',
    description: 'Kitchen display systems (KDS), thermal receipt printers, barcode guns, and cash drawers.'
  },
  // 18. Refrigeration & HVAC
  {
    id: 'refrigeration_hvac',
    name: '18. Refrigeration & Rooftop HVAC',
    shortLabel: 'Refrig. & HVAC',
    iconName: 'Snowflake',
    category: 'specialized',
    description: 'Compressors, condenser coils, ice machine sanitizing cycles, and RTU rooftop air filters.'
  },
  // 19. Sanitation & Dishwashers
  {
    id: 'sanitation_dishwashers',
    name: '19. Sanitation & Dishwashers',
    shortLabel: 'Dish & Sanitation',
    iconName: 'Droplets',
    category: 'specialized',
    description: 'Conveyor dishwashers, 180°F sanitizing rinse booster heaters, and chemical pump calibration.'
  },
  // 20. Disposal & Salvage
  {
    id: 'disposal_salvage',
    name: '20. Disposal, Salvage & E-Waste',
    shortLabel: 'Disposal & Salvage',
    iconName: 'Trash2',
    category: 'finance_governance',
    description: 'Decommissioned appliances, EPA refrigerant recovery logs, and metal scrap salvage values.'
  },
  // 21. Manuals & Training
  {
    id: 'manuals_training',
    name: '21. Digital Manuals, SOPs & Videos',
    shortLabel: 'Manuals & SOPs',
    iconName: 'BookOpen',
    category: 'core',
    description: 'Wiring schematics, operational cleaning SOP guides, and equipment safety training videos.'
  },
  // 22. Cost Analytics & CapEx Planning
  {
    id: 'cost_analytics_capex',
    name: '22. Cost Analytics & CapEx Planning',
    shortLabel: 'CapEx & Cost ROI',
    iconName: 'LineChart',
    category: 'finance_governance',
    description: 'Repair vs replace ROI decision matrix, annual maintenance spend, and capital budget allocation.'
  }
];

export const INITIAL_EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    id: 'eq-001',
    name: 'Rational iCombi Pro 10-Pan Combi Oven',
    modelNumber: 'ICP 10-FULL-E',
    serialNumber: 'E10SJ2508001928',
    manufacturer: 'Rational USA',
    category: 'cooking',
    station: 'Hot Line - Station 1',
    department: 'Back of House',
    status: 'operational',
    purchaseDate: '2024-03-15',
    purchaseCost: 28500,
    currentValue: 24200,
    warrantyExpiry: '2027-03-15',
    nextPmDate: '2026-09-01',
    assignedTechnician: 'Apex Commercial Kitchen Service',
    vendorName: 'Rational Direct Care',
    vendorPhone: '(888) 320-7274',
    tempReading: 375,
    tempTarget: '350°F - 450°F',
    powerRating: '208V / 3-Phase / 37.4 kW',
    notes: 'Descaling cycle performed last week. All heating elements verified at 99.8% output.'
  },
  {
    id: 'eq-002',
    name: 'True T-49-HC 2-Door Reach-In Chiller',
    modelNumber: 'T-49-HC',
    serialNumber: 'TRU-892184-2023',
    manufacturer: 'True Manufacturing',
    category: 'refrigeration',
    station: 'Prep Line - Station 3',
    department: 'Kitchen Prep & Dish',
    status: 'operational',
    purchaseDate: '2023-06-20',
    purchaseCost: 6200,
    currentValue: 4800,
    warrantyExpiry: '2026-06-20',
    nextPmDate: '2026-08-30',
    assignedTechnician: 'CoolTech HVAC & Cold Systems',
    vendorName: 'CoolTech Refrigeration Inc.',
    vendorPhone: '(800) 456-7890',
    tempReading: 36.4,
    tempTarget: '34°F - 38°F',
    powerRating: '115V / 1-Phase / 0.5 HP',
    notes: 'Condenser coils vacuumed monthly. IoT sensor probe battery at 94%.'
  },
  {
    id: 'eq-003',
    name: 'Hobart CL44e High-Temp Conveyor Dishwasher',
    modelNumber: 'CL44e-BAS',
    serialNumber: 'HOB-44-883921',
    manufacturer: 'Hobart Commercial',
    category: 'dishwashing',
    station: 'Dish Pit & Stewarding',
    department: 'Kitchen Prep & Dish',
    status: 'warning',
    purchaseDate: '2022-11-10',
    purchaseCost: 22400,
    currentValue: 15800,
    warrantyExpiry: '2025-11-10',
    nextPmDate: '2026-08-25',
    assignedTechnician: 'Hobart Service Solutions',
    vendorName: 'Hobart National Support',
    vendorPhone: '(888) 446-2278',
    tempReading: 178,
    tempTarget: '180°F Sanitizing Rinse',
    powerRating: '480V / 3-Phase / 30 kW',
    notes: 'Rinse booster temp running at 178°F (slightly below 180°F target). Tech scheduled for element inspection.'
  },
  {
    id: 'eq-004',
    name: 'Pitco SG14-S Solstice Natural Gas Fryer (Bank 1)',
    modelNumber: 'SG14-S-NAT',
    serialNumber: 'PIT-99302194',
    manufacturer: 'Pitco Frialator',
    category: 'cooking',
    station: 'Fry Station - Hot Line',
    department: 'Back of House',
    status: 'operational',
    purchaseDate: '2024-01-12',
    purchaseCost: 4100,
    currentValue: 3600,
    warrantyExpiry: '2026-01-12',
    nextPmDate: '2026-09-10',
    assignedTechnician: 'GasMaster Commercial Tech',
    vendorName: 'Pitco Regional Service',
    vendorPhone: '(800) 258-3708',
    tempReading: 350,
    tempTarget: '350°F',
    powerRating: '110,000 BTU / Natural Gas',
    notes: 'Boil-out completed every Monday morning. High-limit safety thermostat verified.'
  },
  {
    id: 'eq-005',
    name: 'Master-Bilt Walk-In Blast Freezer (12x10 ft)',
    modelNumber: 'MB-1210-BLAST',
    serialNumber: 'MB-FREEZE-77310',
    manufacturer: 'Master-Bilt Refrigeration',
    category: 'refrigeration',
    station: 'BOH Storage & Receiving',
    department: 'Back of House',
    status: 'operational',
    purchaseDate: '2023-01-18',
    purchaseCost: 19800,
    currentValue: 16500,
    warrantyExpiry: '2028-01-18',
    nextPmDate: '2026-09-05',
    assignedTechnician: 'CoolTech HVAC & Cold Systems',
    vendorName: 'Master-Bilt Factory Rep',
    vendorPhone: '(800) 647-1284',
    tempReading: -8.2,
    tempTarget: '-10°F to 0°F',
    powerRating: '230V / 3-Phase / 3.5 HP',
    notes: 'Defrost cycle set to 03:00 AM daily. Door heater strip functioning normally.'
  },
  {
    id: 'eq-006',
    name: 'La Marzocco Linea PB 3-Group Espresso Machine',
    modelNumber: 'LINEA-PB-3G-AV',
    serialNumber: 'LM-PB-34821',
    manufacturer: 'La Marzocco',
    category: 'beverage_bar',
    station: 'Main Barista Station',
    department: 'Bar & Beverage',
    status: 'operational',
    purchaseDate: '2024-04-10',
    purchaseCost: 21500,
    currentValue: 19800,
    warrantyExpiry: '2026-04-10',
    nextPmDate: '2026-09-15',
    assignedTechnician: 'Artisan Espresso Tech Group',
    vendorName: 'La Marzocco USA',
    vendorPhone: '(206) 706-9104',
    tempReading: 200.5,
    tempTarget: '200°F Boiler Temp',
    powerRating: '220V / 1-Phase / 6.1 kW',
    notes: 'Dual boiler PID tuned. Reverse osmosis water hardness monitored weekly (45 ppm).'
  },
  {
    id: 'eq-007',
    name: 'Toast POS Terminal 1 (Main Host Stand)',
    modelNumber: 'TOAST-FLEX-V3',
    serialNumber: 'TST-FLX-99482',
    manufacturer: 'Toast Inc.',
    category: 'pos_it',
    station: 'Host & Front Entry',
    department: 'Front of House',
    status: 'operational',
    purchaseDate: '2024-08-01',
    purchaseCost: 1200,
    currentValue: 1100,
    warrantyExpiry: '2027-08-01',
    nextPmDate: '2026-10-01',
    assignedTechnician: 'Toast Enterprise IT Support',
    vendorName: 'Toast Hardware Care',
    vendorPhone: '(855) 862-7876',
    powerRating: 'PoE 802.3at / 30W',
    notes: 'Latest firmware 4.19.2 patched. Magnetic card swipe and tap-to-pay calibrated.'
  },
  {
    id: 'eq-008',
    name: 'CaptiveAire Kitchen Hood Exhaust & Make-Up Air',
    modelNumber: 'CAP-ND-2-16FT',
    serialNumber: 'CAP-HOOD-55021',
    manufacturer: 'CaptiveAire Systems',
    category: 'hvac_facility',
    station: 'Roof & Hot Line Exhaust',
    department: 'Back of House',
    status: 'operational',
    purchaseDate: '2023-04-12',
    purchaseCost: 34000,
    currentValue: 28900,
    warrantyExpiry: '2028-04-12',
    nextPmDate: '2026-09-01',
    assignedTechnician: 'AirFlow Hood Services',
    vendorName: 'CaptiveAire Direct',
    vendorPhone: '(800) 334-9256',
    powerRating: '460V / 3-Phase / 15 HP Blower',
    notes: 'Quarterly degreasing certified on 2026-06-15. Fire damper actuators tested.'
  }
];

export const INITIAL_WORK_ORDERS: EquipmentWorkOrder[] = [
  {
    id: 'wo-801',
    equipmentId: 'eq-003',
    equipmentName: 'Hobart CL44e Conveyor Dishwasher',
    title: 'Sanitizing booster element inspection (temp 178°F vs 180°F required)',
    description: 'Health inspection compliance requirement: final rinse booster temperature dipped below 180°F during dinner peak. Calibrate heating element and replace sensor gasket.',
    priority: 'high',
    status: 'in_progress',
    reportedBy: 'Carlos Mendoza (Exec Chef)',
    assignedVendor: 'Hobart National Support',
    assignedTech: 'Dave Miller (Certified Hobart Tech)',
    createdAt: '2026-08-20T14:30:00Z',
    dueDate: '2026-08-23T18:00:00Z',
    estimatedCost: 380,
    notes: 'Tech on site tomorrow at 9:00 AM before lunch rush.'
  },
  {
    id: 'wo-802',
    equipmentId: 'eq-002',
    equipmentName: 'True T-49-HC 2-Door Chiller',
    title: 'Routine 90-Day Condenser Coil Deep Clean & Gasket Tightening',
    description: 'Scheduled preventive work order: vacuum condenser coils, test door magnetic seal tension, and calibrate digital thermostat.',
    priority: 'medium',
    status: 'open',
    reportedBy: 'Workqora Auto PM Engine',
    assignedVendor: 'CoolTech Refrigeration Inc.',
    createdAt: '2026-08-19T08:00:00Z',
    dueDate: '2026-08-30T17:00:00Z',
    estimatedCost: 150
  },
  {
    id: 'wo-803',
    equipmentId: 'eq-006',
    equipmentName: 'La Marzocco Linea PB 3-Group Espresso Machine',
    title: 'Group 2 Portafilter Gasket & Shower Screen Replacement',
    description: 'Minor water seepage observed around Group 2 during 9-bar extraction. Replace silicone gasket ring and precision shower screen.',
    priority: 'low',
    status: 'waiting_parts',
    reportedBy: 'Maya Chen (Head Barista)',
    assignedVendor: 'Artisan Espresso Tech Group',
    createdAt: '2026-08-18T11:20:00Z',
    dueDate: '2026-08-25T12:00:00Z',
    estimatedCost: 85
  }
];

export const INITIAL_PM_TASKS: PreventiveMaintenanceTask[] = [
  {
    id: 'pm-101',
    equipmentId: 'eq-001',
    equipmentName: 'Rational iCombi Pro 10-Pan',
    taskTitle: 'Automatic CareControl Tablet Descaling & Boiler Rinse',
    frequency: 'daily',
    lastCompletedDate: '2026-08-21',
    nextDueDate: '2026-08-22',
    assignedRole: 'Closing Kitchen Supervisor',
    checklistItems: [
      'Insert Active Green cleaning tabs into basket',
      'Insert Care tabs into drawer',
      'Lock chamber door and initiate CleanJet Cycle 4',
      'Inspect door gasket for food debris or tears'
    ],
    status: 'due_today'
  },
  {
    id: 'pm-102',
    equipmentId: 'eq-004',
    equipmentName: 'Pitco SG14-S Gas Fryer Bank',
    taskTitle: 'Weekly Fryer Boil-Out, Neutralization & Filter Inspection',
    frequency: 'weekly',
    lastCompletedDate: '2026-08-18',
    nextDueDate: '2026-08-25',
    assignedRole: 'Lead Fry Cook',
    checklistItems: [
      'Drain used frying oil into recycling drum',
      'Fill with water and heavy-duty degreasing boil-out compound',
      'Simmer at 195°F for 25 minutes (do NOT boil over)',
      'Rinse thoroughly with vinegar-water neutralization mix',
      'Wipe down heating tubes and replace paper filter envelope'
    ],
    status: 'pending'
  },
  {
    id: 'pm-103',
    equipmentId: 'eq-008',
    equipmentName: 'CaptiveAire Hood Exhaust & Make-Up Air',
    taskTitle: 'Monthly Baffle Filter Dishwasher Cycle & Grease Cup Drain',
    frequency: 'monthly',
    lastCompletedDate: '2026-07-28',
    nextDueDate: '2026-08-28',
    assignedRole: 'Stewarding Lead',
    checklistItems: [
      'Remove all stainless steel baffle grease filters using lifting hook',
      'Run baffle filters through conveyor dishwasher 2 times',
      'Empty and clean grease collection gutters and catch cups',
      'Check fan belt deflection and bearing grease levels'
    ],
    status: 'pending'
  }
];
