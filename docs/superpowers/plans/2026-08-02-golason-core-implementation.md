# Golason Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fully functional, SEO-optimized, real-time sports score web application (SofaScore/FlashScore clone) in a monorepo containing a NestJS API backend and a Next.js App Router frontend, with PostgreSQL managed by Prisma.

**Architecture:** Monorepo division with an abstract Anti-Corruption Adapter (Normalizer) Layer in NestJS to keep external API dependencies isolated. Core synchronization is ran through polling cron schedulers with real-time goal flashes broadcasted over a WebSocket Gateway (socket.io). The frontend is highly SEO-optimized using Next.js React Server Components, customized JSON-LD metadata, dynamic `sitemap.xml`, and embedded Yandex.Metrika.

**Tech Stack:** 
- Frontend: Next.js (TypeScript, App Router, Vanilla CSS, next-pwa)
- Backend: NestJS (TypeScript, @nestjs/websockets, socket.io, @nestjs/schedule)
- DB/ORM: PostgreSQL, Prisma

## Global Constraints
- **Framework Versions:** Next.js v14+, NestJS v10+, Prisma v5+.
- **Database URL:** `postgresql://postgress:1234@localhost:5432/golason?schema=public`
- **Yandex.Metrika ID:** `111230462`
- **Linting & Quality Check:** All files must pass ESLint and TypeScript checking. Runs `.pre-flight-check/scripts/run-pipeline.py` after every task.
- **Styling:** Pure Vanilla CSS only. Avoid TailwindCSS or extra styling frameworks.

---

## Phase 1: Workspace & Backend Scaffolding

### Task 1: Monorepo Scaffolding & Initial Environment
**Files:**
- Create: `package.json` (Workspace config)
- Create: `.gitignore`
- Create: `.env.local` (Shared environment keys)

**Interfaces:**
- Produces: Base monorepo workspace configuration.

- [ ] **Step 1: Write root package.json configuration**
Write file `package.json` in repository root:
```json
{
  "name": "golason-monorepo",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "backend:dev": "npm run start:dev --workspace=backend",
    "frontend:dev": "npm run dev --workspace=frontend",
    "db:migrate": "npm run prisma:migrate --workspace=backend"
  }
}
```

- [ ] **Step 2: Create root .gitignore**
Write file `.gitignore` in repository root:
```
node_modules/
.env*
!.env.example
.DS_Store
dist/
.next/
out/
```

- [ ] **Step 3: Create shared .env.local**
Write file `.env.local` with the database URL and sports API key:
```env
DATABASE_URL="postgresql://postgress:1234@localhost:5432/golason?schema=public"
SPORTS_API_KEY="1623448fdc7994a7c7ce329610618cf4"
SPORTS_API_HOST="v3.football.api-sports.io"
JWT_SECRET="golason_secret_jwt_key_2026_sports"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"
```

- [ ] **Step 4: Verify git status**
Run: `git status`
Expected: Only showing root package.json, .gitignore, and .env.local as untracked.

- [ ] **Step 5: Commit scaffolding**
```bash
git add package.json .gitignore
git commit -m "chore: scaffold monorepo workspace configurations"
```

---

### Task 2: Scaffold NestJS Backend & Prisma Models
**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/prisma/prisma.service.ts`

**Interfaces:**
- Produces: `PrismaService` providing db connections to PostgreSQL.

- [ ] **Step 1: Install and create NestJS and Prisma configurations**
Create `backend/package.json`:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/schedule": "^4.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Write backend/prisma/schema.prisma**
Write the PostgreSQL models (User, Bookmark, Vote, League, Season, Team, Player, Match, Standing) as designed in section 4 of the spec file.

- [ ] **Step 3: Setup NestJS Main & PrismaService**
Create file `backend/src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 4: Run initial migrations**
Run: `cd backend && npm install && npx prisma migrate dev --name init`
Expected: SUCCESS with PostgreSQL table creations.

- [ ] **Step 5: Commit NestJS base**
```bash
git add backend/
git commit -m "feat: scaffold NestJS API and run PostgreSQL migrations via Prisma"
```

---

## Phase 2: Core Abstraction & Sync Engines (NestJS)

### Task 3: Sports Normalizer & API Client
**Files:**
- Create: `backend/src/sports/interfaces/sports.types.ts`
- Create: `backend/src/sports/services/api-football-client.service.ts`
- Create: `backend/src/football/services/football-normalizer.service.ts`

