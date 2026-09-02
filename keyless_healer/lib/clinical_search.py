"""
lib/clinical_search.py
Free, zero-key multi-source clinical evidence search engine.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

import httpx

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

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

    if re.search(r"\b(anxi|panic|nervous|worry|overwhelm|fear|racing|dread)\b", q_lower):
        keywords.append("anxiety OR panic OR autonomic regulation")
    if re.search(r"\b(depress|hopeless|empty|sad|exhaust|burnout|unmotivated|worthless|failure)\b", q_lower):
        keywords.append("depression OR behavioral activation OR burnout")
    if re.search(r"\b(anger|angry|furious|yell|frustrat|rage)\b", q_lower):
        keywords.append("emotional regulation OR anger management OR DBT")
    if re.search(r"\b(sleep|insomnia|tired|nightmare|restless)\b", q_lower):
        keywords.append("insomnia OR sleep hygiene OR CBT-I")
    if re.search(r"\b(grief|loss|died|death|passed away|mourning)\b", q_lower):
        keywords.append("grief counseling OR bereavement")
    if re.search(r"\b(trauma|ptsd|flashback|abuse|trigger)\b", q_lower):
        keywords.append("trauma informed therapy OR somatic grounding")

    if not keywords:
        return "cognitive behavioral therapy OR somatic regulation OR psychological intervention"
    return " AND ".join(keywords)


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

    async def search_duckduckgo(self, query: str, max_results: int = 2) -> list[ClinicalEvidence]:
        """DuckDuckGo Instant Web Search (Free, zero API key)."""
        if DDGS is None:
            return []

        clinical_terms = extract_clinical_keywords(query)
        ddgs_cls = DDGS

        def _sync_ddg():
            try:
                if callable(ddgs_cls):
                    with ddgs_cls() as ddgs:
                        return list(
                            ddgs.text(
                                f"{clinical_terms} evidence based psychology therapy",
                                max_results=max_results
                            )
                        )
                return []
            except Exception:
                return []

        try:
            raw = await asyncio.to_thread(_sync_ddg)
            results: list[ClinicalEvidence] = []
            for r in raw:
                results.append(
                    ClinicalEvidence(
                        title=r.get("title", "Psychological Resource"),
                        summary=r.get("body", ""),
                        source="duckduckgo",
                        url=r.get("href")
                    )
                )
            return results
        except Exception as err:
            logger.warning(f"DuckDuckGo search bypassed: {err}")
            return []

    async def search_wikipedia(self, query: str) -> list[ClinicalEvidence]:
        """Wikipedia Clinical Summary REST API (Free, zero key)."""
        try:
            clean_query = query.split()[0] if query else "Psychotherapy"
            url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{clean_query}"
            res = await self.client.get(url)
            if res.status_code == 200:
                data = res.json()
                if "extract" in data:
                    return [
                        ClinicalEvidence(
                            title=data.get("title", "Psychological Topic"),
                            summary=data.get("extract", ""),
                            source="wikipedia_clinical",
                            url=data.get("content_urls", {}).get("desktop", {}).get("page")
                        )
                    ]
        except Exception as err:
            logger.warning(f"Wikipedia search bypassed: {err}")
        return []

    async def search(self, query: str) -> list[ClinicalEvidence]:
        """Runs the search cascade: PubMed -> DuckDuckGo -> Wikipedia -> Local Cache."""
        results = await self.search_pubmed(query, max_results=2)
        if results:
            return results

        results = await self.search_duckduckgo(query, max_results=2)
        if results:
            return results

        results = await self.search_wikipedia(query)
        if results:
            return results

        q = query.lower()
        if any(w in q for w in ["anxi", "panic", "fear", "chest", "scared"]):
            return [OFFLINE_PROTOCOLS["anxiety"]]
        elif any(w in q for w in ["depress", "sad", "hopeless", "tired", "stuck"]):
            return [OFFLINE_PROTOCOLS["depression"]]
        return [OFFLINE_PROTOCOLS["overwhelm"]]

    async def close(self):
        if not self.client.is_closed:
            await self.client.aclose()


# Backward-compatibility alias
ClinicalSearchEngine = KeylessClinicalSearch
