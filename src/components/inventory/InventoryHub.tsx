import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CostIntelligenceDashboard } from './CostIntelligenceDashboard';
import { InventoryCountSheet } from './InventoryCountSheet';
import { InventoryItemCatalog } from './InventoryItemCatalog';
import { WasteManagementView } from './WasteManagementView';
import { RecipeCostCardsView } from './RecipeCostCardsView';
import { PurchaseOrdersView } from './PurchaseOrdersView';
import { AIInventoryCopilot } from './AIInventoryCopilot';
import { WasteLogger } from './WasteLogger';
import {
  Activity,
  ClipboardCheck,
  Package,
  Trash2,
  ChefHat,
  Truck,
  Sparkles,
  Layers,
  TrendingDown,
  Percent,
  DollarSign,
  Plus
} from 'lucide-react';

export type InventorySubTab =
  | 'cost_intelligence'
  | 'counts'
  | 'items'
  | 'waste'
  | 'recipes'
  | 'purchases'
  | 'ai_advisor';

export const InventoryHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<InventorySubTab>('cost_intelligence');
  const [showGlobalWasteLogger, setShowGlobalWasteLogger] = useState<boolean>(false);
  const { financialIntelligence, items, wasteRecords } = useInventory();

  const primePct = financialIntelligence.primeCost.primeCostPercentage;
  const unverifiedWasteCount = wasteRecords.filter((w) => !w.supervisorVerified).length;
  const lowStockCount = items.filter((i) => i.status === 'low_stock' || i.status === 'critical').length;

  const tabs: {
    id: InventorySubTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'cost_intelligence',
      label: 'Financial Cost Intelligence',
      icon: Activity,
      badge: `${primePct.toFixed(1)}% Prime`,
      badgeColor: primePct <= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'counts',
      label: 'Physical Counts & Variance',
      icon: ClipboardCheck,
    },
    {
      id: 'items',
      label: 'Master Catalog & Par Levels',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'waste',
      label: 'Waste & Spoilage Logs',
      icon: Trash2,
      badge: unverifiedWasteCount > 0 ? `${unverifiedWasteCount} Audit` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'recipes',
      label: 'Recipe Costing & Menus',
      icon: ChefHat,
    },
    {
      id: 'purchases',
      label: 'Purchase Invoices & Receiving',
      icon: Truck,
    },
    {
      id: 'ai_advisor',
      label: 'AI Copilot Advisor',
      icon: Sparkles,
      badge: 'Gemini 2.5',
      badgeColor: 'bg-indigo-100 text-indigo-800 font-bold',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`inventory-tab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-800 text-white border border-slate-700' : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Quick Action: Waste Logger */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end px-2">
          <button
            id="hub-btn-log-waste-global"
            type="button"
            onClick={() => setShowGlobalWasteLogger(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 transition-all shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>+ Log Waste</span>
          </button>
        </div>
      </div>

      {/* WasteLogger Global Modal */}
      {showGlobalWasteLogger && (
        <WasteLogger
          isOpen={true}
          onClose={() => setShowGlobalWasteLogger(false)}
        />
      )}

      {/* Dynamic Sub-Tab View Content */}
      <div className="transition-all duration-300">
        {activeSubTab === 'cost_intelligence' && <CostIntelligenceDashboard />}
        {activeSubTab === 'counts' && <InventoryCountSheet />}
        {activeSubTab === 'items' && <InventoryItemCatalog />}
        {activeSubTab === 'waste' && <WasteManagementView />}
        {activeSubTab === 'recipes' && <RecipeCostCardsView />}
        {activeSubTab === 'purchases' && <PurchaseOrdersView />}
        {activeSubTab === 'ai_advisor' && <AIInventoryCopilot />}
      </div>
    </div>
  );
};
