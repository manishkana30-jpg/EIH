/**
/**
 * Clinical Situational Problem Extractor & Empathic Reflection Engine
 * 
 * Provides:
 * 1. Deep detection of concrete human dilemmas (bereavement, job loss, breakup, debt,
 *    toxic workplace, exam dread, insomnia, panic attacks, loneliness, shame, etc.).
 * 2. Multi-lingual situational descriptions in English, Hindi (Devanagari & Romanized Hinglish),
 *    Spanish, French, and German.
 * 3. Warm, clinically grounded empathic opening sentences that explicitly mirror back
 *    the user's specific problem before presenting interventions.
 * 4. Contextual dynamic extraction for unlisted or novel situations, ensuring the AI
 *    never defaults to generic "mental challenge" or "emotional turmoil".
 */

export type ProblemCategory =
  | 'grief_bereavement'
  | 'job_loss'
  | 'housing_crisis'
  | 'breakup_heartbreak'
  | 'financial_debt'
  | 'exam_interview'
  | 'toxic_workplace'
  | 'insomnia_sleep'
  | 'panic_somatic'
  | 'loneliness_isolation'
  | 'family_conflict'
  | 'shame_imposter'
  | 'adhd_paralysis'
  | 'social_anxiety'
  | 'ocd_rumination'
  | 'burnout_exhaustion'
  | 'general_distress';

export interface SpecificProblemDetails {
  category: ProblemCategory;
  /** Concrete noun phrase describing the exact problem (e.g. "अपने किसी प्रियजन को खोने का गहरा दुःख") */
  description: string;
  /** Short prepositional clause for embedding in dialogue (e.g. "प्रियजन के निधन को लेकर") */
  shortClause: string;
  /** Warm clinical mirroring opening sentence naming the problem directly */
  mirroringOpening: string;
  /** Comprehensive summary for diagnostic assessment focus bullet */
  distressSummary: string;
}

export type SupportedLocale = 'en' | 'hi' | 'es' | 'fr' | 'de';

function normalizeLocale(lang?: string): SupportedLocale {
  if (!lang) return 'en';
  const c = lang.toLowerCase().trim().split('-')[0].split('_')[0];
  if (['hi', 'hindi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa', 'ur'].includes(c)) return 'hi';
  if (c === 'es' || c === 'spanish') return 'es';
  if (c === 'fr' || c === 'french') return 'fr';
  if (c === 'de' || c === 'german') return 'de';
  return 'en';
}

interface LocalizedProblemDef {
  description: string;
  shortClause: string;
  distressSummary: string;
}

