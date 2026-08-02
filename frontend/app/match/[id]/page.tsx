import React from "react";
import MatchDetails from "./MatchDetails";
import { MatchStatus } from "@/components/MatchCard";
import { StandardMatchStats } from "@/components/MatchStats";
import { StandardMatchLineups } from "@/components/LineupPitch";

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
          totalShots: 14,
          shotsOnGoal: 6,
          cornerKicks: 5,
          fouls: 12,
          yellowCards: 2,
          redCards: 0,
          totalPasses: 480,
        },
        away: {
          possessionPercent: 45,
          totalShots: 11,
          shotsOnGoal: 4,
          cornerKicks: 4,
          fouls: 14,
          yellowCards: 3,
          redCards: 1,
          totalPasses: 395,
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
