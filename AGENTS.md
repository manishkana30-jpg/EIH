# Antigravity Agent Directives - Cloudflare Hybrid Architecture

## Architecture Rules
1. **Split-Execution Model:** The Python backend must NEVER be bundled into Cloudflare Workers or serverless functions. It requires dedicated local hardware (RAM/VRAM) to execute the local LLM, ChromaDB vector store, and Microsoft Edge Neural voice synthesis.
2. **CORS Permissiveness:** The FastAPI daemon in `keyless_healer/app.py` must include `CORSMiddleware` configured with:
   - `allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.pages\.dev|https://.*\.trycloudflare\.com)$"`
   - `allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://*.trycloudflare.com"]`
   - `allow_credentials=True`
   - `allow_methods=["*"]`
   - `allow_headers=["*"]`
3. **Edge Runtime Compatibility:** Cloudflare Pages runs on V8 isolates. The Next.js code must not use unsupported Node native modules (`fs`, `child_process`) inside client components or Edge API routes.
4. **Environment Isolation:** Secrets (`LIVEKIT_API_SECRET`, local paths) must stay on the backend. Only public routing URLs (`NEXT_PUBLIC_BACKEND_URL`) should be injected into the frontend.

## Backend CORS Safeguard
```python
from fastapi.middleware.cors import CORSMiddleware

# Register CORS middleware BEFORE route definitions
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.pages\.dev|https://.*\.trycloudflare\.com)$",
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.trycloudflare.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
