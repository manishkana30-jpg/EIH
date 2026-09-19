"""
server/scripts/seed_gita_library.py
Seeds the 'gita_library' collection in ChromaDB with core psychological Shlokas
from the Bhagavad Gita for cognitive reframing, dilemma resolution, and emotional mastery.
"""

import os
import sys
from pathlib import Path

# Ensure repo root is on sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import chromadb

GITA_SHLOKAS = [
    {
        "id": "bg_2_47",
        "chapter": 2,
        "verse": 47,
        "theme": "Outcome Detachment / Decision Paralysis / Action Duty",
        "keywords": [
            "dilemma", "confused", "cannot decide", "paralysis", "decision",
            "what should i do", "fear of failure", "results", "outcome",
            "overwhelmed", "kya karu", "dharamsankat", "action"
        ],
        "shloka_sanskrit": "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
        "shloka_roman": "karmaṇy-evādhikāras te mā phaleṣu kadācana |\nmā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi ||",
        "philosophical_meaning": "You have a right only to perform your prescribed duty, but never to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to inaction.",
        "clinical_reframe": "Shift locus of control from unpredictable future outcomes to present-moment action. Relieve performance anxiety and decision paralysis by focusing 100% on the process rather than agonizing over hypothetical consequences."
    },
    {
        "id": "bg_2_14",
        "chapter": 2,
        "verse": 14,
        "theme": "Impermanence of Pain / Emotional Transience / Titiksha",
        "keywords": [
            "pain", "grief", "sadness", "heartbreak", "loss", "suffering",
            "crying", "unbearable", "hurting", "temporary", "dukkha", "dard"
        ],
        "shloka_sanskrit": "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
        "shloka_roman": "mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ |\nāgamāpāyino 'nityās tāṁs titikṣasva bhārata ||",
        "philosophical_meaning": "The contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They are fleeting and impermanent, appearing and disappearing like seasons. Endure them patiently, O Bharata.",
        "clinical_reframe": "Affective tolerance and emotional acceptance. All somatic distress and painful feelings have a physiological half-life; witnessing them as impermanent passing waves reduces secondary suffering."
    },
    {
        "id": "bg_2_62_63",
        "chapter": 2,
        "verse": "62-63",
        "theme": "Anger Cascade / Cognitive Dysregulation / Emotional Cascade",
        "keywords": [
            "anger", "furious", "rage", "irritation", "desire", "obsessing",
            "frustration", "loss of control", "screaming", "gussa", "krodh"
        ],
        "shloka_sanskrit": "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥\nक्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
        "shloka_roman": "dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate |\nsaṅgāt sañjāyate kāmaḥ kāmāt krodho 'bhijāyate ||\nkrodhād bhavati sammohaḥ sammohāt smṛti-vibhramaḥ |\nsmṛti-bhraṁśād buddhi-nāśo buddhi-nāśāt praṇaśyati ||",
        "philosophical_meaning": "Brooding on the objects of senses begets attachment to them. From attachment springs desire; from unfulfilled desire flares anger. From anger arises delusion; from delusion confusion of memory; from lost memory the ruin of intellect; and from ruin of intellect, one perishes.",
        "clinical_reframe": "The cognitive-behavioral cascade of dysregulation. Rumination triggers craving, unfulfilled craving triggers sympathetic anger/fight, which impairs prefrontal cortex executive functioning (Buddhi Nasha). Intervene at the first step of rumination."
    },
    {
        "id": "bg_6_5",
        "chapter": 6,
        "verse": 5,
        "theme": "Self-Mastery / Overcoming Self-Sabotage / Mind as Ally",
        "keywords": [
            "self doubt", "self sabotage", "my mind is my enemy", "hopeless",
            "helpless", "low confidence", "imposter", "inner critic", "shame"
        ],
        "shloka_sanskrit": "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
        "shloka_roman": "uddhared ātmanātmānaṁ nātmānam avasādayet |\nātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ ||",
        "philosophical_meaning": "Elevate yourself through the power of your own mind, and do not degrade yourself. For the mind alone is the true friend of the self, and the mind alone can be the self's greatest adversary.",
        "clinical_reframe": "Self-agency and internal compassionate cognitive restructuring. The user has the innate neuroplastic capacity to retrain their cognitive self-talk, shifting the inner dialogue from an internal critic to an empowering inner ally."
    },
    {
        "id": "bg_2_70",
        "chapter": 2,
        "verse": 70,
        "theme": "Emotional Equilibrium / Ocean Equanimity / Resilience",
        "keywords": [
            "peace", "stability", "calm", "anxiety", "overwhelmed", "chaos",
            "storm", "pressure", "turbulent", "shanti", "sukoon"
        ],
        "shloka_sanskrit": "आपूर्यमाणमचलप्रतिष्ठं समुद्रमापः प्रविशन्ति यद्वत्।\nतद्वत्कामा यं प्रविशन्ति सर्वे स शान्तिमाप्नोति न कामकामी॥",
        "shloka_roman": "āpūryamāṇam acala-pratiṣṭhaṁ samudram āpaḥ praviśanti yadvat |\ntadvat kāmā yaṁ praviśanti sarve sa śāntim āpnoti na kāma-kāmī ||",
        "philosophical_meaning": "Just as the ocean remains undisturbed while waters continually flow into it from all sides, a person into whom desires and emotions enter without creating a ripple attains true peace, not one who strives to satisfy every fleeting desire.",
        "clinical_reframe": "Mindful container meditation and distress tolerance. Visualizing the mind as a vast, deep ocean allows incoming stressors, thoughts, and feelings to enter like river currents without shaking core emotional stability."
    },
    {
        "id": "bg_18_63",
        "chapter": 18,
        "verse": 63,
        "theme": "Autonomous Clarity / Free Will / Overcoming Inaction",
        "keywords": [
            "freedom", "choice", "paralyzed", "responsibility", "clarity",
            "free will", "what do you think", "tell me what to do", "stuck"
        ],
        "shloka_sanskrit": "इति ते ज्ञानमाख्यातं गुह्याद्गुह्यतरं मया।\nविमृश्यैतदशेषेण यथेच्छसि तथा कुरु॥",
        "shloka_roman": "iti te jñānam ākhyātaṁ guhyād guhyataraṁ mayā |\nvimṛśyaitad aśeṣeṇa yathecchasi tathā kuru ||",
        "philosophical_meaning": "Thus, I have imparted to you wisdom that is more secret than all secrets. Reflect upon it completely and deeply, and then do as you wish according to your own free choice.",
        "clinical_reframe": "Restoring autonomous personal agency. Therapy does not dictate commands; it provides clear diagnostic reflection, empowering the user to make conscious, deliberate choices aligned with their core values."
    }
]


