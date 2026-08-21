import dotenv from 'dotenv';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const email = process.argv[2];
const organizationId = process.argv[3];
if (!email || !organizationId) {
  console.error('Usage: npm run provision:admin -- admin@example.com org-your-company');
  process.exit(1);
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);
const db = getFirestore(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: 'authenticated', admin: true, organizationId });
await db.doc(`admins/${user.uid}`).set({ userId: user.uid, email, organizationId, updatedAt: new Date().toISOString() }, { merge: true });
await db.doc(`users/${user.uid}`).set({
  userId: user.uid,
  email,
  displayName: user.displayName || email.split('@')[0],
  role: 'role-super-admin',
  isHostOrAdmin: true,
  userType: 'admin',
  organizationId,
  updatedAt: new Date().toISOString(),
}, { merge: true });
console.log(`Provisioned ${email} as admin for ${organizationId}. Sign out/in to refresh claims.`);
