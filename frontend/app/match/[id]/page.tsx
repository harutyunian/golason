import React from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { MatchStatus } from "@/components/MatchCard";
import styles from "./match.module.css";

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

// Team Logo generator with deterministic color hashes for safe fallback graphics
const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) => {
  if (!logo) {
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6"];
    const backgroundColor = colors[Math.abs(hash) % colors.length];

    return (
      <div className={styles.logoFallback} style={{ backgroundColor }} aria-hidden="true">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={`${name} Logo`} className={styles.logoImage} loading="lazy" />
  );
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
    console.warn(`NestJS API offline for MatchID ${matchId}. Using local high-fidelity fallback match.`, err);
    match = getFallbackMatch(matchId);
  }

  // 3. Resolve status strings and format local kickoff times
  const isLive = match.status === "LIVE";
  const isHalftime = match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";
  const isPostponed = match.status === "POSTPONED";
  const isCancelled = match.status === "CANCELLED";

  const showScore = isLive || isHalftime || isFinished;

  const homeVal = match.homeScore ?? 0;
  const awayVal = match.awayScore ?? 0;
  const isHomeWinning = showScore && homeVal > awayVal;
  const isAwayWinning = showScore && awayVal > homeVal;

  const kickoffDate = new Date(match.date);
  const formattedTime = kickoffDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const formattedDate = kickoffDate.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // 4. Formulate Search Engine Schema.org Event Statuses
  const getSchemaEventStatus = () => {
    if (isLive || isHalftime) return "https://schema.org/EventLive";
    if (isFinished) return "https://schema.org/EventCompleted";
    if (isPostponed) return "https://schema.org/EventPostponed";
    if (isCancelled) return "https://schema.org/EventCancelled";
    return "https://schema.org/EventScheduled";
  };

  // 5. Structure dynamic JSON-LD metadata schema for SportsEvent crawlers
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
    <div className={styles.page}>
      {/* Dynamic SEO Structured JSON-LD Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Header back button */}
      <Link href="/" className={styles.backNav} role="button" aria-label="Go back to Dashboard">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Main Scoreboard Header */}
      <section className={styles.scoreboard} aria-label="Scoreboard header details">
        {/* League Details Section */}
        <div className={styles.leagueHeader}>
          <span className={styles.leagueFlag} aria-hidden="true">
            {match.league.logo}
          </span>
          <span className={styles.leagueName}>{match.league.name}</span>
          <span className={styles.leagueCountry}>({match.league.country})</span>
        </div>

        {/* Score Grid Layout */}
        <div className={styles.scoreboardGrid}>
          {/* Home Team */}
          <div className={styles.teamSide}>
            <div className={styles.logoWrapper}>
              <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
            </div>
            <h2 className={`${styles.teamName} ${isHomeWinning ? styles.winningTeam : ""}`}>
              {match.homeTeam.name}
            </h2>
          </div>

          {/* Clock & Score Central Column */}
          <div className={styles.centerScore}>
            {showScore ? (
              <div className={styles.scoresWrapper}>
                <span className={`${styles.scoreDigit} ${isHomeWinning ? styles.scoreWinning : ""}`}>
                  {match.homeScore ?? 0}
                </span>
                <span className={styles.scoreDivider}>-</span>
                <span className={`${styles.scoreDigit} ${isAwayWinning ? styles.scoreWinning : ""}`}>
                  {match.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <div className={styles.scheduledKickoff}>{formattedTime}</div>
            )}

            {/* Match Statuses & Elapsed Minute Badge */}
            {isLive && (
              <div className={`${styles.statusContainer} ${styles.liveBadge}`} aria-label={`Live in minute ${match.elapsedTime}`}>
                <span className={styles.liveText}>
                  <span className="live-pulse" />
                  <span className={styles.liveMinute}>{match.elapsedTime}&apos;</span>
                </span>
              </div>
            )}

            {isHalftime && (
              <div className={`${styles.statusContainer} ${styles.liveBadge}`} aria-label="Live halftime">
                <span className={styles.liveText}>
                  <span className="live-pulse" />
                  <span>HT</span>
                </span>
              </div>
            )}

            {isScheduled && (
              <div className={styles.kickoffDate} aria-label={`Kickoff date: ${formattedDate}`}>
                {formattedDate}
              </div>
            )}

            {isFinished && <div className={styles.statusContainer}>FINISHED</div>}
            {isPostponed && <div className={styles.statusContainer}>POSTPONED</div>}
            {isCancelled && <div className={styles.statusContainer}>CANCELLED</div>}
          </div>

          {/* Away Team */}
          <div className={styles.teamSide}>
            <div className={styles.logoWrapper}>
              <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
            </div>
            <h2 className={`${styles.teamName} ${isAwayWinning ? styles.winningTeam : ""}`}>
              {match.awayTeam.name}
            </h2>
          </div>
        </div>
      </section>

      {/* Micro-sprint widget tabs placeholder */}
      <section className={styles.tabsPlaceholder} aria-label="Interactive Match Panels">
        <BarChart2 size={36} className={styles.placeholderIcon} />
        <h3>Match Insights Panels</h3>
        <p>
          Interactive visual football pitch formations, player performance ratings, vertical timeline event logs, and dynamic Attack Momentum graphs will render here in the upcoming tasks.
        </p>
      </section>
    </div>
  );
}
