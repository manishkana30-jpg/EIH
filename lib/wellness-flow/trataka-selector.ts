/**
 * lib/wellness-flow/trataka-selector.ts
 *
 * Rule-Based Selector for the 5 Trataka Neuro-Ocular Gazing Variants.
 * Evaluates:
 * 1. Psychological Mood (Primary & Secondary emotion, Root theme)
 * 2. Intensity (1 to 10 scale)
 * 3. Time of Day (Morning, Afternoon, Evening, Night)
 *
 * Variants:
 * 1. Candle flame gazing (candle_flame)
 * 2. Bindu (dot) gazing (bindu_dot)
 * 3. Om/symbol gazing (om_symbol)
 * 4. Moon or star gazing (moon_star)
 * 5. Mirror/eye-reflection gazing (mirror_reflection)
 */

import tratakaData from '../../data/wellness_flow/trataka_instructions.json' with { type: 'json' };
import type { MoodProfile, TratakaVariantKey, TratakaVariantData, TratakaSelectionResult } from './types';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(hour?: number): TimeOfDay {
  const currentHour = hour !== undefined ? hour : new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return 'morning';
  if (currentHour >= 12 && currentHour < 17) return 'afternoon';
  if (currentHour >= 17 && currentHour < 21) return 'evening';
  return 'night';
}

export class TratakaSelector {
  private variants: Record<TratakaVariantKey, TratakaVariantData>;

  constructor(customData?: Record<string, any>) {
    this.variants = (customData || tratakaData.variants) as Record<TratakaVariantKey, TratakaVariantData>;
  }

  public getAllVariants(): TratakaVariantData[] {
    return Object.values(this.variants);
  }

  public getVariantById(id: TratakaVariantKey): TratakaVariantData {
    return this.variants[id] || this.variants.bindu_dot;
  }

