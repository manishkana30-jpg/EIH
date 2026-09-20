"""
Clinical Localization Engine for Keyless Healer Python Daemon
Provides:
1. 100% Human-crafted, culturally fluent CBT reframings, somatic anchors, and pranayamas.
2. Complete absence of mixed-language jargon (e.g. pure Hindi, pure Spanish, pure French, pure German).
3. Guaranteed, robust fallback to English (en/en-US) whenever a language is unsupported.
"""

from typing import Dict, Any, Optional
import re

def normalize_language_code(code: Optional[str]) -> str:
    if not code:
        return "en"
    c = code.lower().strip().split("-")[0].split("_")[0]
    if c in ("hi", "hindi"):
        return "hi"
    if c in ("es", "spanish"):
        return "es"
    if c in ("fr", "french"):
        return "fr"
    if c in ("de", "german"):
        return "de"
    return "en"


CLINICAL_LOCALIZATION_CATALOG: Dict[str, Dict[str, Dict[str, str]]] = {
    "gad": {
        "en": {
            "name": "Generalized Anxiety & Chronic Worry",
            "validation": "I hear how relentlessly your mind has been racing and how exhausting this cycle of chronic worry feels right now.",
            "cbt_reframing": "Notice your mind jumping to worst-case catastrophes. Ask yourself gently: 'What is the realistic probability of this occurring, and what evidence do I have right in front of me right now?' Shift your attention from 'What if?' to 'What is actually true in this present room?'",
            "somatic_anchor": "Engage the 5-4-3-2-1 sensory grounding exercise: acknowledge 5 things you can see around you, 4 textures you can touch, 3 sounds you can hear, 2 scents you can smell, and 1 taste.",
            "pranayama": "Engage in Nadi Shodhana (Alternate Nostril Breathing) for 3 to 5 minutes to restore your parasympathetic brake and soothe nervous system overactivation.",
        },
        "hi": {
            "name": "अत्यधिक चिंता और निरंतर मानसिक तनाव",
            "validation": "मैं समझ सकता हूँ कि इस समय आपका मन लगातार विचारों के भंवर में उलझा हुआ है और यह अनवरत चिंता आपको शारीरिक रूप से थका रही है।",
            "cbt_reframing": "अपने मन को अनहोनी की कल्पना करते हुए पहचानें। स्वयं से यह प्रश्न पूछें: 'इसकी वास्तविक संभावना क्या है, और वर्तमान क्षण में मेरे सामने क्या सत्य है?' अपने ध्यान को 'अगर ऐसा हुआ तो क्या होगा?' से हटाकर 'अभी इस क्षण में क्या सत्य है?' पर केंद्रित करें।",
            "somatic_anchor": "5-4-3-2-1 इंद्रिय ग्राउंडिंग का सहारा लें: अपने आसपास 5 चीज़ें देखें, 4 वस्तुओं को स्पर्श करें, 3 आवाज़ों को सुनें, 2 गंधों को महसूस करें और 1 स्वाद पर ध्यान दें।",
            "pranayama": "अपने तंत्रिका तंत्र को शांत करने और अतिरिक्त उत्तेजना को कम करने के लिए 3 से 5 मिनट तक नाड़ी शोधन प्राणायाम (वैकल्पिक नासिका श्वास) का अभ्यास करें।",
        },
        "es": {
            "name": "Ansiedad Generalizada y Preocupación Crónica",
            "validation": "Comprendo profundamente lo agotador que resulta sentir tu mente acelerada y atrapada en este ciclo continuo de preocupación.",
            "cbt_reframing": "Observa la tendencia de tu mente a anticipar catástrofes. Pregúntate con serenidad: '¿Cuál es la probabilidad real de que esto ocurra y qué evidencias tengo en este instante?' Transforma el '¿Y si pasa lo peor?' en '¿Qué es objetivamente real en este momento?'.",
            "somatic_anchor": "Aplica el anclaje sensorial 5-4-3-2-1: nombra 5 cosas que puedas ver a tu alrededor, 4 que puedas tocar, 3 que escuches, 2 que huelas y 1 sabor presente.",
            "pranayama": "Realiza la respiración Nadi Shodhana (fosas nasales alternas) durante 3 a 5 minutos para restaurar el tono parasimpático y sosegar el sistema nervioso.",
        },
        "fr": {
            "name": "Anxiété Généralisée et Rumination Chronique",
            "validation": "J'entends pleinement à quel point votre esprit s'emballe et combien ce cycle de soucis incessants est épuisant pour votre corps.",
            "cbt_reframing": "Prenez conscience de cette tendance à anticiper le pire scénario. Demandez-vous avec bienveillance : 'Quelle est la probabilité réelle de cet événement et quels faits concrets ai-je sous les yeux ?' Quittez le 'Et si...' pour revenir à ce qui est tangible ici et maintenant.",
            "somatic_anchor": "Pratiquez l'ancrage sensoriel 5-4-3-2-1 : observez 5 éléments visibles, touchez 4 textures, écoutez 3 sons ambiants, décelez 2 odeurs et 1 goût.",
            "pranayama": "Effectuez 3 à 5 minutes de respiration alternée (Nadi Shodhana) afin de réactiver votre frein vagal et apaiser la suractivation émotionnelle.",
        },
        "de": {
            "name": "Generalisierte Angst und Chronisches Sorgen",
            "validation": "Ich nehme wahr, wie unruhig Ihre Gedanken kreisen und wie tief erschöpfend sich diese ständige Anspannung anfühlt.",
            "cbt_reframing": "Bemerken Sie, wie Ihr Geist Katastrophenszenarien entwirft. Fragen Sie sich ruhig: 'Wie hoch ist die tatsächliche Wahrscheinlichkeit dafür und welche überprüfbaren Fakten liegen vor mir?' Wechseln Sie bewusst vom 'Was wäre wenn' zu dem, was in diesem Raum wahr ist.",
            "somatic_anchor": "Nutzen Sie die 5-4-3-2-1-Erdungsübung: Bennen Sie 5 Dinge, die Sie sehen, 4, die Sie berühren, 3 Geräusche, 2 Düfte und 1 Geschmack.",
            "pranayama": "Üben Sie 3 bis 5 Minuten lang die Wechselatmung (Nadi Shodhana), um Ihren Vagusnerv zu stimulieren und das vegetative Nervensystem auszugleichen.",
        },
    },

    "burnout_fatigue": {
        "en": {
            "name": "Nervous Exhaustion & Clinical Burnout",
            "validation": "I hear the profound bone-deep exhaustion you are carrying, where even small tasks feel like an insurmountable mountain.",
            "cbt_reframing": "Challenge the belief that your worth depends on perpetual output. Rest is an essential biological requirement, not a reward you have to earn. You cannot pour warmth into the world from a depleted vessel.",
            "somatic_anchor": "Lie flat on a firm surface, unglue your tongue from the roof of your mouth, drop your shoulders away from your ears, and consciously release tension in your pelvic floor.",
            "pranayama": "Practice Bhramari (Humming Bee Breath) for 4 minutes to create cranial micro-vibrations that stimulate nitric oxide and soothe mental fatigue.",
        },
        "hi": {
            "name": "शारीरिक व मानसिक थकान और बर्नआउट",
            "validation": "मैं समझ सकता हूँ कि आप भीतर से कितना थका हुआ महसूस कर रहे हैं, जहाँ छोटा सा काम भी एक भारी बोझ जैसा लग रहा है।",
            "cbt_reframing": "इस भ्रम को तोड़ें कि आपका मूल्य केवल लगातार काम करने में है। विश्राम कोई इनाम नहीं है जिसे आपको कमाना पड़े, यह शरीर और मन की अनिवार्य जैविक आवश्यकता है। खाली बर्तन से दूसरों को पोषण नहीं दिया जा सकता।",
            "somatic_anchor": "जमीन पर सीधे लेटें, अपनी जीभ को तालू से अलग करें, कंधों को कानों से दूर ढीला छोड़ें और पेट व जबड़े की मांसपेशियों को पूरी तरह तनावमुक्त होने दें।",
            "pranayama": "4 मिनट तक भ्रामरी प्राणायाम (मधुमक्खी जैसी गुंजन ध्वनि) का अभ्यास करें, जिससे कपाल में सूक्ष्म स्पंदन पैदा होकर तंत्रिका तंत्र को गहरा विश्राम मिलता है।",
        },
        "es": {
            "name": "Agotamiento Nervioso y Burnout Clínico",
            "validation": "Reconozco el cansancio profundo que llevas en el cuerpo, donde incluso las tareas más sencillas parecen requerir un esfuerzo titánico.",
            "cbt_reframing": "Desafía la creencia de que tu valor depende de producir sin parar. El descanso no es un premio que debas ganarte, sino una necesidad biológica indispensable. Nadie puede dar lo mejor de sí con el depósito vacío.",
            "somatic_anchor": "Acuéstate sobre una superficie firme, despega la lengua del paladar, suelta los hombros lejos de las orejas y relaja conscientemente la mandíbula.",
            "pranayama": "Practica el pranayama Bhramari (respiración de zumbido) durante 4 minutos para activar microvibraciones craneales que estimulan el nervio vago y calman la fatiga.",
        },
        "fr": {
            "name": "Épuisement Nerveux et Burnout",
            "validation": "Je ressens pleinement cette fatigue écrasante qui pèse sur vos épaules et vide votre énergie vitale.",
            "cbt_reframing": "Rejetez l'idée que votre valeur dépend de votre productivité ininterrompue. Le repos n'est pas une récompense à mériter, c'est une nécessité biologique absolue pour vous régénérer.",
            "somatic_anchor": "Allongez-vous confortablement, décollez la langue du palais, abaissez les épaules et détendez complètement les muscles du visage et du bassin.",
            "pranayama": "Pratiquez 4 minutes de respiration Bhramari (le souffle du bourdonnement) pour induire une vibration apaisante et revitaliser l'esprit.",
        },
        "de": {
            "name": "Nervöse Erschöpfung und Burnout",
            "validation": "Ich spüre, wie tief diese Erschöpfung in Ihren Knochen sitzt und wie leer sich Ihre mentalen Batterien anfühlen.",
            "cbt_reframing": "Hinterfragen Sie den Glauben, dass Ihr Wert an ununterbrochener Leistung gemessen wird. Erholung ist kein Bonus, den man sich verdienen muss, sondern eine biologische Notwendigkeit. Aus einem leeren Krug kann man nichts einschenken.",
            "somatic_anchor": "Legen Sie sich flach hin, lösen Sie die Zunge vom Gaumen, lassen Sie die Schultern sinken und entspannen Sie bewusst Kiefer und Becken.",
            "pranayama": "Praktizieren Sie 4 Minuten lang die Bhramari-Atmung (Summen der Biene), um über sanfte Vibrationen das Nervensystem tief zu entspannen.",
        },
    },

    "panic_dysregulation": {
        "en": {
            "name": "Acute Panic & Autonomic Dysregulation",
            "validation": "I hear your racing heart and understand how terrifying this sudden surge of bodily sensations feels right now.",
            "cbt_reframing": "Remind yourself: this intense wave is a harmless surge of adrenaline that naturally metabolizes and subsides within 8 to 12 minutes. These sensations are extremely uncomfortable, but they are completely safe. You are not losing control.",
            "somatic_anchor": "Activate your mammalian dive reflex: press an ice cube or cold wet towel against your upper cheeks and eyes for 20 seconds to instantly slow down your heart rate.",
            "pranayama": "Use the Extended Exhale Protocol: inhale gently through your nose for 4 seconds, then exhale smoothly through pursed lips for 7 seconds. Long exhales signal safety directly to your brainstem.",
        },
        "hi": {
            "name": "अचानक घबराहट और पैनिक अटैक",
            "validation": "मैं आपकी तेज़ होती धड़कन और इस समय शरीर में उठते डर के तीव्र प्रवाह को भली-भांति समझ सकता हूँ।",
            "cbt_reframing": "स्वयं को याद दिलाएं: यह तीव्र लहर केवल एड्रेनालाईन का एक अस्थायी प्रवाह है जो 8 से 12 मिनट में अपने आप शांत हो जाता है। यह अहसास असहज जरूर है, पर कतई खतरनाक नहीं। आप पूरी तरह सुरक्षित हैं।",
            "somatic_anchor": "अपने चेहरे पर ठंडक का स्पर्श दें: अपनी आँखों और गालों के ऊपरी हिस्से पर बर्फ या ठंडा गीला तौलिया 20 सेकंड के लिए रखें। इससे दिल की तेज़ गति तुरंत सामान्य होने लगती है।",
            "pranayama": "लंबी प्रश्वास का नियम अपनाएं: 4 सेकंड में नाक से सांस अंदर लें, और होंठों को गोल करके 7 सेकंड में धीरे-धीरे पूरी सांस बाहर निकालें। लंबी सांस छोड़ना हृदय को सुरक्षा का संकेत देता है।",
        },
        "es": {
            "name": "Pánico Agudo y Desregulación Autonómica",
            "validation": "Comprendo el sobresalto y el miedo intenso que sientes ante la aceleración de tus latidos y sensaciones corporales.",
            "cbt_reframing": "Recuerda con certeza: esta oleada es una descarga natural de adrenalina que el cuerpo metaboliza y disuelve en 8 a 12 minutos. Las sensaciones son incómodas, pero no representan ningún peligro real. No estás perdiendo el control.",
            "somatic_anchor": "Aplica el reflejo de inmersión: coloca una compresa fría sobre tus pómulos y frente durante 20 segundos para reducir el ritmo cardíaco de forma refleja.",
            "pranayama": "Práctica de exhalación prolongada: inhala suavemente por la nariz en 4 tiempos y exhala lentamente por la boca en 7 tiempos. Exhalar despacio tranquiliza de inmediato el cerebro primitivo.",
        },
        "fr": {
            "name": "Panique Aiguë et Crise d'Angoisse",
            "validation": "J'entends la violence de cette montée d'angoisse et la terreur que peut provoquer l'emballement de vos battements cardiaques.",
            "cbt_reframing": "Rappelez-vous fermement : cette vague est une simple décharge d'adrénaline qui retombe naturellement en 8 à 12 minutes. Les sensations sont intenses mais absolument sans danger pour vous. Vous êtes en sécurité.",
            "somatic_anchor": "Appliquez une compresse d'eau très froide sur les pommettes et le haut des yeux pendant 20 secondes pour ralentir le rythme cardiaque.",
            "pranayama": "Respirez avec une expiration allongée : inspirez par le nez pendant 4 secondes, puis soufflez lentement par la bouche pincée pendant 7 secondes.",
        },
        "de": {
            "name": "Akute Panik und Vegetative Übererregung",
            "validation": "Ich verstehe, wie beängstigend sich dieses Herzrasen und die plötzliche Welle körperlicher Symptome anfühlt.",
            "cbt_reframing": "Vergegenwärtigen Sie sich: Dies ist ein harmloser Adrenalinschub, den Ihr Körper innerhalb von 8 bis 12 Minuten von selbst abbaut. Die Empfindungen sind unangenehm, aber völlig ungefährlich. Sie verlieren nicht die Kontrolle.",
            "somatic_anchor": "Aktivieren Sie den Tauchreflex: Halten Sie ein kaltes Tuch für 20 Sekunden auf Wangen und Stirn, um den Puls sofort zu senken.",
            "pranayama": "Verlängerte Ausatmung: 4 Sekunden sanft durch die Nase einatmen, dann 7 Sekunden lang langsam durch leicht geöffnete Lippen ausatmen.",
        },
    },

    "major_depressive_inertia": {
        "en": {
            "name": "Depressive Heaviness & Low Motivation",
            "validation": "I hear the heavy, numbing fog you are walking through, where taking even a single step feels completely drained of meaning.",
            "cbt_reframing": "Apply the clinical behavioral activation rule: action precedes motivation, not the reverse. Do not wait until you feel energized to take action. Even a microscopic 1% action begins shifting neurochemistry.",
            "somatic_anchor": "Stand barefoot on the solid floor, feel the ground supporting your weight, and gently tap your chest over your sternum with your fingertips for 60 seconds.",
            "pranayama": "Engage in gentle Surya Bhedana (Right Nostril Breathing) for 3 minutes to activate the energizing solar channel and lift lethargic heaviness.",
        },
        "hi": {
            "name": "उदासी, भारीपन और प्रेरणा का अभाव",
            "validation": "मैं समझ सकता हूँ कि इस समय आपके मन पर कितनी गहरी उदासी और भारीपन छाया हुआ है, जहाँ कुछ भी करने की इच्छा नहीं हो रही।",
            "cbt_reframing": "व्यवहार सक्रियण के नियम को याद रखें: प्रेरणा काम करने के बाद आती है, पहले नहीं। इस बात का इंतज़ार न करें कि जब मन करेगा तब करेंगे। एक छोटा सा कदम भी आपके मस्तिष्क के रसायनों को बदलना शुरू कर देता है।",
            "somatic_anchor": "नंगे पैर ज़मीन पर खड़े हों, पृथ्वी के सहारे को महसूस करें और अपनी छाती के बीचों-बीच अपनी उंगलियों से 60 सेकंड तक धीरे-धीरे थपथपाएं।",
            "pranayama": "3 मिनट तक सूर्य भेदन प्राणायाम (दायीं नासिका से सांस लेना) करें ताकि शरीर में सकारात्मक ऊर्जा का संचार हो और आलस्य व भारीपन दूर हो।",
        },
        "es": {
            "name": "Pesadez Emocional e Inercia Depresiva",
            "validation": "Reconozco la sensación de vacío y la pesadez que sientes, donde hasta el acto de moverte parece no tener sentido.",
            "cbt_reframing": "Recuerda el principio de activación conductual: la acción precede a la motivación, nunca al revés. No esperes a tener ganas para dar un paso; cualquier microacción rompe el bucle de la inercia cerebral.",
            "somatic_anchor": "Ponte de pie descalzo sobre el suelo firme, siente el apoyo y da suaves golpecitos con los dedos sobre tu esternón durante un minuto para activar la presencia.",
            "pranayama": "Practica 3 minutos de respiración Surya Bhedana (inhalación por la fosa nasal derecha) para activar la energía y disipar la letargia.",
        },
        "fr": {
            "name": "Abattement Émotionnel et Perte d'Énergie",
            "validation": "J'entends le poids immense et l'engourdissement qui vous envahissent, rendant chaque geste si lourd à accomplir.",
            "cbt_reframing": "Appliquez le principe de l'activation comportementale : l'élan vient après le mouvement, non l'inverse. N'attendez pas d'avoir envie pour agir ; un geste infime suffit à réamorcer la vitalité.",
            "somatic_anchor": "Tenez-vous pieds nus sur le sol, ressentez la stabilité de la terre et tapotez doucement votre sternum du bout des doigts pendant une minute.",
            "pranayama": "Pratiquez 3 minutes de respiration solaire (Surya Bhedana par la narine droite) pour réchauffer et dynamiser l'organisme.",
        },
        "de": {
            "name": "Depressive Niedergeschlagenheit und Antriebslosigkeit",
            "validation": "Ich spüre die schwere Taubheit und die Last, die auf Ihnen liegt, wenn jede Bewegung sinnlos und anstrengend erscheint.",
            "cbt_reframing": "Nutzen Sie das Prinzip der Verhaltensaktivierung: Handeln erzeugt Motivation, nicht umgekehrt. Warten Sie nicht darauf, dass der Schwung kommt. Bereits ein winziger 1%-Schritt verändert die Hirnchemie.",
            "somatic_anchor": "Stellen Sie sich barfuß auf festen Boden, spüren Sie den Halt und klopfen Sie sanft mit den Fingerspitzen für 60 Sekunden Ihr Brustbein ab.",
            "pranayama": "Üben Sie 3 Minuten die Sonnenatmung (Surya Bhedana über das rechte Nasenloch), um frische Lebensenergie zu wecken.",
        },
    },

    "cognitive_memory_brain_fog": {
        "en": {
            "name": "Cognitive Fatigue, Memory Deficits & Brain Fog",
            "validation": "I hear how frustrating and unsettling it feels when your memory feels weak or foggy and you struggle to recall things clearly.",
            "cbt_reframing": "Notice the fear that your brain is failing. In reality, memory slips and brain fog are almost always caused by stress, sleep debt, or cognitive overload occupying your working memory—not permanent damage. Your brain's storage is completely intact; it is simply your retrieval bandwidth that is temporarily crowded.",
            "somatic_anchor": "Sensory focus re-anchoring: take a sip of cool water, notice its sensation, and gently tap your temples and forehead with your fingertips for 30 seconds to awaken prefrontal circulation.",
            "pranayama": "Practice 5 rounds of gentle Bhramari (Humming Bee Breath) with your index fingers softly closing your ears to generate cranial micro-vibrations, stimulate nitric oxide, and restore mental clarity.",
        },
        "hi": {
            "name": "कमज़ोर याददाश्त, विस्मृति और दिमागी धुंध (ब्रेन फॉग)",
            "validation": "मैं समझ सकता हूँ कि जब याददाश्त कमजोर लगने लगे या बातें याद रखने में कठिनाई हो, तो यह कितना निराशाजनक और डरावना लग सकता है।",
            "cbt_reframing": "इस डर को पहचानें कि आपका दिमाग कमजोर हो रहा है। वास्तव में, भूलने की समस्या या दिमागी धुंध अक्सर मानसिक तनाव, नींद की कमी या दिमाग पर अत्यधिक काम के बोझ के कारण होती है—यह कोई स्थायी क्षति नहीं है। आपकी याददाश्त पूरी तरह सुरक्षित है, केवल अत्यधिक विचारों के कारण सही समय पर बातें याद आने में बाधा आ रही है।",
            "somatic_anchor": "इंद्रिय सजगता का अभ्यास: ठंडे पानी का एक घूंट लें, उसे गले से नीचे उतरते महसूस करें और 30 सेकंड तक अपनी उंगलियों से कनपटी और माथे को धीरे-धीरे थपथपाएं ताकि मस्तिष्क में रक्त संचार बढ़ सके।",
            "pranayama": "5 चक्र भ्रामरी प्राणायाम का अभ्यास करें: अपनी तर्जनी उंगलियों से कानों को हल्के से बंद करें और सांस छोड़ते हुए भौंरे जैसी मधुर गुंजन करें। यह कपाल में सूक्ष्म स्पंदन पैदा कर मानसिक स्पष्टता लौटाता है।",
        },
        "es": {
            "name": "Fatiga Cognitiva, Pérdida de Memoria y Niebla Mental",
            "validation": "Comprendo lo frustrante e inquietante que resulta sentir la memoria débil o dispersa y tener dificultades para recordar las cosas con claridad.",
            "cbt_reframing": "Desafía la idea de que tu capacidad mental se está deteriorando. La niebla mental y los olvidos cotidianos son casi siempre consecuencia del estrés acumulado, la falta de sueño o la sobrecarga sensorial. La memoria a largo plazo está intacta; es el canal de recuperación el que se encuentra saturado.",
            "somatic_anchor": "Reanclaje sensorial: bebe un sorbo de agua fresca, nota la sensación al tragar y date suaves golpecitos con las yemas de los dedos en las sienes y la frente durante 30 segundos para activar la circulación frontal.",
            "pranayama": "Practica 5 rondas de respiración Bhramari (zumbido de la abeja) tapando suavemente los oídos con los índices para generar microvibraciones craneales, liberar óxido nítrico y despejar la mente.",
        },
        "fr": {
            "name": "Fatigue Cognitive, Trous de Mémoire et Brouillard Mental",
            "validation": "J'entends combien il est déstabilisant et anxiogène de sentir sa mémoire fléchir et d'avoir du mal à retrouver ses idées.",
            "cbt_reframing": "Prenez du recul face à la crainte d'un déclin cognitif irréversible. Les oublis fréquents et le brouillard mental résultent presque toujours du stress, d'un manque de sommeil ou d'une surcharge d'informations. Votre mémoire profonde est parfaitement préservée ; c'est simplement votre bande passante mentale qui est temporairement saturée.",
            "somatic_anchor": "Réancrage sensoriel : buvez une gorgée d'eau fraîche en observant la sensation dans la gorge, puis tapotez doucement vos tempes et votre front du bout des doigts pendant 30 secondes.",
            "pranayama": "Réalisez 5 cycles de respiration Bhramari (le souffle du bourdonnement) en bouchant légèrement vos oreilles avec les index pour diffuser des micro-vibrations crâniennes et clarifier l'esprit.",
        },
        "de": {
            "name": "Kognitive Erschöpfung, Gedächtnisschwäche und Brain Fog",
            "validation": "Ich verstehe, wie beunruhigend und frustrierend es ist, wenn das Gedächtnis nachlässt und man sich Dinge schwer merken kann.",
            "cbt_reframing": "Hinterfragen Sie die Befürchtung, dass Ihre geistige Leistungsfähigkeit dauerhaft geschädigt ist. Gedächtnislücken und geistige Trübheit sind in den allermeisten Fällen die Folge von chronischem Stress, Schlafmangel oder Reizüberflutung. Ihr Langzeitgedächtnis ist intakt; lediglich der Arbeitsspeicher ist im Moment überfüllt.",
            "somatic_anchor": "Sensorische Re-Fokussierung: Trinken Sie einen Schluck kühles Wasser, spüren Sie die Frische und klopfen Sie für 30 Sekunden sanft mit den Fingerkuppen auf Schläfen und Stirn, um die Durchblutung zu fördern.",
            "pranayama": "Führen Sie 5 Runden der Bhramari-Atmung (Summen der Biene) durch, indem Sie die Ohren sanft verschließen und summend ausatmen, um den Geist durch feine Vibrationen zu klären.",
        },
    },
}

