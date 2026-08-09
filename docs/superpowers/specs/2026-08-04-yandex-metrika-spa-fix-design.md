# Specification: Yandex.Metrika SPA Tracking Fix

## 📌 Context & Overview
Golason is built on Next.js App Router, which operates as a Single Page Application (SPA). The standard Yandex.Metrika tracking snippet initializes and fires a pageview hit on first load. However, on subsequent route transitions (which are handled purely client-side without standard browser page reloads), the tracker does not automatically detect and record page views. This results in missing analytics data for SPA navigation.

Additionally, to prevent a "double hit" (recording the same pageview twice) on the first page load, we must configure the initialization of Yandex.Metrika with `defer: true` instead of `ssr: true`, and then delegate all pageview hits—including the initial load and all subsequent route changes—to a custom React client-side tracking component.

This epic implements:
1. A client-side tracker component (`frontend/components/YandexMetrika.tsx`) that listens to route changes via `usePathname` and `useSearchParams`, sending a `hit` call to Yandex.Metrika's global `ym` function.
2. An update to the root layout (`frontend/app/layout.tsx`) to set `defer: true` on initialization and render our tracking component inside a `<Suspense>` boundary.
3. Verification that everything compiles and builds perfectly with 100% Next.js type safety.

---

## 🛠️ Detailed Architecture Design

### 1. Client-Side Tracking Component
- **File Path:** `frontend/components/YandexMetrika.tsx`
- **Design Pattern:** Separated into a tracker hook/subcomponent wrapped in a `<Suspense>` boundary. Under the Next.js App Router, any component that accesses `useSearchParams()` must be wrapped inside a `<Suspense>` block. If not, static generation for any page rendering the layout will deoptimize and fail during build time.
- **Tracking ID:** `111230462`
- **Implementation:**
  ```typescript
  'use client';

  import { useEffect, Suspense } from "react";
  import { usePathname, useSearchParams } from "next/navigation";

  const METRIKA_ID = 111230462;

  function MetrikaTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
      if (typeof window !== 'undefined' && typeof (window as any).ym === 'function') {
        const url = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
        (window as any).ym(METRIKA_ID, 'hit', url);
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

### 2. Root Layout Update
- **File Path:** `frontend/app/layout.tsx`
- **Changes:**
  - Update `ym(111230462, 'init', { ssr: true, ... })` to `ym(111230462, 'init', { defer: true, ... })`.
  - Import `<YandexMetrika />` from `@/components/YandexMetrika`.
  - Render `<YandexMetrika />` within the `<body>` element alongside `<Header />` and `<Footer />`.

---

## 📈 Testing & Verification Plan

### Stage 1: Static Analysis & Compilation
1. Verify ESLint syntax cleanliness in `frontend/`:
   ```bash
   npm run lint
   ```
2. Verify TypeScript type-checking and Next.js production build:
   ```bash
   npm run build
   ```

### Stage 2: Quality Gates
1. Run Pre-Flight Check to ensure typechecking, linting, and security audits pass successfully:
   ```bash
   python3 .pre-flight-check/scripts/run-pipeline.py
   ```
