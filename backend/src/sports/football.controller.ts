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
import { MomentumService } from './momentum.service';
import { PrismaService } from '../prisma/prisma.service';

export interface StandardMatchWithDetails extends StandardMatch {
  league: StandardLeague;
  homeTeam: StandardTeam;
  awayTeam: StandardTeam;
}

const calculatePlayerAttributes = (rawStats: any, playerId: number) => {
  const position = rawStats.games?.position || 'Midfielder';

  // Baseline values based on position
  let attBase = 45;
  let tecBase = 50;
  let tacBase = 48;
  let defBase = 40;
  let creBase = 45;

  if (position === 'Attacker') {
    attBase = 68;
    tecBase = 62;
    tacBase = 44;
    defBase = 28;
    creBase = 55;
  } else if (position === 'Midfielder') {
    attBase = 52;
    tecBase = 65;
    tacBase = 58;
    defBase = 46;
    creBase = 68;
  } else if (position === 'Defender') {
    attBase = 32;
    tecBase = 48;
    tacBase = 65;
    defBase = 72;
    creBase = 38;
  } else if (position === 'Goalkeeper') {
    attBase = 15;
    tecBase = 35;
    tacBase = 70;
    defBase = 80;
    creBase = 20;
  }

  // Extract raw stats
  const goals = rawStats.goals?.total || 0;
  const assists = rawStats.goals?.assists || 0;
  const shotsTotal = rawStats.shots?.total || 0;
  const shotsOn = rawStats.shots?.on || 0;
  const passesAccuracy = rawStats.passes?.accuracy || 70; // fallback to 70%
  const passesKey = rawStats.passes?.key || 0;
  const tackles = rawStats.tackles?.total || 0;
  const blocks = rawStats.tackles?.blocks || 0;
  const interceptions = rawStats.tackles?.interceptions || 0;
  const duelsTotal = rawStats.duels?.total || 0;
  const duelsWon = rawStats.duels?.won || 0;
  const dribblesAttempts = rawStats.dribbles?.attempts || 0;
  const dribblesSuccess = rawStats.dribbles?.success || 0;
  const foulsCommitted = rawStats.fouls?.committed || 0;

  // Compute calculated metrics
  const shotAccuracyFactor = shotsTotal > 0 ? (shotsOn / shotsTotal) * 10 : 0;
  const duelSuccessFactor = duelsTotal > 0 ? (duelsWon / duelsTotal) * 10 : 5;
  const dribbleSuccessFactor =
    dribblesAttempts > 0 ? (dribblesSuccess / dribblesAttempts) * 10 : 5;

  // Let's make sure the ID has a deterministic randomizing factor so different players have distinct, unique attributes
  const hash = (playerId * 17) % 25; // range 0 to 24
  const offsetAtt = (hash % 7) - 3; // -3 to 3
  const offsetTec = ((hash + 3) % 7) - 3;
  const offsetTac = ((hash + 6) % 7) - 3;
  const offsetDef = ((hash + 9) % 7) - 3;
  const offsetCre = ((hash + 12) % 7) - 3;

  // Formulas
  let att =
    attBase + goals * 1.5 + shotsOn * 0.5 + shotAccuracyFactor + offsetAtt;
  let tec =
    tecBase +
    (passesAccuracy - 70) * 0.4 +
    dribblesSuccess * 0.5 +
    dribbleSuccessFactor +
    offsetTec;
  let tac =
    tacBase +
    interceptions * 0.8 +
    blocks * 1.0 +
    duelSuccessFactor * 0.5 -
    foulsCommitted * 0.2 +
    offsetTac;
  let def =
    defBase + tackles * 0.8 + interceptions * 0.8 + blocks * 1.2 + offsetDef;
  let cre =
    creBase +
    assists * 2.0 +
    passesKey * 0.6 +
    (passesAccuracy - 70) * 0.3 +
    offsetCre;

  // Goalkeeper specific overrides
  if (position === 'Goalkeeper') {
    const saves = rawStats.goals?.saves || 0;
    const conceded = rawStats.goals?.conceded || 0;
    def = defBase + saves * 1.2 - conceded * 0.4 + offsetDef;
    tac = tacBase + saves * 0.5 + offsetTac;
  }

  // Clamp values between 30 and 99
  const clamp = (val: number) => Math.min(99, Math.max(30, Math.round(val)));

  return {
    att: clamp(att),
    tec: clamp(tec),
    tac: clamp(tac),
    def: clamp(def),
    cre: clamp(cre),
  };
};

