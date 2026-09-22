import { ClinicalSource, PsychologicalTelemetry } from "@/lib/api/healer-client";
import { queryPsychologyLibrary } from "@/lib/knowledge/psychology-library-rag";
import { browserSpeechController } from "@/lib/audio/browser-speech";

/**
 * 12-hour AM/PM formatted timestamp string
 */
export const getFormattedTime = (): string => {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Dynamically resolves the active CBT Reframe for Trataka Neuroplastic Phase
 */
export const resolveActiveCbtReframe = (
  messages: { sender: string; sources?: ClinicalSource[] }[],
  telemetry: PsychologicalTelemetry
): string | undefined => {
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.sender === "ai") {
    const msgSources = (lastMsg as any).sources as ClinicalSource[] | undefined;
    if (msgSources && msgSources.length > 0) {
      const cbtSource = msgSources.find(
        (s) => s.summary?.includes("CBT:") || s.title?.toLowerCase().includes("cbt")
      );
      if (cbtSource && cbtSource.summary) {
        const match = cbtSource.summary.match(/CBT:\s*([^|]+)/i);
        if (match && match[1]) return match[1].trim();
        return cbtSource.summary;
      }
    }
  }
  if (telemetry.cbt_distortion !== "None" && telemetry.dominant_emotion !== "Calmness") {
    const match = queryPsychologyLibrary(
      telemetry.cbt_distortion !== "None" ? telemetry.cbt_distortion : telemetry.dominant_emotion
    );
    if (match && match.condition.solutions.cbt_reframing) {
      return match.condition.solutions.cbt_reframing.split("[Wikipedia Context]")[0].trim();
    }
  }
  return undefined;
};

/**
 * Fallback: Direct base64 MP3 audio playback if Web SpeechSynthesis fails or base64 is explicitly provided
 */
export const playBase64AudioFallback = (
  audioBase64: string,
  effectiveClean: string,
  targetLocale: string,
  handleAudioEnd: () => void,
  handleWordBoundary: (charIndex: number, charLength: number, wordText?: string) => void,
  setActiveAudio: (audio: HTMLAudioElement | null) => void
): void => {
  try {
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    setActiveAudio(audio);

    let animFrame: number | null = null;
    const trackBase64Progress = () => {
      if (!audio || audio.paused || !audio.duration) return;
      const progress = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
      const charIndex = Math.min(effectiveClean.length - 1, Math.floor(progress * effectiveClean.length));
      const prefix = effectiveClean.slice(0, charIndex);
      const words = prefix.trim().split(/\s+/).filter(Boolean);
      const currentWord = words[words.length - 1] || "";
      handleWordBoundary(charIndex, currentWord.length, currentWord);
      animFrame = requestAnimationFrame(trackBase64Progress);
    };

    audio.onplay = () => {
      animFrame = requestAnimationFrame(trackBase64Progress);
    };

    audio.onended = () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      handleAudioEnd();
    };

    audio.onerror = (e) => {
      if (animFrame) cancelAnimationFrame(animFrame);
      console.warn("Direct base64 audio failed, fallback to browser speech:", e);
      browserSpeechController.speak(effectiveClean, undefined, handleAudioEnd, targetLocale);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (animFrame) cancelAnimationFrame(animFrame);
        console.warn("Audio autoplay blocked, fallback to browser speech:", err);
        browserSpeechController.speak(effectiveClean, undefined, handleAudioEnd, targetLocale);
      });
    }
  } catch (err) {
    console.error("Base64 audio init error:", err);
    browserSpeechController.speak(effectiveClean, undefined, handleAudioEnd, targetLocale);
  }
};
