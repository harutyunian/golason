"use client";

import React from "react";
import { Shield, Activity, RefreshCw, Eye, Award, HelpCircle } from "lucide-react";
import styles from "./MatchStats.module.css";

export interface TeamStats {
  possessionPercent?: number | null;
  expectedGoals?: number | null; // xG
  bigChances?: number | null;
  totalShots?: number | null;
  shotsOnGoal?: number | null;
  cornerKicks?: number | null;
  fouls?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  goalkeeperSaves?: number | null;
  totalPasses?: number | null;
  passesAccurate?: number | null;
  passesPercent?: number | null;
  offsides?: number | null;

  // Duels details (SofaScore styled!)
  duelsPercent?: number | null;
  dispossessed?: number | null;
  groundDuelsWon?: number | null;
  groundDuelsTotal?: number | null;
  groundDuelsPercent?: number | null;
  aerialDuelsWon?: number | null;
  aerialDuelsTotal?: number | null;
  aerialDuelsPercent?: number | null;
  dribblesWon?: number | null;
  dribblesTotal?: number | null;
  dribblesPercent?: number | null;

  // Defending details
  tacklesWonPercent?: number | null;
  totalTackles?: number | null;
  interceptions?: number | null;

  // Passes details
  throwIns?: number | null;
  finalThirdEntries?: number | null;
  finalThirdPassesWon?: number | null;
  finalThirdPassesTotal?: number | null;
  finalThirdPassesPercent?: number | null;
  longBallsWon?: number | null;
  longBallsTotal?: number | null;
  longBallsPercent?: number | null;
  crossesWon?: number | null;
  crossesTotal?: number | null;
  crossesPercent?: number | null;

  // Goalkeeping details
  goalsPrevented?: number | null;
  bigSaves?: number | null;
  highClaims?: number | null;
}

import MatchShotmap from "./MatchShotmap";
import { StandardMatchEvent } from "./MatchTimeline";
import { StandardMatchLineups } from "./LineupPitch";

export interface StandardMatchStats {
  home: TeamStats;
  away: TeamStats;
}

interface MatchStatsProps {
  stats?: StandardMatchStats | null;
  events?: StandardMatchEvent[] | null;
  lineups?: StandardMatchLineups | null;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  odds?: { homeWin: string; draw: string; awayWin: string } | null;
}

// --------------------------------------------------------------------------
// Sub-Component: Symmetrical Circular Radial SVG Gauge (SofaScore styled!)
// --------------------------------------------------------------------------
interface SymmetricalGaugesProps {
  homeLabel: string;
  awayLabel: string;
  homeValue: number;
  awayValue: number;
  homePercent: number;
  awayPercent: number;
  title: string;
}

