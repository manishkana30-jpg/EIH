"""
Keyless Healer Library - Zero API Key Clinical Intelligence, Audio & Search Grounding
"""

try:
    from .audio_engine import VOICE_CATALOG, AudioEngine
except ImportError:
    VOICE_CATALOG, AudioEngine = {}, None

try:
    from .cbt_upgrader import CBTLibraryUpgrader, UpgradeStatus, cbt_upgrader
except ImportError:
    CBTLibraryUpgrader, UpgradeStatus, cbt_upgrader = None, None, None

try:
    from .clinical_expansion import ClinicalExpansionEngine, ClinicalSolution, clinical_expansion_engine
except ImportError:
    ClinicalExpansionEngine, ClinicalSolution, clinical_expansion_engine = None, None, None

try:
    from .clinical_search import (
        OFFLINE_PROTOCOLS,
        ClinicalEvidence,
        ClinicalSearchEngine,
        ClinicalSearchResult,
        KeylessClinicalSearch,
    )
except ImportError:
    OFFLINE_PROTOCOLS, ClinicalEvidence, ClinicalSearchEngine, ClinicalSearchResult, KeylessClinicalSearch = {}, None, None, None, None

try:
    from .psychologist_partner import PsychologistPartner, TherapeuticResponse
except ImportError:
    PsychologistPartner, TherapeuticResponse = None, None

__all__ = [
    "OFFLINE_PROTOCOLS",
    "VOICE_CATALOG",
    "AudioEngine",
    "CBTLibraryUpgrader",
    "ClinicalEvidence",
    "ClinicalExpansionEngine",
    "ClinicalSearchEngine",
    "ClinicalSearchResult",
    "ClinicalSolution",
    "KeylessClinicalSearch",
    "PsychologistPartner",
    "TherapeuticResponse",
    "UpgradeStatus",
    "cbt_upgrader",
    "clinical_expansion_engine",
]
