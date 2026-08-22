import { useLanguage } from './context/LanguageContext';
import React, { useState, useMemo, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import {
  Navbar
} from './components/Navbar';
import {
  ShiftCountdownBanner
} from './components/ShiftCountdownBanner';
import {
  ScheduleCalendarView
} from './components/ScheduleCalendarView';
import {
  EmployeeManagementView
} from './components/EmployeeManagementView';
import {
  RequestsApprovalsView
} from './components/RequestsApprovalsView';
import {
  LateTardinessTrackerView
} from './components/LateTardinessTrackerView';
import {
  HRManagementView
} from './components/HRManagementView';
import {
  AnalyticsDashboardView
} from './components/AnalyticsDashboardView';
import {
  AnnouncementsView
} from './components/AnnouncementsView';
import {
  EmployeeSelfServiceView
} from './components/EmployeeSelfServiceView';
import {
  PublishBroadcastModal
} from './components/PublishBroadcastModal';
import {
  PricingTiersModal
} from './components/PricingTiersModal';
import {
  AIAssistantDrawer
} from './components/AIAssistantDrawer';
import {
  ScheduledRemindersModal
} from './components/ScheduledRemindersModal';
import {
  AICommandCenterView
} from './components/AICommandCenterView';
import {
  WorkqoraIntelligenceAgentView
} from './components/WorkqoraIntelligenceAgentView';
import {
  EnterpriseCommandHubView
} from './components/EnterpriseCommandHubView';
import {
  RestaurantPerformanceReviewsView
} from './components/RestaurantPerformanceReviewsView';
import {
  IntegrationsHubView
} from './components/IntegrationsHubView';
import {
  WorkqoraLearnView
} from './components/plugins/WorkqoraLearnView';
import {
  WorkqoraPayrollView
} from './components/plugins/WorkqoraPayrollView';
import {
  EnterpriseFeatureManagerModal
} from './components/EnterpriseFeatureManagerModal';
import {
  PaymentPortalModal,
  PaymentPortalItem
} from './components/PaymentPortalModal';
import {
  RoleBasedAccessControlManager
} from './components/RoleBasedAccessControlManager';
import {
  OfflineRosterClockInModal
} from './components/OfflineRosterClockInModal';
import {
  DualLoginModal
} from './components/DualLoginModal';
import {
  EquipmentManagerView
} from './components/EquipmentManagerView';
import {
  UnifiedEmailInboxView
} from './components/email/UnifiedEmailInboxView';
import {
  EmailIntegrationCenterView
} from './components/email/EmailIntegrationCenterView';
import {
  INITIAL_EMAIL_CONNECTIONS,
  INITIAL_EMAIL_MESSAGES,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_EMAIL_SIGNATURES,
  INITIAL_EMAIL_AUDIT_LOGS
} from './utils/emailSyncEngine';
import {
  FirebaseProvider,
  useFirebase
} from './firebase/FirebaseContext';
import {
  firestoreService
} from './firebase/firestoreService';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Cloud,
  Database
} from 'lucide-react';
import {
  registerServiceWorker,
  saveRosterToOfflineStorage,
  loadRosterFromOfflineStorage,
  getOfflineClockInQueue,
  clearOfflineClockInQueue,
  OfflineClockInRecord
} from './utils/offlineServiceWorker';
import {
  ALL_SYSTEM_PLUGINS,
  INITIAL_FEATURE_MANAGER_STATE
} from './plugins/registry';
import {
  EnterpriseFeatureManagerState
} from './plugins/types';
import {
  INITIAL_RBAC_STATE,
  isRecordAuthorizedForRole,
  filterHierarchyTreeForRole
} from './data/rbacData';

import {
  INITIAL_EMPLOYEES,
  INITIAL_SHIFTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_TIMEOFF_REQUESTS,
  INITIAL_SWAP_REQUESTS,
  INITIAL_SICK_REPORTS,
  INITIAL_AVAILABILITY_REQUESTS,
  INITIAL_TARDINESS_LOG,
  INITIAL_ONBOARDING_CANDIDATES,
  INITIAL_SHIFT_TEMPLATES,
  INITIAL_NOTIFICATION_DISPATCHES,
  INITIAL_DEPARTMENT_BUDGETS,
  INITIAL_SHIFT_SLOT_REQUESTS,
  INITIAL_RESTAURANT_PERFORMANCE_SCORE,
  INITIAL_GUEST_REVIEWS,
  INITIAL_WORKFORCE_PLATFORMS,
  INITIAL_POS_PLATFORMS,
  INITIAL_WORKFORCE_SYNC_LOGS,
  INITIAL_POS_SERVER_METRICS,
  INITIAL_POS_TIMECLOCK_PUNCHES,
  generateWeekDates,
  generateLargeEmployeePool,
  EMPLOYEE_COLORS,
} from './data/mockData';

import { acceptOrganizationInvitation, beginStripeCheckout, getEnterpriseContext } from './utils/enterpriseService';
import { EnterpriseLocationManagerModal } from './components/EnterpriseLocationManagerModal';
import {
  PortalType,
  ActiveTab,
  SupportedLanguage,
  Employee,
  Department,
  RestaurantRole,
  Shift,
  Announcement,
  TimeOffRequest,
  ShiftSwapRequest,
  SickDayReport,
  AvailabilityRequest,
  TardinessRecord,
  OnboardingCandidate,
  NotificationDispatch,
  ShiftTemplate,
  ReminderSchedulerConfig,
  DepartmentBudgetsMap,
  ShiftSlotRequest,
  ShiftSlotContention,
  UserSubscriptionState,
  POSPlatformId,
  POSDepartmentMapping,
  RBACManagerState,
  CustomRole,
  AuthUserSession,
  AuthPortalMode,
  BusinessEmailConnection,
  EmailMessage,
  EmailTemplate,
  EmailSignature,
  EmailAuditEvent,
  Location
} from './types';
import { INITIAL_POS_DEPARTMENT_MAPPINGS } from './data/posMappingData';
import {
  detectShiftSlotContentions,
  generateContentionNotificationDispatch
} from './utils/shiftSlotValidation';
import { authenticatedFetch } from './utils/apiClient';

