@echo off
title Cloudflare Pages Deployment Suite
echo ==========================================================
echo 🚀 Building and Deploying Frontend to Cloudflare Pages
echo ==========================================================
echo.

echo [1/2] Compiling Next.js with @cloudflare/next-on-pages...
call npm run pages:build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Next-on-pages build failed. Check logs above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Deploying static build to Cloudflare Pages via Wrangler...
call npx wrangler pages deploy .vercel/output/static --project-name=ai-therapist-app

echo.
echo ==========================================================
echo 🎉 Deployment command complete!
echo ==========================================================
pause
