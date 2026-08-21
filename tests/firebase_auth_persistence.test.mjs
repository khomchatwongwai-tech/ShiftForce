import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const firebaseConfig = fs.readFileSync('src/firebase/config.ts', 'utf8');
const firebaseContext = fs.readFileSync('src/firebase/FirebaseContext.tsx', 'utf8');
const legacyWorkforceAdapter = fs.readFileSync('src/firebase/firestoreService.ts', 'utf8');

test('Firebase Auth is pinned to the released popup-persistence fix', () => {
  assert.equal(packageJson.dependencies.firebase, '12.18.0');
});

test('browser Firebase configuration initializes Auth without a Firestore client', () => {
  assert.match(firebaseConfig, /getAuth\(app\)/);
  assert.doesNotMatch(firebaseConfig, /firebase\/firestore|getFirestore\(/);
  assert.doesNotMatch(firebaseContext, /testFirestoreConnection/);
});

test('legacy workforce adapter delegates to the Supabase-backed service', () => {
  assert.match(legacyWorkforceAdapter, /\.\.\/supabase\/workforceService/);
  assert.doesNotMatch(legacyWorkforceAdapter, /firebase\/firestore/);
});
