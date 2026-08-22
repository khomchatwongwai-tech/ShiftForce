import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  WasteRecord,
  WasteReasonCode,
  ShiftPeriod,
  InventoryCategory
} from '../../types/inventory';
import { WasteLogger } from './WasteLogger';
import { WasteTrendsSummaryCard } from './WasteTrendsSummaryCard';
import {
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingDown,
  FileText,
  Calendar,
  X,
  Camera,
  Image as ImageIcon,
  Maximize2,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const WasteManagementView: React.FC = () => {
  const { items, wasteRecords, logWasteRecord, verifyWasteRecord, financialIntelligence } = useInventory();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<WasteReasonCode | 'All'>('All');
  const [selectedShift, setSelectedShift] = useState<ShiftPeriod | 'All'>('All');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [verifyingRecord, setVerifyingRecord] = useState<WasteRecord | null>(null);
  const [supervisorNotes, setSupervisorNotes] = useState<string>('Incident verified on line. Corrective action documented.');
  const [correctiveAction, setCorrectiveAction] = useState<string>('Station retraining completed with lead cook.');
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    itemId: string;
    quantityWasted: number;
    reasonCode: WasteReasonCode;
    reasonDescription: string;
    shift: ShiftPeriod;
    loggedByName: string;
    loggedByRole: string;
    disposalMethod: 'trash' | 'compost' | 'supplier_credit_return' | 'staff_meal_repurpose';
  }>({
    itemId: items[0]?.id || '',
    quantityWasted: 1,
    reasonCode: 'overcooked_kitchen_error',
    reasonDescription: 'Ticket re-fire during dinner peak rush.',
    shift: 'closing',
    loggedByName: 'Marco Chen',
    loggedByRole: 'Lead Line Cook',
    disposalMethod: 'staff_meal_repurpose',
  });

  const handleOpenLog = () => {
    setFormData({
      itemId: items[0]?.id || '',
      quantityWasted: 1,
      reasonCode: 'spoilage_expired',
      reasonDescription: '',
      shift: 'closing',
      loggedByName: 'Marco Chen',
      loggedByRole: 'Lead Line Cook',
      disposalMethod: 'trash',
    });
    setShowLogModal(true);
  };

  const handleSaveWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find((i) => i.id === formData.itemId);
    if (!selectedItem) return;

    const unitCost = selectedItem.unitCost;
    const totalWasteCost = Number((formData.quantityWasted * unitCost).toFixed(2));

    await logWasteRecord({
      organizationId: 'org-shiftforce-corp',
      locationId: 'loc-01',
      locationName: 'SF Flagship Downtown #101',
      department: selectedItem.department,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      sku: selectedItem.sku,
      category: selectedItem.category,
      categoryGroup: selectedItem.categoryGroup,
      quantityWasted: formData.quantityWasted,
      unitOfMeasure: selectedItem.unitOfMeasure,
      unitCost,
      totalWasteCost,
      reasonCode: formData.reasonCode,
      reasonDescription: formData.reasonDescription,
      shift: formData.shift,
      loggedByEmployeeId: 'emp-2',
      loggedByName: formData.loggedByName,
      loggedByRole: formData.loggedByRole,
      supervisorVerified: false,
      disposalMethod: formData.disposalMethod,
      isRecurringAnomaly: false,
    });

    setShowLogModal(false);
  };

  const handleVerifySubmit = async () => {
    if (!verifyingRecord) return;
    await verifyWasteRecord(verifyingRecord.id, supervisorNotes, correctiveAction);
    setVerifyingRecord(null);
  };

  const reasonLabels: Record<WasteReasonCode, string> = {
    spoilage_expired: 'Spoilage & Expiration',
    overproduction_excess: 'Overproduction & Excess Prep',
    prep_trimming_loss: 'Prep & Trimming Loss',
    overcooked_kitchen_error: 'Kitchen / Line Cook Error',
    customer_return_dissatisfaction: 'Customer Return & Re-fire',
    spill_breakage_drop: 'Spill & Breakage',
    bar_overpour_comp: 'Bar Overpour & Loss',
    storage_temp_failure: 'Refrigeration / Temperature Loss',
    expired_shelf_life: 'Expired Shelf Life',
    theft_unaccounted: 'Unaccounted Shrink',
    quality_inspection_fail: 'Quality Inspection Fail',
  };

  const filteredRecords = useMemo(() => {
    return wasteRecords.filter((rec) => {
      if (selectedReason !== 'All' && rec.reasonCode !== selectedReason) return false;
      if (selectedShift !== 'All' && rec.shift !== selectedShift) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = rec.itemName.toLowerCase().includes(query);
        const matchSku = rec.sku.toLowerCase().includes(query);
        const matchLogged = rec.loggedByName.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchLogged) return false;
      }
      return true;
    });
  }, [wasteRecords, selectedReason, selectedShift, searchQuery]);

  const totalWasteDollars = wasteRecords.reduce((acc, r) => acc + (r.totalWasteCost || 0), 0);
  const unverifiedCount = wasteRecords.filter((r) => !r.supervisorVerified).length;

  // Chart data for waste reasons
  const reasonChartData = financialIntelligence.wasteSummary.topWasteReasons.map((r) => ({
    name: r.label,
    Cost: r.cost,
  }));

  const shiftChartData = [
    { name: 'Morning (AM)', Cost: financialIntelligence.wasteSummary.shiftWasteDistribution.morning || 0, fill: '#3b82f6' },
    { name: 'Mid Shift', Cost: financialIntelligence.wasteSummary.shiftWasteDistribution.mid || 0, fill: '#10b981' },
    { name: 'Closing (PM)', Cost: financialIntelligence.wasteSummary.shiftWasteDistribution.closing || 0, fill: '#f59e0b' },
    { name: 'Overnight Prep', Cost: financialIntelligence.wasteSummary.shiftWasteDistribution.overnight || 0, fill: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Waste Management & Spoilage Intelligence</h2>
              <p className="text-xs text-slate-500">Incident logging, root-cause reason tracking, and supervisor verification</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenLog}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Log Waste Incident
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Waste Cost</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            ${totalWasteDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Directly adds to COGS line</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Waste % of Food Sales</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {financialIntelligence.wasteSummary.wastePercentOfFoodSales.toFixed(2)}%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">Target &lt; 1.5% (In Control)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Pending Supervisor Audits</span>
          <div className={`text-2xl font-black mt-1 ${unverifiedCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {unverifiedCount} Logs
          </div>
          <div className="text-[10px] text-slate-400">Awaiting Manager Sign-Off</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Top Waste Driver</span>
          <div className="text-base font-bold text-slate-900 mt-1 truncate">
            {financialIntelligence.wasteSummary.topWasteReasons[0]?.label || 'Spoilage'}
          </div>
          <div className="text-[10px] text-slate-400">
            ${financialIntelligence.wasteSummary.topWasteReasons[0]?.cost.toFixed(2)} total impact
          </div>
        </div>
      </div>

      {/* Waste Trends Summary Dashboard Card */}
      <WasteTrendsSummaryCard defaultDays={30} />

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item, SKU, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
          >
            <option value="All">All Reasons</option>
            <option value="overcooked_kitchen_error">Kitchen / Line Cook Error</option>
            <option value="spoilage_expired">Spoilage & Expired</option>
            <option value="prep_trimming_loss">Prep & Trimming Loss</option>
            <option value="spill_breakage_drop">Spill & Breakage</option>
            <option value="customer_return_dissatisfaction">Customer Return</option>
            <option value="bar_overpour_comp">Bar Overpour</option>
          </select>

          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
          >
            <option value="All">All Shifts</option>
            <option value="morning">Morning (AM)</option>
            <option value="mid">Mid Shift</option>
            <option value="closing">Closing (PM)</option>
            <option value="overnight">Overnight</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900">{filteredRecords.length}</strong> logged incidents
        </div>
      </div>

      {/* Waste Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Reason</th>
                <th className="py-3 px-3">Quantity & Cost</th>
                <th className="py-3 px-3">Shift & Time</th>
                <th className="py-3 px-3">Logged By</th>
                <th className="py-3 px-3">Disposal Method</th>
                <th className="py-3 px-3">Supervisor Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.map((record) => {
                const photo = record.imageUrl || record.photoUrl;
                return (
                  <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        {photo && (
                          <button
                            type="button"
                            onClick={() => setViewingPhotoUrl(photo)}
                            className="relative group w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs hover:ring-2 hover:ring-rose-500 transition-all cursor-pointer"
                            title="Click to view full photo evidence"
                          >
                            <img
                              src={photo}
                              alt={record.itemName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{record.itemName}</span>
                            {photo && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                <Camera className="w-2.5 h-2.5" /> Photo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1 rounded">{record.sku}</span>
                            <span>•</span>
                            <span className="text-rose-600 font-semibold">{reasonLabels[record.reasonCode] || record.reasonCode}</span>
                          </div>
                          {record.reasonDescription && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-sm">"{record.reasonDescription}"</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-rose-700">${record.totalWasteCost.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">
                        {record.quantityWasted} {record.unitOfMeasure} @ ${record.unitCost.toFixed(2)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="capitalize font-semibold">{record.shift} Shift</div>
                      <div className="text-[10px] text-slate-400">{record.timestamp.slice(0, 16).replace('T', ' ')}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{record.loggedByName}</div>
                      <div className="text-[10px] text-slate-400">{record.loggedByRole}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {record.disposalMethod?.replace('_', ' ') || 'Trash'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {record.supervisorVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pending Audit
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {!record.supervisorVerified ? (
                        <button
                          onClick={() => setVerifyingRecord(record)}
                          className="px-3 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer"
                        >
                          Verify Sign-Off
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Signed by {record.supervisorName}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Waste Modal with WasteLogger Component */}
      <WasteLogger
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
      />

      {/* Supervisor Verification Modal */}
      {verifyingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">Supervisor Waste Verification</h3>
              <button
                type="button"
                onClick={() => setVerifyingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-4">
              Review loss incident and photographic evidence for <strong className="text-slate-800">{verifyingRecord.itemName}</strong> (${verifyingRecord.totalWasteCost.toFixed(2)})
            </p>

            {/* Attached Photo Preview for Manager Verification */}
            {(verifyingRecord.imageUrl || verifyingRecord.photoUrl) ? (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1 text-slate-900 font-bold">
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    Staff Photo Evidence
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingPhotoUrl(verifyingRecord.imageUrl || verifyingRecord.photoUrl || null)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" /> View Fullscreen
                  </button>
                </div>
                <div className="relative group h-44 rounded-lg overflow-hidden bg-black border border-slate-300">
                  <img
                    src={verifyingRecord.imageUrl || verifyingRecord.photoUrl}
                    alt={verifyingRecord.itemName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={() => setViewingPhotoUrl(verifyingRecord.imageUrl || verifyingRecord.photoUrl || null)}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] font-mono font-bold bg-black/75 text-white">
                    Logged by {verifyingRecord.loggedByName} ({verifyingRecord.loggedByRole})
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                <p className="font-medium">No photo evidence attached to this incident record.</p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between text-slate-700">
                <span>Reason: <strong className="text-slate-900">{reasonLabels[verifyingRecord.reasonCode] || verifyingRecord.reasonCode}</strong></span>
                <span>Qty: <strong className="text-slate-900">{verifyingRecord.quantityWasted} {verifyingRecord.unitOfMeasure}</strong></span>
                <span>Total Loss: <strong className="text-rose-700">${verifyingRecord.totalWasteCost.toFixed(2)}</strong></span>
              </div>

              {verifyingRecord.reasonDescription && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Staff Incident Notes</label>
                  <p className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 italic">
                    "{verifyingRecord.reasonDescription}"
                  </p>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Supervisor Audit Notes</label>
                <textarea
                  rows={2}
                  value={supervisorNotes}
                  onChange={(e) => setSupervisorNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mandated Corrective Action</label>
                <input
                  type="text"
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setVerifyingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifySubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm cursor-pointer"
              >
                Sign Off & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Photo Lightbox Modal */}
      {viewingPhotoUrl && (
        <div
          id="global-waste-photo-lightbox"
          className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold font-mono">WASTE INCIDENT PHOTO VERIFICATION</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black">
              <img
                src={viewingPhotoUrl}
                alt="Full Incident Photo"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="px-4 py-2.5 bg-slate-950 text-slate-400 text-xs flex items-center justify-between">
              <span>WorkQora Certified Loss Proof</span>
              <button
                type="button"
                onClick={() => setViewingPhotoUrl(null)}
                className="text-xs font-semibold text-slate-200 hover:text-white underline cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