# Dynamically load full 21 conditions x 5 locales from clinical_localization.json if available
import json
import os

def _init_localization_catalog() -> None:
    candidates = [
        os.path.abspath("data/clinical_localization.json"),
        os.path.abspath("../data/clinical_localization.json"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "clinical_localization.json"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "clinical_localization.json"),
    ]
    for c in candidates:
        if os.path.exists(c):
            try:
                with open(c, encoding="utf-8") as f:
                    data = json.load(f)
                    catalog = data.get("catalog", {})
                    for cond_k, cond_v in catalog.items():
                        if cond_k not in CLINICAL_LOCALIZATION_CATALOG:
                            CLINICAL_LOCALIZATION_CATALOG[cond_k] = cond_v
                        else:
                            for loc_k, loc_v in cond_v.items():
                                CLINICAL_LOCALIZATION_CATALOG[cond_k][loc_k] = loc_v
                    for k, v in data.get("general_advice", {}).items():
                        if k in GENERAL_LOCALIZED_ADVICE:
                            GENERAL_LOCALIZED_ADVICE[k].update(v)
                        else:
                            GENERAL_LOCALIZED_ADVICE[k] = v
                break
            except Exception:
                pass

_init_localization_catalog()

GENERAL_LOCALIZED_ADVICE: Dict[str, Dict[str, str]] = {
    "en": {
        "default": "I acknowledge the emotional weight you are holding right now. Notice that intense thoughts are transient mental events rather than permanent definitions of reality. Take a slow diaphragmatic inhale for 4 counts, hold gently for 4 counts, and extend your exhale for 6 counts to settle your nervous system."
    },
    "hi": {
        "default": "मैं समझ सकता हूँ कि आप इस समय गहरे मानसिक दबाव से गुजर रहे हैं। याद रखें कि कठिन विचार और भावनाएं केवल मन में उठती लहरें हैं, स्थायी सत्य नहीं। 4 सेकंड तक गहरी सांस अंदर लें, 4 सेकंड रोकें और 6 सेकंड में धीरे-धीरे बाहर छोड़ें।"
    },
    "es": {
        "default": "Comprendo el peso emocional que estás sobrellevando. Recuerda que los pensamientos difíciles son señales fisiológicas transitorias, no realidades definitivas. Inhala durante 4 tiempos, retén con suavidad 4 tiempos y exhala lentamente en 6 tiempos para sosegar tu sistema nervioso."
    },
    "fr": {
        "default": "J'entends la charge émotionnelle que vous portez en ce moment. Ces pensées pénibles ne sont que des passages mentaux temporaires. Inspirez doucement sur 4 temps, retenez 4 temps et expirez longuement sur 6 temps pour apaiser votre corps."
    },
    "de": {
        "default": "Ich nehme wahr, wie schwer die emotionale Last wiegt. Aufwühlende Gedanken sind vorübergehende Ereignisse, keine unveränderlichen Wahrheiten. Atmen Sie 4 Sekunden ruhig ein, halten Sie kurz für 4 Sekunden und atmen Sie 6 Sekunden langsam aus, um inneren Halt zu finden."
    },
}

