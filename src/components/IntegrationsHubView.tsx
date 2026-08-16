import React, { useState } from 'react';
import {
  Building2,
  Layers,
  Flame,
  Square,
  CircleDot,
  Zap,
  Server,
  Tablet,
  Sparkles,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
  Download,
  Upload,
  ShieldCheck,
  FileSpreadsheet,
  Sliders,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Check
} from 'lucide-react';
import {
  WorkforcePlatformInfo,
  WorkforceSyncLog,
  POSPlatformInfo,
  POSServerSalesMetric,
  POSTimeclockPunch,
  Employee,
  POSPlatformId,
  POSDepartmentMapping,
  Shift
} from '../types';
import { INITIAL_POS_DEPARTMENT_MAPPINGS } from '../data/posMappingData';
import { POSDepartmentMappingModal } from './POSDepartmentMappingModal';

interface IntegrationsHubViewProps {
  workforcePlatforms: WorkforcePlatformInfo[];
  setWorkforcePlatforms: React.Dispatch<React.SetStateAction<WorkforcePlatformInfo[]>>;
  posPlatforms: POSPlatformInfo[];
  setPOSPlatforms: React.Dispatch<React.SetStateAction<POSPlatformInfo[]>>;
  syncLogs: WorkforceSyncLog[];
  setSyncLogs: React.Dispatch<React.SetStateAction<WorkforceSyncLog[]>>;
  serverSalesMetrics: POSServerSalesMetric[];
  timeclockPunches: POSTimeclockPunch[];
  employees: Employee[];
  shifts?: Shift[];
  posMappings?: Record<POSPlatformId, POSDepartmentMapping>;
  setPOSMappings?: React.Dispatch<React.SetStateAction<Record<POSPlatformId, POSDepartmentMapping>>>;
}

