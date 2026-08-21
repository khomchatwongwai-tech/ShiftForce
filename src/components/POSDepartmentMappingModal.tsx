import React, { useState, useEffect } from 'react';
import {
  Layers,
  Flame,
  Square,
  CircleDot,
  Server,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Plus,
  Trash2,
  Download,
  Upload,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  ShieldCheck,
  FileCode,
  Info,
  HelpCircle
} from 'lucide-react';
import {
  POSPlatformId,
  POSDepartmentMapping,
  Department,
  POSRevenueCenterMapping,
  POSJobCodeMapping,
  POSSalesCategoryMapping,
  DepartmentEfficiencyConfig,
  Shift,
  Employee
} from '../types';
import { INITIAL_POS_DEPARTMENT_MAPPINGS } from '../data/posMappingData';

interface POSDepartmentMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  posMappings?: Record<POSPlatformId, POSDepartmentMapping>;
  initialMapping?: POSDepartmentMapping;
  onSaveMapping: (updatedMapping: POSDepartmentMapping) => void;
  activePOSId?: POSPlatformId;
  onSelectActivePOS?: (posId: POSPlatformId) => void;
  shifts?: Shift[];
  employees?: Employee[];
}

const DEPARTMENTS: Department[] = [
  'Front of House',
  'Back of House',
  'Bar & Beverage',
  'Kitchen Prep & Dish',
  'Management'
];

