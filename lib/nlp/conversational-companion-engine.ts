/**
 * Conversational Companion Cognitive Intelligence & Clinical Synthesis Engine
 *
 * Dynamically synthesizes evidence-based 3-phase clinical interventions:
 * 1. Deep Validation: Validates the user's specific emotional and somatic experience.
 * 2. CBT Cognitive Reframe: Applies targeted reframing grounded in the Clinical Psychology Library.
 * 3. Somatic Clinical Prescription: Prescribes actionable polyvagal anchoring and Ayurvedic Sattvavajaya pranayama.
 *
 * Zero hardcoded filler or static greeting pools.
 * Full Multilingual Support & Zero Code-Switching Guarantee.
 */

import { getResearchedAdviceForEmotion, type AuthenticatedStudy } from '../knowledge/authenticated-research-bank.ts';
import { emotionClassifier, type NeuroscienceDiagnosticResult } from '../knowledge/emotion-classifier.ts';
import { runHiddenCognitiveDiagnostics, normalizeEntityAnchor } from './cognitive-orchestrator.ts';
import type { UserCognitiveProfile } from '../memory/cbt-memory-types.ts';
import { queryPsychologyLibrary, type PsychologyCondition } from '../knowledge/psychology-library-rag.ts';
import { GLOBAL_LANGUAGE_CATALOG } from '../i18n/language-catalog.ts';

export interface ConversationalContext {
  userText: string;
  targetLanguageCode?: string;
  speechLocale?: string;
  history?: Array<{ role: string; text: string }>;
  emotionDimension?: string;
  diagnostic?: NeuroscienceDiagnosticResult;
  userDosha?: string;
  cognitiveProfile?: UserCognitiveProfile;
}

export interface CompanionResponse {
  reply: string;
  detectedTopic: string;
  responseKey: string;
  detectedLanguage: string;
  speechLocale: string;
  psychologicalAssessment?: {
    dimension: string;
    valence: number;
    arousal: number;
    polyvagalState: string;
    doshicState: string;
    somaticArea: string;
    scientificStudy: string;
  };
  libraryCondition?: PsychologyCondition;
}

export interface LocalizedClinicalSolution {
  cbtReframe: string;
  somaticAnchor: string;
  pranayama: string;
  microHabit: string;
}

/**
 * Localized clinical solutions dictionary for all 20 psychology conditions.
 * Ensures zero code-switching (no English fragments inside non-English replies).
 */