export function App() {
  const demoDataEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_DATA === 'true';

  // Navigation & Language State
  const [portal, setPortal] = useState<PortalType>('admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const { currentLanguage, setLanguage: setCurrentLanguage, t } = useLanguage();

  // Role-Based Access Control (RBAC) & Custom Role Hierarchy State
  const [rbacState, setRbacState] = useState<RBACManagerState>(INITIAL_RBAC_STATE);
  const [isRBACModalOpen, setIsRBACModalOpen] = useState(false);

  // Active Role Object
  const activeRole = useMemo(() => {
    return rbacState.roles.find(r => r.id === rbacState.activeRoleId) || rbacState.roles[0];
  }, [rbacState]);

  // If the active role changes and doesn't permit current admin tab, fallback to first permitted tab
  useEffect(() => {
    if (portal === 'admin' && activeRole && !activeRole.permissions.allowedTabs.includes(activeTab)) {
      const fallbackTab = activeRole.permissions.allowedTabs[0] || 'schedule';
      setActiveTab(fallbackTab);
    }
  }, [activeRole, activeTab, portal]);

  // Core Data States
  const [employees, setEmployees] = useState<Employee[]>(demoDataEnabled ? INITIAL_EMPLOYEES : []);
  const [shifts, setShifts] = useState<Shift[]>(demoDataEnabled ? INITIAL_SHIFTS : []);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>(INITIAL_SHIFT_TEMPLATES);
  const [departmentBudgets, setDepartmentBudgets] = useState<DepartmentBudgetsMap>(INITIAL_DEPARTMENT_BUDGETS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(demoDataEnabled ? INITIAL_ANNOUNCEMENTS : []);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(demoDataEnabled ? INITIAL_TIMEOFF_REQUESTS : []);
  const [shiftSwapRequests, setShiftSwapRequests] = useState<ShiftSwapRequest[]>(demoDataEnabled ? INITIAL_SWAP_REQUESTS : []);
  const [sickReports, setSickReports] = useState<SickDayReport[]>(demoDataEnabled ? INITIAL_SICK_REPORTS : []);
  const [availabilityRequests, setAvailabilityRequests] = useState<AvailabilityRequest[]>(demoDataEnabled ? INITIAL_AVAILABILITY_REQUESTS : []);
  const [tardinessLog, setTardinessLog] = useState<TardinessRecord[]>(demoDataEnabled ? INITIAL_TARDINESS_LOG : []);
  const [candidates, setCandidates] = useState<OnboardingCandidate[]>(demoDataEnabled ? INITIAL_ONBOARDING_CANDIDATES : []);
  const [shiftSlotRequests, setShiftSlotRequests] = useState<ShiftSlotRequest[]>(demoDataEnabled ? INITIAL_SHIFT_SLOT_REQUESTS : []);
  const [notificationDispatches, setNotificationDispatches] = useState<NotificationDispatch[]>(demoDataEnabled ? INITIAL_NOTIFICATION_DISPATCHES : []);

  // POS Department Mappings State for Dynamic Labor vs Sales Efficiency Analytics
  const [posMappings, setPOSMappings] = useState<Record<POSPlatformId, POSDepartmentMapping>>(INITIAL_POS_DEPARTMENT_MAPPINGS);
  const [activePOSId, setActivePOSId] = useState<POSPlatformId>('toast');

  // 24-Hour & 1-Hour Scheduled Task Trigger Configuration
  const [schedulerConfig, setSchedulerConfig] = useState<ReminderSchedulerConfig>({
    enable24HrReminder: true,
    enable1HrAlert: true,
    channels24Hr: ['whatsapp', 'sms'],
    channels1Hr: ['app', 'sms'],
    autoTriggerIntervalSeconds: 30,
    whatsappTemplate: '🍽️ *Workqora 24-Hour Shift Reminder*\nHi *{{name}}*, your next shift as *{{role}}* ({{department}}) starts tomorrow at *{{startTime}}* on *{{date}}*.',
    smsTemplate: 'Workqora Alert: Hi {{name}}, you are scheduled tomorrow {{date}} at {{startTime}} ({{role}}).',
    totalAutoSentCount: 0,
    isDaemonActive: demoDataEnabled,
    lastRunTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });
  const [isScanningReminders, setIsScanningReminders] = useState(false);

  // Active Employee for Employee Portal
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('');

  // User Subscription & 15-Day Free Trial State
  const [subscriptionState, setSubscriptionState] = useState<UserSubscriptionState>({
    currentTierId: 'free-1',
    activeLocationCount: 1,
    activeEmployeeCount: 0,
    billingCycle: 'monthly',
    isTrialActive: false,
    trialDaysRemaining: 0,
    trialStartDate: new Date().toISOString().split('T')[0],
    trialEndDate: '',
    nextBillingDate: '',
  });

  // Service Worker & Offline Mode State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  // Modals & Drawers State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [isFeatureManagerOpen, setIsFeatureManagerOpen] = useState(false);
  const [isPaymentPortalOpen, setIsPaymentPortalOpen] = useState(false);
  const [paymentPortalItem, setPaymentPortalItem] = useState<PaymentPortalItem | undefined>(undefined);

  // Business Email Integration Suite State
  const [emailConnections, setEmailConnections] = useState<BusinessEmailConnection[]>(() => {
    try {
      const saved = localStorage.getItem('workqora_email_connections');
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_CONNECTIONS;
    } catch {
      return INITIAL_EMAIL_CONNECTIONS;
    }
  });

  const [emailMessages, setEmailMessages] = useState<EmailMessage[]>(() => {
    try {
      const saved = localStorage.getItem('workqora_email_messages');
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_MESSAGES;
    } catch {
      return INITIAL_EMAIL_MESSAGES;
    }
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('workqora_email_templates');
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_TEMPLATES;
    } catch {
      return INITIAL_EMAIL_TEMPLATES;
    }
  });

  const [emailSignatures, setEmailSignatures] = useState<EmailSignature[]>(() => {
    try {
      const saved = localStorage.getItem('workqora_email_signatures');
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_SIGNATURES;
    } catch {
      return INITIAL_EMAIL_SIGNATURES;
    }
  });

  const [emailAuditLogs, setEmailAuditLogs] = useState<EmailAuditEvent[]>(() => {
    try {
      const saved = localStorage.getItem('workqora_email_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_AUDIT_LOGS;
    } catch {
      return INITIAL_EMAIL_AUDIT_LOGS;
    }
  });

  const [isEmailSettingsModalOpen, setIsEmailSettingsModalOpen] = useState(false);

  const companyLocations = useMemo<Location[]>(() => [
    { id: 'loc-dtla-main', name: 'Downtown Flagship #101 (Los Angeles)', code: 'DTLA-101', city: 'Los Angeles', state: 'CA' },
    { id: 'loc-sf-flagship', name: 'SF Flagship Bistro #104', code: 'SF-104', city: 'San Francisco', state: 'CA' },
    { id: 'loc-nyc-soho', name: 'NYC SoHo Dining Room #201', code: 'NYC-201', city: 'New York', state: 'NY' },
    { id: 'loc-austin-301', name: 'Austin South Congress #301', code: 'ATX-301', city: 'Austin', state: 'TX' },
  ], []);

  // Sync email to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('workqora_email_connections', JSON.stringify(emailConnections));
    } catch { /* noop */ }
  }, [emailConnections]);

  useEffect(() => {
    try {
      localStorage.setItem('workqora_email_messages', JSON.stringify(emailMessages));
    } catch { /* noop */ }
  }, [emailMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('workqora_email_audit_logs', JSON.stringify(emailAuditLogs));
    } catch { /* noop */ }
  }, [emailAuditLogs]);

  // Firebase Authentication & Persistent User Session Context
  const {
    currentUser,
    userProfile,
    userSession,
    isLoadingAuth,
    isFirestoreConnected,
    logOutFirebase,
    setCustomSession
  } = useFirebase();

  // Authentication & Dual Login Session State (Admin & Employee)
  const [authSession, setAuthSession] = useState<AuthUserSession>(userSession);
  const authenticatedUserType = userSession.isAuthenticated ? userSession.userType : null;
  const authenticatedOrganizationId = authenticatedUserType === 'employee' ? userSession.employee?.organizationId : userProfile?.organizationId;
  const authenticatedEmployeeId = authenticatedUserType === 'employee' ? userSession.employee?.id : userProfile?.employeeId;
  const authenticatedLocationId = authenticatedUserType === 'employee' ? userSession.employee?.locationId : undefined;
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<AuthPortalMode>('admin');

  // Accept single-use organization invitations after Firebase identity verification.
  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('invite');
    if (!token) return;
    let cancelled = false;
    acceptOrganizationInvitation(token).then(async () => {
      if (cancelled) return;
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.toString());
      await currentUser.getIdToken(true);
      window.location.reload();
    }).catch(err => {
      if (!cancelled) setOfflineToast(err?.message || 'Organization invitation could not be accepted.');
    });
    return () => { cancelled = true; };
  }, [currentUser]);

  // Billing/location counts are server-authoritative. Never grant a paid tier from local UI state.
  useEffect(() => {
    if (!userSession.isAuthenticated || userSession.userType !== 'admin' || !currentUser) return;
    let cancelled = false;
    getEnterpriseContext().then(ctx => {
      if (cancelled) return;
      const billing = ctx.billing;
      const periodEnd = billing.currentPeriodEnd || '';
      setSubscriptionState(prev => ({
        ...prev,
        currentTierId: billing.tierId || 'free-1',
        activeLocationCount: billing.activeLocationCount || Math.max(1, ctx.locations.length),
        activeEmployeeCount: employees.length,
        billingCycle: billing.billingCycle || 'monthly',
        isTrialActive: billing.status === 'trialing',
        trialDaysRemaining: billing.status === 'trialing' && periodEnd ? Math.max(0, Math.ceil((new Date(periodEnd).getTime()-Date.now())/86400000)) : 0,
        trialStartDate: prev.trialStartDate,
        trialEndDate: billing.status === 'trialing' ? periodEnd.slice(0,10) : '',
        nextBillingDate: periodEnd.slice(0,10),
      }));
    }).catch(err => console.warn('[Enterprise] Could not load server billing context:', err));
    return () => { cancelled = true; };
  }, [userSession.isAuthenticated, userSession.userType, currentUser, employees.length]);

  // Sync authSession whenever userSession from FirebaseProvider changes or updates
  useEffect(() => {
    if (userSession) {
      setAuthSession(userSession);
      if (userSession.isAuthenticated) {
        if (userSession.userType === 'admin') {
          setPortal('admin');
          if (userSession.adminRole) {
            setRbacState(prev => ({
              ...prev,
              activeRoleId: userSession.adminRole!.id
            }));
          }
        } else if (userSession.userType === 'employee') {
          setPortal('employee');
          if (userSession.employee) {
            setActiveEmployeeId(userSession.employee.id);
          }
        }
      }
    }
  }, [userSession]);

  // Handle Login Authentication
  const handleLoginSuccess = (session: AuthUserSession) => {
    setAuthSession(session);
    setCustomSession(session);
    setIsLoginModalOpen(false);

    if (session.userType === 'admin') {
      setPortal('admin');
      if (session.adminRole) {
        setRbacState(prev => ({
          ...prev,
          activeRoleId: session.adminRole!.id
        }));
      }
    } else if (session.userType === 'employee') {
      setPortal('employee');
      if (session.employee) {
        setActiveEmployeeId(session.employee.id);
      }
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (userSession.userType === 'employee') await fetch('/api/auth/employee/logout', { method: 'POST', credentials: 'include' });
    else await logOutFirebase();
    setLoginModalMode(portal === 'admin' ? 'admin' : 'employee');
    setIsLoginModalOpen(true);
  };

  // Open Login Modal with requested tab
  const handleOpenLoginModal = (mode?: AuthPortalMode) => {
    setLoginModalMode(mode || (portal === 'admin' ? 'admin' : 'employee'));
    setIsLoginModalOpen(true);
  };

  // Enterprise Modular Plugins & Licensing Manager State
  const [featureState, setFeatureState] = useState<EnterpriseFeatureManagerState>(INITIAL_FEATURE_MANAGER_STATE);

  // Performance Reviews & Integration State
  const [restaurantScore, setRestaurantScore] = useState(INITIAL_RESTAURANT_PERFORMANCE_SCORE);
  const [guestReviews, setGuestReviews] = useState(INITIAL_GUEST_REVIEWS);
  const [workforcePlatforms, setWorkforcePlatforms] = useState(INITIAL_WORKFORCE_PLATFORMS);
  const [posPlatforms, setPOSPlatforms] = useState(INITIAL_POS_PLATFORMS);
  const [workforceSyncLogs, setWorkforceSyncLogs] = useState(INITIAL_WORKFORCE_SYNC_LOGS);
  const [posServerSalesMetrics] = useState(INITIAL_POS_SERVER_METRICS);
  const [posTimeclockPunches] = useState(INITIAL_POS_TIMECLOCK_PUNCHES);

  // Computed Dates for Current 7-Day Cycle
  const weekDates = useMemo(() => generateWeekDates(), []);

  // Current active employee object
  const currentEmployee = useMemo(() => {
    if (portal === 'employee') {
      const authenticatedEmployeeId = userProfile?.employeeId || userSession.employee?.id || activeEmployeeId;
      return authenticatedEmployeeId ? employees.find(e => e.id === authenticatedEmployeeId) : undefined;
    }
    return employees.find(e => e.id === activeEmployeeId) || employees[0];
  }, [employees, activeEmployeeId, portal, userProfile?.employeeId, userSession.employee?.id]);

  // Unread notifications count
  const unreadCount = useMemo(() => {
    return announcements.filter(a => {
      const readList = a.readByEmployeeIds || a.readBy || [];
      return !readList.includes(currentEmployee?.id || '');
    }).length;
  }, [announcements, currentEmployee]);

  // ---------------- RBAC Hierarchical & Field-Level Data Scoping ----------------
  // Filter employees and mask wages if role does not permit wage viewing
  const scopedEmployees = useMemo(() => {
    if (portal !== 'admin') return employees;
    return employees
      .filter(emp => isRecordAuthorizedForRole(activeRole, emp.hierarchyPath, emp.locationId))
      .map(emp => {
        if (!activeRole.permissions.canViewWagesAndBudgets) {
          return { ...emp, hourlyWage: 0 };
        }
        return emp;
      });
  }, [employees, activeRole, portal]);

  // Filter shifts based on active role hierarchy branch
  const scopedShifts = useMemo(() => {
    if (portal !== 'admin') return shifts;
    return shifts
      .filter(s => isRecordAuthorizedForRole(activeRole, s.hierarchyPath, s.locationId))
      .map(s => {
        if (!activeRole.permissions.canViewWagesAndBudgets) {
          return { ...s, hourlyWage: 0 };
        }
        return s;
      });
  }, [shifts, activeRole, portal]);

  const scopedCandidates = useMemo(() => {
    if (portal !== 'admin') return candidates;
    return candidates.filter(c => isRecordAuthorizedForRole(activeRole, c.hierarchyPath, c.locationId));
  }, [candidates, activeRole, portal]);

  const scopedTardinessLog = useMemo(() => {
    if (portal !== 'admin') return tardinessLog;
    return tardinessLog.filter(t => isRecordAuthorizedForRole(activeRole, t.hierarchyPath, t.locationId));
  }, [tardinessLog, activeRole, portal]);

  const scopedTimeOffRequests = useMemo(() => {
    if (portal !== 'admin') return timeOffRequests;
    return timeOffRequests.filter(r => isRecordAuthorizedForRole(activeRole, r.hierarchyPath, r.locationId));
  }, [timeOffRequests, activeRole, portal]);

  const scopedShiftSwapRequests = useMemo(() => {
    if (portal !== 'admin') return shiftSwapRequests;
    return shiftSwapRequests.filter(r => isRecordAuthorizedForRole(activeRole, r.hierarchyPath, r.locationId));
  }, [shiftSwapRequests, activeRole, portal]);

  const scopedSickReports = useMemo(() => {
    if (portal !== 'admin') return sickReports;
    return sickReports.filter(r => isRecordAuthorizedForRole(activeRole, r.hierarchyPath, r.locationId));
  }, [sickReports, activeRole, portal]);

  const scopedAvailabilityRequests = useMemo(() => {
    if (portal !== 'admin') return availabilityRequests;
    return availabilityRequests.filter(r => isRecordAuthorizedForRole(activeRole, r.hierarchyPath, r.locationId));
  }, [availabilityRequests, activeRole, portal]);

  const scopedShiftSlotRequests = useMemo(() => {
    if (portal !== 'admin') return shiftSlotRequests;
    return shiftSlotRequests.filter(r => isRecordAuthorizedForRole(activeRole, r.hierarchyPath, r.locationId));
  }, [shiftSlotRequests, activeRole, portal]);

  // Immutable server-side audit event helper. The server derives actor + organization
  // from the verified Firebase token; callers cannot choose those identity fields.
  const auditAction = (action: string, entityType: string, entityId: string, metadata?: Record<string, unknown>) => {
    authenticatedFetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entityType, entityId, metadata }),
    }).catch(err => console.warn('[Audit] Event not recorded:', err));
  };

  // ---------------- Handlers ----------------

  // RBAC Role Management Handlers
  const handleSaveRole = (role: CustomRole) => {
    setRbacState(prev => {
      const idx = prev.roles.findIndex(r => r.id === role.id);
      let updatedRoles: CustomRole[];
      if (idx >= 0) {
        updatedRoles = [...prev.roles];
        updatedRoles[idx] = role;
      } else {
        updatedRoles = [...prev.roles, role];
      }
      return {
        ...prev,
        roles: updatedRoles,
        activeRoleId: role.id
      };
    });
  };

  const handleDeleteRole = (roleId: string) => {
    setRbacState(prev => ({
      ...prev,
      roles: prev.roles.filter(r => r.id !== roleId),
      activeRoleId: prev.activeRoleId === roleId ? 'role-super-admin' : prev.activeRoleId
    }));
  };

  const handleSelectActiveRole = (roleId: string) => {
    setRbacState(prev => ({
      ...prev,
      activeRoleId: roleId
    }));
  };

  // ---------------- Service Worker & Offline Sync Engine ----------------
  // Register Service Worker on initial mount
  useEffect(() => {
    registerServiceWorker();
    setOfflineQueueCount(getOfflineClockInQueue().length);
  }, []);

  // Firestore live subscriptions are owned by FirebaseProvider for core roster/schedule data.

  // Synchronize master roster & shifts to offline CacheStorage & localStorage
  useEffect(() => {
    if (employees.length > 0) {
      saveRosterToOfflineStorage(employees, shifts, 'SF Flagship Bistro #104');
    }
  }, [employees, shifts]);

  // Persisted workforce request subscriptions. These only activate for a real Firebase session
  // and are always scoped to the signed-in user's organization.
  useEffect(() => {
    const organizationId = userProfile?.organizationId;
    if (!currentUser || !organizationId || userSession.userType !== 'admin') return;

    const unsubs = [
      firestoreService.subscribeEmployees(organizationId, items => setEmployees(items)),
      firestoreService.subscribeShifts(organizationId, items => setShifts(items)),
      firestoreService.subscribeAnnouncements(organizationId, items => setAnnouncements(items)),
      firestoreService.subscribeTimeOffRequests(organizationId, items => setTimeOffRequests(items)),
      firestoreService.subscribeShiftSwapRequests(organizationId, items => setShiftSwapRequests(items)),
      firestoreService.subscribeSickReports(organizationId, items => setSickReports(items)),
      firestoreService.subscribeAvailabilityRequests(organizationId, items => setAvailabilityRequests(items)),
      firestoreService.subscribeShiftSlotRequests(organizationId, items => setShiftSlotRequests(items)),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [currentUser, userProfile?.organizationId]);

  // Employee data is loaded only from cookie-authenticated server endpoints; never from browser-wide workforce subscriptions.
  useEffect(() => {
    if (authenticatedUserType !== 'employee' || !authenticatedEmployeeId || !authenticatedOrganizationId) return;
    let cancelled = false;
    const load = async () => {
      const paths = ['/api/employee/profile', '/api/employee/shifts', '/api/employee/announcements', '/api/employee/timeOffRequests', '/api/employee/availabilityRequests', '/api/employee/shiftSwapRequests'];
      const responses = await Promise.all(paths.map(path => fetch(path, { credentials: 'include' }).then(r => r.ok ? r.json() : null)));
      if (cancelled || !responses[0]) return;
      const [profile, ownShifts, ownAnnouncements, ownTimeOff, ownAvailability, ownSwaps] = responses;
      setEmployees([profile.employee]); setShifts(ownShifts?.shifts || []); setAnnouncements(ownAnnouncements?.announcements || []); setTimeOffRequests(ownTimeOff?.timeOffRequests || []); setAvailabilityRequests(ownAvailability?.availabilityRequests || []); setShiftSwapRequests(ownSwaps?.shiftSwapRequests || []);
    };
    void load(); return () => { cancelled = true; };
  }, [authenticatedUserType, authenticatedEmployeeId, authenticatedOrganizationId]);

  // Offline Clock-in Sync Handler. A signed-in admin commits queued punches through the server;
  // the UI only clears its queue after the server confirms persistence.
  const handleSyncOfflinePunches = async (punches: OfflineClockInRecord[]) => {
    if (!punches.length || !userProfile?.organizationId) return;
    try {
      const response = await authenticatedFetch('/api/workforce/punches/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ punches: punches.map(p => ({
          id: p.id, employeeId: p.employeeId, employeeName: p.employeeName, shiftId: p.shiftId,
          type: p.punchType, timestamp: p.timestamp, isVerified: p.managerPinVerified, notes: p.managerNotes,
        })) }),
      });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Offline punch sync failed'); }
      const newTardyRecords: TardinessRecord[] = punches.map(p => ({
        id: p.id, employeeId: p.employeeId, employeeName: p.employeeName, shiftId: p.shiftId || `shift-off-${p.employeeId}`,
        shiftDate: p.dateString, scheduledStartTime: p.scheduledStartTime || p.timeString, actualClockInTime: p.timeString,
        lateMinutes: p.lateMinutes, status: p.status === 'late' ? 'late' : 'on_time',
        reason: p.managerNotes ? `Offline Synced: ${p.managerNotes}` : 'Offline punch synchronized by authenticated manager',
      }));
      setTardinessLog(prev => [...newTardyRecords, ...prev]);
      setOfflineToast(`✅ Synchronized ${punches.length} offline punches to the secured workforce ledger.`);
      setOfflineQueueCount(0);
      setTimeout(() => setOfflineToast(null), 5000);
    } catch (error: any) {
      setOfflineToast(`⚠️ Offline punches remain queued: ${error?.message || 'sync failed'}`);
      setTimeout(() => setOfflineToast(null), 6000);
      throw error;
    }
  };

  // Listen for online / offline events
  useEffect(() => {
    const handleOnlineEvent = () => {
      setIsOnline(true);
      const pendingPunches = getOfflineClockInQueue();
      if (pendingPunches.length > 0) {
        handleSyncOfflinePunches(pendingPunches);
        clearOfflineClockInQueue();
      } else {
        setOfflineToast('🟢 Internet connection restored! Workqora is online and synchronized.');
        setTimeout(() => setOfflineToast(null), 4000);
      }
    };

    const handleOfflineEvent = () => {
      setIsOnline(false);
      setOfflineToast('⚠️ Internet connection lost. Workqora Service Worker Offline Mode is active.');
      setTimeout(() => setOfflineToast(null), 6000);
    };

    window.addEventListener('online', handleOnlineEvent);
    window.addEventListener('offline', handleOfflineEvent);

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      window.removeEventListener('offline', handleOfflineEvent);
    };
  }, [employees, shifts]);

  // Shift Management
  const handleAddShift = (newShift: Omit<Shift, 'id'>) => {
    const shift: Shift = {
      organizationId: newShift.organizationId || userProfile?.organizationId || 'org-demo-unassigned',
      hierarchyPath: newShift.hierarchyPath || 'Workqora Global > North America > Pacific Coast > Bay Area District > SF Flagship Bistro #104',
      locationId: newShift.locationId || 'loc-sf-flagship-104',
      districtId: newShift.districtId || 'dist-bay-area-01',
      regionId: newShift.regionId || 'reg-pacific-coast-01',
      ...newShift,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setShifts(prev => [...prev, shift]);
    firestoreService.createShift(shift).catch(err => console.warn('[Workforce API] Shift create:', err));
  };

  const handleAddBatchShifts = (newShiftsList: Omit<Shift, 'id'>[]) => {
    const createdShifts: Shift[] = newShiftsList.map((newShift, idx) => ({
      organizationId: newShift.organizationId || userProfile?.organizationId || 'org-demo-unassigned',
      hierarchyPath: newShift.hierarchyPath || 'Workqora Global > North America > Pacific Coast > Bay Area District > SF Flagship Bistro #104',
      locationId: newShift.locationId || 'loc-sf-flagship-104',
      districtId: newShift.districtId || 'dist-bay-area-01',
      regionId: newShift.regionId || 'reg-pacific-coast-01',
      ...newShift,
      id: `shift-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    }));

    setShifts(prev => [...prev, ...createdShifts]);
    createdShifts.forEach(shift => {
      firestoreService.createShift(shift).catch(err => console.warn('[Workforce API] Batch shift create:', err));
    });

    setOfflineToast(`📸 Successfully added ${createdShifts.length} verified shifts to live schedule from AI Paper Scan!`);
    setTimeout(() => setOfflineToast(null), 5000);
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    firestoreService.updateShift(updatedShift).catch(err => console.warn('[Workforce API] Shift update:', err));
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    firestoreService.deleteShift(shiftId).catch(err => console.warn('[Workforce API] Shift delete:', err));
  };

  // Shift Templates Management
  const handleSaveTemplate = (template: ShiftTemplate) => {
    setShiftTemplates(prev => {
      const idx = prev.findIndex(t => t.id === template.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = template;
        return updated;
      }
      return [template, ...prev];
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    setShiftTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleApplyTemplateToShift = (template: ShiftTemplate, employeeId: string, dateStr: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    const newShift: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: template.department || emp.department,
      role: template.role || emp.role,
      date: dateStr,
      startTime: template.startTime,
      endTime: template.endTime,
      breakMinutes: template.breakMinutes,
      hourlyWage: emp.hourlyWage,
      status: 'draft',
      color: template.color || emp.color,
      notes: template.notes,
      organizationId: emp.organizationId || userProfile?.organizationId || 'org-demo-unassigned',
      hierarchyPath: emp.hierarchyPath || 'Workqora Global > North America > Pacific Coast > Bay Area District > SF Flagship Bistro #104',
      locationId: emp.locationId || 'loc-sf-flagship-104',
      districtId: emp.districtId || 'dist-bay-area-01',
      regionId: emp.regionId || 'reg-pacific-coast-01',
    };
    setShifts(prev => [...prev, newShift]);
    firestoreService.createShift(newShift).catch(err => console.warn('[Workforce API] Shift template create:', err));
  };

  // Employee Management (Scalable up to 1,000)
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const emp: Employee = {
      organizationId: newEmp.organizationId || userProfile?.organizationId || 'org-demo-unassigned',
      hierarchyPath: newEmp.hierarchyPath || 'Workqora Global > North America > Pacific Coast > Bay Area District > SF Flagship Bistro #104',
      locationId: newEmp.locationId || 'loc-sf-flagship-104',
      districtId: newEmp.districtId || 'dist-bay-area-01',
      regionId: newEmp.regionId || 'reg-pacific-coast-01',
      ...newEmp,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [...prev, emp]);
    firestoreService.saveEmployee(emp).catch(err => console.warn('[Firestore] Employee save:', err));
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
    firestoreService.saveEmployee(updatedEmp).catch(err => console.warn('[Firestore] Employee update:', err));
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees(prev => prev.filter(e => e.id !== empId));
    firestoreService.deleteEmployee(empId).catch(err => console.warn('[Firestore] Employee delete:', err));
  };

  const handleBulkScaleEmployees = (targetCount: number) => {
    const pool = generateLargeEmployeePool(targetCount);
    setEmployees(pool);
  };

  // Announcements (Admin Only)
  const handleCreateAnnouncement = (ann: Omit<Announcement, 'id' | 'createdAt' | 'readByEmployeeIds'>) => {
    const newAnnouncement: Announcement = {
      ...ann,
      organizationId: userProfile?.organizationId || 'org-demo-unassigned',
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      publishedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      readByEmployeeIds: [],
      readBy: [],
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    firestoreService.saveAnnouncement(newAnnouncement).catch(err => console.warn('[Firestore] Announcement save:', err));

    // Build dispatch records
    const dispatches: NotificationDispatch[] = employees.map(emp => ({
      id: `disp-ann-${Date.now()}-${emp.id}`,
      recipientEmployeeId: emp.id,
      recipientName: emp.name,
      recipientPhone: emp.phone,
      recipientEmail: emp.email,
      type: 'announcement',
      title: ann.title,
      message: ann.content,
      channels: ann.channels,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'preview_not_sent',
    }));
    setNotificationDispatches(prev => [...dispatches, ...prev]);
  };

  const handleAcknowledgeAnnouncement = (announcementId: string, employeeId: string) => {
    setAnnouncements(prev => prev.map(a => {
      const readList = a.readByEmployeeIds || a.readBy || [];
      if (a.id === announcementId && !readList.includes(employeeId)) {
        const updated = [...readList, employeeId];
        return { ...a, readByEmployeeIds: updated, readBy: updated };
      }
      return a;
    }));
  };

  // Schedule Broadcast Complete
  const handleBroadcastComplete = (dispatches: NotificationDispatch[]) => {
    setNotificationDispatches(prev => [...dispatches, ...prev]);
    // Mark all shifts as published
    setShifts(prev => prev.map(s => ({ ...s, status: 'published' })));
  };

  // Clock In and Tardiness Logging
  const handleClockIn = (shift: Shift, lateMinutes: number, status: 'on_time' | 'late') => {
    const now = new Date();
    const actualTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record: TardinessRecord = {
      id: `tardy-${Date.now()}`,
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      shiftId: shift.id,
      shiftDate: shift.date,
      scheduledStartTime: shift.startTime,
      actualClockInTime: actualTime,
      lateMinutes,
      status,
      reason: lateMinutes > 0 ? 'Traffic delay reported upon arrival' : undefined,
    };
    setTardinessLog(prev => [record, ...prev]);
  };

  // 24-Hour WhatsApp / SMS Pre-Shift Trigger
  const handleTrigger24HrReminder = (shift: Shift, emp: Employee, channel?: 'whatsapp' | 'sms') => {
    const channelsToUse: ('whatsapp' | 'sms' | 'app')[] = channel
      ? [channel]
      : schedulerConfig.channels24Hr;

    const message = `🍽️ *Workqora 24-Hour Shift Reminder*\nHi *${emp.name}*, your next shift as *${shift.role}* (${shift.department}) starts tomorrow at *${shift.startTime}* on *${shift.date}*.\n\n📍 Station: ${shift.notes || 'Main Dining & Station Readiness'}\n⏳ Need a swap or adjustment? Submit via Workqora employee portal at least 12h prior.\nReply CONFIRM to acknowledge receipt.`;

    const dispatch: NotificationDispatch = {
      id: `disp-24h-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmployeeId: emp.id,
      recipientName: emp.name,
      recipientPhone: emp.phone,
      recipientEmail: emp.email,
      type: 'shift_24hr_reminder',
      title: `💬 24-Hour Shift Reminder: ${shift.role} at ${shift.startTime}`,
      message,
      channels: channelsToUse,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'preview_not_sent',
      metadata: {
        shiftId: shift.id,
        shiftDate: shift.date,
        shiftStartTime: shift.startTime,
        role: shift.role,
        department: shift.department,
        isAutomatedCron: false,
        whatsappMessageSid: `WA_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    };

    setNotificationDispatches(prev => [dispatch, ...prev]);
    setSchedulerConfig(prev => ({
      ...prev,
      totalAutoSentCount: prev.totalAutoSentCount + 1,
      lastRunTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));
  };

  const handleTrigger1HrAlert = (shift: Shift, emp: Employee) => {
    const dispatch: NotificationDispatch = {
      id: `disp-1hr-${Date.now()}`,
      recipientEmployeeId: emp.id,
      recipientName: emp.name,
      recipientPhone: emp.phone,
      recipientEmail: emp.email,
      type: 'shift_1hr_countdown',
      title: '⏰ Shift Reminder: Starting in 1 Hour',
      message: `Hi ${emp.name}, your shift at ${shift.startTime} starts in 1 hour. Please prepare uniform and station readiness.`,
      channels: schedulerConfig.channels1Hr,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'preview_not_sent',
      metadata: {
        shiftId: shift.id,
        shiftDate: shift.date,
        shiftStartTime: shift.startTime,
      },
    };
    setNotificationDispatches(prev => [dispatch, ...prev]);
    setSchedulerConfig(prev => ({
      ...prev,
      totalAutoSentCount: prev.totalAutoSentCount + 1,
      lastRunTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));
  };

  // Run Scheduled Scan over upcoming shifts to generate automated 24h & 1h dispatches
  const handleRunScheduledReminderScan = async (forceAll: boolean = false) => {
    setIsScanningReminders(true);
    try {
      // Attempt backend API dispatch trigger
      const response = await authenticatedFetch('/api/scheduler/trigger-shift-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shifts,
          employees,
          config: schedulerConfig,
          forceAll,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newDispatches && Array.isArray(data.newDispatches) && data.newDispatches.length > 0) {
          setNotificationDispatches(prev => [...data.newDispatches, ...prev]);
          setSchedulerConfig(prev => ({
            ...prev,
            totalAutoSentCount: prev.totalAutoSentCount,
            lastRunTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          }));
          return data.newDispatches.length;
        }
      }
    } catch {
      // Client-side fallback if offline/mock
      const newlyDispatched: NotificationDispatch[] = [];
      const now = new Date();
      const existingShiftDispatches = new Set(
        notificationDispatches
          .filter(d => d.type === 'shift_24hr_reminder')
          .map(d => `${d.recipientEmployeeId}_${d.metadata?.shiftDate}_${d.metadata?.shiftStartTime}`)
      );

      shifts.forEach(shift => {
        const emp = employees.find(e => e.id === shift.employeeId);
        if (!emp) return;
        const key = `${emp.id}_${shift.date}_${shift.startTime}`;

        if (forceAll || !existingShiftDispatches.has(key)) {
          existingShiftDispatches.add(key);
          newlyDispatched.push({
            id: `disp-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            recipientEmployeeId: emp.id,
            recipientName: emp.name,
            recipientPhone: emp.phone,
            recipientEmail: emp.email,
            type: 'shift_24hr_reminder',
            title: `💬 24-Hour Shift Reminder: ${shift.role} at ${shift.startTime}`,
            message: `🍽️ *Workqora 24-Hour Shift Reminder*\nHi *${emp.name}*, your next shift as *${shift.role}* (${shift.department}) starts tomorrow at *${shift.startTime}* on *${shift.date}*.\n\n📍 Station: ${shift.notes || 'Main Dining & Station Readiness'}\nReply CONFIRM to acknowledge receipt.`,
            channels: schedulerConfig.channels24Hr,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            status: 'preview_not_sent',
            metadata: {
              shiftId: shift.id,
              shiftDate: shift.date,
              shiftStartTime: shift.startTime,
              role: shift.role,
              department: shift.department,
              isAutomatedCron: true,
              whatsappMessageSid: `WA_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            },
          });
        }
      });

      if (newlyDispatched.length > 0) {
        setNotificationDispatches(prev => [...newlyDispatched, ...prev]);
        setSchedulerConfig(prev => ({
          ...prev,
          totalAutoSentCount: prev.totalAutoSentCount,
          lastRunTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        }));
        return newlyDispatched.length;
      }
    } finally {
      setIsScanningReminders(false);
    }
    return 0;
  };

  // Automated Daemon Timer for periodic 24-hour reminder audit
  useEffect(() => {
    if (!schedulerConfig.isDaemonActive) return;

    const intervalMs = Math.max(10, schedulerConfig.autoTriggerIntervalSeconds) * 1000;
    const interval = setInterval(() => {
      // Auto trigger scan silently
      handleRunScheduledReminderScan(false);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [schedulerConfig.isDaemonActive, schedulerConfig.autoTriggerIntervalSeconds, shifts, employees]);

  // Time-Off Requests
  const handleSubmitTimeOff = (req: Omit<TimeOffRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: TimeOffRequest = {
      ...req,
      organizationId: userProfile?.organizationId,
      hierarchyPath: currentEmployee?.hierarchyPath,
      locationId: currentEmployee?.locationId,
      id: `to-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'pending',
    };
    setTimeOffRequests(prev => [newReq, ...prev]);
    firestoreService.saveTimeOffRequest(newReq).catch(err => console.warn('[Firestore] Time-off save:', err));
    auditAction('submit_time_off', 'timeOffRequest', newReq.id);
  };

  const handleApproveTimeOff = (id: string, notes?: string) => {
    auditAction('approve_time_off', 'timeOffRequest', id);
    setTimeOffRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, status: 'approved' as const, reviewNotes: notes, reviewedBy: authSession.displayName };
      firestoreService.saveTimeOffRequest(updated).catch(err => console.warn('[Firestore] Time-off approval:', err));
      return updated;
    }));
  };

  const handleRejectTimeOff = (id: string, notes?: string) => {
    auditAction('reject_time_off', 'timeOffRequest', id);
    setTimeOffRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, status: 'rejected' as const, reviewNotes: notes, reviewedBy: authSession.displayName };
      firestoreService.saveTimeOffRequest(updated).catch(err => console.warn('[Firestore] Time-off rejection:', err));
      return updated;
    }));
  };

  // Shift Swaps
  const handleSubmitShiftSwap = (swap: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'peerApprovalStatus' | 'adminApprovalStatus'>) => {
    const newSwap: ShiftSwapRequest = {
      ...swap,
      organizationId: userProfile?.organizationId,
      hierarchyPath: currentEmployee?.hierarchyPath,
      locationId: currentEmployee?.locationId,
      id: `swap-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      peerApprovalStatus: 'accepted',
      adminApprovalStatus: 'pending',
    };
    setShiftSwapRequests(prev => [newSwap, ...prev]);
    firestoreService.saveShiftSwapRequest(newSwap).catch(err => console.warn('[Firestore] Shift-swap save:', err));
    auditAction('submit_shift_swap', 'shiftSwapRequest', newSwap.id);
  };

  const handleApproveShiftSwap = (id: string, notes?: string) => {
    auditAction('approve_shift_swap', 'shiftSwapRequest', id);
    const swap = shiftSwapRequests.find(s => s.id === id);
    if (swap) {
      // Reassign shift in calendar
      setShifts(prev => prev.map(s => {
        if (s.id === swap.requesterShiftId) {
          const targetEmp = employees.find(e => e.id === swap.targetEmployeeId);
          if (targetEmp) {
            return {
              ...s,
              employeeId: targetEmp.id,
              employeeName: targetEmp.name,
              color: targetEmp.color,
            };
          }
        }
        return s;
      }));
    }

    setShiftSwapRequests(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, adminApprovalStatus: 'approved' as const, adminNotes: notes };
      firestoreService.saveShiftSwapRequest(updated).catch(err => console.warn('[Firestore] Swap approval:', err));
      return updated;
    }));
  };

  const handleRejectShiftSwap = (id: string, notes?: string) => {
    auditAction('reject_shift_swap', 'shiftSwapRequest', id);
    setShiftSwapRequests(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, adminApprovalStatus: 'rejected' as const, adminNotes: notes };
      firestoreService.saveShiftSwapRequest(updated).catch(err => console.warn('[Firestore] Swap rejection:', err));
      return updated;
    }));
  };

  // Sick Day Reports
  const handleSubmitSickReport = (report: any) => {
    const newReport: SickDayReport = {
      ...report,
      organizationId: userProfile?.organizationId,
      hierarchyPath: currentEmployee?.hierarchyPath,
      locationId: currentEmployee?.locationId,
      id: `sick-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      needsImmediateCoverage: true,
      status: 'reported',
    };
    setSickReports(prev => [newReport, ...prev]);
    firestoreService.saveSickReport(newReport).catch(err => console.warn('[Firestore] Sick report save:', err));
    auditAction('submit_sick_report', 'sickReport', newReport.id);
  };

  const handleAcknowledgeSickReport = (id: string, coverageEmployeeId?: string) => {
    auditAction('approve_sick_coverage', 'sickReport', id, { coverageEmployeeId: coverageEmployeeId || null });
    const report = sickReports.find(r => r.id === id);
    if (report && coverageEmployeeId) {
      const coverEmp = employees.find(e => e.id === coverageEmployeeId);
      if (coverEmp) {
        // Reassign the shift to coverage employee
        setShifts(prev => prev.map(s => {
          if (s.id === report.shiftId) {
            return {
              ...s,
              employeeId: coverEmp.id,
              employeeName: coverEmp.name,
              color: coverEmp.color,
              notes: `Covering for ${report.employeeName} (Sick leave)`,
            };
          }
          return s;
        }));
      }
    }

    setSickReports(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, status: 'covered' as const, coverageEmployeeId };
      firestoreService.saveSickReport(updated).catch(err => console.warn('[Firestore] Sick report update:', err));
      return updated;
    }));
  };

  // Availability Changes
  const handleSubmitAvailability = (avail: Omit<AvailabilityRequest, 'id' | 'createdAt' | 'status'>) => {
    const newAvail: AvailabilityRequest = {
      ...avail,
      organizationId: userProfile?.organizationId,
      hierarchyPath: currentEmployee?.hierarchyPath,
      locationId: currentEmployee?.locationId,
      id: `avail-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'pending',
    };
    setAvailabilityRequests(prev => [newAvail, ...prev]);
    firestoreService.saveAvailabilityRequest(newAvail).catch(err => console.warn('[Firestore] Availability save:', err));
    auditAction('submit_availability', 'availabilityRequest', newAvail.id);
  };

  const handleApproveAvailability = (id: string) => {
    auditAction('approve_availability', 'availabilityRequest', id);
    setAvailabilityRequests(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, status: 'approved' as const, reviewedBy: authSession.displayName };
      firestoreService.saveAvailabilityRequest(updated).catch(err => console.warn('[Firestore] Availability approval:', err));
      return updated;
    }));
  };

  const handleRejectAvailability = (id: string) => {
    auditAction('reject_availability', 'availabilityRequest', id);
    setAvailabilityRequests(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, status: 'rejected' as const, reviewedBy: authSession.displayName };
      firestoreService.saveAvailabilityRequest(updated).catch(err => console.warn('[Firestore] Availability rejection:', err));
      return updated;
    }));
  };

  // Candidate & HR Management
  const handleUpdateCandidateStage = (id: string, stage: OnboardingCandidate['stage']) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
  };

  const handleToggleDocument = (id: string, doc: keyof OnboardingCandidate['documents']) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          documents: {
            ...c.documents,
            [doc]: !c.documents[doc],
          },
        };
      }
      return c;
    }));
  };

  const handleAddCandidate = (cand: Omit<OnboardingCandidate, 'id' | 'appliedAt'>) => {
    const newCand: OnboardingCandidate = {
      ...cand,
      id: `cand-${Date.now()}`,
      appliedAt: new Date().toISOString().slice(0, 10),
    };
    setCandidates(prev => [newCand, ...prev]);
  };

  // Shift Slot Claims & Priority Contention Management
  const handleSubmitShiftSlot = (req: Omit<ShiftSlotRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: ShiftSlotRequest = {
      ...req,
      organizationId: userProfile?.organizationId,
      hierarchyPath: currentEmployee?.hierarchyPath,
      locationId: currentEmployee?.locationId,
      id: `slot-req-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'pending',
    };
    const updatedSlotRequests = [...shiftSlotRequests, newReq];
    setShiftSlotRequests(updatedSlotRequests);
    firestoreService.saveShiftSlotRequest(newReq).catch(err => console.warn('[Firestore] Shift-slot save:', err));
    auditAction('submit_shift_slot', 'shiftSlotRequest', newReq.id);

    // Detect if this created a collision/contention
    const contentions = detectShiftSlotContentions(
      updatedSlotRequests,
      employees,
      shifts,
      availabilityRequests,
      tardinessLog
    );

    // If contention detected for this slot, dispatch immediate admin alert
    const matchedContention = contentions.find(c =>
      c.contentionKey === `${req.date}_${req.startTime}-${req.endTime}_${req.role}_${req.department}` ||
      (req.shiftId && c.contentionKey === `shift_${req.shiftId}`)
    );
    if (matchedContention && matchedContention.contenderEmployeeIds.length > 1) {
      const dispatch = generateContentionNotificationDispatch(matchedContention);
      setNotificationDispatches(prev => [dispatch, ...prev]);
    }
  };

  const handleApproveShiftSlot = (requestId: string, autoRejectContenders: boolean = false) => {
    auditAction('approve_shift_slot', 'shiftSlotRequest', requestId);
    const targetReq = shiftSlotRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    // Create or assign the shift in calendar
    const emp = employees.find(e => e.id === targetReq.employeeId);
    if (emp) {
      const newShift: Shift = {
        id: `shift-claimed-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: targetReq.date,
        startTime: targetReq.startTime,
        endTime: targetReq.endTime,
        role: targetReq.role,
        department: targetReq.department,
        hourlyWage: emp.hourlyWage,
        color: emp.color,
        breakMinutes: 30,
        notes: `Claimed via Shift Slot Request (${targetReq.reason || 'Direct pickup'})`,
        status: 'published',
        organizationId: targetReq.organizationId || userProfile?.organizationId,
        hierarchyPath: targetReq.hierarchyPath || emp.hierarchyPath,
        locationId: targetReq.locationId || emp.locationId,
      };
      setShifts(prev => [...prev, newShift]);
    }

    setShiftSlotRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updated = { ...r, status: 'approved' as const };
        firestoreService.saveShiftSlotRequest(updated).catch(err => console.warn('[Firestore] Shift-slot approval:', err));
        return updated;
      }
      if (autoRejectContenders &&
          r.date === targetReq.date &&
          r.startTime === targetReq.startTime &&
          r.endTime === targetReq.endTime &&
          r.role === targetReq.role &&
          r.department === targetReq.department &&
          r.status === 'pending') {
        const updated = { ...r, status: 'rejected' as const };
        firestoreService.saveShiftSlotRequest(updated).catch(err => console.warn('[Firestore] Shift-slot auto-reject:', err));
        return updated;
      }
      return r;
    }));
  };

  const handleRejectShiftSlot = (requestId: string) => {
    auditAction('reject_shift_slot', 'shiftSlotRequest', requestId);
    setShiftSlotRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const updated = { ...r, status: 'rejected' as const };
      firestoreService.saveShiftSlotRequest(updated).catch(err => console.warn('[Firestore] Shift-slot rejection:', err));
      return updated;
    }));
  };

  const handleResolveContentionWithPriority = (contention: ShiftSlotContention, chosenCandidateEmployeeId: string) => {
    const chosenAnalysis = contention.analysis.find(a => a.employeeId === chosenCandidateEmployeeId);
    if (!chosenAnalysis) return;

    // Approve the chosen contender's request and assign shift, reject other contenders
    handleApproveShiftSlot(chosenAnalysis.requestId, true);

    // Create a resolution notification dispatch for records
    const dispatch: NotificationDispatch = {
      id: `disp-resolved-${Date.now()}`,
      recipientEmployeeId: chosenCandidateEmployeeId,
      recipientName: chosenAnalysis.employeeName,
      recipientPhone: employees.find(e => e.id === chosenCandidateEmployeeId)?.phone || 'N/A',
      recipientEmail: employees.find(e => e.id === chosenCandidateEmployeeId)?.email || 'N/A',
      type: 'shift_slot_contention',
      title: `✅ Priority Assignment Confirmed: ${chosenAnalysis.employeeName}`,
      message: `Admin resolved shift contention for ${contention.date} (${contention.startTime} - ${contention.endTime}). Awarded to ${chosenAnalysis.employeeName} based on Priority Score (${chosenAnalysis.priorityScore}/100).`,
      channels: ['app', 'sms'],
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'preview_not_sent',
      metadata: {
        shiftDate: contention.date,
        shiftStartTime: contention.startTime,
        role: contention.role,
        department: contention.department,
      }
    };
    setNotificationDispatches(prev => [dispatch, ...prev]);
  };

  // Business Email Integration Handlers
  const handleSendEmailMessage = async (msgData: Partial<EmailMessage>) => {
    const newMsg: EmailMessage = {
      id: `msg-sent-${Date.now()}`,
      organizationId: userProfile?.organizationId || 'org-workqora-primary',
      locationId: msgData.locationId || 'loc-sf-flagship',
      connectionId: msgData.connectionId || emailConnections[0]?.id || 'conn-org-google',
      threadId: msgData.threadId || `thread-${Date.now()}`,
      providerMessageId: `prov-msg-sent-${Date.now()}`,
      from: msgData.from || { name: 'Workqora Operations', email: 'operations@workqora-hospitality.com' },
      to: msgData.to || [],
      cc: msgData.cc,
      bcc: msgData.bcc,
      subject: msgData.subject || 'No Subject',
      snippet: (msgData.bodyText || '').slice(0, 120),
      bodyText: msgData.bodyText || '',
      bodyHtml: msgData.bodyHtml,
      date: new Date().toISOString(),
      isRead: true,
      isStarred: false,
      isArchived: false,
      isDraft: msgData.isDraft || false,
      isSent: !msgData.isDraft,
      folder: msgData.isDraft ? 'drafts' : 'sent',
      category: msgData.category || 'operations',
      labels: msgData.labels || ['Sent'],
      attachments: msgData.attachments || []
    };

    setEmailMessages(prev => [newMsg, ...prev]);

    const auditEvent: EmailAuditEvent = {
      id: `audit-em-${Date.now()}`,
      organizationId: newMsg.organizationId,
      locationId: newMsg.locationId,
      actorName: userProfile?.displayName || currentEmployee?.name || 'Administrator',
      actorRole: userProfile?.role || 'Operations Manager',
      action: msgData.isDraft ? 'Draft Saved' : 'Email Sent',
      details: `${msgData.isDraft ? 'Saved draft' : 'Dispatched email'} "${newMsg.subject}" to ${newMsg.to.map(t => t.email).join(', ')}`,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    setEmailAuditLogs(prev => [auditEvent, ...prev]);

    try {
      await fetch('/api/email/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
    } catch (e) {
      console.warn('Backend email send fallback:', e);
    }
  };

  const handleUpdateEmailMessage = async (id: string, updates: Partial<EmailMessage>) => {
    setEmailMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    try {
      await fetch(`/api/email/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Backend email update fallback:', e);
    }
  };

  const handleDeleteEmailMessage = async (id: string) => {
    setEmailMessages(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m));
    try {
      await fetch(`/api/email/messages/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend email delete fallback:', e);
    }
  };

  const handleAddEmailConnection = async (connData: Partial<BusinessEmailConnection>) => {
    const newConn: BusinessEmailConnection = {
      id: `conn-${Date.now()}`,
      organizationId: userProfile?.organizationId || 'org-workqora-primary',
      locationId: connData.locationId,
      departmentId: connData.departmentId,
      scopeLevel: connData.scopeLevel || 'location',
      provider: connData.provider || 'google',
      emailAddress: connData.emailAddress || 'mailbox@workqora-hospitality.com',
      displayName: connData.displayName || 'Business Mailbox',
      category: connData.category || 'general',
      connectionStatus: 'connected',
      scopes: connData.scopes || ['Mail.Read', 'Mail.Send'],
      isDefaultOrgSender: connData.isDefaultOrgSender,
      isDefaultLocationSender: connData.isDefaultLocationSender,
      autoSyncIntervalMinutes: connData.autoSyncIntervalMinutes || 15,
      lastSyncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imapHost: connData.imapHost,
      imapPort: connData.imapPort,
      smtpHost: connData.smtpHost,
      smtpPort: connData.smtpPort
    };

    setEmailConnections(prev => [...prev, newConn]);

    const auditEvent: EmailAuditEvent = {
      id: `audit-conn-${Date.now()}`,
      organizationId: newConn.organizationId,
      locationId: newConn.locationId,
      actorName: userProfile?.displayName || 'Administrator',
      actorRole: userProfile?.role || 'Super Admin',
      action: 'Account Connected',
      details: `Connected ${newConn.provider.toUpperCase()} mailbox: ${newConn.emailAddress} (${newConn.scopeLevel})`,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    setEmailAuditLogs(prev => [auditEvent, ...prev]);

    try {
      await fetch('/api/email/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn)
      });
    } catch (e) {
      console.warn('Backend add connection fallback:', e);
    }
  };

  const handleUpdateEmailConnection = async (id: string, updates: Partial<BusinessEmailConnection>) => {
    setEmailConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    try {
      await fetch(`/api/email/connections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn('Backend update connection fallback:', e);
    }
  };

  const handleDeleteEmailConnection = async (id: string) => {
    setEmailConnections(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/email/connections/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend delete connection fallback:', e);
    }
  };

  const handleSyncEmailConnection = async (id: string) => {
    setEmailConnections(prev => prev.map(c => c.id === id ? { ...c, lastSyncedAt: new Date().toISOString() } : c));
    const auditEvent: EmailAuditEvent = {
      id: `audit-sync-${Date.now()}`,
      organizationId: userProfile?.organizationId || 'org-workqora-primary',
      actorName: userProfile?.displayName || 'Administrator',
      actorRole: userProfile?.role || 'Super Admin',
      action: 'Sync Triggered',
      details: `Manual sync completed for mailbox ${id}`,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    setEmailAuditLogs(prev => [auditEvent, ...prev]);
    try {
      await fetch(`/api/email/connections/${id}/sync`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend sync connection fallback:', e);
    }
  };

  const handleConvertEmailAction = (actionPayload: any) => {
    if (actionPayload.actionType === 'task') {
      const newAnn: Announcement = {
        id: `ann-email-${Date.now()}`,
        title: actionPayload.title,
        content: actionPayload.description,
        authorName: 'Email Dispatch Assistant',
        authorRole: 'Automated Operations',
        targetDepartment: 'all',
        priority: 'urgent',
        channels: ['app', 'sms'],
        publishedAt: new Date().toISOString()
      };
      setAnnouncements(prev => [newAnn, ...prev]);
      setActiveTab('announcements');
    } else if (actionPayload.actionType === 'shift' || actionPayload.actionType === 'meeting') {
      setActiveTab('schedule');
    } else if (actionPayload.actionType === 'hiring') {
      if (actionPayload.prefilledData?.name) {
        const newCandidate: OnboardingCandidate = {
          id: `cand-email-${Date.now()}`,
          name: actionPayload.prefilledData.name,
          role: (actionPayload.prefilledData.role as RestaurantRole) || 'Server',
          department: (actionPayload.prefilledData.department as Department) || 'Front of House',
          email: actionPayload.prefilledData.email || 'candidate@example.com',
          phone: actionPayload.prefilledData.phone || '(555) 010-9988',
          stage: 'applied',
          appliedAt: new Date().toISOString(),
          documents: {
            i9Verified: false,
            foodHandlerCertified: false,
            alcoholCardCertified: false,
            directDeposit: false,
            uniformAssigned: false
          },
          interviewScore: 85,
          interviewNotes: 'Imported from incoming email application'
        };
        setCandidates(prev => [newCandidate, ...prev]);
      }
      setActiveTab('hr_payroll');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col antialiased selection:bg-sky-200 selection:text-sky-900 font-sans max-w-full overflow-x-hidden">

      {/* Top Main Navigation Bar */}
      <Navbar
        portal={portal}
        onPortalChange={setPortal}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        totalEmployees={employees.length}
        unreadNotificationsCount={unreadCount}
        onOpenPricing={() => setIsPricingModalOpen(true)}
        onOpenAIAssistant={() => setIsAIDrawerOpen(true)}
        onOpenFeatureManager={() => setIsFeatureManagerOpen(true)}
        onOpenPaymentPortal={() => {
          setPaymentPortalItem(undefined);
          setIsPaymentPortalOpen(true);
        }}
        onOpenRBAC={() => setIsRBACModalOpen(true)}
        rbacState={rbacState}
        onSelectActiveRole={handleSelectActiveRole}
        featureState={featureState}
        notificationDispatches={notificationDispatches}
        subscriptionState={subscriptionState}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
        offlineQueueCount={offlineQueueCount}
        authSession={authSession}
        onOpenLoginModal={handleOpenLoginModal}
        onLogout={handleLogout}
      />

      {/* Offline Toast Notification */}
      {offlineToast && (
        <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>{offlineToast}</span>
            </div>
            <button
              onClick={() => setOfflineToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full overflow-x-hidden">

        {/* Offline Mode Emergency Banner (when offline or simulated) */}
        {(!isOnline || isSimulatedOffline) && (
          <div className="mb-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-white">Workqora Service Worker Offline Mode Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                    Local Cache Online
                  </span>
                  {offlineQueueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-bold">
                      {offlineQueueCount} Punches Queued
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Internet connection is interrupted or simulated. Full employee rosters, shifts, and manager clock-in verification are 100% operational locally.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsOfflineModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Offline Roster &amp; Clock-In</span>
              </button>
              {isSimulatedOffline && (
                <button
                  onClick={() => setIsSimulatedOffline(false)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all cursor-pointer"
                >
                  End Outage Sim
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Role Simulation / Hierarchy Scope Notice Bar (Admin Portal) */}
        {portal === 'admin' && activeRole && activeRole.id !== 'role-super-admin' && (
          <div className="mb-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-indigo-950">{activeRole.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/70 text-indigo-800 font-semibold uppercase tracking-wider">
                    {activeRole.hierarchyScopeLevel} Level
                  </span>
                  {!activeRole.permissions.canViewWagesAndBudgets && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      🔒 Wages Masked
                    </span>
                  )}
                  {!activeRole.permissions.canEditSchedules && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                      👁️ Read-Only Scope
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-indigo-700/90 mt-0.5">
                  Hierarchy Filter: <span className="font-semibold">{activeRole.assignedHierarchyPath}</span> • Showing {scopedEmployees.length} staff members and {scopedShifts.length} shifts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleSelectActiveRole('role-super-admin')}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Reset to Super Admin
              </button>
              <button
                onClick={() => setIsRBACModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Manage Roles
              </button>
            </div>
          </div>
        )}

        {/* Pre-Shift Countdown & 1-Hour Warning Banner */}
        {currentEmployee && (
          <ShiftCountdownBanner
            currentEmployee={currentEmployee}
            shifts={shifts}
            currentLanguage={currentLanguage}
            onClockIn={handleClockIn}
            onTrigger1HrAlert={handleTrigger1HrAlert}
            onTrigger24HrReminder={handleTrigger24HrReminder}
          />
        )}

        {/* Dynamic Tab Views based on Portal and Tab selection */}

        {/* 0A. Workqora AI Command Center (Autonomous Operations Centerpiece) */}
        {activeTab === 'command_center' && portal === 'admin' && (
          <AICommandCenterView
            shifts={scopedShifts}
            employees={scopedEmployees}
            onOpenAutoFill={() => setIsAIDrawerOpen(true)}
            onOpenTemplateModal={() => {}}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 0B. Workqora Intelligence Agent (Proactive Cross-Module Insights & Optimization) */}
        {activeTab === 'intelligence_agent' && portal === 'admin' && (
          <WorkqoraIntelligenceAgentView
            shifts={scopedShifts}
            employees={scopedEmployees}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 0C. Workqora Enterprise Multi-Location Hub */}
        {activeTab === 'enterprise' && portal === 'admin' && (
          <EnterpriseCommandHubView />
        )}

        {/* 1. Schedule Calendar View (Admin & Employee) */}
        {activeTab === 'schedule' && (
          portal === 'admin' ? (
            <ScheduleCalendarView
              shifts={scopedShifts}
              employees={scopedEmployees}
              weekDates={weekDates}
              currentLanguage={currentLanguage}
              templates={shiftTemplates}
              onAddShift={handleAddShift}
              onAddBatchShifts={handleAddBatchShifts}
              onUpdateShift={handleUpdateShift}
              onDeleteShift={handleDeleteShift}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onOpenAIOptimizer={() => setIsAIDrawerOpen(true)}
              onOpenRemindersScheduler={() => setIsRemindersModalOpen(true)}
              onSaveTemplate={handleSaveTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onApplyTemplateToShift={handleApplyTemplateToShift}
              departmentBudgets={departmentBudgets}
              onUpdateDepartmentBudgets={setDepartmentBudgets}
            />
          ) : (
            <EmployeeSelfServiceView
              currentEmployee={currentEmployee}
              employees={employees}
              shifts={shifts}
              shiftSlotRequests={shiftSlotRequests}
              timeOffRequests={timeOffRequests}
              shiftSwapRequests={shiftSwapRequests}
              sickReports={sickReports}
              tardinessLog={tardinessLog}
              currentLanguage={currentLanguage}
              weekDates={weekDates}
              onSelectEmployee={setActiveEmployeeId}
              onSubmitTimeOff={handleSubmitTimeOff}
              onSubmitShiftSwap={handleSubmitShiftSwap}
              onSubmitSickReport={handleSubmitSickReport}
              onSubmitAvailability={handleSubmitAvailability}
              onSubmitShiftSlot={handleSubmitShiftSlot}
            />
          )
        )}

        {/* 2. Employee Directory View */}
        {activeTab === 'employees' && (
          <EmployeeManagementView
            employees={scopedEmployees}
            currentLanguage={currentLanguage}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onBulkScaleEmployees={handleBulkScaleEmployees}
          />
        )}

        {/* Equipment & Facilities Suite */}
        {activeTab === 'equipment' && (
          <EquipmentManagerView
            currentLanguage={currentLanguage}
          />
        )}

        {/* 3. Analytics Dashboard (Admin) */}
        {activeTab === 'analytics' && portal === 'admin' && (
          <AnalyticsDashboardView
            shifts={scopedShifts}
            employees={scopedEmployees}
            weekDates={weekDates}
            currentLanguage={currentLanguage}
            weeklySalesForecast={38500}
            tardinessLog={scopedTardinessLog}
            posMappings={posMappings}
            onSavePOSMapping={(updated) => setPOSMappings(prev => ({ ...prev, [updated.posPlatformId]: updated }))}
            activePOSId={activePOSId}
            onSelectActivePOS={setActivePOSId}
            departmentBudgets={departmentBudgets}
            onUpdateEmployee={(updatedEmp) => setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e))}
            onDispatchPOSLaborAlert={(alert) => {
              const newDispatch: NotificationDispatch = {
                id: `dispatch-pos-${Date.now()}`,
                recipientEmployeeId: 'all-managers',
                recipientName: 'All Floor Managers',
                recipientPhone: '+1-555-0199',
                recipientEmail: 'managers@workqora.com',
                type: 'tardiness_alert',
                title: `🚨 POS Labor Breach: ${alert.department} (${alert.liveLaborPct}%)`,
                message: alert.message + ' ' + alert.recommendedAction,
                channels: ['app', 'sms'],
                timestamp: new Date().toISOString(),
                status: 'sent',
                metadata: {
                  department: alert.department,
                  isAutomatedCron: false,
                }
              };
              setNotificationDispatches(prev => [newDispatch, ...prev]);
            }}
          />
        )}

        {/* 4. Requests & Approvals Center */}
        {activeTab === 'requests' && (
          <RequestsApprovalsView
            portal={portal}
            currentEmployee={currentEmployee}
            timeOffRequests={scopedTimeOffRequests}
            shiftSwapRequests={scopedShiftSwapRequests}
            sickReports={scopedSickReports}
            availabilityRequests={scopedAvailabilityRequests}
            shiftSlotRequests={scopedShiftSlotRequests}
            tardinessLog={scopedTardinessLog}
            employees={scopedEmployees}
            shifts={scopedShifts}
            currentLanguage={currentLanguage}
            onApproveTimeOff={handleApproveTimeOff}
            onRejectTimeOff={handleRejectTimeOff}
            onApproveShiftSwap={handleApproveShiftSwap}
            onRejectShiftSwap={handleRejectShiftSwap}
            onAcknowledgeSickReport={handleAcknowledgeSickReport}
            onApproveAvailability={handleApproveAvailability}
            onRejectAvailability={handleRejectAvailability}
            onApproveShiftSlot={handleApproveShiftSlot}
            onRejectShiftSlot={handleRejectShiftSlot}
            onResolveContentionWithPriority={handleResolveContentionWithPriority}
          />
        )}

        {/* 4. Late & Tardiness Attendance Tracker */}
        {activeTab === 'tardiness' && (
          <LateTardinessTrackerView
            tardinessLog={scopedTardinessLog}
            employees={scopedEmployees}
            currentLanguage={currentLanguage}
            onAddTardinessRecord={(rec) => setTardinessLog(prev => [{ ...rec, id: `tardy-${Date.now()}` }, ...prev])}
          />
        )}

        {/* 5. Announcements & Broadcast Notice Board */}
        {activeTab === 'announcements' && (
          <AnnouncementsView
            portal={portal}
            announcements={announcements}
            employees={scopedEmployees}
            currentEmployee={currentEmployee}
            currentLanguage={currentLanguage}
            onCreateAnnouncement={handleCreateAnnouncement}
            onAcknowledgeAnnouncement={handleAcknowledgeAnnouncement}
          />
        )}

        {/* 6. Admin Only: HR Management, Onboarding, Hiring, Interviews & Payroll */}
        {activeTab === 'hr_payroll' && portal === 'admin' && (
          <HRManagementView
            candidates={scopedCandidates}
            employees={scopedEmployees}
            shifts={scopedShifts}
            currentLanguage={currentLanguage}
            onUpdateCandidateStage={handleUpdateCandidateStage}
            onToggleDocument={handleToggleDocument}
            onAddCandidate={handleAddCandidate}
          />
        )}

        {/* 7. Workqora Payroll & Tip Pool Engine */}
        {activeTab === 'payroll' && (
          <WorkqoraPayrollView
            employees={scopedEmployees}
            shifts={scopedShifts}
          />
        )}

        {/* 8. Workqora Learn - Restaurant Academy & Certifications */}
        {activeTab === 'learn' && (
          <WorkqoraLearnView
            employees={scopedEmployees}
          />
        )}

        {/* 9. Restaurant Performance, Score & Guest Reviews Hub */}
        {activeTab === 'performance' && (
          <RestaurantPerformanceReviewsView
            performanceScore={restaurantScore}
            reviews={guestReviews}
            setReviews={setGuestReviews}
            employees={scopedEmployees}
            setEmployees={setEmployees}
            onPostCelebrationToCommunity={(ann) => handleCreateAnnouncement({
              title: ann.title || 'Staff Recognition & Guest Review Shoutout',
              content: ann.content || (ann as { message?: string }).message || '',
              authorName: 'Restaurant General Manager',
              authorRole: 'Management Team',
              targetDepartment: 'all',
              priority: 'highlight',
              channels: ['app', 'sms'],
            })}
            portal={portal}
          />
        )}

        {/* 10. WorkForce & POS Hub Integration Center */}
        {activeTab === 'integrations' && portal === 'admin' && (
          <IntegrationsHubView
            workforcePlatforms={workforcePlatforms}
            setWorkforcePlatforms={setWorkforcePlatforms}
            posPlatforms={posPlatforms}
            setPOSPlatforms={setPOSPlatforms}
            syncLogs={workforceSyncLogs}
            setSyncLogs={setWorkforceSyncLogs}
            serverSalesMetrics={posServerSalesMetrics}
            timeclockPunches={posTimeclockPunches}
            employees={scopedEmployees}
            shifts={scopedShifts}
            posMappings={posMappings}
            setPOSMappings={setPOSMappings}
          />
        )}

        {/* 11. Business Email Integration & Unified Mailbox Hub */}
        {activeTab === 'email' && (
          <UnifiedEmailInboxView
            connections={emailConnections}
            messages={emailMessages}
            templates={emailTemplates}
            signatures={emailSignatures}
            currentEmployee={currentEmployee}
            locations={companyLocations}
            onSendMessage={handleSendEmailMessage}
            onUpdateMessage={handleUpdateEmailMessage}
            onDeleteMessage={handleDeleteEmailMessage}
            onOpenSettings={() => setIsEmailSettingsModalOpen(true)}
            onConvertAction={handleConvertEmailAction}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-semibold text-slate-700">Workqora Restaurant Intelligence System</span>
            <span>•</span>
            <span>Scale: 1 to 1,000 Employees</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Simultaneous SMS • Email • In-App Push Engine</span>
            <span>•</span>
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="text-sky-600 hover:text-sky-800 font-bold"
            >
              Subscription Pricing
            </button>
            <span>•</span>
            <button onClick={() => setIsLocationManagerOpen(true)} className="text-indigo-600 hover:text-indigo-800 font-bold">Company Locations</button>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <PublishBroadcastModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        employees={employees}
        shifts={shifts}
        weekDates={weekDates}
        currentLanguage={currentLanguage}
        onBroadcastComplete={handleBroadcastComplete}
      />

      <EnterpriseLocationManagerModal
        isOpen={isLocationManagerOpen}
        onClose={() => setIsLocationManagerOpen(false)}
        onLocationCountChange={(count) => setSubscriptionState(prev => ({ ...prev, activeLocationCount: count }))}
      />

      <PricingTiersModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        currentEmployeeCount={employees.length}
        currentLocationCount={subscriptionState.activeLocationCount}
        currentLanguage={currentLanguage}
        onSelectTier={async (tierId, cycle) => {
          if (tierId === 'enterprise-custom') {
            throw new Error('Custom Enterprise plans require a sales contract and cannot be self-activated.');
          }
          await beginStripeCheckout(tierId, cycle);
        }}
      />

      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        shifts={shifts}
        employees={employees}
        currentLanguage={currentLanguage}
      />

      <ScheduledRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        shifts={shifts}
        employees={employees}
        currentLanguage={currentLanguage}
        config={schedulerConfig}
        onUpdateConfig={setSchedulerConfig}
        onTriggerSingleReminder={handleTrigger24HrReminder}
        onRunScheduledScan={handleRunScheduledReminderScan}
        notificationDispatches={notificationDispatches}
        isScanning={isScanningReminders}
      />

      {/* Enterprise Feature Manager Modal */}
      <EnterpriseFeatureManagerModal
        isOpen={isFeatureManagerOpen}
        onClose={() => setIsFeatureManagerOpen(false)}
        state={featureState}
        onTogglePlugin={(pluginId) => {
          setFeatureState(prev => ({
            ...prev,
            enabledPluginIds: prev.enabledPluginIds.includes(pluginId)
              ? prev.enabledPluginIds.filter(id => id !== pluginId)
              : [...prev.enabledPluginIds, pluginId]
          }));
        }}
        onOpenPurchasePortal={(plugin) => {
          setPaymentPortalItem({
            id: plugin.id,
            title: plugin.name,
            description: `${plugin.category.toUpperCase()} plugin license. Server-side Stripe Price configuration is required before purchase.`,
            priceUSD: plugin.priceMonthly,
            period: 'monthly',
            type: 'plugin_addon',
            badge: `${plugin.category.toUpperCase()} Add-on`,
          });
          setIsPaymentPortalOpen(true);
        }}
      />

      {/* Universal Multi-Method Payment Portal */}
      <PaymentPortalModal
        isOpen={isPaymentPortalOpen}
        onClose={() => setIsPaymentPortalOpen(false)}
        itemToPurchase={paymentPortalItem}
        currentLanguage={currentLanguage}
      />

      {/* Role-Based Access Control (RBAC) & Custom Roles Manager Modal */}
      <RoleBasedAccessControlManager
        isOpen={isRBACModalOpen}
        onClose={() => setIsRBACModalOpen(false)}
        state={rbacState}
        onSaveRole={handleSaveRole}
        onDeleteRole={handleDeleteRole}
        onSelectActiveRole={handleSelectActiveRole}
      />

      {/* Service Worker Offline Roster & Emergency Clock-In Modal */}
      <OfflineRosterClockInModal
        isOpen={isOfflineModalOpen}
        onClose={() => {
          setIsOfflineModalOpen(false);
          setOfflineQueueCount(getOfflineClockInQueue().length);
        }}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(prev => !prev)}
        employees={employees}
        shifts={shifts}
        currentLanguage={currentLanguage}
        onSyncOfflinePunchesToLive={handleSyncOfflinePunches}
      />

      {/* Dual Login Modal (Admin & Manager / Employee & Free Staff) */}
      <DualLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialMode={loginModalMode}
        currentSession={authSession}
        roles={rbacState.roles}
        employees={employees}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Business Email Integration Settings & Account Manager Modal */}
      {isEmailSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Business Email Integration Center</h2>
                  <p className="text-xs text-slate-400">Manage multi-tenant corporate, regional, and location business mailboxes</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailSettingsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EmailIntegrationCenterView
                connections={emailConnections}
                locations={companyLocations}
                auditLogs={emailAuditLogs}
                onAddConnection={handleAddEmailConnection}
                onUpdateConnection={handleUpdateEmailConnection}
                onDeleteConnection={handleDeleteEmailConnection}
                onSyncConnection={handleSyncEmailConnection}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AppWithFirebase() {
  return (
    <FirebaseProvider initialEmployees={INITIAL_EMPLOYEES}>
      <App />
    </FirebaseProvider>
  );
}