const PROBLEM_DEFINITIONS: Record<Exclude<ProblemCategory, 'general_distress'>, Record<SupportedLocale, LocalizedProblemDef>> = {
  grief_bereavement: {
    en: {
      description: "the heartbreaking grief, bereavement, and profound loss of losing a loved one",
      shortClause: "the heartbreaking loss and bereavement of losing your loved one",
      distressSummary: "You are enduring the profound heartbreak and grief of losing someone deeply precious to you, carrying a deep ache that touches your entire being and physiological rhythm."
    },
    hi: {
      description: "अपने किसी अत्यंत प्रियजन के निधन, बिछोह और शोक की असहनीय पीड़ा",
      shortClause: "अपने प्रियजन के निधन और शोक के असहनीय दर्द को लेकर",
      distressSummary: "आप अपने किसी अत्यंत प्रियजन (माता/पिता/स्वजन) को खोने के असहनीय शोक और विछोह की गहरी पीड़ा से गुजर रहे हैं, जिसने आपके हृदय और मन को पूरी तरह आहत कर दिया है।"
    },
    es: {
      description: "el dolor lacerante por el fallecimiento y la pérdida irreparable de un ser querido",
      shortClause: "la dolorosa pérdida y el duelo por la partida de tu ser querido",
      distressSummary: "Estás atravesando el profundo dolor y duelo por la partida de un ser querido, una pérdida que resuena intensamente en tu cuerpo y tu paz emocional."
    },
    fr: {
      description: "la douleur déchirante du deuil et la perte irréparable d'un être cher",
      shortClause: "la douloureuse perte et le deuil lié au départ d'un être cher",
      distressSummary: "Vous traversez l'épreuve déchirante du deuil et de la séparation d'avec un être profondément cher, un chagrin qui pèse lourdement sur votre corps et votre esprit."
    },
    de: {
      description: "den tiefen Schmerz der Trauer und den schweren Verlust eines geliebten Menschen",
      shortClause: "den schmerzhaften Verlust und die Trauer um einen geliebten Menschen",
      distressSummary: "Sie durchleben den tiefen Schmerz der Trauer und die schwere Erschütterung über den Verlust eines geliebten Menschen, der Körper und Seele zutiefst berührt."
    }
  },

  job_loss: {
    en: {
      description: "the sudden shock, career crisis, and uncertainty of losing your job and livelihood",
      shortClause: "the sudden loss of your job and livelihood uncertainty",
      distressSummary: "You are facing the acute shock and distress of job loss and career disruption, creating intense apprehension about your financial security and professional future."
    },
    hi: {
      description: "नौकरी छूटने, आजीविका के संकट और भविष्य की अचानक आई अनिश्चितता",
      shortClause: "नौकरी छूटने और आजीविका के संकट को लेकर",
      distressSummary: "आप नौकरी छूटने के अचानक आए आघात, आजीविका के संकट और भविष्य की गहरी अनिश्चितता से जूझ रहे हैं, जिसने आपकी मानसिक शांति और आर्थिक सुरक्षा को हिला दिया है।"
    },
    es: {
      description: "el impacto repentino del despido laboral y la incertidumbre sobre tu sustento",
      shortClause: "la pérdida de tu empleo y la incertidumbre económica",
      distressSummary: "Estás afrontando el impacto repentino de haber perdido tu empleo, generando una profunda inquietud por tu estabilidad económica y tu rumbo profesional."
    },
    fr: {
      description: "le choc soudain de la perte de votre emploi et l'insécurité quant à votre avenir professionnel",
      shortClause: "la perte de votre emploi et les incertitudes professionnelles",
      distressSummary: "Vous faites face au choc soudain de la perte de votre emploi et à une vive incertitude quant à votre subsistance et votre avenir professionnel."
    },
    de: {
      description: "den plötzlichen Schock des Arbeitsplatzverlustes und die existenzielle Unsicherheit",
      shortClause: "den Verlust des Arbeitsplatzes und die berufliche Ungewissheit",
      distressSummary: "Sie sind mit dem Schock einer Kündigung oder dem Verlust Ihres Arbeitsplatzes konfrontiert, was verständlicherweise massive Zukunfts- und Existenzsorgen auslöst."
    }
  },

  housing_crisis: {
    en: {
      description: "the acute crisis and anxiety of housing instability and being told by your landlord to vacate your home",
      shortClause: "the threat of eviction and having to leave your house",
      distressSummary: "You are facing the acute stress and anxiety of housing insecurity and being forced to leave your home, triggering intense survival alarm and upheaval in your daily life."
    },
    hi: {
      description: "मकान मालिक द्वारा घर खाली करने के निर्देश, बेदखली और आशियाने के अचानक आए संकट",
      shortClause: "मकान मालिक द्वारा घर खाली कराने और बेदखली के संकट को लेकर",
      distressSummary: "आप मकान मालिक द्वारा घर खाली करने के निर्देश और आशियाने के अचानक आए गंभीर संकट से जूझ रहे हैं, जिसने आपकी बुनियादी सुरक्षा, मानसिक चैन और जीवन की स्थिरता को हिला दिया है।"
    },
    es: {
      description: "la angustia extrema por la inestabilidad habitacional y la orden de desalojar tu vivienda",
      shortClause: "la amenaza de desalojo y la pérdida de tu hogar",
      distressSummary: "Estás enfrentando la angustia extrema de tener que abandonar tu hogar por orden del propietario, provocando una alarma de supervivencia y una desestabilización profunda."
    },
    fr: {
      description: "la vive détresse liée à la précarité du logement et à l'obligation de quitter votre domicile",
      shortClause: "la menace d'expulsion et l'insécurité du logement",
      distressSummary: "Vous faites face à l'angoisse aiguë de devoir quitter votre logement sur ordre de votre propriétaire, créant une menace directe sur votre sécurité fondamentale."
    },
    de: {
      description: "die akute Existenzkrise durch Wohnungsnot und die Aufforderung des Vermieters, die Wohnung zu räumen",
      shortClause: "die drohende Kündigung der Wohnung und den Verlust des Zuhauses",
      distressSummary: "Sie sind mit der akuten Belastung konfrontiert, Ihre Wohnung auf Verlangen des Vermieters räumen zu müssen, was massive existenzielle Ängste und Unsicherheit auslöst."
    }
  },

  breakup_heartbreak: {
    en: {
      description: "the acute heartbreak, emotional betrayal, and painful grief of your relationship ending",
      shortClause: "the emotional heartbreak and grief of your relationship ending",
      distressSummary: "You are enduring the raw agony of emotional heartbreak and relational grief, where the rupture of love has translated into a palpable physical ache in your chest and psyche."
    },
    hi: {
      description: "रिश्ते के टूटने, बिछड़ने या विश्वासघात से मिला गहरा भावनात्मक आघात और हृदय की पीड़ा",
      shortClause: "रिश्ते के टूटने और बिछड़ने के गहरे दर्द को लेकर",
      distressSummary: "आप विछोह, संबंध टूटने या विश्वासघात के गहरे भावनात्मक आघात से जूझ रहे हैं, जिसका तीव्र दर्द आपके सीने, हृदय और मानसिक शांति में साफ महसूस हो रहा है।"
    },
    es: {
      description: "el dolor lacerante de una ruptura sentimental, el desamor o la traición afectiva",
      shortClause: "el profundo dolor y duelo por la ruptura de tu relación",
      distressSummary: "Estás atravesando el dolor lacerante de una ruptura afectiva y un duelo amoroso que se manifiesta como una punzada física en el pecho y un vacío constante."
    },
    fr: {
      description: "la douleur aiguë d'une rupture amoureuse, du désamour ou d'une trahison affective",
      shortClause: "la déchirure et le chagrin d'une rupture sentimentale",
      distressSummary: "Vous vivez la déchirure d'une rupture amoureuse et un chagrin intense qui se répercute physiquement dans votre poitrine et bouleverse votre équilibre."
    },
    de: {
      description: "den tiefen Herzschmerz, emotionalen Vertrauensbruch und den Schmerz einer Trennung",
      shortClause: "den Herzschmerz und die Trauer über das Ende der Beziehung",
      distressSummary: "Sie durchleben den tiefen Schmerz einer Trennung und akuten Liebeskummer, der sich als körperliche Beklemmung im Brustbereich und seelische Leere äußert."
    }
  },

  financial_debt: {
    en: {
      description: "the crushing anxiety of mounting debts, unpaid bills, and unrelenting financial stress",
      shortClause: "the heavy burden of financial strain and accumulating debt",
      distressSummary: "You are carrying the crushing weight of financial stress and accumulating debts, generating an unrelenting psychological burden that is straining your peace of mind and survival security."
    },
    hi: {
      description: "बढ़ते कर्ज, देनदारियों और आर्थिक तंगी का निरंतर बना हुआ भारी मानसिक दबाव",
      shortClause: "कर्ज, देनदारियों और आर्थिक तंगी के भारी बोझ को लेकर",
      distressSummary: "आप गंभीर आर्थिक समस्याओं, बढ़ते कर्ज और देनदारियों के भारी बोझ से निरंतर मानसिक तनाव में हैं; यह अस्तित्वगत चिंता आपके मन और रातों की नींद पर गहरा दबाव बना रही है।"
    },
    es: {
      description: "la pesada carga de las deudas acumuladas, facturas pendientes y asfixia financiera",
      shortClause: "la pesada carga de problemas financieros y deudas",
      distressSummary: "Estás soportando la pesada carga de problemas financieros y deudas acumuladas, lo que genera una angustia constante por tu estabilidad y bienestar básico."
    },
    fr: {
      description: "le fardeau écrasant de dettes accumulées, de factures impayées et de précarité financière",
      shortClause: "le lourd fardeau des difficultés financières et des dettes",
      distressSummary: "Vous portez le fardeau écrasant de difficultés financières et de dettes accumulées, provoquant une inquiétude permanente pour votre sécurité matérielle."
    },
    de: {
      description: "die erdrückende Sorge vor Schulden, Rechnungen und existenziellen Geldsorgen",
      shortClause: "die schwere Last von Schulden und existenziellen Geldsorgen",
      distressSummary: "Sie tragen die schwere Last finanzieller Probleme und Schulden, was ständige existenzielle Sorgen, Schlafprobleme und anhaltenden mentalen Druck erzeugt."
    }
  },

  exam_interview: {
    en: {
      description: "the intense anticipatory dread, evaluation pressure, and fear of failure in your exam or interview",
      shortClause: "the intense pressure and evaluation dread ahead of your exam or interview",
      distressSummary: "You are preparing for or awaiting results of a high-stakes exam, interview, or milestone, trapped in intense anticipatory dread of failure and decision paralysis."
    },
    hi: {
      description: "आने वाले इंटरव्यू या परीक्षा को लेकर असफलता का तीव्र भय और प्रदर्शन का भारी दबाव",
      shortClause: "आने वाले इंटरव्यू या परीक्षा के तनाव व असफलता के डर को लेकर",
      distressSummary: "आप आने वाली परीक्षा या महत्वपूर्ण इंटरव्यू को लेकर अत्यधिक आशंकित हैं, जहाँ असफलता का डर और प्रदर्शन का भारी दबाव आपके मस्तिष्क को सुन्न और थका रहा है।"
    },
    es: {
      description: "la intensa presión de evaluación, el miedo al fracaso en tus exámenes o entrevistas",
      shortClause: "la tensión y el miedo al fracaso ante tu prueba o entrevista",
      distressSummary: "Te enfrentas a una prueba o entrevista decisiva, experimentando un temor abrumador al fracaso y una parálisis mental que dificulta tu concentración."
    },
    fr: {
      description: "la forte pression d'évaluation et la peur paralysante de l'échec face à un examen ou entretien",
      shortClause: "l'angoisse vive liée à la peur de l'échec lors d'un examen ou entretien",
      distressSummary: "Vous affrontez une échéance importante avec une angoisse vive liée à la peur de l'échec et une hésitation paralysante qui bloque vos facultés."
    },
    de: {
      description: "den enormen Leistungsdruck und die Versagensangst vor einer Prüfung oder einem Vorstellungsgespräch",
      shortClause: "den Druck und die Versagensangst vor Ihrer Prüfung oder dem Vorstellungsgespräch",
      distressSummary: "Sie stehen vor einer wichtigen Prüfung oder einem entscheidenden Gespräch und leiden unter akuter Versagensangst, Nervosität und innerer Blockade."
    }
  },

  toxic_workplace: {
    en: {
      description: "the emotional distress of hostile treatment, workplace harassment, and unfair invalidation by your manager",
      shortClause: "hostile treatment and toxic invalidation at your workplace",
      distressSummary: "You have been subjected to hostile treatment, workplace bullying, or unfair public invalidation by a toxic boss, leaving your nervous system trembling with acute indignation and stress."
    },
    hi: {
      description: "कार्यस्थल पर अपमानजनक व्यवहार, बॉस की डांट-फटकार और विषाक्त माहौल का गहरा तनाव",
      shortClause: "कार्यस्थल पर बॉस के कटु व्यवहार और अपमान को लेकर",
      distressSummary: "कार्यस्थल पर अपमान, डांट-फटकार और बॉस के अनुचित बर्ताव के कारण आपका मन तीव्र तनाव, आहत स्वाभिमान और क्रोध के आंतरिक कंपन से जूझ रहा है।"
    },
    es: {
      description: "el desgaste emocional provocado por un entorno laboral tóxico, maltrato o humillación de tu jefe",
      shortClause: "el maltrato y la hostilidad vivida en tu entorno laboral",
      distressSummary: "Has sufrido maltrato, humillación o descalificación injusta en tu entorno de trabajo, lo que te genera una indignación legítima y una sobrecarga nerviosa constante."
    },
    fr: {
      description: "la souffrance liée à un environnement de travail toxique, aux reproches injustes et à l'agression verbale",
      shortClause: "l'agression verbale et l'injustice subie au travail",
      distressSummary: "Vous avez subi une agression verbale ou un comportement toxique au travail, provoquant une violente onde de stress, d'indignation et de fatigue émotionnelle."
    },
    de: {
      description: "die seelische Belastung durch ein toxisches Arbeitsklima, Schikanen oder ungerechte Vorwürfe",
      shortClause: "die Kränkung und ungerechte Behandlung am Arbeitsplatz",
      distressSummary: "Sie wurden am Arbeitsplatz gekränkt oder ungerecht behandelt, was in Ihnen eine Welle aus Empörung, Anspannung und emotionaler Erschöpfung hinterlassen hat."
    }
  },

  insomnia_sleep: {
    en: {
      description: "the exhausting toll of severe insomnia, chronic sleeplessness, and nighttime racing thoughts",
      shortClause: "severe insomnia and exhausting sleepless nights",
      distressSummary: "You are suffering from debilitating insomnia and chronic sleep deprivation, leaving your nervous system hyper-aroused, your energy depleted, and your mind exhausted."
    },
    hi: {
      description: "कई दिनों से नींद न आने, गंभीर अनिद्रा और रात भर अशांत विचारों के कारण होने वाली शारीरिक व मानसिक थकान",
      shortClause: "लगातार नींद न आने और गंभीर अनिद्रा की परेशानी को लेकर",
      distressSummary: "आप कई दिनों से नींद न आने, गंभीर अनिद्रा और रात भर दौड़ते विचारों के कारण गंभीर मानसिक व शारीरिक थकावट से जूझ रहे हैं; मस्तिष्क को विश्राम न मिल पाना आपकी ऊर्जा निचोड़ रहा है।"
    },
    es: {
      description: "el agotador ciclo de insomnio crónico, noches en vela y sobrecarga de pensamientos nocturnos",
      shortClause: "las noches sin dormir y el insomnio agotador",
      distressSummary: "Estás atrapado en un ciclo agotador de insomnio y noches en vela, donde la hiperactivación mental te impide alcanzar el descanso profundo que tu cuerpo necesita con urgencia."
    },
    fr: {
      description: "le cycle épuisant de l'insomnie chronique, des nuits blanches et de l'hyperactivité mentale nocturne",
      shortClause: "l'insomnie et le manque épuisant de sommeil",
      distressSummary: "Vous subissez un cycle épuisant d'insomnie et de nuits hachées, laissant votre système nerveux en surchauffe et votre vitalité physique profondément diminuée."
    },
    de: {
      description: "den zermürbenden Kreislauf aus chronischer Schlaflosigkeit und nächtlichem Gedankenkreisen",
      shortClause: "die quälende Schlaflosigkeit und die zehrenden Nächte",
      distressSummary: "Sie leiden unter zermürbender Schlaflosigkeit und nächtlichem Gedankenkreisen, was Ihr Nervensystem in ständiger Alarmbereitschaft hält und Ihre Kraftreserven aufzehrt."
    }
  },

  panic_somatic: {
    en: {
      description: "the frightening physical surge of a panic episode, rapid heart palpitations, and health anxiety",
      shortClause: "frightening panic surges, rapid heart racing, and physical distress",
      distressSummary: "You are experiencing a terrifying panic episode with acute heart palpitations, chest tightness, and somatic alarm, where your autonomic nervous system has fired a false emergency response."
    },
    hi: {
      description: "अचानक उठी घबराहट (पैनिक अटैक), दिल की तेज धड़कन और सीने में भारीपन की डरावनी शारीरिक बेचैनी",
      shortClause: "अचानक उठी घबराहट, दिल की तेज धड़कन और सीने की जकड़न को लेकर",
      distressSummary: "आप एक भयानक पैनिक अटैक (अचानक उठी तीव्र घबराहट) और दिल की तेज धड़कन से जूझ रहे हैं, जहाँ शरीर का स्वायत्त तंत्रिका तंत्र अत्यधिक उत्तेजित होकर खतरे का अलार्म बजा रहा है।"
    },
    es: {
      description: "el intenso episodio de pánico físico, taquicardia y alarma corporal que desborda tus sentidos",
      shortClause: "el ataque de pánico y las palpitaciones físicas intensas",
      distressSummary: "Estás experimentando un episodio aterrador de pánico con taquicardia y opresión en el pecho, donde tu sistema nervioso autónomo ha disparado una falsa alarma de peligro extremo."
    },
    fr: {
      description: "la crise d'angoisse aiguë, les palpitations cardiaques soudaines et l'oppression physique anxiogène",
      shortClause: "la crise de panique soudaine et les palpitations cardiaques",
      distressSummary: "Vous traversez une crise d'angoisse aiguë avec palpitations et oppression thoracique, où votre système neurovégétatif s'est emballé dans une réaction d'urgence involontaire."
    },
    de: {
      description: "die beängstigende Panikattacke mit Herzrasen, Engegefühl in der Brust und akuter körperlicher Not",
      shortClause: "die akute Panikattacke und das beängstigende Herzrasen",
      distressSummary: "Sie erleben eine beängstigende Panikattacke mit Herzrasen und Engegefühl in der Brust, bei der Ihr vegetatives Nervensystem einen falschen physiologischen Alarm ausgelöst hat."
    }
  },

  loneliness_isolation: {
    en: {
      description: "the profound emotional ache of deep loneliness, social isolation, and feeling completely on your own",
      shortClause: "painful loneliness and feeling completely disconnected from others",
      distressSummary: "You are carrying the crushing weight of profound emotional loneliness and social isolation, feeling as though you are holding this heavy ache completely by yourself without a supportive presence."
    },
    hi: {
      description: "अकेलेपन, सामाजिक अलगाव और ऐसा महसूस होना कि आपके अंतर्मन के दर्द को साझा करने वाला कोई नहीं है",
      shortClause: "अकेलेपन, अलगाव और किसी का साथ न होने के दर्द को लेकर",
      distressSummary: "आप अकेलेपन और भावनात्मक अलगाव की गहरी पीड़ा महसूस कर रहे हैं, जहाँ ऐसा लग रहा है कि कोई आपकी बात समझने वाला नहीं है और आप इस भारी दर्द को बिल्कुल अकेले ढो रहे हैं।"
    },
    es: {
      description: "el doloroso aislamiento emocional y la sensación de soledad absoluta sin una presencia de apoyo",
      shortClause: "la profunda soledad y la dolorosa desconexión con los demás",
      distressSummary: "Estás experimentando una soledad emocional profunda y aislamiento, sintiendo que llevas este peso sin apoyo cercano ni nadie que comprenda lo que guardas dentro."
    },
    fr: {
      description: "la douloureuse sensation d'isolement social et le sentiment de porter tout cela dans une solitude totale",
      shortClause: "le sentiment douloureux de solitude et d'abandon",
      distressSummary: "Vous ressentez une solitude émotionnelle profonde et un isolement pesant, portant cette peine sans réconfort extérieur avec l'impression d'être seul au monde."
    },
    de: {
      description: "die schmerzhafte Einsamkeit und das Gefühl, mit den eigenen Sorgen vollkommen allein zu sein",
      shortClause: "die schmerzhafte Einsamkeit und das Gefühl des Verlassenseins",
      distressSummary: "Sie erleben tiefe emotionale Einsamkeit und Isolation, mit dem quälenden Gefühl, diese seelische Last ganz allein und unverstanden tragen zu müssen."
    }
  },

  family_conflict: {
    en: {
      description: "the chronic emotional distress of painful family friction, bitter arguments, and domestic discord",
      shortClause: "painful family conflicts and bitter domestic arguments",
      distressSummary: "You are navigating painful family conflict, interpersonal discord, or bitter arguments that have left your emotional boundaries frayed, wounded, and deeply unsettled."
    },
    hi: {
      description: "पारिवारिक कलह, अपनों के साथ कटु मतभेद और घर में निरंतर बने रहने वाले तनाव",
      shortClause: "पारिवारिक कलह, आपसी विवाद और मतभेदों को लेकर",
      distressSummary: "आप पारिवारिक विवाद, कटु कलह और अपनों के साथ आपसी मतभेदों के कारण गहरी मानसिक अशांति और आहत भावनाओं से गुजर रहे हैं, जिसने घर के सुकून को छीन लिया है।"
    },
    es: {
      description: "el constante malestar provocado por conflictos familiares, discusiones amargas y tensión en el hogar",
      shortClause: "los dolorosos conflictos y discusiones en el ámbito familiar",
      distressSummary: "Estás atravesando un doloroso conflicto familiar y discusiones amargas que han dejado tus emociones heridas e intranquilas, resquebrajando tu refugio personal."
    },
    fr: {
      description: "la détresse causée par les conflits familiaux douloureux, les disputes récurrentes et les tensions du foyer",
      shortClause: "les tensions familiales douloureuses et les disputes",
      distressSummary: "Vous traversez des tensions familiales douloureuses et des disputes qui bouleversent votre équilibre émotionnel et créent un climat de division pesant."
    },
    de: {
      description: "die anhaltende Belastung durch familiäre Konflikte, verletzende Streitigkeiten und Spannungen zu Hause",
      shortClause: "die schmerzhaften familiären Streitigkeiten und Spannungen",
      distressSummary: "Sie durchleben schmerzhafte familiäre Auseinandersetzungen und Streitigkeiten, die Ihr seelisches Gleichgewicht stark belasten und das eigene Zuhause zur Belastung machen."
    }
  },

  shame_imposter: {
    en: {
      description: "the punishing cycle of toxic core shame, feelings of unworthiness, and imposter syndrome",
      shortClause: "painful self-doubt, core shame, and feelings of inadequacy",
      distressSummary: "You are caught in a punishing cycle of toxic core shame and imposter syndrome, where an aggressive inner critic convinces you that you are fundamentally inadequate or a failure."
    },
    hi: {
      description: "आत्म-ग्लानि, स्वयं को अयोग्य व असफल मानने और हीनभावना के अंतर्मन में चल रहे गहरे संघर्ष",
      shortClause: "आत्म-ग्लानि, हीनभावना और खुद को असफल मानने के दर्द को लेकर",
      distressSummary: "आप स्वयं को दूसरों से कमतर समझकर आत्म-ग्लानि और हीनभावना के भंवर में फंसे हैं, जहाँ अंतर्मन का आलोचक आपको अयोग्य, असफल और खुद से नफरत करने पर मजबूर कर रहा है।"
    },
    es: {
      description: "el castigo de la autocrítica destructiva, el sentimiento de insuficiencia y el síndrome del impostor",
      shortClause: "los dolorosos sentimientos de autocrítica, culpa e insuficiencia",
      distressSummary: "Estás atrapado en un ciclo implacable de autocrítica destructiva, sintiéndote un fraude o una persona defectuosa, comparándote dolorosamente con los demás."
    },
    fr: {
      description: "le poids de l'autocritique destructrice, le sentiment d'illégitimité et la culpabilité intérieure",
      shortClause: "les doutes douloureux sur vous-même et le sentiment d'illégitimité",
      distressSummary: "Vous êtes enfermé dans une spirale d'autodépréciation sévère, vous sentant illégitime ou incapable, submergé par un sentiment injustifié d'échec personnel."
    },
    de: {
      description: "die zermürbende Selbstabwertung, das Gefühl der Unzulänglichkeit und das Imposter-Syndrom",
      shortClause: "die quälenden Selbstzweifel und das Gefühl des Scheiterns",
      distressSummary: "Sie befinden sich in einer quälenden Spirale aus Selbstverurteilung, fühlen sich unzulänglich oder wie ein Hochstapler und leiden unter massiven Selbstzweifeln."
    }
  },

  adhd_paralysis: {
    en: {
      description: "the paralyzing cognitive overwhelm of executive dysfunction, task paralysis, and mental chaos",
      shortClause: "paralyzing task overwhelm, mental chaos, and executive dysfunction",
      distressSummary: "Your cognitive bandwidth has been swamped by sensory overload, unrelenting task friction, and racing thoughts that resemble an internal hurricane, causing total task paralysis."
    },
    hi: {
      description: "कार्यों के अत्यधिक बोझ, दिमाग में मचे अनियंत्रित विचारों के चक्रवात और मानसिक भटकाव",
      shortClause: "दिमाग में चल रहे विचारों के बवंडर और कार्यों के भारी दबाव को लेकर",
      distressSummary: "अत्यधिक कार्यों, संवेदी उत्तेजनाओं और बेकाबू विचारों के कारण आपका मस्तिष्क एक चक्रवात की तरह अशांत और बिखरा हुआ महसूस हो रहा है, जिससे किसी भी काम को शुरू करना असंभव लग रहा है।"
    },
    es: {
      description: "el bloqueo mental por sobrecarga de tareas, desorganización y pensamientos desbordados",
      shortClause: "el bloqueo mental y la sobrecarga abrumadora de tareas",
      distressSummary: "Tu mente se encuentra desbordada por una tormenta de pensamientos acelerados, tareas pendientes y saturación sensorial, generando una parálisis que impide dar el primer paso."
    },
    fr: {
      description: "la paralysie mentale liée à la surcharge de tâches, à la dispersion et au brouillard cognitif",
      shortClause: "la surcharge mentale et la paralysie face aux tâches",
      distressSummary: "Votre esprit est submergé par un flot incessant de pensées, de tâches et de stimuli, semblable à une tempête mentale incontrôlable qui paralyse toute action."
    },
    de: {
      description: "die mentale Blockade durch Reizüberflutung, Aufgabenüberlastung und rasende Gedankenspiralen",
      shortClause: "die Reizüberflutung und die lähmende Aufgabenüberlastung",
      distressSummary: "Ihr Geist ist völlig überflutet von rasenden Gedanken, unerledigten Aufgaben und Reizen, was sich wie ein innerer Sturm anfühlt und jede klare Handlung blockiert."
    }
  },

  social_anxiety: {
    en: {
      description: "the intense social anxiety, stage fright, and fear of negative evaluation in public interactions",
      shortClause: "intense social anxiety and fear of being negatively evaluated",
      distressSummary: "You are experiencing acute social anxiety and evaluation dread, where the prospect of interacting, speaking in public, or facing scrutiny triggers severe anticipatory tension."
    },
    hi: {
      description: "लोगों के सामने बोलने, सामाजिक मेलजोल और दूसरों के मूल्यांकन को लेकर होने वाली तीव्र घबराहट",
      shortClause: "लोगों के सामने बोलने और सामाजिक मेलजोल की घबराहट को लेकर",
      distressSummary: "आप लोगों के सामने बोलने, सामाजिक समारोहों या दूसरों द्वारा आंके जाने के भय से तीव्र घबराहट और शारीरिक कंपन महसूस कर रहे हैं, जो आपको पीछे हटने पर विवश कर रहा है।"
    },
    es: {
      description: "la intensa ansiedad social, el miedo a hablar en público y el temor al juicio ajeno",
      shortClause: "la intensa ansiedad social y el miedo al juicio de los demás",
      distressSummary: "Estás experimentando una intensa ansiedad social y temor a la evaluación negativa, donde interactuar o hablar frente a otros desencadena una fuerte tensión física y evasión."
    },
    fr: {
      description: "l'anxiété sociale aiguë, le trac de parler en public et la crainte du regard d'autrui",
      shortClause: "l'anxiété sociale vive et la peur du regard des autres",
      distressSummary: "Vous ressentez une anxiété sociale aiguë et une peur vive d'être jugé, ce qui transforme les prises de parole ou les interactions de groupe en épreuves très anxiogènes."
    },
    de: {
      description: "die akute soziale Angst, das Lampenfieber und die Furcht vor der Beurteilung durch andere",
      shortClause: "die soziale Angst und die Furcht vor negativer Bewertung",
      distressSummary: "Sie leiden unter akuter sozialer Angst und Befürchtungen vor der Bewertung durch andere, was bei öffentlichen Auftritten oder Gesprächen zu starker Anspannung führt."
    }
  },

  ocd_rumination: {
    en: {
      description: "the exhausting mental loop of intrusive thoughts, cognitive rumination, and looping worries",
      shortClause: "exhausting looping thoughts and intrusive mental rumination",
      distressSummary: "You are trapped in an exhausting cognitive loop of intrusive thoughts and relentless rumination, where your mind feels hooked on worst-case scenarios without the ability to detach."
    },
    hi: {
      description: "दिमाग में बार-बार आने वाले अनचाहे विचारों (इंट्रूसिव थॉट्स) और अनियंत्रित ओवरथिंकिंग के मानसिक चक्र",
      shortClause: "दिमाग में बार-बार आने वाले अनचाहे विचारों और ओवरथिंकिंग को लेकर",
      distressSummary: "आप दिमाग में बार-बार आने वाले अनचाहे विचारों (इंट्रूसिव थॉट्स) और अनियंत्रित ओवरथिंकिंग के उस थका देने वाले चक्र में फंसे हैं, जहाँ मन किसी भी तरह शांत होना नहीं सीख पा रहा।"
    },
    es: {
      description: "el bucle agotador de pensamientos intrusivos y rumiación mental constante",
      shortClause: "el bucle agotador de pensamientos intrusivos y rumiación",
      distressSummary: "Te encuentras atrapado en un bucle agotador de pensamientos intrusivos y rumiación obsesiva, sintiendo que tu mente se engancha una y otra vez sin poder desconectar."
    },
    fr: {
      description: "la boucle épuisante des pensées intrusives répétitives et des ruminations mentales",
      shortClause: "la boucle épuisante des pensées intrusives et de la rumination",
      distressSummary: "Vous êtes pris au piège d'une boucle mentale épuisante de pensées intrusives et de ruminations constantes, avec l'impression que votre esprit refuse de trouver le repos."
    },
    de: {
      description: "die quälende Gedankenspirale aus aufdringlichen Gedanken und ständigem Grübeln",
      shortClause: "die quälende Gedankenspirale und das ständige Grübeln",
      distressSummary: "Sie befinden sich in einer zermürbenden Gedankenspirale aus aufdringlichen Gedanken und ständigem Grübeln, aus der sich der Geist willentlich kaum befreien kann."
    }
  },

  burnout_exhaustion: {
    en: {
      description: "the deep systemic burnout, nervous system depletion, and physical exhaustion from prolonged strain",
      shortClause: "severe burnout and profound nervous system exhaustion",
      distressSummary: "You have reached a point of deep neuro-physiological burnout and systemic depletion, where chronic prolonged pressure has completely drained your cognitive and somatic vitality."
    },
    hi: {
      description: "लंबे समय से अत्यधिक काम और मानसिक दबाव के कारण हुआ गंभीर बर्नआउट और ऊर्जा का पूर्ण अभाव",
      shortClause: "गंभीर बर्नआउट और शरीर व मन की पूर्ण थकान को लेकर",
      distressSummary: "लंबे समय से अत्यधिक काम, जिम्मेदारियों और अनवरत मानसिक दबाव के कारण आप गंभीर बर्नआउट की स्थिति में हैं, जहाँ शरीर और मन की ऊर्जा पूरी तरह चुक चुकी है।"
    },
    es: {
      description: "el profundo síndrome de burnout y el agotamiento físico-mental tras una sobrecarga prolongada",
      shortClause: "el profundo agotamiento y el síndrome de burnout",
      distressSummary: "Has llegado a un punto de profundo agotamiento psicofísico y burnout, donde la presión prolongada ha drenado por completo tus reservas de energía y vitalidad."
    },
    fr: {
      description: "l'épuisement professionnel sévère (burnout) et la fatigue chronique du corps et de l'esprit",
      shortClause: "l'épuisement professionnel profond et le burnout",
      distressSummary: "Vous traversez un épuisement sévère et un burnout profond, où une accumulation excessive de stress a vidé vos réserves physiques et mentales de toute vitalité."
    },
    de: {
      description: "das tiefe Burnout und die chronische Erschöpfung des Nervensystems durch dauerhafte Überlastung",
      shortClause: "das tiefe Burnout und die totale Erschöpfung",
      distressSummary: "Sie haben einen Zustand tiefer nervlicher und körperlicher Erschöpfung (Burnout) erreicht, bei dem langanhaltender Dauerstress Ihre gesamten Energiereserven aufgezehrt hat."
    }
  }
};

