# AI usage reflection (Section 6)

This project was built with **Cursor** (AI pair-programming) alongside manual review and testing. I read the code that shipped, ran the app on each milestone, and made the final calls on architecture and UX.

## What the AI wrote end-to-end

- Initial monorepo scaffolding: root `package.json`, Express server skeleton, SQLite schema in `db.js`, seed script, and Vite/React/Tailwind client boilerplate.
- First pass of core UI: `SwipeCard` drag logic with Framer Motion, `ResultsView` leaderboard with three sort modes, `PetImage` loading/fallback, and `App.jsx` tab wiring.
- Bulk catalog structure: `pets.json` shape, interleave helper, `validateLocalImages`, and the `add-pets` merge script.
- Stretch implementations: `DELETE /api/vote` for undo, results polling with `setInterval`, and session resume via `GET /api/session/:sessionId/votes`.

## Where I pushed back or fixed the AI (concrete example)

The AI initially used **external image URLs** (Unsplash) and a **dog-only fallback** when loads failed. On the swipe deck, cats like “Ruby” showed the correct label but a dog photo — the UI was fine, the data pipeline was not. I rejected that approach: we switched to **local Oxford-IIIT images** under `client/public/pet-images/`, removed misleading fallbacks, and made `npm run seed` fail fast if any file is missing. I also hit a **blank screen after swiping** caused by an `AnimatePresence mode="wait"` wrapper the AI added; I simplified to a single keyed `SwipeCard` so the next card mounts reliably. Those were cases where accepting the AI’s “working” answer would have failed grading on correctness, not just polish.

## One thing better than expected, one thing worse

**Better:** Speed on repetitive full-stack wiring — API handlers, SQL aggregations for results (`yesPercent`, divisiveness), and mobile Tailwind layout came together quickly when I gave tight prompts (viewport, gesture thresholds, endpoint shapes).

**Worse:** Tendency to over-explain or add layers that broke behavior (external images, animation wrappers, random shuffle when I wanted a **fixed interleaved deck**). I learned to verify on device/emulator after every “done” claim and to ask for smaller, testable diffs.

## Other tools

- **Cursor Agent** for multi-file features and refactors.
- **Browser devtools** (390×844) for layout and gesture checks — not AI, but how I validated the AI’s output.

## Architectural decisions (mine)

- **SQLite + better-sqlite3** for zero-setup persistence.
- **Dedup:** `UNIQUE(item_id, session_id)` with upsert on vote.
- **Session:** anonymous UUID in `localStorage`; votes only in SQLite.
- **Deck order:** interleaved at seed, `ORDER BY id` — no per-browser shuffle.

## Honest gaps

- No matches view, no analytics dashboard.
- Demo is local-only (no production deploy), which matches the rubric.

I can walk through any file in the submission and explain what it does.
