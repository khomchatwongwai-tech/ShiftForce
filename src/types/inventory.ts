import { Department } from '../types';

export type InventoryCategory =
  | 'Meats & Poultry'
  | 'Seafood'
  | 'Fresh Produce'
  | 'Dairy & Eggs'
  | 'Dry Goods & Pantry'
  | 'Bakery & Grains'
  | 'Frozen & Specialty'
  | 'Spices, Seasonings & Oils'
  | 'Draft Beer'
  | 'Bottled & Canned Beer'
  | 'Wine - Red'
  | 'Wine - White & Sparkling'
  | 'Spirits & Liquors'
  | 'Bar Mixers & Syrups'
  | 'Non-Alcoholic & Beverages'
  | 'Paper & Disposables'
  | 'Chemicals & Sanitation'
  | 'Kitchen Smallwares & Tools'
  | 'Barware & Glassware';

export type InventoryCategoryGroup = 'Food' | 'Beverage & Bar' | 'Operating Supplies';

export type UnitOfMeasure =
  | 'lb'
  | 'oz'
  | 'kg'
  | 'g'
  | 'case'
  | 'pack'
  | 'bottle'
  | 'can'
  | 'gal'
  | 'qt'
  | 'pt'
  | 'fl_oz'
  | 'liter'
  | 'ml'
  | 'keg'
  | 'unit'
  | 'box'
  | 'bag'
  | 'roll';

export type StorageLocation =
  | 'Walk-in Cooler'
  | 'Walk-in Freezer'
  | 'Dry Storage Pantry'
  | 'Main Bar Liquor Room'
  | 'Wine Cellar / Rack'
  | 'Line Reach-in Cooler'
  | 'Kitchen Prep Station'
  | 'Dish & Chemical Room'
  | 'FOH Service Station'
  | 'Bakery Station';

export type StockStatus = 'in_stock' | 'low_stock' | 'critical' | 'overstocked' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  organizationId: string;
  locationId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: InventoryCategory;
  categoryGroup: InventoryCategoryGroup;
  department: Department;
  unitOfMeasure: UnitOfMeasure;
  secondaryUnit?: UnitOfMeasure;
  packSize: number; // e.g. 24 cans per case, 12 bottles per case, 50 lbs per bag
  packUnit: string; // e.g. "Case", "Box", "Tub", "Bag"
  conversionRatio: number; // units per pack
  
  // Costing & Par
  unitCost: number; // cost per primary unit of measure
  packCost?: number; // unitCost * conversionRatio
  parLevel: number; // target stock level
  minStock?: number; // minimum stock / safety stock threshold
  reorderPoint: number; // threshold to trigger purchase
  reorderQuantity: number;
  
  // Real-time quantities
  quantityOnHand: number;
  beginningInventory: number;
  purchasesReceived: number;
  transfersIn: number;
  transfersOut: number;
  depletionsSalesUsage: number;
  wasteQuantity: number;
  endingInventory: number;
  
  // Theoretical vs Actual
  theoreticalUsage: number;
  actualUsage: number;
  varianceQuantity: number;
  varianceCost: number;
  
  // Physical location & Supplier
  storageArea: StorageLocation;
  storageBin?: string;
  supplierName: string;
  supplierSku?: string;
  leadTimeDays: number;
  
  // Perishability & Dates
  isPerishable: boolean;
  shelfLifeDays?: number;
  expirationDate?: string;
  lastCountDate?: string;
  lastCountedBy?: string;
  
  status: StockStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CountPeriodType = 'day' | 'week' | 'month' | 'year';
export type CountSessionType = 'full_inventory' | 'spot_check' | 'cycle_count' | 'par_check' | 'bar_audit';
export type CountSessionStatus = 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'reconciled';

export interface InventoryCountItemEntry {
  itemId: string;
  itemName: string;
  sku: string;
  category: InventoryCategory;
  categoryGroup: InventoryCategoryGroup;
  department: Department;
  unitOfMeasure: UnitOfMeasure;
  packUnit: string;
  conversionRatio: number;
  
  // Input counts
  fullPacksCount: number;
  looseUnitsCount: number;
  totalUnitsCalculated: number;
  
  // Financial valuation
  unitCost: number;
  totalExtendedValue: number;
  
  // Variance
  systemTheoreticalUnits: number;
  varianceUnits: number; // totalUnitsCalculated - systemTheoreticalUnits
  varianceValue: number; // varianceUnits * unitCost
  variancePct: number;
  
  storageArea: StorageLocation;
  notes?: string;
  flaggedAnomaly?: boolean;
}

export interface InventoryCountSession {
  id: string;
  organizationId: string;
  locationId: string;
  locationName: string;
  countType: CountSessionType;
  periodType: CountPeriodType;
  periodLabel: string; // e.g. "Week 34 - Aug 2026", "Daily Close - Aug 21, 2026", "August 2026 Monthly Count"
  date: string; // YYYY-MM-DD
  departmentFilter?: Department | 'All';
  categoryFilter?: InventoryCategory | 'All';
  storageAreaFilter?: StorageLocation | 'All';
  status: CountSessionStatus;
  