**Interfaces:**
- Consumes: Raw API-Football data responses.
- Produces: Standard interface models `StandardMatch`, `StandardTeam`, `StandardPlayer`.

- [ ] **Step 1: Write backend/src/sports/interfaces/sports.types.ts**
Define exact typing interfaces `StandardTeam`, `StandardPlayer`, and `StandardMatch` matching section 3.1 of our spec.

- [ ] **Step 2: Write raw FootballNormalizerService**
Write class `FootballNormalizerService` mapping `/fixtures` and `/fixtures?live=all` JSON arrays into clean `StandardMatch` arrays, protecting nested attributes (lineups, goals, cards).

- [ ] **Step 3: Write tests for normalizer**
Create `backend/src/football/services/football-normalizer.service.spec.ts` to mock raw API-Football responses and assert outputs match standard interfaces exactly.
Run: `npm run test` inside backend.
Expected: PASS.

- [ ] **Step 4: Commit Normalizer**
```bash
git add backend/src/sports/ backend/src/football/
git commit -m "feat: implement anti-corruption Normalizer Service for Football data mappings"
```

---

### Task 4: Schedulers, Sync Services & WebSocket Push Gateway
**Files:**
- Create: `backend/src/football/schedulers/sync.scheduler.ts`
- Create: `backend/src/gateway/live-score.gateway.ts`

**Interfaces:**
- Produces: Background crons that write to DB and emit `match:update` packets over `LiveScoreGateway`.

- [ ] **Step 1: Create WebSocket Gateway**
Scaffold `LiveScoreGateway` using `@nestjs/websockets` to handle client connections and broadcast events.

- [ ] **Step 2: Create Polling Scheduler**
Write `FootballSyncScheduler` with:
- `@Cron('0 3 * * *')` daily fixture schedule fetcher.
- `@Interval(30000)` live score poll interval that fetches `/fixtures?live=all` *only* if active matches exist in the DB. Maps through `FootballNormalizerService`, persists to DB, and emits updates to `LiveScoreGateway`.

- [ ] **Step 3: Mock tests for active cron/ws emissions**
Assert websocket emits payload during live mock update.
Run: `npm run test` inside backend.
Expected: PASS.

- [ ] **Step 4: Commit Schedulers**
```bash
git add backend/src/gateway/ backend/src/football/schedulers/
git commit -m "feat: implement active live-polling schedulers and WebSocket Gateway updates"
```

---

## Phase 3: Auth & Frontend Core (Next.js)

### Task 5: JWT Authentication Modules & Users Endpoints
**Files:**
- Create: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`
- Create: `backend/src/users/controllers/user.controller.ts`

- [ ] **Step 1: Write auth hashing and signup/login flows**
Register bcrypt password hashing, sign user objects into JWT tokens securely.

- [ ] **Step 2: Secure Endpoints with JWT guard**
Implement `@UseGuards(JwtAuthGuard)` to lock dynamic bookmark updates and match voting routes.

- [ ] **Step 3: Commit Auth Module**
```bash
git add backend/src/auth/ backend/src/users/
git commit -m "feat: implement JWT auth endpoints and secure user routes"
```

---

### Task 6: Next.js Workspace, Global Layout & Yandex Metrika
**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app/layout.tsx` (Global HTML setup)
- Create: `frontend/app/globals.css` (Vanilla CSS variables)

- [ ] **Step 1: Scaffold Next.js Workspace**
Create `frontend/package.json` and install default Next.js, typescript, and socket.io-client.

- [ ] **Step 2: Write root app/layout.tsx embedding Yandex.Metrika script**
Integrate Yandex Metrika tracking tag exactly as specified in Section 7 of our design spec using `next/script` to prevent performance blocking.

- [ ] **Step 3: Write vanilla globals.css**
Declare clean CSS layout styles, dark/light theme variables, grids, and flexboxes.

- [ ] **Step 4: Verify layout build and run pre-flight check**
Run: `python .pre-flight-check/scripts/run-pipeline.py`
Expected: PASS on typechecks and linting.

- [ ] **Step 5: Commit Frontend Base**
```bash
git add frontend/
git commit -m "feat: scaffold Next.js App Router workspace and embed Yandex.Metrika"
```

---

## Phase 4: Dynamic UI & High-Fidelity Views (Next.js)