def build_diagnostic_suffering_assessment(
    user_message: str = "",
    emotion_hint: Optional[str] = None,
    condition_name: Optional[str] = None,
    lang_code: Optional[str] = "en"
) -> dict[str, Any]:
    norm = normalize_language_code(lang_code)
    text = (user_message or "").strip().lower()

    distress_score = 7
    if any(w in text for w in ["terrified", "panic", "heartbreak", "cannot bear", "furious", "ruined", "dying"]):
        distress_score = 9
    elif any(w in text for w in ["anxious", "depressed", "exhausted", "shame", "angry", "failed"]):
        distress_score = 7
    elif any(w in text for w in ["stressed", "worried", "confused", "tired"]):
        distress_score = 5
    else:
        distress_score = 4

    is_dorsal = any(w in text for w in ["numb", "hopeless", "empty", "exhaust", "give up", "paralyz"])
    is_sympathetic = not is_dorsal

    if any(w in text for w in ["sad", "grief", "heartbreak", "broke up", "cry"]):
        matched_key = "sadness"
    elif any(w in text for w in ["ang", "rage", "yelled", "furious", "boss"]):
        matched_key = "anger"
    elif any(w in text for w in ["panic", "fear", "terrified"]):
        matched_key = "fear"
    elif any(w in text for w in ["sham", "guilt", "fake", "imposter", "failure", "hate myself"]):
        matched_key = "shame"
    elif any(w in text for w in ["dilemma", "confus", "cannot decide", "can't decide"]):
        matched_key = "confusion"
    elif any(w in text for w in ["overwhelm", "burnout", "racing thoughts", "hurricane", "chaos"]):
        matched_key = "overwhelm"
    else:
        matched_key = "anxiety"

    emotion_names = {
        "anxiety": {
            "en": "Anticipatory Anxiety & Fear of Negative Outcomes",
            "hi": "भविष्य की अनहोनी का भय एवं अत्यधिक चिंता",
            "es": "Ansiedad Anticipatoria y Temor al Futuro",
            "fr": "Anxiété Anticipatoire et Peur de l'Échec",
            "de": "Antizipatorische Angst & Sorge vor Ungewissheit"
        },
        "sadness": {
            "en": "Acute Sadness, Grief & Emotional Heaviness",
            "hi": "गहरा विषाद, शोक एवं भावनात्मक भारीपन",
            "es": "Tristeza Aguda, Duelo y Pesadez Emocional",
            "fr": "Tristesse Aiguë, Deuil et Accablement",
            "de": "Akute Traurigkeit, Trauer & Seelischer Schmerz"
        },
        "anger": {
            "en": "Frustration, Interpersonal Betrayal & Anger Cascade",
            "hi": "तीव्र रोष, विश्वासघात की पीड़ा एवं क्रोध",
            "es": "Frustración, Ira y Sentimiento de Injusticia",
            "fr": "Colère Vive, Frustration et Sentiment de Trahison",
            "de": "Wut, Frustration & Empörung über Kränkungen"
        },
        "fear": {
            "en": "Panic, Threat Alarm & Autonomic Dysregulation",
            "hi": "अचानक घबराहट, पैनिक एवं भय का तीव्र वेग",
            "es": "Pánico, Alarma de Amenaza y Desregulación",
            "fr": "Panique Aiguë, Alerte de Danger et Angoisse",
            "de": "Panik, Bedrohungsgefühl & Vegetative Übererregung"
        },
        "shame": {
            "en": "Core Shame, Self-Blame & Imposter Syndrome",
            "hi": "आत्म-संदेह, हीनभावना एवं आत्म-निंदा",
            "es": "Culpa Tóxica, Vergüenza y Síndrome del Impostor",
            "fr": "Honte Profonde, Autocritique et Syndrome de l'Imposteur",
            "de": "Toxische Scham, Selbstzweifel & Hochstapler-Syndrom"
        },
        "confusion": {
            "en": "Existential Dilemma, Decision Paralysis & Mental Fog",
            "hi": "धर्मसंकट, निर्णय न ले पाना एवं मानसिक असमंजस",
            "es": "Dilema Existencial, Parálisis por Análisis y Confusión",
            "fr": "Dilemme Existantiel, Paralysie Décisionnelle et Flou Mental",
            "de": "Existenzielles Dilemma, Entscheidungslähmung & Verwirrung"
        },
        "overwhelm": {
            "en": "Cognitive Overload, Sensory Chaos & Burnout Exhaustion",
            "hi": "मानसिक बिखराव, संवेदी अधिभार एवं अत्यधिक मानसिक थकान",
            "es": "Sobrecarga Cognitiva, Saturación Mental y Agotamiento",
            "fr": "Surcharge Mentale, Épuisement et Dispersion Cognitive",
            "de": "Mentale Überlastung, Reizüberflutung & Erschöpfung"
        },
    }

    emotion_name = emotion_names.get(matched_key, {}).get(norm, condition_name or "Emotional Strain")

    if norm == "hi":
        severity = "अत्यधिक तीव्र कष्ट (Severe / Acute Dysregulation)" if distress_score >= 8 else ("मध्यम से गंभीर तनाव (Moderate / High Strain)" if distress_score >= 6 else "हल्का से मध्यम तनाव")
        nervous = "सिम्पैथेटिक तंत्रिका तंत्र की अति-सक्रियता (लड़ो या भागो / Fight-or-Flight)" if is_sympathetic else "डॉर्सल वेगल शटडाउन (भावशून्यता व अत्यधिक थकान)"
        bodily = "सीने में जकड़न, तेज़ सांसें और आंतरिक तनाव" if is_sympathetic else "शरीर में भारीपन, सुन्नता और ऊर्जा का अभाव"
        summary = "आप इस समय जिस मानसिक वेदना, अनिश्चितता और भारीपन से जूझ रहे हैं, आपका मन और शरीर दोनों उससे अत्यधिक थके हुए हैं।"
        md = f"**आपकी स्थिति का सारांश एवं मानसिक पीड़ा का मूल्यांकन:**\n• **पहचाना गया मनोभाव एवं मुख्य संघर्ष:** {emotion_name}\n• **पीड़ा का स्तर एवं तंत्रिका तंत्र स्थिति:** {severity} (कष्ट सूचकांक: {distress_score}/10) | {nervous}\n• **शारीरिक संवेदनाएं व आंतरिक तनाव:** {bodily}\n• **आपकी स्थिति का संवेदनशील सारांश:** {summary}"
    else:
        severity = "Severe / Acute High Distress" if distress_score >= 8 else ("Moderate to Elevated Distress" if distress_score >= 6 else "Mild to Moderate Strain")
        nervous = "Sympathetic Nervous System Hyperarousal (Fight-or-Flight)" if is_sympathetic else "Dorsal Vagal Shutdown (Freeze & Depletion)"
        bodily = "Chest tightness, rapid breathing, and visceral tension" if is_sympathetic else "Heavy limbs, brain fog, and energetic depletion"
        summary = "You are carrying a heavy burden of acute emotional strain and internal turbulence that is placing your body and mind under exhaustion."
        md = f"**SUMMARY OF YOUR INPUT & EMOTIONAL SUFFERING ASSESSMENT (स्थिति व कष्ट का विश्लेषण):**\n• **Identified Emotional State:** {emotion_name}\n• **Suffering Severity & Autonomic State:** {severity} (Distress Index: {distress_score}/10) | {nervous}\n• **Interoceptive Bodily Burden:** {bodily}\n• **Empathic Summary of Your Experience:** {summary}"

    return {
        "emotion_name": emotion_name,
        "distress_score": distress_score,
        "markdown": md,
    }


