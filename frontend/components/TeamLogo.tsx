"use client";

import React, { useState } from "react";
import styles from "./TeamLogo.module.css";

export interface TeamLogoProps {
  logo?: string | null;
  name: string;
  size?: number; // Custom dimension sizes if needed
  className?: string;
}

export default function TeamLogo({ logo, name, size = 60, className = "" }: TeamLogoProps) {
  const [error, setError] = useState(false);

  if (!logo || error) {
    const safeName = name || "?";
    const initials = safeName.substring(0, 2).toUpperCase();
    
    // Generate a deterministic background color based on the team name
    let hash = 0;
    for (let i = 0; i < safeName.length; i++) {
      hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#06b6d4", // cyan
      "#14b8a6"  // teal
    ];
    const backgroundColor = colors[Math.abs(hash) % colors.length];

    return (
      <div 
        className={`${styles.logoFallback} ${className}`} 
        style={{ 
          backgroundColor, 
          width: `${size}px`, 
          height: `${size}px`,
          fontSize: `${size * 0.38}px`
        }} 
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={logo} 
      alt={`${name} Logo`} 
      className={`${styles.logoImage} ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain" }}
      onError={() => {
        console.warn(`[TeamLogo] Failed to load logo image: ${logo}. Triggering initials fallback for: ${name}`);
        setError(true);
      }}
      loading="lazy" 
    />
  );
}
