# Performance Baseline Report: Emotional Intelligence Healer (EIH)
**Measurement Date:** 2026-09-27
**Environment:** Next.js 14.2.35 Production Build | Chrome 124+ | Windows 64-bit | Local Hardware (Vercel Hybrid Model)
**Reference Commits/State:** Keyless Healer, 4-Phase Guided Sanctuary Flow, Faster-Whisper Local Engine

---

## 1. Executive Summary & Baseline Metrics Table

| Metric Category | Baseline Value | Target / Ideal | Status |
| :--- | :--- | :--- | :--- |
| **Total Route Size (Route `/`)** | **105 kB** (First Load JS: **351 kB**) | < 250 kB First Load | Requires Code-Splitting |
| **First Load JS Shared** | **87.6 kB** (2 major chunks) | < 80 kB | Modest optimization |
| **Total Static Chunks Shipped** | **58 files** (2446.91 KB raw / 892.50 KB gzip) | Reduce unused assets/chunks | Target dead weight removal |
| **Initial TTFB** | **21.4 ms** | < 100 ms | Excellent |
| **First Contentful Paint (FCP)** | **112.0 ms** | < 800 ms | Fast initial render |
| **DOM Content Loaded** | **106.6 ms** | < 500 ms | Fast |
| **Karaoke Highlighter Frame Rate** | **Avg 130.6 fps** (Min 106.0 fps) | Stable 60 fps | Smooth (60fps baseline established) |
| **Long Tasks (>50ms) across run**| **2 tasks** | < 5 tasks | Monitor during TTS playback |
| **Initial JS Heap** | **11.98 MB** | < 30 MB | Normal baseline |
| **Heap After 1 Session (post-GC)** | **9.32 MB** | Stable | Normal |
| **Heap After 4 Repeated Sessions**| **9.89 MB** (Total: 10.97 MB) | Stable (no monotonic leak) | Minimal growth |
| **Network Requests (Full run)** | **308 total requests** | Eliminate duplicate API syncs | Needs deduplication |

---

## 2. Production Bundle Size & Chunk Breakdown

### Next.js Route Bundle Sizes:
```
Route (app)                              Size     First Load JS
┌ ƒ /                                    105 kB          351 kB
├ ƒ /_not-found                          146 B          87.7 kB
├ ƒ /about                               189 B          96.5 kB
├ ƒ /analytics/session-report            6.12 kB        93.7 kB
├ ƒ /backend-health                      9.36 kB         116 kB
├ ƒ /clinical-guide                      189 B          96.5 kB
├ ƒ /crisis                              9.3 kB          106 kB
├ ƒ /library                             7.71 kB         250 kB
└ ƒ /terms                               188 B          96.5 kB
+ First Load JS shared by all            87.6 kB
  ├ chunks/117-7e78365164a8f69b.js       31.7 kB
  ├ chunks/fd9d1056-411c0e320fe15393.js  53.6 kB
  └ other shared chunks (total)          2.23 kB
```

### Top 15 Heaviest Static Chunks Shipped:
| Chunk / Asset File | Raw Size (KB) | Gzipped Size (KB) |
| :--- | :--- | :--- |
| `chunks/85-91be9b4ec7f54a25.js` | 496.12 KB | 137.26 KB |
| `chunks/app/(session)/page-08c5ff6222c2106a.js` | 198.55 KB | 57.33 KB |
| `chunks/fd9d1056-411c0e320fe15393.js` | 168.78 KB | 52.48 KB |
| `chunks/761.2a9222e93f17ebf3.js` | 159.43 KB | 44.84 KB |
| `chunks/967-63ead1d2aba04aba.js` | 139.68 KB | 45.31 KB |
| `chunks/framework-f66176bb897dc684.js` | 136.70 KB | 43.89 KB |
| `chunks/main-2d2ba38bf9990fa6.js` | 129.01 KB | 37.98 KB |
| `chunks/117-7e78365164a8f69b.js` | 121.38 KB | 31.07 KB |
| `css/1e2f0b93ff14174b.css` | 118.58 KB | 18.60 KB |
| `chunks/polyfills-42372ed130431b0a.js` | 109.96 KB | 38.70 KB |
| `media/8e9860b6e62d6359-s.woff2` | 83.27 KB | 83.31 KB |
| `chunks/172.23fcc15cf740ece5.js` | 50.28 KB | 13.49 KB |
| `media/e4af272ccee01ff0-s.p.woff2` | 47.30 KB | 47.31 KB |
| `chunks/708.8ed02ca0fe86518b.js` | 46.37 KB | 14.81 KB |
| `media/7b0b24f36b1a6d0b-s.p.woff2` | 31.47 KB | 31.34 KB |

---

## 3. Network Waterfall & Request Profile

* **Total HTTP Requests in Session:** 308
* **Breakdown by Resource Type:**
  * **document:** 2 requests
  * **stylesheet:** 4 requests
  * **script:** 52 requests
  * **other:** 2 requests
  * **fetch:** 248 requests

* **Identified Potential Duplicate / Redundant Requests:**
  * `http://localhost:3001/` was fetched **2 times**
  * `http://localhost:3001/_next/static/css/6e4eb03886cdcffd.css` was fetched **2 times**
  * `http://localhost:3001/_next/static/css/1e2f0b93ff14174b.css` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/webpack-a36c365c88abbaf3.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/fd9d1056-411c0e320fe15393.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/117-7e78365164a8f69b.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/main-app-cddf176ce031f794.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/972-113806ce51de795a.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/967-63ead1d2aba04aba.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/981-b3e7cb7398077840.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/85-91be9b4ec7f54a25.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/318-264f6e12aa16c0b8.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/app/(session)/page-08c5ff6222c2106a.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/app/layout-20c400f86100c658.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/app/error-ea43e37bc67e9b6a.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/app/global-error-50a937f6b24f94c3.js` was fetched **2 times**
  * `http://localhost:3001/icons/icon.svg` was fetched **2 times**
  * `http://localhost:3001/api/library/sync` was fetched **2 times**
  * `http://127.0.0.1:8000/health` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/935.9b7bc4d3f77419c9.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/279.1886151266a46c0f.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/172.23fcc15cf740ece5.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/243.651780814c8a88f1.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/766.1d0d11d9319b84f0.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/761.2a9222e93f17ebf3.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/921.8b8629520d3182ec.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/58.2c429beb83beea08.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/708.8ed02ca0fe86518b.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/112.8189eef8b5c0bf58.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/772.75c2422219b2e407.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/661-daec9b1cd509c44d.js` was fetched **2 times**
  * `http://localhost:3001/_next/static/chunks/13.e7ae7a62c32f110f.js` was fetched **2 times**

---

## 4. Runtime Smoothness & Memory Snapshot

* **Initial Heap (Page Mount):** 11.98 MB
* **Heap After Phase 2 Playback:** 13.89 MB
* **Heap After Session 1 (Post-GC):** 9.32 MB
* **Heap After 4 Repeated Sessions (Post-GC):** 9.89 MB
* **Highlighter Animation Performance:**
  * Average Render FPS: **130.6 fps**
  * Minimum Dip FPS: **106.0 fps**
  * Layout thrashing reflows: 0 (eliminated via symmetric padding & outline styling)

---

## 5. Visual Artifacts
* Initial Load Baseline Screenshot: `reports/screenshots/baseline_initial_load.png`
* Phase 2 Gita Card Loaded Baseline Screenshot: `reports/screenshots/baseline_phase2_gita.png`

---
*Generated autonomously by Antigravity Agent - Step 0 Baseline Verification.*
