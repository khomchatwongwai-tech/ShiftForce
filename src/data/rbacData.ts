import { CustomRole, RBACManagerState, HierarchyNode, Employee, Shift, ActiveTab } from '../types';
import { INITIAL_ENTERPRISE_HIERARCHY } from './commandCenterData';

export const INITIAL_CUSTOM_ROLES: CustomRole[] = [
  {
    id: 'role-super-admin',
    name: 'Corporate Executive (Super Admin)',
    code: 'CORP_EXEC_SUPERADMIN',
    description: 'Unrestricted enterprise-wide master authority. Manages billing, licenses, financial models, AI swarm commands, payroll, and global RBAC security.',
    badgeColor: 'bg-indigo-600 text-white border-indigo-700',
    hierarchyScopeLevel: 'organization',
    assignedHierarchyPath: 'ShiftForce Global Hospitality Corp',
    assignedNodeId: 'node-corp-01',
    authorizedLocationIds: ['*'],
    permissions: {
      allowedTabs: [
        'command_center',
        'intelligence_agent',
        'enterprise',
        'schedule',
        'employees',
        'payroll',
        'learn',
        'performance',
        'integrations',
        'analytics',
        'requests',
        'tardiness',
        'announcements',
        'hr_payroll'
      ],
      canViewWagesAndBudgets: true,
      canEditSchedules: true,
      canApproveTimeOff: true,
      canManageEmployees: true,
      canExecuteAIActions: true,
      canExportPayroll: true,
      canManageRBAC: true,
      canViewAllLocations: true
    },
    isCustom: false,
    userCount: 4,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'System Provisioning'
  },
  {
    id: 'role-restaurant-host',
    name: 'Restaurant Host & Franchise Owner',
    code: 'RESTAURANT_HOST_OWNER',
    description: 'Primary restaurant host and paying account holder. Responsible for restaurant subscription and billing so that all staff members and employees use the app completely FREE.',
    badgeColor: 'bg-amber-600 text-white border-amber-700',
    hierarchyScopeLevel: 'organization',
    assignedHierarchyPath: 'ShiftForce Global Hospitality Corp',
    assignedNodeId: 'node-corp-01',
    authorizedLocationIds: ['*'],
    permissions: {
      allowedTabs: [
        'command_center',
        'intelligence_agent',
        'enterprise',
        'schedule',
        'employees',
        'payroll',
        'learn',
        'performance',
        'integrations',
        'analytics',
        'requests',
        'tardiness',
        'announcements',
        'hr_payroll'
      ],
      canViewWagesAndBudgets: true,
      canEditSchedules: true,
      canApproveTimeOff: true,
      canManageEmployees: true,
      canExecuteAIActions: true,
      canExportPayroll: true,
      canManageRBAC: true,
      canViewAllLocations: true
    },
    isCustom: true,
    userCount: 2,
    createdAt: '2026-01-15T08:00:00Z',
    createdBy: 'Franchise Provisioning'
  },
  {
    id: 'role-regional-auditor',
    name: 'Regional Auditor (Pacific Coast)',
    code: 'REGIONAL_AUDITOR_PACIFIC',
    description: 'Monitors compliance, labor variances, and guest reviews across 142 Pacific West Coast locations. Read-only roster audit with full wage variance inspection.',
    badgeColor: 'bg-emerald-700 text-white border-emerald-800',
    hierarchyScopeLevel: 'region',
    assignedHierarchyPath: 'Pacific West Coast Region (CA, WA, OR)',
    assignedNodeId: 'node-region-01',
    authorizedLocationIds: ['node-district-01', 'node-loc-01'],
    permissions: {
      allowedTabs: [
        'command_center',
        'intelligence_agent',
        'enterprise',
        'schedule',
        'employees',
        'payroll',
        'learn',
        'performance',
        'integrations',
        'analytics',
        'announcements'
      ],
      canViewWagesAndBudgets: true,
      canEditSchedules: false, // Read-only auditor
      canApproveTimeOff: false,
      canManageEmployees: false,
      canExecuteAIActions: true,
      canExportPayroll: false,
      canManageRBAC: false,
      canViewAllLocations: false
    },
    isCustom: true,
    userCount: 6,
    createdAt: '2026-02-15T09:30:00Z',
    createdBy: 'Corporate Compliance'
  },
  {
    id: 'role-location-gm',
    name: 'Location General Manager (Downtown Flagship #101)',
    code: 'LOCATION_GM_FLAGSHIP',
    description: 'Direct operational management for Downtown Flagship #101. Full authority over local shifts, staff rosters, time-off approvals, and daily tip pooling.',
    badgeColor: 'bg-sky-600 text-white border-sky-700',
    hierarchyScopeLevel: 'location',
    assignedHierarchyPath: 'Downtown Flagship #101',
    assignedNodeId: 'node-loc-01',
    authorizedLocationIds: ['node-loc-01'],
    permissions: {
      allowedTabs: [
        'schedule',
        'employees',
        'payroll',
        'learn',
        'performance',
        'integrations',
        'requests',
        'tardiness',
        'announcements'
      ],
      canViewWagesAndBudgets: true,
      canEditSchedules: true,
      canApproveTimeOff: true,
      canManageEmployees: true,
      canExecuteAIActions: true,
      canExportPayroll: true,
      canManageRBAC: false,
      canViewAllLocations: false
    },
    isCustom: true,
    userCount: 18,
    createdAt: '2026-03-01T10:00:00Z',
    createdBy: 'Operations Directorate'
  },
  {
    id: 'role-shift-supervisor',
    name: 'Floor Shift Supervisor',
    code: 'FLOOR_SUPERVISOR_LEAD',
    description: 'Floor leadership for active meal periods. Manages on-shift break compliance, tardiness logs, and station readiness. Wages and sensitive salary data are masked.',
    badgeColor: 'bg-amber-600 text-white border-amber-700',
    hierarchyScopeLevel: 'location',
    assignedHierarchyPath: 'Downtown Flagship #101',
    assignedNodeId: 'node-loc-01',
    authorizedLocationIds: ['node-loc-01'],
    permissions: {
      allowedTabs: [
        'schedule',
        'performance',
        'requests',
        'tardiness',
        'announcements',
        'learn'
      ],
      canViewWagesAndBudgets: false, // Mask sensitive financial data
      canEditSchedules: true,
      canApproveTimeOff: false,
      canManageEmployees: false,
      canExecuteAIActions: false,
      canExportPayroll: false,
      canManageRBAC: false,
      canViewAllLocations: false
    },
    isCustom: true,
    userCount: 42,
    createdAt: '2026-04-10T14:15:00Z',
    createdBy: 'General Manager SF'
  },
  {
    id: 'role-hr-compliance',
    name: 'HR & People Operations Director',
    code: 'HR_PEOPLE_OPS_DIRECTOR',
    description: 'Enterprise human resources officer focusing on hiring pipelines, I-9 compliance, mandatory food/alcohol handler certifications, and training academies.',
    badgeColor: 'bg-purple-600 text-white border-purple-700',
    hierarchyScopeLevel: 'organization',
    assignedHierarchyPath: 'ShiftForce Global Hospitality Corp',
    assignedNodeId: 'node-corp-01',
    authorizedLocationIds: ['*'],
    permissions: {
      allowedTabs: [
        'hr_payroll',
        'employees',
        'learn',
        'payroll',
        'performance',
        'announcements',
        'requests'
      ],
      canViewWagesAndBudgets: true,
      canEditSchedules: false,
      canApproveTimeOff: true,
      canManageEmployees: true,
      canExecuteAIActions: true,
      canExportPayroll: true,
      canManageRBAC: false,
      canViewAllLocations: true
    },
    isCustom: true,
    userCount: 8,
    createdAt: '2026-02-01T11:00:00Z',
    createdBy: 'VP Human Capital'
  },
  {
    id: 'role-staff-employee',
    name: 'Front & Back of House Staff (Free Employee Seat)',
    code: 'STAFF_EMPLOYEE_FREE_SEAT',
    description: 'General restaurant employee (Server, Cook, Bartender, Host, Dishwasher). 100% FREE application access paid and sponsored entirely by the Restaurant Host and Admin.',
    badgeColor: 'bg-emerald-600 text-white border-emerald-700',
    hierarchyScopeLevel: 'location',
    assignedHierarchyPath: 'Downtown Flagship #101',
    assignedNodeId: 'node-loc-01',
    authorizedLocationIds: ['node-loc-01'],
    permissions: {
      allowedTabs: [
        'schedule',
        'learn',
        'requests',
        'announcements'
      ],
      canViewWagesAndBudgets: false,
      canEditSchedules: false,
      canApproveTimeOff: false,
      canManageEmployees: false,
      canExecuteAIActions: false,
      canExportPayroll: false,
      canManageRBAC: false,
      canViewAllLocations: false
    },
    isCustom: true,
    userCount: 1420,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'Automated Employee Provisioning'
  }
];