def seed_gita_library(db_path: str = "./clinical_memory_db") -> int:
    """Initializes and seeds the 'gita_library' ChromaDB collection."""
    os.makedirs(db_path, exist_ok=True)
    client = chromadb.PersistentClient(path=db_path)

    collection = client.get_or_create_collection(
        name="gita_library",
        metadata={"description": "Bhagavad Gita Psychological Wisdom & Shloka RAG"},
    )

    documents = []
    metadatas = []
    ids = []

    for item in GITA_SHLOKAS:
        doc_content = (
            f"Chapter {item['chapter']}, Verse {item['verse']}\n"
            f"Theme: {item['theme']}\n"
            f"Keywords: {', '.join(item['keywords'])}\n"
            f"Sanskrit: {item['shloka_sanskrit']}\n"
            f"Roman: {item['shloka_roman']}\n"
            f"Meaning: {item['philosophical_meaning']}\n"
            f"Clinical Reframe: {item['clinical_reframe']}"
        )
        documents.append(doc_content)
        metadatas.append({
            "chapter": str(item["chapter"]),
            "verse": str(item["verse"]),
            "theme": item["theme"],
            "shloka_sanskrit": item["shloka_sanskrit"],
            "shloka_roman": item["shloka_roman"],
            "philosophical_meaning": item["philosophical_meaning"],
            "clinical_reframe": item["clinical_reframe"],
        })
        ids.append(item["id"])

    collection.upsert(
        documents=documents,
        metadatas=metadatas,
        ids=ids,
    )

    count = collection.count()
    print(f"Successfully seeded 'gita_library' with {len(ids)} Shlokas. Total records in collection: {count}")
    return count


if __name__ == "__main__":
    db_location = os.environ.get("CHROMA_DB_PATH", "./clinical_memory_db")
    seed_gita_library(db_location)
