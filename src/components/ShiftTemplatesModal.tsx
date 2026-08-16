import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Clock,
  Trash2,
  Edit3,
  Copy,
  Star,
  Check,
  Sunrise,
  Sun,
  Moon,
  Zap,
  Search,
  Filter,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Coffee
} from 'lucide-react';
import {
  ShiftTemplate,
  ShiftPatternTag,
  Department,
  RestaurantRole,
  Employee
} from '../types';

interface ShiftTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  employees: Employee[];
  weekDates: { dateStr: string; dayName: string; dayNumber: number }[];
  onSaveTemplate: (template: ShiftTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyTemplateToShift: (template: ShiftTemplate, employeeId: string, dateStr: string) => void;
}

export const ShiftTemplatesModal: React.FC<ShiftTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  employees,
  weekDates,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplateToShift,
}) => {
  const [selectedTag, setSelectedTag] = useState<ShiftPatternTag | 'All'>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);

  // Quick Apply Modal/Popover state
  const [applyingTemplate, setApplyingTemplate] = useState<ShiftTemplate | null>(null);
  const [applyEmployeeId, setApplyEmployeeId] = useState<string>(employees[0]?.id || '');
  const [applyDateStr, setApplyDateStr] = useState<string>(weekDates[0]?.dateStr || '');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Template Form state
  const [formName, setFormName] = useState('');
  const [formTag, setFormTag] = useState<ShiftPatternTag>('Opening');
  const [formDepartment, setFormDepartment] = useState<Department>('Front of House');
  const [formRole, setFormRole] = useState<RestaurantRole>('Server');
  const [formStartTime, setFormStartTime] = useState('07:00');
  const [formEndTime, setFormEndTime] = useState('15:30');
  const [formBreakMinutes, setFormBreakMinutes] = useState(30);
  const [formNotes, setFormNotes] = useState('');
  const [formColor, setFormColor] = useState('#0284c7');
  const [formIsFavorite, setFormIsFavorite] = useState(false);

  const patternTags: { tag: ShiftPatternTag | 'All'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { tag: 'All', label: 'All Patterns', icon: Layers },
    { tag: 'Opening', label: 'Opening', icon: Sunrise },
    { tag: 'Mid', label: 'Mid-Day', icon: Sun },
    { tag: 'Closing', label: 'Closing', icon: Moon },
    { tag: 'Rush', label: 'Peak Rush', icon: Zap },
    { tag: 'Custom', label: 'Custom', icon: Coffee },
  ];

  const departmentList: (Department | 'All')[] = [
    'All',
    'Front of House',
    'Back of House',
    'Bar & Beverage',
    'Kitchen Prep & Dish',
    'Management',
  ];

  const rolesByDepartment: Record<Department, RestaurantRole[]> = {
    'Front of House': ['Server', 'Head Server', 'Host / Hostess', 'Food Runner', 'Busser', 'Cashier'],
    'Back of House': ['Head Chef', 'Sous Chef', 'Line Cook', 'Grill Cook', 'Prep Cook'],
    'Bar & Beverage': ['Lead Bartender', 'Bartender', 'Barback'],
    'Kitchen Prep & Dish': ['Prep Cook', 'Dishwasher'],
    'Management': ['General Manager', 'Assistant GM', 'Shift Supervisor'],
  };

  const getTagColorBadge = (tag: ShiftPatternTag) => {
    switch (tag) {
      case 'Opening':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Mid':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Closing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Rush':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTagIcon = (tag: ShiftPatternTag) => {
    switch (tag) {
      case 'Opening':
        return <Sunrise className="w-3.5 h-3.5 text-amber-600" />;
      case 'Mid':
        return <Sun className="w-3.5 h-3.5 text-sky-600" />;
      case 'Closing':
        return <Moon className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Rush':
        return <Zap className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Coffee className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return templates.filter((t) => {
      const matchTag = selectedTag === 'All' || t.patternTag === selectedTag;
      const matchDept = selectedDepartment === 'All' || t.department === selectedDepartment;
      const matchSearch =
        q === '' ||
        t.name.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      return matchTag && matchDept && matchSearch;
    });
  }, [templates, selectedTag, selectedDepartment, searchQuery]);

  const calculateHours = (start: string, end: string, breakMin: number) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return Math.max(0, (diff - breakMin) / 60).toFixed(1);
  };

  const startCreateNew = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormTag('Opening');
    setFormDepartment('Front of House');
    setFormRole('Server');
    setFormStartTime('06:30');
    setFormEndTime('15:00');
    setFormBreakMinutes(30);
    setFormNotes('');
    setFormColor('#0284c7');
    setFormIsFavorite(false);
    setIsCreatingNew(true);
  };

  const startEdit = (tmpl: ShiftTemplate) => {
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);
    setFormTag(tmpl.patternTag);
    setFormDepartment(tmpl.department);
    setFormRole(tmpl.role);
    setFormStartTime(tmpl.startTime);
    setFormEndTime(tmpl.endTime);
    setFormBreakMinutes(tmpl.breakMinutes);
    setFormNotes(tmpl.notes || '');
    setFormColor(tmpl.color || '#0284c7');
    setFormIsFavorite(!!tmpl.isFavorite);
    setIsCreatingNew(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newTemplate: ShiftTemplate = {
      id: editingTemplate ? editingTemplate.id : `tmpl-custom-${Date.now()}`,
      name: formName.trim(),
      patternTag: formTag,
      department: formDepartment,
      role: formRole,
      startTime: formStartTime,
      endTime: formEndTime,
      breakMinutes: formBreakMinutes,
      notes: formNotes.trim(),
      color: formColor,
      isFavorite: formIsFavorite,
    };

    onSaveTemplate(newTemplate);
    setIsCreatingNew(false);
    setEditingTemplate(null);
  };

  const handleDuplicate = (tmpl: ShiftTemplate) => {
    const cloned: ShiftTemplate = {
      ...tmpl,
      id: `tmpl-custom-${Date.now()}`,
      name: `${tmpl.name} (Copy)`,
      isFavorite: false,
    };
    onSaveTemplate(cloned);
  };

  const toggleFavorite = (tmpl: ShiftTemplate) => {
    onSaveTemplate({
      ...tmpl,
      isFavorite: !tmpl.isFavorite,
    });
  };

  const handleExecuteApply = () => {
    if (!applyingTemplate || !applyEmployeeId || !applyDateStr) return;
    onApplyTemplateToShift(applyingTemplate, applyEmployeeId, applyDateStr);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      setApplyingTemplate(null);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg leading-tight">
                  Shift Templates Library
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500/40 text-white rounded-full border border-white/20">
                  {templates.length} Standard Patterns
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Save and reuse common restaurant shifts (Opening, Mid, Closing, Rush) for 1-click scheduling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && (
              <button
                id="create-new-template-btn"
                onClick={startCreateNew}
                className="flex items-center gap-1.5 bg-white text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Filter bar */}
        {!isCreatingNew && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
            {/* Pattern Tag Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {patternTags.map(({ tag, label, icon: Icon }) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${selectedTag === tag ? 'text-white' : 'text-slate-500'}`} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Search box */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search template name, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Station:
              </span>
              {departmentList.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {isCreatingNew ? (
            /* CREATE / EDIT TEMPLATE FORM */
            <form onSubmit={handleSaveForm} className="max-w-2xl mx-auto space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    {editingTemplate ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {editingTemplate ? 'Edit Shift Template' : 'Create New Shift Template'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Define shift timings, station role, and default notes for rapid reuse
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFavorite}
                    onChange={(e) => setFormIsFavorite(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span>Favorite Pattern</span>
                </label>
              </div>

              {/* Template Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Template Name <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Morning Kitchen Opening & Prep, Dinner Rush Sauté Lead"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                  required
                />
              </div>

              {/* Pattern Tag & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Shift Category / Pattern:
                  </label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value as ShiftPatternTag)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="Opening">🌅 Opening Shift (Morning Setup)</option>
                    <option value="Mid">☀️ Mid-Day Shift (Lunch Turn)</option>
                    <option value="Closing">🌙 Closing Shift (Night Lockup)</option>
                    <option value="Rush">⚡ Peak Rush (High Demand)</option>
                    <option value="Overnight">🌌 Overnight / Graveyard</option>
                    <option value="Custom">⚙️ Custom Shift Pattern</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Department / Station:
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => {
                      const dept = e.target.value as Department;
                      setFormDepartment(dept);
                      setFormRole(rolesByDepartment[dept][0] || 'Server');
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {departmentList.filter(d => d !== 'All').map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Default Role:
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as RestaurantRole)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {rolesByDepartment[formDepartment].map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Start & End Times & Break */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Unpaid Break (Mins):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    step="15"
                    value={formBreakMinutes}
                    onChange={(e) => setFormBreakMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Duration Preview Pill */}
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Total Net Shift Duration:
                </span>
                <span className="font-bold text-sky-900 font-mono">
                  {calculateHours(formStartTime, formEndTime, formBreakMinutes)} Working Hours
                </span>
              </div>

              {/* Default Service / Station Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Default Station &amp; Checklist Notes:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Sauté line setup, walk-in check, terrace seating readiness..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingTemplate ? 'Update Template' : 'Save Shift Template'}
                </button>
              </div>
            </form>
          ) : (
            /* TEMPLATE GRID CARDS */
            <div className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">No Shift Templates Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    {searchQuery
                      ? 'No templates match your search criteria. Try a different query or reset filters.'
                      : 'No shift patterns saved for this filter. Create your first opening, mid, or closing pattern!'}
                  </p>
                  <button
                    onClick={startCreateNew}
                    className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Template</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTemplates.map((tmpl) => {
                    const hours = calculateHours(tmpl.startTime, tmpl.endTime, tmpl.breakMinutes);
                    return (
                      <div
                        key={tmpl.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between group relative"
                      >
                        {/* Top: Tag + Favorite + Actions */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getTagColorBadge(tmpl.patternTag)}`}>
                                {getTagIcon(tmpl.patternTag)}
                                {tmpl.patternTag}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {tmpl.department}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleFavorite(tmpl)}
                                title={tmpl.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  tmpl.isFavorite ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                <Star className="w-3.5 h-3.5 fill-current" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(tmpl)}
                                title="Duplicate template"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEdit(tmpl)}
                                title="Edit template"
                                className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteTemplate(tmpl.id)}
                                title="Delete template"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Template Name & Role */}
                          <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                            {tmpl.name}
                          </h4>
                          <div className="text-xs text-sky-700 font-medium mb-3">
                            {tmpl.role}
                          </div>

                          {/* Timings bar */}
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs mb-3 font-mono">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span>{tmpl.startTime} - {tmpl.endTime}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {hours} hrs ({tmpl.breakMinutes}m break)
                            </div>
                          </div>

                          {/* Notes */}
                          {tmpl.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 italic mb-3">
                              "{tmpl.notes}"
                            </p>
                          )}
                        </div>

                        {/* Bottom: 1-Click Fast Apply Button */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            Accelerates weekly drafting
                          </span>

                          <button
                            id={`apply-template-btn-${tmpl.id}`}
                            onClick={() => {
                              setApplyingTemplate(tmpl);
                              // Auto-match first employee with same role or dept if available
                              const matchingEmp = employees.find(e => e.role === tmpl.role || e.department === tmpl.department);
                              if (matchingEmp) setApplyEmployeeId(matchingEmp.id);
                            }}
                            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-sky-200 hover:border-transparent transition-all cursor-pointer shadow-2xs"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:text-white" />
                            <span>Quick Apply Shift</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Shift templates automatically auto-fill role, station, hours, and break rules in the schedule builder.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* QUICK APPLY POPUP MODAL */}
      {applyingTemplate && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4 text-xs">

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Apply Template to Schedule
                  </h4>
                  <p className="text-[11px] text-slate-500">{applyingTemplate.name}</p>
                </div>
              </div>
              <button
                onClick={() => setApplyingTemplate(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template specs snapshot */}
            <div className="bg-sky-50/70 rounded-xl p-3 border border-sky-100 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Shift Pattern:</span>
                <span className="font-bold text-sky-900">{applyingTemplate.patternTag} ({applyingTemplate.department})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Working Hours:</span>
                <span className="font-mono font-bold text-slate-900">{applyingTemplate.startTime} - {applyingTemplate.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="font-bold text-slate-900">{applyingTemplate.role}</span>
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select Calendar Day:
              </label>
              <select
                value={applyDateStr}
                onChange={(e) => setApplyDateStr(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
              >
                {weekDates.map((wd) => (
                  <option key={wd.dateStr} value={wd.dateStr}>
                    {wd.dayName} ({wd.dateStr})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Employee */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Assign Staff Member:
              </label>
              <select
                value={applyEmployeeId}
                onChange={(e) => setApplyEmployeeId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role} ({emp.department}, ${emp.hourlyWage}/hr)
                  </option>
                ))}
              </select>
            </div>

            {appliedSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Shift Added to Schedule Grid!</span>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyingTemplate(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteApply}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Shift with Template</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
