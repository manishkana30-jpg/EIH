"""
keyless_healer/lib/gita_rag.py
Bhagavad Gita Cognitive Therapy Engine & ChromaDB Vector Store.
Detects existential dilemmas, moral confusion, and decision paralysis,
retrieving relevant Shlokas and executing the 4-phase therapeutic pipeline.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

logger = logging.getLogger("GitaLibraryRAG")

try:
    import chromadb
except ImportError:
    chromadb = None  # type: ignore[assignment]

DILEMMA_KEYWORDS = [
    # English
    r"\bdilemma\b",
    r"\bconfus(ed|ion)\b",
    r"\bparaly(sis|zed)\b",
    r"\bdecision\b",
    r"\btorn between\b",
    r"\bcannot decide\b",
    r"\bcan't decide\b",
    r"\bwhat should i do\b",
    r"\bwhich path\b",
    r"\bright path\b",
    r"\bright decision\b",
    r"\bwrong decision\b",
    r"\baction or inaction\b",
    r"\bmeaning of (my )?life\b",
    r"\bpurpose of (my )?life\b",
    r"\bduty\b",
    r"\bmoral conflict\b",
    r"\bexistential\b",
    r"\bhelpless\b",
    r"\bstuck in life\b",
    # Hindi / Hinglish
    r"\bkya kar(u|oon|e)\b",
    r"\bdharamsankat\b",
    r"\bdharmasankat\b",
    r"\bsamajh nahi aa raha\b",
    r"\bkuch samajh nahi\b",
    r"\basmanjas\b",
    r"\bkartavya\b",
    r"\bkaun sa rasta\b",
    r"\bmujhe kya karna chahiye\b",
    r"क्या करूं",
    r"क्या करूँ",
    r"धर्मसंकट",
    r"असमंजस",
    r"कर्तव्य",
    r"दुविधा",
]

DILEMMA_PATTERN = re.compile("|".join(DILEMMA_KEYWORDS), re.IGNORECASE)


def detect_existential_dilemma(text: str) -> bool:
    """Detects whether user is experiencing an existential dilemma, moral confusion, or decision paralysis."""
    if not text or not text.strip():
        return False
    return bool(DILEMMA_PATTERN.search(text.lower()))


class GitaLibraryRAG:
    """RAG interface for querying the 'gita_library' collection in ChromaDB."""

    def __init__(self, db_path: str = "./clinical_memory_db"):
        self.db_path = db_path
        self.chroma_client: Any = None
        self.collection: Any = None
        self._init_collection()

    def _init_collection(self) -> None:
        if not chromadb:
            return
        try:
            os.makedirs(self.db_path, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=self.db_path)
            self.collection = self.chroma_client.get_or_create_collection(
                name="gita_library",
                metadata={"description": "Bhagavad Gita Psychological Wisdom & Shloka RAG"},
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collection 'gita_library': {e}")
            self.collection = None

    def query_wisdom(self, query_text: str, n_results: int = 1) -> dict[str, Any] | None:
        """Queries the gita_library for the most clinically applicable Shloka."""
        if not self.collection:
            self._init_collection()

        if not self.collection:
            # Fallback static BG 2.47
            return {
                "id": "bg_2_47",
                "chapter": "2",
                "verse": "47",
                "theme": "Outcome Detachment / Decision Paralysis",
                "shloka_sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
                "shloka_roman": "karmaṇy-evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ||",
                "philosophical_meaning": "You have a right only to perform your prescribed duty, but never to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to inaction.",
                "clinical_reframe": "Shift locus of control from unpredictable future outcomes to present-moment action. Relieve performance anxiety and decision paralysis by focusing 100% on the process rather than agonizing over hypothetical consequences."
            }

        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results,
            )
            if results and results.get("metadatas") and len(results["metadatas"][0]) > 0:
                meta = results["metadatas"][0][0]
                return {
                    "id": results["ids"][0][0] if results.get("ids") else "bg_shloka",
                    "chapter": meta.get("chapter", "2"),
                    "verse": meta.get("verse", "47"),
                    "theme": meta.get("theme", "Spiritual Wisdom"),
                    "shloka_sanskrit": meta.get("shloka_sanskrit", ""),
                    "shloka_roman": meta.get("shloka_roman", ""),
                    "philosophical_meaning": meta.get("philosophical_meaning", ""),
                    "clinical_reframe": meta.get("clinical_reframe", ""),
                }
        except Exception as err:
            logger.warning(f"Error querying gita_library: {err}")

        return None

    def format_gita_context(self, wisdom: dict[str, Any]) -> str:
        """Formats the retrieved Shloka into a prompt context block."""
        return (
            f"Bhagavad Gita Chapter {wisdom.get('chapter')}, Verse {wisdom.get('verse')} ({wisdom.get('theme')}):\n"
            f"[SANSKRIT]:\n{wisdom.get('shloka_sanskrit')}\n"
            f"[ROMAN]:\n{wisdom.get('shloka_roman')}\n"
            f"[MEANING]: {wisdom.get('philosophical_meaning')}\n"
            f"[CLINICAL REFRAME]: {wisdom.get('clinical_reframe')}"
        )


gita_rag = GitaLibraryRAG()


def build_gita_system_prompt(retrieved_gita_wisdom: str, target_locale: str = "en-US", rag_context: str = "") -> str:
    """Builds the 3-pillar therapeutic prompt pipeline enforcing Gita + Clinical + Tratak interlinked solutions."""
    lang_directive = ""
    loc_lower = (target_locale or "en-US").lower()
    if loc_lower.startswith("hi") or "hindi" in loc_lower or "in" in loc_lower:
        lang_directive = "\n\nProvide the explanations in natural, empathetic Hindi (हिंदी), while keeping the Sanskrit Shloka in Devanagari script."
    elif loc_lower.startswith("es"):
        lang_directive = "\n\nProvide the explanations in fluent, empathetic Spanish (Español)."

    return f"""You are an Expert Clinical Psychologist and Spiritual Master integrating Modern Neuropsychology (CBT & Polyvagal Somatics) with the sacred wisdom of the Bhagavad Gita and Tratak (Ocular Meditation).