const mapApiFootballToStandardPlayer = (raw: any) => {
  const player = raw.player;
  const statsList = raw.statistics || [];
  const mainStats = statsList[0] || {};
  const attributes = calculatePlayerAttributes(mainStats, player.id);

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
    attributes,
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

  // Controller-level cache for player profiles to protect API rate limits against search engine crawls
  private readonly playerCache = new Map<
    number,
    { data: any; expiresAt: number }
  >();

  // Controller-level cache for team profiles (saves 3 API requests per page load!)
  private readonly teamCache = new Map<
    number,
    { data: any; expiresAt: number }
  >();

  constructor(
    private readonly apiFootballClient: ApiFootballClientService,
    private readonly footballNormalizer: FootballNormalizerService,
    private readonly prisma: PrismaService,
    private readonly momentumService: MomentumService,
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

  private async saveMatchToDatabase(match: any) {
    try {
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
          momentum: match.momentum || undefined,
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
          momentum: match.momentum || undefined,
        },
      });
    } catch (err: any) {
      console.error(
        `[FootballController] Background match save failed for ID ${match.id}:`,
        err.message,
      );
    }
  }

  @Get('fixtures')
  async getFixtures(
    @Query('date') date?: string,
  ): Promise<StandardMatchWithDetails[]> {
    const targetDate = date || '2026-08-02';

    try {
      // 1. Check database first!
      const start = new Date(targetDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setUTCHours(23, 59, 59, 999);

      const dbMatches = await this.prisma.match.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        include: {
          league: true,
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      if (dbMatches.length > 0) {
        console.log(
          `[Controller DB HIT] Serving ${dbMatches.length} fixtures for date ${targetDate} directly from database.`,
        );
        return dbMatches as any[];
      }

      // 2. Fetch from API-Football if no database records exist
      const data = await this.apiFootballClient.getFixturesByDate(targetDate);
      const results = data.response || [];
      console.log(
        `[API-Football] Successfully fetched and normalized ${results.length} fixtures for date: ${targetDate}`,
      );
      
      const normalized = this.footballNormalizer.normalizeFixtures(results);

      // Async caching inside DB
      if (normalized.length > 0) {
        Promise.all(normalized.map((m) => this.saveMatchToDatabase(m))).catch(
          (err) => {
            console.error(
              '[FootballController] Bulk DB caching failed:',
              err.message,
            );
          },
        );
      }

      return normalized;
    } catch (err: any) {
      console.error(
        `[FootballController] Failed to retrieve fixtures for date ${targetDate}:`,
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
      // 1. Check database first!
      const dbMatch = await this.prisma.match.findUnique({
        where: { id: numericId },
        include: {
          league: true,
          homeTeam: true,
          awayTeam: true,
        },
      });

      // If match is found and is FINISHED, CANCELLED, or POSTPONED, we serve it directly from database!
      // If it is LIVE, HALFTIME, or SCHEDULED, we fall back to API-Football to get the absolute latest live events/scores.
      const finishedStatuses = ['FINISHED', 'CANCELLED', 'POSTPONED'];
      if (dbMatch && finishedStatuses.includes(dbMatch.status)) {
        console.log(
          `[Controller DB HIT] Serving finished Match ID ${numericId} directly from database.`
        );
        const matchAny = dbMatch as any;
        const homePossession = matchAny.stats?.home?.possessionPercent || 50;
        matchAny.momentum = {
          points: this.momentumService.calculateMomentum(
            matchAny.elapsedTime || 0,
            matchAny.events || [],
            homePossession,
          )
        };
        return matchAny;
      }

      // 2. Fetch match details and odds concurrently from external provider
      const [data, oddsData] = await Promise.all([
        this.apiFootballClient.getFixtureById(numericId),
        this.apiFootballClient.getOddsByFixtureId(numericId).catch(() => null),
      ]);

      const results = data.response || [];
      if (results.length === 0) {
        // Fallback to serving the database record (even if scheduled/live) rather than throwing 404
        if (dbMatch) {
          console.warn(
            `[API-Football] Match ID ${numericId} not found on external servers. Serving database record fallback.`
          );
          const matchAny = dbMatch as any;
          const homePossession = matchAny.stats?.home?.possessionPercent || 50;
          matchAny.momentum = {
            points: this.momentumService.calculateMomentum(
              matchAny.elapsedTime || 0,
              matchAny.events || [],
              homePossession,
            )
          };
          return matchAny;
        }
        throw new HttpException(
          `Match with ID ${id} was not found on the sports servers.`,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(
        `[API-Football] Successfully found and normalized Match ID: ${id}`,
      );

      const rawOdds = oddsData?.response || [];
      const normalized = this.footballNormalizer.normalizeFixture(
        results[0],
        rawOdds,
      );

      // Calculate and attach momentum conforming to StandardMomentumData structure
      const homePossession = normalized.stats?.home?.possessionPercent || 50;
      normalized.momentum = {
        points: this.momentumService.calculateMomentum(
          normalized.elapsedTime || 0,
          normalized.events || [],
          homePossession,
        )
      };

      // Async caching into database
      this.saveMatchToDatabase(normalized);

      return normalized;
    } catch (err: any) {
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
    const teamId = Number(id);
    const now = Date.now();

    // 1. Check in-memory cache first to protect API quota against bot crawlers
    const cached = this.teamCache.get(teamId);
    if (cached && cached.expiresAt > now) {
      console.log(
        `[Controller Cache HIT] Serving Team ID ${teamId} from in-memory cache.`,
      );
      return cached.data;
    }

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

      const result = {
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

      // Save to cache for 12 hours (43,200,000 ms)
      this.teamCache.set(teamId, {
        data: result,
        expiresAt: now + 43200000,
      });

      return result;
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
    const playerId = Number(id);
    const now = Date.now();

    // 1. Check in-memory cache first to protect API quota against bot crawlers
    const cached = this.playerCache.get(playerId);
    if (cached && cached.expiresAt > now) {
      console.log(
        `[Controller Cache HIT] Serving Player ID ${playerId} from in-memory cache.`,
      );
      return cached.data;
    }

    const headers = this.getHeaders();

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

      // Save to cache for 24 hours (86,400,000 ms)
      this.playerCache.set(playerId, {
        data: mapped,
        expiresAt: now + 86400000,
      });

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