export const INITIAL_RBAC_STATE: RBACManagerState = {
  roles: INITIAL_CUSTOM_ROLES,
  activeRoleId: 'role-super-admin',
  simulationModeActive: false,
  auditTrail: [
    {
      id: 'audit-rbac-1',
      timestamp: '2026-08-14 07:15 AM',
      action: 'Role Provisioned',
      roleName: 'Regional Auditor (Pacific Coast)',
      details: 'Scoped to Pacific West Coast Region (142 locations) with read-only schedule audit permissions.'
    },
    {
      id: 'audit-rbac-2',
      timestamp: '2026-08-14 06:40 AM',
      action: 'Wage Masking Applied',
      roleName: 'Floor Shift Supervisor',
      details: 'Restricted financial wage and labor cost views from floor lead tier.'
    },
    {
      id: 'audit-rbac-3',
      timestamp: '2026-08-13 04:20 PM',
      action: 'Custom Role Registered',
      roleName: 'Location General Manager (Downtown Flagship #101)',
      details: 'Authorized full scheduling & tip-pool rights for SF Downtown Unit #101.'
    }
  ]
};

// ----------------------------------------------------
// Hierarchy Path & Scoping Helper Algorithms
// ----------------------------------------------------

/**
 * Returns all descendant node IDs for a given hierarchy node in the tree.
 */
