# Golason API-Football Integration Audit Report

This audit report evaluates the current Golason backend data models and normalization services against the official and comprehensive **API-Football (v3)** data specification. It outlines critical gaps, unmapped endpoints, ignored data fields, and hardcoded fallbacks that exist in the codebase, and proposes architectural recommendations to align the Golason platform with standard API-Football capabilities.

---

## 📋 Executive Summary
The Golason platform currently uses the **API-Football v3 (API-Sports)** service as its primary data provider for football-related fixtures, lineups, statistics, and standings. 
A thorough comparative analysis of the types in `backend/src/sports/interfaces/sports.types.ts` and the mapping logic in `backend/src/sports/football-normalizer.service.ts` reveals that:
1. **Core Features are Mocked/Hardcoded**: Several highly user-interactive features on the frontend (e.g., Match Absences/Injuries, Player Ratings, and Match Odds) are currently driven by hardcoded mock functions, static arrays, or procedural fallbacks in the normalizer due to missing API ingestion pipelines.
2. **High-Value Contextual Fields are Ignored**: Context-rich fields such as Referee details, venue capacity, surface types, weather conditions, TV broadcast networks, and detailed substitution flows are parsed from raw payloads but discarded during normalization.
3. **Advanced API-Football Endpoints are Completely Omitted**: Features like player transfers, coach career histories, league leaders (top scorers/assists), statistical match predictions, and full team roster/squad listings are not currently supported by the database schema or normalizer logic.

---

## 🔍 Comparative Analysis Matrix

| Feature / Data Entity | API-Football (v3) Endpoint / Capability | Golason Current Status (`sports.types.ts` & `football-normalizer.service.ts`) | Type of Gap / Missing Element |
| :--- | :--- | :--- | :--- |
| **Referee Details** | `fixture.referee` (string format, e.g. "Michael Oliver, England") | Completely Ignored | Unmapped Field |
| **Weather & Pitch Conditions** | `fixture.weather` (temp, wind, humidity, description) | Completely Ignored | Unmapped Field |
| **TV Stations / Broadcasters** | Subscription metadata & match schedules | Completely Ignored | Unmapped Endpoint / Data |
| **Detailed Venue Capacity & Surface** | `/venues` endpoint or `fixture.venue` (id, capacity, surface, image, coordinates) | Only maps `venueName` and `venueCity` as strings on `StandardTeam`. Capacity, surface (grass vs artificial), venue images, and geo-coordinates are missing. | Partially Normalized Field |
| **Detailed Substitution Mapping** | `events` (where `type: "subst"` and the payload maps `player` as outgoing and `assist` as incoming player) | Normalizes generic `player` and `assist` fields in events but lacks a structured, self-documenting substitution model (e.g., `playerIn`, `playerOut` IDs). | Structural Gap |
| **Player Match Performance & Ratings** | `/fixtures/players` (returns individual player stats per fixture including minutes, key passes, tackles, and rating out of 10) | Lineup players have a `rating: number` property but the normalizer explicitly hardcodes it to `null` because the rating is not present in the standard lineups response. No ingestion exists for `/fixtures/players`. | Missing Endpoint & Incomplete Normalization |
| **Injuries & Absences** | `/injuries` (lists players injured, suspended, or doubtful for a given fixture, with reasons) | Maps a single static `injured: boolean` on `StandardPlayer`. The match-level lineup absences UI is driven entirely by a hardcoded mock method (`getAbsencesByTeams`) inside the normalizer. | Completely Mocked Endpoint |
| **Coaches & Managers** | `/coaches` (profiles, career path, history, personal photos, birth, and nationality) | Only maps `id` and `name` inline in the lineup coach sub-object. Coach photos and career profiles are omitted. | Incomplete Normalization |
| **Player Transfers** | `/players/transfers` (dates, transfer types: loan/buy/free, outgoing/incoming teams) | Completely Ignored (No database table or type mapping exists) | Completely Omitted Endpoint |
| **Full Rosters & Squads** | `/players/squads` (full rosters of teams with jersey numbers, player profiles, and birth details) | No sync pipeline. Player details are only discovered on-the-fly when processing lineups of scheduled or completed matches. | Structural Gap |
| **League Stats Leaders** | `/players/topscorers`, `/players/topassists`, `/players/topyellowcards`, `/players/topredcards` | Completely Ignored (No tables, models, or controllers support league leaders) | Completely Omitted Endpoint |
| **Match Predictions** | `/predictions` (H2H comparison stats, advice, win percentage distributions) | Completely Ignored | Completely Omitted Endpoint |
| **Standings Sub-Splits** | `/standings` (returns nested `home`, `away`, and `all` structures for played, won, drawn, lost, and goal details) | Only maps the combined `all` summary stats (`played`, `win`, `draw`, `lose`, `points`, `goalsDiff`). Home vs. Away performance splits are completely omitted. | Partially Normalized Field |
| **Standings Group & Prom/Relegation** | `/standings` (`group` names for multigroup leagues, `status` or `description` for promotions/relegations) | Ignored (Only normalizes raw rank and points) | Unmapped Field |
| **Odds / Betting Markets** | `/odds` (pre-match odds covering Match Winner, Over/Under, BTTS, Double Chance, etc.) | Standardizes only the Match Winner (1x2) market. If the external odds API fails, it falls back to procedurally generated values based on whether the fixture ID is odd or even. | Limited Mapping & Hardcoded Fallback |

