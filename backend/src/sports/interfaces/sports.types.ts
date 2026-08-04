/**
 * Supported Sport Types in the Golason ecosystem
 */
export type SportType = 'FOOTBALL' | 'TENNIS' | 'HOCKEY' | 'UFC';

/**
 * Match statuses representing the standard lifecycle of a sporting event
 */
export type MatchStatus =
  'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

/**
 * Standard representation of a Sport Team
 */
export interface StandardTeam {
  id: number; // Matches external API ID (e.g. API-Football ID)
  name: string;
  code?: string | null;
  logo?: string | null;
  founded?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  sport: SportType;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Standard representation of a Player
 */
export interface StandardPlayer {
  id: number; // Matches external API ID
  name: string;
  firstname?: string | null;
  lastname?: string | null;
  age?: number | null;
  birthDate?: string | null;
  nationality?: string | null;
  height?: string | null;
  weight?: string | null;
  photo?: string | null;
  position?: string | null; // e.g., 'Goalkeeper', 'Defender', 'Midfielder', 'Attacker'
  injured: boolean;
  sport: SportType;
  teamId?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Standard representation of a League
 */
export interface StandardLeague {
  id: number;
  name: string;
  country: string;
  logo?: string | null;
  sport: SportType;
}

/**
 * Standard Match Statistics detail structure
 */
export interface TeamStats {
  possessionPercent?: number | null; // e.g., 55 representing 55%
  shotsOnGoal?: number | null;
  shotsOffGoal?: number | null;
  totalShots?: number | null;
  blockedShots?: number | null;
  shotsInsideBox?: number | null;
  shotsOutsideBox?: number | null;
  fouls?: number | null;
  cornerKicks?: number | null;
  offsides?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  goalkeeperSaves?: number | null;
  totalPasses?: number | null;
  passesAccurate?: number | null;
  passesPercent?: number | null;
}

export interface StandardMatchStats {
  home: TeamStats;
  away: TeamStats;
}

/**
 * Standard Match Lineups structure
 */
export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string; // 'G', 'D', 'M', 'F'
  grid?: string | null; // e.g., "1:1" for pitch display position coordinate
}

export interface TeamLineup {
  formation: string; // e.g., "4-3-3"
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: {
    id: number;
    name: string;
    photo?: string | null;
  };
}

export interface StandardMatchLineups {
  home: TeamLineup;
  away: TeamLineup;
}

/**
 * Standard Match Chronological Event structure
 */
export interface StandardMatchEvent {
  time: {
    elapsed: number; // Minute of the match
    extra?: number | null; // e.g., +2 in stoppage time
  };
  team: {
    id: number;
    name: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist?: {
    id: number | null;
    name: string | null;
  } | null;
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string; // e.g., "Yellow Card", "Normal Goal", "Substitution"
  comments?: string | null;
}

/**
 * Standard Head-to-Head (H2H) Match representation
 */
export interface StandardH2HMatch {
  id: number;
  date: Date | string;
  status: MatchStatus;
  homeTeam: {
    id: number;
    name: string;
    logo?: string | null;
  };
  awayTeam: {
    id: number;
    name: string;
    logo?: string | null;
  };
  homeScore: number;
  awayScore: number;
}

/**
 * Datapoints representing dynamic momentum graph (dominant team pressure curves)
 */
export interface MomentumPoint {
  minute: number;
  value: number; // Value between -100 (complete away dominance) and 100 (complete home dominance)
}

export interface StandardMomentumData {
  points: MomentumPoint[];
}

/**
 * Standard Match Odds representation
 */
export interface MatchOdds {
  homeWin: string;
  draw: string;
  awayWin: string;
}

/**
 * Standard representation of a Match
 */
export interface StandardMatch {
  id: number; // Matches external API ID
  date: Date | string; // Kickoff timestamp
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
  odds?: MatchOdds | null;
  stats?: StandardMatchStats | null;
  lineups?: StandardMatchLineups | null;
  events?: StandardMatchEvent[] | null;
  h2h?: StandardH2HMatch[] | null;
  momentum?: StandardMomentumData | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Standard League Standing / Table Row
 */
export interface StandardStanding {
  id?: number;
  leagueId: number;
  season: number;
  rank: number;
  teamId: number;
  points: number;
  goalsDiff: number;
  form?: string | null; // e.g. "WDLWW"
  played: number;
  win: number;
  draw: number;
  lose: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface StandardStandingWithTeam extends StandardStanding {
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
}
