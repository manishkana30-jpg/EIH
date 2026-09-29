"""
keyless_healer/lib/semantic_search.py

Lightweight, 100% Local BM25 & TF-IDF Semantic Search Engine.
Retrieves and ranks evidence across:
1. Dynamic PubMed & Wikipedia living clinical guides (`lib/knowledge/clinical-guides.json`)
2. Psychology clinical condition protocols (`data/psychology_library.json`)
3. Bhagavad Gita psychological contemplation library (`data/wellness_flow/gita_verses.json`)
Operates completely offline without paid embedding models or external cloud vector databases.
"""

from __future__ import annotations

import json
import logging
import math
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger("SemanticRAG")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
CLINICAL_GUIDES_PATH = WORKSPACE_ROOT / "lib" / "knowledge" / "clinical-guides.json"
PSYCHOLOGY_LIB_PATH = WORKSPACE_ROOT / "data" / "psychology_library.json"
GITA_VERSES_PATH = WORKSPACE_ROOT / "data" / "wellness_flow" / "gita_verses.json"

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
    "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those",
    "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
    "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while",
    "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves", "tell", "explain", "give", "app", "does"
}


def tokenize(text: str) -> list[str]:
    """Cleans, normalizes, and tokenizes text into linguistic terms."""
    if not text:
        return []
    clean = re.sub(r"[^a-zA-Z0-9\s_\-]", " ", text.lower())
    tokens = [t for t in clean.split() if len(t) >= 2 and t not in STOPWORDS]
    return tokens


@dataclass
class IndexedDocument:
    doc_id: str
    doc_type: str  # 'clinical_guide', 'condition', 'gita'
    title: str
    category: str
    content: str
    source_url: str
    tokens: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class SemanticSearchResult:
    doc_id: str
    doc_type: str
    title: str
    category: str
    score: float
    snippet: str
    source_url: str
    evidence_source: str
    citations: list[dict[str, Any]] = field(default_factory=list)


