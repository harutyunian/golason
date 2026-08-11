'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import TeamLink from './TeamLink';
import styles from './MatchCard.module.css';

/**
 * Standard Match statuses mirroring backend interfaces
 */
export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALFTIME'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

/**
 * Team nested interface
 */
interface TeamDetails {
  id: number;
  name: string;
  logo?: string | null;
}

/**
 * Flexible component props to accept a full match object OR flat props
 */
export interface MatchCardProps {
  match?: {
    id: number;
    status: MatchStatus;
    elapsedTime?: number | null;
    homeTeam: TeamDetails;
    awayTeam: TeamDetails;
    homeScore?: number | null;
    awayScore?: number | null;
    date: Date | string;
  };
  id?: number;
  status?: MatchStatus;
  elapsedTime?: number | null;
  homeTeam?: TeamDetails;
  awayTeam?: TeamDetails;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: Date | string;
  isBookmarked?: boolean;
  onToggleBookmark?: (matchId: number) => void;
}

/**
 * Team Logo component with automatic fallback to high-quality initials
 * when a image URL is missing, invalid, or fails to load.
 */
const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) => {
  const [error, setError] = useState(false);

  if (!logo || error) {
    const safeName = name || '?';
    const initials = safeName.substring(0, 2).toUpperCase();
    
    // Generate a deterministic background color based on team name
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#14b8a6', // teal
    ];
    const backgroundColor = colors[Math.abs(hash) % colors.length];

    return (
      <div 
        className={styles.logoFallback} 
        style={{ backgroundColor }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={`${name} Logo`}
      className={styles.logoImage}
      width={22}
      height={22}
      onError={() => setError(true)}
    />
  );
};

export default function MatchCard({
  match,
  id,
  status,
  elapsedTime,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  date,
  isBookmarked,
  onToggleBookmark,
}: MatchCardProps) {
  // Resolve unified fields from either the `match` object or top-level props
  const resolvedId = match?.id ?? id ?? 0;
  const resolvedStatus = match?.status ?? status ?? 'SCHEDULED';
  const resolvedElapsedTime = match?.elapsedTime ?? elapsedTime;
  const resolvedHomeTeam = match?.homeTeam ?? homeTeam ?? { id: 0, name: 'Home Team' };
  const resolvedAwayTeam = match?.awayTeam ?? awayTeam ?? { id: 0, name: 'Away Team' };
  const resolvedHomeScore = match?.homeScore ?? homeScore;
  const resolvedAwayScore = match?.awayScore ?? awayScore;
  const resolvedDate = match?.date ?? date ?? new Date();

  const [mounted, setMounted] = useState(false);
  const [kickoffTime, setKickoffTime] = useState('--:--');

  // Prevent timezone-drift/hydration mismatch by formatting localized hours only on mount
  useEffect(() => {
    setMounted(true);
    try {
      const dateObj = typeof resolvedDate === 'string' ? new Date(resolvedDate) : resolvedDate;
      if (!isNaN(dateObj.getTime())) {
        setKickoffTime(
          dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        );
      }
    } catch (err) {
      console.error('Error formatting match kickoff time:', err);
    }
  }, [resolvedDate]);

  const isLive = resolvedStatus === 'LIVE';
  const isHalftime = resolvedStatus === 'HALFTIME';
  const isFinished = resolvedStatus === 'FINISHED';
  const isScheduled = resolvedStatus === 'SCHEDULED';
  const isPostponed = resolvedStatus === 'POSTPONED';
  const isCancelled = resolvedStatus === 'CANCELLED';

  const showScore = isLive || isHalftime || isFinished;

  // Highlights winning/leading teams
  const homeVal = resolvedHomeScore ?? 0;
  const awayVal = resolvedAwayScore ?? 0;
  const isHomeWinning = showScore && homeVal > awayVal;
  const isAwayWinning = showScore && awayVal > homeVal;

  // Build high-quality screen reader labels (A11y ARIA requirement)
  const getStatusAriaText = () => {
    if (isLive) return `Live in minute ${resolvedElapsedTime ?? ''}`;
    if (isHalftime) return 'Live at Halftime';
    if (isFinished) return 'Finished';
    if (isScheduled) return `Scheduled kickoff at ${kickoffTime}`;
    if (isPostponed) return 'Postponed';
    if (isCancelled) return 'Cancelled';
    return resolvedStatus;
  };

  const getScoreAriaText = () => {
    if (showScore) return `Score: ${resolvedHomeTeam.name} ${resolvedHomeScore ?? 0}, ${resolvedAwayTeam.name} ${resolvedAwayScore ?? 0}`;
    return 'Match not started';
  };

  const ariaLabel = `Match: ${resolvedHomeTeam.name} versus ${resolvedAwayTeam.name}. Status: ${getStatusAriaText()}. ${getScoreAriaText()}.`;

  return (
    <div className={styles.card}>
      <Link
        href={`/match/${resolvedId}`}
        className={styles.cardOverlay}
        aria-label="View match details"
        prefetch={false}
      />

      {/* Left Section: Time/Status */}
      <div className={styles.statusSection}>
        {isLive && (
          <div className={styles.liveContainer}>
            <span className={styles.liveMinute} aria-hidden="true">
              {resolvedElapsedTime ?? 0}&apos;
            </span>
            <span className="live-pulse" aria-hidden="true" />
          </div>
        )}

        {isHalftime && (
          <div className={styles.liveContainer}>
            <span className={styles.liveMinute} aria-hidden="true">
              HT
            </span>
            <span className="live-pulse" aria-hidden="true" />
          </div>
        )}

        {isScheduled && (
          <span className={styles.scheduled} aria-hidden="true">
            {mounted ? kickoffTime : '--:--'}
          </span>
        )}

        {isFinished && (
          <span className={styles.statusText} aria-hidden="true">
            FT
          </span>
        )}

        {isPostponed && (
          <span className={styles.statusText} aria-hidden="true">
            Postp.
          </span>
        )}

        {isCancelled && (
          <span className={styles.statusText} aria-hidden="true">
            Canc.
          </span>
        )}
      </div>

      {/* Middle and Right Sections Layout container */}
      <div className={styles.matchDetails}>
        {/* Middle Section: Teams */}
        <div className={styles.teamsSection} aria-hidden="true">
          <div className={`${styles.teamRow} ${isHomeWinning ? styles.winning : ''}`}>
            <TeamLink teamId={resolvedHomeTeam.id} className={styles.cardTeamLink}>
              <div className={styles.logoContainer}>
                <TeamLogo logo={resolvedHomeTeam.logo} name={resolvedHomeTeam.name} />
              </div>
              <span className={styles.teamName}>{resolvedHomeTeam.name}</span>
            </TeamLink>
          </div>

          <div className={`${styles.teamRow} ${isAwayWinning ? styles.winning : ''}`}>
            <TeamLink teamId={resolvedAwayTeam.id} className={styles.cardTeamLink}>
              <div className={styles.logoContainer}>
                <TeamLogo logo={resolvedAwayTeam.logo} name={resolvedAwayTeam.name} />
              </div>
              <span className={styles.teamName}>{resolvedAwayTeam.name}</span>
            </TeamLink>
          </div>
        </div>

        {/* Right Section: Score display */}
        <div className={styles.scoresSection} aria-hidden="true">
          <div className={`${styles.scoreRow} ${isHomeWinning ? styles.scoreWinning : ''}`}>
            {showScore ? resolvedHomeScore ?? 0 : ''}
          </div>
          <div className={`${styles.scoreRow} ${isAwayWinning ? styles.scoreWinning : ''}`}>
            {showScore ? resolvedAwayScore ?? 0 : ''}
          </div>
        </div>

        {/* Dynamic Star Bookmark Action */}
        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(resolvedId);
            }}
            className={`${styles.starBtn} ${isBookmarked ? styles.starActive : ''}`}
            aria-label={isBookmarked ? 'Remove match from bookmarks' : 'Add match to bookmarks'}
          >
            <Star size={16} fill={isBookmarked ? 'var(--color-primary, #0070f3)' : 'transparent'} />
          </button>
        )}
      </div>
    </div>
  );
}