  /**
   * Rule-based selector picking the single best variant.
   */
  public selectBestVariant(
    mood: MoodProfile,
    customTimeOfDay?: TimeOfDay
  ): TratakaSelectionResult {
    const time = customTimeOfDay || getTimeOfDay();
    const emotion = mood.primary_emotion.toLowerCase();
    const secondary = (mood.secondary_emotion || '').toLowerCase();
    const intensity = mood.intensity;
    const theme = mood.root_theme.toLowerCase();

    let selectedKey: TratakaVariantKey = 'bindu_dot';
    let rationale_en = '';
    let rationale_hi = '';

    // RULE 0: Calm, Peaceful, Contentment, Equanimity -> Om Symbol or Moon & Star Gazing
    if (
      emotion === 'calm' ||
      secondary === 'calm' ||
      theme.includes('equanimity') ||
      theme.includes('gratitude')
    ) {
      if (time === 'night' || time === 'evening') {
        selectedKey = 'moon_star';
        rationale_en =
          'Because your mind is resting in calm and tranquility, Moon and Star Gazing was chosen to deepen your peaceful presence under the vast, quiet expanse of the cosmos.';
        rationale_hi =
          'चूंकि आपका मन शांत और सुखद स्थिति में है, इसलिए चंद्र व तारा त्राटक चुना गया है ताकि शांत रात्रि का आकाश आपकी आंतरिक शांति और विस्तार को और गहरा कर सके।';
      } else {
        selectedKey = 'om_symbol';
        rationale_en =
          'Because you are experiencing calm and contentment, Om Symbol Gazing was chosen to anchor your serene focus into sacred harmony and grounded clarity.';
        rationale_hi =
          'चूंकि आप शांति और संतोष का अनुभव कर रहे हैं, इसलिए ॐ प्रतीक त्राटक चुना गया है ताकि पवित्र ज्यामिति आपकी शांति को स्थिर और प्रदीप्त रख सके।';
      }
    }

    // RULE 1: Shame, Guilt, Imposter Syndrome, Self-Doubt -> Mirror / Eye-Reflection Gazing
    else if (
      emotion === 'guilt' ||
      secondary === 'guilt' ||
      theme.includes('self_worth') ||
      theme.includes('self_condemnation') ||
      theme.includes('shame')
    ) {
      selectedKey = 'mirror_reflection';
      rationale_en =
        'Because your mood is carrying self-doubt, guilt, or heavy self-criticism, Mirror Pratibimb Trataka was selected to foster direct eye-to-eye self-compassion and soothe inner criticism.';
      rationale_hi =
        'चूंकि आप आत्म-संदेह या ग्लानि का अनुभव कर रहे हैं, इसलिए प्रतिबिम्ब त्राटक चुना गया है ताकि आप अपनी आंखों में करुणा से देखकर आत्म-स्वीकृति और आंतरिक शांति पा सकें।';
    }

    // RULE 2: Anger, Irritation, High-Arousal Restlessness, Betrayal -> Bindu (Dot) Gazing
    else if (
      emotion === 'anger' ||
      secondary === 'anger' ||
      emotion === 'fear' ||
      intensity >= 8 ||
      theme.includes('boundary_violation') ||
      theme.includes('conflict')
    ) {
      selectedKey = 'bindu_dot';
      rationale_en =
        'Because you are experiencing intense anger, agitation, or high internal restlessness, Bindu Trataka was selected to anchor your scattered fight-or-flight energy into a single motionless focal point.';
      rationale_hi =
        'चूंकि आप तीव्र क्रोध, अशांति या अत्यधिक उत्तेजना महसूस कर रहे हैं, इसलिए बिन्दु त्राटक चुना गया है ताकि आपकी बिखरी हुई मानसिक ऊर्जा एक शांत बिन्दु पर केंद्रित हो सके।';
    }

    // RULE 3: Anxiety, Overthinking, Racing Thoughts, Stress -> Candle Flame Gazing (or Moon Gazing at Night)
    else if (
      emotion === 'anxiety' ||
      emotion === 'overthinking' ||
      emotion === 'stress' ||
      secondary === 'anxiety' ||
      theme.includes('future_uncertainty') ||
      theme.includes('racing_mind')
    ) {
      if (time === 'night' && intensity <= 6) {
        selectedKey = 'moon_star';
        rationale_en =
          'Because you are dealing with mental overthinking during nighttime hours, Moon and Star Gazing was selected to cool cognitive heat and expand your awareness into calm night spaciousness.';
        rationale_hi =
          'चूंकि रात्रि के समय आपका मन विचारों में उलझा हुआ है, इसलिए चंद्र व तारा त्राटक चुना गया है ताकि आकाश की विशालता आपके मन के तनाव को शीतल कर सके।';
      } else {
        selectedKey = 'candle_flame';
        rationale_en =
          'Because you are experiencing racing anxiety and mental overthinking, Candle Flame Gazing was selected to gently captivate your optic flow and soothe your nervous system.';
        rationale_hi =
          'चूंकि आप घबराहट और दौड़ते विचारों से परेशान हैं, इसलिए ज्योति त्राटक चुना गया है ताकि दीपक की स्थिर लौ आपके मन के भटकाव को शांत कर सके।';
      }
    }

    // RULE 4: Sadness, Loneliness, Low Motivation, Emptiness -> Om Symbol or Moon/Star
    else if (
      emotion === 'sadness' ||
      emotion === 'loneliness' ||
      emotion === 'low motivation' ||
      secondary === 'sadness' ||
      theme.includes('emotional_loss') ||
      theme.includes('isolation')
    ) {
      if (time === 'evening' || time === 'night') {
        selectedKey = 'moon_star';
        rationale_en =
          'Because you are feeling low mood or loneliness in the evening, Moon and Star Gazing was chosen to connect you with the soothing, boundless presence of the night sky.';
        rationale_hi =
          'चूंकि शाम के समय आप उदासी या अकेलापन महसूस कर रहे हैं, इसलिए चंद्र व तारा त्राटक चुना गया है ताकि शांत रात्रि का आकाश आपके मन को स्नेहपूर्ण विश्राम दे सके।';
      } else {
        selectedKey = 'om_symbol';
        rationale_en =
          'Because your energy feels low or weighed down by sadness, Om Symbol Gazing was chosen to uplift your inner spirit through sacred symmetry and transcendent focus.';
        rationale_hi =
          'चूंकि आप उदासी या ऊर्जा की कमी महसूस कर रहे हैं, इसलिए ॐ प्रतीक त्राटक चुना गया है ताकि पवित्र ज्यामिति आपके हृदय में नई आशा और सकारात्मक ऊर्जा का संचार कर सके।';
      }
    }

    // RULE 5: Default / Equanimity balance based on Time of Day
    else {
      if (time === 'night' || time === 'evening') {
        selectedKey = 'candle_flame';
        rationale_en =
          'For your evening practice, Candle Flame Gazing was chosen to dissolve the fatigue of the day and invite warm, grounding stillness.';
        rationale_hi =
          'संध्याकालीन अभ्यास के लिए ज्योति त्राटक चुना गया है ताकि दिनभर की थकान मिटाकर मन को स्थिर और शांत किया जा सके।';
      } else {
        selectedKey = 'bindu_dot';
        rationale_en =
          'To cultivate laser clarity and calm stability for your day, Bindu Trataka was selected as your central focus anchor.';
        rationale_hi =
          'दिन के लिए एकाग्रता और शांत स्थिरता विकसित करने हेतु बिन्दु त्राटक को आपके मुख्य अभ्यास के रूप में चुना गया है।';
      }
    }

    // Determine beginner duration (1 to 3 minutes) based on intensity
    let duration_seconds = 120; // 2 minutes standard
    if (intensity >= 8) {
      duration_seconds = 60; // 1 minute for acute distress to avoid ocular/cognitive strain
    } else if (intensity <= 4) {
      duration_seconds = 180; // 3 minutes for gentle contemplative absorption
    }

    const variant = this.getVariantById(selectedKey);

    return {
      variant,
      rationale_en,
      rationale_hi,
      duration_seconds,
    };
  }
}

export const tratakaSelector = new TratakaSelector();
export default tratakaSelector;