export const IntegrationsHubView: React.FC<IntegrationsHubViewProps> = ({
  workforcePlatforms,
  setWorkforcePlatforms,
  posPlatforms,
  setPOSPlatforms,
  syncLogs,
  setSyncLogs,
  serverSalesMetrics,
  timeclockPunches,
  employees,
  shifts = [],
  posMappings,
  setPOSMappings
}) => {
  const [activeTab, setActiveTab] = useState<'workforce' | 'pos' | 'logs'>('workforce');
  const [selectedWorkforceId, setSelectedWorkforceId] = useState<string>('adp_workforce_now');
  const [selectedPOSId, setSelectedPOSId] = useState<string>('toast');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  // POS Department Mapping Modal state
  const [mappingModalOpen, setMappingModalOpen] = useState<boolean>(false);
  const [mappingTargetPOSId, setMappingTargetPOSId] = useState<POSPlatformId>('toast');
  const [localPOSMappings, setLocalPOSMappings] = useState<Record<POSPlatformId, POSDepartmentMapping>>(
    posMappings || INITIAL_POS_DEPARTMENT_MAPPINGS
  );

  React.useEffect(() => {
    if (posMappings) {
      setLocalPOSMappings(posMappings);
    }
  }, [posMappings]);

  const handleSaveMapping = (updated: POSDepartmentMapping) => {
    setLocalPOSMappings(prev => ({
      ...prev,
      [updated.posPlatformId]: updated
    }));
    if (setPOSMappings) {
      setPOSMappings(prev => ({
        ...prev,
        [updated.posPlatformId]: updated
      }));
    }
    setSyncSuccessToast(`Updated department mappings & labor targets for ${updated.posPlatformName}!`);
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  const selectedWorkforce = workforcePlatforms.find(p => p.id === selectedWorkforceId) || workforcePlatforms[0];
  const selectedPOS = posPlatforms.find(p => p.id === selectedPOSId) || posPlatforms[0];

  const handleToggleWorkforceConnection = (platformId: string) => {
    setWorkforcePlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        const nextStatus = p.status === 'connected' ? 'disconnected' : 'connected';
        return {
          ...p,
          status: nextStatus,
          lastSyncTimestamp: nextStatus === 'connected' ? new Date().toISOString() : p.lastSyncTimestamp,
          syncedEmployeeCount: nextStatus === 'connected' ? employees.length : 0
        };
      }
      return p;
    }));
  };

  const handleTogglePOSConnection = (platformId: string) => {
    setPOSPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        const nextStatus = p.status === 'connected' || p.status === 'live_streaming' ? 'disconnected' : 'live_streaming';
        return {
          ...p,
          status: nextStatus,
          lastHeartbeat: nextStatus === 'disconnected' ? 'Offline' : 'Just now'
        };
      }
      return p;
    }));
  };

  const handleTriggerWorkforceSync = (platform: WorkforcePlatformInfo) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const newLog: WorkforceSyncLog = {
        id: `sync-${Date.now()}`,
        platformId: platform.id,
        platformName: platform.name,
        action: 'payroll_export',
        status: 'success',
        recordsProcessed: employees.length,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        summary: `Bi-directional sync completed with ${platform.name}: ${employees.length} employee profiles matched, wage rates synchronized.`,
        details: `Updated tax withholdings & verified active direct deposit profiles. 0 errors detected.`,
      };
      setSyncLogs(prev => [newLog, ...prev]);
      setSyncSuccessToast(`Successfully synchronized with ${platform.name}!`);
      setTimeout(() => setSyncSuccessToast(null), 4000);

      setWorkforcePlatforms(prev => prev.map(p => p.id === platform.id ? {
        ...p,
        lastSyncTimestamp: new Date().toISOString(),
        syncedEmployeeCount: employees.length
      } : p));
    }, 1200);
  };

  const handleExportPayrollBatch = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "ADP_Employee_ID,Name,Department,Role,Regular_Hours,Overtime_Hours,Base_Hourly_Wage,Estimated_Gross,Alcohol_Card_Verified,Food_Handler_Verified\n" +
      employees.map(emp => {
        const regHours = 35.0;
        const otHours = emp.name.includes('Elena') ? 2.5 : 0.0;
        const gross = (regHours * emp.hourlyWage) + (otHours * emp.hourlyWage * 1.5);
        return `${emp.adpEmployeeId || 'ADP_N/A'},"${emp.name}","${emp.department}","${emp.role}",${regHours},${otHours},$${emp.hourlyWage.toFixed(2)},$${gross.toFixed(2)},${emp.alcoholHandlerCard?.verified ? 'YES' : 'N/A'},${emp.foodHandlerCard?.verified ? 'YES' : 'PENDING'}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShiftForce_Payroll_Batch_Export_${selectedWorkforce.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportModalOpen(false);
  };

  const getWorkforceIcon = (name: string) => {
    switch (name) {
      case 'Building2': return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'Briefcase': return <Building2 className="w-5 h-5 text-sky-600" />;
      case 'Users': return <Users className="w-5 h-5 text-emerald-600" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'CreditCard': return <DollarSign className="w-5 h-5 text-amber-600" />;
      case 'Zap': return <Zap className="w-5 h-5 text-orange-600" />;
      case 'Clock': return <Clock className="w-5 h-5 text-teal-600" />;
      default: return <Layers className="w-5 h-5 text-sky-600" />;
    }
  };

  const getPOSIcon = (id: string) => {
    switch (id) {
      case 'toast': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'square': return <Square className="w-5 h-5 text-slate-800" />;
      case 'clover': return <CircleDot className="w-5 h-5 text-emerald-600" />;
      case 'lightspeed': return <Zap className="w-5 h-5 text-red-500" />;
      case 'ncr_aloha': return <Server className="w-5 h-5 text-blue-600" />;
      case 'revel': return <Tablet className="w-5 h-5 text-cyan-600" />;
      case 'spoton': return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'micros_simphony': return <Database className="w-5 h-5 text-rose-600" />;
      default: return <Layers className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast banner */}
      {syncSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-100 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{syncSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 rounded-lg border border-sky-400/30">
              Universal Integrations Hub
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync Engine Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            WorkForce, ADP & Universal POS Systems
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Seamlessly synchronize staff rosters, timesheet payroll exports, and real-time POS sales data across ADP, Toast, Square, Clover, Aloha, Gusto, 7shifts, and enterprise ERPs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-sky-600/30 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Payroll Batch
          </button>
          <button
            onClick={() => handleTriggerWorkforceSync(selectedWorkforce)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All Live Data'}
          </button>
        </div>
      </div>

      {/* Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('workforce')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'workforce'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          WorkForce & Payroll Platforms ({workforcePlatforms.filter(p => p.status === 'connected').length} Active)
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          Universal POS Systems ({posPlatforms.filter(p => p.status === 'live_streaming' || p.status === 'connected').length} Connected)
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Audit & Sync Logs ({syncLogs.length})
        </button>
      </div>

      {/* TAB 1: WORKFORCE & PAYROLL PLATFORMS */}
      {activeTab === 'workforce' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                WorkForce Platforms
              </h3>
              <span className="text-xs text-slate-500">
                {workforcePlatforms.length} Supported
              </span>
            </div>

            <div className="space-y-2.5">
              {workforcePlatforms.map(platform => {
                const isSelected = platform.id === selectedWorkforceId;
                const isConnected = platform.status === 'connected';
                return (
                  <div
                    key={platform.id}
                    onClick={() => setSelectedWorkforceId(platform.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                          {getWorkforceIcon(platform.iconName)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {platform.name}
                          </h4>
                          <p className="text-xs text-slate-500">{platform.category}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{platform.popularFor.split('(')[0]}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform Detail & Config */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-xs">
                    {getWorkforceIcon(selectedWorkforce.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedWorkforce.name}</h2>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        selectedWorkforce.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedWorkforce.status === 'connected' ? '● Connected' : '○ Standby'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedWorkforce.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleWorkforceConnection(selectedWorkforce.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedWorkforce.status === 'connected'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                    }`}
                  >
                    {selectedWorkforce.status === 'connected' ? 'Disconnect' : 'Connect & Authorize'}
                  </button>
                  {selectedWorkforce.status === 'connected' && (
                    <button
                      onClick={() => handleTriggerWorkforceSync(selectedWorkforce)}
                      disabled={isSyncing}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Sync Now
                    </button>
                  )}
                </div>
              </div>

              {/* Status & Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Synced Employees</span>
                  <p className="text-lg font-bold text-slate-900 mt-1">{selectedWorkforce.syncedEmployeeCount || 0} Staff</p>
                  <span className="text-xs text-emerald-600 flex items-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> 100% matched
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Last Successful Sync</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                    {selectedWorkforce.lastSyncTimestamp ? '18 mins ago' : 'Never'}
                  </p>
                  <span className="text-xs text-slate-400">Automated Hourly</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500">API Protocol</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">{selectedWorkforce.apiVersion || 'REST v2'}</p>
                  <span className="text-xs text-sky-600">OAuth 2.0 TLS 1.3</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500">Company Code / Org</span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">{selectedWorkforce.companyCodeOrTenant || 'REST-99410'}</p>
                  <span className="text-xs text-slate-400">Production Tenant</span>
                </div>
              </div>

              {/* Capabilities & Feature Switches */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Supported Payroll & Workforce Capabilities
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-sky-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">2-Way Employee Roster Sync</p>
                        <p className="text-[11px] text-slate-500">New hires & wage rate updates pull automatically</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Automated Timesheet Export</p>
                        <p className="text-[11px] text-slate-500">Direct batch push to weekly payroll cycle</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Overtime & Penalty Calculation</p>
                        <p className="text-[11px] text-slate-500">1.5x / 2.0x overtime & California break penalties</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Alcohol & Food Card Compliance Lock</p>
                        <p className="text-[11px] text-slate-500">Flags unverified RBS or Food Handler cards before pay</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Matched Employee Preview */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Live Synchronized Employee Roster ({employees.length})
                  </h4>
                  <button
                    onClick={() => setExportModalOpen(true)}
                    className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Batch JSON / CSV <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-3 font-semibold">Staff Member</th>
                        <th className="p-3 font-semibold">ADP / WorkForce ID</th>
                        <th className="p-3 font-semibold">Role & Dept</th>
                        <th className="p-3 font-semibold">Hourly Rate</th>
                        <th className="p-3 font-semibold">Alcohol / Food Cert</th>
                        <th className="p-3 font-semibold text-right">Sync Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees.slice(0, 6).map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-900 flex items-center gap-2">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.name} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                            {emp.name}
                          </td>
                          <td className="p-3 font-mono text-slate-600">{emp.adpEmployeeId || `ADP_${emp.id.replace('emp-', '010')}`}</td>
                          <td className="p-3 text-slate-600">{emp.role} ({emp.department})</td>
                          <td className="p-3 font-bold text-slate-900">${emp.hourlyWage.toFixed(2)}/hr</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-2.5 h-2.5" /> Verified
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Synced
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSAL POS SYSTEMS */}
      {activeTab === 'pos' && (
        <div className="space-y-6">
          {/* POS Platform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {posPlatforms.map(pos => {
              const isSelected = pos.id === selectedPOSId;
              const isLive = pos.status === 'live_streaming' || pos.status === 'connected';
              const mapping = localPOSMappings[pos.id as POSPlatformId] || INITIAL_POS_DEPARTMENT_MAPPINGS[pos.id as POSPlatformId];
              const rcCount = mapping?.revenueCenterMappings?.length || 0;
              const jcCount = mapping?.jobCodeMappings?.length || 0;

              return (
                <div
                  key={pos.id}
                  onClick={() => setSelectedPOSId(pos.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/20 shadow-sm ring-1 ring-orange-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-xs">
                        {getPOSIcon(pos.id)}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {isLive ? '● Live Ingest' : 'Standby'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rcCount} Zones • {jcCount} Roles
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-base font-bold text-slate-900">{pos.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{pos.tier} • {pos.marketShare}</p>
                    </div>

                    {isLive && pos.metricsToday.netSales > 0 ? (
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400">Today's Sales</span>
                          <p className="font-bold text-slate-900">${pos.metricsToday.netSales.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Live Labor %</span>
                          <p className="font-bold text-emerald-600">{pos.metricsToday.laborPercent}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                        Click to activate real-time sales bridge
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPOSId(pos.id);
                      setMappingTargetPOSId(pos.id as POSPlatformId);
                      setMappingModalOpen(true);
                    }}
                    className="mt-3 w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sliders className="w-3 h-3 text-orange-600" />
                    <span>Map Departments & Targets</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected POS Detailed Dashboard */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shadow-xs">
                  {getPOSIcon(selectedPOS.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedPOS.name} Integration Engine</h2>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                      Location: {selectedPOS.restaurantLocationId || 'SF_DOWNTOWN_01'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedPOS.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMappingTargetPOSId(selectedPOS.id as POSPlatformId);
                    setMappingModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:text-orange-700 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-orange-600" />
                  <span>Configure Department Structure</span>
                </button>

                <button
                  onClick={() => handleTogglePOSConnection(selectedPOS.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedPOS.status === 'live_streaming' || selectedPOS.status === 'connected'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-orange-600 text-white hover:bg-orange-500 shadow-xs'
                  }`}
                >
                  {selectedPOS.status === 'live_streaming' ? 'Pause Stream' : 'Connect Terminal'}
                </button>
              </div>
            </div>

            {/* Live Financial & Labor Gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                  <span>Live Net Sales (POS)</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-emerald-950 mt-2">
                  ${selectedPOS.metricsToday.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-emerald-700 mt-1 block">
                  {selectedPOS.metricsToday.closedChecksCount} checks closed • Avg ${selectedPOS.metricsToday.avgTicketSize}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
                <div className="flex items-center justify-between text-sky-700 text-xs font-semibold">
                  <span>Current Labor Cost</span>
                  <DollarSign className="w-4 h-4 text-sky-600" />
                </div>
                <p className="text-2xl font-black text-sky-950 mt-2">
                  ${selectedPOS.metricsToday.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="text-xs text-sky-700 mt-1 block">
                  {selectedPOS.metricsToday.activeClockedInStaff} active staff clocked in
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
                  <span>Live Labor % vs Target</span>
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-2xl font-black text-indigo-950">
                    {selectedPOS.metricsToday.laborPercent}%
                  </p>
                  <span className="text-xs text-slate-500 font-medium">
                    (Target: {selectedPOS.metricsToday.targetLaborPercent}%)
                  </span>
                </div>
                <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                  ✓ +3.71% profitable margin headroom
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
                  <span>Open Dining Room Checks</span>
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {selectedPOS.metricsToday.openGuestChecks} Tables
                </p>
                <span className="text-xs text-slate-500 mt-1 block">
                  Live table turnover velocity: 48 mins
                </span>
              </div>
            </div>

            {/* Department Structure & Labor Allocation Mapping Matrix */}
            {(() => {
              const currentMapping = localPOSMappings[selectedPOS.id as POSPlatformId] || INITIAL_POS_DEPARTMENT_MAPPINGS[selectedPOS.id as POSPlatformId];
              if (!currentMapping) return null;

              return (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-400/30">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {selectedPOS.name} → Department Labor & Sales Mapping
                          </h4>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                            Active Mapping Engine
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Maps POS revenue centers, job codes, and sales categories to shift departments for live labor-to-sales efficiency.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMappingTargetPOSId(selectedPOS.id as POSPlatformId);
                        setMappingModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Open Mapping Studio</span>
                    </button>
                  </div>

                  {/* Mapping Summary Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Revenue Centers */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                        <span>Revenue Center Routing ({currentMapping.revenueCenterMappings.length})</span>
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentMapping.revenueCenterMappings.map(rc => (
                          <div key={rc.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 text-[11px]">
                            <span className="font-medium text-slate-200">{rc.revenueCenterName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                              {rc.primaryDepartment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Job Codes */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                        <span>Job Codes & Roles ({currentMapping.jobCodeMappings.length})</span>
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentMapping.jobCodeMappings.map(jc => (
                          <div key={jc.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 text-[11px]">
                            <div>
                              <span className="font-medium text-slate-200">{jc.posRoleTitle}</span>
                              <span className="text-[10px] font-mono text-slate-400 ml-1">(${jc.defaultHourlyRate}/h)</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                              {jc.targetDepartment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department Labor Targets */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px] uppercase tracking-wider">
                        <span>Target Labor % by Dept</span>
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {currentMapping.departmentConfigs.map(cfg => (
                          <div key={cfg.department} className="flex items-center justify-between p-1.5 rounded-lg bg-black/20 text-[11px]">
                            <span className="font-medium text-slate-200 truncate">{cfg.department}</span>
                            <span className="font-mono font-bold text-emerald-400">
                              {cfg.targetLaborPercent}% (Max {cfg.maxWarningThreshold}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Server Sales & Tips Performance Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  POS Server & Bartender Sales Leaderboard (Live Floor Data)
                </h4>
                <span className="text-xs text-slate-500">
                  Synced directly from Toast / Square order tickets
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 font-semibold">Staff Member</th>
                      <th className="p-3 font-semibold">Role</th>
                      <th className="p-3 font-semibold">Net Sales</th>
                      <th className="p-3 font-semibold">Tips Earned</th>
                      <th className="p-3 font-semibold">Tip Avg %</th>
                      <th className="p-3 font-semibold">Tables / Guests</th>
                      <th className="p-3 font-semibold text-right">Sales / Hour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serverSalesMetrics.map(srv => (
                      <tr key={srv.employeeId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {srv.employeeName}
                          <span className="font-mono text-[10px] text-slate-400">({srv.posServerCode})</span>
                        </td>
                        <td className="p-3 text-slate-600">{srv.role}</td>
                        <td className="p-3 font-bold text-slate-900">${srv.netSales.toFixed(2)}</td>
                        <td className="p-3 font-semibold text-emerald-600">${srv.tipsEarned.toFixed(2)}</td>
                        <td className="p-3 font-bold text-slate-800">{srv.tipPercent}%</td>
                        <td className="p-3 text-slate-600">{srv.tablesServed} tables ({srv.guestCount} guests)</td>
                        <td className="p-3 text-right font-mono font-bold text-sky-700">${srv.salesPerHour.toFixed(2)}/hr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timeclock Punches vs Scheduled Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  POS Timeclock Live Punch Stream vs Scheduled Shift
                </h4>
                <span className="text-xs text-slate-500">
                  Instant variance reconciliation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {timeclockPunches.map(punch => (
                  <div key={punch.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{punch.employeeName}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        punch.status === 'matched'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {punch.status === 'matched' ? '✓ Matched' : '⚠ Flagged'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Scheduled:</span>
                        <span className="font-mono font-semibold">{punch.scheduledTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>POS Punch:</span>
                        <span className="font-mono font-bold text-slate-900">{punch.actualPunchTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Variance:</span>
                        <span className={`font-semibold ${punch.varianceMinutes > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {punch.varianceMinutes > 0 ? `+${punch.varianceMinutes} min (Late)` : `${Math.abs(punch.varianceMinutes)} min early`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & SYNC LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">WorkForce & POS System Audit Trail</h3>
              <p className="text-xs text-slate-500">Chronological history of batch syncs, employee updates, and wage rate audits.</p>
            </div>
            <button
              onClick={() => handleTriggerWorkforceSync(selectedWorkforce)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
            </button>
          </div>

          <div className="space-y-3">
            {syncLogs.map(log => (
              <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.platformName}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-mono uppercase">
                        {log.action.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{log.summary}</p>
                    {log.details && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-slate-400">{log.timestamp}</span>
                  <p className="text-[11px] text-emerald-600 font-semibold">{log.recordsProcessed} Records Verified</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Batch Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Export Payroll Batch</h3>
                  <p className="text-xs text-slate-500">Compatible with ADP, UKG, Workday & Gusto</p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Target Platform:</span>
                  <span className="font-bold text-sky-600">{selectedWorkforce.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Pay Period:</span>
                  <span>Current 7-Day Week (Sun - Sat)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Total Staff Exported:</span>
                  <span className="font-bold text-slate-900">{employees.length} Active Staff</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700">Estimated Gross Wages:</span>
                  <span className="font-bold text-emerald-600">$9,842.50</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Includes verified Alcohol Handler (RBS/TIPS) and ServSafe Food certification audit status for every payroll record.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExportPayrollBatch}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Department Mapping Configuration Modal */}
      <POSDepartmentMappingModal
        isOpen={mappingModalOpen}
        onClose={() => setMappingModalOpen(false)}
        posMappings={localPOSMappings}
        initialMapping={localPOSMappings[mappingTargetPOSId] || INITIAL_POS_DEPARTMENT_MAPPINGS[mappingTargetPOSId] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast']}
        onSaveMapping={handleSaveMapping}
        activePOSId={mappingTargetPOSId}
        onSelectActivePOS={(posId) => setMappingTargetPOSId(posId)}
        shifts={shifts}
        employees={employees}
      />
    </div>
  );
};