For the user's specific situation, you MUST formulate your response with all 3 solutions line-by-line, each deeply interlinked with their exact struggle:

**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**
- Include the exact relevant Sanskrit Shloka wrapped inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags, followed by its Roman transliteration and Chapter & Verse.
- Explain the philosophical meaning.
- Provide a Clinical Reflection explaining how this ancient wisdom applies directly to their modern struggle.
- Actionable Guidance (Karma): What to do right now, and what mental trap to avoid.

**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**
- Compassionately validate their distress.
- Identify the active cognitive distortion and provide an evidence-based CBT cognitive reframe.
- Prescribe an immediate Somatic Polyvagal grounding exercise (e.g. physiological sigh or vagal brake).

**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**
- Prescribe the specific Sacred Gazing mode suited to their autonomic state (Bindu, Jyoti, Mandala, Pratibimb, or Shoonya).
- Explain the neuro-ocular calming mechanism and provide step-by-step gaze guidance.

[RETRIEVED WISDOM]:
{retrieved_gita_wisdom}

{rag_context}
{lang_directive}"""


def synthesize_gita_response(
    user_query: str,
    wisdom: dict[str, Any],
    locale: str = "en-US",
    rag_guidance: dict[str, Any] | None = None,
    rec_trataka: str = "bindu"
) -> str:
    """Deterministic fallback synthesis generating all 3 solutions line-by-line without external latency."""
    shloka_san = wisdom.get("shloka_sanskrit", "")
    shloka_rom = wisdom.get("shloka_roman", "")
    meaning = wisdom.get("philosophical_meaning", "")
    reframe = wisdom.get("clinical_reframe", "")
    ch = wisdom.get("chapter", "2")
    vs = wisdom.get("verse", "47")

    sols = rag_guidance.get("solutions", {}) if rag_guidance else {}
    cbt_text = sols.get("cbt_reframing", "Notice how your mind catastrophizes the unknown. Shift attention to what is objectively true in front of you right now.")
    somatic_text = sols.get("somatic_anchor", "Perform 3 deep physiological sighs (two quick inhales through the nose, long sighing exhale through the mouth).")
    pranayama_text = sols.get("pranayama", "Nadi Shodhana (Alternate Nostril Breathing) for 3 minutes.")

    trataka_name_map = {
        "bindu": "Bindu Trataka (Sacred Golden Focal Point)",
        "flame": "Jyoti Trataka (Candle Flame Gazing)",
        "murti": "Mandala Trataka (Sacred Geometry Resonance)",
        "pratibimb": "Pratibimb Trataka (Sacred Mirror Gazing)",
        "shoonya": "Shoonya Trataka (Void & Panoramic Space Gazing)"
    }
    t_name = trataka_name_map.get(rec_trataka, "Bindu Trataka (Sacred Golden Focal Point)")

    return (
        f"[GITA_SHLOKA]\n"
        f"{shloka_san}\n\n"
        f"{shloka_rom}\n"
        f"— श्रीमद्भगवद्गीता (Chapter {ch}, Verse {vs})\n"
        f"[/GITA_SHLOKA]\n\n"
        f"**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**\n"
        f"• **Philosophical Meaning:** {meaning}\n"
        f"• **Clinical Reflection:** {reframe}\n"
        f"• **Actionable Guidance (Karma):** Focus 100% on the single highest-integrity action you can take right now. Release attachment to results you cannot control.\n\n"
        f"**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**\n"
        f"• **Cognitive Restructuring:** {cbt_text}\n"
        f"• **Somatic Polyvagal Reset:** {somatic_text} alongside {pranayama_text}\n\n"
        f"**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान - {t_name}):**\n"
        f"• **Focal Gaze:** Hold a soft, unblinking gaze at eye level for 2 to 3 minutes.\n"
        f"• **Neuro-Ocular Mechanism:** Motionless saccadic fixation down-regulates amygdala hyperactivity and activates the cardiac vagal brake.\n"
        f"• **Practice Closure:** Rub your palms vigorously until warm and cup them gently over closed eyes (Palming)."
    )
