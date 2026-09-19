"""
tests/test_gita_rag.py
Validates Gita Cognitive Therapy RAG, dilemma detection, ChromaDB retrieval, and prompt pipeline.
"""

import unittest
from keyless_healer.lib.gita_rag import (
    detect_existential_dilemma,
    gita_rag,
    build_gita_system_prompt,
    synthesize_gita_response,
)


class TestGitaRAG(unittest.TestCase):
    def test_dilemma_detection_english(self):
        self.assertTrue(detect_existential_dilemma("I am facing a massive dilemma and cannot decide what to do."))
        self.assertTrue(detect_existential_dilemma("I feel completely paralyzed with fear of making the wrong decision."))
        self.assertTrue(detect_existential_dilemma("What should I do with my life? I feel stuck in life."))
        self.assertFalse(detect_existential_dilemma("I had cereal for breakfast today."))

    def test_dilemma_detection_hindi_hinglish(self):
        self.assertTrue(detect_existential_dilemma("Mujhe samajh nahi aa raha main kya karu."))
        self.assertTrue(detect_existential_dilemma("Bohot bada dharamsankat hai life mein."))
        self.assertTrue(detect_existential_dilemma("मुझे समझ नहीं आ रहा क्या करूं"))

    def test_chroma_retrieval(self):
        wisdom = gita_rag.query_wisdom("I am terrified of failing and obsessed with the results of this interview.")
        self.assertIsNotNone(wisdom)
        self.assertIn("shloka_sanskrit", wisdom)
        self.assertIn("philosophical_meaning", wisdom)
        self.assertTrue(len(wisdom["shloka_sanskrit"]) > 0)

    def test_deterministic_response_structure(self):
        wisdom = gita_rag.query_wisdom("I can't decide between two paths.")
        self.assertIsNotNone(wisdom)
        response = synthesize_gita_response("I can't decide", wisdom)
        self.assertIn("[GITA_SHLOKA]", response)
        self.assertIn("[/GITA_SHLOKA]", response)
        self.assertIn("THE MEANING:", response)
        self.assertIn("THE CLINICAL REFLECTION:", response)
        self.assertIn("THE KARMA (ACTIONABLE GUIDANCE):", response)


if __name__ == "__main__":
    unittest.main()
