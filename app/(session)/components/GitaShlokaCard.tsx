"use client";

/**
 * Session-level GitaShlokaCard re-export.
 * Fully aligned with the 100% text-only clinical semantic architecture:
 * - Pure typography (no <img>, SVG icons, background graphics, or thumbnails)
 * - Reference Header (e.g. BG 2.48)
 * - Sanskrit Devanagari (readable serif)
 * - Romanized IAST transliteration
 * - Multilingual translation
 * - Psychological/Somatic Mapping
 * - Cognitive Tags (#Sattva, etc.)
 */
export {
  GitaShlokaCard,
  parseGitaShloka,
} from "@/components/gita/GitaShlokaCard";

export type { GitaShlokaCardProps } from "@/components/gita/GitaShlokaCard";

import { GitaShlokaCard } from "@/components/gita/GitaShlokaCard";
export default GitaShlokaCard;
