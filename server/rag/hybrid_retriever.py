"""
Dual Knowledge Graph & Hybrid RAG Retrieval Engine for Python Server.
Synthesizes Sattvavajaya Chikitsa with Modern Clinical Neuropsychology.
"""

import re
from typing import Any

from .ontology_loader import ontology_loader


class HybridRetriever:
    def __init__(self):
        self.loader = ontology_loader

    def retrieve_context(self, user_text: str, user_baseline_dosha: str = "Vata-Pitta") -> dict[str, Any]:
        text = user_text.lower()

        vata_score = 0
        pitta_score = 0
        kapha_score = 0

        # Vata regex
        if re.search(r"\b(anxious|panic|racing|overwhelm|overwhelmed|can't breathe|shaking|restless|insomnia|fear|scared)\b", text):
            vata_score += 3
        # Pitta regex
        if re.search(r"\b(angry|frustrated|furious|irritated|hate|perfection|fail|resentment|burnout|burned out|mad)\b", text):
            pitta_score += 3
        # Kapha regex
        if re.search(r"\b(depressed|numb|heavy|exhausted|hopeless|worthless|empty|stuck|lonely|apathy|tired)\b", text):
            kapha_score += 3

        if "Vata" in user_baseline_dosha:
            vata_score += 1
        if "Pitta" in user_baseline_dosha:
            pitta_score += 1
        if "Kapha" in user_baseline_dosha:
            kapha_score += 1

        detected_dosha = "Equilibrium"
        polyvagal = "Ventral_Vagal"
        pillar = "Samadhi"
        pranayama = "Balanced 5.5s Coherent Breath"
        grounding_cue = "Place a hand over the heart center (Hridaya) and notice the gentle rhythm."

        if vata_score > pitta_score and vata_score > kapha_score and vata_score >= 2:
            detected_dosha = "Vata"
            polyvagal = "Sympathetic_Hyper"
            pillar = "Samadhi"
            pranayama = "4-7-8 Vagal Brake / Nadi Shodhana"
            grounding_cue = "Feel the grounded firmness of the floor beneath feet; take a long slow exhale out."
        elif pitta_score >= vata_score and pitta_score > kapha_score and pitta_score >= 2:
            detected_dosha = "Pitta"
            polyvagal = "Sympathetic_Hyper"
            pillar = "Smriti"
            pranayama = "Sheetali Cooling Breath"
            grounding_cue = "Unclench the jaw, soften the tongue from roof of mouth, release shoulder tension."
        elif kapha_score >= vata_score and kapha_score >= pitta_score and kapha_score >= 2:
            detected_dosha = "Kapha"
            polyvagal = "Dorsal_Vagal_Hypo"
            pillar = "Jnana"
            pranayama = "Bhramari Humming Bee Breath"
            grounding_cue = "Take an uplifting breath into lower ribs; roll shoulders back gently."

        augmented_prompt = f"""
[CLINICAL & AYURVEDIC RETRIEVAL CONTEXT]:
- Detected Dosha: {detected_dosha}
- Polyvagal Nervous System State: {polyvagal}
- Active Sattvavajaya Pillar: {pillar}
- Recommended Somatic Pranayama: {pranayama}
- Grounding Sensory Cue: {grounding_cue}
- Guideline: Validate their emotional pain first with warmth, keep spoken reply under 3 sentences, guide gentle breath awareness.
""".strip()

        return {
            "detected_dosha": detected_dosha,
            "polyvagal_state": polyvagal,
            "sattvavajaya_pillar": pillar,
            "pranayama": pranayama,
            "grounding_cue": grounding_cue,
            "augmented_prompt": augmented_prompt,
        }

hybrid_retriever = HybridRetriever()
