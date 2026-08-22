export type MaintenancePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type MaintenanceStatus =
  | 'Draft'
  | 'Open'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting for Approval'
  | 'Waiting for Vendor'
  | 'Waiting for Parts'
  | 'Parts Ordered'
  | 'Service Scheduled'
  | 'Repair Completed'
  | 'Replacement Approved'
  | 'Replacement Ordered'
  | 'Completed'
  | 'Closed'
  | 'Cancelled';

export type MaintenanceRequestType =
  | 'Repair'
  | 'Preventive Maintenance'
  | 'Replacement'
  | 'Inspection'
  | 'Cleaning'
  | 'Installation'
  | 'Vendor Service'
  | 'Safety Issue'
  | 'IT / POS'
  | 'Building Repair'
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Refrigeration'
  | 'Kitchen Equipment'
  | 'Furniture'
  | 'Other';

export interface MaintenanceAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'pdf' | 'document';
  sizeBytes?: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MaintenancePart {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  costUsd: number;
  vendorName: string;
  orderDate?: string;
  expectedDelivery?: string;
  status: 'Needed' | 'Ordered' | 'Shipped' | 'Received' | 'Installed';
}

export interface MaintenanceComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  isInternalOnly: boolean;
  content: string;
  createdAt: string;
  mentions?: string[];
}

export interface MaintenanceApproval {
  id: string;
  requiredLevel: 'GM' | 'Regional Manager' | 'Corporate Finance';
  thresholdUsd: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface MaintenanceVendor {
  id: string;
  name: string;
  serviceType: string;
  contactName: string;
  phone: string;
  email: string;
  emergencyContactPhone?: string;
  serviceArea: string[];
  assignedLocationIds: string[];
  rating: number;
  notes?: string;
}

export interface MaintenanceServiceAppointment {
  id: string;
  vendorId: string;
  vendorName: string;
  technicianName?: string;
  appointmentDate: string;
  startTime: string;
  estimatedDurationHours: number;
  calendarEventId?: string;
  notes?: string;
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Rescheduled';
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string; // e.g. WQ-MNT-104-00284
  organizationId: string;
  locationId: string;
  locationName: string;
  departmentId?: string;
  departmentName?: string;
  
  // Asset link
  assetId?: string;
  assetName?: string;
  assetCategory?: string;
  assetSerialNumber?: string;
  assetModel?: string;
  assetManufacturer?: string;
  assetAgeYears?: number;
  assetWarrantyActive?: boolean;
  assetWarrantyEnd?: string;

  // Request Details
  title: string;
  description: string;
  requestType: MaintenanceRequestType;
  category: string;
  priority: MaintenancePriority;
  safetyRisk: boolean;
  safetyRiskDescription?: string;
  operationalImpact: 'Major Shutdown' | 'Partial Disruption' | 'Minor Issue' | 'None';
  isOutOfService: boolean;

  // Status & Assignment
  status: MaintenanceStatus;
  reportedById: string;
  reportedByName: string;
  reportedByRole: string;
  reportedAt: string;
  preferredServiceDate?: string;
  
  assignedToRole?: string;
  assignedToName?: string;
  assignedVendorId?: string;
  assignedVendorName?: string;

  // Financials & Repair vs Replace
  estimatedCostUsd: number;
  actualCostUsd: number;
  laborCostUsd: number;
  partsCostUsd: number;
  vendorCostUsd: number;
  replacementRequested: boolean;
  replacementReason?: string;
  estimatedReplacementCostUsd?: number;

  // SLA & Deadlines
  slaTargetMinutes: number;
  slaAcknowledgedAt?: string;
  slaDueAt: string;
  isSlaOverdue: boolean;

  // Downtime
  outOfServiceStart?: string;
  returnedToServiceAt?: string;
  totalDowntimeHours?: number;

  // Children collections
  attachments: MaintenanceAttachment[];
  parts: MaintenancePart[];
  comments: MaintenanceComment[];
  approvals: MaintenanceApproval[];
  appointments: MaintenanceServiceAppointment[];

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  closedAt?: string;
}

export interface PreventiveMaintenanceSchedule {
  id: string;
  assetId: string;
  assetName: string;
  locationId: string;
  locationName: string;
  taskTitle: string;
  description: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom';
  intervalDays: number;
  lastPerformedDate: string;
  nextDueDate: string;
  assignedRoleOrVendor: string;
  estimatedCostUsd: number;
  isOverdue: boolean;
  autoCreateTicket: boolean;
}

export interface RepairVsReplaceAnalysis {
  assetId: string;
  assetName: string;
  ageYears: number;
  initialPurchasePriceUsd: number;
  repairsLast12MonthsCount: number;
  totalRepairCostLast12MonthsUsd: number;
  estimatedReplacementCostUsd: number;
  repairToReplacementRatioPercent: number;
  aiRecommendation: 'Replace' | 'Repair' | 'Review with Regional Manager';
  reasoning: string;
}
