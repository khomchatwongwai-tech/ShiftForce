import fs from 'node:fs';
const required = [
  'src/supabase/client.ts',
  'src/supabase/workforceService.ts',
  'supabase/migrations/0001_shiftforce_foundation.sql',
];
let failures = 0;
for (const file of required) {
  const ok = fs.existsSync(file);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${file}`);
  if (!ok) failures++;
}
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
const pinned = pkg.dependencies?.['@supabase/supabase-js'] === '2.111.0';
console.log(`${pinned ? 'PASS' : 'FAIL'} @supabase/supabase-js pinned`);
if (!pinned) failures++;
const env = fs.readFileSync('.env.example','utf8');
for (const key of ['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) {
  const ok = env.includes(key);
  console.log(`${ok ? 'PASS' : 'FAIL'} env ${key}`);
  if (!ok) failures++;
}
const migration = fs.readFileSync('supabase/migrations/0001_shiftforce_foundation.sql','utf8');
const tenantTables = ['organizations','organization_members','users','regions','locations','departments','employees','shifts','punches','shift_trades','time_off_requests','shift_swap_requests','sick_reports','availability_requests','shift_slot_requests','announcements','audit_logs','organization_subscriptions'];
for (const table of tenantTables) {
  const ok = migration.includes(`'${table}'`) && /enable row level security/i.test(migration);
  console.log(`${ok ? 'PASS' : 'FAIL'} RLS ${table}`);
  if (!ok) failures++;
}
const hardening = [
  ['explicit authenticated Data API grants', /grant select, insert, update, delete on[\s\S]*to authenticated/i.test(migration)],
  ['regional and store access is assignment scoped', migration.includes('private.can_access_location(organization_id, id)') && migration.includes('private.can_manage_location(organization_id, location_id)')],
  ['cross-company access requires membership', migration.includes('m.organization_id = org_id') && migration.includes("m.firebase_uid = auth.jwt()->>'sub'")],
  ['storage paths are organization scoped', migration.includes("private.has_org_access((storage.foldername(name))[1])")],
  ['storage uploads are Firebase UID scoped', migration.includes("(storage.foldername(name))[2] = (auth.jwt()->>'sub')")],
  ['storage upsert has select and update policies', /storage\.objects for select/i.test(migration) && /storage\.objects for update/i.test(migration)],
  ['authorization ignores user-editable JWT metadata', !/user_metadata|raw_user_meta_data/i.test(migration)],
];
for (const [name, ok] of hardening) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failures++;
}
process.exit(failures ? 1 : 0);
