"""
Ontology Loader for Clinical & Ayurvedic Knowledge Bases.
Loads and structures classical Ayurvedic taxonomy and modern neuropsychology frameworks.
"""

import json
import os
from typing import Any


class OntologyLoader:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.lib_knowledge_dir = os.path.abspath(os.path.join(self.base_dir, "../../lib/knowledge"))

        self.neuroscience_ontology: dict[str, Any] = self._load_json("modern-neuroscience-ontology.json")

    def _load_json(self, filename: str) -> dict[str, Any]:
        path = os.path.join(self.lib_knowledge_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading {filename}: {e}")
        return {}

    def get_dimension(self, dimension_id: str) -> dict[str, Any]:
        dimensions = self.neuroscience_ontology.get("cowen_dimensions", [])
        for dim in dimensions:
            if dim.get("id") == dimension_id:
                return dim
        return {}

    def get_doshic_remedy(self, category_key: str) -> dict[str, Any]:
        matrix = self.neuroscience_ontology.get("doshic_remedies_matrix", {})
        return matrix.get(category_key, {})

    def get_all_dimensions(self) -> list:
        return self.neuroscience_ontology.get("cowen_dimensions", [])

ontology_loader = OntologyLoader()
