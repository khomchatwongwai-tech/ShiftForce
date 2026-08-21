import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const scanner = fs.readFileSync('src/components/AIPaperScheduleScannerModal.tsx', 'utf8');

test('camera capture requires a decoded frame with native dimensions', () => {
  assert.match(scanner, /const \[cameraReady, setCameraReady\] = useState\(false\)/);
  assert.match(scanner, /video\.readyState >= HTMLMediaElement\.HAVE_CURRENT_DATA/);
  assert.match(scanner, /disabled=\{!cameraReady\}/);
  assert.match(scanner, /canvas\.width = video\.videoWidth/);
  assert.match(scanner, /canvas\.height = video\.videoHeight/);
  assert.doesNotMatch(scanner, /video\.videoWidth \|\| 1280/);
  assert.doesNotMatch(scanner, /video\.videoHeight \|\| 720/);
});

test('camera capture rejects empty frames and safely owns stream lifecycle', () => {
  assert.match(scanner, /canvasHasVisibleContent\(ctx, canvas\.width, canvas\.height\)/);
  assert.match(scanner, /Camera frame is not ready yet\. Please wait a moment and try again\./);
  assert.match(scanner, /video\.muted = true/);
  assert.match(scanner, /video\.playsInline = true/);
  assert.match(scanner, /cameraRequestRef/);
  assert.match(scanner, /stream\?\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
});
