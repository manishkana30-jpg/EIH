# Tier 2 Pending Review Log

> **Protocol Directive:** All Tier 2 improvements require explicit manual approval and must never be applied automatically. The state machine, crisis/safety logic, voice capture pipeline, and word highlighter synchronization are permanently excluded from auto-learning.

---

### [PROP-003] Expand Hindi Gita Shloka Library for Modern Burnout Syndrome
- **Date Proposed:** 2026-09-27
- **Area:** Content Expansion (Bhagavad Gita Wisdom)
- **Detected Issue:** Users reporting "chronic workplace burnout" are routed to generalized Chapter 2 Verse 47 repeatedly due to limited shloka mappings for burnout.
- **Evidence:** 38 sessions with workplace exhaustion had 100% repetition of shloka 2.47; mood uplift delta plateaued at +0.8 (vs average +2.3).
- **Hypothesis:** Adding Chapter 6, Verse 16 (*Nātyaśnatastu yogo'sti... moderation in rest, eating, and labor*) provides specific cognitive balance for overwork exhaustion.
- **Proposed Diff:**
```json
{
  "shloka_additions": [
    {
      "chapter": 6,
      "verse": 16,
      "sanskrit": "नात्यश्नतस्तु योगोऽस्ति न चैकान्तमनश्नतः। न चाति स्वप्नशीलस्य जाग्रतो नैव चार्जुन॥",
      "meaning": "Yoga is not attainable by one who overworks or eats excessively, nor by one who starves, nor by one who sleeps too much or stays constantly awake. Moderation is the path to overcoming suffering.",
      "emotion_targets": ["workplace_burnout", "chronic_exhaustion", "somatic_depletion"]
    }
  ]
}
```
- **Safety Review:** Verified strictly non-crisis. Does not touch state machine or voice capture pipeline.
- **Action Required:** Approve / Reject by User.