---

## 🛠️ Detailed Endpoint & Field-Level Audit

### 1. Match Officials (Referee Details)
* **API-Football Specification**: The `/fixtures` endpoint provides `fixture.referee` (e.g. `" referee": "Michael Oliver, England"`).
* **Golason Normalization Status**: This field is parsed in raw payloads but entirely ignored.
* **Impact**: Lacking referee data deprives users of critical context (referee card-giving tendencies, historical match-fixing controversies, and local officiating dynamics).

### 2. Match Atmosphere (Weather, Pitch & TV Stations)
* **API-Football Specification**:
  * `fixture.weather`: Contains `{ "temp": "14°C", "wind": "11 km/h", "humidity": "67%", "clouds": "40%" }`.
  * `fixture.venue`: Includes a venue ID, capacity, surface, and image.
* **Golason Normalization Status**:
  * Weather is completely ignored.
  * Only the venue name and city are parsed as strings. Surface types (e.g., Grass vs. Artificial Turf, which impacts player injury risk and ball physics) and capacity are omitted.
  * No TV listings are ingested.
* **Impact**: Fans cannot see if a match is played under rainy, snowy, or extremely hot conditions, nor can they easily check which TV networks or streaming channels are broadcasting the game locally.

### 3. Substitution Event Schema (Detailed Substitution Mapping)
* **API-Football Specification**: Substitution events in the `/fixtures` JSON payload are identified by `type: "subst"`. The `player` object refers to the player exiting the pitch, and the `assist` object holds the player entering.
* **Golason Normalization Status**:
  ```typescript
  export interface StandardMatchEvent {
    type: 'Goal' | 'Card' | 'subst' | 'Var';
    player: { id: number; name: string; };
    assist?: { id: number | null; name: string | null; } | null;
  }
  ```
  The normalizer copies these fields verbatim into `player` and `assist`.
* **Technical Gap**: There is no semantic differentiation in our typescript schema. To build a clean UI timeline, the frontend must guess which player went off and which came on by assuming `player` is "Off" and `assist` is "In". This creates fragile rendering code and does not represent proper substitution event contracts.

### 4. Player Match Performance & Ratings (The Lineups Endpoint Limitation)
* **API-Football Specification**: 
  * The `/fixtures/lineups` endpoint **does NOT** contain individual player ratings or match statistics.
  * Real player ratings, heatmaps, and in-game performance stats (key passes, interceptions, tackles, dribble success rates) are located in the dedicated **`/fixtures/players`** endpoint.
* **Golason Normalization Status**:
  ```typescript
  // In football-normalizer.service.ts
  private buildLineupObject(lineup: any) {
    return {
      formation: lineup.formation || '4-3-3',
      startXI: lineup.startXI?.map((item: any) => ({
        id: item.player?.id || null,
        name: item.player?.name || 'Player',
        number: item.player?.number || 0,
        position: item.player?.pos || 'M',
        grid: item.player?.grid || null,
        rating: null, // HARDCODED TO NULL!
      })) || [],
      // ...
    };
  }
  ```
  Our types defined `rating` as optional. Because we only fetch `/fixtures/lineups`, **all real-world player ratings are hardcoded to null during normalization**.
* **Impact**: The UI has no real-time player ratings for actual live or completed fixtures. This forces the system to either leave ratings empty or use simulated, synthetic values, severely degrading the platform's professional feel.

### 5. Roster Absences & Injuries
* **API-Football Specification**: The `/injuries` endpoint lists absences by fixture ID, providing reasons (e.g., "Hamstring Injury", "Suspended") and statuses (out vs. doubtful).
* **Golason Normalization Status**:
  The match lineups absences UI is completely driven by a hardcoded mock method (`getAbsencesByTeams`) inside the normalizer:
  ```typescript
  private getAbsencesByTeams(home: string, away: string) {
    if (isArsenalMatch) {
      return {
        home: [{ name: 'Gabriel Jesus', reason: 'Knee Injury', status: 'out' }, ...],
        away: [{ name: 'Reece James', reason: 'Hamstring Injury', status: 'out' }, ...]
      };
    } else if (isUSLMatch) {
      // Hardcoded Birmingham Legion absences...
    }
    return {
      home: [{ name: 'Star Forward', reason: 'Muscle Strain', status: 'doubtful' }],
      away: [{ name: 'Midfielder Captain', reason: 'Suspended - Cards', status: 'suspended' }]
    };
  }
  ```