export function getDescendantNodeIds(rootNodeId: string, nodes: HierarchyNode[] = INITIAL_ENTERPRISE_HIERARCHY): string[] {
  if (rootNodeId === 'node-corp-01') {
    return nodes.map(n => n.id);
  }
  
  const descendants: string[] = [rootNodeId];
  let queue: string[] = [rootNodeId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = nodes.filter(n => n.parentId === currentId);
    for (const child of children) {
      if (!descendants.includes(child.id)) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }
  }

  return descendants;
}

/**
 * Checks if a record with a given hierarchyPath or locationId is accessible
 * within the active role's authorized hierarchy branch.
 */
export function isRecordAuthorizedForRole(
  role: CustomRole,
  recordHierarchyPath?: string,
  recordLocationId?: string,
  hierarchyNodes: HierarchyNode[] = INITIAL_ENTERPRISE_HIERARCHY
): boolean {
  // Super Admin / Organization wide has access to everything
  if (role.permissions.canViewAllLocations || role.hierarchyScopeLevel === 'organization' || role.assignedNodeId === 'node-corp-01') {
    return true;
  }

  // If node ID matches directly or via descendants
  const authorizedNodeIds = getDescendantNodeIds(role.assignedNodeId, hierarchyNodes);
  
  if (recordLocationId && authorizedNodeIds.includes(recordLocationId)) {
    return true;
  }

  // Check matching by hierarchy string path substring
  if (recordHierarchyPath) {
    const scopeKeyword = role.assignedHierarchyPath.toLowerCase();
    const recordPathLower = recordHierarchyPath.toLowerCase();
    if (recordPathLower.includes(scopeKeyword)) {
      return true;
    }
  }

  // If role is location specific e.g. "Downtown Flagship #101"
  if (role.hierarchyScopeLevel === 'location' && role.assignedNodeId === 'node-loc-01') {
    // Default mock employees/shifts without specific path tag are associated with the primary flagship location
    return true;
  }

  // If role is region specific (e.g. Pacific West Coast)
  if (role.hierarchyScopeLevel === 'region' && role.assignedNodeId === 'node-region-01') {
    // Pacific region covers Bay Area, SF Flagship, Seattle, Portland
    if (!recordHierarchyPath || recordHierarchyPath.includes('Pacific') || recordHierarchyPath.includes('SF') || recordHierarchyPath.includes('Downtown Flagship')) {
      return true;
    }
  }

  // If role is brand specific
  if (role.hierarchyScopeLevel === 'brand' && role.assignedNodeId === 'node-brand-01') {
    if (!recordHierarchyPath || recordHierarchyPath.includes('Steakhouse') || recordHierarchyPath.includes('Prime') || recordHierarchyPath.includes('Pacific')) {
      return true;
    }
  }

  return false;
}

/**
 * Filters the hierarchy tree nodes so that a manager only sees their own authorized subtree.
 */
export function filterHierarchyTreeForRole(
  nodes: HierarchyNode[],
  role: CustomRole
): HierarchyNode[] {
  if (role.permissions.canViewAllLocations || role.hierarchyScopeLevel === 'organization' || role.assignedNodeId === 'node-corp-01') {
    return nodes;
  }

  const allowedNodeIds = getDescendantNodeIds(role.assignedNodeId, nodes);
  return nodes.filter(node => allowedNodeIds.includes(node.id));
}