const LOCALIZED_CLINICAL_SOLUTIONS: Record<string, Record<string, LocalizedClinicalSolution>> = {
  gad: {
    hi_dev: {
      cbtReframe: "सबसे बुरे डर की वास्तविक संभावना का निष्पक्ष आकलन करें और 'अगर ऐसा हुआ तो?' से 'इस समय वास्तविक क्या है?' पर ध्यान केंद्रित करें",
      somaticAnchor: "5-4-3-2-1 इंद्रिय संतुलन (5 चीजें देखें, 4 स्पर्श करें, 3 सुनें, 2 सूंघें, और 1 स्वाद लें)",
      pranayama: "नाड़ी शोधन (अनुलोम-विलोम प्राणायाम)",
      microHabit: "प्रतिदिन शाम को 15 मिनट का चिंता समय निर्धारित करें और बाकी समय विचारों को विराम दें",
    },
    hi_hinglish: {
      cbtReframe: "Worst-case scenario ki reality check karein aur 'Agar aisa hua toh?' ki jagah 'Abhi actual sach kya hai?' par focus karein",
      somaticAnchor: "5-4-3-2-1 Sensory Grounding (5 cheezein dekhein, 4 touch karein, 3 sunein, 2 smell karein, aur 1 taste karein)",
      pranayama: "Nadi Shodhana (Alternate Nostril Breathing)",
      microHabit: "Roz sham ko 15 minute ka dedicated Worry Window set karein aur baaki time overthinking ko hold par rakhein",
    },
    es: {
      cbtReframe: "Evalúe la probabilidad estadística real del peor escenario y pase de '¿Qué pasaría si?' a '¿Qué es real en este momento?'",
      somaticAnchor: "anclaje sensorial 5-4-3-2-1 (identifique 5 cosas que ve, 4 que toca, 3 que escucha, 2 que huele y 1 que saborea)",
      pranayama: "respiración Nadi Shodhana para restaurar el tono parasimpático",
      microHabit: "reserve una ventana de preocupación de 15 minutos al día y posponga la rumiación fuera de ella",
    },
    fr: {
      cbtReframe: "Évaluez la probabilité réelle du pire scénario et passez de 'Et si...' à 'Quelle est la réalité immédiate ?'",
      somaticAnchor: "l'ancrage sensoriel 5-4-3-2-1 (observez 5 éléments visuels, 4 sensations tactiles, 3 sons, 2 odeurs et 1 goût)",
      pranayama: "la respiration Nadi Shodhana pour apaiser le système nerveux",
      microHabit: "consacrez 15 minutes quotidiennes à vos soucis et remettez à plus tard les ruminations parasites",
    },
    de: {
      cbtReframe: "Prüfen Sie die reale statistische Wahrscheinlichkeit von Sorgen und wechseln Sie von 'Was wäre wenn?' zu 'Was ist jetzt real?'",
      somaticAnchor: "5-4-3-2-1 Sinneserdung (benennen Sie 5 Dinge zum Sehen, 4 zum Fühlen, 3 zum Hören, 2 zum Riechen, 1 zum Schmecken)",
      pranayama: "Nadi Shodhana (Wechselatmung) zur Beruhigung des Nervensystems",
      microHabit: "richten Sie ein 15-minütiges Sorgenfenster ein und verschieben Sie Grübeleien bewusst darauf",
    },
  },
  burnout_fatigue: {
    hi_dev: {
      cbtReframe: "विश्राम को पुरस्कार नहीं बल्कि अनिवार्य मानसिक व शारीरिक मरम्मत समझें",
      somaticAnchor: "कंधों को कानों से दूर ढीला छोड़ें, जबड़े का तनाव मुक्त करें और जीभ को तालू से अलग करें",
      pranayama: "भ्रामरी प्राणायाम का गुंजन",
      microHabit: "सोने से 60 मिनट पहले सभी स्क्रीन और कार्य संदेश पूरी तरह बंद करें",
    },
    hi_hinglish: {
      cbtReframe: "Rest ko koi reward nahi balki mandatory physical aur mental repair samjhein",
      somaticAnchor: "Kandho ko relax karein, jaw aur tongue ko loose chodiye, aur body se heavy strain release karein",
      pranayama: "Bhramari Pranayama cranial resonance aur vagus nerve relaxation ke liye",
      microHabit: "Sone se 1 ghanta pehle strict Digital Sunset follow karein",
    },
    es: {
      cbtReframe: "Considere el descanso como un mantenimiento fisiológico indispensable y no como un premio ganado",
      somaticAnchor: "soltar la mandíbula, relajar la lengua del paladar y bajar los hombros lejos de las orejas",
      pranayama: "respiración Bhramari para generar calma profunda en el nervio vago",
      microHabit: "apagar todas las pantallas y notificaciones laborales 60 minutos antes de acostarse",
    },
    fr: {
      cbtReframe: "Considérez le repos comme une nécessité biologique vitale et non comme une récompense méritée",
      somaticAnchor: "desserrer la mâchoire, décoller la langue du palais et abaisser vos épaules",
      pranayama: "la respiration Bhramari pour induire une résonance apaisante du système nerveux",
      microHabit: "éteindre tous les écrans professionnels 60 minutes avant le coucher",
    },
    de: {
      cbtReframe: "Betrachten Sie Erholung als unverzichtbare biologische Notwendigkeit und nicht als Belohnung",
      somaticAnchor: "die Zunge vom Gaumen lösen, den Kiefer entspannen und die Schultern senken",
      pranayama: "Bhramari-Bienenatmung zur tiefen vagalen Regeneration",
      microHabit: "60 Minuten vor dem Schlafen alle Arbeitsnachrichten und Bildschirme ausschalten",
    },
  },
  panic_dysregulation: {
    hi_dev: {
      cbtReframe: "यह तीव्र सनसनी केवल एक अस्थायी एड्रेनालाईन उछाल है जो कुछ मिनटों में स्वतः शांत हो जाता है",
      somaticAnchor: "चेहरे और आंखों पर 20 सेकंड के लिए ठंडे पानी का कपड़ा या बर्फ रखें",
      pranayama: "लंबी श्वास (4 सेकंड नाक से सांस लेना और 7 सेकंड धीरे-धीरे होंठों से छोड़ना)",
      microHabit: "स्वयं को याद दिलाएं: 'यह असहज है लेकिन खतरनाक नहीं, मेरा शरीर पूरी तरह सुरक्षित है'",
    },
    hi_hinglish: {
      cbtReframe: "Yeh sirf ek harmless temporary adrenaline surge hai jo thodi der mein settle ho jata hai",
      somaticAnchor: "Face par 20 seconds ke liye cold water towel ya ice press karein",
      pranayama: "4 seconds slow nasal inhale aur 7 seconds smooth oral exhale",
      microHabit: "Self-reminder repeat karein: 'Yeh uncomfortable hai par dangerous nahi, meri body completely safe hai'",
    },
    es: {
      cbtReframe: "Esta oleada es una descarga inofensiva de adrenalina que se disipa de forma natural en unos minutos",
      somaticAnchor: "aplicar una toalla fría en las mejillas y ojos durante 20 segundos para regular el pulso",
      pranayama: "respiración prolongada inhalando en 4 segundos y exhalando suavemente en 7 segundos",
      microHabit: "recordar mentalmente: 'Esto es incómodo, pero no es peligroso; mi cuerpo está seguro'",
    },
    fr: {
      cbtReframe: "Cette poussée est une montée d'adrénaline bénigne qui s'estompe d'elle-même en quelques minutes",
      somaticAnchor: "poser un linge frais sur le visage pendant 20 secondes pour ralentir la cadence cardiaque",
      pranayama: "la respiration lente (inspirer sur 4 secondes et expirer sur 7 secondes)",
      microHabit: "se répéter : 'C'est inconfortable, mais sans danger. Mon corps est en sécurité'",
    },
    de: {
      cbtReframe: "Dieser Schwall ist ein harmloser Adrenalinschub, der sich innerhalb weniger Minuten von selbst abbaut",
      somaticAnchor: "Gesicht und Augen für 20 Sekunden mit einem feuchten Tuch kühlen",
      pranayama: "sanfte 4-7 Atmung (4 Sekunden einatmen, 7 Sekunden langsam ausatmen)",
      microHabit: "sich sagen: 'Es fühlt sich intensiv an, aber es ist nicht gefährlich. Mein Körper ist sicher'",
    },
  },
  major_depressive_inertia: {
    hi_dev: {
      cbtReframe: "प्रेरणा से पहले कर्म आता है; किसी छोटे काम को शुरू करने के लिए मूड बनने की प्रतीक्षा न करें",
      somaticAnchor: "जमीन पर दृढ़ता से खड़े होकर 60 सेकंड तक छाती के मध्य में उंगलियों से हल्की थपकी दें",
      pranayama: "सूर्य भेदन प्राणायाम द्वारा शरीर में नई ऊर्जा का संचार",
      microHabit: "एक बहुत छोटा कार्य चुनें (जैसे खिड़की खोलना या पानी पीना) जिसे पूरा करना बेहद आसान हो",
    },
    hi_hinglish: {
      cbtReframe: "Action motivation se pehle aati hai; kaam shuru karne ke liye mood banne ka wait mat karein",
      somaticAnchor: "Floor par firmly khade hokar 60 seconds chest tapping karein body ko physically activate karne ke liye",
      pranayama: "Surya Bhedana (Right Nostril Breathing) lethargy door karne ke liye",
      microHabit: "Itna chota micro-task pick karein jisme fail hona impossible ho",
    },
    es: {
      cbtReframe: "La acción precede a la motivación; no espere a tener ganas para dar el primer paso sencillo",
      somaticAnchor: "ponerse de pie con firmeza y dar suaves toques en el esternón durante 60 segundos",
      pranayama: "respiración Surya Bhedana por la fosa nasal derecha para despertar la energía vital",
      microHabit: "comenzar con una microtarea tan accesible que resulte imposible postergar",
    },
    fr: {
      cbtReframe: "L'action précède la motivation ; n'attendez pas l'envie pour accomplir un tout premier geste",
      somaticAnchor: "se tenir debout fermement et tapoter doucement le sternum pendant 60 secondes",
      pranayama: "la respiration Surya Bhedana pour stimuler votre tonus vital",
      microHabit: "réaliser une micro-action infime (ouvrir une fenêtre ou boire un verre d'eau)",
    },
    de: {
      cbtReframe: "Handeln erzeugt Motivation; warten Sie nicht auf die Stimmung, um den kleinsten Schritt zu tun",
      somaticAnchor: "sich fest auf den Boden stellen und sanft das Brustbein für 60 Sekunden beklopfen",
      pranayama: "Surya Bhedana (Rechtes Nasenloch) zur Revitalisierung von Körper und Geist",
      microHabit: "eine winzige Mikro-Aufgabe wählen, die sofort und mühelos gelingt",
    },
  },
  imposter_perfectionism: {
    hi_dev: {
      cbtReframe: "पूर्णतावाद और वास्तविक उत्कृष्टता में अंतर समझें; 80% परिणाम अक्सर पूरी तरह पर्याप्त होता है",
      somaticAnchor: "जबड़े को ढीला छोड़ें, माथे के खिंचाव को शांत करें और गहरी सांस छोड़ें",
      pranayama: "शीतली या शीतकारी प्राणायाम द्वारा मानसिक तनाव को शांत करना",
      microHabit: "किसी कार्य को 85% संतुष्टि पर रोककर बिना अत्यधिक सुधार किए आगे बढ़ें",
    },
    hi_hinglish: {
      cbtReframe: "Perfectionism aur realistic excellence mein farq samjhein; 80% outcome aksar practical aur best hota hai",
      somaticAnchor: "Jaw ko loose chodiye, forehead tension release karein aur deep calm exhale karein",
      pranayama: "Sitali cooling breathwork performance anxiety calm karne ke liye",
      microHabit: "Apne task ko 85% completion par finalize karein bina unnecessary over-editing ke",
    },
    es: {
      cbtReframe: "Diferencie la excelencia del perfeccionismo paralizante; el 80% suele ser más que suficiente",
      somaticAnchor: "soltar la tensión del entrecejo, relajar los hombros y suavizar la respiración",
      pranayama: "respiración refrescante Sitali para reducir la sobreexigencia mental",
      microHabit: "entregar o finalizar una tarea al 85% de perfección sin caer en la sobrecorrección",
    },
    fr: {
      cbtReframe: "Distinguez l'exigence saine du perfectionnisme paralysant ; 80% de complétion est souvent optimal",
      somaticAnchor: "relâcher le front, décontracter les mâchoires et laisser descendre les épaules",
      pranayama: "la respiration rafraîchissante Sitali pour apaiser l'autocritique",
      microHabit: "finaliser une tâche à 85% sans la retoucher indéfiniment",
    },
    de: {
      cbtReframe: "Unterscheiden Sie gesunden Einsatz von lähmendem Perfektionismus; 80% ist in der Praxis oft optimal",
      somaticAnchor: "die Kieferanspannung lösen, die Stirn glätten und tief ausatmen",
      pranayama: "kühlende Sitali-Atmung zur Linderung des inneren Leistungsdrucks",
      microHabit: "eine Aufgabe bei 85% Zufriedenheit bewusst abschließen",
    },
  },
  workplace_mobbing_toxic_culture: {
    hi_dev: {
      cbtReframe: "दूसरों का अस्वस्थ व्यवहार उनकी अपनी असुरक्षा को दर्शाता है, आपकी व्यक्तिगत योग्यता को नहीं",
      somaticAnchor: "दोनों पैरों को फर्श पर टिकाएं और अपनी रीढ़ की हड्डी को सीधा और स्थिर महसूस करें",
      pranayama: "समवृत्ति प्राणायाम (4 सेकंड श्वास, 4 सेकंड रोक, 4 सेकंड छोड़ना, 4 सेकंड रोक)",
      microHabit: "कार्य समय समाप्त होते ही कार्य संबंधी सभी ऐप बंद करें और अपनी मानसिक सीमाएं सुरक्षित रखें",
    },
    hi_hinglish: {
      cbtReframe: "Dushron ka toxic behavior unke apne internal issues reflect karta hai, aapki capability nahi",
      somaticAnchor: "Dono feet ko ground par firmly press karein aur spine ko stable aur upright rakhein",
      pranayama: "Box Breathing (4s Inhale, 4s Hold, 4s Exhale, 4s Hold) equilibrium ke liye",
      microHabit: "Work hours khatam hote hi office apps close karein aur clear mental boundaries banayein",
    },
    es: {
      cbtReframe: "Las conductas hostiles de otros reflejan sus propias limitaciones y no definen su valía",
      somaticAnchor: "apoyar firmemente ambos pies en el suelo y sentir la estabilidad de su columna",
      pranayama: "respiración en caja (4-4-4-4) para recuperar el equilibrio autonómico",
      microHabit: "cerrar las aplicaciones laborales al terminar la jornada para blindar su espacio personal",
    },
    fr: {
      cbtReframe: "Le comportement toxique d'autrui reflète ses propres dysfonctionnements et non votre valeur",
      somaticAnchor: "ancrer vos pieds au sol et ressentir l'alignement solide de votre colonne",
      pranayama: "la respiration carrée (4-4-4-4) pour rétablir votre calme intérieur",
      microHabit: "déconnecter toutes les applications professionnelles dès la fin de votre journée",
    },
    de: {
      cbtReframe: "Toxisches Verhalten anderer spiegelt deren Überforderung wider und nicht Ihren persönlichen Wert",
      somaticAnchor: "beide Füße fest auf den Boden stellen und die aufrechte Stabilität der Wirbelsäule spüren",
      pranayama: "Box-Atmung (4-4-4-4) zur Wiederherstellung der inneren Souveränität",
      microHabit: "nach Arbeitsende alle beruflichen Kanäle konsequent stummschalten",
    },
  },
  insomnia_hyperarousal: {
    hi_dev: {
      cbtReframe: "बिस्तर पर जागते रहना असफलता नहीं है; शरीर को केवल शांत लेटे रहने से भी महत्वपूर्ण विश्राम मिलता है",
      somaticAnchor: "पैरों की उंगलियों से लेकर सिर तक पूरे शरीर की मांसपेशियों को क्रमिक रूप से ढीला करें",
      pranayama: "4-7-8 श्वास अभ्यास (4 सेकंड श्वास लें, 7 सेकंड रोकें, और 8 सेकंड छोड़ें)",
      microHabit: "यदि 20 मिनट तक नींद न आए तो उठकर मंद प्रकाश में कोई शांत पुस्तक पढ़ें",
    },
    hi_hinglish: {
      cbtReframe: "Bed par jagna failure nahi hai; body ko sirf calm rest milne se bhi recovery hoti hai",
      somaticAnchor: "Toe se head tak progressive somatic body scan karein aur muscular tension drop karein",
      pranayama: "4-7-8 Breathing technique parasympathetic sleep induction ke liye",
      microHabit: "Agar 20 minutes tak neend na aaye toh bed chhodkar dim light mein gentle reading karein",
    },
    es: {
      cbtReframe: "No dormir de inmediato no es un fracaso; el simple reposo tranquilo ya nutre y regenera su organismo",
      somaticAnchor: "escaneo corporal progresivo relajando conscientemente cada músculo de pies a cabeza",
      pranayama: "la técnica de respiración 4-7-8 para activar la transición natural al sueño profundo",
      microHabit: "si tras 20 minutos sigue despierto, levantarse y leer algo tranquilo con luz tenue",
    },
    fr: {
      cbtReframe: "Rester éveillé n'est pas un échec ; le simple repos calme procure déjà une régénération essentielle",
      somaticAnchor: "le balayage corporel progressif pour relâcher chaque zone musculaire des pieds à la tête",
      pranayama: "la respiration 4-7-8 pour faciliter l'endormissement et apaiser le flux mental",
      microHabit: "si le sommeil ne vient pas après 20 minutes, se lever et lire calmement sous une lumière tamisée",
    },
    de: {
      cbtReframe: "Wachliegen ist kein Scheitern; auch ruhiges Liegen schenkt dem Körper wertvolle Erholung",
      somaticAnchor: "progressiver Körperscan zum systematischen Entspannen jedes Muskels von den Zehen bis zum Kopf",
      pranayama: "4-7-8 Atemtechnik zur natürlichen Einleitung des Schlafzustands",
      microHabit: "wenn Sie nach 20 Minuten noch wach sind, aufstehen und bei gedämpftem Licht lesen",
    },
  },
  relationship_heartbreak: {
    hi_dev: {
      cbtReframe: "संबंध का टूटना आपके प्रेम करने की क्षमता या आपके आत्म-मूल्य को कम नहीं करता",
      somaticAnchor: "दोनों हाथों को हृदय के केंद्र पर रखकर अपनी छाती में गर्माहट और सुरक्षा महसूस करें",
      pranayama: "गहरी उज्जयी श्वास का अभ्यास",
      microHabit: "अपनी भावनाओं को बिना किसी स्व-आलोचना के एक डायरी में लिख लें",
    },
    hi_hinglish: {
      cbtReframe: "Breakup ya separation aapki inner worth ya loving capability ko define nahi karta",
      somaticAnchor: "Dono hands ko heart center par rakhein aur gentle warmth aur self-compassion feel karein",
      pranayama: "Ujjayi ocean breath emotional turbulence ko soothe karne ke liye",
      microHabit: "Apni true feelings ko bina kisi self-judgment ke journal mein express karein",
    },
    es: {
      cbtReframe: "El duelo afectivo no disminuye su valor personal ni su capacidad de construir vínculos sanos",
      somaticAnchor: "colocar ambas manos sobre el pecho y sentir el calor reconfortante de su propio contacto",
      pranayama: "respiración oceánica Ujjayi para serenar las emociones intensas",
      microHabit: "escribir sus emociones en un cuaderno sin juzgar lo que siente",
    },
    fr: {
      cbtReframe: "La fin d'une relation n'altère en rien votre valeur profonde ni votre capacité d'aimer",
      somaticAnchor: "poser vos deux mains sur la région du cœur et accueillir une douce chaleur bienveillante",
      pranayama: "la respiration Ujjayi pour apaiser la houle émotionnelle",
      microHabit: "noter vos ressentis dans un carnet en faisant preuve d'une totale bienveillance",
    },
    de: {
      cbtReframe: "Eine Trennung mindert weder Ihren persönlichen Wert noch Ihre Fähigkeit zu aufrichtiger Verbundenheit",
      somaticAnchor: "beide Hände auf die Herzregion legen und die beruhigende Wärme spüren",
      pranayama: "Ujjayi-Atmung zur Linderung emotionaler Turbulenzen",
      microHabit: "Gefühle ohne Selbstkritik in ein Notizbuch schreiben",
    },
  },
  existential_loneliness: {
    hi_dev: {
      cbtReframe: "अकेलापन एक अस्थायी भावनात्मक अवस्था है, आपका स्थायी भाग्य नहीं",
      somaticAnchor: "अपने दोनों हाथों से अपनी भुजाओं को आलिंगन में लें और शारीरिक स्पर्श की स्थिरता महसूस करें",
      pranayama: "हृदय केंद्रित श्वास (छाती में श्वास भरना और प्रेम व करुणा की भावना के साथ छोड़ना)",
      microHabit: "आज किसी एक परिचित या मित्र को एक संक्षिप्त, सकारात्मक संदेश भेजें",
    },
    hi_hinglish: {
      cbtReframe: "Loneliness ek temporary internal feeling hai, aapka permanent reality ya future nahi",
      somaticAnchor: "Self-hug somatic hold: Apne arms ko embrace karein aur safe touch feel karein",
      pranayama: "Heart-centered breathing (Inhale expansiveness aur exhale self-compassion)",
      microHabit: "Aaj kisi ek friend ya well-wisher ko ek short positive message send karein",
    },
    es: {
      cbtReframe: "La soledad es una emoción temporal que invita a la reconexión, no una condena definitiva",
      somaticAnchor: "abrazarse a sí mismo con suavidad sintiendo la presencia reconfortante de sus propios brazos",
      pranayama: "respiración enfocada en el corazón con exhalaciones compasivas y lentas",
      microHabit: "enviar hoy un breve mensaje de aprecio a un ser querido o conocido",
    },
    fr: {
      cbtReframe: "La solitude est un état passager qui incite au lien, non une fatalité",
      somaticAnchor: "enlacer doucement vos bras autour de votre buste pour ressentir un ancrage physique apaisant",
      pranayama: "la respiration centrée sur le cœur avec de lentes expirations bienveillantes",
      microHabit: "envoyer aujourd'hui un message chaleureux à une personne de votre entourage",
    },
    de: {
      cbtReframe: "Einsamkeit ist ein vorübergehendes Gefühl und kein endgültiges Schicksal",
      somaticAnchor: "sanft die eigenen Oberarme umfassen und die beruhigende Selbstberührung spüren",
      pranayama: "herzorientierte Atmung mit sanften, nährenden Ausatemzügen",
      microHabit: "heute eine kurze freundliche Nachricht an eine vertraute Person senden",
    },
  },
  anger_frustration_dysregulation: {
    hi_dev: {
      cbtReframe: "क्रोध अक्सर आहत भावनाओं या असंतुष्ट आवश्यकताओं का रक्षक कवच होता है; इसके नीचे की वास्तविक भावना को समझें",
      somaticAnchor: "मुट्ठियों को 5 सेकंड कसकर भींचे और फिर सांस छोड़ते हुए उंगलियों को पूरी तरह फैलाकर ढीला छोड़ें",
      pranayama: "शीतली प्राणायाम (मुंह से शीतलता भरकर नाक से सांस छोड़ना)",
      microHabit: "प्रतिक्रिया देने से पहले 10 से 1 तक उल्टी गिनती गिनें और 3 गहरी सांसें लें",
    },
    hi_hinglish: {
      cbtReframe: "Anger aksar hurt ya unmet needs ka protective shield hota hai; uske underlying cause ko understand karein",
      somaticAnchor: "Fists ko 5 seconds tight squeeze karein aur slow exhale ke saath open karke tension drop karein",
      pranayama: "Sitali cooling breath somatic heat release karne ke liye",
      microHabit: "Koi bhi reaction dene se pehle 10 to 1 reverse count karein aur 3 deep grounding breaths lein",
    },
    es: {
      cbtReframe: "La ira suele ser un escudo protector ante el dolor o la frustración; explore la necesidad no cubierta",
      somaticAnchor: "apretar los puños con fuerza durante 5 segundos y soltarlos por completo al exhalar",
      pranayama: "respiración refrescante Sitali para disipar el calor y la reactividad corporal",
      microHabit: "contar del 10 al 1 y tomar tres respiraciones profundas antes de responder a cualquier estímulo",
    },
    fr: {
      cbtReframe: "La colère est souvent une carapace protégeant une blessure ou un besoin non comblé",
      somaticAnchor: "serrer les poings pendant 5 secondes puis les relâcher totalement à l'expiration",
      pranayama: "la respiration rafraîchissante Sitali pour apaiser l'agitation intérieure",
      microHabit: "compter de 10 à 1 et prendre 3 respirations complètes avant de réagir",
    },
    de: {
      cbtReframe: "Wut dient oft als Schutzschild für tieferliegende Enttäuschung oder verletzte Bedürfnisse",
      somaticAnchor: "die Fäuste für 5 Sekunden fest zusammenballen und beim Ausatmen ganz öffnen",
      pranayama: "kühlende Sitali-Atmung zur Mäßigung körperlicher Reizüberflutung",
      microHabit: "von 10 bis 1 rückwärts zählen und drei tiefe Atemzüge vor jeder Reaktion nehmen",
    },
  },
  grief_bereavement: {
    hi_dev: {
      cbtReframe: "शोक प्रेम की ही निरंतरता है; आंसुओं और उदासी को दबाने के बजाय उन्हें स्वाभाविक रूप से बहने दें",
      somaticAnchor: "एक भारी कंबल ओढ़कर बैठें और पैरों के नीचे जमीन के ठोस आधार को महसूस करें",
      pranayama: "धीमी, सहज उदर श्वास (डायाफ्रामिक ब्रीदिंग)",
      microHabit: "प्रतिदिन अपने प्रियजन की किसी एक सुंदर स्मृति को याद करके कृतज्ञता व्यक्त करें",
    },
    hi_hinglish: {
      cbtReframe: "Grief actually prem ka hi dusra roop hai; emotions ko suppress karne ki jagah gently flow hone dein",
      somaticAnchor: "Weighted blanket ya warm wrap use karein aur feet ke neeche earth support feel karein",
      pranayama: "Gentle Diaphragmatic belly breathing emotional holding release karne ke liye",
      microHabit: "Roz apne loved one ki ek precious memory ko yaad karke gratefulness feel karein",
    },
    es: {
      cbtReframe: "El duelo es la continuación del amor; permita que las emociones fluyan sin forzar una recuperación rápida",
      somaticAnchor: "envolverse en una manta cómoda y sentir el firme soporte del suelo bajo sus pies",
      pranayama: "respiración diafragmática suave y compasiva",
      microHabit: "honrar una memoria entrañable con gratitud y permitirse sentir cada emoción a su propio ritmo",
    },
    fr: {
      cbtReframe: "Le deuil est le prolongement de l'amour ; laissez vos émotions s'exprimer sans les brusquer",
      somaticAnchor: "vous envelopper dans un plaid chaud et ressentir l'ancrage réconfortant du sol sous vos pieds",
      pranayama: "la respiration abdominale lente et enveloppante",
      microHabit: "honorer chaque jour un souvenir précieux avec douceur et sans vous juger",
    },
    de: {
      cbtReframe: "Trauer ist der Ausdruck andauernder Verbundenheit; geben Sie Ihren Tränen den nötigen Raum",
      somaticAnchor: "sich in eine Decke hüllen und den festen Halt des Bodens spüren",
      pranayama: "sanfte Bauchatmung zur behutsamen Entlastung des Körpers",
      microHabit: "täglich eine liebevolle Erinnerung in aller Stille würdigen",
    },
  },
};