* **Impact**: Golason cannot display real, squad-accurate injuries for any teams other than Arsenal and Birmingham Legion. Any other match on the platform falls back to generic "Star Forward" or "Midfielder Captain" dummy data.

### 6. Team Coaches & Managers
* **API-Football Specification**: The dedicated `/coaches` endpoint tracks full managerial profiles, career teams, dates of birth, places of birth, and headshot photos.
* **Golason Normalization Status**:
  The normalizer only maps `id` and `name` parsed inline from the lineups payload:
  ```typescript
  coach: {
    id: lineup.coach?.id || null,
    name: lineup.coach?.name || 'Coach',
  }
  ```
* **Impact**: Coach photos, career histories, and profiles are completely ignored. Managers are treated as static strings on a lineup rather than independent entities.

### 7. Player Transfers & History
* **API-Football Specification**: The `/players/transfers` endpoint lists complete transfer records (transfer dates, market values, and from/to clubs).
* **Golason Normalization Status**: Completely ignored.
* **Impact**: Users cannot browse player history, career statistics, or check recent transfer news on team/player detail pages.

### 8. Match Predictions & Analysis
* **API-Football Specification**: The `/predictions` endpoint returns a rich analysis comparing:
  * Team form (last 5 matches)
  * Attacking/Defensive coefficients
  * Head-to-Head ratios
  * Win/Draw/Loss probabilities (e.g. 45% Home, 25% Draw, 30% Away)
  * Betting advice (e.g. "Double chance: Home or Draw")
* **Golason Normalization Status**: Completely ignored.
* **Impact**: Golason lacks analytical depth. There are no built-in AI/statistical match analyses to assist bettors or sports analysts.

### 9. Standing splits (Home/Away performance)
* **API-Football Specification**: The `/standings` response contains detailed splits inside the `all`, `home`, and `away` sub-objects.
* **Golason Normalization Status**:
  ```typescript
  export interface StandardStanding {
    played: number;
    win: number;
    draw: number;
    lose: number;
    // ...
  }
  ```
  Only the combined `all` summary stats are extracted. Home and Away records are dropped.
* **Impact**: Users cannot see if a team is a "home fortress" or struggling significantly during away matches, which is essential context in league analysis.

---

## 📈 Strategic Technical Recommendations

To address these gaps and transition Golason from a prototype to a production-grade, context-rich sports platform, we recommend a phased implementation plan:

### Phase 1: Real-Time Player Ratings Ingestion (High Priority)
* **Action**: Update the backend fixture service to query the `/fixtures/players` endpoint upon match completion or at regular intervals during live matches.
* **Modification**:
  * Expand `sports.types.ts` to include a structured `PlayerFixtureStats` interface.
  * Update `FootballNormalizerService` to merge player rating data from the players stats endpoint into the `LineupPlayer` arrays.
* **Outcome**: Solves the hardcoded null ratings issue and enables live player performance analysis on the match screen.

### Phase 2: Dynamic Injuries & Absences Sync (Medium Priority)
* **Action**: Replace the hardcoded `getAbsencesByTeams` fallback in `football-normalizer.service.ts` with a real-time ingestion pipeline fetching from `/injuries`.
* **Modification**:
  * Create a database model `FixtureAbsence` linked to teams and matches.
  * Integrate a background cron scheduler that queries the `/injuries?fixture={id}` endpoint daily/hourly for upcoming matches and caches the results.
* **Outcome**: Enables squad-accurate, real-world injury and suspension listings for all matches on the site.

### Phase 3: Schema Enrichment for Atmosphere & Match Officials
* **Action**: Add Referee, Venue details, and Weather properties to the `StandardMatch` and `StandardTeam` schemas.
* **Modification**:
  ```typescript
  export interface StandardMatch {
    // ...
    referee?: string | null;
    weather?: {
      temp?: string | null;
      description?: string | null;
      icon?: string | null;
    } | null;
  }
  ```
  Update `normalizeFixture` to extract these fields from the raw API payload.
* **Outcome**: Renders detailed weather conditions and referee context directly on the match details dashboard.

### Phase 4: Standings Splits Expansion
* **Action**: Enriched the league standings model and database schema to store separate Home and Away sub-records.
* **Modification**:
  ```typescript
  export interface StandingSplit {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goalsFor: number;
    goalsAgainst: number;
  }
  export interface StandardStanding {
    // ...
    all: StandingSplit;
    home: StandingSplit;
    away: StandingSplit;
  }
  ```
* **Outcome**: Supports complex toggle tabs (All, Home, Away) on the Standings component.

---

## 📝 Conclusion
While Golason provides an excellent visual representation of real football fixtures, its backend normalizer maps a very restricted subset of available API-Football capabilities. By removing hardcoded fallbacks and expanding the schema to ingest highly valuable contextual metadata, we can elevate Golason to stand alongside premium sports platforms.
