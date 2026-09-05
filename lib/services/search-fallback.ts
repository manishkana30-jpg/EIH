// lib/services/search-fallback.ts

export interface ClinicalSearchResult {
  title: string;
  summary: string;
  source: "pubmed" | "wikipedia" | "local_cache" | "psychology_library" | string;
  url?: string;
}

/**
 * Formats clinical evidence into the strict prompt structure:
 * [Wikipedia Context]: {wikipedia_extract}
 * [PubMed Literature]: {pubmed_abstracts}
 */
export function formatClinicalContext(evidence: ClinicalSearchResult[]): string {
  const wiki = evidence
    .filter((e) => e.source === "wikipedia" || e.source === "wikipedia_clinical")
    .map((e) => e.summary)
    .join(" ");
  const pubmed = evidence
    .filter((e) => e.source === "pubmed" || e.source === "pubmed_ncbi")
    .map((e) => `${e.title}: ${e.summary}`)
    .join(" ");

  const wikiExtract =
    wiki ||
    "Evidence-based psychological constructs, diagnostic taxonomy, and cognitive-affective regulation frameworks.";
  const pubmedAbstracts =
    pubmed ||
    "Empirical clinical trials and peer-reviewed literature on psychotherapeutic interventions and autonomic regulation.";

  return `[Wikipedia Context]: ${wikiExtract}\n[PubMed Literature]: ${pubmedAbstracts}`;
}

/**
 * Extracts psychological symptoms and constructs focused clinical search terms.
 */
export function extractClinicalKeywords(query: string): string {
  const lower = (query || '').toLowerCase();
  const keywords: string[] = [];

  if (/\b(anxi|panic|nervous|worry|overwhelm|fear|racing|dread|ghabrahat)\b/i.test(lower)) {
    keywords.push('anxiety OR panic OR autonomic regulation');
  }
  if (/\b(memory|forget|brain fog|confusion|recall|concentration|yaaddasht)\b/i.test(lower)) {
    keywords.push('working memory OR cognitive fatigue OR brain fog');
  }
  if (/\b(depress|hopeless|empty|sad|exhaust|burnout|unmotivated|worthless|failure|udaas)\b/i.test(lower)) {
    keywords.push('depression OR behavioral activation OR burnout');
  }
  if (/\b(anger|angry|furious|yell|frustrat|rage|gussa)\b/i.test(lower)) {
    keywords.push('emotional regulation OR anger management OR DBT');
  }
  if (/\b(sleep|insomnia|tired|nightmare|restless|neend)\b/i.test(lower)) {
    keywords.push('insomnia OR sleep hygiene OR CBT-I');
  }
  if (/\b(grief|loss|died|death|passed away|mourning|shok)\b/i.test(lower)) {
    keywords.push('grief counseling OR bereavement');
  }
  if (/\b(trauma|ptsd|flashback|abuse|trigger)\b/i.test(lower)) {
    keywords.push('trauma informed therapy OR somatic grounding');
  }
  if (/\b(numb|dissociat|depersonaliz)\b/i.test(lower)) {
    keywords.push('dissociation OR hypoarousal OR somatic experiencing');
  }

  if (keywords.length === 0) {
    return 'cognitive behavioral therapy OR mindfulness meditation OR somatic regulation';
  }
  return keywords.join(' AND ');
}

/**
 * Free NCBI PubMed Clinical Search (Public E-Utilities with Relevance Sorting)
 */
async function searchPubMed(query: string): Promise<ClinicalSearchResult[]> {
  try {
    const clinicalTerms = extractClinicalKeywords(query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
      `(${clinicalTerms}) AND (psychotherapy OR cognitive behavioral therapy OR somatic regulation)`
    )}&sort=relevance&retmode=json&retmax=2`;

    const res = await fetch(searchUrl, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`PubMed Search Failed: ${res.status}`);
    const data = await res.json();
    const idList: string[] = data.esearchresult?.idlist || [];

    if (idList.length === 0) return [];

    // Fetch summaries for retrieved IDs
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id=${idList.join(
      ","
    )}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    const results: ClinicalSearchResult[] = idList.map((id) => ({
      title: summaryData.result?.[id]?.title || "Clinical Study",
      summary: summaryData.result?.[id]?.authors?.[0]?.name
        ? `Clinical findings on ${query}: ${summaryData.result[id].title}`
        : "Evidence-based mental health study.",
      source: "pubmed",
      url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`,
    }));

    return results;
  } catch (err) {
    console.warn("PubMed Fallback Triggered:", err);
    return [];
  }
}

/**
 * Free Wikipedia Clinical Psychology REST API (Zero Key, Authoritative Medical Taxonomy)
 */
