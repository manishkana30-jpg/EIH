"""
keyless_healer/lib/gita_rag.py
Bhagavad Gita Cognitive Therapy Engine & ChromaDB Vector Store.
Detects existential dilemmas, moral confusion, and emotional distress,
dynamically retrieving the exact matching Shloka across all 12 core psychological themes.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

logger = logging.getLogger("GitaLibraryRAG")

try:
    import chromadb
except ImportError:
    chromadb = None  # type: ignore[assignment]

DILEMMA_KEYWORDS = [
    # English
    r"\bdilemma\b",
    r"\bconfus(ed|ion)\b",
    r"\bparaly(sis|zed)\b",
    r"\bdecision\b",
    r"\btorn between\b",
    r"\bcannot decide\b",
    r"\bcan't decide\b",
    r"\bwhat should i do\b",
    r"\bwhich path\b",
    r"\bright path\b",
    r"\bright decision\b",
    r"\bwrong decision\b",
    r"\baction or inaction\b",
    r"\bmeaning of (my )?life\b",
    r"\bpurpose of (my )?life\b",
    r"\bduty\b",
    r"\bmoral conflict\b",
    r"\bexistential\b",
    r"\bhelpless\b",
    r"\bstuck in life\b",
    # Hindi / Hinglish
    r"\bkya kar(u|oon|e)\b",
    r"\bdharamsankat\b",
    r"\bdharmasankat\b",
    r"\bsamajh nahi aa raha\b",
    r"\bkuch samajh nahi\b",
    r"\basmanjas\b",
    r"\bkartavya\b",
    r"\bkaun sa rasta\b",
    r"\bmujhe kya karna chahiye\b",
    r"क्या करूं",
    r"क्या करूँ",
    r"धर्मसंकट",
    r"असमंजस",
    r"कर्तव्य",
    r"दुविधा",
]

DILEMMA_PATTERN = re.compile("|".join(DILEMMA_KEYWORDS), re.IGNORECASE)


def detect_existential_dilemma(text: str) -> bool:
    """Detects whether user is experiencing an existential dilemma, moral confusion, or decision paralysis."""
    if not text or not text.strip():
        return False
    return bool(DILEMMA_PATTERN.search(text.lower()))


GITA_SHLOKAS: list[dict[str, Any]] = [
    {
        "id": "bg_2_47",
        "chapter": "2",
        "verse": "47",
        "theme": "Outcome Detachment / Decision Paralysis / Action Duty",
        "keywords": [
            "dilemma", "confused", "cannot decide", "can't decide", "paralysis", "decision",
            "what should i do", "fear of failure", "results", "outcome", "interview", "exam",
            "future result", "promotion", "overthinking future", "kya karu", "dharamsankat",
            "action", "karma", "duty", "uncertainty", "कर्म", "फल", "परिणाम", "दुविधा"
        ],
        "shloka_sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        "shloka_roman": "karmaṇy-evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ||",
        "philosophical_meaning": "You have an absolute right only to perform your dedicated action, but never to the fruits or results thereof. Never consider yourself the sole author of the outcomes of your endeavors, nor let yourself be attached to paralysis or inaction.",
        "clinical_reframe": "Shift locus of control from unpredictable future outcomes to present-moment execution. Dissolve performance anxiety and decision paralysis by investing 100% of cognitive bandwidth into the process, letting go of future outcome obsession.",
        "actionable_guidance": {
            "what_to_do": "Take the single most meaningful step right in front of you without ruminating on what might happen tomorrow.",
            "what_not_to_do": "Do not paralyze yourself calculating hypothetical future scenarios you cannot control."
        }
    },
    {
        "id": "bg_2_14",
        "chapter": "2",
        "verse": "14",
        "theme": "Impermanence of Pain / Heartbreak / Grief & Titiksha",
        "keywords": [
            "heartbreak", "breakup", "dumped", "cheated", "grief", "loss", "bereavement",
            "pain", "hurting", "crying", "weeping", "tears", "sadness", "broken heart",
            "dil toot", "rona", "dard", "gam", "chhod diya", "dukkha", "loss of loved one",
            "mourning", "विछोह", "दर्द", "रोना", "उदासी", "दिल टूट", "शोक", "दुख"
        ],
        "shloka_sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
        "shloka_roman": "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ |\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ||",
        "philosophical_meaning": "The contacts of the senses with their external objects give rise to sensations of heat and cold, pleasure and pain. They are fleeting and impermanent, arriving and departing like passing seasons. Bear them patiently with inner endurance, O Bharata.",
        "clinical_reframe": "Affective tolerance and neurochemical transience (Titiksha). Every acute emotional wave has a biological half-life. Grieving the loss while recognizing its impermanent nature prevents somatic pain from congealing into prolonged suffering.",
        "actionable_guidance": {
            "what_to_do": "Breathe gently and observe the physical ache in your chest as a passing somatic wave without resisting it.",
            "what_not_to_do": "Do not mistake this temporary wave of heartbreak for an eternal sentence of misery."
        }
    },
    {
        "id": "bg_2_62_63",
        "chapter": "2",
        "verse": "62-63",
        "theme": "Anger Cascade / Cognitive Dysregulation / Betrayal & Rage",
        "keywords": [
            "anger", "angry", "furious", "rage", "irritation", "betrayed", "betrayal",
            "backstabbed", "resentment", "grudge", "hate", "unfair", "cheated", "revenge",
            "screaming", "loss of control", "gussa", "krodh", "dhokha", "badla",
            "गुस्सा", "क्रोध", "धोखा", "बदला", "आक्रोश", "जलन"
        ],
        "shloka_sanskrit": "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥\nक्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
        "shloka_roman": "dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate |\nsaṅgāt sañjāyate kāmaḥ kāmāt krodho 'bhijāyate ||\nkrodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ |\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati ||",
        "philosophical_meaning": "Brooding upon triggers creates obsession. From obsession flares intense craving; from thwarted craving explodes anger. Anger breeds delusion; delusion fractures memory and perspective; from lost perspective executive intellect is destroyed; and when intellect is ruined, a person is undone.",
        "clinical_reframe": "The cognitive-behavioral dysregulation cascade. Ruminating over perceived slights inflames sympathetic fight-or-flight reactivity, shutting down prefrontal executive control. Intervening at the earliest rumination flashpoint preserves rational self-protection.",
        "actionable_guidance": {
            "what_to_do": "Pause immediately, un-clench your jaw and fists, and practice a 10-count physiological exhale before responding.",
            "what_not_to_do": "Do not send retaliatory messages or make decisions while in the throes of acute sympathetic rage."
        }
    },
    {
        "id": "bg_6_5",
        "chapter": "6",
        "verse": "5",
        "theme": "Self-Mastery / Overcoming Self-Hate, Shame & Imposter Syndrome",
        "keywords": [
            "shame", "worthless", "hate myself", "failure", "imposter", "inner critic",
            "self doubt", "stupid", "not good enough", "disgusted with myself", "ugly",
            "self-sabotage", "loser", "sharm", "bekar", "nafrat", "kisi kaam ka nahi",
            "शर्म", "हीनभावना", "खुद से नफरत", "नाकाम", "दोष", "आत्मग्लानि"
        ],
        "shloka_sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
        "shloka_roman": "uddhared ātmanātmānaṁ nātmānam avasādayet |\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||",
        "philosophical_meaning": "Elevate yourself through the sovereign agency of your own mind, and never degrade or humiliate yourself. For the mind alone is your greatest ally and friend, and the undisciplined mind alone can be your deadliest enemy.",
        "clinical_reframe": "Compassionate internal self-talk and agency restructuring. Toxic core shame and imposter syndrome represent an internal critic acting as a hostile adversary. You possess the neuroplastic power to turn your mind into a nurturing internal ally.",
        "actionable_guidance": {
            "what_to_do": "Speak to yourself with the same tender compassion you would offer to a frightened best friend.",
            "what_not_to_do": "Never join the external world in bullying or degrading yourself."
        }
    },
    {
        "id": "bg_2_70",
        "chapter": "2",
        "verse": "70",
        "theme": "Ocean Equanimity / Sensory Overwhelm / Executive Resilience",
        "keywords": [
            "overwhelmed", "overwhelm", "chaos", "sensory overload", "adhd", "too much",
            "flooded", "storm", "hurricane", "pressure", "burnout", "racing thoughts",
            "cannot breathe", "sukoon", "shanti", "dimag fatt raha hai", "bahut zyada",
            "तनाव", "दबाव", "अशांति", "अव्यवस्था", "मानसिक शांति"
        ],
        "shloka_sanskrit": "आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्।\nतद्वत्कामा यं प्रविशन्ति सर्वे स शान्तिमाप्नोति न कामकामी॥",
        "shloka_roman": "āpūryamāṇam acala-pratiṣṭhaṁ samudram āpaḥ praviśanti yadvat |\ntadvat kāmā yaṁ praviśanti sarve sa śāntim āpnoti na kāma-kāmī ||",
        "philosophical_meaning": "Just as the boundless ocean remains completely undisturbed while torrential river waters continually pour into it from all directions, an individual into whom chaotic sensory impressions and thoughts enter without perturbing the depths attains lasting peace.",
        "clinical_reframe": "Mindful container meditation and distress capacity expansion. Rather than trying to forcefully stop external pressures, expand your internal container so that multiple demands enter like river streams without upsetting your core equilibrium.",
        "actionable_guidance": {
            "what_to_do": "Ground yourself into your chair or the floor; visualize your awareness as deep ocean waters beneath surface waves.",
            "what_not_to_do": "Do not attempt to battle each sensory thought one-by-one; allow them to pass through."
        }
    },
    {
        "id": "bg_6_26",
        "chapter": "6",
        "verse": "26",
        "theme": "Mind-Wandering / Rumination Loops / Insomnia & Overthinking",
        "keywords": [
            "overthinking", "rumination", "racing mind", "insomnia", "cannot sleep",
            "looping thoughts", "restless", "nightmares", "mind wandering", "ocd",
            "intrusive thoughts", "soch soch kar", "neend nahi aa rahi", "dimag shant nahi",
            "सोच विचार", "अनिद्रा", "नींद", "अशांत मन", "चिंता के विचार"
        ],
        "shloka_sanskrit": "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्।\nततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥",
        "shloka_roman": "yato yato niścarati manaś cañcalam asthiram |\ntatas tato niyamyaitad ātmany eva vaśaṁ nayet ||",
        "philosophical_meaning": "From wherever the restless and unsteady mind wanders away, gently rein it back and re-anchor it repeatedly within the quiet sanctuary of the Self.",
        "clinical_reframe": "Attentional re-orienting and meta-cognitive detachment. Cognitive loops and insomnia occur when the default mode network captures attention. Notice mind-wandering non-judgmentally and gently redirect focus to the physical breath.",
        "actionable_guidance": {
            "what_to_do": "Each time an intrusive repetitive thought pulls you, softly notice it and guide your attention back to your lower abdomen expanding on the breath.",
            "what_not_to_do": "Do not get irritated or frustrated that your mind wandered; wandering is natural, returning is the meditation."
        }
    },
    {
        "id": "bg_2_56",
        "chapter": "2",
        "verse": "56",
        "theme": "Equanimity in Distress / Acute Panic, Terror & Somatic Trembling",
        "keywords": [
            "panic", "panic attack", "terror", "scared", "fear", "trembling", "shaking",
            "heart racing", "chest tight", "phobia", "horror", "hyperventilating",
            "dar lag raha hai", "ghabrahat", "darr", "kampan", "khauf",
            "डर", "घबराहट", "पैनिक", "भय", "कांपना"
        ],
        "shloka_sanskrit": "दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते॥",
        "shloka_roman": "duḥkheṣv anudvigna-manāḥ sukheṣu vigata-spṛhaḥ |\nvīta-rāga-bhaya-krodhaḥ sthita-dhīr munir ucyate ||",
        "philosophical_meaning": "One whose mind remains unperturbed amidst sorrow and distress, who is detached amidst transient pleasures, and who is liberated from craving, fear, and anger—such a person is poised in unshakable steady wisdom (Sthitaprajna).",
        "clinical_reframe": "Vagal braking and panic de-escalation. Panic attacks are rapid adrenaline surges accompanied by catastrophic interpretation of bodily sensations. By recognizing that physical trembling is benign, you remain an unshakeable observer.",
        "actionable_guidance": {
            "what_to_do": "Anchor your feet firmly on the ground, drink a sip of cool water, and let the adrenaline discharge naturally through your limbs.",
            "what_not_to_do": "Do not flee the room or convince yourself you are in immediate medical danger."
        }
    },
    {
        "id": "bg_12_15",
        "chapter": "12",
        "verse": "15",
        "theme": "Social Evaluative Threat / Freedom from Judgment & People Pleasing",
        "keywords": [
            "social anxiety", "people pleasing", "what will people think", "judgment",
            "criticism", "log kya kahenge", "fear of rejection", "toxic colleagues",
            "bullying", "evaluation", "embarrassed", "awkward", "sharminda",
            "लोग क्या कहेंगे", "सामाजिक चिंता", "आलोचना", "अपमान"
        ],
        "shloka_sanskrit": "यस्मान्नोद्विजते लोको लोकान्नोद्विजते च यः।\nहर्षामर्षभयोद्वेगैर्मुक्तो यः स च मे प्रियः॥",
        "shloka_roman": "yasmān nodvijate loko lokān nodvijate ca yaḥ |\nharṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ ||",
        "philosophical_meaning": "He by whom the world is never agitated, and who is never perturbed by the world—freed from turbulent elation, intolerance, fear, and anxious agitation—he is truly dear to Me.",
        "clinical_reframe": "Differentiation of self and immunity to social-evaluative threat. Chronic anxiety often stems from hypersensitivity to social disapproval. Cultivate an emotional boundary where other people's emotional weather cannot destabilize your inner worth.",
        "actionable_guidance": {
            "what_to_do": "Hold your own ground with gentle dignity, remembering that other people's opinions are their subjective projections.",
            "what_not_to_do": "Do not contort your authenticity or suppress your needs to appease someone else's mood."
        }
    },
    {
        "id": "bg_3_35",
        "chapter": "3",
        "verse": "35",
        "theme": "Svadharma / Overcoming Comparison Fatigue & Envy",
        "keywords": [
            "comparison", "jealousy", "envy", "everyone is ahead", "left behind",
            "they are more successful", "fomo", "instagram envy", "social comparison",
            "feeling behind", "pichhe reh gaya", "jalan", "uske paas sab hai",
            "तुलना", "ईर्ष्या", "पीछे छूटना", "जलन", "स्वधर्म"
        ],
        "shloka_sanskrit": "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।\nस्वधर्मे निधनं श्रेयः परधर्मो भयावहः॥",
        "shloka_roman": "śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt |\nsva-dharme nidhanaṁ śreyaḥ para-dharmo bhayāvahaḥ ||",
        "philosophical_meaning": "Far better is one's own authentic life path, even if imperfect, than the perfectly executed path of another. It is blessed to live and grow in one's own truth; imitating another's journey brings chronic dread and self-alienation.",
        "clinical_reframe": "Ego-syntonic authenticity vs. toxic social comparison. Measuring your timeline against external benchmarks triggers chronic shame and envy. Reclaiming your idiosyncratic natural strengths (Svadharma) dissolves comparison fatigue.",
        "actionable_guidance": {
            "what_to_do": "Celebrate your singular timeline and invest your energy into cultivating your unique talents today.",
            "what_not_to_do": "Stop scrolling through other people's curated success highlights to evaluate your worth."
        }
    },
    {
        "id": "bg_5_23",
        "chapter": "5",
        "verse": "23",
        "theme": "Impulse Mastery / Urge Surfing & Addictive Cravings",
        "keywords": [
            "craving", "addiction", "impulse", "cannot resist", "binge", "urges",
            "temptation", "relapse", "urge surfing", "compulsion", "bad habit",
            "talab", "aadat", "rok nahi pa raha", "तलब", "लत", "इच्छा", "आदत"
        ],
        "shloka_sanskrit": "शक्नोतीहैव यः सोढुं प्राक्शरीरविमोक्षणात्।\nकामक्रोधोद्भवं वेगं स युक्तः स सुखी नरः॥",
        "shloka_roman": "śaknotīhaiva yaḥ soḍhuṁ prāk śarīra-vimokṣaṇāt |\nkāma-krodhodbhavaṁ vegaṁ sa yuktaḥ sa sukhī naraḥ ||",
        "philosophical_meaning": "Whoever is capable of withstanding the urgent, violent tides of desire, craving, and anger right here in this living body—such a person is harmonized and truly happy.",
        "clinical_reframe": "Urge surfing and inhibitory control. Cravings feel like permanent imperatives, but neuroscientifically they crest and break like ocean waves within 10-15 minutes. Surfing the visceral sensation without acting on it rewires dopamine pathways.",
        "actionable_guidance": {
            "what_to_do": "Wait out the physical craving for 10 minutes using slow belly breathing and a glass of cold water.",
            "what_not_to_do": "Do not negotiate with the addictive craving in your head; ride the wave until it ebbs."
        }
    },
    {
        "id": "bg_18_63",
        "chapter": "18",
        "verse": "63",
        "theme": "Autonomous Clarity / Free Will & Mature Resolution",
        "keywords": [
            "free will", "autonomy", "clarity", "freedom", "crossroads", "life choice",
            "what do you think", "tell me what to do", "mature decision", "empowerment",
            "apna faisla", "azadi", "फैसला", "निर्णय", "स्वतंत्रता", "मार्ग"
        ],
        "shloka_sanskrit": "इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया।\nविमृश्यैतदशेषेण यथेच्छसि तथा कुरु॥",
        "shloka_roman": "iti te jñānam ākhyātaṁ guhyād guhyataraṁ mayā |\nvimṛśyaitad aśeṣeṇa yathecchasi tathā kuru ||",
        "philosophical_meaning": "Thus have I imparted to you this wisdom that is more profound than all secrets. Ponder and deliberate upon it deeply in its entirety, and then act as your own awakened conscience wills.",
        "clinical_reframe": "Autonomous agency and self-efficacy. Moving from external dependency or paternalistic advice to internal sovereignty. You now possess the insight required to choose your course with courage and full ownership.",
        "actionable_guidance": {
            "what_to_do": "Take a quiet moment to reflect on your authentic core values, and make your choice with serene conviction.",
            "what_not_to_do": "Do not seek endless external reassurance; trust your inner wisdom."
        }
    },
    {
        "id": "bg_18_66",
        "chapter": "18",
        "verse": "66",
        "theme": "Radical Surrender / Relieving Crushing Burdens & Deep Despair",
        "keywords": [
            "depression", "depressed", "giving up", "cannot go on", "exhausted",
            "heavy burden", "alone in the world", "tired of fighting", "darkness", "empty",
            "numbness", "no meaning", "surrender", "nirasha", "thak chuka hu",
            "koi umeed nahi", "भारीपन", "निराशा", "डिप्रेशन", "थक चुका हूँ", "थक चुकी हूँ",
            "कोई उम्मीद नहीं बची", "हार मान ली", "अंधकार"
        ],
        "shloka_sanskrit": "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वां सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
        "shloka_roman": "sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja |\nahaṁ tvāṁ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ ||",
        "philosophical_meaning": "Abandoning all strenuous anxieties, contrived burdens, and self-recriminations, surrender completely unto Me alone. I shall liberate you from all afflictions and despair; grieve no more.",
        "clinical_reframe": "Radical surrender of hyper-responsibility and existential burnout. When personal ego-control is depleted, stepping back into the vast holding presence of life relieves the crushing weight of hyper-vigilance.",
        "actionable_guidance": {
            "what_to_do": "Consciously lay down the imaginary burden of carrying the universe; rest your weary nervous system and allow life to hold you.",
            "what_not_to_do": "Do not shoulder burdens that do not belong to you today, and stop believing you must fight every battle alone."
        }
    }
]


def match_gita_wisdom(query_text: str) -> dict[str, Any]:
    """Intelligently matches user query across all 12 Shlokas based on keywords, emotions, and thematic fit."""
    if not query_text or not query_text.strip():
        return GITA_SHLOKAS[0]

    q_lower = query_text.lower().strip()
    best_item: dict[str, Any] | None = None
    max_score = 0

    for item in GITA_SHLOKAS:
        score = 0
        for kw in item.get("keywords", []):
            kw_l = kw.lower()
            if kw_l in q_lower:
                score += 5 if len(kw_l) > 6 else 3

        if score > max_score:
            max_score = score
            best_item = item

    if best_item and max_score > 0:
        return best_item

    # Fallback emotional heuristics
    if any(w in q_lower for w in ["heart", "breakup", "crying", "tears", "loss", "grief", "dard", "rona", "dil"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_2_14")
    if any(w in q_lower for w in ["anger", "angry", "rage", "gussa", "krodh", "hate", "betray"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_2_62_63")
    if any(w in q_lower for w in ["shame", "worthless", "hate myself", "failure", "imposter", "sharm"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_6_5")
    if any(w in q_lower for w in ["overthinking", "sleep", "insomnia", "thoughts", "neend"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_6_26")
    if any(w in q_lower for w in ["panic", "scared", "fear", "trembling", "dar", "ghabrahat"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_2_56")
    if any(w in q_lower for w in ["overwhelm", "chaos", "adhd", "pressure"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_2_70")
    if any(w in q_lower for w in ["depress", "tired", "giving up", "exhausted", "burden", "nirasha"]):
        return next(s for s in GITA_SHLOKAS if s["id"] == "bg_18_66")

    # Default to ocean resilience or action duty
    return GITA_SHLOKAS[0]


class GitaLibraryRAG:
    """RAG interface for querying the 'gita_library' collection in ChromaDB with intelligent 12-shloka fallback."""

    def __init__(self, db_path: str = "./clinical_memory_db"):
        self.db_path = db_path
        self.chroma_client: Any = None
        self.collection: Any = None
        self._init_collection()

    def _init_collection(self) -> None:
        if not chromadb:
            return
        try:
            os.makedirs(self.db_path, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=self.db_path)
            self.collection = self.chroma_client.get_or_create_collection(
                name="gita_library",
                metadata={"description": "Bhagavad Gita Psychological Wisdom & Shloka RAG"},
            )
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB collection 'gita_library': {e}")
            self.collection = None

    def query_wisdom(self, query_text: str, n_results: int = 1) -> dict[str, Any] | None:
        """Queries the gita_library for the most clinically applicable Shloka."""
        if not self.collection:
            self._init_collection()

        if self.collection:
            try:
                results = self.collection.query(
                    query_texts=[query_text],
                    n_results=n_results,
                )
                if results and results.get("metadatas") and len(results["metadatas"][0]) > 0:
                    meta = results["metadatas"][0][0]
                    return {
                        "id": results["ids"][0][0] if results.get("ids") else "bg_shloka",
                        "chapter": meta.get("chapter", "2"),
                        "verse": meta.get("verse", "47"),
                        "theme": meta.get("theme", "Spiritual Wisdom"),
                        "shloka_sanskrit": meta.get("shloka_sanskrit", ""),
                        "shloka_roman": meta.get("shloka_roman", ""),
                        "philosophical_meaning": meta.get("philosophical_meaning", ""),
                        "clinical_reframe": meta.get("clinical_reframe", ""),
                        "actionable_guidance": meta.get("actionable_guidance", {
                            "what_to_do": "Focus on the single highest integrity action in front of you.",
                            "what_not_to_do": "Do not paralyze yourself over uncontrollable outcomes."
                        })
                    }
            except Exception as err:
                logger.warning(f"Error querying ChromaDB gita_library: {err}")

        # Intelligent matching across all 12 Shlokas
        return match_gita_wisdom(query_text)

    def format_gita_context(self, wisdom: dict[str, Any]) -> str:
        """Formats the retrieved Shloka into a prompt context block."""
        return (
            f"Bhagavad Gita Chapter {wisdom.get('chapter')}, Verse {wisdom.get('verse')} ({wisdom.get('theme')}):\n"
            f"[SANSKRIT]:\n{wisdom.get('shloka_sanskrit')}\n"
            f"[ROMAN]:\n{wisdom.get('shloka_roman')}\n"
            f"[MEANING]: {wisdom.get('philosophical_meaning')}\n"
            f"[CLINICAL REFRAME]: {wisdom.get('clinical_reframe')}"
        )


gita_rag = GitaLibraryRAG()


def build_gita_system_prompt(retrieved_gita_wisdom: str, target_locale: str = "en-US", rag_context: str = "") -> str:
    """Builds the 3-pillar therapeutic prompt pipeline enforcing Gita + Clinical + Tratak interlinked solutions."""
    lang_directive = ""
    loc_lower = (target_locale or "en-US").lower()
    if loc_lower.startswith("hi") or "hindi" in loc_lower or "in" in loc_lower:
        lang_directive = "\n\nProvide the explanations in natural, empathetic Hindi (हिंदी), while keeping the Sanskrit Shloka in Devanagari script."
    elif loc_lower.startswith("es"):
        lang_directive = "\n\nProvide the explanations in fluent, empathetic Spanish (Español)."

    return f"""You are an Expert Clinical Psychologist and Spiritual Master integrating Modern Neuropsychology (CBT & Polyvagal Somatics) with the sacred wisdom of the Bhagavad Gita and Tratak (Ocular Meditation).

