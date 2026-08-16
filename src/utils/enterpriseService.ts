import { OrganizationBillingState, CompanyLocation, EnterpriseOrganization, OrganizationMembership } from '../types';
import { authenticatedFetch } from './apiClient';

export interface EnterpriseContextResponse {
  organization: EnterpriseOrganization | null;
  membership: OrganizationMembership;
  locations: CompanyLocation[];
  billing: OrganizationBillingState;
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body as T;
}

export async function getEnterpriseContext(): Promise<EnterpriseContextResponse> {
  return parseJson(await authenticatedFetch('/api/enterprise/context'));
}

export async function bootstrapOrganization(companyName: string, locationName: string, timezone: string): Promise<{organizationId:string;locationId:string}> {
  return parseJson(await authenticatedFetch('/api/enterprise/bootstrap', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName, locationName, timezone }),
  }));
}

export async function createCompanyLocation(input: { name:string; code?:string; regionId?:string; address?:string; timezone?:string }): Promise<{id:string}> {
  return parseJson(await authenticatedFetch('/api/enterprise/locations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
}

export async function updateCompanyLocation(locationId: string, input: Partial<CompanyLocation>): Promise<{ok:true;activeLocationCount:number}> {
  return parseJson(await authenticatedFetch(`/api/enterprise/locations/${encodeURIComponent(locationId)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
}

export async function getBillingState(): Promise<OrganizationBillingState> {
  return parseJson(await authenticatedFetch('/api/billing/state'));
}

export async function beginStripeCheckout(tierId: string, billingCycle: 'monthly'|'annual'): Promise<void> {
  const { url } = await parseJson<{url:string}>(await authenticatedFetch('/api/billing/checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tierId, billingCycle }),
  }));
  if (!url) throw new Error('Stripe Checkout URL was not returned.');
  window.location.assign(url);
}

export async function openStripeBillingPortal(): Promise<void> {
  const { url } = await parseJson<{url:string}>(await authenticatedFetch('/api/billing/portal', { method: 'POST' }));
  if (!url) throw new Error('Stripe Billing Portal URL was not returned.');
  window.location.assign(url);
}

export async function acceptOrganizationInvitation(token: string): Promise<{ok:true;organizationId:string;userType:string}> {
  return parseJson(await authenticatedFetch('/api/enterprise/invitations/accept', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
  }));
}

export async function createOrganizationInvitation(input: { email:string; userType:'admin'|'employee'; roleCode?:string; employeeId?:string; authorizedLocationIds?:string[] }): Promise<{invitationId:string;inviteUrl:string;expiresAt:string}> {
  return parseJson(await authenticatedFetch('/api/enterprise/invitations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
}
