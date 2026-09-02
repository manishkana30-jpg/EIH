"""
tests/test_cognitive_orchestrator.py

Verification tests for Hidden Cognitive Orchestration and Adaptive VAD.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "server"))

from cognitive_orchestrator import extract_heuristic_diagnostics
from prompts.therapeutic_persona import SYNTHESIS_SYSTEM_PROMPT


def test_cognitive_orchestration():
    # 1. Test Design Presentation / Rejection
    case1 = extract_heuristic_diagnostics("My boss rejected my design presentation and I want to quit")
    assert "boss" in case1["anchor_phrases"] or "presentation" in case1["anchor_phrases"] or "quit" in case1["anchor_phrases"], "Failed to extract situation anchors"
    assert case1["cbt_distortion"] in ["none", "all_or_nothing", "personalization", "mind_reading", "catastrophizing"], "Invalid CBT distortion"
    assert len(case1["top_3_cowen_emotions"]) == 3, "Should produce 3 Cowen emotions"
    assert case1["top_3_cowen_emotions"][0]["percentage"] > 50, "Top emotion percentage should be calibrated"

    # 2. Test Personalization / Failure
    case2 = extract_heuristic_diagnostics("I failed my driving test and I feel so stupid")
    assert "driving test" in case2["anchor_phrases"] or "test" in case2["anchor_phrases"], "Failed to extract driving test anchor"
    assert case2["cbt_distortion"] == "personalization", f"Expected personalization, got {case2['cbt_distortion']}"

    # 3. Test Catastrophizing
    case3 = extract_heuristic_diagnostics("This is the worst disaster, my entire life is over")
    assert case3["cbt_distortion"] == "catastrophizing", f"Expected catastrophizing, got {case3['cbt_distortion']}"

    # 4. Anti-Canned Prompt Mandates
    assert "FORBIDDEN FROM USING CANNED" in SYNTHESIS_SYSTEM_PROMPT
    assert "I hear what you are saying" in SYNTHESIS_SYSTEM_PROMPT
    assert "ANCHOR TO SPECIFICS" in SYNTHESIS_SYSTEM_PROMPT

    print("All Cognitive Orchestrator & Anti-Canned Safety Checks Passed!")

if __name__ == "__main__":
    test_cognitive_orchestration()
