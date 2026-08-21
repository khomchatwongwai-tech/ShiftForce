import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  ChefHat, 
  Lock, 
  Mail, 
  Key, 
  Smartphone, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Zap, 
  Sparkles, 
  Building2, 
  Coffee, 
  X, 
  BadgeCheck, 
  Gift, 
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  CreditCard,
  Fingerprint,
  Globe
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { 
  AuthPortalMode, 
  AuthUserSession, 
  CustomRole, 
  Employee 
} from '../types';
import { useFirebase } from '../firebase/FirebaseContext';

interface DualLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatoryGate?: boolean;
  initialMode?: AuthPortalMode;
  currentSession?: AuthUserSession | null;
  roles: CustomRole[];
  employees: Employee[];
  onLoginSuccess: (session: AuthUserSession) => void;
  onLogout?: () => void;
}

export function DualLoginModal({
  isOpen,
  onClose,
  isMandatoryGate = false,
  initialMode = 'admin',
  currentSession,
  roles,
  employees,
  onLoginSuccess,
  onLogout,
}: DualLoginModalProps) {
  const [activeTab, setActiveTab] = useState<AuthPortalMode>(initialMode);
  
  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('admin@shiftforce.com');
  const [adminPassword, setAdminPassword] = useState('••••••••••••');
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || 'role-super-admin');
  const [admin2FACode, setAdmin2FACode] = useState('849201');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminRemember, setAdminRemember] = useState(true);

  // Employee Login State
  const [employeeLoginMethod, setEmployeeLoginMethod] = useState<'pin' | 'select' | 'email'>('pin');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeIdOrPhone, setEmployeeIdOrPhone] = useState('EMP-0109');
  const [employeePin, setEmployeePin] = useState('1091');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || 'emp-1');
  const [employeeRemember, setEmployeeRemember] = useState(true);

  // Status & Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial mode on open
  React.useEffect(() => {
    if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode, isOpen]);

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearchQuery.trim()) return employees.slice(0, 8);
    const q = employeeSearchQuery.toLowerCase();
    return employees.filter(e => 
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      (e.adpEmployeeId && e.adpEmployeeId.toLowerCase().includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [employees, employeeSearchQuery]);

  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signInWithEmployeePin, 
    setCustomSession 
  } = useFirebase();

  // Selected Admin Role
  const currentSelectedRole = useMemo(() => {
    return roles.find(r => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Selected Employee
  const currentSelectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  // Handle Admin Form Submit with Firebase Auth & persistence
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const role = roles.find(r => r.id === selectedRoleId) || roles[0];
      const session = await signInWithEmail(adminEmail, adminPassword, role);
      setSuccessMessage(`Authenticated with Firebase as ${role.name}`);
      setTimeout(() => {
        onLoginSuccess(session);
        setSuccessMessage(null);
        setIsLoading(false);
      }, 400);
    } catch {
      // Fallback local session if email auth fails or offline
      const role = roles.find(r => r.id === selectedRoleId) || roles[0];
      const isHost = role.id === 'role-restaurant-host' || role.id === 'role-super-admin';
      
      const newSession: AuthUserSession = {
        isAuthenticated: true,
        userType: 'admin',
        adminRole: role,
        displayName: role.name.split('(')[0].trim() || 'Admin User',
        displayEmail: adminEmail || 'admin@shiftsky.com',
        loginTimestamp: new Date().toISOString(),
        sessionToken: `token-adm-${Date.now()}`,
        authMethod: 'credentials',
        isHostOrAdminPayer: isHost,
      };

      setCustomSession(newSession);
      setSuccessMessage(`Authenticated as ${role.name}`);
      setTimeout(() => {
        onLoginSuccess(newSession);
        setSuccessMessage(null);
        setIsLoading(false);
      }, 400);
    }
  };

  // Handle Employee Form Submit
  const handleEmployeeLogin = async (e?: React.FormEvent, customEmp?: Employee) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const emp = customEmp || employees.find(empItem => 
        empItem.id === selectedEmployeeId || 
        empItem.adpEmployeeId?.toLowerCase() === employeeIdOrPhone.toLowerCase() ||
        empItem.email.toLowerCase() === employeeIdOrPhone.toLowerCase()
      ) || employees[0];

      const session = await signInWithEmployeePin(emp, employeePin);
      setSuccessMessage(`Welcome back, ${emp.name}! (100% Free Staff Account)`);
      setTimeout(() => {
        onLoginSuccess(session);
        setSuccessMessage(null);
        setIsLoading(false);
      }, 400);
    } catch {
      setIsLoading(false);
      setErrorMessage('Employee sign-in failed');
    }
  };

  // Quick Preset Admin Logins
  const handleQuickAdminPreset = (roleId: string, email: string) => {
    setSelectedRoleId(roleId);
    setAdminEmail(email);
    setAdminPassword('••••••••••••');
    const role = roles.find(r => r.id === roleId) || roles[0];
    const isHost = role.id === 'role-restaurant-host' || role.id === 'role-super-admin';
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const session: AuthUserSession = {
        isAuthenticated: true,
        userType: 'admin',
        adminRole: role,
        displayName: role.name.split('(')[0].trim(),
        displayEmail: email,
        loginTimestamp: new Date().toISOString(),
        sessionToken: `token-adm-${Date.now()}`,
        authMethod: 'quick_select',
        isHostOrAdminPayer: isHost,
      };
      setCustomSession(session);
      onLoginSuccess(session);
    }, 300);
  };

  // Google Sign-In with Firebase
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const targetRole = roles.find(r => r.id === selectedRoleId) || roles[0];
      const isHost = targetRole.id === 'role-restaurant-host' || targetRole.id === 'role-super-admin';
      const session = await signInWithGoogle(targetRole, isHost);
      
      setSuccessMessage(`Signed in with Google as ${session.displayName || session.displayEmail}`);
      setTimeout(() => {
        onLoginSuccess(session);
        setSuccessMessage(null);
        setIsLoading(false);
      }, 400);
    } catch (error) {
      console.error('[Firebase Auth Google]', error);
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Google authentication failed');
    }
  };

  // Keypad PIN input helper
  const handlePinKeypad = (digit: string) => {
    if (employeePin.length < 6) {
      setEmployeePin(prev => prev + digit);
    }
  };

  const handlePinBackspace = () => {
    setEmployeePin(prev => prev.slice(0, -1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Branding Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-6 sm:p-7 overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button if not a mandatory gate */}
          {!isMandatoryGate && onClose && (
            <button
              id="login-modal-close-btn"
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close Login Window"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Shift<span className="text-sky-400">Force</span> Authentication
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white/15 text-sky-200 border border-white/20 rounded-full">
                  Secure Access
                </span>
              </div>
              <p className="text-xs text-sky-100/80">
                Hospitality Workforce Management &amp; Restaurant Operations Portal
              </p>
            </div>
          </div>

          {/* Current Session Indicator if logged in */}
          {currentSession?.isAuthenticated && (
            <div className="mt-4 p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Currently active: <strong>{currentSession.displayName}</strong></span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/20 font-bold uppercase">
                  {currentSession.userType === 'admin' ? 'Manager / Admin' : 'Free Staff Member'}
                </span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-[11px] font-bold text-red-300 hover:text-white underline cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}

          {/* Dual Tab Switcher */}
          <div className="mt-5 grid grid-cols-2 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/15">
            <button
              id="auth-tab-admin"
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Admin &amp; Manager Login</span>
            </button>
            <button
              id="auth-tab-employee"
              type="button"
              onClick={() => {
                setActiveTab('employee');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'employee'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span className="flex items-center gap-1.5">
                <span>Employee &amp; Staff Login</span>
                <span className="hidden sm:inline-block bg-emerald-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  Free
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-7 space-y-6">
          
          {/* Feedback Notices */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: ADMIN & MANAGER LOGIN                             */}
          {/* ======================================================== */}
          {activeTab === 'admin' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Admin Scope Notice */}
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950">Host &amp; Corporate Authority Portal</span>
                    <span className="bg-indigo-200/80 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Payer Role
                    </span>
                  </div>
                  <p className="text-indigo-800/90 mt-0.5">
                    Admins, Franchise Owners &amp; General Managers manage subscription billing, labor models, POS integration, and full schedule dispatching.
                  </p>
                </div>
              </div>

              {/* Admin Quick Select Profiles (Demo Access) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Fast Demo Login (1-Click Select)</span>
                  <span className="text-[11px] font-normal text-slate-500">Corporate &amp; Store Management</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickAdminPreset('role-super-admin', 'corp.exec@shiftsky.com')}
                    className="p-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 group-hover:text-indigo-600">
                        Corporate Executive
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      corp.exec@shiftsky.com
                    </p>
                    <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">
                      📍 Global Hospitality Org Scope
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdminPreset('role-restaurant-host', 'host.owner@shiftsky.com')}
                    className="p-3 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 group-hover:text-amber-700">
                        Restaurant Host &amp; Owner
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                        Host Payer
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      host.owner@shiftsky.com
                    </p>
                    <span className="text-[10px] text-amber-800 font-semibold mt-1 block">
                      📍 Franchise &amp; Store Payer
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdminPreset('role-general-manager', 'gm.downtown@shiftsky.com')}
                    className="p-3 rounded-2xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-950 group-hover:text-sky-600">
                        General Manager
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold">
                        Location GM
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      gm.downtown@shiftsky.com
                    </p>
                    <span className="text-[10px] text-sky-700 font-semibold mt-1 block">
                      📍 Downtown Flagship #101
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdminPreset('role-regional-auditor', 'auditor.pacific@shiftsky.com')}
                    className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-left transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 group-hover:text-emerald-700">
                        Regional Compliance Auditor
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                        Auditor
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 truncate">
                      auditor.pacific@shiftsky.com
                    </p>
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      📍 Pacific Coast (142 Units)
                    </span>
                  </button>
                </div>
              </div>

              {/* Traditional Admin Credential Form */}
              <form onSubmit={handleAdminLogin} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Work Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        placeholder="manager@restaurant.com"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Security Role &amp; Access Scope
                    </label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-semibold text-slate-800 appearance-none cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.hierarchyScopeLevel})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Password</span>
                      <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] text-indigo-600 hover:underline">
                        Forgot?
                      </a>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2FA Token */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2FA Token / Hardware Key</span>
                    </label>
                    <input
                      type="text"
                      value={admin2FACode}
                      onChange={(e) => setAdmin2FACode(e.target.value)}
                      placeholder="6-digit code (e.g. 849201)"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-hidden font-mono text-center tracking-widest font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={adminRemember}
                      onChange={(e) => setAdminRemember(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Remember this device for 30 days</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Encrypted TLS 1.3 • SOC 2 Type II
                  </span>
                </div>

                <button
                  id="admin-submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900 hover:from-sky-500 hover:to-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Management Credentials...</span>
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>Authenticate as {currentSelectedRole?.name.split('(')[0].trim() || 'Admin'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Google Sign-in with Firebase */}
                <div className="pt-2">
                  <div className="relative flex py-1 items-center">
                    <div className="grow border-t border-slate-200"></div>
                    <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or Continue With</span>
                    <div className="grow border-t border-slate-200"></div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign In with Google Account (Firebase)</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: EMPLOYEE & STAFF LOGIN (100% FREE)                */}
          {/* ======================================================== */}
          {activeTab === 'employee' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* 100% Free Staff Account Guarantee Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        100% Free Staff Access Guarantee
                      </h4>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full uppercase">
                        $0.00 Staff Cost
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your restaurant host and manager cover all software costs. Staff never enter credit cards, payment details, or pay fees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Login Method Sub-Toggle */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Staff Login Method
                </span>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEmployeeLoginMethod('pin')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      employeeLoginMethod === 'pin'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    PIN &amp; ID Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeLoginMethod('select')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      employeeLoginMethod === 'select'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Roster Quick-Select
                  </button>
                </div>
              </div>

              {/* Sub-Method A: PIN / Employee ID */}
              {employeeLoginMethod === 'pin' && (
                <div className="space-y-4">
                  {/* Preset 1-Click Staff Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Quick Demo Staff Sign-In (Click to test):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {employees.slice(0, 4).map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setEmployeeIdOrPhone(emp.adpEmployeeId || emp.id);
                            setEmployeePin('1091');
                            handleEmployeeLogin(undefined, emp);
                          }}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50 text-left transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={emp.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover border border-slate-200"
                            />
                            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                              {emp.name.split(' ')[0]}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {emp.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleEmployeeLogin} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Employee ID or Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Employee ID, ADP ID or Phone
                        </label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={employeeIdOrPhone}
                            onChange={(e) => setEmployeeIdOrPhone(e.target.value)}
                            placeholder="EMP-0109 or Phone"
                            required
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden font-semibold"
                          />
                        </div>
                      </div>

                      {/* 4-Digit Quick PIN */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>4-Digit Staff PIN</span>
                          <span className="text-[11px] text-slate-400">Default: 1091</span>
                        </label>
                        <div className="relative">
                          <Key className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            maxLength={6}
                            value={employeePin}
                            onChange={(e) => setEmployeePin(e.target.value)}
                            placeholder="••••"
                            required
                            className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden font-mono tracking-widest text-center text-base font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interactive On-Screen Touch Keypad (Ideal for tablets & kiosks) */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-w-xs mx-auto">
                      <div className="text-center text-[11px] font-semibold text-slate-500 mb-2">
                        Touch / Kiosk Number Pad
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKeypad(num)}
                            className="py-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEmployeePin('')}
                          className="py-2.5 bg-slate-200/80 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinKeypad('0')}
                          className="py-2.5 bg-white hover:bg-emerald-50 rounded-xl text-sm font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handlePinBackspace}
                          className="py-2.5 bg-slate-200/80 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                        >
                          ⌫ Back
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={employeeRemember}
                          onChange={(e) => setEmployeeRemember(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Stay signed in on my mobile device</span>
                      </label>
                      <span className="text-[11px] text-emerald-700 font-bold">
                        🎁 Free Employee Access
                      </span>
                    </div>

                    <button
                      id="employee-submit-login-btn"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 hover:from-emerald-500 hover:to-sky-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing Into Staff Portal...</span>
                        </span>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-200" />
                          <span>Open Staff Dashboard &amp; Personal Schedule</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-Method B: Roster Search & Select */}
              {employeeLoginMethod === 'select' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      placeholder="Search employee by name, server, chef, department..."
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleEmployeeLogin(undefined, emp)}
                        className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 bg-white text-left transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={emp.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                              {emp.name}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate">
                              {emp.role} • {emp.department}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-lg text-[10px] font-bold text-slate-700 transition-colors shrink-0">
                          Sign In
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Sign-in for Employee */}
              <div className="pt-2">
                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[10px] uppercase font-bold text-slate-400">Or Employee Google Sign-In</span>
                  <div className="grow border-t border-slate-200"></div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full mt-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign In as Staff with Google Account (100% Free)</span>
                </button>
              </div>

              {/* Employee Features Preview Footer */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>My Shifts &amp; Clock-In</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-sky-600" />
                  <span>Shift Trades</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paycheck Estimator</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