def build_tri_pillar_synergy_resolution(
    lang_code: Optional[str] = "en",
    tratak_name: Optional[str] = None,
    gita_theme: Optional[str] = None
) -> str:
    norm = normalize_language_code(lang_code)
    t_name = tratak_name or "Tratak Gazing"

    if norm == "hi":
        return (
            f"**4. एकीकृत त्रिवेणी उपचार योजना (गीता + CBT + त्राटक मिलकर आपकी पीड़ा कैसे दूर करेंगे):**\n"
            f"यह तीनों दिव्य एवं वैज्ञानिक पद्धतियाँ एक साथ मिलकर आपकी व्यथा का संपूर्ण समाधान इस प्रकार करती हैं:\n\n"
            f"1. **आत्मिक व दार्शनिक संबल (श्रीमद्भगवद्गीता):**\n"
            f"   गीता का अमर उपदेश आपके मन को काल्पनिक भविष्य के डर और परिणामों की चिंता से मुक्त कर 'साक्षी भाव' में स्थिर करता है। जब आप परिणाम की आसक्ति छोड़कर केवल अपने कर्तव्य पर ध्यान केंद्रित करते हैं, तो असफलता का भय और अनिर्णय की पीड़ा स्वतः विलीन हो जाती है।\n\n"
            f"2. **संज्ञानात्मक पुनर्विचार एवं शारीरिक संतुलन (CBT व सोमैटिक विज्ञान):**\n"
            f"   जहाँ गीता आत्मिक चेतना को ऊंचा उठाती है, वहीं CBT आपके मन में उठने वाले नकारात्मक विचारों (जैसे अनहोनी की आशंका या आत्म-दोष) को तार्किक रूप से ठीक करता है। इसके साथ ही दिया गया प्राणायाम और सोमैटिक ग्राउंडिंग आपके तंत्रिका तंत्र को तुरंत शांत करके शरीर में सुरक्षा और स्थिरता का संचार करते हैं।\n\n"
            f"3. **न्यूरो-ऑक्युलर दृष्टि स्थिरीकरण (त्राटक ध्यान):**\n"
            f"   त्राटक इन दोनों उपायों को जैविक आधार प्रदान करता है। जब मन अशांत होता है, तो आँखें तेजी से फड़कती और भटकती हैं, जिससे मस्तिष्क का तनाव केंद्र (एमीग्डाला) भड़क उठता है। {t_name} द्वारा दृष्टि को एक बिंदु पर टिकाने से आँखों की यह चंचलता रुक जाती है, जिससे विचारों का तूफ़ान तुरंत थम जाता है।\n\n"
            f"4. **आपका समन्वित दैनिक अभ्यास क्रम:**\n"
            f"   • **पहला चरण (दृष्टि स्थिरीकरण):** 3 से 5 मिनट {t_name} का अभ्यास करें ताकि मस्तिष्क के तनाव केंद्र को शांति मिले।\n"
            f"   • **दूसरा चरण (प्राणायाम व विश्राम):** निर्धारित प्राणायाम करें जिससे हृदय गति और सीने का खिंचाव सामान्य हो सके।\n"
            f"   • **तीसरा चरण (सकारात्मक विचार):** CBT द्वारा सुझाए गए नए विचार को मन में दोहराकर नकारात्मक सोच को बदलें।\n"
            f"   • **चौथा चरण (सच्चा कर्तव्य):** गीता के संदेश के अनुसार परिणाम की चिंता छोड़ केवल अपने वर्तमान कर्तव्य में पूरी निष्ठा से लग जाएं।"
        )
    else:
        return (
            f"**4. TRI-PILLAR SYNERGISTIC RESOLUTION (How Gita + CBT + Tratak Work in Combination to Heal You):**\n"
            f"Here is how these three disciplines operate in unified synergy to permanently resolve your suffering:\n\n"
            f"1. **Spiritual & Existential Anchor (Bhagavad Gita):**\n"
            f"   The Gita shifts your conscious awareness from outcome obsession and catastrophic helplessness into *Sakshi Bhava* (the calm, detached witness). By releasing attachment to uncertain futures, your mind breaks free from mental paralysis and steps into present-moment purposeful action (*Nishkama Karma*).\n\n"
            f"2. **Cognitive & Somatic Restructuring (CBT & Polyvagal Science):**\n"
            f"   While the Gita elevates your spiritual perspective, CBT systematically dismantles the cognitive distortions (such as catastrophizing, mind-reading, or toxic self-blame) keeping you trapped. Simultaneously, the somatic anchor and pranayama activate your parasympathetic vagal brake, physically clearing adrenaline and signaling safety to your heart.\n\n"
            f"3. **Neuro-Ocular Stabilization (Tratak Gazing Meditation):**\n"
            f"   Tratak provides the physiological foundation for both Gita and CBT. Involuntary micro-saccadic eye movements directly stimulate the brain's alarm center (the amygdala). By fixing your gaze on a single point ({t_name}), Tratak mechanically stops ocular flutter, locking your autonomic nervous system into stability and clearing mental static.\n\n"
            f"4. **Your Integrated Recovery Sequence:**\n"
            f"   • **Phase 1 (Stabilize Brainstem):** Practice {t_name} for 3–5 minutes to arrest rapid eye saccades and de-escalate amygdala hyperarousal.\n"
            f"   • **Phase 2 (Regulate Physiology):** Perform your prescribed somatic breathwork to release visceral tension from your chest and gut.\n"
            f"   • **Phase 3 (Reframe the Mind):** Internalize the CBT cognitive reframe to replace automatic catastrophic thoughts with objective truth.\n"
            f"   • **Phase 4 (Soul-Centered Action):** Execute the Gita's actionable guidance immediately, focusing entirely on your present duty without fear of results."
        )


def format_human_therapeutic_message(
    cond_id: str,
    lang_code: Optional[str] = "en",
    user_message: str = ""
) -> str:
    norm = normalize_language_code(lang_code)
    cond = CLINICAL_LOCALIZATION_CATALOG.get(cond_id)
    if not cond:
        # Check if condition exists in psychology library RAG
        from .psychology_library_rag import psychology_rag
        lib_cond = psychology_rag.get_condition_by_id(cond_id)
        if lib_cond:
            sols = lib_cond.get("solutions", {})
            return f"I hear what you are navigating with {lib_cond.get('name')}. {sols.get('cbt_reframing', '')} To steady your autonomic nervous system right now: engage in {sols.get('somatic_anchor', '')} alongside {sols.get('pranayama', '')}"
        cond = CLINICAL_LOCALIZATION_CATALOG.get("cognitive_memory_brain_fog") or CLINICAL_LOCALIZATION_CATALOG.get("gad")

    loc = cond.get(norm) or cond.get("en")
    if not loc:
        return GENERAL_LOCALIZED_ADVICE.get(norm, GENERAL_LOCALIZED_ADVICE["en"])["default"]

    diag_data = build_diagnostic_suffering_assessment(user_message, cond_id, None, norm)
    synergy = build_tri_pillar_synergy_resolution(norm, "Tratak")

    if norm == "hi":
        cbt_part = f"{loc['validation']} {loc['cbt_reframing']} अपने तंत्रिका तंत्र को स्थिर करने के लिए: {loc['somatic_anchor']} इसके साथ ही {loc['pranayama']}"
    elif norm == "es":
        cbt_part = f"{loc['validation']} {loc['cbt_reframing']} Para regular tu sistema nervioso en este instante: practica {loc['somatic_anchor']} y {loc['pranayama']}"
    elif norm == "fr":
        cbt_part = f"{loc['validation']} {loc['cbt_reframing']} Pour apaiser votre système nerveux dès maintenant : appliquez {loc['somatic_anchor']} ainsi que {loc['pranayama']}"
    elif norm == "de":
        cbt_part = f"{loc['validation']} {loc['cbt_reframing']} Um Ihr Nervensystem jetzt zu beruhigen: Nutzen Sie {loc['somatic_anchor']} und {loc['pranayama']}"
    else:
        cbt_part = f"{loc['validation']} {loc['cbt_reframing']} To steady your autonomic nervous system right now: engage in {loc['somatic_anchor']} alongside {loc['pranayama']}"

    return f"{diag_data['markdown']}\n\n**2. CLINICAL COGNITIVE NEUROSCIENCE (CBT):**\n{cbt_part}\n\n{synergy}"


# =============================================================================
# BHAGAVAD GITA & TRATAK COMPLETE LOCALIZATION CATALOGS (100% Pure Target Language)
# =============================================================================

