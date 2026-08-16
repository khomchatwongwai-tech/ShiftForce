import { CompanyLocation, OrganizationMembership } from '../types';

export function getAccessibleLocations(locations: CompanyLocation[], membership?: OrganizationMembership | null): CompanyLocation[] {
  if (!membership || !membership.active) return [];
  if (membership.canViewAllLocations || membership.authorizedLocationIds.some(id => id === '*')) return locations.filter(l => l.active);
  const allowed = new Set(membership.authorizedLocationIds);
  return locations.filter(l => l.active && allowed.has(l.id));
}

export function canAccessLocation(locationId: string, membership?: OrganizationMembership | null): boolean {
  if (!membership || !membership.active) return false;
  return membership.canViewAllLocations || membership.authorizedLocationIds.some(id => id === '*') || membership.authorizedLocationIds.some(id => id === locationId);
}

export function effectiveLocationCount(locations: CompanyLocation[]): number {
  return locations.filter(l => l.active).length;
}
