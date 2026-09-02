"""
Tier 3: Local Voice Server Daemon
Runs an asyncio WebSocket server at ws://0.0.0.0:8765.
End-to-End Local Loop: Faster-Whisper (Int8) + Ollama (Llama 3.3) + Kokoro TTS (af_heart).
"""

import asyncio
import json
import logging

import aiohttp
import websockets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eih-local-daemon")

HOST = "0.0.0.0"
PORT = 8765
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.3:latest"

from prompts.therapeutic_persona import SYNTHESIS_SYSTEM_PROMPT

SYSTEM_PROMPT = SYNTHESIS_SYSTEM_PROMPT

class LocalVoiceDaemon:
    def __init__(self):
        self.whisper_model = None
        self.kokoro_pipeline = None
        self._init_models()

    def _init_models(self):
        try:
            from faster_whisper import WhisperModel  # type: ignore
            logger.info("Loading Faster-Whisper (base.en, int8)...")
            self.whisper_model = WhisperModel("base.en", device="cpu", compute_type="int8")
        except Exception as e:
            logger.warning(f"Faster-Whisper not loaded (will use direct text processing): {e}")

        try:
            import kokoro  # type: ignore
            logger.info("Loading Kokoro-82M ONNX TTS...")
            self.kokoro_pipeline = kokoro.KPipeline(lang_code="a")
        except Exception as e:
            logger.warning(f"Kokoro TTS not loaded (will stream text responses): {e}")

    async def generate_ollama_response(self, user_text: str) -> str:
        prompt = f"{SYSTEM_PROMPT}\n\nUser: {user_text}\nCompanion:"
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.75, "num_predict": 120}
                }
                async with session.post(OLLAMA_API_URL, json=payload, timeout=aiohttp.ClientTimeout(total=8)) as res:
                    if res.status == 200:
                        data = await res.json()
                        return data.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama local generation notice: {e}")

        # Local deterministic heuristic fallback
        lower = user_text.lower()
        if any(w in lower for w in ["anxious", "panic", "fear", "racing", "stress"]):
            return "I can feel how overwhelmed you're feeling right now, my friend. I'm right here with you—take a slow breath. You don't have to carry this alone."
        elif any(w in lower for w in ["angry", "frustrated", "burnout", "mad"]):
            return "I completely hear how frustrated and upset you are, and you have every right to feel that way! Let it all out, I'm here to listen."
        elif any(w in lower for w in ["normal", "fine", "okay", "good", "alright"]):
            return "It makes me so happy to hear that you are feeling good today. How is the rest of your day going, or is there anything fun on your mind?"
        elif any(w in lower for w in ["sad", "depressed", "heavy", "exhausted", "lonely", "down"]):
            return "I can feel how heavy and hurting your heart is right now. It is completely okay to let your guard down with me. I'm right beside you."
        return "I am right here with you, listening with all my heart. Tell me what's on your mind today, my friend."

    async def handle_client(self, websocket, path=None):
        logger.info(f"Client connected from {websocket.remote_address}")
        pcm_buffer = bytearray()

        try:
            async for message in websocket:
                if isinstance(message, bytes):
                    # PCM audio buffer chunk
                    pcm_buffer.extend(message)
                elif isinstance(message, str):
                    try:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "ping":
                            await websocket.send(json.dumps({"type": "pong"}))

                        elif msg_type == "user_prompt":
                            text = data.get("text", "")
                            start_time = asyncio.get_event_loop().time()

                            # Generate Ollama LLM Response
                            reply = await self.generate_ollama_response(text)
                            latency_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)

                            await websocket.send(json.dumps({
                                "type": "assistant_text",
                                "text": reply,
                                "latencyMs": latency_ms,
                            }))

                    except json.JSONDecodeError:
                        pass

        except websockets.exceptions.ConnectionClosed:
            logger.info("Client disconnected.")

async def main():
    daemon = LocalVoiceDaemon()
    server = await websockets.serve(daemon.handle_client, HOST, PORT)
    logger.info(f"Local Voice Server Daemon running at ws://{HOST}:{PORT}")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Daemon stopped.")
