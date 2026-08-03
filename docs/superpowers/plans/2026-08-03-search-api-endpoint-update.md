# Search API Endpoint Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the search endpoint to return teams, players, matches, and competitions, with realistic mock data and database query support.

**Architecture:** Extend the `search` endpoint inside `FootballController` to query all 4 entities (team, player, league/competition, match) from the database under a `try/catch` safety net, while providing comprehensive fallback mock data.

**Tech Stack:** NestJS, Prisma, Jest

## Global Constraints
- Do NOT commit or push changes unless explicitly instructed.
- Ensure 100% build success via `npm run build` in the `backend` directory.

---

### Task 1: Update Search Endpoint Implementation

**Files:**
- Modify: `backend/src/sports/football.controller.ts`

**Interfaces:**
- Consumes: Query string `q`
- Produces: `{ teams: any[], players: any[], matches: any[], competitions: any[] }`

- [ ] **Step 1: Write the updated mock data and database query logic in search endpoint**

Replace the existing `search` method in `backend/src/sports/football.controller.ts` with the new implementation including `fallbackMatches`, `fallbackCompetitions`, database queries for leagues and matches, and updated return objects.

- [ ] **Step 2: Compile the backend to verify there are no TypeScript or compilation errors**

Run: `npm run build` inside `backend/` directory.

---

### Task 2: Add Jest Tests for Search Endpoint

**Files:**
- Modify: `backend/src/sports/football.controller.spec.ts`

- [ ] **Step 1: Write unit tests in `football.controller.spec.ts`**

Add a `describe('search')` block with test cases to verify the returned structure when query is empty, when database results are found, and when it falls back to mock data.

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test` inside `backend/` directory.
