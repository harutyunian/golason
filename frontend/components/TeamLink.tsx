"use client";

import React from "react";
import Link from "next/link";
import styles from "./TeamLink.module.css";

export interface TeamLinkProps {
  teamId?: number | string | null;
  children: React.ReactNode;
  className?: string;
}

export default function TeamLink({ teamId, children, className = "" }: TeamLinkProps) {
  // If teamId is valid (not null, undefined, or empty string)
  if (teamId !== undefined && teamId !== null && teamId !== "") {
    return (
      <Link 
        href={`/team/${teamId}`} 
        className={`${styles.teamLink} ${className}`}
      >
        {children}
      </Link>
    );
  }

  // Fallback if no valid ID is provided
  return (
    <span className={`${styles.teamSpan} ${className}`}>
      {children}
    </span>
  );
}
