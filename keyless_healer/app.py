"""
Keyless Healer - FastAPI Web Server, Full Voice/Text Web UI & Interactive CLI Runner
100% Zero-API-Key Architecture:
• Free STT: Local Faster-Whisper (Int8)
• Free TTS: Microsoft Edge Neural TTS (edge-tts) + Offline pyttsx3
• Free Search: NCBI PubMed Central + Wikipedia Clinical Knowledge
• Free Inference: Local Ollama + Rule-Based Cognitive & Somatic Synthesis
"""

from __future__ import annotations

import argparse
import asyncio
import base64
import logging
import os
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

import uvicorn
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel, Field

# Setup system path
workspace_root = Path(__file__).resolve().parent.parent
keyless_dir = Path(__file__).resolve().parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))
if str(keyless_dir) not in sys.path:
    sys.path.insert(0, str(keyless_dir))

try:
    from keyless_healer.lib.audio_engine import (
        AudioEngine,
        get_voice_for_locale,
        sanitize_text_for_speech,
    )
    from keyless_healer.lib.cbt_library_loader import cbt_loader
    from keyless_healer.lib.cbt_upgrader import cbt_upgrader
    from keyless_healer.lib.clinical_expansion import clinical_expansion_engine
    from keyless_healer.lib.clinical_search import (
        ClinicalSearchEngine,
    )
    from keyless_healer.lib.psychologist_partner import (
        PsychologistPartner,
        TherapeuticResponse,
    )
    from keyless_healer.lib.psychology_library_rag import psychology_rag
    from keyless_healer.lib.self_learning_therapist import (
        self_learning_therapist,
    )
except ImportError:
    try:
        from lib.psychology_library_rag import psychology_rag  # type: ignore[import-untyped, import-not-found]
    except ImportError:
        psychology_rag = None  # type: ignore[assignment]
    try:
        from lib.clinical_expansion import clinical_expansion_engine  # type: ignore[import-untyped, import-not-found]
    except ImportError:
        clinical_expansion_engine = None  # type: ignore[assignment]
    from lib.audio_engine import (  # type: ignore[import-untyped, import-not-found]
        AudioEngine,
        get_voice_for_locale,
        sanitize_text_for_speech,
    )
    from lib.cbt_upgrader import (  # type: ignore[import-untyped, import-not-found]
        cbt_upgrader,
    )
    from lib.clinical_search import (  # type: ignore[import-untyped, import-not-found]
        ClinicalSearchEngine,
    )
    from lib.psychologist_partner import (  # type: ignore[import-untyped, import-not-found]
        PsychologistPartner,
        TherapeuticResponse,
    )
    try:
        from lib.self_learning_therapist import (
            self_learning_therapist,  # type: ignore[import-untyped, import-not-found]
        )
    except ImportError:
        self_learning_therapist = None  # type: ignore[assignment]
    try:
        from lib.cbt_library_loader import cbt_loader  # type: ignore[import-untyped, import-not-found]
    except ImportError:
        cbt_loader = None  # type: ignore[assignment]

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("KeylessHealerApp")

# =========================================================================
# FASTAPI APPLICATION & SINGLETON ENGINES
# =========================================================================

app = FastAPI(
    title="Keyless Healer",
    description="100% Zero-API-Key Clinical Psychologist, Voice Agent & Clinical Grounding Engine",
    version="2.1.0",
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Production: add deployed domain via CORS_ORIGIN env var
_cors_origin = os.environ.get("CORS_ORIGIN", "")
if _cors_origin:
    for origin in _cors_origin.split(","):
        if origin.strip():
            ALLOWED_ORIGINS.append(origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

search_engine = ClinicalSearchEngine()
audio_engine = AudioEngine()
partner = PsychologistPartner(search_engine=search_engine)

# In-Memory Rate Limiter (120 requests/minute per client IP)
_client_request_history: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60.0  # seconds
MAX_REQUESTS_PER_WINDOW = 120

def enforce_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    history = _client_request_history[client_ip]
    valid_history = [t for t in history if now - t < RATE_LIMIT_WINDOW]
    _client_request_history[client_ip] = valid_history
    if len(valid_history) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Please wait a moment before sending more requests."
        )
    _client_request_history[client_ip].append(now)

    # Evict stale entries to prevent unbounded memory growth
    if len(_client_request_history) > 10000:
        stale_ips = [ip for ip, ts in _client_request_history.items() if not ts or ts[-1] < now - RATE_LIMIT_WINDOW * 10]
        for ip in stale_ips:
            del _client_request_history[ip]


class ChatRequest(BaseModel):
    message: str | None = Field(default=None, max_length=4000, description="User's input text or emotional query")
    messages: list[dict[str, Any]] | None = Field(default=None, description="Full conversation history array")
    history: list[dict[str, Any]] | None = Field(default=None, description="Recent conversation turns for anti-looping context")
    voice_mode: bool | None = Field(default=False, description="Whether to include synthesized audio_base64 in response")
    language: str | None = Field(default=None, description="Language code or speech locale e.g. hi, es, fr, de, ja, zh, en")
    locale: str | None = Field(default="en-US", description="Regional locale code e.g. hi-IN, es-ES, en-US")

# Type Aliases for /api/therapy/chat
TherapyRequest = ChatRequest
TherapyResponse = TherapeuticResponse


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Clinical query to search")


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000, description="Text to synthesize to speech")
    voice: str | None = Field(default=None, max_length=100, description="Neural voice identifier")
    locale: str | None = Field(default="en-US", max_length=50, description="Regional locale code e.g. hi-IN, es-ES, en-US")


class CBTAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000, description="User utterance to analyze for CBT distortions")


class CBTUpgradeRequest(BaseModel):
    payload: dict[str, Any] | None = Field(default=None, description="Optional custom library payload to validate and install")
    force: bool | None = Field(default=False, description="Force upgrade bypassing version check")


class ClinicalSolutionRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000, description="User symptom, emotional struggle, or query")
    condition_id: str | None = Field(default=None, description="Optional condition ID")
    voice_mode: bool | None = Field(default=False, description="Whether to include synthesized TTS audio base64")


class ClinicalExpansionRequest(BaseModel):
    topic: str | None = Field(default=None, description="Topic or condition to expand with AI")
    custom_prompt: str | None = Field(default=None, description="Optional custom guidance")


if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined] # pyright: ignore[reportAttributeAccessIssue]
    except Exception:
        pass

# =========================================================================
# EMBEDDED ZERO-KEY VOICE & TEXT WEB UI (HTML / CSS / JS)
# =========================================================================

HTML_UI = r"""<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keyless Healer - Zero-Key Clinical Voice & Cognitive Sanctuary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 24, 38, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-cyan: #06b6d4;
      --accent-indigo: #6366f1;
      --accent-emerald: #10b981;
      --accent-amber: #f59e0b;
      --accent-rose: #f43f5e;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: radial-gradient(circle at 50% 0%, #172554 0%, #090d16 65%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }
    header {
      padding: 18px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      background: rgba(9, 13, 22, 0.8);
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Outfit', sans-serif;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
    }
    .brand-text h1 { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.02em; }
    .brand-text p { font-size: 0.72rem; color: var(--accent-cyan); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
    .badge-pill {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.75rem;
      padding: 5px 12px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .badge-dot { width: 7px; height: 7px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; }
    main {
      flex: 1;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }
    @media (max-width: 900px) {
      main { grid-template-columns: 1fr; }
    }
    .chat-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      backdrop-filter: blur(20px);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 140px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .msg {
      max-width: 82%;
      padding: 14px 18px;
      border-radius: 18px;
      line-height: 1.55;
      font-size: 0.95rem;
      position: relative;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .msg-user {
      align-self: flex-end;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: #fff;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
    }
    .msg-ai {
      align-self: flex-start;
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.06);
      color: #f1f5f9;
      border-bottom-left-radius: 4px;
    }
    .msg-ai .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
      font-size: 0.72rem;
    }
    .tag {
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.07);
      color: #cbd5e1;
      font-weight: 500;
    }
    .tag-emotion { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
    .tag-distortion { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .tag-provider { background: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.3); }
    .audio-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--accent-cyan);
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      transition: all 0.2s;
    }
    .audio-btn:hover { background: rgba(6, 182, 212, 0.15); border-color: var(--accent-cyan); }

    .input-bar {
      padding: 16px 20px;
      border-top: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.8);
    }
    .input-bar input {
      flex: 1;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 12px 16px;
      color: #fff;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-bar input:focus { border-color: var(--accent-cyan); box-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
    .btn {
      padding: 12px 18px;
      border-radius: 12px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn-send {
      background: linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo));
      color: #fff;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
    }
    .btn-send:hover { transform: translateY(-1px); filter: brightness(1.1); }
    .btn-mic {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      padding: 0;
      justify-content: center;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--accent-cyan);
      position: relative;
    }
    .btn-mic.recording {
      background: var(--accent-rose);
      color: #fff;
      border-color: var(--accent-rose);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.7); }
      70% { box-shadow: 0 0 0 12px rgba(244, 63, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 18px;
      backdrop-filter: blur(16px);
    }
    .panel h2 {
      font-size: 0.88rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .source-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 10px;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    .source-card:hover { border-color: rgba(6, 182, 212, 0.3); }
    .source-title { font-weight: 600; color: #e2e8f0; margin-bottom: 4px; }
    .source-summary { color: var(--text-muted); line-height: 1.4; margin-bottom: 6px; }
    .source-link { color: var(--accent-cyan); text-decoration: none; font-size: 0.75rem; }
    .source-link:hover { text-decoration: underline; }

    .voice-select {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 10px;
      border-radius: 10px;
      font-size: 0.85rem;
      outline: none;
      margin-bottom: 12px;
    }
    #visualizer {
      width: 100%;
      height: 48px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 10px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">🌱</div>
      <div class="brand-text">
        <h1>KEYLESS HEALER</h1>
        <p>Zero-Key Clinical Intelligence & Voice Sanctuary</p>
      </div>
    </div>
    <div class="badge-pill">
      <div class="badge-dot"></div>
      <span>100% Free • Zero API Keys • Local Privacy</span>
    </div>
  </header>

  <main>
    <section class="chat-container">
      <div class="chat-messages" id="messagesContainer">
      </div>

      <div class="input-bar">
        <button id="micBtn" class="btn btn-mic" title="Hold/Click to Speak" aria-label="Hold or click to speak" onclick="toggleVoiceRecording()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </button>
        <input type="text" id="userInput" placeholder="Share what is on your mind..." aria-label="Type your thoughts or emotional concerns" onkeydown="handleKeyPress(event)">
        <button class="btn btn-send" aria-label="Send message" onclick="sendTextMessage()">
          <span>Send</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </section>

    <aside class="sidebar">
      <div class="panel">
        <h2>
          <span>Audio Engine</span>
          <span style="font-size: 0.7rem; color: var(--accent-cyan)">Neural TTS</span>
        </h2>
        <select id="voiceSelector" class="voice-select" aria-label="Select neural speech voice">
          <option value="en-US-AriaNeural">Aria (Empathetic Female)</option>
          <option value="en-US-GuyNeural">Guy (Grounding Male)</option>
          <option value="hi-IN-SwaraNeural">Swara (Hindi / English)</option>
          <option value="en-GB-SoniaNeural">Sonia (British English)</option>
        </select>
        <canvas id="visualizer" aria-label="Speech audio visualizer" role="img"></canvas>
      </div>

      <div class="panel" style="flex: 1; overflow-y: auto;">
        <h2>
          <span>Clinical Research Grounding</span>
          <span id="sourceCount" style="font-size: 0.7rem; color: var(--accent-emerald)">Active</span>
        </h2>
        <div id="sourcesContainer">
          <div class="source-card">
            <div class="source-title">NCBI PubMed & Polyvagal Protocol</div>
            <div class="source-summary">Live grounding scans PubMed, DuckDuckGo, and Wikipedia without API keys.</div>
          </div>
        </div>
      </div>
    </aside>
  </main>

  <script>
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let audioContext = null;
    let analyser = null;
    let visualizerAnim = null;

    function initVisualizer() {
      const canvas = document.getElementById('visualizer');
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth - 36;
      canvas.height = 48;

      function draw() {
        visualizerAnim = requestAnimationFrame(draw);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const bars = 24;
        const barWidth = (canvas.width / bars) - 2;
        for (let i = 0; i < bars; i++) {
          const height = isRecording ? Math.random() * 36 + 6 : 4;
          const x = i * (barWidth + 2);
          const y = (canvas.height - height) / 2;
          ctx.fillStyle = isRecording ? '#f43f5e' : '#06b6d4';
          ctx.fillRect(x, y, barWidth, height);
        }
      }
      draw();
    }
    window.addEventListener('load', initVisualizer);

    function handleKeyPress(e) {
      if (e.key === 'Enter') sendTextMessage();
    }

    function appendMessage(sender, text, data = null) {
      const c = document.getElementById('messagesContainer');
      const msgDiv = document.createElement('div');
      msgDiv.className = sender === 'user' ? 'msg msg-user' : 'msg msg-ai';

      let html = `<strong>${sender === 'user' ? 'You' : 'Companion'}:</strong><br>${escapeHtml(text)}`;

      if (data && sender === 'ai') {
        html += '<div class="meta-tags">';
        if (data.detected_emotion) html += `<span class="tag tag-emotion">Affect: ${escapeHtml(data.detected_emotion)}</span>`;
        if (data.detected_distortion && data.detected_distortion !== 'None') html += `<span class="tag tag-distortion">Cognitive: ${escapeHtml(data.detected_distortion)}</span>`;
        if (data.provider_used) html += `<span class="tag tag-provider">${escapeHtml(data.provider_used)} (${data.latency_ms}ms)</span>`;
        html += '</div>';

        html += `<button class="audio-btn" onclick="playTTS(\`${encodeURIComponent(text)}\`)">🔊 Play Voice</button>`;
      }

      msgDiv.innerHTML = html;
      c.appendChild(msgDiv);
      c.scrollTop = c.scrollHeight;
    }

    function updateSources(sources) {
      const container = document.getElementById('sourcesContainer');
      if (!sources || sources.length === 0) return;

      container.innerHTML = '';
      sources.forEach(s => {
        const div = document.createElement('div');
        div.className = 'source-card';
        div.innerHTML = `
          <div class="source-title">${escapeHtml(s.title)}</div>
          <div class="source-summary">${escapeHtml(s.summary)}</div>
          ${s.url ? `<a class="source-link" href="${escapeHtml(s.url)}" target="_blank">View Study (${escapeHtml(s.source.toUpperCase())}) ↗</a>` : `<span style="font-size:0.7rem; color:#94a3b8;">${escapeHtml(s.source)}</span>`}
        `;
        container.appendChild(div);
      });
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.innerText = text || '';
      return div.innerHTML;
    }

    async function sendTextMessage() {
      const input = document.getElementById('userInput');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      appendMessage('user', text);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        appendMessage('ai', data.reply, data);
        updateSources(data.sources);
        playTTS(encodeURIComponent(data.reply));
      } catch (err) {
        appendMessage('ai', '[Connection Notice: Unable to communicate with clinical engine. Please verify backend status.]');
      }
    }

    async function playTTS(encodedText) {
      const text = decodeURIComponent(encodedText);
      const voice = document.getElementById('voiceSelector').value;
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice })
        });
        if (res.ok) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audio.play();
        }
      } catch (err) {
        console.warn('Speech playback notice:', err);
      }
    }

    async function toggleVoiceRecording() {
      const btn = document.getElementById('micBtn');
      if (!isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            btn.classList.remove('recording');
            isRecording = false;

            // Send audio to transcribe & respond
            const formData = new FormData();
            formData.append('file', audioBlob, 'input.webm');
            formData.append('voice', document.getElementById('voiceSelector').value);

            appendMessage('user', '🎙️ (Spoken Voice Turn...)');

            try {
              const res = await fetch('/api/voice-turn', {
                method: 'POST',
                body: formData
              });
              const data = await res.json();
              if (data.transcription) {
                // Update previous message with transcription
                appendMessage('user', `"${data.transcription}"`);
              }
              appendMessage('ai', data.reply, data);
              updateSources(data.sources);
              if (data.audio_base64) {
                const audio = new Audio('data:audio/mp3;base64,' + data.audio_base64);
                audio.play();
              }
            } catch (err) {
              console.error(err);
            }
          };

          mediaRecorder.start();
          isRecording = true;
          btn.classList.add('recording');
        } catch (err) {
          alert('Microphone access denied or not available: ' + err.message);
        }
      } else {
        mediaRecorder.stop();
      }
    }
  </script>
</body>
</html>
"""


