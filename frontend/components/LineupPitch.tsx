"use client";

import React from "react";
import styles from "./LineupPitch.module.css";

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string; // 'G', 'D', 'M', 'F'
  grid?: string | null; // e.g. "2:1" where row:col coordinates define position
  rating?: number | null; // e.g. 7.4
}

export interface TeamLineup {
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: { id: number; name: string };
}

export interface StandardMatchLineups {
  home: TeamLineup;
  away: TeamLineup;
}

interface LineupPitchProps {
  lineups?: StandardMatchLineups | null;
  homeTeamName?: string;
  awayTeamName?: string;
}

interface ParsedPlayer extends LineupPlayer {
  row: number;
  col: number;
}

// Map player list using coordinate systems
function processTeamPlayers(players: LineupPlayer[]): ParsedPlayer[] {
  const parsed: ParsedPlayer[] = [];
  const missingCoords: LineupPlayer[] = [];

  players.forEach((p) => {
    if (p.grid) {
      const parts = p.grid.split(":");
      if (parts.length === 2) {
        const row = parseInt(parts[0], 10);
        const col = parseInt(parts[1], 10);
        if (!isNaN(row) && !isNaN(col)) {
          parsed.push({ ...p, row, col });
          return;
        }
      }
    }
    missingCoords.push(p);
  });

  if (missingCoords.length === 0) return parsed;

  // Group and distribute missing players by position
  const byPos: { [key: string]: LineupPlayer[] } = { G: [], D: [], M: [], F: [] };
  missingCoords.forEach((p) => {
    const pos = p.position || "M";
    if (byPos[pos]) byPos[pos].push(p);
    else byPos["M"].push(p);
  });

  // Assign fallbacks:
  // Goalkeepers
  byPos.G.forEach((p, idx) => {
    parsed.push({ ...p, row: 1, col: byPos.G.length === 1 ? 3 : idx + 2 });
  });

  // Defenders
  const dCount = byPos.D.length;
  byPos.D.forEach((p, idx) => {
    const col = dCount === 1 ? 3 : dCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (dCount - 1));
    parsed.push({ ...p, row: 2, col });
  });

  // Midfielders
  const mCount = byPos.M.length;
  byPos.M.forEach((p, idx) => {
    const col = mCount === 1 ? 3 : mCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (mCount - 1));
    const row = mCount > 4 && idx >= Math.ceil(mCount / 2) ? 4 : 3;
    parsed.push({ ...p, row, col });
  });

  // Forwards
  const fCount = byPos.F.length;
  byPos.F.forEach((p, idx) => {
    const col = fCount === 1 ? 3 : fCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (fCount - 1));
    parsed.push({ ...p, row: 5, col });
  });

  return parsed;
}

