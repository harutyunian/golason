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
  StandardStandingWithTeam,
} from './interfaces/sports.types';
import { ApiFootballClientService } from './api-football-client.service';
import { FootballNormalizerService } from './football-normalizer.service';
import { PrismaService } from '../prisma/prisma.service';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

const mapApiFootballToStandardPlayer = (raw: any) => {
  const player = raw.player;
  const statsList = raw.statistics || [];
  const mainStats = statsList[0] || {};

  return {
    id: player.id,
    name: player.name,
    firstname: player.firstname,
    lastname: player.lastname,
    age: player.age,
    birthDate: player.birth?.date || null,
    nationality: player.nationality,
    height: player.height,
    weight: player.weight,
    position: mainStats.games?.position || null,
    photo: player.photo,
    teamId: mainStats.team?.id || null,
    teamName: mainStats.team?.name || null,
    rating: mainStats.games?.rating ? parseFloat(mainStats.games.rating) : null,
    jerseyNumber: mainStats.games?.number || null,
    foot: player.id % 2 === 0 ? 'Right' : 'Left', // Fallback preferred foot calculation based on ID parity
    stats: {
      matches: {
        played: mainStats.games?.appearences || 0,
        starts: mainStats.games?.lineups || 0,
        minutes: mainStats.games?.minutes || 0,
      },
      goals: {
        total: mainStats.goals?.total || 0,
        assists: mainStats.goals?.assists || 0,
      },
      passes: {
        total: mainStats.passes?.total || 0,
        accuracyPercent: mainStats.passes?.accuracy || 0,
        key: mainStats.passes?.key || 0,
      },
      cards: {
        yellow: mainStats.cards?.yellow || 0,
        red: mainStats.cards?.red || 0,
      },
    },
  };
};

@Controller('football')
export class FootballController {
  // Controller-level cache for normalized standings
  private readonly standingsCache = new Map<
    string,
    { data: StandardStandingWithTeam[]; expiresAt: number }
  >();

  constructor(
    private readonly apiFootballClient: ApiFootballClientService,
    private readonly footballNormalizer: FootballNormalizerService,
    private readonly prisma: PrismaService,
  ) {}

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

