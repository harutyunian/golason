# Redis Sports Cache & Adaptive TTL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the in-memory cache in NestJS `ApiFootballClientService` to Redis, implement smart, robust try/catch fallbacks to prevent crashes on Redis outages, and integrate adaptive TTL calculations for matches, leagues, and odds queries.

**Architecture:** Replace local memory maps with asynchronous Redis commands via injected `REDIS_CLIENT`. Maintain absolute reliability through soft-failure handling (falling back to external API-Football on any Redis error).

**Tech Stack:** NestJS, TypeScript, ioredis, Jest.

## Global Constraints
- Target codebase: NestJS backend.
- File to modify: `backend/src/sports/api-football-client.service.ts`
- File to create: `backend/src/sports/api-football-client.service.spec.ts`
- Redis Client Inject token: `'REDIS_CLIENT'`
- All Redis get/set calls must be wrapped in try-catch blocks with warn level logs on error.
- All tests must pass (resulting in 69/69 Jest unit tests passing).

---

### Task 1: Redis Caching Core Integration

**Files:**
- Modify: `backend/src/sports/api-football-client.service.ts`

**Interfaces:**
- Consumes: `REDIS_CLIENT` token from NestJS SportsModule.
- Produces: `ApiFootballClientService` with asynchronous Redis caching inside `fetchWithTimeout`.

- [ ] **Step 1: Inject REDIS_CLIENT and remove in-memory cache definition**
  - Import `Inject` from `@nestjs/common` and `Redis` from `ioredis`.
  - Add constructor to inject `'REDIS_CLIENT'`.
  - Remove `CacheEntry` interface and `cache` property.

- [ ] **Step 2: Update fetchWithTimeout to check cache from Redis**
  - Replace cache lookup logic to query Redis asynchronously:
    ```typescript
    try {
      const cached = await this.redis.get(`cache:${url}`);
      if (cached) {
        this.logger.debug(`[Cache HIT] Returning cached data from Redis for: ${url}`);
        return JSON.parse(cached);
      }
    } catch (err: any) {
      this.logger.warn(`Redis cache error: ${err.message}`);
    }
    ```

- [ ] **Step 3: Update fetchWithTimeout to store response in Redis**
  - In the success block of the API call, after calculating `ttl`, if `ttl > 0`:
    ```typescript
    try {
      await this.redis.set(`cache:${url}`, JSON.stringify(data), 'PX', ttl);
      this.logger.log(`[Cache SET] Cached response in Redis for URL: ${url} (TTL: ${ttl}ms)`);
    } catch (err: any) {
      this.logger.warn(`Redis cache error: ${err.message}`);
    }
    ```

- [ ] **Step 4: Verify Compilation**
  - Run `npm run build --prefix backend` to ensure TypeScript compilation passes.

---

### Task 2: Adaptive TTL Calculation

**Files:**
- Modify: `backend/src/sports/api-football-client.service.ts`

**Interfaces:**
- Produces: Updated `getTtlForUrl(url: string, data?: any): number` method.

- [ ] **Step 1: Implement Leagues and Odds caching rules**
  - If `url.includes('/odds?fixture=')`, return `30 * 60 * 1000`.
  - If `url.includes('/leagues')`, return `24 * 60 * 60 * 1000`.

- [ ] **Step 2: Implement Fixtures ID caching rules**
  - Check if `url.includes('/fixtures?id=')`.
  - Check if `data?.response?.[0]` exists.
  - Extract status code: `const status = data.response[0].fixture?.status?.short;`
  - Finished: `['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD'].includes(status)` -> return `24 * 60 * 60 * 1000`.
  - Upcoming: `['NS', 'TBD'].includes(status)`:
    - Kickoff time: `const kickoff = data.response[0].fixture?.timestamp ? data.response[0].fixture.timestamp * 1000 : null;`
    - If `kickoff` exists and `kickoff - Date.now() > 2 * 60 * 60 * 1000` -> return `60 * 60 * 1000`.
    - Else if starts in <= 2 hours -> return `5 * 60 * 1000`.
    - If no kickoff -> return `10 * 60 * 1000`.
  - Live: `['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status)` (or any other short status) -> return `10 * 1000`.
  - If no `data` is provided -> return `10 * 1000` as a default.

---

### Task 3: Unit Testing and Verification

**Files:**
- Create: `backend/src/sports/api-football-client.service.spec.ts`

- [ ] **Step 1: Write Unit Tests**
  - Create the spec file mocking `'REDIS_CLIENT'` and simulating cache hits, cache misses, Redis connection failures, and verifying correct TTL returns for various URL patterns.
  
- [ ] **Step 2: Run and verify all 69/69 tests**
  - Run `npm test --prefix backend` to verify everything compiles and passes with 100% success.
