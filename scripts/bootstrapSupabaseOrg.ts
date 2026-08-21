import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const [organizationId, name, firebaseUid, email, role='owner'] = process.argv.slice(2);
if (!organizationId || !name || !firebaseUid || !email) {
  console.error('Usage: tsx scripts/bootstrapSupabaseOrg.ts <org-id> <name> <firebase-uid> <email> [role]');
  process.exit(1);
}
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required.');
const sb = createClient(url, secret, { auth: { persistSession: false } });

let r = await sb.from('organizations').upsert({
  id: organizationId, name, owner_firebase_uid: firebaseUid, updated_at: new Date().toISOString()
}, { onConflict: 'id' });
if (r.error) throw r.error;

r = await sb.from('organization_members').upsert({
  organization_id: organizationId, firebase_uid: firebaseUid, role, active: true
}, { onConflict: 'organization_id,firebase_uid' });
if (r.error) throw r.error;

r = await sb.from('users').upsert({
  firebase_uid: firebaseUid, organization_id: organizationId, email, display_name: name, role,
  payload: { userId: firebaseUid, email, displayName: name, role, organizationId }
}, { onConflict: 'firebase_uid' });
if (r.error) throw r.error;

console.log(`Bootstrapped ${organizationId} for Firebase UID ${firebaseUid}.`);
