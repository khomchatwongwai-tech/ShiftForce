import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, googleProvider } from './config';
import { firestoreService } from '../supabase/workforceService';
import {
  Employee,
  Shift,
  AttendancePunch,
  ShiftTradeRequest,
  Announcement,
  AuthUserSession,
  CustomRole,
  AuthPortalMode
} from '../types';
import { INITIAL_CUSTOM_ROLES, INITIAL_RBAC_STATE } from '../data/rbacData';
import { INITIAL_EMPLOYEES } from '../data/mockData';

const SESSION_STORAGE_KEY = 'shiftsky_firebase_session_v2';
const EMPLOYEE_SESSION_KEY = 'shiftsky_employee_active_session_v2';

export interface UserProfileDoc {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  isHostOrAdmin: boolean;
  userType: AuthPortalMode;
  employeeId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface FirebaseContextType {
  currentUser: User | null;
  userProfile: UserProfileDoc | null;
  userSession: AuthUserSession;
  isLoadingAuth: boolean;
  isFirestoreConnected: boolean;
  syncWithFirestore: boolean;
  setSyncWithFirestore: (enabled: boolean) => void;
  signInWithGoogle: (preferredRole?: CustomRole, isHost?: boolean) => Promise<AuthUserSession>;
  signInWithEmail: (email: string, password: string, preferredRole?: CustomRole) => Promise<AuthUserSession>;
  signUpWithEmail: (email: string, password: string, displayName?: string, preferredRole?: CustomRole) => Promise<AuthUserSession>;
  signInWithEmployeePin: (employee: Employee, pin?: string) => Promise<AuthUserSession>;
  signInEmployee: (identifier: string, pin: string) => Promise<AuthUserSession>;
  setCustomSession: (session: AuthUserSession) => void;
  logOutFirebase: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfileDoc>) => Promise<void>;
}

const defaultAdminRole = INITIAL_RBAC_STATE.roles[0];

