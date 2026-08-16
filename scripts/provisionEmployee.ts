import dotenv from 'dotenv';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const email = process.argv[2];
const organizationId = process.argv[3];
const employeeId = process.argv[4];
if (!email || !organizationId || !employeeId) {
  console.error('Usage: npm run provision:employee -- employee@example.com org-your-company emp-123');
  process.exit(1);
}

const app = initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);
const user = await auth.getUserByEmail(email);
const employeeSnap = await db.doc(`employees/${employeeId}`).get();
if (!employeeSnap.exists || employeeSnap.data()?.organizationId !== organizationId) {
  throw new Error(`Employee ${employeeId} does not exist in organization ${organizationId}.`);
}
const employee = employeeSnap.data()!;
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: 'authenticated', admin: false, organizationId, employeeId });
await db.doc(`users/${user.uid}`).set({
  userId: user.uid,
  email,
  displayName: employee.name || user.displayName || email.split('@')[0],
  role: 'role-employee',
  isHostOrAdmin: false,
  userType: 'employee',
  employeeId,
  organizationId,
  updatedAt: new Date().toISOString(),
}, { merge: true });
console.log(`Provisioned ${email} as employee ${employeeId} for ${organizationId}. Sign out/in to refresh claims.`);
