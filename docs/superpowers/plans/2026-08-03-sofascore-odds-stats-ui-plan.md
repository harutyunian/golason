# Match Stats Betting Odds UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Match Stats tab to display a high-fidelity betting odds section at the very top of the component.

**Architecture:** Update match interfaces to support an optional `odds` property, extend MatchStats to accept this property, render a side-by-side segmented button group displaying Home Win, Draw, and Away Win, and style with CSS variables.

**Tech Stack:** Next.js (TypeScript), React, CSS Modules, Lucide React (TrendingUp).

## Global Constraints
- `StandardMatchWithDetails` and other match prop interfaces inside the frontend must accept `odds?: { homeWin: string; draw: string; awayWin: string; } | null;`.
- Check if `odds` exists before rendering the section.
- Display in segmented buttons: `1 (1.57) | X (3.80) | 2 (4.75)`.
- No commit or push. Run `npm run build` inside `frontend/` to verify.

---

### Task 1: Interface and Mock Data Updates

**Files:**
- Modify: `frontend/app/match/[id]/MatchDetails.tsx`
- Modify: `frontend/app/match/[id]/page.tsx`
- Modify: `frontend/components/MatchStats.tsx`

**Interfaces:**
- Consumes: None.
- Produces: Updated `StandardMatchWithDetails` and `MatchStatsProps` supporting `odds?: { homeWin: string; draw: string; awayWin: string; } | null;`.

- [ ] **Step 1: Update frontend interfaces**
- [ ] **Step 2: Add realistic mock odds to fallback match (ID 101)**
- [ ] **Step 3: Verify typescript compile in MatchDetails and page**

---

### Task 2: MatchStats Component and CSS Styling

**Files:**
- Modify: `frontend/components/MatchStats.tsx`
- Modify: `frontend/components/MatchStats.module.css`
- Modify: `frontend/app/match/[id]/MatchDetails.tsx`

**Interfaces:**
- Consumes: Interfaces and `odds` prop from Task 1.
- Produces: Clean, styled segmented buttons betting odds section.

- [ ] **Step 1: Write the JSX markup for the betting odds section in `MatchStats.tsx`**
- [ ] **Step 2: Style the section in `MatchStats.module.css`**
- [ ] **Step 3: Render and pass `odds={match.odds}` in `MatchDetails.tsx`**
- [ ] **Step 4: Run `npm run build` inside `frontend/` to verify build success**
