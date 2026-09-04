"""
server/rag/cbt_library_loader.py
Cognitive Behavioral Therapy (CBT) & Schema Therapy Ontology Loader.
Loads, indexes, and queries the clinical CBT knowledge base for real-time cognitive reframing.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger("CBTLibraryLoader")


@dataclass
class CBTDistortion:
    id: str
    name: str
    aka: list[str]
    category: str
    description: str
    clinical_mechanism: str
    example_thought: str
    reframing_prompt: str
    socratic_questions: list[str]
    somatic_anchor: str
    recommended_protocol: str
    trigger_regex: str


class CBTLibraryLoader:
    """Loads and queries the CBT clinical knowledge base."""

    def __init__(self) -> None:
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.lib_knowledge_dir = os.path.abspath(os.path.join(self.base_dir, "../../lib/knowledge"))
        self.cbt_library: dict[str, Any] = self._load_json("cbt-library.json")

    def _load_json(self, filename: str) -> dict[str, Any]:
        path = os.path.join(self.lib_knowledge_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading {filename}: {e}")
        return {}

    def reload(self) -> None:
        """Reloads the library from disk after an auto-upgrade."""
        self.cbt_library = self._load_json("cbt-library.json")

    def get_manifest(self) -> dict[str, Any]:
        return self.cbt_library.get("manifest", {})

    def get_all_distortions(self) -> list[dict[str, Any]]:
        return self.cbt_library.get("cognitive_distortions", [])

    def get_distortion(self, distortion_id: str) -> dict[str, Any] | None:
        for d in self.get_all_distortions():
            if d.get("id") == distortion_id:
                return d
        return None

    def get_all_schemas(self) -> list[dict[str, Any]]:
        return self.cbt_library.get("maladaptive_schemas", [])

    def get_all_protocols(self) -> list[dict[str, Any]]:
        return self.cbt_library.get("clinical_protocols", [])

    def analyze_utterance(self, text: str) -> dict[str, Any]:
        """Analyzes a client utterance and identifies cognitive distortions, Socratic prompts, and reframes."""
        if not text or not text.strip():
            return {
                "detected_distortions": [],
                "primary_distortion": None,
                "socratic_prompts": [],
                "reframing_insight": "",
                "somatic_cue": "",
                "confidence_score": 0.0,
            }

        detected: list[dict[str, Any]] = []
        for d in self.get_all_distortions():
            trigger = d.get("trigger_regex", "")
            if trigger:
                try:
                    if re.search(trigger, text, re.IGNORECASE):
                        detected.append(d)
                except Exception:
                    pass

        primary = detected[0] if detected else None

        if primary:
            return {
                "detected_distortions": [d.get("name") for d in detected],
                "primary_distortion": primary.get("name"),
                "primary_distortion_id": primary.get("id"),
                "socratic_prompts": primary.get("socratic_questions", []),
                "reframing_insight": primary.get("reframing_prompt", ""),
                "somatic_cue": primary.get("somatic_anchor", ""),
                "recommended_protocol": primary.get("recommended_protocol", ""),
                "confidence_score": 0.88 if len(detected) > 0 else 0.4,
            }

        return {
            "detected_distortions": [],
            "primary_distortion": "None Detected",
            "primary_distortion_id": None,
            "socratic_prompts": [
                "What evidence supports this initial thought?",
                "If a dear friend told you this exact concern, how would you respond to them?",
            ],
            "reframing_insight": "Holding space for what you are moving through.",
            "somatic_cue": "Release any held tension in your jaw and shoulders.",
            "recommended_protocol": "act_defusion_toolkit",
            "confidence_score": 0.5,
        }


cbt_loader = CBTLibraryLoader()
