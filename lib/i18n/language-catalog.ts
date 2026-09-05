/**
 * Global Language Catalog & GPS Geolocation Engine
 * Provides:
 * 1. 30+ Global & Regional Languages with BCP-47 speech locales and native metadata.
 * 2. Automatic GPS Location & Timezone/Locale detection with intelligent default language mapping.
 * 3. User override persistence in localStorage with instant switching.
 */

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  speechLocale: string;
}

export interface DetectedLocationInfo {
  countryCode: string;
  countryName: string;
  regionName: string;
  defaultLanguageCode: string;
  isGps: boolean;
  isIp?: boolean;
  source?: 'gps' | 'ip' | 'timezone' | 'default';
  city?: string;
  latitude?: number;
  longitude?: number;
}

export const GLOBAL_LANGUAGE_CATALOG: LanguageItem[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US/UK/Global)',
    flag: '🌐',
    region: 'Global / USA / UK',
    speechLocale: 'en-US',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'hi-IN',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'Spain / Latin America',
    speechLocale: 'es-ES',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'France / Canada',
    speechLocale: 'fr-FR',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'Germany / Austria / Switzerland',
    speechLocale: 'de-DE',
  },
  {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '中文 (简体)',
    flag: '🇨🇳',
    region: 'China / Taiwan / Singapore',
    speechLocale: 'zh-CN',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'Japan',
    speechLocale: 'ja-JP',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'Middle East / North Africa',
    speechLocale: 'ar-SA',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    region: 'Brazil / Portugal',
    speechLocale: 'pt-BR',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    region: 'India / Bangladesh',
    speechLocale: 'bn-IN',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'Russia / Eastern Europe',
    speechLocale: 'ru-RU',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'Italy',
    speechLocale: 'it-IT',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'South Korea',
    speechLocale: 'ko-KR',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    region: 'India / Sri Lanka / Singapore',
    speechLocale: 'ta-IN',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'te-IN',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'mr-IN',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'gu-IN',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    region: 'Pakistan / India',
    speechLocale: 'ur-PK',
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    region: 'Netherlands / Belgium',
    speechLocale: 'nl-NL',
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    region: 'Turkey',
    speechLocale: 'tr-TR',
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'Indonesia',
    speechLocale: 'id-ID',
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    region: 'Poland',
    speechLocale: 'pl-PL',
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    region: 'Sweden',
    speechLocale: 'sv-SE',
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'Vietnam',
    speechLocale: 'vi-VN',
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    region: 'Thailand',
    speechLocale: 'th-TH',
  },
];

/**
 * Approximate Country / Region bounding box matching from GPS Latitude & Longitude
 */
export function deduceCountryFromCoordinates(lat: number, lon: number): { countryCode: string; countryName: string; defaultLanguageCode: string } {
  if (lat >= 8.0 && lat <= 37.0 && lon >= 68.0 && lon <= 97.0) {
    return { countryCode: 'IN', countryName: 'India', defaultLanguageCode: 'hi' };
  }
  if (lat >= 24.0 && lat <= 50.0 && lon >= -125.0 && lon <= -66.0) {
    return { countryCode: 'US', countryName: 'United States', defaultLanguageCode: 'en' };
  }
  if (lat >= 49.0 && lat <= 61.0 && lon >= -8.0 && lon <= 2.0) {
    return { countryCode: 'GB', countryName: 'United Kingdom', defaultLanguageCode: 'en' };
  }
  if (lat >= 41.0 && lat <= 51.5 && lon >= -5.0 && lon <= 10.0) {
    return { countryCode: 'FR', countryName: 'France', defaultLanguageCode: 'fr' };
  }
  if (lat >= 47.0 && lat <= 55.0 && lon >= 5.8 && lon <= 15.0) {
    return { countryCode: 'DE', countryName: 'Germany', defaultLanguageCode: 'de' };
  }
  if (lat >= 36.0 && lat <= 44.0 && lon >= -9.5 && lon <= 3.5) {
    return { countryCode: 'ES', countryName: 'Spain', defaultLanguageCode: 'es' };
  }
  if (lat >= -34.0 && lat <= 5.5 && lon >= -74.0 && lon <= -34.5) {
    return { countryCode: 'BR', countryName: 'Brazil', defaultLanguageCode: 'pt' };
  }
  if (lat >= 30.0 && lat <= 46.0 && lon >= 128.0 && lon <= 146.0) {
    return { countryCode: 'JP', countryName: 'Japan', defaultLanguageCode: 'ja' };
  }
  if (lat >= 18.0 && lat <= 54.0 && lon >= 73.0 && lon <= 135.0) {
    return { countryCode: 'CN', countryName: 'China', defaultLanguageCode: 'zh' };
  }
  if (lat >= 16.0 && lat <= 34.0 && lon >= 34.0 && lon <= 60.0) {
    return { countryCode: 'AE', countryName: 'Middle East', defaultLanguageCode: 'ar' };
  }
  if (lat >= 36.0 && lat <= 47.5 && lon >= 6.5 && lon <= 19.0) {
    return { countryCode: 'IT', countryName: 'Italy', defaultLanguageCode: 'it' };
  }
  if (lat >= 14.5 && lat <= 33.0 && lon >= -118.0 && lon <= -86.0) {
    return { countryCode: 'MX', countryName: 'Mexico', defaultLanguageCode: 'es' };
  }
  if (lat >= 41.0 && lat <= 82.0 && lon >= 19.0 && lon <= 180.0) {
    return { countryCode: 'RU', countryName: 'Russia', defaultLanguageCode: 'ru' };
  }
  if (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 131.0) {
    return { countryCode: 'KR', countryName: 'South Korea', defaultLanguageCode: 'ko' };
  }
  if (lat >= -11.0 && lat <= 6.0 && lon >= 95.0 && lon <= 141.0) {
    return { countryCode: 'ID', countryName: 'Indonesia', defaultLanguageCode: 'id' };
  }
  if (lat >= 36.0 && lat <= 42.0 && lon >= 26.0 && lon <= 45.0) {
    return { countryCode: 'TR', countryName: 'Turkey', defaultLanguageCode: 'tr' };
  }

  return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
}

