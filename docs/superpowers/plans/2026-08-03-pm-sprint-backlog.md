# Sprint Backlog: Core SofaScore Features
**Date:** 2026-08-03

## Epic 1: Universal Entity Routing (Teams & Players)
**Goal:** Ensure all team and player references across the application are interactive and route to their respective profile pages.

### Task 1.1: Team Link Component
- **Description:** Create a reusable `<TeamLink />` wrapper component that takes a `teamId` and wraps children with a Next.js `<Link href="/team/[id]">`.
- **Acceptance Criteria:** Component handles missing IDs gracefully and applies correct styling.

### Task 1.2: Integrate TeamLink on Match Page
- **Description:** Update `MatchDetails.tsx` and `MatchCard.tsx` to wrap Team logos and names with the `<TeamLink />` component.
- **Acceptance Criteria:** Clicking a team logo on a match card routes to the team profile.

### Task 1.3: Player Link Component
- **Description:** Create a reusable `<PlayerLink />` wrapper component for `playerId`.
- **Acceptance Criteria:** Uses Next.js `<Link href="/player/[id]">`.

### Task 1.4: Integrate PlayerLink on Match Page
- **Description:** Update `MatchCommentary.tsx` and `LineupPitch.tsx` (and other relevant components) to use `<PlayerLink />`.
- **Acceptance Criteria:** Clicking a player's name in the commentary or lineup routes to the player profile.

---

## Epic 2: Match Stats & Odds Integration
**Goal:** Display comprehensive match statistics and pre-match/live odds on the Match Details page.

### Task 2.1: Odds Data Fetching (Backend)
- **Description:** Update NestJS `football.controller.ts` and `football-normalizer.service.ts` to fetch and normalize Odds data for a match from API-Football.
- **Acceptance Criteria:** Endpoint returns an odds object (1, X, 2).

### Task 2.2: Stats UI Update (Frontend)
- **Description:** Enhance `MatchStats.tsx` to mirror the provided screenshot, adding possession, shots on target, and betting odds at the top.
- **Acceptance Criteria:** Odds are displayed in segmented buttons (e.g., `1 (1.57) | X (3.80) | 2 (4.75)`).

---

## Epic 3: Global SofaScore-style Search
**Goal:** Implement a global search overlay that allows users to find Teams, Players, Matches, and Competitions.

### Task 3.1: Search API Endpoint
- **Description:** Create a multi-entity search endpoint in NestJS (`GET /search?q=...`) that queries API-Football for teams, players, and leagues simultaneously.
- **Acceptance Criteria:** Returns categorized results (Teams, Players, Leagues).

### Task 3.2: Search Overlay Component (UI)
- **Description:** Build the `SearchOverlay.tsx` modal with a top input bar and a categorised list of results, matching the dark theme of the screenshots.
- **Acceptance Criteria:** UI matches the provided screenshot with tabs for (All, Team, Player, Match).

### Task 3.3: Search Integration
- **Description:** Update `Header.tsx` to trigger the `SearchOverlay` when the search bar is focused or clicked.
- **Acceptance Criteria:** Overlay opens smoothly and displays suggested results.

---

## Epic 4: API Data Utilization Audit
**Goal:** Identify unutilized data from API-Football for future features.

### Task 4.1: API Audit Script/Doc
- **Description:** Analyze the current `sports.types.ts` against the official API-Football documentation.
- **Acceptance Criteria:** Generate a Markdown report (`docs/api-audit.md`) listing all available endpoints/fields we are currently ignoring (e.g., referee details, venue coords, weather, TV stations).
