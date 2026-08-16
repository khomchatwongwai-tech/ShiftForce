import React, { useState, useMemo } from 'react';
import {
  X,
  MapPin,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Scale,
  Info,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import {
  US_STATE_TAX_CONFIGS,
  StateTaxConfig,
  FilingStatus,
  calculateEmployeePaycheck,
  PaycheckCalculationInput
} from '../../data/taxBracketsData';

interface StateTaxBracketsExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStateCode?: string;
  onSelectState?: (stateCode: string) => void;
}

export const StateTaxBracketsExplorerModal: React.FC<StateTaxBracketsExplorerModalProps> = ({
  isOpen,
  onClose,
  selectedStateCode = 'CA',
  onSelectState
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'West' | 'Midwest' | 'South' | 'Northeast'>('all');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'all' | 'none' | 'flat' | 'graduated'>('all');
  const [activeStateCode, setActiveStateCode] = useState<string>(selectedStateCode);

  // Simulator Parameters
  const [simHourlyWage, setSimHourlyWage] = useState<number>(25);
  const [simHoursPerWeek, setSimHoursPerWeek] = useState<number>(40);
  const [simTipsPerWeek, setSimTipsPerWeek] = useState<number>(150);
  const [simFilingStatus, setSimFilingStatus] = useState<FilingStatus>('single');

  // State Comparison Mode
  const [compareState1, setCompareState1] = useState<string>(selectedStateCode || 'CA');
  const [compareState2, setCompareState2] = useState<string>('TX');
  const [viewMode, setViewMode] = useState<'explorer' | 'comparison'>('explorer');

  // Filtered States
  const filteredStates = useMemo(() => {
    return Object.values(US_STATE_TAX_CONFIGS).filter(state => {
      const matchesSearch =
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || state.region === regionFilter;
      const matchesTaxType = taxTypeFilter === 'all' || state.type === taxTypeFilter;
      return matchesSearch && matchesRegion && matchesTaxType;
    });
  }, [searchTerm, regionFilter, taxTypeFilter]);

  const activeState = US_STATE_TAX_CONFIGS[activeStateCode] || US_STATE_TAX_CONFIGS['CA'];

  // State 1 Simulation
  const state1Calc = useMemo(() => {
    const input: PaycheckCalculationInput = {
      regularHours: simHoursPerWeek * 2, // Bi-weekly
      overtimeHours: 0,
      hourlyWage: simHourlyWage,
      creditCardTips: simTipsPerWeek * 2,
      payFrequency: 'biweekly',
      filingStatus: simFilingStatus,
      stateCode: compareState1,
    };
    return calculateEmployeePaycheck(input);
  }, [simHourlyWage, simHoursPerWeek, simTipsPerWeek, simFilingStatus, compareState1]);

  // State 2 Simulation
  const state2Calc = useMemo(() => {
    const input: PaycheckCalculationInput = {
      regularHours: simHoursPerWeek * 2,
      overtimeHours: 0,
      hourlyWage: simHourlyWage,
      creditCardTips: simTipsPerWeek * 2,
      payFrequency: 'biweekly',
      filingStatus: simFilingStatus,
      stateCode: compareState2,
    };
    return calculateEmployeePaycheck(input);
  }, [simHourlyWage, simHoursPerWeek, simTipsPerWeek, simFilingStatus, compareState2]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto">

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-2xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  50-State Income Tax Brackets & Hospitality Labor Laws
                </h2>
                <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  2026 Live Database
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Compare progressive tax rates, flat tax systems, standard deductions, and state tip credit legality
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('explorer')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'explorer' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                State Directory
              </button>
              <button
                onClick={() => setViewMode('comparison')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'comparison' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Compare 2 States
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VIEW 1: 50-STATE DIRECTORY & DRILLDOWN */}
        {viewMode === 'explorer' && (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">

            {/* Left Column: Search & State List (4.5 cols) */}
            <div className="w-full md:w-5/12 flex flex-col h-full bg-slate-50/60 overflow-hidden">

              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-slate-200 bg-white space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by state name or code (e.g., California, TX, NY)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Tax Type:</span>
                  {(['all', 'none', 'flat', 'graduated'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setTaxTypeFilter(type)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold capitalize transition-colors shrink-0 cursor-pointer ${
                        taxTypeFilter === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'none' ? '0% No Tax' : type === 'flat' ? 'Flat Tax' : type === 'graduated' ? 'Progressive' : 'All (51)'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Region:</span>
                  {(['all', 'West', 'Midwest', 'South', 'Northeast'] as const).map(reg => (
                    <button
                      key={reg}
                      onClick={() => setRegionFilter(reg)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                        regionFilter === reg
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {reg === 'all' ? 'All Regions' : reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* State List scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 px-1">
                  Showing {filteredStates.length} jurisdictions
                </div>
                {filteredStates.map(st => {
                  const isSelected = activeStateCode === st.code;
                  return (
                    <div
                      key={st.code}
                      onClick={() => setActiveStateCode(st.code)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center font-mono">
                            {st.code}
                          </span>
                          <div>
                            <div className="font-extrabold text-xs text-slate-900">{st.name}</div>
                            <div className="text-[10px] text-slate-500">{st.region} Region</div>
                          </div>
                        </div>

                        <div className="text-right">
                          {st.type === 'none' ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                              0% Tax Free
                            </span>
                          ) : st.type === 'flat' ? (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black">
                              Flat {((st.flatRate || 0) * 100).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[10px] font-black">
                              Progressive ({(st.brackets?.single[st.brackets.single.length - 1]?.rate || 0) * 100}%)
                            </span>
                          )}
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            Min Wage: ${st.minWage.toFixed(2)}/hr
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column: Active State Deep Dive (7.5 cols) */}
            <div className="w-full md:w-7/12 flex-1 p-6 overflow-y-auto space-y-6">

              {/* Active State Header Card */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-white/20 text-white font-mono font-black text-sm rounded-xl">
                        {activeState.code}
                      </span>
                      <h3 className="text-2xl font-black tracking-tight">{activeState.name}</h3>
                    </div>
                    <p className="text-xs text-indigo-200 mt-1">
                      {activeState.region} United States • 2026 Labor & Payroll Standard
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectState) onSelectState(activeState.code);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Use as Active Payroll State</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/15 text-xs">
                  <div>
                    <div className="text-indigo-300 text-[10px] uppercase font-bold">Tax System</div>
                    <div className="text-base font-black capitalize mt-0.5">{activeState.type}</div>
                  </div>

                  <div>
                    <div className="text-indigo-300 text-[10px] uppercase font-bold">Standard Deduction</div>
                    <div className="text-base font-black font-mono mt-0.5">
                      ${activeState.standardDeduction.single.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-indigo-300 text-[10px] uppercase font-bold">Minimum Wage</div>
                    <div className="text-base font-black font-mono mt-0.5">
                      ${activeState.minWage.toFixed(2)}/hr
                    </div>
                  </div>

                  <div>
                    <div className="text-indigo-300 text-[10px] uppercase font-bold">Tip Credit Allowed?</div>
                    <div className="text-base font-black mt-0.5">
                      {activeState.tipCreditAllowed ? (
                        <span className="text-amber-300 font-bold">Yes (${activeState.tippedMinWage.toFixed(2)} base)</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">Illegal (Full Min Wage)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progressive Tax Brackets Tables */}
              {activeState.type === 'graduated' && activeState.brackets && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>{activeState.name} State Income Tax Brackets (Annual)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">Single Filers</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Bracket Tier</th>
                          <th className="py-2.5 px-3">Taxable Income Threshold</th>
                          <th className="py-2.5 px-3 text-right">Marginal Tax Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {activeState.brackets.single.map((b, idx, arr) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-sans font-semibold">Tier {idx + 1}</td>
                            <td className="py-2.5 px-3">
                              ${b.threshold.toLocaleString()}{arr[idx + 1] ? ` - $${arr[idx + 1].threshold.toLocaleString()}` : '+'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-indigo-700">
                              {(b.rate * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Labor Notes and Restaurant Compliance Rules */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Hospitality & Restaurant Labor Compliance Notes for {activeState.name}:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeState.laborNotes}
                </p>
                {activeState.stateDisabilityRate && (
                  <div className="text-xs text-indigo-900 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 mt-2 font-medium">
                    Mandatory Employee State Disability Insurance (SDI): <strong>{((activeState.stateDisabilityRate || 0) * 100).toFixed(2)}%</strong>
                  </div>
                )}
                {activeState.paidFamilyLeaveRate && (
                  <div className="text-xs text-purple-900 bg-purple-50/80 p-2.5 rounded-xl border border-purple-100 mt-2 font-medium">
                    Paid Family & Medical Leave (PFML) employee withholding: <strong>{((activeState.paidFamilyLeaveRate || 0) * 100).toFixed(3)}%</strong>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: REAL-TIME 2-STATE COMPARISON SIMULATOR */}
        {viewMode === 'comparison' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">

            {/* Simulator Controls */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Simulated Hourly Wage</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="1"
                    min="7.25"
                    value={simHourlyWage}
                    onChange={(e) => setSimHourlyWage(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Hours Worked / Week</label>
                <input
                  type="number"
                  step="2"
                  min="0"
                  value={simHoursPerWeek}
                  onChange={(e) => setSimHoursPerWeek(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Weekly Tips ($)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={simTipsPerWeek}
                    onChange={(e) => setSimTipsPerWeek(parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tax Filing Status</label>
                <select
                  value={simFilingStatus}
                  onChange={(e) => setSimFilingStatus(e.target.value as FilingStatus)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="single">Single</option>
                  <option value="married_joint">Married Filing Jointly</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
            </div>

            {/* State Comparison 2-Card Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* State 1 Card */}
              <div className="bg-white rounded-3xl p-6 border-2 border-indigo-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-600 text-white font-mono font-black text-sm rounded-xl">
                      {compareState1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{state1Calc.stateConfig.name}</h4>
                      <div className="text-[11px] text-slate-500 capitalize">{state1Calc.stateConfig.type} Tax Model</div>
                    </div>
                  </div>

                  <select
                    value={compareState1}
                    onChange={(e) => setCompareState1(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {Object.values(US_STATE_TAX_CONFIGS).map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Bi-Weekly Gross Earnings</span>
                    <span className="font-mono font-bold">${state1Calc.grossPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Federal Income Tax (FIT)</span>
                    <span className="font-mono text-rose-700">-${state1Calc.federalIncomeTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>FICA (Social Security & Medicare)</span>
                    <span className="font-mono text-rose-700">-${state1Calc.totalFicaTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold bg-indigo-50/60 p-2 rounded-xl">
                    <span>{state1Calc.stateConfig.name} State Tax + SDI</span>
                    <span className="font-mono text-rose-700">
                      -${(state1Calc.stateIncomeTax + state1Calc.stateDisabilityInsurance + state1Calc.statePaidFamilyLeave).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    Bi-Weekly Take-Home Pay
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    ${state1Calc.netPay.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                    <span>Annualized Net Take-Home:</span>
                    <span className="font-bold font-mono text-white">${state1Calc.annualizedNet.toLocaleString()}/yr</span>
                  </div>
                </div>
              </div>

              {/* State 2 Card */}
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-600 text-white font-mono font-black text-sm rounded-xl">
                      {compareState2}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">{state2Calc.stateConfig.name}</h4>
                      <div className="text-[11px] text-slate-500 capitalize">{state2Calc.stateConfig.type} Tax Model</div>
                    </div>
                  </div>

                  <select
                    value={compareState2}
                    onChange={(e) => setCompareState2(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    {Object.values(US_STATE_TAX_CONFIGS).map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Bi-Weekly Gross Earnings</span>
                    <span className="font-mono font-bold">${state2Calc.grossPay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Federal Income Tax (FIT)</span>
                    <span className="font-mono text-rose-700">-${state2Calc.federalIncomeTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>FICA (Social Security & Medicare)</span>
                    <span className="font-mono text-rose-700">-${state2Calc.totalFicaTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold bg-emerald-50/60 p-2 rounded-xl">
                    <span>{state2Calc.stateConfig.name} State Tax + SDI</span>
                    <span className="font-mono text-rose-700">
                      -${(state2Calc.stateIncomeTax + state2Calc.stateDisabilityInsurance + state2Calc.statePaidFamilyLeave).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    Bi-Weekly Take-Home Pay
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    ${state2Calc.netPay.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                    <span>Annualized Net Take-Home:</span>
                    <span className="font-bold font-mono text-white">${state2Calc.annualizedNet.toLocaleString()}/yr</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Delta Difference Callout */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Take-Home Difference</div>
                <div className="text-base font-extrabold mt-0.5">
                  An employee in <strong>{state1Calc.annualizedNet > state2Calc.annualizedNet ? state1Calc.stateConfig.name : state2Calc.stateConfig.name}</strong> takes home{' '}
                  <span className="text-emerald-400 font-mono">
                    ${Math.abs(state1Calc.annualizedNet - state2Calc.annualizedNet).toLocaleString()}/yr more
                  </span>{' '}
                  than in {state1Calc.annualizedNet > state2Calc.annualizedNet ? state2Calc.stateConfig.name : state1Calc.stateConfig.name}.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Compiled from state Department of Revenue publications and US Department of Labor Wage & Hour Division.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
