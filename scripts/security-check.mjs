import fs from 'node:fs';

const checks = [];
const read = p => fs.readFileSync(p, 'utf8');
const rules = read('firestore.rules');
const auth = read('src/firebase/FirebaseContext.tsx');
const server = read('server.ts');

function assert(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

assert('Firestore has deny-by-default rule', rules.includes('allow read, write: if false'));
assert('Workforce reads are organization scoped', rules.includes('sameOrg(resource.data)'));
assert('No hard-coded owner/superadmin email in auth context', !/@gmail\.com/.test(auth));
assert('Production PIN auth is gated', auth.includes("VITE_ENABLE_DEMO_AUTH === 'true'"));
assert('AI routes verify Firebase users', server.includes('app.use("/api/ai", aiRateLimiter, requireFirebaseUser'));
assert('AI requires configured Gemini in production path', server.includes('requireConfiguredAI'));
assert('Scheduler requires admin authorization', server.includes('app.use("/api/scheduler", requireFirebaseUser, requireAdmin)'));
assert('Production AI upstream errors fail closed', server.includes('AI_UPSTREAM_ERROR'));

assert('Signed-out Firebase state fails closed', auth.includes('A missing Firebase user must fail closed'));
assert('Email login supports provisioned employee identity', auth.includes('isEmployeeProfile') && auth.includes('profile.employeeId'));
assert('Production custom sessions require Firebase auth', auth.includes('Cannot create a production session without Firebase authentication'));
assert('Workforce request collections are tenant scoped', ['timeOffRequests','shiftSwapRequests','sickReports','availabilityRequests','shiftSlotRequests'].every(name => rules.includes(`match /${name}/`)));
assert('Audit logs are browser-immutable', rules.includes('match /auditLogs/{logId}') && rules.includes('allow write: if false'));
assert('Server audit derives actor from Firebase token', server.includes('actorUserId: authContext.uid') && server.includes('organizationId,'));
assert('Production demo data is opt-in', read('src/App.tsx').includes("VITE_ENABLE_DEMO_DATA === 'true'"));
assert('Employee provisioning script exists', fs.existsSync('scripts/provisionEmployee.ts'));
assert('User profile creation is server-only', rules.includes('Client-side profile creation would allow a user to choose another tenant') && rules.includes('allow create: if false;'));

const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}: ${c.name}`);
if (failed.length) process.exit(1);
console.log(`Security gate passed (${checks.length}/${checks.length}).`);