function SymmetricalGauges({ homeLabel, awayLabel, homeValue, awayValue, homePercent, awayPercent, title }: SymmetricalGaugesProps) {
  const size = 68;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  const homeOffset = circumference - (homePercent / 100) * circumference;
  const awayOffset = circumference - (awayPercent / 100) * circumference;

  return (
    <div className={styles.symmetricalGaugesRow}>
      {/* Home Radial Loop */}
      <div className={styles.gaugeContainer}>
        <svg width={size} height={size} className={styles.radialSvg}>
          <circle className={styles.radialBg} cx={size / 2} cy={size / 2} r={radius} strokeWidth="3" fill="transparent" />
          <circle
            className={`${styles.radialFill} ${styles.radialFillHome}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={homeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="transparent"
          />
        </svg>
        <div className={styles.gaugeText}>
          <span className={styles.gaugePercent}>{homePercent}%</span>
          <span className={styles.gaugeRatio}>{homeLabel}</span>
        </div>
      </div>

      {/* Center Statistic Name Label */}
      <span className={styles.gaugeTitle}>{title}</span>

      {/* Away Radial Loop */}
      <div className={styles.gaugeContainer}>
        <svg width={size} height={size} className={styles.radialSvg}>
          <circle className={styles.radialBg} cx={size / 2} cy={size / 2} r={radius} strokeWidth="3" fill="transparent" />
          <circle
            className={`${styles.radialFill} ${styles.radialFillAway}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={awayOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            fill="transparent"
          />
        </svg>
        <div className={styles.gaugeText}>
          <span className={styles.gaugePercent}>{awayPercent}%</span>
          <span className={styles.gaugeRatio}>{awayLabel}</span>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-Component: Standard Horizontal Progress Bar Comparison Row
// --------------------------------------------------------------------------
interface ComparisonBarRowProps {
  label: string;
  homeValue: number | string;
  awayValue: number | string;
  homeRaw: number;
  awayRaw: number;
  isLowerBetter?: boolean;
}

function ComparisonBarRow({ label, homeValue, awayValue, homeRaw, awayRaw, isLowerBetter = false }: ComparisonBarRowProps) {
  let homeWidth = 0;
  let awayWidth = 0;

  if (label.toLowerCase().includes("possession")) {
    homeWidth = Number(homeRaw);
    awayWidth = Number(awayRaw);
  } else {
    const total = homeRaw + awayRaw;
    if (total > 0) {
      homeWidth = (homeRaw / total) * 100;
      awayWidth = (awayRaw / total) * 100;
    }
  }

  // Highlight leader
  let isHomeLeader = false;
  let isAwayLeader = false;

  if (homeRaw !== awayRaw) {
    if (isLowerBetter) {
      isHomeLeader = homeRaw < awayRaw;
      isAwayLeader = awayRaw < homeRaw;
    } else {
      isHomeLeader = homeRaw > awayRaw;
      isAwayLeader = awayRaw > homeRaw;
    }
  }

  return (
    <div className={styles.row}>
      {/* Values Header */}
      <div className={styles.rowHeader}>
        <span className={`${styles.value} ${isHomeLeader ? styles.leader : ""}`}>{homeValue}</span>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.value} ${isAwayLeader ? styles.leader : ""}`}>{awayValue}</span>
      </div>

      {/* Progress Bars */}
      <div className={styles.barContainer}>
        <div className={styles.barHalf}>
          <div
            className={`${styles.progressBar} ${styles.homeBar} ${isHomeLeader ? styles.leaderBar : ""}`}
            style={{ width: `${homeWidth}%` }}
          />
        </div>
        <div className={styles.barHalf}>
          <div
            className={`${styles.progressBar} ${styles.awayBar} ${isAwayLeader ? styles.leaderBar : ""}`}
            style={{ width: `${awayWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MatchStats({ stats, events, lineups, homeTeam, awayTeam, odds }: MatchStatsProps) {
  if (!stats || !stats.home || !stats.away) {
    return (
      <div className={styles.emptyState} aria-label="Stats Unavailable">
        <p>Stats are currently unavailable for this match.</p>
      </div>
    );
  }

  const h = stats.home;
  const a = stats.away;

  // Helper to safely format decimal strings
  const formatDecimal = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "0.00";
    return val.toFixed(2);
  };

  return (
    <div className={styles.container}>
      {/* 0. MATCH ODDS SECTION */}
      {odds && (
        <div className={styles.oddsSection}>
          <div className={styles.oddsSegmentedControl}>
            <button className={styles.oddsButton}>
              <span className={styles.oddsLabel}>1</span>
              <span className={styles.oddsValue}>{odds.homeWin}</span>
            </button>
            <div className={styles.oddsDivider} />
            <button className={styles.oddsButton}>
              <span className={styles.oddsLabel}>X</span>
              <span className={styles.oddsValue}>{odds.draw}</span>
            </button>
            <div className={styles.oddsDivider} />
            <button className={styles.oddsButton}>
              <span className={styles.oddsLabel}>2</span>
              <span className={styles.oddsValue}>{odds.awayWin}</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Shotmap Position Plot (SofaScore styled!) */}
      <MatchShotmap 
        stats={stats} 
        events={events} 
        lineups={lineups} 
        homeTeam={homeTeam} 
        awayTeam={awayTeam} 
      />

      {/* 1. MATCH OVERVIEW SECTION (SofaScore styled!) */}
      <section className={styles.accordionSection} aria-label="Match Overview Section">
        <h3 className={styles.sectionHeader}>
          <Activity size={16} className={styles.headerIcon} />
          Match Overview
        </h3>
        <div className={styles.statsRowsList}>
          {h.possessionPercent !== undefined && (
            <ComparisonBarRow
              label="Ball possession"
              homeValue={`${h.possessionPercent}%`}
              awayValue={`${a.possessionPercent}%`}
              homeRaw={h.possessionPercent ?? 50}
              awayRaw={a.possessionPercent ?? 50}
            />
          )}
          {h.expectedGoals !== undefined && (
            <ComparisonBarRow
              label="Expected goals (xG)"
              homeValue={formatDecimal(h.expectedGoals)}
              awayValue={formatDecimal(a.expectedGoals)}
              homeRaw={h.expectedGoals ?? 0}
              awayRaw={a.expectedGoals ?? 0}
            />
          )}
          {h.bigChances !== undefined && (
            <ComparisonBarRow
              label="Big chances"
              homeValue={h.bigChances ?? 0}
              awayValue={a.bigChances ?? 0}
              homeRaw={h.bigChances ?? 0}
              awayRaw={a.bigChances ?? 0}
            />
          )}
          {h.totalShots !== undefined && (
            <ComparisonBarRow
              label="Total shots"
              homeValue={h.totalShots ?? 0}
              awayValue={a.totalShots ?? 0}
              homeRaw={h.totalShots ?? 0}
              awayRaw={a.totalShots ?? 0}
            />
          )}
          {h.shotsOnGoal !== undefined && (
            <ComparisonBarRow
              label="Shots on target"
              homeValue={h.shotsOnGoal ?? 0}
              awayValue={a.shotsOnGoal ?? 0}
              homeRaw={h.shotsOnGoal ?? 0}
              awayRaw={a.shotsOnGoal ?? 0}
            />
          )}
          {h.cornerKicks !== undefined && (
            <ComparisonBarRow
              label="Corner kicks"
              homeValue={h.cornerKicks ?? 0}
              awayValue={a.cornerKicks ?? 0}
              homeRaw={h.cornerKicks ?? 0}
              awayRaw={a.cornerKicks ?? 0}
            />
          )}
          {h.fouls !== undefined && (
            <ComparisonBarRow
              label="Fouls"
              homeValue={h.fouls ?? 0}
              awayValue={a.fouls ?? 0}
              homeRaw={h.fouls ?? 0}
              awayRaw={a.fouls ?? 0}
              isLowerBetter
            />
          )}
          {h.yellowCards !== undefined && (
            <ComparisonBarRow
              label="Yellow cards"
              homeValue={h.yellowCards ?? 0}
              awayValue={a.yellowCards ?? 0}
              homeRaw={h.yellowCards ?? 0}
              awayRaw={a.yellowCards ?? 0}
              isLowerBetter
            />
          )}
        </div>
      </section>

      {/* 2. DUELS SECTION (Symmetrical SVG progress circles!) */}
      {h.groundDuelsPercent !== undefined && (
        <section className={styles.accordionSection} aria-label="Duels Details Section">
          <h3 className={styles.sectionHeader}>
            <RefreshCw size={16} className={styles.headerIcon} />
            Duels
          </h3>
          
          {/* Radial gauges side-by-side row */}
          <div className={styles.gaugesRowContainer}>
            <SymmetricalGauges
              homeLabel={`${h.groundDuelsWon}/${h.groundDuelsTotal}`}
              awayLabel={`${a.groundDuelsWon}/${a.groundDuelsTotal}`}
              homeValue={h.groundDuelsWon ?? 0}
              awayValue={a.groundDuelsWon ?? 0}
              homePercent={h.groundDuelsPercent ?? 0}
              awayPercent={a.groundDuelsPercent ?? 0}
              title="Ground duels"
            />
            <SymmetricalGauges
              homeLabel={`${h.aerialDuelsWon}/${h.aerialDuelsTotal}`}
              awayLabel={`${a.aerialDuelsWon}/${a.aerialDuelsTotal}`}
              homeValue={h.aerialDuelsWon ?? 0}
              awayValue={a.aerialDuelsWon ?? 0}
              homePercent={h.aerialDuelsPercent ?? 0}
              awayPercent={a.aerialDuelsPercent ?? 0}
              title="Aerial duels"
            />
            <SymmetricalGauges
              homeLabel={`${h.dribblesWon}/${h.dribblesTotal}`}
              awayLabel={`${a.dribblesWon}/${a.dribblesTotal}`}
              homeValue={h.dribblesWon ?? 0}
              awayValue={a.dribblesWon ?? 0}
              homePercent={h.dribblesPercent ?? 0}
              awayPercent={a.dribblesPercent ?? 0}
              title="Dribbles"
            />
          </div>

          <div className={styles.statsRowsList}>
            {h.dispossessed !== undefined && (
              <ComparisonBarRow
                label="Dispossessed"
                homeValue={h.dispossessed ?? 0}
                awayValue={a.dispossessed ?? 0}
                homeRaw={h.dispossessed ?? 0}
                awayRaw={a.dispossessed ?? 0}
                isLowerBetter
              />
            )}
          </div>
        </section>
      )}

      {/* 3. DEFENDING SECTION */}
      {h.tacklesWonPercent !== undefined && (
        <section className={styles.accordionSection} aria-label="Defending Details Section">
          <h3 className={styles.sectionHeader}>
            <Shield size={16} className={styles.headerIcon} />
            Defending
          </h3>

          <div className={styles.gaugesRowContainer}>
            <SymmetricalGauges
              homeLabel="Tackles won"
              awayLabel="Tackles won"
              homeValue={0}
              awayValue={0}
              homePercent={h.tacklesWonPercent ?? 0}
              awayPercent={a.tacklesWonPercent ?? 0}
              title="Tackles won"
            />
          </div>

          <div className={styles.statsRowsList}>
            {h.totalTackles !== undefined && (
              <ComparisonBarRow
                label="Total tackles"
                homeValue={h.totalTackles ?? 0}
                awayValue={a.totalTackles ?? 0}
                homeRaw={h.totalTackles ?? 0}
                awayRaw={a.totalTackles ?? 0}
              />
            )}
            {h.interceptions !== undefined && (
              <ComparisonBarRow
                label="Interceptions"
                homeValue={h.interceptions ?? 0}
                awayValue={a.interceptions ?? 0}
                homeRaw={h.interceptions ?? 0}
                awayRaw={a.interceptions ?? 0}
              />
            )}
          </div>
        </section>
      )}

      {/* 4. PASSING ACCURACY SECTION */}
      {h.passesAccurate !== undefined && (
        <section className={styles.accordionSection} aria-label="Passing Details Section">
          <h3 className={styles.sectionHeader}>
            <RefreshCw size={16} className={styles.headerIcon} />
            Passes
          </h3>

          <div className={styles.gaugesRowContainer}>
            <SymmetricalGauges
              homeLabel={`${h.finalThirdPassesWon}/${h.finalThirdPassesTotal}`}
              awayLabel={`${a.finalThirdPassesWon}/${a.finalThirdPassesTotal}`}
              homeValue={h.finalThirdPassesWon ?? 0}
              awayValue={a.finalThirdPassesWon ?? 0}
              homePercent={h.finalThirdPassesPercent ?? 0}
              awayPercent={a.finalThirdPassesPercent ?? 0}
              title="Passes in final third"
            />
            <SymmetricalGauges
              homeLabel={`${h.longBallsWon}/${h.longBallsTotal}`}
              awayLabel={`${a.longBallsWon}/${a.longBallsTotal}`}
              homeValue={h.longBallsWon ?? 0}
              awayValue={a.longBallsWon ?? 0}
              homePercent={h.longBallsPercent ?? 0}
              awayPercent={a.longBallsPercent ?? 0}
              title="Long balls"
            />
            <SymmetricalGauges
              homeLabel={`${h.crossesWon}/${h.crossesTotal}`}
              awayLabel={`${a.crossesWon}/${a.crossesTotal}`}
              homeValue={h.crossesWon ?? 0}
              awayValue={a.crossesWon ?? 0}
              homePercent={h.crossesPercent ?? 0}
              awayPercent={a.crossesPercent ?? 0}
              title="Crosses"
            />
          </div>

          <div className={styles.statsRowsList}>
            {h.totalPasses !== undefined && (
              <ComparisonBarRow
                label="Accurate passes"
                homeValue={`${h.passesAccurate}/${h.totalPasses} (${h.passesPercent}%)`}
                awayValue={`${a.passesAccurate}/${a.totalPasses} (${a.passesPercent}%)`}
                homeRaw={h.passesAccurate ?? 0}
                awayRaw={a.passesAccurate ?? 0}
              />
            )}
            {h.throwIns !== undefined && (
              <ComparisonBarRow
                label="Throw-ins"
                homeValue={h.throwIns ?? 0}
                awayValue={a.throwIns ?? 0}
                homeRaw={h.throwIns ?? 0}
                awayRaw={a.throwIns ?? 0}
              />
            )}
            {h.finalThirdEntries !== undefined && (
              <ComparisonBarRow
                label="Final third entries"
                homeValue={h.finalThirdEntries ?? 0}
                awayValue={a.finalThirdEntries ?? 0}
                homeRaw={h.finalThirdEntries ?? 0}
                awayRaw={a.finalThirdEntries ?? 0}
              />
            )}
          </div>
        </section>
      )}

      {/* 5. GOALKEEPING SECTION */}
      {h.goalkeeperSaves !== undefined && (
        <section className={styles.accordionSection} aria-label="Goalkeeping Details Section">
          <h3 className={styles.sectionHeader}>
            <Award size={16} className={styles.headerIcon} />
            Goalkeeping
          </h3>
          <div className={styles.statsRowsList}>
            <ComparisonBarRow
              label="Goalkeeper saves"
              homeValue={h.goalkeeperSaves ?? 0}
              awayValue={a.goalkeeperSaves ?? 0}
              homeRaw={h.goalkeeperSaves ?? 0}
              awayRaw={a.goalkeeperSaves ?? 0}
            />
            {h.goalsPrevented !== undefined && (
              <div className={styles.row}>
                <div className={styles.rowHeader}>
                  <span className={`${styles.value} ${Number(h.goalsPrevented) > Number(a.goalsPrevented) ? styles.leader : ""}`}>
                    {h.goalsPrevented?.toFixed(2) || "0.00"}
                  </span>
                  <span className={styles.labelWithIcon}>
                    Goals prevented
                    <span 
                      className={styles.infoTrigger} 
                      title="Goals prevented is calculated by subtracting conceded goals from Expected Goals on Target (xGOT)."
                    >
                      <HelpCircle size={13} />
                    </span>
                  </span>
                  <span className={`${styles.value} ${Number(a.goalsPrevented) > Number(h.goalsPrevented) ? styles.leader : ""}`}>
                    {a.goalsPrevented?.toFixed(2) || "0.00"}
                  </span>
                </div>
                <div className={styles.barContainer}>
                  <div className={styles.barHalf}>
                    <div
                      className={`${styles.progressBar} ${styles.homeBar} ${Number(h.goalsPrevented) > Number(a.goalsPrevented) ? styles.leaderBar : ""}`}
                      style={{ width: `${((h.goalsPrevented ?? 0) / ((h.goalsPrevented ?? 0) + (a.goalsPrevented ?? 0) || 1)) * 100}%` }}
                    />
                  </div>
                  <div className={styles.barHalf}>
                    <div
                      className={`${styles.progressBar} ${styles.awayBar} ${Number(a.goalsPrevented) > Number(h.goalsPrevented) ? styles.leaderBar : ""}`}
                      style={{ width: `${((a.goalsPrevented ?? 0) / ((h.goalsPrevented ?? 0) + (a.goalsPrevented ?? 0) || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            {h.bigSaves !== undefined && (
              <ComparisonBarRow
                label="Big saves"
                homeValue={h.bigSaves ?? 0}
                awayValue={a.bigSaves ?? 0}
                homeRaw={h.bigSaves ?? 0}
                awayRaw={a.bigSaves ?? 0}
              />
            )}
            {h.highClaims !== undefined && (
              <ComparisonBarRow
                label="High claims"
                homeValue={h.highClaims ?? 0}
                awayValue={a.highClaims ?? 0}
                homeRaw={h.highClaims ?? 0}
                awayRaw={a.highClaims ?? 0}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
