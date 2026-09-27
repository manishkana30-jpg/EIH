export {};

declare global {
  interface Window {
    browserSpeechController?: any;
    confirmVoiceManager?: any;
    __PLAYWRIGHT_TEST__?: boolean;
    __longTasks?: number[];
    __trackingKaraoke?: boolean;
    __fpsFrames?: number[];
  }
}