# =========================================================================
# FASTAPI ENDPOINTS
# =========================================================================

@app.get("/", response_class=HTMLResponse)
async def root_ui():
    """Serves the complete zero-key Voice & Text Healer Web UI."""
    return HTMLResponse(content=HTML_UI)


@app.get("/health")
@app.get("/backend-health")
async def health_check():
    """Returns engine health, keyless providers, and capability metrics."""
    return {
        "status": "healthy",
        "service": "Keyless Healer",
        "version": "2.1.0",
        "zero_api_key": True,
        "search_engine": {
            "sources": ["PubMed NCBI", "Wikipedia Clinical", "Offline Protocols Cache"],
        },
        "audio_engine": audio_engine.get_status(),
        "inference_engine": "Local Ollama (llama3.2) + Polyvagal/CBT Heuristic Synthesis",
    }


@app.post("/api/chat", response_model=TherapyResponse)
@app.post("/api/therapy/chat", response_model=TherapyResponse)
async def chat_endpoint(payload: TherapyRequest, request: Request, background_tasks: BackgroundTasks):
    """Processes conversational messages with search grounding, cognitive diagnostics and background RAG learning."""
    enforce_rate_limit(request)
    try:
        user_query = payload.message
        history_turns: list[dict[str, str]] = []

        if payload.messages and len(payload.messages) > 0:
            # Keep only the last 8 messages to prevent context pollution and loops
            recent_messages = payload.messages[-8:]
            formatted_msgs = [
                {"role": m.get("role") or m.get("sender") or "user", "content": m.get("content") or m.get("text") or ""}
                for m in recent_messages
            ]

            # Extract latest user message
            last_user_input = next(
                (m["content"] for m in reversed(formatted_msgs) if m["role"] == "user" and m["content"].strip()),
                ""
            )
            user_query = last_user_input or user_query

            # Build prior turns excluding the latest query
            for m in formatted_msgs[:-1]:
                if m["content"].strip():
                    history_turns.append({"role": m["role"], "text": m["content"].strip()})

        elif payload.history:
            history_turns = [
                {"role": h.get("role") or h.get("sender") or "user", "text": h.get("text") or h.get("content") or ""}
                for h in payload.history[-8:]
            ]

        if not user_query or not user_query.strip():
            raise HTTPException(status_code=400, detail="Missing user message or content")

        clean_user_query = user_query.strip()

        # Non-blocking self-learning: asynchronously discover & index psychology documents from Google/open search
        if psychology_rag and len(clean_user_query) >= 4:
            background_tasks.add_task(psychology_rag.learn_document_from_query, clean_user_query)

        target_locale = payload.locale or payload.language or "en-US"
        response = await partner.respond(clean_user_query, history=history_turns, locale=target_locale)

        # Synthesize edge-tts neural voice matching user language/geo locale
        voice_to_use = get_voice_for_locale(target_locale)
        if payload.voice_mode is not False and not response.audio_base64:
            try:
                audio_bytes = await audio_engine.synthesize(response.reply, voice=voice_to_use)
                if audio_bytes:
                    response.audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            except Exception as voice_err:
                logger.warning(f"Voice mode synthesis notice ({voice_to_use}): {voice_err}")

        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {e!s}") from e


