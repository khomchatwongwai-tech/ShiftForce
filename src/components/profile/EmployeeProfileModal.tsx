import React, { useState, useRef } from 'react';
import {
  Employee,
  EmployeeCertificationRecord,
  EmployeeDocumentRecord,
  CertificationType,
  OrganizationProfile,
  LocationProfile,
  PortalType
} from '../../types';
import {
  X,
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
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  Lock,
  Building2,
  Sparkles
} from 'lucide-react';
import {
  computeCertificateStatus,
  getCertificationBadge,
  getDaysUntilExpiration
} from '../../utils/complianceEngine';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  portal: PortalType;
  currentEmployee?: Employee;
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

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  isOpen,
  onClose,
  employee,
  portal,
  currentEmployee,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'contact' | 'certifications' | 'documents' | 'history'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Employee>({ ...employee });
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(employee.avatarUrl);

  // Certification upload modal
  const [isAddCertOpen, setIsAddCertOpen] = useState(false);
  const [certForm, setCertForm] = useState<{
    certificationTypeId: string;
    certificateName: string;
    certificateNumber: string;
    issuedBy: string;
    issueDate: string;
    expirationDate: string;
    stateJurisdiction: string;
    documentUrl: string;
    documentFileName: string;
  }>({
    certificationTypeId: certificationTypes[0]?.id || 'cert-type-food-handler',
    certificateName: 'California Food Handler Card',
    certificateNumber: '',
    issuedBy: 'ServSafe National Restaurant Association',
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stateJurisdiction: 'CA',
    documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    documentFileName: 'Certificate_Upload.pdf'
  });

  // Manager Verification Modal
  const [verifyingCert, setVerifyingCert] = useState<EmployeeCertificationRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; fileName: string } | null>(null);

  // Camera capture simulation
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isSelf = currentEmployee?.id === employee.id;
  const isAdminOrManager = portal === 'admin';

  const employeeCerts = certifications.filter(c => c.employeeId === employee.id);
  const employeeDocs = documents.filter(d => d.employeeId === employee.id);

  const activeOrg = organizations.find(o => o.id === employee.organizationId) || organizations[0];
  const activeLoc = locations.find(l => l.id === employee.locationId || l.id === employee.primaryLocationId) || locations[0];

  const handleCopyEmployeeId = () => {
    if (employee.employeeId) {
      navigator.clipboard.writeText(employee.employeeId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveProfile = () => {
    onUpdateEmployee({
      ...formData,
      avatarUrl: avatarPreview
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateCameraCapture = () => {
    setIsCameraActive(true);
    setTimeout(() => {
      // Simulate snapshot from camera
      const samplePhotos = [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'
      ];
      setAvatarPreview(samplePhotos[Math.floor(Math.random() * samplePhotos.length)]);
      setIsCameraActive(false);
    }, 1200);
  };

  const handleCreateCertification = (e: React.FormEvent) => {
    e.preventDefault();
    const typeObj = certificationTypes.find(t => t.id === certForm.certificationTypeId);
    const newCert: EmployeeCertificationRecord = {
      id: `cert-rec-${Date.now()}`,
      organizationId: employee.organizationId || activeOrg.id,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.role,
      department: employee.department,
      locationId: employee.locationId || activeLoc.id,
      certificationTypeId: certForm.certificationTypeId,
      certificateType: typeObj?.name || 'Certificate',
      certificateName: certForm.certificateName,
      certificateNumber: certForm.certificateNumber || `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      issuedBy: certForm.issuedBy,
      issueDate: certForm.issueDate,
      expirationDate: certForm.expirationDate,
      stateJurisdiction: certForm.stateJurisdiction,
      status: isAdminOrManager ? 'valid' : 'pending_verification',
      documentUrl: certForm.documentUrl,
      documentFileName: certForm.documentFileName,
      documentMimeType: 'application/pdf',
      documentSizeBytes: 450000,
      verifiedBy: isAdminOrManager ? currentEmployee?.id : undefined,
      verifiedByName: isAdminOrManager ? `${currentEmployee?.name} (Manager)` : undefined,
      verifiedAt: isAdminOrManager ? new Date().toISOString() : undefined,
      verificationResult: isAdminOrManager ? 'approved' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddCertification(newCert);

    // Also auto-record into Document Center
    onAddDocument({
      id: `doc-${Date.now()}`,
      employeeId: employee.id,
      organizationId: employee.organizationId || activeOrg.id,
      locationId: employee.locationId || activeLoc.id,
      category: 'certifications',
      title: `${newCert.certificateName} (${newCert.certificateNumber})`,
      fileName: newCert.documentFileName || 'certificate.pdf',
      fileMimeType: 'application/pdf',
      fileSizeBytes: 450000,
      documentUrl: newCert.documentUrl || '',
      isPrivate: false,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentEmployee?.id || employee.id,
      uploadedByName: currentEmployee?.name || employee.name,
      expirationDate: newCert.expirationDate
    });

    setIsAddCertOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Cover & Avatar */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar & Photo Actions */}
            <div className="relative group">
              <img
                src={avatarPreview || employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={employee.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Photo (JPG/PNG)"
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSimulateCameraCapture}
                  title="Take Photo with Camera"
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {formData.preferredName ? `${formData.firstName || formData.name.split(' ')[0]} "${formData.preferredName}" ${formData.lastName || formData.name.split(' ').slice(1).join(' ')}` : formData.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {formData.role}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  formData.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {formData.employmentStatus?.replace('_', ' ').toUpperCase() || formData.status.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white">{formData.jobTitle || `${formData.role} - ${formData.department}`}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {activeLoc.displayName || activeLoc.locationName}
                </span>
                <span>•</span>
                <span className="text-slate-400">{activeOrg.displayName}</span>
              </p>

              {/* Employee ID Chip */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-xs border border-white/15">
                  <span className="text-slate-400 text-[11px]">Employee ID:</span>
                  <span className="font-mono font-bold text-white tracking-wider">
                    {formData.employeeId || `WQ-104-00${formData.id.replace('emp-', '')}`}
                  </span>
                  <button
                    onClick={handleCopyEmployeeId}
                    title="Copy Employee ID"
                    className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
                  >
                    {copiedId ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Hired: {new Date(formData.hireDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Edit / Save Actions */}
            <div className="self-end sm:self-center flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-white/10 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'overview' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'contact' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact &amp; Address</span>
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'certifications' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Certificates &amp; Licenses ({employeeCerts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-2.5 px-3 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'documents' ? 'border-b-2 border-indigo-400 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Center ({employeeDocs.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details Card */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Personal &amp; Identity Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.firstName || formData.name.split(' ')[0]}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.firstName || formData.name.split(' ')[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.lastName || formData.name.split(' ').slice(1).join(' ')}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.lastName || formData.name.split(' ').slice(1).join(' ')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Preferred Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.preferredName || ''}
                        onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                        placeholder="e.g. Nickname"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.preferredName || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Employee ID</label>
                    {isEditing && isAdminOrManager ? (
                      <input
                        type="text"
                        value={formData.employeeId || ''}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 font-mono"
                      />
                    ) : (
                      <p className="font-semibold font-mono text-indigo-600 dark:text-indigo-400">{formData.employeeId || 'WQ-104-001'}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Profession / Career Title</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.profession || ''}
                        onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                        placeholder="e.g. Certified Sommelier & Hospitality Lead"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.profession || 'Food Service Professional'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Employment & Placement Card */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Employment &amp; Organization Structure
                  </h3>
                  {!isAdminOrManager && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Managed by HR
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Department</label>
                    {isEditing && isAdminOrManager ? (
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="Front of House">Front of House</option>
                        <option value="Back of House">Back of House</option>
                        <option value="Bar & Beverage">Bar & Beverage</option>
                        <option value="Kitchen Prep & Dish">Kitchen Prep & Dish</option>
                        <option value="Management">Management</option>
                      </select>
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Primary Role</label>
                    {isEditing && isAdminOrManager ? (
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.role}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Primary Location</label>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      {activeLoc.displayName || activeLoc.locationName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Employment Status</label>
                    {isEditing && isAdminOrManager ? (
                      <select
                        value={formData.employmentStatus || 'full_time'}
                        onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      >
                        <option value="full_time">Full-Time Regular</option>
                        <option value="part_time">Part-Time</option>
                        <option value="contractor">Contractor</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {formData.employmentStatus?.replace('_', ' ') || 'Full Time'}
                      </p>
                    )}
                  </div>

                  {isAdminOrManager && (
                    <div className="col-span-2 bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-200">Base Hourly Wage</span>
                        <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300">${formData.hourlyWage.toFixed(2)}/hr</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. CONTACT & ADDRESS TAB */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Card */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Phone &amp; Email Directory
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Mobile Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {formData.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Work Email</label>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {formData.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Personal Email (Confidential)</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.personalEmail || ''}
                        onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                        placeholder="e.g. personal@gmail.com"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.personalEmail || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Home Address Card */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Residential Home Address
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <label className="block text-slate-500 font-medium mb-1">Address Line 1</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.addressLine1 || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, addressLine1: e.target.value, city: formData.address?.city || '', state: formData.address?.state || 'CA', zipCode: formData.address?.zipCode || '', country: formData.address?.country || 'United States' }
                        })}
                        placeholder="Street Address"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.address?.addressLine1 || '420 King Street'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value, addressLine1: formData.address?.addressLine1 || '', state: formData.address?.state || 'CA', zipCode: formData.address?.zipCode || '', country: formData.address?.country || 'United States' }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.address?.city || 'San Francisco'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">State / Province</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.state || 'CA'}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value, addressLine1: formData.address?.addressLine1 || '', city: formData.address?.city || '', zipCode: formData.address?.zipCode || '', country: formData.address?.country || 'United States' }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.address?.state || 'CA'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">ZIP / Postal Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.address?.zipCode || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zipCode: e.target.value, addressLine1: formData.address?.addressLine1 || '', city: formData.address?.city || '', state: formData.address?.state || 'CA', country: formData.address?.country || 'United States' }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                      />
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.address?.zipCode || '94158'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-500 font-medium mb-1">Country</label>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{formData.address?.country || 'United States'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Card */}
              <div className="col-span-1 md:col-span-2 bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
                  <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    Emergency Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-amber-900/70 dark:text-amber-300 font-medium mb-1">Contact Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.emergencyContact?.name || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {
                            name: e.target.value,
                            phone: formData.emergencyContact?.phone || '',
                            relationship: formData.emergencyContact?.relationship || 'Family'
                          }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 dark:bg-slate-800"
                      />
                    ) : (
                      <p className="font-semibold text-slate-900 dark:text-white">{formData.emergencyContact?.name || 'Dmitri Rostova'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-amber-900/70 dark:text-amber-300 font-medium mb-1">Relationship</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.emergencyContact?.relationship || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {
                            relationship: e.target.value,
                            name: formData.emergencyContact?.name || '',
                            phone: formData.emergencyContact?.phone || ''
                          }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 dark:bg-slate-800"
                      />
                    ) : (
                      <p className="font-semibold text-slate-900 dark:text-white">{formData.emergencyContact?.relationship || 'Spouse'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-amber-900/70 dark:text-amber-300 font-medium mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.emergencyContact?.phone || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: {
                            phone: e.target.value,
                            name: formData.emergencyContact?.name || '',
                            relationship: formData.emergencyContact?.relationship || 'Family'
                          }
                        })}
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 dark:bg-slate-800"
                      />
                    ) : (
                      <p className="font-semibold text-slate-900 dark:text-white">{formData.emergencyContact?.phone || '+1 (555) 234-8902'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. CERTIFICATIONS & LICENSES TAB */}
          {activeTab === 'certifications' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Professional Credentials, Certifications &amp; Licenses
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track Food Handler, RBS Alcohol, ServSafe Manager, CPR, and trade licenses with automated expiration notifications.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddCertOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Certificate</span>
                </button>
              </div>

              {/* Certificate Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employeeCerts.map((cert) => {
                  const status = computeCertificateStatus(cert.status, cert.expirationDate);
                  const badge = getCertificationBadge(status);
                  const daysLeft = getDaysUntilExpiration(cert.expirationDate);

                  return (
                    <div
                      key={cert.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              {cert.certificateType}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                              {cert.certificateName}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0 ${badge.badgeClass}`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs mt-3.5 py-3 border-y border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Certificate Number</span>
                            <span className="font-mono font-semibold">{cert.certificateNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Issuer / Authority</span>
                            <span className="font-medium truncate block">{cert.issuedBy}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Issue Date</span>
                            <span>{cert.issueDate}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Expiration Date</span>
                            <span className={daysLeft <= 30 ? 'font-bold text-rose-600 dark:text-rose-400' : 'font-medium'}>
                              {cert.expirationDate} {daysLeft < 90 && daysLeft > 0 ? `(${daysLeft}d left)` : ''}
                            </span>
                          </div>
                        </div>

                        {cert.verifiedByName && (
                          <div className="mt-3 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between">
                            <span className="flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Verified by {cert.verifiedByName}
                            </span>
                            <span className="text-[10px] text-slate-400">{cert.verifiedAt?.split('T')[0]}</span>
                          </div>
                        )}

                        {cert.verificationNotes && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic">
                            "{cert.verificationNotes}"
                          </p>
                        )}
                      </div>

                      {/* Card Action Toolbar */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                        {cert.documentUrl ? (
                          <button
                            onClick={() => setPreviewDoc({
                              title: cert.certificateName,
                              url: cert.documentUrl!,
                              fileName: cert.documentFileName || 'certificate.pdf'
                            })}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Document</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">No document attached</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {isAdminOrManager && cert.status === 'pending_verification' && (
                            <button
                              onClick={() => {
                                setVerifyingCert(cert);
                                setVerificationNotes(cert.verificationNotes || '');
                              }}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                            >
                              Review &amp; Approve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {employeeCerts.length === 0 && (
                  <div className="col-span-2 text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
                    <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Certificates Recorded Yet</h4>
                    <p className="text-xs text-slate-400 mt-1">Upload state Food Handler, RBS Alcohol, or ServSafe credentials to stay compliant.</p>
                    <button
                      onClick={() => setIsAddCertOpen(true)}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Certificate Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. DOCUMENT CENTER TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Employee Document Center &amp; Vault
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Encrypted storage for licenses, certifications, safety agreements, onboarding records, and academy certificates.
                  </p>
                </div>
              </div>

              {/* Document Categories Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {employeeDocs.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{doc.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {doc.category.replace('_', ' ')}
                            </span>
                            {doc.isPrivate && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Confidential
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{doc.fileName}</span>
                            <span>•</span>
                            <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>By {doc.uploadedByName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setPreviewDoc({ title: doc.title, url: doc.documentUrl, fileName: doc.fileName })}
                          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 text-xs cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={doc.documentUrl}
                          download={doc.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-200 text-xs cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}

                  {employeeDocs.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No documents in employee repository.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD CERTIFICATE MODAL */}
      {isAddCertOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Upload New Credential / Certificate
              </h3>
              <button
                onClick={() => setIsAddCertOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCertification} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Credential Type</label>
                <select
                  value={certForm.certificationTypeId}
                  onChange={(e) => {
                    const t = certificationTypes.find(type => type.id === e.target.value);
                    setCertForm({
                      ...certForm,
                      certificationTypeId: e.target.value,
                      certificateName: t?.name || 'Certificate',
                      issuedBy: t?.name.includes('ServSafe') ? 'ServSafe National Restaurant Association' : t?.name.includes('Alcohol') ? 'California Dept of ABC' : 'Accredited Issuing Body'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                >
                  {certificationTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Certificate / License Title</label>
                <input
                  type="text"
                  required
                  value={certForm.certificateName}
                  onChange={(e) => setCertForm({ ...certForm, certificateName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Certificate Number / ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CA-FHD-99210"
                    value={certForm.certificateNumber}
                    onChange={(e) => setCertForm({ ...certForm, certificateNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    required
                    value={certForm.issuedBy}
                    onChange={(e) => setCertForm({ ...certForm, issuedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={certForm.issueDate}
                    onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={certForm.expirationDate}
                    onChange={(e) => setCertForm({ ...certForm, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Upload Document / Camera Section */}
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Certificate Document File</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG, WEBP files up to 10MB</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCertForm({
                        ...certForm,
                        documentFileName: `Uploaded_Cert_${Date.now()}.pdf`,
                        documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
                      });
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCertForm({
                        ...certForm,
                        documentFileName: `Camera_Capture_${Date.now()}.jpg`,
                        documentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
                      });
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo (Mobile)</span>
                  </button>
                </div>
                {certForm.documentFileName && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                    ✓ Attached: {certForm.documentFileName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCertOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGER VERIFICATION MODAL */}
      {verifyingCert && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Manager Credential Verification
              </h3>
              <button
                onClick={() => setVerifyingCert(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-900 dark:text-white">{verifyingCert.employeeName || employee.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Certificate:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{verifyingCert.certificateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Number / Authority:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{verifyingCert.certificateNumber} • {verifyingCert.issuedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valid Range:</span>
                <span>{verifyingCert.issueDate} to {verifyingCert.expirationDate}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Verification Notes &amp; Audit Trail
              </label>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g. Scanned official ServSafe barcode. State registration confirmed."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onVerifyCertification(verifyingCert.id, 'rejected', verificationNotes);
                  setVerifyingCert(null);
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  onVerifyCertification(verifyingCert.id, 'request_new_document', verificationNotes);
                  setVerifyingCert(null);
                }}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Request New Document
              </button>
              <button
                onClick={() => {
                  onVerifyCertification(verifyingCert.id, 'approved', verificationNotes || 'Verified official accreditation.');
                  setVerifyingCert(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-slate-400">{previewDoc.fileName}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 min-h-[360px]">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[500px] w-auto rounded-lg shadow-lg object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Authenticated Workqora Private Storage</span>
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noreferrer"
                download={previewDoc.fileName}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
