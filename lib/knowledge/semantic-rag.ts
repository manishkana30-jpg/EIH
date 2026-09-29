/**
 * lib/knowledge/semantic-rag.ts
 *
 * Client & Edge Local BM25 Information Retrieval Engine.
 * Enables zero-latency semantic search over:
 * - Living Clinical Guides (`lib/knowledge/clinical-guides.json`)
 * - Clinical Condition Protocols (`data/psychology_library.json`)
 * - Bhagavad Gita Wisdom Verses (`data/wellness_flow/gita_verses.json`)
 *
 * 100% keyless, offline-ready, zero external cloud dependencies.
 */

import clinicalGuidesData from './clinical-guides.json' with { type: 'json' };
import psychologyLibData from '../../data/psychology_library.json' with { type: 'json' };
import gitaVersesData from '../../data/wellness_flow/gita_verses.json' with { type: 'json' };

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'tell', 'explain', 'give', 'app', 'does', 'can'
]);

export function tokenizeText(text: string): string[] {
  if (!text) return [];
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9\s_\-]/g, ' ');
  return clean.split(/\s+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export interface SearchableDoc {
  id: string;
  type: 'clinical_guide' | 'condition' | 'gita';
  title: string;
  category: string;
  summary: string;
  bodyMarkdown: string;
  sourceUrl: string;
  evidenceSource: string;
  citations: Array<{ title: string; authors: string; journal: string; pub_date: string; url: string }>;
  tokens: string[];
}

export interface SemanticSearchResult {
  id: string;
  type: 'clinical_guide' | 'condition' | 'gita';
  title: string;
  category: string;
  score: number;
  snippet: string;
  sourceUrl: string;
  evidenceSource: string;
  citations: Array<{ title: string; authors: string; journal: string; pub_date: string; url: string }>;
}

export interface ConversationalBridgeAnswer {
  query: string;
  answerText: string;
  matchedTitle: string;
  sourceUrl: string;
  citationLabel: string;
  reorientationPrompt: string;
  score: number;
}

class ClientBM25Engine {
  private documents: SearchableDoc[] = [];
  private docLengths: number[] = [];
  private avgDocLength = 1;
  private idfMap = new Map<string, number>();
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  constructor() {
    this.buildIndex();
  }

  public reload(): void {
    this.buildIndex();
  }

  public buildIndex(): void {
    this.documents = [];

    // 1. Index Clinical Guides (including auto-updated PubMed & Wikipedia entries)
    if (Array.isArray(clinicalGuidesData)) {
      for (const g of clinicalGuidesData as any[]) {
        const keywords = Array.isArray(g.aiTriggerKeywords) ? g.aiTriggerKeywords.join(' ') : '';
        const rawContent = `${g.title || ''} ${g.summary || ''} ${g.bodyMarkdown || ''} ${keywords}`;
        this.documents.push({
          id: g.id || 'guide',
          type: 'clinical_guide',
          title: g.title || 'Clinical Protocol',
          category: g.category || 'neuroscience',
          summary: g.summary || '',
          bodyMarkdown: g.bodyMarkdown || '',
          sourceUrl: g.source_url || 'https://pubmed.ncbi.nlm.nih.gov/',
          evidenceSource: g.evidence_level || 'peer_reviewed_pubmed',
          citations: Array.isArray(g.citations) ? g.citations : [],
          tokens: tokenizeText(rawContent),
        });
      }
    }

    // 2. Index Psychology Library Conditions
    if (Array.isArray(psychologyLibData)) {
      for (const c of psychologyLibData as any[]) {
        const sol = c.solutions || {};
        const rawContent = `${c.name || ''} ${c.category || ''} ${c.triguna_balance || ''} ${(c.core_symptoms || []).join(' ')} ${sol.cbt_reframing || ''} ${sol.somatic_anchor || ''}`;
        this.documents.push({
          id: c.id || 'condition',
          type: 'condition',
          title: c.name || 'Psychological Protocol',
          category: c.category || 'psychology',
          summary: sol.cbt_reframing || '',
          bodyMarkdown: `### ${c.name}\n${sol.cbt_reframing}\n\n**Somatic Anchor:** ${sol.somatic_anchor}`,
          sourceUrl: '/library?tab=conditions',
          evidenceSource: 'clinical_protocol',
          citations: [],
          tokens: tokenizeText(rawContent),
        });
      }
    }

    // 3. Index Gita Wisdom Verses
    const verses = (gitaVersesData as any)?.verses;
    if (Array.isArray(verses)) {
      for (const v of verses) {
        const rawContent = `Gita Chapter ${v.chapter} Verse ${v.verse} ${v.theme || ''} ${v.simple_meaning_en || ''} ${v.practical_solution_en || ''}`;
        this.documents.push({
          id: v.verse_id || 'gita',
          type: 'gita',
          title: `Bhagavad Gita ${v.chapter}.${v.verse}`,
          category: 'gita_wisdom',
          summary: v.simple_meaning_en || '',
          bodyMarkdown: `${v.simple_meaning_en || ''}\n\n**Practice:** ${v.practical_solution_en || ''}`,
          sourceUrl: '/library?tab=gita',
          evidenceSource: 'vedantic_contemplation',
          citations: [],
          tokens: tokenizeText(rawContent),
        });
      }
    }

    // Precompute BM25 statistics
    this.docLengths = this.documents.map((d) => d.tokens.length);
    const totalTokens = this.docLengths.reduce((acc, len) => acc + len, 0);
    this.avgDocLength = this.documents.length > 0 ? totalTokens / this.documents.length : 1;

    // Document frequencies
    const dfMap = new Map<string, number>();
    for (const doc of this.documents) {
      const unique = new Set(doc.tokens);
      for (const t of unique) {
        dfMap.set(t, (dfMap.get(t) || 0) + 1);
      }
    }

    // Precompute IDF
    this.idfMap.clear();
    const N = this.documents.length;
    for (const [term, df] of dfMap.entries()) {
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      this.idfMap.set(term, Math.max(0.01, idf));
    }
  }

  public search(query: string, topK: number = 3): SemanticSearchResult[] {
    const qTokens = tokenizeText(query);
    if (qTokens.length === 0 || this.documents.length === 0) return [];

    const scored: Array<{ docIndex: number; score: number }> = [];

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const docLen = this.docLengths[i];
      const termFreqs = new Map<string, number>();
      for (const t of doc.tokens) {
        termFreqs.set(t, (termFreqs.get(t) || 0) + 1);
      }

      let score = 0;
      for (const qt of qTokens) {
        const tf = termFreqs.get(qt) || 0;
        if (tf > 0) {
          const idf = this.idfMap.get(qt) || 0.5;
          const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength));
          score += idf * ((tf * (this.k1 + 1)) / denom);
        }
      }

      // Title exact-match boost
      const titleLower = doc.title.toLowerCase();
      for (const qt of qTokens) {
        if (titleLower.includes(qt)) {
          score += 1.8;
        }
      }

      if (score > 0) {
        scored.push({ docIndex: i, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(({ docIndex, score }) => {
      const doc = this.documents[docIndex];
      const snippet = doc.summary || doc.bodyMarkdown.slice(0, 260) + '...';
      return {
        id: doc.id,
        type: doc.type,
        title: doc.title,
        category: doc.category,
        score: Math.round(score * 1000) / 1000,
        snippet,
        sourceUrl: doc.sourceUrl,
        evidenceSource: doc.evidenceSource,
        citations: doc.citations,
      };
    });
  }

  public answerConversationalBridge(query: string): ConversationalBridgeAnswer | null {
    const hits = this.search(query, 2);
    if (!hits.length || hits[0].score < 1.0) {
      return null;
    }

    const top = hits[0];
    let citationLabel = 'Clinical Knowledge Library';
    if (top.citations && top.citations.length > 0) {
      const first = top.citations[0];
      citationLabel = `PubMed: ${first.journal || 'PMC'} (${first.pub_date || 'Recent'})`;
    } else if (top.sourceUrl.includes('wikipedia')) {
      citationLabel = 'Peer-Reviewed Neuroscience Library (Wikipedia & PubMed)';
    }

    const cleanSummary = top.snippet.replace(/\n+/g, ' ').trim();
    const answerText = `${top.title.split(':')[0]}: ${cleanSummary} Clinically, slow rhythmic breathing (e.g. 6-second exhalations) or focused visual gazing stimulates the vagus nerve to down-regulate sympathetic arousal.`;

    return {
      query,
      answerText,
      matchedTitle: top.title,
      sourceUrl: top.sourceUrl,
      citationLabel,
      reorientationPrompt: 'I am a neuro-vedantic guide. How are you feeling in your body right now?',
      score: top.score,
    };
  }
}

export const clientBM25Engine = new ClientBM25Engine();
