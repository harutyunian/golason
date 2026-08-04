# Specification: Player Link Integration on Match Page

## 📌 Context & Overview
Following the successful creation of the `<PlayerLink />` component in Task 1.3, we now need to integrate it into the match page details view. Specifically, Task 1.4 requires updating `frontend/components/MatchCommentary.tsx` and `frontend/components/LineupPitch.tsx` so that players referenced within match commentary events and the tactical pitch/bench views are clickable and route successfully to their player profiles (`/player/[id]`).

By utilizing the newly created `<PlayerLink />` component:
1. Every player name in the play-by-play commentary (goals, assists, cards, substitutions) will become an active link if their ID is provided by the API.
2. Every player name and avatar on the tactical lineup pitch, as well as players listed on the substitutes bench, will become clickable.
3. Fallback states are gracefully handled by `<PlayerLink />` when IDs are absent or invalid (e.g., mock absences/injuries or general info commentators).

---

## 🛠️ Detailed Architecture Design

### 1. Match Commentary Updates (`frontend/components/MatchCommentary.tsx`)
- **Imports:** Add `import PlayerLink from "./PlayerLink";`
- **CommentaryItem Interface:**
  We will update the `CommentaryItem` interface to accept `text` as `React.ReactNode` instead of `string` and add `playerId` so that we can wrap the player initials avatar in `PlayerLink` too.
  ```typescript
  interface CommentaryItem {
    id: string;
    elapsed: number;
    extra?: number | null;
    type: "Goal" | "Card" | "subst" | "Corner" | "Save" | "Foul" | "Info";
    teamId?: number;
    teamName?: string;
    playerName?: string;
    playerId?: number | string | null;
    title: string;
    text: React.ReactNode;
    isHome?: boolean;
    detail?: string;
  }
  ```
- **Text Mapping in useMemo:**
  Convert the hardcoded template strings into JSX blocks that wrap the player names with `<PlayerLink playerId={...}>`.
  - For goals, we wrap `event.player` (and `event.assist` if present).
  - For own goals, we wrap `event.player`.
  - For cards, we wrap `event.player`.
  - For substitutions, we wrap both incoming (`event.assist`) and outgoing (`event.player`) players.
  
- **Avatar Clickability:**
  Wrap the `playerAvatar` with `<PlayerLink playerId={item.playerId}>` so that both the text and initials avatar can be clicked to route to the profile page.

### 2. Lineup Pitch Updates (`frontend/components/LineupPitch.tsx`)
- **Imports:** Add `import PlayerLink from "./PlayerLink";`
- **Pitch Player Nodes (Home and Away Starting XI):**
  - Wrap the `avatarCircle` (which contains the player photo/initials and rating) in `<PlayerLink playerId={player.id}>`.
  - Wrap the player name portion within the `.playerName` container with `<PlayerLink playerId={player.id}>`.
- **Bench Substitutes:**
  - Wrap the `benchAvatarWrap` with `<PlayerLink playerId={player.id}>`.
  - Wrap the player name portion in `{player.name}` with `<PlayerLink playerId={player.id}>`.

---

## 📈 Testing & Verification Plan

### Stage 1: Static Analysis & Compilation
1. Run TypeScript build (`npm run build`) in `frontend/` to confirm perfect compilation with no typing or routing errors.
2. Run ESLint (`npm run lint`) inside `frontend/` to ensure no lint violations are introduced.

### Stage 2: Quality Gates
1. Run Pre-Flight Check:
   ```bash
   python3 .pre-flight-check/scripts/run-pipeline.py
   ```
   to verify all quality gates pass sequentially.