@app.post("/api/search")
@app.post("/api/therapy/search")
async def search_endpoint(payload: SearchRequest, request: Request):
    """Zero-key clinical grounding search endpoint."""
    enforce_rate_limit(request)
    try:
        results = await search_engine.search(payload.query)
        return {"query": payload.query, "results": results}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search error: {e!s}") from e


@app.get("/api/library")
@app.get("/api/therapy/library")
async def get_library_conditions(request: Request):
    """Returns all structured entries from the Clinical & Psychoeducational Library, including dynamically learned ones."""
    enforce_rate_limit(request)
    if psychology_rag:
        return {
            "conditions": psychology_rag.get_all_conditions(),
            "learned_documents": psychology_rag.get_all_learned_documents(),
        }
    return {"conditions": [], "learned_documents": []}


@app.get("/api/library/learned")
@app.get("/api/therapy/library/learned")
async def get_learned_psychology_documents(request: Request):
    """Returns all dynamically discovered and indexed psychology documents."""
    enforce_rate_limit(request)
    if psychology_rag:
        return {"learned_documents": psychology_rag.get_all_learned_documents()}
    return {"learned_documents": []}


@app.post("/api/library/query")
@app.post("/api/therapy/library/query")
async def query_library_condition(payload: SearchRequest, request: Request, background_tasks: BackgroundTasks):
    """Semantic vector RAG search against ChromaDB Psychology Library with background query learning."""
    enforce_rate_limit(request)
    clean_q = payload.query.strip()
    if psychology_rag and len(clean_q) >= 4:
        background_tasks.add_task(psychology_rag.learn_document_from_query, clean_q)

    if psychology_rag:
        guidance = psychology_rag.retrieve_guidance(clean_q)
        return {"query": clean_q, "guidance": guidance}
    return {"query": clean_q, "guidance": None}



