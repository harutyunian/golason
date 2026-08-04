# Live Match Polling Cron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust live match polling cron job inside NestJS that fetches live match data from API-Football every 30 seconds, normalizes it, and upserts it into PostgreSQL, secured with a distributed Redis lock to prevent execution overlaps.

**Architecture:** Implement `LiveSyncCronService` inside `backend/src/sports/cron/live-sync.cron.ts`. The service uses `@Cron(CronExpression.EVERY_30_SECONDS)` to trigger the sync, uses `ioredis` for a distributed lock, calls the extended `ApiFootballClientService` to query live matches, normalizes the fixtures using `FootballNormalizerService`, and upserts each match along with its dependencies (League, Teams) into PostgreSQL using `PrismaService`.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Redis (`ioredis`), Jest

## Global Constraints
- **Live Sync Service Path:** `backend/src/sports/cron/live-sync.cron.ts`
- **Live Sync Test Path:** `backend/src/sports/cron/live-sync.cron.spec.ts`
- **Sports Module Path:** `backend/src/sports/sports.module.ts`
- **Polling Interval:** Every 30 seconds (`*/30 * * * * *` or `@Cron(CronExpression.EVERY_30_SECONDS)`)
- **Redis Lock Key:** `cron:live-sync:lock` with a 20-second TTL
- **Verification Rule:** Both compile-time safety (`npm run build`) and unit tests (`npm run test`) must be fully green.

---

### Task 1: Extend ApiFootballClientService with getLiveFixtures

**Files:**
- Modify: `backend/src/sports/api-football-client.service.ts`

**Interfaces:**
- Produces: `getLiveFixtures(): Promise<any>`

- [ ] **Step 1: Read the existing Client Service**
  Review `backend/src/sports/api-football-client.service.ts` to locate an appropriate injection or insertion point.

- [ ] **Step 2: Add getLiveFixtures method**
  Add the following method to the `ApiFootballClientService` class:
  ```typescript
  /**
   * Fetch currently ongoing (live) match fixtures.
   */
  async getLiveFixtures(): Promise<any> {
    const url = `${this.baseUrl}/fixtures?live=all`;
    this.logger.log('Requesting all live fixtures');
    return this.fetchWithTimeout(url);
  }
  ```

- [ ] **Step 3: Run typescript check to verify syntax correctness**
  Run `npm run build` or typescript checker in backend to verify.
  Expected: Compile passes successfully.

---

### Task 2: Create SportsModule to encapsulate Sports Providers

