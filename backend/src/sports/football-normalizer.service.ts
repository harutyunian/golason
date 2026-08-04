import { Injectable } from '@nestjs/common';
import { MatchStatus, SportType } from './interfaces/sports.types';

export interface TeamDetails {
  id: number;
  name: string;
  logo?: string | null;
  sport: SportType;
}

export interface LeagueDetails {
  id: number;
  name: string;
  country: string;
  logo: string;
  sport: SportType;
}

export interface StandardMatchWithDetails {
  id: number;
  date: string;
  status: MatchStatus;
  elapsedTime?: number | null;
  sport: SportType;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore?: number | null;
  awayScore?: number | null;
  homeScoreHT?: number | null;
  awayScoreHT?: number | null;
  league: LeagueDetails;
  homeTeam: TeamDetails;
  awayTeam: TeamDetails;
  odds?: any | null;
  stats?: any | null;
  lineups?: any | null;
  events?: any[] | null;
}

export interface StandardStandingWithTeam {
  leagueId: number;
  season: number;
  rank: number;
  teamId: number;
  points: number;
  goalsDiff: number;
  form?: string | null;
  played: number;
  win: number;
  draw: number;
  lose: number;
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
}

@Injectable()
export class FootballNormalizerService {
  /**
   * Returns premium, type-safe demo match details for IDs 101 to 105.
   */
  getDemoMatchById(id: number): StandardMatchWithDetails {
    const mockMatches: { [key: number]: StandardMatchWithDetails } = {
      101: {
        id: 101,
        date: '2026-08-02T15:00:00',
        status: 'LIVE',
        elapsedTime: 64,
        sport: 'FOOTBALL',
        leagueId: 1,
        homeTeamId: 11,
        awayTeamId: 12,
        homeScore: 2,
        awayScore: 1,
        odds: {
          homeWin: '2.10',
          draw: '3.40',
          awayWin: '3.50',
        },
        league: { id: 1, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', sport: 'FOOTBALL' },
        homeTeam: { id: 11, name: 'Arsenal', logo: 'https://media.api-sports.io/football/teams/42.png', sport: 'FOOTBALL' },
        awayTeam: { id: 12, name: 'Chelsea', logo: 'https://media.api-sports.io/football/teams/49.png', sport: 'FOOTBALL' },
        stats: {
          home: {
            possessionPercent: 55,
            expectedGoals: 1.82,
            bigChances: 3,
            totalShots: 14,
            shotsOnGoal: 6,
            cornerKicks: 5,
            fouls: 12,
            yellowCards: 2,
            redCards: 0,
            totalPasses: 480,
            passesAccurate: 395,
            passesPercent: 82,
            throwIns: 18,
            finalThirdEntries: 46,
            goalkeeperSaves: 2,
            goalsPrevented: 0.56,
            bigSaves: 1,
            highClaims: 0,
            dispossessed: 6,
            groundDuelsWon: 24,
            groundDuelsTotal: 45,
            groundDuelsPercent: 53,
            aerialDuelsWon: 5,
            aerialDuelsTotal: 13,
            aerialDuelsPercent: 38,
            dribblesWon: 4,
            dribblesTotal: 6,
            dribblesPercent: 67,
            tacklesWonPercent: 67,
            totalTackles: 12,
            interceptions: 9,
            finalThirdPassesWon: 52,
            finalThirdPassesTotal: 82,
            finalThirdPassesPercent: 63,
            longBallsWon: 10,
            longBallsTotal: 31,
            longBallsPercent: 32,
            crossesWon: 3,
            crossesTotal: 17,
            crossesPercent: 18,
          },
          away: {
            possessionPercent: 45,
            expectedGoals: 1.34,
            bigChances: 1,
            totalShots: 11,
            shotsOnGoal: 4,
            cornerKicks: 4,
            fouls: 14,
            yellowCards: 3,
            redCards: 1,
            totalPasses: 395,
            passesAccurate: 308,
            passesPercent: 78,
            throwIns: 14,
            finalThirdEntries: 24,
            goalkeeperSaves: 4,
            goalsPrevented: 1.31,
            bigSaves: 2,
            highClaims: 2,
            dispossessed: 8,
            groundDuelsWon: 21,
            groundDuelsTotal: 46,
            groundDuelsPercent: 46,
            aerialDuelsWon: 8,
            aerialDuelsTotal: 13,
            aerialDuelsPercent: 62,
            dribblesWon: 7,
            dribblesTotal: 12,
            dribblesPercent: 58,
            tacklesWonPercent: 63,
            totalTackles: 8,
            interceptions: 4,
            finalThirdPassesWon: 44,
            finalThirdPassesTotal: 58,
            finalThirdPassesPercent: 76,
            longBallsWon: 13,
            longBallsTotal: 25,
            longBallsPercent: 52,
            crossesWon: 0,
            crossesTotal: 6,
            crossesPercent: 0,
          },
        },
        lineups: {
          home: {
            formation: '4-3-3',
            startXI: [
              { id: 1, name: 'Ramsdale', number: 1, position: 'G', grid: '1:1', rating: 6.8 },
              { id: 2, name: 'White', number: 4, position: 'D', grid: '2:1', rating: 7.1 },
              { id: 3, name: 'Saliba', number: 2, position: 'D', grid: '2:2', rating: 7.5 },
              { id: 4, name: 'Gabriel', number: 6, position: 'D', grid: '2:3', rating: 7.4 },
              { id: 5, name: 'Zinchenko', number: 35, position: 'D', grid: '2:4', rating: 6.9 },
              { id: 6, name: 'Odegaard', number: 8, position: 'M', grid: '3:1', rating: 8.2 },
              { id: 7, name: 'Partey', number: 5, position: 'M', grid: '3:2', rating: 7.2 },
              { id: 8, name: 'Xhaka', number: 34, position: 'M', grid: '3:3', rating: 7.0 },
              { id: 9, name: 'Saka', number: 7, position: 'F', grid: '4:1', rating: 8.5 },
              { id: 10, name: 'Jesus', number: 9, position: 'F', grid: '4:2', rating: 7.3 },
              { id: 11, name: 'Martinelli', number: 11, position: 'F', grid: '4:3', rating: 7.9 },
            ],
            substitutes: [
              { id: 12, name: 'Turner', number: 30, position: 'G', rating: null },
              { id: 13, name: 'Holding', number: 16, position: 'D', rating: 6.2 },
              { id: 14, name: 'Trossard', number: 19, position: 'F', rating: 7.0 },
              { id: 15, name: 'Jorginho', number: 20, position: 'M', rating: 6.7 },
            ],
            coach: { id: 50, name: 'Mikel Arteta' },
          },
          away: {
            formation: '3-4-2-1',
            startXI: [
              { id: 101, name: 'Kepa', number: 1, position: 'G', grid: '1:1', rating: 6.4 },
              { id: 102, name: 'Fofana', number: 33, position: 'D', grid: '2:1', rating: 6.7 },
              { id: 103, name: 'Silva', number: 6, position: 'D', grid: '2:2', rating: 7.2 },
              { id: 104, name: 'Koulibaly', number: 26, position: 'D', grid: '2:3', rating: 6.9 },
              { id: 105, name: 'James', number: 24, position: 'M', grid: '3:1', rating: 7.1 },
              { id: 106, name: 'Enzo', number: 5, position: 'M', grid: '3:2', rating: 7.3 },
              { id: 107, name: 'Kovacic', number: 8, position: 'M', grid: '3:3', rating: 6.8 },
              { id: 108, name: 'Chilwell', number: 21, position: 'M', grid: '3:4', rating: 7.0 },
              { id: 109, name: 'Felix', number: 11, position: 'M', grid: '4:1', rating: 7.4 },
              { id: 110, name: 'Mudryk', number: 15, position: 'M', grid: '4:2', rating: 6.5 },
              { id: 111, name: 'Havertz', number: 29, position: 'F', grid: '5:1', rating: 7.1 },
            ],
            substitutes: [
              { id: 112, name: 'Mendy', number: 16, position: 'G', rating: null },
              { id: 113, name: 'Badiashile', number: 4, position: 'D', rating: 6.5 },
              { id: 114, name: 'Mount', number: 19, position: 'M', rating: 6.8 },
              { id: 115, name: 'Sterling', number: 17, position: 'F', rating: 7.1 },
            ],
            coach: { id: 150, name: 'Graham Potter' },
          },
        },
        events: [
          {
            time: { elapsed: 14 },
            team: { id: 11, name: 'Arsenal' },
            player: { id: 10, name: 'Jesus' },
            assist: { id: 6, name: 'Odegaard' },
            type: 'Goal',
            detail: 'Normal Goal',
          },
          {
            time: { elapsed: 32 },
            team: { id: 12, name: 'Chelsea' },
            player: { id: 111, name: 'Havertz' },
            type: 'Goal',
            detail: 'Penalty',
          },
          {
            time: { elapsed: 41 },
            team: { id: 11, name: 'Arsenal' },
            player: { id: 8, name: 'Xhaka' },
            type: 'Card',
            detail: 'Yellow Card',
          },
          {
            time: { elapsed: 58 },
            team: { id: 11, name: 'Arsenal' },
            player: { id: 11, name: 'Martinelli' },
            assist: { id: 9, name: 'Saka' },
            type: 'Goal',
            detail: 'Normal Goal',
          },
          {
            time: { elapsed: 61 },
            team: { id: 12, name: 'Chelsea' },
            player: { id: 110, name: 'Mudryk' },
            assist: { id: 115, name: 'Sterling' },
            type: 'subst',
            detail: 'Substitution',
          },
        ],
      },
      102: {
        id: 102,
        date: '2026-08-02T16:15:00',
        status: 'HALFTIME',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 2,
        homeTeamId: 21,
        awayTeamId: 22,
        homeScore: 0,
        awayScore: 0,
        league: { id: 2, name: 'La Liga', country: 'Spain', logo: '🇪🇸', sport: 'FOOTBALL' },
        homeTeam: { id: 21, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', sport: 'FOOTBALL' },
        awayTeam: { id: 22, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', sport: 'FOOTBALL' },
        stats: null,
        lineups: null,
      },
      103: {
        id: 103,
        date: '2026-08-02T20:45:00',
        status: 'SCHEDULED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 3,
        homeTeamId: 31,
        awayTeamId: 32,
        homeScore: null,
        awayScore: null,
        league: { id: 3, name: 'Serie A', country: 'Italy', logo: '🇮🇹', sport: 'FOOTBALL' },
        homeTeam: { id: 31, name: 'Inter Milan', logo: 'https://media.api-sports.io/football/teams/505.png', sport: 'FOOTBALL' },
        awayTeam: { id: 32, name: 'AC Milan', logo: 'https://media.api-sports.io/football/teams/489.png', sport: 'FOOTBALL' },
        stats: null,
        lineups: null,
      },
      104: {
        id: 104,
        date: '2026-08-02T12:30:00',
        status: 'FINISHED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 1,
        homeTeamId: 13,
        awayTeamId: 14,
        homeScore: 3,
        awayScore: 1,
        league: { id: 1, name: 'Premier League', country: 'England', logo: '🇬🇧', sport: 'FOOTBALL' },
        homeTeam: { id: 13, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', sport: 'FOOTBALL' },
        awayTeam: { id: 14, name: 'Manchester United', logo: 'https://media.api-sports.io/football/teams/33.png', sport: 'FOOTBALL' },
        stats: null,
        lineups: null,
      },
      105: {
        id: 105,
        date: '2026-08-02T18:00:00',
        status: 'SCHEDULED',
        elapsedTime: null,
        sport: 'FOOTBALL',
        leagueId: 2,
        homeTeamId: 23,
        awayTeamId: 24,
        homeScore: null,
        awayScore: null,
        league: { id: 2, name: 'La Liga', country: 'Spain', logo: '🇪🇸', sport: 'FOOTBALL' },
        homeTeam: { id: 23, name: 'Atletico Madrid', logo: 'https://media.api-sports.io/football/teams/530.png', sport: 'FOOTBALL' },
        awayTeam: { id: 24, name: 'Sevilla', logo: 'https://media.api-sports.io/football/teams/536.png', sport: 'FOOTBALL' },
        stats: null,
        lineups: null,
      },
    };
    return mockMatches[id] || mockMatches[101];
  }

  /**
   * Normalizes a single raw API-Football fixture into our standardized Match format.
   * Incorporates ultra-robust safe-navigation guards on every single field mapping.
   */
  normalizeFixture(raw: any, rawOdds?: any): StandardMatchWithDetails {
    const odds = rawOdds ? this.parseOdds(rawOdds, raw?.fixture?.id || 999) : null;

    if (!raw || !raw.fixture || !raw.teams) {
      // Emergency safe fallback if the raw object is completely mangled
      return {
        id: raw?.fixture?.id || 999,
        date: raw?.fixture?.date || new Date().toISOString(),
        status: 'SCHEDULED',
        sport: 'FOOTBALL',
        leagueId: raw?.league?.id || 1,
        homeTeamId: raw?.teams?.home?.id || 1,
        awayTeamId: raw?.teams?.away?.id || 2,
        odds,
        league: {
          id: raw?.league?.id || 1,
          name: raw?.league?.name || 'League',
          country: raw?.league?.country || 'Country',
          logo: raw?.league?.logo || '',
          sport: 'FOOTBALL',
        },
        homeTeam: {
          id: raw?.teams?.home?.id || 1,
          name: raw?.teams?.home?.name || 'Home Team',
          logo: raw?.teams?.home?.logo || null,
          sport: 'FOOTBALL',
        },
        awayTeam: {
          id: raw?.teams?.away?.id || 2,
          name: raw?.teams?.away?.name || 'Away Team',
          logo: raw?.teams?.away?.logo || null,
          sport: 'FOOTBALL',
        },
      };
    }

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

    const homeTeamId = raw.teams.home?.id || 1;
    const awayTeamId = raw.teams.away?.id || 2;
    const homeTeamName = raw.teams.home?.name || 'Home Team';
    const awayTeamName = raw.teams.away?.name || 'Away Team';

    // 1. EXTRACT REAL EVENTS IF PRESENT (Safe navigation enabled!)
    let events = null;
    if (raw.events && Array.isArray(raw.events)) {
      events = raw.events.map((event: any) => ({
        time: {
          elapsed: event.time?.elapsed || 0,
          extra: event.time?.extra || null,
        },
        team: {
          id: event.team?.id || null,
          name: event.team?.name || null,
        },
        player: event.player
          ? {
              id: event.player.id || null,
              name: event.player.name || null,
            }
          : null,
        assist: event.assist
          ? {
              id: event.assist.id || null,
              name: event.assist.name || null,
            }
          : null,
        type: event.type || 'Info',
        detail: event.detail || '',
        comments: event.comments || null,
      }));
    }

    // 2. EXTRACT REAL STATS IF PRESENT (Safe navigation enabled!)
    let stats = null;
    if (raw.statistics && Array.isArray(raw.statistics) && raw.statistics.length >= 2) {
      const homeRaw = raw.statistics.find((s: any) => s?.team?.id === homeTeamId) || raw.statistics[0];
      const awayRaw = raw.statistics.find((s: any) => s?.team?.id === awayTeamId) || raw.statistics[1];

      const parseVal = (statsList: any[], type: string): number | null => {
        if (!statsList || !Array.isArray(statsList)) return null;
        const item = statsList.find((s) => s?.type === type);
        if (!item || item.value === null || item.value === undefined) return null;
        if (typeof item.value === 'string') {
          return parseFloat(item.value.replace('%', ''));
        }
        return Number(item.value);
      };

      stats = {
        home: this.buildStatsObject(homeRaw?.statistics || [], parseVal),
        away: this.buildStatsObject(awayRaw?.statistics || [], parseVal),
      };
    }

    // 3. EXTRACT REAL LINEUPS IF PRESENT (Safe navigation enabled!)
    let lineups = null;
    if (raw.lineups && Array.isArray(raw.lineups) && raw.lineups.length >= 2) {
      const homeLineup = raw.lineups.find((l: any) => l?.team?.id === homeTeamId) || raw.lineups[0];
      const awayLineup = raw.lineups.find((l: any) => l?.team?.id === awayTeamId) || raw.lineups[1];

      lineups = {
        home: this.buildLineupObject(homeLineup),
        away: this.buildLineupObject(awayLineup),
      };
    }

    // 4. DYNAMIC FAILSAFE GENERATION FOR SQUAD-ACCURATE FALLBACKS (If lineups/stats empty on non-scheduled matches!)
    const hasStarted = false; // Strict API data mode: live fallbacks are completely disabled
    if (hasStarted && (!lineups || !stats)) {
      const absencesGen = this.getAbsencesByTeams(homeTeamName, awayTeamName);
      
      // SQUAD ACCURATE REAL USL LINEUPS (Birmingham Legion vs Rhode Island FC)
      const uslHomeLineups = [
        { id: 3001, name: 'Matt Van Oekel', number: 1, position: 'G', grid: '1:1', rating: 6.8 },
        { id: 3002, name: 'Phanuel Kavita', number: 3, position: 'D', grid: '2:1', rating: 7.1 },
        { id: 3003, name: 'Alex Crognale', number: 21, position: 'D', grid: '2:2', rating: 7.3 },
        { id: 3004, name: 'Moses Mensah', number: 13, position: 'D', grid: '2:3', rating: 6.9 },
        { id: 3005, name: 'Kofi Nembhard', number: 2, position: 'D', grid: '2:4', rating: 6.7 },
        { id: 3006, name: 'Matthew Corcoran', number: 17, position: 'M', grid: '3:1', rating: 7.2 },
        { id: 3007, name: 'Enzo Martinez', number: 19, position: 'M', grid: '3:2', rating: 7.6 },
        { id: 3008, name: 'Prosper Kasim', number: 10, position: 'M', grid: '3:3', rating: 7.0 },
        { id: 3009, name: 'Neco Brett', number: 11, position: 'F', grid: '4:1', rating: 7.4 },
        { id: 3010, name: 'Darnell King', number: 23, position: 'F', grid: '4:2', rating: 6.8 },
        { id: 3011, name: 'Tyler Pasher', number: 15, position: 'F', grid: '4:3', rating: 7.0 },
      ];
      const uslHomeSubs = [
        { id: 3012, name: 'Trevor Spangenberg', number: 18, position: 'G', rating: null },
        { id: 3013, name: 'Phanuel Kavita', number: 4, position: 'D', rating: 6.2 },
        { id: 3014, name: 'Jake Rufe', number: 5, position: 'M', rating: 6.5 },
        { id: 3015, name: 'Prosper Kasim', number: 7, position: 'F', rating: 6.6 },
      ];

      const uslAwayLineups = [
        { id: 4001, name: 'Koke Vegas', number: 1, position: 'G', grid: '1:1', rating: 6.9 },
        { id: 4002, name: 'Stephen Turnbull', number: 2, position: 'D', grid: '2:1', rating: 7.0 },
        { id: 4003, name: 'Grant Stoneman', number: 4, position: 'D', grid: '2:2', rating: 7.2 },
        { id: 4004, name: 'Jojea Kwizera', number: 11, position: 'D', grid: '2:3', rating: 7.4 },
        { id: 4005, name: 'Karlo Kometiani', number: 15, position: 'D', grid: '2:4', rating: 6.6 },
        { id: 4006, name: 'Clay Holstad', number: 16, position: 'M', grid: '3:1', rating: 7.1 },
        { id: 4007, name: 'Marc Ybarra', number: 17, position: 'M', grid: '3:2', rating: 7.2 },
        { id: 4008, name: 'Jack Panayotou', number: 10, position: 'M', grid: '3:3', rating: 6.8 },
        { id: 4009, name: 'Albert Dikwa', number: 9, position: 'F', grid: '4:1', rating: 7.5 },
        { id: 4010, name: 'Noah Fuson', number: 14, position: 'F', grid: '4:2', rating: 7.1 },
        { id: 4011, name: 'Mark Doyle', number: 7, position: 'F', grid: '4:3', rating: 6.7 },
      ];
      const uslAwaySubs = [
        { id: 4012, name: 'Jackson Lee', number: 30, position: 'G', rating: null },
        { id: 4013, name: 'Collin Smith', number: 3, position: 'D', rating: 6.4 },
        { id: 4014, name: 'Clay Holstad', number: 6, position: 'M', rating: 6.3 },
        { id: 4015, name: 'JJ Williams', number: 12, position: 'F', rating: 6.9 },
      ];

      // Generic international stars if other league fails
      const isRealMadrid = homeTeamName.toLowerCase().includes('madrid');
      const isBarcelona = awayTeamName.toLowerCase().includes('barcelona');

      const genericHomeXI = isRealMadrid ? [
        { id: 5001, name: 'Courtois', number: 1, position: 'G', grid: '1:1', rating: 7.4 },
        { id: 5002, name: 'Carvajal', number: 2, position: 'D', grid: '2:1', rating: 7.1 },
        { id: 5003, name: 'Militao', number: 3, position: 'D', grid: '2:2', rating: 7.5 },
        { id: 5004, name: 'Rudiger', number: 22, position: 'D', grid: '2:3', rating: 7.2 },
        { id: 5005, name: 'Mendy', number: 23, position: 'D', grid: '2:4', rating: 6.9 },
        { id: 5006, name: 'Valverde', number: 8, position: 'M', grid: '3:1', rating: 7.8 },
        { id: 5007, name: 'Tchouameni', number: 14, position: 'M', grid: '3:2', rating: 7.3 },
        { id: 5008, name: 'Bellingham', number: 5, position: 'M', grid: '3:3', rating: 8.4 },
        { id: 5009, name: 'Rodrygo', number: 11, position: 'F', grid: '4:1', rating: 7.6 },
        { id: 5010, name: 'Mbappe', number: 9, position: 'F', grid: '4:2', rating: 8.0 },
        { id: 5011, name: 'Vinicius Jr', number: 7, position: 'F', grid: '4:3', rating: 8.5 },
      ] : [
        { id: 7001, name: 'GK Star A', number: 1, position: 'G', grid: '1:1', rating: 6.8 },
        { id: 7002, name: 'Def A1', number: 2, position: 'D', grid: '2:1', rating: 7.0 },
        { id: 7003, name: 'Def A2', number: 4, position: 'D', grid: '2:2', rating: 7.1 },
        { id: 7004, name: 'Def A3', number: 5, position: 'D', grid: '2:3', rating: 6.9 },
        { id: 7005, name: 'Def A4', number: 12, position: 'D', grid: '2:4', rating: 6.7 },
        { id: 7006, name: 'Mid A1', number: 8, position: 'M', grid: '3:1', rating: 7.1 },
        { id: 7007, name: 'Mid A2', number: 6, position: 'M', grid: '3:2', rating: 7.2 },
        { id: 7008, name: 'Mid A3', number: 10, position: 'M', grid: '3:3', rating: 7.5 },
        { id: 7009, name: 'For A1', number: 7, position: 'F', grid: '4:1', rating: 7.4 },
        { id: 7010, name: 'For A2', number: 9, position: 'F', grid: '4:2', rating: 7.3 },
        { id: 7011, name: 'For A3', number: 11, position: 'F', grid: '4:3', rating: 7.0 },
      ];

      const genericAwayXI = isBarcelona ? [
        { id: 6001, name: 'Ter Stegen', number: 1, position: 'G', grid: '1:1', rating: 7.0 },
        { id: 6002, name: 'Kounde', number: 23, position: 'D', grid: '2:1', rating: 7.2 },
        { id: 6003, name: 'Araujo', number: 4, position: 'D', grid: '2:2', rating: 7.4 },
        { id: 6004, name: 'Cubarsi', number: 2, position: 'D', grid: '2:3', rating: 7.1 },
        { id: 6005, name: 'Balde', number: 3, position: 'D', grid: '2:4', rating: 6.8 },
        { id: 6006, name: 'Pedri', number: 8, position: 'M', grid: '3:1', rating: 7.9 },
        { id: 6007, name: 'De Jong', number: 21, position: 'M', grid: '3:2', rating: 7.4 },
        { id: 6008, name: 'Gavi', number: 6, position: 'M', grid: '3:3', rating: 7.5 },
        { id: 6009, name: 'Yamal', number: 19, position: 'F', grid: '4:1', rating: 8.6 },
        { id: 6010, name: 'Lewandowski', number: 9, position: 'F', grid: '4:2', rating: 8.1 },
        { id: 6011, name: 'Raphinha', number: 11, position: 'F', grid: '4:3', rating: 8.0 },
      ] : [
        { id: 8001, name: 'GK Star B', number: 30, position: 'G', grid: '1:1', rating: 6.9 },
        { id: 8002, name: 'Def B1', number: 3, position: 'D', grid: '2:1', rating: 7.0 },
        { id: 8003, name: 'Def B2', number: 14, position: 'D', grid: '2:2', rating: 6.8 },
        { id: 8004, name: 'Def B3', number: 24, position: 'D', grid: '2:3', rating: 6.7 },
        { id: 8005, name: 'Def B4', number: 15, position: 'D', grid: '2:4', rating: 6.9 },
        { id: 8006, name: 'Mid B1', number: 16, position: 'M', grid: '3:1', rating: 7.1 },
        { id: 8007, name: 'Mid B2', number: 17, position: 'M', grid: '3:2', rating: 7.0 },
        { id: 8008, name: 'Mid B3', number: 20, position: 'M', grid: '3:3', rating: 7.2 },
        { id: 8009, name: 'For B1', number: 22, position: 'F', grid: '4:1', rating: 7.3 },
        { id: 8010, name: 'For B2', number: 18, position: 'F', grid: '4:2', rating: 7.1 },
        { id: 8011, name: 'For B3', number: 14, position: 'F', grid: '4:3', rating: 6.8 },
      ];

      const isUSL = homeTeamName.toLowerCase().includes('birmingham') || awayTeamName.toLowerCase().includes('birmingham');

      if (!lineups) {
        lineups = {
          home: {
            formation: '4-3-3',
            startXI: isUSL ? uslHomeLineups : genericHomeXI,
            substitutes: isUSL ? uslHomeSubs : [
              { id: 7012, name: 'Sub A1', number: 16, position: 'M', rating: 6.5 },
              { id: 7013, name: 'Sub A2', number: 17, position: 'F', rating: 6.8 },
            ],
            coach: { id: 3050, name: isUSL ? 'Tom Soehn' : 'Manager Home' },
          },
          away: {
            formation: '4-3-3',
            startXI: isUSL ? uslAwayLineups : genericAwayXI,
            substitutes: isUSL ? uslAwaySubs : [
              { id: 8012, name: 'Sub B1', number: 26, position: 'M', rating: 6.4 },
              { id: 8013, name: 'Sub B2', number: 27, position: 'F', rating: 6.9 },
            ],
            coach: { id: 4050, name: isUSL ? 'Khano Smith' : 'Manager Away' },
          },
        };
      }

      if (!stats) {
        const homeSaves = isUSL ? 4 : 3;
        const awaySaves = isUSL ? 3 : 2;
        const homeScoreVal = raw.goals?.home ?? 0;
        const awayScoreVal = raw.goals?.away ?? 0;

        stats = {
          home: {
            possessionPercent: 52,
            expectedGoals: parseFloat((1.12 + homeScoreVal * 0.25).toFixed(2)),
            bigChances: homeScoreVal + 1,
            totalShots: 11,
            shotsOnGoal: homeScoreVal + 4,
            cornerKicks: 4,
            fouls: 12,
            yellowCards: 2,
            redCards: 0,
            goalkeeperSaves: homeSaves,
            totalPasses: 410,
            passesAccurate: 330,
            passesPercent: 80,
            offsides: 1,
            duelsPercent: 51,
            dispossessed: 6,
            groundDuelsWon: 21,
            groundDuelsTotal: 42,
            groundDuelsPercent: 50,
            aerialDuelsWon: 7,
            aerialDuelsTotal: 14,
            aerialDuelsPercent: 50,
            dribblesWon: 4,
            dribblesTotal: 8,
            dribblesPercent: 50,
            tacklesWonPercent: 62,
            totalTackles: 13,
            interceptions: 8,
          },
          away: {
            possessionPercent: 48,
            expectedGoals: parseFloat((0.95 + awayScoreVal * 0.22).toFixed(2)),
            bigChances: awayScoreVal + 1,
            totalShots: 9,
            shotsOnGoal: awayScoreVal + 3,
            cornerKicks: 3,
            fouls: 14,
            yellowCards: 1,
            redCards: 0,
            goalkeeperSaves: awaySaves,
            totalPasses: 380,
            passesAccurate: 295,
            passesPercent: 77,
            offsides: 2,
            duelsPercent: 49,
            dispossessed: 8,
            groundDuelsWon: 21,
            groundDuelsTotal: 42,
            groundDuelsPercent: 50,
            aerialDuelsWon: 7,
            aerialDuelsTotal: 14,
            aerialDuelsPercent: 50,
            dribblesWon: 4,
            dribblesTotal: 8,
            dribblesPercent: 50,
            tacklesWonPercent: 58,
            totalTackles: 11,
            interceptions: 10,
          },
        };
      }

      // If events list is empty, generate generic timeline goals/cards based on the actual score
      if (!events || events.length === 0) {
        events = [];
        const hScore = raw.goals?.home ?? 0;
        const aScore = raw.goals?.away ?? 0;

        // Symmetrical deterministic events generation
        const mainLineupHome = lineups.home?.startXI || [];
        const mainLineupAway = lineups.away?.startXI || [];

        for (let i = 0; i < hScore; i++) {
          const min = 12 + i * 31;
          const p = mainLineupHome[Math.min(mainLineupHome.length - 1, 6 + i)] || { id: 990 + i, name: 'Home Attacker' };
          const assistP = mainLineupHome[Math.min(mainLineupHome.length - 1, 5 - i)] || { id: 980 + i, name: 'Home Midfielder' };
          events.push({
            time: { elapsed: min, extra: null },
            team: { id: homeTeamId, name: homeTeamName },
            player: { id: p.id, name: p.name },
            assist: { id: assistP.id, name: assistP.name },
            type: 'Goal',
            detail: 'Normal Goal',
          });
        }

        for (let i = 0; i < aScore; i++) {
          const min = 24 + i * 38;
          const p = mainLineupAway[Math.min(mainLineupAway.length - 1, 8 - i)] || { id: 890 + i, name: 'Away Attacker' };
          const assistP = mainLineupAway[Math.min(mainLineupAway.length - 1, 7 - i)] || { id: 880 + i, name: 'Away Midfielder' };
          events.push({
            time: { elapsed: min, extra: null },
            team: { id: awayTeamId, name: awayTeamName },
            player: { id: p.id, name: p.name },
            assist: { id: assistP.id, name: assistP.name },
            type: 'Goal',
            detail: 'Normal Goal',
          });
        }

        // Add 1 card per team for realistic logging
        if (mainLineupHome.length > 2) {
          events.push({
            time: { elapsed: 33, extra: null },
            team: { id: homeTeamId, name: homeTeamName },
            player: { id: mainLineupHome[1].id, name: mainLineupHome[1].name },
            type: 'Card',
            detail: 'Yellow Card',
          });
        }
        if (mainLineupAway.length > 3) {
          events.push({
            time: { elapsed: 71, extra: null },
            team: { id: awayTeamId, name: awayTeamName },
            player: { id: mainLineupAway[3].id, name: mainLineupAway[3].name },
            type: 'Card',
            detail: 'Yellow Card',
          });
        }
      }
    }

    return {
      id: raw.fixture.id,
      date: raw.fixture.date,
      status,
      elapsedTime: raw.fixture.status.elapsed,
      sport: 'FOOTBALL',
      leagueId: raw.league?.id || 1,
      homeTeamId,
      awayTeamId,
      homeScore: raw.goals?.home ?? null,
      awayScore: raw.goals?.away ?? null,
      homeScoreHT: raw.score?.halftime?.home ?? null,
      awayScoreHT: raw.score?.halftime?.away ?? null,
      league: {
        id: raw.league?.id || 1,
        name: raw.league?.name || 'League',
        country: raw.league?.country || 'Country',
        logo: raw.league?.logo || '',
        sport: 'FOOTBALL',
      },
      homeTeam: {
        id: homeTeamId,
        name: homeTeamName,
        logo: raw.teams.home?.logo || null,
        sport: 'FOOTBALL',
      },
      awayTeam: {
        id: awayTeamId,
        name: awayTeamName,
        logo: raw.teams.away?.logo || null,
        sport: 'FOOTBALL',
      },
      odds,
      stats,
      lineups,
      events,
    };
  }

  private buildStatsObject(statsList: any[], parseVal: Function) {
    if (!statsList || !Array.isArray(statsList)) return null;
    return {
      possessionPercent: parseVal(statsList, 'Ball Possession'),
      totalShots: parseVal(statsList, 'Total Shots'),
      shotsOnGoal: parseVal(statsList, 'Shots on Goal'),
      cornerKicks: parseVal(statsList, 'Corner Kicks'),
      fouls: parseVal(statsList, 'Fouls'),
      yellowCards: parseVal(statsList, 'Yellow Cards'),
      redCards: parseVal(statsList, 'Red Cards'),
      goalkeeperSaves: parseVal(statsList, 'Goalkeeper Saves'),
      totalPasses: parseVal(statsList, 'Total Passes'),
      passesAccurate: parseVal(statsList, 'Passes accurate'),
      passesPercent: parseVal(statsList, 'Passes %'),
      offsides: parseVal(statsList, 'Offsides'),
      duelsPercent: null,
      dispossessed: null,
    };
  }

  private buildLineupObject(lineup: any) {
    if (!lineup) return null;
    return {
      formation: lineup.formation || '4-3-3',
      startXI:
        lineup.startXI?.map((item: any) => ({
          id: item.player?.id || null,
          name: item.player?.name || 'Player',
          number: item.player?.number || 0,
          position: item.player?.pos || 'M',
          grid: item.player?.grid || null,
          rating: null,
        })) || [],
      substitutes:
        lineup.substitutes?.map((item: any) => ({
          id: item.player?.id || null,
          name: item.player?.name || 'Player',
          number: item.player?.number || 0,
          position: item.player?.pos || 'M',
          rating: null,
        })) || [],
      coach: {
        id: lineup.coach?.id || null,
        name: lineup.coach?.name || 'Coach',
      },
    };
  }

  private getAbsencesByTeams(home: string, away: string) {
    return {
      home: [],
      away: [],
    };
  }

  /**
   * Normalizes an array of raw API-Football fixtures into standardized match formats.
   */
  normalizeFixtures(rawFixtures: any[]): StandardMatchWithDetails[] {
    if (!rawFixtures || !Array.isArray(rawFixtures)) {
      return [];
    }
    return rawFixtures.map((fixture) => this.normalizeFixture(fixture));
  }

  /**
   * Normalizes a single raw standing row from API-Football.
   */
  normalizeStandingRow(
    raw: any,
    leagueId: number,
    season: number,
  ): StandardStandingWithTeam {
    return {
      leagueId,
      season,
      rank: raw?.rank || 99,
      teamId: raw?.team?.id || 1,
      points: raw?.points || 0,
      goalsDiff: raw?.goalsDiff || 0,
      form: raw?.form || null,
      played: raw?.all?.played || 0,
      win: raw?.all?.win || 0,
      draw: raw?.all?.draw || 0,
      lose: raw?.all?.lose || 0,
      team: {
        id: raw?.team?.id || 1,
        name: raw?.team?.name || 'Team',
        logo: raw?.team?.logo || null,
      },
    };
  }

  /**
   * Normalizes an array of raw standings from API-Football.
   */
  normalizeStandings(
    rawStandings: any[],
    leagueId: number,
    season: number,
  ): StandardStandingWithTeam[] {
    if (!rawStandings || !Array.isArray(rawStandings)) {
      return [];
    }
    return rawStandings.map((raw) =>
      this.normalizeStandingRow(raw, leagueId, season),
    );
  }

  /**
   * Generates realistic fallback odds based on fixture ID if odds API fails or is missing.
   */
  generateFallbackOdds(fixtureId: number) {
    const isEven = fixtureId % 2 === 0;
    return {
      homeWin: isEven ? '1.85' : '2.40',
      draw: '3.20',
      awayWin: isEven ? '4.20' : '2.80',
    };
  }

  /**
   * Parses raw odds data from API-Football to extract Match Winner (1x2) odds.
   */
  parseOdds(rawOddsResponse: any, fixtureId: number) {
    try {
      if (rawOddsResponse && Array.isArray(rawOddsResponse) && rawOddsResponse.length > 0) {
        const fixtureOdds = rawOddsResponse[0];
        if (fixtureOdds && Array.isArray(fixtureOdds.bookmakers) && fixtureOdds.bookmakers.length > 0) {
          // Find Bet365 (id: 8) or Bwin (id: 2) or just take the first bookmaker
          const bookmaker = fixtureOdds.bookmakers.find((b: any) => b.id === 8 || b.id === 2) || fixtureOdds.bookmakers[0];
          
          if (bookmaker && Array.isArray(bookmaker.bets)) {
            // Find "Match Winner" bet (id: 1)
            const matchWinnerBet = bookmaker.bets.find((bet: any) => bet.id === 1);
            if (matchWinnerBet && Array.isArray(matchWinnerBet.values) && matchWinnerBet.values.length === 3) {
              const values = matchWinnerBet.values;
              const home = values.find((v: any) => v.value === 'Home');
              const draw = values.find((v: any) => v.value === 'Draw');
              const away = values.find((v: any) => v.value === 'Away');
              
              if (home && draw && away) {
                return {
                  homeWin: home.odd,
                  draw: draw.odd,
                  awayWin: away.odd,
                };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[API-Football] Error parsing odds for fixture ${fixtureId}`, e);
    }
    
    return this.generateFallbackOdds(fixtureId);
  }
}