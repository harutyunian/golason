"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Star, Flame, Award } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import DateSelector from "@/components/DateSelector";
import MatchCard, { MatchStatus } from "@/components/MatchCard";
import { useAuth } from "@/contexts/AuthContext";
import styles from "../app/page.module.css";

interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
}

interface TeamDetails {
  id: number;
  name: string;
  logo?: string | null;
}

interface MockMatch {
  id: number;
  league: League;
  status: MatchStatus;
  elapsedTime?: number | null;
  homeTeam: TeamDetails;
  awayTeam: TeamDetails;
  homeScore?: number | null;
  awayScore?: number | null;
  date: string;
}

interface DashboardFeedProps {
  initialMatches: MockMatch[];
  selectedDate: string;
}

// Helper to verify if a string is a standard external URL logo
const isUrl = (str: string) => str && (str.startsWith("http://") || str.startsWith("https://"));

export default function DashboardFeed({ initialMatches, selectedDate }: DashboardFeedProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "LIVE">("ALL");
  const { token, isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Synchronize favorites with user bookmarks from backend
  useEffect(() => {
    if (isAuthenticated && token) {
      const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      fetch(`${apiBase}/bookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setBookmarks(data);
        })
        .catch((err) => console.error("Failed to load bookmarks:", err));
    } else {
      setBookmarks([]);
    }
  }, [isAuthenticated, token]);

  const handleToggleBookmark = async (matchId: number) => {
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }

    const isBookmarked = bookmarks.some((b) => b.type === "match" && b.entity?.id === matchId);
    const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

    try {
      if (isBookmarked) {
        const res = await fetch(`${apiBase}/bookmarks/composite/match/${matchId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          setBookmarks((prev) => prev.filter((b) => !(b.type === "match" && b.entity?.id === matchId)));
        }
      } else {
        const res = await fetch(`${apiBase}/bookmarks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ matchId }),
        });
        if (res.ok) {
          const newBookmark = await res.json();
          const matchEntity = initialMatches.find((m) => m.id === matchId);
          setBookmarks((prev) => [
            {
              id: newBookmark.id,
              sport: "FOOTBALL",
              type: "match",
              entity: matchEntity || { id: matchId },
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const handleDateChange = (newDate: string) => {
    router.push(`/?date=${newDate}`);
  };

  // Filter matches based on client-side Live/All selection
  const filteredMatches =
    filter === "LIVE"
      ? initialMatches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME")
      : initialMatches;

  const liveCount = initialMatches.filter(
    (m) => m.status === "LIVE" || m.status === "HALFTIME"
  ).length;
  const totalCount = initialMatches.length;

  // Group filtered matches by league
  const groupedMatches: { [key: string]: { league: League; items: MockMatch[] } } = {};
  filteredMatches.forEach((match) => {
    const key = `league-${match.league.id}`;
    if (!groupedMatches[key]) {
      groupedMatches[key] = {
        league: match.league,
        items: [],
      };
    }
    groupedMatches[key].items.push(match);
  });

  const trendingLeagues = [
    { name: "Premier League", country: "England", logo: "🇬🇧", rank: 1 },
    { name: "La Liga", country: "Spain", logo: "🇪🇸", rank: 2 },
    { name: "Serie A", country: "Italy", logo: "🇮🇹", rank: 3 },
    { name: "Bundesliga", country: "Germany", logo: "🇩🇪", rank: 4 },
    { name: "Ligue 1", country: "France", logo: "🇫🇷", rank: 5 },
  ];

  return (
    <div className={styles.container}>
      {/* Top Billboard Section (Responsive) */}
      <div className={styles.adWrapper}>
        <AdBanner size="leaderboard" className={styles.desktopAd} />
        <AdBanner size="mobile" className={styles.mobileAd} />
      </div>

      {/* Calendar Section */}
      <div className={styles.calendarSection}>
        <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />
      </div>

      {/* Main Content Grid Layout */}
      <div className={styles.mainGrid}>
        {/* Main Feed Column */}
        <div className={styles.mainFeed}>
          <div className={styles.feedCard}>
            {/* Feed Sub-Header with Live/All Filter Toggle */}
            <div className={styles.feedHeader}>
              <div className={styles.filterTabs} role="tablist">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`${styles.tabBtn} ${filter === "ALL" ? styles.active : ""}`}
                  role="tab"
                  aria-selected={filter === "ALL"}
                >
                  All Matches
                  <span className={styles.matchCount}>{totalCount}</span>
                </button>
                <button
                  onClick={() => setFilter("LIVE")}
                  className={`${styles.tabBtn} ${filter === "LIVE" ? styles.active : ""}`}
                  role="tab"
                  aria-selected={filter === "LIVE"}
                >
                  <span className={styles.liveLabelContainer}>
                    <span className={`${styles.pulseDot} live-pulse`} />
                    Live
                  </span>
                  <span className={styles.matchCount}>{liveCount}</span>
                </button>
              </div>
            </div>

            {/* Match Feed Content */}
            {Object.keys(groupedMatches).length === 0 ? (
              <div className={styles.emptyFeed}>
                <Flame className={styles.emptyFeedIcon} size={40} />
                <p className={styles.emptyFeedText}>
                  {filter === "LIVE"
                    ? "No matches are currently live."
                    : "No matches scheduled for this date."}
                </p>
              </div>
            ) : (
              Object.values(groupedMatches).map(({ league, items }) => (
                <div key={league.id} className={styles.leagueGroup}>
                  {/* League Sub-Header */}
                  <div className={styles.leagueHeader}>
                    <span className={styles.leagueFlag} aria-hidden="true">
                      {isUrl(league.logo) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={league.logo} alt={`${league.name} Logo`} className={styles.leagueLogoImage} />
                      ) : (
                        league.logo
                      )}
                    </span>
                    <h3 className={styles.leagueName}>{league.name}</h3>
                    <span className={styles.leagueCountry}>{league.country}</span>
                  </div>

                  {/* League Match Cards */}
                  <div className={styles.matchList}>
                    {items.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={{
                          id: match.id,
                          status: match.status,
                          elapsedTime: match.elapsedTime,
                          homeTeam: match.homeTeam,
                          awayTeam: match.awayTeam,
                          homeScore: match.homeScore,
                          awayScore: match.awayScore,
                          date: match.date,
                        }}
                        isBookmarked={bookmarks.some(
                          (b) => b.type === "match" && b.entity?.id === match.id
                        )}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className={styles.sidebar}>
          {/* Sidebar Ad Slot */}
          <div className={styles.adWrapper}>
            <AdBanner size="rectangle" />
          </div>

          {/* Trending Leagues Panel */}
          <div className={styles.sidebarCard}>
            <h2 className={styles.sidebarTitle}>
              <Trophy size={18} className={styles.sidebarIcon} />
              Trending Leagues
            </h2>
            <div className={styles.sidebarList}>
              {trendingLeagues.map((league) => (
                <div key={league.name} className={styles.sidebarItem} role="link" tabIndex={0}>
                  <span className={styles.leagueFlag} aria-hidden="true">
                    {league.logo}
                  </span>
                  <div className={styles.sidebarTextContainer}>
                    <span>{league.name}</span>
                    <span className={styles.sidebarItemSub}>{league.country}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Favorites Panel */}
          <div className={styles.sidebarCard}>
            <h2 className={styles.sidebarTitle}>
              <Star size={18} className={styles.sidebarIcon} />
              My Favorites
            </h2>
            {bookmarks.length > 0 ? (
              <div className={styles.sidebarList}>
                {bookmarks.map((b) => (
                  <div key={`${b.type}-${b.id}`} className={styles.sidebarItem}>
                    <span className={styles.leagueFlag} aria-hidden="true">
                      {b.type === "team" ? "🛡️" : b.type === "competition" ? "🏆" : "⚽"}
                    </span>
                    <div className={styles.sidebarTextContainer}>
                      {b.type === "match" ? (
                        <Link href={`/match/${b.entity?.id}`} className={styles.sidebarLink}>
                          {b.entity?.homeTeam?.name || "Match"} vs {b.entity?.awayTeam?.name || "Opponent"}
                        </Link>
                      ) : b.type === "team" ? (
                        <Link href={`/team/${b.entity?.id}`} className={styles.sidebarLink}>
                          {b.entity?.name}
                        </Link>
                      ) : (
                        <span className={styles.sidebarLink}>{b.entity?.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.favoritesEmpty}>
                <Award className={styles.favoritesEmptyIcon} size={32} />
                <p className={styles.favoritesEmptyText}>
                  {isAuthenticated
                    ? "You haven't bookmarked any matches yet! Click the star next to any match to pin it here."
                    : "Log in to bookmark leagues, teams, and matches, and see their live scores instantly."}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Billboard Section (Responsive) */}
      <div className={styles.adWrapper}>
        <AdBanner size="leaderboard" className={styles.desktopAd} />
        <AdBanner size="mobile" className={styles.mobileAd} />
      </div>
    </div>
  );
}