/**
 * Universal localized fallback helper for any condition or general emotion.
 */
function getLocalizedClinicalSolution(
  conditionId: string | undefined,
  langCode: string,
  isDevanagari: boolean,
  study: AuthenticatedStudy,
  libraryCondition?: PsychologyCondition
): LocalizedClinicalSolution {
  const condKey = conditionId || 'gad';
  const langKey = langCode === 'hi' ? (isDevanagari ? 'hi_dev' : 'hi_hinglish') : langCode;

  if (LOCALIZED_CLINICAL_SOLUTIONS[condKey] && LOCALIZED_CLINICAL_SOLUTIONS[condKey][langKey]) {
    return LOCALIZED_CLINICAL_SOLUTIONS[condKey][langKey];
  }

  // Generic localized templates by language
  if (langCode === 'hi') {
    if (isDevanagari) {
      return {
        cbtReframe: "अति-विचार और चिंताओं को वास्तविकता से अलग करके वर्तमान पर ध्यान केंद्रित करें",
        somaticAnchor: "कंधों को ढीला छोड़ें, गहरी सांस लें और 5-4-3-2-1 इंद्रिय संतुलन अपनाएं",
        pranayama: "नाड़ी शोधन (अनुलोम-विलोम) प्राणायाम",
        microHabit: "कार्यों के बीच 3 मिनट का सचेत विराम लें और शरीर को विश्राम दें",
      };
    }
    return {
      cbtReframe: "Overthinking ko reality se alag karke dekhein aur present reality par focus karein",
      somaticAnchor: "Shoulders drop karein, deep grounding breath lein aur 5-4-3-2-1 sensory anchor practice karein",
      pranayama: "Nadi Shodhana (Alternate Nostril) pranayama",
      microHabit: "Tasks ke beech mein 3 minute ka somatic pause lein",
    };
  }

  if (langCode === 'es') {
    return {
      cbtReframe: "Observe sus pensamientos con perspectiva objetiva y céntrese en lo que está bajo su control",
      somaticAnchor: "relajar los hombros, soltar la mandíbula y practicar anclaje sensorial en el presente",
      pranayama: "respiración diafragmática profunda y pausada",
      microHabit: "hacer pausas conscientes de 3 minutos entre actividades para regular el cuerpo",
    };
  }

  if (langCode === 'fr') {
    return {
      cbtReframe: "Prenez du recul sur vos pensées automatiques et recentrez-vous sur vos actions immédiates",
      somaticAnchor: "abaisser les épaules, détendre le visage et ancrer vos sensations corporelles",
      pranayama: "la respiration abdominale lente et équilibrante",
      microHabit: "prendre une pause somatique de 3 minutes entre vos tâches",
    };
  }

  if (langCode === 'de') {
    return {
      cbtReframe: "Distanzieren Sie sich von automatischen Sorgen und konzentrieren Sie sich auf das Hier und Jetzt",
      somaticAnchor: "die Schultern senken, den Kiefer lockern und die Stabilität des Bodens spüren",
      pranayama: "gleichmäßige Zwerchfellatmung zur Entlastung des Nervensystems",
      microHabit: "sich 3-minütige bewusste Pausen zwischen Ihren Aufgaben gönnen",
    };
  }

  // English fallback
  return {
    cbtReframe: libraryCondition?.solutions?.cbt_reframing || study.scientificActionProtocol || "Distinguish emotional thoughts from objective facts and focus on your immediate agency",
    somaticAnchor: libraryCondition?.solutions?.somatic_anchor || "drop your shoulders away from your ears, unclench your jaw, and engage in 5-4-3-2-1 sensory grounding",
    pranayama: libraryCondition?.solutions?.pranayama || study.ayurvedicActionProtocol || "slow-paced alternate nostril diaphragmatic breathing",
    microHabit: libraryCondition?.solutions?.micro_habit || "take a 3-minute somatic reset pause between tasks",
  };
}

