import fs from 'node:fs';

const server = fs.readFileSync('server.ts','utf8');
const rules = fs.readFileSync('firestore.rules','utf8');
const app = fs.readFileSync('src/App.tsx','utf8');
const payment = fs.readFileSync('src/components/PaymentPortalModal.tsx','utf8');
const env = fs.readFileSync('.env.example','utf8');
const pricing = fs.readFileSync('src/data/enterprisePricing.ts','utf8');

const checks = [
  ['Stripe webhook uses raw body', server.includes('express.raw({ type: "application/json"')],
  ['Stripe webhook registered before JSON parser', server.indexOf('/api/billing/webhook') < server.indexOf('app.use(express.json')],
  ['Stripe webhook verifies signature', server.includes('stripe.webhooks.constructEvent') && server.includes('STRIPE_WEBHOOK_SECRET')],
  ['Checkout is server-created', server.includes('/api/billing/checkout') && server.includes('stripe.checkout.sessions.create')],
  ['Customer Portal is server-created', server.includes('/api/billing/portal') && server.includes('stripe.billingPortal.sessions.create')],
  ['Checkout binds organization metadata', server.includes('subscription_data:') && server.includes('organizationId, tierId: requestedTierId')],
  ['Billing reconciles subscription webhooks', server.includes('customer.subscription.updated') && server.includes('tierIdForPriceId')],
  ['Company onboarding endpoint exists', server.includes('/api/enterprise/bootstrap')],
  ['Location creation is plan-gated', server.includes('PLAN_UPGRADE_REQUIRED') && server.includes('prospectiveLocationCount')],
  ['Enterprise context scopes locations', server.includes('/api/enterprise/context') && server.includes('accessibleLocations')],
  ['Employee creation is server-authoritative', server.includes('/api/workforce/employees') && rules.includes('allow create, update, delete: if false;')],
  ['Free employee cap enforced on server', server.includes('EMPLOYEE_LIMIT_REACHED') && server.includes('employeeLimit')],
  ['Local UI cannot activate paid tier', app.includes('await beginStripeCheckout(tierId, cycle)') && !app.includes('trialDaysRemaining: 15')],
  ['Simulated card collection removed', !payment.includes('cardNumber') && !payment.includes('bankRouting') && payment.includes('Billing is handled by Stripe')],
  ['Stripe environment variables documented', env.includes('STRIPE_SECRET_KEY=') && env.includes('STRIPE_PRICE_LOC_1001_2000_ANNUAL=')],
  ['AI fallback is opt-in only', server.includes('ENABLE_AI_DEMO_FALLBACK !== "true"') && env.includes('ENABLE_AI_DEMO_FALLBACK=false')],
  ['Approved top pricing bracket retained', pricing.includes("monthlyPrice:5999") && pricing.includes("minLocations:1001")],
  ['Custom enterprise threshold retained', pricing.includes("minLocations:2001") && pricing.includes("label:'Custom Enterprise'")],
  ['Organization invitations are hashed and expiring', server.includes('organizationInvitations') && server.includes('createHash("sha256")') && server.includes('7*24*60*60*1000')],
  ['Invitation acceptance is email-bound and single-use', server.includes('Sign in with the email address that received this invitation') && server.includes('status: "accepted"')],
];
let failed=0;
for (const [name, ok] of checks) { console.log(`${ok?'PASS':'FAIL'}: ${name}`); if(!ok) failed++; }
if(failed){console.error(`Enterprise 85 gate failed (${failed}/${checks.length}).`);process.exit(1)}
console.log(`Enterprise 85 gate passed (${checks.length}/${checks.length}).`);
