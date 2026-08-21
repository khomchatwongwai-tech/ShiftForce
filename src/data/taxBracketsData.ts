// Comprehensive 50-State + DC Tax Brackets, FICA & Paycheck Calculation Engine
// Compliant with 2026 IRS Federal withholding brackets and state-specific tax laws

export type FilingStatus = 'single' | 'married_joint' | 'head_of_household';
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export interface TaxBracket {
  threshold: number; // Annual income lower bound for this bracket
  rate: number; // e.g. 0.05 for 5%
}

export interface StateTaxConfig {
  code: string;
  name: string;
  region: 'West' | 'Midwest' | 'South' | 'Northeast';
  type: 'none' | 'flat' | 'graduated';
  flatRate?: number; // e.g. 0.0495 for Illinois
  brackets?: {
    single: TaxBracket[];
    married_joint: TaxBracket[];
    head_of_household: TaxBracket[];
  };
  standardDeduction: {
    single: number;
    married_joint: number;
    head_of_household: number;
  };
  personalExemption?: {
    single: number;
    married_joint: number;
  };
  stateDisabilityRate?: number; // e.g. 0.012 for CA SDI
  stateDisabilityWageCap?: number;
  paidFamilyLeaveRate?: number; // e.g. 0.00388 for NY PFL
  localTaxEstimateRate?: number; // e.g. NYC ~3.876%
  minWage: number; // State minimum wage ($/hr)
  tippedMinWage: number; // Cash minimum wage for tipped workers ($/hr)
  tipCreditAllowed: boolean; // False in CA, OR, WA, NV, AK, MN, MT
  laborNotes: string;
}

// 2026 Federal Tax Brackets (IRS Tax Brackets - Annualized)
export const FEDERAL_TAX_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { threshold: 0, rate: 0.10 },
    { threshold: 11925, rate: 0.12 },
    { threshold: 48475, rate: 0.22 },
    { threshold: 103350, rate: 0.24 },
    { threshold: 197300, rate: 0.32 },
    { threshold: 250525, rate: 0.35 },
    { threshold: 626350, rate: 0.37 },
  ],
  married_joint: [
    { threshold: 0, rate: 0.10 },
    { threshold: 23850, rate: 0.12 },
    { threshold: 96950, rate: 0.22 },
    { threshold: 206700, rate: 0.24 },
    { threshold: 394600, rate: 0.32 },
    { threshold: 501050, rate: 0.35 },
    { threshold: 751600, rate: 0.37 },
  ],
  head_of_household: [
    { threshold: 0, rate: 0.10 },
    { threshold: 17000, rate: 0.12 },
    { threshold: 64850, rate: 0.22 },
    { threshold: 103350, rate: 0.24 },
    { threshold: 197300, rate: 0.32 },
    { threshold: 250500, rate: 0.35 },
    { threshold: 626350, rate: 0.37 },
  ],
};

export const FEDERAL_STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15000,
  married_joint: 30000,
  head_of_household: 22500,
};

// FICA Parameters
export const FICA_RATES = {
  socialSecurityRate: 0.062, // 6.2%
  socialSecurityWageBaseCap: 176100, // 2026 cap
  medicareRate: 0.0145, // 1.45%
  additionalMedicareRate: 0.009, // 0.9% for single > $200k, joint > $250k
  additionalMedicareThreshold: {
    single: 200000,
    married_joint: 250000,
    head_of_household: 200000,
  },
  employerFutaRate: 0.006, // Effective 0.6% after maximum state credit
  employerFutaWageCap: 7000,
  employerSutaAvgRate: 0.027, // 2.7% average
};

