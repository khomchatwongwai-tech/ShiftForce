import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const server = fs.readFileSync('server.ts', 'utf8');
const workforce = server.slice(server.indexOf('// Server-authoritative labor mutations.'), server.indexOf('app.post("/api/workforce/announcements"'));

test('server authorization derives tenant context from Supabase profile and active membership', () => {
  assert.match(server, /from\('users'\)\.select\('\*'\)\.eq\('firebase_uid', uid\)/);
  assert.match(server, /from\('organization_members'\)[\s\S]*eq\('active', true\)/);
  assert.match(server, /Active organization membership required/);
  assert.match(server, /verifyIdToken\(match\[1\], true\)/);
  assert.doesNotMatch(server.slice(server.indexOf('async function getServerUserProfile'), server.indexOf('async function serverAudit')), /getAdminFirestore\(\)/);
});

test('core workforce routes write Supabase rows with server-derived organization IDs', () => {
  for (const table of ['shifts', 'punches', 'shift_trades']) {
    assert.ok(workforce.includes(`from('${table}')`));
  }
  assert.doesNotMatch(workforce, /getAdminFirestore\(\)/);
  assert.match(workforce, /organization_id', organizationId/);
  assert.match(server, /payload = \{ \.\.\.existingPayload, \.\.\.input, id, organizationId \}/);
  assert.match(server, /from\('audit_logs'\)\.insert/);
});

test('cross-tenant references and client tenant overrides are rejected or replaced', () => {
  assert.match(server, /employeeInOrganization\(organizationId, input\.employeeId, true\)/);
  assert.match(server, /eq\('organization_id', context\.organizationId\)/);
  assert.match(server, /Manager is not authorized for this location/);
  assert.match(server, /organizationId \}/);
});
