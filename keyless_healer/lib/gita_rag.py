"""
keyless_healer/lib/gita_rag.py
Bhagavad Gita Cognitive Therapy RAG Module & Dilemma Router.
Queries persistent ChromaDB collection 'gita_library' to resolve
decision paralysis, moral dilemmas, existential confusion, and grief.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

logger = logging.getLogger("GitaRAG")

try:
    import chromadb
except ImportError:
    chromadb = None


DILEMMA_KEYWORDS = [
    r"\b(dilemma|decision\s+paralysis|can'?t\s+decide|cannot\s+decide|confused\s+about\s+what\s+to\s+do)\b",
    r"\b(which\s+(path|choice|way|direction|option)|torn\s+between|crossroads|stuck\s+at\s+crossroads)\b",
    r"\b(what\s+should\s+i\s+do|what\s+am\s+i\s+supposed\s+to\s+do|how\s+do\s+i\s+choose)\b",
    r"\b(morally\s+wrong|right\s+thing\s+to\s+do|right\s+choice|ethical\s+dilemma|my\s+duty|dharma)\b",
    r"\b(purpose\s+of\s+life|meaning\s+of\s+life|why\s+am\s+i\s+here|existential\s+crisis)\b",
    r"\b(paralyzed\s+by\s+fear|fear\s+of\s+failure|afraid\s+of\s+making\s+a\s+mistake|regret\s+my\s+decision)\b",
    r"\b(gita|bhagavad\s*gita|krishna|arjuna|karmanye|shloka|karma\s+yoga)\b",
    r"\b(outcome\s+anxiety|attached\s+to\s+results|what\s+if\s+it\s+fails|loss\s+of\s+direction)\b",
    r"\b(duvidha|kya\s+karun|kya\s+karu|samajh\s+nahi\s+aa\s+raha|faisla|nirnay|dharma)\b",
    r"\b(दुविधा|निर्णय|क्या\s+करूं|कर्तव्य|धर्म|गीता|कर्म|श्लोक)\b",
]

DILEMMA_COMPILED = [re.compile(p, re.IGNORECASE) for p in DILEMMA_KEYWORDS]


def detect_existential_dilemma(text: str) -> bool:
    """
    Detects if the user is experiencing existential dilemma, decision paralysis,
    moral conflict, or identity confusion.
    """
    if not text or not text.strip():
        return False
    t = text.strip()
    for pattern in DILEMMA_COMPILED:
        if pattern.search(t):
            return True
    return False


class GitaLibraryRAG:
    """Manages vector retrieval from the ChromaDB 'gita_library' collection."""

    def __init__(self, db_path: str = "./clinical_memory_db") -> None:
        self.db_path = db_path
        self.chroma_client: Any = None
        self.collection: Any = None
        self._init_vector_store()

    def _init_vector_store(self) -> None:
        if not chromadb:
            logger.warning("chromadb not installed; GitaLibraryRAG vector search unavailable.")
            return

        candidates = [
            self.db_path,
            os.path.abspath("clinical_memory_db"),
            os.path.abspath("../clinical_memory_db"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "clinical_memory_db"),
        ]

        found_path = None
        for c in candidates:
            if os.path.exists(c):
                found_path = c
                break

        target_path = found_path or self.db_path
        try:
            self.chroma_client = chromadb.PersistentClient(path=target_path)
            self.collection = self.chroma_client.get_or_create_collection(name="gita_library")
            count = self.collection.count()
            logger.info(f"Connected to 'gita_library' collection at '{target_path}' (count: {count}).")
        except Exception as e:
            logger.error(f"Error initializing Gita ChromaDB collection at '{target_path}': {e}")
            self.collection = None

    def retrieve_shloka(self, query: str) -> dict[str, Any] | None:
        """
        Retrieves the most semantically relevant Bhagavad Gita shloka for the user query.
        """
        if not self.collection or self.collection.count() == 0:
            return None

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=1
            )

            if results and results.get("metadatas") and len(results["metadatas"][0]) > 0:
                meta = results["metadatas"][0][0]
                doc_id = results["ids"][0][0] if results.get("ids") else "GITA"
                return {
                    "id": doc_id,
                    "chapter": meta.get("chapter"),
                    "verse": meta.get("verse"),
                    "theme": meta.get("theme"),
                    "shloka_sanskrit": meta.get("shloka_sanskrit"),
                    "shloka_roman": meta.get("shloka_roman"),
                    "philosophical_meaning": meta.get("philosophical_meaning"),
                    "clinical_reframe": meta.get("clinical_reframe"),
                    "karma_action": meta.get("karma_action"),
                }
        except Exception as e:
            logger.error(f"Gita query error: {e}")

        return None

    def format_gita_prompt_context(self, shloka: dict[str, Any]) -> str:
        """
        Builds the 4-phase therapeutic prompt injection for the LLM.
        Enforces output with [GITA_SHLOKA] tags, direct meaning, clinical reflection, and Karma.
        """
        return f"""### BHAGAVAD GITA COGNITIVE THERAPY DIRECTIVE (ACTIVE EXISTENTIAL DILEMMA DETECTED):
The user is navigating a deep psychological dilemma, decision paralysis, or moral struggle.
You must ground your guidance in this authentic Bhagavad Gita cognitive reframe:

[RETRIEVED_GITA_SHLOKA]:
Chapter {shloka.get('chapter')}, Verse {shloka.get('verse')} - Theme: {shloka.get('theme')}
Sanskrit:
{shloka.get('shloka_sanskrit')}
Transliteration:
{shloka.get('shloka_roman')}
Philosophical Meaning:
{shloka.get('philosophical_meaning')}
Clinical Reframe:
{shloka.get('clinical_reframe')}
Karma Directive:
{shloka.get('karma_action')}

### MANDATORY 4-STEP GITA RESPONSE STRUCTURE:
Your output MUST adhere strictly to the following 4-step sequence:
1. Wrap the exact Sanskrit Devanagari verse followed immediately by its Roman transliteration within [GITA_SHLOKA] and [/GITA_SHLOKA] tags:
   [GITA_SHLOKA]
   {shloka.get('shloka_sanskrit')}
   {shloka.get('shloka_roman')}
   [/GITA_SHLOKA]
2. Direct Philosophical Meaning: In 1-2 clear, compassionate sentences, explain the timeless meaning of the verse without academic jargon.
3. Clinical Reflection: Directly connect this philosophical insight to the user's specific dilemma or paralysis, reframing their cognitive distortion.
4. Actionable Karma: Conclude with a concrete Karma directive (what to do vs. what NOT to do) to mobilize their agency and decision-making right now."""


# Global Singleton
gita_rag = GitaLibraryRAG()
