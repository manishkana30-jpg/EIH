/**
 * lib/knowledge/gita-library.ts
 * 
 * Bhagavad Gita Cognitive Therapy & Psychological Wisdom Library.
 * Provides authentic Sanskrit Shlokas, transliteration, philosophical meanings,
 * and situational cognitive reframings across all clinical emotional states.
 * 
 * Accurately analyzes the user's emotional distress and mental problem,
 * selecting the exact Shloka matching their dilemma, grief, anger, shame,
 * panic, rumination, burnout, or existential crisis.
 */

import { emotionClassifier } from './emotion-classifier.ts';

export type GitaCategory = "all" | "anxiety_fear" | "burnout_action" | "clarity_focus" | "grief_loss";

export interface GitaShlokaItem {
  id: string;
  chapter: number;
  verse: string;
  reference_header: string; // e.g. "BG 2.48"
  theme: string;
  category: "anxiety_fear" | "burnout_action" | "clarity_focus" | "grief_loss";
  psychological_somatic_mapping: string; // e.g. "Clinical Focus: Equanimity & Sympathetic Down-Regulation"
  cognitive_tags: string[]; // e.g. ["#Sattva", "#Detachment", "#CognitiveReframing"]
  keywords: string[];
  associated_emotions: string[];
  associated_conditions: string[];
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
    reference_header: "BG 2.47",
    theme: "Outcome Detachment / Career Anxiety / Decision Paralysis",
    category: "burnout_action",
    psychological_somatic_mapping: "Clinical Focus: Present Process Focus & Performance Anxiety De-escalation",
    cognitive_tags: ["#NishkamaKarma", "#Detachment", "#CognitiveReframing", "#PresentFocus"],
    associated_emotions: ["confusion", "anxiety"],
    associated_conditions: ["gad", "career_anxiety", "perfectionism"],
    keywords: [
      "dilemma", "cannot decide", "decision", "what should i do", "fear of failure",
      "results", "outcome", "interview", "exam", "test", "career", "job", "promotion",
      "performance", "future", "uncertainty", "perfectionism", "worried about result",
      "fail", "failing", "kya karu", "dharamsankat", "action", "paralysis",
      "नौकरी", "परीक्षा", "परिणाम", "क्या करूं", "धर्मसंकट", "नतीजे", "फेल होने का डर",
      "naukri", "pariksha", "interview"
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
    id: "bg_2_48",
    chapter: 2,
    verse: "48",
    reference_header: "BG 2.48",
    theme: "Equanimity in Action / Samatvam / Performance Equilibrium",
    category: "burnout_action",
    psychological_somatic_mapping: "Clinical Focus: Equanimity & Sympathetic Down-Regulation",
    cognitive_tags: ["#Sattva", "#Detachment", "#CognitiveReframing", "#Samatvam"],
    associated_emotions: ["anxiety", "confusion"],
    associated_conditions: ["gad", "career_anxiety", "perfectionism"],
    keywords: [
      "equanimity", "samatva", "samatvam", "success or failure", "balanced mind",
      "calm in action", "work stress", "performance", "perfectionist", "balance",
      "समत्व", "योगस्थ", "समत्वं योग उच्यते", "संतुलन", "सफलता असफलता"
    ],
    shloka_sanskrit: "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
    shloka_roman: "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya |\nsiddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate ||",
    philosophical_meaning: "Be steadfast in yoga, O Arjuna. Perform your duty without attachment, remaining even-minded in success and failure. Such equanimity of mind is known as Yoga.",
    clinical_reframe: "Somatic equilibrium and autonomic down-regulation (Samatvam). When the nervous system stops swinging erratically between fear of failure and euphoria of success, baseline vagal tone stabilizes, enabling sustained cognitive clarity.",
    actionable_guidance: {
      what_to_do: "Anchor in your neutral observing center before initiating high-pressure tasks, viewing all outcomes as informative feedback rather than personal identity.",
      what_not_to_do: "Do not ride the emotional rollercoaster of short-term wins and setbacks, and avoid tying self-worth to fluctuating metrics."
    }
  },
  {
    id: "bg_2_14",
    chapter: 2,
    verse: "14",
    reference_header: "BG 2.14",
    theme: "Impermanence of Pain / Heartbreak / Emotional Transience",
    category: "grief_loss",
    psychological_somatic_mapping: "Clinical Focus: Titiksha Somatic Acceptance & Emotional Distress Tolerance",
    cognitive_tags: ["#Titiksha", "#Impermanence", "#SomaticAcceptance", "#EmotionalTolerance"],
    associated_emotions: ["sadness", "nostalgia", "empathic_pain"],
    associated_conditions: ["grief_bereavement", "major_depressive_inertia"],
    keywords: [
      "heartbreak", "broke up", "breakup", "partner", "separation", "left me",
      "divorced", "breakup pain", "chest hurts", "crying", "tears", "sobbing",
      "weep", "loss", "grief", "died", "mourning", "aching", "emotional pain",
      "sorrow", "sad", "sadness", "unbearable pain", "dukkha", "dard", "dukh",
      "dil toot gaya", "udas", "udasi", "rona", "ro raha", "breakup ho gaya",
      "अकेलापन", "उदास", "उदासी", "रोना", "रो रहा", "रो रही", "दिल टूटा", "ब्रेकअप",
      "दर्द", "दुख", "शोक", "बिछड़ना", "जुदाई"
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
    reference_header: "BG 2.62-63",
    theme: "Anger Cascade / Betrayal / Cognitive De-escalation",
    category: "anxiety_fear",
    psychological_somatic_mapping: "Clinical Focus: Prefrontal Cortex Restraint & Sympathetic Hijack De-escalation",
    cognitive_tags: ["#BuddhiPreservation", "#AngerDeescalation", "#CognitiveControl", "#VagalBrake"],
    associated_emotions: ["anger"],
    associated_conditions: ["anger_frustration_dysregulation"],
    keywords: [
      "anger", "angry", "furious", "rage", "irritation", "irritated", "mad",
      "betrayal", "betrayed", "gaslighting", "gaslighted", "toxic boss", "yelled at me",
      "yelling", "screaming", "shout", "unfair", "disrespected", "insulted",
      "hostile", "fight", "fighting", "argument", "arguing", "revenge", "conflict",
      "gussa", "krodh", "naraz", "jhagda", "dhokha", "बदला", "गुस्सा", "क्रोध",
      "नाराज", "झगड़ा", "धोखा", "अपमान", "चिल्लाना", "बेइज्जती", "चिढ़"
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
    reference_header: "BG 6.5",
    theme: "Self-Mastery / Inner Critic / Imposter Syndrome",
    category: "clarity_focus",
    psychological_somatic_mapping: "Clinical Focus: Internal Locus of Control & Cultivating the Self as Ally",
    cognitive_tags: ["#AtmaKripa", "#SelfMastery", "#InnerAlly", "#CognitiveReframing"],
    associated_emotions: ["disgust", "shame"],
    associated_conditions: ["shame_core_defectiveness", "imposter_syndrome"],
    keywords: [
      "hate myself", "self hate", "worthless", "fake", "failure", "failed",
      "loser", "stupid", "ugly", "not good enough", "defective", "flawed",
      "imposter", "shame", "ashamed", "guilty", "guilt", "self doubt",
      "self sabotage", "self critical", "inner critic", "low self esteem",
      "useless", "bekar", "khud se nafrat", "sharm", "galti", "नाकाम", "बेकार",
      "खुद से नफरत", "शर्म", "गिल्ट", "हीन भावना", "किसी काम का नहीं"
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
    reference_header: "BG 2.70",
    theme: "Ocean Equanimity / Overwhelm / Sensory Chaos",
    category: "burnout_action",
    psychological_somatic_mapping: "Clinical Focus: Ocean Awareness & Sensory Overload De-escalation",
    cognitive_tags: ["#SamudraSthiti", "#OceanEquanimity", "#SensoryGrounding", "#Sattva"],
    associated_emotions: ["confusion", "anxiety"],
    associated_conditions: ["adhd_executive_overwhelm", "burnout_fatigue"],
    keywords: [
      "overwhelmed", "too much", "sensory overload", "chaos", "hurricane", "storm",
      "pressure", "turbulent", "head spinning", "brain fog", "drowning in tasks",
      "suffocating", "stressed out", "stress", "can't handle this", "racing thoughts",
      "workload", "bohot zyada", "tanav", "dabav", "pareshan", "दिमाग फट रहा है",
      "बहुत तनाव", "दबाव", "सब कुछ बिखर रहा है", "बहुत ज्यादा काम"
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
    reference_header: "BG 6.26",
    theme: "Restless Mind / Intrusive Thoughts / OCD Rumination",
    category: "clarity_focus",
    psychological_somatic_mapping: "Clinical Focus: Attentional Redirect & Non-Judgmental Re-anchoring",
    cognitive_tags: ["#Abhyasa", "#AttentionalControl", "#CognitiveDefusion", "#Mindfulness"],
    associated_emotions: ["anxiety"],
    associated_conditions: ["ocd_rumination_loops", "insomnia_hyperarousal"],
    keywords: [
      "overthinking", "intrusive thoughts", "cant stop thinking", "obsessive thoughts",
      "looping thoughts", "racing thoughts", "mind wandering", "restless mind",
      "racing mind", "mental rituals", "spiral", "spiraling", "insomnia",
      "cant sleep", "awake at night", "sleepless", "adhd", "distracted", "chinta",
      "neend nahi aa rahi", "bechain man", "soch", "neend", "vichar", "विचार रुक नहीं रहे", "ज्यादा सोचना",
      "नींद नहीं आ रही", "नींद नहीं आती", "नींद", "बेचैन मन", "रात भर जागना", "रात भर", "विचार", "सोच रहा हूँ", "सोचना"
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
    reference_header: "BG 18.63",
    theme: "Autonomy / Existential Paralysis / Free Will",
    category: "clarity_focus",
    psychological_somatic_mapping: "Clinical Focus: Internal Locus of Control & Autonomous Deliberate Choice",
    cognitive_tags: ["#Svadharma", "#ConsciousAgency", "#FreeWill", "#AutonomousChoice"],
    associated_emotions: ["confusion"],
    associated_conditions: ["existential_dread_crisis"],
    keywords: [
      "crossroads", "two paths", "which way", "life choice", "independent",
      "what path", "should i quit", "should i leave", "freedom", "choice",
      "autonomy", "responsibility", "clarity", "existential question", "free will",
      "faisla", "kaun sa rasta", "nirnay", "दोराहे पर", "फैसला", "कौन सा रास्ता",
      "क्या चुनूं", "जीवन का रास्ता"
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
    reference_header: "BG 2.56",
    theme: "Sthitaprajna / Emotional Stability / Freedom from Fear",
    category: "anxiety_fear",
    psychological_somatic_mapping: "Clinical Focus: Affective Equilibrium & Autonomic Panic Resiliency",
    cognitive_tags: ["#Sthitaprajna", "#FearRelease", "#AffectiveEquilibrium", "#Sakshi"],
    associated_emotions: ["fear", "horror"],
    associated_conditions: ["panic_dysregulation", "trauma_hypervigilance"],
    keywords: [
      "fear", "afraid", "scared", "terrified", "terror", "panic", "panic attack",
      "trembling", "shaking", "dread", "shuddering", "frightening", "frightened",
      "phobia", "impending doom", "horror", "shudder", "darr", "bhay", "dahshat",
      "kamp raha", "डर", "भय", "दहशत", "कांप रहा", "पैनिक", "भयानक", "डर लग रहा है"
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
    reference_header: "BG 12.15",
    theme: "Social Anxiety / Relational Boundary / Toxic Environment",
    category: "anxiety_fear",
    psychological_somatic_mapping: "Clinical Focus: Interpersonal Differentiation & Social Evaluative Threat Dissolution",
    cognitive_tags: ["#RelationalPeace", "#Boundaries", "#SocialSafety", "#Equanimity"],
    associated_emotions: ["awkwardness", "disgust"],
    associated_conditions: ["social_evaluative_threat", "compassion_fatigue_caregiver"],
    keywords: [
      "social anxiety", "people pleasing", "what people think", "afraid of what they think", "criticism", "criticized",
      "judged", "judging me", "social", "social gatherings", "rejected", "rejection", "toxic people", "toxic family",
      "toxic friend", "gossip", "isolated", "left out", "unloved", "interpersonal",
      "log kya kahenge", "akele chhod diya", "लोग क्या कहेंगे", "समाज", "तिरस्कार",
      "अकेला छोड़ दिया", "जज कर रहे हैं", "आलोचना"
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
    reference_header: "BG 3.35",
    theme: "Comparison Fatigue / Authenticity / Svadharma",
    category: "clarity_focus",
    psychological_somatic_mapping: "Clinical Focus: Authentic Svadharma & Comparison Fatigue Detox",
    cognitive_tags: ["#Svadharma", "#Authenticity", "#ComparisonDetox", "#InternalValidation"],
    associated_emotions: ["awkwardness", "disgust"],
    associated_conditions: ["imposter_syndrome"],
    keywords: [
      "comparison", "comparing", "compare", "jealousy", "jealous", "envy",
      "envious", "everyone is ahead", "behind in life", "peers are successful",
      "social media", "feel inadequate", "svadharma", "tulna", "jalan",
      "sab aage nikal gaye", "तुलना", "जलन", "ईर्ष्या", "सब आगे निकल गए", "मैं पीछे रह गया"
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
    reference_header: "BG 5.23",
    theme: "Urge Surfing / Impulsive Reaction / Distress Tolerance",
    category: "burnout_action",
    psychological_somatic_mapping: "Clinical Focus: Somatic Urge Surfing & Neurochemical Impulse Restraint",
    cognitive_tags: ["#UrgeSurfing", "#ImpulseControl", "#DistressTolerance", "#VegaSahana"],
    associated_emotions: ["craving"],
    associated_conditions: ["adhd_executive_overwhelm"],
    keywords: [
      "urge", "impulse", "impulsive", "craving", "addiction", "addict",
      "lost control", "cant resist", "relapse", "binge", "bingeing",
      "emotional eating", "bad habit", "compulsion", "lalach", "talab",
      "kabu nahi", "तलब", "आदत", "लत", "काबू नहीं", "खुद पर नियंत्रण नहीं"
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
    reference_header: "BG 18.66",
    theme: "Existential Surrender / Severe Despair / Radical Acceptance",
    category: "grief_loss",
    psychological_somatic_mapping: "Clinical Focus: Radical Surrender & Vagal Re-anchoring in Trust",
    cognitive_tags: ["#Sharanagati", "#RadicalAcceptance", "#ExistentialPeace", "#Surrender"],
    associated_emotions: ["sadness", "boredom"],
    associated_conditions: ["major_depressive_inertia", "burnout_fatigue"],
    keywords: [
      "despair", "hopeless", "hopelessness", "give up", "giving up", "cannot go on",
      "cant do this anymore", "depressed", "depression", "exhausted", "exhaustion",
      "heavy burden", "alone in the world", "tired of fighting", "darkness", "empty",
      "numbness", "no meaning", "surrender", "nirasha", "thak chuka hu",
      "koi umeed nahi", "भारीपन", "निराशा", "डिप्रेशन", "थक चुका हूँ", "थक चुकी हूँ",
      "कोई उम्मीद नहीं बची", "हार मान ली", "अंधकार"
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

export const EMOTION_TO_GITA_MAP: Record<string, string> = {
  sadness: 'bg_2_14',
  nostalgia: 'bg_2_14',
  empathic_pain: 'bg_2_14',
  anger: 'bg_2_62_63',
  disgust: 'bg_6_5',
  fear: 'bg_2_56',
  horror: 'bg_2_56',
  anxiety: 'bg_2_70',
  confusion: 'bg_2_47',
  boredom: 'bg_18_66',
  craving: 'bg_5_23',
  awkwardness: 'bg_12_15',
  calmness: 'bg_2_70',
  relief: 'bg_2_70',
};

export const CONDITION_TO_GITA_MAP: Record<string, string> = {
  grief_bereavement: 'bg_2_14',
  major_depressive_inertia: 'bg_18_66',
  anger_frustration_dysregulation: 'bg_2_62_63',
  shame_core_defectiveness: 'bg_6_5',
  imposter_syndrome: 'bg_6_5',
  panic_dysregulation: 'bg_2_56',
  trauma_hypervigilance: 'bg_2_56',
  gad: 'bg_2_47',
  ocd_rumination_loops: 'bg_6_26',
  insomnia_hyperarousal: 'bg_6_26',
  adhd_executive_overwhelm: 'bg_2_70',
  burnout_fatigue: 'bg_18_66',
  social_evaluative_threat: 'bg_12_15',
  existential_dread_crisis: 'bg_18_63',
  compassion_fatigue_caregiver: 'bg_12_15',
  health_anxiety_somatization: 'bg_2_56',
};

/**
 * Intelligent Multi-Factor Bhagavad Gita Matcher
 * Understands the user's emotional distress and mental problem first,
 * then maps it to the exact corresponding Shloka.
 */
export function findGitaWisdom(
  userQuery: string,
  detectedEmotion?: string,
  conditionId?: string,
  excludeIds?: string[]
): GitaShlokaItem {
  const excluded = new Set(excludeIds || []);

  if (!userQuery || !userQuery.trim()) {
    return GITA_LIBRARY.find((s) => !excluded.has(s.id)) || GITA_LIBRARY[0];
  }

  const clean = userQuery.toLowerCase().trim();

  // 1. Resolve psychological emotional affect if not provided
  let effectiveEmotion = (detectedEmotion || '').toLowerCase().trim();
  if (!effectiveEmotion) {
    try {
      const diag = emotionClassifier.classifyText(clean);
      effectiveEmotion = (diag.dimensionId || '').toLowerCase();
    } catch {
      // Ignore
    }
  }

  let bestMatch: GitaShlokaItem | null = null;
  let maxScore = -999;

  for (const item of GITA_LIBRARY) {
    let score = 0;

    // Direct keyword & phrase matches (higher weight for longer/exact phrases)
    for (const kw of item.keywords) {
      const lkw = kw.toLowerCase();
      if (clean.includes(lkw)) {
        score += lkw.length > 6 ? 5 : 3;
      }
    }

    // Emotion correlation (+5)
    if (effectiveEmotion && item.associated_emotions.includes(effectiveEmotion)) {
      score += 5;
    }

    // Clinical condition correlation (+7)
    if (conditionId && item.associated_conditions.includes(conditionId)) {
      score += 7;
    }

    // Heavy penalty for already used Shlokas in this session
    if (excluded.has(item.id)) {
      score -= 50;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  // If positive score earned on a non-excluded item, return it
  if (bestMatch && maxScore > 0 && !excluded.has(bestMatch.id)) {
    return bestMatch;
  }

  // Fallback 1: Map directly by classified emotional distress if not excluded
  if (effectiveEmotion && EMOTION_TO_GITA_MAP[effectiveEmotion]) {
    const targetId = EMOTION_TO_GITA_MAP[effectiveEmotion];
    if (!excluded.has(targetId)) {
      const found = GITA_LIBRARY.find((s) => s.id === targetId);
      if (found) return found;
    }
  }

  // Fallback 2: Map directly by clinical condition ID if not excluded
  if (conditionId && CONDITION_TO_GITA_MAP[conditionId]) {
    const targetId = CONDITION_TO_GITA_MAP[conditionId];
    if (!excluded.has(targetId)) {
      const found = GITA_LIBRARY.find((s) => s.id === targetId);
      if (found) return found;
    }
  }

  // Fallback 3: Return best candidate even with lower score if non-excluded
  const nonExcludedCandidates = GITA_LIBRARY.filter((s) => !excluded.has(s.id));
  if (nonExcludedCandidates.length > 0) {
    // If emotion or condition is known, try finding one with common emotion
    if (effectiveEmotion) {
      const emoMatch = nonExcludedCandidates.find((s) => s.associated_emotions.includes(effectiveEmotion));
      if (emoMatch) return emoMatch;
    }
    return nonExcludedCandidates[0];
  }

  // Final fallback (all exhausted)
  return bestMatch || GITA_LIBRARY[0];
}

/**
 * Format Gita block with standard markdown and visual boundary tags
 */
export function formatGitaShlokaBlock(item: GitaShlokaItem): string {
  return `[GITA_SHLOKA]
${item.shloka_sanskrit}

${item.shloka_roman}
— श्रीमद्भगवद्गीता (${item.reference_header || `Chapter ${item.chapter}, Verse ${item.verse}`})
[/GITA_SHLOKA]`;
}

/**
 * Instant Real-Time Search & Category Filtering for the Bhagavad Gita Library
 */
export function searchGitaLibrary(
  query?: string,
  category?: string
): GitaShlokaItem[] {
  let list = GITA_LIBRARY;

  if (category && category !== "all") {
    list = list.filter((item) => item.category === category);
  }

  if (!query || !query.trim()) {
    return list;
  }

  const q = query.toLowerCase().trim();
  return list.filter((item) => {
    // Check chapter/verse match (e.g. "2", "2.48", "48", "bg 2.48", "chapter 2")
    const chStr = String(item.chapter);
    const vStr = String(item.verse);
    const ref = (item.reference_header || `BG ${item.chapter}.${item.verse}`).toLowerCase();
    if (
      ref.includes(q) ||
      q === chStr ||
      q === vStr ||
      q === `${chStr}.${vStr}` ||
      q === `${chStr}:${vStr}` ||
      q === `chapter ${chStr}` ||
      q === `verse ${vStr}`
    ) {
      return true;
    }

    // Check theme & clinical focus
    if (item.theme.toLowerCase().includes(q)) return true;
    if (item.psychological_somatic_mapping.toLowerCase().includes(q)) return true;

    // Check cognitive tags
    if (item.cognitive_tags.some((tag) => tag.toLowerCase().includes(q))) return true;

    // Check emotions & conditions
    if (item.associated_emotions.some((e) => e.toLowerCase().includes(q))) return true;
    if (item.associated_conditions.some((c) => c.toLowerCase().includes(q))) return true;

    // Check keywords
    if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;

    // Check meaning, reframe, transliteration, sanskrit
    if (item.philosophical_meaning.toLowerCase().includes(q)) return true;
    if (item.clinical_reframe.toLowerCase().includes(q)) return true;
    if (item.shloka_roman.toLowerCase().includes(q)) return true;
    if (item.shloka_sanskrit.includes(q)) return true;

    return false;
  });
}

/**
 * Direct Emotion-to-Shloka Mapper for quick RAG retrieval
 */
export function getGitaShlokaForEmotion(emotion: string): GitaShlokaItem | null {
  if (!emotion) return null;
  const norm = emotion.toLowerCase().trim();
  const targetId = EMOTION_TO_GITA_MAP[norm];
  if (targetId) {
    const found = GITA_LIBRARY.find((s) => s.id === targetId);
    if (found) return found;
  }
  return (
    GITA_LIBRARY.find((s) => s.associated_emotions.includes(norm)) ||
    findGitaWisdom(emotion, norm)
  );
}