export default function LineupPitch({ lineups, homeTeamName = "Home Team", awayTeamName = "Away Team" }: LineupPitchProps) {
  if (!lineups || !lineups.home || !lineups.away) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.pitchGraphicEmpty} aria-hidden="true">
          <div className={styles.centerCircleEmpty} />
        </div>
        <h3>Lineups are not available yet</h3>
        <p>The starting lineups and formations are typically announced 60 minutes prior to kickoff.</p>
      </div>
    );
  }

  // Map starting XI to pitch coordinates
  const homeStartingParsed = processTeamPlayers(lineups.home.startXI);
  const awayStartingParsed = processTeamPlayers(lineups.away.startXI);

  const getRatingStyle = (rating: number | null | undefined): string => {
    if (!rating) return "";
    if (rating >= 8.0) return styles.ratingExcellent;
    if (rating >= 7.0) return styles.ratingGood;
    if (rating >= 6.0) return styles.ratingAverage;
    return styles.ratingPoor;
  };

  return (
    <div className={styles.container}>
      {/* Formations Header Bar */}
      <div className={styles.formationsHeader}>
        <div className={styles.teamFormation}>
          <span className={styles.teamNameLabel}>{homeTeamName}</span>
          <span className={styles.formationBadge}>{lineups.home.formation}</span>
        </div>
        <div className={styles.dividerLabel}>VS</div>
        <div className={styles.teamFormation}>
          <span className={styles.formationBadge}>{lineups.away.formation}</span>
          <span className={styles.teamNameLabel}>{awayTeamName}</span>
        </div>
      </div>

      {/* Visual Soccer Pitch Container */}
      <div className={styles.pitchWrapper}>
        <div className={styles.pitch}>
          {/* Markings */}
          <div className={styles.centerLine} />
          <div className={styles.centerCircle}>
            <div className={styles.centerSpot} />
          </div>
          
          {/* Penalty Areas */}
          <div className={styles.penaltyBoxTop}>
            <div className={styles.goalAreaTop} />
            <div className={styles.penaltySpotTop} />
          </div>
          <div className={styles.penaltyBoxBottom}>
            <div className={styles.goalAreaBottom} />
            <div className={styles.penaltySpotBottom} />
          </div>

          {/* Corner Arcs */}
          <div className={styles.cornerArcTopLeft} />
          <div className={styles.cornerArcTopRight} />
          <div className={styles.cornerArcBottomLeft} />
          <div className={styles.cornerArcBottomRight} />

          {/* Goal Frames */}
          <div className={styles.goalFrameTop} />
          <div className={styles.goalFrameBottom} />

          {/* AWAY TEAM (Rendered on top half: row 1 to 5 mapping) */}
          {awayStartingParsed.map((player) => {
            // Away goalkeeper is at the top (row 1 is topmost, row 5 is near center)
            const topPercent = 4.5 + (player.row - 1) * 8.5;
            // Symmetric left position
            const leftPercent = (player.col / 6) * 100;

            const isGK = player.position === "G";

            return (
              <div
                key={`away-player-${player.id}`}
                className={styles.playerNode}
                style={{
                  top: `${topPercent}%`,
                  left: `${leftPercent}%`,
                }}
              >
                <div className={styles.playerWrapper}>
                  {/* Rating Badge */}
                  {player.rating && (
                    <span className={`${styles.ratingBadge} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                  {/* Jersey Shirt (red color for away) */}
                  <div className={`${styles.shirtCircle} ${isGK ? styles.shirtGK : styles.shirtAway}`}>
                    <span className={styles.playerNumber}>{player.number}</span>
                  </div>
                  {/* Player details */}
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* HOME TEAM (Rendered on bottom half: row 1 is bottommost, row 5 is near center) */}
          {homeStartingParsed.map((player) => {
            // Home goalkeeper is at the bottom (row 1 is bottommost, row 5 is near center)
            const topPercent = 95.5 - (player.row - 1) * 8.5;
            const leftPercent = (player.col / 6) * 100;

            const isGK = player.position === "G";

            return (
              <div
                key={`home-player-${player.id}`}
                className={styles.playerNode}
                style={{
                  top: `${topPercent}%`,
                  left: `${leftPercent}%`,
                }}
              >
                <div className={styles.playerWrapper}>
                  {/* Rating Badge */}
                  {player.rating && (
                    <span className={`${styles.ratingBadge} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                  {/* Jersey Shirt (blue color for home) */}
                  <div className={`${styles.shirtCircle} ${isGK ? styles.shirtGK : styles.shirtHome}`}>
                    <span className={styles.playerNumber}>{player.number}</span>
                  </div>
                  {/* Player details */}
                  <div className={styles.playerInfo}>
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bench Substitutes & Staff Section */}
      <div className={styles.benchSection}>
        <h4 className={styles.benchTitle}>Substitutes &amp; Staff</h4>
        
        <div className={styles.benchGrid}>
          {/* Home Bench */}
          <div className={styles.benchColumn}>
            <div className={styles.benchColumnHeader}>{homeTeamName} Bench</div>
            <ul className={styles.benchList}>
              {lineups.home.substitutes.map((player) => (
                <li key={`home-sub-${player.id}`} className={styles.benchItem}>
                  <div className={styles.benchPlayerInfo}>
                    <span className={styles.benchNumber}>{player.number}</span>
                    <span className={styles.benchName}>{player.name}</span>
                    <span className={styles.benchPositionBadge}>{player.position}</span>
                  </div>
                  {player.rating && (
                    <span className={`${styles.benchRating} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
              {/* Coach */}
              {lineups.home.coach && (
                <li className={styles.coachItem}>
                  <span className={styles.coachRole}>Coach</span>
                  <span className={styles.coachName}>{lineups.home.coach.name}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Away Bench */}
          <div className={styles.benchColumn}>
            <div className={styles.benchColumnHeader}>{awayTeamName} Bench</div>
            <ul className={styles.benchList}>
              {lineups.away.substitutes.map((player) => (
                <li key={`away-sub-${player.id}`} className={styles.benchItem}>
                  <div className={styles.benchPlayerInfo}>
                    <span className={styles.benchNumber}>{player.number}</span>
                    <span className={styles.benchName}>{player.name}</span>
                    <span className={styles.benchPositionBadge}>{player.position}</span>
                  </div>
                  {player.rating && (
                    <span className={`${styles.benchRating} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
              {/* Coach */}
              {lineups.away.coach && (
                <li className={styles.coachItem}>
                  <span className={styles.coachRole}>Coach</span>
                  <span className={styles.coachName}>{lineups.away.coach.name}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