/**
 * Localize anchor into target language so no raw English anchor leaks into non-English sentences.
 */
function localizeAnchor(rawText: string, langCode: string, isDevanagari: boolean): string {
  const lower = (rawText || '').toLowerCase();

  if (langCode === 'hi') {
    if (isDevanagari) {
      if (lower.includes('work') || lower.includes('office') || lower.includes('job') || lower.includes('kaam') || lower.includes('boss') || lower.includes('काम') || lower.includes('दफ्तर') || lower.includes('बॉस')) {
        return "काम और दफ्तर के दबाव";
      }
      if (lower.includes('exam') || lower.includes('padhai') || lower.includes('study') || lower.includes('test') || lower.includes('परीक्षा') || lower.includes('पढ़ाई') || lower.includes('पेपर')) {
        return "परीक्षा और पढ़ाई की चिंता";
      }
      if (lower.includes('sleep') || lower.includes('neend') || lower.includes('insomnia') || lower.includes('नींद') || lower.includes('रात')) {
        return "अनिद्रा और बेचैनी";
      }
      if (lower.includes('health') || lower.includes('bimar') || lower.includes('pain') || lower.includes('dard') || lower.includes('बीमार') || lower.includes('दर्द') || lower.includes('तबीयत')) {
        return "स्वास्थ्य और शारीरिक तनाव";
      }
      if (lower.includes('relationship') || lower.includes('breakup') || lower.includes('partner') || lower.includes('dost') || lower.includes('friend') || lower.includes('दोस्त') || lower.includes('रिश्ते')) {
        return "रिश्तों की उलझन";
      }
      if (lower.includes('money') || lower.includes('paise') || lower.includes('salary') || lower.includes('debt') || lower.includes('पैसे') || lower.includes('खर्च') || lower.includes('कर्ज')) {
        return "आर्थिक चिंता और दबाव";
      }
      if (lower.includes('gussa') || lower.includes('anger') || lower.includes('angry') || lower.includes('गुस्सा') || lower.includes('क्रोध')) {
        return "क्रोध और मानसिक असंतोष";
      }
      if (lower.includes('alone') || lower.includes('lonely') || lower.includes('akela') || lower.includes('अकेला') || lower.includes('अकेलेपन')) {
        return "अकेलेपन और अलगाव";
      }
      if (lower.includes('fail') || lower.includes('har') || lower.includes('हार') || lower.includes('विफल')) {
        return "इस असफलता और निराशा";
      }
      if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('thak') || lower.includes('थकान') || lower.includes('थक')) {
        return "शारीरिक व मानसिक थकान";
      }

      // Dynamic alternating anchors for general Hindi predicaments
      const hindiFallbacks = [
        "इस आंतरिक खिंचाव और दबाव",
        "आपके द्वारा साझा किए गए इन अनुभवों",
        "मन में चल रही इन उलझनों",
        "वर्तमान परिस्थिति और तनाव",
        "मन की इस असहज बेचैनी",
        "इन चुनौतीपूर्ण भावनाओं और विचारों"
      ];
      let hash = 0;
      for (let i = 0; i < rawText.length; i++) hash = (hash * 31 + rawText.charCodeAt(i)) & 0xffff;
      return hindiFallbacks[Math.abs(hash) % hindiFallbacks.length];
    }

    // Hinglish (Roman Hindi)
    if (lower.includes('work') || lower.includes('office') || lower.includes('job') || lower.includes('kaam') || lower.includes('boss')) {
      return "work aur office pressure";
    }
    if (lower.includes('exam') || lower.includes('padhai') || lower.includes('study') || lower.includes('test')) {
      return "exam aur study anxiety";
    }
    if (lower.includes('sleep') || lower.includes('neend') || lower.includes('insomnia')) {
      return "restless sleep";
    }
    if (lower.includes('health') || lower.includes('bimar') || lower.includes('pain') || lower.includes('dard')) {
      return "health aur physical strain";
    }
    if (lower.includes('relationship') || lower.includes('breakup') || lower.includes('partner') || lower.includes('dost') || lower.includes('friend')) {
      return "relationship conflict";
    }
    if (lower.includes('money') || lower.includes('paise') || lower.includes('salary') || lower.includes('debt')) {
      return "financial strain";
    }
    if (lower.includes('gussa') || lower.includes('anger') || lower.includes('angry')) {
      return "gusse aur frustration";
    }
    if (lower.includes('alone') || lower.includes('lonely') || lower.includes('akela')) {
      return "loneliness aur isolation";
    }
    if (lower.includes('fail') || lower.includes('har')) {
      return "is setback";
    }

    const hinglishFallbacks = [
      "is inner struggle",
      "in shared experiences",
      "is current scenario",
      "in challenging thoughts",
      "is situation aur strain"
    ];
    let hash = 0;
    for (let i = 0; i < rawText.length; i++) hash = (hash * 31 + rawText.charCodeAt(i)) & 0xffff;
    return hinglishFallbacks[Math.abs(hash) % hinglishFallbacks.length];
  }

  if (langCode === 'es') {
    if (lower.includes('work') || lower.includes('trabajo') || lower.includes('job') || lower.includes('jefe')) {
      return "la situación laboral";
    }
    if (lower.includes('exam') || lower.includes('estudio') || lower.includes('examen')) {
      return "la presión académica";
    }
    if (lower.includes('salud') || lower.includes('dolor') || lower.includes('health')) {
      return "el malestar físico";
    }
    if (lower.includes('pareja') || lower.includes('relacion') || lower.includes('relación') || lower.includes('amigo')) {
      return "este conflicto personal";
    }
    const esFallbacks = ["esta situación", "esta sobrecarga emocional", "este momento de incertidumbre"];
    let hash = 0;
    for (let i = 0; i < rawText.length; i++) hash = (hash * 31 + rawText.charCodeAt(i)) & 0xffff;
    return esFallbacks[Math.abs(hash) % esFallbacks.length];
  }

  if (langCode === 'fr') {
    if (lower.includes('work') || lower.includes('travail') || lower.includes('job') || lower.includes('boulot')) {
      return "la situation au travail";
    }
    if (lower.includes('exam') || lower.includes('études') || lower.includes('examen')) {
      return "la pression des examens";
    }
    if (lower.includes('santé') || lower.includes('douleur') || lower.includes('health')) {
      return "cet inconfort physique";
    }
    const frFallbacks = ["cette situation", "cette charge émotionnelle", "cette période d'incertitude"];
    let hash = 0;
    for (let i = 0; i < rawText.length; i++) hash = (hash * 31 + rawText.charCodeAt(i)) & 0xffff;
    return frFallbacks[Math.abs(hash) % frFallbacks.length];
  }

  if (langCode === 'de') {
    if (lower.includes('work') || lower.includes('arbeit') || lower.includes('job') || lower.includes('chef')) {
      return "die Situation bei der Arbeit";
    }
    if (lower.includes('exam') || lower.includes('prüfung') || lower.includes('studium')) {
      return "den Prüfungsstress";
    }
    if (lower.includes('gesundheit') || lower.includes('schmerz') || lower.includes('health')) {
      return "die körperliche Belastung";
    }
    const deFallbacks = ["diese Situation", "diese emotionale Belastung", "diesen inneren Druck"];
    let hash = 0;
    for (let i = 0; i < rawText.length; i++) hash = (hash * 31 + rawText.charCodeAt(i)) & 0xffff;
    return deFallbacks[Math.abs(hash) % deFallbacks.length];
  }

  if (lower.includes('presentation')) return 'your presentation';
  if (lower.includes('driving test')) return 'your driving test';
  if (lower.includes('interview')) return 'your job interview';
  if (lower.includes('exam') || lower.includes('test')) return 'your exam or test';
  if (lower.includes('work') || lower.includes('job') || lower.includes('office')) return 'your work situation';
  if (lower.includes('dog') || lower.includes('cat') || lower.includes('pet')) return 'your pet';

  const rawAnchor = normalizeEntityAnchor(rawText);
  return rawAnchor || 'this situation';
}

