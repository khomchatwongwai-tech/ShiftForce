import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Plus,
  Check,
  X,
  Edit3,
  Trash2,
  Building2,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Megaphone,
  Zap,
  Sparkles,
  BarChart3,
  Star,
  GraduationCap,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  ChevronRight,
  Sliders,
  RefreshCw,
  FileCheck,
  Globe,
  MapPin,
  Filter
} from 'lucide-react';
import {
  CustomRole,
  RBACManagerState,
  RBACPermission,
  HierarchyLevel,
  HierarchyNode,
  ActiveTab,
  Employee
} from '../types';
import { INITIAL_ENTERPRISE_HIERARCHY } from '../data/commandCenterData';

interface RoleBasedAccessControlManagerProps {
  isOpen: boolean;
  onClose: () => void;
  rbacState: RBACManagerState;
  onSelectActiveRole: (roleId: string) => void;
  onSaveRole: (role: CustomRole) => void;
  onDeleteRole: (roleId: string) => void;
  hierarchyNodes?: HierarchyNode[];
  employees?: Employee[];
}

const AVAILABLE_TABS: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: 'command_center', label: 'AI Command Center', icon: Zap, description: '1-Tap Shift Rescue, No-Show Predictions & Swarm' },
  { id: 'intelligence_agent', label: 'Intelligence Agent', icon: Sparkles, description: 'Autonomous Proactive Insights & Labor Optimizations' },
  { id: 'enterprise', label: 'Enterprise Hub', icon: Building2, description: 'Multi-Location Hierarchy, Digital SOPs & Corporate Audits' },
  { id: 'schedule', label: 'Schedule Roster', icon: Calendar, description: 'Shift Planning, Auto-Fill & Fairness Balancing' },
  { id: 'employees', label: 'Employees Directory', icon: Users, description: 'Staff Profiles, Availabilities, Wages & Handler Cards' },
  { id: 'payroll', label: 'ShiftForce Payroll', icon: DollarSign, description: 'Tip Pooling, Overtime Tracking & Gross Pay Run' },
  { id: 'learn', label: 'ShiftForce Learn (LMS)', icon: GraduationCap, description: 'ServSafe, RBS Alcohol, OSHA & Upskilling Academy' },
  { id: 'performance', label: 'Score & Reviews', icon: Star, description: 'Google/Yelp Reviews, Letter Grade & Recognition' },
  { id: 'integrations', label: 'WorkForce & POS Hub', icon: Layers, description: 'Toast, Square, Clover, ADP & 7shifts Live Sync' },
  { id: 'analytics', label: 'Workforce Analytics', icon: BarChart3, description: 'Labor Cost %, SPLH & Demand Forecasting' },
  { id: 'requests', label: 'Requests & Shift Swaps', icon: FileText, description: 'Time-Off, Availability Changes & Slot Claims' },
  { id: 'tardiness', label: 'Late & Tardiness Logs', icon: Clock, description: 'Clock-In Variances, Excuses & Attendance Records' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, description: 'Multi-Channel SMS/App Broadcasts' },
  { id: 'hr_payroll', label: 'HR, Hiring & Onboarding', icon: UserPlus, description: 'I-9 Verification, Interview Pipeline & Staffing' },
];