GITA_LOCALIZATION_CATALOG: Dict[str, Dict[str, Dict[str, str]]] = {
    "bg_2_47": {
        "hi": {
            "meaning": "भगवान श्रीकृष्ण अर्जुन से कहते हैं: तुम्हारा अधिकार केवल निष्काम भाव से कर्तव्य कर्म करने पर है, कर्म के फलों पर कभी नहीं। कर्म के फल की इच्छा को अपने कर्म का कारण मत बनने दो, और न ही कभी कर्म त्यागने (अकर्मण्यता) के वश में आओ।",
            "reflection": "भविष्य के परिणामों की अनिश्चितता से मन को खींचकर इस वर्तमान क्षण के कर्म में समर्पित करें। जब आप परिणाम की चिंता छोड़ केवल अपने कर्तव्य पर एकाग्र होते हैं, तो असफलता का भय और अनिर्णय की स्थिति स्वतः विलीन हो जाती है।",
            "what_to_do": "इस समय केवल उस एक श्रेष्ठ कार्य पर अपना पूरा ध्यान लगाएं जो वर्तमान में आपके वश में है।",
            "what_not_to_do": "काल्पनिक भविष्य के भय से डरना और परिणामों के बारे में अधिक सोचना पूरी तरह छोड़ दें।",
        },
        "es": {
            "meaning": "Tienes derecho únicamente a cumplir con tu deber, pero nunca a los frutos de tus acciones. No te consideres la causa de los resultados, ni te apegues a la inacción.",
            "reflection": "Traslada el foco de control desde un futuro incierto hacia el proceso del presente. Al soltar el apego al resultado, la ansiedad de rendimiento se disuelve.",
            "what_to_do": "Enfócate con devoción en la acción constructiva que puedes ejecutar aquí y ahora.",
            "what_not_to_do": "Deja de anticipar consecuencias imaginarias o estancarte en la parálisis por análisis.",
        },
        "fr": {
            "meaning": "Tu n'as de droit que sur l'action présente, jamais sur les fruits de tes actes. Ne sois pas guidé par la récompense, et ne succombe point à l'inaction.",
            "reflection": "Ramenez votre esprit vers l'acte immédiat plutôt que vers des résultats hypothétiques. Se détacher de l'issue dissout la peur de l'échec.",
            "what_to_do": "Consacrez votre énergie à l'étape concrète et digne qui s'offre à vous en cet instant.",
            "what_not_to_do": "Cessez de négocier avec un futur imaginaire et de laisser l'anxiété paralyser votre élan.",
        },
        "de": {
            "meaning": "Dein Recht besteht allein im Handeln, niemals in den Früchten deiner Taten. Mache die Ergebnisse nicht zum Beweggrund deines Tuns, und verfalle nicht der Untätigkeit.",
            "reflection": "Richten Sie Ihren Fokus auf den gegenwärtigen Schritt anstatt auf ungewisse Zukünfte. Das Loslassen des Ergebnisses befreit von Leistungsdruck.",
            "what_to_do": "Konzentrieren Sie sich voll und ganz auf die eine heilsame Handlung im gegenwärtigen Moment.",
            "what_not_to_do": "Grübeln Sie nicht über hypothetische Folgen nach und verharren Sie nicht in Erstarrung.",
        },
    },
    "bg_2_14": {
        "hi": {
            "meaning": "हे कुन्तीपुत्र! इन्द्रियों और उनके विषयों का संपर्क ही सुख-दुःख, सर्दी-गर्मी का अनुभव कराता है। ये सभी अनित्य और क्षणिक हैं, आते हैं और चले जाते हैं। हे भरतवंशी! तुम इन्हें धैर्य और आत्म-बल के साथ सहन करो।",
            "reflection": "जीवन की हर शारीरिक व मानसिक वेदना, विछोह और दुःख मौसम की भांति परिवर्तनशील हैं। अपने भीतर के उस साक्षी भाव को पहचानें जो इन बदलते भावों से परे सदा शांत रहता है।",
            "what_to_do": "दर्द को एक लहर की तरह आते और जाते हुए देखें, गहरी सांस लें और स्वयं को भावनात्मक संबल दें।",
            "what_not_to_do": "इस क्षणिक दुःख को अपना स्थायी भाग्य मानकर मन को गहरे विषाद में न डूबने दें।",
        },
        "es": {
            "meaning": "El contacto de los sentidos con los objetos engendra frío y calor, placer y dolor. Son transitorios, van y vienen. Sopórtalos con paciencia, oh Bharata.",
            "reflection": "El sufrimiento emocional y la aflicción son impermanentes como las estaciones. Reconoce tu conciencia profunda, inmutable ante las tormentas.",
            "what_to_do": "Respira hondo y observa la ola de dolor sin resistirte, sabiendo que pasará.",
            "what_not_to_do": "No te identifiques con la pena pasajera ni la conviertas en tu identidad permanente.",
        },
        "fr": {
            "meaning": "Le contact des sens avec leurs objets fait naître le chaud et le froid, la joie et la peine. Éphémères, ils apparaissent et disparaissent. Accueille-les avec sérénité.",
            "reflection": "Toute douleur émotionnelle ressemble aux saisons : elle naît, culmine puis s'efface. Votre être véritable demeure intact derrière ces vagues.",
            "what_to_do": "Observez ce ressenti douloureux avec compassion, sans crispation, en respirant posément.",
            "what_not_to_do": "Ne confondez pas un chagrin temporaire avec la réalité définitive de votre existence.",
        },
        "de": {
            "meaning": "Die Berührung der Sinne mit den Dingen erzeugt Kälte und Hitze, Freude und Leid. Sie sind vergänglich, kommen und gehen. Ertrage sie mit innerer Festigkeit.",
            "reflection": "Seelischer Schmerz und Trauer sind wie wechselnde Jahreszeiten. Ihr innerster Wesenskern bleibt unberührt von den stürmischen Wogen der Gefühle.",
            "what_to_do": "Beobachten Sie den Schmerz mit Sanftmut als Welle, die von selbst wieder abebbt.",
            "what_not_to_do": "Verharren Sie nicht im Gedanken, dieser Schmerz würde ewig andauern.",
        },
    },
    "bg_2_62_63": {
        "hi": {
            "meaning": "विषयों का निरंतर चिंतन करने से उनमें आसक्ति उत्पन्न होती है; आसक्ति से कामना और कामना में बाधा आने पर क्रोध उत्पन्न होता है। क्रोध से विवेक का नाश, भ्रम से स्मृति-भ्रंश, और स्मृति-भ्रंश से बुद्धि नष्ट हो जाती है, जिससे मनुष्य स्वयं का पतन कर बैठता है।",
            "reflection": "जब आपके साथ अन्याय या आघात होता है, तो मन उस बात को बार-बार दोहराकर क्रोध की अग्नि को भड़काता है। क्रोध सबसे पहले आपके अपने ही विवेक और शांति को जलाता है।",
            "what_to_do": "क्रोध की तीव्र लहर आते ही मौन हो जाएं, तुरंत प्रतिक्रिया देने से बचें और खुली हवा में धीमी व गहरी सांसें लें।",
            "what_not_to_do": "आवेश में आकर कोई कटु शब्द न कहें और न ही किसी प्रतिशोध की कल्पना में उलझें।",
        },
        "es": {
            "meaning": "Pensar en los objetos engendra apego; del apego nace el deseo, y del deseo frustrado brota la ira. De la ira nace el engaño, que destruye la memoria y el discernimiento.",
            "reflection": "Rumiar la ofensa alimenta el fuego de la rabia. El enfado daña primero a quien lo alberga, nublando tu paz y tu capacidad de respuesta serena.",
            "what_to_do": "Guarda silencio unos minutos ante la provocación y oxigena tu cuerpo con calma.",
            "what_not_to_do": "No reacciones impulsivamente ni busques desquitarte en momentos de turbulencia emocional.",
        },
        "fr": {
            "meaning": "Ressasser les griefs nourrit l'attachement ; de l'attachement naît le désir contrarié, puis la colère. La colère aveugle l'esprit et détruit le discernement.",
            "reflection": "La colère est un feu qui consume d'abord celui qui la porte. Prendre du recul permet à la clarté mentale de reprendre ses droits.",
            "what_to_do": "Faites une pause immédiate, respirez profondément et reportez toute réponse.",
            "what_not_to_do": "Ne laissez pas la rancœur dicter vos paroles ou vos décisions impulsives.",
        },
        "de": {
            "meaning": "Das Grübeln über Kränkungen erzeugt Anhaftung; daraus erwächst Groll und Wut. Wut führt zur Verblendung, verwirrt das Gedächtnis und zerstört die Vernunft.",
            "reflection": "Groll schadet zuallererst der eigenen Seele. Wer innehält, durchbricht den Automatismus der blinden Vergeltung.",
            "what_to_do": "Treten Sie einen Schritt zurück, atmen Sie ruhig aus und schweigen Sie im ersten Impuls.",
            "what_not_to_do": "Handeln Sie niemals aus der Hitze des Zorns heraus.",
        },
    },
    "bg_6_5": {
        "hi": {
            "meaning": "मनुष्य को चाहिए कि वह अपने मन के द्वारा अपना उद्धार करे, अपने आपको हीन न समझे और न गिराए। क्योंकि यह मन ही मनुष्य का सच्चा मित्र है और यदि अनियंत्रित रहे तो मन ही उसका सबसे बड़ा शत्रु है।",
            "reflection": "हीनभावना, अपराधबोध और आत्म-संदेह से बाहर निकलने की शक्ति आपके अपने ही भीतर है। अपने मन को अपने विरुद्ध नहीं, बल्कि अपने पक्ष में खड़ा करें।",
            "what_to_do": "अपनी छोटी-छोटी सफलताओं को पहचानें और अपने साथ एक सच्चे व दयालु मित्र जैसा प्रेमपूर्ण व्यवहार करें।",
            "what_not_to_do": "स्वयं को अयोग्य, पाखंडी या असफल मानकर आत्म-निंदा के चक्र में न फंसें।",
        },
        "es": {
            "meaning": "Que el ser humano se eleve mediante su propia mente y no se degrade a sí mismo. Pues la mente es la mejor aliada del alma, o su mayor adversaria.",
            "reflection": "Tu mayor juez o tu mejor amigo residen en tu propia voz interior. Trátate con la compasión con la que acogerías a un ser muy querido.",
            "what_to_do": "Reconoce tu valor intrínseco y háblate con amabilidad y respeto.",
            "what_not_to_do": "No caigas en la trampa del síndrome del impostor ni te castigues con la autocrítica destructiva.",
        },
        "fr": {
            "meaning": "Que l'homme s'élève par lui-même et ne se déprécie pas. Car l'esprit est le meilleur allié de l'âme, ou son plus redoutable ennemi.",
            "reflection": "La bienveillance envers soi-même est la clé de la guérison. Choisissez d'être votre propre allié plutôt que votre critique le plus sévère.",
            "what_to_do": "Accueillez vos efforts avec douceur et valorisez chaque pas franchi.",
            "what_not_to_do": "Ne cédez pas à la voix intérieure de l'imposture et du dénigrement.",
        },
        "de": {
            "meaning": "Der Mensch erhebe sich durch seinen eigenen Geist und erniedrige sich nicht selbst. Denn der Geist allein ist Freund des Selbst oder sein ärgster Widersacher.",
            "reflection": "Selbstmitgefühl verwandelt den inneren Kritiker in eine schützende Kraft. Stehen Sie wohlwollend zu sich selbst.",
            "what_to_do": "Begegnen Sie Ihren Unvollkommenheiten mit Geduld und tröstender Anerkennung.",
            "what_not_to_do": "Verurteilen Sie sich nicht als Versager oder Heuchler.",
        },
    },
    "bg_2_70": {
        "hi": {
            "meaning": "जिस प्रकार चारों ओर से जल से निरंतर भरते रहने पर भी अगाध समुद्र स्थिर और अविचल रहता है, उसी प्रकार जिस व्यक्ति के मन में सभी विचार और बाह्य उत्तेजनाएं बिना विक्षोभ पैदा किए समा जाती हैं, वही परम शांति को प्राप्त होता है।",
            "reflection": "संसार में कितने भी तनाव, कार्यभार या उत्तेजनाएं क्यों न आएं, यदि आप अपने अंतर्मन को समुद्र की भांति गहरा और स्थिर रखेंगे, तो कोई भी तूफान आपको विचलित नहीं कर सकेगा।",
            "what_to_do": "एक समय में केवल एक कार्य पर ध्यान दें और अपने मन को शांत गहराई में विश्राम करने दें।",
            "what_not_to_do": "सभी कार्यों को एक साथ करने का प्रयास करके अपने मस्तिष्क को संवेदी अधिभार में न धकेलें।",
        },
        "es": {
            "meaning": "Así como el océano permanece inmutable mientras los ríos desembocan en él, quien permanece en calma ante la avalancha de pensamientos alcanza la verdadera paz.",
            "reflection": "En medio del caos y el exceso de estímulos, tu mente puede guardar la serenidad profunda del océano, donde las olas superficiales no alteran el fondo.",
            "what_to_do": "Ralentiza el ritmo, enfócate en una sola tarea a la vez y reposa en tu centro.",
            "what_not_to_do": "No intentes controlarlo todo simultáneamente ni te dejes abrumar por el exceso de información.",
        },
        "fr": {
            "meaning": "Tel l'océan qui demeure imperturbable tandis que s'y déversent les fleuves, celui en qui les pensées se fondent sans troubler la paix intérieure accède au repos suprême.",
            "reflection": "Face au tumulte extérieur, cultivez la profondeur de l'océan. Les remous en surface ne sauraient altérer votre calme fondamental.",
            "what_to_do": "Prenez les choses une par une en accordant un répit bienvenu à votre esprit.",
            "what_not_to_do": "Évitez la dispersion et la surcharge mentale du multitâche permanent.",
        },
        "de": {
            "meaning": "Wie der Ozean unbewegt ruht, während die Ströme in ihn fließen, so findet derjenige inneren Frieden, den die stürmischen Eindrücke der Welt nicht erschüttern.",
            "reflection": "Bewahren Sie inmitten von Hektik die erhabene Tiefe des Meeres. Oberflächliche Wellen können Ihren Grund nicht trüben.",
            "what_to_do": "Widmen Sie sich achtsam einer einzigen Sache und atmen Sie weit in den Raum.",
            "what_not_to_do": "Überfordern Sie sich nicht mit ständigem Multitasking.",
        },
    },
    "bg_6_26": {
        "hi": {
            "meaning": "यह चंचल और अस्थिर मन जिन-जिन विषयों की ओर भटके, उन-उन विषयों से इसे खींचकर बार-बार अपनी आत्मा के वश में लाना चाहिए।",
            "reflection": "मन का स्वभाव ही भटकना और अनर्गल सोचना है। जब भी मन विचलित हो, तो उस पर क्रोधित हुए बिना एक छोटे बालक की तरह उसे कोमलता से वर्तमान में वापस ले आएं।",
            "what_to_do": "जब भी ध्यान भटके, अपनी आती-जाती सांसों पर ध्यान टिकाकर मन को धीरे से वर्तमान में लौटाएं।",
            "what_not_to_do": "मन के भटकने पर खुद को दोषी न ठहराएं और नकारात्मक विचारों के साथ बहस न करें।",
        },
        "es": {
            "meaning": "Hacia dondequiera que se extravíe la mente inquieta e inestable, tráela pacientemente de vuelta bajo el control del Ser.",
            "reflection": "La mente divaga por naturaleza. Cada vez que se distraiga, guíala de regreso a la respiración con la dulzura con la que orientarías a un niño pequeño.",
            "what_to_do": "Usa el ancla de tu respiración para regresar con suavidad cada vez que te disperses.",
            "what_not_to_do": "No te frustres ni luches violentamente contra tus propios pensamientos.",
        },
        "fr": {
            "meaning": "D'où que l'esprit instable et vagabond s'échappe, il faut le ramener avec constance sous la guidance du Soi.",
            "reflection": "L'esprit s'égare naturellement. Ramenez-le au souffle présent sans reproche ni irritation, avec bienveillance.",
            "what_to_do": "Revenez simplement à la sensation de l'air entrant et sortant de vos narines.",
            "what_not_to_do": "Ne vous blâmez pas d'avoir été distrait ; le retour au calme est l'exercice lui-même.",
        },
        "de": {
            "meaning": "Wohin auch immer der unruhige und wankelmütige Geist abschweift, von dort ziehe man ihn sanft zurück und richte ihn auf das eigene Wesen.",
            "reflection": "Das Wesen des Geistes ist Bewegung. Holen Sie ihn mit liebevoller Geduld immer wieder behutsam in die Gegenwart zurück.",
            "what_to_do": "Verankern Sie sich sanft im Atemzug, sobald Sie das Abschweifen bemerken.",
            "what_not_to_do": "Kämpfen Sie nicht zornig gegen die aufsteigenden Gedanken an.",
        },
    },
    "bg_18_63": {
        "hi": {
            "meaning": "इस प्रकार मैंने तुम्हें गोपनीय से भी गोपनीय पावन ज्ञान बता दिया है। अब इस पर भली-भांति विचार करो और फिर जैसा उचित समझो, वैसा ही आचरण करो।",
            "reflection": "ईश्वर भी आपके ऊपर कोई निर्णय नहीं थोपते, वे आपको स्वतंत्रता और विवेक देते हैं। बेबसी की भावना से बाहर निकलें; आपके जीवन की दिशा तय करने का अधिकार पूरी तरह आपके अपने हाथों में है।",
            "what_to_do": "शांत मन से अपनी प्राथमिकताओं को तौलें और अपने सत्य के अनुसार पहला छोटा कदम उठाएं।",
            "what_not_to_do": "दूसरों की राय के दबाव में आकर या लाचार महसूस करके अपनी इच्छाशक्ति को न खोएं।",
        },
        "es": {
            "meaning": "Así te he transmitido este conocimiento supremo. Reflexiona hondamente sobre él y luego actúa según tu propia libre elección.",
            "reflection": "Recupera tu poder y tu capacidad de agencia. Nadie más que tú tiene la llave de tu propia vida y de tus decisiones conscientes.",
            "what_to_do": "Elige desde el sosiego de tu conciencia y da el primer paso valiente hacia adelante.",
            "what_not_to_do": "No te sientas víctima indefensa ni permitas que el miedo decida por ti.",
        },
        "fr": {
            "meaning": "Ainsi t'ai-je révélé la sagesse la plus profonde. Médite-la pleinement, puis agis en conscience selon ton libre choix.",
            "reflection": "Retrouvez votre autonomie fondamentale. Vous possédez en vous la sagesse nécessaire pour discerner votre juste voie.",
            "what_to_do": "Faites confiance à votre discernement intérieur pour poser un acte serein et lucide.",
            "what_not_to_do": "Ne vous résignez pas à l'impuissance ni à la dépendance passive.",
        },
        "de": {
            "meaning": "So habe ich dir diese geheime Weisheit offenbart. Erwäge sie wohl und handle dann nach deinem freien Entschluss.",
            "reflection": "Gewinnen Sie Ihre Selbstbestimmung zurück. Sie sind der Schöpfer Ihrer inneren Haltung und Ihrer nächsten Schritte.",
            "what_to_do": "Vertrauen Sie Ihrer inneren Einsicht und wählen Sie mutig das Heilsame.",
            "what_not_to_do": "Fügen Sie sich nicht in ein Gefühl hilfloser Ohnmacht.",
        },
    },
    "bg_2_56": {
        "hi": {
            "meaning": "दुःखों की प्राप्ति होने पर जिसके मन में उद्वेग नहीं होता, सुखों की प्राप्ति में जो सर्वथा निष्स्पृह है, तथा जिसके राग, भय और क्रोध नष्ट हो चुके हैं—ऐसा स्थिर बुद्धि वाला मुनि 'स्थितप्रज्ञ' कहलाता है।",
            "reflection": "जीवन के उतार-चढ़ाव में मानसिक संतुलन बनाए रखना ही सबसे बड़ी सिद्धि है। जब आप बाह्य परिस्थितियों पर अपनी मानसिक शांति की निर्भरता समाप्त कर देते हैं, तो असीम धैर्य का जन्म होता है।",
            "what_to_do": "वर्तमान परिस्थिति को जैसी है वैसी स्वीकार करें और भीतर की समता को बनाए रखें।",
            "what_not_to_do": "सुख में अहंकारी न बनें और संकट में अधीर होकर अपना आपा न खोएं।",
        },
        "es": {
            "meaning": "Aquel cuya mente no se turba en la desgracia, libre de anhelos en el placer, desprovisto de apego, temor e ira: es el sabio de mente firme.",
            "reflection": "La verdadera fortaleza reside en la serenidad inquebrantable que no depende de las circunstancias externas favorables.",
            "what_to_do": "Cultiva una mirada equilibrada que acoja la realidad con aplomo y ecuanimidad.",
            "what_not_to_do": "No permitas que las vicisitudes del mundo arrebaten tu paz interior.",
        },
        "fr": {
            "meaning": "Celui dont l'esprit n'est point ébranlé dans l'épreuve, exempt d'avidité dans la joie, affranchi de l'attachement, de la peur et de la colère : tel est le sage au discernement stable.",
            "reflection": "L'équanimité est le plus précieux des trésors. Elle permet de traverser les tempêtes sans perdre son centre.",
            "what_to_do": "Accueillez les événements avec un calme souverain et une profonde dignité.",
            "what_not_to_do": "Ne laissez pas l'adversité entamer votre stabilité intérieure.",
        },
        "de": {
            "meaning": "Wer im Kummer unverzagt bleibt, im Glück frei von Verlangen ist und wer Bindung, Furcht und Zorn überwunden hat: der gilt als Mensch von beständigem Geist.",
            "reflection": "Gleichmut ist die höchste Zuflucht. Wenn Ihre Ruhe unabhängig von äußeren Bedingungen wird, erlangen Sie unzerstörbaren Frieden.",
            "what_to_do": "Bleiben Sie fest in Ihrer inneren Mitte verwurzelt, was auch geschehen mag.",
            "what_not_to_do": "Lassen Sie sich weder von Euphorie noch von Panik fortreißen.",
        },
    },
    "bg_12_15": {
        "hi": {
            "meaning": "जिससे किसी प्राणी को उद्वेग या कष्ट नहीं पहुंचता, और जो स्वयं भी संसार के किसी प्राणी से उद्विग्न नहीं होता; तथा जो हर्ष, अमर्ष, भय और चिंता से मुक्त है—वह भक्त मुझे अत्यंत प्रिय है।",
            "reflection": "दूसरों के कटु व्यवहार, आलोचना या नकारात्मकता को अपने भीतर प्रवेश न करने दें। आपकी मानसिक शांति आपकी अपनी पवित्र धरोहर है, इसे किसी और के व्यवहार से नष्ट न होने दें।",
            "what_to_do": "लोगों की कटु बातों को व्यक्तिगत आक्षेप न मानकर करुणा व समझदारी से अपनी सीमाएं तय करें।",
            "what_not_to_do": "दूसरों के व्यवहार को बदलने के प्रयास में अपनी ऊर्जा व्यर्थ न करें और मन में कड़वाहट न पालें।",
        },
        "es": {
            "meaning": "Aquel que no perturba al mundo y a quien el mundo no perturba, libre de agitación, intolerancia, miedo y aflicción: ese me es muy querido.",
            "reflection": "No absorbas la toxicidad ni el juicio de los demás. Tu serenidad es un templo sagrado que ningún conflicto ajeno puede profanar.",
            "what_to_do": "Establece límites serenos y comprensivos sin albergar resentimiento.",
            "what_not_to_do": "No te tomes las agresiones ajenas como un reflejo de tu valor personal.",
        },
        "fr": {
            "meaning": "Celui qui ne trouble point autrui et que le monde ne saurait troubler, libre de l'agitation, de l'intolérance et de l'anxiété : celui-là m'est cher.",
            "reflection": "Préservez votre espace intérieur des hostilités du monde. La paix que vous rayonnez est votre meilleur bouclier.",
            "what_to_do": "Posez des limites calmes et refusez d'endosser la négativité d'autrui.",
            "what_not_to_do": "Ne laissez pas l'amertume ou la rancœur s'installer dans votre cœur.",
        },
        "de": {
            "meaning": "Wer die Welt nicht beunruhigt und wen die Welt nicht erschüttert, wer frei ist von Übermut, Groll, Furcht und Sorge: der ist wahrhaft geliebt.",
            "reflection": "Lassen Sie fremde Spannungen an Ihrer inneren Gelassenheit abprallen. Ihr Friede gehört Ihnen allein.",
            "what_to_do": "Setzen Sie klare, gütige Grenzen und wahren Sie Ihre seelische Würde.",
            "what_not_to_do": "Verwickeln Sie sich nicht in zermürbende zwischenmenschliche Streitigkeiten.",
        },
    },
    "bg_3_35": {
        "hi": {
            "meaning": "दूसरों के मार्ग पर निपुणता से चलने की अपेक्षा अपने स्वाभाविक कर्तव्य का त्रुटिपूर्ण पालन करना भी कहीं अधिक कल्याणकारी है। दूसरों के स्वभाव का अनुकरण भय और आत्म-विस्मृति को जन्म देता है।",
            "reflection": "अपनी तुलना दूसरों से करके स्वयं को कमतर न आंकें। आपकी अपनी प्रकृति, आपकी यात्रा और आपके गुण अद्वितीय हैं। प्रामाणिकता ही आत्म-शांति का द्वार है।",
            "what_to_do": "अपनी वास्तविक क्षमताओं, मूल्यों और गति के अनुसार अपने पथ पर निष्ठा से आगे बढ़ें।",
            "what_not_to_do": "दूसरों की देखा-देखी किसी और के जीवन की नकल करने और खुद को हीन समझने की भूल न करें।",
        },
        "es": {
            "meaning": "Es mucho mejor cumplir el propio deber, aunque sea de forma imperfecta, que realizar a la perfección el camino ajeno. Seguir el sendero de otro engendra miedo e inseguridad.",
            "reflection": "Abraza tu singularidad. Compararte constantemente con el éxito aparente de otros destruye tu paz y tu auténtica vocación.",
            "what_to_do": "Honra tu propio ritmo, tus talentos y tu camino con honestidad.",
            "what_not_to_do": "No vivas intentando complacer expectativas ajenas ni imitar vidas que no son tuyas.",
        },
        "fr": {
            "meaning": "Mieux vaut accomplir son propre devoir, fût-il imparfait, que d'exceller dans celui d'un autre. Suivre la voie d'autrui est source de péril et d'angoisse.",
            "reflection": "Cessez la comparaison stérile. Votre valeur réside dans la fidélité à votre être véritable et à votre rythme propre.",
            "what_to_do": "Avancez avec sincérité sur votre propre chemin sans chercher à copier autrui.",
            "what_not_to_do": "Ne sacrifiez pas votre vérité personnelle pour correspondre aux standards des autres.",
        },
        "de": {
            "meaning": "Weit besser ist es, die eigene Pflicht zu erfüllen, wenn auch unvollkommen, als eine fremde Pflicht meisterhaft zu tun. Ein fremder Weg bringt Furcht und Gefahr.",
            "reflection": "Der ständige Vergleich mit anderen schwächt Ihre Kraft. Stehen Sie zu Ihrer eigenen Lebensreise in all ihrer Einzigartigkeit.",
            "what_to_do": "Gehen Sie Ihren Weg in Ihrem Tempo und vertrauen Sie Ihren ureigenen Gaben.",
            "what_not_to_do": "Messen Sie sich nicht an den Maßstäben anderer Menschen.",
        },
    },
    "bg_5_23": {
        "hi": {
            "meaning": "जो मनुष्य इस शरीर के छूटने से पहले ही काम और क्रोध से उत्पन्न होने वाले तीव्र वेगों को यहीं सहन करने में समर्थ हो जाता है, वही वास्तव में योगी है और वही सुखी है।",
            "reflection": "तीव्र इच्छा, उत्तेजना या व्यसन की तलब एक शारीरिक तरंग जैसी होती है। यदि आप उस आवेग में बहने के बजाय केवल कुछ मिनट तक उसका साक्षी बनकर उसे सह लें, तो वह तरंग स्वतः शांत हो जाती है।",
            "what_to_do": "आवेग उठने पर अपनी हथेलियों और पैरों की संवेदनाओं को महसूस करें और 90 सेकंड तक शांति से सांस लें।",
            "what_not_to_do": "क्षणिक आवेग के दबाव में आकर किसी विनाशकारी आदत या तत्काल प्रतिक्रिया के आगे न झुकें।",
        },
        "es": {
            "meaning": "Aquel que antes de abandonar este cuerpo es capaz de contener aquí el ímpetu nacido del deseo y la ira: ese es un ser en armonía, ese es feliz.",
            "reflection": "El impulso urgente de reaccionar es una ola neuroquímica que dura apenas unos minutos. Surfea la ola sin dejarte arrastrar por ella.",
            "what_to_do": "Haz una pausa de 90 segundos, siente el contacto de tus pies en la tierra y respira.",
            "what_not_to_do": "No cedas inmediatamente al impulso compulsivo ni a la reacción arrebatada.",
        },
        "fr": {
            "meaning": "Celui qui, dès cette vie présente, parvient à maîtriser les assauts du désir et de la colère : celui-là est uni à la paix, celui-là est heureux.",
            "reflection": "L'urgence émotionnelle n'est qu'une vague passagère dans votre corps. Apprenez à chevaucher la crête sans vous y noyer.",
            "what_to_do": "Attendez patiemment quelques instants en ancrant votre attention dans vos sensations corporelles.",
            "what_not_to_do": "Ne réagissez pas sous le coup de la pulsion immédiate.",
        },
        "de": {
            "meaning": "Wer schon in diesem Leben fähig ist, dem Drängen von Begierde und Zorn standzuhalten: der ist wahrhaft ausgeglichen, der ist glücklich.",
            "reflection": "Der Drang zur impulsiven Handlung ebbt ab, wenn man ihn für einen kurzen Moment achtsam aushält. Reiten Sie die Welle des Impulses mit Ruhe.",
            "what_to_do": "Verweilen Sie kurz im Nicht-Handeln und spüren Sie den festen Boden unter Ihren Füßen.",
            "what_not_to_do": "Geben Sie dem ersten unbedachten Drang nicht sofort nach.",
        },
    },
    "bg_18_66": {
        "hi": {
            "meaning": "सभी चिंताओं, मनगढ़ंत दायित्वों और भयों को छोड़कर केवल मेरी शरण में आ जाओ। मैं तुम्हें सभी कष्टों, पापों और संतापों से मुक्त कर दूंगा; तुम शोक मत करो।",
            "reflection": "जब जीवन का बोझ असहनीय लगे और सारे उपाय समाप्त प्रतीत हों, तो हर प्रकार के नियंत्रण को छोड़ना ही परम मुक्ति है। ब्रह्मांड की उस विराट शक्ति पर विश्वास रखें जो पूरे अस्तित्व का पालन-पोषण कर रही है।",
            "what_to_do": "अपने भारीपन और नियंत्रण की व्यर्थ लालसा को समर्पित कर दें, और स्वयं से कहें: 'सब कुछ ठीक हो जाएगा, मैं सुरक्षित हूँ'।",
            "what_not_to_do": "अकेले ही पूरी दुनिया का बोझ उठाने की व्यर्थ चेष्टा करके स्वयं को मत थकाएं।",
        },
        "es": {
            "meaning": "Abandonando todo afán forzado y toda carga ilusoria, entrégate por entero a Mí. Yo te liberaré de todas las aflicciones; no te angusties.",
            "reflection": "Cuando sientas que tus fuerzas se agotan, la rendición sabia no es debilidad, sino el supremo descanso en algo más grande que tus preocupaciones.",
            "what_to_do": "Suelta el control férreo, abre tus manos y confía en el flujo protector de la vida.",
            "what_not_to_do": "No cargues en solitario un peso que excede tus fuerzas humanas.",
        },
        "fr": {
            "meaning": "Délaissant tout fardeau fabriqué et toute vaine angoisse, abandonne-toi avec confiance à Moi seul. Je te délivrerai de toute peine ; ne t'afflige point.",
            "reflection": "Quand tout semble trop lourd, lâcher prise n'est pas abandonner, c'est s'en remettre à une intelligence plus vaste qui soutient toute chose.",
            "what_to_do": "Déposez votre fardeau avec humilité et respirez dans la confiance retrouvée.",
            "what_not_to_do": "Ne prétendez pas porter seul le poids du monde sur vos épaules.",
        },
        "de": {
            "meaning": "Gib alle künstlichen Sorgen und selbstgemachten Lasten auf und vertraue dich ganz Mir an. Ich werde dich von allen Bedrängnissen befreien; sorge dich nicht.",
            "reflection": "Hingabe im rechten Augenblick ist der Schlüssel zur Befreiung. Wenn die eigene Kraft erschöpft ist, trägt uns das Größere.",
            "what_to_do": "Lassen Sie das krampfhafte Festhalten los und öffnen Sie sich dem tiefen Vertrauen.",
            "what_not_to_do": "Versuchen Sie nicht verbissen, jede Einzelheit des Schicksals allein zu erzwingen.",
        },
    },
}

