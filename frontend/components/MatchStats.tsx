"use client";

import React from "react";
import styles from "./MatchStats.module.css";

export interface TeamStats {
  possessionPercent?: number | null;
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

interface MatchStatsProps {
  stats?: StandardMatchStats | null;
}

interface StatRowConfig {
  key: keyof TeamStats;
  label: string;
  isLowerBetter?: boolean;
}

const STATS_CONFIG: StatRowConfig[] = [
  { key: "possessionPercent", label: "Ball Possession" },
  { key: "totalShots", label: "Total Shots" },
  { key: "shotsOnGoal", label: "Shots on Target" },
  { key: "cornerKicks", label: "Corner Kicks" },
  { key: "fouls", label: "Fouls", isLowerBetter: true },
  { key: "yellowCards", label: "Yellow Cards", isLowerBetter: true },
  { key: "redCards", label: "Red Cards", isLowerBetter: true },
  { key: "totalPasses", label: "Total Passes" },
];

export default function MatchStats({ stats }: MatchStatsProps) {
  // If no stats are provided, or home/away objects are missing, display the empty state
  if (!stats || !stats.home || !stats.away) {
    return (
      <div className={styles.emptyState}>
        <p>Stats are currently unavailable for this match.</p>
      </div>
    );
  }

  // Filter config to only include stats that have at least one non-null/non-undefined value
  const activeStats = STATS_CONFIG.filter((config) => {
    const homeVal = stats.home[config.key];
    const awayVal = stats.away[config.key];
    return homeVal !== undefined && homeVal !== null && awayVal !== undefined && awayVal !== null;
  });

  if (activeStats.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>Stats are currently unavailable for this match.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {activeStats.map((config) => {
        const homeVal = stats.home[config.key] ?? 0;
        const awayVal = stats.away[config.key] ?? 0;

        // Calculate comparison percentages for the progress bars
        let homeBarWidth = 0;
        let awayBarWidth = 0;

        if (config.key === "possessionPercent") {
          // Ball possession is already a percentage out of 100
          homeBarWidth = homeVal;
          awayBarWidth = awayVal;
        } else {
          const total = homeVal + awayVal;
          if (total > 0) {
            homeBarWidth = (homeVal / total) * 100;
            awayBarWidth = (awayVal / total) * 100;
          } else {
            homeBarWidth = 0;
            awayBarWidth = 0;
          }
        }

        // SofaScore color rules: Highlight the leader/better value in primary brand green
        let isHomeLeader = false;
        let isAwayLeader = false;

        if (homeVal !== awayVal) {
          if (config.isLowerBetter) {
            isHomeLeader = homeVal < awayVal;
            isAwayLeader = awayVal < homeVal;
          } else {
            isHomeLeader = homeVal > awayVal;
            isAwayLeader = awayVal > homeVal;
          }
        }

        const formatValue = (val: number, key: keyof TeamStats) => {
          if (key === "possessionPercent") {
            return `${val}%`;
          }
          return val.toString();
        };

        return (
          <div key={config.key} className={styles.row}>
            {/* Header: numbers and label */}
            <div className={styles.rowHeader}>
              <span className={`${styles.value} ${isHomeLeader ? styles.leader : ""}`}>
                {formatValue(homeVal, config.key)}
              </span>
              <span className={styles.label}>{config.label}</span>
              <span className={`${styles.value} ${isAwayLeader ? styles.leader : ""}`}>
                {formatValue(awayVal, config.key)}
              </span>
            </div>

            {/* Two horizontal progress bars facing each other */}
            <div className={styles.barContainer}>
              {/* Home Team Progress Bar (fills right-to-left) */}
              <div className={styles.barHalf}>
                <div
                  className={`${styles.progressBar} ${styles.homeBar} ${
                    isHomeLeader ? styles.leaderBar : ""
                  }`}
                  style={{ width: `${homeBarWidth}%` }}
                  aria-hidden="true"
                />
              </div>

              {/* Away Team Progress Bar (fills left-to-right) */}
              <div className={styles.barHalf}>
                <div
                  className={`${styles.progressBar} ${styles.awayBar} ${
                    isAwayLeader ? styles.leaderBar : ""
                  }`}
                  style={{ width: `${awayBarWidth}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
