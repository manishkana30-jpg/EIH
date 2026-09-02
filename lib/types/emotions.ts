/**
 * Cowen & Keltner 27 Continuous Dimensions of Emotion
 * PNAS 2017 Benchmark Classification & Percentage Scoring Interfaces
 */

export interface CowenDimensionScore {
  id: string;
  name: string;
  percentage: number; // 0 to 100
  color: string;
  cluster: string;
  reflectionPrompt: string;
}

export interface LiveEmotionPercentagePayload {
  dominant: CowenDimensionScore[]; // Top 3 dominant emotions
  all27: CowenDimensionScore[];     // Full 27-D vector
  timestamp: number;
}

export const COWEN_27_DIMENSIONS: Array<{
  id: string;
  name: string;
  color: string;
  cluster: string;
  defaultPrompt: string;
}> = [
  {
    id: 'admiration',
    name: 'Admiration',
    color: '#3b82f6',
    cluster: 'Prosocial & Uplifting',
    defaultPrompt: 'I feel a deep sense of admiration and respect for someone right now.',
  },
  {
    id: 'adoration',
    name: 'Adoration',
    color: '#ec4899',
    cluster: 'Affectionate & Intimate',
    defaultPrompt: 'I feel overflowing warmth, tenderness, and love right now.',
  },
  {
    id: 'aesthetic_appreciation',
    name: 'Aesthetic Appreciation',
    color: '#8b5cf6',
    cluster: 'Epistemic & Contemplative',
    defaultPrompt: 'I feel deeply moved by beauty, art, or harmony in my surroundings.',
  },
  {
    id: 'amusement',
    name: 'Amusement',
    color: '#f59e0b',
    cluster: 'Playful & Lighthearted',
    defaultPrompt: 'Something made me laugh or smile today, and I want to share that.',
  },
  {
    id: 'anger',
    name: 'Anger',
    color: '#ef4444',
    cluster: 'Sympathetic Boundary Defense',
    defaultPrompt: 'I feel intense anger and frustration about a situation that felt unfair.',
  },
  {
    id: 'anxiety',
    name: 'Anxiety',
    color: '#f97316',
    cluster: 'Future Uncertainty & Alarm',
    defaultPrompt: 'My heart feels uneasy and I am feeling anxious about future uncertainty.',
  },
  {
    id: 'awe',
    name: 'Awe',
    color: '#06b6d4',
    cluster: 'Vastness & Transcendence',
    defaultPrompt: 'I experienced something vast and breathtaking that changed my perspective.',
  },
  {
    id: 'awkwardness',
    name: 'Awkwardness',
    color: '#a855f7',
    cluster: 'Social Exposure & Tension',
    defaultPrompt: 'I had an uncomfortable social moment and I feel self-conscious.',
  },
  {
    id: 'boredom',
    name: 'Boredom',
    color: '#64748b',
    cluster: 'Low Dopaminergic Drive',
    defaultPrompt: 'I feel stagnant, unmotivated, and bored with routine.',
  },
  {
    id: 'calmness',
    name: 'Calmness',
    color: '#10b981',
    cluster: 'Homeostatic & Restorative',
    defaultPrompt: 'I feel balanced, grounded, and at peace in this moment.',
  },
  {
    id: 'confusion',
    name: 'Confusion',
    color: '#0284c7',
    cluster: 'High Cognitive Ambiguity',
    defaultPrompt: 'I feel lost, confused, and unsure which direction to take.',
  },
  {
    id: 'craving',
    name: 'Craving',
    color: '#d97706',
    cluster: 'Motivational Anticipation',
    defaultPrompt: 'I feel a strong pull or yearning for something I desire.',
  },
  {
    id: 'disgust',
    name: 'Disgust',
    color: '#84cc16',
    cluster: 'Protective Boundary Aversion',
    defaultPrompt: 'I encountered something repellent that violated my core values.',
  },
  {
    id: 'empathic_pain',
    name: 'Empathic Pain',
    color: '#6366f1',
    cluster: 'Prosocial Compassion',
    defaultPrompt: 'I feel deep heartache witnessing someone else suffer.',
  },
  {
    id: 'entrancement',
    name: 'Entrancement',
    color: '#14b8a6',
    cluster: 'Absorbed Fascination',
    defaultPrompt: 'I am completely mesmerized and absorbed in an experience.',
  },
  {
    id: 'excitement',
    name: 'Excitement',
    color: '#eab308',
    cluster: 'High Arousal Anticipation',
    defaultPrompt: 'I feel a surge of positive energy and excitement about what is ahead!',
  },
  {
    id: 'fear',
    name: 'Fear',
    color: '#dc2626',
    cluster: 'Acute Threat Defense',
    defaultPrompt: 'I feel genuine fear about a direct threat or imminent outcome.',
  },
  {
    id: 'horror',
    name: 'Horror',
    color: '#7f1d1d',
    cluster: 'Visceral Threat Overload',
    defaultPrompt: 'I feel deeply shaken and alarmed by a disturbing event.',
  },
  {
    id: 'interest',
    name: 'Interest',
    color: '#38bdf8',
    cluster: 'Curiosity & Exploration',
    defaultPrompt: 'I feel curious and intrigued to learn or understand something deeper.',
  },
  {
    id: 'joy',
    name: 'Joy',
    color: '#facc15',
    cluster: 'Euphoric Reward',
    defaultPrompt: 'I feel pure, radiant joy and gratitude right now.',
  },
  {
    id: 'nostalgia',
    name: 'Nostalgia',
    color: '#fb7185',
    cluster: 'Bittersweet Temporal Memory',
    defaultPrompt: 'I am remembering a meaningful time from my past with bittersweet fondness.',
  },
  {
    id: 'relief',
    name: 'Relief',
    color: '#34d399',
    cluster: 'De-escalated Post-Threat Recovery',
    defaultPrompt: 'A heavy weight has lifted, and I feel immense relief.',
  },
  {
    id: 'romance',
    name: 'Romance',
    color: '#f43f5e',
    cluster: 'Deep Intimate Attachment',
    defaultPrompt: 'I am feeling tender connection, romance, and longing for my partner.',
  },
  {
    id: 'sadness',
    name: 'Sadness',
    color: '#60a5fa',
    cluster: 'Loss & Interoceptive Heaviness',
    defaultPrompt: 'I feel a quiet, heavy sorrow in my chest today.',
  },
  {
    id: 'satisfaction',
    name: 'Satisfaction',
    color: '#22c55e',
    cluster: 'Fulfillment & Equilibrium',
    defaultPrompt: 'I feel deeply content and fulfilled with what I accomplished.',
  },
  {
    id: 'sexual_desire',
    name: 'Sexual Desire',
    color: '#e11d48',
    cluster: 'Erotic & Somatic Drive',
    defaultPrompt: 'I feel sensual vitality and intimacy moving through me.',
  },
  {
    id: 'sympathy',
    name: 'Sympathy',
    color: '#818cf8',
    cluster: 'Warm Compassionate Regard',
    defaultPrompt: 'My heart goes out to someone who is hurting right now.',
  },
];
