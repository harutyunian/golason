import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

interface CacheEntry {
  data: any;
  expiresAt: number;
}

@Injectable()
export class ApiFootballClientService {
  private readonly logger = new Logger(ApiFootballClientService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly defaultTimeoutMs = 15000; // 15s timeout for network reliability

  // Custom in-memory cache map
  private readonly cache = new Map<string, CacheEntry>();

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
      }
      return 10 * 1000; // 10 seconds for live / upcoming / ongoing matches
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
    // Check Cache first
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`[Cache HIT] Returning cached data for: ${url}`);
      return cached.data;
    }

    this.logger.debug(`[Cache MISS] Fetching from external API: ${url}`);

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
        this.cache.set(url, {
          data,
          expiresAt: Date.now() + ttl,
        });
        this.logger.log(
          `[Cache SET] Cached response for URL: ${url} (TTL: ${ttl}ms)`,
        );
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
