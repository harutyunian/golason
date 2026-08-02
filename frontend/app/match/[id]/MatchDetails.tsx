"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, Flame } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MatchStatus } from "@/components/MatchCard";
import MatchStats, { StandardMatchStats } from "@/components/MatchStats";
import LineupPitch, { StandardMatchLineups } from "@/components/LineupPitch";
import styles from "./match.module.css";

export type SportType = 'FOOTBALL' | 'TENNIS' | 'HOCKEY' | 'UFC';

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

interface MatchDetailsProps {
  initialMatch: StandardMatchWithDetails;
}

// Helper to verify if a string is a standard external URL logo
const isUrl = (str: string) => str && (str.startsWith("http://") || str.startsWith("https://"));

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) => {
  const [error, setError] = React.useState(false);

  if (!logo || error) {
    const safeName = name || "?";
    const initials = safeName.substring(0, 2).toUpperCase();
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
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
    <img 
      src={logo} 
      alt={`${name} Logo`} 
      className={styles.logoImage} 
      onError={() => setError(true)}
      loading="lazy" 
    />
  );
};

export default function MatchDetails({ initialMatch }: MatchDetailsProps) {
  const [match, setMatch] = useState<StandardMatchWithDetails>(initialMatch);
  const [isGoalFlashing, setIsGoalFlashing] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'lineups' | 'h2h'>('overview');

  // Timezone safe on-mount formatting
  useEffect(() => {
    setIsMounting(false);
  }, []);

  // Listen to WebSocket score flashes in real-time!
  useWebSocket(match.id, (updatedMatch) => {
    // Audit check: Only flash if score actually changed (prevent false goal flashes)
    const isScoreChanged =
      updatedMatch.homeScore !== match.homeScore ||
      updatedMatch.awayScore !== match.awayScore;

    setMatch(updatedMatch);

    if (isScoreChanged) {
      console.log("[Goal Alert] Goal scored! Triggering SofaScore flash animation.");
      setIsGoalFlashing(true);

      // Play native audio beep or trigger vibration if available (optional)
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          window.navigator.vibrate([200, 100, 200]);
        }
      } catch (err) {}

      // Reset flash animation classes after 4 seconds
      const timer = setTimeout(() => {
        setIsGoalFlashing(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  });

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

  return (
    <div className={styles.page}>
      {/* Header back button */}
      <Link href="/" className={styles.backNav} role="button" aria-label="Go back to Dashboard">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Main Scoreboard Header (Adds animated flash class dynamically on WebSocket goal update) */}
      <section 
        className={`${styles.scoreboard} ${isGoalFlashing ? "animate-goal-flash" : ""}`}
        aria-label="Scoreboard header details"
      >
        {/* League Details Section */}
        <div className={styles.leagueHeader}>
          <span className={styles.leagueFlag} aria-hidden="true">
            {isUrl(match.league.logo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={match.league.logo} alt={`${match.league.name} Logo`} className={styles.leagueLogoImage} />
            ) : (
              match.league.logo
            )}
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
            {/* Visual GOAL Banner overlay on active flash */}
            {isGoalFlashing && (
              <span className={styles.goalBannerContainer}>
                <Flame className={styles.goalBannerIcon} size={18} />
                GOAL!
              </span>
            )}

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
              <div className={styles.scheduledKickoff}>
                {isMounting ? "--:--" : formattedTime}
              </div>
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
                {isMounting ? "..." : formattedDate}
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

      {/* Tabs Navigation Header */}
      <div className={styles.tabsContainer} role="tablist" aria-label="Match information tabs">
        <button
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
          role="tab"
          aria-selected={activeTab === 'overview'}
        >
          Overview
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'lineups' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('lineups')}
          role="tab"
          aria-selected={activeTab === 'lineups'}
        >
          Lineups
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'h2h' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('h2h')}
          role="tab"
          aria-selected={activeTab === 'h2h'}
        >
          H2H
        </button>
      </div>

      {/* Tab Panels */}
      <div className={styles.tabContentPanel}>
        {activeTab === 'overview' && (
          <MatchStats stats={match.stats} />
        )}

        {activeTab === 'lineups' && (
          <LineupPitch
            lineups={match.lineups}
            homeTeamName={match.homeTeam.name}
            awayTeamName={match.awayTeam.name}
          />
        )}

        {activeTab === 'h2h' && (
          <section className={styles.tabsPlaceholder} aria-label="Head to Head history">
            <Flame size={36} className={styles.placeholderIcon} />
            <h3>Head-to-Head History</h3>
            <p>
              Previous match cards, historic goals ratios, and win-probability graphs will render here in the upcoming sprints!
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
