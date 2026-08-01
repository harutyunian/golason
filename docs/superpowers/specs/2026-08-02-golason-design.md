# Design Specification: Golason (SofaScore & FlashScore Clone)

- **Date:** 2026-08-02
- **Author:** Gemini CLI
- **Status:** Draft / Pending Review

---

## 1. System Overview & Goals

Golason is a modern, high-performance, SEO-optimized sports scores and statistics web application modeled after industry giants like SofaScore and FlashScore.

### Key Objectives
* **Anti-Corruption Adapter Layer (Normalizer Service):** All external data fetching maps through a normalized abstraction engine. This translates proprietary external API responses (like `api-football.com`) into standard internal types (`StandardMatch`, `StandardTeam`, etc.), keeping the database, core NestJS services, and Next.js frontend completely decoupled from third-party schemas.
* **Extensible Multi-Sport Foundation:** Initial release (MVP) focuses on Football (Soccer), with the database schema and service abstraction layers designed to easily incorporate Tennis, Hockey, UFC, and more in subsequent phases.
* **SEO & Crawlability:** Dynamic generation of `sitemap.xml`, server-side rendering (SSR) of team/player/match profiles, and extensive JSON-LD structured schemas (`SportsEvent`, `SportsTeam`, `Person`) to rank highly on search engines.
* **Low Latency & High Performance:** Highly optimized Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms) achieved through Next.js server components, vanilla CSS layout efficiency, and localized caching.
* **Real-time Live score Push (WebSocket Gateway):** Integrates WebSockets (`socket.io` inside NestJS) to push score flashes, events, and cards directly to the Next.js client the instant a scheduler updates a live match in PostgreSQL, eliminating HTTP polling.
* **User Authentication & Community Hub:** Features login, registration, bookmark tracking (Leagues/Teams/Matches), and interactive match prediction voting, turning casual visitors into registered, engaged community members.
* **High-Fidelity Analytics & Monitoring:** Embeds Yandex.Metrika for real-time traffic statistics, clickmaps, and accurate user engagement tracking, as well as an Admin quota control panel.

---

## 2. Monorepo Directory Structure

To maintain clean boundaries while working inside a single repository, the project will be structured as a monorepo workspace:

```
golason/
├── .env.local                     # Shared environment configurations (ignored in git)
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-08-02-golason-design.md  # This design file
├── backend/                       # NestJS API Backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/                  # JWT Authentication Module (Register, Login, Guards)
│   │   ├── users/                 # Users Feature Module (Profiles, Favorites, Votes)
│   │   ├── prisma/                # Prisma Module & Service
│   │   ├── sports/                # Common Sports Abstraction Module (Standard Types & Interfaces)
│   │   │   ├── interfaces/        # StandardMatch, StandardTeam, StandardPlayer
│   │   │   └── normalizers/       # Normalizer Base class / interface
│   │   ├── football/              # Football Specific Feature Module
│   │   │   ├── controllers/
│   │   │   ├── services/          # Business logic, DB persistence
│   │   │   ├── schedulers/        # Background Cron Schedulers
│   │   │   └── normalizers/       # FootballNormalizerService (maps api-football.com v3 response)
│   │   ├── gateway/               # WebSocket Push Gateway Module (for live scoring broadcasts)
│   │   ├── admin/                 # Admin Dashboard backend (API status, rate limits, sync tools)
│   │   └── shared/                # Interceptors (Logging, Cache, Transform, Error-formatting)
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL Database Schema
│   ├── package.json
│   └── tsconfig.json
└── frontend/                      # Next.js Frontend
    ├── app/                       # App Router Directories
    │   ├── page.tsx               # Dashboard (Live/Upcoming Toggle, Date Picker)
    │   ├── login/                 # Login & Registration Page / Modals
    │   ├── match/
    │   │   └── [id]/
    │   │       └── page.tsx       # Match Profile (Live Stats, Lineups/Ratings, H2H, Timeline, Momentum, Polls)
    │   ├── team/
    │   │   └── [id]/
    │   │       └── page.tsx       # Team Profile (Fixtures, Squad, Standings)
    │   ├── player/
    │   │   └── [id]/
    │   │       └── page.tsx       # Player Profile (Details, Market Value, Match History)
    │   ├── admin/
    │   │   └── page.tsx           # Admin Dashboard Panel (Quota monitor, Cache clear keys)
    │   ├── sitemap.xml/
    │   │   └── route.ts           # Dynamic XML Sitemap Generator
    │   ├── layout.tsx             # Root layout containing global Yandex.Metrika configuration
    │   ├── manifest.json          # PWA Manifest
    │   └── globals.css            # Root Vanilla CSS Variables & Design Tokens
    ├── components/                # Reusable Server/Client Components
    ├── hooks/                     # Custom hooks (e.g., useWebSocket, useMetadata, useAuth)
    ├── package.json
    └── tsconfig.json
```

