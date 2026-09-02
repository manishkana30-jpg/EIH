# scripts/launch-tunnel.ps1
# Automated Cloudflare Tunnel Launcher with Live URL Extraction & .env.production updater

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "🌐 Cloudflare Tunnel Orchestration: Local FastAPI Exposer" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Target Endpoint: http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host ""

# 1. Locate cloudflared binary
$localBin = Join-Path $PSScriptRoot "..\bin\cloudflared.exe"
$cloudflaredCmd = ""

if (Test-Path $localBin) {
    $cloudflaredCmd = (Resolve-Path $localBin).Path
} elseif (Get-Command cloudflared -ErrorAction SilentlyContinue) {
    $cloudflaredCmd = "cloudflared"
} elseif (Test-Path "$env:ProgramFiles\cloudflared\cloudflared.exe") {
    $cloudflaredCmd = "$env:ProgramFiles\cloudflared\cloudflared.exe"
} else {
    Write-Host "[ERROR] cloudflared binary not found." -ForegroundColor Red
    Write-Host "Please place cloudflared.exe in the bin/ directory or install via winget." -ForegroundColor Yellow
    exit 1
}

Write-Host "Using cloudflared binary: $cloudflaredCmd" -ForegroundColor DarkGray
Write-Host "Spawning tunnel on http://127.0.0.1:8000..." -ForegroundColor Yellow

$envProdPath = Join-Path $PSScriptRoot "..\.env.production"
$urlExtracted = $false

# 2. Start cloudflared process and capture output
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

$readOutput = {
    param($stream, $name)
    while (-not $stream.EndOfStream) {
        $line = $stream.ReadLine()
        if ($line) {
            Write-Host $line -ForegroundColor DarkGray

            if (-not $script:urlExtracted -and $line -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                $script:urlExtracted = $true
                $tunnelUrl = $matches[1]

                Write-Host ""
                Write-Host "================================================================" -ForegroundColor Green
                Write-Host "🎉 Cloudflare Tunnel Successfully Established!" -ForegroundColor Green
                Write-Host "🌐 Public Tunnel URL: $tunnelUrl" -ForegroundColor Cyan
                Write-Host "================================================================" -ForegroundColor Green
                Write-Host ""

                # Update .env.production
                if (Test-Path $envProdPath) {
                    $content = Get-Content $envProdPath -Raw
                    $content = $content -replace 'NEXT_PUBLIC_BACKEND_URL=".*?"', "NEXT_PUBLIC_BACKEND_URL=""$tunnelUrl"""
                    $content = $content -replace 'BACKEND_URL=".*?"', "BACKEND_URL=""$tunnelUrl"""
                    Set-Content -Path $envProdPath -Value $content
                    Write-Host "✅ Updated .env.production with live endpoint: $tunnelUrl" -ForegroundColor Green
                } else {
                    $newContent = "NEXT_PUBLIC_BACKEND_URL=""$tunnelUrl""`nBACKEND_URL=""$tunnelUrl"""
                    Set-Content -Path $envProdPath -Value $newContent
                    Write-Host "✅ Created .env.production with live endpoint: $tunnelUrl" -ForegroundColor Green
                }

                Write-Host ""
                Write-Host "👉 Next Step: In a separate terminal, deploy your frontend:" -ForegroundColor Yellow
                Write-Host "   npm run deploy:frontend" -ForegroundColor White
                Write-Host "================================================================" -ForegroundColor Green
            }
        }
    }
}

# Run readers on background threads
$stdErrTask = [System.Threading.Tasks.Task]::Run([Action]{ & $readOutput $process.StandardError "STDERR" })
$stdOutTask = [System.Threading.Tasks.Task]::Run([Action]{ & $readOutput $process.StandardOutput "STDOUT" })

# Wait for process exit
try {
    $process.WaitForExit()
} finally {
    if (-not $process.HasExited) {
        $process.Kill()
    }
}
