import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  Mail,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Wine,
  UtensilsCrossed,
  UserCheck,
  AlertOctagon,
  RefreshCw,
  Send,
  Check,
  X,
  FileText,
  Smartphone,
  MessageSquare,
  BellRing,
  CheckCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Employee, Department, AlcoholHandlerCard, FoodHandlerCard, SupportedLanguage } from '../types';

interface CertificationComplianceWidgetProps {
  employees: Employee[];
  onUpdateEmployee?: (updatedEmployee: Employee) => void;
  currentLanguage?: SupportedLanguage;
}

export type UrgencyFilter = 'all' | 'expiring_30' | 'expired' | 'valid' | 'missing';
export type CertTypeFilter = 'all' | 'alcohol' | 'food';
export type NotificationChannel = 'sms' | 'email' | 'both';

interface EnrichedCertRecord {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeePhone: string;
  employeeRole: string;
  department: Department;
  avatarUrl?: string;
  certType: 'alcohol' | 'food';
  certTypeName: string;
  cardNumber: string;
  issuingAuthority: string;
  state?: string;
  issueDate: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  verified: boolean;
  isRequiredForRole: boolean;
}

interface NotificationHistoryItem {
  channel: NotificationChannel;
  timestamp: string;
  customMessage?: string;
}

export const CertificationComplianceWidget: React.FC<CertificationComplianceWidgetProps> = ({
  employees,
  onUpdateEmployee,
  currentLanguage = 'en'
}) => {
  // Filters and Interactive State
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [certTypeFilter, setCertTypeFilter] = useState<CertTypeFilter>('all');
  const [deptFilter, setDeptFilter] = useState<Department | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRegulatoryGuide, setShowRegulatoryGuide] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Modal State for Updating/Renewing a Certification
  const [editingCertRecord, setEditingCertRecord] = useState<EnrichedCertRecord | null>(null);
  const [editCardNumber, setEditCardNumber] = useState<string>('');
  const [editAuthority, setEditAuthority] = useState<string>('');
  const [editIssueDate, setEditIssueDate] = useState<string>('');
  const [editExpirationDate, setEditExpirationDate] = useState<string>('');
  const [editVerified, setEditVerified] = useState<boolean>(true);

  // Modal State for Dedicated Notify Action
  const [notifyingCertRecord, setNotifyingCertRecord] = useState<EnrichedCertRecord | null>(null);
  const [notifyChannel, setNotifyChannel] = useState<NotificationChannel>('both');
  const [customNotifyMessage, setCustomNotifyMessage] = useState<string>('');
  const [isSendingNotification, setIsSendingNotification] = useState<boolean>(false);

  // Track Recent Notifications in Session (Key: employeeId-certType)
  const [notificationHistory, setNotificationHistory] = useState<Record<string, NotificationHistoryItem>>({
    'emp-2-alcohol': {
      channel: 'both',
      timestamp: 'Yesterday at 3:15 PM'
    }
  });

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reference Date for Calculation (Current simulation time is Aug 2026)
  const today = useMemo(() => new Date(), []);

  // Helper to calculate days remaining
  const calculateDaysRemaining = (expDateStr: string): number => {
    if (!expDateStr) return -999;
    const expDate = new Date(expDateStr);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Build Enriched Certificate Records from Employees
  const allCertRecords = useMemo(() => {
    const records: EnrichedCertRecord[] = [];

    employees.forEach(emp => {
      // 1. Check Alcohol Handler Card
      const needsAlcoholCert = ['Lead Bartender', 'Bartender', 'Barback', 'Server', 'Head Server', 'General Manager', 'Assistant GM', 'Shift Supervisor'].includes(emp.role);
      
      if (emp.alcoholHandlerCard) {
        const days = calculateDaysRemaining(emp.alcoholHandlerCard.expirationDate);
        let status: 'valid' | 'expiring_soon' | 'expired' | 'missing' = 'valid';
        if (days < 0) status = 'expired';
        else if (days <= 30) status = 'expiring_soon';

        records.push({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@workqora.restaurant`,
          employeePhone: emp.phone || '+1 (555) 234-8901',
          employeeRole: emp.role,
          department: emp.department,
          avatarUrl: emp.avatarUrl,
          certType: 'alcohol',
          certTypeName: 'Alcohol Handler (RBS / TIPS)',
          cardNumber: emp.alcoholHandlerCard.cardNumber,
          issuingAuthority: emp.alcoholHandlerCard.issuingAuthority || 'California RBS (ABC Certified)',
          state: emp.alcoholHandlerCard.state || 'CA',
          issueDate: emp.alcoholHandlerCard.issueDate,
          expirationDate: emp.alcoholHandlerCard.expirationDate,
          daysRemaining: days,
          status,
          verified: emp.alcoholHandlerCard.verified,
          isRequiredForRole: needsAlcoholCert
        });
      } else if (needsAlcoholCert) {
        // Missing required alcohol card
        records.push({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@workqora.restaurant`,
          employeePhone: emp.phone || '+1 (555) 234-8901',
          employeeRole: emp.role,
          department: emp.department,
          avatarUrl: emp.avatarUrl,
          certType: 'alcohol',
          certTypeName: 'Alcohol Handler (RBS / TIPS)',
          cardNumber: 'MISSING',
          issuingAuthority: 'Not On File',
          state: 'CA',
          issueDate: 'N/A',
          expirationDate: 'N/A',
          daysRemaining: -999,
          status: 'missing',
          verified: false,
          isRequiredForRole: true
        });
      }

      // 2. Check Food Handler / Food Safety Card
      const needsFoodCert = true; // All restaurant workers require food safety or food handler in commercial operations
      
      if (emp.foodHandlerCard) {
        const days = calculateDaysRemaining(emp.foodHandlerCard.expirationDate);
        let status: 'valid' | 'expiring_soon' | 'expired' | 'missing' = 'valid';
        if (days < 0) status = 'expired';
        else if (days <= 30) status = 'expiring_soon';

        records.push({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@workqora.restaurant`,
          employeePhone: emp.phone || '+1 (555) 234-8901',
          employeeRole: emp.role,
          department: emp.department,
          avatarUrl: emp.avatarUrl,
          certType: 'food',
          certTypeName: emp.foodHandlerCard.issuingAuthority?.includes('Manager') ? 'Food Protection Manager' : 'Food Handler Safety',
          cardNumber: emp.foodHandlerCard.cardNumber,
          issuingAuthority: emp.foodHandlerCard.issuingAuthority || 'ServSafe Food Handler',
          issueDate: emp.foodHandlerCard.issueDate,
          expirationDate: emp.foodHandlerCard.expirationDate,
          daysRemaining: days,
          status,
          verified: emp.foodHandlerCard.verified,
          isRequiredForRole: needsFoodCert
        });
      } else {
        // Missing food card
        records.push({
          employeeId: emp.id,
          employeeName: emp.name,
          employeeEmail: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@workqora.restaurant`,
          employeePhone: emp.phone || '+1 (555) 234-8901',
          employeeRole: emp.role,
          department: emp.department,
          avatarUrl: emp.avatarUrl,
          certType: 'food',
          certTypeName: 'Food Handler Safety',
          cardNumber: 'MISSING',
          issuingAuthority: 'Not On File',
          issueDate: 'N/A',
          expirationDate: 'N/A',
          daysRemaining: -999,
          status: 'missing',
          verified: false,
          isRequiredForRole: true
        });
      }
    });

    return records;
  }, [employees, today]);

  // Aggregate Metrics & Key Performance Indicators
  const complianceStats = useMemo(() => {
    const totalRecords = allCertRecords.length;
    const expiringIn30Days = allCertRecords.filter(r => r.status === 'expiring_soon');
    const expiredRecords = allCertRecords.filter(r => r.status === 'expired');
    const missingRecords = allCertRecords.filter(r => r.status === 'missing');
    const validRecords = allCertRecords.filter(r => r.status === 'valid');

    // Alcohol specific
    const alcoholRecords = allCertRecords.filter(r => r.certType === 'alcohol');
    const alcoholValidCount = alcoholRecords.filter(r => r.status === 'valid' || (r.status === 'expiring_soon' && r.daysRemaining > 0)).length;
    const alcoholCompliancePct = alcoholRecords.length > 0 ? Math.round((alcoholValidCount / alcoholRecords.length) * 100) : 100;

    // Food specific
    const foodRecords = allCertRecords.filter(r => r.certType === 'food');
    const foodValidCount = foodRecords.filter(r => r.status === 'valid' || (r.status === 'expiring_soon' && r.daysRemaining > 0)).length;
    const foodCompliancePct = foodRecords.length > 0 ? Math.round((foodValidCount / foodRecords.length) * 100) : 100;

    // Overall Compliance Score (% of all certs currently valid or in grace period)
    const overallValidCount = validRecords.length + expiringIn30Days.length;
    const overallCompliancePct = totalRecords > 0 ? Math.round((overallValidCount / totalRecords) * 100) : 100;

    // Unique employees with upcoming expirations
    const employeesNeedingRenewal = new Set(expiringIn30Days.map(r => r.employeeId));
    const employeesWithExpired = new Set(expiredRecords.map(r => r.employeeId));

    return {
      totalRecords,
      expiringIn30DaysCount: expiringIn30Days.length,
      expiringIn30DaysList: expiringIn30Days,
      expiredCount: expiredRecords.length,
      expiredList: expiredRecords,
      missingCount: missingRecords.length,
      validCount: validRecords.length,
      overallCompliancePct,
      alcoholCompliancePct,
      foodCompliancePct,
      uniqueEmployeesExpiringCount: employeesNeedingRenewal.size,
      uniqueEmployeesExpiredCount: employeesWithExpired.size
    };
  }, [allCertRecords]);

  // Department Compliance Chart Data
  const departmentChartData = useMemo(() => {
    const depts: Department[] = [
      'Front of House',
      'Back of House',
      'Bar & Beverage',
      'Kitchen Prep & Dish',
      'Management'
    ];

    return depts.map(dept => {
      const deptRecords = allCertRecords.filter(r => r.department === dept);
      const total = deptRecords.length;
      const valid = deptRecords.filter(r => r.status === 'valid').length;
      const expiring30 = deptRecords.filter(r => r.status === 'expiring_soon').length;
      const expired = deptRecords.filter(r => r.status === 'expired').length;
      const missing = deptRecords.filter(r => r.status === 'missing').length;

      const rate = total > 0 ? Math.round(((valid + expiring30) / total) * 100) : 100;

      return {
        department: dept.replace('& Beverage', '& Bar').replace('Kitchen Prep & Dish', 'Prep & Dish'),
        fullDepartmentName: dept,
        complianceRate: rate,
        valid,
        expiring30,
        expired,
        missing,
        total
      };
    });
  }, [allCertRecords]);

  // Expiration Timeline Buckets
  const timelineBuckets = useMemo(() => {
    let expired = 0;
    let next7Days = 0;
    let next14Days = 0;
    let next30Days = 0;
    let days31to90 = 0;
    let over90Days = 0;

    allCertRecords.forEach(r => {
      if (r.status === 'missing') return;
      if (r.daysRemaining < 0) expired += 1;
      else if (r.daysRemaining <= 7) next7Days += 1;
      else if (r.daysRemaining <= 14) next14Days += 1;
      else if (r.daysRemaining <= 30) next30Days += 1;
      else if (r.daysRemaining <= 90) days31to90 += 1;
      else over90Days += 1;
    });

    return [
      { name: 'Expired', count: expired, color: '#e11d48' },
      { name: '1-7 Days', count: next7Days, color: '#f43f5e' },
      { name: '8-14 Days', count: next14Days, color: '#f59e0b' },
      { name: '15-30 Days', count: next30Days, color: '#fbbf24' },
      { name: '31-90 Days', count: days31to90, color: '#38bdf8' },
      { name: '90+ Days', count: over90Days, color: '#10b981' }
    ];
  }, [allCertRecords]);

  // Filtered Records for Table Display
  const filteredRecords = useMemo(() => {
    return allCertRecords.filter(r => {
      // Urgency Filter
      if (urgencyFilter === 'expiring_30' && r.status !== 'expiring_soon') return false;
      if (urgencyFilter === 'expired' && r.status !== 'expired') return false;
      if (urgencyFilter === 'valid' && r.status !== 'valid') return false;
      if (urgencyFilter === 'missing' && r.status !== 'missing') return false;

      // Cert Type Filter
      if (certTypeFilter === 'alcohol' && r.certType !== 'alcohol') return false;
      if (certTypeFilter === 'food' && r.certType !== 'food') return false;

      // Department Filter
      if (deptFilter !== 'all' && r.department !== deptFilter) return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = r.employeeName.toLowerCase().includes(q);
        const matchRole = r.employeeRole.toLowerCase().includes(q);
        const matchCard = r.cardNumber.toLowerCase().includes(q);
        const matchAuth = r.issuingAuthority.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchCard && !matchAuth) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort priority: Expired first, then closest to expiration, then valid
      if (a.status === 'expired' && b.status !== 'expired') return -1;
      if (b.status === 'expired' && a.status !== 'expired') return 1;
      if (a.status === 'expiring_soon' && b.status !== 'expiring_soon') return -1;
      if (b.status === 'expiring_soon' && a.status !== 'expiring_soon') return 1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [allCertRecords, urgencyFilter, certTypeFilter, deptFilter, searchQuery]);

  // Handlers
  const handleOpenEditModal = (rec: EnrichedCertRecord) => {
    setEditingCertRecord(rec);
    setEditCardNumber(rec.cardNumber === 'MISSING' ? '' : rec.cardNumber);
    setEditAuthority(rec.issuingAuthority === 'Not On File' ? (rec.certType === 'alcohol' ? 'California RBS ABC' : 'ServSafe Food Handler') : rec.issuingAuthority);
    setEditIssueDate(rec.issueDate === 'N/A' ? new Date().toISOString().split('T')[0] : rec.issueDate);
    
    // Default expiration to 3 years from today for standard renewal
    const defaultExp = new Date();
    defaultExp.setFullYear(defaultExp.getFullYear() + 3);
    setEditExpirationDate(rec.expirationDate === 'N/A' ? defaultExp.toISOString().split('T')[0] : rec.expirationDate);
    setEditVerified(true);
  };

  const handleSaveRenewal = () => {
    if (!editingCertRecord) return;

    const targetEmp = employees.find(e => e.id === editingCertRecord.employeeId);
    if (!targetEmp) return;

    const updatedEmp: Employee = { ...targetEmp };

    if (editingCertRecord.certType === 'alcohol') {
      const updatedAlcoholCard: AlcoholHandlerCard = {
        cardNumber: editCardNumber || `RBS-${Math.floor(10000 + Math.random() * 90000)}`,
        issuingAuthority: editAuthority || 'California RBS',
        state: 'CA',
        issueDate: editIssueDate,
        expirationDate: editExpirationDate,
        verified: editVerified,
        status: calculateDaysRemaining(editExpirationDate) < 0 ? 'expired' : calculateDaysRemaining(editExpirationDate) <= 30 ? 'expiring_soon' : 'valid'
      };
      updatedEmp.alcoholHandlerCard = updatedAlcoholCard;
    } else {
      const updatedFoodCard: FoodHandlerCard = {
        cardNumber: editCardNumber || `FHD-${Math.floor(10000 + Math.random() * 90000)}`,
        issuingAuthority: editAuthority || 'ServSafe Food Handler',
        issueDate: editIssueDate,
        expirationDate: editExpirationDate,
        verified: editVerified,
        status: calculateDaysRemaining(editExpirationDate) < 0 ? 'expired' : calculateDaysRemaining(editExpirationDate) <= 30 ? 'expiring_soon' : 'valid'
      };
      updatedEmp.foodHandlerCard = updatedFoodCard;
    }

    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmp);
    }

    setToastMessage(`Successfully updated certification for ${editingCertRecord.employeeName}`);
    setTimeout(() => setToastMessage(null), 4000);
    setEditingCertRecord(null);
  };

  // Helper to generate default notification message
  const generateDefaultMessage = (rec: EnrichedCertRecord, channel: NotificationChannel): string => {
    const portalUrl = rec.certType === 'alcohol' ? 'https://rbs.abc.ca.gov/' : 'https://www.servsafe.com/ServSafe-Food-Handler';
    
    if (rec.status === 'expired') {
      return `[URGENT COMPLIANCE NOTICE] Hi ${rec.employeeName}, your ${rec.certTypeName} expired on ${rec.expirationDate}. State and health regulations require a valid card to remain on active shifts. Please complete your renewal immediately: ${portalUrl}`;
    }
    if (rec.status === 'expiring_soon') {
      return `[COMPLIANCE ACTION REQUIRED] Hi ${rec.employeeName}, your ${rec.certTypeName} (Card #${rec.cardNumber}) expires in ${rec.daysRemaining} days on ${rec.expirationDate}. Please complete your 3-year renewal training to keep your shift scheduling active: ${portalUrl}`;
    }
    if (rec.status === 'missing') {
      return `[ACTION REQUIRED] Hi ${rec.employeeName}, our compliance records show you do not have an active ${rec.certTypeName} on file. Please complete your certification within statutory timeline: ${portalUrl}`;
    }
    return `[COMPLIANCE CHECK-IN] Hi ${rec.employeeName}, your ${rec.certTypeName} (Card #${rec.cardNumber}) is valid until ${rec.expirationDate} (${rec.daysRemaining} days remaining). Thank you for keeping your certifications up to date!`;
  };

  // Handlers for Notification Action
  const handleOpenNotifyModal = (rec: EnrichedCertRecord, defaultChannel: NotificationChannel = 'both') => {
    setNotifyingCertRecord(rec);
    setNotifyChannel(defaultChannel);
    setCustomNotifyMessage(generateDefaultMessage(rec, defaultChannel));
  };

  const handleApplyPresetMessage = (presetType: 'standard_30' | 'urgent_expired' | 'portal_link') => {
    if (!notifyingCertRecord) return;
    const portalUrl = notifyingCertRecord.certType === 'alcohol' ? 'https://rbs.abc.ca.gov/' : 'https://www.servsafe.com/ServSafe-Food-Handler';
    
    if (presetType === 'standard_30') {
      setCustomNotifyMessage(`Hi ${notifyingCertRecord.employeeName}, your ${notifyingCertRecord.certTypeName} expires in ${notifyingCertRecord.daysRemaining} days on ${notifyingCertRecord.expirationDate}. Please start your renewal course at ${portalUrl} to avoid any shift interruptions.`);
    } else if (presetType === 'urgent_expired') {
      setCustomNotifyMessage(`🚨 URGENT: Hi ${notifyingCertRecord.employeeName}, your ${notifyingCertRecord.certTypeName} has EXPIRED as of ${notifyingCertRecord.expirationDate}. You must renew your certification immediately before your next scheduled shift. Complete online at ${portalUrl}.`);
    } else {
      setCustomNotifyMessage(`Hi ${notifyingCertRecord.employeeName}, here is the official renewal portal link for your ${notifyingCertRecord.certTypeName}: ${portalUrl}. Please forward your certificate once completed.`);
    }
  };

  const handleSendNotificationFromModal = () => {
    if (!notifyingCertRecord) return;
    setIsSendingNotification(true);

    setTimeout(() => {
      const key = `${notifyingCertRecord.employeeId}-${notifyingCertRecord.certType}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setNotificationHistory(prev => ({
        ...prev,
        [key]: {
          channel: notifyChannel,
          timestamp: `Today at ${timeStr}`,
          customMessage: customNotifyMessage
        }
      }));

      setIsSendingNotification(false);
      setNotifyingCertRecord(null);

      const channelLabel = notifyChannel === 'both' ? 'SMS & App Email' : notifyChannel === 'sms' ? 'Automated SMS' : 'App Email';
      setToastMessage(`✓ Automated ${channelLabel} reminder sent to ${notifyingCertRecord.employeeName} (${notifyingCertRecord.employeePhone})`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 450);
  };

  const handleQuickNotify = (rec: EnrichedCertRecord, channel: NotificationChannel = 'both') => {
    const key = `${rec.employeeId}-${rec.certType}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setNotificationHistory(prev => ({
      ...prev,
      [key]: {
        channel,
        timestamp: `Today at ${timeStr}`
      }
    }));

    const channelLabel = channel === 'both' ? 'SMS & App Email' : channel === 'sms' ? 'Automated SMS' : 'App Email';
    setToastMessage(`✓ Instant ${channelLabel} sent to ${rec.employeeName} (${rec.employeePhone} / ${rec.employeeEmail})`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleBatchSend30DayReminders = () => {
    const expiringList = [...complianceStats.expiringIn30DaysList, ...complianceStats.expiredList];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setNotificationHistory(prev => {
      const updated = { ...prev };
      expiringList.forEach(rec => {
        const key = `${rec.employeeId}-${rec.certType}`;
        updated[key] = {
          channel: 'both',
          timestamp: `Today at ${timeStr}`
        };
      });
      return updated;
    });

    setToastMessage(`✓ Batch automated SMS & App Email reminders dispatched to ${expiringList.length} employees expiring within ≤30 days.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Employee Name',
      'Role',
      'Department',
      'Certification Type',
      'Card Number',
      'Issuing Authority',
      'Issue Date',
      'Expiration Date',
      'Days Remaining',
      'Status',
      'Verified'
    ];

    const rows = allCertRecords.map(r => [
      `"${r.employeeName}"`,
      `"${r.employeeRole}"`,
      `"${r.department}"`,
      `"${r.certTypeName}"`,
      `"${r.cardNumber}"`,
      `"${r.issuingAuthority}"`,
      r.issueDate,
      r.expirationDate,
      r.daysRemaining,
      r.status,
      r.verified ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workqora-certification-compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden transition-all">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-200 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-sky-50/30 to-amber-50/20">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Employee Certification &amp; Safety Compliance Audit</span>
              </h3>
              
              {/* 30-Day Expiration Badge Alert */}
              {complianceStats.expiringIn30DaysCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-black bg-amber-100 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1.5 animate-pulse shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>{complianceStats.expiringIn30DaysCount} Expiring in &le;30 Days</span>
                </span>
              )}

              {complianceStats.expiredCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-black bg-rose-100 text-rose-900 rounded-full border border-rose-300 flex items-center gap-1.5 shadow-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>{complianceStats.expiredCount} Expired</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated tracking of mandatory Alcohol Handler (CA RBS / TIPS) and Food Safety certifications with 30-day renewal warnings
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <button
            onClick={() => setShowRegulatoryGuide(!showRegulatoryGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            title="View State & Health Department Compliance Mandates"
          >
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span>{showRegulatoryGuide ? 'Hide Standards' : 'Legal Standards'}</span>
          </button>

          {(complianceStats.expiringIn30DaysCount > 0 || complianceStats.expiredCount > 0) && (
            <button
              onClick={handleBatchSend30DayReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Dispatches automated SMS/Push reminder to staff expiring within 30 days"
            >
              <Send className="w-3.5 h-3.5 text-amber-700" />
              <span>Remind All 30d</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Download CSV Audit Report"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Audit CSV</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
            title={isExpanded ? 'Collapse Widget' : 'Expand Widget'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Regulatory Standards Guide */}
      {showRegulatoryGuide && (
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Restaurant Compliance Regulatory Guidelines &amp; Statutory Timelines
            </span>
            <button
              onClick={() => setShowRegulatoryGuide(false)}
              className="text-slate-400 hover:text-white cursor-pointer text-[11px]"
            >
              Close Guide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <Wine className="w-3.5 h-3.5" />
                Alcohol Server Training (CA RBS / AB 1221)
              </div>
              <p className="text-slate-300">
                All servers, bartenders, and managers must be RBS certified by an accredited training provider and pass the state ABC exam within <strong>60 days of hire</strong>. Certifications are valid for <strong>3 years</strong>.
              </p>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Food Handler Safety (Health Code)
              </div>
              <p className="text-slate-300">
                Mandatory for all food handlers (prep, line cooks, dishwashers, bussers) within <strong>30 days of employment</strong>. Requires renewal every <strong>3 years</strong> to maintain municipal food safety permit compliance.
              </p>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
              <div className="font-bold text-sky-300 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                30-Day Active Renewal Window
              </div>
              <p className="text-slate-300">
                Workqora automatically initiates automated proactive employee notifications at <strong>30 days, 14 days, and 7 days</strong> before certificate expiration to ensure non-stop operational compliance without shift disqualification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-6">

          {/* 1. TOP 4 EXECUTIVE COMPLIANCE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Card 1: 30-Day Renewal Watchlist */}
            <div
              onClick={() => setUrgencyFilter(urgencyFilter === 'expiring_30' ? 'all' : 'expiring_30')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                urgencyFilter === 'expiring_30'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-amber-50/50 hover:bg-amber-50/80 border-amber-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Expiring in &le;30 Days
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-amber-900">
                  {complianceStats.expiringIn30DaysCount}
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  certificates
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 mt-1 font-medium">
                {complianceStats.uniqueEmployeesExpiringCount} team member{complianceStats.uniqueEmployeesExpiringCount === 1 ? '' : 's'} need renewal
              </p>
              <div className="mt-2 text-[10px] font-semibold text-amber-700 flex items-center justify-between">
                <span>Click to filter roster</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 2: Expired Certifications (Hazard Alert) */}
            <div
              onClick={() => setUrgencyFilter(urgencyFilter === 'expired' ? 'all' : 'expired')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                urgencyFilter === 'expired'
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/40 shadow-xs'
                  : 'bg-rose-50/40 hover:bg-rose-50/70 border-rose-200/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-900 flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-700" />
                  Expired Certifications
                </span>
                {complianceStats.expiredCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-600 text-white rounded-md">
                    Urgent
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-rose-900">
                  {complianceStats.expiredCount}
                </span>
                <span className="text-[11px] font-bold text-rose-800">
                  non-compliant
                </span>
              </div>
              <p className="text-[11px] text-rose-700 mt-1 font-medium">
                Immediate health / ABC inspection risk
              </p>
              <div className="mt-2 text-[10px] font-semibold text-rose-700 flex items-center justify-between">
                <span>Click to view expired</span>
                <span>&rarr;</span>
              </div>
            </div>

            {/* Card 3: Alcohol Handler RBS / TIPS Compliance */}
            <div
              onClick={() => setCertTypeFilter(certTypeFilter === 'alcohol' ? 'all' : 'alcohol')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                certTypeFilter === 'alcohol'
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/40 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900 flex items-center gap-1">
                  <Wine className="w-3.5 h-3.5 text-purple-700" />
                  Alcohol RBS / TIPS
                </span>
                <span className="font-mono font-bold text-purple-700 text-xs">{complianceStats.alcoholCompliancePct}%</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {complianceStats.alcoholCompliancePct}%
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  FOH &amp; Bar Valid
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${complianceStats.alcoholCompliancePct >= 95 ? 'bg-emerald-500' : 'bg-purple-600'}`}
                  style={{ width: `${complianceStats.alcoholCompliancePct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Mandatory for all drink service staff
              </p>
            </div>

            {/* Card 4: Food Safety & Handler Compliance */}
            <div
              onClick={() => setCertTypeFilter(certTypeFilter === 'food' ? 'all' : 'food')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                certTypeFilter === 'food'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-700" />
                  Food Safety Compliance
                </span>
                <span className="font-mono font-bold text-emerald-700 text-xs">{complianceStats.foodCompliancePct}%</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-slate-900">
                  {complianceStats.foodCompliancePct}%
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Kitchen &amp; Prep Valid
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${complianceStats.foodCompliancePct >= 95 ? 'bg-emerald-500' : 'bg-emerald-600'}`}
                  style={{ width: `${complianceStats.foodCompliancePct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                ServSafe &amp; State Food Handler certs
              </p>
            </div>

          </div>

          {/* 2. DUAL VISUALIZATION: DEPARTMENT COMPLIANCE RATE & EXPIRATION TIMELINE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Chart 1: Department Compliance Bar Chart */}
            <div className="lg:col-span-7 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-600" />
                  <h4 className="font-bold text-xs text-slate-800">
                    Certification Compliance Rate by Department (%)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Target: 100% Valid
                </span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentChartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="department"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `${v}%`}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <div className="font-bold text-sky-300">{data.fullDepartmentName}</div>
                              <div className="flex justify-between gap-3 text-slate-300">
                                <span>Compliance Rate:</span>
                                <span className="font-bold font-mono text-white">{data.complianceRate}%</span>
                              </div>
                              <div className="flex justify-between gap-3 text-[11px] text-emerald-400">
                                <span>Valid &gt;30d:</span>
                                <span className="font-mono">{data.valid}</span>
                              </div>
                              {data.expiring30 > 0 && (
                                <div className="flex justify-between gap-3 text-[11px] text-amber-400 font-bold">
                                  <span>Expiring &le;30d:</span>
                                  <span className="font-mono">{data.expiring30}</span>
                                </div>
                              )}
                              {data.expired > 0 && (
                                <div className="flex justify-between gap-3 text-[11px] text-rose-400 font-bold">
                                  <span>Expired:</span>
                                  <span className="font-mono">{data.expired}</span>
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                                Total Monitored: {data.total}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="complianceRate"
                      name="Compliance %"
                      radius={[4, 4, 0, 0]}
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.complianceRate >= 95 ? '#059669' : entry.complianceRate >= 80 ? '#0284c7' : '#e11d48'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  &ge;95% Pristine
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                  80-94% Active
                </span>
                <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  &lt;80% Renewal Needed
                </span>
              </div>
            </div>

            {/* Chart 2: Expiration Horizon Breakdown */}
            <div className="lg:col-span-5 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-xs text-slate-800">
                      Certification Expiration Horizon
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                    30-Day Window Focus
                  </span>
                </div>

                {/* Visual Horizon Progress Bars */}
                <div className="space-y-2 mt-3">
                  {timelineBuckets.map(bucket => {
                    const pct = complianceStats.totalRecords > 0 ? Math.round((bucket.count / complianceStats.totalRecords) * 100) : 0;
                    return (
                      <div key={bucket.name} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-700">{bucket.name}</span>
                          <span className="font-mono text-slate-900 font-bold">
                            {bucket.count} <span className="text-slate-400 font-normal text-[10px]">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(4, pct)}%`, backgroundColor: bucket.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-100/80 border border-amber-300/80 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mt-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Upcoming 30-Day Milestone:</strong> {complianceStats.expiringIn30DaysCount} staff certifications expire in &le;30 days.
                  </span>
                </div>
                {complianceStats.expiringIn30DaysCount > 0 && (
                  <button
                    onClick={handleBatchSend30DayReminders}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Notify All ({complianceStats.expiringIn30DaysCount})</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* 3. SEARCH & INTERACTIVE FILTER BAR */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-500 mr-1">Filter:</span>
              
              <button
                onClick={() => setUrgencyFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  urgencyFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Certs ({allCertRecords.length})
              </button>

              <button
                onClick={() => setUrgencyFilter('expiring_30')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  urgencyFilter === 'expiring_30'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3 h-3 text-amber-700" />
                <span>🚨 Expiring &le;30 Days ({complianceStats.expiringIn30DaysCount})</span>
              </button>

              <button
                onClick={() => setUrgencyFilter('expired')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  urgencyFilter === 'expired'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-700" />
                <span>Expired ({complianceStats.expiredCount})</span>
              </button>

              <button
                onClick={() => setUrgencyFilter('valid')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  urgencyFilter === 'valid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Valid &gt;30d ({complianceStats.validCount})
              </button>
            </div>

            {/* Secondary Selectors (Type, Dept, Search) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-medium">Type:</span>
                <select
                  value={certTypeFilter}
                  onChange={(e) => setCertTypeFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="alcohol">🍷 Alcohol Handler</option>
                  <option value="food">🍳 Food Safety</option>
                </select>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-medium">Dept:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  <option value="Front of House">Front of House</option>
                  <option value="Back of House">Back of House</option>
                  <option value="Bar & Beverage">Bar & Beverage</option>
                  <option value="Kitchen Prep & Dish">Kitchen Prep & Dish</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff, card #, authority..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 w-44 sm:w-52"
                />
              </div>
            </div>

          </div>

          {/* 4. COMPREHENSIVE CERTIFICATION COMPLIANCE ROSTER TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5">Employee &amp; Station</th>
                  <th className="py-3 px-3">Certification</th>
                  <th className="py-3 px-3">Card Number &amp; Issuer</th>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Expiration Date</th>
                  <th className="py-3 px-3 text-center">Countdown &amp; Status</th>
                  <th className="py-3 px-3 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No certifications match your selected filter criteria.</p>
                        <button
                          onClick={() => {
                            setUrgencyFilter('all');
                            setCertTypeFilter('all');
                            setDeptFilter('all');
                            setSearchQuery('');
                          }}
                          className="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isExpiring30 = rec.status === 'expiring_soon';
                    const isExpired = rec.status === 'expired';
                    const isMissing = rec.status === 'missing';

                    return (
                      <tr
                        key={`${rec.employeeId}-${rec.certType}`}
                        className={`transition-colors ${
                          isExpired ? 'bg-rose-50/40 hover:bg-rose-50/70' :
                          isExpiring30 ? 'bg-amber-50/30 hover:bg-amber-50/60' :
                          'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Employee Details */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            {rec.avatarUrl ? (
                              <img
                                src={rec.avatarUrl}
                                alt={rec.employeeName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {rec.employeeName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className={`font-bold ${isExpired ? 'text-rose-950 font-black' : 'text-slate-900'}`}>
                                {rec.employeeName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span>{rec.employeeRole}</span>
                                <span>&bull;</span>
                                <span className="text-slate-400">{rec.department}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Certification Type */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            {rec.certType === 'alcohol' ? (
                              <span className="p-1 rounded-md bg-purple-100 text-purple-700 shrink-0">
                                <Wine className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
                                <UtensilsCrossed className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {rec.certTypeName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {rec.certType === 'alcohol' ? 'Alcohol Server (RBS/TIPS)' : 'Food Sanitation & Hygiene'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Card Number & Authority */}
                        <td className="py-3 px-3 font-mono">
                          <div className="font-bold text-slate-800 text-[11px]">
                            {rec.cardNumber}
                          </div>
                          <div className="text-[10px] font-sans text-slate-500 truncate max-w-[160px]">
                            {rec.issuingAuthority} {rec.state ? `(${rec.state})` : ''}
                          </div>
                        </td>

                        {/* Issue Date */}
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                          {rec.issueDate}
                        </td>

                        {/* Expiration Date */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          <span className={isExpired ? 'text-rose-700 font-bold' : isExpiring30 ? 'text-amber-800 font-bold' : 'text-slate-800 font-semibold'}>
                            {rec.expirationDate}
                          </span>
                        </td>

                        {/* Countdown Badge & Health Status */}
                        <td className="py-3 px-3 text-center">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Expired ({Math.abs(rec.daysRemaining)}d ago)</span>
                            </span>
                          ) : isExpiring30 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>{rec.daysRemaining} days left</span>
                            </span>
                          ) : isMissing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              <AlertOctagon className="w-3 h-3 text-slate-500" />
                              <span>Missing Card</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Valid ({rec.daysRemaining}d)</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Dedicated Notify Action Button */}
                              {isExpiring30 ? (
                                <button
                                  onClick={() => handleOpenNotifyModal(rec, 'both')}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 border border-amber-400 rounded-lg shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Send Automated 30-Day Expiration Reminder via SMS & Email"
                                >
                                  <BellRing className="w-3.5 h-3.5 text-amber-900 animate-bounce" />
                                  <span>Notify</span>
                                </button>
                              ) : isExpired ? (
                                <button
                                  onClick={() => handleOpenNotifyModal(rec, 'both')}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Send Urgent Expired Certification Notice via SMS & Email"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                  <span>Notify</span>
                                </button>
                              ) : isMissing ? (
                                <button
                                  onClick={() => handleOpenNotifyModal(rec, 'both')}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                                  title="Send Missing Certification Notice"
                                >
                                  <Send className="w-3.5 h-3.5 text-slate-700" />
                                  <span>Notify</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenNotifyModal(rec, 'both')}
                                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300 border border-slate-200 rounded-lg transition-all cursor-pointer"
                                  title="Send Compliance Check-in Notification"
                                >
                                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Notify</span>
                                </button>
                              )}

                              {/* Edit / Renew Card */}
                              <button
                                onClick={() => handleOpenEditModal(rec)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-all cursor-pointer border border-sky-200"
                                title="Log Certification Renewal or Update Details"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Renew</span>
                              </button>
                            </div>

                            {/* Notification Status Stamp */}
                            {notificationHistory[`${rec.employeeId}-${rec.certType}`] && (
                              <div
                                className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80"
                                title={`Dispatched ${notificationHistory[`${rec.employeeId}-${rec.certType}`].timestamp} via ${notificationHistory[`${rec.employeeId}-${rec.certType}`].channel.toUpperCase()}`}
                              >
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Notified {notificationHistory[`${rec.employeeId}-${rec.certType}`].channel === 'both' ? 'SMS+Email' : notificationHistory[`${rec.employeeId}-${rec.certType}`].channel.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Audit Footer */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Audit Readiness:</strong> All records synchronized with state ABC &amp; county environmental health department standards.
              </span>
            </span>
            <span className="font-mono font-bold text-slate-800">
              Total Monitored: {allCertRecords.length} Certifications across {employees.length} Staff
            </span>
          </div>

        </div>
      )}

      {/* 5. MODAL: INSTANT AUTOMATED NOTIFICATION (SMS / EMAIL) */}
      {notifyingCertRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  notifyingCertRecord.status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' :
                  notifyingCertRecord.status === 'expired' ? 'bg-rose-100 text-rose-700' :
                  'bg-sky-100 text-sky-700'
                }`}>
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>Send Automated Compliance Reminder</span>
                    {notifyingCertRecord.status === 'expiring_soon' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {notifyingCertRecord.daysRemaining} Days Left
                      </span>
                    )}
                    {notifyingCertRecord.status === 'expired' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                        Expired
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Recipient: <strong className="text-slate-800">{notifyingCertRecord.employeeName}</strong> &bull; {notifyingCertRecord.employeeRole} ({notifyingCertRecord.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotifyingCertRecord(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Details & Channels */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Automated Delivery Channels
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-medium">SMS Mobile Number</div>
                    <div className="font-mono font-bold text-slate-800 truncate">{notifyingCertRecord.employeePhone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-medium">App / Work Email</div>
                    <div className="font-sans font-bold text-slate-800 truncate">{notifyingCertRecord.employeeEmail}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel Selector Tabs */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Select Transmission Channel:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNotifyChannel('sms')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all cursor-pointer ${
                    notifyChannel === 'sms'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>SMS Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotifyChannel('email')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all cursor-pointer ${
                    notifyChannel === 'email'
                      ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-4 h-4 text-sky-600" />
                  <span>Email Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotifyChannel('both')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold text-xs transition-all cursor-pointer ${
                    notifyChannel === 'both'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs ring-1 ring-purple-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <span className="font-bold">Both (SMS + Email)</span>
                </button>
              </div>
            </div>

            {/* Message Template Presets */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Quick Message Presets:
                </label>
                <span className="text-[10px] text-slate-400">Click to apply template</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPresetMessage('standard_30')}
                  className="px-2 py-1 text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg cursor-pointer transition-all"
                >
                  ⏰ 30-Day Reminder
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetMessage('urgent_expired')}
                  className="px-2 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-lg cursor-pointer transition-all"
                >
                  🚨 Urgent Expiration
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetMessage('portal_link')}
                  className="px-2 py-1 text-[10px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-lg cursor-pointer transition-all"
                >
                  🔗 Portal Direct Link
                </button>
              </div>
            </div>

            {/* Live Message Textarea */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Message Content (Live Preview):
                </label>
                <span className="font-mono text-[10px] text-slate-400">
                  {customNotifyMessage.length} characters
                </span>
              </div>
              <textarea
                value={customNotifyMessage}
                onChange={(e) => setCustomNotifyMessage(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 leading-relaxed focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none bg-slate-50/50"
              />
            </div>

            {/* Official Training Portal Link */}
            <div className="p-2.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Official Portal:</strong> {notifyingCertRecord.certType === 'alcohol' ? 'California ABC RBS Portal (rbs.abc.ca.gov)' : 'ServSafe Food Safety Online Portal'}
                </span>
              </div>
              <a
                href={notifyingCertRecord.certType === 'alcohol' ? 'https://rbs.abc.ca.gov/' : 'https://www.servsafe.com/ServSafe-Food-Handler'}
                target="_blank"
                rel="noreferrer"
                className="text-sky-700 hover:text-sky-900 p-1 hover:bg-sky-100 rounded cursor-pointer shrink-0"
                title="Open Official State Training Portal"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNotifyingCertRecord(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSendingNotification}
                  onClick={handleSendNotificationFromModal}
                  className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSendingNotification ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch {notifyChannel === 'both' ? 'SMS & Email' : notifyChannel === 'sms' ? 'SMS Alert' : 'App Email'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL: LOG CERTIFICATION RENEWAL & VERIFICATION */}
      {editingCertRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Log Certification Renewal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {editingCertRecord.employeeName} &bull; {editingCertRecord.certTypeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCertRecord(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Card / Certificate Number
                </label>
                <input
                  type="text"
                  value={editCardNumber}
                  onChange={(e) => setEditCardNumber(e.target.value)}
                  placeholder="e.g. RBS-CA-2026-90412"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Issuing Authority / Program
                </label>
                <input
                  type="text"
                  value={editAuthority}
                  onChange={(e) => setEditAuthority(e.target.value)}
                  placeholder="e.g. California RBS ABC, ServSafe, TIPS"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Expiration Date
                  </label>
                  <input
                    type="date"
                    value={editExpirationDate}
                    onChange={(e) => setEditExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-sky-800 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verify-checkbox"
                  checked={editVerified}
                  onChange={(e) => setEditVerified(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="verify-checkbox" className="text-slate-700 font-medium cursor-pointer">
                  Mark as verified &amp; approved against state registry
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingCertRecord(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRenewal}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Certification Renewal</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
