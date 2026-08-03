"use client";

import React from "react";
import styles from "./MatchCommentary.module.css";
import { StandardMatchEvent } from "./MatchTimeline";
import { StandardMatchLineups } from "./LineupPitch";
import PlayerLink from "./PlayerLink";

interface TeamProps {
  id: number;
  name: string;
  logo?: string | null;
}

interface MatchCommentaryProps {
  events?: StandardMatchEvent[] | null;
  homeTeam: TeamProps;
  awayTeam: TeamProps;
  lineups?: StandardMatchLineups | null;
  status: string;
  elapsedTime?: number | null;
}

interface CommentaryItem {
  id: string;
  elapsed: number;
  extra?: number | null;
  type: "Goal" | "Card" | "subst" | "Corner" | "Save" | "Foul" | "Info";
  teamId?: number;
  teamName?: string;
  playerId?: number | null;
  playerName?: string;
  title: string;
  text: string;
  isHome?: boolean;
  detail?: string;
}

/* ==========================================================================
   High-Fidelity SVG Icon Components
   ========================================================================== */

// Spinning Soccer Ball for Goals
const SoccerBallIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.spinningBall}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 2-3 3 1.5 3h3L15 5z" />
    <path d="M9 5 4.5 9.5 2.5 13.5v3l3-1.5L9 11" />
    <path d="M15 5 19.5 9.5 21.5 13.5v3l-3-1.5L15 11" />
    <path d="m9 11-1.5 5h9l-1.5-5" />
    <path d="M7.5 16 12 22l4.5-6" />
  </svg>
);

// Card Booking SVG
const CardIcon = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={color}
    stroke="none"
    aria-hidden="true"
  >
    <rect x="6" y="3" width="12" height="18" rx="2" ry="2" />
  </svg>
);

// Substitution Arrow (Green up, Red down)
const SubstitutionIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17V5M3 9l4-4 4 4" stroke="#10e090" />
    <path d="M17 7v12M13 15l4 4 4-4" stroke="#ef4444" />
  </svg>
);

// Corner Flag SVG
const CornerFlagIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 22V2" strokeWidth="2.5" />
    <path d="M4 4l12 4-12 4" fill="currentColor" />
  </svg>
);

// Goalkeeper Glove / Goalpost SVG
const SaveIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 21V3h18v18" strokeWidth="2" />
    <circle cx="12" cy="11" r="2.5" fill="currentColor" />
    <path d="M8 11h2M14 11h2" />
  </svg>
);

// Whistle / Referee SVG
const WhistleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 4h-4a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <circle cx="11" cy="8" r="1" fill="currentColor" />
  </svg>
);

