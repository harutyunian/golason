# Date Selector Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a highly-polished, responsive, and accessible Date Selector Carousel Component in the Next.js frontend with SofaScore styling and a transparent native date picker overlay.

**Architecture:** Create a React component that takes `selectedDate` (YYYY-MM-DD) and `onDateChange` callback. It generates a 7-day centered list of dates relative to the active selection. It also renders a Calendar button utilizing an invisible absolute-positioned native date input overlay for standard date selection.

**Tech Stack:** Next.js (App Router), React, CSS Modules, Lucide React (`Calendar` icon).

## Global Constraints

- Component must accept `selectedDate: string` and `onDateChange: (date: string) => void`
- The horizontal date ribbon must show Day number and uppercase 3-letter weekday, centered around the selected date.
- SofaScore green color (`--color-primary`) used for active day.
- Accessibility support: `tabIndex={0}`, keyboard navigation (Space/Enter trigger), explicit ARIA attributes.
- Native HTML date picker overlay styled transparently on top of the Lucide Calendar icon.
- Successfully compile in Next.js Turbopack (`npm run build`).

---

### Task 1: Scaffolding and Component Skeleton

**Files:**
- Create: `frontend/components/DateSelector.tsx`
- Create: `frontend/components/DateSelector.module.css`

**Interfaces:**
- Consumes: None (Root level UI component)
- Produces: `DateSelector` component

- [ ] **Step 1: Write empty skeleton component**

Create `frontend/components/DateSelector.tsx`:
```tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import styles from './DateSelector.module.css';

export interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  return (
    <div className={styles.container}>
      {/* Scrollable Ribbon */}
      <div className={styles.ribbon}>
        {/* Days will go here */}
      </div>
      
      {/* Calendar Button Wrapper */}
      <div className={styles.calendarWrapper}>
        <Calendar size={20} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create matching module CSS**

Create `frontend/components/DateSelector.module.css`:
```css
.container {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  padding: 8px 12px;
  width: 100%;
}
```

- [ ] **Step 3: Verify workspace compilation passes skeleton stage**

Run: `npm run build` inside `frontend/`
Expected: SUCCESS

- [ ] **Step 4: Commit skeleton**

```bash
git add frontend/components/DateSelector.tsx frontend/components/DateSelector.module.css
git commit -m "feat: scaffold DateSelector skeleton and empty CSS module"
```

---

### Task 2: Implement Date Calculation & Ribbon Rendering

**Files:**
- Modify: `frontend/components/DateSelector.tsx`
- Modify: `frontend/components/DateSelector.module.css`

**Interfaces:**
- Consumes: `DateSelectorProps`
- Produces: List of 7 centered days scrollable dynamically

- [ ] **Step 1: Write date calculation logic**

Update `frontend/components/DateSelector.tsx` to center 7 days around `selectedDate`:
```tsx
// Date parser that prevents timezone drift by parsing YYYY-MM-DD locally
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Formatter to string YYYY-MM-DD
const formatLocalDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
```

- [ ] **Step 2: Generate ribbon items array**

In `DateSelector`:
```tsx
const centerDate = parseLocalDate(selectedDate);
const days = Array.from({ length: 7 }, (_, i) => {
  const offset = i - 3; // Index 3 is centered (0 offset)
  const date = new Date(centerDate.getFullYear(), centerDate.getMonth(), centerDate.getDate() + offset);
  const formatted = formatLocalDate(date);
  
  // Format weekday and number
  const today = new Date();
  const isToday = date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();
                  
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekday = isToday ? 'TODAY' : DAYS[date.getDay()];
  const dayNum = String(date.getDate()).padStart(2, '0');
  
  return {
    formatted,
    weekday,
    dayNum,
    isActive: formatted === selectedDate,
  };
});
```

- [ ] **Step 3: Implement keyboard navigation on elements**

Ensure interactive date cards are fully keyboard navigable (`tabIndex={0}`) and trigger action on key down (Space or Enter).

- [ ] **Step 4: Add beautiful module styles with active SofaScore highlight**

Update CSS with scrollability, transitions, and hover styles.

- [ ] **Step 5: Verify building**

Run: `npm run build` inside `frontend/`
Expected: SUCCESS

- [ ] **Step 6: Commit**

```bash
git add frontend/components/DateSelector.tsx frontend/components/DateSelector.module.css
git commit -m "feat: implement DateSelector centered 7-day calculations and accessibility ribbon"
```

---

### Task 3: Implement Calendar Button & Input Picker Overlay

**Files:**
- Modify: `frontend/components/DateSelector.tsx`
- Modify: `frontend/components/DateSelector.module.css`

- [ ] **Step 1: Overlay native date picker styled with 100% transparency**

Update `DateSelector` to render a native date input positioned absolutely over the interactive calendar button. Clicking it triggers the native date selector, triggering `onDateChange`.

- [ ] **Step 2: Polish CSS for flawless layout and hover effects**

Ensure the invisible native calendar input overlays perfectly and has `cursor: pointer`.

- [ ] **Step 3: Perform production compile verification**

Run: `npm run build` inside `frontend/`
Expected: SUCCESS

- [ ] **Step 4: Commit changes**

```bash
git add frontend/components/DateSelector.tsx frontend/components/DateSelector.module.css
git commit -m "feat: integrate transparent native date picker overlay and complete design details"
```
