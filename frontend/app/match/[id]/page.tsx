import React from "react";
import MatchDetails from "./MatchDetails";
import { MatchStatus } from "@/components/MatchCard";
import { StandardMatchStats } from "@/components/MatchStats";
import { StandardMatchLineups } from "@/components/LineupPitch";
import { StandardMatchEvent } from "@/components/MatchTimeline";

// Dynamic support types
export type SportType = 'FOOTBALL' | 'TENNIS' | 'HOCKEY' | 'UFC';

// Forces server-side dynamic rendering on runtime (vital for live scores and SEO!)
export const dynamic = "force-dynamic";

interface TeamDetails {
  id: number;
  name: string;
  logo?: string | null;
}

interface LeagueDetails {
  id: number;
  name: string;
  country: string;
  logo: string;
}

interface StandardMatchWithDetails {
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
  league: LeagueDetails;
  homeTeam: TeamDetails;
  awayTeam: TeamDetails;
  stats?: StandardMatchStats | null;
  lineups?: StandardMatchLineups | null;
  events?: StandardMatchEvent[] | null;
}

interface MatchPageProps {
  params: Promise<{ id: string }> | { id: string };
}

// Graceful fallback mock match in case the NestJS server is down during compilation/rendering
const getFallbackMatch = (idStr: string): StandardMatchWithDetails => {
  const matchId = Number(idStr) || 101;
  const mockMatches: { [key: number]: StandardMatchWithDetails } = {
    101: {
      id: 101,
      date: "2026-08-02T15:00:00",
      status: "LIVE",
      elapsedTime: 64,
      sport: "FOOTBALL",
      leagueId: 1,
      homeTeamId: 11,
      awayTeamId: 12,
      homeScore: 2,
      awayScore: 1,
      league: { id: 1, name: "Premier League", country: "England", logo: "🇬🇧" },
      homeTeam: { id: 11, name: "Arsenal" },
      awayTeam: { id: 12, name: "Chelsea" },
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
          formation: "4-3-3",
          startXI: [
            { id: 1, name: "Ramsdale", number: 1, position: "G", grid: "1:1", rating: 6.8 },
            { id: 2, name: "White", number: 4, position: "D", grid: "2:1", rating: 7.1 },
            { id: 3, name: "Saliba", number: 2, position: "D", grid: "2:2", rating: 7.5 },
            { id: 4, name: "Gabriel", number: 6, position: "D", grid: "2:3", rating: 7.4 },
            { id: 5, name: "Zinchenko", number: 35, position: "D", grid: "2:4", rating: 6.9 },
            { id: 6, name: "Odegaard", number: 8, position: "M", grid: "3:1", rating: 8.2 },
            { id: 7, name: "Partey", number: 5, position: "M", grid: "3:2", rating: 7.2 },
            { id: 8, name: "Xhaka", number: 34, position: "M", grid: "3:3", rating: 7.0 },
            { id: 9, name: "Saka", number: 7, position: "F", grid: "4:1", rating: 8.5 },
            { id: 10, name: "Jesus", number: 9, position: "F", grid: "4:2", rating: 7.3 },
            { id: 11, name: "Martinelli", number: 11, position: "F", grid: "4:3", rating: 7.9 },
          ],
          substitutes: [
            { id: 12, name: "Turner", number: 30, position: "G", rating: null },
            { id: 13, name: "Holding", number: 16, position: "D", rating: 6.2 },
            { id: 14, name: "Trossard", number: 19, position: "F", rating: 7.0 },
            { id: 15, name: "Jorginho", number: 20, position: "M", rating: 6.7 },
          ],
          coach: { id: 50, name: "Mikel Arteta" },
        },
        away: {
          formation: "3-4-2-1",
          startXI: [
            { id: 101, name: "Kepa", number: 1, position: "G", grid: "1:1", rating: 6.4 },
            { id: 102, name: "Fofana", number: 33, position: "D", grid: "2:1", rating: 6.7 },
            { id: 103, name: "Silva", number: 6, position: "D", grid: "2:2", rating: 7.2 },
            { id: 104, name: "Koulibaly", number: 26, position: "D", grid: "2:3", rating: 6.9 },
            { id: 105, name: "James", number: 24, position: "M", grid: "3:1", rating: 7.1 },
            { id: 106, name: "Enzo", number: 5, position: "M", grid: "3:2", rating: 7.3 },
            { id: 107, name: "Kovacic", number: 8, position: "M", grid: "3:3", rating: 6.8 },
            { id: 108, name: "Chilwell", number: 21, position: "M", grid: "3:4", rating: 7.0 },
            { id: 109, name: "Felix", number: 11, position: "M", grid: "4:1", rating: 7.4 },
            { id: 110, name: "Mudryk", number: 15, position: "M", grid: "4:2", rating: 6.5 },
            { id: 111, name: "Havertz", number: 29, position: "F", grid: "5:1", rating: 7.1 },
          ],
          substitutes: [
            { id: 112, name: "Mendy", number: 16, position: "G", rating: null },
            { id: 113, name: "Badiashile", number: 4, position: "D", rating: 6.5 },
            { id: 114, name: "Mount", number: 19, position: "M", rating: 6.8 },
            { id: 115, name: "Sterling", number: 17, position: "F", rating: 7.1 },
          ],
          coach: { id: 150, name: "Graham Potter" },
        },
      },
      events: [
        {
          time: { elapsed: 14 },
          team: { id: 11, name: "Arsenal" },
          player: { id: 10, name: "Jesus" },
          assist: { id: 6, name: "Odegaard" },
          type: "Goal",
          detail: "Normal Goal",
        },
        {
          time: { elapsed: 32 },
          team: { id: 12, name: "Chelsea" },
          player: { id: 111, name: "Havertz" },
          type: "Goal",
          detail: "Penalty",
        },
        {
          time: { elapsed: 41 },
          team: { id: 11, name: "Arsenal" },
          player: { id: 8, name: "Xhaka" },
          type: "Card",
          detail: "Yellow Card",
        },
        {
          time: { elapsed: 58 },
          team: { id: 11, name: "Arsenal" },
          player: { id: 11, name: "Martinelli" },
          assist: { id: 9, name: "Saka" },
          type: "Goal",
          detail: "Normal Goal",
        },
        {
          time: { elapsed: 61 },
          team: { id: 12, name: "Chelsea" },
          player: { id: 110, name: "Mudryk" },
          assist: { id: 115, name: "Sterling" },
          type: "subst",
          detail: "Substitution",
        },
      ],
    },
    102: {
      id: 102,
      date: "2026-08-02T16:15:00",
      status: "HALFTIME",
      elapsedTime: null,
      sport: "FOOTBALL",
      leagueId: 2,
      homeTeamId: 21,
      awayTeamId: 22,
      homeScore: 0,
      awayScore: 0,
      league: { id: 2, name: "La Liga", country: "Spain", logo: "🇪🇸" },
      homeTeam: { id: 21, name: "Real Madrid" },
      awayTeam: { id: 22, name: "Barcelona" },
      stats: null,
      lineups: null,
    },
    103: {
      id: 103,
      date: "2026-08-02T20:45:00",
      status: "SCHEDULED",
      elapsedTime: null,
      sport: "FOOTBALL",
      leagueId: 3,
      homeTeamId: 31,
      awayTeamId: 32,
      homeScore: null,
      awayScore: null,
      league: { id: 3, name: "Serie A", country: "Italy", logo: "🇮🇹" },
      homeTeam: { id: 31, name: "Inter Milan" },
      awayTeam: { id: 32, name: "AC Milan" },
      stats: null,
      lineups: null,
    },
    104: {
      id: 104,
      date: "2026-08-02T12:30:00",
      status: "FINISHED",
      elapsedTime: null,
      sport: "FOOTBALL",
      leagueId: 1,
      homeTeamId: 13,
      awayTeamId: 14,
      homeScore: 3,
      awayScore: 1,
      league: { id: 1, name: "Premier League", country: "England", logo: "🇬🇧" },
      homeTeam: { id: 13, name: "Manchester City" },
      awayTeam: { id: 14, name: "Manchester United" },
      stats: null,
      lineups: null,
    },
    105: {
      id: 105,
      date: "2026-08-02T18:00:00",
      status: "SCHEDULED",
      elapsedTime: null,
      sport: "FOOTBALL",
      leagueId: 2,
      homeTeamId: 23,
      awayTeamId: 24,
      homeScore: null,
      awayScore: null,
      league: { id: 2, name: "La Liga", country: "Spain", logo: "🇪🇸" },
      homeTeam: { id: 23, name: "Atletico Madrid" },
      awayTeam: { id: 24, name: "Sevilla" },
      stats: null,
      lineups: null,
    },
  };

  return mockMatches[matchId] || mockMatches[101];
};

