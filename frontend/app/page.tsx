"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Star, Flame, Award } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import DateSelector from "@/components/DateSelector";
import MatchCard, { MatchStatus } from "@/components/MatchCard";
import styles from "./page.module.css";

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

export default function Home() {
  // To avoid hydration mismatch warnings between server & client timezone/date evaluations,
  // we initialize with a stable date string and set it to today's local date on mount.
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-02");
  const [filter, setFilter] = useState<"ALL" | "LIVE">("ALL");

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Generate dynamic mockup matches for the selected date
  const getMockMatchesForDate = (dateStr: string): MockMatch[] => [
    {
      id: 101,
      league: { id: 1, name: "Premier League", country: "England", logo: "🇬🇧" },
      status: "LIVE",
      elapsedTime: 64,
      homeTeam: { id: 11, name: "Arsenal" },
      awayTeam: { id: 12, name: "Chelsea" },
      homeScore: 2,
      awayScore: 1,
      date: `${dateStr}T15:00:00`,
    },
    {
      id: 102,
      league: { id: 2, name: "La Liga", country: "Spain", logo: "🇪🇸" },
      status: "HALFTIME",
      elapsedTime: null,
      homeTeam: { id: 21, name: "Real Madrid" },
      awayTeam: { id: 22, name: "Barcelona" },
      homeScore: 0,
      awayScore: 0,
      date: `${dateStr}T16:15:00`,
    },
    {
      id: 103,
      league: { id: 3, name: "Serie A", country: "Italy", logo: "🇮🇹" },
      status: "SCHEDULED",
      elapsedTime: null,
      homeTeam: { id: 31, name: "Inter Milan" },
      awayTeam: { id: 32, name: "AC Milan" },
      homeScore: null,
      awayScore: null,
      date: `${dateStr}T20:45:00`,
    },
    {
      id: 104,
      league: { id: 1, name: "Premier League", country: "England", logo: "🇬🇧" },
      status: "FINISHED",
      elapsedTime: null,
      homeTeam: { id: 13, name: "Manchester City" },
      awayTeam: { id: 14, name: "Manchester United" },
      homeScore: 3,
      awayScore: 1,
      date: `${dateStr}T12:30:00`,
    },
    {
      id: 105,
      league: { id: 2, name: "La Liga", country: "Spain", logo: "🇪🇸" },
      status: "SCHEDULED",
      elapsedTime: null,
      homeTeam: { id: 23, name: "Atletico Madrid" },
      awayTeam: { id: 24, name: "Sevilla" },
      homeScore: null,
      awayScore: null,
      date: `${dateStr}T18:00:00`,
    },
  ];

  const matches = getMockMatchesForDate(selectedDate);

  // Filter matches based on the active tab
  const filteredMatches =
    filter === "LIVE"
      ? matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME")
      : matches;

  // Calculate live and total match counts
  const liveCount = matches.filter(
    (m) => m.status === "LIVE" || m.status === "HALFTIME"
  ).length;
  const totalCount = matches.length;

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
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Top Billboard Section (Responsive) */}
        <div className={styles.adWrapper}>
          <AdBanner size="leaderboard" className={styles.desktopAd} />
          <AdBanner size="mobile" className={styles.mobileAd} />
        </div>

        {/* Calendar Section */}
        <div className={styles.calendarSection}>
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
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
                        {league.logo}
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
              <div className={styles.favoritesEmpty}>
                <Award className={styles.favoritesEmptyIcon} size={32} />
                <p className={styles.favoritesEmptyText}>
                  Favorite leagues and teams to view their live scores instantly at the top of your feed.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Billboard Section (Responsive) */}
        <div className={styles.adWrapper}>
          <AdBanner size="leaderboard" className={styles.desktopAd} />
          <AdBanner size="mobile" className={styles.mobileAd} />
        </div>
      </div>
    </main>
  );
}