### Task 7: Score Dashboard with Live Toggle & Date Carousel
**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/DateSelector.tsx`, `frontend/components/MatchList.tsx`

- [ ] **Step 1: Write Date Carousel and Selector**
Create a horizontal swipable date component displaying dates. Incorporate a standard HTML `<input type="date">` wrapper styled cleanly in CSS to support any custom date selection.

- [ ] **Step 2: Write Live/Upcoming Toggle and Dashboard Layout**
Fetch matches for the active date from the NestJS backend. Nest and group them cleanly by League titles. Use client-side toggle to filter matches with live status instantly.

- [ ] **Step 3: Audit accessibility & Web Quality**
Run accessibility checklists (keyboard indexability, screen-reader role tags) and run the pre-flight checks.
Expected: PASS.

- [ ] **Step 4: Commit Dashboard**
```bash
git add frontend/app/page.tsx frontend/components/
git commit -m "feat: build dashboard layout with date selector carousel and live filter toggle"
```

---

### Task 8: Detailed Profiles: Match Detail (Live stats, Squad pitch, H2H, Momentum, Voting)
**Files:**
- Create: `frontend/app/match/[id]/page.tsx`
- Create: `frontend/components/LineupPitch.tsx`, `frontend/components/MomentumGraph.tsx`, `frontend/components/MatchPredictionPoll.tsx`

- [ ] **Step 1: Construct Match Detail layout tabs**
Tabs: Info/Live stats, Lineups/Ratings, Timeline Events, Momentum, and H2H details.

- [ ] **Step 2: Implement Visual Football Pitch (LineupPitch.tsx)**
Draw a clean green pitch field in pure Vanilla CSS grid/flexbox. Position players according to their formations (e.g. 4-4-2, 4-3-3). Hovering or clicking on players reveals rating tags.

- [ ] **Step 3: Implement Visual MomentumGraph.tsx**
Create momentum graph displaying attacking shifts over time using custom Canvas rendering or SVG charts.

- [ ] **Step 4: Implement Prediction Voting Poll**
Render MatchPredictionPoll showing community voting percentages. Update poll instantly on click.

- [ ] **Step 5: Connect WebSockets for score flashes**
Use `socket.io-client` in a custom `useWebSocket` hook. The moment `match:update` event is captured, update the scoreboard header with animation flash triggers.

- [ ] **Step 6: Embed rich SportsEvent JSON-LD schema**
Embed SEO structured schemas on the server component before rendering.

- [ ] **Step 7: Commit Match View**
```bash
git add frontend/app/match/ frontend/components/
git commit -m "feat: implement high-fidelity Match Details profile with visual pitch lineups, momentum, and prediction polls"
```

---

### Task 9: Team and Player Profiles
**Files:**
- Create: `frontend/app/team/[id]/page.tsx`
- Create: `frontend/app/player/[id]/page.tsx`

- [ ] **Step 1: Implement Team Profile**
Display team squad cards, recent fixtures lists, and live standings table. Inject `SportsTeam` SEO schema.

- [ ] **Step 2: Implement Player Profile**
Display detailed metrics (age, height, nationality, season performance ratings, goals, assists) inside clean card patterns. Inject `Person` SEO schema.

- [ ] **Step 3: Commit Profiles**
```bash
git add frontend/app/team/ frontend/app/player/
git commit -m "feat: implement Team and Player detailed profiles with server-side rendered SEO structures"
```

---

## Phase 5: Production SEO, PWAs & Final Verification

### Task 10: Dynamic Sitemap & Progressive Web App Setup
**Files:**
- Create: `frontend/app/sitemap.xml/route.ts`
- Create: `frontend/app/manifest.json`

- [ ] **Step 1: Create Dynamic sitemap.xml Route**
Write custom sitemap XML builder fetching active matches, teams, and players from NestJS database and return standard dynamic routes in XML output.

- [ ] **Step 2: Create manifest.json & Setup Service Worker**
Configure manifest for PWA installations with matching logo paths and PWA parameters.

- [ ] **Step 3: Run full pre-flight quality check pipeline**
Verify everything builds compile-safe:
Run: `python .pre-flight-check/scripts/run-pipeline.py`
Expected: ### ✅ PRE-FLIGHT PASSED.

- [ ] **Step 4: Commit sitemaps and PWAs**
```bash
git add frontend/app/sitemap.xml/ frontend/app/manifest.json
git commit -m "feat: implement dynamic sitemap.xml and PWA support assets"
```
