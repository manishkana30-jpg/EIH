"""
tests/test_cognitive_orchestrator.py

Verification tests for Keyless Healer Cognitive Diagnostics and CBT Reframing.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "keyless_healer", "lib")))

from cbt_library_loader import cbt_loader
from psychologist_partner import build_healer_system_prompt, check_crisis_text


def test_cognitive_orchestration():
    # 1. Test Personalization / Failure
    case2 = cbt_loader.analyze_utterance("It's all my fault that they had to go through this")
    assert case2["primary_distortion_id"] == "personalization", f"Expected personalization, got {case2['primary_distortion_id']}"
    assert len(case2["socratic_prompts"]) > 0, "Must produce Socratic reframing prompts"
    assert len(case2["somatic_cue"]) > 0, "Must produce Somatic cue"

    # 2. Test Catastrophizing
    case3 = cbt_loader.analyze_utterance("This is the worst thing ever, my life is over")
    assert case3["primary_distortion_id"] == "catastrophizing", f"Expected catastrophizing, got {case3['primary_distortion_id']}"

    # 3. Crisis Detection Safety Check
    assert check_crisis_text("I want to end my life"), "Must detect acute crisis"
    assert not check_crisis_text("I feel stressed about my job interview"), "Must not flag regular stress as crisis"

    # 4. Anti-Canned & Clinical Mandates in System Prompt
    system_prompt = build_healer_system_prompt()
    assert "Expert Clinical Psychologist" in system_prompt
    assert "MUST NEVER use generic greetings" in system_prompt
    assert "Deeply validate their exact emotional and bodily state" in system_prompt
    assert "Provide a targeted cognitive reframe" in system_prompt
    assert "Prescribe the specific somatic anchor" in system_prompt

    print("All Keyless Healer Cognitive Orchestrator & Safety Checks Passed!")


if __name__ == "__main__":
    test_cognitive_orchestration()