const loadPersistedSession = (): AuthUserSession => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUserSession;
        // Only retain employee demo/PIN sessions when explicit demo auth is enabled.
        const demoAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
        if (demoAuthEnabled && parsed?.isAuthenticated && parsed.userType === 'employee') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Firebase Auth] Failed to read cached session:', e);
    }
  }

  return {
    isAuthenticated: false,
    userType: 'admin',
    displayName: 'Guest / Signed Out',
    displayEmail: '',
    loginTimestamp: '',
    sessionToken: '',
    authMethod: 'credentials',
    isHostOrAdminPayer: false,
  };
};

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  initialEmployees?: Employee[];
  initialShifts?: Shift[];
  onEmployeesSynced?: (employees: Employee[]) => void;
  onShiftsSynced?: (shifts: Shift[]) => void;
  onPunchesSynced?: (punches: AttendancePunch[]) => void;
  onTradesSynced?: (trades: ShiftTradeRequest[]) => void;
  onAnnouncementsSynced?: (announcements: Announcement[]) => void;
}> = ({
  children,
  initialEmployees = INITIAL_EMPLOYEES,
  initialShifts = [],
  onEmployeesSynced,
  onShiftsSynced,
  onPunchesSynced,
  onTradesSynced,
  onAnnouncementsSynced,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [userSession, setUserSession] = useState<AuthUserSession>(loadPersistedSession);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [syncWithFirestore, setSyncWithFirestore] = useState(true);

  const activeUnsubProfileRef = useRef<(() => void) | null>(null);

  // Sync session changes to localStorage
  const persistSession = useCallback((session: AuthUserSession) => {
    setUserSession(session);
    if (session.userType === 'employee' && !(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true')) return;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.userType === 'employee' && session.employee) {
        localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session.employee));
      }
    } catch (e) {
      console.warn('[Firebase Auth] Failed to persist session to storage:', e);
    }
  }, []);

  const signInEmployee = async (identifier: string, pin: string): Promise<AuthUserSession> => {
    const response = await fetch('/api/auth/employee/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ identifier, pin }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.employee) throw new Error(payload?.error || 'Invalid employee ID or PIN');
    const employee = payload.employee as Employee & { employeeId?: string };
    const session: AuthUserSession = { isAuthenticated: true, organizationId: employee.organizationId, userType: 'employee', employee: { ...employee, id: employee.employeeId || employee.id }, displayName: (employee as any).displayName || employee.name, displayEmail: employee.email || '', loginTimestamp: new Date().toISOString(), sessionToken: '', authMethod: 'pin', isHostOrAdminPayer: false };
    setUserSession(session);
    return session;
  };

  // Real Firebase onAuthStateChanged Observer
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/auth/employee/session', { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.employee) {
          const employee = payload.employee as Employee & { employeeId?: string };
          setUserSession({ isAuthenticated: true, organizationId: employee.organizationId, userType: 'employee', employee: { ...employee, id: employee.employeeId || employee.id }, displayName: (employee as any).displayName || employee.name, displayEmail: employee.email || '', loginTimestamp: new Date().toISOString(), sessionToken: '', authMethod: 'pin', isHostOrAdminPayer: false });
        }
      } catch {}
    })();
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous user profile listener if any
      if (activeUnsubProfileRef.current) {
        activeUnsubProfileRef.current();
        activeUnsubProfileRef.current = null;
      }

      if (fbUser) {
        setCurrentUser(fbUser);

        try {
          // Check for existing profile in Firestore
          let profile = await firestoreService.getUserProfile(fbUser.uid);

          const matchingRole = INITIAL_CUSTOM_ROLES.find(r => r.id === profile?.role) ||
                               INITIAL_CUSTOM_ROLES.find(r => r.id === 'role-employee') ||
                               INITIAL_CUSTOM_ROLES[1];

          if (!profile) {
            // Unknown Firebase identities are not auto-enrolled into a tenant. They may remain
            // Firebase-authenticated long enough to accept a valid organization invitation.
            setUserProfile(null);
            const pendingSession: AuthUserSession = {
              isAuthenticated: false, userType: 'employee', displayName: fbUser.displayName || 'Pending invitation',
              displayEmail: fbUser.email || '', loginTimestamp: '', sessionToken: '', authMethod: 'credentials', isHostOrAdminPayer: false,
            };
            persistSession(pendingSession);
            setIsLoadingAuth(false);
            return;
          } else {
            // Update lastLoginAt timestamp in Firestore
            firestoreService.saveUserProfile({
              ...profile,
              lastLoginAt: new Date().toISOString(),
            }).catch(() => {});
          }

          setUserProfile(profile);

          // Subscribe to live updates on this user's profile document
          activeUnsubProfileRef.current = firestoreService.subscribeUserProfile(fbUser.uid, (liveProfile) => {
            if (liveProfile) {
              setUserProfile(liveProfile as UserProfileDoc);
            }
          });

          // Check if user's email matches an employee record
          const matchedEmployee = initialEmployees.find(e =>
            e.email?.toLowerCase() === fbUser.email?.toLowerCase() ||
            e.id === profile?.employeeId
          );

          const isEmployeeMode = profile.userType === 'employee' || (Boolean(matchedEmployee) && !profile.isHostOrAdmin);

          const newSession: AuthUserSession = {
            isAuthenticated: true,
            organizationId: profile.organizationId,
            userType: isEmployeeMode ? 'employee' : 'admin',
            adminRole: matchingRole,
            employee: matchedEmployee,
            displayName: fbUser.displayName || profile.displayName || matchedEmployee?.name || fbUser.email?.split('@')[0] || 'Workqora User',
            displayEmail: fbUser.email || profile.email || matchedEmployee?.email || '',
            avatarUrl: fbUser.photoURL || profile.photoURL || matchedEmployee?.avatarUrl || undefined,
            loginTimestamp: new Date().toISOString(),
            sessionToken: `token-fb-${fbUser.uid}`,
            authMethod: fbUser.providerData.some(p => p.providerId === 'google.com') ? 'google_oauth' : 'credentials',
            isHostOrAdminPayer: profile.isHostOrAdmin ?? false,
          };

          persistSession(newSession);
        } catch (err) {
          console.error('[Firebase Auth] Error fetching/saving user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);

        // A missing Firebase user must fail closed. Only the explicitly enabled local
        // development PIN demo may survive without Firebase authentication.
        setUserSession((prev) => {
          const demoAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
          if (demoAuthEnabled && prev.userType === 'employee' && (prev.authMethod === 'pin' || prev.authMethod === 'quick_select')) {
            return prev;
          }
          const signedOut: AuthUserSession = {
            isAuthenticated: false,
            userType: 'admin',
            displayName: 'Signed Out',
            displayEmail: '',
            loginTimestamp: '',
            sessionToken: '',
            authMethod: 'credentials',
            isHostOrAdminPayer: false,
          };
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(EMPLOYEE_SESSION_KEY);
          } catch {}
          return signedOut;
        });
      }

      setIsLoadingAuth(false);
    });

    // Workforce persistence is Supabase-backed. Do not open an unused client Firestore
    // connection during auth startup: the Firebase project is used here for Auth only.
    setIsFirestoreConnected(false);

    return () => {
      unsubscribeAuth();
      if (activeUnsubProfileRef.current) {
        activeUnsubProfileRef.current();
      }
    };
  }, [initialEmployees, persistSession]);

  // Realtime Firestore subscriptions are tenant-scoped and only active after a real Firebase login.
  useEffect(() => {
    if (!syncWithFirestore || !currentUser || !userProfile?.organizationId) return;

    const organizationId = userProfile.organizationId;
    const demoSeedEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
    if (demoSeedEnabled && initialEmployees.length > 0) {
      firestoreService.seedEmployeesIfEmpty(initialEmployees).catch(() => {});
    }

    const unsubEmployees = firestoreService.subscribeEmployees(organizationId, employees => onEmployeesSynced?.(employees));
    const unsubShifts = firestoreService.subscribeShifts(organizationId, shifts => onShiftsSynced?.(shifts));
    const unsubPunches = firestoreService.subscribePunches(organizationId, punches => onPunchesSynced?.(punches));
    const unsubTrades = firestoreService.subscribeTrades(organizationId, trades => onTradesSynced?.(trades));
    const unsubAnnouncements = firestoreService.subscribeAnnouncements(organizationId, announcements => onAnnouncementsSynced?.(announcements));

    return () => {
      unsubEmployees();
      unsubShifts();
      unsubPunches();
      unsubTrades();
      unsubAnnouncements();
    };
  }, [syncWithFirestore, currentUser, userProfile?.organizationId, initialEmployees, onAnnouncementsSynced, onEmployeesSynced, onPunchesSynced, onShiftsSynced, onTradesSynced]);

  // --- Sign In with Google Popup ---
  const signInWithGoogle = async (preferredRole?: CustomRole, isHost?: boolean): Promise<AuthUserSession> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      const existingProfile = await firestoreService.getUserProfile(fbUser.uid);
      if (!existingProfile?.organizationId) {
        throw new Error('This Google account is not provisioned yet. Use a valid Workqora organization invitation or ask an administrator to provision access.');
      }
      const assignedRole = INITIAL_CUSTOM_ROLES.find(r => r.id === existingProfile?.role) ||
                           INITIAL_CUSTOM_ROLES.find(r => r.id === 'role-employee') || INITIAL_CUSTOM_ROLES[1];
      const isPayer = Boolean(existingProfile?.isHostOrAdmin);

      const profile: UserProfileDoc = {
        userId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Hospitality Host',
        photoURL: fbUser.photoURL || undefined,
        role: assignedRole.id,
        isHostOrAdmin: isPayer,
        userType: existingProfile?.userType || 'employee',
        organizationId: existingProfile.organizationId,
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(profile);
      setUserProfile(profile);
      setCurrentUser(fbUser);

      const session: AuthUserSession = {
        isAuthenticated: true,
        organizationId: profile.organizationId,
        userType: profile.userType === 'admin' && isPayer ? 'admin' : 'employee',
        adminRole: profile.userType === 'admin' && isPayer ? assignedRole : undefined,
        displayName: fbUser.displayName || assignedRole.name.split('(')[0].trim(),
        displayEmail: fbUser.email || 'admin@shiftsky.com',
        avatarUrl: fbUser.photoURL || undefined,
        loginTimestamp: new Date().toISOString(),
        sessionToken: `token-fb-google-${fbUser.uid}`,
        authMethod: 'google_oauth',
        isHostOrAdminPayer: isPayer,
      };

      persistSession(session);
      return session;
    } catch (error) {
      console.error('[Firebase Auth] Google Sign-in error:', error);
      throw error;
    }
  };

  // --- Sign In with Email / Password ---
  const signInWithEmail = async (email: string, password: string, _preferredRole?: CustomRole): Promise<AuthUserSession> => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = res.user;
      const profile = await firestoreService.getUserProfile(fbUser.uid);

      if (!profile?.organizationId) {
        await signOut(auth);
        throw new Error('This account is not provisioned for Workqora. Ask an administrator to invite you.');
      }

      const assignedRole = INITIAL_CUSTOM_ROLES.find(r => r.id === profile.role) ||
                           INITIAL_CUSTOM_ROLES.find(r => r.id === 'role-employee') || INITIAL_CUSTOM_ROLES[1];
      const isAdminProfile = profile.userType === 'admin' && profile.isHostOrAdmin === true;
      const matchedEmployee = initialEmployees.find(e => e.id === profile.employeeId || e.email?.toLowerCase() === email.toLowerCase());
      const isEmployeeProfile = profile.userType === 'employee' && Boolean(profile.employeeId);

      if (!isAdminProfile && !isEmployeeProfile) {
        await signOut(auth);
        throw new Error('This account exists but is not linked to an active Workqora workforce identity. Ask an administrator to provision it.');
      }

      setUserProfile(profile);
      setCurrentUser(fbUser);

      const session: AuthUserSession = {
        isAuthenticated: true,
        organizationId: profile.organizationId,
        userType: isAdminProfile ? 'admin' : 'employee',
        adminRole: isAdminProfile ? assignedRole : undefined,
        employee: isEmployeeProfile ? matchedEmployee : undefined,
        displayName: profile.displayName || matchedEmployee?.name || fbUser.displayName || email,
        displayEmail: profile.email || fbUser.email || email,
        avatarUrl: profile.photoURL || matchedEmployee?.avatarUrl || fbUser.photoURL || undefined,
        loginTimestamp: new Date().toISOString(),
        sessionToken: `firebase:${fbUser.uid}`,
        authMethod: 'credentials',
        isHostOrAdminPayer: isAdminProfile,
      };

      persistSession(session);
      return session;
    } catch (error) {
      console.error('[Firebase Auth] Email login error:', error);
      throw error;
    }
  };

  // --- Sign Up with Email / Password ---
  // Workforce identities are provisioned through a company invitation. Public client-side
  // signup is intentionally disabled so users cannot create or select their own tenant.
  const signUpWithEmail = async (
    _email: string,
    _password: string,
    _displayName?: string,
    _preferredRole?: CustomRole
  ): Promise<AuthUserSession> => {
    throw new Error('Public self-service signup is disabled. Join through a Workqora organization invitation or ask your company administrator to provision access.');
  };

  // --- Sign In Employee with PIN / Roster Selection ---
  const signInWithEmployeePin = async (employee: Employee, pin?: string): Promise<AuthUserSession> => {
    const demoAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
    if (!demoAuthEnabled) {
      throw new Error('PIN/quick-select login is disabled in production until server-side employee PIN verification is configured.');
    }

    const session: AuthUserSession = {
      isAuthenticated: true,
      userType: 'employee',
      employee: employee,
      displayName: employee.name,
      displayEmail: employee.email,
      avatarUrl: employee.avatarUrl,
      loginTimestamp: new Date().toISOString(),
      sessionToken: `token-emp-${employee.id}-${Date.now()}`,
      authMethod: pin ? 'pin' : 'quick_select',
      isHostOrAdminPayer: false,
    };

    persistSession(session);
    return session;
  };

  // --- Set Custom Session ---
  const setCustomSession = (session: AuthUserSession) => {
    const demoAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
    if (!currentUser && !demoAuthEnabled && session.userType !== 'employee') {
      throw new Error('Cannot create a production session without Firebase authentication.');
    }
    persistSession(session);
  };

  // --- Update User Profile in Firestore ---
  const updateUserProfile = async (updates: Partial<UserProfileDoc>) => {
    const uid = currentUser?.uid || userProfile?.userId;
    if (!uid) return;

    const merged: UserProfileDoc = {
      userId: uid,
      email: currentUser?.email || userProfile?.email || '',
      displayName: currentUser?.displayName || userProfile?.displayName || 'Workqora User',
      photoURL: currentUser?.photoURL || userProfile?.photoURL,
      role: userProfile?.role || 'role-super-admin',
      isHostOrAdmin: userProfile?.isHostOrAdmin ?? true,
      userType: userProfile?.userType || 'employee',
      organizationId: userProfile?.organizationId,
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await firestoreService.saveUserProfile(merged);
    setUserProfile(merged);
  };

  // --- Sign Out of Firebase Auth ---
  const logOutFirebase = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[Firebase Auth] Sign out warning:', err);
    }

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(EMPLOYEE_SESSION_KEY);
    } catch {}

    const unauthSession: AuthUserSession = {
      isAuthenticated: false,
      userType: 'admin',
      displayName: 'Guest / Signed Out',
      displayEmail: '',
      loginTimestamp: '',
      sessionToken: '',
      authMethod: 'credentials',
      isHostOrAdminPayer: false,
    };

    setUserSession(unauthSession);
    setCurrentUser(null);
    setUserProfile(null);
  };

  return (
    <FirebaseContext.Provider
      value={{
        currentUser,
        userProfile,
        userSession,
        isLoadingAuth,
        isFirestoreConnected,
        syncWithFirestore,
        setSyncWithFirestore,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
    signInWithEmployeePin,
    signInEmployee,
        setCustomSession,
        logOutFirebase,
        updateUserProfile,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
