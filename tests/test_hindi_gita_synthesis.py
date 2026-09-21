"""
tests/test_hindi_gita_synthesis.py
Validates that Hindi queries produce 100% pure Hindi therapeutic responses with zero English labels.
"""

import sys
from pathlib import Path

lib_dir = Path(__file__).resolve().parent.parent / "keyless_healer" / "lib"
if str(lib_dir) not in sys.path:
    sys.path.insert(0, str(lib_dir))

import unittest
from gita_rag import gita_rag, synthesize_gita_response
from clinical_localization import GITA_LOCALIZATION_CATALOG, TRATAKA_LOCALIZATION_CATALOG


class TestHindiGitaSynthesis(unittest.TestCase):
    def test_hindi_gita_synthesis_pure_language(self):
        hindi_query = "मुझे बहुत घबराहट और डर लग रहा है"
        wisdom = gita_rag.query_wisdom(hindi_query)
        self.assertIsNotNone(wisdom)
        
        reply = synthesize_gita_response(hindi_query, wisdom, locale="hi")
        self.assertIn("[GITA_SHLOKA]", reply)
        self.assertIn("[/GITA_SHLOKA]", reply)
        
        # Verify NO English section headers or labels
        self.assertNotIn("Philosophical Meaning", reply)
        self.assertNotIn("Clinical Reflection", reply)
        self.assertNotIn("Actionable Guidance", reply)
        self.assertNotIn("Cognitive Restructuring", reply)
        self.assertNotIn("Somatic Polyvagal Reset", reply)
        self.assertNotIn("Focal Gaze", reply)
        self.assertNotIn("Neuro-Ocular Mechanism", reply)
        
        # Verify Hindi section headers and content
        self.assertIn("श्रीमद्भगवद्गीता का आत्मिक मार्गदर्शन", reply)
        self.assertIn("क्लिनिकल संज्ञानात्मक विज्ञान एवं मन की शांति (CBT)", reply)
        self.assertIn("त्राटक न्यूरो-ऑक्युलर ध्यान विधि", reply)
        self.assertIn("भगवान श्रीकृष्ण इस पावन श्लोक में हमें समझाते हैं", reply)

    def test_catalogs_fully_populated(self):
        self.assertGreaterEqual(len(GITA_LOCALIZATION_CATALOG), 12)
        self.assertEqual(len(TRATAKA_LOCALIZATION_CATALOG), 5)
        for k, v in GITA_LOCALIZATION_CATALOG.items():
            self.assertIn("hi", v, f"Missing 'hi' in {k}")
            self.assertIn("es", v, f"Missing 'es' in {k}")
            self.assertIn("fr", v, f"Missing 'fr' in {k}")
            self.assertIn("de", v, f"Missing 'de' in {k}")


if __name__ == "__main__":
    unittest.main()
