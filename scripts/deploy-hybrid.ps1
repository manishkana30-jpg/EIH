# scripts/deploy-hybrid.ps1
# Unified Automated Tunnel & Deployment Script for Windows PowerShell

$ErrorActionPreference = "Stop"

$RootDir = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $RootDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🚀 Unified Cloudflare Hybrid Deployment Pipeline" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Checking Local Backend Health
Write-Host "=== 1. Checking Local Backend Health ===" -ForegroundColor Yellow
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Local FastAPI backend is healthy and responsive." -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Local FastAPI backend is not running on http://127.0.0.1:8000." -ForegroundColor Red
    Write-Host "Please start your backend daemon first:" -ForegroundColor Yellow
    Write-Host "call .venv\Scripts\activate && python -m uvicorn keyless_healer.app:app --host 127.0.0.1 --port 8000" -ForegroundColor White
    exit 1
}

# 2. Starting Cloudflare Tunnel
Write-Host "`n=== 2. Starting Cloudflare Tunnel ===" -ForegroundColor Yellow
$localBin = Join-Path $RootDir "bin\cloudflared.exe"
$cloudflaredCmd = if (Test-Path $localBin) { $localBin } else { "cloudflared" }

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cloudflaredCmd
$psi.Arguments = "tunnel --url http://127.0.0.1:8000"
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $false

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $psi
$process.Start() | Out-Null

$tunnelUrl = ""
$startTime = Get-Date

Write-Host "Waiting for trycloudflare.com tunnel URL..." -ForegroundColor DarkGray

$reader = [System.Threading.Tasks.Task]::Run([Func[string]]{
    while (-not $process.StandardError.EndOfStream -and [string]::IsNullOrEmpty($tunnelUrl)) {
        $line = $process.StandardError.ReadLine()
        if ($line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            return $matches[1]
        }
    }
    return ""
})

if ($reader.Wait(30000)) {
    $tunnelUrl = $reader.Result
}

if ([string]::IsNullOrEmpty($tunnelUrl)) {
    Write-Host "❌ Failed to acquire trycloudflare.com URL within 30 seconds." -ForegroundColor Red
    if (-not $process.HasExited) { $process.Kill() }
    exit 1
}

Write-Host "🎉 Tunnel established: $tunnelUrl" -ForegroundColor Cyan

# 3. Writing Environment Configuration
Write-Host "`n=== 3. Writing Environment Configuration ===" -ForegroundColor Yellow
$envProdPath = Join-Path $RootDir ".env.production"
$envContent = "NEXT_PUBLIC_BACKEND_URL=""$tunnelUrl""`nBACKEND_URL=""$tunnelUrl"""
Set-Content -Path $envProdPath -Value $envContent
Write-Host "✅ Written to .env.production: NEXT_PUBLIC_BACKEND_URL=$tunnelUrl" -ForegroundColor Green

# 4. Building and Deploying to Cloudflare Pages
Write-Host "`n=== 4. Building and Deploying to Cloudflare Pages ===" -ForegroundColor Yellow
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name=ai-therapist-app

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "🎉 Hybrid Deployment Complete! Keep this window open to maintain the backend tunnel." -ForegroundColor Green
Write-Host "Public Tunnel URL: $tunnelUrl" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Green

try {
    $process.WaitForExit()
} finally {
    if (-not $process.HasExited) { $process.Kill() }
}
