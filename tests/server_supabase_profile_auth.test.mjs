import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const server = fs.readFileSync('server.ts', 'utf8');
const profileSection = server.slice(
  server.indexOf('async function getServerUserProfile'),
  server.indexOf('async function serverAudit'),
);

test('server profile authorization uses Supabase users and active organization membership', () => {
  assert.match(server, /SUPABASE_URL/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
  assert.match(profileSection, /from\(['"]users['"]\)/);
  assert.match(profileSection, /from\(['"]organization_members['"]\)/);
  assert.match(profileSection, /\.eq\(['"]active['"],\s*true\)/);
  assert.doesNotMatch(profileSection, /getAdminFirestore/);
});

test('server admin authorization requires both Firebase admin claims and an active tenant membership', () => {
  const adminSection = server.slice(server.indexOf('async function requireAdmin'), server.indexOf('async function serverAudit'));
  assert.match(adminSection, /ADMIN_MEMBERSHIP_ROLES/);
  assert.match(server, /role-super-admin/);
  assert.match(server, /membership\.role === "owner"/);
  assert.match(server, /Active organization membership required/);
});