const HIERARCHY_LEVEL_LABELS: Record<HierarchyLevel, { label: string; badgeClass: string; desc: string }> = {
  organization: { label: 'Organization (Global)', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'All 847 corporate locations enterprise-wide' },
  brand: { label: 'Brand Concept', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Brand-specific group (e.g. Steakhouse vs Bistro)' },
  country: { label: 'Country Tier', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'National geographic division' },
  region: { label: 'Regional Territory', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Regional cluster (e.g. Pacific West Coast 142 units)' },
  district: { label: 'District Cluster', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200', desc: 'District sub-group (e.g. SF Bay Area 22 units)' },
  location: { label: 'Single Store Unit', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Specific restaurant branch (e.g. Flagship #101)' },
  department: { label: 'Department Sub-tier', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'FOH, BOH, Bar, or Kitchen specific' },
  team: { label: 'Shift Station Crew', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'Station-level crew' },
};

const COLOR_PRESETS = [
  { name: 'Indigo Corporate', class: 'bg-indigo-600 text-white border-indigo-700' },
  { name: 'Emerald Auditor', class: 'bg-emerald-700 text-white border-emerald-800' },
  { name: 'Sky Operations', class: 'bg-sky-600 text-white border-sky-700' },
  { name: 'Amber Supervisory', class: 'bg-amber-600 text-white border-amber-700' },
  { name: 'Purple People Ops', class: 'bg-purple-600 text-white border-purple-700' },
  { name: 'Rose Security Lead', class: 'bg-rose-600 text-white border-rose-700' },
  { name: 'Slate Executive', class: 'bg-slate-800 text-white border-slate-900' },
];

export const RoleBasedAccessControlManager: React.FC<RoleBasedAccessControlManagerProps> = ({
  isOpen,
  onClose,
  rbacState,
  onSelectActiveRole,
  onSaveRole,
  onDeleteRole,
  hierarchyNodes = INITIAL_ENTERPRISE_HIERARCHY,
  employees = [],
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'matrix' | 'hierarchy_scope' | 'audit'>('roles');
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State for Custom Role Builder
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHierarchyLevel, setFormHierarchyLevel] = useState<HierarchyLevel>('region');
  const [formAssignedNodeId, setFormAssignedNodeId] = useState('node-region-01');
  const [formBadgeColor, setFormBadgeColor] = useState(COLOR_PRESETS[1].class);
  const [formAllowedTabs, setFormAllowedTabs] = useState<ActiveTab[]>([
    'schedule',
    'employees',
    'performance',
    'analytics',
    'announcements'
  ]);
  const [formCanViewWages, setFormCanViewWages] = useState(true);
  const [formCanEditSchedules, setFormCanEditSchedules] = useState(false);
  const [formCanApproveTimeOff, setFormCanApproveTimeOff] = useState(false);
  const [formCanManageEmployees, setFormCanManageEmployees] = useState(false);
  const [formCanExecuteAIActions, setFormCanExecuteAIActions] = useState(true);
  const [formCanExportPayroll, setFormCanExportPayroll] = useState(false);
  const [formCanManageRBAC, setFormCanManageRBAC] = useState(false);
  const [formCanViewAllLocations, setFormCanViewAllLocations] = useState(false);

  // Live Inspector Test Node
  const [testNodeId, setTestNodeId] = useState('node-loc-01');

  if (!isOpen) return null;

  const currentActiveRole = rbacState.roles.find(r => r.id === rbacState.activeRoleId) || rbacState.roles[0];

  const handleOpenCreateModal = (templateRole?: CustomRole) => {
    if (templateRole) {
      setFormName(`${templateRole.name} (Custom Copy)`);
      setFormCode(`${templateRole.code}_COPY`);
      setFormDescription(templateRole.description);
      setFormHierarchyLevel(templateRole.hierarchyScopeLevel);
      setFormAssignedNodeId(templateRole.assignedNodeId);
      setFormBadgeColor(templateRole.badgeColor);
      setFormAllowedTabs([...templateRole.permissions.allowedTabs]);
      setFormCanViewWages(templateRole.permissions.canViewWagesAndBudgets);
      setFormCanEditSchedules(templateRole.permissions.canEditSchedules);
      setFormCanApproveTimeOff(templateRole.permissions.canApproveTimeOff);
      setFormCanManageEmployees(templateRole.permissions.canManageEmployees);
      setFormCanExecuteAIActions(templateRole.permissions.canExecuteAIActions);
      setFormCanExportPayroll(templateRole.permissions.canExportPayroll);
      setFormCanManageRBAC(templateRole.permissions.canManageRBAC);
      setFormCanViewAllLocations(templateRole.permissions.canViewAllLocations);
      setEditingRole(null);
    } else {
      setFormName('');
      setFormCode('');
      setFormDescription('');
      setFormHierarchyLevel('region');
      setFormAssignedNodeId('node-region-01');
      setFormBadgeColor(COLOR_PRESETS[1].class);
      setFormAllowedTabs(['schedule', 'employees', 'performance', 'announcements']);
      setFormCanViewWages(true);
      setFormCanEditSchedules(false);
      setFormCanApproveTimeOff(false);
      setFormCanManageEmployees(false);
      setFormCanExecuteAIActions(true);
      setFormCanExportPayroll(false);
      setFormCanManageRBAC(false);
      setFormCanViewAllLocations(false);
      setEditingRole(null);
    }
    setIsCreatingNew(true);
  };

  const handleOpenEditModal = (role: CustomRole) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormCode(role.code);
    setFormDescription(role.description);
    setFormHierarchyLevel(role.hierarchyScopeLevel);
    setFormAssignedNodeId(role.assignedNodeId);
    setFormBadgeColor(role.badgeColor);
    setFormAllowedTabs([...role.permissions.allowedTabs]);
    setFormCanViewWages(role.permissions.canViewWagesAndBudgets);
    setFormCanEditSchedules(role.permissions.canEditSchedules);
    setFormCanApproveTimeOff(role.permissions.canApproveTimeOff);
    setFormCanManageEmployees(role.permissions.canManageEmployees);
    setFormCanExecuteAIActions(role.permissions.canExecuteAIActions);
    setFormCanExportPayroll(role.permissions.canExportPayroll);
    setFormCanManageRBAC(role.permissions.canManageRBAC);
    setFormCanViewAllLocations(role.permissions.canViewAllLocations);
    setIsCreatingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const assignedNode = hierarchyNodes.find(n => n.id === formAssignedNodeId) || hierarchyNodes[0];

    const permissions: RBACPermission = {
      allowedTabs: formAllowedTabs,
      canViewWagesAndBudgets: formCanViewWages,
      canEditSchedules: formCanEditSchedules,
      canApproveTimeOff: formCanApproveTimeOff,
      canManageEmployees: formCanManageEmployees,
      canExecuteAIActions: formCanExecuteAIActions,
      canExportPayroll: formCanExportPayroll,
      canManageRBAC: formCanManageRBAC,
      canViewAllLocations: formCanViewAllLocations || formHierarchyLevel === 'organization',
    };

    const newOrUpdatedRole: CustomRole = {
      id: editingRole ? editingRole.id : `role-custom-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim() || formName.trim().toUpperCase().replace(/\s+/g, '_'),
      description: formDescription.trim() || `Custom defined access role scoped to ${assignedNode.name}.`,
      badgeColor: formBadgeColor,
      hierarchyScopeLevel: formHierarchyLevel,
      assignedHierarchyPath: assignedNode.name,
      assignedNodeId: assignedNode.id,
      permissions,
      isCustom: true,
      userCount: editingRole ? editingRole.userCount : 1,
      createdAt: editingRole ? editingRole.createdAt : new Date().toISOString(),
      createdBy: 'Role-Based Access Manager'
    };

    onSaveRole(newOrUpdatedRole);
    setIsCreatingNew(false);
    setEditingRole(null);
    setSuccessToast(`Role "${newOrUpdatedRole.name}" successfully configured and mapped.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const toggleTabInForm = (tabId: ActiveTab) => {
    setFormAllowedTabs(prev =>
      prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]
    );
  };

  const filteredRoles = rbacState.roles.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.assignedHierarchyPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Role-Based Access Control (RBAC) Manager
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full">
                  Enterprise Security
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Define custom roles, map UI component viewports, and enforce strict hierarchy data boundary paths.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Role</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Role Simulation Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Active Simulated Role:</span>
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${currentActiveRole.badgeColor}`}>
              {currentActiveRole.name}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Hierarchy Scope:</span>
              <strong className="text-slate-800">{currentActiveRole.assignedHierarchyPath}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{currentActiveRole.permissions.allowedTabs.length} UI Views Enabled</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
              <span>{currentActiveRole.id === 'role-super-admin' || currentActiveRole.id === 'role-restaurant-host' ? '💳 Billing Authority' : '🎁 $0 Free Staff Tier'}</span>
            </span>
            {currentActiveRole.permissions.canViewWagesAndBudgets ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 border border-sky-200 text-sky-700 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Wages Visible</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                <span>Wages Masked</span>
              </span>
            )}
            {currentActiveRole.id !== 'role-super-admin' && (
              <button
                onClick={() => onSelectActiveRole('role-super-admin')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1"
              >
                Reset to Super Admin
              </button>
            )}
          </div>
        </div>

        {/* Success Notice Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successToast}</span>
            </span>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-100 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sub-Navigation Tabs */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3.5 py-2 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Custom Roles Directory ({rbacState.roles.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'matrix'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Permission &amp; UI Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('hierarchy_scope')}
              className={`px-3.5 py-2 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'hierarchy_scope'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hierarchy Scope &amp; Data Boundary Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 border-b-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>RBAC Audit Trail</span>
            </button>
          </div>

          <div className="relative pb-2">
            <input
              type="text"
              placeholder="Search roles or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-60"
            />
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">

          {/* TAB 1: Roles Directory */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoles.map((role) => {
                  const isActive = role.id === rbacState.activeRoleId;
                  const levelInfo = HIERARCHY_LEVEL_LABELS[role.hierarchyScopeLevel] || HIERARCHY_LEVEL_LABELS.organization;

                  return (
                    <div
                      key={role.id}
                      className={`bg-white rounded-xl border p-4.5 transition-all shadow-xs flex flex-col justify-between ${
                        isActive
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top Badge & Actions */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${role.badgeColor}`}>
                              {role.name}
                            </span>
                            {role.isCustom && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
                                Custom
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {role.isCustom && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(role)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Role Permissions & Scope"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteRole(role.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Custom Role"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleOpenCreateModal(role)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate as Template"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                          {role.description}
                        </p>

                        {/* Hierarchy Path Scope Pill */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-semibold flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>Hierarchy Scope:</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${levelInfo.badgeClass}`}>
                              {levelInfo.label}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 text-[11px] truncate" title={role.assignedHierarchyPath}>
                            📍 {role.assignedHierarchyPath}
                          </p>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-4 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {role.permissions.allowedTabs.length} UI Tabs
                          </span>
                          {role.permissions.canViewWagesAndBudgets ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                              <Eye className="w-2.5 h-2.5" />
                              <span>Wages Visible</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Wages Masked</span>
                            </span>
                          )}
                          {role.permissions.canEditSchedules ? (
                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                              Edit Schedule
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                              Schedule Read-Only
                            </span>
                          )}
                          {role.permissions.canApproveTimeOff && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              Approve Time-Off
                            </span>
                          )}
                          {role.permissions.canExecuteAIActions && (
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5" />
                              <span>AI Directives</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Switch / Simulate CTA */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {role.userCount} Active User{role.userCount > 1 ? 's' : ''}
                        </span>

                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100/70 px-3 py-1.5 rounded-lg border border-indigo-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Currently Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectActiveRole(role.id);
                              setSuccessToast(`Switched active perspective to "${role.name}". Data is now scoped to ${role.assignedHierarchyPath}.`);
                              setTimeout(() => setSuccessToast(null), 4000);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Simulate as this Role</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Permission Matrix */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comprehensive Role Access &amp; Capabilities Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compare UI viewport access and critical data capabilities across all defined enterprise roles.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Role</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-3 font-bold sticky left-0 bg-slate-100 z-10 w-64">
                        Feature / Permission Capability
                      </th>
                      {rbacState.roles.map((r) => (
                        <th key={r.id} className="p-3 font-bold min-w-[140px] text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${r.badgeColor}`}>
                            {r.name.split('(')[0]}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* General Capabilities */}
                    <tr className="bg-slate-50/80 font-bold text-slate-900">
                      <td colSpan={rbacState.roles.length + 1} className="p-2.5 text-[11px] uppercase tracking-wider text-slate-500">
                        🛡️ Core Data &amp; Security Privileges
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10">
                        View Wage &amp; Budget Data
                      </td>
                      {rbacState.roles.map(r => (
                        <td key={r.id} className="p-3 text-center">
                          {r.permissions.canViewWagesAndBudgets ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10">
                        Edit &amp; Auto-Fill Rosters
                      </td>
                      {rbacState.roles.map(r => (
                        <td key={r.id} className="p-3 text-center">
                          {r.permissions.canEditSchedules ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">Read-Only</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10">
                        Approve Time-Off &amp; Swaps
                      </td>
                      {rbacState.roles.map(r => (
                        <td key={r.id} className="p-3 text-center">
                          {r.permissions.canApproveTimeOff ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10">
                        Execute Autonomous AI Swarm Directives
                      </td>
                      {rbacState.roles.map(r => (
                        <td key={r.id} className="p-3 text-center">
                          {r.permissions.canExecuteAIActions ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10">
                        Export Payroll (ADP / UKG / Toast)
                      </td>
                      {rbacState.roles.map(r => (
                        <td key={r.id} className="p-3 text-center">
                          {r.permissions.canExportPayroll ? (
                            <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* UI Viewports */}
                    <tr className="bg-slate-50/80 font-bold text-slate-900">
                      <td colSpan={rbacState.roles.length + 1} className="p-2.5 text-[11px] uppercase tracking-wider text-slate-500">
                        🖥️ Allowed UI Viewports &amp; Application Tabs
                      </td>
                    </tr>
                    {AVAILABLE_TABS.map(tab => (
                      <tr key={tab.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white z-10 flex items-center gap-2">
                          <tab.icon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{tab.label}</span>
                        </td>
                        {rbacState.roles.map(r => {
                          const hasAccess = r.permissions.allowedTabs.includes(tab.id);
                          return (
                            <td key={r.id} className="p-3 text-center">
                              {hasAccess ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 text-slate-300 rounded-full">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Hierarchy Scope & Boundary Inspector */}
          {activeTab === 'hierarchy_scope' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Enterprise Hierarchy Boundary Architecture</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Managers strictly inherit and view operational records at or below their authorized node in the organizational tree.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Simulating Role:</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${currentActiveRole.badgeColor}`}>
                      {currentActiveRole.name}
                    </span>
                  </div>
                </div>

                {/* Hierarchy Nodes Visual Tree */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {hierarchyNodes.map(node => {
                    const isRoot = node.id === 'node-corp-01';
                    const isRoleScope = node.id === currentActiveRole.assignedNodeId;
                    const isAuthorized = currentActiveRole.permissions.canViewAllLocations ||
                      node.id === currentActiveRole.assignedNodeId ||
                      node.parentId === currentActiveRole.assignedNodeId ||
                      currentActiveRole.assignedNodeId === 'node-corp-01';

                    return (
                      <div
                        key={node.id}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isRoleScope
                            ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600'
                            : isAuthorized
                              ? 'bg-white'
                              : 'bg-slate-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isAuthorized ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-400'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                {node.name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                HIERARCHY_LEVEL_LABELS[node.level]?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {node.level}
                              </span>
                              {isRoleScope && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                                  📍 Active Scope Anchor
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {node.locationsCount} Location{node.locationsCount > 1 ? 's' : ''} • {node.activeHeadcount.toLocaleString()} Staff • Target Labor {node.laborTargetPct}% • Weekly Budget ${node.weeklyBudgetDollars.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          {isAuthorized ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              <span>In Scope (Authorized)</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Boundary Restricted</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Boundary Test Simulator */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  🧪 Real-Time Permission &amp; Scope Boundary Diagnostic
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Select any sample node in the enterprise to evaluate whether the current active role has permission to access records in that subtree.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {hierarchyNodes.map(n => {
                    const isAllowed = currentActiveRole.permissions.canViewAllLocations ||
                      n.id === currentActiveRole.assignedNodeId ||
                      currentActiveRole.assignedNodeId === 'node-corp-01' ||
                      (currentActiveRole.assignedNodeId === 'node-region-01' && (n.id === 'node-region-01' || n.id === 'node-district-01' || n.id === 'node-loc-01')) ||
                      (currentActiveRole.assignedNodeId === 'node-loc-01' && n.id === 'node-loc-01');

                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          isAllowed
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div>
                          <strong className="block truncate max-w-[170px]" title={n.name}>
                            {n.name}
                          </strong>
                          <span className="text-[10px] text-slate-500 capitalize">{n.level}</span>
                        </div>
                        {isAllowed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                            DENIED
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RBAC Audit Log */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Security &amp; Authorization Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Immutable event log of role provisioning, boundary overrides, and access modifications.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  {rbacState.auditTrail.length} Logged Events
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {rbacState.auditTrail.map(log => (
                  <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-4 hover:bg-slate-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200">
                          {log.roleName}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Multi-Tier Role-Based Security Guardrails Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>

      {/* CREATE / EDIT CUSTOM ROLE MODAL DRAWER */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Drawer Header */}
            <div className="bg-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingRole ? 'Edit Custom Role' : 'Create Custom Enterprise Role'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Configure role identifier, hierarchy path anchor, allowed UI viewports, and sensitive data permissions.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="text-indigo-200 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">

              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role Title / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Regional Auditor, Location GM, Floor Lead"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role Code Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REGIONAL_AUDITOR"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description &amp; Operational Mandate
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize the operational scope and authorities of this role..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Hierarchy Scope Level & Node Anchor */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Hierarchy Scope Anchor (Data Boundary)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Hierarchy Scope Tier
                    </label>
                    <select
                      value={formHierarchyLevel}
                      onChange={(e) => setFormHierarchyLevel(e.target.value as HierarchyLevel)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    >
                      <option value="organization">Organization (Enterprise Master)</option>
                      <option value="brand">Brand Concept Tier</option>
                      <option value="region">Regional Territory</option>
                      <option value="district">District Sub-Cluster</option>
                      <option value="location">Single Location Store</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Assigned Hierarchy Node
                    </label>
                    <select
                      value={formAssignedNodeId}
                      onChange={(e) => setFormAssignedNodeId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-medium"
                    >
                      {hierarchyNodes.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.level.toUpperCase()} - {n.locationsCount} units)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  💡 Users assigned this role will only be able to view and manage data that resides inside the selected branch.
                </p>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Badge Theme Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      type="button"
                      key={c.name}
                      onClick={() => setFormBadgeColor(c.class)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${c.class} ${
                        formBadgeColor === c.class ? 'ring-2 ring-indigo-500 scale-105 shadow-sm' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allowed Viewports / Tabs Multi-Select */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Allowed UI Viewports &amp; Application Tabs ({formAllowedTabs.length} selected)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs(AVAILABLE_TABS.map(t => t.id))}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAllowedTabs(['schedule', 'announcements'])}
                      className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                    >
                      Reset Minimal
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_TABS.map(tab => {
                    const isSelected = formAllowedTabs.includes(tab.id);
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => toggleTabInForm(tab.id)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <tab.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-xs">{tab.label}</span>
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Capabilities Switches */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block">
                  Granular Action &amp; Data Security Capabilities
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 block">View Wages, Labor Costs &amp; Budgets</span>
                      <span className="text-[11px] text-slate-500">Allows viewing hourly wage rates and store labor cost sums (masked if unchecked)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formCanViewWages}
                      onChange={(e) => setFormCanViewWages(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 block">Edit &amp; Auto-Fill Schedules</span>
                      <span className="text-[11px] text-slate-500">Allows creating, editing, and publishing shift rosters (Read-only if unchecked)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formCanEditSchedules}
                      onChange={(e) => setFormCanEditSchedules(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 block">Approve Time-Off &amp; Shift Swaps</span>
                      <span className="text-[11px] text-slate-500">Permits final approval for employee time-off and peer shift trade requests</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formCanApproveTimeOff}
                      onChange={(e) => setFormCanApproveTimeOff(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 block">Execute AI Swarm &amp; Shift Rescue</span>
                      <span className="text-[11px] text-slate-500">Authorize 1-tap automated shift offers and labor balancing recommendations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formCanExecuteAIActions}
                      onChange={(e) => setFormCanExecuteAIActions(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-semibold text-slate-800 block">Export Payroll &amp; POS Sync</span>
                      <span className="text-[11px] text-slate-500">Allows pushing timesheets to ADP, UKG, Workday, and Toast</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formCanExportPayroll}
                      onChange={(e) => setFormCanExportPayroll(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRole ? 'Save Changes' : 'Create & Map Role'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
