import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const modal = fs.readFileSync('src/components/AIPaperScheduleScannerModal.tsx', 'utf8');
const server = fs.readFileSync('server.ts', 'utf8');

test('schedule camera uses a user-initiated, mobile-compatible camera flow', () => {
  assert.match(modal, /navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(modal, /playsInline/);
  assert.match(modal, /cameraStreamRef\.current = stream/);
  assert.match(modal, /videoRef\.current\.srcObject = cameraStream/);
  assert.match(modal, /Open Camera/);
  assert.match(modal, /Camera permission was denied/);
});

test('schedule image input is validated, compressed, and has a confirm upload step', () => {
  assert.match(modal, /image\/jpeg', 'image\/png', 'image\/webp/);
  assert.match(modal, /MAX_SOURCE_BYTES/);
  assert.match(modal, /compressDataUrl/);
  assert.match(modal, /Confirm & Upload/);
  assert.match(modal, /Retake/);
  assert.match(modal, /Remove/);
});

test('confirmed scans are stored server-side with organization, user, and schedule-week ownership', () => {
  assert.match(server, /app\.post\("\/api\/schedule-scans", requireFirebaseUser, requireAdmin/);
  assert.match(server, /organizationId\}\/\$\{authContext\.uid\}\/\$\{scanRef\.id\}/);
  assert.match(server, /uploadedByUserId: authContext\.uid/);
  assert.match(server, /scheduleWeekStart: weekStart/);
  assert.match(server, /storageProvider: "supabase"/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
});
