import React from "react";
import MatchDetails from "./MatchDetails";
import { MatchStatus } from "@/components/MatchCard";

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
