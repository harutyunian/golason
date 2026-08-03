# Specification: SofaScore Search Overlay, Persistent Caching & Player Page Fix

## 📌 Context & Overview
This specification details the implementation of Option B, resolving:
1. **NestJS Caching Bug:** Moving from volatile, short-lived in-memory caches to a file-persistent, long-lived disk cache with smart TTLs.
2. **Player Page Mismatch:** Standardizing the player statistics mapping format on the NestJS backend to a flat structure matching the Next.js frontend requirements.
3. **Search Overhaul:** Transforming the hidden SearchBar into an immersive SofaScore search overlay with filter pills, `localStorage` history memory, and high responsiveness on small screens.

---

## 🛠️ Detailed Architecture Design

### 1. File-Persistent API Cache (`backend/.api-cache.json`)
- **Storage Strategy:** Instead of an ephemeral in-memory map, the cache will be backed by a local JSON file: `backend/.api-cache.json`.
- **Lifecycle Events:**
  - **On Startup (Module Initialization):** NestJS will load existing entries from disk. If the file is missing or corrupted, it falls back to an empty cache object.
  - **On Cache SET:** Writes the updated cache memory back to the JSON file (`fs.writeFileSync`).
  - **Pruning:** Expired entries are automatically filtered out upon loading or lookup.
- **Smart TTL Adjustments:**
  - Past calendar date fixtures: **24 hours** (constant)
  - Future calendar date fixtures: **12 hours** (constant)
  - Today's active fixtures list: **2 minutes** (120,000 ms)
  - Active/Live match details: **1 minute** (60,000 ms)
  - Standings: **1 hour** (3,600,000 ms)
  - Player/Team Profiles: **24 hours** (86,400,000 ms)

### 2. Player Statistics Flattening Mapping
We will update `backend/src/sports/football.controller.ts` to normalize statistics to a flat structure for both raw API-Football and mock profiles:
```typescript
stats: {
  matchesPlayed: number;
  matchesStarted: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  passAccuracyPercent: number;
  rating?: number;
}
```
- **Changes in `mapApiFootballToStandardPlayer`:** Flatten `mainStats.games.appearences`, `mainStats.goals.total`, etc., into the flat structure.
- **Changes in `getMockPlayerProfile`:** Flatten mock profiles (Saka, Ødegaard, etc.) into the same structure.

### 3. SofaScore Search Overlay System
- **Desktop Overlay:**
  - Clicking on the search input opens a wide overlay box and dims the rest of the page with a darkened backdrop mask.
- **Mobile Search Trigger:**
  - We will render a search icon `(Search)` in the mobile header navigation right next to the logo.
  - Clicking this icon launches a fully-immersive, full-screen overlay menu.
- **Pill Filters:**
  - Header pills inside the search overlay: `All`, `Teams`, `Players`.
  - Filters results dynamically on the client side based on selection.
- **LocalStorage Search History:**
  - Key: `"golason_search_history"`
  - Stores a list of up to 10 unique clicked search items (id, name, logo, type, position).
  - Shows under a **"Recent Searches"** (or Suggested) list when the search input is focused but empty.
  - Each history row has a delete button `(X)` to remove it from `localStorage`.

---

## 📈 Testing & Verification Plan

### Stage 1: NestJS Backend Verification
1. Verify NestJS boots cleanly and creates/loads `backend/.api-cache.json`.
2. Confirm refreshing a fixtures page multiple times results in `[Cache HIT]` log entries and does not hit the external API.
3. Test `GET /football/players/1468` to ensure it returns the flattened stats object.
4. Run `npm run test` in the backend folder to ensure all Jest Normalizer tests remain green.

### Stage 2: Next.js Frontend Verification
1. Access a player profile page (e.g. `/player/1468` or `/player/1460`) and ensure it renders without any React runtime errors.
2. Verify search bar overlay triggers correctly on desktop and mobile viewports.
3. Verify that clicking an autocomplete item navigates to the item and registers it in `"golason_search_history"`.
4. Verify that reloading the search input lists previously clicked items under "Recent Searches".
5. Compile the frontend using `npm run build` to verify type safety and compilation success.
