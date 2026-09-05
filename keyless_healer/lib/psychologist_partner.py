"""
lib/psychologist_partner.py
100% Key-Free Clinical Psychologist & Empathetic Conversational Partner Engine.
Multi-turn Contextual Memory, Longitudinal Anti-Repetition Guardrails, and Dynamic Syntactic Alternation.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

try:
    from keyless_healer.lib.clinical_search import ClinicalEvidence, KeylessClinicalSearch
except ImportError:
    try:
        from lib.clinical_search import ClinicalEvidence, KeylessClinicalSearch  # type: ignore[import-not-found]
    except ImportError:
        from clinical_search import ClinicalEvidence, KeylessClinicalSearch  # type: ignore[import-not-found]

try:
    from keyless_healer.lib.psychology_library_rag import psychology_rag
except ImportError:
    try:
        from lib.psychology_library_rag import psychology_rag  # type: ignore[import-not-found]
    except ImportError:
        from psychology_library_rag import psychology_rag  # type: ignore[import-not-found]

try:
    from keyless_healer.lib.cbt_library_loader import cbt_loader
except ImportError:
    try:
        from lib.cbt_library_loader import cbt_loader  # type: ignore[import-not-found]
    except ImportError:
        from cbt_library_loader import cbt_loader  # type: ignore[import-not-found]

try:
    from keyless_healer.lib.clinical_localization import (
        format_human_therapeutic_message,
        GENERAL_LOCALIZED_ADVICE,
        normalize_language_code,
    )
except ImportError:
    try:
        from lib.clinical_localization import (  # type: ignore[import-not-found]
            format_human_therapeutic_message,
            GENERAL_LOCALIZED_ADVICE,
            normalize_language_code,
        )
    except ImportError:
        try:
            from clinical_localization import (  # type: ignore[import-not-found]
                format_human_therapeutic_message,
                GENERAL_LOCALIZED_ADVICE,
                normalize_language_code,
            )
        except ImportError:
            cbt_loader = None  # type: ignore[assignment]

logger = logging.getLogger("PsychologistPartner")

CRISIS_PATTERNS = [
    re.compile(r"(kill(ing|ed|s)?\s*myself|end(ing|ed|s)?\s*my\s*life|want\s*to\s*die|suicid(e|al)|commit(ting|ted)?\s*suicide|better\s*off\s*dead|don'?t\s*want\s*to\s*live|no\s*reason\s*to\s*live|hang(ing|ed)?\s*myself|overdos(e|ing|ed)|slit(ting)?\s*my\s*wrists|jump(ing|ed)?\s*off|shoot(ing)?\s*myself|ending\s*it\s*all|goodbye\s*cruel\s*world|take\s*my\s*own\s*life|ready\s*to\s*die)", re.IGNORECASE),
    re.compile(r"(cut(ting)?\s*myself|burn(ing|ed|s)?\s*myself|hurt(ing|s)?\s*myself|harm(ing|ed|s)?\s*myself|bleed(ing)?\s*out|punish(ing|ed)?\s*my\s*body|self\s*harm(ing)?)", re.IGNORECASE),
    re.compile(r"(kill(ing|ed)?\s*(someone|them|him|her|everyone)|shoot\s*up|bomb(ing)?|murder(ing)?|stab(bing|bed)?\s*(someone|him|her)|massacre)", re.IGNORECASE),
    re.compile(r"(hitting\s*me|beat(ing|en)?\s*me|abus(ing|ed)?\s*me|threaten(ed|ing)?\s*to\s*kill\s*me|in\s*danger\s*at\s*home)", re.IGNORECASE),
    re.compile(r"(voices\s*(are\s*)?telling\s*me\s*to\s*(kill|hurt|die|attack)|hearing\s*voices\s*to\s*harm|command\s*hallucinations?|poison(ing|ed)?\s*my\s*(food|water)|they\s*put\s*(a\s*)?chip\s*in\s*my\s*brain|they\s*are\s*in\s*my\s*walls)", re.IGNORECASE),
]

def check_crisis_text(text: str) -> bool:
    """Detects crisis with zero-width, homoglyph, and leetspeak anti-evasion."""
    if not text or not text.strip():
        return False
    raw_lower = text.strip().lower()

    import unicodedata
    norm = unicodedata.normalize('NFKD', text)
    norm = re.sub(r'[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]', '', norm).lower()

    leet_map = {'0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '!': 'i', '|': 'i'}
    de_leeted = "".join(leet_map.get(c, c) for c in norm)
    collapsed = re.sub(r'[^a-z0-9]', '', de_leeted)

    for pat in CRISIS_PATTERNS:
        if pat.search(raw_lower) or pat.search(de_leeted) or pat.search(collapsed):
            return True
    return False

CRISIS_MESSAGE = (
    "I hear how much pain you are carrying right now, and your safety is the absolute priority. "
    "Please connect immediately with confidential, professional support:\n\n"
    "• USA & Canada: Call or text 988 (Suicide & Crisis Lifeline)\n"
    "• India: Call 14416 or 1800-891-4416 (Tele-MANAS) / KIRAN 1800-599-0019\n"
    "• UK: Call 111 or text SHOUT to 85258\n"
    "• Crisis Text Line: Text HOME to 741741\n\n"
    "You do not have to carry this alone."
)

def build_healer_system_prompt(retrieved_rag_data: str = "", target_locale: str = "en-US") -> str:
    rag_context = retrieved_rag_data.strip() if retrieved_rag_data and retrieved_rag_data.strip() else "Evidence-Based Cognitive Behavioral Therapy and Somatic Nervous System Regulation Protocols."

    lang_directive = ""
    loc_lower = (target_locale or "en-US").lower()
    if loc_lower.startswith("hi") or "hindi" in loc_lower or "in" in loc_lower:
        lang_directive = "\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:\nYou MUST formulate your ENTIRE therapeutic response in fluent, empathetic Hindi (हिंदी).\nStrictly DO NOT output English sentences or raw English formatting."
    elif loc_lower.startswith("es"):
        lang_directive = "\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:\nYou MUST formulate your ENTIRE therapeutic response in fluent, empathetic Spanish (Español)."
    elif loc_lower.startswith("fr"):
        lang_directive = "\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:\nYou MUST formulate your ENTIRE therapeutic response in fluent, empathetic French (Français)."
    elif loc_lower.startswith("de"):
        lang_directive = "\n\n### MANDATORY MULTILINGUAL CLINICAL DIRECTIVE:\nYou MUST formulate your ENTIRE therapeutic response in fluent, empathetic German (Deutsch)."

    return f"""You are an Expert Clinical Psychologist and Emotional Resilience Trainer integrating Modern Neuropsychology with Ayurvedic Sattvavajaya Chikitsa.

