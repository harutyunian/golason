'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X, Trophy } from "lucide-react";
import SearchResultItem from "./SearchResultItem";
import styles from "./SearchBar.module.css";

interface SearchItem {
  id: number;
  name?: string;
  logo?: string;
  photo?: string;
  type: "team" | "player" | "match" | "competition";
  position?: string;
  homeTeam?: string;
  awayTeam?: string;
  date?: string;
  country?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    teams: SearchItem[];
    players: SearchItem[];
    matches: SearchItem[];
    competitions: SearchItem[];
  }>({ teams: [], players: [], matches: [], competitions: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<"All" | "Team" | "Player" | "Match" | "Competition">("All");

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce-fetch query results
  useEffect(() => {
    if (!query.trim()) {
      setResults({ teams: [], players: [], matches: [], competitions: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiBase}/football/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            teams: data.teams || [],
            players: data.players || [],
            matches: data.matches || [],
            competitions: data.competitions || [],
          });
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered results based on the active tab
  const getFilteredResults = () => {
    switch (activeTab) {
      case "Team":
        return results.teams;
      case "Player":
        return results.players;
      case "Match":
        return results.matches;
      case "Competition":
        return results.competitions;
      case "All":
      default:
        return [
          ...results.teams,
          ...results.players,
          ...results.matches,
          ...results.competitions,
        ];
    }
  };

  const flattenedResults = getFilteredResults();

  // Reset selected index when tab changes
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flattenedResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flattenedResults.length) % flattenedResults.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        handleItemClick(flattenedResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleItemClick = (item: SearchItem) => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
    setActiveTab("All");
    if (item.type === "match") {
      router.push(`/match/${item.id}`);
    } else if (item.type === "competition") {
      router.push(`/`); // since no /league exists, route to home
    } else {
      router.push(`/${item.type}/${item.id}`);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className={styles.overlayBackdrop} 
          onClick={() => {
            setIsOpen(false);
            inputRef.current?.blur();
          }} 
        />
      )}
      
      <div className={`${styles.searchContainer} ${isOpen ? styles.focused : ""}`} ref={containerRef}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams, players, matches or competitions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
            aria-label="Search football data"
          />
          <div className={styles.iconWrapper}>
            {loading ? (
              <Loader2 className={`${styles.searchIcon} ${styles.spinner}`} size={16} />
            ) : isOpen ? (
              <button 
                type="button" 
                className={styles.clearButton} 
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery("");
                  if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : (
              <Search className={styles.searchIcon} size={16} />
            )}
          </div>
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            {/* Category Tabs */}
            <div className={styles.tabsContainer}>
              {(["All", "Team", "Player", "Match", "Competition"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTabChange(tab);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {query.trim() === "" ? (
              <div className={styles.instructionState}>
                <div className={styles.instructionIcon}>
                  <Trophy size={48} className={styles.instructionTrophy} />
                </div>
                <p className={styles.instructionTitle}>Expansive Search</p>
                <p className={styles.instructionText}>
                  Find matches, teams, players, and leagues easily from anywhere on the platform.
                </p>
              </div>
            ) : (
              <>
                {flattenedResults.length === 0 && !loading && (
                  <div className={styles.emptyState}>No results found for &quot;{query}&quot;</div>
                )}

                {/* Teams Section */}
                {(activeTab === "All" || activeTab === "Team") && results.teams.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeader}>Teams</h4>
                    {results.teams.map((team) => {
                      const globalIndex = flattenedResults.indexOf(team);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <SearchResultItem
                          key={`team-${team.id}`}
                          item={team}
                          isSelected={isSelected}
                          onClick={() => handleItemClick(team)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Players Section */}
                {(activeTab === "All" || activeTab === "Player") && results.players.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeader}>Players</h4>
                    {results.players.map((player) => {
                      const globalIndex = flattenedResults.indexOf(player);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <SearchResultItem
                          key={`player-${player.id}`}
                          item={player}
                          isSelected={isSelected}
                          onClick={() => handleItemClick(player)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Matches Section */}
                {(activeTab === "All" || activeTab === "Match") && results.matches.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeader}>Matches</h4>
                    {results.matches.map((match) => {
                      const globalIndex = flattenedResults.indexOf(match);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <SearchResultItem
                          key={`match-${match.id}`}
                          item={match}
                          isSelected={isSelected}
                          onClick={() => handleItemClick(match)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Competitions Section */}
                {(activeTab === "All" || activeTab === "Competition") && results.competitions.length > 0 && (
                  <div className={styles.section}>
                    <h4 className={styles.sectionHeader}>Competitions</h4>
                    {results.competitions.map((comp) => {
                      const globalIndex = flattenedResults.indexOf(comp);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <SearchResultItem
                          key={`competition-${comp.id}`}
                          item={comp}
                          isSelected={isSelected}
                          onClick={() => handleItemClick(comp)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}