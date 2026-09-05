"""
lib/clinical_search.py
Free, zero-key multi-source clinical evidence search engine.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

import httpx

logger = logging.getLogger("ClinicalSearch")


@dataclass
class ClinicalEvidence:
    title: str
    summary: str
    source: str
    url: str | None = None


# Backward-compatibility alias
ClinicalSearchResult = ClinicalEvidence


OFFLINE_PROTOCOLS = {
    "anxiety": ClinicalEvidence(
        title="Somatic Vagal Regulation & ACT Cognitive Defusion",
        summary="Deploy physiological sighs (2 deep inhales through nose, 1 extended exhale through mouth) "
                "to stimulate parasympathetic vagal braking. Use 5-4-3-2-1 sensory grounding and "
                "ACT defusion framing ('I am noticing that my mind is generating the thought that...') "
                "to arrest catastrophic spirals.",
        source="offline_clinical_cache"
    ),
    "depression": ClinicalEvidence(
        title="Behavioral Activation & Micro-Momentum Protocol",
        summary="Counter depressive inertia using Opposite Action: commit to a 2-minute micro-habit "
                "(stepping into sunlight, drinking water, standing up) without waiting for motivation to appear.",
        source="offline_clinical_cache"
    ),
    "overwhelm": ClinicalEvidence(
        title="Locus of Control & Somatic Grounding",
        summary="Separate stressors into direct control vs. non-controllable factors. Use bilateral "
                "tapping (Butterfly Hug) to down-regulate acute nervous system arousal.",
        source="offline_clinical_cache"
    )
}


def extract_clinical_keywords(query: str) -> str:
    """Extracts psychological symptoms to construct targeted clinical queries."""
    import re
    q_lower = (query or "").lower()
    keywords = []

    if re.search(r"\b(anxi|panic|nervous|worry|overwhelm|fear|racing|dread|ghabrahat)\b", q_lower):
        keywords.append("anxiety OR panic OR autonomic regulation")
    if re.search(r"\b(memory|forget|brain fog|confusion|recall|concentration|yaaddasht)\b", q_lower):
        keywords.append("working memory OR cognitive fatigue OR brain fog")
    if re.search(r"\b(depress|hopeless|empty|sad|exhaust|burnout|unmotivated|worthless|failure|udaas)\b", q_lower):
        keywords.append("depression OR behavioral activation OR burnout")
    if re.search(r"\b(anger|angry|furious|yell|frustrat|rage|gussa)\b", q_lower):
        keywords.append("emotional regulation OR anger management OR DBT")
    if re.search(r"\b(sleep|insomnia|tired|nightmare|restless|neend)\b", q_lower):
        keywords.append("insomnia OR sleep hygiene OR CBT-I")
    if re.search(r"\b(grief|loss|died|death|passed away|mourning|shok)\b", q_lower):
        keywords.append("grief counseling OR bereavement")
    if re.search(r"\b(trauma|ptsd|flashback|abuse|trigger)\b", q_lower):
        keywords.append("trauma informed therapy OR somatic grounding")
    if re.search(r"\b(numb|dissociat|depersonaliz)\b", q_lower):
        keywords.append("dissociation OR hypoarousal OR somatic experiencing")

    if not keywords:
        return "cognitive behavioral therapy OR somatic regulation OR psychological intervention"
    return " AND ".join(keywords)


def extract_clinical_topic(query: str) -> str:
    """Intelligently maps patient symptoms to authoritative Wikipedia psychological taxonomy."""
    import re
    q_lower = (query or "").lower().strip()
    if re.search(r"\b(anxi|panic|nervous|worry|dread|racing heart|heart pounding|ghabrahat)\b", q_lower):
        return "Anxiety"
    if re.search(r"\b(memory|forget|brain fog|confusion|recall|concentration|amnesia|yaaddasht)\b", q_lower):
        return "Memory"
    if re.search(r"\b(depress|hopeless|empty|sad|worthless|melancholy|udaas)\b", q_lower):
        return "Depression_(mood)"
    if re.search(r"\b(burnout|exhaust|overwhelm|stressed|work stress)\b", q_lower):
        return "Burnout_(psychology)"
    if re.search(r"\b(anger|angry|furious|yell|rage|irritab|gussa)\b", q_lower):
        return "Anger"
    if re.search(r"\b(sleep|insomnia|tired|nightmare|restless|neend)\b", q_lower):
        return "Insomnia"
    if re.search(r"\b(grief|loss|mourning|bereave|shok)\b", q_lower):
        return "Grief"
    if re.search(r"\b(trauma|ptsd|flashback|abuse)\b", q_lower):
        return "Psychological_trauma"
    if re.search(r"\b(numb|dissociat|depersonaliz)\b", q_lower):
        return "Dissociation_(psychology)"
    if re.search(r"\b(adhd|focus|distract|procrastinat)\b", q_lower):
        return "Attention_deficit_hyperactivity_disorder"
    if re.search(r"\b(lonel|isolat|alone)\b", q_lower):
        return "Loneliness"
    if re.search(r"\b(imposter|failure|inadequa)\b", q_lower):
        return "Impostor_syndrome"
    if re.search(r"\b(emotion|affect|feeling)\b", q_lower):
        return "Emotion"

    stopwords = {"have", "feel", "feeling", "felt", "with", "from", "today", "very", "much", "about", "that", "this", "what", "when", "where", "help", "cant", "cannot", "need", "some", "i", "am", "my"}
    words = [w for w in re.sub(r"[^a-zA-Z0-9\s]", " ", q_lower).split() if len(w) >= 4 and w not in stopwords]
    return words[0].capitalize() if words else "Cognitive_behavioral_therapy"


class KeylessClinicalSearch:
    """Multi-source search engine operating entirely without API keys."""

    def __init__(self, timeout: float = 6.0):
        self.timeout = timeout
        self.client = httpx.AsyncClient(
            timeout=timeout,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )

    async def search_pubmed(self, query: str, max_results: int = 2) -> list[ClinicalEvidence]:
        """NCBI PubMed / PMC E-Utilities (Publicly open, relevance-sorted, no key required)."""
        try:
            clinical_terms = extract_clinical_keywords(query)
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            params = {
                "db": "pmc",
                "term": f"({clinical_terms}) AND (psychotherapy OR cognitive behavioral therapy OR somatic regulation)",
                "sort": "relevance",
                "retmode": "json",
                "retmax": str(max_results)
            }
            res = await self.client.get(search_url, params=params)
            if res.status_code != 200:
                return []

            data = res.json()
            id_list = data.get("esearchresult", {}).get("idlist", [])
            if not id_list:
                return []

            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            sum_params = {"db": "pmc", "id": ",".join(id_list), "retmode": "json"}
            sum_res = await self.client.get(summary_url, params=sum_params)
            if sum_res.status_code != 200:
                return []

            sum_data = sum_res.json().get("result", {})
            results: list[ClinicalEvidence] = []
            for uid in id_list:
                item = sum_data.get(uid, {})
                title = item.get("title", "Clinical Study")
                results.append(
                    ClinicalEvidence(
                        title=title,
                        summary=f"NCBI Clinical Evidence on {query[:40]}: {title}",
                        source="pubmed_ncbi",
                        url=f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{uid}/"
                    )
                )
            return results
        except Exception as err:
            logger.warning(f"PubMed search bypassed: {err}")
            return []

    async def search_wikipedia(self, query: str) -> list[ClinicalEvidence]:
        """Wikipedia Clinical Summary REST API (Free, zero key, authoritative clinical taxonomy)."""
        try:
            topic = extract_clinical_topic(query)
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{topic}"
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                if "extract" in data and data.get("type") != "disambiguation":
                    return [
                        ClinicalEvidence(
                            title=data.get("title", "Psychological Topic"),
                            summary=data.get("extract", ""),
                            source="wikipedia_clinical",
                            url=data.get("content_urls", {}).get("desktop", {}).get("page")
                        )
                    ]
            # Fallback to Cognitive_behavioral_therapy if specific page not found
            if topic != "Cognitive_behavioral_therapy":
                fallback_res = await self.client.get("https://en.wikipedia.org/api/rest_v1/page/summary/Cognitive_behavioral_therapy")
                if fallback_res.status_code == 200:
                    fb_data = fallback_res.json()
                    if "extract" in fb_data:
                        return [
                            ClinicalEvidence(
                                title=fb_data.get("title", "Cognitive Behavioral Therapy"),
                                summary=fb_data.get("extract", ""),
                                source="wikipedia_clinical",
                                url=fb_data.get("content_urls", {}).get("desktop", {}).get("page")
                            )
                        ]
        except Exception as err:
            logger.warning(f"Wikipedia search bypassed: {err}")
        return []

    async def search(self, query: str) -> list[ClinicalEvidence]:
        """Queries peer-reviewed PubMed literature and Wikipedia clinical taxonomy in parallel (Zero Google/DDG)."""
        wiki_task = asyncio.create_task(self.search_wikipedia(query))
        pubmed_task = asyncio.create_task(self.search_pubmed(query, max_results=2))

        wiki_res, pubmed_res = await asyncio.gather(wiki_task, pubmed_task, return_exceptions=True)
        results: list[ClinicalEvidence] = []
        if isinstance(wiki_res, list):
            results.extend(wiki_res)
        if isinstance(pubmed_res, list):
            results.extend(pubmed_res)

        if results:
            return results

        q = query.lower()
        if any(w in q for w in ["anxi", "panic", "fear", "chest", "scared"]):
            return [OFFLINE_PROTOCOLS["anxiety"]]
        elif any(w in q for w in ["depress", "sad", "hopeless", "tired", "stuck"]):
            return [OFFLINE_PROTOCOLS["depression"]]
        return [OFFLINE_PROTOCOLS["overwhelm"]]

    def format_grounding_context(self, evidence_list: list[ClinicalEvidence]) -> str:
        """
        Formats clinical evidence strictly into:
        [Wikipedia Context]: {wikipedia_extract}
        [PubMed Literature]: {pubmed_abstracts}
        """
        wiki_parts = [e.summary for e in evidence_list if "wikipedia" in e.source.lower() or e.source == "wikipedia_clinical"]
        pubmed_parts = [f"{e.title}: {e.summary}" for e in evidence_list if "pubmed" in e.source.lower() or e.source == "pubmed_ncbi"]

        wiki_extract = " ".join(wiki_parts) if wiki_parts else "Evidence-based psychological constructs and cognitive behavioral regulation principles."
        pubmed_abstracts = " ".join(pubmed_parts) if pubmed_parts else "Peer-reviewed clinical trials on psychotherapeutic interventions and autonomic regulation."

        return f"[Wikipedia Context]: {wiki_extract}\n[PubMed Literature]: {pubmed_abstracts}"

    async def close(self):
        if not self.client.is_closed:
            await self.client.aclose()


# Backward-compatibility alias
ClinicalSearchEngine = KeylessClinicalSearch