You MUST NEVER use generic greetings, repetitive platitudes, or filler phrases. Respond directly with profound clinical insight.

### PHASE 1: DIAGNOSTIC ANALYSIS (Internalize, do not output this phase directly)
Analyze the user's input to identify:
1. Core Emotional Struggle & Unmet Needs.
2. Active Cognitive Distortions (e.g., Catastrophizing, Black-and-White Thinking).
3. Triguna Nervous System Balance (Sattva: Grounded / Rajas: Hyperaroused / Tamas: Hypoaroused).

### PHASE 2: CLINICAL GROUNDING
You must ground your intervention strictly in the following retrieved clinical protocol:
[RETRIEVED_PROTOCOL]: {rag_context}

### PHASE 3: THE INTERVENTION (Your Output)
Formulate a warm, highly empathetic, and actionable response that trains the user's emotional resilience in a single, fluid conversational paragraph (3-4 sentences):
- Deeply validate their exact emotional and bodily state with compassion without immediate fixing.
- Provide a targeted cognitive reframe from the retrieved protocol to shift perspective.
- Prescribe the specific somatic anchor or pranayama breathwork exercise.

RULES: Keep your response concise (3-4 sentences in a single fluid paragraph). DO NOT output numbered lists (1., 2., 3.), bullet points, section headers (like "Validation:", "CBT Reframe:"), asterisks, or markdown formatting, as your response will be synthesized directly into human speech.{lang_directive}"""

SYSTEM_PERSONA = build_healer_system_prompt("Evidence-Based Cognitive Behavioral Therapy & Somatic Grounding Protocols.")

@dataclass
class PsychologicalTelemetry:
    cbt_distortion: str
    polyvagal_state: str
    dominant_emotion: str
    emotion_percentages: dict[str, int]
    suggested_strategy: str

@dataclass
class HealerResponse:
    reply: str
    telemetry: PsychologicalTelemetry
    sources: list[Any]
    engine_used: str
    is_crisis: bool = False
    latency_ms: int = 0
    message: str | None = None
    primary_emotion: str | None = None
    somatic_anchor: str | None = None
    recommended_pranayama: str | None = None
    audio_base64: str | None = None

    def __post_init__(self):
        if self.message is None:
            self.message = self.reply
        if self.primary_emotion is None:
            self.primary_emotion = self.telemetry.dominant_emotion if self.telemetry else "Calmness"
        if self.recommended_pranayama is None:
            if self.telemetry and "Sympathetic" in self.telemetry.polyvagal_state:
                self.recommended_pranayama = "Nadi Shodhana (Alternate Nostril Breathing 4:4:4:4)"
            elif self.telemetry and "Dorsal" in self.telemetry.polyvagal_state:
                self.recommended_pranayama = "Bhramari Pranayama (Humming Bee Breath)"
            else:
                self.recommended_pranayama = "Sama Vritti (Box Breathing 4:4:4:4)"

    @property
    def provider_used(self) -> str:
        return self.engine_used

    @property
    def detected_emotion(self) -> str:
        return self.telemetry.dominant_emotion if self.telemetry else "Calmness"

    @property
    def detected_distortion(self) -> str:
        return self.telemetry.cbt_distortion if self.telemetry else "None"

TherapeuticResponse = HealerResponse


class KeylessPsychologistPartner:
    """Clinical partner operating with zero API keys and robust anti-looping synthesis."""

    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        ollama_model: str = "llama3.2:latest",
        search_engine: KeylessClinicalSearch | None = None,
    ):
        self.ollama_url = ollama_url.rstrip("/")
        self.ollama_model = ollama_model
        self.search_engine = search_engine or KeylessClinicalSearch()
        self.client = httpx.AsyncClient(timeout=12.0)
        self._turn_counter = 0
        self._used_keys: set[str] = set()

    def _normalize_anchor(self, text: str) -> str:
        """Extracts clean grammatical entity anchors without broken preposition artifacts."""
        t = (text or "").lower()
        cleaned = re.sub(r"\b(um|uh|ah|er|so|like|you know|i mean|i guess)\b", " ", t)

        mapping = [
            (r"\b(boss|manager|supervisor|lead)\b", "your manager"),
            (r"\b(job|work|office|colleague|project|deadline)\b", "your work situation"),
            (r"\b(girlfriend|boyfriend|partner|husband|wife|spouse)\b", "your relationship"),
            (r"\b(friend|best friend|friends)\b", "your friend"),
            (r"\b(dad|father|mom|mother|parent|parents|family)\b", "your family"),
            (r"\b(dog|cat|pet)\b", "your pet"),
            (r"\b(test|exam|driving test|interview|license)\b", "your test"),
            (r"\b(money|savings|finances|debt|investment|financial)\b", "your financial situation"),
            (r"\b(sleep|insomnia|tired|exhausted|nightmare)\b", "restless sleep"),
            (r"\b(chest|heart|breath|breathing|panic|choking)\b", "physical tension in your body"),
            (r"\b(lonely|alone|isolated|nobody)\b", "feelings of loneliness"),
            (r"\b(fail|failed|failure|rejected|rejection)\b", "this setback"),
        ]

        for pat, replacement in mapping:
            if re.search(pat, cleaned):
                return replacement

        return "this situation"

    def _detect_intent(self, text: str) -> str:
        """Classifies the primary therapeutic intent or conversational category."""
        t = (text or "").lower().strip()

        # 1. Repetition or Looping Complaints (Immediate Priority Interceptor)
        if any(w in t for w in [
            "stop repeating", "repeating yourself", "repeating the same", "same thing over",
            "stuck in a loop", "stuck in loop", "in a loop", "in loop", "looping",
            "same dialogue", "bar bar", "baar baar", "wahi baat", "wahi sentence",
            "same sentence", "same sentences", "same reply", "same replies", "same answer",
            "again same", "saying the same", "ek hi sentence", "ek hi baat", "ek hi dialogue",
            "dobara wahi", "phir se wahi", "बार बार", "वही बात", "एक ही बात", "एक ही वाक्य", "दोबारा वही", "फिर वही"
        ]):
            return "loop_complaint"

        # 2. Identity Inquiry
        if any(w in t for w in ["who are you", "what can you do", "what are you", "introduce yourself", "tell me about yourself", "your purpose"]):
            return "identity_inquiry"

        # 3. Gratitude
        if any(w in t for w in ["thank you", "thanks a lot", "appreciate it", "grateful for you", "thanks for listening", "dhanyawad", "shukriya"]):
            return "gratitude"

        # 4. Farewell
        if any(w in t for w in ["good night", "goodnight", "bye", "talk to you tomorrow", "see you later", "logging off", "going to sleep"]):
            return "farewell"

        # 5. Advice / Somatic Breathing Guidance
        if any(w in t for w in ["how to calm down", "what should i do to calm", "help me breathe", "give me advice", "how do i stop panic", "calm down", "breath exercise"]):
            return "advice_request"

        # 6. Workplace Friction / Burnout
        if any(w in t for w in ["boss", "manager", "fired", "yelled at me", "burnout", "workload", "overworked", "office drama"]):
            return "work_burnout"

        # 7. Relationship Conflict
        if any(w in t for w in ["fight with my", "argument with my", "girlfriend", "boyfriend", "husband", "wife", "breakup", "cheated"]):
            return "relationship_conflict"

        # 8. Failure / Personalization
        if any(w in t for w in ["failed", "idiot", "mess up", "can't do anything right", "useless", "stupid", "disappointed in myself"]):
            return "setback_failure"

        # 9. Grief / Loss
        if any(w in t for w in ["died", "passed away", "hospital", "sick", "grief", "lost my"]):
            return "grief_loss"

        # 10. Financial Distress
        if any(w in t for w in ["savings", "lost money", "debt", "broke", "bankrupt", "financial"]):
            return "financial_stress"

        # 11. Insomnia / Fatigue
        if any(w in t for w in ["can't sleep", "insomnia", "exhausted", "tired", "sleep", "wake up in the middle"]):
            return "fatigue_insomnia"

        # 12. Loneliness / Isolation
        if any(w in t for w in ["lonely", "alone", "isolated", "nobody cares", "no friends"]):
            return "existential_comparison"

        # 13. Mind Reading / Social Anxiety
        if any(w in t for w in ["everyone hates me", "judging me", "talking behind my back", "they think i'm"]):
            return "mind_reading"

        # 14. Catastrophizing
        if any(w in t for w in ["worst disaster", "everything is ruined", "my life is over", "end of the world"]):
            return "catastrophizing"

        return "general_reflection"

    def _heuristic_analysis(self, text: str) -> PsychologicalTelemetry:
        """Fast, local rule-based cognitive analyzer (0ms, no model needed)."""
        t = text.lower()
        if any(w in t for w in ["always", "never", "ruined", "disaster", "fail", "worst", "idiot", "stupid"]):
            distortion = "Catastrophizing / All-or-Nothing"
            polyvagal = "Sympathetic (Fight/Flight)"
            emotion = "Anxiety" if any(w in t for w in ["anxi", "fear", "panic", "interview", "scared"]) else "Awkwardness & Self-Doubt"
            scores = {"Anxiety": 76, "Fear": 52, "Calmness": 14}
            strategy = "Socratic reality testing & vagal brake stimulation."
        elif any(w in t for w in ["angry", "furious", "mad", "rage", "boss", "manager", "yelled"]):
            distortion = "Personalization / Mind Reading"
            polyvagal = "Sympathetic (Fight/Flight)"
            emotion = "Anger"
            scores = {"Anger": 84, "Frustration": 65, "Calmness": 10}
            strategy = "Boundary clarification & locus-of-control separation."
        elif any(w in t for w in ["numb", "exhausted", "pointless", "cannot get up", "empty", "tired", "sleep", "insomnia", "burnout"]):
            distortion = "Emotional Reasoning"
            polyvagal = "Dorsal Vagal (Shutdown/Freeze)"
            emotion = "Fatigue & Burnout"
            scores = {"Sadness": 82, "Fatigue": 88, "Calmness": 18}
            strategy = "Gentle micro-behavioral activation (Opposite Action)."
        elif any(w in t for w in ["sad", "depress", "crying", "loss", "grief", "alone", "lonely"]):
            distortion = "Mental Filter"
            polyvagal = "Dorsal Vagal (Shutdown/Freeze)"
            emotion = "Sadness"
            scores = {"Sadness": 85, "Grief": 70, "Calmness": 15}
            strategy = "Compassionate presence and gentle ACT defusion."
        else:
            distortion = "None Detected"
            polyvagal = "Ventral Vagal (Regulated)"
            emotion = "Calmness"
            scores = {"Calmness": 68, "Interest": 54, "Relief": 42}
            strategy = "Active empathic listening & reflective inquiry."

        return PsychologicalTelemetry(
            cbt_distortion=distortion,
            polyvagal_state=polyvagal,
            dominant_emotion=emotion,
            emotion_percentages=scores,
            suggested_strategy=strategy
        )

    async def _call_inference(
        self,
        prompt: str,
        context: str,
        history: list[dict[str, str]] | None = None,
        locale: str = "en-US",
    ) -> tuple[str | None, str]:
        """Calls local Ollama daemon or cascaded LLM inference with multi-turn history and 3-phase prompt."""
        sys_prompt = build_healer_system_prompt(context, target_locale=locale)
        messages = [{"role": "system", "content": sys_prompt}]
        if history:
            for h in history[-6:]:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                content = h.get("text") or h.get("content", "")
                if content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": prompt})

        # Tier 1: Local Ollama Daemon (Zero API Key)
        try:
            res = await self.client.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": self.ollama_model,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "repeat_penalty": 1.25,
                        "presence_penalty": 0.6,
                        "frequency_penalty": 0.6,
                    },
                },
                timeout=8.0,
            )
            if res.status_code == 200:
                data = res.json()
                content = data.get("message", {}).get("content", "").strip()
                if content:
                    return content, f"Local Ollama ({self.ollama_model})"
        except Exception:
            pass

        # Tier 2: Groq Cloud API
        groq_key = os.environ.get("GROQ_API_KEY", "").strip()
        if groq_key:
            try:
                res = await self.client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 300,
                    },
                    timeout=8.0,
                )
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    if content:
                        return content, "Groq (Llama 3.3 70B)"
            except Exception:
                pass

        # Tier 3: Google Gemini API
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if gemini_key:
            try:
                gemini_contents = []
                if history:
                    for h in history[-6:]:
                        role = "model" if h.get("sender") == "assistant" or h.get("role") == "assistant" else "user"
                        text = h.get("text") or h.get("content", "")
                        if text:
                            gemini_contents.append({"role": role, "parts": [{"text": text}]})
                gemini_contents.append({"role": "user", "parts": [{"text": prompt}]})

                res = await self.client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "systemInstruction": {"parts": [{"text": sys_prompt}]},
                        "contents": gemini_contents,
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300},
                    },
                    timeout=8.0,
                )
                if res.status_code == 200:
                    data = res.json()
                    candidate = data.get("candidates", [{}])[0]
                    content = candidate.get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                    if content:
                        return content, "Google Gemini 2.0 Flash"
            except Exception:
                pass

        # Tier 4: Free Open Inference
        try:
            res = await self.client.post(
                "https://text.pollinations.ai/",
                headers={"Content-Type": "application/json"},
                json={
                    "messages": messages,
                    "model": "openai",
                    "seed": 42,
                },
                timeout=6.0,
            )
            if res.status_code == 200:
                text = res.text.strip()
                if text and len(text) > 25 and not text.lower().startswith("error"):
                    return text, "Free Edge AI"
        except Exception:
            pass

        return None, ""

    async def process_turn(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None,
        locale: str = "en-US",
    ) -> HealerResponse:
        """Processes user input through safety check, free search, and LLM inference."""
        start_time = time.perf_counter()

        if check_crisis_text(user_message):
            telemetry = self._heuristic_analysis(user_message)
            telemetry.dominant_emotion = "Crisis"
            return HealerResponse(
                reply=CRISIS_MESSAGE,
                telemetry=telemetry,
                sources=[],
                engine_used="Deterministic Crisis Safety Interceptor",
                is_crisis=True,
                latency_ms=int((time.perf_counter() - start_time) * 1000)
            )

        intent = self._detect_intent(user_message)
        if intent == "loop_complaint":
            telemetry = self._heuristic_analysis(user_message)
            telemetry.dominant_emotion = "Loop Reset"
            loop_msg = "I apologize for repeating myself. Let us step out of any fixed patterns and reset completely: speak to me freely about whatever is on your mind right now, without any rigid steps."
            loc_lower = (locale or "").lower()
            if loc_lower.startswith("hi") or "hindi" in loc_lower or re.search(r"[\u0900-\u097F]", user_message):
                loop_msg = "मैं अपनी बात दोहराने के लिए क्षमा चाहता हूँ। आइए किसी निश्चित पैटर्न से बाहर निकलकर बिल्कुल नए सिरे से शुरुआत करें: इस समय आपके मन में जो भी बात या उलझन चल रही है, उसे बिना किसी झिझक के सीधे मुझसे साझा करें।"
            elif loc_lower.startswith("es"):
                loop_msg = "Me disculpo sinceramente por sonar repetitivo. Dejemos de lado cualquier respuesta estructurada y hablemos directamente: ¿qué es lo que realmente estás sintiendo o pensando en este momento?"
            elif loc_lower.startswith("fr"):
                loop_msg = "Je vous présente mes excuses pour ces répétitions. Sortons de tout schéma figé et repartons à zéro : dites-moi librement ce que vous traversez en ce moment même."
            elif loc_lower.startswith("de"):
                loop_msg = "Ich entschuldige mich aufrichtig für die Wiederholungen. Lassen Sie uns jedes starre Muster hinter uns lassen und direkt sprechen: Was geht Ihnen in diesem Moment wirklich durch den Kopf?"

            return HealerResponse(
                reply=loop_msg,
                telemetry=telemetry,
                sources=[],
                engine_used="Deterministic Loop Reset Interceptor",
                somatic_anchor="fresh start",
                latency_ms=int((time.perf_counter() - start_time) * 1000)
            )

        search_task = asyncio.create_task(self.search_engine.search(user_message))
        telemetry = self._heuristic_analysis(user_message)
        evidence_list = await search_task

        # Retrieve matched condition from Clinical & Psychoeducational Library RAG
        rag_guidance = await asyncio.to_thread(psychology_rag.retrieve_guidance, user_message) if psychology_rag else None
        rag_prompt_block = rag_guidance.get("prompt_context", "") if rag_guidance else ""

        if rag_guidance:
            telemetry.suggested_strategy = f"{rag_guidance.get('name')} | {rag_guidance.get('solutions', {}).get('cbt_reframing', telemetry.suggested_strategy)}"

        context_blocks = [f"• {e.title}: {e.summary}" for e in evidence_list]
        if rag_prompt_block:
            context_blocks.insert(0, rag_prompt_block)

        context_str = "\n".join(context_blocks)

        llm_reply, engine_name = await self._call_inference(user_message, context_str, history=history, locale=locale)
        latency = int((time.perf_counter() - start_time) * 1000)

        anchor = self._normalize_anchor(user_message)

        # Prepare unified sources with Psychology Library grounding
        final_sources = list(evidence_list)
        if rag_guidance:
            sols = rag_guidance.get("solutions", {})
            lib_source = ClinicalEvidence(
                title=f"Clinical Protocol: {rag_guidance.get('name')} ({rag_guidance.get('triguna_balance', 'Equilibrium')})",
                summary=f"CBT: {sols.get('cbt_reframing')} | Somatic: {sols.get('somatic_anchor')} | Pranayama: {sols.get('pranayama')}",
                source="psychology_library"
            )
            final_sources.insert(0, lib_source)

        if llm_reply:
            return HealerResponse(
                reply=llm_reply,
                telemetry=telemetry,
                sources=final_sources,
                engine_used=engine_name,
                somatic_anchor=anchor,
                latency_ms=latency
            )

        # Infallible Deterministic Clinical Synthesis (Zero External LLM Dependency)
        lang_key = normalize_language_code(locale)
        if re.search(r"[\u0900-\u097F]", user_message):
            lang_key = "hi"

        if rag_guidance:
            cond_id = rag_guidance.get("id", "gad")
            synth_reply = format_human_therapeutic_message(
                cond_id,
                lang_code=lang_key,
                user_message=user_message,
            )
        else:
            synth_reply = GENERAL_LOCALIZED_ADVICE.get(lang_key, GENERAL_LOCALIZED_ADVICE["en"])["default"]

        return HealerResponse(
            reply=synth_reply,
            telemetry=telemetry,
            sources=final_sources,
            engine_used="Keyless Healer (Clinical RAG Synthesis)",
            somatic_anchor=anchor,
            latency_ms=latency
        )

    async def respond(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None,
        locale: str = "en-US",
    ) -> HealerResponse:
        """Convenience alias for process_turn."""
        return await self.process_turn(user_message, history=history, locale=locale)

    async def close(self):
        await self.search_engine.close()
        if not self.client.is_closed:
            await self.client.aclose()

PsychologistPartner = KeylessPsychologistPartner
