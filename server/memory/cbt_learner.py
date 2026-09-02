"""
server/memory/cbt_learner.py

Asynchronous Post-Turn CBT Memory Extraction Engine.
Analyzes completed turn pairs (User Utterance -> Assistant Intervention -> User Reaction)
to extract Negative Automatic Thoughts (NATs), core schemas, and user breakthrough insights.
"""

import logging
import re
from typing import Any

logger = logging.getLogger("eih-cbt-learner")

LEARNER_SYSTEM_PROMPT = """
You are the Post-Turn CBT Memory Extraction Engine for Emotional Intelligence Healer.
Analyze the completed turn pair (User Utterance -> Assistant Intervention -> User Reaction).

Evaluate:
1. Did the user's automatic thought reveal a recurring Core Schema (e.g., Abandonment, Defectiveness, Unrelenting Standards)?
2. Did the assistant's reframing technique produce a cognitive shift, resistance, or relief in the user's follow-up?
3. Extract any profound self-realization or anchor phrase spoken by the user that can be reused in future sessions.

Output ONLY valid JSON matching this schema:
{
  "identified_nat": "exact negative thought extracted",
  "distortion": "All-or-Nothing | Catastrophizing | Mind Reading | Emotional Reasoning | Personalization | None",
  "user_receptivity": "embraced | neutral | resisted",
  "breakthrough_insight": "User's own reframing words, if any (or null)",
  "core_schema_detected": "Name of underlying core belief (or null)",
  "recommended_future_strategy": "1 sentence on what to do/avoid next time this trigger appears"
}
"""

def extract_heuristic_cbt_learnings(
    user_input: str,
    ai_response: str,
    user_followup: str = ""
) -> dict[str, Any]:
    """
    Deterministic zero-latency heuristic CBT learner for rapid client-side/edge aggregation.
    """
    u_lower = (user_input or "").lower()
    f_lower = (user_followup or "").lower()

    # 1. Identify Distortion
    distortion = "None"
    if re.search(r'\b(stupid|useless|idiot|my fault|i ruined|failure)\b', u_lower):
        distortion = "Personalization"
    elif re.search(r'\b(always|never|everyone|nobody|everything|nothing)\b', u_lower):
        distortion = "All-or-Nothing"
    elif re.search(r'\b(worst|disaster|life is over|end of everything|can never)\b', u_lower):
        distortion = "Catastrophizing"
    elif re.search(r'\b(they think|they hate|she thinks|he thinks)\b', u_lower):
        distortion = "Mind Reading"
    elif re.search(r'\b(feel like a failure so|feels doomed)\b', u_lower):
        distortion = "Emotional Reasoning"

    # 2. Detect Receptivity & Breakthroughs in follow-up
    receptivity = "neutral"
    breakthrough: str | None = None

    if any(k in f_lower for k in ["guess", "realize", "makes sense", "feel better", "true", "calmer", "right", "good point"]):
        receptivity = "embraced"
        if len(user_followup.strip()) > 10:
            breakthrough = user_followup.strip()
    elif any(k in f_lower for k in ["no", "doesn't help", "does not help", "still feel", "stop", "useless", "you don't understand"]):
        receptivity = "resisted"

    # 3. Core Schema Detection
    core_schema: str | None = None
    if "stupid" in u_lower or "useless" in u_lower or "defect" in u_lower:
        core_schema = "Defectiveness / Shame"
    elif "alone" in u_lower or "nobody" in u_lower or "abandon" in u_lower:
        core_schema = "Emotional Deprivation / Abandonment"
    elif "boss" in u_lower or "fail" in u_lower or "presentation" in u_lower:
        core_schema = "Unrelenting Standards / Fear of Failure"

    rec_strategy = f"Address {distortion} through somatic stabilization followed by Socratic reality-testing."

    return {
        "identified_nat": user_input.strip(),
        "distortion": distortion,
        "user_receptivity": receptivity,
        "breakthrough_insight": breakthrough,
        "core_schema_detected": core_schema,
        "recommended_future_strategy": rec_strategy,
    }


async def extract_cbt_learnings(
    user_input: str,
    ai_response: str,
    user_followup: str = ""
) -> dict[str, Any]:
    """
    Executes post-turn CBT memory learning in the background.
    """
    return extract_heuristic_cbt_learnings(user_input, ai_response, user_followup)