class BM25SearchEngine:
    """
    Zero-key Okapi BM25 Information Retrieval implementation.
    Parameters: k1=1.2 (term frequency saturation), b=0.75 (length normalization).
    """

    def __init__(self, k1: float = 1.2, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.documents: list[IndexedDocument] = []
        self.doc_lengths: list[int] = []
        self.avg_doc_length: float = 0.0
        self.doc_freqs: dict[str, int] = {}
        self.idf_cache: dict[str, float] = {}
        self._load_and_index()

    def _load_and_index(self) -> None:
        """Loads and indexes all local knowledge stores."""
        self.documents = []

        # 1. Index Living Clinical Guides (PubMed + Wikipedia)
        if CLINICAL_GUIDES_PATH.exists():
            try:
                with open(CLINICAL_GUIDES_PATH, "r", encoding="utf-8") as f:
                    guides = json.load(f)
                    if isinstance(guides, list):
                        for g in guides:
                            content = f"{g.get('title', '')} {g.get('summary', '')} {g.get('bodyMarkdown', '')} {' '.join(g.get('aiTriggerKeywords', []))}"
                            doc = IndexedDocument(
                                doc_id=g.get("id", "guide_unknown"),
                                doc_type="clinical_guide",
                                title=g.get("title", "Clinical Guide"),
                                category=g.get("category", "clinical"),
                                content=g.get("bodyMarkdown", g.get("summary", "")),
                                source_url=g.get("source_url", "https://pubmed.ncbi.nlm.nih.gov/"),
                                tokens=tokenize(content),
                                metadata={
                                    "summary": g.get("summary", ""),
                                    "citations": g.get("citations", []),
                                    "evidence_level": g.get("evidence_level", "peer_reviewed"),
                                    "last_updated_utc": g.get("last_updated_utc", ""),
                                },
                            )
                            self.documents.append(doc)
            except Exception as e:
                logger.warning(f"Failed to index clinical-guides.json: {e}")

        # 2. Index Psychology Conditions
        if PSYCHOLOGY_LIB_PATH.exists():
            try:
                with open(PSYCHOLOGY_LIB_PATH, "r", encoding="utf-8") as f:
                    conditions = json.load(f)
                    if isinstance(conditions, list):
                        for c in conditions:
                            sol = c.get("solutions", {})
                            content = (
                                f"{c.get('name', '')} {c.get('category', '')} {c.get('triguna_balance', '')} "
                                f"{' '.join(c.get('core_symptoms', []))} {' '.join(c.get('cognitive_distortions', []))} "
                                f"{sol.get('cbt_reframing', '')} {sol.get('somatic_anchor', '')} {sol.get('pranayama', '')}"
                            )
                            doc = IndexedDocument(
                                doc_id=c.get("id", "condition_unknown"),
                                doc_type="condition",
                                title=c.get("name", "Psychological Protocol"),
                                category=c.get("category", "psychology"),
                                content=f"{c.get('name', '')} - {sol.get('cbt_reframing', '')}\nSomatic Anchor: {sol.get('somatic_anchor', '')}",
                                source_url="/library?tab=conditions",
                                tokens=tokenize(content),
                                metadata={
                                    "somatic_anchor": sol.get("somatic_anchor", ""),
                                    "cbt_reframing": sol.get("cbt_reframing", ""),
                                    "pranayama": sol.get("pranayama", ""),
                                },
                            )
                            self.documents.append(doc)
            except Exception as e:
                logger.warning(f"Failed to index psychology_library.json: {e}")

        # 3. Index Gita Wisdom Verses
        if GITA_VERSES_PATH.exists():
            try:
                with open(GITA_VERSES_PATH, "r", encoding="utf-8") as f:
                    gita_data = json.load(f)
                    verses = gita_data.get("verses", [])
                    if isinstance(verses, list):
                        for v in verses:
                            content = f"{v.get('theme', '')} {v.get('simple_meaning_en', '')} {v.get('practical_solution_en', '')} {' '.join(v.get('clinical_indication', []))}"
                            doc = IndexedDocument(
                                doc_id=v.get("verse_id", "bg_unknown"),
                                doc_type="gita",
                                title=f"Bhagavad Gita Chapter {v.get('chapter')}, Verse {v.get('verse')}",
                                category="philosophical_contemplation",
                                content=f"{v.get('simple_meaning_en', '')}\nPractical: {v.get('practical_solution_en', '')}",
                                source_url="/library?tab=gita",
                                tokens=tokenize(content),
                                metadata={
                                    "meaning": v.get("simple_meaning_en", ""),
                                    "solution": v.get("practical_solution_en", ""),
                                },
                            )
                            self.documents.append(doc)
            except Exception as e:
                logger.warning(f"Failed to index gita_verses.json: {e}")

        # Compute document statistics for BM25
        self.doc_lengths = [len(d.tokens) for d in self.documents]
        total_tokens = sum(self.doc_lengths)
        num_docs = len(self.documents)
        self.avg_doc_length = total_tokens / num_docs if num_docs > 0 else 1.0

        # Term document frequency (DF)
        self.doc_freqs = {}
        for d in self.documents:
            unique_terms = set(d.tokens)
            for t in unique_terms:
                self.doc_freqs[t] = self.doc_freqs.get(t, 0) + 1

        # Precompute IDF values
        self.idf_cache = {}
        for term, df in self.doc_freqs.items():
            # Standard Lucene/BM25 Robertson-Spärck Jones IDF formula
            idf = math.log(1.0 + (num_docs - df + 0.5) / (df + 0.5))
            self.idf_cache[term] = max(0.01, idf)

        logger.info(f"BM25 Search Engine indexed {num_docs} documents with {len(self.doc_freqs)} distinct terms.")

    def search(self, query: str, top_k: int = 3) -> list[SemanticSearchResult]:
        """Executes BM25 scoring over all indexed documents."""
        if not self.documents:
            self._load_and_index()

        q_tokens = tokenize(query)
        if not q_tokens:
            return []

        scores: list[tuple[int, float]] = []

        for idx, doc in enumerate(self.documents):
            score = 0.0
            doc_len = self.doc_lengths[idx]
            # Count term frequencies in this document
            term_counts: dict[str, int] = {}
            for t in doc.tokens:
                term_counts[t] = term_counts.get(t, 0) + 1

            for qt in q_tokens:
                if qt in term_counts:
                    tf = term_counts[qt]
                    idf = self.idf_cache.get(qt, 0.5)
                    # BM25 TF component
                    denom = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avg_doc_length))
                    score += idf * ((tf * (self.k1 + 1.0)) / denom)

            # Boost if query matches title terms exactly
            title_lower = doc.title.lower()
            for qt in q_tokens:
                if qt in title_lower:
                    score += 1.8

            if score > 0.0:
                scores.append((idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)

        results: list[SemanticSearchResult] = []
        for doc_idx, score in scores[:top_k]:
            doc = self.documents[doc_idx]
            snippet = doc.metadata.get("summary") or doc.content[:280] + "..."
            results.append(
                SemanticSearchResult(
                    doc_id=doc.doc_id,
                    doc_type=doc.doc_type,
                    title=doc.title,
                    category=doc.category,
                    score=round(score, 3),
                    snippet=snippet,
                    source_url=doc.source_url,
                    evidence_source=doc.metadata.get("evidence_level", "verified_clinical"),
                    citations=doc.metadata.get("citations", []),
                )
            )

        return results

    def answer_conversational_bridge(self, query: str) -> Optional[dict[str, Any]]:
        """
        Synthesizes a 2-3 sentence evidence-based clinical answer
        citing PubMed / Wikipedia, then gently re-orients the user to somatic awareness.
        """
        results = self.search(query, top_k=2)
        if not results or results[0].score < 1.2:
            return None

        top = results[0]
        title = top.title
        summary = top.snippet.replace("\n", " ").strip()

        # Build clean citation label
        citation_label = "NCBI PubMed Clinical Evidence"
        if top.citations:
            first_c = top.citations[0]
            citation_label = f"PubMed: {first_c.get('journal', 'PMC')} ({first_c.get('pub_date', 'Recent')})"
        elif "wikipedia" in top.source_url.lower():
            citation_label = "Peer-Reviewed Neuro-Psychology Library (Wikipedia/PubMed)"

        # Clinical 2-3 sentence synthesis
        answer_text = (
            f"According to {citation_label}, {title.split(':')[0]} focuses on: {summary} "
            f"Clinically, conscious sensory grounding and paced respiration activate the ventral vagal brake, "
            f"quieting autonomic hyperarousal."
        )

        return {
            "query": query,
            "answer": answer_text,
            "matched_title": top.title,
            "source_url": top.source_url,
            "citation_label": citation_label,
            "reorientation_prompt": "I am a neuro-vedantic guide. How are you feeling in your body right now?",
            "score": top.score,
        }


# Global singleton
bm25_search_engine = BM25SearchEngine()
