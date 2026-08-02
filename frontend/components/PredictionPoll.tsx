"use client";

import React, { useState, useEffect } from "react";
import { Check, Vote as VoteIcon } from "lucide-react";
import styles from "./PredictionPoll.module.css";

export interface PredictionPollProps {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
}

type VoteChoice = "HOME" | "DRAW" | "AWAY";

export default function PredictionPoll({ matchId, homeTeamName, awayTeamName }: PredictionPollProps) {
  const [votedChoice, setVotedChoice] = useState<VoteChoice | null>(null);
  const [isMounting, setIsMounting] = useState(true);

  // Generate deterministic mock vote percentages based on the match ID
  // so the poll results look realistic and consistent for each specific game!
  const percentages = React.useMemo(() => {
    const hash = (matchId * 7919) % 100;
    const homePercent = Math.max(25, Math.min(65, 30 + (hash % 35)));
    const drawPercent = Math.max(15, Math.min(35, 15 + ((hash * 7) % 20)));
    const awayPercent = 100 - homePercent - drawPercent;

    return {
      HOME: homePercent,
      DRAW: drawPercent,
      AWAY: awayPercent,
    };
  }, [matchId]);

  // Load vote from localStorage on client-side mount (prevents SSR hydration drift)
  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(`vote-match-${matchId}`);
      if (savedVote === "HOME" || savedVote === "DRAW" || savedVote === "AWAY") {
        setVotedChoice(savedVote);
      }
    } catch (err) {
      console.error("[PredictionPoll] Failed to load vote from localStorage", err);
    } finally {
      setIsMounting(false);
    }
  }, [matchId]);

  const handleVote = (choice: VoteChoice) => {
    try {
      localStorage.setItem(`vote-match-${matchId}`, choice);
      setVotedChoice(choice);
    } catch (err) {
      console.error("[PredictionPoll] Failed to save vote to localStorage", err);
    }
  };

  // Prevent flash or layout shifts during initial SSR hydration
  if (isMounting) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingPlaceholder} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <VoteIcon size={18} className={styles.titleIcon} />
        Who will win today?
      </h3>

      {votedChoice ? (
        // Post-voting State: Beautiful progress bars showing results
        <div className={styles.resultsWrapper} aria-label="Prediction poll results">
          {/* Home Win Bar */}
          <div className={`${styles.resultRow} ${votedChoice === "HOME" ? styles.votedRow : ""}`}>
            <div className={styles.resultHeader}>
              <span className={styles.choiceLabel}>
                {votedChoice === "HOME" && <Check size={14} className={styles.checkIcon} />}
                {homeTeamName}
              </span>
              <span className={styles.percentageValue}>{percentages.HOME}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={`${styles.progressBarFill} ${votedChoice === "HOME" ? styles.progressBarVoted : ""}`} 
                style={{ width: `${percentages.HOME}%` }}
              />
            </div>
          </div>

          {/* Draw Bar */}
          <div className={`${styles.resultRow} ${votedChoice === "DRAW" ? styles.votedRow : ""}`}>
            <div className={styles.resultHeader}>
              <span className={styles.choiceLabel}>
                {votedChoice === "DRAW" && <Check size={14} className={styles.checkIcon} />}
                Draw
              </span>
              <span className={styles.percentageValue}>{percentages.DRAW}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={`${styles.progressBarFill} ${votedChoice === "DRAW" ? styles.progressBarVoted : ""}`} 
                style={{ width: `${percentages.DRAW}%` }}
              />
            </div>
          </div>

          {/* Away Win Bar */}
          <div className={`${styles.resultRow} ${votedChoice === "AWAY" ? styles.votedRow : ""}`}>
            <div className={styles.resultHeader}>
              <span className={styles.choiceLabel}>
                {votedChoice === "AWAY" && <Check size={14} className={styles.checkIcon} />}
                {awayTeamName}
              </span>
              <span className={styles.percentageValue}>{percentages.AWAY}%</span>
            </div>
            <div className={styles.progressBarBg}>
              <div 
                className={`${styles.progressBarFill} ${votedChoice === "AWAY" ? styles.progressBarVoted : ""}`} 
                style={{ width: `${percentages.AWAY}%` }}
              />
            </div>
          </div>
          
          <div className={styles.votedStatusMsg}>
            Thank you! Your prediction has been registered.
          </div>
        </div>
      ) : (
        // Pre-voting State: Three interactive buttons
        <div className={styles.buttonsGrid} role="group" aria-label="Select match outcome prediction">
          <button
            className={styles.voteBtn}
            onClick={() => handleVote("HOME")}
            aria-label={`Vote for Home team: ${homeTeamName}`}
          >
            <span className={styles.btnLabel}>{homeTeamName}</span>
          </button>
          <button
            className={styles.voteBtn}
            onClick={() => handleVote("DRAW")}
            aria-label="Vote for Draw"
          >
            <span className={styles.btnLabel}>Draw</span>
          </button>
          <button
            className={styles.voteBtn}
            onClick={() => handleVote("AWAY")}
            aria-label={`Vote for Away team: ${awayTeamName}`}
          >
            <span className={styles.btnLabel}>{awayTeamName}</span>
          </button>
        </div>
      )}
    </div>
  );
}
