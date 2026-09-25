# EIH DOM Element Map & Selector Registry

This document catalogues every critical user-facing interactive and visual DOM element in the Emotional Intelligence Healer (EIH) web application, specifically for the 4-Phase Guided Wellness Flow, Crisis Intervention, and Voice Subsystems.

---

## 1. Complete Inventory of `data-testid` Selectors

All selectors listed below were directly added to the application source code (`app/(session)/components/LeftNav.tsx` and `components/wellness-flow/GuidedWellnessConversation.tsx`) to guarantee deterministic, resilient, non-brittle browser automation.

| Category | `data-testid` | Description | DOM Element Type |
|---|---|---|---|
| **Entry** | `open-wellness-flow-btn` | Button in Left Navigation to launch 4-Phase Guided Flow | `<button>` |
| **Container** | `wellness-modal` | Main modal stage container | `<div>` |
| **Header** | `language-toggle-btn` | Toggle English / Hindi language | `<button>` |
| **Header** | `mute-toggle-btn` | Toggle audio narration (TTS mute / unmute) | `<button>` |
| **Header** | `close-modal-btn` | Close modal / exit flow | `<button>` |
| **Progress** | `phase-tracker` | 4-Phase tracker bar container | `<div>` |
| **Progress** | `phase-indicator-step-1` | Phase 1 (Mood Understanding) status pill | `<div>` |
| **Progress** | `phase-indicator-step-2` | Phase 2 (Gita Wisdom) status pill | `<div>` |
| **Progress** | `phase-indicator-step-3` | Phase 3 (CBT Cognitive Reframe) status pill | `<div>` |
| **Progress** | `phase-indicator-step-4` | Phase 4 (Trataka Gazing) status pill | `<div>` |
| **Phase 1** | `phase-1-greeting` | Sanctuary welcome greeting card | `<div>` |
| **Phase 1** | `user-initial-utterance` | Transcript badge of user's submitted input | `<div>` |
| **Phase 1** | `confirmation-card` | Empathy Confirmation card container | `<motion.div>` |
| **Phase 1** | `confirmation-question` | Confirmation statement ("I hear that you are feeling...") | `<p>` |
| **Phase 1** | `confirm-voice-status` | Voice state banner ("Listening...", "Awaiting confirmation") | `<span>` |
| **Phase 1** | `confirm-voice-transcript`| Live transcribed speech badge ("Heard: ...") | `<div>` |
| **Phase 1** | `confirm-yes-btn` | "Yes, that's right" affirmative button | `<button>` |
| **Phase 1** | `confirm-no-btn` | "No, not quite" non-affirmative button | `<button>` |
| **Phase 1** | `clarify-card` | Clarification dialogue loop container | `<motion.div>` |
| **Phase 1** | `clarify-turn-count` | Clarification question counter badge ("Question X of 5") | `<span>` |
| **Phase 1** | `clarify-question-text` | Active clarification inquiry text | `<div>` |
| **Phase 2** | `gita-card` | Bhagavad Gita wisdom card container | `<motion.div>` |
| **Phase 2** | `gita-verse-ref` | Verse chapter & verse citation (e.g., "BG 2.47") | `<span>` |
| **Phase 2** | `gita-shloka-sanskrit` | Sanskrit shloka typography | `<div>` |
| **Phase 2** | `gita-shloka-transliteration` | Romanized transliteration | `<div>` |
| **Phase 2** | `gita-meaning` | Core philosophical meaning text | `<span>` |
| **Phase 2** | `gita-problem-analysis` | Problem diagnosis from Gita perspective | `<span>` |
| **Phase 2** | `gita-practical-solution`| Actionable daily solution | `<span>` |
| **Phase 2** | `gita-replay-btn` | Audio replay button ("Replay 🔊") | `<button>` |
| **Phase 2** | `gita-skip-btn` | Skip to CBT button ("Skip to CBT →") | `<button>` |
| **Phase 3** | `cbt-card` | Cognitive Behavioral Therapy card container | `<motion.div>` |
| **Phase 3** | `cbt-step-badge` | CBT step indicator ("Step X of 4") | `<span>` |
| **Phase 3** | `cbt-automatic-thought` | Step 1 Automatic Negative Thought prompt & answer | `<div>` |
| **Phase 3** | `cbt-distortion-name` | Step 2 Identified Cognitive Distortion name | `<div>` |
| **Phase 3** | `cbt-distortion-ack-btn`| Step 2 Acknowledgment button ("Challenge Thought →") | `<button>` |
| **Phase 3** | `cbt-evidence-challenge`| Step 3 Evidence-based challenge questions & answers | `<div>` |
| **Phase 3** | `cbt-balanced-thought` | Step 4 Balanced replacement rational thought | `<div>` |
| **Phase 3** | `cbt-action-step` | Step 4 Actionable behavioral step | `<div>` |
| **Phase 3** | `cbt-skip-btn` | Skip/Advance to Phase 4 Trataka Gazing | `<button>` |
| **Phase 4** | `trataka-card` | Trataka Gazing meditation card container | `<motion.div>` |
| **Phase 4** | `trataka-variant-name` | Trataka technique variant name | `<span>` |
| **Phase 4** | `trataka-timer` | Gazing timer countdown display (e.g. "2:00") | `<span>` |
| **Phase 4** | `trataka-visual-container`| Visual object animation stage (Flame, Bindu, Om, Moon, Mirror) | `<div>` |
| **Phase 4** | `trataka-voice-cue` | Spoken mindful cue (e.g. "Blink gently...") | `<p>` |
| **Phase 4** | `trataka-start-btn` | "Begin Gazing Practice" trigger button | `<button>` |
| **Phase 4** | `trataka-skip-btn` | Complete Trataka practice to Phase 4 Summary | `<button>` |
| **Summary** | `summary-card` | Post-session reflection & distress check container | `<motion.div>` |
| **Summary** | `summary-closing-reflection` | Closing mindfulness reflection quote | `<p>` |
| **Summary** | `distress-rating-btn-{1..10}` | Distress rating buttons (1 = Calm, 10 = Distress) | `<button>` |
| **Summary** | `session-complete-btn` | "Complete Session & Return" button | `<button>` |
| **Safety** | `crisis-modal` | Emergency crisis & helpline intervention modal | `<motion.div>` |
| **Safety** | `crisis-message` | Urgent compassionate safety notification | `<p>` |
| **Safety** | `crisis-helpline-telemanas` | Direct call link for Tele-MANAS (14416) | `<a>` |
| **Safety** | `crisis-helpline-tollfree` | Direct call link for 1-800-891-4416 | `<a>` |
| **Safety** | `crisis-close-btn` | "Close & Return" button | `<button>` |
| **Mic Consent**| `mic-consent-modal` | Audio microphone privacy consent modal | `<motion.div>` |
| **Mic Consent**| `mic-consent-allow-btn` | "Allow Microphone" button | `<button>` |
| **Mic Consent**| `mic-consent-cancel-btn`| "Cancel (Text Only)" button | `<button>` |
| **Input Bar** | `bottom-chat-footer` | Bottom input bar container | `<footer>` |
| **Input Bar** | `mic-error-banner` | Visible error banner (blocked/unsupported/network) | `<div>` |
| **Input Bar** | `mic-retry-btn` | "Retry Mic" recovery button | `<button>` |
| **Input Bar** | `mic-toggle-btn` | Microphone toggle button | `<button>` |
| **Input Bar** | `chat-text-input` | Text reply input field | `<input type="text">` |
| **Input Bar** | `chat-send-btn` | Send reply button | `<button>` |
| **Dock Controls**| `session-back-btn` | Persistent "Back" to previous phase button | `<button>` |
| **Dock Controls**| `session-pause-btn` | Persistent "Pause / Resume" session button | `<button>` |
| **Dock Controls**| `session-skip-btn` | Persistent "Skip Phase" button | `<button>` |
| **Dock Controls**| `session-reset-btn`| Persistent "Reset" session button | `<button>` |

