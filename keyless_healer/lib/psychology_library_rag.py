"""
keyless_healer/lib/psychology_library_rag.py
ChromaDB Vector Search & RAG Module for the Clinical & Psychoeducational Library.
Indexes clinical conditions and retrieves targeted CBT, Somatic, and Pranayama protocols.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger("PsychologyLibraryRAG")

try:
    import chromadb
except ImportError:
    chromadb = None


class PsychologyLibraryRAG:
    """Manages vector indexing and retrieval for clinical psychology conditions."""

    def __init__(self, db_path: str = "./clinical_memory_db") -> None:
        self.db_path = db_path
        self.chroma_client: Any = None
        self.collection: Any = None
        self.library_data: list[dict[str, Any]] = []
        self._load_data()
        self._init_vector_store()

    def _find_data_file(self) -> str:
        candidates = [
            os.path.abspath("data/psychology_library.json"),
            os.path.abspath("../data/psychology_library.json"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "psychology_library.json"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "psychology_library.json"),
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return candidates[0]

    def _load_data(self) -> None:
        file_path = self._find_data_file()
        if os.path.exists(file_path):
            try:
                with open(file_path, encoding="utf-8") as f:
                    self.library_data = json.load(f)
                logger.info(f"Loaded {len(self.library_data)} conditions from '{file_path}'.")
            except Exception as e:
                logger.error(f"Error reading psychology library file {file_path}: {e}")
                self.library_data = []
        else:
            logger.warning(f"Psychology library data file not found at '{file_path}'.")
            self.library_data = []

    def _init_vector_store(self) -> None:
        if not chromadb or not self.library_data:
            return

        try:
            os.makedirs(self.db_path, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=self.db_path)
            self.collection = self.chroma_client.get_or_create_collection(
                name="psychology_library",
                metadata={"description": "Clinical & Psychoeducational Library Conditions"},
            )

            # Upsert all loaded conditions into ChromaDB collection
            existing_count = self.collection.count()
            if existing_count != len(self.library_data):
                documents: list[str] = []
                metadatas: list[Any] = []
                ids: list[str] = []

                for item in self.library_data:
                    doc_text = (
                        f"Condition: {item.get('name')}\n"
                        f"Category: {item.get('category')}\n"
                        f"Triguna: {item.get('triguna_balance')}\n"
                        f"Symptoms: {', '.join(item.get('core_symptoms', []))}\n"
                        f"Cognitive Traps: {', '.join(item.get('cognitive_distortions', []))}\n"
                        f"CBT Reframing: {item.get('solutions', {}).get('cbt_reframing', '')}\n"
                        f"Somatic Anchor: {item.get('solutions', {}).get('somatic_anchor', '')}\n"
                        f"Pranayama: {item.get('solutions', {}).get('pranayama', '')}\n"
                        f"Micro Habit: {item.get('solutions', {}).get('micro_habit', '')}"
                    )
                    documents.append(doc_text)
                    metadatas.append({
                        "id": str(item.get("id", "")),
                        "name": str(item.get("name", "")),
                        "category": str(item.get("category", "")),
                        "triguna": str(item.get("triguna_balance", "")),
                        "severity": str(item.get("severity_level", "")),
                    })
                    ids.append(f"cond_{item.get('id')}")

                self.collection.upsert(documents=documents, metadatas=metadatas, ids=ids)
                logger.info(f"Indexed {len(ids)} clinical condition documents in ChromaDB.")
        except Exception as e:
            logger.warning(f"ChromaDB initialization notice for psychology library: {e}")

    def get_all_conditions(self) -> list[dict[str, Any]]:
        return self.library_data

    def get_condition_by_id(self, condition_id: str) -> dict[str, Any] | None:
        for c in self.library_data:
            if c.get("id") == condition_id:
                return c
        return None

    def retrieve_guidance(self, query: str, top_k: int = 1) -> dict[str, Any] | None:
        """Retrieves best matching clinical condition and actionable solution protocols."""
        if not query or not query.strip():
            return None

        clean_query = query.strip().lower()

        # 1. Semantic Vector Search via ChromaDB
        if self.collection:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=top_k,
                )
                if results and results.get("metadatas") and len(results["metadatas"][0]) > 0:
                    matched_meta = results["metadatas"][0][0]
                    matched_id = matched_meta.get("id")
                    condition = self.get_condition_by_id(matched_id)
                    if condition:
                        return self._format_retrieval_result(condition)
            except Exception as e:
                logger.debug(f"ChromaDB query fallback triggered: {e}")

        # 2. Lexical, Symptom & Multi-lingual Domain Pattern Fallback Matcher
        domain_patterns = {
            "gad": r"\b(worry|worrying|worried|what if|anxious|anxiety|nervous|tense|restless|dread|ghabrahat|chinta|bechaini|tanaav|ansiedad|angst)\b",
            "burnout_fatigue": r"\b(burnout|burned out|exhausted|exhaustion|brain fog|lethargy|overworked|depleted|no energy|drained|thak gaya|thakan|agotamiento|epuisement)\b",
            "panic_dysregulation": r"\b(panic|panic attack|heart racing|palpitations|cannot breathe|suffocating|trembling|doom|shaking|chest pounding|saas nahi|ghutan|ataque de panico)\b",
            "major_depressive_inertia": r"\b(depressed|depression|low mood|feeling down|empty|emptiness|hopeless|despair|anhedonia|unmotivated|worthless|useless|udaas|udaasi|depresion)\b",
            "imposter_perfectionism": r"\b(imposter|impostor|fraud|failure|failed|failing|perfectionist|perfectionism|not good enough|incompetent|will be exposed|kabil nahi)\b",
            "relationship_heartbreak": r"\b(breakup|broke up|ex|partner|husband|wife|fight|argument|heartbreak|broken heart|rejection|unloved|abandoned|dil toot|rupture)\b",
            "existential_loneliness": r"\b(lonely|loneliness|all alone|isolated|isolation|nobody cares|no friends|alienated|empty world|disconnected|akela|akelepan|soledad|solitude)\b",
            "anger_frustration_dysregulation": r"\b(angry|anger|furious|rage|mad|irritated|annoyed|unfair|hate them|screaming|boss yelled|injustice|gussa|krodh|colere)\b",
            "grief_bereavement": r"\b(grief|grieving|bereavement|died|passed away|mourning|sorrow|funeral|lost my|crying|wept|shok|duelo|deuil)\b",
            "social_evaluative_threat": r"\b(social anxiety|shy|embarrassed|judging me|public speaking|awkward|crowds|humiliated|presentation|sharm|timide)\b",
            "adhd_executive_overwhelm": r"\b(adhd|procrastinate|procrastinating|procrastination|task paralysis|cannot start|overwhelmed with tasks|distracted|frozen)\b",
            "insomnia_hyperarousal": r"\b(insomnia|cannot sleep|cant sleep|waking up|sleep trouble|staying awake|lying in bed|midnight|toss and turn|neend nahi|insomnio)\b",
            "health_somatic_anxiety": r"\b(health anxiety|hypochondria|illness|disease|cancer|heart attack|checking pulse|medical symptoms|tumor|googling symptoms|bimaari)\b",
            "trauma_hypervigilance": r"\b(trauma|traumatic|ptsd|flashback|triggered|hypervigilant|abuse|startled|nightmares)\b",
            "ocd_intrusive_rumination": r"\b(ocd|intrusive thought|pure o|bad thoughts|disturbing thought|unwanted thought|mental check|reassurance seeking|bure vichar)\b",
            "compassion_fatigue_caregiver": r"\b(caregiver|caregiving|taking care of|caring for sick|caring for elderly|caregiver burnout|caregiver fatigue|secondary trauma|caretaker)\b",
            "decision_paralysis_ambivalence": r"\b(decision paralysis|cannot decide|cant decide|hard to choose|choice overload|too many options|analysis paralysis|indecision)\b",
            "shame_core_defectiveness": r"\b(shame|ashamed|toxic shame|deeply flawed|defective|fundamentally broken|unworthy|hate myself|want to disappear|sharmindagi|scham)\b",
            "workplace_mobbing_toxic_culture": r"\b(toxic workplace|toxic boss|toxic manager|gaslighting boss|workplace mobbing|workplace harassment|hostile workplace|sunday dread)\b",
            "somatic_chronic_pain_amplification": r"\b(chronic pain|neuroplastic pain|back pain|fibromyalgia|pain reprocessing|tension headache|pain flare|somatic tracking|dard)\b",
        }

        # 2. Lexical, Symptom & Multi-lingual Weighted Scoring Matcher
        import re
        words = [w for w in re.split(r"[\s,.;:!?()]+", clean_query) if len(w) >= 3]

        best_match = None
        highest_score = 0

        for item in self.library_data:
            score = 0
            cond_id = str(item.get("id", ""))

            # 1. Direct Pattern Match (+12)
            pattern = domain_patterns.get(cond_id)
            if pattern and re.search(pattern, clean_query, re.IGNORECASE):
                score += 12

            # 2. Direct ID match (+10)
            if cond_id and cond_id.replace("_", " ") in clean_query:
                score += 10

            # 3. Name word matching (+4)
            name = item.get("name", "")
            if isinstance(name, str):
                for nw in re.split(r"[\s,&]+", name.lower()):
                    if len(nw) >= 4 and nw in clean_query:
                        score += 4

            # 4. Category matching (+3)
            category = item.get("category", "")
            if isinstance(category, str):
                for cw in re.split(r"[\s,&]+", category.lower()):
                    if len(cw) >= 4 and cw in clean_query:
                        score += 3

            # 5. Core symptoms matching (+3 to +8)
            core_symptoms = item.get("core_symptoms", [])
            if isinstance(core_symptoms, list):
                for sym in core_symptoms:
                    if isinstance(sym, str):
                        sym_words = sym.lower().split()
                        sym_overlap = sum(1 for sw in sym_words if len(sw) >= 4 and sw in words)
                        if sym_overlap >= 2:
                            score += 8
                        elif sym_overlap == 1:
                            score += 3

            # 6. Cognitive distortions matching (+7)
            distortions = item.get("cognitive_distortions", [])
            if isinstance(distortions, list):
                for dist in distortions:
                    if isinstance(dist, str) and dist.lower() in clean_query:
                        score += 7

            if score > highest_score:
                highest_score = score
                best_match = item

        if best_match and highest_score >= 4:
            return self._format_retrieval_result(best_match)

        return None

    def _format_retrieval_result(self, condition: dict[str, Any]) -> dict[str, Any]:
        solutions = condition.get("solutions", {})
        prompt_block = (
            f"[CLINICAL & PSYCHOEDUCATIONAL LIBRARY RAG CONTEXT]:\n"
            f"- Matched Condition: {condition.get('name')} ({condition.get('category')})\n"
            f"- Triguna Balance: {condition.get('triguna_balance')}\n"
            f"- Cognitive Distortions: {', '.join(condition.get('cognitive_distortions', []))}\n"
            f"- Evidence-Based CBT Reframing: {solutions.get('cbt_reframing')}\n"
            f"- Somatic Grounding Anchor: {solutions.get('somatic_anchor')}\n"
            f"- Recommended Pranayama: {solutions.get('pranayama')}\n"
            f"- Daily Micro-Habit: {solutions.get('micro_habit')}\n"
            f"- Instruction: Weave this exact somatic anchor or pranayama into your guidance with compassionate brevity."
        )

        return {
            "condition_id": condition.get("id"),
            "name": condition.get("name"),
            "category": condition.get("category"),
            "triguna_balance": condition.get("triguna_balance"),
            "solutions": solutions,
            "prompt_context": prompt_block,
        }


# Global singleton instance
psychology_rag = PsychologyLibraryRAG()
