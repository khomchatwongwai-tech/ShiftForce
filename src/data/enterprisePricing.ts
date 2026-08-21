import { PricingPlan } from '../types';

export const ENTERPRISE_PRICING_PLANS: PricingPlan[] = [
  { id:'free-1', minLocations:1, maxLocations:1, maxEmployees:10, label:'Free', monthlyPrice:0, annualPrice:0, annualMonthlyPrice:0, features:['1 location','Up to 10 employees','Core scheduling','Time off & availability','Employee self-service','Basic announcements'] },
  { id:'loc-2-5', minLocations:2, maxLocations:5, maxEmployees:-1, label:'Multi-Location 5', monthlyPrice:49, annualPrice:499, annualMonthlyPrice:41.58, trialDays:30, features:['2–5 locations','Unlimited employees','All Locations dashboard','Corporate + store roles','Location switcher','AI scheduling foundation'] },
  { id:'loc-6-10', minLocations:6, maxLocations:10, maxEmployees:-1, label:'Multi-Location 10', monthlyPrice:99, annualPrice:999, annualMonthlyPrice:83.25, trialDays:30, isPopular:true, features:['6–10 locations','Unlimited employees','Regional management','Cross-store labor views','Central announcements','Priority onboarding'] },
  { id:'loc-11-20', minLocations:11, maxLocations:20, maxEmployees:-1, label:'Enterprise 20', monthlyPrice:199, annualPrice:1999, annualMonthlyPrice:166.58, trialDays:30, features:['11–20 locations','Unlimited employees','Company-wide reporting','Regional RBAC','Advanced workforce analytics','Centralized compliance'] },
  { id:'loc-21-50', minLocations:21, maxLocations:50, maxEmployees:-1, label:'Enterprise 50', monthlyPrice:399, annualPrice:3999, annualMonthlyPrice:333.25, features:['21–50 locations','Unlimited employees','Enterprise hierarchy','Advanced approvals','Multi-unit command center','Integration controls'] },
  { id:'loc-51-100', minLocations:51, maxLocations:100, maxEmployees:-1, label:'Enterprise 100', monthlyPrice:699, annualPrice:6999, annualMonthlyPrice:583.25, features:['51–100 locations','Unlimited employees','Regional dashboards','Advanced analytics','Central policy controls','Priority support'] },
  { id:'loc-101-200', minLocations:101, maxLocations:200, maxEmployees:-1, label:'Enterprise 200', monthlyPrice:1199, annualPrice:11999, annualMonthlyPrice:999.92, features:['101–200 locations','Unlimited employees','Enterprise audit controls','Bulk provisioning','Advanced exports','Priority support'] },
  { id:'loc-201-500', minLocations:201, maxLocations:500, maxEmployees:-1, label:'Enterprise 500', monthlyPrice:2499, annualPrice:24999, annualMonthlyPrice:2083.25, features:['201–500 locations','Unlimited employees','Large-scale RBAC','Portfolio analytics','Bulk location management','Enterprise support'] },
  { id:'loc-501-1000', minLocations:501, maxLocations:1000, maxEmployees:-1, label:'Enterprise 1000', monthlyPrice:3999, annualPrice:39999, annualMonthlyPrice:3333.25, features:['501–1,000 locations','Unlimited employees','Enterprise API readiness','SSO-ready architecture','High-volume operations','Dedicated success tier'] },
  { id:'loc-1001-2000', minLocations:1001, maxLocations:2000, maxEmployees:-1, label:'Enterprise 2000', monthlyPrice:5999, annualPrice:59999, annualMonthlyPrice:4999.92, features:['1,001–2,000 locations','Unlimited employees','Global hierarchy controls','Advanced governance','Enterprise integrations','Dedicated success tier'] },
  { id:'enterprise-custom', minLocations:2001, maxLocations:null, maxEmployees:-1, label:'Custom Enterprise', monthlyPrice:-1, annualPrice:-1, annualMonthlyPrice:-1, features:['2,001+ locations','Unlimited employees','Custom contract','SLA & premium support','SSO / API / custom integrations','Security & procurement support'] },
];

export function getPlanForLocationCount(locationCount:number): PricingPlan {
  const count = Math.max(1, Math.floor(locationCount || 1));
  return ENTERPRISE_PRICING_PLANS.find(plan => count >= (plan.minLocations ?? 1) && (plan.maxLocations == null || count <= plan.maxLocations)) ?? ENTERPRISE_PRICING_PLANS[ENTERPRISE_PRICING_PLANS.length - 1];
}

export function isPlanEligible(plan: PricingPlan, locationCount:number, employeeCount:number): boolean {
  const count = Math.max(1, Math.floor(locationCount || 1));
  const inLocationRange = count >= (plan.minLocations ?? 1) && (plan.maxLocations == null || count <= plan.maxLocations);
  const employeesAllowed = plan.maxEmployees < 0 || employeeCount <= plan.maxEmployees;
  return inLocationRange && employeesAllowed;
}

export function formatPlanPrice(plan: PricingPlan, cycle:'monthly'|'annual'): string {
  if (plan.monthlyPrice < 0) return 'Custom';
  if (plan.monthlyPrice === 0) return '$0';
  if (cycle === 'annual') return `$${plan.annualPrice?.toLocaleString() ?? Math.round(plan.annualMonthlyPrice * 12).toLocaleString()}/yr`;
  return `$${plan.monthlyPrice.toLocaleString()}/mo`;
}