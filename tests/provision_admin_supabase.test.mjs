import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const script = fs.readFileSync('scripts/provisionAdmin.ts', 'utf8');

test('admin provisioning keeps Firebase Admin identity operations and uses Supabase for workforce profiles', () => {
  assert.match(script, /getUserByEmail/);
  assert.match(script, /setCustomUserClaims/);
  assert.match(script, /createClient\(supabaseUrl, supabaseSecret/);
  assert.match(script, /from\('organization_members'\)\.upsert/);
  assert.match(script, /from\('users'\)\.upsert/);
  assert.doesNotMatch(script, /firebase-admin\/firestore|getFirestore\(/);
});

test('admin provisioning preserves organization isolation and stores no password material', () => {
  assert.match(script, /already provisioned for another organization/);
  assert.match(script, /role: 'owner'/);
  assert.match(script, /role: 'role-super-admin'/);
  assert.match(script, /userType: 'admin'/);
  assert.match(script, /isHostOrAdmin: true/);
  assert.doesNotMatch(script, /password|pinHash|secret.*password/i);
});
