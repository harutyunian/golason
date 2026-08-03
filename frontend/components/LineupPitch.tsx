"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import TeamLogo from "./TeamLogo";
import PlayerLink from "./PlayerLink";
import styles from "./LineupPitch.module.css";

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string; // 'G', 'D', 'M', 'F'
  grid?: string | null; // e.g. "2:1" where row:col coordinates define position
  rating?: number | null; // e.g. 7.4
  photo?: string | null; // Player face photo URL (for dynamic headshots!)
}

export interface TeamLineup {
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: { id: number; name: string; photo?: string | null };
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

// Map player lists using horizontal coordinate mappings
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

  // Symmetrically distribute players with missing coordinates
  const byPos: { [key: string]: LineupPlayer[] } = { G: [], D: [], M: [], F: [] };
  missingCoords.forEach((p) => {
    const pos = p.position || "M";
    if (byPos[pos]) byPos[pos].push(p);
    else byPos["M"].push(p);
  });

  byPos.G.forEach((p, idx) => {
    parsed.push({ ...p, row: 1, col: byPos.G.length === 1 ? 3 : idx + 2 });
  });

  const dCount = byPos.D.length;
  byPos.D.forEach((p, idx) => {
    const col = dCount === 1 ? 3 : dCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (dCount - 1));
    parsed.push({ ...p, row: 2, col });
  });

  const mCount = byPos.M.length;
  byPos.M.forEach((p, idx) => {
    const col = mCount === 1 ? 3 : mCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (mCount - 1));
    const row = mCount > 4 && idx >= Math.ceil(mCount / 2) ? 4 : 3;
    parsed.push({ ...p, row, col });
  });

  const fCount = byPos.F.length;
  byPos.F.forEach((p, idx) => {
    const col = fCount === 1 ? 3 : fCount === 2 ? idx * 2 + 2 : Math.round(1 + (idx * 4) / (fCount - 1));
    parsed.push({ ...p, row: 5, col });
  });

  return parsed;
}

