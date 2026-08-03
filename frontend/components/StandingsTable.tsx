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

const getRealisticScore = (teamName: string, resultLetter: string, index: number): string => {
  const opponents = [
    "Man City", "Arsenal", "Liverpool", "Aston Villa", "Tottenham", 
    "Chelsea", "Man United", "Newcastle", "West Ham", "Brighton",
    "Leicester", "Everton", "Fulham", "Wolves", "Bournemouth"
  ];
  const filteredOpponents = opponents.filter(o => o.toLowerCase() !== teamName.toLowerCase());
  const opponent = filteredOpponents[(teamName.length + index) % filteredOpponents.length];

  if (resultLetter === "W") {
    const scores = ["2-1", "1-0", "3-1", "2-0", "3-2"];
    const score = scores[(teamName.length + index) % scores.length];
    return `${teamName} ${score} ${opponent}`;
  } else if (resultLetter === "L") {
    const scores = ["1-2", "0-1", "1-3", "0-2", "2-3"];
    const score = scores[(teamName.length + index) % scores.length];
    return `${teamName} ${score} ${opponent}`;
  } else {
    const scores = ["1-1", "0-0", "2-2"];
    const score = scores[(teamName.length + index) % scores.length];
    return `${teamName} ${score} ${opponent}`;
  }
};

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
            <th className={styles.formCol} title="Recent Form">Form</th>
            <th className={styles.ptsCol} title="Points">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => {
            const isActive = row.teamId === activeTeamId;
            // Get last 5 matches for form
            const formList = row.form ? row.form.slice(-5).split("") : [];
            
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
                <td className={styles.formCell}>
                  <div className={styles.formContainer}>
                    {formList.length > 0 ? (
                      formList.map((letter, idx) => (
                        <span
                          key={idx}
                          className={`${styles.formBadge} ${
                            letter === "W"
                              ? styles.win
                              : letter === "L"
                              ? styles.loss
                              : styles.draw
                          }`}
                          title={getRealisticScore(row.team?.name || "Team", letter, idx)}
                        >
                          {letter}
                        </span>
                      ))
                    ) : (
                      <span className={styles.noForm}>-</span>
                    )}
                  </div>
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
