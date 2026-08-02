"use client";

import React from "react";
import { Monitor, Calendar, Clock } from "lucide-react";
import styles from "./MatchTimeline.module.css";

// Conforming to StandardMatchEvent structure from Task 3.1
export interface StandardMatchEvent {
  time: {
    elapsed: number;
    extra?: number | null;
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
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string; // e.g., "Normal Goal", "Yellow Card", "Substitution"
  comments?: string | null;
}

interface MatchTimelineProps {
  events?: StandardMatchEvent[] | null;
  homeTeamId?: number | null;
}

/* ==========================================================================
   High-Fidelity SVG Icon Components
   ========================================================================== */

// High-fidelity Soccer Ball SVG for goals
const SoccerBallIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
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

// High-fidelity custom dual arrow for substitutions (Green up/In, Red down/Out)
const SubstitutionIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
    aria-hidden="true"
  >
    {/* Green Up/In Arrow */}
    <path d="M7 17V5M3 9l4-4 4 4" stroke="#10e090" />
    {/* Red Down/Out Arrow */}
    <path d="M17 7v12M13 15l4 4 4-4" stroke="#ef4444" />
  </svg>
);

export default function MatchTimeline({ events, homeTeamId }: MatchTimelineProps) {
  // 1. Sort events chronologically ascending (from 1st minute to 90th+ minute)
  const sortedEvents = React.useMemo(() => {
    if (!events) return [];
    return [...events].sort((a, b) => {
      const timeA = a.time.elapsed + (a.time.extra || 0);
      const timeB = b.time.elapsed + (b.time.extra || 0);
      return timeA - timeB;
    });
  }, [events]);

  // 2. Empty State Handling
  if (sortedEvents.length === 0) {
    return (
      <section className={styles.emptyState} aria-label="Match timeline details">
        <Calendar size={36} className={styles.emptyIcon} />
        <h3 className={styles.emptyText}>Match Timeline Unavailable</h3>
        <p className={styles.eventDetail}>
          No key chronological events (goals, cards, substitutions) have been logged yet for this fixture.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.timelineCard} aria-label="Match chronological timeline">
      <h3 className={styles.timelineTitle}>
        <Clock className={styles.timelineTitleIcon} size={18} />
        Match Timeline
      </h3>

      <div className={styles.timelineContainer}>
        {/* Centered vertical separator line */}
        <div className={styles.timelineLine} />

        {sortedEvents.map((event, idx) => {
          // 3. Align by Team: Determine whether event belongs to home or away side
          // Default to home team if no homeTeamId is passed but team matches name or ID defaults.
          const isHome = homeTeamId ? event.team.id === homeTeamId : idx % 2 === 0;

          // Format match minute label (e.g., 45+2')
          const minuteLabel = event.time.extra
            ? `${event.time.elapsed}+${event.time.extra}'`
            : `${event.time.elapsed}'`;

          // Check for special goal modifiers
          const isOwnGoal = event.type === "Goal" && event.detail.toLowerCase().includes("own goal");
          const isPenalty = event.type === "Goal" && event.detail.toLowerCase().includes("penalty");

          return (
            <div key={`${event.time.elapsed}-${event.type}-${idx}`} className={styles.eventRow}>
              {/* Central Chronological Badge */}
              <div className={styles.minuteBadge} aria-label={`Minute ${minuteLabel}`}>
                {minuteLabel}
              </div>

              {/* Home Team Left Content Card */}
              <div
                className={isHome ? styles.eventContentHome : styles.eventContentAway}
                style={{ visibility: isHome ? "visible" : "hidden", pointerEvents: isHome ? "auto" : "none" }}
              >
                {/* Event specific Icon wrapper closest to center timeline */}
                <div
                  className={`${styles.iconWrap} ${
                    event.type === "Goal"
                      ? styles.iconWrapGoal
                      : event.type === "Card"
                      ? styles.iconWrapCard
                      : event.type === "subst"
                      ? styles.iconWrapSub
                      : styles.iconWrapVar
                  }`}
                >
                  {event.type === "Goal" && <SoccerBallIcon />}
                  {event.type === "Card" && (
                    <span
                      className={`${styles.cardBadge} ${
                        event.detail.toLowerCase().includes("yellow") ? styles.yellowCard : styles.redCard
                      }`}
                    />
                  )}
                  {event.type === "subst" && <SubstitutionIcon />}
                  {event.type === "Var" && <Monitor size={16} />}
                </div>

                {/* Event Text Description Details Block */}
                <div className={styles.textBlock}>
                  {event.type === "Goal" && (
                    <>
                      <span
                        className={`${styles.playerName} ${
                          isOwnGoal ? styles.playerNameOwnGoal : styles.playerNameGoal
                        }`}
                      >
                        {event.player.name}
                        {isOwnGoal && <span className={`${styles.specialLabel} ${styles.ownGoalLabel}`}>OG</span>}
                        {isPenalty && <span className={`${styles.specialLabel} ${styles.penaltyLabel}`}>PEN</span>}
                      </span>
                      {event.assist && event.assist.name && (
                        <span className={styles.assistText}>assist: {event.assist.name}</span>
                      )}
                      {!event.assist?.name && (
                        <span className={styles.eventDetail}>{event.detail}</span>
                      )}
                    </>
                  )}

                  {event.type === "Card" && (
                    <>
                      <span className={styles.playerName}>{event.player.name}</span>
                      <span className={styles.eventDetail}>{event.detail}</span>
                    </>
                  )}

                  {event.type === "subst" && (
                    <>
                      <span className={styles.subPlayerIn}>▲ {event.assist?.name || "Player In"}</span>
                      <span className={styles.subPlayerOut}>▼ {event.player.name}</span>
                    </>
                  )}

                  {event.type === "Var" && (
                    <>
                      <span className={styles.playerName}>{event.player.name}</span>
                      <span className={styles.eventDetail}>{event.detail}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Away Team Right Content Card */}
              <div
                className={!isHome ? styles.eventContentAway : styles.eventContentHome}
                style={{ visibility: !isHome ? "visible" : "hidden", pointerEvents: !isHome ? "auto" : "none" }}
              >
                {/* Event specific Icon wrapper closest to center timeline */}
                <div
                  className={`${styles.iconWrap} ${
                    event.type === "Goal"
                      ? styles.iconWrapGoal
                      : event.type === "Card"
                      ? styles.iconWrapCard
                      : event.type === "subst"
                      ? styles.iconWrapSub
                      : styles.iconWrapVar
                  }`}
                >
                  {event.type === "Goal" && <SoccerBallIcon />}
                  {event.type === "Card" && (
                    <span
                      className={`${styles.cardBadge} ${
                        event.detail.toLowerCase().includes("yellow") ? styles.yellowCard : styles.redCard
                      }`}
                    />
                  )}
                  {event.type === "subst" && <SubstitutionIcon />}
                  {event.type === "Var" && <Monitor size={16} />}
                </div>

                {/* Event Text Description Details Block */}
                <div className={styles.textBlock}>
                  {event.type === "Goal" && (
                    <>
                      <span
                        className={`${styles.playerName} ${
                          isOwnGoal ? styles.playerNameOwnGoal : styles.playerNameGoal
                        }`}
                      >
                        {event.player.name}
                        {isOwnGoal && <span className={`${styles.specialLabel} ${styles.ownGoalLabel}`}>OG</span>}
                        {isPenalty && <span className={`${styles.specialLabel} ${styles.penaltyLabel}`}>PEN</span>}
                      </span>
                      {event.assist && event.assist.name && (
                        <span className={styles.assistText}>assist: {event.assist.name}</span>
                      )}
                      {!event.assist?.name && (
                        <span className={styles.eventDetail}>{event.detail}</span>
                      )}
                    </>
                  )}

                  {event.type === "Card" && (
                    <>
                      <span className={styles.playerName}>{event.player.name}</span>
                      <span className={styles.eventDetail}>{event.detail}</span>
                    </>
                  )}

                  {event.type === "subst" && (
                    <>
                      <span className={styles.subPlayerIn}>▲ {event.assist?.name || "Player In"}</span>
                      <span className={styles.subPlayerOut}>▼ {event.player.name}</span>
                    </>
                  )}

                  {event.type === "Var" && (
                    <>
                      <span className={styles.playerName}>{event.player.name}</span>
                      <span className={styles.eventDetail}>{event.detail}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