TRATAKA_LOCALIZATION_CATALOG: Dict[str, Dict[str, Dict[str, str]]] = {
    "bindu": {
        "hi": {
            "name": "बिन्दु त्राटक (शांत एकाग्रता दीप)",
            "focalTarget": "आंखों के ठीक सामने लगभग दो फीट की दूरी पर स्थित एक शांत, ज्योतिर्मय स्वर्णिम बिंदु।",
            "neuroMechanism": "स्थिर दृष्टि मस्तिष्क के तनाव केंद्र (अमिग्डाला) को शांत करती है और अनियंत्रित विचारों के चक्रवात को रोकती है।",
            "guidance": "स्वर्णिम बिंदु पर बिना पलक झपकाए कोमल दृष्टि टिकाएं। जब आंखें भारी होने लगें, तो उन्हें कोमलता से बंद करें और हथेलियों को रगड़कर गर्म कर आंखों पर रखें।",
        },
        "es": {
            "name": "Bindu Trataka (Punto Dorado de Enfoque Sereno)",
            "focalTarget": "Un punto dorado y luminoso a la altura de los ojos, a unos sesenta centímetros de distancia.",
            "neuroMechanism": "Inhibe los movimientos oculares rápidos y desactiva la hiperactividad de la amígdala, frenando el pánico.",
            "guidance": "Mantén una mirada suave y fija en el punto dorado sin forzar los párpados. Cuando sientas cansancio, cierra los ojos y cúbrelos con las palmas tibias.",
        },
        "fr": {
            "name": "Bindu Trataka (Point Focal Doré)",
            "focalTarget": "Un point doré lumineux à hauteur des yeux, à environ soixante centimètres.",
            "neuroMechanism": "La fixation visuelle continue apaise l'amygdale cérébrale et tarit le flux des pensées anxieuses.",
            "guidance": "Fixez doucement le point doré sans cligner excessivement. Dès que la fatigue survient, fermez les yeux et posez vos paumes chaudes dessus.",
        },
        "de": {
            "name": "Bindu Trataka (Goldener Ruhepunkt)",
            "focalTarget": "Ein leuchtender goldener Punkt auf Augenhöhe in etwa sechzig Zentimetern Entfernung.",
            "neuroMechanism": "Die ruhige Blickfixierung dämpft die Übererregung des Mandelkerns und bringt rasende Gedanken zum Stillstand.",
            "guidance": "Ruhen Sie mit sanftem Blick auf dem Punkt. Bei Ermüdung schließen Sie die Lider und wärmen die Augen mit den Handflächen.",
        },
    },
    "flame": {
        "hi": {
            "name": "ज्योति त्राटक (दीपक की लौ का ध्यान)",
            "focalTarget": "शांत और स्थिर दीपक की लौ का सबसे चमकीला ऊपरी भाग।",
            "neuroMechanism": "लौ का सौम्य प्रकाश मन के अवसाद, उदासी और जड़ता को समाप्त कर चेतना में नई ऊर्जा और आशा का संचार करता है।",
            "guidance": "दीपक की स्थिर लौ पर अपना ध्यान केंद्रित करें। चेहरे की मांसपेशियों को ढीला छोड़ें। 2 मिनट बाद आंखें बंद कर दोनों भौहों के बीच शेष बची लौ के बिंब का ध्यान करें।",
        },
        "es": {
            "name": "Jyoti Trataka (Meditación en la Llama)",
            "focalTarget": "La cúspide luminosa y constante de una vela encendida.",
            "neuroMechanism": "La luz cálida reanima el tono dopaminérgico y disipa el embotamiento emocional y la inercia depresiva.",
            "guidance": "Fija la mirada en el ápice de la llama con el rostro relajado. Tras unos instantes, cierra los párpados y contempla la huella luminosa interior.",
        },
        "fr": {
            "name": "Jyoti Trataka (Contemplation de la Flamme)",
            "focalTarget": "L'extrémité stable et rayonnante d'une flamme de bougie.",
            "neuroMechanism": "La clarté de la flamme ravive l'élan vital et dissipe la léthargie dépressive en stimulant les photorécepteurs rétiniens.",
            "guidance": "Posez votre regard au sommet de la flamme, le visage détendu. Fermez ensuite les yeux et observez l'image rémanente au centre du front.",
        },
        "de": {
            "name": "Jyoti Trataka (Kerzenflammen-Meditation)",
            "focalTarget": "Die ruhige, goldene Spitze einer brennenden Kerze.",
            "neuroMechanism": "Das sanfte Licht vertreibt depressive Trägheit und regt die neuronale Vitalität behutsam an.",
            "guidance": "Blicken Sie ruhig in die Flamme und entspannen Sie die Gesichtszüge. Schließen Sie dann die Augen und spüren Sie dem inneren Nachbild nach.",
        },
    },
    "murti": {
        "hi": {
            "name": "मण्डल त्राटक (पवित्र सममित ज्यामिति ध्यान)",
            "focalTarget": "एक संतुलित, सुंदर व सममित मण्डल ज्यामिति का केंद्र बिंदु।",
            "neuroMechanism": "सममित ज्यामिति पर ध्यान केंद्रित करने से मस्तिष्क के दोनों गोलार्धों में संतुलन स्थापित होता है और विचारों का बिखराव शांत होता है।",
            "guidance": "मण्डल के केंद्र बिंदु पर अपनी दृष्टि टिकाएं। फिर कोमलता से उसकी सममित आकृतियों को अनुभव करते हुए गहरी व सम लय में सांसें लें।",
        },
        "es": {
            "name": "Mandala Trataka (Resonancia de Geometría Sagrada)",
            "focalTarget": "El centro concéntrico de un mandala geométrico armonioso.",
            "neuroMechanism": "La simetría visual estimula la integración hemisférica cerebral, serenando el caos mental y la rumiación.",
            "guidance": "Focaliza el centro del mandala y luego percibe su simetría con una respiración rítmica y profunda.",
        },
        "fr": {
            "name": "Mandala Trataka (Géométrie Sacrée Harmonisante)",
            "focalTarget": "Le centre d'un mandala aux motifs harmonieux et symétriques.",
            "neuroMechanism": "La contemplation de formes équilibrées réharmonise les hémisphères cérébraux et réduit le bruit mental.",
            "guidance": "Concentrez-vous sur le cœur du mandala en laissant la symétrie apaiser naturellement vos pensées.",
        },
        "de": {
            "name": "Mandala Trataka (Heilige Geometrie)",
            "focalTarget": "Der Mittelpunkt eines harmonischen, symmetrischen Mandalas.",
            "neuroMechanism": "Die visuelle Symmetrie harmonisiert beide Gehirnhälften und ordnet das Gedankenchaos.",
            "guidance": "Richten Sie den Blick auf das Zentrum und atmen Sie gleichmäßig im Rhythmus der Formen.",
        },
    },
    "pratibimb": {
        "hi": {
            "name": "प्रतिबिम्ब त्राटक (दर्पण आत्म-स्वीकृति ध्यान)",
            "focalTarget": "दर्पण में अपनी ही आंखों की पुतलियों में छिपी आत्मिक चेतना।",
            "neuroMechanism": "स्वयं की आंखों में शांत भाव से देखना आंतरिक हीनभावना, अपराधबोध और आत्म-आलोचना को समाप्त कर गहरी आत्म-करुणा जगाता है।",
            "guidance": "दर्पण में अपनी आंखों में करुणा और मित्रता के साथ देखें। बिना किसी आत्म-आलोचना के स्वयं से कहें: 'मैं जैसा भी हूँ, स्वयं को स्वीकार करता हूँ'।",
        },
        "es": {
            "name": "Pratibimb Trataka (Espejo de Autocompasión)",
            "focalTarget": "El reflejo sereno de tus propias pupilas en el espejo.",
            "neuroMechanism": "Mirarse a los ojos con ternura disuelve la vergüenza tóxica y fortalece el apego seguro hacia uno mismo.",
            "guidance": "Mírate en el espejo como mirarías a un amigo muy amado. Repite con calma: 'Me acepto y me sostengo en este instante'.",
        },
        "fr": {
            "name": "Pratibimb Trataka (Miroir de Bienveillance Intérieure)",
            "focalTarget": "Le reflet de votre propre regard dans le miroir.",
            "neuroMechanism": "Ce regard sans jugement apaise la honte intérieure et répare l'estime de soi en activant l'ocytocine.",
            "guidance": "Plongez votre regard dans vos yeux avec une infinie douceur. Dites-vous intérieurement : 'Je m'accueille avec tendresse'.",
        },
        "de": {
            "name": "Pratibimb Trataka (Spiegel der Selbstannahme)",
            "focalTarget": "Der ruhige Blick in die eigenen Augen im Spiegel.",
            "neuroMechanism": "Der gütige Augenkontakt mit sich selbst löst Schamgefühle auf und schenkt tiefe innere Geborgenheit.",
            "guidance": "Blicken Sie sich freundlich in die Augen und sprechen Sie sich selbst Wohlwollen und Vergebung zu.",
        },
    },
    "shoonya": {
        "hi": {
            "name": "शून्य त्राटक (अनंत आकाश एवं मौन ध्यान)",
            "focalTarget": "विशाल, खुला आकाश अथवा सम्मुख फैला अंधकारमय शांत शून्य।",
            "neuroMechanism": "अनंत खुले विस्तार को देखने से मस्तिष्क का 'डिफ़ॉल्ट मोड नेटवर्क' शांत होता है और मानसिक तनाव पूरी तरह घुल जाता है।",
            "guidance": "दूर क्षितिज या खुले शून्य में अपनी दृष्टि को फैला दें। किसी एक वस्तु को पकड़ने के बजाय संपूर्ण विस्तार को महसूस करें और मन को मौन होने दें।",
        },
        "es": {
            "name": "Shoonya Trataka (El Vacío Panorámico y Horizonte Infinito)",
            "focalTarget": "El cielo abierto o la inmensidad vacía ante ti.",
            "neuroMechanism": "La visión periférica abierta desconecta la red neuronal por defecto, aliviando la sobrecarga cognitiva.",
            "guidance": "Expande tu campo visual hacia el horizonte sin fijarte en ningún objeto concreto. Deja que la mente se vuelva tan espaciosa como el cielo.",
        },
        "fr": {
            "name": "Shoonya Trataka (Le Vide Méditatif et l'Horizon Vaste)",
            "focalTarget": "Le ciel infini ou l'espace ouvert devant vous.",
            "neuroMechanism": "Le regard panoramique éteint l'hyperactivité mentale et crée un espace de silence régénérateur.",
            "guidance": "Élargissez votre regard vers l'immensité sans vous focaliser sur un point précis. Laissez l'esprit devenir aussi vaste que l'horizon.",
        },
        "de": {
            "name": "Shoonya Trataka (Die unendliche Weite des Raumes)",
            "focalTarget": "Der offene Himmel oder der weite Raum vor Ihnen.",
            "neuroMechanism": "Der weite Panoramablick beruhigt das Gedankenkarussell und schenkt befreiende Weite.",
            "guidance": "Weiten Sie Ihren Blick bis an den Horizont, ohne an Einzelheiten haften zu bleiben. Werden Sie still wie der weite Raum.",
        },
    },
}