// Clock / Info SVG
const InfoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default function MatchCommentary({
  events,
  homeTeam,
  awayTeam,
  lineups,
  status,
  elapsedTime,
}: MatchCommentaryProps) {
  
  // Deterministic, high-fidelity commentary merger/generator
  const commentaries = React.useMemo(() => {
    const list: CommentaryItem[] = [];
    const rawEvents = events || [];

    // 1. Map existing raw API events to CommentaryItem format
    rawEvents.forEach((event, idx) => {
      const isHome = event.team.id === homeTeam.id;
      const key = `raw-${event.time.elapsed}-${event.type}-${idx}`;
      
      let type: CommentaryItem["type"] = "Info";
      let title = "";
      let text = "";

      if (event.type === "Goal") {
        type = "Goal";
        const isOwnGoal = event.detail.toLowerCase().includes("own goal");
        const isPenalty = event.detail.toLowerCase().includes("penalty");
        title = "GOAL!";
        
        if (isOwnGoal) {
          text = `Unfortunate moment for ${event.player.name}! He accidentally deflects the ball into his own net. Own Goal for ${isHome ? awayTeam.name : homeTeam.name}!`;
        } else if (isPenalty) {
          text = `${event.player.name} steps up under immense pressure and coolly converts the penalty, sending the keeper the wrong way!`;
        } else if (event.assist && event.assist.name) {
          text = `Brilliant team play! ${event.player.name} strikes with clinical precision inside the box, finishing off a beautiful assist by ${event.assist.name}.`;
        } else {
          text = `What a goal! ${event.player.name} unleashes a fantastic strike that beats the goalkeeper into the corner. Goal for ${event.team.name}!`;
        }
      } else if (event.type === "Card") {
        type = "Card";
        const isYellow = event.detail.toLowerCase().includes("yellow");
        title = isYellow ? "Yellow Card" : "Red Card";
        text = `${event.player.name} receives a ${event.detail.toLowerCase()} from the referee for a late, reckless challenge.`;
      } else if (event.type === "subst") {
        type = "subst";
        title = "Substitution";
        const playerIn = event.assist?.name || "Incoming Player";
        const playerOut = event.player.name;
        text = `Tactical shift: ${playerIn} is brought on to replace ${playerOut} for ${event.team.name}.`;
      } else if (event.type === "Var") {
        type = "Info";
        title = "VAR Review";
        text = `Play is temporarily paused as the referee consults VAR for ${event.detail.toLowerCase()}.`;
      }

      list.push({
        id: key,
        elapsed: event.time.elapsed,
        extra: event.time.extra,
        type,
        teamId: event.team.id,
        teamName: event.team.name,
        playerId: event.player.id,
        playerName: event.player.name,
        title,
        text,
        isHome,
        detail: event.detail,
      });
    });

    // If pre-match/scheduled, show pre-match scheduled message
    if (status === "SCHEDULED") {
      list.push({
        id: "pre-match",
        elapsed: 0,
        type: "Info",
        title: "Match Scheduled",
        text: `The match between ${homeTeam.name} and ${awayTeam.name} is scheduled to start soon. Full play-by-play commentary will begin at kickoff!`,
        playerName: "REF",
      });
      return list;
    }

    const hasStarted = status === "LIVE" || status === "HALFTIME" || status === "FINISHED";

    // 2. Add Kick-off Milestone
    if (hasStarted) {
      list.push({
        id: "milestone-kickoff",
        elapsed: 1,
        type: "Info",
        title: "Match Kick-Off",
        text: `We are underway! The referee blows the whistle and the match gets started.`,
        playerName: "REF",
      });
    }

    // 3. Add Half-time Milestone
    if (status === "HALFTIME" || status === "FINISHED") {
      list.push({
        id: "milestone-halftime",
        elapsed: 45,
        type: "Info",
        title: "Half-Time Whistle",
        text: `The referee blows for half-time. A captivating first 45 minutes of football ends with the teams heading down the tunnel.`,
        playerName: "REF",
      });
    }

    // 4. Add Full-time Milestone
    if (status === "FINISHED") {
      list.push({
        id: "milestone-fulltime",
        elapsed: 90,
        type: "Info",
        title: "Full-Time Whistle",
        text: `There goes the final whistle! The match has concluded after 90 minutes of intensive battle.`,
        playerName: "REF",
      });
    }

    // Sort descending chronologically (90' down to 1')
    return list.sort((a, b) => {
      const timeA = a.elapsed + (a.extra || 0);
      const timeB = b.elapsed + (b.extra || 0);
      if (timeB !== timeA) return timeB - timeA;
      if (a.type === "Goal" && b.type !== "Goal") return -1;
      if (b.type === "Goal" && a.type !== "Goal") return 1;
      return 0;
    });
  }, [events, homeTeam, awayTeam, status]);

  // Helper to extract player's initials
  const getInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={styles.commentaryContainer} role="feed" aria-label="Play-by-play Live Commentary">
      {commentaries.map((item) => {
        const isGoal = item.type === "Goal";
        const isCard = item.type === "Card";
        const isSubst = item.type === "subst";
        const isCorner = item.type === "Corner";
        const isSave = item.type === "Save";
        const isFoul = item.type === "Foul";
        const isInfo = item.type === "Info";

        // Determine left border coloring classes
        let typeClass = styles.itemInfo;
        if (isGoal) typeClass = styles.itemGoal;
        else if (isCard) {
          const detailStr = item.detail?.toLowerCase() || "";
          typeClass = detailStr.includes("red") ? styles.itemRedCard : styles.itemYellowCard;
        } else if (isSubst) typeClass = styles.itemSubst;
        else if (isCorner) typeClass = styles.itemCorner;
        else if (isSave) typeClass = styles.itemSave;
        else if (isFoul) typeClass = styles.itemFoul;

        // Determine team colors for avatar border (e.g. Green for Home, Orange for Away, Gray for official/general)
        const isActionHome = item.isHome;
        const avatarBorderColor = isActionHome === undefined 
          ? "var(--text-muted)" 
          : isActionHome 
            ? "#10e090" 
            : "#f97316";

        return (
          <article 
            key={item.id} 
            className={`${styles.commentaryItem} ${typeClass}`}
            aria-labelledby={`title-${item.id}`}
          >
            {/* Header segment with minute and icon */}
            <div className={styles.itemHeader}>
              <span className={styles.elapsedBadge}>
                {item.extra ? `${item.elapsed}+${item.extra}'` : `${item.elapsed}'`}
              </span>
              
              <div className={styles.headerIcon}>
                {isGoal && <SoccerBallIcon />}
                {isCard && <CardIcon color={item.detail?.toLowerCase().includes("yellow") ? "#facc15" : "#ef4444"} />}
                {isSubst && <SubstitutionIcon />}
                {isCorner && <CornerFlagIcon />}
                {isSave && <SaveIcon />}
                {isFoul && <WhistleIcon />}
                {isInfo && <InfoIcon />}
              </div>

              <h4 id={`title-${item.id}`} className={styles.itemTitle}>
                {item.title}
              </h4>
            </div>

            {/* Body segment with Player Avatar and Text */}
            <div className={styles.itemBody}>
              {item.playerName && item.playerName !== "REF" && (
                <PlayerLink playerId={item.playerId}>
                  <div 
                    className={styles.playerAvatar} 
                    style={{ borderColor: avatarBorderColor }}
                    aria-hidden="true"
                  >
                    {getInitials(item.playerName)}
                  </div>
                </PlayerLink>
              )}
              <div className={styles.bodyTextWrapper}>
                <p className={styles.commentaryText}>{item.text}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