  conductedByEmployeeId: string;
  conductedByName: string;
  conductedByRole: string;
  approvedByEmployeeId?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  totalItemsCounted: number;
  totalInventoryValue: number;
  totalTheoreticalValue: number;
  totalVarianceValue: number;
  itemsWithVarianceCount: number;
  
  notes?: string;
  startedAt: string;
  completedAt?: string;
  items: InventoryCountItemEntry[];
}

export type WasteReasonCode =
  | 'spoilage_expired'
  | 'overproduction_excess'
  | 'prep_trimming_loss'
  | 'overcooked_kitchen_error'
  | 'customer_return_dissatisfaction'
  | 'spill_breakage_drop'
  | 'bar_overpour_comp'
  | 'storage_temp_failure'
  | 'expired_shelf_life'
  | 'theft_unaccounted'
  | 'quality_inspection_fail';

export type ShiftPeriod = 'morning' | 'mid' | 'closing' | 'overnight';

export interface WasteRecord {
  id: string;
  organizationId: string;
  locationId: string;
  locationName: string;
  department: Department;
  itemId: string;
  itemName: string;
  sku: string;
  category: InventoryCategory;
  categoryGroup: InventoryCategoryGroup;
  
  quantityWasted: number;
  unitOfMeasure: UnitOfMeasure;
  unitCost: number;
  totalWasteCost: number;
  
  reasonCode: WasteReasonCode;
  reasonDescription?: string;
  shift: ShiftPeriod;
  timestamp: string;
  
  loggedByEmployeeId: string;
  loggedByName: string;
  loggedByRole: string;
  
  supervisorId?: string;
  supervisorName?: string;
  supervisorVerified: boolean;
  supervisorNotes?: string;
  
  correctiveAction?: string;
  disposalMethod?: 'trash' | 'compost' | 'supplier_credit_return' | 'staff_meal_repurpose';
  isRecurringAnomaly?: boolean;
  imageUrl?: string;
  photoUrl?: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'partially_received' | 'paid' | 'disputed';
export type PaymentTerms = 'net_15' | 'net_30' | 'net_60' | 'cod' | 'prepaid' | 'credit_card';

export interface PurchaseOrderLineItem {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  category: InventoryCategory;
  orderedPacks: number;
  packSize: number;
  packUnit: string;
  unitOfMeasure: UnitOfMeasure;
  totalUnits: number;
  unitCost: number;
  extendedCost: number;
  receivedUnits?: number;
  varianceReceived?: number;
}

export interface PurchaseOrderInvoice {
  id: string;
  organizationId: string;
  locationId: string;
  locationName: string;
  vendorName: string;
  vendorContact?: string;
  vendorAccountNumber?: string;
  invoiceNumber: string;
  orderDate: string;
  deliveryDate: string;
  status: PurchaseOrderStatus;
  paymentTerms: PaymentTerms;
  subtotal: number;
  taxAmount: number;
  freightAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  receivedByEmployeeId?: string;
  receivedByName?: string;
  receivedAt?: string;
  notes?: string;
  lineItems: PurchaseOrderLineItem[];
  createdAt: string;
}

export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  unitCost: number;
  extendedCost: number;
  prepYieldPercent: number; // e.g. 90% yield after trimming
  actualCost: number; // extendedCost / (prepYieldPercent / 100)
}

export interface RecipeCostCard {
  id: string;
  organizationId: string;
  locationId: string;
  name: string;
  category: 'Appetizers' | 'Entrees' | 'Steaks & Chops' | 'Seafood' | 'Pastas' | 'Sides' | 'Desserts' | 'Craft Cocktails' | 'Draft / Beer' | 'Wine by Glass' | 'Beverages';
  department: Department;
  portionSize: string;
  yieldServings: number;
  menuPrice: number;
  
  // Cost calculations
  totalBatchCost: number;
  costPerServing: number;
  foodCostPercentage: number; // (costPerServing / menuPrice) * 100
  targetFoodCostPercentage: number; // e.g. 28%
  grossProfitMargin: number; // menuPrice - costPerServing
  contributionMarginPercentage: number;
  
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  shelfLifeHours?: number;
  allergens: string[];
  station: string;
  instructions: string[];
  ingredients: RecipeIngredient[];
  status: 'active' | 'in_development' | 'seasonal' | 'archived';
  lastUpdated: string;
}

export interface PeriodFinancialIntelligence {
  periodType: CountPeriodType;
  periodLabel: string;
  startDate: string;
  endDate: string;
  organizationId: string;
  locationId: string;
  
  // Revenue / Net Sales
  netSales: {
    total: number;
    foodSales: number;
    beverageSales: number;
    merchandiseOtherSales: number;
  };
  
  // Cost of Goods Sold (COGS)
  cogs: {
    beginningInventory: number;
    purchasesReceived: number;
    transfersIn: number;
    transfersOut: number;
    endingInventory: number;
    totalCOGS: number;
    
    foodCOGS: number;
    beverageCOGS: number;
    suppliesCost: number;
    
    grossFoodCostPct: number; // foodCOGS / foodSales * 100
    targetFoodCostPct: number;
    grossBeverageCostPct: number; // beverageCOGS / beverageSales * 100
    targetBeverageCostPct: number;
    overallCOGSPercentage: number; // totalCOGS / totalNetSales * 100
    
    theoreticalCOGS: number;
    actualCOGS: number;
    varianceDollars: number;
    variancePercentage: number;
  };
  
