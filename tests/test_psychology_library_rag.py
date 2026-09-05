"""
tests/test_psychology_library_rag.py
Verifies Python ChromaDB & Hybrid RAG module for 20 clinical conditions and multilingual matching.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "keyless_healer", "lib")))
from psychology_library_rag import psychology_rag


class TestPsychologyLibraryRAG(unittest.TestCase):
    def test_conditions_loaded(self):
        conditions = psychology_rag.get_all_conditions()
        self.assertGreaterEqual(len(conditions), 20, "Should load at least 20 clinical conditions")

    def test_new_conditions_present(self):
        new_ids = [
            "ocd_intrusive_rumination",
            "compassion_fatigue_caregiver",
            "decision_paralysis_ambivalence",
            "shame_core_defectiveness",
            "workplace_mobbing_toxic_culture",
            "somatic_chronic_pain_amplification",
        ]
        for cid in new_ids:
            cond = psychology_rag.get_condition_by_id(cid)
            self.assertIsNotNone(cond, f"Condition '{cid}' should exist in library")
            self.assertIn("solutions", cond)
            self.assertIn("cbt_reframing", cond["solutions"])
            self.assertIn("somatic_anchor", cond["solutions"])
            self.assertIn("pranayama", cond["solutions"])

    def test_multilingual_and_semantic_retrieval(self):
        cases = [
            ("I keep having these obsessive intrusive thoughts", "ocd_intrusive_rumination"),
            ("Caregiver fatigue from taking care of my sick mother", "compassion_fatigue_caregiver"),
            ("Paralyzed by decision paralysis and too many options", "decision_paralysis_ambivalence"),
            ("I feel toxic shame and feel deeply flawed at my core", "shame_core_defectiveness"),
            ("My toxic boss is gaslighting me and Sunday dread is awful", "workplace_mobbing_toxic_culture"),
            ("My chronic back pain and fibromyalgia flared up", "somatic_chronic_pain_amplification"),
            ("Mujhe bahut ghabrahat aur chinta ho rahi hai", "gad"),
            ("Mujhe bahut akela aur akelepan lagta hai", "existential_loneliness"),
        ]
        for query, expected_id in cases:
            res = psychology_rag.retrieve_guidance(query)
            self.assertIsNotNone(res, f"Failed to retrieve guidance for: '{query}'")
            self.assertEqual(res["condition_id"], expected_id, f"Query '{query}' expected {expected_id}, got {res['condition_id']}")
            self.assertIn("prompt_context", res)


if __name__ == "__main__":
    unittest.main()