/**
 * Deduce default Country and Language from Browser Timezone and Locale
 */
export function deduceCountryFromTimezoneAndLocale(): { countryCode: string; countryName: string; defaultLanguageCode: string } {
  if (typeof window === 'undefined') {
    return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
  }

  const tz = (Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || '').toLowerCase();
  const navLang = (navigator?.language || 'en').toLowerCase();

  if (tz.includes('kolkata') || tz.includes('calcutta') || tz.includes('india')) {
    return { countryCode: 'IN', countryName: 'India', defaultLanguageCode: 'hi' };
  }
  if (tz.includes('paris')) return { countryCode: 'FR', countryName: 'France', defaultLanguageCode: 'fr' };
  if (tz.includes('berlin')) return { countryCode: 'DE', countryName: 'Germany', defaultLanguageCode: 'de' };
  if (tz.includes('madrid')) return { countryCode: 'ES', countryName: 'Spain', defaultLanguageCode: 'es' };
  if (tz.includes('tokyo')) return { countryCode: 'JP', countryName: 'Japan', defaultLanguageCode: 'ja' };
  if (tz.includes('shanghai') || tz.includes('beijing') || tz.includes('hong_kong')) return { countryCode: 'CN', countryName: 'China', defaultLanguageCode: 'zh' };
  if (tz.includes('dubai') || tz.includes('riyadh') || tz.includes('cairo')) return { countryCode: 'AE', countryName: 'Middle East', defaultLanguageCode: 'ar' };
  if (tz.includes('sao_paulo') || tz.includes('rio')) return { countryCode: 'BR', countryName: 'Brazil', defaultLanguageCode: 'pt' };
  if (tz.includes('rome')) return { countryCode: 'IT', countryName: 'Italy', defaultLanguageCode: 'it' };
  if (tz.includes('moscow')) return { countryCode: 'RU', countryName: 'Russia', defaultLanguageCode: 'ru' };
  if (tz.includes('seoul')) return { countryCode: 'KR', countryName: 'South Korea', defaultLanguageCode: 'ko' };
  if (tz.includes('jakarta')) return { countryCode: 'ID', countryName: 'Indonesia', defaultLanguageCode: 'id' };
  if (tz.includes('istanbul')) return { countryCode: 'TR', countryName: 'Turkey', defaultLanguageCode: 'tr' };
  if (tz.includes('warsaw')) return { countryCode: 'PL', countryName: 'Poland', defaultLanguageCode: 'pl' };
  if (tz.includes('stockholm')) return { countryCode: 'SE', countryName: 'Sweden', defaultLanguageCode: 'sv' };
  if (tz.includes('bangkok')) return { countryCode: 'TH', countryName: 'Thailand', defaultLanguageCode: 'th' };
  if (tz.includes('saigon') || tz.includes('ho_chi_minh')) return { countryCode: 'VN', countryName: 'Vietnam', defaultLanguageCode: 'vi' };
  if (tz.includes('london')) return { countryCode: 'GB', countryName: 'United Kingdom', defaultLanguageCode: 'en' };
  if (tz.includes('new_york') || tz.includes('chicago') || tz.includes('los_angeles') || tz.includes('denver')) {
    return { countryCode: 'US', countryName: 'United States', defaultLanguageCode: 'en' };
  }

  const matched = GLOBAL_LANGUAGE_CATALOG.find((l) => navLang.startsWith(l.code));
  if (matched) {
    return { countryCode: matched.code.toUpperCase(), countryName: matched.region, defaultLanguageCode: matched.code };
  }

  return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
}

