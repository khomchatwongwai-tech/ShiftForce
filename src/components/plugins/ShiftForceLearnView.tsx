import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Play,
  BarChart2,
  Users,
  Flame,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  Plus,
  FileCheck,
  Check
} from 'lucide-react';
import { Employee, Department, RestaurantRole } from '../../types';

interface CourseModule {
  id: string;
  title: string;
  category: 'food_safety' | 'alcohol_compliance' | 'culinary_knife' | 'hospitality_pos' | 'safety_osha';
  durationMinutes: number;
  lessonsCount: number;
  certificationTitle: string;
  requiredForDepts: Department[];
  description: string;
  thumbnailGradient: string;
  isMandatory: boolean;
  completionRatePct: number;
  totalEnrolled: number;
}

const COURSES: CourseModule[] = [
  {
    id: 'course-servsafe-2026',
    title: 'ServSafe Food Handler National Certification',
    category: 'food_safety',
    durationMinutes: 90,
    lessonsCount: 6,
    certificationTitle: 'ServSafe Food Handler (3-Year Cert)',
    requiredForDepts: ['Back of House', 'Kitchen Prep & Dish', 'Front of House'],
    description: 'Crucial health code regulations, cross-contamination prevention, foodborne pathogen mitigation, and critical temp control.',
    thumbnailGradient: 'from-emerald-600 to-teal-700',
    isMandatory: true,
    completionRatePct: 94,
    totalEnrolled: 86,
  },
  {
    id: 'course-rbs-alcohol',
    title: 'Responsible Beverage Service (RBS) & Alcohol Laws',
    category: 'alcohol_compliance',
    durationMinutes: 75,
    lessonsCount: 5,
    certificationTitle: 'ABC / RBS Certified Server (California / Multi-State)',
    requiredForDepts: ['Bar & Beverage', 'Front of House', 'Management'],
    description: 'State alcohol laws, recognizing fake identification, managing patron intoxication, legal liability, and safe service standards.',
    thumbnailGradient: 'from-amber-600 to-orange-700',
    isMandatory: true,
    completionRatePct: 88,
    totalEnrolled: 42,
  },
  {
    id: 'course-knife-skills',
    title: 'Commercial Culinary Knife Skills & Mise en Place',
    category: 'culinary_knife',
    durationMinutes: 45,
    lessonsCount: 4,
    certificationTitle: 'Culinary Knife Master Badge',
    requiredForDepts: ['Back of House', 'Kitchen Prep & Dish'],
    description: 'Julienne, brunoise, chiffonade speed cutting, whetstone sharpening angles, and kitchen station speed optimization.',
    thumbnailGradient: 'from-red-600 to-rose-700',
    isMandatory: false,
    completionRatePct: 76,
    totalEnrolled: 30,
  },
  {
    id: 'course-pos-speed',
    title: 'Toast POS & Speed-of-Service Guest Flow',
    category: 'hospitality_pos',
    durationMinutes: 40,
    lessonsCount: 4,
    certificationTitle: 'POS Operations Specialist',
    requiredForDepts: ['Front of House', 'Bar & Beverage', 'Management'],
    description: 'Mastering modifiers, split-check routing, table turn velocities, VIP dining preferences, and handheld terminal mastery.',
    thumbnailGradient: 'from-sky-600 to-blue-700',
    isMandatory: false,
    completionRatePct: 92,
    totalEnrolled: 64,
  },
  {
    id: 'course-osha-safety',
    title: 'OSHA Restaurant Workplace Safety & Spill Response',
    category: 'safety_osha',
    durationMinutes: 35,
    lessonsCount: 3,
    certificationTitle: 'Workplace Safety Compliance',
    requiredForDepts: ['Back of House', 'Front of House', 'Bar & Beverage', 'Kitchen Prep & Dish', 'Management'],
    description: 'Slips, trips, burn first-aid, fire extinguisher operations, chemical SDS handling, and emergency evacuation drills.',
    thumbnailGradient: 'from-indigo-600 to-purple-700',
    isMandatory: true,
    completionRatePct: 98,
    totalEnrolled: 110,
  }
];

