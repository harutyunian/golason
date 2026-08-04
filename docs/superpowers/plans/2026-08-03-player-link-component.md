# Player Link Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a reusable `<PlayerLink />` wrapper component in `frontend/components/PlayerLink.tsx` that links to a player profile page when a valid ID is provided, or renders a fallback span if not, using CSS Modules for styling.

**Architecture:** Create a React component `<PlayerLink />` that accepts `playerId`, `children`, and `className` props. Under the hood, it renders Next.js's `<Link>` if `playerId` is set, or a `<span>` fallback otherwise.

**Tech Stack:** React, Next.js (App Router), TypeScript, CSS Modules

## Global Constraints
- **Component File Path:** `frontend/components/PlayerLink.tsx`
- **Styles File Path:** `frontend/components/PlayerLink.module.css`
- **Styling Rules:** Reset text-decoration, inherit color, use cursor: pointer for links, and display as inline-flex with centered alignment.
- **Verification Rule:** TypeScript check and Next.js build must pass without any compilation errors.

---

### Task 1: Create CSS Module for Player Link

**Files:**
- Create: `frontend/components/PlayerLink.module.css`

**Interfaces:**
- Produces: CSS classes `.playerLink` and `.playerSpan`

- [ ] **Step 1: Write the CSS Module**
  Create `frontend/components/PlayerLink.module.css` with the following content:
  ```css
  .playerLink {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
  }

  .playerLink:hover {
    color: var(--color-primary);
  }

  .playerSpan {
    color: inherit;
    display: inline-flex;
    align-items: center;
  }
  ```

- [ ] **Step 2: Verify file creation**
  Verify the file exists at the correct location.

---

### Task 2: Create the PlayerLink React Component

**Files:**
- Create: `frontend/components/PlayerLink.tsx`

**Interfaces:**
- Consumes: CSS classes from `frontend/components/PlayerLink.module.css`
- Produces: `PlayerLink` component with the following signature:
  ```typescript
  export interface PlayerLinkProps {
    playerId?: number | string | null;
    children: React.ReactNode;
    className?: string;
  }
  export default function PlayerLink(props: PlayerLinkProps): React.JSX.Element;
  ```

- [ ] **Step 1: Write the React Component**
  Create `frontend/components/PlayerLink.tsx` with the following content:
  ```typescript
  "use client";

  import React from "react";
  import Link from "next/link";
  import styles from "./PlayerLink.module.css";

  export interface PlayerLinkProps {
    playerId?: number | string | null;
    children: React.ReactNode;
    className?: string;
  }

  export default function PlayerLink({ playerId, children, className = "" }: PlayerLinkProps) {
    // If playerId is valid (not null, undefined, or empty string)
    if (playerId !== undefined && playerId !== null && playerId !== "") {
      return (
        <Link 
          href={`/player/${playerId}`} 
          className={`${styles.playerLink} ${className}`}
        >
          {children}
        </Link>
      );
    }

    // Fallback if no valid ID is provided
    return (
      <span className={`${styles.playerSpan} ${className}`}>
        {children}
      </span>
    );
  }
  ```

- [ ] **Step 2: Verify compilation and TypeScript type safety**
  Run TypeScript check inside the `frontend` directory:
  ```bash
  npx tsc --noEmit
  ```
  Expected: Success (no output or clean status).

- [ ] **Step 3: Run linter**
  Run ESLint check inside the `frontend` directory to verify our new code adheres to the project rules:
  ```bash
  npm run lint
  ```
  Expected: No new errors or warnings associated with `PlayerLink.tsx`.

---

### Task 3: Build Verification

**Files:**
- Create: (none)
- Modify: (none)

**Interfaces:**
- Consumes: `PlayerLink` component and its styles

- [ ] **Step 1: Execute production build**
  Run `npm run build` in the `frontend` directory to ensure everything builds successfully:
  ```bash
  npm run build
  ```
  Expected: Successful Next.js build.

- [ ] **Step 2: Run pre-flight check**
  Run the full pre-flight quality check pipeline:
  ```bash
  python3 /Users/arthurharutyunyan/Desktop/golason/.claude/skills/pre-flight-check/scripts/run-pipeline.py
  ```
  Note: This is to verify that typecheck and linting are perfectly green.
