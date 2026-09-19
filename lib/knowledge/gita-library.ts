/**
 * lib/knowledge/gita-library.ts
 * 
 * Bhagavad Gita Cognitive Therapy & Psychological Wisdom Library.
 * Provides authentic Sanskrit Shlokas, transliteration, philosophical meanings,
 * and situational cognitive reframings across all clinical emotional states.
 */

export interface GitaShlokaItem {
  id: string;
  chapter: number;
  verse: string;
  theme: string;
  keywords: string[];
  shloka_sanskrit: string;
  shloka_roman: string;
  philosophical_meaning: string;
  clinical_reframe: string;
  actionable_guidance: {
    what_to_do: string;
    what_not_to_do: string;
  };
}

export const GITA_LIBRARY: GitaShlokaItem[] = [
  {
    id: "bg_2_47",
    chapter: 2,
    verse: "47",
    theme: "Outcome Detachment / Career Anxiety / Decision Paralysis",
    keywords: [
      "dilemma", "confused", "cannot decide", "paralysis", "decision",
      "what should i do", "fear of failure", "results", "outcome", "interview",
      "exam", "career", "overwhelmed", "kya karu", "dharamsankat", "action",
      "future", "uncertainty", "perfectionism", "worried about result"
    ],
    shloka_sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    shloka_roman: "karmaṇy-evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ||",
    philosophical_meaning: "You have a right only to perform your duty, but never to the fruits of your actions. Never consider yourself the cause of the results, and never succumb to inaction or paralysis.",
    clinical_reframe: "Shift locus of control from unpredictable future outcomes to the present-moment process. Relieve performance anxiety and decision paralysis by pouring 100% of your energy into your immediate effort rather than agonizing over hypothetical consequences.",
    actionable_guidance: {
      what_to_do: "Focus exclusively on the single highest-integrity action you can take right now in the present hour.",
      what_not_to_do: "Stop mentally bargaining with an imaginary future and release attachment to guaranteeing the result."
    }
  },
  {
    id: "bg_2_14",
    chapter: 2,
    verse: "14",
    theme: "Impermanence of Pain / Heartbreak / Emotional Transience",
    keywords: [
      "pain", "grief", "sadness", "heartbreak", "loss", "suffering",
      "crying", "unbearable", "hurting", "temporary", "dukkha", "dard",
      "breakup", "partner", "separation", "mourning", "physical pain", "ache"
    ],
    shloka_sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
    shloka_roman: "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ |\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ||",
    philosophical_meaning: "The contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They are fleeting and impermanent, appearing and disappearing like seasons. Endure them patiently with inner resilience, O Bharata.",
    clinical_reframe: "Emotional distress tolerance and somatic acceptance (Titiksha). Painful sensations and grief have a natural neurobiological half-life; acknowledging them as passing waves rather than permanent identity dissolves secondary suffering.",
    actionable_guidance: {
      what_to_do: "Sit quietly, breathe into the raw physical sensations in your chest or throat without fighting them, and witness them as transient weather.",
      what_not_to_do: "Do not rush to numb or artificially suppress the sadness, and avoid telling yourself this grief will last forever."
    }
  },
  {
    id: "bg_2_62_63",
    chapter: 2,
    verse: "62-63",
    theme: "Anger Cascade / Betrayal / Cognitive De-escalation",
    keywords: [
      "anger", "furious", "rage", "irritation", "betrayal", "gaslighting",
      "boss", "unfair", "frustrated", "screaming", "gussa", "krodh",
      "insulted", "disrespected", "hostile", "conflict", "argument"
    ],
    shloka_sanskrit: "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥\nक्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
    shloka_roman: "dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate |\nsaṅgāt sañjāyate kāmaḥ kāmāt krodho 'bhijāyate ||\nkrodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ |\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati ||",
    philosophical_meaning: "Brooding on perceived wrongs produces attachment; attachment fuels unmet craving; from frustrated desire flares anger. From anger arises delusion; from delusion comes loss of memory; from lost memory comes the destruction of intellect, leading to self-ruin.",
    clinical_reframe: "The neurological fight-or-flight cascade. Sympathetic anger hijacks prefrontal cognitive reasoning (Buddhi Nasha). Intervene at the very first step of mental replaying to prevent impulsive retaliation.",
    actionable_guidance: {
      what_to_do: "Take an immediate 10-minute conversational freeze; perform 5 deep physiological sighs to cool cranial sympathetic arousal.",
      what_not_to_do: "Do not send reactive messages, confront in the heat of passion, or keep re-reading inciting words."
    }
  },
  {
    id: "bg_6_5",
    chapter: 6,
    verse: "5",
    theme: "Self-Mastery / Inner Critic / Imposter Syndrome",
    keywords: [
      "self doubt", "self sabotage", "my mind is my enemy", "hopeless",
      "helpless", "low confidence", "imposter", "inner critic", "shame",
      "worthless", "failure", "not good enough", "flawed", "defective"
    ],
    shloka_sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    shloka_roman: "uddhared ātmanātmānaṁ nātmānam avasādayet |\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||",
    philosophical_meaning: "Elevate yourself through the power of your own mind, and do not degrade yourself. For the mind alone is the true friend of the self, and the mind alone can be the self's greatest adversary.",
    clinical_reframe: "Cultivating unconditional self-agency and self-compassion. Your inner critic is merely a learned cognitive habit, not an objective truth. You possess the innate neuroplastic ability to train your mind as an empowering ally.",
    actionable_guidance: {
      what_to_do: "Speak to yourself with the exact patience, respect, and encouragement you would extend to a beloved friend in crisis.",
      what_not_to_do: "Do not collude with the internal bully by confirming derogatory self-judgments or self-deprecating narratives."
    }
  },
  {
    id: "bg_2_70",
    chapter: 2,
    verse: "70",
    theme: "Ocean Equanimity / Overwhelm / Sensory Chaos",
    keywords: [
      "peace", "stability", "calm", "anxiety", "overwhelmed", "chaos",
      "storm", "pressure", "turbulent", "shanti", "sukoon", "too much",
      "racing thoughts", "brain fog", "stressed", "workload", "burnout"
    ],
    shloka_sanskrit: "आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्।\nतद्वत्कामा यं प्रविशन्ति सर्वे स शान्तिमाप्नोति न कामकामी॥",
    shloka_roman: "āpūryamāṇam acala-pratiṣṭhaṁ samudram āpaḥ praviśanti yadvat |\ntadvat kāmā yaṁ praviśanti sarve sa śāntim āpnoti na kāma-kāmī ||",
    philosophical_meaning: "Just as the ocean remains unmoved and undisturbed while waters continually pour into it from all sides, so does a person of steady awareness into whom all desires, thoughts, and stressors enter without perturbing the core reach lasting peace.",
    clinical_reframe: "Vast container mindfulness. Conceptualize your consciousness as the unshakeable depth of the ocean; external emails, demands, and anxious thoughts are merely surface ripples that cannot compromise your fundamental inner center.",
    actionable_guidance: {
      what_to_do: "Ground your feet flat into the earth, expand your awareness outward into the whole body, and observe external pressures without absorbing them.",
      what_not_to_do: "Do not attempt to fight every single passing ripple or react to every urgent stimulus simultaneously."
    }
  },
  {
    id: "bg_6_26",
    chapter: 6,
    verse: "26",
    theme: "Restless Mind / Intrusive Thoughts / OCD Rumination",
    keywords: [
      "restless", "intrusive", "obsessive", "rumination", "can't stop thinking",
      "mind wandering", "distracted", "adhd", "looping thoughts", "racing",
      "mental rituals", "compulsion", "spiral", "overthinking"
    ],
    shloka_sanskrit: "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\nततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥",
    shloka_roman: "yato yato niścarati manaś cañcalam asthiram |\ntatas tato niyamyaitad ātmany eva vaśaṁ nayet ||",
    philosophical_meaning: "From wherever the restless and unsteady mind wanders away, one must gently restrain it and bring it back under the control of the Self.",
    clinical_reframe: "Cognitive defusion and non-judgmental attentional redirect. Mind-wandering is not a personal failure; the practice lies entirely in the gentle, non-reactive return of attention to your chosen anchor.",
    actionable_guidance: {
      what_to_do: "Each time an intrusive thought hijacks you, notice it without judgment ('Aha, rumination again') and gently guide attention back to the breath.",
      what_not_to_do: "Do not get furious at your mind for wandering, and avoid debating the logic of irrational intrusive thoughts."
    }
  },
  {
    id: "bg_18_63",
    chapter: 18,
    verse: "63",
    theme: "Autonomy / Existential Paralysis / Free Will",
    keywords: [
      "freedom", "choice", "paralyzed", "responsibility", "clarity",
      "free will", "what do you think", "tell me what to do", "stuck",
      "existential", "crossroads", "life choice", "independent"
    ],
    shloka_sanskrit: "इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया।\nविमृश्यैतदशेषेण यथेच्छसि तथा कुरु॥",
    shloka_roman: "iti te jñānam ākhyātaṁ guhyād guhyataraṁ mayā |\nvimṛśyaitad aśeṣeṇa yathecchasi tathā kuru ||",
    philosophical_meaning: "Thus I have revealed to you wisdom more confidential than all secrets. Ponder over it thoroughly, and then act as you choose according to your own conscious discernment.",
    clinical_reframe: "Reclaiming internal locus of control and conscious agency. Psychological support clarifies values and options, but genuine empowerment occurs when you step forward and author your own deliberate life choices.",
    actionable_guidance: {
      what_to_do: "Clarify your top two non-negotiable personal values, make a conscious decision honoring them, and take full ownership of the journey.",
      what_not_to_do: "Do not outsource your life decisions to others or wait for 100% guarantee before daring to act."
    }
  },
  {
    id: "bg_2_56",
    chapter: 2,
    verse: "56",
    theme: "Sthitaprajna / Emotional Stability / Freedom from Fear",
    keywords: [
      "fear", "panic", "scared", "terrified", "mood swings", "emotional",
      "unstable", "sensitive", "equanimity", "fear of future", "darr"
    ],
    shloka_sanskrit: "दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥",
    shloka_roman: "duḥkheṣv anudvigna-manāḥ sukheṣu vigata-spṛhaḥ |\nvīta-rāga-bhaya-krodhaḥ sthita-dhīr munir ucyate ||",
    philosophical_meaning: "One whose mind remains unshaken amidst adversity, who does not crave after pleasure, and who is free from attachment, fear, and anger, is called a sage of steady wisdom (Sthitaprajna).",
    clinical_reframe: "Affective equilibrium and autonomic resilience. True psychological strength is not the complete absence of painful emotion, but cultivating a stable observing self (Sakshi) that remains centered through emotional storms.",
    actionable_guidance: {
      what_to_do: "Practice being the compassionate witness to your emotional tides without identifying as the storm itself.",
      what_not_to_do: "Do not catastrophize uncomfortable emotions or label yourself as broken because you feel fear."
    }
  },
  {
    id: "bg_12_15",
    chapter: 12,
    verse: "15",
    theme: "Social Anxiety / Relational Boundary / Toxic Environment",
    keywords: [
      "social anxiety", "people pleasing", "criticism", "judgment", "rejected",
      "toxic people", "gossip", "afraid of what they think", "rejection",
      "conflict", "interpersonal", "lonely", "alienated"
    ],
    shloka_sanskrit: "यस्मान्नोद्विजते लोको लोकान्नोद्विजते च यः।\nहर्षामर्षभयोद्वेगैर्मुक्तो यः स च मे प्रियः॥",
    shloka_roman: "yasmān nodvijate loko lokān nodvijate ca yaḥ |\nharṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ ||",
    philosophical_meaning: "One by whom the world is not distressed and who is not distressed by the world, who is freed from the agitation of excessive joy, intolerance, fear, and anxiety—such a one is truly dear to the Divine.",
    clinical_reframe: "Healthy interpersonal differentiation and relational boundaries. Establish emotional equilibrium where you neither inflict hostility on others nor permit the erratic projections of others to disrupt your internal sanctity.",
    actionable_guidance: {
      what_to_do: "Maintain kind but impenetrable emotional boundaries: others' opinions are reflections of their internal state, not your objective worth.",
      what_not_to_do: "Do not compromise your integrity to appease toxic dynamics, and do not absorb others' unmanaged dysregulation."
    }
  },
  {
    id: "bg_3_35",
    chapter: 3,
    verse: "35",
    theme: "Comparison Fatigue / Authenticity / Svadharma",
    keywords: [
      "comparison", "jealousy", "envy", "everyone is ahead of me", "behind in life",
      "social media", "imposter", "inadequate", "failing", "svadharma"
    ],
    shloka_sanskrit: "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।\nस्वधर्मे निधनं श्रेयः परधर्मो भयावहः॥",
    shloka_roman: "śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt |\nsva-dharme nidhanaṁ śreyaḥ para-dharmo bhayāvahaḥ ||",
    philosophical_meaning: "It is far better to perform one's own natural duty, even if imperfectly, than to masterfully execute the duty of another. Following another's path invites fear, disorientation, and spiritual peril.",
    clinical_reframe: "Reclaiming personal authenticity over comparative inadequacy. Anxiety thrives when measuring unique individual worth against external, societal yardsticks. Embracing your authentic pace dissolves imposter distress.",
    actionable_guidance: {
      what_to_do: "Honor your unique temperament, pacing, and strengths; define success by your internal alignment rather than comparative status.",
      what_not_to_do: "Stop doomscrolling other people's curated highlights and measuring your private struggles against their public facade."
    }
  },
  {
    id: "bg_5_23",
    chapter: 5,
    verse: "23",
    theme: "Urge Surfing / Impulsive Reaction / Distress Tolerance",
    keywords: [
      "impulsive", "urge", "addiction", "reaction", "craving", "lost control",
      "irritated", "can't resist", "compulsion", "emotional explosion"
    ],
    shloka_sanskrit: "शक्नोतीहैव यः सोढुं प्राक्शरीरविमोक्षणात्।\nकामक्रोधोद्भवं वेगं स युक्तः स सुखी नरः॥",
    shloka_roman: "śaknotīhaiva yaḥ soḍhuṁ prāk śarīra-vimokṣaṇāt |\nkāma-krodhodbhavaṁ vegaṁ sa yuktaḥ sa sukhī naraḥ ||",
    philosophical_meaning: "One who is able to withstand the intense surges born of desire and anger here in this very body, before departing from it, is truly harmonized and lives happily.",
    clinical_reframe: "Urge surfing and autonomic distress tolerance. An intense emotional or compulsive urge peaks within 90 seconds like a wave; developing the somatic capacity to surf this peak without giving in rewires the reward circuitry.",
    actionable_guidance: {
      what_to_do: "Pause and surf the physical urge for 90 seconds, breathing steadily through the sensation without acting on it.",
      what_not_to_do: "Do not immediately capitulate to urgent impulses or shame yourself for feeling the biological surge."
    }
  },
  {
    id: "bg_18_66",
    chapter: 18,
    verse: "66",
    theme: "Existential Surrender / Severe Despair / Radical Acceptance",
    keywords: [
      "despair", "exhausted", "give up", "hopeless", "cannot go on",
      "depressed", "heavy", "surrender", "burden", "alone in the world",
      "tired of fighting", "darkness"
    ],
    shloka_sanskrit: "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
    shloka_roman: "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja |\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||",
    philosophical_meaning: "Abandoning all strenuous anxieties and contrived burdens, surrender completely unto Me alone. I shall liberate you from all distress and afflictions; do not grieve.",
    clinical_reframe: "Radical surrender of hyper-responsibility and existential trust. When you have exhausted your personal ego-control, stepping back into the vast holding intelligence of life relieves the crushing weight of hyper-vigilance.",
    actionable_guidance: {
      what_to_do: "Consciously set down the imaginary weight of controlling the universe; rest your tired body and trust that life is holding you.",
      what_not_to_do: "Do not shoulder burdens that do not belong to you today, and stop believing you must solve everything alone."
    }
  }
];

/**
 * Deterministic Semantic & Keyword Matcher
 * Finds the most clinically applicable Bhagavad Gita Shloka for any user situation.
 */
export function findGitaWisdom(userQuery: string): GitaShlokaItem {
  if (!userQuery || !userQuery.trim()) {
    return GITA_LIBRARY[0]; // Default BG 2.47
  }

  const clean = userQuery.toLowerCase();
  let bestMatch = GITA_LIBRARY[0];
  let maxScore = -1;

  for (const item of GITA_LIBRARY) {
    let score = 0;
    for (const kw of item.keywords) {
      if (clean.includes(kw)) {
        score += kw.length > 6 ? 3 : 2;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Format Gita block with standard markdown and visual boundary tags
 */
export function formatGitaShlokaBlock(item: GitaShlokaItem): string {
  return `[GITA_SHLOKA]
${item.shloka_sanskrit}

${item.shloka_roman}
— श्रीमद्भगवद्गीता (Chapter ${item.chapter}, Verse ${item.verse})
[/GITA_SHLOKA]`;
}
