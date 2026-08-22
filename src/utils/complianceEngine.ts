import {
  Employee,
  CertificationStatus,
  CertificationType,
  CertificationRequirement,
  EmployeeCertificationRecord
} from '../types';

export function getDaysUntilExpiration(expirationDate?: string): number {
  if (!expirationDate) return 9999;
  const exp = new Date(expirationDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function computeCertificateStatus(
  currentStatus: CertificationStatus,
  expirationDate?: string
): CertificationStatus {
  if (currentStatus === 'pending_verification' || currentStatus === 'rejected') {
    return currentStatus;
  }
  if (!expirationDate) {
    return 'valid';
  }
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) {
    return 'expired';
  }
  if (days <= 60) {
    return 'expiring_soon';
  }
  return 'valid';
}

export function getCertificationBadge(status: CertificationStatus): {
  label: string;
  badgeClass: string;
  icon: string;
} {
  switch (status) {
    case 'valid':
      return {
        label: 'Valid',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        icon: '✓'
      };
    case 'expiring_soon':
      return {
        label: 'Expiring Soon',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        icon: '⚠'
      };
    case 'expired':
      return {
        label: 'Expired',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        icon: '✕'
      };
    case 'pending_verification':
      return {
        label: 'Pending Approval',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        icon: '⏳'
      };
    case 'rejected':
      return {
        label: 'Rejected',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
        icon: '⊘'
      };
    case 'missing':
    default:
      return {
        label: 'Missing Required',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        icon: '!'
      };
  }
}

export interface LocationComplianceSummary {
  locationId: string;
  totalEmployees: number;
  totalRequiredCertificates: number;
  validCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  pendingCount: number;
  missingCount: number;
  complianceRate: number; // 0 to 100
  foodHandlerComplianceRate: number;
  alcoholRBSComplianceRate: number;
  managerCertComplianceRate: number;
}

export function calculateLocationComplianceStats(
  employees: Employee[],
  certifications: EmployeeCertificationRecord[],
  requirements: CertificationRequirement[],
  locationId?: string
): LocationComplianceSummary {
  const filteredEmployees = locationId
    ? employees.filter(e => (e.locationId === locationId || e.primaryLocationId === locationId) && e.status === 'active')
    : employees.filter(e => e.status === 'active');

  let totalRequired = 0;
  let totalValid = 0;
  let totalExpiringSoon = 0;
  let totalExpired = 0;
  let totalPending = 0;
  let totalMissing = 0;

  let fhRequired = 0;
  let fhValid = 0;

  let rbsRequired = 0;
  let rbsValid = 0;

  let mgrRequired = 0;
  let mgrValid = 0;

  filteredEmployees.forEach(emp => {
    // Find requirements matching this employee's role
    const empReqs = requirements.filter(r => r.isRequired && (r.role.toLowerCase() === emp.role.toLowerCase() || (emp.role.includes(r.role))));
    const empCerts = certifications.filter(c => c.employeeId === emp.id);

    empReqs.forEach(req => {
      totalRequired++;
      const matchingCert = empCerts.find(c => c.certificationTypeId === req.certificationTypeId || c.certificateType.toLowerCase().includes(req.certificationTypeName.toLowerCase()));

      const isFoodHandler = req.certificationTypeName.toLowerCase().includes('food handler');
      const isAlcohol = req.certificationTypeName.toLowerCase().includes('alcohol');
      const isFoodMgr = req.certificationTypeName.toLowerCase().includes('manager');

      if (isFoodHandler) fhRequired++;
      if (isAlcohol) rbsRequired++;
      if (isFoodMgr) mgrRequired++;

      if (!matchingCert) {
        // Check legacy card properties on Employee object
        if (isFoodHandler && emp.foodHandlerCard?.status === 'valid') {
          totalValid++;
          fhValid++;
        } else if (isAlcohol && emp.alcoholHandlerCard?.status === 'valid') {
          totalValid++;
          rbsValid++;
        } else {
          totalMissing++;
        }
      } else {
        const computed = computeCertificateStatus(matchingCert.status, matchingCert.expirationDate);
        if (computed === 'valid') {
          totalValid++;
          if (isFoodHandler) fhValid++;
          if (isAlcohol) rbsValid++;
          if (isFoodMgr) mgrValid++;
        } else if (computed === 'expiring_soon') {
          totalExpiringSoon++;
          totalValid++; // counts toward active compliance until actually expired
          if (isFoodHandler) fhValid++;
          if (isAlcohol) rbsValid++;
          if (isFoodMgr) mgrValid++;
        } else if (computed === 'expired') {
          totalExpired++;
        } else if (computed === 'pending_verification') {
          totalPending++;
        } else {
          totalMissing++;
        }
      }
    });
  });

  const complianceRate = totalRequired > 0 ? Math.round((totalValid / totalRequired) * 100) : 100;
  const foodHandlerComplianceRate = fhRequired > 0 ? Math.round((fhValid / fhRequired) * 100) : 100;
  const alcoholRBSComplianceRate = rbsRequired > 0 ? Math.round((rbsValid / rbsRequired) * 100) : 100;
  const managerCertComplianceRate = mgrRequired > 0 ? Math.round((mgrValid / mgrRequired) * 100) : 100;

  return {
    locationId: locationId || 'all',
    totalEmployees: filteredEmployees.length,
    totalRequiredCertificates: totalRequired,
    validCount: totalValid,
    expiringSoonCount: totalExpiringSoon,
    expiredCount: totalExpired,
    pendingCount: totalPending,
    missingCount: totalMissing,
    complianceRate,
    foodHandlerComplianceRate,
    alcoholRBSComplianceRate,
    managerCertComplianceRate
  };
}

export interface ShiftComplianceCheck {
  isBlocked: boolean;
  hasWarning: boolean;
  violations: string[];
  warnings: string[];
  policy: 'warn_only' | 'block_assignment' | 'require_manager_override';
}

export function checkShiftSchedulingCompliance(
  employee: Employee,
  shiftRole: string,
  certifications: EmployeeCertificationRecord[],
  requirements: CertificationRequirement[]
): ShiftComplianceCheck {
  const matchingReqs = requirements.filter(r => r.isRequired && (r.role.toLowerCase() === shiftRole.toLowerCase() || (shiftRole.toLowerCase().includes(r.role.toLowerCase()))));
  const empCerts = certifications.filter(c => c.employeeId === employee.id);

  const violations: string[] = [];
  const warnings: string[] = [];
  let isBlocked = false;
  let highestPolicy: 'warn_only' | 'block_assignment' | 'require_manager_override' = 'warn_only';

  matchingReqs.forEach(req => {
    const isFoodHandler = req.certificationTypeName.toLowerCase().includes('food handler');
    const isAlcohol = req.certificationTypeName.toLowerCase().includes('alcohol');

    let matchingCert = empCerts.find(c => c.certificationTypeId === req.certificationTypeId || c.certificateType.toLowerCase().includes(req.certificationTypeName.toLowerCase()));

    let status: CertificationStatus = 'missing';

    if (matchingCert) {
      status = computeCertificateStatus(matchingCert.status, matchingCert.expirationDate);
    } else if (isFoodHandler && employee.foodHandlerCard) {
      status = employee.foodHandlerCard.status;
    } else if (isAlcohol && employee.alcoholHandlerCard) {
      status = employee.alcoholHandlerCard.status;
    }

    if (status === 'expired') {
      const msg = `Expired ${req.certificationTypeName} (Policy: ${req.schedulingPolicy.replace('_', ' ')})`;
      if (req.schedulingPolicy === 'block_assignment') {
        violations.push(msg);
        isBlocked = true;
        highestPolicy = 'block_assignment';
      } else {
        warnings.push(msg);
      }
    } else if (status === 'missing') {
      const msg = `Missing mandatory ${req.certificationTypeName} for ${shiftRole}`;
      if (req.schedulingPolicy === 'block_assignment') {
        violations.push(msg);
        isBlocked = true;
        highestPolicy = 'block_assignment';
      } else {
        warnings.push(msg);
      }
    } else if (status === 'expiring_soon') {
      warnings.push(`${req.certificationTypeName} is expiring soon (within 60 days).`);
    } else if (status === 'pending_verification') {
      warnings.push(`${req.certificationTypeName} is pending manager verification approval.`);
    }
  });

  return {
    isBlocked,
    hasWarning: warnings.length > 0 || violations.length > 0,
    violations,
    warnings,
    policy: highestPolicy
  };
}

export function generateNextEmployeeId(
  organizationCode: string,
  storeNumber: string,
  existingEmployees: Employee[]
): string {
  const prefix = `WQ-${storeNumber || '104'}-`;
  const existingNumbers = existingEmployees
    .filter(e => e.employeeId && e.employeeId.startsWith(prefix))
    .map(e => {
      const numStr = e.employeeId!.replace(prefix, '');
      return parseInt(numStr, 10);
    })
    .filter(n => !isNaN(n));

  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

export function exportComplianceDataAsCSV(
  records: EmployeeCertificationRecord[],
  employees: Employee[],
  locationName: string
): void {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Role',
    'Department',
    'Certificate Name',
    'Certificate Number',
    'Issuing Authority',
    'Issue Date',
    'Expiration Date',
    'State / Jurisdiction',
    'Status',
    'Verified By',
    'Verification Date'
  ];

  const rows = records.map(r => {
    const emp = employees.find(e => e.id === r.employeeId);
    return [
      `"${emp?.employeeId || ''}"`,
      `"${r.employeeName || emp?.name || ''}"`,
      `"${r.employeeRole || emp?.role || ''}"`,
      `"${r.department || emp?.department || ''}"`,
      `"${r.certificateName || r.certificateType}"`,
      `"${r.certificateNumber}"`,
      `"${r.issuedBy}"`,
      `"${r.issueDate}"`,
      `"${r.expirationDate}"`,
      `"${r.stateJurisdiction || 'CA'}"`,
      `"${r.status}"`,
      `"${r.verifiedByName || ''}"`,
      `"${r.verifiedAt ? r.verifiedAt.split('T')[0] : ''}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `workqora_compliance_${locationName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
