/**
 * Aesthetic Therapy Peaceful Themes Engine
 * 
 * Provides curated, deeply relaxing, therapeutic ambient palettes
 * designed to induce parasympathetic calm, mindfulness, and comfort.
 */

export interface TherapyTheme {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  bgColor: string;
  primaryOrb: string;
  secondaryOrb: string;
  tertiaryOrb: string;
  accentColor: string;
  glowColor: string;
  cardBg: string;
  cardBorder: string;
}

export const THERAPY_THEMES: TherapyTheme[] = [
  {
    id: 'nature-calm',
    name: 'Nature Calm',
    emoji: '🌿',
    subtitle: 'Deep forest moss, eucalyptus leaf, and grounding sage mist',
    bgColor: '#0c1410',
    primaryOrb: '#588e73',
    secondaryOrb: '#81a890',
    tertiaryOrb: '#283c32',
    accentColor: '#81a890',
    glowColor: 'rgba(129, 168, 144, 0.25)',
    cardBg: 'rgba(27, 42, 35, 0.85)',
    cardBorder: 'rgba(61, 88, 74, 0.35)',
  },
  {
    id: 'eucalyptus-breeze',
    name: 'Eucalyptus Grove',
    emoji: '🍃',
    subtitle: 'Fresh botanical canopy with soothing pine shadows',
    bgColor: '#0d1813',
    primaryOrb: '#81a890',
    secondaryOrb: '#588e73',
    tertiaryOrb: '#3d584a',
    accentColor: '#588e73',
    glowColor: 'rgba(88, 142, 115, 0.25)',
    cardBg: 'rgba(20, 32, 26, 0.85)',
    cardBorder: 'rgba(40, 60, 50, 0.4)',
  },
  {
    id: 'warm-stone-hearth',
    name: 'Warm Stone & Clay',
    emoji: '🍂',
    subtitle: 'Warm terracotta, golden amber sunbeam, and grounding earth',
    bgColor: '#14120f',
    primaryOrb: '#c48b71',
    secondaryOrb: '#d4a373',
    tertiaryOrb: '#8c563d',
    accentColor: '#d4a373',
    glowColor: 'rgba(212, 163, 115, 0.25)',
    cardBg: 'rgba(32, 26, 22, 0.85)',
    cardBorder: 'rgba(74, 58, 48, 0.4)',
  },
  {
    id: 'twilight-mist',
    name: 'Forest Twilight',
    emoji: '🌌',
    subtitle: 'Quiet nocturnal woods with pale sage moonlit mist',
    bgColor: '#0a1212',
    primaryOrb: '#647d70',
    secondaryOrb: '#9cb5a6',
    tertiaryOrb: '#283c32',
    accentColor: '#9cb5a6',
    glowColor: 'rgba(156, 181, 166, 0.25)',
    cardBg: 'rgba(18, 28, 28, 0.85)',
    cardBorder: 'rgba(45, 65, 65, 0.4)',
  },
  {
    id: 'lotus-pond',
    name: 'Lotus Blossom',
    emoji: '🪷',
    subtitle: 'Still woodland spring with gentle floral calm',
    bgColor: '#120f14',
    primaryOrb: '#b38290',
    secondaryOrb: '#81a890',
    tertiaryOrb: '#588e73',
    accentColor: '#c48b8b',
    glowColor: 'rgba(196, 139, 139, 0.25)',
    cardBg: 'rgba(28, 20, 28, 0.85)',
    cardBorder: 'rgba(65, 45, 60, 0.4)',
  },
];

export function getStoredTheme(): TherapyTheme {
  if (typeof window === 'undefined') {
    return THERAPY_THEMES[0];
  }
  const storedId = localStorage.getItem('eih_therapy_theme');
  return THERAPY_THEMES.find((t) => t.id === storedId) || THERAPY_THEMES[0];
}

export function saveThemePreference(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('eih_therapy_theme', themeId);
}
