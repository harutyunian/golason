# Golason Scrum Board & Project Management Tracker

**Role:** Senior Project Manager
**Methodology:** Agile / Subagent-Driven Development (Micro-Chunks)
**Deployment Target:** Ubuntu VPS
**Status:** 🏃‍♂️ In Progress

## 📈 Epics Overview
- [x] **Epic 1: Workspace Scaffolding**
- [x] **Epic 2: Backend Base & Database**
- [ ] **Epic 3: Backend Normalizers (API-Football)**
- [ ] **Epic 4: Backend Schedulers & Real-Time**
- [ ] **Epic 5: Backend Auth & Users**
- [ ] **Epic 6: Frontend Base & Layout (SEO Core)**
- [x] **Epic 7: Frontend Micro-Components**
- [x] **Epic 8: Frontend Dashboard (Main Page)**
- [x] **Epic 9: Frontend Match Profile**
- [ ] **Epic 10: Frontend Team & Player Profiles**
- [ ] **Epic 11: Deployment (Ubuntu VPS)**

---

## 🛠 Required Skills & Helpers
Our subagents will strictly utilize the following skills during execution:
- `subagent-driven-development` (Dispatch independent agents to execute tickets).
- `test-driven-development` (Write automated tests before writing application code).
- `seo` & `core-web-vitals` (Validate JSON-LD, meta tags, semantic HTML, LCP).
- `accessibility` (Audit semantic HTML, ARIA labels, keyboard navigation).
- `pre-flight-check` (MANDATORY pipeline check for linting/types before any commit).

---

## 📋 Sprint Backlog (Micro-Chunked)

### Epic 1: Workspace Scaffolding

#### Task 1.1: Initialize Monorepo (DONE)
- **Story:** Create base folder structure for Next.js and NestJS.
- **Action:** Scaffold `package.json` for npm workspaces and `.gitignore`.
- **Acceptance Criteria:**
  - [x] Workspaces configured for `frontend` and `backend`.
  - [x] Pipeline: Passes `.pre-flight-check`.

#### Task 1.2: Setup Secrets (.env.local) (DONE)
- **Story:** Store DB and API keys securely.
- **Action:** Create `.env.local` with Postgres URL, JWT Secret, and API-Football keys.
- **Acceptance Criteria:**
  - [x] File exists and is in `.gitignore`.

---

### Epic 2: Backend Base & Database

#### Task 2.1: Scaffold NestJS App (DONE)
- **Action:** Generate base NestJS app in `backend/`.

#### Task 2.2: Setup Prisma & PostgreSQL (DONE)
- **Action:** Install Prisma, initialize schema, connect to local Postgres (`postgress:1234`).

#### Task 2.3: Create Database Models (Leagues & Teams) (DONE)
- **Action:** Write Prisma models for `League`, `Season`, and `Team`. Apply migrations.

#### Task 2.4: Create Database Models (Players & Matches) (DONE)
- **Action:** Write Prisma models for `Player`, `Match`, `Standing`. Apply migrations.

#### Task 2.5: Create Database Models (Users & Votes) (DONE)
- **Action:** Write Prisma models for `User`, `Bookmark`, `Vote`. Apply migrations.

---

### Epic 3: Backend Normalizers (API-Football)

#### Task 3.1: Define Standard Interfaces (DONE)
- **Action:** Create standard TypeScript interfaces (`StandardMatch`, `StandardTeam`, etc.).

#### Task 3.2: Build API-Football Client
- **Action:** Create Axios/Fetch client service in NestJS to hit API-Football using the secret key.

#### Task 3.3: Implement Match Normalizer
- **Action:** Create mapping logic converting API-Football fixtures to `StandardMatch`. Add unit tests.

#### Task 3.4: Implement Standings Normalizer
- **Action:** Create mapping logic for league standings. Add unit tests.

---

### Epic 4: Backend Schedulers & Real-Time

#### Task 4.1: Scaffold WebSocket Gateway (DONE)
- **Action:** Install `socket.io` and create `LiveScoreGateway` in NestJS.

#### Task 4.2: Build Daily Fixture Cron
- **Action:** Create NestJS `@Cron` job to fetch and save all matches for the current day at 3:00 AM.

#### Task 4.3: Build Live Score Poller
- **Action:** Create `@Interval(30000)` scheduler to fetch live matches and save to DB.

#### Task 4.4: Connect Poller to WebSocket
- **Action:** Make the live poller emit `match:update` events to the Gateway when a goal is scored.

---

### Epic 5: Backend Auth & Users

#### Task 5.1: Build User Registration
- **Action:** Create POST `/auth/register` with bcrypt password hashing.

#### Task 5.2: Build User Login (JWT)
- **Action:** Create POST `/auth/login` returning JWT.

#### Task 5.3: Build Bookmarks API
- **Action:** Create endpoints to add/remove favorite teams and matches (Protected by JWT).

---

### Epic 6: Frontend Base & Layout (SEO Core)

#### Task 6.1: Scaffold Next.js App Router (DONE)
- **Action:** Initialize Next.js app in `frontend/`. Install a UI library (e.g., Lucide React for icons).

