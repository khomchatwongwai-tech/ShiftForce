import React, { useState } from 'react';
import {
  Wrench,
  Cpu,
  QrCode,
  CalendarCheck,
  AlertTriangle,
  Users2,
  Package,
  FileCheck,
  ClipboardList,
  Activity,
  ShieldAlert,
  TrendingDown,
  History,
  Zap,
  Utensils,
  Monitor,
  Snowflake,
  Droplets,
  Trash2,
  BookOpen,
  LineChart,
  LayoutDashboard,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Camera,
  Check,
  X,
  Sparkles,
  BarChart2,
  DollarSign,
  Download,
  Info,
  Layers,
  Thermometer
} from 'lucide-react';
import {
  EquipmentItem,
  EquipmentWorkOrder,
  PreventiveMaintenanceTask,
  EquipmentSubTab,
  EquipmentStatus,
  EquipmentCategory,
  SupportedLanguage
} from '../types';
import {
  EQUIPMENT_SUB_TABS,
  INITIAL_EQUIPMENT_ITEMS,
  INITIAL_WORK_ORDERS,
  INITIAL_PM_TASKS,
  EquipmentSubTabDef
} from '../data/equipmentData';

interface EquipmentManagerViewProps {
  currentLanguage: SupportedLanguage;
}

export const EquipmentManagerView: React.FC<EquipmentManagerViewProps> = ({ currentLanguage }) => {
  const [activeSubTab, setActiveSubTab] = useState<EquipmentSubTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Data States
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT_ITEMS);
  const [workOrders, setWorkOrders] = useState<EquipmentWorkOrder[]>(INITIAL_WORK_ORDERS);
  const [pmTasks, setPmTasks] = useState<PreventiveMaintenanceTask[]>(INITIAL_PM_TASKS);
  
  // Modals & Interactivity
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewWorkOrderModal, setShowNewWorkOrderModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [simulatedScanning, setSimulatedScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Equipment Form State
  const [newEquipName, setNewEquipName] = useState('');
  const [newEquipModel, setNewEquipModel] = useState('');
  const [newEquipSerial, setNewEquipSerial] = useState('');
  const [newEquipCategory, setNewEquipCategory] = useState<EquipmentCategory>('cooking');
  const [newEquipStation, setNewEquipStation] = useState('Hot Line - Station 1');
  const [newEquipCost, setNewEquipCost] = useState(5000);
  const [newEquipVendor, setNewEquipVendor] = useState('Commercial Kitchen Direct');
  const [newEquipVendorPhone, setNewEquipVendorPhone] = useState('(800) 555-0199');

  // New Work Order Form State
  const [newWoEquipId, setNewWoEquipId] = useState(equipmentList[0]?.id || '');
  const [newWoTitle, setNewWoTitle] = useState('');
  const [newWoDesc, setNewWoDesc] = useState('');
  const [newWoPriority, setNewWoPriority] = useState<'low' | 'medium' | 'high' | 'critical_emergency'>('medium');
  const [newWoEstCost, setNewWoEstCost] = useState(250);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getSubTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'QrCode': return <QrCode className="w-4 h-4" />;
      case 'CalendarCheck': return <CalendarCheck className="w-4 h-4" />;
      case 'Wrench': return <Wrench className="w-4 h-4" />;
      case 'AlertTriangle': return <AlertTriangle className="w-4 h-4" />;
      case 'Users2': return <Users2 className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'FileCheck': return <FileCheck className="w-4 h-4" />;
      case 'ClipboardList': return <ClipboardList className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4" />;
      case 'TrendingDown': return <TrendingDown className="w-4 h-4" />;
      case 'History': return <History className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Utensils': return <Utensils className="w-4 h-4" />;
      case 'Monitor': return <Monitor className="w-4 h-4" />;
      case 'Snowflake': return <Snowflake className="w-4 h-4" />;
      case 'Droplets': return <Droplets className="w-4 h-4" />;
      case 'Trash2': return <Trash2 className="w-4 h-4" />;
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'LineChart': return <LineChart className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipName.trim()) return;

    const newItem: EquipmentItem = {
      id: `eq-${Date.now()}`,
      name: newEquipName,
      modelNumber: newEquipModel || 'MDL-2026-X',
      serialNumber: newEquipSerial || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      manufacturer: newEquipVendor,
      category: newEquipCategory,
      station: newEquipStation,
      department: 'Back of House',
      status: 'operational',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: Number(newEquipCost) || 3500,
      currentValue: Number(newEquipCost) || 3500,
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 2).toISOString().split('T')[0],
      nextPmDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTechnician: 'Certified Service Partner',
      vendorName: newEquipVendor,
      vendorPhone: newEquipVendorPhone,
      notes: 'Provisioned via Workqora Equipment Master Registry'
    };

    setEquipmentList(prev => [newItem, ...prev]);
    setShowAddModal(false);
    showToast(`Added "${newItem.name}" to Master Equipment Registry.`);
    setNewEquipName('');
    setNewEquipModel('');
    setNewEquipSerial('');
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWoTitle.trim()) return;

    const targetEquip = equipmentList.find(eq => eq.id === newWoEquipId) || equipmentList[0];
    const newWo: EquipmentWorkOrder = {
      id: `wo-${Math.floor(800 + Math.random() * 900)}`,
      equipmentId: targetEquip.id,
      equipmentName: targetEquip.name,
      title: newWoTitle,
      description: newWoDesc || 'Regular maintenance service requested.',
      priority: newWoPriority,
      status: 'open',
      reportedBy: 'Manager On Duty',
      assignedVendor: targetEquip.vendorName,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCost: Number(newWoEstCost) || 200
    };

    setWorkOrders(prev => [newWo, ...prev]);
    setShowNewWorkOrderModal(false);
    showToast(`Work Order #${newWo.id} created successfully.`);
    setNewWoTitle('');
    setNewWoDesc('');
  };

  const handleSimulateQRScan = (code?: string) => {
    setSimulatedScanning(true);
    setTimeout(() => {
      setSimulatedScanning(false);
      const targetCode = code || 'eq-001';
      const matched = equipmentList.find(eq => eq.id === targetCode) || equipmentList[0];
      setScannedResult(matched.id);
      setSelectedEquipment(matched);
      showToast(`Scanned QR for: ${matched.name}`);
    }, 1200);
  };

  const handleCompletePMTask = (taskId: string) => {
    setPmTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'completed', lastCompletedDate: new Date().toISOString().split('T')[0] }
          : t
      )
    );
    showToast('Preventive maintenance task marked as completed & audit logged.');
  };

  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.modelNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || eq.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const operationalCount = equipmentList.filter(e => e.status === 'operational').length;
  const warningCount = equipmentList.filter(e => e.status === 'warning').length;
  const criticalCount = equipmentList.filter(e => e.status === 'critical' || e.status === 'in_repair').length;
  const totalAssetValue = equipmentList.reduce((acc, curr) => acc + (curr.currentValue || 0), 0);

  return (
    <div id="equipment-manager-root" className="min-h-screen bg-slate-50/80 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border-b border-sky-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      Equipment & Facilities Suite
                    </h1>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full">
                      22 Sub-Sections
                    </span>
                  </div>
                  <p className="text-sm text-sky-200/80 mt-0.5">
                    Commercial kitchen CMMS, IoT live telemetry, preventive maintenance & CapEx lifecycle management.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                id="btn-scan-qr-header"
                onClick={() => {
                  setActiveSubTab('qr_scanner');
                  handleSimulateQRScan();
                }}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 transition-colors flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4 text-sky-300" />
                <span>Scan Equipment QR</span>
              </button>
              <button
                id="btn-new-wo-header"
                onClick={() => setShowNewWorkOrderModal(true)}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>New Work Order</span>
              </button>
              <button
                id="btn-add-equip-header"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Equipment</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-sky-800/40">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="text-xs text-sky-200">Active Monitored Assets</span>
              <div className="text-xl font-bold text-white mt-0.5">{equipmentList.length} Units</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="text-xs text-sky-200">Operational Uptime</span>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">
                {Math.round((operationalCount / Math.max(1, equipmentList.length)) * 100)}%
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="text-xs text-sky-200">Open Work Orders</span>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{workOrders.length} Active</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <span className="text-xs text-sky-200">Total Asset Book Value</span>
              <div className="text-xl font-bold text-sky-300 mt-0.5">${totalAssetValue.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* 22 Sub-Sections Navigation Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-2.5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-2 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Equipment Sub-Sections ({EQUIPMENT_SUB_TABS.length} Modules)
              </span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Click any sub-tab to navigate between the 22 management sections
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
            {EQUIPMENT_SUB_TABS.map((tab, idx) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`subtab-equip-${tab.id}`}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50/70 border border-slate-200/60'
                  }`}
                  title={tab.description}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>
                    {getSubTabIcon(tab.iconName)}
                  </span>
                  <span>{tab.shortLabel}</span>
                  {tab.badgeCount !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] rounded-full font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SUB-TAB CONTENTS */}

        {/* 1. DASHBOARD */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Equipment Health Status</span>
                  <Activity className="w-5 h-5 text-sky-600" />
                </div>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Operational & Normal
                    </span>
                    <span className="font-bold text-slate-800">{operationalCount} Units</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Warning / PM Due Soon
                    </span>
                    <span className="font-bold text-slate-800">{warningCount} Units</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      Critical / Breakdown
                    </span>
                    <span className="font-bold text-slate-800">{criticalCount} Units</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Preventive Maintenance (PM)</span>
                  <CalendarCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">{pmTasks.length} Active Schedules</div>
                  <p className="text-xs text-slate-500 mt-1">
                    1 task due today, 2 upcoming this week. All HACCP logs in green threshold.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('preventive_maintenance')}
                    className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    View PM Schedule Calendar <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Active Work Orders</span>
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-slate-900">{workOrders.length} In Progress</div>
                  <p className="text-xs text-slate-500 mt-1">
                    Avg resolution time: 4.2 hours. Hobart technician scheduled for 09:00 tomorrow.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('work_orders')}
                    className="mt-3 text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    Open Work Order Kanban <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Equipment Overview & IoT Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Critical Kitchen Assets Health</h3>
                    <p className="text-xs text-slate-500">Live operational telemetry across kitchen stations</p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('all_equipment')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    View All {equipmentList.length} Assets
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {equipmentList.slice(0, 5).map(eq => (
                    <div key={eq.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                          {eq.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            {eq.name}
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              eq.status === 'operational'
                                ? 'bg-emerald-100 text-emerald-800'
                                : eq.status === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {eq.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{eq.station} • {eq.modelNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {eq.tempReading !== undefined && (
                          <div className="text-xs font-bold text-slate-800">
                            {eq.tempReading}°F
                          </div>
                        )}
                        <span className="text-[11px] text-slate-400">PM Due: {eq.nextPmDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 22 Modules Quick Directory Navigator */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                <h3 className="text-base font-bold text-slate-900 mb-1">Quick Module Hub</h3>
                <p className="text-xs text-slate-500 mb-4">Direct access to the 22 facility management sections</p>
                
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {EQUIPMENT_SUB_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-sky-50 text-slate-700 hover:text-sky-700 transition-colors text-left border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sky-600">{getSubTabIcon(tab.iconName)}</span>
                        <span className="font-medium">{tab.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ALL EQUIPMENT */}
        {activeSubTab === 'all_equipment' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Filters and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by equipment name, model, serial, station..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cooking">Cooking & Hot Line</option>
                  <option value="refrigeration">Refrigeration & Cold</option>
                  <option value="dishwashing">Dishwashing & Stewarding</option>
                  <option value="beverage_bar">Bar & Beverage</option>
                  <option value="pos_it">POS & IT Terminals</option>
                  <option value="hvac_facility">HVAC & Facility</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="operational">Operational</option>
                  <option value="warning">Warning / Notice</option>
                  <option value="critical">Critical / Breakdown</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Equipment Asset</span>
                </button>
              </div>
            </div>

            {/* Equipment Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(eq => (
                <div
                  key={eq.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                          {eq.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5 line-clamp-1">{eq.name}</h4>
                        <p className="text-xs text-slate-500">{eq.station}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase shrink-0 ${
                        eq.status === 'operational'
                          ? 'bg-emerald-100 text-emerald-800'
                          : eq.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {eq.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">MODEL NUMBER</span>
                        <span className="font-semibold text-slate-700">{eq.modelNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">SERIAL NUMBER</span>
                        <span className="font-mono text-slate-700 text-[11px]">{eq.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CURRENT VALUE</span>
                        <span className="font-semibold text-emerald-700">${eq.currentValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">NEXT PM DATE</span>
                        <span className="font-medium text-slate-700">{eq.nextPmDate}</span>
                      </div>
                    </div>

                    {eq.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mt-3 border border-slate-100">
                        {eq.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedEquipment(eq);
                      }}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      View Details & QR <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setNewWoEquipId(eq.id);
                        setShowNewWorkOrderModal(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                    >
                      + Service Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. QR SCANNER */}
        {activeSubTab === 'qr_scanner' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto animate-in fade-in">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center mb-3">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Mobile Equipment Barcode & QR Scanner</h3>
              <p className="text-xs text-slate-500 mt-1">
                Point camera at equipment asset tag to load real-time telemetry, service history, and instant dispatch.
              </p>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div className="mt-6 relative bg-slate-950 rounded-2xl p-8 text-center border-2 border-dashed border-sky-400/50 overflow-hidden">
              <div className="w-48 h-48 mx-auto border-2 border-sky-400 rounded-xl relative flex items-center justify-center">
                {simulatedScanning ? (
                  <div className="text-sky-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-mono">Scanning QR Code...</span>
                  </div>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-sky-400 animate-pulse" />
                    <span className="text-xs text-slate-300">Align QR tag inside frame</span>
                  </div>
                )}
                {/* Scanner Target Lines */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sky-400" />
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => handleSimulateQRScan('eq-001')}
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-md transition-colors"
                >
                  Simulate Rational Combi QR
                </button>
                <button
                  onClick={() => handleSimulateQRScan('eq-003')}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                >
                  Simulate Hobart Dishwasher QR
                </button>
              </div>
            </div>

            {scannedResult && selectedEquipment && (
              <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedEquipment.name}</h4>
                      <p className="text-xs text-slate-500">{selectedEquipment.modelNumber} • {selectedEquipment.station}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                    {selectedEquipment.status.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-sky-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveSubTab('work_orders')}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    Open Service Tickets →
                  </button>
                  <button
                    onClick={() => setActiveSubTab('manuals_training')}
                    className="text-xs font-semibold text-sky-700 hover:underline"
                  >
                    View Digital Manuals →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PREVENTIVE MAINTENANCE (PM) */}
        {activeSubTab === 'preventive_maintenance' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Preventive Maintenance Schedules & Audits</h3>
                  <p className="text-xs text-slate-500">Scheduled automated descaling, coil cleanings, and safety checklists</p>
                </div>
              </div>

              <div className="space-y-4">
                {pmTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                          {task.frequency}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{task.taskTitle}</h4>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'due_today'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{task.equipmentName} • Assigned: {task.assignedRole}</p>
                      
                      {/* Checkable Items */}
                      <div className="mt-2 space-y-1">
                        {task.checklistItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-500">Due Date: <strong className="text-slate-800">{task.nextDueDate}</strong></span>
                      {task.status !== 'completed' ? (
                        <button
                          onClick={() => handleCompletePMTask(task.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Completed & Log
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Audit Recorded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. WORK ORDERS */}
        {activeSubTab === 'work_orders' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Work Orders & Service Tickets</h3>
                <p className="text-xs text-slate-500">Track vendor dispatch, repairs, parts on order, and resolution timelines</p>
              </div>
              <button
                onClick={() => setShowNewWorkOrderModal(true)}
                className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create Service Ticket</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Kanban Column: Open & Triage */}
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-600">Open Tickets ({workOrders.filter(w => w.status === 'open').length})</span>
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                </div>
                <div className="space-y-3">
                  {workOrders.filter(w => w.status === 'open').map(wo => (
                    <div key={wo.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-slate-400">#{wo.id}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          wo.priority === 'critical_emergency'
                            ? 'bg-rose-100 text-rose-800'
                            : wo.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {wo.priority.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{wo.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{wo.equipmentName}</p>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Est: ${wo.estimatedCost}</span>
                        <span>Due: {wo.dueDate.split('T')[0]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Column: In Progress */}
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-600">In Progress ({workOrders.filter(w => w.status === 'in_progress').length})</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="space-y-3">
                  {workOrders.filter(w => w.status === 'in_progress').map(wo => (
                    <div key={wo.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-slate-400">#{wo.id}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                          {wo.priority.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{wo.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{wo.equipmentName}</p>
                      {wo.assignedTech && (
                        <p className="text-xs text-sky-600 font-medium mt-1">Tech: {wo.assignedTech}</p>
                      )}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Est: ${wo.estimatedCost}</span>
                        <button
                          onClick={() => {
                            setWorkOrders(prev => prev.map(w => w.id === wo.id ? { ...w, status: 'completed' } : w));
                            showToast(`Work Order #${wo.id} marked as completed.`);
                          }}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          Complete →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Column: Waiting on Parts / Completed */}
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase text-slate-600">Waiting Parts / Done ({workOrders.filter(w => w.status === 'waiting_parts' || w.status === 'completed').length})</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="space-y-3">
                  {workOrders.filter(w => w.status === 'waiting_parts' || w.status === 'completed').map(wo => (
                    <div key={wo.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-slate-400">#{wo.id}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          wo.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {wo.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{wo.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{wo.equipmentName}</p>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Est: ${wo.estimatedCost}</span>
                        <span>{wo.status === 'completed' ? 'Resolved' : 'Parts Dispatched'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. BREAKDOWN REPORTS */}
        {activeSubTab === 'breakdown_reports' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-lg font-bold text-slate-900">Emergency Line-Down Breakdown Center</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  1-click priority contractor dispatch for walk-in coolers, fryers, and hood exhaust failures.
                </p>
              </div>
              <button
                onClick={() => {
                  showToast('Emergency Breakdown Ticket Broadcast to On-Call HVAC & Kitchen Tech!');
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Broadcast Emergency Breakdown</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800">ACTIVE INCIDENT #BRK-401</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-200 text-rose-900 rounded-full">LINE IMPACT</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">Hobart Conveyor Booster Temp Drop (178°F)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Reported by Exec Chef. Machine operating with manual chemical sanitizing protocol active until Hobart tech arrives tomorrow morning.
                </p>
                <div className="mt-3 pt-3 border-t border-rose-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Downtime: <strong>0 mins (Degraded)</strong></span>
                  <span className="font-semibold text-rose-700">Contractor SLA: 4 hrs</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600">PREVIOUS RESOLVED BREAKDOWN</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">True Walk-In Blast Defrost Sensor Fault</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Resolved in 2.5 hours on 2026-08-10 by CoolTech Refrigeration. Bimetal defrost thermostat replaced under warranty.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Zero Food Spoilage Logged
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. VENDORS & TECHNICIANS */}
        {activeSubTab === 'vendors_technicians' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Authorized Service Contractors & Technicians</h3>
              <p className="text-xs text-slate-500">24/7 service contacts, certified manufacturer reps, and SLA agreements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'CoolTech HVAC & Cold Systems', specialty: 'Walk-ins, Reach-ins & Ice Machines', phone: '(800) 456-7890', sla: '2-Hour Emergency', rating: '4.9 ★' },
                { name: 'Rational Direct Care USA', specialty: 'iCombi Pro Steamers & Combi Ovens', phone: '(888) 320-7274', sla: 'Same-Day Response', rating: '5.0 ★' },
                { name: 'Hobart National Support Service', specialty: 'Conveyor Dishwashers & Mixers', phone: '(888) 446-2278', sla: '4-Hour Commercial', rating: '4.8 ★' },
                { name: 'Artisan Espresso Tech Group', specialty: 'La Marzocco, Grinders & Water RO', phone: '(206) 706-9104', sla: 'Next-Day Morning', rating: '4.9 ★' },
                { name: 'CaptiveAire Hood AirFlow Pros', specialty: 'Hood Exhaust, Make-Up Air & Ansul', phone: '(800) 334-9256', sla: 'Semi-Annual Certified', rating: '5.0 ★' },
                { name: 'Toast POS Field Engineers', specialty: 'Terminals, KDS, Thermal Printers', phone: '(855) 862-7876', sla: 'Instant Remote / 24h Swap', rating: '4.7 ★' }
              ].map((v, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-700">{v.rating}</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{v.sla}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{v.name}</h4>
                  <p className="text-xs text-slate-500">{v.specialty}</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                    <a href={`tel:${v.phone}`} className="font-bold text-sky-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {v.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. SPARE PARTS & GASKETS */}
        {activeSubTab === 'spare_parts' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Spare Parts, Gaskets & Consumables</h3>
                <p className="text-xs text-slate-500">In-house inventory of high-turnover replacement parts and filters</p>
              </div>
              <button
                onClick={() => showToast('Dispatched automated PO to PartsTown & Commercial Parts.')}
                className="px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-xs"
              >
                Auto-Replenish Low Stock
              </button>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {[
                { part: 'True 2-Door Magnetic Gasket Seal', code: 'TRU-GSK-49', qty: 2, min: 1, equip: 'True T-49 Chiller', status: 'In Stock' },
                { part: 'Rational Active Green Descaler Tabs (Bucket)', code: 'RAT-TAB-GRN', qty: 4, min: 2, equip: 'Rational iCombi Pro', status: 'Optimal' },
                { part: 'Hobart 180°F Booster Heating Element (30kW)', code: 'HOB-ELM-44', qty: 1, min: 1, equip: 'Hobart Dishwasher', status: 'Reserved for WO #801' },
                { part: 'Pitco Fryer High-Limit Safety Thermostat', code: 'PIT-STAT-350', qty: 2, min: 1, equip: 'Pitco SG14 Fryer', status: 'In Stock' },
                { part: 'La Marzocco 8.5mm Silicone Group Gaskets', code: 'LM-GSK-85', qty: 6, min: 3, equip: 'Linea PB Espresso', status: 'Optimal' },
                { part: 'Ecolab Solid Power Dishwashing Detergent', code: 'ECO-DET-50', qty: 8, min: 4, equip: 'Conveyor Dish Pit', status: 'Optimal' }
              ].map((p, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <h5 className="font-bold text-slate-900">{p.part}</h5>
                    <p className="text-slate-500">{p.code} • For {p.equip}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{p.qty} Units</span>
                    <span className="block text-[11px] text-emerald-600 font-medium">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. WARRANTIES & AMC CONTRACTS */}
        {activeSubTab === 'warranties_contracts' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Warranties & Annual Maintenance Contracts (AMC)</h3>
            <p className="text-xs text-slate-500">Track coverage terms, manufacturer warranty expiry, and AMC SLA renewals</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {equipmentList.map(eq => (
                <div key={eq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{eq.name}</span>
                    <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">ACTIVE WARRANTY</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Vendor: {eq.vendorName} • Phone: {eq.vendorPhone}</p>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Expires: <strong className="text-slate-800">{eq.warrantyExpiry}</strong></span>
                    <span className="text-emerald-700 font-semibold">100% Parts & Labor Covered</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. DAILY INSPECTIONS & CHECKLISTS */}
        {activeSubTab === 'inspections_checklists' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daily Opening & Closing Equipment Audits</h3>
                <p className="text-xs text-slate-500">Digital verification of hood airflow, grease traps, temperatures, and sanitized lines</p>
              </div>
              <button
                onClick={() => showToast('Audit checklist signed and verified by Shift Supervisor.')}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs"
              >
                Sign & Submit Audit
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {[
                { task: 'Check walk-in cooler temp (Must be ≤ 38°F)', role: 'Morning Sous Chef', done: true, time: '06:15 AM' },
                { task: 'Check blast freezer temp (Must be ≤ 0°F)', role: 'Morning Sous Chef', done: true, time: '06:15 AM' },
                { task: 'Verify hood exhaust damper activation & draft', role: 'Lead Line Cook', done: true, time: '06:30 AM' },
                { task: 'Calibrate digital food probe thermometers (Ice bath test)', role: 'Prep Cook', done: true, time: '07:00 AM' },
                { task: 'Verify conveyor dishwasher sanitizing rinse reached 180°F', role: 'Stewarding Lead', done: false, time: 'Pending Noon Test' },
                { task: 'Inspect deep fryer oil clarity (TPM < 24%)', role: 'Fry Lead', done: true, time: '11:00 AM' }
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      defaultChecked={item.done}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">{item.task}</span>
                      <p className="text-[11px] text-slate-500">{item.role}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. IoT & TEMPERATURE TELEMETRY */}
        {activeSubTab === 'iot_temperature' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Live IoT Cold-Chain & Probe Telemetry</h3>
                <p className="text-xs text-slate-500">Automated wireless Bluetooth/Zigbee sensor nodes reporting every 60 seconds</p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Telemetry Streaming Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Walk-In Meat Cooler', temp: '35.8°F', target: '34°F - 38°F', battery: '98%', status: 'Normal' },
                { name: 'Walk-In Produce Chiller', temp: '37.2°F', target: '34°F - 40°F', battery: '94%', status: 'Normal' },
                { name: 'Walk-In Blast Freezer', temp: '-8.4°F', target: '-10°F to 0°F', battery: '91%', status: 'Normal' },
                { name: 'Hot Line Reach-In Cooler', temp: '36.9°F', target: '34°F - 38°F', battery: '87%', status: 'Normal' },
                { name: 'Bar Keg Kegerator Chiller', temp: '34.5°F', target: '32°F - 36°F', battery: '95%', status: 'Normal' },
                { name: 'Hobart Rinse Booster Tank', temp: '178.0°F', target: '180°F (Min)', battery: 'Hardwired', status: 'Warning' }
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{s.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">{s.temp}</span>
                      <span className="text-xs text-slate-500 font-medium">Target: {s.target}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Probe Battery: {s.battery}</span>
                    <span>Updated 12s ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. SAFETY & COMPLIANCE */}
        {activeSubTab === 'safety_compliance' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Safety, OSHA & Fire Suppression Compliance</h3>
            <p className="text-xs text-slate-500">Ansul certifications, semi-annual hood inspections, and NSF sanitation stamps</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800">ANSUL FIRE SUPPRESSION</span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">Kitchen Hood R-102 Semi-Annual Inspection</h4>
                <p className="text-xs text-slate-600 mt-1">Certified on 2026-06-15 by State Fire Marshal. Next audit due: 2026-12-15.</p>
                <div className="mt-2 text-xs font-bold text-emerald-700">Status: 100% Compliant</div>
              </div>

              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                <span className="text-xs font-bold text-sky-800">GAS SAFETY VALVES</span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">Interlocked Gas Solenoid Automatic Shut-Off</h4>
                <p className="text-xs text-slate-600 mt-1">Interlocked with CaptiveAire hood fan speed sensor. Trip test passed 2026-08-01.</p>
                <div className="mt-2 text-xs font-bold text-sky-700">Status: Active & Calibrated</div>
              </div>
            </div>
          </div>
        )}

        {/* 13. LIFECYCLE & DEPRECIATION */}
        {activeSubTab === 'lifecycle_depreciation' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Equipment Lifecycle & Book Depreciation</h3>
                <p className="text-xs text-slate-500">Straight-line depreciation, residual scrap values, and expected replacement timelines</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">Accounting Method: 7-Year Straight Line (IRS MACRS)</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {equipmentList.map(eq => (
                <div key={eq.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <h4 className="font-bold text-slate-900">{eq.name}</h4>
                    <p className="text-slate-500">Purchased: {eq.purchaseDate} • Cost: ${eq.purchaseCost.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 text-sm">${eq.currentValue.toLocaleString()}</span>
                    <span className="block text-[11px] text-slate-400">Current Net Book Value</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 14. SERVICE HISTORY */}
        {activeSubTab === 'service_history' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Complete Historical Service & Repair Log</h3>
            <p className="text-xs text-slate-500">Immutable audit log of all completed service tickets, parts replaced, and costs incurred</p>

            <div className="space-y-3 mt-4">
              {[
                { date: '2026-08-10', equip: 'Master-Bilt Walk-In Freezer', desc: 'Replaced bimetal defrost thermostat & sealed electrical conduit', cost: '$240', tech: 'CoolTech HVAC' },
                { date: '2026-07-28', equip: 'CaptiveAire Kitchen Hood', desc: 'Quarterly degreasing & fan bearing lubrication', cost: '$650', tech: 'AirFlow Hood Services' },
                { date: '2026-07-15', equip: 'La Marzocco Linea PB', desc: 'Replaced steam wand valve rebuild kit & group seals', cost: '$180', tech: 'Artisan Espresso' },
                { date: '2026-06-20', equip: 'Pitco Solstice Gas Fryer', desc: 'Gas manifold pressure regulator calibration', cost: '$120', tech: 'GasMaster Tech' }
              ].map((log, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs bg-slate-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{log.date}</span>
                      <strong className="text-slate-900">{log.equip}</strong>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.desc} (by {log.tech})</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{log.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 15. ENERGY & UTILITIES */}
        {activeSubTab === 'energy_utilities' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Kitchen Energy, Gas & Water Utility Analytics</h3>
            <p className="text-xs text-slate-500">Monitor kilowatt-hour and gas consumption per line to optimize energy efficiency</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-sky-50/50">
                <span className="text-xs text-slate-500">Electricity Draw (Live)</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">42.8 kW</div>
                <p className="text-xs text-slate-500 mt-1">Peak: Rational Combi + Dishwasher Booster</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/50">
                <span className="text-xs text-slate-500">Natural Gas Consumption</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">220,000 BTU/hr</div>
                <p className="text-xs text-slate-500 mt-1">Fryer Banks & Range Top</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/50">
                <span className="text-xs text-slate-500">Dish Pit Water Flow</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">0.88 Gal / Rack</div>
                <p className="text-xs text-slate-500 mt-1">Energy Star Certified Conservation</p>
              </div>
            </div>
          </div>
        )}

        {/* 16. SMALLWARES & TOOLS */}
        {activeSubTab === 'smallwares_tools' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Smallwares & Culinary Tools Inventory</h3>
            <p className="text-xs text-slate-500">Track precision blenders, chef knife sets, immersion circulators, and digital scales</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { name: 'Vitamix Vita-Prep 3 Commercial Blender', qty: 4, station: 'Prep Line', status: 'Optimal' },
                { name: 'PolyScience HydroPro Sous-Vide Immersion', qty: 3, station: 'Hot Line', status: 'Optimal' },
                { name: 'ThermoWorks Thermapen ONE Probes', qty: 8, station: 'All Stations', status: 'Calibrated' },
                { name: 'Robot Coupe R2N Continuous Feed Processor', qty: 2, station: 'Prep Line', status: 'Optimal' }
              ].map((sw, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs">
                  <h4 className="font-bold text-slate-900">{sw.name}</h4>
                  <p className="text-slate-500 mt-1">{sw.station} • {sw.qty} Active</p>
                  <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                    {sw.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 17. POS & IT HARDWARE */}
        {activeSubTab === 'pos_hardware' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">POS, Terminals & Kitchen Display Systems (KDS)</h3>
            <p className="text-xs text-slate-500">Monitor ping latency, thermal printers, cash drawers, and handheld order guns</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {[
                { device: 'Toast Flex Terminal 1 (Host Stand)', ip: '192.168.1.101', latency: '4ms', status: 'Online' },
                { device: 'Epson Kitchen Display System (KDS 1 - Hot Line)', ip: '192.168.1.105', latency: '2ms', status: 'Online' },
                { device: 'Epson TM-T88VI Thermal Receipt Printer', ip: '192.168.1.120', latency: '6ms', status: 'Online' }
              ].map((d, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{d.device}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">{d.status}</span>
                  </div>
                  <p className="text-slate-500 mt-1 font-mono">IP: {d.ip} • Latency: {d.latency}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 18. REFRIGERATION & HVAC */}
        {activeSubTab === 'refrigeration_hvac' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Refrigeration & Rooftop HVAC Units (RTU)</h3>
            <p className="text-xs text-slate-500">Compressors, evaporator fans, R448A refrigerant levels, and rooftop air economizers</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                <span className="font-bold text-slate-900 text-sm">Carrier 15-Ton Rooftop RTU-1 (Dining Room)</span>
                <p className="text-slate-500 mt-1">Air Filter Change: Done 2026-07-01. Economizer dampers running at 20% fresh air intake.</p>
                <div className="mt-3 text-emerald-700 font-semibold">Status: Optimal Airflow (72°F Ambient)</div>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
                <span className="font-bold text-slate-900 text-sm">Scotsman 500lb Nugget Ice Maker & Bin</span>
                <p className="text-slate-500 mt-1">Water Filter Swapped: 2026-06-15. Descale & Sanitizing cycle scheduled monthly.</p>
                <div className="mt-3 text-emerald-700 font-semibold">Status: Producing 22 lbs/hr</div>
              </div>
            </div>
          </div>
        )}

        {/* 19. SANITATION & DISHWASHERS */}
        {activeSubTab === 'sanitation_dishwashers' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Commercial Dishwashing & Sanitation Systems</h3>
            <p className="text-xs text-slate-500">High-temp conveyor wash cycles, chemical dispensers, and rinse booster heaters</p>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 text-sm">Hobart CL44e Conveyor Machine Calibration</strong>
                <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">Service In Progress</span>
              </div>
              <p className="text-slate-600">
                Wash Tank: 160°F (Pass) • Final Sanitizing Rinse Booster: 178°F (Service ticket #wo-801 open for tomorrow morning tech arrival).
              </p>
            </div>
          </div>
        )}

        {/* 20. DISPOSAL & SALVAGE */}
        {activeSubTab === 'disposal_salvage' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Disposal, Salvage & E-Waste Recovery</h3>
            <p className="text-xs text-slate-500">EPA refrigerant recovery logs, scrap stainless steel salvage values, and asset retirement</p>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
              <span className="font-bold text-slate-900">Decommissioned Assets Log</span>
              <p className="text-slate-500 mt-1">No pending retired assets for current fiscal quarter. All EPA recovery certificates in compliance.</p>
            </div>
          </div>
        )}

        {/* 21. MANUALS & TRAINING */}
        {activeSubTab === 'manuals_training' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Digital Manuals, Wiring Schematics & SOP Guides</h3>
            <p className="text-xs text-slate-500">1-click access to manufacturer PDF manuals, cleaning checklists, and training videos</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {[
                { title: 'Rational iCombi Pro Cleaning & Care SOP', format: 'PDF Guide • 24 Pages' },
                { title: 'Hobart CL44e Conveyor Wiring Diagram', format: 'Schematic • PDF' },
                { title: 'True T-49 Gasket Replacement Video', format: 'Video SOP • 4 Mins' },
                { title: 'La Marzocco Linea PB Descale Manual', format: 'PDF Manual • 36 Pages' },
                { title: 'Pitco Fryer Boil-Out Safety Steps', format: 'Laminated SOP' },
                { title: 'CaptiveAire Hood Baffle Filter Guide', format: 'PDF • 8 Pages' }
              ].map((doc, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-sky-50 transition-colors text-xs flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <h5 className="font-bold text-slate-900">{doc.title}</h5>
                      <p className="text-slate-500">{doc.format}</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 22. COST ANALYTICS & CAPEX PLANNING */}
        {activeSubTab === 'cost_analytics_capex' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 animate-in fade-in space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">CapEx Planning & Repair vs. Replace ROI Matrix</h3>
              <p className="text-xs text-slate-500">Calculate machine lifetime cost of ownership, ongoing repair spend vs new asset purchase ROI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-xs text-slate-500">Annual Maintenance Spend (YTD)</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">$4,850</div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">12% Under Annual CapEx Budget</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-xs text-slate-500">Next Year CapEx Replacement Reserve</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">$14,500</div>
                <p className="text-xs text-slate-500 mt-1">Allocated for Hobart Booster upgrade</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-xs text-slate-500">Preventive Maintenance ROI Savings</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">+$18,200</div>
                <p className="text-xs text-slate-500 mt-1">Estimated avoided line downtime costs</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD EQUIPMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Add Equipment Asset</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEquipment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={newEquipName}
                  onChange={e => setNewEquipName(e.target.value)}
                  placeholder="e.g. Vulcan 6-Burner Gas Range with Standard Oven"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Number</label>
                  <input
                    type="text"
                    value={newEquipModel}
                    onChange={e => setNewEquipModel(e.target.value)}
                    placeholder="VUL-36-6B"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newEquipSerial}
                    onChange={e => setNewEquipSerial(e.target.value)}
                    placeholder="SN-8839210"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newEquipCategory}
                    onChange={e => setNewEquipCategory(e.target.value as EquipmentCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="cooking">Cooking / Hot Line</option>
                    <option value="refrigeration">Refrigeration / Cold</option>
                    <option value="dishwashing">Dishwashing & Sanitation</option>
                    <option value="beverage_bar">Bar & Beverage</option>
                    <option value="pos_it">POS & IT Hardware</option>
                    <option value="hvac_facility">HVAC & Facilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Station / Location</label>
                  <input
                    type="text"
                    value={newEquipStation}
                    onChange={e => setNewEquipStation(e.target.value)}
                    placeholder="Main Hot Line - Station 2"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost ($)</label>
                  <input
                    type="number"
                    value={newEquipCost}
                    onChange={e => setNewEquipCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Tech Contact</label>
                  <input
                    type="text"
                    value={newEquipVendor}
                    onChange={e => setNewEquipVendor(e.target.value)}
                    placeholder="Vulcan Factory Care"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-md"
                >
                  Save Equipment Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {showNewWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">Create Service Ticket / Work Order</h3>
              </div>
              <button onClick={() => setShowNewWorkOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Equipment *</label>
                <select
                  value={newWoEquipId}
                  onChange={e => setNewWoEquipId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.station})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue / Service Title *</label>
                <input
                  type="text"
                  required
                  value={newWoTitle}
                  onChange={e => setNewWoTitle(e.target.value)}
                  placeholder="e.g. Temperature sensor calibration & door seal replacement"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description & Symptoms</label>
                <textarea
                  rows={3}
                  value={newWoDesc}
                  onChange={e => setNewWoDesc(e.target.value)}
                  placeholder="Provide symptoms, error codes, temperature readings, or immediate operational impact..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={newWoPriority}
                    onChange={e => setNewWoPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="low">Low (Routine)</option>
                    <option value="medium">Medium (Standard 48hr)</option>
                    <option value="high">High (Priority 24hr)</option>
                    <option value="critical_emergency">Critical Emergency (Immediate Line Down)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost ($)</label>
                  <input
                    type="number"
                    value={newWoEstCost}
                    onChange={e => setNewWoEstCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewWorkOrderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-md"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EQUIPMENT DETAILS MODAL */}
      {selectedEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">{selectedEquipment.name}</h3>
              </div>
              <button onClick={() => setSelectedEquipment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Category / Station:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedEquipment.category} • {selectedEquipment.station}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Model & Serial:</span>
                <span className="font-mono text-slate-800">{selectedEquipment.modelNumber} | {selectedEquipment.serialNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Power / Rating:</span>
                <span className="font-semibold text-slate-800">{selectedEquipment.powerRating || 'Standard Commercial'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Warranty Expiration:</span>
                <span className="font-bold text-emerald-700">{selectedEquipment.warrantyExpiry}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Service Contractor:</span>
                <span className="font-semibold text-sky-700">{selectedEquipment.vendorName} ({selectedEquipment.vendorPhone})</span>
              </div>
              {selectedEquipment.notes && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                  <span className="font-bold text-slate-700 block mb-1">Service Notes:</span>
                  <p className="text-slate-600">{selectedEquipment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
              <button
                onClick={() => {
                  setSelectedEquipment(null);
                  setActiveSubTab('manuals_training');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 rounded-lg"
              >
                View PDF Manuals
              </button>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