export default async function MatchProfilePage({ params }: MatchPageProps) {
  // 1. Resolve unified route parameters supporting both Next.js 14 & 15 architectures
  const resolvedParams = await params;
  const matchId = resolvedParams.id;

  let match: StandardMatchWithDetails;

  try {
    // 2. Fetch match information server-side from NestJS API endpoint
    const res = await fetch(`http://localhost:3001/football/fixtures/${matchId}`, {
      cache: "no-store",
    });

    if (res.ok) {
      match = await res.json();
    } else {
      throw new Error(`Failed to fetch match: status ${res.status}`);
    }
  } catch (err) {
    console.warn(`NestJS API offline for MatchID ${matchId}. Using local fallback match.`, err);
    match = getFallbackMatch(matchId);
  }

  const isLive = match.status === "LIVE";
  const isHalftime = match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const isPostponed = match.status === "POSTPONED";
  const isCancelled = match.status === "CANCELLED";

  // 3. Formulate Search Engine Schema.org Event Statuses
  const getSchemaEventStatus = () => {
    if (isLive || isHalftime) return "https://schema.org/EventLive";
    if (isFinished) return "https://schema.org/EventCompleted";
    if (isPostponed) return "https://schema.org/EventPostponed";
    if (isCancelled) return "https://schema.org/EventCancelled";
    return "https://schema.org/EventScheduled";
  };

  // 4. Structure dynamic JSON-LD metadata schema for SportsEvent crawlers (SEO target)
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    "startDate": match.date,
    "sport": "https://en.wikipedia.org/wiki/Association_football",
    "eventStatus": getSchemaEventStatus(),
    "homeTeam": {
      "@type": "SportsTeam",
      "name": match.homeTeam.name,
      "logo": match.homeTeam.logo || undefined,
    },
    "awayTeam": {
      "@type": "SportsTeam",
      "name": match.awayTeam.name,
      "logo": match.awayTeam.logo || undefined,
    },
    "location": {
      "@type": "Place",
      "name": "Local Stadium",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": match.league.country,
      },
    },
  };

  return (
    <>
      {/* Dynamic SEO Structured JSON-LD Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Render the full high-fidelity visual layout */}
      <MatchDetails initialMatch={match} />
    </>
  );
}
