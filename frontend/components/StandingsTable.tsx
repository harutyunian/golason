import React from "react";
import Link from "next/link";
import TeamLogo from "./TeamLogo";
import styles from "./StandingsTable.module.css";

export interface StandardStanding {
  rank: number;
  teamId: number;
  points: number;
  goalsDiff: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  form?: string | null;
  team: {
    id: number;
    name: string;
    logo?: string | null;
  };
}

export interface StandingsTableProps {
  standings?: StandardStanding[];
  activeTeamId?: number;
}

export default function StandingsTable({ standings = [], activeTeamId }: StandingsTableProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className={styles.emptyState}>
        No standings available.
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankCol}>#</th>
            <th className={styles.teamCol}>Team</th>
            <th className={styles.numCol} title="Played">P</th>
            <th className={styles.numCol} title="Goal Difference">GD</th>
            <th className={styles.ptsCol} title="Points">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const isActive = row.teamId === activeTeamId;
            return (
              <tr
                key={row.teamId}
                className={`${styles.row} ${isActive ? styles.activeRow : ""}`}
              >
                <td className={styles.rankCell}>
                  <span className={styles.rankNum}>{row.rank}</span>
                </td>
                <td className={styles.teamCell}>
                  <Link href={`/team/${row.teamId}`} className={styles.teamLink}>
                    <TeamLogo logo={row.team?.logo} name={row.team?.name || "Unknown"} size={20} className={styles.teamLogo} />
                    <span className={styles.teamName}>{row.team?.name}</span>
                  </Link>
                </td>
                <td className={styles.numCell}>{row.played}</td>
                <td className={`${styles.numCell} ${row.goalsDiff > 0 ? styles.positiveGd : row.goalsDiff < 0 ? styles.negativeGd : ""}`}>
                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                </td>
                <td className={styles.ptsCell}>{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