// All 50 US States + DC Database
export const US_STATE_TAX_CONFIGS: Record<string, StateTaxConfig> = {
  AL: {
    code: 'AL',
    name: 'Alabama',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.02 },
        { threshold: 500, rate: 0.04 },
        { threshold: 3000, rate: 0.05 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.02 },
        { threshold: 1000, rate: 0.04 },
        { threshold: 6000, rate: 0.05 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.02 },
        { threshold: 500, rate: 0.04 },
        { threshold: 3000, rate: 0.05 },
      ],
    },
    standardDeduction: { single: 3000, married_joint: 8500, head_of_household: 5200 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Federal minimum wage applies. Tip credit max $5.12/hr.',
  },
  AK: {
    code: 'AK',
    name: 'Alaska',
    region: 'West',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 11.73,
    tippedMinWage: 11.73,
    tipCreditAllowed: false,
    laborNotes: 'No state income tax. No tip credit allowed; servers receive full state minimum wage.',
  },
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    region: 'West',
    type: 'flat',
    flatRate: 0.025, // 2.5% Flat tax
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 14.70,
    tippedMinWage: 11.70,
    tipCreditAllowed: true,
    laborNotes: 'Flat 2.5% income tax. Tip credit of $3.00/hr permitted.',
  },
  AR: {
    code: 'AR',
    name: 'Arkansas',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.02 },
        { threshold: 4400, rate: 0.04 },
        { threshold: 8800, rate: 0.044 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.02 },
        { threshold: 8800, rate: 0.04 },
        { threshold: 17600, rate: 0.044 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.02 },
        { threshold: 4400, rate: 0.04 },
        { threshold: 8800, rate: 0.044 },
      ],
    },
    standardDeduction: { single: 2400, married_joint: 4800, head_of_household: 2400 },
    minWage: 11.00,
    tippedMinWage: 2.63,
    tipCreditAllowed: true,
    laborNotes: 'Top marginal income tax rate 4.4%. Tip credit permitted.',
  },
  CA: {
    code: 'CA',
    name: 'California',
    region: 'West',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.01 },
        { threshold: 10412, rate: 0.02 },
        { threshold: 24684, rate: 0.04 },
        { threshold: 38959, rate: 0.06 },
        { threshold: 54081, rate: 0.08 },
        { threshold: 68350, rate: 0.093 },
        { threshold: 349137, rate: 0.103 },
        { threshold: 418961, rate: 0.113 },
        { threshold: 698271, rate: 0.123 },
        { threshold: 1000000, rate: 0.133 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.01 },
        { threshold: 20824, rate: 0.02 },
        { threshold: 49368, rate: 0.04 },
        { threshold: 77918, rate: 0.06 },
        { threshold: 108162, rate: 0.08 },
        { threshold: 136700, rate: 0.093 },
        { threshold: 698274, rate: 0.103 },
        { threshold: 837922, rate: 0.113 },
        { threshold: 1396542, rate: 0.123 },
        { threshold: 2000000, rate: 0.133 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.01 },
        { threshold: 20839, rate: 0.02 },
        { threshold: 49369, rate: 0.04 },
        { threshold: 63638, rate: 0.06 },
        { threshold: 78761, rate: 0.08 },
        { threshold: 93037, rate: 0.093 },
        { threshold: 474824, rate: 0.103 },
        { threshold: 569788, rate: 0.113 },
        { threshold: 949649, rate: 0.123 },
        { threshold: 1356641, rate: 0.133 },
      ],
    },
    standardDeduction: { single: 5540, married_joint: 11080, head_of_household: 11080 },
    stateDisabilityRate: 0.012, // 1.2% CA State Disability Insurance (SDI) with uncapped wages
    minWage: 16.00,
    tippedMinWage: 16.00,
    tipCreditAllowed: false,
    laborNotes: 'Strict Labor Code §351: Tip credit strictly illegal. Servers receive full $16.00/hr + 100% tips. CA SDI 1.2% uncapped.',
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    region: 'West',
    type: 'flat',
    flatRate: 0.044, // 4.4% flat
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    paidFamilyLeaveRate: 0.0045, // FAMLI 0.45% employee share
    minWage: 14.81,
    tippedMinWage: 11.79,
    tipCreditAllowed: true,
    laborNotes: 'Flat 4.4% state income tax. Colorado FAMLI Paid Leave 0.45%. Tip credit up to $3.02/hr.',
  },
  CT: {
    code: 'CT',
    name: 'Connecticut',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.02 },
        { threshold: 10000, rate: 0.045 },
        { threshold: 50000, rate: 0.055 },
        { threshold: 100000, rate: 0.06 },
        { threshold: 200000, rate: 0.065 },
        { threshold: 250000, rate: 0.069 },
        { threshold: 500000, rate: 0.0699 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.02 },
        { threshold: 20000, rate: 0.045 },
        { threshold: 100000, rate: 0.055 },
        { threshold: 200000, rate: 0.06 },
        { threshold: 400000, rate: 0.065 },
        { threshold: 500000, rate: 0.069 },
        { threshold: 1000000, rate: 0.0699 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.02 },
        { threshold: 16000, rate: 0.045 },
        { threshold: 80000, rate: 0.055 },
        { threshold: 160000, rate: 0.06 },
        { threshold: 320000, rate: 0.065 },
        { threshold: 400000, rate: 0.069 },
        { threshold: 800000, rate: 0.0699 },
      ],
    },
    standardDeduction: { single: 15000, married_joint: 24000, head_of_household: 19000 },
    paidFamilyLeaveRate: 0.005, // CT Paid Leave 0.5%
    minWage: 16.10,
    tippedMinWage: 6.38,
    tipCreditAllowed: true,
    laborNotes: 'CT Paid Family Leave 0.5%. Restaurant tip credit allowed for service staff ($9.72 tip credit).',
  },
  DE: {
    code: 'DE',
    name: 'Delaware',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0 },
        { threshold: 2000, rate: 0.022 },
        { threshold: 5000, rate: 0.039 },
        { threshold: 10000, rate: 0.048 },
        { threshold: 20000, rate: 0.052 },
        { threshold: 25000, rate: 0.0555 },
        { threshold: 60000, rate: 0.066 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0 },
        { threshold: 2000, rate: 0.022 },
        { threshold: 5000, rate: 0.039 },
        { threshold: 10000, rate: 0.048 },
        { threshold: 20000, rate: 0.052 },
        { threshold: 25000, rate: 0.0555 },
        { threshold: 60000, rate: 0.066 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0 },
        { threshold: 2000, rate: 0.022 },
        { threshold: 5000, rate: 0.039 },
        { threshold: 10000, rate: 0.048 },
        { threshold: 20000, rate: 0.052 },
        { threshold: 25000, rate: 0.0555 },
        { threshold: 60000, rate: 0.066 },
      ],
    },
    standardDeduction: { single: 3250, married_joint: 6500, head_of_household: 3250 },
    minWage: 15.00,
    tippedMinWage: 2.23,
    tipCreditAllowed: true,
    laborNotes: 'No sales tax. State minimum wage $15.00/hr. Tipped base $2.23/hr.',
  },
  DC: {
    code: 'DC',
    name: 'District of Columbia',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.04 },
        { threshold: 10000, rate: 0.06 },
        { threshold: 40000, rate: 0.065 },
        { threshold: 60000, rate: 0.085 },
        { threshold: 250000, rate: 0.0925 },
        { threshold: 500000, rate: 0.0975 },
        { threshold: 1000000, rate: 0.1075 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.04 },
        { threshold: 10000, rate: 0.06 },
        { threshold: 40000, rate: 0.065 },
        { threshold: 60000, rate: 0.085 },
        { threshold: 250000, rate: 0.0925 },
        { threshold: 500000, rate: 0.0975 },
        { threshold: 1000000, rate: 0.1075 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.04 },
        { threshold: 10000, rate: 0.06 },
        { threshold: 40000, rate: 0.065 },
        { threshold: 60000, rate: 0.085 },
        { threshold: 250000, rate: 0.0925 },
        { threshold: 500000, rate: 0.0975 },
        { threshold: 1000000, rate: 0.1075 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 17.50,
    tippedMinWage: 10.00,
    tipCreditAllowed: true,
    laborNotes: 'DC Initiative 82: Tipped minimum wage phase-out towards full minimum wage by 2027.',
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    region: 'South',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 13.00,
    tippedMinWage: 9.98,
    tipCreditAllowed: true,
    laborNotes: 'No state personal income tax! State minimum wage reaching $15/hr in 2026. Tip credit $3.02/hr.',
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    region: 'South',
    type: 'flat',
    flatRate: 0.0539, // Flat 5.39%
    standardDeduction: { single: 12000, married_joint: 24000, head_of_household: 12000 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Georgia Flat Income Tax (5.39%). Federal tip credit rules apply.',
  },
  HI: {
    code: 'HI',
    name: 'Hawaii',
    region: 'West',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.014 },
        { threshold: 2400, rate: 0.032 },
        { threshold: 4800, rate: 0.055 },
        { threshold: 9600, rate: 0.064 },
        { threshold: 14400, rate: 0.068 },
        { threshold: 19200, rate: 0.072 },
        { threshold: 24000, rate: 0.076 },
        { threshold: 36000, rate: 0.079 },
        { threshold: 48000, rate: 0.0825 },
        { threshold: 150000, rate: 0.09 },
        { threshold: 175000, rate: 0.10 },
        { threshold: 200000, rate: 0.11 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.014 },
        { threshold: 4800, rate: 0.032 },
        { threshold: 9600, rate: 0.055 },
        { threshold: 19200, rate: 0.064 },
        { threshold: 28800, rate: 0.068 },
        { threshold: 38400, rate: 0.072 },
        { threshold: 48000, rate: 0.076 },
        { threshold: 72000, rate: 0.079 },
        { threshold: 96000, rate: 0.0825 },
        { threshold: 300000, rate: 0.09 },
        { threshold: 350000, rate: 0.10 },
        { threshold: 400000, rate: 0.11 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.014 },
        { threshold: 3600, rate: 0.032 },
        { threshold: 7200, rate: 0.055 },
        { threshold: 14400, rate: 0.064 },
        { threshold: 21600, rate: 0.068 },
        { threshold: 28800, rate: 0.072 },
        { threshold: 36000, rate: 0.076 },
        { threshold: 54000, rate: 0.079 },
        { threshold: 72000, rate: 0.0825 },
        { threshold: 225000, rate: 0.09 },
        { threshold: 262500, rate: 0.10 },
        { threshold: 300000, rate: 0.11 },
      ],
    },
    standardDeduction: { single: 2200, married_joint: 4400, head_of_household: 3212 },
    stateDisabilityRate: 0.005, // Hawaii TDI 0.5%
    minWage: 14.00,
    tippedMinWage: 12.75,
    tipCreditAllowed: true,
    laborNotes: 'Hawaii TDI mandatory employee deduction 0.5%. Tip credit up to $1.25/hr.',
  },
  ID: {
    code: 'ID',
    name: 'Idaho',
    region: 'West',
    type: 'flat',
    flatRate: 0.05695, // 5.695% Flat
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 7.25,
    tippedMinWage: 3.35,
    tipCreditAllowed: true,
    laborNotes: 'Flat rate 5.695%. State minimum wage $7.25 with $3.35 tipped base.',
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    region: 'Midwest',
    type: 'flat',
    flatRate: 0.0495, // 4.95% Flat
    standardDeduction: { single: 2775, married_joint: 5550, head_of_household: 2775 },
    minWage: 15.00,
    tippedMinWage: 9.00,
    tipCreditAllowed: true,
    laborNotes: 'Illinois flat 4.95% income tax. Chicago tipped minimum wage phaseout ordinances active.',
  },
  IN: {
    code: 'IN',
    name: 'Indiana',
    region: 'Midwest',
    type: 'flat',
    flatRate: 0.0305, // 3.05% Flat rate (2026)
    standardDeduction: { single: 1000, married_joint: 2000, head_of_household: 1000 },
    localTaxEstimateRate: 0.0175, // Indiana County taxes average ~1.75%
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Indiana flat state rate 3.05% plus local county taxes (e.g. Marion County 2.02%).',
  },
  IA: {
    code: 'IA',
    name: 'Iowa',
    region: 'Midwest',
    type: 'flat',
    flatRate: 0.038, // 3.8% Flat (2026)
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 7.25,
    tippedMinWage: 4.35,
    tipCreditAllowed: true,
    laborNotes: 'Iowa 3.8% flat tax transition. Tip credit allows $2.90 max deduction.',
  },
  KS: {
    code: 'KS',
    name: 'Kansas',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.031 },
        { threshold: 15000, rate: 0.0525 },
        { threshold: 30000, rate: 0.057 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.031 },
        { threshold: 30000, rate: 0.0525 },
        { threshold: 60000, rate: 0.057 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.031 },
        { threshold: 15000, rate: 0.0525 },
        { threshold: 30000, rate: 0.057 },
      ],
    },
    standardDeduction: { single: 3500, married_joint: 8000, head_of_household: 6000 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Kansas standard graduated rates 3.1% - 5.7%. Federal tip credit guidelines apply.',
  },
  KY: {
    code: 'KY',
    name: 'Kentucky',
    region: 'South',
    type: 'flat',
    flatRate: 0.040, // 4.0% Flat
    standardDeduction: { single: 3160, married_joint: 3160, head_of_household: 3160 },
    localTaxEstimateRate: 0.015, // Local occupational license taxes
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Kentucky flat 4.0% rate. Local occupational taxes (e.g. Louisville 2.2%).',
  },
  LA: {
    code: 'LA',
    name: 'Louisiana',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0185 },
        { threshold: 12500, rate: 0.035 },
        { threshold: 50000, rate: 0.0425 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0185 },
        { threshold: 25000, rate: 0.035 },
        { threshold: 100000, rate: 0.0425 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0185 },
        { threshold: 12500, rate: 0.035 },
        { threshold: 50000, rate: 0.0425 },
      ],
    },
    standardDeduction: { single: 4500, married_joint: 9000, head_of_household: 9000 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Louisiana progressive rates top at 4.25%. Federal tip rules.',
  },
  ME: {
    code: 'ME',
    name: 'Maine',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.058 },
        { threshold: 26050, rate: 0.0675 },
        { threshold: 61600, rate: 0.0715 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.058 },
        { threshold: 52100, rate: 0.0675 },
        { threshold: 123250, rate: 0.0715 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.058 },
        { threshold: 39100, rate: 0.0675 },
        { threshold: 92450, rate: 0.0715 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 14.65,
    tippedMinWage: 7.33,
    tipCreditAllowed: true,
    laborNotes: 'Tipped minimum wage is 50% of the state minimum wage ($7.33/hr).',
  },
  MD: {
    code: 'MD',
    name: 'Maryland',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.02 },
        { threshold: 1000, rate: 0.03 },
        { threshold: 2000, rate: 0.04 },
        { threshold: 3000, rate: 0.0475 },
        { threshold: 100000, rate: 0.05 },
        { threshold: 125000, rate: 0.0525 },
        { threshold: 150000, rate: 0.055 },
        { threshold: 250000, rate: 0.0575 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.02 },
        { threshold: 1000, rate: 0.03 },
        { threshold: 2000, rate: 0.04 },
        { threshold: 3000, rate: 0.0475 },
        { threshold: 150000, rate: 0.05 },
        { threshold: 175000, rate: 0.0525 },
        { threshold: 225000, rate: 0.055 },
        { threshold: 300000, rate: 0.0575 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.02 },
        { threshold: 1000, rate: 0.03 },
        { threshold: 2000, rate: 0.04 },
        { threshold: 3000, rate: 0.0475 },
        { threshold: 100000, rate: 0.05 },
        { threshold: 125000, rate: 0.0525 },
        { threshold: 150000, rate: 0.055 },
        { threshold: 250000, rate: 0.0575 },
      ],
    },
    standardDeduction: { single: 2550, married_joint: 5150, head_of_household: 2550 },
    localTaxEstimateRate: 0.032, // MD mandatory county tax (e.g. Montgomery 3.2%, Baltimore 3.2%)
    minWage: 15.00,
    tippedMinWage: 3.63,
    tipCreditAllowed: true,
    laborNotes: 'Maryland mandatory county income tax (~3.20%). Tipped base $3.63/hr.',
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    region: 'Northeast',
    type: 'flat',
    flatRate: 0.050, // 5.0% flat + 4% surtax over $1M
    standardDeduction: { single: 4400, married_joint: 8800, head_of_household: 6800 },
    paidFamilyLeaveRate: 0.00344, // MA PFML employee contribution
    minWage: 15.00,
    tippedMinWage: 6.75,
    tipCreditAllowed: true,
    laborNotes: 'MA PFML 0.344%. Tipped service rate $6.75/hr (must equal $15/hr total with tips).',
  },
  MI: {
    code: 'MI',
    name: 'Michigan',
    region: 'Midwest',
    type: 'flat',
    flatRate: 0.0425, // 4.25% Flat
    standardDeduction: { single: 5600, married_joint: 11200, head_of_household: 5600 },
    localTaxEstimateRate: 0.010, // Detroit / Grand Rapids city tax
    minWage: 10.56,
    tippedMinWage: 4.01,
    tipCreditAllowed: true,
    laborNotes: 'Michigan flat 4.25%. Michigan Paid Sick Leave mandates in effect.',
  },
  MN: {
    code: 'MN',
    name: 'Minnesota',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0535 },
        { threshold: 31690, rate: 0.068 },
        { threshold: 104090, rate: 0.0785 },
        { threshold: 193240, rate: 0.0985 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0535 },
        { threshold: 46330, rate: 0.068 },
        { threshold: 184080, rate: 0.0785 },
        { threshold: 321450, rate: 0.0985 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0535 },
        { threshold: 39010, rate: 0.068 },
        { threshold: 156760, rate: 0.0785 },
        { threshold: 256880, rate: 0.0985 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 10.85,
    tippedMinWage: 10.85,
    tipCreditAllowed: false,
    laborNotes: 'No tip credit allowed in Minnesota. Servers receive full base wage $10.85/hr + tips.',
  },
  MS: {
    code: 'MS',
    name: 'Mississippi',
    region: 'South',
    type: 'flat',
    flatRate: 0.047, // 4.7% Flat
    standardDeduction: { single: 2300, married_joint: 4600, head_of_household: 3400 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Mississippi transitioning to flat tax structure (4.7%). Federal tip credit rules.',
  },
  MO: {
    code: 'MO',
    name: 'Missouri',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.015 },
        { threshold: 1273, rate: 0.02 },
        { threshold: 2546, rate: 0.025 },
        { threshold: 3819, rate: 0.03 },
        { threshold: 5092, rate: 0.035 },
        { threshold: 6365, rate: 0.04 },
        { threshold: 7638, rate: 0.045 },
        { threshold: 8911, rate: 0.047 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.015 },
        { threshold: 1273, rate: 0.02 },
        { threshold: 2546, rate: 0.025 },
        { threshold: 3819, rate: 0.03 },
        { threshold: 5092, rate: 0.035 },
        { threshold: 6365, rate: 0.04 },
        { threshold: 7638, rate: 0.045 },
        { threshold: 8911, rate: 0.047 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.015 },
        { threshold: 1273, rate: 0.02 },
        { threshold: 2546, rate: 0.025 },
        { threshold: 3819, rate: 0.03 },
        { threshold: 5092, rate: 0.035 },
        { threshold: 6365, rate: 0.04 },
        { threshold: 7638, rate: 0.045 },
        { threshold: 8911, rate: 0.047 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    localTaxEstimateRate: 0.010, // St. Louis / Kansas City 1% earnings tax
    minWage: 13.75,
    tippedMinWage: 6.875,
    tipCreditAllowed: true,
    laborNotes: 'Tipped minimum wage is 50% of state minimum ($6.875/hr).',
  },
  MT: {
    code: 'MT',
    name: 'Montana',
    region: 'West',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.047 },
        { threshold: 20500, rate: 0.059 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.047 },
        { threshold: 41000, rate: 0.059 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.047 },
        { threshold: 30750, rate: 0.059 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 10.55,
    tippedMinWage: 10.55,
    tipCreditAllowed: false,
    laborNotes: 'No tip credit allowed in Montana. Full minimum wage $10.55/hr paid to all service staff.',
  },
  NE: {
    code: 'NE',
    name: 'Nebraska',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0246 },
        { threshold: 3700, rate: 0.0351 },
        { threshold: 22170, rate: 0.0501 },
        { threshold: 35730, rate: 0.0584 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0246 },
        { threshold: 7390, rate: 0.0351 },
        { threshold: 44350, rate: 0.0501 },
        { threshold: 71460, rate: 0.0584 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0246 },
        { threshold: 6860, rate: 0.0351 },
        { threshold: 37700, rate: 0.0501 },
        { threshold: 57170, rate: 0.0584 },
      ],
    },
    standardDeduction: { single: 7900, married_joint: 15800, head_of_household: 11600 },
    minWage: 13.50,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'State minimum wage escalating to $15.00/hr. Tipped base $2.13/hr.',
  },
  NV: {
    code: 'NV',
    name: 'Nevada',
    region: 'West',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 12.00,
    tippedMinWage: 12.00,
    tipCreditAllowed: false,
    laborNotes: 'No state personal income tax! Tip credit illegal in Nevada; servers receive full $12.00/hr + tips.',
  },
  NH: {
    code: 'NH',
    name: 'New Hampshire',
    region: 'Northeast',
    type: 'none', // No earned income tax
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 7.25,
    tippedMinWage: 3.26,
    tipCreditAllowed: true,
    laborNotes: 'No state wage income tax. Tipped cash minimum wage $3.26/hr (45% of minimum wage).',
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.014 },
        { threshold: 20000, rate: 0.0175 },
        { threshold: 35000, rate: 0.035 },
        { threshold: 40000, rate: 0.05525 },
        { threshold: 75000, rate: 0.0637 },
        { threshold: 500000, rate: 0.0897 },
        { threshold: 1000000, rate: 0.1075 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.014 },
        { threshold: 20000, rate: 0.0175 },
        { threshold: 50000, rate: 0.0245 },
        { threshold: 70000, rate: 0.035 },
        { threshold: 80000, rate: 0.05525 },
        { threshold: 150000, rate: 0.0637 },
        { threshold: 500000, rate: 0.0897 },
        { threshold: 1000000, rate: 0.1075 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.014 },
        { threshold: 20000, rate: 0.0175 },
        { threshold: 35000, rate: 0.035 },
        { threshold: 40000, rate: 0.05525 },
        { threshold: 75000, rate: 0.0637 },
        { threshold: 500000, rate: 0.0897 },
        { threshold: 1000000, rate: 0.1075 },
      ],
    },
    standardDeduction: { single: 1000, married_joint: 2000, head_of_household: 1000 },
    stateDisabilityRate: 0.0035, // NJ FLI & TDI employee withholding
    minWage: 15.49,
    tippedMinWage: 5.26,
    tipCreditAllowed: true,
    laborNotes: 'New Jersey Family Leave (FLI) and Disability. Tipped base $5.26/hr.',
  },
  NM: {
    code: 'NM',
    name: 'New Mexico',
    region: 'West',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.017 },
        { threshold: 5500, rate: 0.032 },
        { threshold: 11000, rate: 0.047 },
        { threshold: 16000, rate: 0.049 },
        { threshold: 210000, rate: 0.059 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.017 },
        { threshold: 8000, rate: 0.032 },
        { threshold: 16000, rate: 0.047 },
        { threshold: 24000, rate: 0.049 },
        { threshold: 315000, rate: 0.059 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.017 },
        { threshold: 5500, rate: 0.032 },
        { threshold: 11000, rate: 0.047 },
        { threshold: 16000, rate: 0.049 },
        { threshold: 210000, rate: 0.059 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 12.00,
    tippedMinWage: 3.00,
    tipCreditAllowed: true,
    laborNotes: 'State minimum wage $12.00/hr (Santa Fe & Albuquerque local rates higher). Tipped base $3.00.',
  },
  NY: {
    code: 'NY',
    name: 'New York',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.04 },
        { threshold: 8500, rate: 0.045 },
        { threshold: 11700, rate: 0.0525 },
        { threshold: 13900, rate: 0.055 },
        { threshold: 80650, rate: 0.06 },
        { threshold: 215400, rate: 0.0685 },
        { threshold: 1077550, rate: 0.0965 },
        { threshold: 5000000, rate: 0.103 },
        { threshold: 25000000, rate: 0.109 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.04 },
        { threshold: 17150, rate: 0.045 },
        { threshold: 23600, rate: 0.0525 },
        { threshold: 27900, rate: 0.055 },
        { threshold: 161550, rate: 0.06 },
        { threshold: 323200, rate: 0.0685 },
        { threshold: 2155350, rate: 0.0965 },
        { threshold: 5000000, rate: 0.103 },
        { threshold: 25000000, rate: 0.109 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.04 },
        { threshold: 12800, rate: 0.045 },
        { threshold: 17650, rate: 0.0525 },
        { threshold: 20900, rate: 0.055 },
        { threshold: 107750, rate: 0.06 },
        { threshold: 269300, rate: 0.0685 },
        { threshold: 1616450, rate: 0.0965 },
        { threshold: 5000000, rate: 0.103 },
        { threshold: 25000000, rate: 0.109 },
      ],
    },
    standardDeduction: { single: 8000, married_joint: 16050, head_of_household: 11200 },
    paidFamilyLeaveRate: 0.00373, // NY PFL 0.373% capped
    localTaxEstimateRate: 0.03876, // NYC resident tax ~3.876% top
    minWage: 16.00, // NYC/Long Island/Westchester $16.00, Rest of NY $15.00
    tippedMinWage: 10.65,
    tipCreditAllowed: true,
    laborNotes: 'NYC resident income tax (3.078%-3.876%). NY Paid Family Leave 0.373%. Hospitality Wage Order applies.',
  },
  NC: {
    code: 'NC',
    name: 'North Carolina',
    region: 'South',
    type: 'flat',
    flatRate: 0.045, // 4.5% Flat
    standardDeduction: { single: 12750, married_joint: 25500, head_of_household: 19125 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'North Carolina flat 4.5% rate. Federal tip credit standard ($5.12/hr max).',
  },
  ND: {
    code: 'ND',
    name: 'North Dakota',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0 },
        { threshold: 44725, rate: 0.0195 },
        { threshold: 225975, rate: 0.025 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0 },
        { threshold: 74750, rate: 0.0195 },
        { threshold: 275100, rate: 0.025 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0 },
        { threshold: 59950, rate: 0.0195 },
        { threshold: 250550, rate: 0.025 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 7.25,
    tippedMinWage: 4.86,
    tipCreditAllowed: true,
    laborNotes: 'Low income tax brackets (0% up to $44.7k, max 2.5%). Tipped base $4.86 (33% tip credit).',
  },
  OH: {
    code: 'OH',
    name: 'Ohio',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0 },
        { threshold: 26050, rate: 0.0275 },
        { threshold: 100000, rate: 0.035 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0 },
        { threshold: 26050, rate: 0.0275 },
        { threshold: 100000, rate: 0.035 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0 },
        { threshold: 26050, rate: 0.0275 },
        { threshold: 100000, rate: 0.035 },
      ],
    },
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    localTaxEstimateRate: 0.020, // RITA / CCA municipal taxes (e.g. Columbus/Cleveland ~2.5%)
    minWage: 10.45,
    tippedMinWage: 5.25,
    tipCreditAllowed: true,
    laborNotes: 'Ohio 0% under $26k. Municipal income taxes (RITA) common (1.5% - 2.5%).',
  },
  OK: {
    code: 'OK',
    name: 'Oklahoma',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0025 },
        { threshold: 1000, rate: 0.0075 },
        { threshold: 2500, rate: 0.0175 },
        { threshold: 3750, rate: 0.0275 },
        { threshold: 4900, rate: 0.0375 },
        { threshold: 7200, rate: 0.0475 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0025 },
        { threshold: 2000, rate: 0.0075 },
        { threshold: 5000, rate: 0.0175 },
        { threshold: 7500, rate: 0.0275 },
        { threshold: 9800, rate: 0.0375 },
        { threshold: 12200, rate: 0.0475 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0025 },
        { threshold: 1000, rate: 0.0075 },
        { threshold: 2500, rate: 0.0175 },
        { threshold: 3750, rate: 0.0275 },
        { threshold: 4900, rate: 0.0375 },
        { threshold: 7200, rate: 0.0475 },
      ],
    },
    standardDeduction: { single: 6350, married_joint: 12700, head_of_household: 9350 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Top marginal rate 4.75%. Federal tip credit applied.',
  },
  OR: {
    code: 'OR',
    name: 'Oregon',
    region: 'West',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0475 },
        { threshold: 4300, rate: 0.0675 },
        { threshold: 10750, rate: 0.0875 },
        { threshold: 125000, rate: 0.099 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0475 },
        { threshold: 8600, rate: 0.0675 },
        { threshold: 21500, rate: 0.0875 },
        { threshold: 250000, rate: 0.099 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0475 },
        { threshold: 6850, rate: 0.0675 },
        { threshold: 17200, rate: 0.0875 },
        { threshold: 200000, rate: 0.099 },
      ],
    },
    standardDeduction: { single: 2745, married_joint: 5495, head_of_household: 4415 },
    paidFamilyLeaveRate: 0.006, // Paid Leave Oregon 0.6% employee share
    minWage: 14.70, // Portland metro $15.95
    tippedMinWage: 14.70,
    tipCreditAllowed: false,
    laborNotes: 'No tip credit allowed in Oregon! Full minimum wage ($14.70 standard / $15.95 Portland) + tips. Paid Leave Oregon 0.6%.',
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    region: 'Northeast',
    type: 'flat',
    flatRate: 0.0307, // 3.07% Flat
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    localTaxEstimateRate: 0.0375, // Philadelphia Wage Tax 3.75% resident / 3.44% non-resident; other PA municipalities 1%-2%
    minWage: 7.25,
    tippedMinWage: 2.83,
    tipCreditAllowed: true,
    laborNotes: 'Pennsylvania flat 3.07% income tax with no standard deduction. Local EIT / Philadelphia wage tax (~3.75%).',
  },
  RI: {
    code: 'RI',
    name: 'Rhode Island',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0375 },
        { threshold: 77450, rate: 0.0475 },
        { threshold: 176050, rate: 0.0599 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0375 },
        { threshold: 77450, rate: 0.0475 },
        { threshold: 176050, rate: 0.0599 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0375 },
        { threshold: 77450, rate: 0.0475 },
        { threshold: 176050, rate: 0.0599 },
      ],
    },
    standardDeduction: { single: 10500, married_joint: 21000, head_of_household: 15750 },
    stateDisabilityRate: 0.011, // RI TDI 1.1%
    minWage: 15.00,
    tippedMinWage: 3.89,
    tipCreditAllowed: true,
    laborNotes: 'Rhode Island TDI withholding 1.1%. State minimum wage $15.00, tipped base $3.89.',
  },
  SC: {
    code: 'SC',
    name: 'South Carolina',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0 },
        { threshold: 3460, rate: 0.03 },
        { threshold: 17330, rate: 0.063 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0 },
        { threshold: 3460, rate: 0.03 },
        { threshold: 17330, rate: 0.063 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0 },
        { threshold: 3460, rate: 0.03 },
        { threshold: 17330, rate: 0.063 },
      ],
    },
    standardDeduction: { single: 14600, married_joint: 29200, head_of_household: 21900 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Zero tax under $3,460, top rate 6.3%. Federal tip credit standard.',
  },
  SD: {
    code: 'SD',
    name: 'South Dakota',
    region: 'Midwest',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 11.20,
    tippedMinWage: 5.60,
    tipCreditAllowed: true,
    laborNotes: 'No state income tax! Tipped base wage is 50% of state minimum ($5.60/hr).',
  },
  TN: {
    code: 'TN',
    name: 'Tennessee',
    region: 'South',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'No state earned income tax! Federal tip credit and minimum wage standards apply.',
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    region: 'South',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'No state personal income tax! Employees keep 100% of state earnings after Federal/FICA.',
  },
  UT: {
    code: 'UT',
    name: 'Utah',
    region: 'West',
    type: 'flat',
    flatRate: 0.0465, // 4.65% Flat
    standardDeduction: { single: 915, married_joint: 1830, head_of_household: 1830 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Utah flat income tax rate 4.65% with taxpayer tax credit phasing.',
  },
  VT: {
    code: 'VT',
    name: 'Vermont',
    region: 'Northeast',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0335 },
        { threshold: 45400, rate: 0.066 },
        { threshold: 110050, rate: 0.076 },
        { threshold: 229550, rate: 0.0875 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0335 },
        { threshold: 75850, rate: 0.066 },
        { threshold: 183350, rate: 0.076 },
        { threshold: 279400, rate: 0.0875 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0335 },
        { threshold: 60800, rate: 0.066 },
        { threshold: 157000, rate: 0.076 },
        { threshold: 254500, rate: 0.0875 },
      ],
    },
    standardDeduction: { single: 7350, married_joint: 14700, head_of_household: 11000 },
    minWage: 14.01,
    tippedMinWage: 7.01,
    tipCreditAllowed: true,
    laborNotes: 'Tipped minimum wage is 50% of state minimum ($7.01/hr).',
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.02 },
        { threshold: 3000, rate: 0.03 },
        { threshold: 5000, rate: 0.05 },
        { threshold: 17000, rate: 0.0575 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.02 },
        { threshold: 3000, rate: 0.03 },
        { threshold: 5000, rate: 0.05 },
        { threshold: 17000, rate: 0.0575 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.02 },
        { threshold: 3000, rate: 0.03 },
        { threshold: 5000, rate: 0.05 },
        { threshold: 17000, rate: 0.0575 },
      ],
    },
    standardDeduction: { single: 8500, married_joint: 17000, head_of_household: 8500 },
    minWage: 12.41,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'Virginia progressive tax tops out at 5.75% over $17k. State min wage $12.41.',
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    region: 'West',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    paidFamilyLeaveRate: 0.0074, // WA Paid Family & Medical Leave employee share
    stateDisabilityRate: 0.0058, // WA Cares Fund LTC 0.58%
    minWage: 16.28, // Seattle $19.97
    tippedMinWage: 16.28,
    tipCreditAllowed: false,
    laborNotes: 'No state wage income tax! Tip credit illegal; servers receive full $16.28/hr (Seattle $19.97). WA Cares 0.58% and WA PFML.',
  },
  WV: {
    code: 'WV',
    name: 'West Virginia',
    region: 'South',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.0236 },
        { threshold: 10000, rate: 0.0315 },
        { threshold: 25000, rate: 0.0354 },
        { threshold: 40000, rate: 0.0472 },
        { threshold: 60000, rate: 0.0512 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.0236 },
        { threshold: 10000, rate: 0.0315 },
        { threshold: 25000, rate: 0.0354 },
        { threshold: 40000, rate: 0.0472 },
        { threshold: 60000, rate: 0.0512 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.0236 },
        { threshold: 10000, rate: 0.0315 },
        { threshold: 25000, rate: 0.0354 },
        { threshold: 40000, rate: 0.0472 },
        { threshold: 60000, rate: 0.0512 },
      ],
    },
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 8.75,
    tippedMinWage: 2.62,
    tipCreditAllowed: true,
    laborNotes: 'West Virginia recently cut rates by 21.25%. Tipped base $2.62 (70% tip credit).',
  },
  WI: {
    code: 'WI',
    name: 'Wisconsin',
    region: 'Midwest',
    type: 'graduated',
    brackets: {
      single: [
        { threshold: 0, rate: 0.035 },
        { threshold: 14320, rate: 0.044 },
        { threshold: 28640, rate: 0.053 },
        { threshold: 315310, rate: 0.0765 },
      ],
      married_joint: [
        { threshold: 0, rate: 0.035 },
        { threshold: 19090, rate: 0.044 },
        { threshold: 38190, rate: 0.053 },
        { threshold: 420420, rate: 0.0765 },
      ],
      head_of_household: [
        { threshold: 0, rate: 0.035 },
        { threshold: 14320, rate: 0.044 },
        { threshold: 28640, rate: 0.053 },
        { threshold: 315310, rate: 0.0765 },
      ],
    },
    standardDeduction: { single: 12990, married_joint: 24040, head_of_household: 17290 },
    minWage: 7.25,
    tippedMinWage: 2.33,
    tipCreditAllowed: true,
    laborNotes: 'Wisconsin graduated rates from 3.5% to 7.65%. Tipped cash min wage $2.33.',
  },
  WY: {
    code: 'WY',
    name: 'Wyoming',
    region: 'West',
    type: 'none',
    standardDeduction: { single: 0, married_joint: 0, head_of_household: 0 },
    minWage: 7.25,
    tippedMinWage: 2.13,
    tipCreditAllowed: true,
    laborNotes: 'No state income tax! Federal minimum wage and tip credit rules apply.',
  },
};

