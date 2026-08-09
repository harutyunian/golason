"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Info, Search, X } from "lucide-react";
import { getApiBaseUrl } from "@/utils/api";
import styles from "./PlayerAttributeOverview.module.css";

interface Attributes {
  att: number;
  tec: number;
  tac: number;
  def: number;
  cre: number;
}

interface PlayerAttributeOverviewProps {
  playerId: number;
  playerName: string;
  playerPosition: string | null;
  initialAttributes: Attributes;
}

// 5 vertices of the pentagon corresponding to: ATT, TEC, TAC, DEF, CRE
const ATTRIBUTES = ["ATT", "TEC", "TAC", "DEF", "CRE"] as const;

// Geometry Config
const CX = 190;
const CY = 135;
const R = 90; // maximum radius for 100% score

// Position groups for average toggling
const POSITION_AVERAGES = {
  Goalkeeper: { att: 15, tec: 35, tac: 70, def: 80, cre: 20 },
  Defender: { att: 32, tec: 48, tac: 65, def: 72, cre: 38 },
  Midfielder: { att: 52, tec: 65, tac: 58, def: 46, cre: 68 },
  Attacker: { att: 68, tec: 62, tac: 44, def: 28, cre: 55 },
};

const getNormalizedPositionGroup = (pos: string | null): keyof typeof POSITION_AVERAGES => {
  const p = (pos || "").toLowerCase();
  if (p.includes("keeper") || p.includes("goalkeep") || p === "gk") return "Goalkeeper";
  if (p.includes("defen") || p === "df") return "Defender";
  if (p.includes("mid") || p === "mf") return "Midfielder";
  return "Attacker";
};

// Deterministic career history generator based on player ID and year
const getAttributesForYear = (playerAttributes: Attributes, playerId: number, year: number): Attributes => {
  if (year === 2026) return playerAttributes;

  const diff = 2026 - year; // 1, 2, or 3
  const seed = (playerId * year) % 100;

  const decay = (val: number, yearDiff: number, attrSeed: number) => {
    // Simulated younger-year progression (2-5 rating decrease per year in the past)
    const baseDecay = yearDiff * 3;
    const variation = (attrSeed % 5) - 2; // -2 to 2
    return Math.min(99, Math.max(30, Math.round(val - (baseDecay + variation))));
  };

  return {
    att: decay(playerAttributes.att, diff, seed),
    tec: decay(playerAttributes.tec, diff, seed + 1),
    tac: decay(playerAttributes.tac, diff, seed + 2),
    def: decay(playerAttributes.def, diff, seed + 3),
    cre: decay(playerAttributes.cre, diff, seed + 4),
  };
};

