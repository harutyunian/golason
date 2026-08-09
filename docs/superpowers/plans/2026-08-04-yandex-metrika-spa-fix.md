# Yandex.Metrika SPA Tracking Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a clean Yandex.Metrika SPA tracking solution for Next.js App Router that records pageview hits dynamically on route transitions while preventing duplicate initial loads.

**Architecture:** Use `defer: true` during Yandex.Metrika's global script initialization in `layout.tsx` to stop automatic pageviews. Implement a client-side `<YandexMetrika />` component wrapped inside a `<Suspense>` boundary that listens to pathname and search query parameter modifications to trigger the `ym` hit tracking precisely once per navigation event.

**Tech Stack:** Next.js (App Router), React, TypeScript.

## Global Constraints
- Target Yandex.Metrika Tracking ID: `111230462`
- Follow absolute import alias `@/components/...` for component imports in the frontend.
- Do not bypass Next.js static page optimization; any hook calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary.
- No warnings, no disabled linter rules, and perfect type safety.

---

### Task 1: Create the `YandexMetrika.tsx` Client Component

**Files:**
- Create: `frontend/components/YandexMetrika.tsx`

**Interfaces:**
- Produces: `YandexMetrika` default export component (takes no props).

- [ ] **Step 1: Write the component file**

Create the file `frontend/components/YandexMetrika.tsx` with the following content:

```typescript
'use client';

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const METRIKA_ID = 111230462;

function MetrikaTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).ym === "function") {
      const url = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
      (window as any).ym(METRIKA_ID, "hit", url);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function YandexMetrika() {
  return (
    <Suspense fallback={null}>
      <MetrikaTracker />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit Task 1**

```bash
git add frontend/components/YandexMetrika.tsx
git commit -m "feat: create client-side YandexMetrika tracking component with Suspense boundary"
```

---

### Task 2: Integrate `YandexMetrika` into the Root Layout

**Files:**
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: Update Yandex.Metrika initialization to defer and render tracker**

In `frontend/app/layout.tsx`:
1. Import `YandexMetrika` from `@/components/YandexMetrika`.
2. Update the script initialization object for `ym(111230462, 'init', ...)` to change `ssr: true` to `defer: true`.
3. Render `<YandexMetrika />` inside the `<body>` element alongside `<Header />` and `<Footer />`.

- [ ] **Step 2: Commit Task 2**

```bash
git add frontend/app/layout.tsx
git commit -m "feat: update layout initialization to defer and integrate YandexMetrika component"
```

---

### Task 3: Verification, Building & Pre-Flight Checks

**Files:**
- Run verification checks in `frontend/` and overall repository.

- [ ] **Step 1: Run linter check**

Run inside `frontend/`:
`npm run lint`
Expected: 0 errors/warnings.

- [ ] **Step 2: Run Next.js production build**

Run inside `frontend/`:
`npm run build`
Expected: Compilation success with 100% type safety and optimized static page structures.

- [ ] **Step 3: Run Pre-Flight check pipeline**

Run in repository root:
`python3 .pre-flight-check/scripts/run-pipeline.py`
Expected: All quality gates pass successfully with `### ✅ PRE-FLIGHT PASSED`.