/**
 * Extracts a dynamic clause from the user's message when standard keyword dictionaries
 * do not match a predefined clinical bucket.
 */
function extractDynamicClause(message: string): string {
  if (!message) return '';
  let cleaned = message.trim();

  // Strip common conversational conversational prefixes
  cleaned = cleaned.replace(/^(hello|hi|hey|please help me|help me|i want to talk about|i am feeling|i feel like|i feel|mujhe lagta hai|meri madad karo|mai pareshan hu|mere sath|aaj mere sath|ayuda|por favor|je ressens|ich fuehle)\b/i, '').trim();
  
  // Cut down to the primary clause before punctuation
  const match = cleaned.match(/^([^.?!,;\n]{8,90})/);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  if (cleaned.length > 70) {
    cleaned = cleaned.slice(0, 67) + '...';
  }

  return cleaned;
}

/**
 * Analyzes the user's message and returns the exact clinical problem category,
 * localized description, and empathic reflection opening.
 */
export function extractSpecificProblemContext(userMessage: string, language?: string): SpecificProblemDetails {
  const norm = normalizeLocale(language);
  const lower = (userMessage || '').toLowerCase();

  let matchedCategory: ProblemCategory = 'general_distress';

  // 1. Grief and Bereavement
  if (
    /(lost my|passed away|died|death|funeral|mourning|grief|grieving|miscarriage|lost someone|lost my mom|lost my mother|lost my dad|lost my father|lost my pet|dog died|cat died)/i.test(lower) ||
    /(गुजर ग|देहांत|निधन|शोक|चले गए|चली गई|माँ नहीं रही|पिताजी नहीं रहे|मर ग|gujar ga|guzar ga|dehant|nidhan|shok|mar gaya|mar gayi|nahi rahe|nahi rahi|pass ho ga)/i.test(lower) ||
    /(falleci|muri|perdida de mi|duelo|luto)/i.test(lower) ||
    /(deces|mort de|perdu mon|perdu ma|deuil)/i.test(lower) ||
    /(verstorben|gestorben|tod von|trauer|verlust mein)/i.test(lower)
  ) {
    matchedCategory = 'grief_bereavement';
  }
  // 2. Job Loss and Career Crisis
  else if (
    /(lost my job|got fired|laid off|layoff|terminated|fired from|unemployed|unemployment|lost work|downsized)/i.test(lower) ||
    /(नौकरी छूट|नौकरी से निकाल|जॉब छूट|जॉब चली|काम छूट|बेरोजगार|naukri chali|naukri choot|job chali|job choot|layoff|berozgar|fire kar diya|nikal diya)/i.test(lower) ||
    /(perdi mi trabajo|me despidieron|sin empleo|despido)/i.test(lower) ||
    /(perdu mon emploi|licencie|chomage|renvoye)/i.test(lower) ||
    /(job verloren|entlassen|arbeitslos|kuendigung)/i.test(lower)
  ) {
    matchedCategory = 'job_loss';
  }
  // 2b. Housing, Eviction & Homelessness Crisis
  else if (
    /(landlord|evict|evicting|evicted|eviction|leave the house|leave my house|vacate the house|vacate|homeless|kicked out|no place to stay|rent dispute|leave this house)/i.test(lower) ||
    /(मकान मालिक|घर खाली|घर से निकाल|रहने की जगह नहीं|किराया|makan malik|ghar khali|ghar se nikal|ghar chhod)/i.test(lower) ||
    /(desalojo|desalojar|propietario me echa|sin casa|sin hogar)/i.test(lower) ||
    /(expulsion du logement|quitter le logement|proprietaire me met dehors|sans abri)/i.test(lower) ||
    /(vermieter|wohnung raeumen|kuendigung der wohnung|obdachlos)/i.test(lower)
  ) {
    matchedCategory = 'housing_crisis';
  }
  // 3. Breakup, Betrayal & Heartbreak
  else if (
    /(broke up|breakup|dumped|partner left|divorce|divorced|separated|cheated on|betrayed me|heartbroken|ex-partner|ex-boyfriend|ex-girlfriend)/i.test(lower) ||
    /(ब्रेकअप|दिल टूट|रिश्ता टूट|छोड़कर चला|छोड़कर चली|धोखा दिया|तलाक|अलग हो गए|breakup|dil toot|chhod kar chala|chhod kar chali|dhokha diya|talaq|alag ho gaye)/i.test(lower) ||
    /(ruptura|rompimos|me dejo|divorcio|engano|infidelidad)/i.test(lower) ||
    /(rupture|separe|quitte|divorce|trompe|infidelite)/i.test(lower) ||
    /(trennung|getrennt|verlassen|scheidung|betrogen)/i.test(lower)
  ) {
    matchedCategory = 'breakup_heartbreak';
  }
  // 4. Financial Crisis & Debt
  else if (
    /(debt|debts|loans|emi|unpaid bills|broke|bankrupt|bankruptcy|financial ruin|can't pay rent|no savings left)/i.test(lower) ||
    /(कर्ज|कर्जा|लोन|उधारी|पैसे की तंगी|कंगाली|आर्थिक तंगी|पैसे नहीं बचे|किस्त|karz|karza|loan|udhari|paise nahi|arthik tangi|kist)/i.test(lower) ||
    /(deuda|deudas|prestamo|sin dinero|quiebra|facturas)/i.test(lower) ||
    /(dette|dettes|emprunt|sans argent|factures|faillite)/i.test(lower) ||
    /(schulden|kredit|kein geld|rechnungen|pleite)/i.test(lower)
  ) {
    matchedCategory = 'financial_debt';
  }
  // 5. Toxic Workplace & Hostile Boss
  else if (
    /(boss yelled|toxic boss|yelled at me|humiliated me|toxic workplace|mobbing|bullied at work|gaslighted|micromanaged)/i.test(lower) ||
    /(बॉस ने डांटा|बॉस का बुरा बर्ताव|ऑफिस में अपमान|कार्यस्थल पर अपमान|boss ne danta|boss ne chillaya|office me beizzati|toxic boss)/i.test(lower) ||
    /(jefe me grito|jefe toxico|acoso laboral|humillado en el trabajo)/i.test(lower) ||
    /(patron toxique|harcelement au travail|humilie par mon patron)/i.test(lower) ||
    /(chef hat mich angeschrien|toxischer chef|mobbing am arbeitsplatz)/i.test(lower)
  ) {
    matchedCategory = 'toxic_workplace';
  }
  // 6. Insomnia & Severe Sleep Deprivation
  else if (
    /(can't sleep|cannot sleep|haven't slept|insomnia|sleepless|waking up at night|no sleep|awake for days)/i.test(lower) ||
    /(नींद नहीं आ रही|नींद नहीं आती|अनिद्रा|सो नहीं पा रहा|सो नहीं पाया|रात भर जाग|neend nahi aa rahi|neend nahi aati|anidra|so nahi pa raha|so nahi paya)/i.test(lower) ||
    /(no puedo dormir|insomnio|noches sin dormir|desvelo)/i.test(lower) ||
    /(ne peux pas dormir|insomnie|nuits blanches|sommeil impossible)/i.test(lower) ||
    /(kann nicht schlafen|schlaflosigkeit|insomnie|schlaflose naechte)/i.test(lower)
  ) {
    matchedCategory = 'insomnia_sleep';
  }
  // 7. Panic Attacks & Somatic Tachycardia
  else if (
    /(panic attack|heart racing|chest tight|pounding heart|can't breathe|palpitations|going to faint|feeling suffocated)/i.test(lower) ||
    /(पैनिक अटैक|दिल बहुत तेज|सीने में जकड़न|सांस फूल|घबराहट का दौरा|dil tezi se|dhak dhak|saans phool|ghabrahat ka daura)/i.test(lower) ||
    /(ataque de panico|palpitaciones|corazon acelerado|opresion en el pecho)/i.test(lower) ||
    /(crise de panique|crise d'angoisse|palpitations|coeur qui bat trop vite)/i.test(lower) ||
    /(panikattacke|herzrasen|beklemmung in der brust|atemnot)/i.test(lower)
  ) {
    matchedCategory = 'panic_somatic';
  }
  // 8. Exam, Interview & Performance Dread
  else if (
    /(exam|interview|viva|test tomorrow|board exam|upsc|placement|evaluation|presentation anxiety|failed exam)/i.test(lower) ||
    /(परीक्षा|इम्तिहान|इंटरव्यू|पेपर|रिजल्ट|pariksha|imtihan|interview|paper|fail hone ka darr)/i.test(lower) ||
    /(examen|evaluacion|entrevista de trabajo|presentacion)/i.test(lower) ||
    /(examen|concours|entretien d'embauche|presentation)/i.test(lower) ||
    /(pruefung|examen|vorstellungsgespraech|praesentation)/i.test(lower)
  ) {
    matchedCategory = 'exam_interview';
  }
  // 9. Loneliness & Deep Social Isolation
  else if (
    /(lonely|loneliness|nobody cares|so alone|isolated|no friends|abandoned|nobody to talk to)/i.test(lower) ||
    /(अकेला|अकेलापन|कोई बात करने वाला नहीं|कोई परवाह नहीं करता|अलगाव|akela|akelapan|koi baat nahi karta|koi parwah nahi)/i.test(lower) ||
    /(soledad|completamente solo|nadie me apoya|aislamiento)/i.test(lower) ||
    /(solitude|tout seul|personne pour me parler|isolement)/i.test(lower) ||
    /(einsam|einsamkeit|ganz allein|niemanden zum reden)/i.test(lower)
  ) {
    matchedCategory = 'loneliness_isolation';
  }
  // 10. Family Conflict & Domestic Friction
  else if (
    /(family fight|parents fighting|argument at home|toxic parents|marital conflict|spouse fight|domestic fight)/i.test(lower) ||
    /(परिवार में झगड़ा|घर में क्लेश|माता-पिता से विवाद|पति-पत्नी में लड़ाई|ghar me klesh|parivar me ladai|mummy papa ka jhagda)/i.test(lower) ||
    /(pelea familiar|discusion con mis padres|conflicto matrimonial)/i.test(lower) ||
    /(dispute familiale|conflit avec mes parents|tensions familiales)/i.test(lower) ||
    /(streit in der familie|aerger mit den eltern|familiäre konflikte)/i.test(lower)
  ) {
    matchedCategory = 'family_conflict';
  }
  // 11. Core Shame & Imposter Syndrome
  else if (
    /(hate myself|total failure|imposter|loser|worthless|not good enough|disgusted with myself|defective)/i.test(lower) ||
    /(खुद से नफरत|असफल|हीनभावना|आत्म-ग्लानि|किसी काम का नहीं|khud se nafrat|mai failure hu|hinbhavna|apradhbodh)/i.test(lower) ||
    /(me odio|fracasado|sindrome del impostor|inutil|no valgo nada)/i.test(lower) ||
    /(je me deteste|un rate|sentiment d'echec|imposteur|sans valeur)/i.test(lower) ||
    /(ich hasse mich|versager|unzulänglich|imposter syndrom|wertlos)/i.test(lower)
  ) {
    matchedCategory = 'shame_imposter';
  }
  // 12. ADHD & Task Paralysis
  else if (
    /(adhd|task paralysis|brain fog|chaos in my head|overwhelmed by tasks|can't start anything|sensory overload)/i.test(lower) ||
    /(दिमाग में बवंडर|काम शुरू नहीं हो रहा|सब बिखरा हुआ|adhd|task paralysis|dimaag me shanti nahi)/i.test(lower) ||
    /(tda|bloqueo mental|paralisis de tareas|caos mental)/i.test(lower) ||
    /(tdah|paralysie d'action|brouillard mental|surcharge mentale)/i.test(lower) ||
    /(adhs|aufgabenlaehmung|gedankenchaos|mentale ueberlastung)/i.test(lower)
  ) {
    matchedCategory = 'adhd_paralysis';
  }
  // 13. Social Anxiety
  else if (
    /(social anxiety|fear of talking to people|public speaking|stage fright|crowd anxiety|afraid of judgment)/i.test(lower) ||
    /(लोगों के सामने बोलने|स्टेज फियर|लोग क्या कहेंगे|चार लोगों में घबराहट|social anxiety|stage fear)/i.test(lower) ||
    /(ansiedad social|miedo a hablar en publico|panico escenico)/i.test(lower) ||
    /(anxiete sociale|peur de parler en public|peur du jugement)/i.test(lower) ||
    /(soziale angst|angst vor menschen|lampenfieber)/i.test(lower)
  ) {
    matchedCategory = 'social_anxiety';
  }
  // 14. OCD & Intrusive Rumination
  else if (
    /(intrusive thoughts|ocd|compulsive thoughts|looping thoughts|can't stop thinking about|rumination)/i.test(lower) ||
    /(अनचाहे विचार|बार-बार वही सोचना|दिमाग में अटक जाना|intrusive thoughts|dimag me atak gaya)/i.test(lower) ||
    /(pensamientos intrusivos|toc|rumiacion constante)/i.test(lower) ||
    /(pensees intrusives|toc|rumination mentale)/i.test(lower) ||
    /(aufdringliche gedanken|zwangsgedanken|staendiges gruebeln)/i.test(lower)
  ) {
    matchedCategory = 'ocd_rumination';
  }
  // 15. Burnout & Deep Exhaustion
  else if (
    /(burned out|burnout|exhausted|drained|no energy left|worked to the bone|chronic fatigue)/i.test(lower) ||
    /(बर्नआउट|पूरी तरह थक चुका|शरीर में जान नहीं|ऊर्जा खत्म|burnout|poori tarah thak chuka)/i.test(lower) ||
    /(burnout|agotamiento extremo|sin energias|exhausto)/i.test(lower) ||
    /(burnout|epuisement professionnel|a bout de forces)/i.test(lower) ||
    /(burnout|voellig erschoepft|ausgebrannt|keine energie)/i.test(lower)
  ) {
    matchedCategory = 'burnout_exhaustion';
  }

  // Predefined Match
  if (matchedCategory !== 'general_distress') {
    const def = PROBLEM_DEFINITIONS[matchedCategory][norm];
    const mirroringOpening = getEmpathicOpening(def.description, norm);
    return {
      category: matchedCategory,
      description: def.description,
      shortClause: def.shortClause,
      mirroringOpening,
      distressSummary: def.distressSummary,
    };
  }

  // Dynamic Clause Fallback
  const dynamicClause = extractDynamicClause(userMessage);
  let description = "";
  let shortClause = "";
  let distressSummary = "";

  if (norm === 'hi') {
    const target = dynamicClause ? `"${dynamicClause}"` : "इस मानसिक व भावनात्मक उथल-पुथल";
    description = `${target} से उत्पन्न मानसिक दबाव और आंतरिक संघर्ष`;
    shortClause = dynamicClause ? `"${dynamicClause}" को लेकर बनी परेशानी` : "इस मानसिक व भावनात्मक उथल-पुथल";
    distressSummary = `आप इस समय ${target} के कारण गहरे मानसिक तनाव और भावनात्मक अशांति से जूझ रहे हैं, जिसने आपके मन और शरीर दोनों के संतुलन को प्रभावित किया है।`;
  } else if (norm === 'es') {
    const target = dynamicClause ? `"${dynamicClause}"` : "esta sobrecarga emocional";
    description = `la situación relacionada con ${target} y su impacto emocional`;
    shortClause = dynamicClause ? `la situación de "${dynamicClause}"` : "esta sobrecarga emocional";
    distressSummary = `Estás experimentando un pico de agitación emocional y tensión interna vinculado a ${target}, afectando directamente tu equilibrio físico y psicológico.`;
  } else if (norm === 'fr') {
    const target = dynamicClause ? `"${dynamicClause}"` : "cette épreuve émotionnelle";
    description = `l'épreuve liée à ${target} et la tension intérieure qu'elle suscite`;
    shortClause = dynamicClause ? `la situation concernant "${dynamicClause}"` : "cette épreuve émotionnelle";
    distressSummary = `Vous traversez une période d'intense tension intérieure et d'inconfort émotionnel en lien avec ${target}, ce qui fragilise temporairement votre équilibre.`;
  } else if (norm === 'de') {
    const target = dynamicClause ? `"${dynamicClause}"` : "diese emotionale Belastung";
    description = `die Belastungssituation im Zusammenhang mit ${target}`;
    shortClause = dynamicClause ? `die Situation bezüglich "${dynamicClause}"` : "diese emotionale Belastung";
    distressSummary = `Sie durchleben eine Phase spürbarer seelischer Belastung und innerer Unruhe im Zusammenhang mit ${target}, die Körper und Geist stark herausfordert.`;
  } else {
    const target = dynamicClause ? `"${dynamicClause}"` : "this emotional distress";
    description = `the distress and emotional weight surrounding ${target}`;
    shortClause = dynamicClause ? `the distress surrounding "${dynamicClause}"` : "this emotional distress";
    distressSummary = `You are carrying a heavy burden of emotional strain and psychological unease related to ${target} that has thrown your mind and physiology into turmoil.`;
  }

  const mirroringOpening = getEmpathicOpening(description, norm);

  return {
    category: 'general_distress',
    description,
    shortClause,
    mirroringOpening,
    distressSummary,
  };
}

/**
 * Generates a compassionate, highly authentic human opening statement that directly
 * names the problem and validates the user before any clinical assessment is displayed.
 */
function getEmpathicOpening(problemDescription: string, norm: SupportedLocale): string {
  if (norm === 'hi') {
    return `मैंने आपकी बात और स्थिति को बहुत ध्यान से सुना और समझा है। ${problemDescription} का सामना करना किसी भी व्यक्ति के लिए अत्यधिक कठिन और मानसिक रूप से थका देने वाला होता है। ऐसी स्थिति में आपके मन और शरीर का अशांत होना पूरी तरह स्वाभाविक है। यहाँ आपकी स्थिति का स्पष्ट विश्लेषण और तुरंत राहत पाने के प्रभावी उपाय दिए गए हैं:`;
  }
  if (norm === 'es') {
    return `He escuchado con total atención lo que estás viviendo. Enfrentar ${problemDescription} es un desafío sumamente doloroso y desgastante que sobrecarga de forma natural tu sistema nervioso y tu bienestar. A continuación encontrarás un análisis clínico claro de lo que experimenta tu cuerpo y mente, junto con soluciones prácticas paso a paso para aliviarte:`;
  }
  if (norm === 'fr') {
    return `J'ai écouté et compris votre situation avec la plus grande attention. Traverser ${problemDescription} est une épreuve profondément lourde et douloureuse qui met naturellement votre système nerveux et votre esprit à rude épreuve. Voici une analyse clinique claire de ce que vous ressentez, suivie de solutions pratiques et bienveillantes pour vous soulager immédiatement :`;
  }
  if (norm === 'de') {
    return `Ich habe Ihre Situation sehr aufmerksam gehört und verstanden. ${problemDescription} zu durchleben, ist eine zutiefst fordernde Belastung, die Körper und Geist verständlicherweise an ihre Grenzen bringt. Hier ist eine klare klinische Einordnung Ihres aktuellen Erlebens, gefolgt von praktischen, schrittweisen Schritten zur sofortigen Erleichterung:`;
  }
  return `I have heard and understood your situation very closely. Navigating ${problemDescription} is a profoundly heavy and painful challenge that naturally places enormous strain on your nervous system. Here is a clear clinical understanding of what your body and mind are experiencing right now, followed by a grounded, step-by-step path to relief:`;
}
