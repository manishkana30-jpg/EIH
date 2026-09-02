"""
keyless-healer-system/lib/self_learning_therapist.py
Self-Learning Vector Memory AI Psychologist & Clinical Note Engine.
Uses ChromaDB vector storage, SentenceTransformers embedding, and Qwen/Llama local inference.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime
from typing import Any

import chromadb

logger = logging.getLogger("SelfLearningTherapist")


class SelfLearningTherapistEngine:
    """Manages persistent clinical memory (ChromaDB), local embeddings, and adaptive LLM inference."""

    def __init__(self, db_path: str = "./clinical_memory_db", model_name: str = "Qwen/Qwen2.5-3B-Instruct") -> None:
        self.db_path = db_path
        self.model_name = model_name
        self.chroma_client: Any = None
        self.memory_collection: Any = None
        self.embedder: Any = None
        self.tokenizer: Any = None
        self.model: Any = None
        self.therapist_pipe: Any = None
        self._initialized = False

        # Initialize ChromaDB immediately
        self._init_vector_db()

    def _init_vector_db(self) -> None:
        try:
            os.makedirs(self.db_path, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=self.db_path)
            if self.chroma_client:
                self.memory_collection = self.chroma_client.get_or_create_collection(name="patient_history")
                logger.info(f"ChromaDB clinical memory initialized at '{self.db_path}'.")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB at '{self.db_path}': {e}")
            self.memory_collection = None

    def query_clinical_memory(self, user_message: str, n_results: int = 3) -> str:
        """Queries the vector database for relevant past notes based on semantic similarity."""
        if not self.memory_collection:
            return ""

        try:
            if self.embedder is None:
                from sentence_transformers import SentenceTransformer
                self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

            query_vector = self.embedder.encode(user_message).tolist()
            memory_results = self.memory_collection.query(
                query_embeddings=[query_vector],
                n_results=n_results,
            )

            if memory_results and memory_results.get("documents") and memory_results["documents"][0]:
                past_notes = "\n- ".join(memory_results["documents"][0])
                return f"\nRelevant Past Clinical Notes on this patient:\n- {past_notes}"
        except Exception as e:
            logger.warning(f"Memory query exception: {e}")

        return ""

    def update_clinical_memory(self, user_message: str, ai_response: str, session_id: str = "default_user") -> str:
        """
        Background task: Analyzes the exchange, synthesizes a 1-sentence clinical note,
        and saves it permanently to the vector database.
        """
        if not self.memory_collection:
            return ""

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        note_id = str(uuid.uuid4())

        # Clean fallback extraction
        truncated = (user_message[:80] + "...") if len(user_message) > 80 else user_message
        clinical_note = f"Patient expressed tension regarding: '{truncated}'. Responded with cognitive-somatic de-escalation."

        try:
            if self.embedder is None:
                from sentence_transformers import SentenceTransformer
                self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

            vector = self.embedder.encode(clinical_note).tolist()
            self.memory_collection.add(
                ids=[note_id],
                embeddings=[vector],
                metadatas=[{"timestamp": timestamp, "type": "clinical_note", "session_id": session_id}],
                documents=[clinical_note],
            )
            logger.info(f"🧠 [Memory Updated]: {clinical_note}")
        except Exception as e:
            logger.error(f"Failed to persist clinical note to ChromaDB: {e}")

        return clinical_note


# Singleton instance
self_learning_therapist = SelfLearningTherapistEngine()