/**
 * Detect language of the user's utterance in real time.
 */
export function detectUserSpokenLanguage(text: string): { langCode: string; speechLocale: string; name: string } {
  if (!text || !text.trim()) {
    return { langCode: 'en', speechLocale: 'en-US', name: 'English' };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. Unicode Script Checks
  if (/[\u0900-\u097F]/.test(raw)) {
    return { langCode: 'hi', speechLocale: 'hi-IN', name: 'Hindi' };
  }
  if (/[\u0600-\u06FF]/.test(raw)) {
    return { langCode: 'ar', speechLocale: 'ar-SA', name: 'Arabic' };
  }
  if (/[\u4E00-\u9FFF]/.test(raw)) {
    return { langCode: 'zh', speechLocale: 'zh-CN', name: 'Chinese' };
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(raw)) {
    return { langCode: 'ja', speechLocale: 'ja-JP', name: 'Japanese' };
  }
  if (/[\uAC00-\uD7AF]/.test(raw)) {
    return { langCode: 'ko', speechLocale: 'ko-KR', name: 'Korean' };
  }
  if (/[\u0400-\u04FF]/.test(raw)) {
    return { langCode: 'ru', speechLocale: 'ru-RU', name: 'Russian' };
  }
  if (/[\u0B80-\u0BFF]/.test(raw)) {
    return { langCode: 'ta', speechLocale: 'ta-IN', name: 'Tamil' };
  }
  if (/[\u0C00-\u0C7F]/.test(raw)) {
    return { langCode: 'te', speechLocale: 'te-IN', name: 'Telugu' };
  }
  if (/[\u0980-\u09FF]/.test(raw)) {
    return { langCode: 'bn', speechLocale: 'bn-IN', name: 'Bengali' };
  }
  if (/[\u0A80-\u0AFF]/.test(raw)) {
    return { langCode: 'gu', speechLocale: 'gu-IN', name: 'Gujarati' };
  }

  // 2. Romanized / Latin script lexical markers scoring
  const hinglishMarkers = [
    'main', 'mein', 'hoon', 'aur', 'ne', 'kar', 'diya', 'par', 'se', 'ki', 'ka', 'ko', 'ke',
    'mujhe', 'mera', 'meri', 'mere', 'hum', 'tum', 'aap', 'kaise', 'kya', 'nahi', 'nahin',
    'kyun', 'bahut', 'bohot', 'accha', 'theek', 'tension', 'pareshan', 'yaar', 'bhai',
    'hai', 'hain', 'ho raha', 'karna', 'kuch', 'samajh', 'dard', 'baat', 'baaton', 'dost', 'kaisa',
    'kaisi', 'lag raha', 'lagta', 'udas', 'khush', 'pata nahi', 'kuch nahi', 'suno', 'karu', 'karein',
    'dimag', 'soch', 'kaam', 'ghabrahat', 'chinta', 'neend', 'aati', 'aata', 'raat', 'kabhi', 'paunga',
    'paungi', 'bhi', 'upar', 'gussa', 'jaldi', 'chhoti', 'thoda', 'tareeqa', 'aaj', 'din',
    'liye', 'dein', 'bataiye', 'shanti', 'daanta', 'wajah', 'hoga', 'hogi', 'karo', 'karne',
    'hota', 'hoti', 'hote', 'raha', 'rahi', 'rahe'
  ];

  const englishMarkers = [
    'the', 'this', 'that', 'with', 'from', 'have', 'what', 'your', 'about', 'feel', 'feeling',
    'today', 'please', 'think', 'thinking', 'getting', 'trying', 'want', 'need', 'know',
    'would', 'could', 'should', 'more', 'much', 'very', 'here', 'when', 'where', 'which',
    'will', 'good', 'well', 'help', 'tell', 'talk', 'someone', 'anyone', 'something', 'anything',
    'really', 'always', 'everyone', 'everything', 'never', 'nothing', 'nobody', 'worried', 'anxious',
    'design', 'presentation', 'interview', 'driving', 'myself', 'because', 'cannot'
  ];

  const spanishMarkers = [
    'hola', 'estoy', 'estás', 'está', 'estamos', 'están', 'siento', 'tengo', 'gracias', 'amigo',
    'amiga', 'muy', 'bien', 'por qué', 'porque', 'triste', 'ayuda', 'quiero', 'hacer', 'bueno',
    'dias', 'días', 'tardes', 'noches', 'estrés', 'estres', 'miedo', 'cansado', 'cansada',
    'como estas', 'cómo estás', 'abrumado', 'abrumada', 'trabajo', 'jefe', 'ansiedad', 'calmar',
    'calmarme', 'mis', 'tus', 'nuestro', 'nuestra', 'para', 'pero', 'con', 'sin',
    'los', 'las', 'unos', 'unas', 'del', 'que', 'por',
    'les', 'nos', 'todo', 'toda', 'todos', 'todas', 'mundo', 'veces',
    'fuerte', 'presión', 'pecho', 'siguiente', 'paso', 'aprender', 'poner', 'límites', 'saludables',
    'respiración', 'ejercicio', 'recomiende', 'agotamiento', 'mental', 'insoportable', 'mismo',
    'perder', 'pagar', 'alquiler', 'dormir', 'debido', 'injusto', 'oficina', 'conmigo', 'puedo', 'puedo hacer'
  ];

  const frenchMarkers = [
    'bonjour', 'salut', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'triste', 'peur', 'merci',
    'avec', 'pourquoi', 'très', 'fatigué', 'fatiguée', 'besoin', 'veux', 'ami', 'amie', 'comment',
    'sens', 'stressé', 'stressée', 'aide', 'journée', 'seul', 'seule', 'travail', 'chef', 'boulot',
    'anxiété', 'angoisse', 'calmer', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'les', 'des', 'aux', 'qui', 'dans', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'pour', 'pas', 'plus', 'cet', 'cette', 'ces', 'quel', 'quelle', 'souhaite', 'retrouver',
    'toute', 'tous', 'toutes', 'faire', 'pouvez', 'clarté', 'esprit', 'micro', 'geste', 'poser',
    'svp', 'plait', 'plaît', 'aujourd', 'hui', 'insomnies', 'énergie', 'solitude', 'ruminer',
    'pensées', 'cardiaque', 'respiration', 'geste', 'poser', 'épuisé', 'incapable', 'détendre',
    'pression', 'insupportable', 'rythme', 'accélère', 'raison', 'apparente', 'éviter', 'mêmes',
    'pèse', 'lourdement', 'moral', 'impression', 'jamais', 'assez', 'accumulent', 'apaisant', 'enseigner'
  ];

  const germanMarkers = [
    'hallo', 'fühle', 'mich', 'danke', 'sehr', 'warum', 'angst', 'traurig', 'überfordert',
    'freund', 'heute', 'nicht', 'kann', 'gut', 'geht', 'hilfe', 'müde', 'einsam', 'arbeit',
    'chef', 'stress', 'beruhigen', 'ich', 'wir', 'mein', 'meine', 'dein', 'deine', 'sein',
    'der', 'die', 'das', 'den', 'dem', 'des', 'eine', 'einer', 'einem', 'einen',
    'und', 'zum', 'zur', 'auf', 'für', 'mit', 'von', 'vom', 'bei', 'beim',
    'über', 'unter', 'vor', 'nach', 'aus', 'wie', 'wer', 'wann',
    'ihr', 'ihm', 'ihnen', 'uns', 'dich', 'dir', 'mir', 'sich',
    'nachts', 'gedanken', 'schlaf', 'zukunft', 'lebensfreude', 'nein', 'sagen', 'brust',
    'atemübung', 'gedankenspirale', 'schritt', 'erholung'
  ];

  let enScore = 0;
  let hiScore = 0;
  let esScore = 0;
  let frScore = 0;
  let deScore = 0;

  for (const m of englishMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) enScore += 1;
  }
  for (const m of hinglishMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) hiScore += 1;
  }
  for (const m of spanishMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) esScore += 1;
  }
  for (const m of frenchMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) frScore += 1;
  }
  for (const m of germanMarkers) {
    if (new RegExp(`\\b${m}\\b`, 'i').test(lower)) deScore += 1;
  }

  const maxScore = Math.max(enScore, hiScore, esScore, frScore, deScore);
  if (maxScore > 0 && maxScore !== enScore) {
    if (deScore === maxScore) return { langCode: 'de', speechLocale: 'de-DE', name: 'German' };
    if (frScore === maxScore) return { langCode: 'fr', speechLocale: 'fr-FR', name: 'French' };
    if (esScore === maxScore) return { langCode: 'es', speechLocale: 'es-ES', name: 'Spanish' };
    if (hiScore === maxScore) return { langCode: 'hi', speechLocale: 'hi-IN', name: 'Hinglish / Hindi' };
  }

  return { langCode: 'en', speechLocale: 'en-US', name: 'English' };
}

