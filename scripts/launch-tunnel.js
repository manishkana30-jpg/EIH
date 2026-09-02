/**
 * scripts/launch-tunnel.js
 * Cross-Platform Cloudflare Tunnel Orchestrator with Real-Time URL Extraction & .env.production Updater
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWin = process.platform === 'win32';
const binName = isWin ? 'cloudflared.exe' : 'cloudflared';
const localBin = path.join(__dirname, '..', 'bin', binName);
const envProdPath = path.join(__dirname, '..', '.env.production');

let cmd = 'cloudflared';
if (fs.existsSync(localBin)) {
  cmd = localBin;
}

console.log('\x1b[36m================================================================\x1b[0m');
console.log('\x1b[32m🌐 Cloudflare Tunnel Orchestration: Local FastAPI Exposer\x1b[0m');
console.log('\x1b[36m================================================================\x1b[0m');
console.log('Target Endpoint: \x1b[33mhttp://127.0.0.1:8000\x1b[0m');
console.log(`Using binary: \x1b[90m${cmd}\x1b[0m\n`);

let urlExtracted = false;

function updateEnvProduction(tunnelUrl) {
  try {
    let content = '';
    if (fs.existsSync(envProdPath)) {
      content = fs.readFileSync(envProdPath, 'utf8');
      if (content.includes('NEXT_PUBLIC_BACKEND_URL=')) {
        content = content.replace(/NEXT_PUBLIC_BACKEND_URL=".*?"/g, `NEXT_PUBLIC_BACKEND_URL="${tunnelUrl}"`);
        content = content.replace(/BACKEND_URL=".*?"/g, `BACKEND_URL="${tunnelUrl}"`);
      } else {
        content += `\nNEXT_PUBLIC_BACKEND_URL="${tunnelUrl}"\nBACKEND_URL="${tunnelUrl}"\n`;
      }
    } else {
      content = `NEXT_PUBLIC_BACKEND_URL="${tunnelUrl}"\nBACKEND_URL="${tunnelUrl}"\n`;
    }

    fs.writeFileSync(envProdPath, content, 'utf8');
    console.log(`\x1b[32m✅ Successfully updated .env.production with:\x1b[0m \x1b[1m${tunnelUrl}\x1b[0m\n`);
  } catch (err) {
    console.error(`\x1b[31mFailed to update .env.production:\x1b[0m ${err.message}`);
  }
}

// Check for test mode
if (process.argv.includes('--test-dry-run')) {
  console.log('Running regex parser test with mock tunnel output...');
  const sampleLog = '2026-09-02T07:15:00Z INF +--------------------------------------------------------------------------------------------+\n2026-09-02T07:15:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |\n2026-09-02T07:15:00Z INF |  https://brave-companion-sample-1234.trycloudflare.com                                    |\n2026-09-02T07:15:00Z INF +--------------------------------------------------------------------------------------------+';
  const match = sampleLog.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    console.log(`\x1b[32m[PASS] Mock Regex match succeeded:\x1b[0m ${match[0]}`);
    process.exit(0);
  } else {
    console.error('\x1b[31m[FAIL] Regex match failed on mock log\x1b[0m');
    process.exit(1);
  }
}

// Spawn the real cloudflared process
const tunnel = spawn(cmd, ['tunnel', '--url', 'http://127.0.0.1:8000']);

function processOutput(data) {
  const text = data.toString();
  process.stdout.write(text);

  if (!urlExtracted) {
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match) {
      urlExtracted = true;
      const tunnelUrl = match[0];

      console.log('\n\x1b[32m================================================================\x1b[0m');
      console.log(`\x1b[1;32m🎉 Cloudflare Tunnel Successfully Established!\x1b[0m`);
      console.log(`\x1b[36m🌐 Public Tunnel URL: \x1b[1;37m${tunnelUrl}\x1b[0m`);
      console.log('\x1b[32m================================================================\x1b[0m\n');

      updateEnvProduction(tunnelUrl);

      console.log('\x1b[33m👉 Next Step: In a separate terminal, deploy your frontend:\x1b[0m');
      console.log('   \x1b[1mnpm run deploy:frontend\x1b[0m\n');
      console.log('\x1b[36m================================================================\x1b[0m');
    }
  }
}

tunnel.stdout.on('data', processOutput);
tunnel.stderr.on('data', processOutput);

tunnel.on('error', (err) => {
  console.error(`\x1b[31m[ERROR] Failed to start cloudflared:\x1b[0m ${err.message}`);
  process.exit(1);
});

tunnel.on('exit', (code) => {
  console.log(`Tunnel process exited with code ${code}`);
});

process.on('SIGINT', () => {
  tunnel.kill('SIGINT');
  process.exit(0);
});
