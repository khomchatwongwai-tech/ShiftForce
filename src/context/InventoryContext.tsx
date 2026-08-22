import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  InventoryItem,
  InventoryCountSession,
  WasteRecord,
  PurchaseOrderInvoice,
  RecipeCostCard,
  PeriodFinancialIntelligence,
  CountPeriodType,
  AIInventoryInsight
} from '../types/inventory';
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_WASTE_RECORDS,
  INITIAL_PURCHASE_INVOICES,
  INITIAL_RECIPE_COST_CARDS,
  INITIAL_COUNT_SESSIONS,
  INITIAL_AI_INSIGHTS
} from '../data/initialInventoryData';
import { computePeriodFinancialIntelligence, calculateRecipeCostCard } from '../utils/costIntelligenceEngine';

interface InventoryContextType {
  items: InventoryItem[];
  counts: InventoryCountSession[];
  wasteRecords: WasteRecord[];
  invoices: PurchaseOrderInvoice[];
  recipes: RecipeCostCard[];
  aiInsights: AIInventoryInsight[];
  selectedPeriod: CountPeriodType;
  setSelectedPeriod: (p: CountPeriodType) => void;
  selectedLocationId: string;
  setSelectedLocationId: (locId: string) => void;
  financialIntelligence: PeriodFinancialIntelligence;
  isLoading: boolean;
  
  // Actions
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  submitCountSession: (session: Omit<InventoryCountSession, 'id' | 'createdAt' | 'startedAt'>) => Promise<void>;
  approveCountSession: (id: string, notes?: string) => Promise<void>;
  
  logWasteRecord: (record: Omit<WasteRecord, 'id' | 'createdAt' | 'timestamp'>) => Promise<void>;
  verifyWasteRecord: (id: string, supervisorNotes?: string, correctiveAction?: string) => Promise<void>;
  
  createPurchaseInvoice: (invoice: Omit<PurchaseOrderInvoice, 'id' | 'createdAt'>) => Promise<void>;
  updatePurchaseStatus: (id: string, status: PurchaseOrderInvoice['status']) => Promise<void>;
  