@app.post("/api/tts")
@app.post("/api/therapy/tts")
@app.post("/api/voice")
async def tts_endpoint(
    request: Request,
    text: str | None = Form(None),
    voice: str | None = Form(None),
    locale: str | None = Form(None),
):
    """Synthesizes text to MP3 audio using edge-tts with pyttsx3 offline fallback (supports JSON & FormData)."""
    enforce_rate_limit(request)
    target_text = text
    target_voice = voice
    target_locale = locale

    # Fallback to JSON payload if Form body wasn't used
    if not target_text and request.headers.get("content-type", "").startswith("application/json"):
        try:
            body = await request.json()
            if isinstance(body, dict):
                target_text = body.get("text")
                target_voice = body.get("voice", target_voice)
                target_locale = body.get("locale", target_locale)
        except Exception:
            pass

    if not target_voice:
        target_voice = get_voice_for_locale(target_locale or "en-US")

    if not target_text:
        raise HTTPException(status_code=400, detail="Missing text parameter for speech synthesis")

    clean_text = sanitize_text_for_speech(target_text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text contains no speakable content")

    try:
        audio_bytes = await audio_engine.synthesize(clean_text, voice=target_voice)
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Voice synthesis failed")
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Content-Length": str(len(audio_bytes)),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"TTS error: {e!s}") from e


@app.post("/api/transcribe")
@app.post("/api/stt")
@app.post("/api/therapy/stt")
async def transcribe_endpoint(
    request: Request,
    file: UploadFile | None = File(None),
    audio_file: UploadFile | None = File(None),
):
    """Transcribes uploaded audio files using Faster-Whisper."""
    enforce_rate_limit(request)
    target = file or audio_file
    if not target:
        raise HTTPException(status_code=400, detail="No audio file uploaded")
    try:
        content = await target.read()
        text = await audio_engine.transcribe(content)
        return {"transcription": text, "transcript": text}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription error: {e!s}") from e


@app.post("/api/voice-turn")
async def voice_turn_endpoint(
    request: Request,
    file: UploadFile = File(...),
    voice: str | None = Form("en-US-AriaNeural"),
):
    """
    All-in-one Voice Turn:
    1. STT: Faster-Whisper
    2. Cognitive Diagnostics & Grounded Response: Psychologist Partner
    3. Neural TTS: Edge-TTS
    """
    enforce_rate_limit(request)
    content = await file.read()
    transcription = await audio_engine.transcribe(content)
    if not transcription or not transcription.strip():
        raise HTTPException(status_code=400, detail="No speech detected in audio")
    user_query = transcription.strip()

    response = await partner.respond(user_query)
    audio_bytes = await audio_engine.synthesize(response.reply, voice=voice)

    return {
        "transcription": transcription,
        "reply": response.reply,
        "sources": response.sources,
        "detected_emotion": response.detected_emotion,
        "detected_distortion": response.detected_distortion,
        "provider_used": response.provider_used,
        "is_crisis": response.is_crisis,
        "latency_ms": response.latency_ms,
        "audio_base64": base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else None,
    }


# =========================================================================
# CBT CLINICAL KNOWLEDGE BASE & AUTO-UPGRADE ENDPOINTS
# =========================================================================

@app.get("/api/cbt/library")
async def get_cbt_library_endpoint():
    """Returns the full evidence-based CBT and Schema knowledge base and manifest."""
    return cbt_upgrader.get_current_library()


@app.get("/api/cbt/distortions")
async def get_cbt_distortions_endpoint():
    """Returns all 20+ evidence-based cognitive distortions."""
    lib = cbt_upgrader.get_current_library()
    distortions = lib.get("cognitive_distortions", [])
    return {
        "count": len(distortions),
        "version": lib.get("manifest", {}).get("version", "unknown"),
        "distortions": distortions,
    }


@app.get("/api/cbt/protocols")
async def get_cbt_protocols_endpoint():
    """Returns clinical CBT protocols, dysfunctional thought records, and schema domains."""
    lib = cbt_upgrader.get_current_library()
    return {
        "protocols": lib.get("clinical_protocols", []),
        "schemas": lib.get("maladaptive_schemas", []),
    }


@app.post("/api/cbt/analyze")
async def analyze_cbt_endpoint(payload: CBTAnalyzeRequest, request: Request):
    """Analyzes a client utterance for cognitive distortions, Socratic prompts, and somatic reframing."""
    enforce_rate_limit(request)
    if cbt_loader:
        return cbt_loader.analyze_utterance(payload.text)
    lib = cbt_upgrader.get_current_library()
    distortions = lib.get("cognitive_distortions", [])
    return {"text": payload.text, "total_distortions_indexed": len(distortions)}


@app.post("/api/cbt/upgrade")
async def upgrade_cbt_endpoint(request: Request, payload: CBTUpgradeRequest | None = None):
    """Triggers the automated CBT library upgrade engine with checksum verification and rollback protection."""
    enforce_rate_limit(request)
    custom = payload.payload if payload else None
    result = await cbt_upgrader.upgrade_library(custom_payload=custom)
    if cbt_loader:
        cbt_loader.reload()
    return result


@app.post("/api/cbt/rollback")
async def rollback_cbt_endpoint(request: Request):
    """Rolls back the CBT library to the previous stable snapshot."""
    enforce_rate_limit(request)
    result = cbt_upgrader.rollback()
    if cbt_loader:
        cbt_loader.reload()
    return result


# =========================================================================
# AI-POWERED CLINICAL KNOWLEDGE EXPANSION & SOLUTION ENDPOINTS
# =========================================================================

@app.post("/api/clinical/solution")
async def generate_clinical_solution_endpoint(payload: ClinicalSolutionRequest, request: Request, background_tasks: BackgroundTasks):
    """
    Generates a personalized, 5-pillar clinical solution using EIH's own AI engine:
    1. Evidence-Based CBT & Socratic Reframing
    2. Polyvagal & Somatic Anchoring
    3. Ayurvedic Sattvavajaya Pranayama Protocol
    4. Daily Micro-Habit & Behavioral Activation
    5. Neuroscience Mechanism & Spoken Voice Synthesis
    """
    enforce_rate_limit(request)
    if not clinical_expansion_engine:
        raise HTTPException(status_code=503, detail="Clinical expansion engine not initialized")

    # Background query discovery & indexing into psychology library RAG
    if psychology_rag and payload.query and len(payload.query.strip()) >= 4:
        background_tasks.add_task(psychology_rag.learn_document_from_query, payload.query.strip())

    solution = clinical_expansion_engine.generate_clinical_solution(
        query=payload.query,
        condition_id=payload.condition_id,
    )

    result_dict: dict[str, Any] = {
        "title": solution.title,
        "condition_id": solution.condition_id,
        "category": solution.category,
        "triguna_balance": solution.triguna_balance,
        "polyvagal_state": solution.polyvagal_state,
        "detected_distortion": solution.detected_distortion,
        "cbt_reframing": solution.cbt_reframing,
        "socratic_questions": solution.socratic_questions,
        "somatic_anchor": solution.somatic_anchor,
        "pranayama_protocol": solution.pranayama_protocol,
        "pranayama_ratio": solution.pranayama_ratio,
        "micro_habit": solution.micro_habit,
        "neuroscience_mechanism": solution.neuroscience_mechanism,
        "audio_text_script": solution.audio_text_script,
        "confidence_score": solution.confidence_score,
        "source_evidence": solution.source_evidence,
    }

    if payload.voice_mode and audio_engine:
        try:
            audio_bytes = await audio_engine.synthesize(solution.audio_text_script, voice="en-US-AriaNeural")
            if audio_bytes:
                result_dict["audio_base64"] = base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as e:
            logger.warning(f"Voice synthesis notice: {e}")

    return result_dict


@app.post("/api/clinical/expand")
async def expand_clinical_knowledge_endpoint(payload: ClinicalExpansionRequest, request: Request):
    """
    Synthesizes and dynamically expands the clinical knowledge base using EIH's own AI.
    Validates schema, persists updates atomically to JSON, computes SHA-256 checksums,
    and updates vector indexing.
    """
    enforce_rate_limit(request)
    if not clinical_expansion_engine:
        raise HTTPException(status_code=503, detail="Clinical expansion engine not initialized")

    res = await clinical_expansion_engine.expand_knowledge_base(
        topic=payload.topic,
        custom_prompt=payload.custom_prompt,
    )

    if cbt_loader:
        cbt_loader.reload()
    if psychology_rag:
        psychology_rag._load_data()
        psychology_rag._init_vector_store()

    return {
        "success": res.success,
        "status": res.status,
        "topic": res.topic,
        "added_conditions": res.added_conditions,
        "added_distortions": res.added_distortions,
        "new_version": res.new_version,
        "checksum_sha256": res.checksum_sha256,
        "details": res.details,
        "timestamp": res.timestamp,
    }


@app.get("/api/clinical/conditions")
async def get_all_clinical_conditions_endpoint():
    """Returns all verified clinical conditions from the knowledge base."""
    if clinical_expansion_engine:
        return clinical_expansion_engine.load_psychology_library()
    if psychology_rag:
        return psychology_rag.get_all_conditions()
    return []


# =========================================================================
# SELF-LEARNING THERAPY & VECTOR CLINICAL MEMORY ENDPOINTS
# =========================================================================

class SelfLearningTherapyRequest(BaseModel):
    user_message: str = Field(..., description="User's input message to the AI psychologist")
    session_id: str = Field(default="default_user", description="Session or patient identifier")


@app.post("/api/therapy")
async def process_therapy(request_data: SelfLearningTherapyRequest, request: Request, background_tasks: BackgroundTasks):
    """
    Core Therapy Loop (Retrieve -> Heal -> Learn):
    1. Query persistent ChromaDB vector clinical memory
    2. Generate empathetic cognitive/somatic response
    3. Asynchronously extract doctor observation & update vector memory in background
    4. Asynchronously discover and index new psychology documents for novel symptoms
    """
    enforce_rate_limit(request)

    # Step A: Retrieve relevant past clinical struggles / insights
    past_context = ""
    if self_learning_therapist:
        past_context = self_learning_therapist.query_clinical_memory(request_data.user_message, n_results=3)

    # Step B: Generate healing response with context
    partner_response = await partner.respond(request_data.user_message)
    ai_reply = partner_response.reply

    # Step C: Trigger background self-learning vector memory extraction
    if self_learning_therapist:
        background_tasks.add_task(
            self_learning_therapist.update_clinical_memory,
            request_data.user_message,
            ai_reply,
            request_data.session_id,
        )

    # Step D: Trigger background psychology document discovery and indexing
    if psychology_rag and request_data.user_message and len(request_data.user_message.strip()) >= 4:
        background_tasks.add_task(
            psychology_rag.learn_document_from_query,
            request_data.user_message.strip(),
        )

    return {
        "reply": ai_reply,
        "emotion": partner_response.detected_emotion,
        "distortion": partner_response.detected_distortion,
        "past_memory_injected": bool(past_context),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/voice")
@app.post("/api/voice")
async def stream_voice(
    request: Request,
    text: str | None = None,
    voice: str | None = None,
    rate: str = "-5%",
):
    """
    Zero-Cost Natural Voice Synthesis streaming via Microsoft Edge Neural TTS.
    Accepts GET query params or POST JSON/FormData payload with robust text sanitization.
    """
    target_text = text
    target_voice = voice or "en-US-AriaNeural"

    if request.method == "POST":
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            try:
                body = await request.json()
                if isinstance(body, dict):
                    target_text = body.get("text") or target_text
                    target_voice = body.get("voice") or target_voice
            except Exception:
                pass
        elif "form" in content_type:
            try:
                form_data = await request.form()
                target_text = form_data.get("text", target_text)
                target_voice = form_data.get("voice", target_voice)
            except Exception:
                pass

    if not target_text or not str(target_text).strip():
        raise HTTPException(status_code=400, detail="Missing text parameter for speech synthesis")

    clean_text = sanitize_text_for_speech(str(target_text))
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text contained no speakable characters after sanitization")

    voice_str: str | None = str(target_voice) if target_voice and not isinstance(target_voice, UploadFile) else None

    try:
        audio_bytes = await audio_engine.synthesize_speech_bytes(clean_text, voice=voice_str)
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Voice synthesis returned empty audio")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Type": "audio/mpeg",
                "Content-Length": str(len(audio_bytes)),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice stream error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice synthesis error: {e!s}") from e


# =========================================================================
# CLI & AUTOMATED TEST RUNNER
# =========================================================================

def print_banner():
    print("=" * 72)
    print("[*] KEYLESS HEALER: 100% ZERO-API-KEY CLINICAL VOICE & COGNITIVE SYSTEM")
    print("    PubMed | DuckDuckGo | Faster-Whisper | Edge-TTS | Local Ollama")
    print("=" * 72 + "\n")


async def run_cli_chat():
    print_banner()
    print("Interactive CLI Session. Type what is on your heart. Type 'exit' to quit.\n")

    while True:
        try:
            user_input = input("\n[You] > ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "q"]:
                print("\nWishing you peace and grounded calm. Goodbye.")
                break

            response = await partner.respond(user_input)

            print(f"\n[Companion ({response.provider_used})] ({response.latency_ms}ms)")
            print(f"Emotion: {response.detected_emotion} | Distortion: {response.detected_distortion} | Crisis: {response.is_crisis}")
            print("-" * 55)
            print(response.reply)

            if response.sources:
                print("\n[Grounding Clinical Evidence]:")
                for s in response.sources[:2]:
                    print(f"  • ({s.source.upper()}) {s.title}")
                    print(f"    {s.summary[:130]}...")

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break


async def run_automated_tests():
    print_banner()
    print("--- Running Keyless Healer Test Suite ---")

    test_queries = [
        "I feel completely overwhelmed by my job interview tomorrow",
        "My manager yelled at me in front of everyone and I am so angry",
        "I have been feeling exhausted and unable to sleep for weeks",
        "I failed my exam and I am an absolute idiot and ruined everything",
        "I want to kill myself tonight",
    ]

    for q in test_queries:
        print(f"\nTesting Input: '{q}'")
        res = await partner.respond(q)
        print(f"  -> Emotion: {res.detected_emotion}")
        print(f"  -> Distortion: {res.detected_distortion}")
        print(f"  -> Provider: {res.provider_used}")
        print(f"  -> Crisis Flag: {res.is_crisis}")
        print(f"  -> Latency: {res.latency_ms}ms")
        print(f"  -> Reply: {res.reply[:100]}...")
        assert len(res.reply) > 20, "Reply must not be empty"

    # Test Audio Engine Status
    status = audio_engine.get_status()
    print(f"\nAudio Engine Status: {status['tts_primary']} & {status['stt_engine']}")
    assert status["zero_api_key"] is True

    # Test Speech Synthesis (Edge TTS)
    print("\nTesting Edge-TTS Speech Synthesis...")
    audio = await audio_engine.synthesize("Clinical neuro-affective synthesis validation.")
    print(f"  -> Generated Speech Audio: {len(audio)} bytes")
    assert len(audio) > 500, "TTS audio must contain audio bytes"

    print("\n" + "=" * 72)
    print("[SUCCESS] ALL KEYLESS HEALER TESTS PASSED (100%)")
    print("=" * 72)


def main():
    parser = argparse.ArgumentParser(description="Keyless Healer Server & CLI")
    parser.add_argument(
        "command",
        nargs="?",
        default="serve",
        choices=["serve", "cli", "chat", "test"],
        help="Command to run: 'serve' (default), 'cli' / 'chat', or 'test'",
    )
    parser.add_argument("--cli", action="store_true", help="Launch interactive CLI chat session")
    parser.add_argument("--test", action="store_true", help="Run automated self-tests")
    parser.add_argument("--host", default="127.0.0.1", help="Server host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Server port (default: 8000)")

    args = parser.parse_args()

    if args.test or args.command == "test":
        asyncio.run(run_automated_tests())
    elif args.cli or args.command in ["cli", "chat"]:
        asyncio.run(run_cli_chat())
    else:
        print_banner()
        print(f"Starting Keyless Healer FastAPI Server on http://{args.host}:{args.port}")
        is_dev = os.environ.get("ENV", "development") == "development"
        uvicorn.run("keyless_healer.app:app", host=args.host, port=args.port, reload=is_dev)


if __name__ == "__main__":
    main()
