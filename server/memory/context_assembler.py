"""
server/memory/context_assembler.py

Compiles the user's encrypted local cognitive profile & historical breakthrough insights
into the hidden reasoning scratchpad memory for the cognitive orchestrator.
"""

from typing import Any


def assemble_adaptive_cbt_context(user_profile: dict[str, Any], current_transcript: str = "") -> str:
    """
    Assembles historical CBT learnings into prompt memory without leaking clinical meta-tags directly to the user.
    """
    if not user_profile:
        return ""

    top_distortions = user_profile.get("topRecurringDistortions", [])
    breakthroughs = user_profile.get("breakthroughAnchors", [])
    efficacy = user_profile.get("interventionEfficacyMatrix", [])
    doshic = user_profile.get("doshicBaseline", {})

    # Extract high-efficacy techniques (> 60% success rate)
    effective_techniques: list[str] = [
        e["technique"] for e in efficacy if e.get("successRate", 0) >= 0.6 and e.get("totalAttempts", 0) > 0
    ]
    # Extract low-efficacy / avoided techniques (< 30% success rate with >= 2 attempts)
    ineffective_techniques: list[str] = [
        e["technique"] for e in efficacy if e.get("successRate", 0) < 0.3 and e.get("totalAttempts", 0) >= 2
    ]

    active_distortions_str = ", ".join([d.get("distortion", "") for d in top_distortions if d.get("frequency", 0) > 0]) or "None established yet"
    effective_str = ", ".join(effective_techniques) if effective_techniques else "Somatic grounding + Socratic reframing"
    avoid_str = ", ".join(ineffective_techniques) if ineffective_techniques else "None recorded"

    breakthrough_lines: list[str] = []
    for b in breakthroughs[-3:]:
        phrase = b.get("insightPhrase", "")
        trigger = b.get("contextTrigger", "")
        if phrase:
            breakthrough_lines.append(f'  * "{phrase}" (Trigger context: {trigger})')

    breakthroughs_str = "\n".join(breakthrough_lines) if breakthrough_lines else "  * (First session / no past anchors logged yet)"

    return f"""
[LEARNED USER COGNITIVE PROFILE - HISTORICAL ADAPTIVE MEMORY]
- Known Recurring Cognitive Traps: {active_distortions_str}
- Proven Effective Techniques for this User: {effective_str}
- Avoid (Historically Ineffective for this User): {avoid_str}
- Doshic Grounding Anchor: {doshic.get("effectiveGroundingPranayama", "Nadi Shodhana")} ({doshic.get("dominantTendency", "sattva_balanced")})
- Past User Breakthrough Insights (Echo or reference naturally if relevant to current trigger):
{breakthroughs_str}
"""