#### Task 6.2: Global CSS & Fonts (DONE)
- **Action:** Set up Vanilla CSS variables, clean resets, and optimized font loading.

#### Task 6.3: Main Root Layout & SEO Meta Tags (DONE)
- **Action:** Configure `app/layout.tsx` with default OpenGraph, Twitter cards, and Title templates.
- **Acceptance Criteria:**
  - [x] SEO: Default meta tags are fully compliant.

#### Task 6.4: Yandex Metrika Integration (DONE)
- **Action:** Add Yandex.Metrika script using `next/script` in the root layout.

---

### Epic 7: Frontend Micro-Components

#### Task 7.1: Build Header/Navbar Component (DONE)
- **Action:** Create responsive Header with Logo, Navigation links, and Auth buttons.
- **Acceptance Criteria:**
  - [x] SEO: Uses `<header>` and `<nav>` semantic HTML.
  - [x] A11y: Fully tab-navigable.

#### Task 7.2: Build Footer Component (DONE)
- **Action:** Create standard footer with copyright and links.

#### Task 7.3: Build Advertisement Banner Component (DONE)
- **Action:** Create a reusable Ad placeholder component with fixed dimensions to prevent Cumulative Layout Shift (CLS).
- **Acceptance Criteria:**
  - [x] SEO/Perf: CLS is 0.

#### Task 7.4: Build Date Selector Carousel (DONE)
- **Action:** Create horizontal scrollable date picker for the dashboard.
- **Acceptance Criteria:**
  - [x] A11y: Date slider is keyboard navigable and has ARIA labels.

#### Task 7.5: Build Match Card Component (DONE)
- **Action:** Create a reusable component displaying home/away teams, scores, and match minute.

---

### Epic 8: Frontend Dashboard (Main Page)

#### Task 8.1: Dashboard Layout Structure (DONE)
- **Action:** Combine Header, Ad Banner, Date Carousel, and main content area in `page.tsx`.

#### Task 8.2: Fetch & Display Matches (DONE)
- **Action:** Server-Side fetch matches for the selected date and render a list of Match Cards.
- **Acceptance Criteria:**
  - [x] SEO: Server components are used. Data is rendered in raw HTML.

#### Task 8.3: Implement Live Toggle (DONE)
- **Action:** Add client-side toggle to filter the rendered list to only show "Live" matches.

#### Task 8.4: Group Matches by League (DONE)
- **Action:** Refactor the match list to render League headers above their respective matches.

---

### Epic 9: Frontend Match Profile

#### Task 9.1: Match Header & Scoreboard (DONE)
- **Action:** Create `/match/[id]/page.tsx`. Build the large scoreboard header.
- **Acceptance Criteria:**
  - [x] SEO: Implement `SportsEvent` JSON-LD schema dynamically.

#### Task 9.2: WebSocket Client Integration (DONE)
- **Action:** Connect scoreboard to socket.io. Flash scores when `match:update` event is received.

#### Task 9.3: Live Match Stats Component (DONE)
- **Action:** Build progress bars for possession, shots, and cards.
- **Acceptance Criteria:**
  - [x] Responsive CSS styling following SofaScore look and feel.

#### Task 9.4: Lineups Pitch Component (DONE)
- **Action:** Build CSS grid visual football pitch displaying player formations.

#### Task 9.5: Match Timeline Component (DONE)
- **Action:** Build vertical chronological list of goals and events.

#### Task 9.6: User Prediction Poll Component (DONE)
- **Action:** Build interactive Home/Draw/Away voting buttons with progress bars.

---

### Epic 10: Frontend Team & Player Profiles

#### Task 10.1: Team Profile Layout (DONE)
- **Action:** Create `/team/[id]/page.tsx`. Display team logo, info, and upcoming fixtures.
- **Acceptance Criteria:**
  - [x] SEO: Implement `SportsTeam` JSON-LD schema dynamically.

#### Task 10.2: League Standings Table Component (DONE)
- **Action:** Build the points table component and embed it on the Team Profile.

#### Task 10.3: Player Profile Layout
- **Action:** Create `/player/[id]/page.tsx`. Display player bio and stats.
- **Acceptance Criteria:**
  - [ ] SEO: Implement `Person` JSON-LD schema dynamically.

#### Task 10.4: Dynamic XML Sitemap
- **Action:** Create `/sitemap.xml/route.ts` that dynamically lists all match, team, and player URLs for search engines.

---

### Epic 11: Deployment (Ubuntu VPS)

#### Task 11.1: Dockerize NestJS Backend
- **Action:** Write `Dockerfile` and `.dockerignore` for the NestJS application.

#### Task 11.2: Dockerize Next.js Frontend
- **Action:** Write `Dockerfile` optimized for Next.js standalone build.

#### Task 11.3: Docker Compose Setup
- **Action:** Write `docker-compose.yml` to orchestrate Postgres, Backend, and Frontend.

#### Task 11.4: Nginx Reverse Proxy Config
- **Action:** Document Nginx configurations for routing traffic to frontend and backend, including WebSocket upgrades, ready for Ubuntu deployment.
