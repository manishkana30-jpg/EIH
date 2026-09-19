"""
tests/test_gita_rag.py
Validates Gita Cognitive Therapy RAG, dilemma detection, ChromaDB retrieval, and prompt pipeline.
"""

import os
import sys
from pathlib import Path

lib_dir = Path(__file__).resolve().parent.parent / "keyless_healer" / "lib"
if str(lib_dir) not in sys.path:
    sys.path.insert(0, str(lib_dir))

import unittest
from gita_rag import (
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
        self.assertIn("Philosophical Meaning", response)
        self.assertIn("Clinical Reflection", response)
        self.assertIn("Actionable Guidance", response)

    def test_diverse_shloka_matching(self):
        # 1. Heartbreak & grief -> BG 2.14
        heartbreak = gita_rag.query_wisdom("My partner broke up with me and my heart is broken, cannot stop crying")
        self.assertEqual(heartbreak["id"], "bg_2_14")

        # 2. Anger & rage -> BG 2.62-63
        anger = gita_rag.query_wisdom("I am so angry and furious with my boss, shaking with rage")
        self.assertEqual(anger["id"], "bg_2_62_63")

        # 3. Shame & imposter syndrome -> BG 6.5
        shame = gita_rag.query_wisdom("I feel completely worthless and like an imposter, I hate myself")
        self.assertEqual(shame["id"], "bg_6_5")

        # 4. Overthinking & insomnia -> BG 6.26
        overthinking = gita_rag.query_wisdom("I have insomnia and my racing mind is overthinking everything")
        self.assertEqual(overthinking["id"], "bg_6_26")

        # 5. Acute panic -> BG 2.56
        panic = gita_rag.query_wisdom("Having a severe panic attack, shaking and heart pounding with fear")
        self.assertEqual(panic["id"], "bg_2_56")

        # 6. Sensory overwhelm -> BG 2.70
        overwhelm = gita_rag.query_wisdom("Sensory overload, too much chaos and hurricane in my brain")
        self.assertEqual(overwhelm["id"], "bg_2_70")

        # 7. Career dilemma -> BG 2.47
        career = gita_rag.query_wisdom("Terrified of my job interview results and cannot decide what to do")
        self.assertEqual(career["id"], "bg_2_47")


if __name__ == "__main__":
    unittest.main()

