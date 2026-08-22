export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'perplexity';

export type AIIntent =
  | 'schedule_optimization'
  | 'labor_analysis'
  | 'overtime_risk'
  | 'staffing_shortage'
  | 'inventory_analysis'
  | 'waste_analysis'
  | 'equipment_maintenance'
  | 'employee_compliance'
  | 'attendance_analysis'
  | 'tardiness_analysis'
  | 'pto_analysis'
  | 'training_analysis'
  | 'operations_summary'
  | 'manager_handoff'
  | 'report_summary'
  | 'policy_question'
  | 'external_research'
  | 'decision_support'
  | 'forecasting'
  | 'general_assistant';

export interface AIProviderConfig {
  id: AIProviderType;
  name: string;
  enabled: boolean;
  model: string;
  maxTokens: number;
  temperature: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  health: 'healthy' | 'degraded' | 'unreachable' | 'unconfigured';
  lastCheckedAt?: string;
  latencyMs?: number;
  specialization: string[];
}

export interface DeterministicFacts {
  // Labor & Schedule
  totalScheduledHours: number;
  projectedLaborCost: number;
  weeklyLaborBudget: number;
  laborVariancePercent: number;
  laborVarianceDollar: number;
  overtimeEmployeesCount: number;
  projectedOvertimeHours: number;
  callOutsCount: number;
  openShiftsCount: number;
  dinnerShortageCount: number;
  
  // Attendance & Punctuality
  tardinessIncidentsToday: number;
  approachingBreakCount: number;
  
  // Compliance & Certifications
  expiredOrExpiringCertCount: number;
  expiringEmployees: { name: string; certName: string; expiryDate: string }[];
  
  // Inventory & Waste
  wasteVariancePercent: number;
  topWasteItem?: { item: string; variancePercent: number; reason?: string };
  inventoryVarianceCount: number;
  lowStockItems: string[];
  
  // Equipment & Maintenance
  overdueMaintenanceCount: number;
  criticalEquipmentAlerts: { assetName: string; problem: string; priority: string }[];
  outOfServiceAssetsCount: number;

  // Operational Health Scores (0-100 deterministic)
  healthScores: {
    overall: number;
    staffing: number;
    labor: number;
    inventory: number;
    waste: number;
    compliance: number;
    equipment: number;
    training: number;
  };
}

export interface AIRecommendation {
  whatHappened: string;
  whyItMatters: string;
  recommendedAction: string;
  expectedImpact: string;
  confidence: 'High' | 'Medium' | 'Low';
  supportingData: string[];
  citations?: { title: string; url: string; snippet?: string }[];
  requiresConfirmation?: boolean;
  actionPayload?: {
    actionType: string;
    targetId?: string;
    params?: Record<string, unknown>;
  };
}

export interface AIRequest {
  prompt: string;
  intent?: AIIntent;
  organizationId: string;
  locationId?: string;
  locationName?: string;
  userId: string;
  userRole: string;
  deterministicFacts: DeterministicFacts;
  customContext?: Record<string, unknown>;
  preferredProvider?: AIProviderType;
  allowExternalSearch?: boolean;
  temperature?: number;
}

export interface AIResponse {
  provider: AIProviderType;
  model: string;
  intent: AIIntent;
  headline: string;
  summary: string;
  recommendation: AIRecommendation;
  rawText?: string;
  citations?: { title: string; url: string; snippet?: string }[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  latencyMs: number;
  fallbackUsed: boolean;
  timestamp: string;
}

export interface ProviderHealthStatus {
  provider: AIProviderType;
  name: string;
  status: 'healthy' | 'degraded' | 'unreachable' | 'unconfigured';
  isConfigured: boolean;
  latencyMs: number;
  errorRate: number;
  totalCalls24h: number;
  estimatedCost24hUsd: number;
  lastError?: string;
}

export interface WorkqoraSavingsRecord {
  id: string;
  category: 'Labor Savings' | 'Overtime Avoided' | 'Waste Reduction' | 'Inventory Loss Prevented' | 'Maintenance Preventive' | 'Manager Time Saved' | 'Compliance Fines Avoided';
  description: string;
  type: 'realized' | 'estimated' | 'potential';
  amountUsd: number;
  identifiedAt: string;
  implementedAt?: string;
  status: 'identified' | 'implemented' | 'dismissed';
  suggestedActionId?: string;
}

export interface OperationsProblemLogItem {
  id: string;
  organizationId: string;
  locationId: string;
  locationName: string;
  department: string;
  problem: string;
  category: 'Scheduling' | 'Vendor Issue' | 'Equipment Failure' | 'Inventory Shortage' | 'Waste Issue' | 'Employee Issue' | 'Training Issue' | 'Admin Task';
  timeLostMinutes: number;
  costImpactUsd: number;
  reportedBy: string;
  reportedAt: string;
  resolution?: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  aiPatternTag?: string;
}

export interface ManagerOnDutySummary {
  rightNow: {
    items: { icon: string; text: string; severity: 'critical' | 'high' | 'normal' }[];
  };
  next2Hours: {
    items: { time: string; event: string; action: string }[];
  };
  restOfShift: {
    items: { label: string; detail: string }[];
  };
  needsAttention: {
    items: { title: string; description: string; actionLabel: string; actionRoute?: string }[];
  };
}

export interface DailyBriefingReport {
  id: string;
  date: string;
  greeting: string;
  executiveSummary: string;
  staffingSummary: string;
  laborSummary: string;
  complianceSummary: string;
  inventorySummary: string;
  equipmentSummary: string;
  topPriorityAction: {
    title: string;
    why: string;
    actionText: string;
  };
  generatedByProvider: AIProviderType;
  generatedAt: string;
}
