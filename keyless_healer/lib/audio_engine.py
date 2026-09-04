"""
lib/audio_engine.py
Free Speech-to-Text (faster-whisper) & Free Text-to-Speech (edge-tts + pyttsx3).
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import re
import tempfile
from typing import TYPE_CHECKING, Any

# STT: faster-whisper
if TYPE_CHECKING:
    from faster_whisper import WhisperModel
else:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        WhisperModel = None

# TTS: edge-tts (Neural Cloud Voice - No Key Required)
try:
    import edge_tts
except ImportError:
    edge_tts = None

# TTS Fallback: pyttsx3 (Native OS Voice Engine - 100% Offline)
try:
    import pyttsx3
except ImportError:
    pyttsx3 = None

logger = logging.getLogger("AudioEngine")

# Voice options for Microsoft Edge Neural TTS across global geographic regions
VOICE_CATALOG = {
    "en": "en-US-AriaNeural",
    "en-us": "en-US-AriaNeural",
    "en-gb": "en-GB-SoniaNeural",
    "en-in": "en-IN-NeerjaNeural",
    "en-au": "en-AU-NatashaNeural",
    "en-ca": "en-CA-ClaraNeural",
    "hi": "hi-IN-SwaraNeural",
    "hi-in": "hi-IN-SwaraNeural",
    "es": "es-ES-ElviraNeural",
    "es-es": "es-ES-ElviraNeural",
    "es-mx": "es-MX-DaliaNeural",
    "es-us": "es-US-PalomaNeural",
    "fr": "fr-FR-DeniseNeural",
    "fr-fr": "fr-FR-DeniseNeural",
    "fr-ca": "fr-CA-SylvieNeural",
    "de": "de-DE-KatjaNeural",
    "de-de": "de-DE-KatjaNeural",
    "zh": "zh-CN-XiaoxiaoNeural",
    "zh-cn": "zh-CN-XiaoxiaoNeural",
    "zh-tw": "zh-TW-HsiaoChenNeural",
    "ja": "ja-JP-NanamiNeural",
    "ja-jp": "ja-JP-NanamiNeural",
    "ar": "ar-SA-ZariyahNeural",
    "ar-sa": "ar-SA-ZariyahNeural",
    "pt": "pt-BR-FranciscaNeural",
    "pt-br": "pt-BR-FranciscaNeural",
    "pt-pt": "pt-PT-RaquelNeural",
    "it": "it-IT-ElsaNeural",
    "it-it": "it-IT-ElsaNeural",
    "ru": "ru-RU-SvetlanaNeural",
    "ru-ru": "ru-RU-SvetlanaNeural",
    "ko": "ko-KR-SunHiNeural",
    "ko-kr": "ko-KR-SunHiNeural",
    "tr": "tr-TR-EmelNeural",
    "tr-tr": "tr-TR-EmelNeural",
    "nl": "nl-NL-ColetteNeural",
    "pl": "pl-PL-ZofiaNeural",
    "vi": "vi-VN-HoaiMyNeural",
    "th": "th-TH-PremwadeeNeural",
    "id": "id-ID-GadisNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-in": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "te-in": "te-IN-ShrutiNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bn-in": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "gu-in": "gu-IN-DhwaniNeural",
    "mr": "mr-IN-AarohiNeural",
    "mr-in": "mr-IN-AarohiNeural",
}

def get_voice_for_locale(locale_or_code: str | None = None) -> str:
    """Resolves highest-fidelity regional neural voice for detected geo locale or language code."""
    if not locale_or_code:
        return "en-US-AriaNeural"
    clean = locale_or_code.strip().lower().replace("_", "-")
    if clean in VOICE_CATALOG:
        return VOICE_CATALOG[clean]
    # Check language prefix before hyphen e.g. "hi-IN" -> "hi"
    lang_prefix = clean.split("-")[0]
    if lang_prefix in VOICE_CATALOG:
        return VOICE_CATALOG[lang_prefix]
    for key, voice in VOICE_CATALOG.items():
        if clean.startswith(key):
            return voice
    return "en-US-AriaNeural"


def sanitize_text_for_speech(text: str) -> str:
    """
    Cleans raw LLM/RAG text for speech engines (Edge-TTS / pyttsx3).
    Removes Markdown, HTML, emojis, brackets, citations, and symbols that cause SSML errors.
    """
    if not text:
        return ""

    # 1. Strip code blocks and inline code
    cleaned = re.sub(r"```[\s\S]*?```", "", text)
    cleaned = re.sub(r"`.*?`", "", cleaned)

    # 2. Strip Markdown links [label](url) -> label
    cleaned = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", cleaned)

    # 3. Strip bracketed RAG/Metadata tags like [CLINICAL & PSYCHOEDUCATIONAL LIBRARY RAG CONTEXT] or [gad]
    cleaned = re.sub(r"\[[a-zA-Z0-9_\s\-&:]+\]:?", "", cleaned)

    # 4. Strip Markdown headers and stray hashes
    cleaned = re.sub(r"#+", "", cleaned)

    # 5. Strip Markdown bold, italics, strikethrough, underline
    cleaned = re.sub(r"\*\*([^*]+)\*\*", r"\1", cleaned)
    cleaned = re.sub(r"\*([^*]+)\*", r"\1", cleaned)
    cleaned = re.sub(r"__([^_]+)__", r"\1", cleaned)
    cleaned = re.sub(r"_([^_]+)_", r"\1", cleaned)
    cleaned = re.sub(r"~~([^~]+)~~", r"\1", cleaned)

    # 6. Strip bullet point symbols, numbering lists, and blockquotes
    cleaned = re.sub(r"^[\s\t]*[•\-\*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"(?:^|(?<=[.:;?!]))\s*\d+\.\s+", " ", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^>\s*", "", cleaned, flags=re.MULTILINE)

    # 7. Convert XML/HTML entities and clean brackets that break SSML
    cleaned = cleaned.replace("&amp;", " and ").replace("&", " and ")
    cleaned = cleaned.replace("<", " ").replace(">", " ")
    cleaned = cleaned.replace("{", " ").replace("}", " ")
    cleaned = cleaned.replace("[", " ").replace("]", " ")
    cleaned = cleaned.replace("|", ", ")

    # 8. Strip emojis and non-alphanumeric pictographs (preserve multi-language unicode characters)
    cleaned = re.sub(r"[\U00010000-\U0010ffff]", "", cleaned)
    cleaned = re.sub(r"[\u2600-\u27bf]", "", cleaned)
    cleaned = re.sub(r"[\u2022\u2023\u25E6\u2043\u2219]", "", cleaned)

    # 9. Normalize whitespace, ellipsis, and sentence breaks
    cleaned = re.sub(r"\n+", ". ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    cleaned = re.sub(r"\.{2,}", ".", cleaned)
    cleaned = re.sub(r"\s+([.,!?;:])", r"\1", cleaned)

    return cleaned.strip()


class FreeAudioEngine:
    """Provides local STT and high-quality neural TTS without API keys."""

    def __init__(self, whisper_model_size: str = "tiny.en", default_voice: str = "en-US-AriaNeural"):
        self.default_voice = default_voice
        self.whisper_model_size = whisper_model_size
        self._stt_model: WhisperModel | None = None

    def _get_stt_model(self) -> WhisperModel:
        """Lazy-load the Whisper model into RAM/CPU."""
        if self._stt_model is None:
            if WhisperModel is None:
                raise RuntimeError("faster-whisper is not installed. Run 'pip install faster-whisper'")
            logger.info(f"Loading local Whisper STT model '{self.whisper_model_size}'...")
            self._stt_model = WhisperModel(self.whisper_model_size, device="cpu", compute_type="int8")
        return self._stt_model

    # ---------------------------------------------------------
    # SPEECH-TO-TEXT (STT)
    # ---------------------------------------------------------
    async def transcribe_audio_bytes(self, audio_bytes: bytes, file_format: str = "wav") -> str:
        """Transcribes raw audio bytes using local faster-whisper on CPU."""
        if not audio_bytes or len(audio_bytes) < 50:
            return ""

        def _transcribe():
            with tempfile.NamedTemporaryFile(suffix=f".{file_format}", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                model = self._get_stt_model()
                try:
                    segments, _ = model.transcribe(
                        tmp_path,
                        beam_size=1,
                        language="en",
                        temperature=0.0,
                        condition_on_previous_text=False,
                        vad_filter=True,
                        vad_parameters={"threshold": 0.5, "min_silence_duration_ms": 300},
                    )
                except TypeError:
                    segments, _ = model.transcribe(
                        tmp_path,
                        beam_size=1,
                        language="en",
                        temperature=0.0,
                        condition_on_previous_text=False,
                        vad_filter=True,
                    )
                transcript = " ".join([segment.text for segment in segments]).strip()
                return transcript
            except Exception as e:
                logger.error(f"Whisper transcription error: {e}")
                return ""
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        return await asyncio.to_thread(_transcribe)

    async def transcribe(self, audio_bytes: bytes, language: str | None = "en") -> str:
        """Convenience alias for transcribe_audio_bytes."""
        return await self.transcribe_audio_bytes(audio_bytes, file_format="webm")

    # ---------------------------------------------------------
    # TEXT-TO-SPEECH (TTS)
    # ---------------------------------------------------------
    async def synthesize_speech_bytes(self, text: str, voice: str | None = None) -> bytes:
        """Synthesizes text into MP3 audio bytes using edge-tts (or pyttsx3 fallback)."""
        if not text or not text.strip():
            return b""

        clean_text = sanitize_text_for_speech(text)
        if not clean_text:
            return b""

        # Cap text length to prevent Edge-TTS timeout on huge payloads
        if len(clean_text) > 1800:
            last_period = clean_text[:1800].rfind(".")
            if last_period > 1000:
                clean_text = clean_text[:last_period + 1]
            else:
                clean_text = clean_text[:1800]

        selected_voice = voice or self.default_voice

        # 1. Primary TTS: edge-tts (High quality neural voice)
        if edge_tts is not None:
            try:
                communicate = edge_tts.Communicate(clean_text, selected_voice, rate="-5%", pitch="-2Hz")
                mp3_buffer = io.BytesIO()
                async for chunk in communicate.stream():
                    if chunk.get("type") == "audio" and "data" in chunk and isinstance(chunk["data"], (bytes, bytearray)):
                        mp3_buffer.write(chunk["data"])
                mp3_buffer.seek(0)
                audio_data = mp3_buffer.read()
                if len(audio_data) > 0:
                    return audio_data
            except Exception as err:
                logger.warning(f"edge-tts failed: {err}. Falling back to pyttsx3...")

        # 2. Secondary TTS: pyttsx3 (Local OS Engine fallback)
        def _pyttsx3_synthesize():
            if pyttsx3 is None:
                return b""
            try:
                engine = pyttsx3.init()
                engine.setProperty("rate", 160)
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    tmp_path = tmp.name
                engine.save_to_file(clean_text, tmp_path)
                engine.runAndWait()
                with open(tmp_path, "rb") as f:
                    data = f.read()
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                return data
            except Exception as e:
                logger.error(f"pyttsx3 fallback error: {e}")
                return b""

        return await asyncio.to_thread(_pyttsx3_synthesize)

    async def synthesize(self, text: str, voice: str | None = None) -> bytes:
        """Convenience alias for synthesize_speech_bytes."""
        return await self.synthesize_speech_bytes(text, voice=voice)

    def get_status(self) -> dict[str, Any]:
        """Returns audio engine status."""
        return {
            "stt_engine": f"Faster-Whisper ({self.whisper_model_size}, int8 CPU)",
            "tts_primary": "Microsoft Edge Neural TTS (edge-tts)",
            "tts_fallback": "pyttsx3 (Offline OS Speech)",
            "available_voices": list(VOICE_CATALOG.keys()),
            "whisper_loaded": self._stt_model is not None,
            "zero_api_key": True,
        }


# Compatibility alias
AudioEngine = FreeAudioEngine