export interface PaycheckCalculationInput {
  regularHours: number;
  overtimeHours: number;
  doubleTimeHours?: number;
  hourlyWage: number;
  overtimeRateMultiplier?: number; // 1.5 default
  doubleTimeRateMultiplier?: number; // 2.0 default
  reportedCashTips?: number;
  creditCardTips?: number;
  allocatedTips?: number;
  bonusEarnings?: number;
  commissions?: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  stateCode: string;
  w4Allowances?: number;
  w4ExtraWithholdingPerPeriod?: number;
  // Pre-tax deductions
  healthInsurancePreTax?: number;
  dentalVisionPreTax?: number;
  retirement401kPreTax?: number; // dollar or converted
  hsaFsaPreTax?: number;
  commuterPreTax?: number;
  // Post-tax deductions
  roth401kPostTax?: number;
  wageGarnishment?: number;
  uniformMealsPostTax?: number;
  otherPostTax?: number;
  // Local Tax
  enableLocalTax?: boolean;
  localTaxCustomRate?: number;
}

export interface PaycheckCalculationResult {
  // Earnings Breakdown
  regularEarnings: number;
  overtimeEarnings: number;
  doubleTimeEarnings: number;
  totalTips: number;
  reportedCashTips: number;
  creditCardTips: number;
  allocatedTips: number;
  bonusesAndCommissions: number;
  grossPay: number;

