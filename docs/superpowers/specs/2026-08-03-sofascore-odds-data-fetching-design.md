# Spec: Task 2.1: Odds Data Fetching (Backend)

## 1. Goal & Requirements
- Fetch, normalize, and return match odds (Home Win, Draw, Away Win) on the single match details endpoint.
- Add an `odds` field to the match/fixture interface representation.
- Provide realistic fallback odds if the external API returns no odds or is offline/unavailable.
- Update demo match objects (ID 101 to 105) to include realistic pre-populated odds.

## 2. Interface Changes (`backend/src/sports/interfaces/sports.types.ts`)
- Add `MatchOdds` interface:
  ```typescript
  export interface MatchOdds {
    homeWin: string;
    draw: string;
    awayWin: string;
  }
  ```
- Add `odds?: MatchOdds | null;` to `StandardMatch` interface.

## 3. API-Football Integration (`backend/src/sports/api-football-client.service.ts`)
- Define `getOddsByFixtureId(fixtureId: number): Promise<any>` invoking the `GET /odds?fixture={id}` endpoint.
- Protect against network/timeouts with the custom wrapper.

## 4. Normalization & Fallbacks (`backend/src/sports/football-normalizer.service.ts`)
- Add `odds?: MatchOdds | null;` to the `StandardMatchWithDetails` interface.
- Add real-world odds to all premium demo matches (101-105).
- Parse the API-Football odds response structure: `/odds` returns a list of bookmakers and their bets. We'll search for the "Match Winner" bet (Bet ID 1) from Bwin, Bet365, or the first available bookmaker.
- Map the values of "Home", "Draw", "Away" or equivalent markers.
- Implement `generateFallbackOdds(fixtureId: number): MatchOdds` using a deterministic formula to supply realistic fallback odds when API-Football lacks odds for a fixture.

## 5. Controller Updates (`backend/src/sports/football.controller.ts`)
- Use `Promise.all` in `getFixtureById` to fetch both fixture details and odds concurrently.
- Pass the raw odds payload to `normalizeFixture`.

## 6. Testing & Validation
- Add test coverage verifying odds mapping and deterministic fallback odds in `football-normalizer.service.spec.ts`.
- Ensure mock clients in `football.controller.spec.ts` are properly stubbed so that existing tests remain green.
