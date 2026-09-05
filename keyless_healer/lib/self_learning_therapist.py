"""
keyless_healer/lib/self_learning_therapist.py
Self-Learning Vector Memory AI Psychologist & Clinical Note Engine.
Uses ChromaDB vector storage, SentenceTransformers embedding, and Qwen/Llama local inference.
"""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime
from typing import Any

import chromadb
import torch

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
        self._init_lock = asyncio.Lock()

        # Initialize ChromaDB immediately (lightweight)
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

    def _lazy_load_models(self) -> None:
        """Loads SentenceTransformer and HuggingFace CausalLM in a hardware-aware manner."""
        if self._initialized:
            return

        try:
            from sentence_transformers import SentenceTransformer
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

            logger.info("Loading Local Embedding Engine (all-MiniLM-L6-v2)...")
            self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

            has_cuda = torch.cuda.is_available()
            logger.info(f"CUDA Available: {has_cuda}. Loading {self.model_name}...")

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

            model_kwargs: dict[str, Any] = {
                "device_map": "auto" if has_cuda else None,
            }

            if has_cuda:
                model_kwargs["load_in_4bit"] = True
                model_kwargs["torch_dtype"] = torch.float16
            else:
                model_kwargs["torch_dtype"] = torch.float32

            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                **model_kwargs,
            )

            self.therapist_pipe = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=250,
                temperature=0.6,
                repetition_penalty=1.1,
            )
            self._initialized = True
            logger.info("Self-Learning AI Therapist model loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load HuggingFace model pipeline directly ({e}). Falling back to heuristic/Ollama mode.")
            self._initialized = False

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

        clinical_note = ""
        if self.therapist_pipe:
            try:
                extraction_prompt = f"""Analyze the following therapy exchange. Write a 1-sentence clinical observation about the patient's emotional state, core struggle, or progress. Do not include fluff.
Patient: {user_message}
Therapist: {ai_response}
Observation:"""
                note_output = self.therapist_pipe(extraction_prompt, max_new_tokens=50, temperature=0.2)
                clinical_note = note_output[0]["generated_text"].split("Observation:")[-1].strip()
            except Exception as e:
                logger.warning(f"Clinical note generation failed: {e}")

        if not clinical_note:
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

    def generate_therapy_response(self, user_message: str, session_id: str = "default_user") -> str:
        """Generates a contextual therapy response using past vector memory + local LLM."""
        past_context = self.query_clinical_memory(user_message, n_results=3)

        system_prompt = f"""You are an Expert Clinical Psychologist and Emotional Resilience Trainer integrating Modern Neuropsychology with Ayurvedic Sattvavajaya Chikitsa.

You MUST NEVER use generic greetings, repetitive platitudes, or filler phrases. Respond directly with profound clinical insight.

### PHASE 1: DIAGNOSTIC ANALYSIS (Internalize, do not output this phase directly)
Analyze the user's input to identify:
1. Core Emotional Struggle & Unmet Needs.
2. Active Cognitive Distortions (e.g., Catastrophizing, Black-and-White Thinking).
3. Triguna Nervous System Balance (Sattva: Grounded / Rajas: Hyperaroused / Tamas: Hypoaroused).

### PHASE 2: CLINICAL GROUNDING
You must ground your intervention strictly in the following retrieved clinical protocol:
[RETRIEVED_PROTOCOL]: {past_context if past_context else 'Evidence-Based Cognitive Behavioral Therapy and Somatic Nervous System Regulation Protocols.'}

### PHASE 3: THE INTERVENTION (Your Output)
Formulate a highly empathetic, actionable response that trains the user's emotional resilience based strictly on the best psychological theory. Your output must follow this exact structure:
1. DEEP VALIDATION: In one sentence, deeply validate their exact emotion and somatic experience without trying to "fix" it immediately.
2. CBT REFRAME: Apply the specific cognitive reframe from the retrieved protocol to shift their perspective.
3. CLINICAL PRESCRIPTION: Prescribe the exact somatic anchor or psychological exercise from the protocol.

RULES: Keep your response concise (3-4 sentences). Do not use Markdown formatting, asterisks, or bullet points, as your response will be synthesized into human speech."""

        if self.therapist_pipe:
            try:
                messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}]
                outputs = self.therapist_pipe(messages, do_sample=True)
                return outputs[0]["generated_text"][-1]["content"]
            except Exception as e:
                logger.warning(f"Local LLM inference failed: {e}")

        # Fallback to keyless psychologist partner
        from keyless_healer.lib.psychologist_partner import PsychologistPartner
        partner = PsychologistPartner()
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    resp = pool.submit(asyncio.run, partner.respond(user_message)).result()
                    return resp.reply
            else:
                resp = asyncio.run(partner.respond(user_message))
                return resp.reply
        except Exception as e:
            logger.error(f"Fallback psychologist partner failed: {e}")
            raise RuntimeError(f"Therapeutic reasoning engine failed: {e!s}") from e


# Singleton instance
self_learning_therapist = SelfLearningTherapistEngine()
