# Design Specification: Epic 2 & 3: Redis Sports Cache Migration & Adaptive Caching Protocol

## 1. Overview
The goal is to migrate the local in-memory caching mechanism in `ApiFootballClientService` (`api-football-client.service.ts`) to Redis. This ensures distributed caching, scalability, and better persistence. Additionally, we will implement smart, adaptive TTL calculations for fixtures, leagues, and odds queries to minimize external API costs and handle live/upcoming matches.

## 2. Proposed Approaches & Recommendation

### Approach 1: Direct Redis-only Caching (Recommended)
- **Description**: Remove `private readonly cache = new Map<string, CacheEntry>()` and replace with direct `this.redis.get` and `this.redis.set` async operations.
- **Outage Fallback**: Wrap all Redis calls in `try/catch` blocks. If Redis is down, log warnings and fallback to fetching from API-Football.
- **Pros**: Clean architecture, low memory usage, single source of truth across service instances.
- **Cons**: Total reliance on API-Football when Redis is unavailable (handled gracefully).

### Approach 2: Dual-tier Cache (Redis + Memory Fallback)
- **Description**: Maintain an in-memory map fallback in case Redis fails.
- **Pros**: Reduces external API calls even if Redis goes down.
- **Cons**: Added complexity, potential cache drift, increased memory usage.

**Recommendation**: Approach 1 is recommended as it is idiomatic, clean, robust, and fulfills the requested specification exactly.

## 3. Detailed Specifications

### 3.1 Redis Integration
In `ApiFootballClientService`, we inject `REDIS_CLIENT`:
```typescript
constructor(
  @Inject('REDIS_CLIENT') private readonly redis: Redis,
) {}
```
We remove `CacheEntry` interface and `private readonly cache` Map.

### 3.2 Cache Get & Set Logic
In `fetchWithTimeout(url, options)`:
1. Try fetching from Redis first using `cache:${url}`:
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
2. If cache miss, proceed with existing fetching logic.
3. Once external API returns data, calculate TTL using `getTtlForUrl(url, data)`.
4. If TTL > 0, store in Redis:
   ```typescript
   try {
     await this.redis.set(`cache:${url}`, JSON.stringify(data), 'PX', ttl);
     this.logger.log(`[Cache SET] Cached response in Redis for URL: ${url} (TTL: ${ttl}ms)`);
   } catch (err: any) {
     this.logger.warn(`Redis cache error: ${err.message}`);
   }
   ```

### 3.3 Dynamic TTL Configuration
We implement dynamic TTL logic inside `getTtlForUrl(url: string, data?: any)`:
- `/odds?fixture=`: cache for 30 minutes (`30 * 60 * 1000` ms).
- `/leagues`: cache for 24 hours (`24 * 60 * 60 * 1000` ms).
- `/fixtures?id=`:
  - Extract the status short code: `data.response[0].fixture?.status?.short`.
  - If finished (`['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD']`): cache for 24 hours (`24 * 60 * 60 * 1000` ms).
  - If upcoming (`['NS', 'TBD']`):
    - Extract kickoff timestamp: `data.response[0].fixture?.timestamp * 1000`.
    - If kickoff exists, calculate time to kickoff: `kickoff - Date.now()`.
    - If starts in > 2 hours, cache for 1 hour (`60 * 60 * 1000` ms).
    - If starts in <= 2 hours, cache for 5 minutes (`5 * 60 * 1000` ms).
    - If no kickoff exists: cache for 10 minutes (`10 * 60 * 1000` ms).
  - If live (`['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT']` or any other code): cache for 10 seconds (`10 * 1000` ms).
- Default fallbacks for other endpoints remain:
  - `/standings`: 1 hour
  - `/teams`, `/players`: 24 hours
  - `/fixtures?team=`: 10 minutes
  - `/fixtures?date=`: Past days → 24 hours, Today → 15 seconds.

## 4. Testing Plan
We will add a new test file: `backend/src/sports/api-football-client.service.spec.ts`.
It will test:
1. `ApiFootballClientService` should be defined.
2. It should retrieve cached data on Redis hit and log a Cache HIT.
3. It should fetch from external API and set Redis cache on Cache MISS.
4. It should fallback to external API gracefully if Redis is down (throws error).
5. It should calculate appropriate TTLs for odds, leagues, finished fixtures, upcoming fixtures, and live fixtures.