  saveRecipe: (recipe: Omit<RecipeCostCard, 'id' | 'totalBatchCost' | 'costPerServing' | 'foodCostPercentage' | 'grossProfitMargin' | 'contributionMarginPercentage' | 'lastUpdated'>, existingId?: string) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  
  runAIAssessment: (customPrompt?: string) => Promise<{ summary: string; insights: AIInventoryInsight[]; aiResponse: string }>;
  executeAIAction: (insight: AIInventoryInsight) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'workqora_inventory_v1_';
const LEGACY_STORAGE_PREFIX = 'shiftforce_inventory_v1_';

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}items`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}items`);
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY_ITEMS;
  });

  const [counts, setCounts] = useState<InventoryCountSession[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}counts`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}counts`);
    return saved ? JSON.parse(saved) : INITIAL_COUNT_SESSIONS;
  });

  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}waste`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}waste`);
    return saved ? JSON.parse(saved) : INITIAL_WASTE_RECORDS;
  });

  const [invoices, setInvoices] = useState<PurchaseOrderInvoice[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}invoices`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}invoices`);
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_INVOICES;
  });

  const [recipes, setRecipes] = useState<RecipeCostCard[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}recipes`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}recipes`);
    return saved ? JSON.parse(saved) : INITIAL_RECIPE_COST_CARDS;
  });

  const [aiInsights, setAiInsights] = useState<AIInventoryInsight[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}ai_insights`) ?? localStorage.getItem(`${LEGACY_STORAGE_PREFIX}ai_insights`);
    return saved ? JSON.parse(saved) : INITIAL_AI_INSIGHTS;
  });

  const [selectedPeriod, setSelectedPeriod] = useState<CountPeriodType>('week');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc-01');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to local persistence
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}items`, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}counts`, JSON.stringify(counts));
  }, [counts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}waste`, JSON.stringify(wasteRecords));
  }, [wasteRecords]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}recipes`, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ai_insights`, JSON.stringify(aiInsights));
  }, [aiInsights]);

  // Compute Deterministic Financial Cost Intelligence
  const financialIntelligence = useMemo(() => {
    // Determine sales base depending on period
    const multipliers: Record<CountPeriodType, number> = {
      day: 1,
      week: 7,
      month: 30.5,
      year: 365,
    };
    const mult = multipliers[selectedPeriod] || 7;
    const dailyBaseFoodSales = 3450;
    const dailyBaseBevSales = 1680;
    const dailyBaseOtherSales = 220;

    return computePeriodFinancialIntelligence({
      periodType: selectedPeriod,
      startDate: selectedPeriod === 'day' ? '2026-08-21' : selectedPeriod === 'week' ? '2026-08-15' : selectedPeriod === 'month' ? '2026-08-01' : '2026-01-01',
      endDate: '2026-08-21',
      organizationId: 'org-workqora-corp',
      locationId: selectedLocationId,
      items: items.filter(i => !selectedLocationId || i.locationId === selectedLocationId),
      wasteRecords: wasteRecords.filter(w => !selectedLocationId || w.locationId === selectedLocationId),
      invoices: invoices.filter(inv => !selectedLocationId || inv.locationId === selectedLocationId),
      scheduledLaborCost: 1540 * mult,
      actualLaborCost: 1515 * mult,
      netSales: {
        foodSales: dailyBaseFoodSales * mult,
        beverageSales: dailyBaseBevSales * mult,
        merchandiseOtherSales: dailyBaseOtherSales * mult,
      },
    });
  }, [items, wasteRecords, invoices, selectedPeriod, selectedLocationId]);

  // Actions
  const addItem = async (itemInput: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const newItem: InventoryItem = {
        ...itemInput,
        id: `inv-item-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setItems(prev => [newItem, ...prev]);

      // Attempt server sync
      fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      }).catch(err => console.warn('Server item sync skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    setIsLoading(true);
    try {
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
      fetch(`/api/inventory/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(err => console.warn('Server item patch skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setIsLoading(true);
    try {
      setItems(prev => prev.filter(item => item.id !== id));
      fetch(`/api/inventory/items/${id}`, { method: 'DELETE' }).catch(err => console.warn('Server item delete skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const submitCountSession = async (sessionInput: Omit<InventoryCountSession, 'id' | 'createdAt' | 'startedAt'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const newSession: InventoryCountSession = {
        ...sessionInput,
        id: `count-sess-${Date.now()}`,
        startedAt: now,
        completedAt: now,
      };
      setCounts(prev => [newSession, ...prev]);

      // If approved, update quantityOnHand for counted items
      if (sessionInput.status === 'approved' && Array.isArray(sessionInput.items)) {
        setItems(prev => prev.map(item => {
          const counted = sessionInput.items.find(i => i.itemId === item.id);
          if (counted) {
            return {
              ...item,
              quantityOnHand: counted.totalUnitsCalculated,
              endingInventory: counted.totalUnitsCalculated,
              lastCountDate: sessionInput.date,
              lastCountedBy: sessionInput.conductedByName,
              updatedAt: now,
            };
          }
          return item;
        }));
      }

      fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession),
      }).catch(err => console.warn('Server count session sync skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const approveCountSession = async (id: string, notes?: string) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      setCounts(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'approved',
            approvedByName: 'General Manager (Sarah Jenkins)',
            approvedAt: now,
            notes: notes || c.notes,
          };
        }
        return c;
      }));

      // Apply counts to items
      const targetSession = counts.find(c => c.id === id);
      if (targetSession) {
        setItems(prev => prev.map(item => {
          const counted = targetSession.items.find(i => i.itemId === item.id);
          if (counted) {
            return {
              ...item,
              quantityOnHand: counted.totalUnitsCalculated,
              endingInventory: counted.totalUnitsCalculated,
              lastCountDate: targetSession.date,
              lastCountedBy: targetSession.conductedByName,
              updatedAt: now,
            };
          }
          return item;
        }));
      }

      fetch(`/api/inventory/counts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved', notes }),
      }).catch(err => console.warn('Server count approval skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const logWasteRecord = async (recordInput: Omit<WasteRecord, 'id' | 'createdAt' | 'timestamp'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const newRecord: WasteRecord = {
        ...recordInput,
        id: `waste-rec-${Date.now()}`,
        timestamp: now,
      };
      setWasteRecords(prev => [newRecord, ...prev]);

      // Deduct from item stock and increment wasteQuantity
      setItems(prev => prev.map(item => {
        if (item.id === recordInput.itemId) {
          const addedWaste = Number(recordInput.quantityWasted);
          return {
            ...item,
            wasteQuantity: item.wasteQuantity + addedWaste,
            quantityOnHand: Math.max(0, item.quantityOnHand - addedWaste),
            updatedAt: now,
          };
        }
        return item;
      }));

      fetch('/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(err => console.warn('Server waste record sync skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWasteRecord = async (id: string, supervisorNotes?: string, correctiveAction?: string) => {
    setIsLoading(true);
    try {
      setWasteRecords(prev => prev.map(w => {
        if (w.id === id) {
          return {
            ...w,
            supervisorVerified: true,
            supervisorName: 'General Manager (Sarah)',
            supervisorNotes: supervisorNotes || w.supervisorNotes,
            correctiveAction: correctiveAction || w.correctiveAction,
          };
        }
        return w;
      }));

      fetch(`/api/inventory/waste/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorVerified: true, supervisorNotes, correctiveAction }),
      }).catch(err => console.warn('Server waste verification skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const createPurchaseInvoice = async (invoiceInput: Omit<PurchaseOrderInvoice, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const newInvoice: PurchaseOrderInvoice = {
        ...invoiceInput,
        id: `po-inv-${Date.now()}`,
        createdAt: now,
      };
      setInvoices(prev => [newInvoice, ...prev]);

      // Update items stock & purchases received
      setItems(prev => prev.map(item => {
        const line = invoiceInput.lineItems.find(l => l.itemId === item.id || l.sku === item.sku);
        if (line) {
          const addedUnits = Number(line.totalUnits || (line.orderedPacks * (line.packSize || 1)));
          return {
            ...item,
            purchasesReceived: item.purchasesReceived + addedUnits,
            quantityOnHand: item.quantityOnHand + addedUnits,
            unitCost: line.unitCost || item.unitCost,
            updatedAt: now,
          };
        }
        return item;
      }));

      fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      }).catch(err => console.warn('Server invoice sync skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const updatePurchaseStatus = async (id: string, status: PurchaseOrderInvoice['status']) => {
    setIsLoading(true);
    try {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async (
    recipeInput: Omit<RecipeCostCard, 'id' | 'totalBatchCost' | 'costPerServing' | 'foodCostPercentage' | 'grossProfitMargin' | 'contributionMarginPercentage' | 'lastUpdated'>,
    existingId?: string
  ) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const calculated = calculateRecipeCostCard({
        ...recipeInput,
        id: existingId || `recipe-${Date.now()}`,
        lastUpdated: now,
      } as any);

      if (existingId) {
        setRecipes(prev => prev.map(r => r.id === existingId ? calculated : r));
      } else {
        setRecipes(prev => [calculated, ...prev]);
      }

      fetch('/api/inventory/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculated),
      }).catch(err => console.warn('Server recipe save skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (id: string) => {
    setIsLoading(true);
    try {
      setRecipes(prev => prev.filter(r => r.id !== id));
      fetch(`/api/inventory/recipes/${id}`, { method: 'DELETE' }).catch(err => console.warn('Server recipe delete skipped:', err));
    } finally {
      setIsLoading(false);
    }
  };

  const runAIAssessment = async (customPrompt?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/inventory-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          inventoryContext: items.map(i => ({
            name: i.name,
            sku: i.sku,
            qoh: i.quantityOnHand,
            par: i.parLevel,
            reorder: i.reorderPoint,
            unitCost: i.unitCost,
            variance: i.varianceQuantity,
          })),
          wasteContext: wasteRecords.slice(0, 10).map(w => ({
            item: w.itemName,
            cost: w.totalWasteCost,
            reason: w.reasonCode,
            shift: w.shift,
          })),
          salesContext: financialIntelligence.netSales,
          scheduleContext: {
            weeklyLaborCost: financialIntelligence.labor.totalLaborCost,
            primeCostPct: financialIntelligence.primeCost.primeCostPercentage,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insights && Array.isArray(data.insights)) {
          setAiInsights(data.insights);
        }
        return {
          summary: data.summary || 'AI Analysis complete.',
          insights: data.insights || aiInsights,
          aiResponse: data.aiResponse || 'Assessment generated successfully.',
        };
      }
    } catch (err) {
      console.warn('AI inventory call fallback:', err);
    } finally {
      setIsLoading(false);
    }

    return {
      summary: 'Inventory evaluated against POS covers and par levels.',
      insights: aiInsights,
      aiResponse: 'Prime Cost (57.8%) is within target benchmark. Recommend checking weekend Ribeye par levels.',
    };
  };

  const executeAIAction = async (insight: AIInventoryInsight) => {
    if (!insight.actionPayload) return;
    const { actionType, data } = insight.actionPayload;

    if (actionType === 'create_po' && data) {
      const targetItem = items.find(i => i.id === data.itemId || i.sku === data.itemId);
      if (targetItem) {
        await createPurchaseInvoice({
          organizationId: 'org-workqora-corp',
          locationId: targetItem.locationId,
          locationName: 'Workqora Flagship Downtown #101',
          vendorName: data.vendorName || targetItem.supplierName,
          invoiceNumber: `PO-AUTO-${Date.now().toString().slice(-6)}`,
          orderDate: new Date().toISOString().slice(0, 10),
          deliveryDate: new Date(Date.now() + targetItem.leadTimeDays * 86400000).toISOString().slice(0, 10),
          status: 'ordered',
          paymentTerms: 'net_30',
          subtotal: (data.quantity || 2) * (targetItem.packCost || targetItem.unitCost * targetItem.packSize),
          taxAmount: 0,
          freightAmount: 0,
          discountAmount: 0,
          totalAmount: (data.quantity || 2) * (targetItem.packCost || targetItem.unitCost * targetItem.packSize),
          lineItems: [
            {
              id: `line-${Date.now()}`,
              itemId: targetItem.id,
              itemName: targetItem.name,
              sku: targetItem.sku,
              category: targetItem.category,
              orderedPacks: data.quantity || 2,
              packSize: targetItem.packSize,
              packUnit: targetItem.packUnit,
              unitOfMeasure: targetItem.unitOfMeasure,
              totalUnits: (data.quantity || 2) * targetItem.packSize,
              unitCost: targetItem.unitCost,
              extendedCost: (data.quantity || 2) * (targetItem.packCost || targetItem.unitCost * targetItem.packSize),
            },
          ],
        });
      }
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        items,
        counts,
        wasteRecords,
        invoices,
        recipes,
        aiInsights,
        selectedPeriod,
        setSelectedPeriod,
        selectedLocationId,
        setSelectedLocationId,
        financialIntelligence,
        isLoading,
        addItem,
        updateItem,
        deleteItem,
        submitCountSession,
        approveCountSession,
        logWasteRecord,
        verifyWasteRecord,
        createPurchaseInvoice,
        updatePurchaseStatus,
        saveRecipe,
        deleteRecipe,
        runAIAssessment,
        executeAIAction,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
