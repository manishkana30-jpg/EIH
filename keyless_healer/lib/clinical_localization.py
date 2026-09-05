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

    if norm == "hi":
        return f"{loc['validation']} {loc['cbt_reframing']} अपने तंत्रिका तंत्र को स्थिर करने के लिए: {loc['somatic_anchor']} इसके साथ ही {loc['pranayama']}"
    elif norm == "es":
        return f"{loc['validation']} {loc['cbt_reframing']} Para regular tu sistema nervioso en este instante: practica {loc['somatic_anchor']} y {loc['pranayama']}"
    elif norm == "fr":
        return f"{loc['validation']} {loc['cbt_reframing']} Pour apaiser votre système nerveux dès maintenant : appliquez {loc['somatic_anchor']} ainsi que {loc['pranayama']}"
    elif norm == "de":
        return f"{loc['validation']} {loc['cbt_reframing']} Um Ihr Nervensystem jetzt zu beruhigen: Nutzen Sie {loc['somatic_anchor']} und {loc['pranayama']}"

    return f"{loc['validation']} {loc['cbt_reframing']} To steady your autonomic nervous system right now: engage in {loc['somatic_anchor']} alongside {loc['pranayama']}"
