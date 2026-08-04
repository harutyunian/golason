import React from "react";
import DashboardFeed from "@/components/DashboardFeed";

// Forces server-side dynamic rendering on runtime (vital for live scores and SEO!)
export const dynamic = "force-dynamic";

interface SearchParams {
  date?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams> | SearchParams; // Compatible with both Next.js 14 and 15
}

const getTodayDateString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Graceful fallback mock matches in case the backend NestJS service is down/offline
const getFallbackMatches = (dateStr: string) => [
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

export default async function Home({ searchParams }: PageProps) {
  // 1. Resolve date parameter cleanly from the URL search query (?date=YYYY-MM-DD)
  // Await searchParams to fully support Next.js 15 dynamic APIs
  const params = await searchParams;
  const resolvedDate = params?.date || getTodayDateString();

  let matches = [];

  try {
    // 2. Server-Side fetch matches for resolvedDate from our NestJS backend API
    const apiBase = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3001";
    const res = await fetch(`${apiBase}/football/fixtures?date=${resolvedDate}`, {
      cache: "no-store", // Guarantees we never cache live scores on server component builds
      headers: {
        "Accept": "application/json",
      },
    });

    if (res.ok) {
      matches = await res.json();
    } else {
      throw new Error(`Failed to fetch fixtures: status ${res.status}`);
    }
  } catch (err) {
    // Graceful fallback to prevent build/runtime breaks if NestJS is not running
    console.warn("NestJS API offline. Falling back to local high-fidelity mock matches.", err);
    matches = getFallbackMatches(resolvedDate);
  }

  // 3. Render clean SEO raw HTML and hand interactive hydration to DashboardFeed client module
  return <DashboardFeed initialMatches={matches} selectedDate={resolvedDate} />;
}
