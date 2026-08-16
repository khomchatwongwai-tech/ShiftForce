import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const sql = fs.readFileSync('supabase/migrations/0001_shiftforce_foundation.sql', 'utf8');

test('foundation migration has explicit authenticated grants and RLS', () => {
  assert.match(sql, /grant select, insert, update, delete on[\s\S]*to authenticated/i);
  for (const table of ['organizations','organization_members','users','regions','locations','departments','employees','shifts','punches','audit_logs','organization_subscriptions']) {
    assert.ok(sql.includes(`'${table}'`), `${table} missing from RLS table list`);
  }
  assert.match(sql, /enable row level security/i);
});

test('tenant and manager authorization derives from trusted membership rows', () => {
  assert.match(sql, /m\.organization_id = org_id/);
  assert.match(sql, /m\.firebase_uid = auth\.jwt\(\)->>'sub'/);
  assert.match(sql, /private\.can_access_location\(organization_id, id\)/);
  assert.match(sql, /private\.can_manage_location\(organization_id, location_id\)/);
  assert.doesNotMatch(sql, /user_metadata|raw_user_meta_data/i);
});

test('private storage is organization and Firebase UID scoped', () => {
  assert.match(sql, /values \('shiftforce-files','shiftforce-files',false\)/);
  assert.match(sql, /private\.has_org_access\(\(storage\.foldername\(name\)\)\[1\]\)/);
  assert.match(sql, /\(storage\.foldername\(name\)\)\[2\] = \(auth\.jwt\(\)->>'sub'\)/);
  assert.match(sql, /storage\.objects for update to authenticated/i);
  assert.match(sql, /storage\.objects for delete to authenticated/i);
});
