# Specification: Team Link Component

## 📌 Context & Overview
In the Golason application, various pages and components (such as player detail pages, standings tables, lineups, match details) contain references to football teams. Currently, some of these references hardcode Next.js `<Link href={`/team/${id}`}>` components. To promote reuse, handle edge cases gracefully, and enforce consistent styling, we are implementing a reusable `<TeamLink />` wrapper component.

This component will:
1. Wrap any child elements in a Next.js `<Link href="/team/[id]">` when a valid `teamId` is present.
2. Render children inside a fallback element (e.g., a `span` or fragment) without linking if `teamId` is null, undefined, or empty.
3. Inherit parent text styling (no text decoration, inherits color) and support custom `className` props for layout customization.
4. Be properly exported and integrated.

---

## 🛠️ Detailed Architecture Design

### 1. Component Location & API
- **File Path:** `frontend/components/TeamLink.tsx`
- **Styles Path:** `frontend/components/TeamLink.module.css`
- **Props interface:**
  ```typescript
  export interface TeamLinkProps {
    teamId?: number | string | null;
    children: React.ReactNode;
    className?: string;
  }
  ```

### 2. Component Logic & Fallback
- If `teamId` is valid (not null, undefined, or empty string):
  - Render `<Link href={`/team/${teamId}`} className={`${styles.teamLink} ${className || ""}`}>{children}</Link>`
- If `teamId` is not valid:
  - Render `<span className={`${styles.teamSpan} ${className || ""}`}>{children}</span>`

This ensures that styling applied via `className` (such as spacing, alignment, width) continues to apply consistently regardless of whether the element is active as a link or fallback text.

### 3. Styling & Aesthetics (`TeamLink.module.css`)
- **Link Reset:**
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
- Using `display: inline-flex` with `align-items: center` ensures that the wrapper works beautifully with icons, text, or images (e.g., `<TeamLogo />` and team name side-by-side).

---

## 📈 Testing & Verification Plan

### Stage 1: Static Analysis & Compilation
1. Run `npm run lint` in `frontend/` to ensure no ESLint or Next.js linter warnings/errors are introduced.
2. Run Typechecking/Build (`npm run build`) in `frontend/` to confirm perfect compilation and Next.js static asset optimization.

### Stage 2: Quality Gates
1. Run Pre-Flight Check:
   ```bash
   python3 .pre-flight-check/scripts/run-pipeline.py
   ```
   to guarantee that Typecheck, Lint, and Security are 100% green before concluding the task.
