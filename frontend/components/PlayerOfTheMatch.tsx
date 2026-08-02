"use client";

import React, { useState, useEffect } from "react";
import { Award, Star, ThumbsUp, Sparkles, User } from "lucide-react";
import styles from "./PlayerOfTheMatch.module.css";
import { StandardMatchLineups } from "./LineupPitch";

interface TeamDetails {
  id: number;
  name: string;
  logo?: string | null;
}

interface PlayerOfTheMatchProps {
  lineups?: StandardMatchLineups | null;
  homeTeam: TeamDetails;
  awayTeam: TeamDetails;
  matchId: number;
}

interface Candidate {
  id: number;
  name: string;
  number: number;
  position: string;
  isHome: boolean;
  basePercentage: number;
}

// Helper to get rating background color
export const getRatingColorClass = (rating: number): string => {
  if (rating >= 8.0) return styles.ratingExcellent;
  if (rating >= 7.0) return styles.ratingGood;
  if (rating >= 6.0) return styles.ratingAverage;
  return styles.ratingPoor;
};

// Helper to get initials
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PlayerOfTheMatch({ lineups, homeTeam, awayTeam, matchId }: PlayerOfTheMatchProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [votesMap, setVotesMap] = useState<Record<number, number>>({});

  // 1. Process and extract rated players from active lineups
  const ratedPlayers = React.useMemo(() => {
    if (!lineups) return [];
    
    const homeXI = lineups.home?.startXI || [];
    const homeSubs = lineups.home?.substitutes || [];
    const awayXI = lineups.away?.startXI || [];
    const awaySubs = lineups.away?.substitutes || [];

    const homeAll = homeXI.concat(homeSubs).map(p => ({ ...p, isHome: true, teamName: homeTeam.name }));
    const awayAll = awayXI.concat(awaySubs).map(p => ({ ...p, isHome: false, teamName: awayTeam.name }));

    return homeAll
      .concat(awayAll)
      .filter((p) => p.rating && p.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [lineups, homeTeam, awayTeam]);

  // 2. Fallback voting candidates if no ratings exist
  const votingCandidates = React.useMemo<Candidate[]>(() => {
    // If we have lineups, pick top 2 attackers/midfielders from each team
    const findTopTwo = (xi: any[], subs: any[], isHome: boolean): Candidate[] => {
      const all = xi.concat(subs);
      // Filter attacking or midfield positions first
      const attackMid = all.filter(p => p.position === "F" || p.position === "M");
      const list = attackMid.length >= 2 ? attackMid : all;
      return list.slice(0, 2).map((p, idx) => ({
        id: p.id || (isHome ? 1000 + idx : 2000 + idx),
        name: p.name,
        number: p.number || (idx === 0 ? 10 : 7),
        position: p.position || "M",
        isHome,
        basePercentage: isHome ? (idx === 0 ? 40 : 25) : (idx === 0 ? 20 : 15)
      }));
    };

    if (lineups && lineups.home?.startXI?.length > 0) {
      const homeStar = findTopTwo(lineups.home.startXI, lineups.home.substitutes, true);
      const awayStar = findTopTwo(lineups.away.startXI, lineups.away.substitutes, false);
      return [...homeStar, ...awayStar];
    }

    // Hardcoded static star fallbacks for key teams, otherwise generic
    const isArsenalMatch = homeTeam.name.toLowerCase().includes("arsenal") || awayTeam.name.toLowerCase().includes("arsenal");
    if (isArsenalMatch) {
      const homeIsArsenal = homeTeam.name.toLowerCase().includes("arsenal");
      return [
        { id: 101, name: "Bukayo Saka", number: 7, position: "F", isHome: homeIsArsenal, basePercentage: 42 },
        { id: 102, name: "Martin Odegaard", number: 8, position: "M", isHome: homeIsArsenal, basePercentage: 28 },
        { id: 201, name: "Cole Palmer", number: 20, position: "F", isHome: !homeIsArsenal, basePercentage: 20 },
        { id: 202, name: "Nicolas Jackson", number: 15, position: "F", isHome: !homeIsArsenal, basePercentage: 10 }
      ];
    }

    // Default USL Star players
    return [
      { id: 301, name: homeTeam.name.includes("Legion") ? "Enzo Martinez" : "Home Star A", number: 19, position: "M", isHome: true, basePercentage: 40 },
      { id: 302, name: homeTeam.name.includes("Legion") ? "Neco Brett" : "Home Star B", number: 11, position: "F", isHome: true, basePercentage: 25 },
      { id: 401, name: awayTeam.name.includes("Island") ? "Albert Dikwa" : "Away Star A", number: 9, position: "F", isHome: false, basePercentage: 20 },
      { id: 402, name: awayTeam.name.includes("Island") ? "Clay Holstad" : "Away Star B", number: 16, position: "M", isHome: false, basePercentage: 15 }
    ];
  }, [lineups, homeTeam, awayTeam]);

  // Load vote from localStorage
  useEffect(() => {
    const savedVote = localStorage.getItem(`golason-potm-vote-${matchId}`);
    if (savedVote) {
      const parsedCandidateId = parseInt(savedVote, 10);
      setSelectedCandidate(parsedCandidateId);
      setHasVoted(true);
    }
  }, [matchId]);

  const handleVote = (candidateId: number) => {
    if (hasVoted) return;
    localStorage.setItem(`golason-potm-vote-${matchId}`, String(candidateId));
    setSelectedCandidate(candidateId);
    setHasVoted(true);
  };

  // Display Podium Mode if ratings are present!
  if (ratedPlayers.length > 0) {
    const winner = ratedPlayers[0];
    const runnersUp = ratedPlayers.slice(1, 3);

    return (
      <section className={styles.potmCard} aria-label="Player of the Match Podium">
        <div className={styles.cardHeader}>
          <Award className={styles.headerIcon} size={18} />
          <h3 className={styles.cardTitle}>Player of the Match</h3>
          <span className={styles.verifiedBadge}>
            <Sparkles size={12} style={{ marginRight: "3px" }} />
            Official Ratings
          </span>
        </div>

        <div className={styles.podiumContainer}>
          {/* Winner Profile Segment */}
          <div className={`${styles.winnerSection} ${winner.isHome ? styles.homeWinnerBorder : styles.awayWinnerBorder}`}>
            <div className={styles.avatarWrapper}>
              <div className={`${styles.avatarLarge} ${winner.isHome ? styles.homeAvatar : styles.awayAvatar}`}>
                {getInitials(winner.name)}
              </div>
              <div className={styles.starCrown}>
                <Star size={16} fill="currentColor" />
              </div>
            </div>

            <div className={styles.winnerInfo}>
              <h4 className={styles.winnerName}>{winner.name}</h4>
              <span className={styles.winnerTeam}>
                {winner.isHome ? homeTeam.name : awayTeam.name} • #{winner.number}
              </span>
              <div className={styles.statsOverview}>
                <span className={styles.statsLabel}>Position:</span>
                <span className={styles.statsVal}>{winner.position === "G" ? "Goalkeeper" : winner.position === "D" ? "Defender" : winner.position === "M" ? "Midfielder" : "Forward"}</span>
              </div>
            </div>

            <div className={`${styles.ratingPillLarge} ${getRatingColorClass(winner.rating || 0)}`}>
              {winner.rating?.toFixed(1)}
            </div>
          </div>

          {/* Runners Up List Segment */}
          {runnersUp.length > 0 && (
            <div className={styles.runnersUpSection}>
              <h5 className={styles.runnersTitle}>Top Performers</h5>
              <div className={styles.runnersList}>
                {runnersUp.map((player, rank) => (
                  <div key={player.id || rank} className={styles.runnerRow}>
                    <span className={styles.runnerRank}>{rank + 2}</span>
                    <div className={`${styles.avatarSmall} ${player.isHome ? styles.homeAvatar : styles.awayAvatar}`}>
                      {getInitials(player.name)}
                    </div>
                    <div className={styles.runnerInfo}>
                      <span className={styles.runnerName}>{player.name}</span>
                      <span className={styles.runnerTeam}>
                        {player.isHome ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                    <div className={`${styles.ratingPillSmall} ${getRatingColorClass(player.rating || 0)}`}>
                      {player.rating?.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Pre-Match Voting Mode!
  const totalBase = votingCandidates.reduce((sum, c) => sum + c.basePercentage, 0);

  return (
    <section className={styles.potmCard} aria-label="Who will be the Player of the Match voting card">
      <div className={styles.cardHeader}>
        <ThumbsUp className={styles.headerIcon} size={18} />
        <h3 className={styles.cardTitle}>Who will be the Player of the Match?</h3>
      </div>

      <p className={styles.votePrompt}>
        Vote for the star player you expect to deliver the most outstanding performance in today&apos;s fixture.
      </p>

      <div className={styles.candidatesGrid}>
        {votingCandidates.map((candidate) => {
          // Adjust percentages if voted to highlight user choice
          let displayPercentage = Math.round((candidate.basePercentage / totalBase) * 100);
          if (hasVoted) {
            if (candidate.id === selectedCandidate) {
              displayPercentage = Math.min(100, displayPercentage + 8);
            } else {
              displayPercentage = Math.max(0, displayPercentage - 2);
            }
          }

          return (
            <button
              key={candidate.id}
              className={`${styles.candidateBtn} ${hasVoted ? styles.votedMode : ""} ${
                selectedCandidate === candidate.id ? styles.userSelected : ""
              }`}
              onClick={() => handleVote(candidate.id)}
              disabled={hasVoted}
              aria-label={`Vote for ${candidate.name}`}
            >
              {/* Animated Progress Background Bar */}
              {hasVoted && (
                <div
                  className={`${styles.progressBar} ${candidate.isHome ? styles.homeProgress : styles.awayProgress}`}
                  style={{ width: `${displayPercentage}%` }}
                />
              )}

              <div className={styles.candidateBtnContent}>
                <div className={`${styles.candidateAvatar} ${candidate.isHome ? styles.homeAvatar : styles.awayAvatar}`}>
                  {getInitials(candidate.name)}
                </div>
                <div className={styles.candidateDetails}>
                  <span className={styles.candidateName}>{candidate.name}</span>
                  <span className={styles.candidateSub}>
                    {candidate.isHome ? homeTeam.name : awayTeam.name} • #{candidate.number}
                  </span>
                </div>
                {hasVoted && <span className={styles.percentageLabel}>{displayPercentage}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}