  // Labor Breakdown
  labor: {
    regularWages: number;
    overtimeWages: number;
    taxesAndBenefits: number;
    totalLaborCost: number;
    laborCostPercentage: number; // totalLaborCost / totalNetSales * 100
    targetLaborPct: number;
  };
  
  // Prime Cost (COGS + Labor)
  primeCost: {
    totalPrimeCostDollars: number;
    primeCostPercentage: number; // totalPrimeCost / totalNetSales * 100
    industryBenchmarkMin: number; // 55%
    industryBenchmarkMax: number; // 60%
    primeCostVarianceToBudget: number;
    healthStatus: 'optimal' | 'acceptable' | 'warning' | 'critical';
  };
  
  // Waste Intelligence
  wasteSummary: {
    totalWasteCost: number;
    wastePercentOfFoodSales: number;
    wasteRecordCount: number;
    topWastedCategories: { category: InventoryCategory; cost: number; percentage: number }[];
    topWasteReasons: { reason: WasteReasonCode; label: string; cost: number; percentage: number }[];
    shiftWasteDistribution: Record<ShiftPeriod, number>;
  };
  
  // Category & Department Margin breakdown
  categoryMargins: {
    categoryGroup: InventoryCategoryGroup;
    sales: number;
    cost: number;
    costPct: number;
    targetCostPct: number;
    grossMarginDollars: number;
    grossMarginPct: number;
  }[];
  
  // Bar Pour Cost Breakdown
  barPourCost: {
    segment: 'Draft Beer' | 'Bottled Beer' | 'Wine by Glass' | 'Spirits & Cocktails' | 'Non-Alcoholic';
    sales: number;
    cogs: number;
    pourCostPct: number;
    targetPourCostPct: number;
    variancePct: number;
  }[];
}

export interface AIInventoryInsight {
  id: string;
  category: 'depletion_forecast' | 'anomaly_detection' | 'waste_prevention' | 'po_recommendation' | 'prime_cost_optimization';
  severity: 'critical' | 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  metricImpact?: string;
  recommendedAction: string;
  estimatedDollarImpact?: number;
  targetItems?: string[];
  actionPayload?: {
    actionType: 'create_po' | 'adjust_par' | 'run_cycle_count' | 'chef_prep_alert';
    data?: any;
  };
}

export interface OptimizerConfig {
  serviceLevel: 90 | 95 | 99; // Target fulfillment service level (e.g. 95% = Z 1.65)
  deliveryCycleDays: number; // Replenishment cadence (e.g. 3 days, 7 days)
  weekendRushMultiplier: number; // Surge multiplier for weekend / high cover days (e.g. 1.15 - 1.35)
  spoilageProtection: boolean; // Cap par levels based on perishable shelf life
  considerWasteTrends: boolean; // Factor in waste logs when calculating safety stock
}

export interface ItemParSuggestion {
  itemId: string;
  itemName: string;
  sku: string;
  category: InventoryCategory;
  categoryGroup: InventoryCategoryGroup;
  unitOfMeasure: UnitOfMeasure;
  packUnit: string;
  conversionRatio: number;
  unitCost: number;
  
  // Current values
  currentOnHand: number;
  currentParLevel: number;
  currentMinStock: number;
  currentReorderPoint: number;
  currentReorderQuantity: number;
  
  // Historical analytics
  avgDailyUsage: number;
  usageStandardDeviation: number;
  leadTimeDays: number;
  isPerishable: boolean;
  shelfLifeDays?: number;
  weeklyDepletions: number;
  weeklyWasteQuantity: number;
  
  // Suggested values
  suggestedParLevel: number;
  suggestedMinStock: number;
  suggestedReorderPoint: number;
  suggestedReorderQuantity: number;
  
  // Deltas & Impact
  parDelta: number;
  minStockDelta: number;
  reorderPointDelta: number;
  capitalImpactDollar: number; // positive = freeing up cash, negative = increasing safety investment
  stockoutRiskScore: 'low' | 'moderate' | 'high' | 'critical';
  confidencePct: number;
  reasoning: string;
  warningNotes?: string;
  applied?: boolean;
}

export interface ParLevelOptimizationSummary {
  totalItemsEvaluated: number;
  itemsRequiringAdjustment: number;
  totalCapitalFreedUp: number;
  totalSafetyBufferInvestment: number;
  netWorkingCapitalChange: number;
  averageConfidencePct: number;
  criticalStockoutRisksPrevented: number;
  spoilageRisksMitigated: number;
  generatedAt: string;
  modelUsed: string;
  executiveRationale: string;
}

export interface ParLevelOptimizationResult {
  summary: ParLevelOptimizationSummary;
  suggestions: ItemParSuggestion[];
  configUsed: OptimizerConfig;
}