  // Pre-tax Deductions
  totalPreTaxDeductions: number;
  preTaxBreakdown: {
    healthInsurance: number;
    dentalVision: number;
    retirement401k: number;
    hsaFsa: number;
    commuter: number;
  };

  // Taxable Bases
  federalTaxableWages: number;
  socialSecurityTaxableWages: number;
  medicareTaxableWages: number;
  stateTaxableWages: number;

  // Employee Taxes Withheld
  federalIncomeTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalFicaTax: number;
  stateIncomeTax: number;
  stateDisabilityInsurance: number;
  statePaidFamilyLeave: number;
  localIncomeTax: number;
  totalTaxesWithheld: number;

  // Post-tax Deductions
  totalPostTaxDeductions: number;
  postTaxBreakdown: {
    roth401k: number;
    wageGarnishment: number;
    uniformMeals: number;
    other: number;
  };

  // Net Pay Result
  netPay: number;
  netPayTakeHomePercent: number;
  effectiveTaxRatePercent: number;

  // Employer Payroll Taxes (True Cost of Labor)
  employerSocialSecurity: number;
  employerMedicare: number;
  employerFuta: number;
  employerSuta: number;
  employerTotalPayrollTaxes: number;
  totalEmployerCost: number;
  ficaTipCreditEst: number; // Section 45B FICA tip credit

