/**
 * Cross-platform Cloudflare Tunnel Launcher for Local Backend
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const binName = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
const localBin = path.join(__dirname, '..', 'bin', binName);

let cmd = 'cloudflared';
if (fs.existsSync(localBin)) {
  cmd = localBin;
}

console.log('🌐 Exposing local FastAPI backend on http://127.0.0.1:8000 via Cloudflare Tunnel...');
console.log(`Using binary: ${cmd}\n`);

const tunnel = spawn(cmd, ['tunnel', '--url', 'http://127.0.0.1:8000'], {
  stdio: 'inherit',
});

tunnel.on('error', (err) => {
  console.error(`Failed to launch Cloudflare Tunnel: ${err.message}`);
  process.exit(1);
});

tunnel.on('exit', (code) => {
  console.log(`Tunnel closed with exit code ${code}`);
});
