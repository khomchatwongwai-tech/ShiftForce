import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  InventoryItem,
  InventoryCountItemEntry,
  CountSessionType,
  CountPeriodType,
  StorageLocation,
  InventoryCategory
} from '../../types/inventory';
import {
  ClipboardCheck,
  Search,
  Filter,
  Save,
  CheckCircle,
  AlertTriangle,
  Layers,
  ChevronDown,
  Plus,
  RefreshCw,
  Sparkles,
  Barcode,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

export const InventoryCountSheet: React.FC = () => {
  const { items, submitCountSession, counts, approveCountSession } = useInventory();

  const [activeTab, setActiveTab] = useState<'new_count' | 'count_history'>('new_count');
  const [countType, setCountType] = useState<CountSessionType>('full_inventory');
  const [periodType, setPeriodType] = useState<CountPeriodType>('week');
  const [periodLabel, setPeriodLabel] = useState<string>('August 2026 - Active Store Count');
  const [selectedStorage, setSelectedStorage] = useState<StorageLocation | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [conductedByName, setConductedByName] = useState<string>('Marco Chen (Sous Chef)');
  const [countNotes, setCountNotes] = useState<string>('Physical stock verified on storage shelves.');

  // Count entries state mapped by item ID
  const [countEntries, setCountEntries] = useState<Record<string, { fullPacks: number; looseUnits: number; notes: string }>>(() => {
    const init: Record<string, { fullPacks: number; looseUnits: number; notes: string }> = {};
    items.forEach((item) => {
      const full = Math.floor(item.quantityOnHand / (item.conversionRatio || 1));
      const loose = Number((item.quantityOnHand % (item.conversionRatio || 1)).toFixed(2));
      init[item.id] = {
        fullPacks: full,
        looseUnits: loose,
        notes: '',
      };
    });
    return init;
  });

  const handlePackChange = (itemId: string, packs: number) => {
    setCountEntries((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { fullPacks: 0, looseUnits: 0, notes: '' }),
        fullPacks: Math.max(0, packs),
      },
    }));
  };

  const handleLooseChange = (itemId: string, loose: number) => {
    setCountEntries((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { fullPacks: 0, looseUnits: 0, notes: '' }),
        looseUnits: Math.max(0, loose),
      },
    }));
  };

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedStorage !== 'All' && item.storageArea !== selectedStorage) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchBarcode = item.barcode?.toLowerCase().includes(query);
        const matchBin = item.storageBin?.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchBarcode && !matchBin) return false;
      }
      return true;
    });
  }, [items, selectedStorage, selectedCategory, searchQuery]);

  // Aggregate current live count metrics
  const liveCountCalculations = useMemo(() => {
    let totalItems = 0;
    let totalPhysicalValue = 0;
    let totalTheoreticalValue = 0;
    let itemsWithVariance = 0;

    const entriesList: InventoryCountItemEntry[] = filteredItems.map((item) => {
      const entry = countEntries[item.id] || { fullPacks: 0, looseUnits: 0, notes: '' };
      const totalUnits = Number((entry.fullPacks * (item.conversionRatio || 1) + entry.looseUnits).toFixed(2));
      const extendedValue = Number((totalUnits * item.unitCost).toFixed(2));
      const theoreticalUnits = item.quantityOnHand;
      const varianceUnits = Number((totalUnits - theoreticalUnits).toFixed(2));
      const varianceValue = Number((varianceUnits * item.unitCost).toFixed(2));
      const variancePct = theoreticalUnits > 0 ? Number(((varianceUnits / theoreticalUnits) * 100).toFixed(1)) : 0;

      if (totalUnits > 0 || theoreticalUnits > 0) {
        totalItems++;
        totalPhysicalValue += extendedValue;
        totalTheoreticalValue += theoreticalUnits * item.unitCost;
        if (Math.abs(varianceUnits) > 0.05) {
          itemsWithVariance++;
        }
      }

      return {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        category: item.category,
        categoryGroup: item.categoryGroup,
        department: item.department,
        unitOfMeasure: item.unitOfMeasure,
        packUnit: item.packUnit,
        conversionRatio: item.conversionRatio,
        fullPacksCount: entry.fullPacks,
        looseUnitsCount: entry.looseUnits,
        totalUnitsCalculated: totalUnits,
        unitCost: item.unitCost,
        totalExtendedValue: extendedValue,
        systemTheoreticalUnits: theoreticalUnits,
        varianceUnits,
        varianceValue,
        variancePct,
        storageArea: item.storageArea,
        notes: entry.notes,
        flaggedAnomaly: Math.abs(variancePct) > 10,
      };
    });

    const netVarianceValue = totalPhysicalValue - totalTheoreticalValue;

    return {
      totalItems,
      totalPhysicalValue,
      totalTheoreticalValue,
      netVarianceValue,
      itemsWithVariance,
      entriesList,
    };
  }, [filteredItems, countEntries]);

  const handleSaveCount = async (status: 'submitted' | 'approved') => {
    setIsSubmitting(true);
    try {
      await submitCountSession({
        organizationId: 'org-workqora-corp',
        locationId: 'loc-01',
        locationName: 'Workqora Flagship Downtown #101',
        countType,
        periodType,
        periodLabel,
        date: new Date().toISOString().slice(0, 10),
        status,
        conductedByEmployeeId: 'emp-2',
        conductedByName,
        conductedByRole: 'Inventory Lead',
        totalItemsCounted: liveCountCalculations.totalItems,
        totalInventoryValue: liveCountCalculations.totalPhysicalValue,
        totalTheoreticalValue: liveCountCalculations.totalTheoreticalValue,
        totalVarianceValue: liveCountCalculations.netVarianceValue,
        itemsWithVarianceCount: liveCountCalculations.itemsWithVariance,
        notes: countNotes,
        items: liveCountCalculations.entriesList,
      });

      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const storageOptions: (StorageLocation | 'All')[] = [
    'All',
    'Walk-in Cooler',
    'Walk-in Freezer',
    'Dry Storage Pantry',
    'Main Bar Liquor Room',
    'Wine Cellar / Rack',
    'Kitchen Prep Station',
    'Dish & Chemical Room',
  ];

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Physical Stock Count & Variance Sheet</h2>
              <p className="text-xs text-slate-500">Fast pack/loose unit inputs with real-time theoretical variance tracking</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('new_count')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'new_count'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Count Sheet
          </button>
          <button
            onClick={() => setActiveTab('count_history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'count_history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Count History & Audits ({counts.length})
          </button>
        </div>
      </div>

      {activeTab === 'new_count' ? (
        <div className="space-y-6">
          {/* Active Count Config & Metrics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Count Type & Period</span>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={countType}
                  onChange={(e) => setCountType(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="full_inventory">Full Store Count</option>
                  <option value="spot_check">Spot Check Audit</option>
                  <option value="cycle_count">Cycle Count</option>
                  <option value="bar_audit">Bar & Liquor Audit</option>
                </select>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Annual</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Counted Inventory Value</span>
              <div className="text-xl font-black text-indigo-700 mt-1">
                ${liveCountCalculations.totalPhysicalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">{liveCountCalculations.totalItems} Active Stock SKUs</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Theoretical System Value</span>
              <div className="text-xl font-bold text-slate-800 mt-1">
                ${liveCountCalculations.totalTheoreticalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-500">POS depletions recorded</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Variance ($)</span>
              <div className={`text-xl font-black mt-1 ${liveCountCalculations.netVarianceValue < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {liveCountCalculations.netVarianceValue < 0 ? '-' : '+'}$
                {Math.abs(liveCountCalculations.netVarianceValue).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">{liveCountCalculations.itemsWithVariance} items with discrepancy</div>
            </div>
          </div>

          {/* Filters & Search Strip */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, SKU, barcode, bin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Storage location filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 font-medium ml-1">Area:</span>
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value as any)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none"
                >
                  {storageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveCount('submitted')}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>

              <button
                onClick={() => handleSaveCount('approved')}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
              >
                <CheckCircle className="w-4 h-4" /> Reconcile & Submit Count
              </button>
            </div>
          </div>

          {submittedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Count session saved & reconciled successfully! Ending inventory quantities and financial ledger updated.
            </div>
          )}

          {/* Interactive Sheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-3">Storage Location</th>
                    <th className="py-3 px-3">Unit Cost</th>
                    <th className="py-3 px-3 text-center">Full Packs</th>
                    <th className="py-3 px-3 text-center">Loose Units</th>
                    <th className="py-3 px-3 text-right">Counted Total</th>
                    <th className="py-3 px-3 text-right">System Theo</th>
                    <th className="py-3 px-3 text-right">Variance</th>
                    <th className="py-3 px-3 text-right">Extended Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredItems.map((item) => {
                    const entry = countEntries[item.id] || { fullPacks: 0, looseUnits: 0, notes: '' };
                    const totalUnits = Number((entry.fullPacks * (item.conversionRatio || 1) + entry.looseUnits).toFixed(2));
                    const variance = Number((totalUnits - item.quantityOnHand).toFixed(2));
                    const varDollars = Number((variance * item.unitCost).toFixed(2));
                    const hasVariance = Math.abs(variance) > 0.05;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Item Name & Details */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1 rounded">{item.sku}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">{item.packUnit}</span>
                          </div>
                        </td>

                        {/* Storage Area */}
                        <td className="py-3 px-3 text-slate-600">
                          <div>{item.storageArea}</div>
                          {item.storageBin && <div className="text-[10px] text-slate-400">{item.storageBin}</div>}
                        </td>

                        {/* Unit Cost */}
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          ${item.unitCost.toFixed(2)} / {item.unitOfMeasure}
                        </td>

                        {/* Full Packs Input */}
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePackChange(item.id, entry.fullPacks - 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={entry.fullPacks}
                              onChange={(e) => handlePackChange(item.id, Number(e.target.value))}
                              className="w-14 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded p-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handlePackChange(item.id, entry.fullPacks + 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Loose Units Input */}
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleLooseChange(item.id, Math.max(0, entry.looseUnits - 1))}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={entry.looseUnits}
                              onChange={(e) => handleLooseChange(item.id, Number(e.target.value))}
                              className="w-14 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded p-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleLooseChange(item.id, entry.looseUnits + 1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Counted Total */}
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {totalUnits} <span className="text-[10px] text-slate-400">{item.unitOfMeasure}</span>
                        </td>

                        {/* System Theoretical */}
                        <td className="py-3 px-3 text-right text-slate-500">
                          {item.quantityOnHand} {item.unitOfMeasure}
                        </td>

                        {/* Variance */}
                        <td className="py-3 px-3 text-right">
                          {hasVariance ? (
                            <span className={`font-bold ${variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {variance > 0 ? `+${variance}` : variance} ({varDollars < 0 ? `-$${Math.abs(varDollars).toFixed(2)}` : `+$${varDollars.toFixed(2)}`})
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3 h-3" /> Exact
                            </span>
                          )}
                        </td>

                        {/* Extended Value */}
                        <td className="py-3 px-3 text-right font-bold text-indigo-900">
                          ${(totalUnits * item.unitCost).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Form Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Conducted By</label>
                  <input
                    type="text"
                    value={conductedByName}
                    onChange={(e) => setConductedByName(e.target.value)}
                    className="block text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Supervisor Audit Notes</label>
                  <input
                    type="text"
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    placeholder="e.g. End of month physical inventory verification"
                    className="block text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 min-w-[280px]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  onClick={() => handleSaveCount('approved')}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
                >
                  Finalize & Apply Count to Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Count History View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {counts.map((sess) => (
              <div key={sess.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{sess.periodLabel}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sess.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {sess.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Conducted by {sess.conductedByName} on {sess.date} • {sess.totalItemsCounted} items logged
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">
                      ${sess.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs font-semibold ${sess.totalVarianceValue < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      Variance: {sess.totalVarianceValue < 0 ? '-' : '+'}${Math.abs(sess.totalVarianceValue).toFixed(2)}
                    </div>
                  </div>
                </div>

                {sess.notes && (
                  <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <strong className="text-slate-800">Notes:</strong> {sess.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
