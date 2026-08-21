import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const MASTER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="workqora-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="60%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <!-- Blue Rounded Square Background -->
  <rect width="1024" height="1024" rx="224" ry="224" fill="url(#workqora-blue-grad)" />
  
  <!-- Subtle Inner Specular Highlight -->
  <rect x="8" y="8" width="1008" height="1008" rx="216" ry="216" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="6" />

  <!-- White Chef Hat Symbol (Lucide precision geometry scaled 28x, centered at 176,176) -->
  <g transform="translate(176, 176) scale(28)" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 10.58 0A4 4 0 0 1 18 13.87" />
    <path d="M6 17h12" />
    <path d="M6 21h12" />
    <path d="M6 14v7" />
    <path d="M18 14v7" />
  </g>
</svg>`;

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="#0f172a" />
  <!-- Background subtle gradient glow -->
  <circle cx="600" cy="315" r="400" fill="#0284c7" fill-opacity="0.15" />
  
  <!-- Centered Logo Card -->
  <g transform="translate(460, 115) scale(0.2734)">
    <rect width="1024" height="1024" rx="224" ry="224" fill="url(#workqora-blue-grad-og)" />
    <g transform="translate(176, 176) scale(28)" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 10.58 0A4 4 0 0 1 18 13.87" />
      <path d="M6 17h12" />
      <path d="M6 21h12" />
      <path d="M6 14v7" />
      <path d="M18 14v7" />
    </g>
  </g>

  <defs>
    <linearGradient id="workqora-blue-grad-og" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="60%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Typography -->
  <text x="600" y="440" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" letter-spacing="-1">
    Work<tspan fill="#38bdf8">qora</tspan>
  </text>

  <text x="600" y="490" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="22">
    Smarter Work. Better Operations.
  </text>
  
  <text x="600" y="535" text-anchor="middle" fill="#0284c7" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" letter-spacing="1">
    WORKQORA.COM
  </text>
</svg>`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function renderPng(svgContent, targetWidth) {
  const resvg = new Resvg(svgContent, { fitTo: { mode: 'width', value: targetWidth } });
  return resvg.render().asPng();
}

async function run() {
  console.log('Generating canonical Workqora brand assets...');

  ensureDir('public');
  ensureDir('public/android/mipmap-mdpi');
  ensureDir('public/android/mipmap-hdpi');
  ensureDir('public/android/mipmap-xhdpi');
  ensureDir('public/android/mipmap-xxhdpi');
  ensureDir('public/android/mipmap-xxxhdpi');
  ensureDir('public/ios/AppIcon.appiconset');

  // Write Master SVG
  fs.writeFileSync('public/logo.svg', MASTER_SVG);
  console.log('✔ public/logo.svg');

  // Render sizes
  const sizes = [
    { name: 'public/master-logo.png', size: 1024 },
    { name: 'public/icon-512.png', size: 512 },
    { name: 'public/icon-192.png', size: 192 },
    { name: 'public/apple-touch-icon.png', size: 180 },
    { name: 'public/favicon-64.png', size: 64 },
    { name: 'public/favicon-32x32.png', size: 32 },
    { name: 'public/favicon-16x16.png', size: 16 },
    { name: 'public/favicon.ico', size: 64 }, // ICO fallback
    { name: 'public/android/playstore-icon-512.png', size: 512 },
    { name: 'public/android/mipmap-mdpi/ic_launcher.png', size: 48 },
    { name: 'public/android/mipmap-hdpi/ic_launcher.png', size: 72 },
    { name: 'public/android/mipmap-xhdpi/ic_launcher.png', size: 96 },
    { name: 'public/android/mipmap-xxhdpi/ic_launcher.png', size: 144 },
    { name: 'public/android/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
    { name: 'public/ios/AppIcon.appiconset/Icon-1024.png', size: 1024 },
    { name: 'public/ios/AppIcon.appiconset/Icon-180.png', size: 180 },
    { name: 'public/ios/AppIcon.appiconset/Icon-167.png', size: 167 },
    { name: 'public/ios/AppIcon.appiconset/Icon-152.png', size: 152 },
    { name: 'public/ios/AppIcon.appiconset/Icon-120.png', size: 120 },
  ];

  for (const { name, size } of sizes) {
    const png = renderPng(MASTER_SVG, size);
    fs.writeFileSync(name, png);
    console.log(`✔ ${name} (${size}x${size})`);
  }

  // Write OG Image
  const ogPng = renderPng(OG_SVG, 1200);
  fs.writeFileSync('public/og-image.png', ogPng);
  console.log('✔ public/og-image.png (1200x630)');

  // Write iOS AppIcon Contents.json
  const iosContents = {
    images: [
      { size: '20x20', idiom: 'iphone', scale: '2x', filename: 'Icon-120.png' },
      { size: '20x20', idiom: 'iphone', scale: '3x', filename: 'Icon-120.png' },
      { size: '29x29', idiom: 'iphone', scale: '2x', filename: 'Icon-120.png' },
      { size: '29x29', idiom: 'iphone', scale: '3x', filename: 'Icon-180.png' },
      { size: '40x40', idiom: 'iphone', scale: '2x', filename: 'Icon-120.png' },
      { size: '40x40', idiom: 'iphone', scale: '3x', filename: 'Icon-180.png' },
      { size: '60x60', idiom: 'iphone', scale: '2x', filename: 'Icon-120.png' },
      { size: '60x60', idiom: 'iphone', scale: '3x', filename: 'Icon-180.png' },
      { size: '76x76', idiom: 'ipad', scale: '2x', filename: 'Icon-152.png' },
      { size: '83.5x83.5', idiom: 'ipad', scale: '2x', filename: 'Icon-167.png' },
      { size: '1024x1024', idiom: 'ios-marketing', scale: '1x', filename: 'Icon-1024.png' }
    ],
    info: { version: 1, author: 'xcode' }
  };
  fs.writeFileSync('public/ios/AppIcon.appiconset/Contents.json', JSON.stringify(iosContents, null, 2));
  console.log('✔ public/ios/AppIcon.appiconset/Contents.json');

  console.log('\nAll Workqora brand assets successfully generated!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
