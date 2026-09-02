#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

echo "=== 1. Checking Local Backend Health ==="
if ! curl -s http://127.0.0.1:8000/health > /dev/null; then
    echo "Error: Local FastAPI backend is not running on http://127.0.0.1:8000."
    echo "Run 'call .venv/Scripts/activate && python -m uvicorn keyless_healer.app:app --host 127.0.0.1 --port 8000' in another terminal first."
    exit 1
fi
echo "✅ Local Backend is healthy and responsive."

echo "=== 2. Starting Cloudflare Tunnel ==="
CLOUDFLARED_BIN="cloudflared"
if [ -f "${ROOT_DIR}/bin/cloudflared" ]; then
    CLOUDFLARED_BIN="${ROOT_DIR}/bin/cloudflared"
elif [ -f "${ROOT_DIR}/bin/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="${ROOT_DIR}/bin/cloudflared.exe"
fi

TUNNEL_LOG=$(mktemp)
"${CLOUDFLARED_BIN}" tunnel --url http://127.0.0.1:8000 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

echo "Waiting for tunnel URL..."
TUNNEL_URL=""
for i in {1..30}; do
    TUNNEL_URL=$(grep -o 'https://[-a-zA-Z0-9@:%._\+~#=]\+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ Failed to acquire trycloudflare.com URL."
    kill $TUNNEL_PID 2>/dev/null || true
    exit 1
fi

echo "🎉 Tunnel established: $TUNNEL_URL"

echo "=== 3. Writing Environment Configuration ==="
printf "NEXT_PUBLIC_BACKEND_URL=\"%s\"\nBACKEND_URL=\"%s\"\n" "${TUNNEL_URL}" "${TUNNEL_URL}" > .env.production
echo "✅ Written to .env.production"

echo "=== 4. Building and Deploying to Cloudflare Pages ==="
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static --project-name=ai-therapist-app

echo ""
echo "================================================================"
echo "🎉 Deployment complete! Keep this script running to maintain the backend tunnel."
echo "Public Tunnel URL: $TUNNEL_URL"
echo "================================================================"
wait $TUNNEL_PID