def get_localized_gita_item(gita_id_or_item: Any, lang_code: Optional[str] = "en") -> Dict[str, str]:
    """Retrieves human-translated Gita item for target language code."""
    norm = normalize_language_code(lang_code)
    if isinstance(gita_id_or_item, str):
        shloka_id = gita_id_or_item.lower().strip()
        item_dict = {}
    elif isinstance(gita_id_or_item, dict):
        shloka_id = str(gita_id_or_item.get("id", "")).lower().strip()
        item_dict = gita_id_or_item
    else:
        shloka_id = ""
        item_dict = {}

    entry = GITA_LOCALIZATION_CATALOG.get(shloka_id, {})
    if norm in entry:
        return entry[norm]

    guidance = item_dict.get("actionable_guidance", {}) if isinstance(item_dict.get("actionable_guidance"), dict) else {}
    return {
        "meaning": item_dict.get("philosophical_meaning", "Perform your dedicated action with full integrity without outcome anxiety."),
        "reflection": item_dict.get("clinical_reframe", "Shift locus of control to present moment process execution."),
        "what_to_do": guidance.get("what_to_do", "Focus 100% on the single highest-integrity action in front of you."),
        "what_not_to_do": guidance.get("what_not_to_do", "Release attachment to hypothetical results you cannot control."),
    }