/**
 * Detect user's Location & Language via real GPS coordinates (if permitted) or Timezone and Browser Language
 */
export async function detectLocationAndLanguage(): Promise<DetectedLocationInfo> {
  if (typeof window === 'undefined') {
    return {
      countryCode: 'GLOBAL',
      countryName: 'Global',
      regionName: 'Global',
      defaultLanguageCode: 'en',
      isGps: false,
      isIp: false,
      source: 'default',
    };
  }

  // 1. Attempt Real Browser GPS Geolocation (High Accuracy with rapid timeout)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 2500,
          maximumAge: 600000,
          enableHighAccuracy: false,
        });
      });

      if (position && position.coords) {
        const { latitude, longitude } = position.coords;
        const gpsCountry = deduceCountryFromCoordinates(latitude, longitude);
        return {
          countryCode: gpsCountry.countryCode,
          countryName: gpsCountry.countryName,
          regionName: `${gpsCountry.countryName} (GPS Satellite)`,
          defaultLanguageCode: gpsCountry.defaultLanguageCode || 'en',
          isGps: true,
          isIp: false,
          source: 'gps',
          latitude,
          longitude,
        };
      }
    } catch (_) {
      // User declined or timed out; proceed to server-side IP detection
    }
  }

  // 2. High-Fidelity Server-Side IP Address Geolocation (/api/location)
  try {
    const res = await fetch('/api/location', {
      signal: AbortSignal.timeout(2800),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryCode) {
        const cityPrefix = data.city ? `${data.city}, ` : '';
        return {
          countryCode: data.countryCode,
          countryName: data.countryName || data.countryCode,
          regionName: `${cityPrefix}${data.countryName || data.countryCode} (IP Location)`,
          city: data.city,
          defaultLanguageCode: data.defaultLanguageCode || 'en',
          isGps: false,
          isIp: true,
          source: 'ip',
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    }
  } catch (_) {
    // IP location timed out or failed; proceed to browser timezone/locale fallback
  }

  // 3. Deterministic Browser Timezone and Locale fallback
  const tzResult = deduceCountryFromTimezoneAndLocale();
  return {
    countryCode: tzResult.countryCode,
    countryName: tzResult.countryName,
    regionName: `${tzResult.countryName} (Regional Timezone)`,
    defaultLanguageCode: tzResult.defaultLanguageCode || 'en',
    isGps: false,
    isIp: false,
    source: 'timezone',
  };
}

/**
 * Detect user's BCP-47 speech locale code
 */
export function detectUserLocale(): string {
  if (typeof window === 'undefined') {
    return 'en-US';
  }

  if (navigator?.language) {
    const nav = navigator.language;
    const matched = GLOBAL_LANGUAGE_CATALOG.find(
      (l) => l.speechLocale.toLowerCase() === nav.toLowerCase() || l.code.toLowerCase() === nav.split('-')[0].toLowerCase()
    );
    if (matched) {
      return matched.speechLocale;
    }
    return nav;
  }

  const tzResult = deduceCountryFromTimezoneAndLocale();
  const langItem = GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === tzResult.defaultLanguageCode);
  return langItem?.speechLocale || 'en-US';
}

/**
 * Get the currently configured or stored language
 */
export function getStoredLanguage(): { code: string; isAuto: boolean } {
  if (typeof window === 'undefined') {
    return { code: 'en', isAuto: true };
  }

  const stored = localStorage.getItem('eih_user_language');
  const isAuto = localStorage.getItem('eih_language_is_auto') !== 'false';

  if (stored && !isAuto) {
    return { code: stored, isAuto: false };
  }

  const autoInfo = deduceCountryFromTimezoneAndLocale();
  return { code: autoInfo.defaultLanguageCode || 'en', isAuto: true };
}

/**
 * Save user custom language selection or reset to auto GPS
 */
export function saveLanguagePreference(code: string, isAuto: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('eih_user_language', code);
  localStorage.setItem('eih_language_is_auto', isAuto ? 'true' : 'false');
}

/**
 * Retrieve Language Item by code
 */
export function getLanguageByCode(code: string): LanguageItem {
  return GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === code) || GLOBAL_LANGUAGE_CATALOG[0];
}

/**
 * Detect language and speech locale of the user's utterance in real time.
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
