import {
  Controller,
  Get,
  Query,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  StandardMatch,
  SportType,
  MatchStatus,
  StandardLeague,
  StandardTeam,
  StandardStanding,
} from './interfaces/sports.types';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

export interface StandardStandingWithTeam extends StandardStanding {
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
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
};

@Controller('football')
export class FootballController {
  private getHeaders() {
    const key =
      process.env.SPORTS_API_KEY || '1623448fdc7994a7c7ce329610618cf4';
    const host = process.env.SPORTS_API_HOST || 'v3.football.api-sports.io';

    return {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
      Accept: 'application/json',
    };
  }

  @Get('fixtures')
  async getFixtures(
    @Query('date') date?: string,
  ): Promise<StandardMatchWithDetails[]> {
    const targetDate = date || '2026-08-02';
    const url = `https://v3.football.api-sports.io/fixtures?date=${targetDate}`;

    console.log(
      `[API-Football] Requesting fixtures for date: ${targetDate} from ${url}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          `External sports API returned error: status ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      // Log errors or usage info from the API-Football gateway response
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Gateway Error payload:', data.errors);
        throw new HttpException(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const results = data.response || [];
      console.log(
        `[API-Football] Successfully fetched and normalized ${results.length} fixtures for date: ${targetDate}`,
      );

      // Map raw response payloads into our standard schema types
      return results.map(mapApiFootballToStandardMatch);
    } catch (err) {
      console.error(
        `[API-Football] Failed to fetch fixtures for date ${targetDate}:`,
        err,
      );
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to sync scores from external provider: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('fixtures/:id')
  async getFixtureById(
    @Param('id') id: string,
  ): Promise<StandardMatchWithDetails> {
    const url = `https://v3.football.api-sports.io/fixtures?id=${id}`;

    console.log(
      `[API-Football] Requesting single fixture details for ID: ${id} from ${url}`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new HttpException(
          `External sports API returned error: status ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error(
          '[API-Football] Single Fixture Lookup Error payload:',
          data.errors,
        );
        throw new HttpException(
          `API-Football error: ${JSON.stringify(data.errors)}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const results = data.response || [];
      if (results.length === 0) {
        throw new HttpException(
          `Match with ID ${id} was not found on the sports servers.`,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(
        `[API-Football] Successfully found and normalized Match ID: ${id}`,
      );
      return mapApiFootballToStandardMatch(results[0]);
    } catch (err) {
      console.error(
        `[API-Football] Failed to fetch single match details for ID ${id}:`,
        err,
      );
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to retrieve match details: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('teams/:id')
  async getTeamProfile(@Param('id') id: string): Promise<any> {
    const key =
      process.env.SPORTS_API_KEY || '1623448fdc7994a7c7ce329610618cf4';
    const headers = this.getHeaders();

    console.log(`[API-Football] Requesting Team Profile details for ID: ${id}`);

    // Standard Fallback Mock Profile in case of API offline
    const getMockTeamProfile = () => ({
      id: Number(id),
      name: Number(id) === 42 ? 'Arsenal' : 'Chelsea',
      logo:
        Number(id) === 42
          ? 'https://media.api-sports.io/football/teams/42.png'
          : 'https://media.api-sports.io/football/teams/49.png',
      founded: Number(id) === 42 ? 1886 : 1905,
      venueName: Number(id) === 42 ? 'Emirates Stadium' : 'Stamford Bridge',
      venueCity: Number(id) === 42 ? 'London' : 'London',
      country: 'England',
      recentMatches: [
        {
          id: 101,
          date: '2026-08-01T15:00:00Z',
          status: 'FINISHED',
          elapsedTime: null,
          sport: 'FOOTBALL',
          leagueId: 1,
          homeTeamId: 11,
          awayTeamId: 12,
          homeScore: 2,
          awayScore: 1,
          league: {
            id: 1,
            name: 'Premier League',
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png',
            sport: 'FOOTBALL',
          },
          homeTeam: {
            id: 11,
            name: 'Arsenal',
            logo: 'https://media.api-sports.io/football/teams/42.png',
            sport: 'FOOTBALL',
          },
          awayTeam: {
            id: 12,
            name: 'Chelsea',
            logo: 'https://media.api-sports.io/football/teams/49.png',
            sport: 'FOOTBALL',
          },
        },
      ],
      upcomingMatches: [
        {
          id: 103,
          date: '2026-08-15T20:45:00Z',
          status: 'SCHEDULED',
          elapsedTime: null,
          sport: 'FOOTBALL',
          leagueId: 3,
          homeTeamId: 31,
          awayTeamId: 32,
          homeScore: null,
          awayScore: null,
          league: {
            id: 3,
            name: 'Serie A',
            country: 'Italy',
            logo: 'https://media.api-sports.io/football/leagues/135.png',
            sport: 'FOOTBALL',
          },
          homeTeam: {
            id: 11,
            name: 'Arsenal',
            logo: 'https://media.api-sports.io/football/teams/42.png',
            sport: 'FOOTBALL',
          },
          awayTeam: {
            id: 32,
            name: 'AC Milan',
            logo: 'https://media.api-sports.io/football/teams/99.png',
            sport: 'FOOTBALL',
          },
        },
      ],
    });

    try {
      // 1. Fetch team meta details
      const teamUrl = `https://v3.football.api-sports.io/teams?id=${id}`;
      const teamRes = await fetch(teamUrl, { method: 'GET', headers });
      if (!teamRes.ok)
        throw new Error(`Teams API failed: status ${teamRes.status}`);

      const teamData = await teamRes.json();
      const teamResults = teamData.response || [];
      if (teamResults.length === 0) {
        return getMockTeamProfile();
      }

      const teamInfo = teamResults[0].team;
      const venueInfo = teamResults[0].venue;

      // 2. Fetch last 5 recent results
      const recentUrl = `https://v3.football.api-sports.io/fixtures?team=${id}&last=5`;
      const recentRes = await fetch(recentUrl, { method: 'GET', headers });
      const recentData = recentRes.ok
        ? await recentRes.json()
        : { response: [] };
      const rawRecent = recentData.response || [];
      const normalizedRecent = rawRecent.map(mapApiFootballToStandardMatch);

      // 3. Fetch next 5 upcoming games
      const upcomingUrl = `https://v3.football.api-sports.io/fixtures?team=${id}&next=5`;
      const upcomingRes = await fetch(upcomingUrl, { method: 'GET', headers });
      const upcomingData = upcomingRes.ok
        ? await upcomingRes.json()
        : { response: [] };
      const rawUpcoming = upcomingData.response || [];
      const normalizedUpcoming = rawUpcoming.map(mapApiFootballToStandardMatch);

      console.log(
        `[API-Football] Successfully compiled profile for team ID: ${id} (${teamInfo.name})`,
      );

      return {
        id: teamInfo.id,
        name: teamInfo.name,
        logo: teamInfo.logo,
        founded: teamInfo.founded,
        venueName: venueInfo.name,
        venueCity: venueInfo.city,
        country: teamInfo.country,
        recentMatches: normalizedRecent,
        upcomingMatches: normalizedUpcoming,
      };
    } catch (err) {
      console.warn(
        `[API-Football] Offline or failed lookup for team ID: ${id}. Using local mock profiles.`,
        err.message,
      );
      return getMockTeamProfile();
    }
  }

  @Get('standings')
  async getStandings(
    @Query('league') league?: string,
    @Query('season') season?: string,
  ): Promise<StandardStandingWithTeam[]> {
    const targetLeague = Number(league) || 39; // Default to Premier League (39)
    const targetSeason = Number(season) || 2026; // Default to 2026

    console.log(
      `[API-Football] Requesting standings for league: ${targetLeague}, season: ${targetSeason}`,
    );

    const getMockStandings = (): StandardStandingWithTeam[] => {
      // Return a robust 20-team mock standings for Premier League (league 39 or 1 or any other)
      const mockTeams = [
        {
          id: 50,
          name: 'Manchester City',
          logo: 'https://media.api-sports.io/football/teams/50.png',
        },
        {
          id: 42,
          name: 'Arsenal',
          logo: 'https://media.api-sports.io/football/teams/42.png',
        },
        {
          id: 40,
          name: 'Liverpool',
          logo: 'https://media.api-sports.io/football/teams/40.png',
        },
        {
          id: 66,
          name: 'Aston Villa',
          logo: 'https://media.api-sports.io/football/teams/66.png',
        },
        {
          id: 47,
          name: 'Tottenham',
          logo: 'https://media.api-sports.io/football/teams/47.png',
        },
        {
          id: 49,
          name: 'Chelsea',
          logo: 'https://media.api-sports.io/football/teams/49.png',
        },
        {
          id: 33,
          name: 'Manchester United',
          logo: 'https://media.api-sports.io/football/teams/33.png',
        },
        {
          id: 34,
          name: 'Newcastle',
          logo: 'https://media.api-sports.io/football/teams/34.png',
        },
        {
          id: 48,
          name: 'West Ham',
          logo: 'https://media.api-sports.io/football/teams/48.png',
        },
        {
          id: 51,
          name: 'Brighton',
          logo: 'https://media.api-sports.io/football/teams/51.png',
        },
        {
          id: 46,
          name: 'Leicester',
          logo: 'https://media.api-sports.io/football/teams/46.png',
        },
        {
          id: 45,
          name: 'Everton',
          logo: 'https://media.api-sports.io/football/teams/45.png',
        },
        {
          id: 60,
          name: 'Fulham',
          logo: 'https://media.api-sports.io/football/teams/60.png',
        },
        {
          id: 39,
          name: 'Wolves',
          logo: 'https://media.api-sports.io/football/teams/39.png',
        },
        {
          id: 35,
          name: 'Bournemouth',
          logo: 'https://media.api-sports.io/football/teams/35.png',
        },
        {
          id: 38,
          name: 'Crystal Palace',
          logo: 'https://media.api-sports.io/football/teams/38.png',
        },
        {
          id: 44,
          name: 'Brentford',
          logo: 'https://media.api-sports.io/football/teams/44.png',
        },
        {
          id: 62,
          name: 'Nottingham Forest',
          logo: 'https://media.api-sports.io/football/teams/62.png',
        },
        {
          id: 65,
          name: 'Ipswich',
          logo: 'https://media.api-sports.io/football/teams/65.png',
        },
        {
          id: 41,
          name: 'Southampton',
          logo: 'https://media.api-sports.io/football/teams/41.png',
        },
      ];

      const stats = [
        { pts: 89, gd: 51, w: 28, d: 5, l: 5, form: 'WWWDW' },
        { pts: 84, gd: 45, w: 26, d: 6, l: 6, form: 'WWLWW' },
        { pts: 82, gd: 41, w: 24, d: 10, l: 4, form: 'WDDWW' },
        { pts: 68, gd: 15, w: 20, d: 8, l: 10, form: 'LWWDL' },
        { pts: 66, gd: 13, w: 20, d: 6, l: 12, form: 'WWLLW' },
        { pts: 63, gd: 14, w: 18, d: 9, l: 11, form: 'WWDWD' },
        { pts: 60, gd: 1, w: 18, d: 6, l: 14, form: 'LWWLD' },
        { pts: 60, gd: 23, w: 18, d: 6, l: 14, form: 'WLWWL' },
        { pts: 52, gd: -14, w: 14, d: 10, l: 14, form: 'LDWDW' },
        { pts: 48, gd: -7, w: 12, d: 12, l: 14, form: 'DLDWL' },
        { pts: 45, gd: -10, w: 12, d: 9, l: 17, form: 'LWLLW' },
        { pts: 40, gd: -15, w: 10, d: 10, l: 18, form: 'DDLLW' },
        { pts: 44, gd: -8, w: 12, d: 8, l: 18, form: 'WLDLL' },
        { pts: 38, gd: -18, w: 10, d: 8, l: 20, form: 'LLWDL' },
        { pts: 42, gd: -12, w: 11, d: 9, l: 18, form: 'LDWWL' },
        { pts: 39, gd: -14, w: 10, d: 9, l: 19, form: 'WDLLD' },
        { pts: 41, gd: -11, w: 11, d: 8, l: 19, form: 'LWLLD' },
        { pts: 37, gd: -20, w: 9, d: 10, l: 19, form: 'DLLWW' },
        { pts: 32, gd: -28, w: 7, d: 11, l: 20, form: 'DLLLD' },
        { pts: 26, gd: -35, w: 6, d: 8, l: 24, form: 'LLDLL' },
      ];

      return mockTeams.map((team, index) => {
        const itemStats = stats[index] || {
          pts: 30,
          gd: -20,
          w: 8,
          d: 6,
          l: 24,
          form: 'LLLLL',
        };
        return {
          leagueId: targetLeague,
          season: targetSeason,
          rank: index + 1,
          teamId: team.id,
          points: itemStats.pts,
          goalsDiff: itemStats.gd,
          form: itemStats.form,
          played: itemStats.w + itemStats.d + itemStats.l,
          win: itemStats.w,
          draw: itemStats.d,
          lose: itemStats.l,
          team: {
            id: team.id,
            name: team.name,
            logo: team.logo,
          },
        };
      });
    };

    try {
      const url = `https://v3.football.api-sports.io/standings?league=${targetLeague}&season=${targetSeason}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`External API returned status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Standings Error payload:', data.errors);
        throw new Error(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
        );
      }

      const results = data.response || [];
      if (results.length === 0 || !results[0]?.league?.standings?.[0]) {
        console.warn(
          `[API-Football] No standings data found for league: ${targetLeague}, season: ${targetSeason}. Falling back to mock.`,
        );
        return getMockStandings();
      }

      const rawStandings = results[0].league.standings[0];
      const normalized = rawStandings.map((raw: any) => ({
        leagueId: targetLeague,
        season: targetSeason,
        rank: raw.rank,
        teamId: raw.team.id,
        points: raw.points,
        goalsDiff: raw.goalsDiff,
        form: raw.form,
        played: raw.all.played,
        win: raw.all.win,
        draw: raw.all.draw,
        lose: raw.all.lose,
        team: {
          id: raw.team.id,
          name: raw.team.name,
          logo: raw.team.logo,
        },
      }));

      console.log(
        `[API-Football] Successfully fetched and normalized ${normalized.length} standings rows for league: ${targetLeague}`,
      );
      return normalized;
    } catch (err) {
      console.warn(
        `[API-Football] Failed to fetch standings for league ${targetLeague}, season ${targetSeason}. Using local mock fallback.`,
        err.message,
      );
      return getMockStandings();
    }
  }
}
