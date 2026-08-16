import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const server = read('server.ts');
const rules = read('firestore.rules');
const service = read('src/firebase/firestoreService.ts');
const app = read('src/App.tsx');
const env = read('.env.example');
const ci = read('.github/workflows/ci.yml');
const checks = [
  ['deny-by-default Firestore', rules.includes('match /{document=**} { allow read, write: if false; }')],
  ['client shift writes denied', /match \/shifts\/\{shiftId\}[\s\S]*allow create, update, delete: if false/.test(rules)],
  ['client punch writes denied', /match \/punches\/\{punchId\}[\s\S]*allow create, update, delete: if false/.test(rules)],
  ['client trade writes denied', /match \/shiftTrades\/\{tradeId\}[\s\S]*allow create, update, delete: if false/.test(rules)],
  ['client announcement writes denied', /match \/announcements\/\{announcementId\}[\s\S]*allow create, update, delete: if false/.test(rules)],
  ['server shift create', server.includes('app.post("/api/workforce/shifts"')],
  ['server shift update', server.includes('app.patch("/api/workforce/shifts/:shiftId"')],
  ['server shift delete', server.includes('app.delete("/api/workforce/shifts/:shiftId"')],
  ['server own punch', server.includes('app.post("/api/workforce/punches"') && server.includes('Employees may only record their own punch')],
  ['server admin offline punch sync', server.includes('app.post("/api/workforce/punches/bulk"')],
  ['punch corrections require reason', server.includes('correctionReason is required')],
  ['server shift trade request', server.includes('app.post("/api/workforce/trades"')],
  ['server shift trade approval', server.includes('app.patch("/api/workforce/trades/:tradeId"')],
  ['server announcements', server.includes('app.post("/api/workforce/announcements"')],
  ['labor mutations audit', server.includes('serverAudit(res, "create_shift"') && server.includes('serverAudit(res, "correct_punch"')],
  ['client shift API routing', service.includes("'/api/workforce/shifts'")],
  ['client punch API routing', service.includes("'/api/workforce/punches'")],
  ['client trade API routing', service.includes("'/api/workforce/trades'")],
  ['offline queue server confirmed', app.includes("'/api/workforce/punches/bulk'") && app.includes('Offline punches remain queued')],
  ['Stripe raw webhook verification', server.indexOf('/api/billing/webhook') < server.indexOf('app.use(express.json') && server.includes('stripe.webhooks.constructEvent')],
  ['Stripe webhook idempotency', server.includes('stripeWebhookEvents/${event.id}') && server.includes('duplicate: true')],
  ['readiness endpoint', server.includes('/api/health/ready') && server.includes('stripePricesConfigured')],
  ['readiness checks Firebase Admin credentials', server.includes('firebaseAdminCredential: firebaseAdminCredentialConfigured')],
  ['readiness checks Supabase configuration', server.includes('supabaseUrl:') && server.includes('supabasePublishableKey:')],
  ['readiness skips Firestore without credentials', server.includes('if (!firebaseAdminCredentialConfigured') && server.includes('isFirestoreReady()')],
  ['security response headers', server.includes('x-content-type-options') && server.includes('strict-transport-security')],
  ['no fake reminder delivery on server', !server.includes("status: 'delivered',")],
  ['no fake reminder delivery in App', !app.includes("status: 'delivered',")],
  ['Gemini server-only key documented', env.includes('GEMINI_API_KEY=') && !env.includes('VITE_GEMINI_API_KEY')],
  ['Firebase service account JSON documented', env.includes('FIREBASE_SERVICE_ACCOUNT_KEY=')],
  ['Stripe production configuration documented', env.includes('STRIPE_WEBHOOK_SECRET=') && env.includes('STRIPE_PRICE_LOC_1001_2000_ANNUAL=')],
  ['production demo auth disabled by default', env.includes('VITE_ENABLE_DEMO_AUTH=false') && env.includes('VITE_ENABLE_DEMO_DATA=false')],
  ['CI runs security gate', ci.includes('npm run security:check')],
  ['CI runs release gate', ci.includes('npm run release:check')],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`); if (!ok) failed++; }
if (failed) { console.error(`Release gate failed (${failed}/${checks.length}).`); process.exit(1); }
console.log(`Release gate passed (${checks.length}/${checks.length}).`);
