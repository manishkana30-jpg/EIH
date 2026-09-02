"""
server/cognitive_orchestrator.py

Hidden Pre-Generation Cognitive & Psychological Analysis Pipeline (v2.0)
Analyzes user speech for Cowen-27 dominant emotions, CBT cognitive distortions,
Polyvagal autonomic tone, somatic cues, and intervention priorities.
"""

import logging
import re
from typing import Any

logger = logging.getLogger("eih-cognitive-orchestrator")


def extract_heuristic_diagnostics(user_text: str) -> dict[str, Any]:
    """
    Ultra-fast, deterministic zero-latency psychological & cognitive analysis pass.
    """
    text = (user_text or "").strip()
    lower = text.lower()

    # 1. Extract Anchor Phrases
    anchor_candidates = []
    situational_terms = [
        "driving test", "presentation", "interview", "exam", "boss", "manager", "job", "office", "work",
        "colleague", "partner", "girlfriend", "boyfriend", "husband", "wife", "best friend", "friend",
        "dog", "cat", "pet", "money", "savings", "crypto", "rent", "debt", "sleep", "insomnia",
        "chest", "throat", "heart", "stomach", "quit", "fired", "failed", "rejected", "cheated",
        "alone", "exhausted", "test"
    ]
    for term in situational_terms:
        if re.search(r'\b' + re.escape(term) + r'\b', lower):
            anchor_candidates.append(term)

    if not anchor_candidates:
        words = re.findall(r'\b[A-Za-z]{4,}\b', text)
        stop_words = {
            'this', 'that', 'with', 'from', 'have', 'what', 'your', 'about', 'feel', 'feeling', 'like',
            'doing', 'today', 'hello', 'there', 'please', 'going', 'think', 'thinking', 'getting', 'trying',
            'want', 'need', 'know', 'just', 'some', 'them', 'they', 'were', 'been', 'would', 'could',
            'should', 'more', 'much', 'very', 'here', 'when', 'where', 'which', 'will', 'good', 'well',
            'help', 'tell', 'talk', 'someone', 'anyone', 'something', 'anything', 'also', 'really',
            'stop', 'maybe', 'always', 'everyone', 'everything', 'never', 'nothing', 'nobody', 'parents',
            'parent', 'incompetent', 'idiot', 'stupid', 'useless', 'failure', 'worst', 'disaster',
            'again', 'single', 'time', 'night', 'morning', 'evening', 'tomorrow', 'sunday', 'monday',
            'such', 'mess', 'passed', 'matter', 'matters', 'most'
        }
        content_words = [w for w in words if w.lower() not in stop_words]
        if content_words:
            anchor_candidates = content_words[:3]
        else:
            anchor_candidates = ["this situation"]

    # 2. CBT Cognitive Distortions
    cbt_distortions = []
    if re.search(r'\b(always|never|everyone|nobody|everything|nothing|ruined)\b', lower):
        cbt_distortions.append("all_or_nothing")
    if re.search(r'\b(stupid|useless|idiot|my fault|i ruined|i suck|failure)\b', lower):
        cbt_distortions.append("personalization")
    if re.search(r'\b(worst|disaster|life is over|end of everything|can never|doomed)\b', lower):
        cbt_distortions.append("catastrophizing")
    if re.search(r'\b(they think|they hate me|she thinks|he thinks|everyone thinks|everyone judged)\b', lower):
        cbt_distortions.append("mind_reading")
    if re.search(r'\b(i feel like a failure so|feels pointless|feels doomed)\b', lower):
        cbt_distortions.append("emotional_reasoning")
    if re.search(r'\b(again|every single time|always happens to me)\b', lower):
        cbt_distortions.append("overgeneralization")

    cbt_distortion = cbt_distortions[0] if cbt_distortions else "none"

    # 3. Polyvagal State
    polyvagal_state = "ventral_vagal"
    if re.search(r'\b(panic|panicking|panicked|anxious|anxiety|racing|shaking|pounding|angry|furious|screaming|pissed|yelled|stress|stressed)\b', lower):
        polyvagal_state = "sympathetic"
    elif re.search(r'\b(exhausted|numb|empty|heavy|cant move|giving up|hopeless|crying|depressed|fatigue)\b', lower):
        polyvagal_state = "dorsal_vagal"

    # 4. Somatic Cues inferred from speech
    somatic_cues = []
    if re.search(r'\b(chest|tight|breath|heart|shaking|trembling)\b', lower):
        somatic_cues.append("thoracic constriction / racing pulse")
    if re.search(r'\b(throat|choked|speechless|swallow)\b', lower):
        somatic_cues.append("throat constriction")
    if re.search(r'\b(stomach|gut|nauseous|sick)\b', lower):
        somatic_cues.append("enteric distress")
    if re.search(r'\b(heavy|tired|exhausted|sinking|numb)\b', lower):
        somatic_cues.append("heavy postural collapse / hypoarousal")

    # 5. Intervention Priority
    intervention_priority = "validate"
    if polyvagal_state == "sympathetic":
        intervention_priority = "regulate"
    elif cbt_distortions:
        intervention_priority = "reframe"
    elif polyvagal_state == "dorsal_vagal":
        intervention_priority = "activate"

    # 6. Dominant Cowen-27 Emotions
    dominant_emotions = []
    if polyvagal_state == "sympathetic":
        if any(k in lower for k in ["angry", "furious", "yelled", "pissed", "unfair"]):
            dominant_emotions = [
                {"label": "Anger", "score": 88.0},
                {"label": "Disgust", "score": 62.0},
                {"label": "Awkwardness", "score": 44.0},
            ]
        else:
            dominant_emotions = [
                {"label": "Anxiety", "score": 84.0},
                {"label": "Fear", "score": 68.0},
                {"label": "Confusion", "score": 52.0},
            ]
    elif polyvagal_state == "dorsal_vagal":
        dominant_emotions = [
            {"label": "Sadness", "score": 86.0},
            {"label": "Empathic Pain", "score": 70.0},
            {"label": "Nostalgia", "score": 48.0},
        ]
    elif any(k in lower for k in ["happy", "good", "great", "relieved", "peace", "calm", "awesome"]):
        dominant_emotions = [
            {"label": "Calmness", "score": 82.0},
            {"label": "Relief", "score": 74.0},
            {"label": "Satisfaction", "score": 65.0},
        ]
    else:
        dominant_emotions = [
            {"label": "Calmness", "score": 76.0},
            {"label": "Interest", "score": 60.0},
            {"label": "Aesthetic Appreciation", "score": 45.0},
        ]

    top_3_cowen = [
        {"name": e["label"], "percentage": int(e["score"])} for e in dominant_emotions
    ]

    strategy = f"Address {', '.join(anchor_candidates[:2])} with {intervention_priority} focus ({polyvagal_state})."

    return {
        "anchor_phrases": anchor_candidates,
        "dominant_emotions": dominant_emotions,
        "cbt_distortions": cbt_distortions,
        "cbt_distortion": cbt_distortion,
        "polyvagal_state": polyvagal_state,
        "somatic_cues": somatic_cues,
        "intervention_priority": intervention_priority,
        "top_3_cowen_emotions": top_3_cowen,
        "therapeutic_strategy": strategy,
    }


async def run_cognitive_analysis(
    user_text: str,
    llm_client: Any | None = None,
    user_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Executes the Pre-Generation Cognitive Analysis pass.
    """
    return extract_heuristic_diagnostics(user_text)