---

## 2. Interactive State Variations

### Microphone Toggle Button (`[data-testid="mic-toggle-btn"]`)
- **Idle State:** Class includes `bg-emerald-500/10 text-emerald-400`, title attribute: `"Speak your reply (voice input)"`.
- **Listening State:** Class includes `bg-rose-500/25 text-rose-400 border-rose-500/70 animate-pulse`, title attribute: `"Stop listening"`.
- **Error State:** Accompanied by `[data-testid="mic-error-banner"]` containing human-readable error text and `[data-testid="mic-retry-btn"]`.

### Phase Indicators (`[data-testid^="phase-indicator-step-"]`)
- **Active Phase:** Contains class `bg-teal-500/20 border-teal-400 text-teal-200 font-bold`.
- **Completed Phase:** Contains class `bg-emerald-500/15 border-emerald-500/40 text-emerald-300` and renders a `<CheckCircle2>` icon.
- **Pending Phase:** Contains class `bg-slate-900/30 border-slate-800 text-slate-500`.

### Confirmation Voice State (`[data-testid="confirm-voice-status"]`)
- **Speaking Prompt:** Displaying helper prompt or assistant voice activity.
- **Listening:** Accompanied by pulsing emerald orb indicator and text: `"Listening... (Say Yes or No)"` (or Hindi: `"सुन रहे हैं... (हाँ या नहीं कहें)"`).
- **Fallback Buttons:** If speech recognition times out or is canceled, buttons `[data-testid="confirm-yes-btn"]` and `[data-testid="confirm-no-btn"]` pulse with clear visual affordance.
