# Team Link Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable `<TeamLink />` wrapper component in `frontend/components/TeamLink.tsx` that links to the team details page when a valid ID is present, and gracefully falls back to a span when no ID is provided.

**Architecture:** Create `TeamLink.tsx` and `TeamLink.module.css` inside `frontend/components/`. Export the component properly. Verify with compilation and pre-flight checks.

**Tech Stack:** Next.js (App Router), React, TypeScript, CSS Modules.

## Global Constraints
- **Workspace:** `frontend/`
- **Output Files:** `frontend/components/TeamLink.tsx`, `frontend/components/TeamLink.module.css`
- **Link Target:** `/team/[id]`
- **Styling:** CSS Modules with Vanilla CSS (No Tailwind). Text-decoration: none, inherits color, display: inline-flex.

---

### Task 1: Create TeamLink CSS Module

**Files:**
- Create: `frontend/components/TeamLink.module.css`

**Interfaces:**
- Produces: CSS classes `.teamLink` and `.teamSpan` for styling the component.

- [ ] **Step 1: Write CSS Module content**
  Define styles that reset browser anchor defaults, inherit color, and layout contents as `inline-flex` with center alignment.

  ```css
  .teamLink {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }
  
  .teamLink:hover {
    color: var(--color-primary);
  }
  
  .teamSpan {
    color: inherit;
    display: inline-flex;
    align-items: center;
  }
  ```

- [ ] **Step 2: Commit CSS module**
  ```bash
  git add frontend/components/TeamLink.module.css
  git commit -m "style: add TeamLink CSS module styles"
  ```

---

### Task 2: Implement TeamLink React Component

**Files:**
- Create: `frontend/components/TeamLink.tsx`

**Interfaces:**
- Consumes: CSS Module `TeamLink.module.css`
- Produces: Default export `TeamLink` component with props interface `TeamLinkProps`.

- [ ] **Step 1: Write TeamLink Component implementation**
  Create the component file with support for optional `teamId` and custom `className`.

  ```tsx
  "use client";

  import React from "react";
  import Link from "next/link";
  import styles from "./TeamLink.module.css";

  export interface TeamLinkProps {
    teamId?: number | string | null;
    children: React.ReactNode;
    className?: string;
  }

  export default function TeamLink({ teamId, children, className = "" }: TeamLinkProps) {
    // If teamId is valid (not null, undefined, or empty string)
    if (teamId !== undefined && teamId !== null && teamId !== "") {
      return (
        <Link 
          href={`/team/${teamId}`} 
          className={`${styles.teamLink} ${className}`}
        >
          {children}
        </Link>
      );
    }

    // Fallback if no valid ID is provided
    return (
      <span className={`${styles.teamSpan} ${className}`}>
        {children}
      </span>
    );
  }
  ```

- [ ] **Step 2: Commit TeamLink Component**
  ```bash
  git add frontend/components/TeamLink.tsx
  git commit -m "feat: implement reusable TeamLink wrapper component"
  ```

---

### Task 3: Verification & Compilation Check

**Files:**
- Modify: `frontend/components/StandingsTable.tsx` (optional integration/smoke verification)

- [ ] **Step 1: Run linter check on frontend**
  Verify there are no ESLint issues.
  Run: `npm run lint` in `frontend/`

- [ ] **Step 2: Run build compilation check on frontend**
  Verify the project compiles with zero TypeScript errors.
  Run: `npm run build` in `frontend/`

- [ ] **Step 3: Run project-wide Pre-Flight pipeline**
  Run the root quality-gate runner.
  Run: `python3 .pre-flight-check/scripts/run-pipeline.py`
  Expected: PASS

- [ ] **Step 4: Commit and finalize**
  ```bash
  git status
  ```
