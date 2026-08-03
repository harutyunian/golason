"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Tv, Info, Sparkles, TrendingUp, Clock, MessageSquare } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MatchStatus } from "@/components/MatchCard";
import MatchStats, { StandardMatchStats } from "@/components/MatchStats";
import LineupPitch, { StandardMatchLineups } from "@/components/LineupPitch";
import MatchTimeline, { StandardMatchEvent } from "@/components/MatchTimeline";
import MatchCommentary from "@/components/MatchCommentary";
import MatchH2H from "@/components/MatchH2H";
import PlayerOfTheMatch from "@/components/PlayerOfTheMatch";
import PredictionPoll from "@/components/PredictionPoll";
import StandingsTable from "@/components/StandingsTable";
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
  events?: StandardMatchEvent[] | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'lineups' | 'stats' | 'standings' | 'h2h' | 'ai-insights'>('overview');
  const [sidebarTab, setSidebarTab] = useState<'commentary' | 'timeline'>('commentary');
  const [standings, setStandings] = useState<any[]>([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);

  // Timezone safe on-mount formatting
  useEffect(() => {
    // Asynchronously update to avoid synchronous set state in effect warning
    const timer = setTimeout(() => {
      setIsMounting(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch standings on-demand when Standings tab becomes active!
  useEffect(() => {
    if (activeTab === 'standings' && standings.length === 0 && !isLoadingStandings) {
      setIsLoadingStandings(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/football/standings?league=${match.league.id}&season=2026`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch standings");
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setStandings(data);
          } else {
            throw new Error("Empty standings array returned");
          }
          setIsLoadingStandings(false);
        })
        .catch(err => {
          console.warn("NestJS API standings fetch failed, using realistic dynamic fallback:", err);
          // Generate realistic dynamic fallback standings if backend is offline or empty!
          const mockStandings = [
            {
              rank: 1,
              teamId: match.homeTeam.id,
              points: 74,
              goalsDiff: 32,
              played: 34,
              win: 23,
              draw: 5,
              lose: 6,
              team: { id: match.homeTeam.id, name: match.homeTeam.name, logo: match.homeTeam.logo }
            },
            {
              rank: 2,
              teamId: match.awayTeam.id,
              points: 68,
              goalsDiff: 24,
              played: 34,
              win: 20,
              draw: 8,
              lose: 6,
              team: { id: match.awayTeam.id, name: match.awayTeam.name, logo: match.awayTeam.logo }
            },
            {
              rank: 3,
              teamId: 9991,
              points: 62,
              goalsDiff: 15,
              played: 34,
              win: 18,
              draw: 8,
              lose: 8,
              team: { id: 9991, name: match.homeTeam.name.includes("Legion") ? "Tampa Bay Rowdies" : "Arsenal Under 23", logo: null }
            },
            {
              rank: 4,
              teamId: 9992,
              points: 58,
              goalsDiff: 11,
              played: 34,
              win: 17,
              draw: 7,
              lose: 10,
              team: { id: 9992, name: match.homeTeam.name.includes("Legion") ? "Louisville City FC" : "Tottenham Hotspur", logo: null }
            },
            {
              rank: 5,
              teamId: 9993,
              points: 52,
              goalsDiff: 5,
              played: 34,
              win: 15,
              draw: 7,
              lose: 12,
              team: { id: 9993, name: match.homeTeam.name.includes("Legion") ? "Detroit City FC" : "Manchester United", logo: null }
            }
          ];
          setStandings(mockStandings);
          setIsLoadingStandings(false);
        });
    }
  }, [activeTab, match.league.id, match.homeTeam, match.awayTeam, standings.length, isLoadingStandings]);

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
      } catch {
        // Ignored gracefully
      }

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

  // Filter and extract goalscorers dynamically from match events (SofaScore styled!)
  const homeGoals = match.events?.filter((e) => e.type === "Goal" && e.team.id === match.homeTeamId) || [];
  const awayGoals = match.events?.filter((e) => e.type === "Goal" && e.team.id === match.awayTeamId) || [];
  const hasGoals = homeGoals.length > 0 || awayGoals.length > 0;

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
              <div className={`${styles.statusContainer} ${styles.liveBadge}`} aria-label={`Live in minute ${match.elapsedTime || "LIVE"}`}>
                <span className={styles.liveText}>
                  <span className="live-pulse" />
                  <span className={styles.liveMinute}>
                    {match.elapsedTime && String(match.elapsedTime) !== "null" ? `${match.elapsedTime}'` : "LIVE"}
                  </span>
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

        {/* Dynamic Goalscorers Block (SofaScore styled!) */}
        {hasGoals && (
          <div className={styles.scorersSection} aria-label="Goal scorers details">
            {/* Home Scorers (aligned right) */}
            <div className={styles.homeScorers}>
              {homeGoals.map((event, idx) => (
                <div key={`home-scorer-${idx}`} className={styles.scorerItem}>
                  <span>
                    {event.player.name}{" "}
                    <strong>
                      {event.time.extra ? `${event.time.elapsed}+${event.time.extra}'` : `${event.time.elapsed}'`}
                    </strong>
                    {event.detail.toLowerCase().includes("penalty") ? " (Pen)" : ""}
                    {event.detail.toLowerCase().includes("own") ? " (OG)" : ""}
                  </span>
                  <span className={styles.soccerBallSmall} aria-hidden="true">⚽</span>
                </div>
              ))}
            </div>

            {/* Empty Center Column Alignment Spacer */}
            <div className={styles.scorersSpacer} />

            {/* Away Scorers (aligned left) */}
            <div className={styles.awayScorers}>
              {awayGoals.map((event, idx) => (
                <div key={`away-scorer-${idx}`} className={styles.scorerItem}>
                  <span className={styles.soccerBallSmall} aria-hidden="true">⚽</span>
                  <span>
                    {event.player.name}{" "}
                    <strong>
                      {event.time.extra ? `${event.time.elapsed}+${event.time.extra}'` : `${event.time.elapsed}'`}
                    </strong>
                    {event.detail.toLowerCase().includes("penalty") ? " (Pen)" : ""}
                    {event.detail.toLowerCase().includes("own") ? " (OG)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kickoff Date/Time & League Meta Row (SofaScore styled!) */}
        <div className={styles.metaRow}>
          <span>{isMounting ? "..." : `${kickoffDate.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })} • ${formattedTime}`}</span>
          <span className={styles.metaSeparator}>•</span>
          <span>{match.league.name}</span>
        </div>
      </section>

      {/* Columns Layout */}
      <div className={styles.columnsLayout}>
        {/* Left Column (340px Sidebar) */}
        <aside className={styles.leftColumn}>
          {/* Prediction Poll Widget */}
          <PredictionPoll 
            matchId={match.id} 
            homeTeamName={match.homeTeam.name} 
            awayTeamName={match.awayTeam.name} 
          />

          {/* Match Momentum Placeholder */}
          <section className={styles.sidebarCard} aria-label="Match Momentum">
            <div className={styles.sidebarCardHeader}>
              <TrendingUp size={16} className={styles.sidebarCardIcon} />
              <h3 className={styles.sidebarCardTitle}>Match Momentum</h3>
            </div>
            <div className={styles.momentumPlaceholder}>
              <div className={styles.momentumLabel}>
                <span className={styles.momentumTeamName}>{match.homeTeam.name}</span>
                <span className={styles.momentumTeamName}>{match.awayTeam.name}</span>
              </div>
              <div className={styles.momentumBars}>
                {[12, -8, 20, -15, 10, -5, 30, 25, -18, -10, 5, -12, 18, -25, 15, -5, 8, -12, 22, -18].map((val, i) => {
                  const isHome = val > 0;
                  const heightPercentage = Math.min(Math.abs(val) * 3, 100);
                  return (
                    <div key={i} className={styles.momentumBarWrapper}>
                      <div 
                        className={`${styles.momentumBar} ${isHome ? styles.momentumHome : styles.momentumAway}`}
                        style={{ 
                          height: `${heightPercentage}%`,
                          transform: isHome ? 'scaleY(1)' : 'scaleY(-1)',
                          transformOrigin: isHome ? 'bottom' : 'top'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className={styles.momentumTimeline}>
                <span>0&apos;</span>
                <span>45&apos;</span>
                <span>90&apos;</span>
              </div>
            </div>
          </section>

          {/* Timeline & Commentary Toggle Card */}
          <section className={styles.sidebarCard} aria-label="Timeline and Commentary">
            <div className={styles.sidebarTabsHeader} role="tablist">
              <button
                className={`${styles.sidebarTabBtn} ${sidebarTab === 'commentary' ? styles.activeSidebarTab : ''}`}
                onClick={() => setSidebarTab('commentary')}
                role="tab"
                aria-selected={sidebarTab === 'commentary'}
              >
                <MessageSquare size={14} style={{ marginRight: '6px' }} />
                Commentary
              </button>
              <button
                className={`${styles.sidebarTabBtn} ${sidebarTab === 'timeline' ? styles.activeSidebarTab : ''}`}
                onClick={() => setSidebarTab('timeline')}
                role="tab"
                aria-selected={sidebarTab === 'timeline'}
              >
                <Clock size={14} style={{ marginRight: '6px' }} />
                Timeline
              </button>
            </div>
            <div className={styles.sidebarCardContent}>
              {sidebarTab === 'commentary' ? (
                <MatchCommentary 
                  events={match.events} 
                  homeTeam={match.homeTeam} 
                  awayTeam={match.awayTeam} 
                  lineups={match.lineups}
                  status={match.status}
                  elapsedTime={match.elapsedTime}
                />
              ) : (
                <MatchTimeline events={match.events} homeTeamId={match.homeTeam.id} />
              )}
            </div>
          </section>
        </aside>

        {/* Right Column (1fr Content Column) */}
        <main className={styles.rightColumn}>
          {/* Tab Navigation Bar */}
          <div className={styles.tabsContainer} role="tablist" aria-label="Match details tabs">
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
              className={`${styles.tabBtn} ${activeTab === 'stats' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('stats')}
              role="tab"
              aria-selected={activeTab === 'stats'}
            >
              Statistics
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'standings' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('standings')}
              role="tab"
              aria-selected={activeTab === 'standings'}
            >
              Standings
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'h2h' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('h2h')}
              role="tab"
              aria-selected={activeTab === 'h2h'}
            >
              H2H
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'ai-insights' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('ai-insights')}
              role="tab"
              aria-selected={activeTab === 'ai-insights'}
            >
              AI Insights
            </button>
          </div>

          {/* Tab Panels */}
          <div className={styles.tabContentPanel}>
            {activeTab === 'overview' && (
              <div className={styles.tabGrid}>
                {/* Player of the Match Widget Suite */}
                <PlayerOfTheMatch 
                  lineups={match.lineups} 
                  homeTeam={match.homeTeam} 
                  awayTeam={match.awayTeam} 
                  matchId={match.id}
                />

                {/* About the match */}
                <section className={styles.contentCard} aria-label="About the match">
                  <div className={styles.contentCardHeader}>
                    <Info size={18} className={styles.contentCardIcon} />
                    <h3 className={styles.cardHeaderTitle}>About the Match</h3>
                  </div>
                  <p className={styles.aboutText}>
                    This match between <strong>{match.homeTeam.name}</strong> and <strong>{match.awayTeam.name}</strong> takes place as part of the <strong>{match.league.name}</strong> in {match.league.country}. 
                    The kickoff is scheduled for {isMounting ? "..." : kickoffDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {isMounting ? "--:--" : formattedTime} local time.
                  </p>
                  <div className={styles.aboutStatsGrid}>
                    <div className={styles.aboutStatItem}>
                      <span className={styles.aboutStatLabel}>Venue</span>
                      <span className={styles.aboutStatValue}>Main Stadium</span>
                    </div>
                    <div className={styles.aboutStatItem}>
                      <span className={styles.aboutStatLabel}>Referee</span>
                      <span className={styles.aboutStatValue}>To Be Announced</span>
                    </div>
                  </div>
                </section>

                {/* Where to watch */}
                <section className={styles.contentCard} aria-label="Where to watch">
                  <div className={styles.contentCardHeader}>
                    <Tv size={18} className={styles.contentCardIcon} />
                    <h3 className={styles.cardHeaderTitle}>Where to Watch</h3>
                  </div>
                  <div className={styles.watchOptions}>
                    <div className={styles.watchChannel}>
                      <div className={styles.watchChannelIcon}>📺</div>
                      <div className={styles.watchChannelDetails}>
                        <span className={styles.watchChannelName}>ESPN+</span>
                        <span className={styles.watchChannelType}>Live Stream (Subscription)</span>
                      </div>
                    </div>
                    <div className={styles.watchChannel}>
                      <div className={styles.watchChannelIcon}>📺</div>
                      <div className={styles.watchChannelDetails}>
                        <span className={styles.watchChannelName}>Sky Sports Premier League</span>
                        <span className={styles.watchChannelType}>TV Broadcast (UK)</span>
                      </div>
                    </div>
                    <div className={styles.watchChannel}>
                      <div className={styles.watchChannelIcon}>📱</div>
                      <div className={styles.watchChannelDetails}>
                        <span className={styles.watchChannelName}>Golason App</span>
                        <span className={styles.watchChannelType}>Real-Time Updates & Premium Cast</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'lineups' && (
              <LineupPitch
                lineups={match.lineups}
                homeTeamName={match.homeTeam.name}
                awayTeamName={match.awayTeam.name}
              />
            )}

            {activeTab === 'stats' && (
              <MatchStats 
                stats={match.stats} 
                events={match.events} 
                lineups={match.lineups} 
                homeTeam={match.homeTeam} 
                awayTeam={match.awayTeam} 
              />
            )}

            {activeTab === 'standings' && (
              <section className={styles.contentCard} aria-label="Standings Table">
                <div className={styles.contentCardHeader}>
                  <TrendingUp size={18} className={styles.contentCardIcon} />
                  <h3 className={styles.cardHeaderTitle}>{match.league.name} Standings</h3>
                </div>
                {isLoadingStandings ? (
                  <div className={styles.placeholderRow}>
                    <p className={styles.placeholderText}>Loading standings...</p>
                  </div>
                ) : (
                  <StandingsTable standings={standings} activeTeamId={match.homeTeam.id} />
                )}
              </section>
            )}

            {activeTab === 'h2h' && (
              <MatchH2H 
                homeTeam={match.homeTeam} 
                awayTeam={match.awayTeam} 
                matchId={match.id}
              />
            )}

            {activeTab === 'ai-insights' && (
              <section className={styles.contentCard} aria-label="AI Insights">
                <div className={styles.contentCardHeader}>
                  <Sparkles size={18} className={styles.contentCardIcon} />
                  <h3 className={styles.cardHeaderTitle}>AI Insights</h3>
                </div>
                <div className={styles.placeholderRow}>
                  <p className={styles.placeholderText}>
                    AI Highlights, probability scores, and pre-match analytics will load here in future updates
                  </p>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
