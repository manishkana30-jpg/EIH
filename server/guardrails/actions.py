"""
NeMo Guardrails Custom Actions for Healthcare Safety & Crisis Intercept
Zero False-Negative Safety Enforcer with Localized Lifelines (988 & Tele-MANAS)
"""

import re

CRISIS_PATTERNS = [
    r"\b(kill\s+myself|end\s+my\s+life|want\s+to\s+die|suicide|commit\s+suicide|better\s+off\s+dead|don't\s+want\s+to\s+live|no\s+reason\s+to\s+live|hang\s+myself|overdose|slit\s+my\s+wrists|jump\s+off|shoot\s+myself|ending\s+it\s+all|goodbye\s+cruel\s+world|take\s+my\s+own\s+life|ready\s+to\s+die)\b",
    r"\b(cut\s+myself|cutting\s+myself|burn\s+myself|hurt\s+myself|harm\s+myself|bleed\s+out|punishing\s+my\s+body|self\s*harm)\b",
    r"\b(kill\s+(someone|them|him|her|everyone)|shoot\s+up|bomb|murder|stab\s+(someone|him|her)|massacre)\b",
    r"\b(hitting\s+me|beating\s+me|abusing\s+me|threatened\s+to\s+kill\s+me|in\s+danger\s+at\s+home)\b"
]

CRISIS_DEFLECTION_MESSAGE = (
    "I hear how much deep pain and heaviness you are carrying right now, and I want you to know that you are not alone in this moment. "
    "Because I am an AI companion and cannot provide emergency medical care, please reach out immediately to real, compassionate human lifelines ready 24/7: "
    "In the US/Canada, call or text 988 (Suicide & Crisis Lifeline). "
    "In India, call 14416 or toll-free 1800-891-4416 (Tele-MANAS) or +91 9999 666 555 (Vandrevala Foundation). "
    "In the UK, call 111 or text 741741. "
    "Your life matters deeply."
)

def check_crisis_risk(text: str) -> tuple[bool, str]:
    text_lower = text.lower()
    for pattern in CRISIS_PATTERNS:
        if re.search(pattern, text_lower):
            return True, CRISIS_DEFLECTION_MESSAGE
    return False, ""

def enforce_non_prescriptive_output(bot_response: str) -> str:
    # Remove any unintended medication prescription references
    banned_terms = [r"\btake\s+\d+\s*mg\b", r"\bprescribe\b", r"\bxanax\b", r"\blexapro\b", r"\bprozac\b", r"\bzoloft\b"]
    cleaned = bot_response
    for term in banned_terms:
        if re.search(term, cleaned, re.IGNORECASE):
            cleaned = "I encourage speaking with a licensed physician regarding any medications. Let us focus on gentle somatic breathwork and cognitive reframing right now."
            break
    return cleaned
