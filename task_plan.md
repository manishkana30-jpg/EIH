# Task Plan: EIH Quota-Optimized Orchestration & Architecture Overhaul

**Orchestrator Role:** Primary Architect (`gemini-3.1-pro`)  
**Objective:** Unified overhaul of the Emotional Intelligence Healer application across all tiers, strictly conserving high-tier API quota via tiered task delegation and context isolation.

---

## 1. Role & Quota Tier Mapping

| Task ID | Component / File | Assigned Role | Model Assignment | Quota Impact | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1.1** | `task_plan.md` | Primary Architect | `gemini-3.1-pro` | Moderate (1× Baseline) | Complete |
| **M2.1** | `app/(session)/page.tsx` (Purge Filler) | Primary Worker | `gemini-3-flash` | Very Low | Complete |
| **M2.2** | `keyless_healer/lib/psychologist_partner.py` (Purge Templates & State) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M2.3** | `lib/i18n/clinical-localization.ts` & `data/clinical_localization.json` (Clean Directives) | Primary Worker | `gemini-3-flash` | Very Low | Complete |
| **M2.4** | Workspace Grep Verification Audit | Fast Reviewer | `gemini-3-flash` | Very Low | Complete |
| **M3.1** | `server/scripts/seed_gita_library.py` (ChromaDB Seeder) | Primary Worker | `gemini-3-flash` | Very Low | Complete |
| **M3.2** | `keyless_healer/app.py` & `psychologist_partner.py` (Dilemma Router & 4-Step Prompt) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M3.3** | `app/(session)/components/GitaShlokaCard.tsx` (Amber Glassmorphism Card) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M4.1** | `app/(session)/page.tsx` (3-Column Center Stage & Hypnotic Anchor) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M4.2** | `app/(session)/page.tsx` (Compact Session Status Button) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M4.3** | `app/(session)/components/BreathingVisualizerOrb.tsx` (Removal / Purge) | Primary Worker | `gemini-3-flash` | Very Low | Complete |
| **M5.1** | `app/(session)/components/TratakaModule.tsx` (5-Stage Sequential Timeline) | Feature Specialist | `claude-sonnet-4.6` | Moderate | Complete |
| **M5.2** | `app/(session)/components/PratibimbCamera.tsx` (WebRTC Mirror & Permission Fallback) | Primary Worker | `gemini-3-flash` | Very Low | Complete |
| **M6.1** | `next.config.mjs` (Immutable Static Asset Caching) | Fast Reviewer | `gemini-3-flash` | Very Low | Complete |
| **M6.2** | `vercel.json` (Edge Delivery Headers) | Fast Reviewer | `gemini-3-flash` | Very Low | Complete |

---

## 2. Milestone Execution Audit Summary

- **Milestone 1 (Planning)**: `task_plan.md` created, tasks decomposed into single-file units bound to quota tiers.
- **Milestone 2 (Filler Purge)**: Static fallback templates and in-memory `_used_keys` sets purged; zero occurrences of `operating in localized`, `reconnecting`, or `take a deep breath` in clinical dialogue.
- **Milestone 3 (Gita RAG Engine)**:
  - ChromaDB persistent collection `gita_library` seeded with core psychological shlokas (BG 2.47, BG 2.14, BG 2.62-63, BG 6.5, BG 2.70, BG 18.63).
  - `detect_existential_dilemma` router and 4-step prompt injection protocol implemented in `gita_rag.py`, `psychologist_partner.py`, and `keyless_healer/app.py`.
  - Amber glassmorphic `GitaShlokaCard.tsx` component built with Devanagari serif typography, Roman transliteration, and structured reflection parsing.
- **Milestone 4 (UI Redesign)**:
  - Strict 3-column Center-Stage layout: Left fixed sidebar (`w-64`), Center stage (`flex-1 relative flex flex-col h-full overflow-hidden z-0`), Right telemetry sidebar (`w-72`).
  - High-performance rotating hypnotic anchor (`/hypnotic-circles.png`) centered behind chat history with `spin 50s linear infinite`.
  - Chat stream wrapped in glassmorphic container: `bg-slate-950/40 backdrop-blur-[2px] rounded-3xl m-4 border border-white/5 shadow-2xl flex-1 overflow-y-auto min-h-0 p-6 space-y-6 pb-32 z-10 relative`.
  - Compact session status button with `animate-ping` live state and zero box overlap.
- **Milestone 5 (5-Stage Trataka & Pratibimb)**:
  - Verified 5-stage sequential timeline in `TratakaModule.tsx` (Somatic Prep, Bahiranga with 2-min limit, Antaranga, Neuroplastic Reframe, Eye Palming).
  - `PratibimbCamera.tsx` updated with WebRTC reconnection, horizontal mirror (`scaleX(-1)`), browser lock icon (🔒) guidance, strict track teardown on unmount, and filler text purged.
- **Milestone 6 (Edge Caching & DevOps)**:
  - Verified `Cache-Control: public, max-age=31536000, immutable` and `no-store, max-age=0` in both `vercel.json` and `next.config.mjs`.

---

## 3. Test Verification Results
- `node tests/run-all-tests.js`: **100% Passed (All suites green)**
- `.venv/Scripts/python -m unittest tests/test_gita_rag.py`: **4/4 Tests Passed (OK)**
- `node node_modules/typescript/bin/tsc --noEmit`: **0 Errors**
