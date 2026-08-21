import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const server = fs.readFileSync('server.ts', 'utf8');
const context = fs.readFileSync('src/firebase/FirebaseContext.tsx', 'utf8');
const login = fs.readFileSync('src/components/DualLoginModal.tsx', 'utf8');

test('employee PIN authentication is server-side bcrypt with lockout and HttpOnly session', () => {
  assert.match(server, /bcrypt\.compare/);
  assert.match(server, /employeeCredentials/);
  assert.match(server, /employeeSessions/);
  assert.match(server, /failedAttempts/);
  assert.match(server, /lockedUntil/);
  assert.match(server, /httpOnly: true/);
  assert.match(server, /sameSite: "lax"/);
});
test('production employee login bypasses Firebase email/password and restores through the server', () => {
  assert.match(login, /signInEmployee\(employeeIdOrPhone\.trim\(\), employeePin\)/);
  assert.doesNotMatch(login, /signInWithEmail\(employeeIdOrPhone\.trim\(\), employeePin\)/);
  assert.match(context, /\/api\/auth\/employee\/session/);
  assert.match(context, /\/api\/auth\/employee\/login/);
});
test('employee APIs derive identity from verified cookie session', () => {
  assert.match(server, /requireEmployee/);
  assert.match(server, /\/api\/employee\/profile/);
  assert.match(server, /\/api\/employee\/shifts/);
  assert.match(server, /employeeOwnedResource\("timeOffRequests", "employeeId"\)/);
  assert.match(server, /organizationId: s\.organizationId/);
});
