# PawSwipe

**Theme:** Adoptable pets — users swipe yes/no on dog and cat cards to signal interest. Community-wide results show which pets are most loved, most voted on, and most divisive.

Mobile-first swipe-to-vote web app. Votes persist in **SQLite** on the server (not in `localStorage`). Results aggregate across all users.

## Quick start

**Prerequisites:** Node.js 18+ and npm.

```bash
npm run install:all
npm run seed
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)

`npm run seed` loads `server/data/pets.json` into SQLite and checks that each image file exists.

## Architecture

The repo is a small monorepo: **React + Vite + Tailwind + Framer Motion** on the client, **Node + Express + better-sqlite3** on the server. The client calls `/api/*` on port 3001; Vite proxies in dev. Catalog data lives in `server/data/pets.json` and is loaded into SQLite via `server/seed.js` so the API can join items with votes efficiently. The swipe deck fetches items once, tracks which IDs this session has voted on (from `GET /api/session/:sessionId/votes` on load), and posts each decision to `POST /api/vote`. The Results tab fetches `GET /api/results` and polls every 5 seconds while open.

**Why SQLite:** Zero external services for local demo/grading, single file (`server/pawswipe.db`, gitignored), and `better-sqlite3` gives synchronous, simple queries under time pressure. Trade-off: not ideal for high concurrent write load, but correct and easy to reason about for this assessment.

**Vote deduplication:** `votes` has `UNIQUE (item_id, session_id)`. `POST /api/vote` uses `INSERT … ON CONFLICT DO UPDATE` so one row per user per pet; counts never double. `sessionId` is a random UUID in `localStorage` (`pawswipe_session_id`) — identity is anonymous, not auth. Vote payloads are validated server-side (`choice` must be `yes` or `no`, `itemId` must exist).

## Requirements checklist

### Core (Section 3.1)

| Requirement | Status | Notes |
|-------------|--------|--------|
| Theme documented | Done | Adoptable pets (this README) |
| 100+ items with image + label/description | Done | 120 pets; name, species, description, local image |
| Swipe right = yes, left = no | Done | `SwipeCard.jsx`; Yes/No buttons as fallback |
| Gesture feedback (tilt, color, threshold) | Done | Rotation, green/red tint, YES/NO badges |
| Smooth transition to next card | Done | Framer Motion exit + next card |
| Results view (tab or pull-down) | Done | **Results** tab in header |
| Aggregate counts, sortable/filterable | Done | Sorts: most loved, most voted, most divisive |
| Backend source of truth | Done | SQLite; `localStorage` only for `sessionId` |
| End-of-deck state | Done | `EndState` + link to Results |
| Mobile 390×844, touch + mouse drag | Done | Max-width layout; drag works on desktop |

### Stretch (Section 3.2)

| Stretch | Status | Notes |
|---------|--------|--------|
| 1. Session / identity | Done | Anonymous `sessionId`; votes survive reload |
| 2. Undo last swipe | Done | Header “Undo last vote”; `DELETE /api/vote` |
| 3. Matches view | Not done | — |
| 4. Live aggregate updates | Done | Results tab polls every 5s |
| 5. Add items without code changes | Done | `npm run add-pets` + `server/data/add-pets.json` |
| 6. Analytics | Not done | — |

## Commands

| Command | What it does |
|---------|----------------|
| `npm run install:all` | Install root, server, and client dependencies |
| `npm run seed` | Load `pets.json` into SQLite (validates local images) |
| `npm run dev` | API on :3001 + Vite on :5173 |
| `npm run add-pets` | Merge `server/data/add-pets.json` into catalog |
| `npm run build:client` | Production build of the client |

## Project layout

```
client/          React app (swipe UI, results, public/pet-images/)
server/          Express API, db.js, seed.js, data/pets.json
scripts/         add-pets.js (stretch: extend catalog)
```

## Pet data

- Catalog: `server/data/pets.json` (120 pets: 60 dogs, 60 cats)
- Photos: `client/public/pet-images/pet-001.jpg` … `pet-120.jpg`
- Images are local paths only at runtime (e.g. `/pet-images/pet-001.jpg`)

### Add pets (stretch)

1. Copy a photo to `client/public/pet-images/` (e.g. `pet-121.jpg`).
2. Add an entry to `server/data/add-pets.json`, then run `npm run add-pets` and `npm run seed`.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/items` | All pets |
| POST | `/api/vote` | `{ itemId, choice, sessionId }` |
| DELETE | `/api/vote` | Remove vote (undo) |
| GET | `/api/results` | Aggregated yes/no per item |
| GET | `/api/session/:sessionId/votes` | This session’s votes (resume deck) |
| GET | `/api/health` | Health check |

## What I didn’t get to

- Results open from the **Results** tab in the header — I didn’t add pull-down-to-results.
- Leaderboard sorts are most loved / most voted / most divisive only (no “least voted” or skipped filter).
- Didn’t build the **matches** or **analytics** stretch features.

## Dataset credit

Images are sampled from the **Oxford-IIIT Pet Dataset** (Parkhi et al., University of Oxford). See [dataset terms](https://www.robots.ox.ac.uk/~vgg/data/pets/).

## AI usage

See **[AI_NOTES.md](./AI_NOTES.md)** for the required reflection on AI-assisted development (Section 6).
