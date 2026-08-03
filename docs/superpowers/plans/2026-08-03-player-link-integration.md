# Player Link Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the reusable `<PlayerLink />` component into `MatchCommentary.tsx` and `LineupPitch.tsx` to make player names and avatars clickable and route successfully to player profile pages.

**Architecture:** Use `<PlayerLink playerId={id}>` wrapper around player names and avatar images in both components. Update the commentary list mapping logic to generate React nodes with embedded links instead of raw template strings.

**Tech Stack:** React, Next.js, CSS Modules, TypeScript.

## Global Constraints
- Do NOT commit or push changes. Just make file edits and verify they build and lint successfully.
- All code modifications must compile with 100% success and 0 errors.

---

### Task 1: Update MatchCommentary to Use PlayerLink

**Files:**
- Modify: `frontend/components/MatchCommentary.tsx`

**Interfaces:**
- Consumes: `<PlayerLink playerId={...} />` from `frontend/components/PlayerLink.tsx`

- [ ] **Step 1: Read and verify current MatchCommentary.tsx**

Verify file path and imports.

- [ ] **Step 2: Apply edits to MatchCommentary.tsx**

Update the imports, the `CommentaryItem` interface, the event mapping in `useMemo`, and the render output.

```typescript
import PlayerLink from "./PlayerLink";

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

And update the `events.forEach` mappings:
```typescript
      if (event.type === "Goal") {
        type = "Goal";
        const isOwnGoal = event.detail.toLowerCase().includes("own goal");
        const isPenalty = event.detail.toLowerCase().includes("penalty");
        title = "GOAL!";
        
        if (isOwnGoal) {
          text = (
            <>
              Unfortunate moment for <PlayerLink playerId={event.player.id}>{event.player.name}</PlayerLink>! He accidentally deflects the ball into his own net. Own Goal for {isHome ? awayTeam.name : homeTeam.name}!
            </>
          );
        } else if (isPenalty) {
          text = (
            <>
              <PlayerLink playerId={event.player.id}>{event.player.name}</PlayerLink> steps up under immense pressure and coolly converts the penalty, sending the keeper the wrong way!
            </>
          );
        } else if (event.assist && event.assist.name) {
          text = (
            <>
              Brilliant team play! <PlayerLink playerId={event.player.id}>{event.player.name}</PlayerLink> strikes with clinical precision inside the box, finishing off a beautiful assist by <PlayerLink playerId={event.assist.id}>{event.assist.name}</PlayerLink>.
            </>
          );
        } else {
          text = (
            <>
              What a goal! <PlayerLink playerId={event.player.id}>{event.player.name}</PlayerLink> unleashes a fantastic strike that beats the goalkeeper into the corner. Goal for {event.team.name}!
            </>
          );
        }
      } else if (event.type === "Card") {
        type = "Card";
        const isYellow = event.detail.toLowerCase().includes("yellow");
        title = isYellow ? "Yellow Card" : "Red Card";
        text = (
          <>
            <PlayerLink playerId={event.player.id}>{event.player.name}</PlayerLink> receives a {event.detail.toLowerCase()} from the referee for a late, reckless challenge.
          </>
        );
      } else if (event.type === "subst") {
        type = "subst";
        title = "Substitution";
        const playerIn = event.assist?.name || "Incoming Player";
        const playerInId = event.assist?.id;
        const playerOut = event.player.name;
        const playerOutId = event.player.id;
        text = (
          <>
            Tactical shift: <PlayerLink playerId={playerInId}>{playerIn}</PlayerLink> is brought on to replace <PlayerLink playerId={playerOutId}>{playerOut}</PlayerLink> for {event.team.name}.
          </>
        );
      } else if (event.type === "Var") {
        type = "Info";
        title = "VAR Review";
        text = `Play is temporarily paused as the referee consults VAR for ${event.detail.toLowerCase()}.`;
      }

      list.push({
        id: key,
        elapsed: event.time.elapsed,
        extra: event.time.extra,
        type,
        teamId: event.team.id,
        teamName: event.team.name,
        playerName: event.player.name,
        playerId: event.player.id,
        title,
        text,
        isHome,
        detail: event.detail,
      });
```

And update the render avatar circle to be wrapped by `PlayerLink`:
```typescript
            {/* Body segment with Player Avatar and Text */}
            <div className={styles.itemBody}>
              {item.playerName && item.playerName !== "REF" && (
                <PlayerLink playerId={item.playerId}>
                  <div 
                    className={styles.playerAvatar} 
                    style={{ borderColor: avatarBorderColor }}
                    aria-hidden="true"
                  >
                    {getInitials(item.playerName)}
                  </div>
                </PlayerLink>
              )}
              <div className={styles.bodyTextWrapper}>
                <p className={styles.commentaryText}>{item.text}</p>
              </div>
            </div>
```

---

### Task 2: Update LineupPitch to Use PlayerLink

**Files:**
- Modify: `frontend/components/LineupPitch.tsx`

**Interfaces:**
- Consumes: `<PlayerLink playerId={...} />` from `frontend/components/PlayerLink.tsx`

- [ ] **Step 1: Add PlayerLink import**

Add `import PlayerLink from "./PlayerLink";` to the imports of `frontend/components/LineupPitch.tsx`.

- [ ] **Step 2: Update Home and Away Team starting XI render**

Wrap the avatar circle and player name within `PlayerLink` component.

```typescript
                  {/* Round Photo circle frame with border colors */}
                  <PlayerLink playerId={player.id}>
                    <div className={`${styles.avatarCircle} ${isGK ? styles.borderGK : styles.borderHome}`}>
                      {player.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photo} alt={player.name} className={styles.playerImg} />
                      ) : (
                        <div className={styles.imgPlaceholder}>{initials}</div>
                      )}
                      
                      {/* Performance rating badge overlapping the bottom center */}
                      {player.rating && (
                        <span className={`${styles.ratingBadge} ${getRatingStyle(player.rating)}`}>
                          {player.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </PlayerLink>
                  
                  {/* Number & Name labels below avatar */}
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>
                      <span className={styles.playerNo}>{player.number}</span> <PlayerLink playerId={player.id}>{player.name}</PlayerLink>
                    </span>
                  </div>
```

- [ ] **Step 3: Update Home and Away substitutes bench lists**

Wrap the bench avatars and names within `PlayerLink` component.

```typescript
              {lineups.home.substitutes.map((player) => (
                <li key={`home-sub-${player.id}`} className={styles.benchItem}>
                  <div className={styles.benchPlayerInfo}>
                    <PlayerLink playerId={player.id}>
                      <div className={styles.benchAvatarWrap}>
                        {player.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.photo} alt={player.name} className={styles.benchImg} />
                        ) : (
                          <div className={styles.benchImgPlaceholder}>{player.name.substring(0, 2).toUpperCase()}</div>
                        )}
                      </div>
                    </PlayerLink>
                    <span className={styles.benchNumber}>{player.number}</span>
                    <span className={styles.benchName}>
                      <PlayerLink playerId={player.id}>{player.name}</PlayerLink>
                    </span>
                    <span className={styles.benchPositionBadge}>{player.position}</span>
                  </div>
                  {player.rating && (
                    <span className={`${styles.benchRating} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
```

Do the exact same for lineups.away.substitutes.

---

### Task 3: Build & Quality Verification

- [ ] **Step 1: Run linter and typecheckers**

Run typechecking and linting inside `frontend` folder:
Run: `npm run lint` and `npm run build`

- [ ] **Step 2: Run pre-flight check**

Run: `python3 .pre-flight-check/scripts/run-pipeline.py`
Expected: ALL PASSED
