# Specification: Player Link Component

## 📌 Context & Overview
In the Golason application, various pages and components (such as lineups, commentaries, match details, and search results) refer to individual football players. Currently, we hardcode `<Link href={`/player/${id}`}>` components. To promote code reuse, ensure edge cases (such as missing or invalid player IDs) are handled gracefully, and maintain styling consistency, we are implementing a reusable `<PlayerLink />` wrapper component.

This component will:
1. Wrap its child elements in a Next.js `<Link href="/player/[id]">` when a valid `playerId` is present.
2. Render children inside a fallback element (e.g., a `span` or fragment) without linking if `playerId` is null, undefined, or empty.
3. Inherit parent text styling (no text decoration, inherits color) and support custom `className` props for layout customization.
4. Be properly exported and integrated.

---

## 🛠️ Detailed Architecture Design

### 1. Component Location & API
- **File Path:** `frontend/components/PlayerLink.tsx`
- **Styles Path:** `frontend/components/PlayerLink.module.css`
- **Props interface:**
  ```typescript
  export interface PlayerLinkProps {
    playerId?: number | string | null;
    children: React.ReactNode;
    className?: string;
  }
  ```

### 2. Component Logic & Fallback
- If `playerId` is valid (not null, undefined, or empty string):
  - Render `<Link href={`/player/${playerId}`} className={`${styles.playerLink} ${className || ""}`}>{children}</Link>`
- If `playerId` is not valid:
  - Render `<span className={`${styles.playerSpan} ${className || ""}`}>{children}</span>`

This ensures that styling applied via `className` (such as spacing, alignment, width) continues to apply consistently regardless of whether the element is active as a link or fallback text.

### 3. Styling & Aesthetics (`PlayerLink.module.css`)
- **Link Reset:**
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
- Using `display: inline-flex` with `align-items: center` ensures that the wrapper works beautifully with player photos, badges, icons, or names.

---

## 📈 Testing & Verification Plan

### Stage 1: Static Analysis & Compilation
1. Run TypeScript check / Build (`npm run build`) in `frontend/` to confirm perfect compilation and Next.js static asset optimization.
2. Run ESLint (`npm run lint`) inside `frontend/` to check that no new issues are introduced.

### Stage 2: Quality Gates
1. Run Pre-Flight Check:
   ```bash
   python3 .pre-flight-check/scripts/run-pipeline.py
   ```
   to guarantee that our implementation compiles cleanly.
