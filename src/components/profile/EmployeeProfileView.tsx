import React, { useState } from 'react';
import {
  Employee,
  EmployeeCertificationRecord,
  EmployeeDocumentRecord,
  CertificationType,
  OrganizationProfile,
  LocationProfile,
  PortalType
} from '../../types';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  Calendar,
  Award,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Plus,
  Copy,
  Edit3,
  Building2,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';
import {
  computeCertificateStatus,
  getCertificationBadge,
  getDaysUntilExpiration
} from '../../utils/complianceEngine';

interface EmployeeProfileViewProps {
  portal: PortalType;
  currentEmployee: Employee;
  employees: Employee[];
  organizations: OrganizationProfile[];
  locations: LocationProfile[];
  certificationTypes: CertificationType[];
  certifications: EmployeeCertificationRecord[];
  documents: EmployeeDocumentRecord[];
  onUpdateEmployee: (updated: Employee) => void;
  onAddCertification: (cert: EmployeeCertificationRecord) => void;
  onUpdateCertification: (cert: EmployeeCertificationRecord) => void;
  onVerifyCertification: (certId: string, result: 'approved' | 'rejected' | 'request_new_document', notes?: string) => void;
  onAddDocument: (doc: EmployeeDocumentRecord) => void;
  onDeleteDocument: (docId: string) => void;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({
  portal,
  currentEmployee,
  employees,
  organizations,
  locations,
  certificationTypes,
  certifications,
  documents,
  onUpdateEmployee,
  onAddCertification,
  onUpdateCertification,
  onVerifyCertification,
  onAddDocument,
  onDeleteDocument
}) => {
  // If in admin/manager portal, allows searching and selecting any employee. If in employee portal, locks to currentEmployee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(currentEmployee.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'certifications' | 'documents'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const targetEmployee = employees.find(e => e.id === selectedEmployeeId) || currentEmployee;
  const employeeCerts = certifications.filter(c => c.employeeId === targetEmployee.id);
  const employeeDocs = documents.filter(d => d.employeeId === targetEmployee.id);

  const activeOrg = organizations.find(o => o.id === targetEmployee.organizationId) || organizations[0];
  const activeLoc = locations.find(l => l.id === targetEmployee.locationId || l.id === targetEmployee.primaryLocationId) || locations[0];

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.employeeId && e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyId = () => {
    if (targetEmployee.employeeId) {
      navigator.clipboard.writeText(targetEmployee.employeeId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {portal === 'employee' ? 'My Employee Profile' : 'Employee Profile & Credential Dossier'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/50">
              Workqora Identity
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {portal === 'employee'
              ? 'Manage your personal profile, contact information, home address, emergency contacts, and professional certifications.'
              : 'Enterprise personnel dossier: contact info, organization placement, credential verification, and document vault.'}
          </p>
        </div>

        {/* Manager/Admin Employee Switcher */}
        {portal !== 'employee' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search employee by name, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56 sm:w-64"
              />
            </div>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-medium"
            >
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeId || 'No ID'}) - {emp.role}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Profile Showcase Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cover Banner */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative p-6 flex items-end">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-xs border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-lg"
            >
              <Edit3 className="w-4 h-4" />
              <span>{portal === 'employee' ? 'Edit My Details' : 'Edit Personnel Profile'}</span>
            </button>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-14 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative group">
                <img
                  src={targetEmployee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={targetEmployee.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {targetEmployee.preferredName ? `${targetEmployee.firstName || targetEmployee.name.split(' ')[0]} "${targetEmployee.preferredName}" ${targetEmployee.lastName || targetEmployee.name.split(' ').slice(1).join(' ')}` : targetEmployee.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {targetEmployee.role}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {targetEmployee.employmentStatus?.replace('_', ' ').toUpperCase() || 'FULL-TIME'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{targetEmployee.jobTitle || `${targetEmployee.role} - ${targetEmployee.department}`}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    {activeLoc.displayName || activeLoc.locationName}
                  </span>
                  <span>•</span>
                  <span>{activeOrg.displayName}</span>
                </p>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 text-[11px]">Employee ID:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                      {targetEmployee.employeeId || 'WQ-104-00101'}
                    </span>
                    <button
                      onClick={handleCopyId}
                      title="Copy Employee ID"
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-1"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Hired {new Date(targetEmployee.hireDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certificate / License</span>
              </button>
            </div>
          </div>

          {/* Three-Column Dossier Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Column 1: Contact & Address */}
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  Contact Information
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{targetEmployee.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Work Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{targetEmployee.email}</span>
                  </div>
                  {targetEmployee.personalEmail && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Personal Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{targetEmployee.personalEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Residential Address
                </h3>
                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">{targetEmployee.address?.addressLine1 || '420 King Street'}</p>
                  {targetEmployee.address?.addressLine2 && <p>{targetEmployee.address.addressLine2}</p>}
                  <p>{targetEmployee.address?.city || 'San Francisco'}, {targetEmployee.address?.state || 'CA'} {targetEmployee.address?.zipCode || '94158'}</p>
                  <p className="text-slate-400 text-[11px]">{targetEmployee.address?.country || 'United States'}</p>
                </div>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Emergency Contact
                </h3>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">{targetEmployee.emergencyContact?.name || 'Dmitri Rostova'}</p>
                  <p className="text-slate-600 dark:text-slate-300">{targetEmployee.emergencyContact?.relationship || 'Spouse'} • {targetEmployee.emergencyContact?.phone || '+1 (555) 234-8902'}</p>
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Certifications & Credential Matrix */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Mandatory &amp; Professional Certifications ({employeeCerts.length})
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
                  >
                    View All &amp; Upload
                  </button>
                </div>

                <div className="space-y-3">
                  {employeeCerts.map(cert => {
                    const status = computeCertificateStatus(cert.status, cert.expirationDate);
                    const badge = getCertificationBadge(status);
                    const daysLeft = getDaysUntilExpiration(cert.expirationDate);

                    return (
                      <div
                        key={cert.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{cert.certificateName}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                            <span className="font-mono">{cert.certificateNumber}</span>
                            <span>•</span>
                            <span>{cert.issuedBy}</span>
                            <span>•</span>
                            <span>Expires: {cert.expirationDate}</span>
                            {daysLeft < 60 && daysLeft > 0 && (
                              <span className="text-amber-600 font-bold">({daysLeft} days left)</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {cert.documentUrl && (
                            <a
                              href={cert.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {employeeCerts.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No active certifications logged. Click "Add Certificate / License" to upload credentials.
                    </div>
                  )}
                </div>
              </div>

              {/* Document Vault Summary */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Document Vault ({employeeDocs.length} records)
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer"
                  >
                    Open Document Vault
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employeeDocs.slice(0, 4).map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                        <p className="text-[10px] text-slate-400">{doc.category} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 text-xs shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Modal Trigger */}
      <EmployeeProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={targetEmployee}
        portal={portal}
        currentEmployee={currentEmployee}
        organizations={organizations}
        locations={locations}
        certificationTypes={certificationTypes}
        certifications={certifications}
        documents={documents}
        onUpdateEmployee={onUpdateEmployee}
        onAddCertification={onAddCertification}
        onUpdateCertification={onUpdateCertification}
        onVerifyCertification={onVerifyCertification}
        onAddDocument={onAddDocument}
        onDeleteDocument={onDeleteDocument}
      />
    </div>
  );
};
