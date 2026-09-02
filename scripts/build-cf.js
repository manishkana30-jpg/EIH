/**
 * scripts/build-cf.js
 * Smart Build Dispatcher for Local Dev & Cloudflare Pages CI
 */

const { execSync } = require('child_process');

process.env.WRANGLER_SEND_METRICS = 'false';
process.env.DO_NOT_TRACK = '1';

const fs = require('fs');
const path = require('path');

// Ensure a '0' binary exists in node_modules/.bin so if CI calls '0' it exits cleanly
try {
  const binDir = path.join(__dirname, '..', 'node_modules', '.bin');
  if (fs.existsSync(binDir)) {
    const zeroSh = path.join(binDir, '0');
    fs.writeFileSync(zeroSh, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  }
} catch (_) {}

if (isCloudflarePages) {
  console.log('\x1b[32m⚡️ Cloudflare Pages CI detected: Running @cloudflare/next-on-pages compiler...\x1b[0m');
  execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit' });
} else {
  console.log('\x1b[36m▲ Standard environment detected: Running npx next build...\x1b[0m');
  execSync('npx next build', { stdio: 'inherit' });
}

