# Antigravity Agent Directives - Vercel Hybrid Architecture

## Architecture Rules
1. **Split-Execution Model:** The Python backend must NEVER be bundled into Vercel Serverless or Edge functions. It requires dedicated local hardware (RAM/VRAM) to execute the local LLM, ChromaDB vector store, and Microsoft Edge Neural voice synthesis.
2. **CORS Permissiveness:** The FastAPI daemon in `keyless_healer/app.py` must include `CORSMiddleware` configured with:
   - `allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$"`
   - `allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]`
   - `allow_credentials=True`
   - `allow_methods=["*"]`
   - `allow_headers=["*"]`
3. **Frontend Deployment:** The Next.js 14 frontend is deployed to Vercel via standard Git integration using `vercel.json` and native `next build`.
4. **Environment Isolation:** Backend endpoints are dynamically referenced via `NEXT_PUBLIC_BACKEND_URL` and `BACKEND_URL`.

## Backend CORS Safeguard
```python
from fastapi.middleware.cors import CORSMiddleware

# Register CORS middleware BEFORE route definitions
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

