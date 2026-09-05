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

    def test_learned_psychology_documents(self):
        learned_docs = psychology_rag.get_all_learned_documents()
        self.assertIsInstance(learned_docs, list, "Learned documents must be a list")

        # Test adding a dynamic learned document
        test_doc = {
            "id": "learned_python_verification_test",
            "name": "Learned: Python Verification Protocol",
            "category": "Self-Learned Clinical Knowledge",
            "triguna_balance": "Sattva Restorative Balance",
            "core_symptoms": ["python verification test"],
            "cognitive_distortions": ["Mental Filtering"],
            "solutions": {
                "cbt_reframing": "Acknowledge physiological patterns with curiosity rather than fear.",
                "somatic_anchor": "Lengthen the spine, relax the jaw, and place feet firmly on the ground.",
                "pranayama": "Breathe in for 4 seconds and out for 6 seconds to trigger parasympathetic tone.",
                "micro_habit": "Take a 60-second break before responding to stressful communication.",
            },
            "severity_level": "Mild",
            "requires_immediate_crisis": False,
            "source_url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12721538/",
            "source_platform": "Google Search / NCBI PubMed",
            "query_trigger": "python verification test query",
        }
        psychology_rag.add_learned_document(test_doc)

        # Retrieve guidance for the newly learned document
        guidance = psychology_rag.retrieve_guidance("python verification test query")
        self.assertIsNotNone(guidance, "Must retrieve guidance for newly learned document")
        self.assertEqual(guidance["condition_id"], "learned_python_verification_test")
        self.assertTrue(guidance.get("is_learned_document"), "is_learned_document must be True")
        self.assertEqual(guidance.get("source_url"), test_doc["source_url"])
        self.assertEqual(guidance.get("source_platform"), test_doc["source_platform"])


if __name__ == "__main__":
    unittest.main()
