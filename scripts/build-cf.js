/**
 * scripts/build-cf.js
 * Smart Build Dispatcher for Local Dev & Cloudflare Pages CI
 */

const { execSync } = require('child_process');

process.env.WRANGLER_SEND_METRICS = 'false';
process.env.DO_NOT_TRACK = '1';

const isCloudflarePages = process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH;

if (isCloudflarePages) {
  console.log('\x1b[32m⚡️ Cloudflare Pages CI detected: Running @cloudflare/next-on-pages compiler...\x1b[0m');
  execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit' });
} else {
  console.log('\x1b[36m▲ Standard environment detected: Running npx next build...\x1b[0m');
  execSync('npx next build', { stdio: 'inherit' });
}
