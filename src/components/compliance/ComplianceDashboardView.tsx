import React, { useState, useMemo } from 'react';
import {
  Employee,
  EmployeeCertificationRecord,
  CertificationType,
  CertificationRequirement,
  LocationProfile,
  OrganizationProfile,
  PortalType
} from '../../types';
import {
  calculateLocationComplianceStats,
  computeCertificateStatus,
  getCertificationBadge,
  getDaysUntilExpiration,
  exportComplianceDataAsCSV
} from '../../utils/complianceEngine';
import {
  Award,
  ShieldCheck,
  AlertTriangle,
  Clock,
  XCircle,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Users,
  Search,
  Filter,
  Send,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  X,
  Lock,
  ArrowUpDown
} from 'lucide-react';

interface ComplianceDashboardViewProps {
  portal: PortalType;
  currentEmployee: Employee;
  employees: Employee[];
  locations: LocationProfile[];
  organizations: OrganizationProfile[];
  certificationTypes: CertificationType[];
  requirements: CertificationRequirement[];
  certifications: EmployeeCertificationRecord[];
  onVerifyCertification: (certId: string, result: 'approved' | 'rejected' | 'request_new_document', notes?: string) => void;
  onUpdateRequirement: (req: CertificationRequirement) => void;
  onOpenEmployeeProfile?: (employeeId: string) => void;
}

