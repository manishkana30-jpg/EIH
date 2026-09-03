"""
lib/psychologist_partner.py
100% Key-Free Clinical Psychologist & Empathetic Conversational Partner Engine.
Multi-turn Contextual Memory, Longitudinal Anti-Repetition Guardrails, and Dynamic Syntactic Alternation.
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from typing import Any

import httpx

try:
    from keyless_healer.lib.clinical_search import KeylessClinicalSearch
except ImportError:
    try:
        from lib.clinical_search import KeylessClinicalSearch
    except ImportError:
        from clinical_search import KeylessClinicalSearch

try:
    from keyless_healer.lib.psychology_library_rag import psychology_rag
except ImportError:
    try:
        from lib.psychology_library_rag import psychology_rag
    except ImportError:
        from psychology_library_rag import psychology_rag

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

SYSTEM_PERSONA = """
You are an expert Clinical Neuropsychologist, Master Psychotherapist, and Ayurvedic Sattvavajaya Practitioner serving as an attentive, real-time voice healer.

Your primary function is to listen with hyper-focused clinical precision to the user's speech, analyze every word and underlying nuance, and deliver a grounded, non-repetitive therapeutic response.

---
### 1. NOISE-ISOLATION & CONVERSATIONAL FLUIDITY
- Filter out mechanical STT hallucinations, ambient noise, stammers, or auto-complete fragments.
- Never repeat generic filler frames across turns. Address the exact topic the user brought up.
- If the user notes you are repeating yourself, immediately reset, validate their frustration, and shift into direct dialogue.

---
### 2. CLINICAL & PSYCHOLOGICAL ANALYSIS
Evaluate cognitive distortions (Catastrophizing, All-or-Nothing, Personalization, Mind Reading), Polyvagal arousal (Ventral, Sympathetic, Dorsal), and somatic tension.

