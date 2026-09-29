"""
keyless_healer/lib/stt_corrector.py

Lightweight, Local Clinical Speech-to-Text (STT) Auto-Correction Pipeline.
Pre-processes transcripts from browser Web Speech API before emotion classification.
Fixes common speech recognition misrecognitions, phonetic errors, and slurred clinical terms
using zero-cost Levenshtein edit distance and clinical domain phrase mappings.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes exact Levenshtein edit distance between two strings."""
    if s1 == s2:
        return 0
    if len(s1) == 0:
        return len(s2)
    if len(s2) == 0:
        return len(s1)

    v0 = list(range(len(s2) + 1))
    v1 = [0] * (len(s2) + 1)

    for i in range(len(s1)):
        v1[0] = i + 1
        for j in range(len(s2)):
            cost = 0 if s1[i] == s2[j] else 1
            v1[j + 1] = min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
        v0 = v1[:]

    return v1[len(s2)]


# High-priority multi-word phrases and compound clinical idioms
PHRASE_MAPPINGS = [
    (r"\bpoly\s+vagal\b", "polyvagal"),
    (r"\bpoly\s+vagle\b", "polyvagal"),
    (r"\bpolyvagle\b", "polyvagal"),
    (r"\bvegas\s+nerve\b", "vagus nerve"),
    (r"\bvagus\s+nurve\b", "vagus nerve"),
    (r"\bventral\s+vagle\b", "ventral vagal"),
    (r"\bdorsal\s+vagle\b", "dorsal vagal"),
    (r"\bover\s+whelmed\b", "overwhelmed"),
    (r"\bover\s+whelming\b", "overwhelming"),
    (r"\bover\s+thinking\b", "overthinking"),
    (r"\bheart\s+beating\s+fast\b", "heart racing"),
    (r"\bshort\s+of\s+breath\b", "cannot breathe"),
    (r"\bbindu\s+dot\b", "bindu"),
    (r"\bjyoti\s+flame\b", "jyoti"),
    (r"\bweek\s+memory\b", "weak memory"),
    (r"\bloose\s+memory\b", "lose memory"),
    (r"\bcant\s+breathe\b", "cannot breathe"),
    (r"\bcant\s+sleep\b", "cannot sleep"),
    (r"\bcant\s+focus\b", "cannot focus"),
]

# Canonical clinical vocabulary dictionary for single-token correction
CLINICAL_DICTIONARY = [
    "trataka", "pranayama", "shloka", "polyvagal", "somatic", "interoception",
    "baroreceptor", "catastrophizing", "rumination", "ruminating", "anxiety",
    "anxious", "panic", "panicking", "palpitations", "palpitation", "depression",
    "depressed", "insomnia", "exhaustion", "exhausted", "burnout", "overthinking",
    "overwhelmed", "bereavement", "grieving", "hypervigilant", "dissociation",
    "defusion", "neuroplasticity", "meditation", "breathwork", "vagus", "parasympathetic",
    "ghabrahat", "bechaini", "tanaav", "udasi", "udaas", "gussa", "krodh"
]


@dataclass
class STTCorrectionResult:
    original_text: str
    corrected_text: str
    was_corrected: bool
    corrections_made: list[str]


class STTTextCorrector:
    """Pre-processing correction engine for raw Speech-to-Text inputs."""

    def __init__(self, max_edit_distance: int = 2):
        self.max_edit_distance = max_edit_distance

    def correct(self, text: str) -> STTCorrectionResult:
        if not text or not text.strip():
            return STTCorrectionResult(
                original_text=text or "",
                corrected_text=text or "",
                was_corrected=False,
                corrections_made=[],
            )

        original = text
        current = text
        corrections: list[str] = []

        # 1. Apply multi-word and compound regex replacements
        for pattern, replacement in PHRASE_MAPPINGS:
            matched = re.search(pattern, current, re.IGNORECASE)
            if matched:
                current = re.sub(pattern, replacement, current, flags=re.IGNORECASE)
                corrections.append(f"phrase: '{matched.group(0)}' -> '{replacement}'")

        # 2. Token-level fuzzy match against clinical dictionary
        tokens = re.split(r"(\s+|[.,!?;:()]+)", current)
        reconstructed: list[str] = []

        for token in tokens:
            # Only attempt fuzzy matching on alphabetic tokens of length >= 4
            clean_word = token.strip().lower()
            if not re.match(r"^[a-zA-Z]{4,}$", clean_word):
                reconstructed.append(token)
                continue

            # Exact match check
            if clean_word in CLINICAL_DICTIONARY:
                reconstructed.append(token)
                continue

            # Find closest clinical dictionary candidate
            best_match: str | None = None
            best_dist = 999

            for candidate in CLINICAL_DICTIONARY:
                # Length filter optimization: skip candidates with length diff > max_edit_distance
                if abs(len(candidate) - len(clean_word)) > self.max_edit_distance:
                    continue

                dist = levenshtein_distance(clean_word, candidate)
                # Strict distance constraints: 4-letter words require dist <= 1; >= 5 letters allow dist <= 2
                allowed_dist = 1 if len(clean_word) <= 4 else self.max_edit_distance

                if dist <= allowed_dist and dist < best_dist:
                    best_dist = dist
                    best_match = candidate

            if best_match and best_dist <= self.max_edit_distance:
                # Preserve capitalisation if original was Title case
                repl = best_match.capitalize() if token[0].isupper() else best_match
                reconstructed.append(repl)
                corrections.append(f"word: '{token}' -> '{repl}' (dist={best_dist})")
            else:
                reconstructed.append(token)

        corrected = "".join(reconstructed)
        # Normalize redundant spaces
        corrected = re.sub(r"\s+", " ", corrected).strip()

        return STTCorrectionResult(
            original_text=original,
            corrected_text=corrected,
            was_corrected=len(corrections) > 0,
            corrections_made=corrections,
        )


# Global singleton
stt_text_corrector = STTTextCorrector()
