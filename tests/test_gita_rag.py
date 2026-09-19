"""
tests/test_gita_rag.py
Automated Unit Tests for the Bhagavad Gita Cognitive Therapy RAG Engine.
Tests:
1. Existential dilemma detection (detect_existential_dilemma)
2. ChromaDB retrieval from 'gita_library' collection
3. 4-step prompt context structure
4. [GITA_SHLOKA] tagging format
"""

import sys
import unittest
from pathlib import Path

# Setup system path
workspace_root = Path(__file__).resolve().parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from keyless_healer.lib.gita_rag import (
    detect_existential_dilemma,
    gita_rag,
)


class TestGitaRAG(unittest.TestCase):

    def test_01_detect_existential_dilemma_positive(self):
        positive_queries = [
            "I have a terrible dilemma between two career choices and feel paralyzed.",
            "I can't decide what to do with my life, I am at a crossroads.",
            "I am stuck at crossroads and confused about what to do.",
            "What is the right thing to do? Is it morally wrong to quit?",
            "I feel paralyzed by fear of failure and outcome anxiety.",
            "What does the Bhagavad Gita say about my duty and dharma?",
            "Mujhe bohot badi duvidha hai, kya karun samajh nahi aa raha.",
        ]
        for query in positive_queries:
            self.assertTrue(
                detect_existential_dilemma(query),
                f"Expected detect_existential_dilemma to be True for: {query}"
            )

    def test_02_detect_existential_dilemma_negative(self):
        negative_queries = [
            "Good morning, how are you today?",
            "Can you test my microphone?",
            "What is the weather like in New Delhi?",
            "I want to do the box breathing exercise.",
            "Thank you so much for listening.",
        ]
        for query in negative_queries:
            self.assertFalse(
                detect_existential_dilemma(query),
                f"Expected detect_existential_dilemma to be False for: {query}"
            )

    def test_03_chromadb_gita_library_retrieval(self):
        if not gita_rag or not gita_rag.collection:
            self.skipTest("ChromaDB not available or gita_library not initialized")

        # Query outcome anxiety -> Should retrieve BG 2.47
        result = gita_rag.retrieve_shloka("I am terrified of failing my exam and obsessed with the results")
        self.assertIsNotNone(result)
        self.assertIn("shloka_sanskrit", result)
        self.assertIn("shloka_roman", result)
        self.assertIn("philosophical_meaning", result)
        self.assertIn("clinical_reframe", result)
        self.assertIn("karma_action", result)
        self.assertTrue(len(result["shloka_sanskrit"]) > 10)

    def test_04_4step_prompt_formatting(self):
        mock_shloka = {
            "chapter": "2",
            "verse": "47",
            "theme": "Action Without Attachment",
            "shloka_sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
            "shloka_roman": "karmaṇy-evādhikāras te mā phaleṣhu kadāchana",
            "philosophical_meaning": "You have a right to action, never to fruits.",
            "clinical_reframe": "Shift focus from distal outcomes to process execution.",
            "karma_action": "Take the next constructive step right now without outcome fixation.",
        }

        context = gita_rag.format_gita_prompt_context(mock_shloka)
        self.assertIn("[GITA_SHLOKA]", context)
        self.assertIn("[/GITA_SHLOKA]", context)
        self.assertIn("कर्मण्येवाधिकारस्ते", context)
        self.assertIn("karmaṇy-evādhikāras te", context)
        self.assertIn("Philosophical Meaning:", context)
        self.assertIn("Clinical Reflection:", context)
        self.assertIn("Actionable Karma:", context)


if __name__ == "__main__":
    unittest.main()