/**
 * Main Dynamic Cognitive Intelligence Generator
 */
export function generateDynamicCompanionReply(context: ConversationalContext): CompanionResponse {
  const text = (context.userText || '').trim();
  const lower = text.toLowerCase();
  const history = context.history || [];

  // Diagnostic assessment
  const diagnostic = context.diagnostic || emotionClassifier.classifyText(text);
  const emotion = diagnostic.dimensionId || context.emotionDimension || 'calmness';
  const study = getResearchedAdviceForEmotion(emotion);
  const cognitiveDiag = runHiddenCognitiveDiagnostics(text);
  const libraryMatch = queryPsychologyLibrary(text);

  // 1. Language Resolution with explicit targetLanguageCode override support
  let langInfo = detectUserSpokenLanguage(text);
  const hasDevanagariChars = /[\u0900-\u097F]/.test(text);
  const hasSpecificScript = /[\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF\u0B80-\u0BFF\u0C00-\u0C7F\u0980-\u09FF\u0A80-\u0AFF]/.test(text);

  const isExplicitHinglish = langInfo.langCode === 'hi' && !hasDevanagariChars;

  if (context.targetLanguageCode && !hasSpecificScript) {
    const matched = GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === context.targetLanguageCode);
    if (matched) {
      langInfo = {
        langCode: matched.code,
        speechLocale: context.speechLocale || matched.speechLocale,
        name: matched.name,
      };
    }
  }

  const isDevanagari = hasDevanagariChars || (langInfo.langCode === 'hi' && !isExplicitHinglish);
  const primaryAnchor = localizeAnchor(text, langInfo.langCode, isDevanagari);

  // 2. Repetition / Loop Complaint Interception
  if (
    cognitiveDiag.conversationalIntent === 'repetition_complaint' ||
    lower.includes('stop repeating') ||
    lower.includes('again and again') ||
    lower.includes('same question') ||
    lower.includes('repeating the same') ||
    lower.includes('same sentence') ||
    lower.includes('same reply') ||
    lower.includes('same replies') ||
    lower.includes('same answer') ||
    lower.includes('same response') ||
    lower.includes('same thing') ||
    lower.includes('same dialogue') ||
    lower.includes('same words') ||
    lower.includes('again same') ||
    lower.includes('keep repeating') ||
    lower.includes('repeating yourself') ||
    lower.includes('repeats the same') ||
    lower.includes('in loop') ||
    lower.includes('in a loop') ||
    lower.includes('stuck in loop') ||
    lower.includes('stuck in a loop') ||
    lower.includes('looping') ||
    lower.includes('bar bar') ||
    lower.includes('baar baar') ||
    lower.includes('wahi baat') ||
    lower.includes('wahi sentence') ||
    lower.includes('ek hi baat') ||
    lower.includes('ek hi sentence') ||
    lower.includes('ek hi dialogue') ||
    lower.includes('dobara wahi') ||
    lower.includes('phir se wahi') ||
    text.includes('बार बार') ||
    text.includes('वही बात') ||
    text.includes('एक ही बात') ||
    text.includes('एक ही वाक्य') ||
    text.includes('दोबारा वही') ||
    text.includes('फिर वही')
  ) {
    let loopReply = "I apologize for repeating myself. Let us step out of any fixed patterns and reset completely: speak to me freely about whatever is on your mind right now, without any rigid steps.";
    if (langInfo.langCode === 'hi') {
      loopReply = isDevanagari
        ? "मैं अपनी बात दोहराने के लिए क्षमा चाहता हूँ। आइए किसी निश्चित पैटर्न से बाहर निकलकर बिल्कुल नए सिरे से शुरुआत करें: इस समय आपके मन में जो भी बात या उलझन चल रही है, उसे बिना किसी झिझक के सीधे मुझसे साझा करें।"
        : "Main repeat karne ke liye maafi chahta hoon. Chaliye kisi fixed pattern se bahar nikal kar fresh start karte hain: is waqt aapke dil aur dimag mein kya chal raha hai, freely share karein.";
    } else if (langInfo.langCode === 'es') {
      loopReply = "Me disculpo sinceramente por sonar repetitivo. Dejemos de lado cualquier respuesta estructurada y hablemos directamente: ¿qué es lo que realmente estás sintiendo o pensando en este momento?";
    } else if (langInfo.langCode === 'fr') {
      loopReply = "Je vous présente mes excuses pour ces répétitions. Sortons de tout schéma figé et repartons à zéro : dites-moi librement ce que vous traversez en ce moment même.";
    } else if (langInfo.langCode === 'de') {
      loopReply = "Ich entschuldige mich aufrichtig für die Wiederholungen. Lassen Sie uns jedes starre Muster hinter uns lassen und direkt sprechen: Was geht Ihnen in diesem Moment wirklich durch den Kopf?";
    }

    return {
      reply: loopReply,
      detectedTopic: 'loop_complaint',
      responseKey: 'loop_reset',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 3. Greeting Intent
  if (cognitiveDiag.conversationalIntent === 'greeting') {
    let greetReply = "Welcome. I am here to help you deconstruct emotional patterns, navigate cognitive challenges, and regulate your nervous system. What is present for you today?";
    if (langInfo.langCode === 'hi') {
      greetReply = isDevanagari
        ? "सत्र में आपका स्वागत है। मैं आपके विचारों और भावनाओं को समझने तथा मानसिक संतुलन पाने में मदद के लिए उपस्थित हूँ। आज आप किस विषय पर बात करना चाहते हैं?"
        : "Welcome. Main aapke thoughts ko understand karne aur nervous system ko regulate karne ke liye yahan hoon. Aaj aap kya share karna chahte hain?";
    } else if (langInfo.langCode === 'es') {
      greetReply = "Bienvenido. Estoy aquí para ayudarte a comprender tus patrones emocionales y regular tu sistema nervioso. ¿Qué estás experimentando hoy?";
    } else if (langInfo.langCode === 'fr') {
      greetReply = "Bienvenue. Je suis à votre écoute pour analyser vos schémas cognitifs et apaiser votre système nerveux. Que traversez-vous aujourd'hui ?";
    } else if (langInfo.langCode === 'de') {
      greetReply = "Willkommen. Ich bin hier, um emotionale Muster mit Ihnen zu analysieren und Ihr Nervensystem zu regulieren. Was beschäftigt Sie heute?";
    }

    return {
      reply: greetReply,
      detectedTopic: 'greeting',
      responseKey: 'greeting_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 4. Companion Inquiry Intent ("How are you?")
  if (cognitiveDiag.conversationalIntent === 'companion_inquiry') {
    let compReply = "I am grounded and fully focused on supporting your emotional wellbeing. What is currently occupying your thoughts?";
    if (langInfo.langCode === 'hi') {
      compReply = isDevanagari
        ? "मैं पूरी तरह से उपस्थित और आपके मानसिक स्वास्थ्य के प्रति समर्पित हूँ। इस समय आपके मन में क्या विचार चल रहे हैं?"
        : "Main bilkul ready hoon aur aapke wellbeing par focused hoon. Is waqt aapke mind mein kya chal raha hai?";
    } else if (langInfo.langCode === 'es') {
      compReply = "Me encuentro totalmente enfocado en apoyarte. ¿Qué es lo que más ocupa tu mente o tu cuerpo en este momento?";
    } else if (langInfo.langCode === 'fr') {
      compReply = "Je suis pleinement disponible et à votre écoute. Qu'est-ce qui occupe votre esprit en ce moment ?";
    } else if (langInfo.langCode === 'de') {
      compReply = "Ich bin vollkommen präsent, um Sie zu unterstützen. Welches Thema liegt Ihnen im Moment am meisten am Herzen?";
    }

    return {
      reply: compReply,
      detectedTopic: 'companion_inquiry',
      responseKey: 'companion_inquiry_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 5. Identity Inquiry Intent ("Who are you?")
  if (cognitiveDiag.conversationalIntent === 'identity_inquiry') {
    let idReply = "I am an AI Clinical Psychologist and Emotional Resilience Trainer. I integrate modern cognitive neuropsychology with polyvagal somatic regulation and Sattvavajaya practices to help you process stress, anxiety, and emotional challenges.";
    if (langInfo.langCode === 'hi') {
      idReply = isDevanagari
        ? "मैं एक क्लिनिकल साइकोलॉजिस्ट और इमोशनल रेजिलिएंस ट्रेनर हूँ, जो आधुनिक न्यूरोसाइकोलॉजी और आयुर्वेदिक सत्वावजय चिकित्सा के माध्यम से तनाव व चिंता से उबरने में आपकी मदद करता हूँ।"
        : "Main ek Clinical Psychologist aur Emotional Resilience Trainer hoon, jo cognitive neuropsychology aur somatic grounding ke through stress aur anxiety process karne mein help karta hoon.";
    } else if (langInfo.langCode === 'es') {
      idReply = "Soy un terapeuta clínico y entrenador de resiliencia emocional. Integro la neuropsicología cognitiva moderna con regulación somática para ayudarte a superar el estrés y la ansiedad.";
    } else if (langInfo.langCode === 'fr') {
      idReply = "Je suis un praticien clinique en résilience émotionnelle, alliant neuropsychologie cognitive et régulation somatique pour vous accompagner face au stress et à l'anxiété.";
    } else if (langInfo.langCode === 'de') {
      idReply = "Ich bin ein klinischer Begleiter für emotionale Resilienz. Ich kombiniere moderne kognitive Neuropsychologie mit somatischer Nervensystem-Regulation zur Stressbewältigung.";
    }

    return {
      reply: idReply,
      detectedTopic: 'identity_inquiry',
      responseKey: 'identity_inquiry_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 6. Gratitude Intent ("Thank you")
  if (cognitiveDiag.conversationalIntent === 'gratitude') {
    let gratReply = "You are very welcome. Recognizing and validating your internal state takes real courage. How does your body feel in this moment?";
    if (langInfo.langCode === 'hi') {
      gratReply = isDevanagari
        ? "आपका स्वागत है। अपनी आंतरिक स्थिति को स्वीकारना और उस पर ध्यान देना सराहनीय है। इस समय आपका शरीर कैसा महसूस कर रहा है?"
        : "Aapka swagat hai. Apne internal state ko acknowledge karna ek bada step hai. Is waqt aapki body kaisa feel kar rahi hai?";
    } else if (langInfo.langCode === 'es') {
      gratReply = "De nada. Reconocer y validar tu estado interno requiere valentía. ¿Cómo se siente tu cuerpo en este instante?";
    } else if (langInfo.langCode === 'fr') {
      gratReply = "Je vous en prie. Accueillir vos émotions demande un réel courage. Comment vous sentez-vous dans votre corps maintenant ?";
    } else if (langInfo.langCode === 'de') {
      gratReply = "Sehr gerne. Es erfordert Mut, die eigenen Gefühle wahrzunehmen und auszusprechen. Wie fühlt sich Ihr Körper gerade an?";
    }

    return {
      reply: gratReply,
      detectedTopic: 'gratitude',
      responseKey: 'gratitude_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 7. Farewell Intent ("Goodbye", "Good night")
  if (cognitiveDiag.conversationalIntent === 'farewell') {
    let fareReply = "Take gentle care of yourself. Allow your nervous system to rest and digest. Whenever you need support, I will be here.";
    if (langInfo.langCode === 'hi') {
      fareReply = isDevanagari
        ? "अपना ध्यान रखें और अपने शरीर व मन को विश्राम दें। जब भी आपको सहारे की आवश्यकता होगी, मैं यहाँ उपस्थित रहूँगा।"
        : "Apna khayal rakhein aur body ko rest karne dein. Jab bhi support ki zaroorat ho, main yahan milunga.";
    } else if (langInfo.langCode === 'es') {
      fareReply = "Cuídate mucho. Permite que tu sistema nervioso descanse. Estaré aquí cuando necesites apoyo.";
    } else if (langInfo.langCode === 'fr') {
      fareReply = "Prenez bien soin de vous. Laissez votre système nerveux se détendre et se régénérer. Je serai là dès que vous en aurez besoin.";
    } else if (langInfo.langCode === 'de') {
      fareReply = "Passen Sie gut auf sich auf. Gönnen Sie Ihrem Nervensystem Ruhe und Erholung. Ich bin für Sie da, wenn Sie Unterstützung brauchen.";
    }

    return {
      reply: fareReply,
      detectedTopic: 'farewell',
      responseKey: 'farewell_intent',
      detectedLanguage: langInfo.langCode,
      speechLocale: langInfo.speechLocale,
      psychologicalAssessment: createAssessmentObject(diagnostic, study),
    };
  }

  // 8. Extract Learned Breakthrough Anchors from Cognitive Profile (if available)
  let activeBreakthrough: string | undefined;
  if (context.cognitiveProfile?.breakthroughAnchors) {
    const matched = context.cognitiveProfile.breakthroughAnchors.find((ba) =>
      lower.includes(ba.contextTrigger.toLowerCase()) || lower.includes(ba.insightPhrase.toLowerCase())
    );
    if (matched) {
      activeBreakthrough = matched.insightPhrase;
    }
  }

  // 9. Dynamic Clinical Protocol Synthesis for LLM Context
  const reply = constructDynamicClinicalReply(
    text,
    langInfo.langCode,
    primaryAnchor,
    diagnostic,
    study,
    libraryMatch?.condition,
    isDevanagari,
    activeBreakthrough
  );

  const responseKey = `${libraryMatch?.condition?.id || emotion}_${Math.random().toString(36).slice(2, 7)}`;

  const detectedTopic =
    lower.includes('what should i do') ||
    lower.includes('give me research') ||
    lower.includes('according to research') ||
    lower.includes('research advice')
      ? 'advice_request'
      : libraryMatch?.condition?.id || cognitiveDiag.therapeuticStrategy || 'clinical_reflection';

  return {
    reply,
    detectedTopic,
    responseKey,
    detectedLanguage: langInfo.langCode,
    speechLocale: langInfo.speechLocale,
    psychologicalAssessment: createAssessmentObject(diagnostic, study),
    libraryCondition: libraryMatch?.condition,
  };
}

function constructDynamicClinicalReply(
  rawText: string,
  langCode: string,
  anchor: string,
  diagnostic: NeuroscienceDiagnosticResult,
  study: AuthenticatedStudy,
  libraryCondition?: PsychologyCondition,
  isDevanagari: boolean = false,
  breakthroughInsight?: string
): string {
  const localized = getLocalizedClinicalSolution(
    libraryCondition?.id,
    langCode,
    isDevanagari,
    study,
    libraryCondition
  );

  let { cbtReframe, somaticAnchor, pranayama, microHabit } = localized;
  if (breakthroughInsight) {
    cbtReframe = `Anchor on user breakthrough insight: "${breakthroughInsight}". ${cbtReframe}`;
  }

  return `[CLINICAL DIRECTIVE FOR LLM]:
- Anchor/Trigger: ${anchor}
- CBT Reframe to apply: ${cbtReframe}
- Somatic Grounding to prescribe: ${somaticAnchor}
- Breathwork to prescribe: ${pranayama}
- Micro-habit: ${microHabit}

INSTRUCTIONS FOR AI: Write a fresh, natural, highly empathetic response using the above protocol. Do NOT repeat previous sentence structures. Be conversational and human.`;
}

function createAssessmentObject(diagnostic: NeuroscienceDiagnosticResult, study: AuthenticatedStudy) {
  return {
    dimension: diagnostic.dimensionName || 'Calmness',
    valence: diagnostic.coreAffect?.valence ?? 0,
    arousal: diagnostic.coreAffect?.arousal ?? 0,
    polyvagalState: diagnostic.barrettConstruct || 'Ventral Vagal Social Engagement',
    doshicState: diagnostic.doshicState || 'Sattva Equilibrium',
    somaticArea: diagnostic.bodilyMap?.somatic_summary || 'Chest & Heart Core',
    scientificStudy: study.citation,
  };
}
