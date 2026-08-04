"use client";

import React from "react";
import Link from "next/link";
import styles from "./PlayerLink.module.css";

export interface PlayerLinkProps {
  playerId?: number | string | null;
  children: React.ReactNode;
  className?: string;
}

export default function PlayerLink({ playerId, children, className = "" }: PlayerLinkProps) {
  // If playerId is valid (not null, undefined, or empty string)
  if (playerId !== undefined && playerId !== null && playerId !== "") {
    return (
      <Link 
        href={`/player/${playerId}`} 
        className={`${styles.playerLink} ${className}`}
      >
        {children}
      </Link>
    );
  }

  // Fallback if no valid ID is provided
  return (
    <span className={`${styles.playerSpan} ${className}`}>
      {children}
    </span>
  );
}