For the user's specific situation, you MUST formulate your response with all 3 solutions line-by-line, each deeply interlinked with their exact struggle:

**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**
- Include the exact relevant Sanskrit Shloka wrapped inside [GITA_SHLOKA] and [/GITA_SHLOKA] tags, followed by its Roman transliteration and Chapter & Verse.
- Explain the philosophical meaning.
- Provide a Clinical Reflection explaining how this ancient wisdom applies directly to their modern struggle.
- Actionable Guidance (Karma): What to do right now, and what mental trap to avoid.

**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**
- Compassionately validate their distress.
- Identify the active cognitive distortion and provide an evidence-based CBT cognitive reframe.
- Prescribe an immediate Somatic Polyvagal grounding exercise (e.g. physiological sigh or vagal brake).

**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान):**
- Prescribe the specific Sacred Gazing mode suited to their autonomic state (Bindu, Jyoti, Mandala, Pratibimb, or Shoonya).
- Explain the neuro-ocular calming mechanism and provide step-by-step gaze guidance.

[RETRIEVED WISDOM]:
{retrieved_gita_wisdom}

{rag_context}
{lang_directive}"""


def synthesize_gita_response(
    user_query: str,
    wisdom: dict[str, Any],
    locale: str = "en-US",
    rag_guidance: dict[str, Any] | None = None,
    rec_trataka: str = "bindu"
) -> str:
    """Deterministic fallback synthesis generating all 3 solutions line-by-line without external latency."""
    shloka_san = wisdom.get("shloka_sanskrit", "")
    shloka_rom = wisdom.get("shloka_roman", "")
    meaning = wisdom.get("philosophical_meaning", "")
    reframe = wisdom.get("clinical_reframe", "")
    guidance = wisdom.get("actionable_guidance", {})
    what_to_do = guidance.get("what_to_do", "Focus 100% on the single highest-integrity action in front of you.")
    what_not_to_do = guidance.get("what_not_to_do", "Release attachment to hypothetical results you cannot control.")
    ch = wisdom.get("chapter", "2")
    vs = wisdom.get("verse", "47")

    sols = rag_guidance.get("solutions", {}) if rag_guidance else {}
    cbt_text = sols.get("cbt_reframing", "Notice how your mind catastrophizes the unknown. Shift attention to what is objectively true in front of you right now.")
    somatic_text = sols.get("somatic_anchor", "Perform 3 deep physiological sighs (two quick inhales through the nose, long sighing exhale through the mouth).")
    pranayama_text = sols.get("pranayama", "Nadi Shodhana (Alternate Nostril Breathing) for 3 minutes.")

    trataka_name_map = {
        "bindu": "Bindu Trataka (Sacred Golden Focal Point)",
        "flame": "Jyoti Trataka (Candle Flame Gazing)",
        "murti": "Mandala Trataka (Sacred Geometry Resonance)",
        "pratibimb": "Pratibimb Trataka (Sacred Mirror Gazing)",
        "shoonya": "Shoonya Trataka (Void & Panoramic Space Gazing)"
    }
    t_name = trataka_name_map.get(rec_trataka, "Bindu Trataka (Sacred Golden Focal Point)")

    return (
        f"[GITA_SHLOKA]\n"
        f"{shloka_san}\n\n"
        f"{shloka_rom}\n"
        f"— श्रीमद्भगवद्गीता (Chapter {ch}, Verse {vs})\n"
        f"[/GITA_SHLOKA]\n\n"
        f"**1. BHAGAVAD GITA REFRAMING (श्रीमद्भगवद्गीता):**\n"
        f"• **Philosophical Meaning:** {meaning}\n"
        f"• **Clinical Reflection:** {reframe}\n"
        f"• **Actionable Guidance (Karma):** {what_to_do} (Avoid: {what_not_to_do})\n\n"
        f"**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT & Somatic Grounding):**\n"
        f"• **Cognitive Restructuring:** {cbt_text}\n"
        f"• **Somatic Polyvagal Reset:** {somatic_text} alongside {pranayama_text}\n\n"
        f"**3. TRATAK NEURO-OCULAR PROTOCOL (त्राटक ध्यान - {t_name}):**\n"
        f"• **Focal Gaze:** Hold a soft, unblinking gaze at eye level for 2 to 3 minutes.\n"
        f"• **Neuro-Ocular Mechanism:** Motionless saccadic fixation down-regulates amygdala hyperactivity and activates the cardiac vagal brake.\n"
        f"• **Practice Closure:** Rub your palms vigorously until warm and cup them gently over closed eyes (Palming)."
    )