async function searchWikipedia(query: string): Promise<ClinicalSearchResult[]> {
  try {
    const lower = (query || '').toLowerCase().trim();
    let topic = 'Cognitive_behavioral_therapy';

    if (/\b(anxi|panic|nervous|worry|dread|racing heart|heart pounding|ghabrahat)\b/i.test(lower)) topic = 'Anxiety';
    else if (/\b(memory|forget|brain fog|confusion|recall|concentration|amnesia|yaaddasht)\b/i.test(lower)) topic = 'Memory';
    else if (/\b(depress|hopeless|empty|sad|worthless|melancholy|udaas)\b/i.test(lower)) topic = 'Depression_(mood)';
    else if (/\b(burnout|exhaust|overwhelm|stressed|work stress)\b/i.test(lower)) topic = 'Burnout_(psychology)';
    else if (/\b(anger|angry|furious|yell|rage|irritab|gussa)\b/i.test(lower)) topic = 'Anger';
    else if (/\b(sleep|insomnia|tired|nightmare|restless|neend)\b/i.test(lower)) topic = 'Insomnia';
    else if (/\b(grief|loss|mourning|bereave|shok)\b/i.test(lower)) topic = 'Grief';
    else if (/\b(trauma|ptsd|flashback|abuse)\b/i.test(lower)) topic = 'Psychological_trauma';
    else if (/\b(numb|dissociat|depersonaliz)\b/i.test(lower)) topic = 'Dissociation_(psychology)';
    else if (/\b(adhd|focus|distract|procrastinat)\b/i.test(lower)) topic = 'Attention_deficit_hyperactivity_disorder';
    else if (/\b(lonel|isolat|alone)\b/i.test(lower)) topic = 'Loneliness';
    else if (/\b(imposter|failure|inadequa)\b/i.test(lower)) topic = 'Impostor_syndrome';
    else if (/\b(emotion|affect|feeling)\b/i.test(lower)) topic = 'Emotion';
    else {
      const stopwords = new Set(['have', 'feel', 'feeling', 'felt', 'with', 'from', 'today', 'very', 'much', 'about', 'that', 'this', 'what', 'when', 'where', 'help', 'cant', 'cannot', 'need', 'some', 'i', 'am', 'my']);
      const words = lower.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !stopwords.has(w));
      topic = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Cognitive_behavioral_therapy';
    }

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EmotionalIntelligenceHealer/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.type !== 'disambiguation') {
        return [
          {
            title: data.title || "Psychological Concept",
            summary: data.extract,
            source: "wikipedia",
            url: data.content_urls?.desktop?.page || "https://en.wikipedia.org",
          },
        ];
      }
    }

    // Reliable fallback topic
    if (topic !== 'Cognitive_behavioral_therapy') {
      const fbRes = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Cognitive_behavioral_therapy', {
        headers: { 'User-Agent': 'EmotionalIntelligenceHealer/1.0' },
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData.extract) {
          return [
            {
              title: fbData.title || "Cognitive Behavioral Therapy",
              summary: fbData.extract,
              source: "wikipedia",
              url: fbData.content_urls?.desktop?.page || "https://en.wikipedia.org",
            },
          ];
        }
      }
    }

    return [];
  } catch (err) {
    console.warn("Wikipedia Fallback Triggered:", err);
    return [];
  }
}

/**
 * Master Search Function (Exclusively PubMed Literature + Wikipedia Context)
 */
export async function searchMentalHealthEvidence(query: string): Promise<ClinicalSearchResult[]> {
  // Query both PubMed and Wikipedia in parallel
  const [pubmedResults, wikiResults] = await Promise.all([
    searchPubMed(query),
    searchWikipedia(query),
  ]);

  const combined = [...pubmedResults, ...wikiResults];
  if (combined.length > 0) return combined;

  // 3. Fallback to Local Verified Clinical Knowledge matching query domain
  const lower = (query || '').toLowerCase();
  if (/\b(depress|hopeless|empty|sad|exhaust|burnout|unmotivated|worthless|failure|udaas)\b/i.test(lower) || /उदास|निराशा/.test(lower)) {
    return [
      {
        title: "Behavioral Activation & Micro-Momentum Intervention",
        summary: "To counter depressive inertia, initiate 2-minute micro-movements and opposite action without waiting for motivation.",
        source: "local_cache",
      },
    ];
  }
  if (/\b(anger|angry|furious|yell|frustrat|rage|gussa)\b/i.test(lower) || /गुस्सा|क्रोध/.test(lower)) {
    return [
      {
        title: "DBT Distress Tolerance & Cooling Regulation",
        summary: "For intense frustration and anger: apply cooling breath (Shitali), progressive physical grounding, and boundary clarification.",
        source: "local_cache",
      },
    ];
  }
  if (/\b(sleep|insomnia|tired|nightmare|restless|neend)\b/i.test(lower) || /नींद|अनिद्रा/.test(lower)) {
    return [
      {
        title: "CBT-I Stimulus Control & Autonomic Down-Regulation",
        summary: "For insomnia and bedtime rumination: apply 4-7-8 extended exhale breathing and reset the bed strictly for sleep.",
        source: "local_cache",
      },
    ];
  }
  if (/\b(grief|loss|died|death|passed away|mourning|shok)\b/i.test(lower) || /शोक|मौत/.test(lower)) {
    return [
      {
        title: "Compassionate Bereavement & Dual-Process Regulation",
        summary: "For grief and deep loss: place a hand over heart and belly with 4-6 rhythmic coherence to allow natural emotional wave processing.",
        source: "local_cache",
      },
    ];
  }
  if (/\b(pain|back pain|fibromyalgia|headache|migraine|dard)\b/i.test(lower) || /दर्द|सिरदर्द/.test(lower)) {
    return [
      {
        title: "Pain Reprocessing & Somatosensory Calming",
        summary: "For neuroplastic physical tension and discomfort: engage in objective somatic tracking with light curiosity and abdominal safety breathing.",
        source: "local_cache",
      },
    ];
  }

  return [
    {
      title: "Evidence-Based Somatic & CBT Intervention",
      summary:
        "For acute nervous system tension: deploy 5-4-3-2-1 Sensory Grounding, Physiological Sighs (2 inhales, prolonged exhale), and Cognitive Defusion ('I am noticing the thought that...').",
      source: "local_cache",
    },
  ];
}