---

## 3. Normalizer (Adapter) Service Architecture

To isolate external APIs, the NestJS backend uses a normalizer pipeline:

```
[ External API-Football ]
            │
            ▼ (Raw JSON Response)
┌───────────────────────────────────────┐
│  FootballNormalizerService            │
│  - Maps raw fields into StandardTypes │
└───────────────────────────────────────┘
            │
            ▼ (StandardMatch, StandardTeam, StandardPlayer types)
┌───────────────────────────────────────┐
│  FootballPersistenceService           │
│  - Saves standard objects to DB      │
│  - Emits WebSocket broadcast events   │
└───────────────────────────────────────┘
            │
            ├──► [ PostgreSQL Database via Prisma ]
            └──► [ WebSocket socket.io Clients ] (Next.js instant score flashes!)
```

---

## 4. Database Schema (Prisma & PostgreSQL)

The database schema aligns perfectly with our standard interfaces, with added schemas for User accounts, Bookmarks, and Match Prediction Voting:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SportType {
  FOOTBALL
  TENNIS
  HOCKEY
  UFC
}

enum MatchStatus {
  SCHEDULED
  LIVE
  HALFTIME
  FINISHED
  POSTPONED
  CANCELLED
}

enum VoteChoice {
  HOME
  DRAW
  AWAY
}

model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  password  String     // Hashed password
  name      String?
  isAdmin   Boolean    @default(false)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  favorites Bookmark[]
  votes     Vote[]
}

model Bookmark {
  id        Int       @id @default(autoincrement())
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sport     SportType @default(FOOTBALL)
  
  // Dynamic polymorphic association keys:
  leagueId  Int?
  teamId    Int?
  matchId   Int?
  
  createdAt DateTime  @default(now())
  
  @@unique([userId, leagueId, teamId, matchId])
}

model Vote {
  id        Int        @id @default(autoincrement())
  userId    Int
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  matchId   Int
  choice    VoteChoice
  createdAt DateTime   @default(now())

  @@unique([userId, matchId])
}

model League {
  id           Int        @id                     // Matches external API ID
  name         String
  country      String
  logo         String?
  sport        SportType  @default(FOOTBALL)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  seasons      Season[]
  teams        Team[]
  matches      Match[]
  standings    Standing[]
}