export default function PlayerAttributeOverview({
  playerId,
  playerName,
  playerPosition,
  initialAttributes = { att: 50, tec: 50, tac: 50, def: 50, cre: 50 },
}: PlayerAttributeOverviewProps) {
  const [activeYear, setActiveYear] = useState<2023 | 2024 | 2025 | 2026>(2026);
  const [showAverages, setShowAverages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [comparedPlayer, setComparedPlayer] = useState<any | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute primary attributes for the selected year
  const activeAttributes = getAttributesForYear(initialAttributes, playerId, activeYear);

  // Parse standard averages for this player's position
  const posGroup = getNormalizedPositionGroup(playerPosition);
  const posAverages = POSITION_AVERAGES[posGroup];

  // Helper: calculate coordinates for a vertex
  const getVertexCoords = (index: number, score: number) => {
    const angle = -Math.PI / 2 + index * ((2 * Math.PI) / 5);
    const r = (score / 100) * R;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path string from a set of attributes
  const getPolygonPointsStr = (attrs: Attributes) => {
    const p1 = getVertexCoords(0, attrs.att);
    const p2 = getVertexCoords(1, attrs.tec);
    const p3 = getVertexCoords(2, attrs.tac);
    const p4 = getVertexCoords(3, attrs.def);
    const p5 = getVertexCoords(4, attrs.cre);
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p5.x},${p5.y}`;
  };

  // Build a scaled polygon points string (to make a beautiful concentric double border)
  const getScaledPolygonPointsStr = (attrs: Attributes, scale: number) => {
    const p1 = getVertexCoords(0, attrs.att * scale);
    const p2 = getVertexCoords(1, attrs.tec * scale);
    const p3 = getVertexCoords(2, attrs.tac * scale);
    const p4 = getVertexCoords(3, attrs.def * scale);
    const p5 = getVertexCoords(4, attrs.cre * scale);
    return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y} ${p5.x},${p5.y}`;
  };

  // Autocomplete Search fetch
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/football/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out the current player from search results
          const players = (data.players || []).filter((p: any) => p.id !== playerId);
          setSearchResults(players);
        }
      } catch (err) {
        console.error("Failed to query players for comparison:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, playerId]);

  // Click outside search listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch full details of the player chosen for comparison
  const handleSelectComparePlayer = async (target: any) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults([]);

    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/football/players/${target.id}`);
      if (res.ok) {
        const playerDetails = await res.json();
        setComparedPlayer(playerDetails);
      }
    } catch (err) {
      console.error("Failed to retrieve compared player profile:", err);
    }
  };

  const handleClearComparison = () => {
    setComparedPlayer(null);
  };

  // Toggle averages when graph is clicked
  const handleGraphClick = () => {
    setShowAverages((prev) => !prev);
  };

  return (
    <div className={styles.card} ref={containerRef}>
      <header className={styles.header}>
        <h3 className={styles.title}>Attribute Overview</h3>
        <span title="Displays attacking, technical, tactical, defending, and creativity dimensions based on real match stats.">
          <Info size={16} className={styles.infoIcon} />
        </span>
      </header>

      {/* Interactive Radar Chart Graph */}
      <div className={styles.chartContainer} onClick={handleGraphClick} title="Click to toggle position average lines">
        <svg viewBox="0 0 380 270" className={styles.svg}>
          {/* Definitions for color gradients & styles */}
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(22, 34, 53, 0.4)" />
              <stop offset="100%" stopColor="rgba(11, 17, 30, 0.85)" />
            </radialGradient>
          </defs>

          {/* Concentric Background Grid Pentagons */}
          {[1.0, 0.8, 0.6, 0.4, 0.2].map((scale, sIdx) => {
            const gridAttrs = { att: 100 * scale, tec: 100 * scale, tac: 100 * scale, def: 100 * scale, cre: 100 * scale };
            const points = getPolygonPointsStr(gridAttrs);
            return (
              <polygon
                key={`grid-${scale}`}
                points={points}
                fill={sIdx === 0 ? "url(#bgGrad)" : "none"}
                stroke="var(--card-border)"
                strokeWidth="1"
                opacity={sIdx === 0 ? 0.95 : 0.4}
              />
            );
          })}

          {/* Radar Spokes */}
          {[0, 1, 2, 3, 4].map((index) => {
            const endCoords = getVertexCoords(index, 100);
            return (
              <line
                key={`spoke-${index}`}
                x1={CX}
                y1={CY}
                x2={endCoords.x}
                y2={endCoords.y}
                stroke="var(--card-border)"
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}

          {/* 1. Positional Average Overlay Polygon (if active) */}
          {showAverages && (
            <polygon
              points={getPolygonPointsStr(posAverages)}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.8"
            />
          )}

          {/* 2. Compared Player Polygon (if active) */}
          {comparedPlayer && comparedPlayer.attributes && (
            <>
              {/* Outer stroke */}
              <polygon
                points={getPolygonPointsStr(comparedPlayer.attributes)}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="#3b82f6"
                strokeWidth="2.5"
                opacity="0.95"
              />
              {/* Concentric inner stroke */}
              <polygon
                points={getScaledPolygonPointsStr(comparedPlayer.attributes, 0.93)}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.2"
                opacity="0.9"
              />
            </>
          )}

          {/* 3. Primary Player Polygon */}
          {/* Outer stroke */}
          <polygon
            points={getPolygonPointsStr(activeAttributes)}
            fill="rgba(2, 184, 117, 0.16)"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            opacity="0.95"
          />
          {/* Concentric inner stroke forming the premium SofaScore double green-lined look */}
          <polygon
            points={getScaledPolygonPointsStr(activeAttributes, 0.93)}
            fill="none"
            stroke="var(--color-primary-light)"
            strokeWidth="1.2"
            opacity="0.9"
          />

          {/* Labels & Score Badges */}
          {ATTRIBUTES.map((label, idx) => {
            const rawScore = activeAttributes[label.toLowerCase() as keyof Attributes];
            const vertexCoord = getVertexCoords(idx, 100);

            // Compute anchor offsets to place labels and red badges cleanly
            const labelDist = R + 22;
            const angle = -Math.PI / 2 + idx * ((2 * Math.PI) / 5);
            const labelX = CX + labelDist * Math.cos(angle);
            const labelY = CY + labelDist * Math.sin(angle);

            const placement = getLabelPlacement(idx, labelX, labelY);

            // Red badge box rendering
            const bW = 18;
            const bH = 15;
            const bX = placement.badgeX - bW / 2;
            const bY = placement.badgeY - bH / 2 + 10;

            // Compared player secondary score badge (only if comparing)
            const comparedScore = comparedPlayer?.attributes?.[label.toLowerCase() as keyof Attributes];

            return (
              <g key={`lbl-g-${label}`}>
                {/* Attribute Text label */}
                <text
                  x={placement.textX}
                  y={labelY + 4}
                  className={styles.labelText}
                  textAnchor={placement.textAnchor}
                >
                  {label}
                </text>

                {/* Primary Player Red Score Badge */}
                <rect x={bX} y={bY} width={bW} height={bH} rx="3" fill="#ef4444" />
                <text x={bX + bW / 2} y={bY + bH / 2} className={styles.badgeText}>
                  {rawScore}
                </text>

                {/* Compared Player Blue Score Badge (below the primary badge) */}
                {comparedScore !== undefined && (
                  <g>
                    <rect x={bX} y={bY + 17} width={bW} height={bH} rx="3" fill="#3b82f6" />
                    <text x={bX + bW / 2} y={bY + 17 + bH / 2} className={styles.badgeText}>
                      {comparedScore}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Timeline Slider */}
      <div className={styles.timelineContainer}>
        <div className={styles.sliderTrack}>
          <div className={styles.sliderPoints}>
            {([2023, 2024, 2025, 2026] as const).map((year) => {
              const isActive = activeYear === year;
              const percentage = ((year - 2023) / 3) * 100;
              return (
                <div
                  key={year}
                  className={`${styles.sliderPoint} ${isActive ? styles.sliderPointActive : ""}`}
                  style={{ left: `${percentage}%`, transform: `translate(-50%, -50%) ${isActive ? "scale(1.4)" : ""}` }}
                  onClick={() => setActiveYear(year)}
                >
                  <span className={styles.pointLabel}>{year === 2026 ? "Aug 2026" : `Aug ${year}`}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Player Comparison Box */}
      <div className={styles.compareContainer}>
        {comparedPlayer ? (
          <div className={styles.comparisonActiveBanner}>
            <div className={styles.comparisonMeta}>
              <Image
                src={comparedPlayer.photo || "https://media.api-sports.io/football/players/placeholder.png"}
                alt={comparedPlayer.name}
                className={styles.dropdownPhoto}
                width={32}
                height={32}
              />
              <span>
                Comparing with <span className={styles.comparisonTargetName}>{comparedPlayer.name}</span>
              </span>
            </div>
            <button className={styles.clearCompareBtn} onClick={handleClearComparison} aria-label="Clear comparison">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className={styles.searchWrapper}>
            <div className={styles.avatar}>
              <Search size={18} />
            </div>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search to compare players..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <Search size={14} className={styles.searchIcon} />

              {/* Autocomplete Dropdown */}
              {showDropdown && (searchQuery.length >= 3 || searchResults.length > 0) && (
                <div className={styles.dropdown}>
                  {searchLoading && <div className={styles.noResults}>Searching sports servers...</div>}
                  {!searchLoading && searchResults.length === 0 && searchQuery.length >= 3 && (
                    <div className={styles.noResults}>No matching players found</div>
                  )}
                  {!searchLoading &&
                    searchResults.map((p) => (
                      <div
                        key={`compare-res-${p.id}`}
                        className={styles.dropdownItem}
                        onClick={() => handleSelectComparePlayer(p)}
                      >
                        <Image
                          src={p.photo || "https://media.api-sports.io/football/players/placeholder.png"}
                          alt={p.name}
                          className={styles.dropdownPhoto}
                          width={32}
                          height={32}
                        />
                        <div className={styles.dropdownMeta}>
                          <span className={styles.dropdownName}>{p.name}</span>
                          <span className={styles.dropdownSub}>
                            {p.position || "Player"} • {p.teamName || "No Club"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helpful Instructions note */}
      <footer className={styles.footerNote}>
        <Info size={12} className={styles.footerNoteIcon} />
        <span>Click the graph to see average values for {posGroup}s</span>
      </footer>
    </div>
  );
}

// Positioning Helper for label groups
const getLabelPlacement = (index: number, x: number, y: number) => {
  switch (index) {
    case 0: // ATT (top)
      return { textAnchor: "end" as const, textX: x - 4, textY: y, badgeX: x + 9, badgeY: y - 10 };
    case 1: // TEC (top-right)
      return { textAnchor: "start" as const, textX: x + 18, textY: y, badgeX: x - 6, badgeY: y - 10 };
    case 2: // TAC (bottom-right)
      return { textAnchor: "start" as const, textX: x + 18, textY: y, badgeX: x - 6, badgeY: y - 10 };
    case 3: // DEF (bottom-left)
      return { textAnchor: "start" as const, textX: x + 18, textY: y, badgeX: x - 6, badgeY: y - 10 };
    case 4: // CRE (top-left)
      return { textAnchor: "end" as const, textX: x - 4, textY: y, badgeX: x + 9, badgeY: y - 10 };
    default:
      return { textAnchor: "middle" as const, textX: x, textY: y, badgeX: x, badgeY: y };
  }
};
