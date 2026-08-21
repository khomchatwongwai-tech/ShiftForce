import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  Bell,
  Sparkles,
  Globe,
  ShieldCheck,
  Shield,
  UserCheck,
  Megaphone,
  FileText,
  UserPlus,
  CreditCard,
  ChevronDown,
  CheckCircle2,
  Smartphone,
  Mail,
  BarChart3,
  Star,
  Layers,
  Award,
  Zap,
  Building2,
  DollarSign,
  GraduationCap,
  Sliders,
  MapPin,
  Lock,
  Wifi,
  WifiOff,
  LogIn,
  LogOut,
  User,
  Menu,
  X,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  Employee,
  SupportedLanguage,
  NotificationDispatch,
  PortalType,
  ActiveTab,
  UserSubscriptionState,
  RBACManagerState,
  AuthUserSession,
  AuthPortalMode
} from '../types';
import { EnterpriseFeatureManagerState } from '../plugins/types';
import { translations } from '../utils/i18n';

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  pluginId?: string;
}

interface NavbarProps {
  portal: PortalType;
  onPortalChange: (portal: PortalType) => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  totalEmployees?: number;
  unreadNotificationsCount?: number;
  onOpenPricing?: () => void;
  onOpenAIAssistant: () => void;
  onOpenFeatureManager?: () => void;
  onOpenPaymentPortal?: () => void;
  onOpenRBAC?: () => void;
  rbacState?: RBACManagerState;
  onSelectActiveRole?: (roleId: string) => void;
  featureState?: EnterpriseFeatureManagerState;
  notificationDispatches?: NotificationDispatch[];
  subscriptionState?: UserSubscriptionState;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  onOpenOfflineModal?: () => void;
  offlineQueueCount?: number;
  authSession?: AuthUserSession | null;
  onOpenLoginModal?: (mode?: AuthPortalMode) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  onPortalChange,
  activeTab,
  onTabChange,
  currentLanguage,
  onLanguageChange,
  totalEmployees = 12,
  unreadNotificationsCount = 0,
  onOpenPricing,
  onOpenAIAssistant,
  onOpenFeatureManager,
  onOpenPaymentPortal,
  onOpenRBAC,
  rbacState,
  onSelectActiveRole,
  featureState,
  notificationDispatches = [],
  subscriptionState,
  isOnline = true,
  isSimulatedOffline = false,
  onOpenOfflineModal,
  offlineQueueCount = 0,
  authSession,
  onOpenLoginModal,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const t = translations[currentLanguage];

  const activeRole = rbacState?.roles.find(r => r.id === rbacState.activeRoleId) || rbacState?.roles[0];