**Files:**
- Create: `backend/src/sports/sports.module.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Produces: `SportsModule` which exports `ApiFootballClientService`, `FootballNormalizerService`, and `LiveSyncCronService`.

- [ ] **Step 1: Write SportsModule file**
  Create `backend/src/sports/sports.module.ts` with the following content:
  ```typescript
  import { Module } from '@nestjs/common';
  import { ApiFootballClientService } from './api-football-client.service';
  import { FootballNormalizerService } from './football-normalizer.service';
  import { LiveSyncCronService } from './cron/live-sync.cron';
  import { FootballController } from './football.controller';
  import { PrismaService } from '../prisma/prisma.service';

  @Module({
    controllers: [FootballController],
    providers: [
      ApiFootballClientService,
      FootballNormalizerService,
      LiveSyncCronService,
      PrismaService,
    ],
    exports: [
      ApiFootballClientService,
      FootballNormalizerService,
      LiveSyncCronService,
    ],
  })
  export class SportsModule {}
  ```

- [ ] **Step 2: Refactor AppModule to import SportsModule**
  Modify `backend/src/app.module.ts` to replace raw sports providers/controllers with `SportsModule`:
  ```typescript
  import { Module } from '@nestjs/common';
  import { ScheduleModule } from '@nestjs/schedule';
  import { AppController } from './app.controller';
  import { AppService } from './app.service';
  import { LiveScoreGateway } from './gateway/live-score.gateway';
  import { PrismaService } from './prisma/prisma.service';
  import { SportsModule } from './sports/sports.module';

  @Module({
    imports: [ScheduleModule.forRoot(), SportsModule],
    controllers: [AppController],
    providers: [
      AppService,
      LiveScoreGateway,
      PrismaService,
    ],
  })
  export class AppModule {}
  ```

- [ ] **Step 3: Verify Compilation**
  Run: `npm run build` from `backend/`
  Expected: Successful compile with zero errors.

---

### Task 3: Implement LiveSyncCronService with ioredis Locking

**Files:**
- Create: `backend/src/sports/cron/live-sync.cron.ts`

**Interfaces:**
- Produces: `@Injectable() class LiveSyncCronService` with `@Cron('*/30 * * * * *') handleLiveSync()`

- [ ] **Step 1: Create LiveSyncCronService class**
  Create the service `backend/src/sports/cron/live-sync.cron.ts` implementing a Redis-locked 30s cron job:
  ```typescript
  import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
  import { Cron, CronExpression } from '@nestjs/schedule';
  import Redis from 'ioredis';
  import { ApiFootballClientService } from '../api-football-client.service';
  import { FootballNormalizerService } from '../football-normalizer.service';
  import { PrismaService } from '../../prisma/prisma.service';

  @Injectable()
  export class LiveSyncCronService implements OnModuleDestroy {
    private readonly logger = new Logger(LiveSyncCronService.name);
    private readonly redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });

    constructor(
      private readonly apiFootballClient: ApiFootballClientService,
      private readonly normalizer: FootballNormalizerService,
      private readonly prisma: PrismaService,
    ) {}

    async onModuleDestroy() {
      await this.redis.quit();
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async handleLiveSync() {
      const lockKey = 'cron:live-sync:lock';
      const lockTtlMs = 20000; // 20 seconds TTL

      try {
        // Attempt to acquire distributed lock to prevent overlaps
        const acquired = await this.redis.set(lockKey, 'locked', 'PX', lockTtlMs, 'NX');
        if (acquired !== 'OK') {
          this.logger.warn('[LiveSyncCron] Sync lock is already held. Skipping execution.');
          return;
        }

        this.logger.log('[LiveSyncCron] Acquired sync lock. Fetching live fixtures...');

        // 1. Fetch raw live fixtures
        const response = await this.apiFootballClient.getLiveFixtures();
        if (!response || !response.response || !Array.isArray(response.response)) {
          this.logger.warn('[LiveSyncCron] No valid response from API-Football live fixtures.');
          await this.releaseLock(lockKey);
          return;
        }

        const rawFixtures = response.response;
        this.logger.log(`[LiveSyncCron] Fetched ${rawFixtures.length} live matches. Normalizing...`);

        // 2. Normalize raw fixtures
        const normalizedMatches = this.normalizer.normalizeFixtures(rawFixtures);

        // 3. Upsert into DB
        let successCount = 0;
        for (const match of normalizedMatches) {
          try {
            // A. Upsert League dependency
            await this.prisma.league.upsert({
              where: { id: match.league.id },
              update: {
                name: match.league.name,
                country: match.league.country,
                logo: match.league.logo,
              },
              create: {
                id: match.league.id,
                name: match.league.name,
                country: match.league.country,
                logo: match.league.logo,
                sport: 'FOOTBALL',
              },
            });

            // B. Upsert Home Team dependency
            await this.prisma.team.upsert({
              where: { id: match.homeTeam.id },
              update: {
                name: match.homeTeam.name,
                logo: match.homeTeam.logo,
              },
              create: {
                id: match.homeTeam.id,
                name: match.homeTeam.name,
                logo: match.homeTeam.logo,
                sport: 'FOOTBALL',
              },
            });

            // C. Upsert Away Team dependency
            await this.prisma.team.upsert({
              where: { id: match.awayTeam.id },
              update: {
                name: match.awayTeam.name,
                logo: match.awayTeam.logo,
              },
              create: {
                id: match.awayTeam.id,
                name: match.awayTeam.name,
                logo: match.awayTeam.logo,
                sport: 'FOOTBALL',
              },
            });

            // D. Upsert Match
            await this.prisma.match.upsert({
              where: { id: match.id },
              update: {
                date: new Date(match.date),
                status: match.status,
                elapsedTime: match.elapsedTime,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                homeScoreHT: match.homeScoreHT,
                awayScoreHT: match.awayScoreHT,
                stats: match.stats || undefined,
                lineups: match.lineups || undefined,
                events: match.events || undefined,
              },
              create: {
                id: match.id,
                date: new Date(match.date),
                status: match.status,
                elapsedTime: match.elapsedTime,
                sport: 'FOOTBALL',
                leagueId: match.leagueId,
                homeTeamId: match.homeTeamId,
                awayTeamId: match.awayTeamId,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                homeScoreHT: match.homeScoreHT,
                awayScoreHT: match.awayScoreHT,
                stats: match.stats || undefined,
                lineups: match.lineups || undefined,
                events: match.events || undefined,
              },
            });

            successCount++;
          } catch (dbErr: any) {
            this.logger.error(`[LiveSyncCron] Failed to upsert match ID ${match.id}: ${dbErr.message}`);
          }
        }

        this.logger.log(`[LiveSyncCron] Successfully upserted ${successCount}/${normalizedMatches.length} live matches.`);

        // Release Lock
        await this.releaseLock(lockKey);
      } catch (err: any) {
        this.logger.error(`[LiveSyncCron] Critical error in live sync execution: ${err.message}`);
        await this.releaseLock(lockKey);
      }
    }

    private async releaseLock(key: string) {
      try {
        await this.redis.del(key);
      } catch (err: any) {
        this.logger.error(`[LiveSyncCron] Failed to release Redis lock: ${err.message}`);
      }
    }
  }
  ```

---

### Task 4: Create Unit Tests for LiveSyncCronService

**Files:**
- Create: `backend/src/sports/cron/live-sync.cron.spec.ts`

**Interfaces:**
- Consumes: `LiveSyncCronService`
- Produces: Test verification suite

- [ ] **Step 1: Write Unit Test file**
  Create `backend/src/sports/cron/live-sync.cron.spec.ts` with comprehensive mock setups for ApiFootballClientService, FootballNormalizerService, PrismaService, and ioredis:
  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { LiveSyncCronService } from './live-sync.cron';
  import { ApiFootballClientService } from '../api-football-client.service';
  import { FootballNormalizerService } from '../football-normalizer.service';
  import { PrismaService } from '../../prisma/prisma.service';

  // Mock ioredis before importing service/tests
  const mockRedisSet = jest.fn();
  const mockRedisDel = jest.fn();
  const mockRedisQuit = jest.fn();

  jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
      return {
        set: mockRedisSet,
        del: mockRedisDel,
        quit: mockRedisQuit,
      };
    });
  });

  describe('LiveSyncCronService', () => {
    let service: LiveSyncCronService;
    let apiFootballClient: ApiFootballClientService;
    let normalizer: FootballNormalizerService;
    let prisma: PrismaService;

    const mockApiFootballClient = {
      getLiveFixtures: jest.fn(),
    };

    const mockNormalizer = {
      normalizeFixtures: jest.fn(),
    };

    const mockPrisma = {
      league: { upsert: jest.fn() },
      team: { upsert: jest.fn() },
      match: { upsert: jest.fn() },
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          LiveSyncCronService,
          { provide: ApiFootballClientService, useValue: mockApiFootballClient },
          { provide: FootballNormalizerService, useValue: mockNormalizer },
          { provide: PrismaService, useValue: mockPrisma },
        ],
      }).compile();

      service = module.get<LiveSyncCronService>(LiveSyncCronService);
      apiFootballClient = module.get<ApiFootballClientService>(ApiFootballClientService);
      normalizer = module.get<FootballNormalizerService>(FootballNormalizerService);
      prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should skip sync if Redis lock cannot be acquired', async () => {
      mockRedisSet.mockResolvedValue('BUSY'); // Lock not acquired

      const loggerSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

      await service.handleLiveSync();

      expect(mockRedisSet).toHaveBeenCalledWith('cron:live-sync:lock', 'locked', 'PX', 20000, 'NX');
      expect(mockApiFootballClient.getLiveFixtures).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Sync lock is already held'));
    });

    it('should fetch, normalize, and upsert fixtures when lock is acquired', async () => {
      mockRedisSet.mockResolvedValue('OK'); // Lock acquired
      mockRedisDel.mockResolvedValue(1);

      const mockRawResponse = {
        response: [
          { fixture: { id: 101, date: '2026-08-03T18:00:00Z' } }
        ]
      };
      mockApiFootballClient.getLiveFixtures.mockResolvedValue(mockRawResponse);

      const mockNormalizedMatches = [
        {
          id: 101,
          date: '2026-08-03T18:00:00Z',
          status: 'LIVE',
          elapsedTime: 45,
          sport: 'FOOTBALL',
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: 1,
          awayScore: 0,
          homeScoreHT: 1,
          awayScoreHT: 0,
          league: { id: 39, name: 'Premier League', country: 'England', logo: 'logo-url' },
          homeTeam: { id: 42, name: 'Arsenal', logo: 'logo-home' },
          awayTeam: { id: 49, name: 'Chelsea', logo: 'logo-away' },
          stats: null,
          lineups: null,
          events: null,
        }
      ];
      mockNormalizer.normalizeFixtures.mockReturnValue(mockNormalizedMatches);

      mockPrisma.league.upsert.mockResolvedValue({});
      mockPrisma.team.upsert.mockResolvedValue({});
      mockPrisma.match.upsert.mockResolvedValue({});

      await service.handleLiveSync();

      expect(mockRedisSet).toHaveBeenCalledWith('cron:live-sync:lock', 'locked', 'PX', 20000, 'NX');
      expect(mockApiFootballClient.getLiveFixtures).toHaveBeenCalled();
      expect(mockNormalizer.normalizeFixtures).toHaveBeenCalledWith(mockRawResponse.response);

      // Verify cascading dependency upserts
      expect(mockPrisma.league.upsert).toHaveBeenCalledWith({
        where: { id: 39 },
        update: { name: 'Premier League', country: 'England', logo: 'logo-url' },
        create: { id: 39, name: 'Premier League', country: 'England', logo: 'logo-url', sport: 'FOOTBALL' },
      });

      expect(mockPrisma.team.upsert).toHaveBeenCalledWith({
        where: { id: 42 },
        update: { name: 'Arsenal', logo: 'logo-home' },
        create: { id: 42, name: 'Arsenal', logo: 'logo-home', sport: 'FOOTBALL' },
      });

      expect(mockPrisma.team.upsert).toHaveBeenCalledWith({
        where: { id: 49 },
        update: { name: 'Chelsea', logo: 'logo-away' },
        create: { id: 49, name: 'Chelsea', logo: 'logo-away', sport: 'FOOTBALL' },
      });

      expect(mockPrisma.match.upsert).toHaveBeenCalledWith({
        where: { id: 101 },
        update: {
          date: new Date('2026-08-03T18:00:00Z'),
          status: 'LIVE',
          elapsedTime: 45,
          homeScore: 1,
          awayScore: 0,
          homeScoreHT: 1,
          awayScoreHT: 0,
          stats: undefined,
          lineups: undefined,
          events: undefined,
        },
        create: {
          id: 101,
          date: new Date('2026-08-03T18:00:00Z'),
          status: 'LIVE',
          elapsedTime: 45,
          sport: 'FOOTBALL',
          leagueId: 39,
          homeTeamId: 42,
          awayTeamId: 49,
          homeScore: 1,
          awayScore: 0,
          homeScoreHT: 1,
          awayScoreHT: 0,
          stats: undefined,
          lineups: undefined,
          events: undefined,
        },
      });

      expect(mockRedisDel).toHaveBeenCalledWith('cron:live-sync:lock');
    });
  });
  ```

- [ ] **Step 2: Run Unit Tests**
  Run Jest inside the `backend` workspace directory:
  ```bash
  npm run test backend/src/sports/cron/live-sync.cron.spec.ts
  ```
  Expected: All tests pass successfully!

---

### Task 5: Final Validation and Pre-Flight Checks

**Files:**
- Create: (none)
- Modify: (none)

- [ ] **Step 1: Execute NestJS Build**
  Run compilation from `backend` workspace to verify correct imports:
  ```bash
  npm run build
  ```
  Expected: Successful NestJS build.

- [ ] **Step 2: Run complete project-wide test suite**
  Run `npm run test` to verify everything is green and no regressions were introduced.
  Expected: All tests (18 normalizer tests + new cron tests) pass successfully.

- [ ] **Step 3: Run the full pre-flight quality check pipeline**
  Run the quality gate script from workspace root:
  ```bash
  python3 .pre-flight-check/scripts/run-pipeline.py
  ```
  Expected: `### ✅ PRE-FLIGHT PASSED`