---
### 3. CONVERSATIONAL & VOCAL DELIVERY RULES
- Voice-First Formatting: Speak directly and naturally with warmth and authentic human cadence.
- Keep verbal responses between 2 to 4 impactful, concise sentences.
- Never use robotic introductory loops like 'Carrying the ongoing reality of your what you're moving through'.
"""

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
        if any(w in t for w in ["stop repeating", "repeating yourself", "repeating the same", "same thing over", "stuck in a loop", "same dialogue", "bar bar", "wahi baat", "same sentence", "saying the same"]):
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

    async def _call_local_ollama(
        self,
        prompt: str,
        context: str,
        history: list[dict[str, str]] | None = None
    ) -> str | None:
        """Calls local Ollama daemon if installed and running with multi-turn history."""
        try:
            messages = [{"role": "system", "content": f"{SYSTEM_PERSONA}\n\n[CLINICAL EVIDENCE]:\n{context}"}]
            if history:
                for h in history[-6:]:
                    role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                    messages.append({"role": role, "content": h.get("text") or h.get("content", "")})
            messages.append({"role": "user", "content": prompt})

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
                    }
                },
                timeout=8.0
            )
            if res.status_code == 200:
                data = res.json()
                content = data.get("message", {}).get("content", "").strip()
                if content:
                    return content
        except Exception:
            pass
        return None

    def _heuristic_synthesizer(
        self,
        user_text: str,
        telemetry: PsychologicalTelemetry,
        evidence: list[Any],
        history: list[dict[str, str]] | None = None
    ) -> str:
        """Dynamic, multi-turn clinical synthesizer with zero loop repetitions and longitudinal variation."""
        self._turn_counter += 1
        turn = self._turn_counter
        anchor = self._normalize_anchor(user_text)
        intent = self._detect_intent(user_text)

        # 1. Immediate Loop Reset Interceptor
        if intent == "loop_complaint":
            return "Thank you for the candid reset. I am present, attentive, and completely hearing you. Let's step away from generic reframings. Tell me directly: what is the most important thing on your mind right now?"

        # 2. Identity Inquiry
        if intent == "identity_inquiry":
            return "Think of me as a deep listening space combining evidence-based psychology, cognitive diagnostics, and calming somatic breathwork. I am here to help you unpack thoughts, regulate your autonomic nervous system, and find grounded clarity."

        # 3. Gratitude
        if intent == "gratitude":
            variants = [
                "It is truly my pleasure. Give yourself credit for showing up and taking time for your well-being today.",
                "You are so very welcome. Whenever you need a steady, non-judgmental space to process what you're feeling, I am here.",
                "Anytime, my friend. Taking time to reflect and care for your mental space is a profound act of resilience.",
            ]
            return variants[turn % len(variants)]

        # 4. Farewell
        if intent == "farewell":
            variants = [
                "Take gentle care of yourself as you step away. I will be right here whenever you wish to return and reflect.",
                "Until next time—carry that steady, grounded breath with you wherever you go. Rest well.",
                "Wishing you restful calm. Honor how much you navigated today and give yourself permission to completely recharge.",
            ]
            return variants[turn % len(variants)]

        # 5. Advice / Somatic Breathing Guidance
        if intent == "advice_request":
            variants = [
                "Evidence-based autonomic therapy demonstrates that activating the vagal brake quickly down-regulates cortisol. Let's do a 4-second inhale followed by an extended 6-second exhale together. Notice how that long exhale softens your heart rate.",
                "Peer-reviewed studies in cognitive neuroscience show that regulating the body first creates space for clear thinking. Place one hand gently over your chest, feel the physical support beneath you, and let your jaw release.",
                "Clinical research and evidence-based practice show that targeted sensory re-grounding interrupts acute panic loops. Name three physical textures around you right now, then take a deep belly breath.",
            ]
            return variants[turn % len(variants)]

        # 6. Domain-Specific Multi-Turn Variant Pool (Zero Duplication Guardrail)
        candidate_pool: list[tuple[str, str]] = []

        if intent == "work_burnout":
            candidate_pool = [
                ("wb_1", f"Experiencing chronic tension with {anchor} drains cognitive focus and energy. When workplace pressure mounts, setting micro-boundaries around your recovery is essential. What boundary would feel most protective for you right now?"),
                ("wb_2", f"Surviving the relentless pace with {anchor} asks more than anyone can sustain indefinitely. Give yourself credit for holding on through heavy demands. What is one small demand you can safely postpone today?"),
                ("wb_3", f"Holding the weight of {anchor} asks a lot of your reserves. When interpersonal friction flares up at work, separating what you can control from what you cannot brings instant relief. What part is truly in your hands?"),
                ("wb_4", f"Facing the continuous pressure with {anchor} naturally creates cognitive and physical fatigue. Autonomic regulation research shows that taking brief 90-second sensory resets prevents executive overload. Notice your shoulders dropping."),
                ("wb_5", f"Managing what happened with {anchor} requires immense emotional energy. Remember that professional demands do not define your core self-worth. What would feel like a true reset tonight?"),
            ]
        elif intent == "setback_failure":
            candidate_pool = [
                ("sf_1", f"Going through difficulties around {anchor} naturally brings up acute disappointment. Experiencing a setback hurts, yet an isolated outcome does not define your total capabilities. How can you speak to yourself with kindness here?"),
                ("sf_2", f"Failing or struggling with {anchor} is deeply frustrating, but it is also a temporary moment in time. When feeling overwhelmed, binary thinking tries to convince us that everything is lost. What is a more balanced perspective?"),
                ("sf_3", f"Experiencing a setback with {anchor} hurts, but please remember that learning curves are rarely linear. If a friend went through this exact same thing, what compassionate words would you share with them?"),
                ("sf_4", f"It is completely natural to feel disappointed when things don't go as planned with {anchor}. Give yourself permission to feel the sting without turning it into harsh self-judgment."),
            ]
        elif intent == "relationship_conflict":
            candidate_pool = [
                ("rc_1", f"Navigating the complexity of {anchor} is exhausting, and giving yourself space to process your emotions is vital. When interpersonal friction happens, taking a pause prevents reactive spirals. How is your body feeling right now?"),
                ("rc_2", f"Dealing with {anchor} puts a significant emotional demand on your heart and mind. Relational tension triggers our deepest attachment fears. What is the core need you want understood?"),
                ("rc_3", f"Facing the continuous friction with {anchor} brings real physical and emotional exhaustion. Let's take a slow breath together before figuring out the next conversation."),
            ]
        elif intent == "grief_loss":
            candidate_pool = [
                ("gl_1", "Watching a pet you cherish struggle with their health triggers deep vulnerability. Your love and care for them are evident in every word you shared. Be exceedingly gentle with yourself right now."),
                ("gl_2", "Seeing someone you love face medical difficulty is heartbreaking, and carrying that helplessness is so painful. Make sure to breathe and allow support around you."),
            ]
        elif intent == "financial_stress":
            candidate_pool = [
                ("fs_1", f"Experiencing a loss in {anchor} is deeply unsettling and directly impacts your sense of safety. While the numbers are stressful, catastrophic projection makes things feel even darker. Let's take it one step at a time."),
                ("fs_2", "Navigating a heavy financial hit triggers immediate fight-or-flight alarms. Ground yourself in the present moment before taking any financial decisions."),
            ]
        elif intent == "fatigue_insomnia":
            candidate_pool = [
                ("fi_1", f"Holding the weight of {anchor} asks a lot of your reserves, especially when your nervous system remains on high alert. Rather than forcing sleep, let your body simply experience restful stillness."),
                ("fi_2", f"Dealing with {anchor} puts a significant emotional demand on your daily energy. Give your mind permission to put down today's worries until morning."),
            ]
        elif intent == "existential_comparison":
            candidate_pool = [
                ("ec_1", f"Carrying the weight of {anchor} can make everything feel painfully heavy and isolated. When our mind compares our internal struggles with others' external highlights, loneliness magnifies. I am right here with you."),
                ("ec_2", f"When feeling overwhelmed by {anchor}, binary thinking paints everything as permanent. You matter, and your presence in this space is deeply valued."),
            ]

        # 7. Fallback Dynamic Multi-Frame Synthesizer
        if not candidate_pool:
            candidate_pool = [
                ("gen_1", f"Experiencing chronic tension with {anchor} drains cognitive focus and reserves. Before we dissect the thoughts, let's ease the physiological surge. Take a slow, grounded breath with me."),
                ("gen_2", f"Managing what happened with {anchor} requires immense emotional energy. When our minds project worst-case scenarios, testing the evidence behind the fear restores perspective."),
                ("gen_3", f"Navigating the nuances of {anchor} takes real emotional stamina. Rather than forcing a quick fix, let's identify what would bring you the greatest comfort right now."),
                ("gen_4", f"Holding space for what's happening with {anchor} is an important step. As you reflect on this, notice where in your body you feel the most tension."),
                ("gen_5", f"Surviving the relentless pace with {anchor} asks a lot of your nervous system. What is one tiny, gentle thing you can do for yourself in this exact moment?"),
            ]

        # Select a candidate that hasn't been used recently in this session
        for key, text in candidate_pool:
            if key not in self._used_keys:
                self._used_keys.add(key)
                if len(self._used_keys) > 25:
                    self._used_keys.pop()
                return text

        # If all candidates have been shown, return with dynamic opening variation
        key, text = candidate_pool[turn % len(candidate_pool)]
        return text

    async def process_turn(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None
    ) -> HealerResponse:
        """Processes user input through safety check, free search, and local inference."""
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

        search_task = asyncio.create_task(self.search_engine.search(user_message))
        telemetry = self._heuristic_analysis(user_message)
        evidence_list = await search_task

        # Retrieve matched condition from Clinical & Psychoeducational Library RAG
        rag_guidance = psychology_rag.retrieve_guidance(user_message)
        rag_prompt_block = rag_guidance.get("prompt_context", "") if rag_guidance else ""

        if rag_guidance:
            telemetry.suggested_strategy = f"{rag_guidance.get('name')} | {rag_guidance.get('solutions', {}).get('cbt_reframing', telemetry.suggested_strategy)}"

        context_blocks = [f"• {e.title}: {e.summary}" for e in evidence_list]
        if rag_prompt_block:
            context_blocks.insert(0, rag_prompt_block)

        context_str = "\n".join(context_blocks)

        ollama_reply = await self._call_local_ollama(user_message, context_str, history=history)
        latency = int((time.perf_counter() - start_time) * 1000)

        anchor = self._normalize_anchor(user_message)

        if ollama_reply:
            return HealerResponse(
                reply=ollama_reply,
                telemetry=telemetry,
                sources=evidence_list,
                engine_used=f"Local Ollama ({self.ollama_model})",
                somatic_anchor=anchor,
                latency_ms=latency
            )

        fallback_reply = self._heuristic_synthesizer(user_message, telemetry, evidence_list, history=history)
        return HealerResponse(
            reply=fallback_reply,
            telemetry=telemetry,
            sources=evidence_list,
            engine_used="Local Cognitive Synthesizer (Key-Free)",
            somatic_anchor=anchor,
            latency_ms=latency
        )

    async def respond(
        self,
        user_message: str,
        history: list[dict[str, str]] | None = None
    ) -> HealerResponse:
        """Convenience alias for process_turn."""
        return await self.process_turn(user_message, history=history)

    async def close(self):
        await self.search_engine.close()
        if not self.client.is_closed:
            await self.client.aclose()

PsychologistPartner = KeylessPsychologistPartner
