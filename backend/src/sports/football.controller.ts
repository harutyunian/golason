import { Controller, Get, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { StandardMatch, SportType, MatchStatus, StandardLeague, StandardTeam } from './interfaces/sports.types';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

// Normalizer Mapper: Translates raw API-Football v3 JSON payloads into our standard types
const mapApiFootballToStandardMatch = (raw: any): StandardMatchWithDetails => {
  // Translate external status codes to our unified standard MatchStatus enum
  let status: MatchStatus = 'SCHEDULED';
  const shortStatus = raw.fixture?.status?.short;

  if (['1H', '2H', 'ET', 'BT', 'LIVE', 'INT'].includes(shortStatus)) {
    status = 'LIVE';
  } else if (shortStatus === 'HT') {
    status = 'HALFTIME';
  } else if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
    status = 'FINISHED';
  } else if (['PST', 'SUSP', 'INT'].includes(shortStatus)) {
    status = 'POSTPONED';
  } else if (['CAN', 'ABD'].includes(shortStatus)) {
    status = 'CANCELLED';
  }

  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    status,
    elapsedTime: raw.fixture.status.elapsed,
    sport: 'FOOTBALL' as SportType,
    leagueId: raw.league.id,
    homeTeamId: raw.teams.home.id,
    awayTeamId: raw.teams.away.id,
    homeScore: raw.goals.home,
    awayScore: raw.goals.away,
    homeScoreHT: raw.score?.halftime?.home ?? null,
    awayScoreHT: raw.score?.halftime?.away ?? null,
    league: {
      id: raw.league.id,
      name: raw.league.name,
      country: raw.league.country,
      logo: raw.league.logo,
      sport: 'FOOTBALL' as SportType,
    },
    homeTeam: {
      id: raw.teams.home.id,
      name: raw.teams.home.name,
      logo: raw.teams.home.logo,
      sport: 'FOOTBALL' as SportType,
    },
    awayTeam: {
      id: raw.teams.away.id,
      name: raw.teams.away.name,
      logo: raw.teams.away.logo,
      sport: 'FOOTBALL' as SportType,
    },
  };
};

@Controller('football')
export class FootballController {
  private getHeaders() {
    const key = process.env.SPORTS_API_KEY || '1623448fdc7994a7c7ce329610618cf4';
    const host = process.env.SPORTS_API_HOST || 'v3.football.api-sports.io';
    
    return {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
      'Accept': 'application/json',
    };
  }

  @Get('fixtures')
  async getFixtures(@Query('date') date?: string): Promise<StandardMatchWithDetails[]> {
    const targetDate = date || '2026-08-02';
    const url = `https://v3.football.api-sports.io/fixtures?date=${targetDate}`;

    console.log(`[API-Football] Requesting fixtures for date: ${targetDate} from ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          `External sports API returned error: status ${response.status}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const data = await response.json();

      // Log errors or usage info from the API-Football gateway response
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Gateway Error payload:', data.errors);
        throw new HttpException(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const results = data.response || [];
      console.log(`[API-Football] Successfully fetched and normalized ${results.length} fixtures for date: ${targetDate}`);

      // Map raw response payloads into our standard schema types
      return results.map(mapApiFootballToStandardMatch);
    } catch (err) {
      console.error(`[API-Football] Failed to fetch fixtures for date ${targetDate}:`, err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to sync scores from external provider: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('fixtures/:id')
  async getFixtureById(@Param('id') id: string): Promise<StandardMatchWithDetails> {
    const url = `https://v3.football.api-sports.io/fixtures?id=${id}`;

    console.log(`[API-Football] Requesting single fixture details for ID: ${id} from ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          `External sports API returned error: status ${response.status}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const data = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Single Fixture Lookup Error payload:', data.errors);
        throw new HttpException(
          `API-Football error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY
        );
      }

      const results = data.response || [];
      if (results.length === 0) {
        throw new HttpException(
          `Match with ID ${id} was not found on the sports servers.`,
          HttpStatus.NOT_FOUND
        );
      }

      console.log(`[API-Football] Successfully found and normalized Match ID: ${id}`);
      return mapApiFootballToStandardMatch(results[0]);
    } catch (err) {
      console.error(`[API-Football] Failed to fetch single match details for ID ${id}:`, err);
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to retrieve match details: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
