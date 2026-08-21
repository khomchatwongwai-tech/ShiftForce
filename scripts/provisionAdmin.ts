import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

dotenv.config();

const email = process.argv[2];
const organizationId = process.argv[3];
if (!email || !organizationId) {
  console.error('Usage: pnpm run provision:admin -- admin@example.com org-your-company');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecret = process.env.SUPABASE_SECRET_KEY?.trim();
if (!supabaseUrl || !supabaseSecret) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are required for server-side admin provisioning.');
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const canonicalEmail = user.email?.trim().toLowerCase() || email.trim().toLowerCase();
const displayName = user.displayName || canonicalEmail.split('@')[0];
const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: organization, error: organizationError } = await supabase
  .from('organizations')
  .select('id')
  .eq('id', organizationId)
  .maybeSingle();
if (organizationError) throw organizationError;
if (!organization) throw new Error(`Organization ${organizationId} does not exist in Supabase.`);

const { data: existingUser, error: existingUserError } = await supabase
  .from('users')
  .select('organization_id')
  .eq('firebase_uid', user.uid)
  .maybeSingle();
if (existingUserError) throw existingUserError;
if (existingUser && existingUser.organization_id !== organizationId) {
  throw new Error(`Firebase user ${user.uid} is already provisioned for another organization.`);
}

const now = new Date().toISOString();
const { error: membershipError } = await supabase.from('organization_members').upsert({
  organization_id: organizationId,
  firebase_uid: user.uid,
  role: 'owner',
  active: true,
}, { onConflict: 'organization_id,firebase_uid' });
if (membershipError) throw membershipError;

const profile = {
  userId: user.uid,
  email: canonicalEmail,
  displayName,
  role: 'role-super-admin',
  isHostOrAdmin: true,
  userType: 'admin',
  organizationId,
  updatedAt: now,
};
const { error: profileError } = await supabase.from('users').upsert({
  firebase_uid: user.uid,
  organization_id: organizationId,
  email: canonicalEmail,
  display_name: displayName,
  role: 'role-super-admin',
  payload: profile,
  updated_at: now,
}, { onConflict: 'firebase_uid' });
if (profileError) throw profileError;

await auth.setCustomUserClaims(user.uid, {
  ...(user.customClaims || {}),
  role: 'authenticated',
  admin: true,
  organizationId,
});
console.log(`Provisioned ${canonicalEmail} as owner/admin for ${organizationId}. Sign out/in to refresh claims.`);
