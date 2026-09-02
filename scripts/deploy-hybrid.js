/**
 * scripts/deploy-hybrid.js
 * Cross-Platform Unified Automated Tunnel & Cloudflare Pages Deployment Pipeline
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const envProdPath = path.join(rootDir, '.env.production');
const envLocalPath = path.join(rootDir, '.env.local');
const isWin = process.platform === 'win32';
const binName = isWin ? 'cloudflared.exe' : 'cloudflared';
const localBin = path.join(rootDir, 'bin', binName);

let cloudflaredCmd = 'cloudflared';
if (fs.existsSync(localBin)) {
  cloudflaredCmd = localBin;
}

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
console.log('\x1b[32m🚀 Unified Cloudflare Hybrid Deployment Pipeline\x1b[0m');
console.log('\x1b[36m================================================================\x1b[0m');

// Step 1: Health Check
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8000/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function run() {
  console.log('\x1b[33m=== 1. Checking Local Backend Health ===\x1b[0m');
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    console.error('\x1b[31m❌ Error: Local FastAPI backend is not reachable on http://127.0.0.1:8000.\x1b[0m');
    console.error('Please start your backend daemon first:');
    console.error('  call .venv\\Scripts\\activate && python -m uvicorn keyless_healer.app:app --host 127.0.0.1 --port 8000');
    process.exit(1);
  }
  console.log('\x1b[32m✅ Local FastAPI backend is healthy and responsive.\x1b[0m\n');

  console.log('\x1b[33m=== 2. Starting Cloudflare Tunnel ===\x1b[0m');
  console.log(`Using binary: \x1b[90m${cloudflaredCmd}\x1b[0m`);

  const tunnel = spawn(cloudflaredCmd, ['tunnel', '--url', 'http://127.0.0.1:8000']);
  let tunnelUrl = '';

  const urlPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for trycloudflare.com URL (30s)'));
    }, 30000);

    function onData(chunk) {
      const text = chunk.toString();
      process.stdout.write(text);
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        clearTimeout(timeout);
        resolve(tunnelUrl);
      }
    }

    tunnel.stdout.on('data', onData);
    tunnel.stderr.on('data', onData);

    tunnel.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  try {
    const url = await urlPromise;
    console.log(`\n\x1b[32m🎉 Tunnel established: \x1b[1;37m${url}\x1b[0m\n`);

    console.log('\x1b[33m=== 3. Writing Environment Configuration ===\x1b[0m');
    const envContent = `NEXT_PUBLIC_BACKEND_URL="${url}"\nBACKEND_URL="${url}"\n`;
    fs.writeFileSync(envProdPath, envContent, 'utf8');
    console.log(`\x1b[32m✅ Written to .env.production:\x1b[0m NEXT_PUBLIC_BACKEND_URL="${url}"\n`);

    console.log('\x1b[33m=== 4. Building and Deploying to Cloudflare Pages ===\x1b[0m');
    let deployDir = '.vercel/output/static';
    try {
      console.log('Compiling Next.js with @cloudflare/next-on-pages...');
      execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit', cwd: rootDir, env: process.env });
    } catch (_) {
      console.log('Building with Next.js optimized production engine...');
      execSync('npm run build', { stdio: 'inherit', cwd: rootDir, env: process.env });
      if (fs.existsSync(path.join(rootDir, 'out'))) {
        deployDir = 'out';
      } else if (fs.existsSync(path.join(rootDir, '.vercel', 'output', 'static'))) {
        deployDir = '.vercel/output/static';
      } else {
        deployDir = 'public';
      }
    }

    console.log(`Deploying to Cloudflare Pages from ${deployDir}...`);
    execSync(`npx wrangler pages deploy ${deployDir} --project-name=EIH`, { stdio: 'inherit', cwd: rootDir, env: process.env });

    console.log('\n\x1b[32m================================================================\x1b[0m');
    console.log('\x1b[1;32m🎉 Hybrid Deployment Complete! Keep this process running to maintain the backend tunnel.\x1b[0m');
    console.log(`\x1b[36mPublic Tunnel URL: \x1b[1;37m${url}\x1b[0m`);
    console.log('\x1b[32m================================================================\x1b[0m');
  } catch (err) {
    console.error(`\x1b[31m❌ Pipeline failed:\x1b[0m ${err.message}`);
    tunnel.kill('SIGINT');
    process.exit(1);
  }

  process.on('SIGINT', () => {
    tunnel.kill('SIGINT');
    process.exit(0);
  });
}

run();
