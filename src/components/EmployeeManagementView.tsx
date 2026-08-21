import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Palette,
  Award,
  Star,
  Wine,
  FileCheck
} from 'lucide-react';
import { Employee, Department, RestaurantRole, SupportedLanguage, AlcoholHandlerCard, FoodHandlerCard } from '../types';
import { translations } from '../utils/i18n';
import { EMPLOYEE_COLORS, generateLargeEmployeePool } from '../data/mockData';

interface EmployeeManagementViewProps {
  employees: Employee[];
  currentLanguage: SupportedLanguage;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onBulkScaleEmployees: (targetCount: number) => void;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  currentLanguage,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkScaleEmployees,
}) => {
  const t = translations[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'on_leave' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [customScaleInput, setCustomScaleInput] = useState<number>(employees.length);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');
  const [isScalePopoverOpen, setIsScalePopoverOpen] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Front of House');
  const [role, setRole] = useState<RestaurantRole>('Server');
  const [hourlyWage, setHourlyWage] = useState<number>(20.0);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState<number>(35);
  const [color, setColor] = useState<string>(EMPLOYEE_COLORS[0]);
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [notes, setNotes] = useState('');
  
  // WorkForce, POS & Cert Fields
  const [adpEmployeeId, setAdpEmployeeId] = useState('');
  const [posServerCode, setPosServerCode] = useState('');
  const [hasAlcoholCard, setHasAlcoholCard] = useState(true);
  const [alcoholState, setAlcoholState] = useState('CA');
  const [alcoholCardNumber, setAlcoholCardNumber] = useState('RBS-94021');
  const [alcoholExpiration, setAlcoholExpiration] = useState('2027-08-30');
  const [alcoholVerified, setAlcoholVerified] = useState(true);
  const [hasFoodHandler, setHasFoodHandler] = useState(true);
  const [foodExpiration, setFoodExpiration] = useState('2027-11-15');
  const [foodVerified, setFoodVerified] = useState(true);

  const departments: (Department | 'all')[] = [
    'all',
    'Front of House',
    'Back of House',
    'Bar & Beverage',
    'Kitchen Prep & Dish',
    'Management',
  ];

  const roleOptions: Record<Department, RestaurantRole[]> = {
    'Front of House': ['Server', 'Head Server', 'Host / Hostess', 'Food Runner', 'Busser', 'Cashier'],
    'Back of House': ['Head Chef', 'Sous Chef', 'Line Cook', 'Grill Cook', 'Prep Cook'],
    'Bar & Beverage': ['Lead Bartender', 'Bartender', 'Barback'],
    'Kitchen Prep & Dish': ['Prep Cook', 'Dishwasher'],
    'Management': ['General Manager', 'Assistant GM', 'Shift Supervisor'],
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(e => {
      const matchDept = selectedDept === 'all' || e.department === selectedDept;
      const matchStatus = selectedStatus === 'all' || e.status === selectedStatus;
      const matchSearch = q === '' ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q) ||
        (e.phone || '').includes(q) ||
        (e.role || '').toLowerCase().includes(q) ||
        (e.adpEmployeeId || '').toLowerCase().includes(q) ||
        (e.posServerCode || '').toLowerCase().includes(q);
      return matchDept && matchStatus && matchSearch;
    });
  }, [employees, selectedDept, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setDepartment('Front of House');
    setRole('Server');
    setHourlyWage(20.0);
    setMaxHoursPerWeek(35);
    setColor(EMPLOYEE_COLORS[employees.length % EMPLOYEE_COLORS.length]);
    setStatus('active');
    setNotes('');
    setAdpEmployeeId(`ADP_010${employees.length + 1}`);
    setPosServerCode(`10${employees.length + 1}`);
    setHasAlcoholCard(true);
    setAlcoholState('CA');
    setAlcoholCardNumber(`RBS-${Math.floor(10000 + Math.random() * 90000)}`);
    setAlcoholExpiration('2027-08-30');
    setAlcoholVerified(true);
    setHasFoodHandler(true);
    setFoodExpiration('2027-11-15');
    setFoodVerified(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setDepartment(emp.department);
    setRole(emp.role);
    setHourlyWage(emp.hourlyWage);
    setMaxHoursPerWeek(emp.maxHoursPerWeek);
    setColor(emp.color);
    setStatus(emp.status);
    setNotes(emp.notes || '');
    setAdpEmployeeId(emp.adpEmployeeId || `ADP_010${emp.id.replace('emp-', '')}`);
    setPosServerCode(emp.posServerCode || '101');
    setHasAlcoholCard(!!emp.alcoholHandlerCard);
    setAlcoholState(emp.alcoholHandlerCard?.state || 'CA');
    setAlcoholCardNumber(emp.alcoholHandlerCard?.cardNumber || 'RBS-94021');
    setAlcoholExpiration(emp.alcoholHandlerCard?.expirationDate || '2027-08-30');
    setAlcoholVerified(emp.alcoholHandlerCard?.verified ?? true);
    setHasFoodHandler(!!emp.foodHandlerCard);
    setFoodExpiration(emp.foodHandlerCard?.expirationDate || '2027-11-15');
    setFoodVerified(emp.foodHandlerCard?.verified ?? true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alcoholCardData: AlcoholHandlerCard | undefined = hasAlcoholCard ? {
      cardNumber: alcoholCardNumber,
      state: alcoholState,
      issueDate: '2024-08-15',
      expirationDate: alcoholExpiration,
      status: alcoholVerified ? 'valid' : 'pending_verification',
      verified: alcoholVerified,
      certificateUrl: 'https://example.com/certs/rbs-sample.pdf'
    } : undefined;

    const foodCardData: FoodHandlerCard | undefined = hasFoodHandler ? {
      cardNumber: `SERV-${alcoholCardNumber}`,
      issueDate: '2024-09-01',
      expirationDate: foodExpiration,
      status: foodVerified ? 'valid' : 'pending_verification',
      verified: foodVerified,
    } : undefined;

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        name,
        email,
        phone,
        department,
        role,
        hourlyWage,
        maxHoursPerWeek,
        color,
        status,
        notes,
        adpEmployeeId,
        posServerCode,
        alcoholHandlerCard: alcoholCardData,
        foodHandlerCard: foodCardData,
      });
      setEditingEmployee(null);
    } else {
      onAddEmployee({
        name,
        email,
        phone,
        department,
        role,
        hourlyWage,
        maxHoursPerWeek,
        color,
        status,
        hireDate: new Date().toISOString().slice(0, 10),
        notes,
        adpEmployeeId,
        posServerCode,
        kudosPoints: 100,
        fiveStarMentionCount: 0,
        alcoholHandlerCard: alcoholCardData,
        foodHandlerCard: foodCardData,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Bulk Scale Engine */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">{t.employees} Directory</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200 flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-600" />
              {employees.length.toLocaleString()} Active Staff (Enterprise Scale: 1 to 100,000)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full enterprise staffing roster with contact details, wages, certifications, POS server codes, and multi-tier hierarchy tags.
          </p>
        </div>

        {/* Action Buttons: Scale Presets, Custom Scale & Add Employee */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {/* Scale Presets and Slider */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600 px-1.5 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Scale:
            </span>
            <button
              onClick={() => onBulkScaleEmployees(1)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 1 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="Single Staff Test (1 employee)"
            >
              1
            </button>
            <button
              onClick={() => onBulkScaleEmployees(12)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 12 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="Single Store Roster (12 staff)"
            >
              12
            </button>
            <button
              onClick={() => onBulkScaleEmployees(100)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 100 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="District Pool (100 staff)"
            >
              100
            </button>
            <button
              onClick={() => onBulkScaleEmployees(1000)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 1000 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="Regional Network (1,000 staff)"
            >
              1k
            </button>
            <button
              onClick={() => onBulkScaleEmployees(10000)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 10000 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="National Franchise (10,000 staff)"
            >
              10k
            </button>
            <button
              onClick={() => onBulkScaleEmployees(50000)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 50000 ? 'bg-sky-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="Multi-Continental Scale (50,000 staff)"
            >
              50k
            </button>
            <button
              onClick={() => onBulkScaleEmployees(100000)}
              className={`px-2 py-1 font-bold rounded-lg transition-colors ${
                employees.length === 100000 ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-sky-50 text-slate-700 shadow-2xs'
              }`}
              title="Full Enterprise Scale (100,000 staff capacity)"
            >
              100k
            </button>

            {/* Custom Scale Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsScalePopoverOpen(!isScalePopoverOpen)}
                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-lg border border-sky-200 shadow-2xs transition-colors flex items-center gap-1"
                title="Custom Scale Slider (1 to 100,000)"
              >
                <span>Custom</span>
              </button>

              {/* Custom Scale Popover Dialog */}
              {isScalePopoverOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      Set Custom Staff Scale
                    </h4>
                    <button
                      onClick={() => setIsScalePopoverOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Range: 1 – 100,000</span>
                        <span className="text-sky-700 font-bold">{Number(customScaleInput).toLocaleString()} staff</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100000"
                        step="1"
                        value={customScaleInput}
                        onChange={(e) => setCustomScaleInput(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        value={customScaleInput}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(100000, Number(e.target.value) || 1));
                          setCustomScaleInput(val);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-500"
                        placeholder="Enter 1 - 100000"
                      />
                      <button
                        onClick={() => {
                          onBulkScaleEmployees(customScaleInput);
                          setIsScalePopoverOpen(false);
                        }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs shrink-0 shadow-xs"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            id="add-new-employee-btn"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addEmployee}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Department tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => {
                setSelectedDept(dept);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedDept === dept
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {dept === 'all' ? t.allDepartments : dept}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-xl focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Top Color Accent Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: emp.color }}
            />

            <div>
              {/* Top Row: Name, Status badge & Color Indicator */}
              <div className="flex items-start justify-between gap-2 mt-1 mb-2">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: emp.color }}
                  >
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 truncate max-w-[140px]">
                      {emp.name}
                    </h3>
                    <div className="text-xs font-semibold text-sky-700">
                      {emp.role}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  emp.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : emp.status === 'on_leave'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {emp.status.replace('_', ' ')}
                </span>
              </div>

              {/* Department & Wage */}
              <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 text-xs text-slate-600 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-medium text-slate-800">{emp.department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hourly Wage:</span>
                  <span className="font-mono font-bold text-slate-900">${emp.hourlyWage.toFixed(2)}/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ADP / POS Code:</span>
                  <span className="font-mono text-[11px] font-semibold text-sky-700">
                    {emp.adpEmployeeId || 'ADP_010'} • POS #{emp.posServerCode || '101'}
                  </span>
                </div>
              </div>

              {/* Certifications: Alcohol Card & ServSafe */}
              <div className="space-y-1.5 mb-2.5">
                {emp.alcoholHandlerCard && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-purple-50/70 border border-purple-100 text-[10px]">
                    <span className="flex items-center gap-1 font-bold text-purple-900">
                      <Wine className="w-3 h-3 text-purple-600" />
                      {emp.alcoholHandlerCard.state} RBS / TIPS Card
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-md font-bold uppercase ${
                      emp.alcoholHandlerCard.verified
                        ? 'bg-purple-200 text-purple-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {emp.alcoholHandlerCard.status}
                    </span>
                  </div>
                )}

                {emp.foodHandlerCard && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[10px]">
                    <span className="flex items-center gap-1 font-bold text-emerald-900">
                      <FileCheck className="w-3 h-3 text-emerald-600" />
                      Food Handler / ServSafe
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-900 font-bold uppercase">
                      {emp.foodHandlerCard.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Kudos & 5-Star Praise */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-100/80 mb-3 text-xs">
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-900">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Kudos Points:
                </span>
                <span className="font-bold text-amber-700 font-mono flex items-center gap-1">
                  ⭐ {emp.kudosPoints || 120} pts {emp.fiveStarMentionCount ? `(${emp.fiveStarMentionCount} 5★)` : ''}
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-slate-600 font-mono mb-3">
                <div className="flex items-center gap-2 truncate text-[11px]" title={emp.phone}>
                  <Phone className="w-3 h-3 text-sky-600 shrink-0" />
                  <span>{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate text-[11px]" title={emp.email}>
                  <Mail className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>{emp.email}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: emp.color }}
                />
                <span>Calendar Badge</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditModal(emp)}
                  className="p-1 text-slate-400 hover:text-sky-600 rounded-md hover:bg-sky-50 transition-colors"
                  title="Edit Employee"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteEmployee(emp.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                  title="Delete Employee"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Pagination Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 gap-4">
        {/* Left: Summary & Page Size */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            Showing <strong>{filteredEmployees.length === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredEmployees.length).toLocaleString()}</strong> of{' '}
            <strong>{filteredEmployees.length.toLocaleString()}</strong> employees
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-medium">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
              <option value="100">100</option>
              <option value="250">250</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>

        {/* Right: Navigation Controls & Jump Input */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 font-bold transition-colors"
            title="First Page"
          >
            « First
          </button>

          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">Page</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const targetPage = Math.max(1, Math.min(totalPages, Number(jumpPageInput) || 1));
                  setCurrentPage(targetPage);
                }
              }}
              onBlur={() => {
                const targetPage = Math.max(1, Math.min(totalPages, Number(jumpPageInput) || 1));
                setCurrentPage(targetPage);
              }}
              className="w-16 px-1.5 py-0.5 text-center font-bold text-sky-800 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
            <span className="font-semibold text-slate-500">of {totalPages.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 font-bold transition-colors"
            title="Last Page"
          >
            Last »
          </button>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || editingEmployee) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isAddModalOpen ? t.addEmployee : 'Edit Employee Profile'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEmployee(null);
                }}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              {/* Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Phone Number (for SMS Broadcasts):
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Email Address (for Rosters):
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@shift-sky.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Department & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Department:
                  </label>
                  <select
                    value={department}
                    onChange={(e) => {
                      const newDept = e.target.value as Department;
                      setDepartment(newDept);
                      setRole(roleOptions[newDept][0]);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {Object.keys(roleOptions).map((deptKey) => (
                      <option key={deptKey} value={deptKey}>{deptKey}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Role / Position:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as RestaurantRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {roleOptions[department]?.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Wage & Max Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hourly Wage ($):
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="10"
                    required
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Max Hours / Week:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    required
                    value={maxHoursPerWeek}
                    onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Status:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ADP ID & POS Server Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ADP / WorkForce Employee ID:
                  </label>
                  <input
                    type="text"
                    value={adpEmployeeId}
                    onChange={(e) => setAdpEmployeeId(e.target.value)}
                    placeholder="e.g. ADP_0104"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    POS Server / Station Code:
                  </label>
                  <input
                    type="text"
                    value={posServerCode}
                    onChange={(e) => setPosServerCode(e.target.value)}
                    placeholder="e.g. 104"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Alcohol Handler Card & Food Handler Section */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-purple-950 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAlcoholCard}
                      onChange={(e) => setHasAlcoholCard(e.target.checked)}
                      className="rounded text-purple-600"
                    />
                    <Wine className="w-3.5 h-3.5 text-purple-600" />
                    <span>State Alcohol Handler Card (RBS / TIPS / LEAD)</span>
                  </label>

                  {hasAlcoholCard && (
                    <label className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alcoholVerified}
                        onChange={(e) => setAlcoholVerified(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                      <span>Verified &amp; Active</span>
                    </label>
                  )}
                </div>

                {hasAlcoholCard && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">State:</span>
                      <input
                        type="text"
                        value={alcoholState}
                        onChange={(e) => setAlcoholState(e.target.value)}
                        placeholder="CA"
                        className="w-full p-1.5 bg-white border border-purple-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Card / License #:</span>
                      <input
                        type="text"
                        value={alcoholCardNumber}
                        onChange={(e) => setAlcoholCardNumber(e.target.value)}
                        placeholder="RBS-94021"
                        className="w-full p-1.5 bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Expiration Date:</span>
                      <input
                        type="date"
                        value={alcoholExpiration}
                        onChange={(e) => setAlcoholExpiration(e.target.value)}
                        className="w-full p-1.5 bg-white border border-purple-200 rounded-lg font-mono text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Color Picker */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-600" />
                  <span>Calendar Badge Color (for distinct shift identification):</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {EMPLOYEE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-sky-500 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Certifications / Notes:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. TIPS certified, ServSafe Manager, Weekend closer"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Employee
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