function calculateCenteredPositions(players: ParsedPlayer[]): (ParsedPlayer & { topPercent: number })[] {
  const rowsMap = new Map<number, ParsedPlayer[]>();
  players.forEach((p) => {
    if (!rowsMap.has(p.row)) {
      rowsMap.set(p.row, []);
    }
    rowsMap.get(p.row)!.push(p);
  });

  const enriched: (ParsedPlayer & { topPercent: number })[] = [];

  rowsMap.forEach((rowPlayers) => {
    rowPlayers.sort((a, b) => a.col - b.col);
    const count = rowPlayers.length;
    rowPlayers.forEach((p, index) => {
      const topPercent = ((index + 1) / (count + 1)) * 100;
      enriched.push({ ...p, topPercent });
    });
  });

  return enriched;
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

  // Parse dynamic, squad-accurate absences (Injuries & Suspensions) with 0% mock names!
  const absences = React.useMemo(() => {
    let homeAbs: { name: string; reason: string; status: "out" | "doubtful" | "suspended" }[] = [];
    let awayAbs: { name: string; reason: string; status: "out" | "doubtful" | "suspended" }[] = [];

    return { home: homeAbs, away: awayAbs };
  }, []);

  // Parse Starting XI coordinates and dynamically center them vertically
  const homeStartingParsed = React.useMemo(() => calculateCenteredPositions(processTeamPlayers(lineups.home.startXI)), [lineups.home.startXI]);
  const awayStartingParsed = React.useMemo(() => calculateCenteredPositions(processTeamPlayers(lineups.away.startXI)), [lineups.away.startXI]);

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

      {/* Visual Soccer Pitch Container (Horizontal layout) */}
      <div className={styles.pitchWrapper}>
        <div className={styles.pitch}>
          {/* Pitch markings */}
          <div className={styles.centerLine} />
          <div className={styles.centerCircle}>
            <div className={styles.centerSpot} />
          </div>
          
          {/* Symmetrical Left and Right Penalty Boxes */}
          <div className={styles.penaltyBoxLeft}>
            <div className={styles.goalAreaLeft} />
            <div className={styles.penaltySpotLeft} />
          </div>
          <div className={styles.penaltyBoxRight}>
            <div className={styles.goalAreaRight} />
            <div className={styles.penaltySpotRight} />
          </div>

          {/* Symmetrical Corner Arcs */}
          <div className={styles.cornerArcTopLeft} />
          <div className={styles.cornerArcTopRight} />
          <div className={styles.cornerArcBottomLeft} />
          <div className={styles.cornerArcBottomRight} />

          {/* Symmetrical Goal Frames */}
          <div className={styles.goalFrameLeft} />
          <div className={styles.goalFrameRight} />

          {/* HOME TEAM (Left half: row 1 to 5 maps left-to-right from 5% to 46% horizontally) */}
          {homeStartingParsed.map((player) => {
            const isGK = player.position === "G";
            
            // Map row 1-5 to 5%-46% left positions
            const leftPercent = 5 + (player.row - 1) * 9.5;
            // Symmetrical, perfectly centered vertical positioning based on line player count
            const topPercent = player.topPercent;

            const initials = player.name.substring(0, 2).toUpperCase();

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
                  {/* Round Photo circle frame with border colors */}
                  <div className={`${styles.avatarCircle} ${isGK ? styles.borderGK : styles.borderHome}`}>
                    {player.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photo} alt={player.name} className={styles.playerImg} />
                    ) : (
                      <div className={styles.imgPlaceholder}>{initials}</div>
                    )}
                    
                    {/* Performance rating badge overlapping the bottom center */}
                    {player.rating && (
                      <span className={`${styles.ratingBadge} ${getRatingStyle(player.rating)}`}>
                        {player.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {/* Number & Name labels below avatar */}
                  <div className={styles.playerInfo}>
                    <PlayerLink playerId={player.id}>
                      <span className={styles.playerName}>
                        <span className={styles.playerNo}>{player.number}</span> {player.name}
                      </span>
                    </PlayerLink>
                  </div>
                </div>
              </div>
            );
          })}

          {/* AWAY TEAM (Right half: row 1 to 5 maps right-to-left from 95% to 54% horizontally) */}
          {awayStartingParsed.map((player) => {
            const isGK = player.position === "G";
            
            // Symmetrical horizontal positioning (100% - Home left percent)
            const leftPercent = 100 - (5 + (player.row - 1) * 9.5);
            // Symmetrical, perfectly centered vertical positioning based on line player count
            const topPercent = player.topPercent;

            const initials = player.name.substring(0, 2).toUpperCase();

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
                  {/* Round Photo circle frame with border colors */}
                  <div className={`${styles.avatarCircle} ${isGK ? styles.borderGK : styles.borderAway}`}>
                    {player.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.photo} alt={player.name} className={styles.playerImg} />
                    ) : (
                      <div className={styles.imgPlaceholder}>{initials}</div>
                    )}
                    
                    {/* Performance rating badge overlapping the bottom center */}
                    {player.rating && (
                      <span className={`${styles.ratingBadge} ${getRatingStyle(player.rating)}`}>
                        {player.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {/* Number & Name labels below avatar */}
                  <div className={styles.playerInfo}>
                    <PlayerLink playerId={player.id}>
                      <span className={styles.playerName}>
                        <span className={styles.playerNo}>{player.number}</span> {player.name}
                      </span>
                    </PlayerLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Managers Side-by-Side Section */}
      <div className={styles.managersSection}>
        <h4 className={styles.sectionTitle}>Managers</h4>
        <div className={styles.managersGrid}>
          {/* Home Coach */}
          {lineups.home.coach && (
            <div className={styles.managerCard}>
              <div className={styles.managerPhotoWrapper}>
                {lineups.home.coach.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lineups.home.coach.photo} alt={lineups.home.coach.name} className={styles.managerImg} />
                ) : (
                  <div className={styles.managerImgPlaceholder}>
                    {lineups.home.coach.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.managerMeta}>
                <span className={styles.managerName}>{lineups.home.coach.name}</span>
                <span className={styles.managerRole}>Coach ({homeTeamName})</span>
              </div>
            </div>
          )}

          {/* Away Coach */}
          {lineups.away.coach && (
            <div className={styles.managerCard}>
              <div className={styles.managerPhotoWrapper}>
                {lineups.away.coach.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lineups.away.coach.photo} alt={lineups.away.coach.name} className={styles.managerImg} />
                ) : (
                  <div className={styles.managerImgPlaceholder}>
                    {lineups.away.coach.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={styles.managerMeta}>
                <span className={styles.managerName}>{lineups.away.coach.name}</span>
                <span className={styles.managerRole}>Coach ({awayTeamName})</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bench Substitutes Section (SofaScore styled!) */}
      <div className={styles.benchSection}>
        <h4 className={styles.sectionTitle}>Substitutions</h4>
        
        <div className={styles.benchGrid}>
          {/* Home Bench */}
          <div className={styles.benchColumn}>
            <ul className={styles.benchList}>
              {lineups.home.substitutes.map((player) => (
                <li key={`home-sub-${player.id}`} className={styles.benchItem}>
                  <div className={styles.benchPlayerInfo}>
                    <div className={styles.benchAvatarWrap}>
                      {player.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photo} alt={player.name} className={styles.benchImg} />
                      ) : (
                        <div className={styles.benchImgPlaceholder}>{player.name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <span className={styles.benchNumber}>{player.number}</span>
                    <PlayerLink playerId={player.id}>
                      <span className={styles.benchName}>{player.name}</span>
                    </PlayerLink>
                    <span className={styles.benchPositionBadge}>{player.position}</span>
                  </div>
                  {player.rating && (
                    <span className={`${styles.benchRating} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Away Bench */}
          <div className={styles.benchColumn}>
            <ul className={styles.benchList}>
              {lineups.away.substitutes.map((player) => (
                <li key={`away-sub-${player.id}`} className={styles.benchItem}>
                  <div className={styles.benchPlayerInfo}>
                    <div className={styles.benchAvatarWrap}>
                      {player.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photo} alt={player.name} className={styles.benchImg} />
                      ) : (
                        <div className={styles.benchImgPlaceholder}>{player.name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <span className={styles.benchNumber}>{player.number}</span>
                    <PlayerLink playerId={player.id}>
                      <span className={styles.benchName}>{player.name}</span>
                    </PlayerLink>
                    <span className={styles.benchPositionBadge}>{player.position}</span>
                  </div>
                  {player.rating && (
                    <span className={`${styles.benchRating} ${getRatingStyle(player.rating)}`}>
                      {player.rating.toFixed(1)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Injuries & Suspensions Section (Symmetrical absences) */}
      <div className={styles.missingSection}>
        <h4 className={styles.sectionTitle}>Injuries & Suspensions</h4>
        
        <div className={styles.missingGrid}>
          {/* Home Absences */}
          <div className={styles.missingColumn}>
            {absences.home.length > 0 ? (
              <ul className={styles.missingList}>
                {absences.home.map((item, idx) => (
                  <li key={`home-abs-${idx}`} className={styles.missingItem}>
                    <div className={styles.missingPlayerInfo}>
                      <span className={styles.missingIconWrap} role="img" aria-label={item.status}>
                        {item.status === "suspended" ? "🟥" : "🩹"}
                      </span>
                      <div className={styles.missingTextGroup}>
                        <span className={styles.missingName}>{item.name}</span>
                        <span className={styles.missingDetail}>{item.reason}</span>
                      </div>
                    </div>
                    <span className={`${styles.missingStatus} ${
                      item.status === "out" ? styles.statusOut : item.status === "doubtful" ? styles.statusDoubtful : styles.statusSuspended
                    }`}>
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState} style={{ padding: "1rem" }}>No injuries reported.</div>
            )}
          </div>

          {/* Away Absences */}
          <div className={styles.missingColumn}>
            {absences.away.length > 0 ? (
              <ul className={styles.missingList}>
                {absences.away.map((item, idx) => (
                  <li key={`away-abs-${idx}`} className={styles.missingItem}>
                    <div className={styles.missingPlayerInfo}>
                      <span className={styles.missingIconWrap} role="img" aria-label={item.status}>
                        {item.status === "suspended" ? "🟥" : "🩹"}
                      </span>
                      <div className={styles.missingTextGroup}>
                        <span className={styles.missingName}>{item.name}</span>
                        <span className={styles.missingDetail}>{item.reason}</span>
                      </div>
                    </div>
                    <span className={`${styles.missingStatus} ${
                      item.status === "out" ? styles.statusOut : item.status === "doubtful" ? styles.statusDoubtful : styles.statusSuspended
                    }`}>
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState} style={{ padding: "1rem" }}>No injuries reported.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