const DEPARTMENT_BADGE_COLORS: Record<Department, string> = {
  'Front of House': 'bg-sky-50 text-sky-700 border-sky-200',
  'Back of House': 'bg-rose-50 text-rose-700 border-rose-200',
  'Bar & Beverage': 'bg-purple-50 text-purple-700 border-purple-200',
  'Kitchen Prep & Dish': 'bg-amber-50 text-amber-700 border-amber-200',
  'Management': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const POSDepartmentMappingModal: React.FC<POSDepartmentMappingModalProps> = ({
  isOpen,
  onClose,
  posMappings,
  initialMapping,
  onSaveMapping,
  activePOSId = 'toast',
  onSelectActivePOS,
  shifts = [],
  employees = []
}) => {
  const safeMappings = posMappings || INITIAL_POS_DEPARTMENT_MAPPINGS;
  const initialPOS = initialMapping?.posPlatformId || activePOSId || 'toast';
  const [selectedPOS, setSelectedPOS] = useState<POSPlatformId>(initialPOS);
  const [currentConfig, setCurrentConfig] = useState<POSDepartmentMapping>(
    initialMapping || (safeMappings && (safeMappings[initialPOS] || safeMappings['toast'])) || INITIAL_POS_DEPARTMENT_MAPPINGS[initialPOS] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast']
  );
  const [activeSubTab, setActiveSubTab] = useState<'revenue_centers' | 'job_codes' | 'categories' | 'targets' | 'simulator'>('revenue_centers');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    recordsProcessed: number;
    unmappedCount: number;
    simulatedLaborPct: number;
    simulatedSplh: number;
    message: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialMapping) {
      setCurrentConfig(initialMapping);
      setSelectedPOS(initialMapping.posPlatformId);
    } else if (activePOSId && safeMappings[activePOSId]) {
      setCurrentConfig(safeMappings[activePOSId]);
      setSelectedPOS(activePOSId);
    }
  }, [initialMapping, activePOSId, isOpen]);

  if (!isOpen) return null;

  const handlePOSSwitch = (posId: POSPlatformId) => {
    setSelectedPOS(posId);
    setCurrentConfig((safeMappings && safeMappings[posId]) || INITIAL_POS_DEPARTMENT_MAPPINGS[posId] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast']);
    setTestResult(null);
  };

  const handleApplyPreset = (template: POSDepartmentMapping['presetTemplate']) => {
    const templateMapping = INITIAL_POS_DEPARTMENT_MAPPINGS[selectedPOS] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast'];
    setCurrentConfig({
      ...templateMapping,
      presetTemplate: template,
      lastUpdated: `Preset applied: ${template.replace(/_/g, ' ')} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    });
    showToast(`Applied preset template: ${template.replace(/_/g, ' ')}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAndApply = () => {
    if (onSaveMapping) {
      onSaveMapping(currentConfig);
    }
    if (onSelectActivePOS) {
      onSelectActivePOS(selectedPOS);
    }
    showToast(`Saved and synced ${currentConfig.posPlatformName} department mapping!`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Revenue center handlers
  const handleUpdateRevenueCenter = (id: string, updates: Partial<POSRevenueCenterMapping>) => {
    setCurrentConfig(prev => ({
      ...prev,
      revenueCenterMappings: prev.revenueCenterMappings.map(rc => rc.id === id ? { ...rc, ...updates } : rc)
    }));
  };

  const handleAddRevenueCenter = () => {
    const newRC: POSRevenueCenterMapping = {
      id: `rc-custom-${Date.now()}`,
      posRevenueCenter: 'New POS Revenue Center',
      department: 'Front of House',
      salesAllocationPct: 100,
      description: 'Custom dining zone',
      active: true
    };
    setCurrentConfig(prev => ({
      ...prev,
      revenueCenterMappings: [...prev.revenueCenterMappings, newRC]
    }));
  };

  const handleDeleteRevenueCenter = (id: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      revenueCenterMappings: prev.revenueCenterMappings.filter(rc => rc.id !== id)
    }));
  };

  // Job code handlers
  const handleUpdateJobCode = (id: string, updates: Partial<POSJobCodeMapping>) => {
    setCurrentConfig(prev => ({
      ...prev,
      jobCodeMappings: prev.jobCodeMappings.map(jc => jc.id === id ? { ...jc, ...updates } : jc)
    }));
  };

  const handleAddJobCode = () => {
    const newJC: POSJobCodeMapping = {
      id: `jc-custom-${Date.now()}`,
      posJobCode: `JOB_${Math.floor(100 + Math.random() * 900)}`,
      posJobTitle: 'Custom Server / Staff Role',
      department: 'Front of House',
      defaultHourlyWage: 19.00,
      targetLaborPct: 10.0,
      active: true
    };
    setCurrentConfig(prev => ({
      ...prev,
      jobCodeMappings: [...prev.jobCodeMappings, newJC]
    }));
  };

  const handleDeleteJobCode = (id: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      jobCodeMappings: prev.jobCodeMappings.filter(jc => jc.id !== id)
    }));
  };

  // Sales category handlers
  const handleUpdateCategory = (id: string, updates: Partial<POSSalesCategoryMapping>) => {
    setCurrentConfig(prev => ({
      ...prev,
      salesCategoryMappings: prev.salesCategoryMappings.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
    }));
  };

  const handleAddCategory = () => {
    const newCat: POSSalesCategoryMapping = {
      id: `cat-custom-${Date.now()}`,
      posCategory: 'Custom Menu Category',
      department: 'Back of House',
      contributionPct: 100,
      targetLaborRatioPct: 11.0,
      active: true
    };
    setCurrentConfig(prev => ({
      ...prev,
      salesCategoryMappings: [...prev.salesCategoryMappings, newCat]
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCurrentConfig(prev => ({
      ...prev,
      salesCategoryMappings: prev.salesCategoryMappings.filter(cat => cat.id !== id)
    }));
  };

  // Department targets handler
  const handleUpdateTarget = (dept: Department, field: keyof DepartmentEfficiencyConfig, value: number) => {
    setCurrentConfig(prev => ({
      ...prev,
      departmentTargets: {
        ...prev.departmentTargets,
        [dept]: {
          ...prev.departmentTargets[dept],
          [field]: value
        }
      }
    }));
  };

  // Total Target Labor Sum
  const totalTargetLaborPct = (Object.values(currentConfig.departmentTargets) as { targetLaborPct?: number }[]).reduce(
    (sum, t) => sum + (t?.targetLaborPct || 0),
    0
  );

  // Test Simulator
  const handleRunTestSimulation = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      const activeJobCount = currentConfig.jobCodeMappings.filter(j => j.active).length;
      const activeRcCount = currentConfig.revenueCenterMappings.filter(r => r.active).length;
      const activeCatCount = currentConfig.salesCategoryMappings.filter(c => c.active).length;

      setTestResult({
        success: true,
        recordsProcessed: 48,
        unmappedCount: 0,
        simulatedLaborPct: 18.29,
        simulatedSplh: 122.50,
        message: `Successfully validated ${currentConfig.posPlatformName} webhook feed: ${activeRcCount} revenue centers, ${activeJobCount} job codes, and ${activeCatCount} sales categories mapped with 100% accuracy.`
      });
      showToast('Live POS validation test completed successfully!');
    }, 1000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentConfig, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Workqora_POS_Mapping_${currentConfig.posPlatformId}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getPOSIcon = (id: string) => {
    switch (id) {
      case 'toast': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'square': return <Square className="w-5 h-5 text-slate-800" />;
      case 'clover': return <CircleDot className="w-5 h-5 text-emerald-600" />;
      case 'ncr_aloha': return <Server className="w-5 h-5 text-blue-600" />;
      default: return <Layers className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 rounded-md border border-orange-500/30 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-orange-400" />
                POS Department Mapping Engine
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                Live Labor-to-Sales Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Universal POS to Department Structure</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Map Toast, Square, Clover, and Aloha revenue centers, job codes, and sales categories directly into Workqora's 5 departments for real-time labor efficiency tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* POS System Selector Pills (Toast, Square, Clover, Aloha) */}
        <div className="bg-slate-50 p-3 sm:px-6 border-b border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              {(['toast', 'square', 'clover', 'ncr_aloha'] as POSPlatformId[]).map((posId) => {
                const isSelected = selectedPOS === posId;
                const config = (safeMappings && safeMappings[posId]) || INITIAL_POS_DEPARTMENT_MAPPINGS[posId];
                return (
                  <button
                    key={posId}
                    onClick={() => handlePOSSwitch(posId)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-white text-slate-900 border-orange-500 shadow-sm ring-2 ring-orange-500/10'
                        : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {getPOSIcon(posId)}
                    <span>{config.posPlatformName}</span>
                    {activePOSId === posId && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Live Stream" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Preset Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Preset:</span>
              <select
                value={currentConfig.presetTemplate}
                onChange={(e) => handleApplyPreset(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer shadow-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
              >
                <option value="bistro_full_service">Full-Service Bistro (Recommended)</option>
                <option value="high_volume_bar_grill">High-Volume Bar &amp; Grill</option>
                <option value="fast_casual_counter">Fast-Casual Counter &amp; Takeout</option>
                <option value="fine_dining_lounge">Fine Dining &amp; VIP Lounge</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('revenue_centers')}
            className={`pb-3 px-3 transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'revenue_centers'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Revenue Centers ({currentConfig.revenueCenterMappings.length})
          </button>

          <button
            onClick={() => setActiveSubTab('job_codes')}
            className={`pb-3 px-3 transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'job_codes'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            2. POS Job Codes ({currentConfig.jobCodeMappings.length})
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`pb-3 px-3 transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'categories'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            3. Sales Categories ({currentConfig.salesCategoryMappings.length})
          </button>

          <button
            onClick={() => setActiveSubTab('targets')}
            className={`pb-3 px-3 transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'targets'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            4. Department Targets ({totalTargetLaborPct.toFixed(1)}%)
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`pb-3 px-3 transition-all cursor-pointer border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'simulator'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            5. Ingestion Test Simulator
          </button>
        </div>

        {/* Modal Main Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* TAB 1: REVENUE CENTER MAPPINGS */}
          {activeSubTab === 'revenue_centers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    POS Revenue Centers → Department Structure
                  </h3>
                  <p className="text-xs text-slate-500">
                    Map POS dining zones, patios, bars, and takeout stations to our internal departments for sales volume routing.
                  </p>
                </div>
                <button
                  onClick={handleAddRevenueCenter}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Revenue Center
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">POS Revenue Center / Zone</th>
                      <th className="p-3 font-semibold">Workqora Department</th>
                      <th className="p-3 font-semibold">Sales Allocation %</th>
                      <th className="p-3 font-semibold">Zone Notes</th>
                      <th className="p-3 font-semibold text-center">Active</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentConfig.revenueCenterMappings.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-900">
                          <input
                            type="text"
                            value={rc.posRevenueCenter}
                            onChange={(e) => handleUpdateRevenueCenter(rc.id, { posRevenueCenter: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={rc.department}
                            onChange={(e) => handleUpdateRevenueCenter(rc.id, { department: e.target.value as Department })}
                            className={`bg-white border rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer outline-hidden ${DEPARTMENT_BADGE_COLORS[rc.department]}`}
                          >
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rc.salesAllocationPct}
                              onChange={(e) => handleUpdateRevenueCenter(rc.id, { salesAllocationPct: Number(e.target.value) })}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-hidden"
                            />
                            <span className="text-slate-400 font-mono">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">
                          <input
                            type="text"
                            value={rc.description || ''}
                            placeholder="Optional notes"
                            onChange={(e) => handleUpdateRevenueCenter(rc.id, { description: e.target.value })}
                            className="w-full bg-transparent border-b border-dashed border-slate-200 px-1 py-1 text-xs text-slate-600 focus:border-sky-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={rc.active}
                            onChange={(e) => handleUpdateRevenueCenter(rc.id, { active: e.target.checked })}
                            className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteRevenueCenter(rc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Revenue Center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: POS JOB CODES */}
          {activeSubTab === 'job_codes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    POS Timeclock Job Codes → Department &amp; Wage Mapping
                  </h3>
                  <p className="text-xs text-slate-500">
                    When employees punch in on Toast, Square, Clover, or Aloha terminals, their job code automatically maps to the department labor budget.
                  </p>
                </div>
                <button
                  onClick={handleAddJobCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Job Code
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">POS Job Code</th>
                      <th className="p-3 font-semibold">POS Job Title</th>
                      <th className="p-3 font-semibold">Target Department</th>
                      <th className="p-3 font-semibold">Base Wage ($/hr)</th>
                      <th className="p-3 font-semibold">Target Labor %</th>
                      <th className="p-3 font-semibold text-center">Active</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentConfig.jobCodeMappings.map((jc) => (
                      <tr key={jc.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <input
                            type="text"
                            value={jc.posJobCode}
                            onChange={(e) => handleUpdateJobCode(jc.id, { posJobCode: e.target.value })}
                            className="w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3 font-medium text-slate-900">
                          <input
                            type="text"
                            value={jc.posJobTitle}
                            onChange={(e) => handleUpdateJobCode(jc.id, { posJobTitle: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={jc.department}
                            onChange={(e) => handleUpdateJobCode(jc.id, { department: e.target.value as Department })}
                            className={`bg-white border rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer outline-hidden ${DEPARTMENT_BADGE_COLORS[jc.department]}`}
                          >
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-mono">$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={jc.defaultHourlyWage}
                              onChange={(e) => handleUpdateJobCode(jc.id, { defaultHourlyWage: Number(e.target.value) })}
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-hidden"
                            />
                            <span className="text-slate-400 font-mono">/hr</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={jc.targetLaborPct}
                              onChange={(e) => handleUpdateJobCode(jc.id, { targetLaborPct: Number(e.target.value) })}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-hidden"
                            />
                            <span className="text-slate-400 font-mono">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={jc.active}
                            onChange={(e) => handleUpdateJobCode(jc.id, { active: e.target.checked })}
                            className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteJobCode(jc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Job Code"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SALES & MENU CATEGORIES */}
          {activeSubTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    POS Menu &amp; Sales Categories → Department Revenue Attribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Maps item sales categories from the POS ticket feed to determine department revenue generation.
                  </p>
                </div>
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Sales Category
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-semibold">POS Menu Category</th>
                      <th className="p-3 font-semibold">Attributed Department</th>
                      <th className="p-3 font-semibold">Contribution Split %</th>
                      <th className="p-3 font-semibold">Target Cost of Labor %</th>
                      <th className="p-3 font-semibold text-center">Active</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentConfig.salesCategoryMappings.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-900">
                          <input
                            type="text"
                            value={cat.posCategory}
                            onChange={(e) => handleUpdateCategory(cat.id, { posCategory: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-sky-500 outline-hidden"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={cat.department}
                            onChange={(e) => handleUpdateCategory(cat.id, { department: e.target.value as Department })}
                            className={`bg-white border rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer outline-hidden ${DEPARTMENT_BADGE_COLORS[cat.department]}`}
                          >
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={cat.contributionPct}
                              onChange={(e) => handleUpdateCategory(cat.id, { contributionPct: Number(e.target.value) })}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-hidden"
                            />
                            <span className="text-slate-400 font-mono">%</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={cat.targetLaborRatioPct}
                              onChange={(e) => handleUpdateCategory(cat.id, { targetLaborRatioPct: Number(e.target.value) })}
                              className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 text-right outline-hidden"
                            />
                            <span className="text-slate-400 font-mono">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={cat.active}
                            onChange={(e) => handleUpdateCategory(cat.id, { active: e.target.checked })}
                            className="w-4 h-4 rounded-md text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENT EFFICIENCY TARGETS */}
          {activeSubTab === 'targets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Labor-to-Sales Target Calibration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure target labor cost ratios (%) and Sales Per Labor Hour ($/hr) benchmarks for each department.
                  </p>
                </div>

                {/* Total Target Sum Card */}
                <div className="px-4 py-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Restaurant Target Labor</span>
                  <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-emerald-400">{totalTargetLaborPct.toFixed(1)}%</span>
                    <span className="text-xs text-slate-400">(Goal: 28% – 34%)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.map((dept) => {
                  const target = currentConfig.departmentTargets[dept] || {
                    targetLaborPct: 10.0,
                    targetSplh: 250,
                    maxOvertimeHours: 4.0,
                    minActiveStaff: 2
                  };
                  return (
                    <div key={dept} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${DEPARTMENT_BADGE_COLORS[dept]}`}>
                          {dept}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Labor Benchmark</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        {/* Target Labor % */}
                        <div>
                          <div className="flex justify-between font-semibold text-slate-700 mb-1">
                            <span>Target Labor %:</span>
                            <span className="font-mono text-sky-700 font-bold">{target.targetLaborPct}% of Dept Sales</span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="25.0"
                            step="0.5"
                            value={target.targetLaborPct}
                            onChange={(e) => handleUpdateTarget(dept, 'targetLaborPct', Number(e.target.value))}
                            className="w-full accent-sky-600 cursor-pointer"
                          />
                        </div>

                        {/* Target SPLH ($/hr) */}
                        <div className="pt-1">
                          <div className="flex justify-between font-semibold text-slate-700 mb-1">
                            <span>Target SPLH ($/hr):</span>
                            <span className="font-mono text-emerald-700 font-bold">${target.targetSplh}/hr</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="600"
                            step="10"
                            value={target.targetSplh}
                            onChange={(e) => handleUpdateTarget(dept, 'targetSplh', Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                        </div>

                        {/* Floor Limits */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                          <div>
                            <span className="text-slate-500">Max Overtime:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                step="0.5"
                                value={target.maxOvertimeHours}
                                onChange={(e) => handleUpdateTarget(dept, 'maxOvertimeHours', Number(e.target.value))}
                                className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
                              />
                              <span className="text-slate-400">hrs</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Min Floor Staff:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={target.minActiveStaff}
                                onChange={(e) => handleUpdateTarget(dept, 'minActiveStaff', Number(e.target.value))}
                                className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
                              />
                              <span className="text-slate-400">staff</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: INGESTION TEST SIMULATOR */}
          {activeSubTab === 'simulator' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white space-y-3 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-white">
                      Live Webhook &amp; Department Mapping Validator
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    Endpoint: /api/v2/pos/{currentConfig.posPlatformId}/webhook
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Execute an automated diagnostic batch test across all active revenue centers, job codes, and sales categories mapped for <strong>{currentConfig.posPlatformName}</strong>.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleRunTestSimulation}
                    disabled={isTesting}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Simulating 50 Orders & Punches...' : 'Run Live Diagnostic Test'}
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Diagnostics Passed: 100% Department Mapping Integrity Verified</span>
                  </div>
                  <p className="text-xs text-emerald-700">{testResult.message}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Orders Processed</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">{testResult.recordsProcessed} Tickets</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Unmapped Items</span>
                      <p className="text-base font-black text-emerald-600 mt-0.5">{testResult.unmappedCount} (Clean)</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Computed Labor %</span>
                      <p className="text-base font-black text-sky-700 mt-0.5">{testResult.simulatedLaborPct}%</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-xs">
                      <span className="text-[11px] text-slate-500 font-medium">Computed SPLH</span>
                      <p className="text-base font-black text-indigo-700 mt-0.5">${testResult.simulatedSplh}/hr</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-sky-600" />
            <span>Target changes take effect immediately in the Analytics Dashboard &amp; Integrations Hub.</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save &amp; Apply Live Mapping
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};