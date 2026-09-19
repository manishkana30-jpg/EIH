"""
server/scripts/seed_gita_library.py
Bhagavad Gita Cognitive Therapy RAG Engine Seeder.
Creates or updates the persistent ChromaDB collection 'gita_library'
with core psychological shlokas calibrated for existential dilemmas,
decision paralysis, grief, anger, sensory overwhelm, and cognitive reframing.
"""

import os
import sys
from pathlib import Path

# Set up paths
workspace_root = Path(__file__).resolve().parent.parent.parent
db_path = str(workspace_root / "clinical_memory_db")

try:
    import chromadb
except ImportError:
    print("ERROR: chromadb is not installed in the active environment.")
    sys.exit(1)

GITA_SHLOKAS = [
    {
        "id": "BG_2_47",
        "chapter": 2,
        "verse": 47,
        "theme": "Action Without Attachment / Performance Anxiety & Decision Paralysis",
        "dilemma_triggers": "dilemma decision paralysis outcome anxiety fear of failure pressure what if i fail results uncertainty overwhelmed choosing",
        "shloka_sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        "shloka_roman": "karmaṇy-evādhikāras te mā phaleṣhu kadāchana\nmā karma-phala-hetur bhūr mā te saṅgo 'stvakarmaṇi",
        "philosophical_meaning": "You have a right only to performed duty, never to the fruits of action. Never consider yourself the sole author of outcomes, nor let your mind attach to inertia or non-action.",
        "clinical_reframe": "Shift focus entirely from uncontrollable distal outcomes to present-moment process execution. Socratic grounding dissolves anticipatory anxiety by separating locus of control (effort) from external variance (results).",
        "karma_action": "Focus 100% on the single next constructive step right now. Do not mentally rehearse future catastrophic evaluations."
    },
    {
        "id": "BG_2_14",
        "chapter": 2,
        "verse": 14,
        "theme": "Impermanence of Sensation & Emotional Distress Tolerance (Titiksha)",
        "dilemma_triggers": "pain suffering discomfort grief sadness emotional hurt enduring distress overwhelmed by feelings heart broken sorrow loss",
        "shloka_sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
        "shloka_roman": "mātrā-sparśhās tu kaunteya śhītoṣhṇa-sukha-duḥkha-dāḥ\nāgamāpāyino 'nityās tans-titikṣhasva bhārata",
        "philosophical_meaning": "Contact of the senses with their objects produces transitory experiences of cold and heat, pleasure and pain. They appear and disappear; they are impermanent. Endure them with steady equanimity (Titiksha).",
        "clinical_reframe": "All somatic surges and emotional states possess a discrete physiological half-life (~90 seconds without cognitive fueling). Practice cognitive defusion and somatic wave-riding: acknowledge the feeling without fighting or fusing with it.",
        "karma_action": "Breathe slowly and witness the emotional contraction in your chest or throat soften as an impermanent passing visitor."
    },
    {
        "id": "BG_2_62_63",
        "chapter": 2,
        "verse": "62-63",
        "theme": "Cognitive Cascade of Impulse, Frustration & Emotional Dysregulation",
        "dilemma_triggers": "anger rage frustration losing control impulsive shouting ruined regret obsession craving irritated fighting fury",
        "shloka_sanskrit": "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥\nक्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
        "shloka_roman": "dhyāyato viṣhayān puṁsaḥ saṅgas teṣhūpajāyate\nsaṅgāt sañjāyate kāmaḥ kāmāt krodho 'bhijāyate\nkrodhād bhavati sammohaḥ sammohāt smṛiti-vibhramaḥ\nsmṛiti-bhraṅśhād buddhi-nāśho buddhi-nāśhāt praṇaśhyati",
        "philosophical_meaning": "Ruminating on sensory objects creates attachment; attachment breeds unyielding desire; unfulfilled desire ignites wrath. From wrath arises cognitive bewilderment, leading to loss of mindful memory, destruction of discerning intellect (Buddhi), and ultimate personal ruin.",
        "clinical_reframe": "Neurobiologically maps the hijack of the prefrontal cortex by amygdalar rage. Catch the cognitive spiral at early appraisal (rumination) before autonomic hyperarousal destroys executive functioning.",
        "karma_action": "Step back immediately when anger peaks. Do not speak or react while autonomic sympathetic tone is spiking; engage vagal brake breathwork first."
    },
    {
        "id": "BG_6_5",
        "chapter": 6,
        "verse": 5,
        "theme": "Self-Compassion, Agency & Transforming Self-Criticism into Inner Friendship",
        "dilemma_triggers": "self hatred hate myself useless worthless depressed failure down on myself low self esteem self sabotage guilt regret shame",
        "shloka_sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
        "shloka_roman": "uddhared ātmanātmānaṁ nātmānam avasādayet\nātmaiva hyātmano bandhur ātmaiva ripur ātmanaḥ",
        "philosophical_meaning": "Elevate yourself through the power of your own higher mind; never degrade or disparage yourself. For the trained mind is indeed your greatest lifelong ally and friend, while an untrained, critical mind becomes your fiercest inner enemy.",
        "clinical_reframe": "Replaces the harsh internal critic with internal compassionate alliance. Neuropsychologically stimulates oxytocin and down-regulates dorsal vagal self-attack by treating oneself with the warmth one would offer an esteemed companion.",
        "karma_action": "Consciously halt internal abusive commentary. Speak to yourself right now in the supportive tone of an understanding mentor."
    },
    {
        "id": "BG_2_70",
        "chapter": 2,
        "verse": 70,
        "theme": "Sensory Overwhelm, Stimulus Overload & Oceanic Equilibrium",
        "dilemma_triggers": "overstimulated sensory overload racing thoughts too much happening overwhelmed chaos noisy hectic pressure burning out",
        "shloka_sanskrit": "आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्।\nतद्वत्कामा यं प्रविशन्ति सर्वे स शान्तिमप्नोति न कामकामी॥",
        "shloka_roman": "āpūryamāṇam achala-pratiṣhṭhaṁ samudram āpaḥ praviśhanti yadvat\ntadvat kāmā yaṁ praviśhanti sarve sa śhāntim āpnoti na kāma-kāmī",
        "philosophical_meaning": "Just as the boundless ocean remains undisturbed and unmoved even as countless torrential rivers empty into it, likewise the person into whom all sensory impressions and external desires enter without disturbing their inner core attains profound, unshakeable peace.",
        "clinical_reframe": "Somatic containment and psychological expanse. Expand your conscious perceptual field so external stressors occupy only a minor fraction of your total awareness rather than filling your entire mental sky.",
        "karma_action": "Visualize your consciousness as the deep, tranquil ocean floor. Notice surface waves passing high above without disturbing the calm depths below."
    },
    {
        "id": "BG_18_63",
        "chapter": 18,
        "verse": 63,
        "theme": "Autonomous Reflection, Wisdom Integration & Sovereign Choice",
        "dilemma_triggers": "confused torn between two choices what should i do advice guide me need direction stuck at crossroads moral dilemma",
        "shloka_sanskrit": "इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया।\nविमृश्यैतदशेषेण यथेच्छसि तथा कुरु॥",
        "shloka_roman": "iti te jñānam ākhyātaṁ guhyād guhyataraṁ mayā\nvimṛiśhyaitad aśheṣheṇa yathecchasi tathā kuru",
        "philosophical_meaning": "Thus have I disclosed to you wisdom more profound than the deepest secret. Reflect upon this completely and thoroughly; then, acting from your own sovereignty and discernment, do as you wish.",
        "clinical_reframe": "Unconditional positive regard and self-determination theory. The therapist/counselor provides the mirror and the frameworks, but fully honors the client's agency and autonomy to author their own life journey.",
        "karma_action": "Weigh your values against the options, make peace with the imperfect reality of human choice, and step forward with conscious conviction."
    }
]