model Season {
  id        Int      @id @default(autoincrement())
  year      Int
  current   Boolean  @default(false)
  leagueId  Int
  league    League   @relation(fields: [leagueId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Team {
  id          Int       @id                     // Matches external API ID
  name        String
  code        String?
  logo        String?
  founded     Int?
  venueName   String?
  venueCity   String?
  sport       SportType @default(FOOTBALL)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  leagues     League[]
  players     Player[]
  homeMatches Match[]   @relation("HomeTeam")
  awayMatches Match[]   @relation("AwayTeam")
}

model Player {
  id          Int       @id                     // Matches external API ID
  name        String
  firstname   String?
  lastname    String?
  age         Int?
  birthDate   String?
  nationality String?
  height      String?
  weight      String?
  photo       String?
  position    String?   // e.g., Goalkeeper, Defender, Midfielder, Attacker
  injured     Boolean   @default(false)
  sport       SportType @default(FOOTBALL)
  teamId      Int?
  team        Team?     @relation(fields: [teamId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Match {
  id             Int         @id                // Matches external API ID
  date           DateTime                       // Kickoff timestamp
  status         MatchStatus @default(SCHEDULED)
  elapsedTime    Int?                           // Minute of play
  sport          SportType   @default(FOOTBALL)
  
  leagueId       Int
  league         League      @relation(fields: [leagueId], references: [id])
  
  homeTeamId     Int
  homeTeam       Team        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeamId     Int
  awayTeam       Team        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  
  homeScore      Int?        @default(0)
  awayScore      Int?        @default(0)
  
  homeScoreHT    Int?        @default(0)
  awayScoreHT    Int?        @default(0)
  
  stats          Json?                          // Standardized match statistics
  lineups        Json?                          // Standardized squad lineups
  events         Json?                          // Standardized event timeline
  h2h            Json?                          // Standardized H2H matches
  momentum       Json?                          // Calculated visual momentum graph datapoints
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([date])
  @@index([status])
}

model Standing {
  id         Int      @id @default(autoincrement())
  leagueId   Int
  league     League   @relation(fields: [leagueId], references: [id])
  season     Int
  rank       Int
  teamId     Int
  points     Int
  goalsDiff  Int
  form       String?  // e.g., "WDLWW"
  played     Int
  win        Int
  draw       Int
  lose       Int
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## 5. Backend Synchronization, Caching & Real-Time Events (NestJS)

NestJS coordinates all fetch, normalize, persist, auth, and real-time push pipelines:

### 5.1. Caching Tiers
1.  **Warm/Static Data (Teams, Players, Leagues):**
    *   Fetched on demand only if absent from PostgreSQL, or refreshed weekly.
2.  **Daily Fixtures Scheduler:**
    *   A Cron Job runs daily at 3:00 AM UTC to query `v3.football.api-sports.io/fixtures` for all scheduled games on that calendar date.
    *   Inserts or updates scheduled matches in PostgreSQL.
3.  **Standings / Table Cache:**
    *   Standings are requested and cached in the database with a 6-hour TTL.
4.  **Live Polling Scheduler (Highly Optimized):**
    *   An active checker checks if there are matches with status `LIVE` or scheduled to start in 5 minutes.
    *   **If matches are active:** Polls `/fixtures?live=all` once every **30 seconds**.
    *   **If no matches are active:** Shuts down polling completely to protect API rate quotas.

### 5.2. WebSocket Live Score Flash
*   When a polling job updates active matches, the persistence service checks for goal changes or event updates compared to the previous state.
*   It immediately broadcasts a WebSocket event (`match:update`, payload containing standard match stats) via Socket.io.
*   The Next.js client instantly updates the UI with an animated flash.

---

## 6. Next.js Frontend Features & SEO Specifications

### 6.1. Dashboard / Main Page (`/`)
*   **Live/All Toggle:** Filters between live matches and all scheduled games.
*   **Date Selector Carousel:** Slider ribbon with a calendar picker to load matches for any given date.
*   **Favorite Bookmarks Module**: A fast sidebar and toggle called "My Games" allowing users to filter the dashboard exclusively for matches or leagues they have favorited.

### 6.2. Profile Views
*   **Match Profile (`/match/[id]`):**
    *   **Header:** Real-time scoreboard, game time, live animation pulse.
    *   **Interactive Voting Poll:** Allows logged-in users to predict Home/Draw/Away. Displays real-time community percentages.
    *   **Visual Match Momentum Graph:** A customized line chart rendered using HTML Canvas or SVGs to represent dynamic team attack dominance throughout the 90 minutes (calculated from shots, dangerous attacks, corners).
    *   **Live Stats Tab:** Modern comparison bars showing Possession %, Shots on Goal, Total Shots, Corner Kicks, Fouls, Yellow/Red Cards.
    *   **Squad Tab:** Interactive football pitch showing formations, player lineups, ratings, and subs.
    *   **Timeline Tab:** Vertical chronological event scroll (Goals, Cards, Substitutions, VAR checks).
    *   **H2H Tab:** Previous 5 head-to-head match cards, win-probability graphs.
*   **Team Profile (`/team/[id]`):**
    *   Club details, logo, home stadium, and current squad roster.
    *   Past 10 and next 10 fixtures.
    *   Live league table standings.
*   **Player Profile (`/player/[id]`):**
    *   Avatar, nationality, age, height, position, and active rating.
    *   Historical seasonal player stats.

### 6.3. Elite SEO & Web Quality Controls
*   **Dynamic XML Sitemap (`/sitemap.xml`):**
    *   Dynamically reads active Teams, Players, and Matches from the Database API and outputs standardized SEO routes.
*   **JSON-LD Structured Schema:**
    *   **Match Page:** Uses `SportsEvent` schema specifying team names, start times, scores, and venue.
    *   **Team Page:** Uses `SportsTeam` schema.
    *   **Player Page:** Uses `Person` schema.
*   **Edge Timezone Localization:**
    *   Uses Next.js Server Components / Middleware to localize game times transparently based on user request headers.
*   **Progressive Web App (PWA) Assets:**
    *   Configures a standard service worker and `manifest.json` for installation on mobile devices.
*   **Yandex.Metrika Counter (Layout Embedding):**
    *   Loaded asynchronously using the modern Next.js `next/script` loader inside the root `layout.tsx` to optimize page performance, while including a `<noscript>` image fallback to maintain absolute statistics coverage.

---

## 7. Yandex.Metrika Tag Integration Details

The global tracker is loaded with the following configuration:

```typescript
// frontend/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Yandex.Metrika Counter */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111230462', 'ym');

            ym(111230462, 'init', {
              ssr: true,
              clickmap: true,
              ecommerce: "dataLayer",
              referrer: document.referrer,
              url: location.href,
              accurateTrackBounce: true,
              trackLinks: true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img 
              src="https://mc.yandex.ru/watch/111230462" 
              style={{ position: 'absolute', left: '-9999px' }} 
              alt="" 
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
```

---

## 8. Development Workflow & Quality Assurance Gate

Following the rigorous standards specified by the user:
1.  **Code Verification Checkpoints:**
    *   After adding or modifying any frontend components or routes, run accessibility audits (`accessibility` skill), SEO audits (`seo` skill), and Core Web Vitals checks (`core-web-vitals` skill).
    *   Run the workspace `.pre-flight-check/scripts/run-pipeline.py` sequentially to guarantee Typechecking, Linting, Testing, and Security Audits pass.
2.  **Implementation Progression:**
    *   We will start by scaffolding the backend and setting up database schemas, then writing the API syncer and Normalizer services.
    *   Next, we will implement the NestJS auth endpoints, WebSocket gateway, and Admin status dashboards.
    *   Finally, we will develop the Next.js App Router UI in `/frontend`.

---

## 9. Spec Self-Review Summary
- **Placeholders Checked:** No TBDs. Database credentials, routes, Yandex.Metrika script parameters, and models are fully defined.
- **Consistency Verified:** Schema handles Football MVP models while remaining fully adaptable to sports types (`SportType`). NextJS is set as the SEO frontend, and NestJS + PostgreSQL serves as the server API backend.
- **Scope Confirmed:** Structured into clear monorepo folders to keep implementations modular, isolated, and easy to code.