  const languages: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
    { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const allAdminTabs: TabItem[] = [
    { id: 'command_center', label: 'AI Command Center', icon: Zap, pluginId: 'ai_command_center' },
    { id: 'intelligence_agent', label: 'Intelligence Agent', icon: Sparkles, pluginId: 'intelligence_agent' },
    { id: 'enterprise', label: 'Enterprise Hub', icon: Building2, pluginId: 'enterprise' },
    { id: 'schedule', label: t.schedule, icon: Calendar, pluginId: 'core_scheduling' },
    { id: 'employees', label: `${t.employees} (${totalEmployees.toLocaleString()})`, icon: Users, pluginId: 'employees' },
    { id: 'payroll', label: 'Workqora Payroll', icon: DollarSign, pluginId: 'payroll' },
    { id: 'learn', label: 'Workqora Learn', icon: GraduationCap, pluginId: 'learn' },
    { id: 'performance', label: t.performance || 'Restaurant Score & Reviews', icon: Star, pluginId: 'performance' },
    { id: 'integrations', label: t.integrations || 'WorkForce & POS Hub', icon: Layers, pluginId: 'integrations' },
    { id: 'analytics', label: t.analytics || 'Analytics', icon: BarChart3, pluginId: 'analytics' },
    { id: 'requests', label: t.requests, icon: FileText, pluginId: 'requests' },
    { id: 'tardiness', label: t.lateTardiness, icon: Clock, pluginId: 'tardiness' },
    { id: 'announcements', label: t.announcements, icon: Megaphone, badge: unreadNotificationsCount, pluginId: 'announcements' },
    { id: 'hr_payroll', label: 'HR, Hiring & Onboarding', icon: UserPlus, pluginId: 'hr_payroll' },
  ];

  const allEmployeeTabs: TabItem[] = [
    { id: 'schedule', label: t.mySchedule, icon: Calendar, pluginId: 'core_scheduling' },
    { id: 'learn', label: 'Academy & Certifications', icon: GraduationCap, pluginId: 'learn' },
    { id: 'performance', label: 'Score, Reviews & Kudos', icon: Award, pluginId: 'performance' },
    { id: 'requests', label: t.requests, icon: FileText, pluginId: 'requests' },
    { id: 'announcements', label: t.announcements, icon: Megaphone, badge: unreadNotificationsCount, pluginId: 'announcements' },
  ];

  const adminTabs = allAdminTabs.filter(tab => {
    if (activeRole && !activeRole.permissions.allowedTabs.includes(tab.id)) {
      return false;
    }
    if (featureState && tab.pluginId && !featureState.enabledPluginIds.includes(tab.pluginId) && tab.id !== 'command_center' && tab.id !== 'schedule') {
      return false;
    }
    return true;
  });

  const employeeTabs = featureState
    ? allEmployeeTabs.filter(tab => !tab.pluginId || featureState.enabledPluginIds.includes(tab.pluginId) || tab.id === 'schedule')
    : allEmployeeTabs;

  const currentLangObj = languages.find(l => l.code === currentLanguage) || languages[0];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs w-full max-w-full pt-[env(safe-area-inset-top,0px)]">
      {/* Top Utility & Branding Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* Logo & Tagline */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/logo.svg"
              alt="Workqora Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md shadow-sky-500/20 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 truncate">
                  Shift<span className="text-sky-600">Force</span>
                </span>
                <span className="hidden lg:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-sky-100 text-sky-700 rounded-full border border-sky-200 shrink-0">
                  Restaurant Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden xl:block truncate">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* DESKTOP CONTROLS (Visible on >= 1024px) */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">

            {/* Role & Access (RBAC) Selector */}
            {portal === 'admin' && activeRole && (
              <div className="relative">
                <button
                  id="navbar-rbac-btn"
                  onClick={() => {
                    setShowRoleMenu(!showRoleMenu);
                    setShowLangMenu(false);
                    setShowNotifications(false);
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 transition-colors cursor-pointer shadow-xs"
                  title="Active Role & Hierarchy Access Scope (RBAC)"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold truncate max-w-[140px]">
                    {activeRole.name.split('(')[0].trim()}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Active Role &amp; Access Scope
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate" title={activeRole.assignedHierarchyPath}>
                          📍 {activeRole.assignedHierarchyPath}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                        {activeRole.hierarchyScopeLevel}
                      </span>
                    </div>

                    <div className="p-2 space-y-1 max-h-56 overflow-y-auto divide-y divide-slate-50">
                      {rbacState?.roles.map((r) => {
                        const isSelected = r.id === activeRole.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => {
                              if (onSelectActiveRole) onSelectActiveRole(r.id);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="truncate max-w-[190px]">{r.name}</span>
                                {r.isCustom && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded font-semibold">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                                📍 {r.assignedHierarchyPath}
                              </span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                          </button>
                        );
                      })}
                    </div>

                    {onOpenRBAC && (
                      <div className="p-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            onOpenRBAC();
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{t.openRBAC}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dual Portal Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                id="portal-admin-btn"
                onClick={() => onPortalChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portal === 'admin'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.adminPortal}</span>
              </button>
              <button
                id="portal-employee-btn"
                onClick={() => onPortalChange('employee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  portal === 'employee'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t.employeePortal}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                id="navbar-language-btn"
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowRoleMenu(false);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 transition-colors cursor-pointer shadow-xs"
                title="Select Interface Language"
              >
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>{currentLangObj.flag}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900">Supported Languages</h4>
                  </div>
                  <div className="p-1 space-y-0.5 max-h-60 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          currentLanguage === lang.code
                            ? 'bg-sky-50 text-sky-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {currentLanguage === lang.code && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                id="navbar-notifications-btn"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowRoleMenu(false);
                  setShowLangMenu(false);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-700 transition-colors cursor-pointer shadow-xs"
                title="Live Dispatch Logs & Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Live Notifications &amp; SMS / Email
                      </h4>
                      <p className="text-[11px] text-slate-500">{t.publish7DayBroadcast}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 rounded-full">
                      {notificationDispatches.length} Dispatches
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notificationDispatches.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No active broadcasts yet. Publish a schedule or announcement to dispatch live alerts.
                      </div>
                    ) : (
                      notificationDispatches.slice(0, 8).map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">{n.timestamp.split(' ')[1] || 'Just now'}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 mb-1.5">{n.message}</p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 font-mono">
                            {n.type === 'shift_24hr_reminder' ? (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                WhatsApp ({n.recipientPhone || 'All'})
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1 text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                              <Smartphone className="w-3 h-3" /> SMS
                            </span>
                            <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Mail className="w-3 h-3" /> App
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Offline Mode Indicator Button */}
            {onOpenOfflineModal && (
              <button
                id="navbar-offline-mode-btn"
                onClick={onOpenOfflineModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  !isOnline || isSimulatedOffline
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 font-extrabold animate-pulse'
                    : offlineQueueCount > 0
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={
                  !isOnline || isSimulatedOffline
                    ? 'Offline Mode Active (Running on Service Worker Cache)'
                    : 'Offline Cache & Local Roster Ready'
                }
              >
                {!isOnline || isSimulatedOffline ? (
                  <WifiOff className="w-3.5 h-3.5 text-slate-950" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>
                  {!isOnline || isSimulatedOffline ? 'Offline' : 'Offline Mode'}
                </span>
                {offlineQueueCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[9px] font-black">
                    {offlineQueueCount}
                  </span>
                )}
              </button>
            )}

            {/* AI Assistant Button */}
            <button
              id="open-ai-assistant-btn"
              onClick={onOpenAIAssistant}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{t.aiAssistant}</span>
            </button>

            {/* Authentication & Profile Button */}
            <div className="relative">
              <button
                id="navbar-user-auth-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowRoleMenu(false);
                  setShowLangMenu(false);
                  setShowNotifications(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                  authSession?.isAuthenticated
                    ? authSession.userType === 'admin'
                      ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-700'
                }`}
                title="Account & Login (Admin / Employee)"
              >
                {authSession?.isAuthenticated ? (
                  authSession.userType === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  ) : authSession.avatarUrl ? (
                    <img
                      src={authSession.avatarUrl}
                      alt={authSession.displayName}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-white" />
                )}

                <span className="font-bold truncate max-w-[120px]">
                  {authSession?.isAuthenticated ? authSession.displayName : 'Sign In'}
                </span>

                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                  {authSession?.isAuthenticated ? (
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {authSession.avatarUrl ? (
                          <img
                            src={authSession.avatarUrl}
                            alt={authSession.displayName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold ${
                            authSession.userType === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'
                          }`}>
                            {authSession.userType === 'admin' ? <ShieldCheck className="w-4 h-4 text-amber-300" /> : <User className="w-4 h-4" />}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 truncate">
                            {authSession.displayName}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {authSession.displayEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          authSession.userType === 'admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {authSession.userType === 'admin' ? 'Manager / Admin Portal' : '100% Free Staff Seat'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Active Session
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-b border-slate-100 text-center">
                      <h4 className="font-bold text-slate-900">Workqora Sign-In</h4>
                      <p className="text-[11px] text-slate-500">{t.switchPortal}</p>
                    </div>
                  )}

                  <div className="p-2 space-y-1">
                    <button
                      id="menu-login-admin-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenLoginModal) onOpenLoginModal('admin');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs block text-indigo-950">{t.adminSignIn}</span>
                        <span className="text-[10px] text-slate-500 block">Host billing, schedules, payroll &amp; POS</span>
                      </div>
                    </button>

                    <button
                      id="menu-login-employee-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onOpenLoginModal) onOpenLoginModal('employee');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-emerald-950">{t.staffSignIn}</span>
                          <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                            Free
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Personal shift, clock-in, trades &amp; pay</span>
                      </div>
                    </button>
                  </div>

                  {authSession?.isAuthenticated && onLogout && (
                    <div className="p-2 pt-1 border-t border-slate-100">
                      <button
                        id="navbar-signout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.signOut}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* MOBILE / TABLET CONTROLS (Visible on < 1024px) */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">

            {/* Notification Icon Button (Mobile) */}
            <button
              id="mobile-notifications-btn"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMobileMenu(false);
              }}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-700 transition-colors cursor-pointer"
              title="Live Dispatches"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* AI Assistant Button (Mobile) */}
            <button
              id="mobile-ai-btn"
              onClick={onOpenAIAssistant}
              className="flex items-center gap-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI</span>
            </button>

            {/* Profile / Auth Quick Button (Mobile) */}
            <button
              id="mobile-user-auth-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowMobileMenu(false);
              }}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer ${
                authSession?.isAuthenticated
                  ? authSession.userType === 'admin'
                    ? 'bg-slate-900 text-white border-slate-700'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-sky-600 text-white border-sky-700'
              }`}
              title="Account Options"
            >
              {authSession?.isAuthenticated ? (
                authSession.userType === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )
              ) : (
                <LogIn className="w-4 h-4 text-white" />
              )}
            </button>

            {/* Hamburger / More Menu Toggle Button */}
            <button
              id="mobile-more-menu-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {showMobileMenu ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
            </button>

          </div>

        </div>
      </div>

      {/* MOBILE MORE MENU OVERLAY / DRAWER */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white border-b border-sky-200 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">

          {/* App Branding Info */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                Workqora Restaurant Edition
              </span>
              {activeRole && portal === 'admin' && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-md">
                  {activeRole.hierarchyScopeLevel}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Portal Switcher */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Access Portal
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  onPortalChange('admin');
                  setShowMobileMenu(false);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  portal === 'admin'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Manager Portal</span>
              </button>

              <button
                onClick={() => {
                  onPortalChange('employee');
                  setShowMobileMenu(false);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  portal === 'employee'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.employeePortal}</span>
              </button>
            </div>
          </div>

          {/* Active Role Selector (Admin Mode) */}
          {portal === 'admin' && activeRole && (
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Hierarchy Scope (RBAC)
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-48 overflow-y-auto">
                {rbacState?.roles.map((r) => {
                  const isSelected = r.id === activeRole.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (onSelectActiveRole) onSelectActiveRole(r.id);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        isSelected ? 'bg-indigo-100 text-indigo-900 font-bold' : 'hover:bg-slate-200/60 text-slate-700'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="truncate font-semibold">{r.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">📍 {r.assignedHierarchyPath}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}

                {onOpenRBAC && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onOpenRBAC();
                    }}
                    className="w-full mt-2 py-2 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Open RBAC Role Manager</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Interface Language ({currentLangObj.flag} {currentLangObj.label})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setShowMobileMenu(false);
                  }}
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 border cursor-pointer ${
                    currentLanguage === lang.code
                      ? 'bg-sky-50 text-sky-900 border-sky-300 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Offline Mode Status & Actions */}
          {onOpenOfflineModal && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                {!isOnline || isSimulatedOffline ? (
                  <WifiOff className="w-4 h-4 text-amber-600" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                )}
                <span>{!isOnline || isSimulatedOffline ? 'Offline Mode Active' : 'System Connected'}</span>
              </div>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenOfflineModal();
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer"
              >
                Offline Roster ({offlineQueueCount})
              </button>
            </div>
          )}

          {/* Sign In / Sign Out Section */}
          <div className="pt-3 border-t border-slate-100">
            {authSession?.isAuthenticated ? (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{authSession.displayName}</div>
                  <div className="text-[10px] text-slate-500 truncate">{authSession.displayEmail}</div>
                </div>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg border border-rose-200 shrink-0 cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    if (onOpenLoginModal) onOpenLoginModal('admin');
                  }}
                  className="py-2 px-3 bg-indigo-600 text-white text-xs font-bold rounded-xl text-center cursor-pointer"
                >
                  Admin Sign In
                </button>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    if (onOpenLoginModal) onOpenLoginModal('employee');
                  }}
                  className="py-2 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl text-center cursor-pointer"
                >
                  Staff Sign In
                </button>
              </div>
            )}
          </div>

          {/* Navigation Shortcuts */}
          <div className="pt-3 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Navigation Views
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(portal === 'admin' ? adminTabs : employeeTabs).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setShowMobileMenu(false);
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Navigation Sub-Tabs Bar (Row 2) */}
      <div className="bg-sky-50/50 border-t border-sky-100/60 w-full max-w-full overflow-x-auto scrollbar-none touch-pan-x">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          <nav className="flex items-center space-x-1 sm:space-x-2 py-2 min-w-max">
            {(portal === 'admin' ? adminTabs : employeeTabs).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-white text-sky-700 shadow-xs border border-sky-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};