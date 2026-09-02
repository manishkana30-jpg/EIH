#!/usr/bin/env bash
# scripts/launch-tunnel.sh
# Automated Cloudflare Tunnel Launcher with Live URL Extraction & .env.production updater

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_PROD="${ROOT_DIR}/.env.production"

echo "================================================================"
echo "🌐 Cloudflare Tunnel Orchestration: Local FastAPI Exposer"
echo "================================================================"
echo "Target Endpoint: http://127.0.0.1:8000"
echo ""

# Find cloudflared binary
CLOUDFLARED_BIN="cloudflared"
if [ -f "${ROOT_DIR}/bin/cloudflared" ]; then
    CLOUDFLARED_BIN="${ROOT_DIR}/bin/cloudflared"
elif [ -f "${ROOT_DIR}/bin/cloudflared.exe" ]; then
    CLOUDFLARED_BIN="${ROOT_DIR}/bin/cloudflared.exe"
fi

echo "Using binary: ${CLOUDFLARED_BIN}"
echo "Spawning tunnel on http://127.0.0.1:8000..."

# Start cloudflared and process line-by-line
"${CLOUDFLARED_BIN}" tunnel --url http://127.0.0.1:8000 2>&1 | while IFS= read -r line; do
    echo "$line"
    if [[ "$line" =~ (https://[a-zA-Z0-9-]+\.trycloudflare\.com) ]]; then
        TUNNEL_URL="${BASH_REMATCH[1]}"
        echo ""
        echo "================================================================"
        echo "🎉 Cloudflare Tunnel Successfully Established!"
        echo "🌐 Public Tunnel URL: ${TUNNEL_URL}"
        echo "================================================================"
        echo ""

        if [ -f "$ENV_PROD" ]; then
            sed -i.bak -E "s|NEXT_PUBLIC_BACKEND_URL=\".*\"|NEXT_PUBLIC_BACKEND_URL=\"${TUNNEL_URL}\"|g" "$ENV_PROD"
            sed -i.bak -E "s|BACKEND_URL=\".*\"|BACKEND_URL=\"${TUNNEL_URL}\"|g" "$ENV_PROD"
            rm -f "${ENV_PROD}.bak"
            echo "✅ Updated .env.production with live endpoint: ${TUNNEL_URL}"
        else
            printf "NEXT_PUBLIC_BACKEND_URL=\"%s\"\nBACKEND_URL=\"%s\"\n" "${TUNNEL_URL}" "${TUNNEL_URL}" > "$ENV_PROD"
            echo "✅ Created .env.production with live endpoint: ${TUNNEL_URL}"
        fi

        echo ""
        echo "👉 Next Step: In a separate terminal, deploy your frontend:"
        echo "   npm run deploy:frontend"
        echo "================================================================"
    fi
done