def seed_gita_library():
    print(f"Initializing ChromaDB persistent client at: {db_path}")
    os.makedirs(db_path, exist_ok=True)
    client = chromadb.PersistentClient(path=db_path)
    
    # Get or create collection
    collection = client.get_or_create_collection(
        name="gita_library",
        metadata={"description": "Bhagavad Gita Cognitive Therapy & Psychological Shlokas RAG"}
    )

    ids = []
    documents = []
    metadatas = []

    for shloka in GITA_SHLOKAS:
        doc_id = shloka["id"]
        # Document text for semantic embedding
        doc_text = f"{shloka['theme']}. {shloka['dilemma_triggers']}. {shloka['philosophical_meaning']}. {shloka['clinical_reframe']}"
        
        ids.append(doc_id)
        documents.append(doc_text)
        metadatas.append({
            "chapter": str(shloka["chapter"]),
            "verse": str(shloka["verse"]),
            "theme": shloka["theme"],
            "shloka_sanskrit": shloka["shloka_sanskrit"],
            "shloka_roman": shloka["shloka_roman"],
            "philosophical_meaning": shloka["philosophical_meaning"],
            "clinical_reframe": shloka["clinical_reframe"],
            "karma_action": shloka["karma_action"],
        })

    collection.upsert(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )

    print(f"Successfully seeded {len(ids)} Bhagavad Gita psychological shlokas into collection 'gita_library'.")
    print("Collection count:", collection.count())

if __name__ == "__main__":
    seed_gita_library()
