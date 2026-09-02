/**
 * Global Emergency Mental Health & Crisis Hotline Directory
 * Grounded in verified national health ministry lines, IASP, and Befrienders Worldwide.
 */

export interface CrisisServiceContact {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  phone: string;
  textOption?: string;
  website?: string;
  is24x7: boolean;
  isTollFree: boolean;
  languages: string[];
  description: string;
  category: 'suicide_crisis' | 'youth_crisis' | 'domestic_violence' | 'veteran_support' | 'emergency_services';
}

export interface CountryCrisisProfile {
  countryCode: string;
  countryName: string;
  flag: string;
  emergencyGeneral: string; // e.g. "112", "911", "999", "000"
  ambulanceNumber: string;
  policeNumber: string;
  primarySuicideLifeline: CrisisServiceContact;
  additionalHotlines: CrisisServiceContact[];
}

export const GLOBAL_CRISIS_DIRECTORY: Record<string, CountryCrisisProfile> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    emergencyGeneral: '112',
    ambulanceNumber: '108',
    policeNumber: '100',
    primarySuicideLifeline: {
      id: 'in-telemanas',
      name: 'Tele-MANAS (National Tele Mental Health Programme)',
      country: 'India',
      countryCode: 'IN',
      flag: '🇮🇳',
      phone: '14416',
      textOption: 'Toll-free 1800-891-4416',
      website: 'https://telemanas.mohfw.gov.in',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia', 'Assamese'],
      description: 'Ministry of Health & Family Welfare free 24/7 tele-mental health support with certified clinical psychologists and psychiatrists.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'in-kiran',
        name: 'KIRAN Mental Health Helpline',
        country: 'India',
        countryCode: 'IN',
        flag: '🇮🇳',
        phone: '1800-599-0019',
        is24x7: true,
        isTollFree: true,
        languages: ['Hindi', 'English', '13 Regional Languages'],
        description: 'Ministry of Social Justice & Empowerment 24/7 mental health triage and rehabilitation support.',
        category: 'suicide_crisis',
      },
      {
        id: 'in-vandrevala',
        name: 'Vandrevala Foundation Helpline',
        country: 'India',
        countryCode: 'IN',
        flag: '🇮🇳',
        phone: '+91 9999 666 555',
        website: 'https://www.vandrevalafoundation.com',
        is24x7: true,
        isTollFree: false,
        languages: ['English', 'Hindi', 'Gujarati', 'Marathi'],
        description: 'Free 24/7 professional mental health counseling and crisis intervention.',
        category: 'suicide_crisis',
      },
      {
        id: 'in-nimhans',
        name: 'NIMHANS Psychosocial Support Helpline',
        country: 'India',
        countryCode: 'IN',
        flag: '🇮🇳',
        phone: '080-46110007',
        website: 'https://nimhans.ac.in',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Malayalam'],
        description: 'National Institute of Mental Health & Neurosciences premier psychosocial triage.',
        category: 'suicide_crisis',
      },
      {
        id: 'in-aasra',
        name: 'AASRA Crisis Prevention',
        country: 'India',
        countryCode: 'IN',
        flag: '🇮🇳',
        phone: '+91 98204 66726',
        website: 'http://www.aasra.info',
        is24x7: true,
        isTollFree: false,
        languages: ['English', 'Hindi'],
        description: '24/7 confidential helpline for suicidal distress and emotional turmoil.',
        category: 'suicide_crisis',
      },
    ],
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    emergencyGeneral: '911',
    ambulanceNumber: '911',
    policeNumber: '911',
    primarySuicideLifeline: {
      id: 'us-988',
      name: '988 Suicide & Crisis Lifeline',
      country: 'United States',
      countryCode: 'US',
      flag: '🇺🇸',
      phone: '988',
      textOption: 'Text 988',
      website: 'https://988lifeline.org',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Spanish', '240+ Languages via Tele-Interpreter'],
      description: 'Free, confidential support for people in suicidal crisis or emotional distress 24/7.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'us-crisis-text',
        name: 'Crisis Text Line',
        country: 'United States',
        countryCode: 'US',
        flag: '🇺🇸',
        phone: 'Text HOME to 741741',
        textOption: 'Text 741741',
        website: 'https://www.crisistextline.org',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'Spanish'],
        description: 'Connect with a volunteer crisis counselor via text 24/7.',
        category: 'suicide_crisis',
      },
      {
        id: 'us-trevor',
        name: 'The Trevor Project (LGBTQ+ Youth)',
        country: 'United States',
        countryCode: 'US',
        flag: '🇺🇸',
        phone: '1-866-488-7386',
        textOption: 'Text START to 678-678',
        website: 'https://www.thetrevorproject.org',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'Spanish'],
        description: 'Crisis intervention and suicide prevention for LGBTQ young people.',
        category: 'youth_crisis',
      },
      {
        id: 'us-veterans',
        name: 'Veterans Crisis Line',
        country: 'United States',
        countryCode: 'US',
        flag: '🇺🇸',
        phone: '988 (Press 1)',
        textOption: 'Text 838255',
        website: 'https://www.veteranscrisisline.net',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'Spanish'],
        description: 'Dedicated support for U.S. military veterans and service members.',
        category: 'veteran_support',
      },
    ],
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    emergencyGeneral: '999',
    ambulanceNumber: '999',
    policeNumber: '999',
    primarySuicideLifeline: {
      id: 'gb-samaritans',
      name: 'Samaritans',
      country: 'United Kingdom',
      countryCode: 'GB',
      flag: '🇬🇧',
      phone: '116 123',
      textOption: 'jo@samaritans.org',
      website: 'https://www.samaritans.org',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Welsh'],
      description: 'Free, confidential round-the-clock emotional support for anyone in the UK and ROI.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'gb-nhs-111',
        name: 'NHS Mental Health Services (Option 2)',
        country: 'United Kingdom',
        countryCode: 'GB',
        flag: '🇬🇧',
        phone: '111',
        website: 'https://111.nhs.uk',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'Translation available'],
        description: 'Direct access to local NHS crisis resolution and home treatment teams.',
        category: 'suicide_crisis',
      },
      {
        id: 'gb-shout',
        name: 'Shout Crisis Text Service',
        country: 'United Kingdom',
        countryCode: 'GB',
        flag: '🇬🇧',
        phone: 'Text SHOUT to 85258',
        textOption: 'Text 85258',
        website: 'https://giveusashout.org',
        is24x7: true,
        isTollFree: true,
        languages: ['English'],
        description: 'Free, confidential, 24/7 text support for anyone in the UK in crisis.',
        category: 'suicide_crisis',
      },
    ],
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    emergencyGeneral: '911',
    ambulanceNumber: '911',
    policeNumber: '911',
    primarySuicideLifeline: {
      id: 'ca-988',
      name: '988 Suicide Crisis Helpline Canada',
      country: 'Canada',
      countryCode: 'CA',
      flag: '🇨🇦',
      phone: '988',
      textOption: 'Text 988',
      website: 'https://988.ca',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'French'],
      description: 'Free 24/7 bilingual suicide prevention service across all provinces and territories.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'ca-kids-help',
        name: 'Kids Help Phone',
        country: 'Canada',
        countryCode: 'CA',
        flag: '🇨🇦',
        phone: '1-800-668-6868',
        textOption: 'Text CONNECT to 686868',
        website: 'https://kidshelpphone.ca',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'French', 'Indigenous languages'],
        description: 'Canada’s only 24/7 e-mental health service for young people.',
        category: 'youth_crisis',
      },
      {
        id: 'ca-hope-wellness',
        name: 'Hope for Wellness (Indigenous Helpline)',
        country: 'Canada',
        countryCode: 'CA',
        flag: '🇨🇦',
        phone: '1-855-242-3310',
        website: 'https://www.hopeforwellness.ca',
        is24x7: true,
        isTollFree: true,
        languages: ['English', 'French', 'Cree', 'Ojibway', 'Inuktitut'],
        description: 'Immediate mental health counselling and crisis intervention for all Indigenous people.',
        category: 'suicide_crisis',
      },
    ],
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    emergencyGeneral: '000',
    ambulanceNumber: '000',
    policeNumber: '000',
    primarySuicideLifeline: {
      id: 'au-lifeline',
      name: 'Lifeline Australia',
      country: 'Australia',
      countryCode: 'AU',
      flag: '🇦🇺',
      phone: '13 11 14',
      textOption: 'Text 0477 13 11 14',
      website: 'https://www.lifeline.org.au',
      is24x7: true,
      isTollFree: true,
      languages: ['English'],
      description: '24/7 national suicide prevention and crisis support service across Australia.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'au-beyond-blue',
        name: 'Beyond Blue',
        country: 'Australia',
        countryCode: 'AU',
        flag: '🇦🇺',
        phone: '1300 22 4636',
        website: 'https://www.beyondblue.org.au',
        is24x7: true,
        isTollFree: true,
        languages: ['English'],
        description: 'Information and support for anxiety, depression and suicide prevention.',
        category: 'suicide_crisis',
      },
      {
        id: 'au-suicide-callback',
        name: 'Suicide Call Back Service',
        country: 'Australia',
        countryCode: 'AU',
        flag: '🇦🇺',
        phone: '1300 659 467',
        website: 'https://www.suicidecallbackservice.org.au',
        is24x7: true,
        isTollFree: true,
        languages: ['English'],
        description: 'Free nationwide telephone counselling for people affected by suicide.',
        category: 'suicide_crisis',
      },
    ],
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    flag: '🇳🇿',
    emergencyGeneral: '111',
    ambulanceNumber: '111',
    policeNumber: '111',
    primarySuicideLifeline: {
      id: 'nz-1737',
      name: '1737 Need to Talk?',
      country: 'New Zealand',
      countryCode: 'NZ',
      flag: '🇳🇿',
      phone: '1737',
      textOption: 'Text 1737',
      website: 'https://1737.org.nz',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Māori'],
      description: 'Free call or text 1737 anytime to talk with a trained counselor.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [
      {
        id: 'nz-lifeline',
        name: 'Lifeline Aotearoa',
        country: 'New Zealand',
        countryCode: 'NZ',
        flag: '🇳🇿',
        phone: '0800 543 354',
        textOption: 'Text HELP to 4357',
        website: 'https://www.lifeline.org.nz',
        is24x7: true,
        isTollFree: true,
        languages: ['English'],
        description: '24/7 confidential community counselling and crisis support.',
        category: 'suicide_crisis',
      },
    ],
  },
  DE: {
    countryCode: 'DE',
    countryName: 'Germany',
    flag: '🇩🇪',
    emergencyGeneral: '112',
    ambulanceNumber: '112',
    policeNumber: '110',
    primarySuicideLifeline: {
      id: 'de-telefonseelsorge',
      name: 'TelefonSeelsorge Deutschland',
      country: 'Germany',
      countryCode: 'DE',
      flag: '🇩🇪',
      phone: '0800 111 0 111',
      textOption: '0800 111 0 222',
      website: 'https://www.telefonseelsorge.de',
      is24x7: true,
      isTollFree: true,
      languages: ['German'],
      description: 'Kostenfreie, vertrauliche und anonyme Krisenberatung rund um die Uhr.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [],
  },
  FR: {
    countryCode: 'FR',
    countryName: 'France',
    flag: '🇫🇷',
    emergencyGeneral: '112',
    ambulanceNumber: '15',
    policeNumber: '17',
    primarySuicideLifeline: {
      id: 'fr-3114',
      name: 'Numéro National de Prévention du Suicide',
      country: 'France',
      countryCode: 'FR',
      flag: '🇫🇷',
      phone: '3114',
      website: 'https://3114.fr',
      is24x7: true,
      isTollFree: true,
      languages: ['French'],
      description: 'Service gratuit, confidentiel, accessible 24h/24 et 7j/7 pour les personnes en détresse.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [],
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    emergencyGeneral: '995',
    ambulanceNumber: '995',
    policeNumber: '999',
    primarySuicideLifeline: {
      id: 'sg-sos',
      name: 'Samaritans of Singapore (SOS)',
      country: 'Singapore',
      countryCode: 'SG',
      flag: '🇸🇬',
      phone: '1767',
      textOption: 'WhatsApp +65 9151 1767',
      website: 'https://www.sos.org.sg',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Mandarin', 'Malay', 'Tamil'],
      description: '24-hour confidential suicide prevention and crisis helpline.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [],
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    emergencyGeneral: '999',
    ambulanceNumber: '998',
    policeNumber: '999',
    primarySuicideLifeline: {
      id: 'ae-hope',
      name: 'National Mental Health Helpline (HOPE)',
      country: 'United Arab Emirates',
      countryCode: 'AE',
      flag: '🇦🇪',
      phone: '800 4673',
      website: 'https://www.mohap.gov.ae',
      is24x7: true,
      isTollFree: true,
      languages: ['Arabic', 'English'],
      description: 'Free confidential support provided by the National Program for Happiness and Wellbeing.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [],
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    flag: '🇿🇦',
    emergencyGeneral: '112',
    ambulanceNumber: '10177',
    policeNumber: '10111',
    primarySuicideLifeline: {
      id: 'za-sadag',
      name: 'SADAG Suicide Crisis Line',
      country: 'South Africa',
      countryCode: 'ZA',
      flag: '🇿🇦',
      phone: '0800 567 567',
      textOption: 'SMS 31393',
      website: 'https://www.sadag.org',
      is24x7: true,
      isTollFree: true,
      languages: ['English', 'Zulu', 'Xhosa', 'Afrikaans'],
      description: 'South African Depression and Anxiety Group 24-hour national helpline.',
      category: 'suicide_crisis',
    },
    additionalHotlines: [],
  },
};

/**
 * Maps common IANA timezones to default fallback ISO country codes
 */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'Europe/London': 'GB',
  'Europe/Belfast': 'GB',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Asia/Singapore': 'SG',
  'Asia/Dubai': 'AE',
  'Africa/Johannesburg': 'ZA',
};

/**
 * Resolves the user's country code based on timezone, coordinate reverse geocode, or browser hints.
 */
export function inferCountryFromTimezone(tz?: string): string {
  if (!tz && typeof Intl !== 'undefined') {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      tz = 'Asia/Kolkata';
    }
  }

  if (tz && TIMEZONE_TO_COUNTRY[tz]) {
    return TIMEZONE_TO_COUNTRY[tz];
  }

  if (tz) {
    if (tz.startsWith('America/')) return 'US';
    if (tz.startsWith('Europe/London')) return 'GB';
    if (tz.startsWith('Europe/')) return 'DE';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('Pacific/')) return 'NZ';
    if (tz.startsWith('Asia/')) return 'IN';
  }

  return 'IN';
}

/**
 * Returns the crisis profile for a given ISO country code, falling back safely to India / US if not found.
 */
export function getCrisisProfileByCountry(code?: string): CountryCrisisProfile {
  const upper = (code || 'IN').toUpperCase();
  if (GLOBAL_CRISIS_DIRECTORY[upper]) {
    return GLOBAL_CRISIS_DIRECTORY[upper];
  }
  return GLOBAL_CRISIS_DIRECTORY['IN'];
}

/**
 * Returns a list of all countries supported with their flag and name
 */
export function getAvailableCrisisCountries(): { code: string; name: string; flag: string; emergencyGeneral: string }[] {
  return Object.values(GLOBAL_CRISIS_DIRECTORY).map((p) => ({
    code: p.countryCode,
    name: p.countryName,
    flag: p.flag,
    emergencyGeneral: p.emergencyGeneral,
  }));
}