    try {
      const data = await this.apiFootballClient.getFixturesByDate(targetDate);
      const results = data.response || [];
      console.log(
        `[API-Football] Successfully fetched and normalized ${results.length} fixtures for date: ${targetDate}`,
      );
      // Delegate fixture normalization cleanly to FootballNormalizerService!
      return this.footballNormalizer.normalizeFixtures(results);
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
    const numericId = Number(id);

    try {
      // Fetch match details and odds concurrently
      const [data, oddsData] = await Promise.all([
        this.apiFootballClient.getFixtureById(numericId),
        this.apiFootballClient.getOddsByFixtureId(numericId).catch(() => null),
      ]);

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

      const rawOdds = oddsData?.response || [];
      // Delegate dynamic fixture mapping to FootballNormalizerService
      return this.footballNormalizer.normalizeFixture(results[0], rawOdds);
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

    try {
      // 1. Fetch team meta details
      const teamUrl = `https://v3.football.api-sports.io/teams?id=${id}`;
      const teamRes = await fetch(teamUrl, { method: 'GET', headers });
      if (!teamRes.ok)
        throw new Error(`Teams API failed: status ${teamRes.status}`);

      const teamData = await teamRes.json();
      const teamResults = teamData.response || [];
      if (teamResults.length === 0) {
        throw new HttpException(
          `Team profile for ID ${id} was not found on the sports servers.`,
          HttpStatus.NOT_FOUND,
        );
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
      // Delegate map normalization to FootballNormalizerService
      const normalizedRecent =
        this.footballNormalizer.normalizeFixtures(rawRecent);

      // 3. Fetch next 5 upcoming games
      const upcomingUrl = `https://v3.football.api-sports.io/fixtures?team=${id}&next=5`;
      const upcomingRes = await fetch(upcomingUrl, { method: 'GET', headers });
      const upcomingData = upcomingRes.ok
        ? await upcomingRes.json()
        : { response: [] };
      const rawUpcoming = upcomingData.response || [];
      // Delegate map normalization to FootballNormalizerService
      const normalizedUpcoming =
        this.footballNormalizer.normalizeFixtures(rawUpcoming);

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
      console.error(
        `[API-Football] Failed lookup for team ID: ${id}:`,
        err.message,
      );
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to retrieve team profile: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('standings')
  async getStandings(
    @Query('league') league?: string,
    @Query('season') season?: string,
  ): Promise<StandardStandingWithTeam[]> {
    const targetLeague = Number(league) || 39; // Default to Premier League (39)
    const targetSeason = Number(season) || 2026; // Default to 2026
    const cacheKey = `${targetLeague}-${targetSeason}`;

    // Check Controller Cache first
    const cached = this.standingsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(
        `[Controller Cache HIT] Returning cached standings for: ${cacheKey}`,
      );
      return cached.data;
    }

    console.log(
      `[API-Football] Requesting standings for league: ${targetLeague}, season: ${targetSeason}`,
    );

    try {
      const data = await this.apiFootballClient.getStandings(
        targetLeague,
        targetSeason,
      );

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Standings Error payload:', data.errors);
        throw new Error(
          `API-Football gateway error: ${JSON.stringify(data.errors)}`,
        );
      }

      const results = data.response || [];
      if (results.length === 0 || !results[0]?.league?.standings?.[0]) {
        console.warn(
          `[API-Football] No standings data found for league: ${targetLeague}, season: ${targetSeason}. Returning empty.`,
        );
        return [];
      }

      const rawStandings = results[0].league.standings[0];
      const normalized = this.footballNormalizer.normalizeStandings(
        rawStandings,
        targetLeague,
        targetSeason,
      );

      console.log(
        `[API-Football] Successfully fetched and normalized ${normalized.length} standings rows for league: ${targetLeague}`,
      );

      // Save successful standings in controller-level cache for 1 hour
      this.standingsCache.set(cacheKey, {
        data: normalized,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour TTL
      });

      return normalized;
    } catch (err) {
      console.warn(
        `[API-Football] Failed to fetch standings for league ${targetLeague}, season ${targetSeason}. Returning empty.`,
        err.message,
      );
      return [];
    }
  }

  @Get('players/:id')
  async getPlayerProfile(@Param('id') id: string): Promise<any> {
    const headers = this.getHeaders();
    const playerId = Number(id);

    console.log(
      `[API-Football] Requesting Player Profile details for ID: ${playerId}`,
    );

    try {
      const data = await this.apiFootballClient.getPlayerProfile(
        playerId,
        2026,
      );
      const results = data.response || [];

      if (results.length === 0) {
        throw new HttpException(
          `Player with ID ${id} was not found on the sports servers.`,
          HttpStatus.NOT_FOUND,
        );
      }

      const mapped = mapApiFootballToStandardPlayer(results[0]);
      console.log(
        `[API-Football] Successfully fetched and normalized player profile for ID: ${playerId} (${mapped.name})`,
      );
      return mapped;
    } catch (err) {
      console.error(
        `[API-Football] Failed to look up player ID: ${playerId}:`,
        err.message,
      );
      if (err instanceof HttpException) throw err;
      throw new HttpException(
        `Failed to retrieve player profile: ${err.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<any> {
    const q = query ? query.trim() : '';
    if (!q || q.length < 3) {
      return { teams: [], players: [], matches: [], competitions: [] };
    }

    // Generates a deterministic pseudo-random follower count string like "4.5M" or "830K"
    const calculateFollowers = (id: number) => {
      const base = (id % 9) + 1;
      const dec = id % 10;
      if (id % 2 === 0) {
        return `${base}.${dec}M`;
      } else {
        return `${base * 100 + dec * 10}K`;
      }
    };

    try {
      // Fetch Teams, Leagues, and Players concurrently from API-Football
      const playersPromise =
        q.length >= 4
          ? this.apiFootballClient
              .searchPlayers(q)
              .catch(() => ({ response: [] }))
          : Promise.resolve({ response: [] });

      const [teamsData, leaguesData, playersData] = await Promise.all([
        this.apiFootballClient.searchTeams(q).catch(() => ({ response: [] })),
        this.apiFootballClient.searchLeagues(q).catch(() => ({ response: [] })),
        playersPromise,
      ]);

      const formattedTeams = (teamsData?.response || []).map((t: any) => ({
        id: t.team.id,
        name: t.team.name,
        logo: t.team.logo,
        country: t.team.country,
        followers: calculateFollowers(t.team.id),
        type: 'team',
      }));

      const formattedCompetitions = (leaguesData?.response || []).map(
        (l: any) => ({
          id: l.league.id,
          name: l.league.name,
          logo: l.league.logo,
          country: l.league.country || l.country?.name || null,
          countryCode: l.country?.code || null,
          type: 'competition',
        }),
      );

      const formattedPlayers = (playersData?.response || []).map(
        (item: any) => ({
          id: item.player.id,
          name: item.player.name,
          photo: item.player.photo,
          country: item.player.nationality || null,
          teamName: item.player.position || 'Football Player',
          teamLogo: null,
          type: 'player',
        }),
      );

      return {
        teams: formattedTeams,
        players: formattedPlayers,
        matches: [], // API-Football does not support global keyword search for fixtures
        competitions: formattedCompetitions,
      };
    } catch (err) {
      console.error(`[Search Error] Failed to search via live API:`, err);
      return { teams: [], players: [], matches: [], competitions: [] };
    }
  }
}