interface ShiftForceLearnViewProps {
  employees: Employee[];
}

export const ShiftForceLearnView: React.FC<ShiftForceLearnViewProps> = ({ employees }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourseModal, setActiveCourseModal] = useState<CourseModule | null>(null);
  const [assignedSuccessMessage, setAssignedSuccessMessage] = useState<string | null>(null);

  const filteredCourses = COURSES.filter(c => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAssignToDepartment = (course: CourseModule, dept: Department | 'all') => {
    setAssignedSuccessMessage(`Successfully dispatched "${course.title}" enrollment to ${dept === 'all' ? 'All Staff' : dept} team!`);
    setTimeout(() => setAssignedSuccessMessage(null), 4000);
    setActiveCourseModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Plugin Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-sky-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                ShiftForce Learn • LMS & Training Academy
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                Plugin Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hospitality Academy & Certification Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5">
              Empower your restaurant team with interactive ServSafe certification courses, California RBS Alcohol compliance, knife skills, and OSHA safety micro-modules.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[120px]">
              <div className="text-2xl font-black text-white">91.4%</div>
              <div className="text-[11px] font-medium text-indigo-200">Compliance Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 text-center min-w-[120px]">
              <div className="text-2xl font-black text-amber-300">332</div>
              <div className="text-[11px] font-medium text-slate-300">Certs Issued</div>
            </div>
          </div>
        </div>
      </div>

      {assignedSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-sm font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{assignedSuccessMessage}</span>
          </div>
          <button onClick={() => setAssignedSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: 'All Academy Tracks' },
            { id: 'food_safety', label: 'Food Safety & ServSafe' },
            { id: 'alcohol_compliance', label: 'Alcohol & RBS' },
            { id: 'culinary_knife', label: 'Culinary Skills' },
            { id: 'hospitality_pos', label: 'POS & Guest Service' },
            { id: 'safety_osha', label: 'OSHA Safety' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules or skills..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <div
            key={course.id}
            className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col hover:shadow-md transition-all group"
          >
            {/* Card Banner */}
            <div className={`h-28 bg-gradient-to-tr ${course.thumbnailGradient} p-4 flex flex-col justify-between text-white relative`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-black/30 backdrop-blur-md rounded-md uppercase tracking-wider">
                  {course.category.replace('_', ' ')}
                </span>
                {course.isMandatory && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-950 rounded-md flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3 h-3" /> Mandatory
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-white/90">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {course.durationMinutes} min
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> {course.lessonsCount} lessons
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors mb-1.5">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {course.description}
                </p>

                {/* Progress Metric */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Staff Completion</span>
                    <span className="font-bold text-indigo-700">{course.completionRatePct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                      style={{ width: `${course.completionRatePct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-4">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Badge: {course.certificationTitle}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setActiveCourseModal(course)}
                  className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Assign Roster</span>
                </button>
                <button
                  onClick={() => alert(`Starting interactive preview for "${course.title}" module.`)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Launch Module Preview"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Assign Modal */}
      {activeCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Assign Academy Track</h3>
                  <p className="text-xs text-slate-500">{activeCourseModal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCourseModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose which department or role group should be assigned this training track with automatic email & SMS notification alerts:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleAssignToDepartment(activeCourseModal, 'all')}
                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl font-bold text-left flex items-center justify-between"
                >
                  <span>All Active Employees ({employees.length})</span>
                  <ChevronRight className="w-4 h-4 text-indigo-600" />
                </button>
                <button
                  onClick={() => handleAssignToDepartment(activeCourseModal, 'Front of House')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-left flex items-center justify-between"
                >
                  <span>Front of House</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleAssignToDepartment(activeCourseModal, 'Back of House')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-left flex items-center justify-between"
                >
                  <span>Back of House</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleAssignToDepartment(activeCourseModal, 'Bar & Beverage')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-left flex items-center justify-between"
                >
                  <span>Bar & Beverage</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveCourseModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