export const ComplianceDashboardView: React.FC<ComplianceDashboardViewProps> = ({
  portal,
  currentEmployee,
  employees,
  locations,
  organizations,
  certificationTypes,
  requirements,
  certifications,
  onVerifyCertification,
  onUpdateRequirement,
  onOpenEmployeeProfile
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expiring_soon' | 'expired' | 'pending_verification'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'requirements_matrix' | 'pending_queue'>('roster');

  // Manager verification modal state
  const [verifyingCert, setVerifyingCert] = useState<EmployeeCertificationRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);

  // Compute compliance statistics
  const complianceStats = useMemo(() => {
    return calculateLocationComplianceStats(
      employees,
      certifications,
      requirements,
      selectedLocationId === 'all' ? undefined : selectedLocationId
    );
  }, [employees, certifications, requirements, selectedLocationId]);

  // Filtered certifications roster
  const filteredCertifications = useMemo(() => {
    return certifications.filter(cert => {
      // Location filter
      if (selectedLocationId !== 'all') {
        const emp = employees.find(e => e.id === cert.employeeId);
        if (emp && emp.locationId !== selectedLocationId && emp.primaryLocationId !== selectedLocationId) {
          return false;
        }
      }

      // Status filter
      const computedStatus = computeCertificateStatus(cert.status, cert.expirationDate);
      if (filterStatus !== 'all' && computedStatus !== filterStatus) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const emp = employees.find(e => e.id === cert.employeeId);
        const matchEmp = emp?.name.toLowerCase().includes(q) || (emp?.employeeId && emp.employeeId.toLowerCase().includes(q));
        const matchCert = cert.certificateName.toLowerCase().includes(q) || cert.certificateNumber.toLowerCase().includes(q) || cert.issuedBy.toLowerCase().includes(q);
        if (!matchEmp && !matchCert) return false;
      }

      return true;
    });
  }, [certifications, employees, selectedLocationId, filterStatus, searchQuery]);

  // Pending approval items
  const pendingApprovals = useMemo(() => {
    return certifications.filter(c => c.status === 'pending_verification');
  }, [certifications]);

  // Handle Export CSV
  const handleExport = () => {
    const locObj = locations.find(l => l.id === selectedLocationId);
    const locName = locObj ? (locObj.displayName || locObj.locationName) : 'Global_All_Locations';
    exportComplianceDataAsCSV(filteredCertifications, employees, locName);
  };

  const handleSendReminder = (empName: string, certName: string) => {
    setNotificationSuccess(`Compliance renewal reminder and academy link sent to ${empName} via In-App Notice & SMS.`);
    setTimeout(() => setNotificationSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Success banner */}
      {notificationSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notificationSuccess}
          </span>
          <button onClick={() => setNotificationSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Compliance &amp; Credential Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
              Active Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time compliance tracking for Food Handler cards, California RBS Alcohol certifications, ServSafe Manager credentials, and health jurisdiction mandates.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Locations (Global Enterprise)</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.displayName || loc.locationName} ({loc.storeNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Export Report */}
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{complianceStats.complianceRate}%</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Target 95%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${complianceStats.complianceRate >= 90 ? 'bg-emerald-500' : complianceStats.complianceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${complianceStats.complianceRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valid Credentials</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{complianceStats.validCount}</span>
            <span className="text-[10px] text-slate-400">active</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Passed verification</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiring (60 Days)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{complianceStats.expiringSoonCount}</span>
            <span className="text-[10px] text-amber-500 font-bold">Action Needed</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Renewal window open</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expired Records</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{complianceStats.expiredCount}</span>
            <span className="text-[10px] text-rose-500 font-bold">Critical</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Shift policy enforced</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{complianceStats.pendingCount}</span>
            <span className="text-[10px] text-indigo-500 font-bold">Manager Review</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Submitted by staff</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Staff Audited</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{complianceStats.totalEmployees}</span>
            <span className="text-[10px] text-slate-400">headcount</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Active roster</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Credential Registry ({filteredCertifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending_queue')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pending_queue'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Manager Verification Queue</span>
          {pendingApprovals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('requirements_matrix')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'requirements_matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role Policy &amp; Shift Requirements</span>
        </button>
      </div>

      {/* 1. ROSTER TAB */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, certificate name, license number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Status Filter:</span>
              {(['all', 'valid', 'expiring_soon', 'expired', 'pending_verification'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer capitalize ${
                    filterStatus === s
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Role / Dept</th>
                    <th className="py-3 px-4">Credential Name</th>
                    <th className="py-3 px-4">Certificate #</th>
                    <th className="py-3 px-4">Authority &amp; State</th>
                    <th className="py-3 px-4">Expiration Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCertifications.map(cert => {
                    const emp = employees.find(e => e.id === cert.employeeId);
                    const status = computeCertificateStatus(cert.status, cert.expirationDate);
                    const badge = getCertificationBadge(status);
                    const daysLeft = getDaysUntilExpiration(cert.expirationDate);

                    return (
                      <tr key={cert.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                              alt=""
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <button
                                onClick={() => onOpenEmployeeProfile && onOpenEmployeeProfile(cert.employeeId)}
                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left cursor-pointer"
                              >
                                {cert.employeeName || emp?.name}
                              </button>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {emp?.employeeId || 'WQ-104-00101'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium">{cert.employeeRole || emp?.role}</span>
                          <span className="text-[10px] text-slate-400 block">{cert.department || emp?.department}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cert.certificateName}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block">{cert.certificateType}</span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {cert.certificateNumber}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="truncate max-w-[140px] block">{cert.issuedBy}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{cert.stateJurisdiction || 'CA'}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={daysLeft <= 30 ? 'font-bold text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                            {cert.expirationDate}
                          </span>
                          {daysLeft < 60 && daysLeft > 0 && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">
                              Expires in {daysLeft} days
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${badge.badgeClass}`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {cert.documentUrl && (
                              <a
                                href={cert.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                                title="View Document"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            {(status === 'expiring_soon' || status === 'expired') && (
                              <button
                                onClick={() => handleSendReminder(cert.employeeName || emp?.name || 'Staff', cert.certificateName)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Send Renewal Notice"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PENDING QUEUE TAB */}
      {activeTab === 'pending_queue' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Employee-Submitted Credentials Requiring Manager Approval
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify certificate ID barcodes, state registry registrations, and accreditation seal legitimacy prior to approving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map(cert => (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                      Pending Manager Review
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{cert.certificateName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Submitted by: <strong className="text-slate-800 dark:text-slate-200">{cert.employeeName}</strong> ({cert.employeeRole})</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {cert.certificateNumber}
                  </span>
                </div>

                <div className="text-xs space-y-1 py-2 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Issuing Body:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cert.issuedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Dates:</span>
                    <span>{cert.issueDate} to {cert.expirationDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jurisdiction:</span>
                    <span className="font-bold">{cert.stateJurisdiction || 'CA'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {cert.documentUrl ? (
                    <a
                      href={cert.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Certificate</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No document attached</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onVerifyCertification(cert.id, 'rejected', 'Invalid or unverified certificate ID')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => onVerifyCertification(cert.id, 'approved', `Approved by Manager ${currentEmployee.name}`)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {pendingApprovals.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero Pending Verifications</h4>
                <p className="text-xs text-slate-400 mt-1">All employee-submitted credentials are up-to-date and approved.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. REQUIREMENTS MATRIX TAB */}
      {activeTab === 'requirements_matrix' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Role-Based Certification Requirements &amp; Scheduling Enforcement Policies
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure which job titles require mandatory Food Handler, RBS Alcohol, or Food Protection Manager credentials. Policy defines whether non-compliant staff can be scheduled on shifts.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Mandatory Credential</th>
                    <th className="py-3 px-4">Grace Period</th>
                    <th className="py-3 px-4">Renewal Interval</th>
                    <th className="py-3 px-4">Scheduling Policy</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requirements.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {req.role}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                        {req.certificationTypeName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {req.gracePeriodDays} days after hire
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        Every {req.renewalFrequencyMonths} months
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={req.schedulingPolicy}
                          onChange={(e) => {
                            onUpdateRequirement({
                              ...req,
                              schedulingPolicy: e.target.value as any
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-xs font-semibold"
                        >
                          <option value="block_assignment">🚫 Block Shift Assignment</option>
                          <option value="require_manager_override">⚠️ Require Manager Override</option>
                          <option value="warn_only">ℹ️ Warning Notice Only</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Active Rule</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
