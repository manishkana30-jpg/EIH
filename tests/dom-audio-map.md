# DOM Audio Test Inventory & Selector Map

This document establishes the canonical DOM selectors and attributes required for isolated, step-by-step audio/voice test automation in the Emotional Intelligence Healer (EIH) web application.

---

## 🎧 Audio Elements & Selectors Inventory

| Element Name | Primary Selector | Expected Attributes & States | Purpose & Notes |
| :--- | :--- | :--- | :--- |
| **Mic Button** | `[data-testid="mic-toggle-btn"]` | `data-state="idle" \| "listening" \| "processing" \| "error"` | Main microphone toggle button. Changes state from `idle` to `listening` on click, transitions to `processing` after transcript finalization, and `error` if capture fails. |
| **Live Volume / Amplitude Indicator** | `[data-testid="live-audio-meter"]` | `data-audio-level="<0.00 - 1.00>"`<br>`data-audio-percentage="<0 - 100>"` | Real-time audio amplitude visualizer driven by `AudioContext` `AnalyserNode`. Rendered when microphone is capturing audio frames. |
| **Live Audio Percentage Text** | `[data-testid="live-audio-percentage"]` | Contains percentage string (e.g. `45%`) | Text representation of live input volume. |
| **Live Transcript / Recognized Text** | `[data-testid="voice-transcript-display"]` | `data-has-transcript="true" \| "false"` | Live transcription element containing recognized speech interim/final text. |
| **Chat Input (Dual Voice/Text)** | `[data-testid="chat-text-input"]` | `value="<string>"` | Text input field that mirrors real-time speech recognition transcripts and accepts manual keyboard fallback. |
| **TTS Speaking Play Indicator** | `[data-testid="tts-play-indicator"]` | `data-speaking="true" \| "false"`<br>`class="tts-speaking active"` (when speaking)<br>`class="tts-idle hidden"` (when idle) | Visual & programmatic indicator showing when assistant speech synthesis (Edge-TTS or Web Speech API) is actively playing audio. |
| **Audio Permission Status Indicator** | `[data-testid="audio-permission-status"]` | `data-permission="granted" \| "prompt"` | Hidden programmatic element reflecting the current in-memory & local permission status of the microphone. |
| **Audio Permission Consent Modal** | `[data-testid="mic-consent-modal"]` | Visible when permission is required | Privacy & microphone consent modal displayed when permission has not yet been granted. |
| **Allow Microphone Button** | `[data-testid="mic-consent-allow-btn"]` | Clickable button | User-gesture trigger to grant microphone consent and start audio stream. |
| **Cancel Microphone Button** | `[data-testid="mic-consent-cancel-btn"]` | Clickable button | Dismisses consent modal and retains text-only fallback. |
| **Phase / State Indicator (Programmatic)** | `[data-testid="phase-state-indicator"]` | `data-phase="MOOD_INPUT" \| "CONFIRM" \| "CLARIFY_LOOP" \| "GITA" \| "CBT" \| "TRATAKA" \| "SUMMARY"`<br>`data-phase-index="1 \| 2 \| 3 \| 4"` | Machine-readable element reflecting the active state of the 4-phase state machine. |
| **Phase Progress Tracker** | `[data-testid="phase-tracker"]` | `data-current-state="<state>"`<br>`data-phase-index="<1-4>"` | Visual step indicator for Phase 1 (Mood), Phase 2 (Gita), Phase 3 (CBT), Phase 4 (Trataka). |
| **Audio Error Message Banner** | `[data-testid="audio-error-message"]` | Visible when `micErrorMessage !== null` | Error toast displaying microphone blocked, device not found, or speech network failure messages. |
| **Mic Retry Button** | `[data-testid="mic-retry-btn"]` | Clickable button | Re-attempts microphone capture after clearing the active error state. |
| **Phase 1 Confirmation Question** | `[data-testid="confirmation-question"]` | Contains empathetic confirmation statement | Displays assistant's emotional reflection ("It sounds like you're feeling..."). |
| **Confirmation Voice Status** | `[data-testid="confirm-voice-status"]` | Text: `Listening... (Say Yes or No)` etc. | Real-time status text of Phase 1 dedicated Yes/No voice recognizer. |
| **Confirm Voice Live Transcript** | `[data-testid="confirm-voice-transcript"]` | Displays `"Heard: <text>"` | Displays user's live utterance during the Phase 1 Yes/No window. |
| **Confirm Affirmative Button (Yes)** | `[data-testid="confirm-yes-btn"]` | Clickable button | Advances flow to Phase 2 (Gita Wisdom). |
| **Confirm Negative Button (No)** | `[data-testid="confirm-no-btn"]` | Clickable button | Diverts flow to Clarification Loop. |
| **Clarification Question Text** | `[data-testid="clarify-question-text"]` | Contains clarification turn prompt | Displays adaptive follow-up questions when Phase 1 confirmation is negated. |
| **Gita Wisdom Card** | `[data-testid="gita-card"]` | Visible in Phase 2 | Contains Sanskrit shloka, transliteration, and psychological relevance. |
| **Gita Advance to CBT Button** | `[data-testid="gita-skip-btn"]` | Clickable button | Advances session from Phase 2 (Gita) to Phase 3 (CBT). |
