import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from './config';
import { firestoreService } from './firestoreService';
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
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isAuthenticated === 'boolean') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Firebase Auth] Failed to read cached session:', e);
    }
  }

  return {
    isAuthenticated: true,
    userType: 'admin',
    adminRole: defaultAdminRole,
    displayName: defaultAdminRole.name.split('(')[0].trim(),
    displayEmail: 'admin@shiftsky.com',
    loginTimestamp: new Date().toISOString(),
    sessionToken: 'token-initial-adm-01',
    authMethod: 'quick_select',
    isHostOrAdminPayer: true,
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
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      if (session.userType === 'employee' && session.employee) {
        localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session.employee));
      }
    } catch (e) {
      console.warn('[Firebase Auth] Failed to persist session to storage:', e);
    }
  }, []);

  // Real Firebase onAuthStateChanged Observer
  useEffect(() => {
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

          const isSuperAdminEmail = fbUser.email === 'khomchatwongwai@gmail.com' || 
                                    fbUser.email?.includes('admin') || 
                                    fbUser.email?.includes('host');

          const matchingRole = INITIAL_CUSTOM_ROLES.find(r => r.id === profile?.role) || 
                               (isSuperAdminEmail ? INITIAL_CUSTOM_ROLES[0] : INITIAL_CUSTOM_ROLES[1]) ||
                               INITIAL_CUSTOM_ROLES[0];

          if (!profile) {
            // First time Firebase Auth login -> create Firestore profile doc
            profile = {
              userId: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Hospitality Manager',
              photoURL: fbUser.photoURL || undefined,
              role: matchingRole.id,
              isHostOrAdmin: isSuperAdminEmail || matchingRole.id === 'role-restaurant-host' || matchingRole.id === 'role-super-admin',
              userType: 'admin',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            await firestoreService.saveUserProfile(profile);
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
            userType: isEmployeeMode ? 'employee' : 'admin',
            adminRole: matchingRole,
            employee: matchedEmployee,
            displayName: fbUser.displayName || profile.displayName || matchedEmployee?.name || fbUser.email?.split('@')[0] || 'ShiftForce User',
            displayEmail: fbUser.email || profile.email || matchedEmployee?.email || '',
            avatarUrl: fbUser.photoURL || profile.photoURL || matchedEmployee?.avatarUrl || undefined,
            loginTimestamp: new Date().toISOString(),
            sessionToken: `token-fb-${fbUser.uid}`,
            authMethod: fbUser.providerData.some(p => p.providerId === 'google.com') ? 'google_oauth' : 'credentials',
            isHostOrAdminPayer: profile.isHostOrAdmin ?? (isSuperAdminEmail || true),
          };

          persistSession(newSession);
        } catch (err) {
          console.error('[Firebase Auth] Error fetching/saving user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);

        // Check if there is a cached employee PIN session or active admin session in localStorage
        setUserSession((prev) => {
          if (prev.authMethod === 'google_oauth') {
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
            } catch {}
            return signedOut;
          }
          // Preserve valid employee PIN sessions and configured admin sessions
          return prev;
        });
      }

      setIsLoadingAuth(false);
    });

    // Test Firestore Connection
    testFirestoreConnection().then((ok) => {
      setIsFirestoreConnected(ok);
    });

    return () => {
      unsubscribeAuth();
      if (activeUnsubProfileRef.current) {
        activeUnsubProfileRef.current();
      }
    };
  }, [initialEmployees, persistSession]);

  // Realtime Firestore Subscriptions for App Entities
  useEffect(() => {
    if (!syncWithFirestore) return;

    // Seed initial demo data to Firestore if available
    if (initialEmployees.length > 0) {
      firestoreService.seedEmployeesIfEmpty(initialEmployees).catch(() => {});
    }

    const unsubEmployees = firestoreService.subscribeEmployees((employees) => {
      if (onEmployeesSynced && employees.length > 0) {
        onEmployeesSynced(employees);
      }
    });

    const unsubShifts = firestoreService.subscribeShifts((shifts) => {
      if (onShiftsSynced && shifts.length > 0) {
        onShiftsSynced(shifts);
      }
    });

    const unsubPunches = firestoreService.subscribePunches((punches) => {
      if (onPunchesSynced) {
        onPunchesSynced(punches);
      }
    });

    const unsubTrades = firestoreService.subscribeTrades((trades) => {
      if (onTradesSynced) {
        onTradesSynced(trades);
      }
    });

    const unsubAnnouncements = firestoreService.subscribeAnnouncements((announcements) => {
      if (onAnnouncementsSynced) {
        onAnnouncementsSynced(announcements);
      }
    });

    return () => {
      unsubEmployees();
      unsubShifts();
      unsubPunches();
      unsubTrades();
      unsubAnnouncements();
    };
  }, [syncWithFirestore, initialEmployees, onAnnouncementsSynced, onEmployeesSynced, onPunchesSynced, onShiftsSynced, onTradesSynced]);

  // --- Sign In with Google Popup ---
  const signInWithGoogle = async (preferredRole?: CustomRole, isHost?: boolean): Promise<AuthUserSession> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const fbUser = res.user;

      const isSuperAdminEmail = fbUser.email === 'khomchatwongwai@gmail.com' || 
                                fbUser.email?.includes('admin') ||
                                fbUser.email?.includes('host');

      const assignedRole = preferredRole || 
                           (isSuperAdminEmail ? INITIAL_CUSTOM_ROLES[0] : (INITIAL_CUSTOM_ROLES.find(r => r.id === 'role-restaurant-host') || INITIAL_CUSTOM_ROLES[0]));
      
      const isPayer = isHost ?? (isSuperAdminEmail || assignedRole.id === 'role-restaurant-host' || assignedRole.id === 'role-super-admin');

      const profile: UserProfileDoc = {
        userId: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Hospitality Host',
        photoURL: fbUser.photoURL || undefined,
        role: assignedRole.id,
        isHostOrAdmin: isPayer,
        userType: 'admin',
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(profile);
      setUserProfile(profile);
      setCurrentUser(fbUser);

      const session: AuthUserSession = {
        isAuthenticated: true,
        userType: 'admin',
        adminRole: assignedRole,
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
  const signInWithEmail = async (email: string, password: string, preferredRole?: CustomRole): Promise<AuthUserSession> => {
    try {
      let fbUser: User;
      try {
        const res = await signInWithEmailAndPassword(auth, email, password);
        fbUser = res.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
          // If the account doesn't exist yet, attempt automatic creation
          const createRes = await createUserWithEmailAndPassword(auth, email, password);
          fbUser = createRes.user;
        } else {
          throw authErr;
        }
      }

      const assignedRole = preferredRole || INITIAL_CUSTOM_ROLES[0];
      const isPayer = assignedRole.id === 'role-restaurant-host' || assignedRole.id === 'role-super-admin' || email === 'khomchatwongwai@gmail.com';

      const profile: UserProfileDoc = {
        userId: fbUser.uid,
        email: fbUser.email || email,
        displayName: fbUser.displayName || assignedRole.name.split('(')[0].trim(),
        photoURL: fbUser.photoURL || undefined,
        role: assignedRole.id,
        isHostOrAdmin: isPayer,
        userType: 'admin',
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(profile);
      setUserProfile(profile);
      setCurrentUser(fbUser);

      const session: AuthUserSession = {
        isAuthenticated: true,
        userType: 'admin',
        adminRole: assignedRole,
        displayName: profile.displayName,
        displayEmail: profile.email,
        avatarUrl: profile.photoURL,
        loginTimestamp: new Date().toISOString(),
        sessionToken: `token-fb-email-${fbUser.uid}`,
        authMethod: 'credentials',
        isHostOrAdminPayer: isPayer,
      };

      persistSession(session);
      return session;
    } catch (error) {
      console.error('[Firebase Auth] Email login error:', error);
      throw error;
    }
  };

  // --- Sign Up with Email / Password ---
  const signUpWithEmail = async (
    email: string, 
    password: string, 
    displayName?: string, 
    preferredRole?: CustomRole
  ): Promise<AuthUserSession> => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = res.user;

      if (displayName) {
        await updateFirebaseProfile(fbUser, { displayName });
      }

      const assignedRole = preferredRole || INITIAL_CUSTOM_ROLES[0];
      const isPayer = assignedRole.id === 'role-restaurant-host' || assignedRole.id === 'role-super-admin' || email === 'khomchatwongwai@gmail.com';

      const profile: UserProfileDoc = {
        userId: fbUser.uid,
        email: fbUser.email || email,
        displayName: displayName || assignedRole.name.split('(')[0].trim(),
        photoURL: fbUser.photoURL || undefined,
        role: assignedRole.id,
        isHostOrAdmin: isPayer,
        userType: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(profile);
      setUserProfile(profile);
      setCurrentUser(fbUser);

      const session: AuthUserSession = {
        isAuthenticated: true,
        userType: 'admin',
        adminRole: assignedRole,
        displayName: profile.displayName,
        displayEmail: profile.email,
        avatarUrl: profile.photoURL,
        loginTimestamp: new Date().toISOString(),
        sessionToken: `token-fb-signup-${fbUser.uid}`,
        authMethod: 'credentials',
        isHostOrAdminPayer: isPayer,
      };

      persistSession(session);
      return session;
    } catch (error) {
      console.error('[Firebase Auth] Sign up error:', error);
      throw error;
    }
  };

  // --- Sign In Employee with PIN / Roster Selection ---
  const signInWithEmployeePin = async (employee: Employee, pin?: string): Promise<AuthUserSession> => {
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
    persistSession(session);
  };

  // --- Update User Profile in Firestore ---
  const updateUserProfile = async (updates: Partial<UserProfileDoc>) => {
    const uid = currentUser?.uid || userProfile?.userId;
    if (!uid) return;

    const merged: UserProfileDoc = {
      userId: uid,
      email: currentUser?.email || userProfile?.email || '',
      displayName: currentUser?.displayName || userProfile?.displayName || 'ShiftForce User',
      photoURL: currentUser?.photoURL || userProfile?.photoURL,
      role: userProfile?.role || 'role-super-admin',
      isHostOrAdmin: userProfile?.isHostOrAdmin ?? true,
      userType: userProfile?.userType || 'admin',
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