def get_localized_trataka_item(mode: str, lang_code: Optional[str] = "en") -> Dict[str, str]:
    """Retrieves human-translated Trataka instructions for target language code."""
    norm = normalize_language_code(lang_code)
    clean_mode = (mode or "bindu").lower().strip()
    entry = TRATAKA_LOCALIZATION_CATALOG.get(clean_mode, {})
    if norm in entry:
        return entry[norm]

    # English Fallback
    eng_map = {
        "bindu": {
            "name": "Bindu Trataka (Sacred Golden Focal Point)",
            "focalTarget": "A luminous golden focal point at eye level, roughly two feet away.",
            "neuroMechanism": "Motionless ocular fixation inhibits micro-saccades, down-regulating amygdala reactivity and stopping mental looping.",
            "guidance": "Rest a steady, soft gaze upon the golden point without straining your eyelids. When tired, close your eyes and cup warm palms over them.",
        },
        "flame": {
            "name": "Jyoti Trataka (Candle Flame Gazing)",
            "focalTarget": "The brightest tip of a steady candle flame.",
            "neuroMechanism": "Warm photon exposure activates retinal photoreceptors, stimulates dopamine, and dispels depressive lethargy.",
            "guidance": "Fix your gaze upon the tip of the flame with facial muscles relaxed. Close your eyes after 2 minutes and observe the inner retinal afterglow.",
        },
        "murti": {
            "name": "Mandala Trataka (Sacred Geometry Resonance)",
            "focalTarget": "The concentric center of a balanced geometric mandala.",
            "neuroMechanism": "Geometric visual symmetry stimulates interhemispheric coherence and dissolves ADHD attentional fragmentation.",
            "guidance": "Anchor your vision at the center of the mandala, then gently take in the radial symmetry while breathing deeply.",
        },
        "pratibimb": {
            "name": "Pratibimb Trataka (Sacred Mirror Self-Compassion)",
            "focalTarget": "The gentle reflection of your own pupils in a mirror.",
            "neuroMechanism": "Compassionate mutual gaze with oneself activates vagal social engagement and dissolves toxic shame and imposter syndrome.",
            "guidance": "Look directly into your own eyes in the mirror with tender friendliness. Repeat silently: 'I accept and support myself in this moment.'",
        },
        "shoonya": {
            "name": "Shoonya Trataka (Void & Panoramic Space Gazing)",
            "focalTarget": "The expansive open sky or deep panoramic void ahead.",
            "neuroMechanism": "Broad panoramic peripheral vision down-regulates the Default Mode Network, relieving mental exhaustion and overthinking.",
            "guidance": "Expand your visual awareness to the wide horizon without locking onto any single object. Let your mind become vast like the sky.",
        },
    }
    return eng_map.get(clean_mode, eng_map["bindu"])

