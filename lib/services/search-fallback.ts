// lib/services/search-fallback.ts

export interface ClinicalSearchResult {
  title: string;
  summary: string;
  source: "pubmed" | "tavily" | "duckduckgo" | "local_cache" | "psychology_library" | "google_search" | string;
  url?: string;
}

/**
 * Extracts psychological symptoms and constructs focused clinical search terms.
 */
export function extractClinicalKeywords(query: string): string {
  const lower = (query || '').toLowerCase();
  const keywords: string[] = [];

  if (/\b(anxi|panic|nervous|worry|overwhelm|fear|racing|dread)\b/i.test(lower)) {
    keywords.push('anxiety OR panic OR autonomic regulation');
  }
  if (/\b(depress|hopeless|empty|sad|exhaust|burnout|unmotivated|worthless|failure)\b/i.test(lower)) {
    keywords.push('depression OR behavioral activation OR burnout');
  }
  if (/\b(anger|angry|furious|yell|frustrat|rage)\b/i.test(lower)) {
    keywords.push('emotional regulation OR anger management OR DBT');
  }
  if (/\b(sleep|insomnia|tired|nightmare|restless)\b/i.test(lower)) {
    keywords.push('insomnia OR sleep hygiene OR CBT-I');
  }
  if (/\b(grief|loss|died|death|passed away|mourning)\b/i.test(lower)) {
    keywords.push('grief counseling OR bereavement');
  }
  if (/\b(trauma|ptsd|flashback|abuse|trigger)\b/i.test(lower)) {
    keywords.push('trauma informed therapy OR somatic grounding');
  }

  if (keywords.length === 0) {
    return 'cognitive behavioral therapy OR mindfulness meditation OR somatic regulation';
  }
  return keywords.join(' AND ');
}

/**
 * Tier 1: PubMed Clinical Search (Free NCBI API with Relevance Sorting)
 */
async function searchPubMed(query: string): Promise<ClinicalSearchResult[]> {
  try {
    const clinicalTerms = extractClinicalKeywords(query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${encodeURIComponent(
      `(${clinicalTerms}) AND (psychotherapy OR cognitive behavioral therapy OR somatic regulation)`
    )}&sort=relevance&retmode=json&retmax=3`;

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
      source: "pubmed"
    }));

    return results;
  } catch (err) {
    console.warn("PubMed Fallback Triggered:", err);
    return [];
  }
}

/**
 * Tier 2: Tavily Search API (Free Key)
 */
async function searchTavily(query: string): Promise<ClinicalSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${query} psychology therapy remedies`,
        search_depth: "basic",
        max_results: 3,
        include_answer: true
      })
    });

    if (!res.ok) throw new Error("Tavily API quota or error");
    const data = await res.json();

    return (data.results || []).map((r: any) => ({
      title: r.title,
      summary: r.content,
      source: "tavily"
    }));
  } catch (err) {
    console.warn("Tavily Fallback Triggered:", err);
    return [];
  }
}

/**
 * Master Search Function with Automatic Fallback
 */
export async function searchMentalHealthEvidence(query: string): Promise<ClinicalSearchResult[]> {
  // 1. Try PubMed
  let results = await searchPubMed(query);
  if (results.length > 0) return results;

  // 2. Try Tavily
  results = await searchTavily(query);
  if (results.length > 0) return results;

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