  // Annualized Estimates
  annualizedGross: number;
  annualizedNet: number;
  annualizedTaxes: number;

  // Metadata
  periodsPerYear: number;
  stateConfig: StateTaxConfig;
}

/**
 * Calculates progressive tax for an annualized taxable amount given brackets
 */
function calculateGraduatedTax(taxableAnnual: number, brackets: TaxBracket[]): number {
  if (taxableAnnual <= 0 || !brackets || brackets.length === 0) return 0;
  let tax = 0;

  for (let i = 0; i < brackets.length; i++) {
    const current = brackets[i];
    const next = brackets[i + 1];
    if (taxableAnnual > current.threshold) {
      const taxableInBracket = next
        ? Math.min(taxableAnnual, next.threshold) - current.threshold
        : taxableAnnual - current.threshold;
      tax += taxableInBracket * current.rate;
    }
  }
  return Math.max(0, tax);
}

/**
 * Main Paycheck Calculator Engine
 */
export function calculateEmployeePaycheck(input: PaycheckCalculationInput): PaycheckCalculationResult {
  const periodsPerYearMap: Record<PayFrequency, number> = {
    weekly: 52,
    biweekly: 26,
    semimonthly: 24,
    monthly: 12,
  };
  const periodsPerYear = periodsPerYearMap[input.payFrequency] || 26;

  // 1. Calculate Gross Earnings
  const regHours = Math.max(0, input.regularHours || 0);
  const otHours = Math.max(0, input.overtimeHours || 0);
  const dtHours = Math.max(0, input.doubleTimeHours || 0);
  const wage = Math.max(0, input.hourlyWage || 0);
  const otMultiplier = input.overtimeRateMultiplier || 1.5;
  const dtMultiplier = input.doubleTimeRateMultiplier || 2.0;

  const regularEarnings = Number((regHours * wage).toFixed(2));
  const overtimeEarnings = Number((otHours * wage * otMultiplier).toFixed(2));
  const doubleTimeEarnings = Number((dtHours * wage * dtMultiplier).toFixed(2));

  const reportedCashTips = Math.max(0, input.reportedCashTips || 0);
  const creditCardTips = Math.max(0, input.creditCardTips || 0);
  const allocatedTips = Math.max(0, input.allocatedTips || 0);
  const totalTips = Number((reportedCashTips + creditCardTips + allocatedTips).toFixed(2));

  const bonusesAndCommissions = Number(((input.bonusEarnings || 0) + (input.commissions || 0)).toFixed(2));

  const grossPay = Number((regularEarnings + overtimeEarnings + doubleTimeEarnings + totalTips + bonusesAndCommissions).toFixed(2));

  // 2. Pre-Tax Deductions
  const healthInsurance = Math.max(0, input.healthInsurancePreTax || 0);
  const dentalVision = Math.max(0, input.dentalVisionPreTax || 0);
  const retirement401k = Math.max(0, input.retirement401kPreTax || 0);
  const hsaFsa = Math.max(0, input.hsaFsaPreTax || 0);
  const commuter = Math.max(0, input.commuterPreTax || 0);

  const totalPreTaxDeductions = Number((healthInsurance + dentalVision + retirement401k + hsaFsa + commuter).toFixed(2));

  // 3. Taxable Bases
  const federalTaxableWages = Math.max(0, Number((grossPay - totalPreTaxDeductions).toFixed(2)));
  // FICA: 401k is subject to FICA, but Section 125 health/dental/HSA is exempt from FICA
  const ficaExemptPreTax = healthInsurance + dentalVision + hsaFsa + commuter;
  const socialSecurityTaxableWages = Math.max(0, Number((grossPay - ficaExemptPreTax).toFixed(2)));
  const medicareTaxableWages = socialSecurityTaxableWages;
  const stateTaxableWages = federalTaxableWages;

  // 4. Federal Income Tax (Annualized IRS Bracket calculation)
  const annualizedFedTaxable = federalTaxableWages * periodsPerYear;
  const fedStdDeduction = FEDERAL_STANDARD_DEDUCTION[input.filingStatus] || 15000;
  const fedAdjustedAnnualTaxable = Math.max(0, annualizedFedTaxable - fedStdDeduction);
  const fedAnnualTax = calculateGraduatedTax(fedAdjustedAnnualTaxable, FEDERAL_TAX_BRACKETS[input.filingStatus]);
  let federalIncomeTax = Number((fedAnnualTax / periodsPerYear).toFixed(2));
  if (input.w4ExtraWithholdingPerPeriod) {
    federalIncomeTax = Number((federalIncomeTax + input.w4ExtraWithholdingPerPeriod).toFixed(2));
  }

  // 5. FICA Taxes (Social Security & Medicare)
  const socialSecurityTax = Number((socialSecurityTaxableWages * FICA_RATES.socialSecurityRate).toFixed(2));
  let medicareTax = Number((medicareTaxableWages * FICA_RATES.medicareRate).toFixed(2));

  // Additional Medicare for high earners
  let additionalMedicareTax = 0;
  const annualizedMedicareWages = medicareTaxableWages * periodsPerYear;
  const addMedicareThreshold = FICA_RATES.additionalMedicareThreshold[input.filingStatus] || 200000;
  if (annualizedMedicareWages > addMedicareThreshold) {
    const annualAddMed = (annualizedMedicareWages - addMedicareThreshold) * FICA_RATES.additionalMedicareRate;
    additionalMedicareTax = Number((annualAddMed / periodsPerYear).toFixed(2));
    medicareTax = Number((medicareTax + additionalMedicareTax).toFixed(2));
  }
  const totalFicaTax = Number((socialSecurityTax + medicareTax).toFixed(2));

  // 6. State Income Tax (SIT) & State Insurance
  const stateCode = (input.stateCode || 'CA').toUpperCase();
  const stateConfig = US_STATE_TAX_CONFIGS[stateCode] || US_STATE_TAX_CONFIGS['CA'];

  let stateIncomeTax = 0;
  if (stateConfig.type === 'flat' && stateConfig.flatRate) {
    const stateStdDed = stateConfig.standardDeduction[input.filingStatus] || 0;
    const annualizedStateTaxable = Math.max(0, (stateTaxableWages * periodsPerYear) - stateStdDed);
    stateIncomeTax = Number(((annualizedStateTaxable * stateConfig.flatRate) / periodsPerYear).toFixed(2));
  } else if (stateConfig.type === 'graduated' && stateConfig.brackets) {
    const stateBrackets = stateConfig.brackets[input.filingStatus] || stateConfig.brackets.single;
    const stateStdDed = stateConfig.standardDeduction[input.filingStatus] || 0;
    const annualizedStateTaxable = Math.max(0, (stateTaxableWages * periodsPerYear) - stateStdDed);
    const annualStateTax = calculateGraduatedTax(annualizedStateTaxable, stateBrackets);
    stateIncomeTax = Number((annualStateTax / periodsPerYear).toFixed(2));
  } else {
    // 'none' states (TX, FL, WA, NV, AK, TN, WY, SD, NH)
    stateIncomeTax = 0;
  }

  // State Disability & Paid Family Leave
  let stateDisabilityInsurance = 0;
  if (stateConfig.stateDisabilityRate) {
    stateDisabilityInsurance = Number((grossPay * stateConfig.stateDisabilityRate).toFixed(2));
  }

  let statePaidFamilyLeave = 0;
  if (stateConfig.paidFamilyLeaveRate) {
    statePaidFamilyLeave = Number((grossPay * stateConfig.paidFamilyLeaveRate).toFixed(2));
  }

  // Local City Tax
  let localIncomeTax = 0;
  if (input.enableLocalTax) {
    const localRate = input.localTaxCustomRate || stateConfig.localTaxEstimateRate || 0.015;
    localIncomeTax = Number((federalTaxableWages * localRate).toFixed(2));
  }

  const totalTaxesWithheld = Number((federalIncomeTax + totalFicaTax + stateIncomeTax + stateDisabilityInsurance + statePaidFamilyLeave + localIncomeTax).toFixed(2));

  // 7. Post-Tax Deductions
  const roth401k = Math.max(0, input.roth401kPostTax || 0);
  const wageGarnishment = Math.max(0, input.wageGarnishment || 0);
  const uniformMeals = Math.max(0, input.uniformMealsPostTax || 0);
  const otherPostTax = Math.max(0, input.otherPostTax || 0);

  const totalPostTaxDeductions = Number((roth401k + wageGarnishment + uniformMeals + otherPostTax).toFixed(2));

  // 8. Net Take-Home Pay
  const netPay = Math.max(0, Number((grossPay - totalPreTaxDeductions - totalTaxesWithheld - totalPostTaxDeductions).toFixed(2)));
  const netPayTakeHomePercent = grossPay > 0 ? Number(((netPay / grossPay) * 100).toFixed(1)) : 0;
  const effectiveTaxRatePercent = grossPay > 0 ? Number(((totalTaxesWithheld / grossPay) * 100).toFixed(1)) : 0;

  // 9. Employer Payroll Taxes
  const employerSocialSecurity = socialSecurityTax; // Match 6.2%
  const employerMedicare = Number((medicareTaxableWages * FICA_RATES.medicareRate).toFixed(2)); // Match 1.45%
  const employerFuta = Number((Math.min(grossPay, FICA_RATES.employerFutaWageCap / periodsPerYear) * FICA_RATES.employerFutaRate).toFixed(2));
  const employerSuta = Number((grossPay * FICA_RATES.employerSutaAvgRate).toFixed(2));
  const employerTotalPayrollTaxes = Number((employerSocialSecurity + employerMedicare + employerFuta + employerSuta).toFixed(2));
  const totalEmployerCost = Number((grossPay + employerTotalPayrollTaxes).toFixed(2));

  // Section 45B FICA Tip Credit (Employer tax credit for FICA paid on tips exceeding federal minimum wage $5.15 base)
  let ficaTipCreditEst = 0;
  if (totalTips > 0) {
    const tipThresholdWage = 5.15;
    const hours = regHours + otHours + dtHours;
    const directWages = regularEarnings + overtimeEarnings;
    const totalWagePerHr = hours > 0 ? directWages / hours : 0;
    const excessTipAmount = totalWagePerHr < tipThresholdWage
      ? Math.max(0, totalTips - ((tipThresholdWage - totalWagePerHr) * hours))
      : totalTips;
    ficaTipCreditEst = Number((excessTipAmount * 0.0765).toFixed(2));
  }

  // 10. Annualized figures
  const annualizedGross = Number((grossPay * periodsPerYear).toFixed(2));
  const annualizedNet = Number((netPay * periodsPerYear).toFixed(2));
  const annualizedTaxes = Number((totalTaxesWithheld * periodsPerYear).toFixed(2));

  return {
    regularEarnings,
    overtimeEarnings,
    doubleTimeEarnings,
    totalTips,
    reportedCashTips,
    creditCardTips,
    allocatedTips,
    bonusesAndCommissions,
    grossPay,

    totalPreTaxDeductions,
    preTaxBreakdown: {
      healthInsurance,
      dentalVision,
      retirement401k,
      hsaFsa,
      commuter,
    },

    federalTaxableWages,
    socialSecurityTaxableWages,
    medicareTaxableWages,
    stateTaxableWages,

    federalIncomeTax,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalFicaTax,
    stateIncomeTax,
    stateDisabilityInsurance,
    statePaidFamilyLeave,
    localIncomeTax,
    totalTaxesWithheld,

    totalPostTaxDeductions,
    postTaxBreakdown: {
      roth401k,
      wageGarnishment,
      uniformMeals,
      other: otherPostTax,
    },

    netPay,
    netPayTakeHomePercent,
    effectiveTaxRatePercent,

    employerSocialSecurity,
    employerMedicare,
    employerFuta,
    employerSuta,
    employerTotalPayrollTaxes,
    totalEmployerCost,
    ficaTipCreditEst,

    annualizedGross,
    annualizedNet,
    annualizedTaxes,

    periodsPerYear,
    stateConfig,
  };
}