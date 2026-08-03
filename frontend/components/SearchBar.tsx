'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import styles from "./SearchBar.module.css";

interface SearchItem {
  id: number;
  name: string;
  logo?: string;
  photo?: string;
  type: "team" | "player";
  position?: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ teams: SearchItem[]; players: SearchItem[] }>({ teams: [], players: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce-fetch query results
  useEffect(() => {
    if (!query.trim()) {
      setResults({ teams: [], players: [] });
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

  const flattenedResults = [...results.teams, ...results.players];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flattenedResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flattenedResults.length) % flattenedResults.length);
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
    router.push(`/${item.type}/${item.id}`);
  };

  return (
    <div className={styles.searchContainer} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search teams or players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={styles.searchInput}
          aria-label="Search teams and players"
        />
        <div className={styles.iconWrapper}>
          {loading ? (
            <Loader2 className={`${styles.searchIcon} ${styles.spinner}`} size={16} />
          ) : (
            <Search className={styles.searchIcon} size={16} />
          )}
        </div>
      </div>

      {isOpen && (query.trim() !== "") && (
        <div className={styles.dropdown}>
          {flattenedResults.length === 0 && !loading && (
            <div className={styles.emptyState}>No results found</div>
          )}

          {results.teams.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionHeader}>Teams</h4>
              {results.teams.map((team) => {
                const globalIndex = flattenedResults.indexOf(team);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <div
                    key={`team-${team.id}`}
                    onClick={() => handleItemClick(team)}
                    className={`${styles.item} ${isSelected ? styles.selectedItem : ""}`}
                  >
                    <div className={styles.logoWrapper}>
                      {team.logo ? (
                        <Image
                          src={team.logo}
                          alt={team.name}
                          width={24}
                          height={24}
                          className={styles.logo}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.logoPlaceholder}>🛡️</div>
                      )}
                    </div>
                    <span className={styles.itemName}>{team.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          {results.players.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionHeader}>Players</h4>
              {results.players.map((player) => {
                const globalIndex = flattenedResults.indexOf(player);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <div
                    key={`player-${player.id}`}
                    onClick={() => handleItemClick(player)}
                    className={`${styles.item} ${isSelected ? styles.selectedItem : ""}`}
                  >
                    <div className={styles.logoWrapper}>
                      {player.photo ? (
                        <Image
                          src={player.photo}
                          alt={player.name}
                          width={24}
                          height={24}
                          className={styles.avatar}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.logoPlaceholder}>🏃</div>
                      )}
                    </div>
                    <div className={styles.playerInfo}>
                      <span className={styles.itemName}>{player.name}</span>
                      {player.position && (
                        <span className={styles.itemMeta}>{player.position}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}