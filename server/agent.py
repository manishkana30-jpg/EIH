"""
server/agent.py

LiveKit Real-Time Voice Agent for Emotional Intelligence Healer (v2.0)
Synthesizes Sattvavajaya Chikitsa, CBT Cognitive Reframing & Polyvagal Theory.

Key Architecture:
1. Silero VAD configured with 950ms silence patience (accommodates emotional pauses, sighs, tears)
   and 300ms prefix padding (captures speech onset).
2. Two-Stage Pre-Generation Cognitive Analysis Pass before LLM response generation.
3. LiveKit Data Channel telemetry publishing for real-time Cowen-27 emotion updates.
4. Deterministic crisis risk interception.
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Ensure workspace root is resolvable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.cognitive_orchestrator import run_cognitive_analysis
from server.guardrails.actions import check_crisis_risk
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
    voice,
)
from livekit.agents.llm.tool_context import StopResponse
from livekit.plugins import cartesia, deepgram, openai, silero
from server.prompts.therapeutic_persona import THERAPEUTIC_PERSONA_PROMPT

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eih-voice-agent")


class HealerAgent(voice.Agent):
    """
    Therapeutic Voice Agent synthesizing Sattvavajaya Chikitsa & Polyvagal Theory.
    Executes a structured pre-generation analysis pass before LLM text generation and streaming TTS.
    """

    def __init__(
        self,
        user_metadata: dict[str, Any],
        vad_plugin: Any,
        stt_plugin: Any,
        llm_plugin: Any,
        tts_plugin: Any,
        room: Any = None,
    ) -> None:
        super().__init__(
            instructions=THERAPEUTIC_PERSONA_PROMPT,
            vad=vad_plugin,
            stt=stt_plugin,
            llm=llm_plugin,
            tts=tts_plugin,
            allow_interruptions=True,  # Immediate Barge-In enabled
        )
        self.user_metadata = user_metadata
        self.room = room

    async def on_user_turn_completed(
        self, turn_ctx: llm.ChatContext, new_message: llm.ChatMessage
    ) -> None:
        user_text = new_message.text_content or ""
        logger.info(f"[VoiceAgent] User turn completed: {user_text}")

        # 1. Deterministic Crisis Check BEFORE AI Pipeline
        is_crisis, deflection = check_crisis_risk(user_text)
        if is_crisis:
            logger.warning(f"[VoiceAgent] CRISIS TRIGGER DETECTED: {user_text}")
            if self.session:
                self.session.say(deflection, allow_interruptions=False)
            raise StopResponse()

        # 2. Stage 1: Structured Pre-Generation Cognitive Analysis Pass
        user_cbt_profile = self.user_metadata.get("cognitiveProfile")
        analysis = await run_cognitive_analysis(user_text, user_profile=user_cbt_profile)

        # 3. Publish Live 27-D Emotion & Diagnostic Telemetry to Frontend Data Channel
        try:
            session_obj = getattr(self, "session", None)
            target_room = getattr(self, "room", None) or (getattr(session_obj, "room", None) if session_obj else None)
            if target_room and getattr(target_room, "local_participant", None):
                telemetry_payload = json.dumps({
                    "type": "EMOTION_UPDATE",
                    "dominant_emotions": analysis.get("dominant_emotions", []),
                    "cbt_distortions": analysis.get("cbt_distortions", []),
                    "polyvagal_state": analysis.get("polyvagal_state", "ventral_vagal"),
                    "somatic_cues": analysis.get("somatic_cues", []),
                    "intervention_priority": analysis.get("intervention_priority", "validate"),
                    "scores": analysis.get("top_3_cowen_emotions", []),
                    "dominant": (
                        analysis.get("top_3_cowen_emotions", [{}])[0].get("name", "Calmness")
                    ),
                    "cbt": analysis.get("cbt_distortion"),
                    "polyvagal": analysis.get("polyvagal_state"),
                    "anchor_phrases": analysis.get("anchor_phrases", []),
                })
                await target_room.local_participant.publish_data(
                    telemetry_payload.encode("utf-8")
                )
                logger.info("[VoiceAgent] Real-time diagnostic telemetry published to data channel.")
        except Exception as e:
            logger.warning(f"[VoiceAgent] Data channel telemetry publish notice: {e}")

        # 4. Stage 2: Merge Enriched Cognitive Context into LLM System Prompt
        enriched_guidance = (
            f"\n[CLINICAL COGNITIVE ANALYSIS FOR CURRENT UTTERANCE]\n"
            f"- User Anchor Words: {', '.join(analysis.get('anchor_phrases', []))}\n"
            f"- Dominant Emotions (Cowen-27): {json.dumps(analysis.get('dominant_emotions', []))}\n"
            f"- Detected Cognitive Distortions: {', '.join(analysis.get('cbt_distortions', []))}\n"
            f"- Polyvagal Tone: {analysis.get('polyvagal_state', 'ventral_vagal')}\n"
            f"- Somatic Cues: {', '.join(analysis.get('somatic_cues', []))}\n"
            f"- Intervention Priority: {analysis.get('intervention_priority', 'validate')}\n"
            f"- Therapeutic Directive: {analysis.get('therapeutic_strategy', 'Validate and ground.')}\n"
            f"Ground your response organically in this analysis without reading out clinical diagnostics."
        )

        messages_list = getattr(turn_ctx, "messages", None)
        if isinstance(messages_list, list):
            try:
                messages_list.append(
                    llm.ChatMessage(role="system", content=[enriched_guidance])  # type: ignore
                )
            except Exception:
                pass


async def entrypoint(ctx: JobContext) -> None:
    logger.info(f"[VoiceAgent] Connecting to LiveKit room: {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Participant Metadata extraction (BYOK API Keys, Cognitive Profile)
    participant = await ctx.wait_for_participant()
    raw_metadata = participant.metadata or "{}"
    try:
        user_metadata = json.loads(raw_metadata)
    except Exception:
        user_metadata = {}

    user_byok_key = user_metadata.get("byokKey") or os.getenv("OPENAI_API_KEY")

    # =========================================================================
    # SILERO VAD CONFIGURATION
    # 950ms silence patience prevents clipping emotional pauses, tears, and sighs.
    # 300ms prefix padding captures speech onset cleanly.
    # =========================================================================
    vad_plugin = silero.VAD.load(
        min_silence_duration=0.95,  # 950ms silence patience threshold
        prefix_padding_duration=0.30,  # 300ms speech onset capture
        activation_threshold=0.45,  # Conservative speech/silence boundary
        sample_rate=16000,
    )

    # Speech-to-Text: Deepgram Nova-3 / Whisper
    stt_plugin = deepgram.STT(
        model="nova-3",
        language=user_metadata.get("languageLocale", "en-US"),
        sample_rate=24000,
    )

    # LLM Engine: BYOK OpenAI GPT-4o / Server Groq Llama 3.3
    if user_byok_key and user_byok_key.startswith(("sk-", "sk-proj-")):
        llm_plugin = openai.LLM(
            model="gpt-4o",
            api_key=user_byok_key,
            temperature=0.7,
        )
    else:
        llm_plugin = openai.LLM(
            model="llama-3.3-70b-versatile",
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY") or "",
            temperature=0.7,
        )

    # Text-to-Speech: Cartesia Sonic Natural Therapeutic Voice
    tts_plugin = cartesia.TTS(
        model="sonic-english",
        voice="f114a946-0e16-4e55-934c-6232d66579f1",  # Calming Warm Empathic Companion
        sample_rate=24000,
    )

    # Initialize and start Healer Agent
    agent = HealerAgent(
        user_metadata=user_metadata,
        vad_plugin=vad_plugin,
        stt_plugin=stt_plugin,
        llm_plugin=llm_plugin,
        tts_plugin=tts_plugin,
        room=ctx.room,
    )

    start_fn = getattr(agent, "start", None)
    session: Any = start_fn(ctx.room, participant) if callable(start_fn) else None

    # Greet user calmly on room join
    if session and hasattr(session, "say"):
        say_task = session.say(
            "I'm here with you. Take all the time you need—I am listening.",
            allow_interruptions=True,
        )
        if asyncio.iscoroutine(say_task) or hasattr(say_task, "__await__"):
            await say_task  # type: ignore


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
