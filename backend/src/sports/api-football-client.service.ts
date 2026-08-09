import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class ApiFootballClientService {
  private readonly logger = new Logger(ApiFootballClientService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly defaultTimeoutMs = 15000; // 15s timeout for network reliability

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  /**
   * Constructs authorization and tracking headers for API-Football calls.
   */
  private getHeaders(): Record<string, string> {
    const key =
      process.env.SPORTS_API_KEY || '1623448fdc7994a7c7ce329610618cf4';
    const host = process.env.SPORTS_API_HOST || 'v3.football.api-sports.io';

    return {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
      Accept: 'application/json',
    };
  }

  /**
   * Computes cache Time-To-Live (TTL) dynamically based on URL patterns and response content.
   */
  private getTtlForUrl(url: string, data?: any): number {
    if (url.includes('/standings')) {
      return 60 * 60 * 1000; // 1 hour for standings
    }
    if (url.includes('/teams')) {
      return 24 * 60 * 60 * 1000; // 24 hours for team profiles
    }
    if (url.includes('/players')) {
      return 24 * 60 * 60 * 1000; // 24 hours for player profiles
    }
    if (url.includes('/leagues')) {
      return 24 * 60 * 60 * 1000; // 24 hours for leagues list / searches
    }
    if (url.includes('/odds?fixture=')) {
      return 30 * 60 * 1000; // 30 minutes for odds data
    }
    if (url.includes('/fixtures?team=')) {
      return 10 * 60 * 1000; // 10 minutes for team fixtures lists
    }
    if (url.includes('/fixtures?date=')) {
      const match = url.match(/date=(\d{4}-\d{2}-\d{2})/);
      if (match) {
        const dateStr = match[1];
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr < todayStr) {
          return 24 * 60 * 60 * 1000; // 24 hours for matches on past calendar days
        }
      }
      return 15 * 1000; // 15 seconds for today's/ongoing matches
    }
    if (url.includes('/fixtures?id=')) {
      if (data && data.response && data.response[0]) {
        const fixture = data.response[0].fixture;
        const status = fixture?.status?.short;
        const finishedStatuses = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD'];
        if (finishedStatuses.includes(status)) {
          return 24 * 60 * 60 * 1000; // 24 hours for finished matches
        }

        // Smart Upcoming Match TTLs
        const upcomingStatuses = ['NS', 'TBD'];
        if (upcomingStatuses.includes(status)) {
          const kickoff = fixture?.timestamp ? fixture.timestamp * 1000 : null;
          if (kickoff) {
            const msToKickoff = kickoff - Date.now();
            if (msToKickoff > 2 * 60 * 60 * 1000) {
              return 60 * 60 * 1000; // 1 hour for matches starting in > 2 hours
            } else {
              return 5 * 60 * 1000; // 5 minutes for matches starting in <= 2 hours
            }
          }
          return 10 * 60 * 1000; // 10 minutes default fallback for upcoming
        }
      }
      return 10 * 1000; // 10 seconds for live / ongoing matches
    }
    return 0; // Default: do not cache
  }

  /**
   * Helper method to perform fetch operations with a timeout, caching, and abort boundary.
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
  ): Promise<any> {
    // 1. Check Redis cache first (failsafe check)
    const cacheKey = `cache:${url}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`[Cache HIT] Returning cached data from Redis for: ${url}`);
        return JSON.parse(cached);
      }
    } catch (redisErr: any) {
      this.logger.warn(`Redis read cache failed: ${redisErr.message}`);
    }

    this.logger.debug(`[Cache MISS] Fetching from external API: ${url}`);

    // Track real-time API-Football usage metrics in Redis
    try {
      const parsedUrl = new URL(url);
      const endpoint = parsedUrl.pathname; // e.g. "/v3/fixtures" or "/v3/players"

      // 1. Increment total overall counter
      await this.redis.incr('api:calls:total');

      // 2. Increment daily counter (expiring after 48 hours)
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      await this.redis.incr(`api:calls:daily:${todayStr}`);
      await this.redis.expire(`api:calls:daily:${todayStr}`, 172800);

      // 3. Increment endpoint-specific hash counter
      await this.redis.hincrby('api:calls:endpoints', endpoint, 1);
    } catch (redisErr) {
      this.logger.error(
        `Failed to increment API call metric in Redis: ${redisErr.message}`,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.defaultTimeoutMs,
    );

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log external api responses & meta usage if available
      const remainingRequests = response.headers.get(
        'x-ratelimit-requests-remaining',
      );
      if (remainingRequests) {
        this.logger.debug(
          `[API-Football] API Rate limit remaining: ${remainingRequests}`,
        );
      }

      if (!response.ok) {
        throw new HttpException(
          `External sports API returned error: status ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      // Catch and bubble external gateway error structures
      if (data.errors && Object.keys(data.errors).length > 0) {
        this.logger.error(
          `[API-Football] Gateway error payload: ${JSON.stringify(data.errors)}`,
        );
        throw new HttpException(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Populate Cache dynamically if eligible
      const ttl = this.getTtlForUrl(url, data);
      if (ttl > 0) {
        try {
          await this.redis.set(cacheKey, JSON.stringify(data), 'PX', ttl);
          this.logger.log(
            `[Cache SET] Cached response in Redis for URL: ${url} (TTL: ${ttl}ms)`,
          );
        } catch (redisSetErr: any) {
          this.logger.warn(`Redis save cache failed: ${redisSetErr.message}`);
        }
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        this.logger.error(`[API-Football] Request timed out for URL: ${url}`);
        throw new HttpException(
          'API-Football request timed out',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `[API-Football] HTTP Request failed for URL: ${url}. Error: ${error.message}`,
      );
      throw new HttpException(
        `Failed to fetch from external provider: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieve matches scheduled or played on a specific calendar date.
   */
  async getFixturesByDate(date: string): Promise<any> {
    const url = `${this.baseUrl}/fixtures?date=${date}`;
    this.logger.log(`Requesting fixtures for date: ${date}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch currently ongoing (live) match fixtures.
   */
  async getLiveFixtures(): Promise<any> {
    const url = `${this.baseUrl}/fixtures?live=all`;
    this.logger.log('Requesting all live fixtures');
    return this.fetchWithTimeout(url);
  }

  /**
   * Retrieve comprehensive event, timeline, lineup, and stat details for a match ID.
   */
  async getFixtureById(id: number): Promise<any> {
    const url = `${this.baseUrl}/fixtures?id=${id}`;
    this.logger.log(`Requesting fixture by ID: ${id}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch current standings table for a specific league and season.
   */
  async getStandings(leagueId: number, season: number): Promise<any> {
    const url = `${this.baseUrl}/standings?league=${leagueId}&season=${season}`;
    this.logger.log(
      `Requesting standings for league: ${leagueId}, season: ${season}`,
    );
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch meta details, stadium, and location profile of a soccer team.
   */
  async getTeamProfile(teamId: number): Promise<any> {
    const url = `${this.baseUrl}/teams?id=${teamId}`;
    this.logger.log(`Requesting team profile for ID: ${teamId}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch last/next fixture lists associated with a soccer team.
   */
  async getTeamFixtures(
    teamId: number,
    type: 'last' | 'next',
    count: number,
  ): Promise<any> {
    const url = `${this.baseUrl}/fixtures?team=${teamId}&${type}=${count}`;
    this.logger.log(
      `Requesting ${type} ${count} fixtures for team ID: ${teamId}`,
    );
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch stats and profile attributes of a single player for a specific season.
   */
  async getPlayerProfile(playerId: number, season: number): Promise<any> {
    const url = `${this.baseUrl}/players?id=${playerId}&season=${season}`;
    this.logger.log(
      `Requesting player profile for ID: ${playerId}, season: ${season}`,
    );
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch odds data for a specific match fixture ID.
   */
  async getOddsByFixtureId(fixtureId: number): Promise<any> {
    const url = `${this.baseUrl}/odds?fixture=${fixtureId}`;
    this.logger.log(`Requesting odds for fixture ID: ${fixtureId}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Search soccer teams matching a search query name.
   */
  async searchTeams(query: string): Promise<any> {
    const url = `${this.baseUrl}/teams?search=${encodeURIComponent(query)}`;
    this.logger.log(`Searching teams with query: ${query}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Search leagues/competitions matching a search query name.
   */
  async searchLeagues(query: string): Promise<any> {
    const url = `${this.baseUrl}/leagues?name=${encodeURIComponent(query)}`;
    this.logger.log(`Searching leagues with query: ${query}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Search soccer players globally matching a search query name.
   */
  async searchPlayers(query: string): Promise<any> {
    const url = `${this.baseUrl}/players/profiles?search=${encodeURIComponent(query)}`;
    this.logger.log(`Searching player profiles with query: ${query}`);
    return this.fetchWithTimeout(url);
  }
}
