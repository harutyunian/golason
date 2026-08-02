import { Injectable } from '@nestjs/common';
import {
  MatchStatus,
  StandardMatch,
  StandardLeague,
  StandardTeam,
} from './interfaces/sports.types';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

@Injectable()
export class FootballNormalizerService {
  /**
   * Normalizes a raw API-Football fixture into the standardized match format.
   * @param raw The raw fixture object from API-Football.
   * @returns StandardMatchWithDetails
   */
  normalizeFixture(raw: any): StandardMatchWithDetails {
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
      sport: 'FOOTBALL',
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
        sport: 'FOOTBALL',
      },
      homeTeam: {
        id: raw.teams.home.id,
        name: raw.teams.home.name,
        logo: raw.teams.home.logo,
        sport: 'FOOTBALL',
      },
      awayTeam: {
        id: raw.teams.away.id,
        name: raw.teams.away.name,
        logo: raw.teams.away.logo,
        sport: 'FOOTBALL',
      },
    };
  }

  /**
   * Normalizes an array of raw API-Football fixtures into standardized match formats.
   * @param rawFixtures The array of raw fixtures from API-Football.
   * @returns StandardMatchWithDetails[]
   */
  normalizeFixtures(rawFixtures: any[]): StandardMatchWithDetails[] {
    if (!rawFixtures || !Array.isArray(rawFixtures)) {
      return [];
    }
    return rawFixtures.map((fixture) => this.normalizeFixture(fixture));
  }
}
