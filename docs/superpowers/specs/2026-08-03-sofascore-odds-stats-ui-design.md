# Spec: Task 2.2: Stats UI Update (Frontend)

## 1. Goal & Requirements
- Enhance the Match Stats tab to display a clean, high-fidelity betting odds section at the very top of the component.
- `MatchStats.tsx` should accept an optional `odds` prop of type `{ homeWin: string; draw: string; awayWin: string; } | null`.
- If `odds` exists and contains values, render a modern segmented buttons card.
- Format of buttons: `1 (homeWin) | X (draw) | 2 (awayWin)`.
- Update the match interface `StandardMatchWithDetails` in the frontend files to accept the `odds` property.
- Support responsive layout and high-quality styling matching SofaScore guidelines (clean background, bold values, hover effects, flex-row segmented buttons).

## 2. Interface Changes
- Update `StandardMatchWithDetails` in `frontend/app/match/[id]/MatchDetails.tsx` and `frontend/app/match/[id]/page.tsx`:
  ```typescript
  odds?: {
    homeWin: string;
    draw: string;
    awayWin: string;
  } | null;
  ```
- Update `MatchStatsProps` in `frontend/components/MatchStats.tsx` to include:
  ```typescript
  odds?: {
    homeWin: string;
    draw: string;
    awayWin: string;
  } | null;
  ```

## 3. UI/UX & Component Markup (`frontend/components/MatchStats.tsx`)
- Extract `odds` from `MatchStatsProps`.
- Render a section at the very top (above `<MatchShotmap />`) if `odds` exists.
- The betting odds section should include a section title "Betting Odds" (with an icon like `TrendingUp`) and segmented buttons.
- Display buttons side by side:
  - Button 1: Home Win label: `1` and value: `(${odds.homeWin})`
  - Button 2: Draw label: `X` and value: `(${odds.draw})`
  - Button 3: Away Win label: `2` and value: `(${odds.awayWin})`
- Implement interactive-looking but disabled/read-only or clickable design (SofaScore styled segmented buttons).

## 4. CSS Layout & Aesthetics (`frontend/components/MatchStats.module.css`)
- Style the `oddsSection` following existing accordion card layouts for visual consistency.
- Define a segmented button group: `oddsButtonGroup` utilizing flex layout, equal width children (`flex: 1`), gap, border radius, and transitions.
- Each button `oddsButton` styled with background, border, text colors, and subtle active/hover states to look high-end and modern.
- Text alignments: bold label, light muted parenthesis for odd values.

## 5. Integration (`frontend/app/match/[id]/MatchDetails.tsx`)
- In `MatchDetails.tsx`, when rendering `<MatchStats />`, pass `odds={match.odds}`:
  ```typescript
  {activeTab === 'stats' && (
    <MatchStats 
      stats={match.stats} 
      events={match.events} 
      lineups={match.lineups} 
      homeTeam={match.homeTeam} 
      awayTeam={match.awayTeam} 
      odds={match.odds}
    />
  )}
  ```

## 6. Testing & Validation
- Update local mock match (ID 101) in `frontend/app/match/[id]/page.tsx` with realistic mock odds to verify rendering works perfectly offline.
- Run `npm run build` inside `frontend/` to ensure 100% compilation success and zero type/linter errors.
