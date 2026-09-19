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


def build_gita_system_prompt(retrieved_gita_wisdom: str, target_locale: str = "en-US") -> str:
    """Builds the 4-phase therapeutic prompt pipeline enforcing strict Shloka sequence."""
    lang_directive = ""
    loc_lower = (target_locale or "en-US").lower()
    if loc_lower.startswith("hi") or "hindi" in loc_lower or "in" in loc_lower:
        lang_directive = "\n\nProvide the explanations (Steps 2, 3, 4) in natural, empathetic Hindi (हिंदी), while keeping the Sanskrit Shloka in Devanagari in Step 1."
    elif loc_lower.startswith("es"):
        lang_directive = "\n\nProvide the explanations (Steps 2, 3, 4) in fluent, empathetic Spanish (Español)."

    return f"""You are an Expert Spiritual Psychologist integrating modern CBT with the ancient wisdom of the Bhagavad Gita. The user is facing a deep dilemma or emotional confusion.

Your goal is to shift them from paralysis to purpose-driven action using this retrieved wisdom:
[GITA CONTEXT]: {retrieved_gita_wisdom}

You MUST structure your response strictly in these 4 steps. Do not add introductory filler.

1. THE SHLOKA: Output the retrieved Sanskrit Shloka beautifully in Devanagari, followed by its Roman transliteration. Wrap the entire Shloka block inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags.
2. THE MEANING: Provide the direct, profound meaning of the Shloka.
3. THE CLINICAL REFLECTION: Deeply analyze the user's specific situation. Explain exactly how this ancient wisdom applies to their current modern dilemma, validating their confusion.
4. THE KARMA (GUIDANCE): Give them clear, actionable guidance on what to do and what NOT to do right now to handle the situation perfectly and live happily. Shift their focus from the outcome to their immediate duty.{lang_directive}"""


def synthesize_gita_response(user_query: str, wisdom: dict[str, Any], locale: str = "en-US") -> str:
    """Deterministic fallback synthesis following the 4-phase therapeutic sequence without LLM latency."""
    shloka_san = wisdom.get("shloka_sanskrit", "")
    shloka_rom = wisdom.get("shloka_roman", "")
    meaning = wisdom.get("philosophical_meaning", "")
    reframe = wisdom.get("clinical_reframe", "")
    ch = wisdom.get("chapter", "2")
    vs = wisdom.get("verse", "47")

    return (
        f"[GITA_SHLOKA]\n"
        f"{shloka_san}\n\n"
        f"{shloka_rom}\n"
        f"— श्रीमद्भगवद्गीता (Chapter {ch}, Verse {vs})\n"
        f"[/GITA_SHLOKA]\n\n"
        f"**1. THE MEANING:**\n"
        f"{meaning}\n\n"
        f"**2. THE CLINICAL REFLECTION:**\n"
        f"You are experiencing understandable friction because you are trying to solve an unpredictable future from a place of uncertainty. {reframe}\n\n"
        f"**3. THE KARMA (ACTIONABLE GUIDANCE):**\n"
        f"• **What to do:** Focus solely on the single highest-integrity next step right in front of you today. Align with your values rather than trying to guarantee an outcome.\n"
        f"• **What NOT to do:** Stop replaying catastrophic 'what-if' scenarios in your mind. Release attachment to results you cannot control, and take mindful action."
    )
