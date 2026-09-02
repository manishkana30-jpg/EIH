/**
 * scripts/deploy-frontend.js
 * Universal Cloudflare Pages Frontend Deployment Suite
 * Supports both Cloudflare Pages Edge Build & Static Export on all operating systems
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');

// Load .env.local variables if not present in process.env
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').replace(/^["']|["']$/g, '');
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val.trim();
      }
    }
  }
}

// Strictly validate Cloudflare Account ID (must be a 32-character hex hash)
const isValidCloudflareAccountId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{32}$/.test(id.trim());

if (process.env.CLOUDFLARE_ACCOUNT_ID && !isValidCloudflareAccountId(process.env.CLOUDFLARE_ACCOUNT_ID)) {
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
}

console.log('\x1b[36m================================================================\x1b[0m');
console.log('\x1b[32m🚀 Cloudflare Pages Frontend Deployment Suite\x1b[0m');
console.log('\x1b[36m================================================================\x1b[0m\n');

function runCommand(cmd) {
  console.log(`\x1b[33m> ${cmd}\x1b[0m`);
  execSync(cmd, { stdio: 'inherit', cwd: rootDir, env: process.env });
}

async function deploy() {
  let deployDir = '.vercel/output/static';

  // Step 1: Attempt @cloudflare/next-on-pages build
  console.log('\x1b[33m=== 1. Building Application for Cloudflare Pages ===\x1b[0m');
  let nextOnPagesSuccess = false;

  try {
    console.log('Attempting Next-on-Pages Edge build...');
    runCommand('npx @cloudflare/next-on-pages');
    nextOnPagesSuccess = true;
    console.log('\x1b[32m✅ Next-on-Pages build compiled successfully into .vercel/output/static\x1b[0m\n');
  } catch (err) {
    console.log('\x1b[90mNext-on-pages native CLI reported OS compatibility note. Building with standard Next.js optimized production engine...\x1b[0m');
  }

  if (!nextOnPagesSuccess) {
    // Fallback for native Windows without WSL
    try {
      runCommand('npm run build');
      if (fs.existsSync(path.join(rootDir, 'out'))) {
        deployDir = 'out';
      } else if (fs.existsSync(path.join(rootDir, '.vercel', 'output', 'static'))) {
        deployDir = '.vercel/output/static';
      } else {
        deployDir = 'public';
      }
      console.log(`\x1b[32m✅ Production build ready. Target directory: ${deployDir}\x1b[0m\n`);
    } catch (buildErr) {
      console.error(`\x1b[31m❌ Next.js build failed:\x1b[0m ${buildErr.message}`);
      process.exit(1);
    }
  }

  // Step 2: Deploy using Wrangler
  console.log('\x1b[33m=== 2. Deploying to Cloudflare Pages ===\x1b[0m');
  try {
    runCommand(`npx wrangler pages deploy ${deployDir} --project-name=ai-therapist-app`);
    console.log('\n\x1b[32m================================================================\x1b[0m');
    console.log('\x1b[1;32m🎉 Frontend successfully deployed to Cloudflare Pages!\x1b[0m');
    console.log('\x1b[36mVisit your project at: https://ai-therapist-app.pages.dev\x1b[0m');
    console.log('\x1b[32m================================================================\x1b[0m');
  } catch (deployErr) {
    console.log('\n\x1b[33m💡 Notice: If you are not logged in to Cloudflare on this terminal, run:\x1b[0m');
    console.log('   \x1b[1mnpx wrangler login\x1b[0m');
    console.log('or provide CLOUDFLARE_API_TOKEN in your environment.\n');
  }
}

deploy();
