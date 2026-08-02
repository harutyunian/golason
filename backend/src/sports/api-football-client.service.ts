import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Injectable()
export class ApiFootballClientService {
  private readonly logger = new Logger(ApiFootballClientService.name);
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly defaultTimeoutMs = 15000; // 15s timeout for network reliability

  /**
   * Constructs authorization and tracking headers for API-Football calls.
   */
  private getHeaders(): Record<string, string> {
    const key = process.env.SPORTS_API_KEY || '1623448fdc7994a7c7ce329610618cf4';
    const host = process.env.SPORTS_API_HOST || 'v3.football.api-sports.io';

    return {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
      Accept: 'application/json',
    };
  }

  /**
   * Helper method to perform fetch operations with a timeout and abort boundary.
   */
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeoutMs);

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
      const remainingRequests = response.headers.get('x-ratelimit-requests-remaining');
      if (remainingRequests) {
        this.logger.debug(`[API-Football] API Rate limit remaining: ${remainingRequests}`);
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
        this.logger.error(`[API-Football] Gateway error payload: ${JSON.stringify(data.errors)}`);
        throw new HttpException(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY,
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

      this.logger.error(`[API-Football] HTTP Request failed for URL: ${url}. Error: ${error.message}`);
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
    this.logger.log(`Requesting standings for league: ${leagueId}, season: ${season}`);
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
  async getTeamFixtures(teamId: number, type: 'last' | 'next', count: number): Promise<any> {
    const url = `${this.baseUrl}/fixtures?team=${teamId}&${type}=${count}`;
    this.logger.log(`Requesting ${type} ${count} fixtures for team ID: ${teamId}`);
    return this.fetchWithTimeout(url);
  }

  /**
   * Fetch stats and profile attributes of a single player for a specific season.
   */
  async getPlayerProfile(playerId: number, season: number): Promise<any> {
    const url = `${this.baseUrl}/players?id=${playerId}&season=${season}`;
    this.logger.log(`Requesting player profile for ID: ${playerId}, season: ${season}`);
    return this.fetchWithTimeout(url);
  }
}
