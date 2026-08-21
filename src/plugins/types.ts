import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ActiveTab, SupportedLanguage, Employee, Shift, ShiftTemplate, DepartmentBudgetsMap, TimeOffRequest, ShiftSwapRequest, SickDayReport, AvailabilityRequest, TardinessRecord, OnboardingCandidate, NotificationDispatch, Announcement, POSPlatformInfo, WorkforcePlatformInfo, WorkforceSyncLog, POSServerSalesMetric, POSTimeclockPunch, POSPlatformId, POSDepartmentMapping, RestaurantPerformanceScore, GuestReview } from '../types';

export type PluginCategory = 
  | 'core_scheduling'
  | 'operations'
  | 'payroll_finance'
  | 'learning_academy'
  | 'ai_intelligence'
  | 'integrations'
  | 'performance_hr';

export type ModuleLicenseStatus = 'purchased' | 'trial_active' | 'available_addon' | 'included_in_plan';

export interface PluginDefinition {
  id: string;
  name: string;
  shortCode: string;
  tagline: string;
  description: string;
  version: string;
  category: PluginCategory;
  icon: LucideIcon;
  badge?: string;
  tabId?: ActiveTab;
  isCore?: boolean; // Core modules cannot be toggled off
  enabledByDefault: boolean;
  licenseStatus: ModuleLicenseStatus;
  monthlyAddonPrice: number;
  author: string;
  minTierRequired: 'starter' | 'pro' | 'enterprise';
  features: string[];
  capabilities: {
    realtimeSync?: boolean;
    aiGrounding?: boolean;
    exportableReports?: boolean;
    mobileOptimized?: boolean;
  };
  metrics?: {
    label: string;
    value: string | number;
    trend?: string;
  };
}

export interface EnterpriseFeatureManagerState {
  enabledPluginIds: string[];
  purchasedPluginIds: string[];
  lastModifiedTimestamp: string;
  activePlanTier: 'starter' | 'pro' | 'enterprise';
}

export interface SharedPluginProps {
  employees: Employee[];
  shifts: Shift[];
  currentLanguage: SupportedLanguage;
  weekDates: { dateStr: string; dayName: string; formattedDate: string; isToday: boolean }[];
  portal: 'admin' | 'employee';
  onNavigateTab?: (tab: ActiveTab) => void;
  onDispatchNotification?: (dispatch: Partial<NotificationDispatch>) => void;
}
