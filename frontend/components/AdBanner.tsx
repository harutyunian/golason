import React from "react";
import styles from "./AdBanner.module.css";

export type AdBannerSize = "leaderboard" | "rectangle" | "mobile";

export interface AdBannerProps {
  /**
   * The size of the advertisement slot.
   * - "leaderboard": 728px width, 90px height.
   * - "rectangle": 300px width, 250px height.
   * - "mobile": 320px width, 50px height.
   */
  size: AdBannerSize;
  /**
   * Optional additional class name(s) to apply to the outer container.
   */
  className?: string;
  /**
   * Optional unique element ID.
   */
  id?: string;
}

const SIZE_CONFIG = {
  leaderboard: {
    label: "Leaderboard Banner",
    dimensions: "728 × 90",
    className: styles.leaderboard,
  },
  rectangle: {
    label: "Medium Rectangle",
    dimensions: "300 × 250",
    className: styles.rectangle,
  },
  mobile: {
    label: "Mobile Banner",
    dimensions: "320 × 50",
    className: styles.mobile,
  },
} as const;

/**
 * AdBanner Component
 *
 * A reusable placeholder component for advertisements with strict, fixed dimensions.
 * Specifying the width and height directly in CSS prevents Cumulative Layout Shift (CLS),
 * guaranteeing a CLS score of 0 for Core Web Vitals and SEO.
 */
export default function AdBanner({ size, className = "", id }: AdBannerProps) {
  const config = SIZE_CONFIG[size];

  if (!config) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Invalid size prop provided to AdBanner: "${size}"`);
    }
    return null;
  }

  return (
    <div
      id={id}
      className={`${styles.adContainer} ${config.className} ${className}`.trim()}
      role="region"
      aria-label={`Advertisement: ${config.label} (${config.dimensions})`}
    >
      {/* Decorative background visual element */}
      <div className={styles.pattern} aria-hidden="true" />
      
      <span className={styles.adLabel}>Advertisement</span>
      <h4 className={styles.adContent}>{config.label}</h4>
      <span className={styles.adDimensions}>{config.dimensions}</span>
    </div>
  );
}
