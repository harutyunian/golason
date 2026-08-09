import React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Building2, BarChart2 } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import MatchCard from "@/components/MatchCard";
import AdBanner from "@/components/AdBanner";
import StandingsTable from "@/components/StandingsTable";
import styles from "./team.module.css";

// Forces server-side dynamic rendering on runtime (vital for live scores and SEO!)
export const dynamic = "force-dynamic";

interface TeamProfile {
  id: number;
  name: string;
  logo: string | null;
  founded: number | null;
  venueName: string | null;
  venueCity: string | null;
  country: string;
  recentMatches: any[];
  upcomingMatches: any[];
}

interface TeamPageProps {
  params: Promise<{ id: string }> | { id: string };
}

// Graceful fallback mock team profile in case NestJS backend is offline during compilation/renders
const getFallbackTeamProfile = (idStr: string): TeamProfile => {
  const teamId = Number(idStr) || 42;
  const isArsenal = teamId === 42;

  return {
    id: teamId,
    name: isArsenal ? "Arsenal" : "Chelsea",
    logo: isArsenal ? "https://media.api-sports.io/football/teams/42.png" : "https://media.api-sports.io/football/teams/49.png",
    founded: isArsenal ? 1886 : 1905,
    venueName: isArsenal ? "Emirates Stadium" : "Stamford Bridge",
    venueCity: "London",
    country: "England",
    recentMatches: [
      {
        id: 101,
        date: "2026-08-01T15:00:00Z",
        status: "FINISHED",
        elapsedTime: null,
        homeTeam: { id: 11, name: "Arsenal" },
        awayTeam: { id: 12, name: "Chelsea" },
        homeScore: 2,
        awayScore: 1,
        league: { id: 1, name: "Premier League", country: "England", logo: "🇬🇧" },
      }
    ],
    upcomingMatches: [
      {
        id: 103,
        date: "2026-08-15T20:45:00Z",
        status: "SCHEDULED",
        elapsedTime: null,
        homeTeam: { id: 11, name: "Arsenal" },
        awayTeam: { id: 32, name: "AC Milan" },
        homeScore: null,
        awayScore: null,
        league: { id: 3, name: "Serie A", country: "Italy", logo: "🇮🇹" },
      }
    ]
  };
};

export default async function TeamProfilePage({ params }: TeamPageProps) {
  // 1. Resolve unified route parameters supporting both Next.js 14 & 15 architectures
  const resolvedParams = await params;
  const teamId = resolvedParams.id;

  let team: TeamProfile;

  const apiBase = process.env.BACKEND_INTERNAL_URL || "http://golason-backend:3001";

  try {
    // 2. Fetch team profile details server-side from NestJS API endpoint
    const res = await fetch(`${apiBase}/football/teams/${teamId}`, {
      next: { revalidate: 3600 }, // Cache team profiles for 1 hour
    });

    if (res.ok) {
      team = await res.json();
    } else {
      throw new Error(`Failed to fetch team profile: status ${res.status}`);
    }
  } catch (err) {
    console.warn(`NestJS API offline for TeamID ${teamId}. Using local fallback mock profiles.`, err);
    team = getFallbackTeamProfile(teamId);
  }

  // 3. Server-side fetch the standings data from NestJS (using the league ID of the team's fixtures, defaulting to 39)
  const leagueId = team.recentMatches?.[0]?.league?.id || team.upcomingMatches?.[0]?.league?.id || 39;
  let standings = [];

  try {
    const standingsRes = await fetch(`${apiBase}/football/standings?league=${leagueId}&season=2026`, {
      next: { revalidate: 3600 }, // Cache standings for 1 hour
    });

    if (standingsRes.ok) {
      standings = await standingsRes.json();
    } else {
      console.warn(`Failed to fetch standings from NestJS backend: status ${standingsRes.status}`);
    }
  } catch (err) {
    console.warn(`NestJS API offline for standings. Using local fallback.`, err);
  }

  // 4. Structure dynamic JSON-LD metadata schema for SportsTeam crawlers (SEO target)
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": team.name,
    "sport": "https://en.wikipedia.org/wiki/Association_football",
    "logo": team.logo || undefined,
    "foundingDate": team.founded ? team.founded.toString() : undefined,
    "homeLocation": {
      "@type": "Place",
      "name": team.venueName || undefined,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": team.venueCity,
        "addressCountry": team.country,
      },
    },
  };

  return (
    <div className={styles.page}>
      {/* Dynamic SEO Structured JSON-LD Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* Header back button */}
      <Link href="/" className={styles.backNav} role="button" aria-label="Go back to Dashboard">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Visual Team Branding Header Card */}
      <header className={styles.headerCard} aria-label={`${team.name} Branding`}>
        <div className={styles.logoWrapper}>
          <TeamLogo logo={team.logo} name={team.name} size={90} />
        </div>
        <div className={styles.teamMeta}>
          <span className={styles.countryBadge}>{team.country}</span>
          <h1 className={styles.teamName}>{team.name}</h1>
          
          {/* Metadata rows */}
          <div className={styles.infoRow}>
            {team.founded && (
              <span className={styles.infoItem} aria-label={`Founded in year ${team.founded}`}>
                <Calendar size={15} className={styles.infoIcon} />
                Founded: <strong>{team.founded}</strong>
              </span>
            )}
            {team.venueName && (
              <span className={styles.infoItem} aria-label={`Home stadium: ${team.venueName}`}>
                <Building2 size={15} className={styles.infoIcon} />
                Stadium: <strong>{team.venueName}</strong>
              </span>
            )}
            {team.venueCity && (
              <span className={styles.infoItem} aria-label={`Located in city: ${team.venueCity}`}>
                <MapPin size={15} className={styles.infoIcon} />
                City: <strong>{team.venueCity}</strong>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Two-Column Scrum Layout Grid */}
      <div className={styles.mainGrid}>
        {/* Main Feed Column */}
        <div className={styles.feedColumn}>
          {/* Recent Results Widget Panel */}
          <section className={styles.profileCard} aria-label="Recent results list">
            <h2 className={styles.cardTitle}>
              <History size={18} className={styles.titleIcon} />
              Recent Results
            </h2>
            {team.recentMatches.length === 0 ? (
              <div className={styles.emptyState}>No recent matches found.</div>
            ) : (
              <div className={styles.matchList}>
                {team.recentMatches.map((match) => (
                  <MatchCard key={`recent-${match.id}`} match={match} />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Fixtures Widget Panel */}
          <section className={styles.profileCard} aria-label="Upcoming scheduled fixtures list">
            <h2 className={styles.cardTitle}>
              <Calendar size={18} className={styles.titleIcon} />
              Upcoming Fixtures
            </h2>
            {team.upcomingMatches.length === 0 ? (
              <div className={styles.emptyState}>No upcoming fixtures scheduled.</div>
            ) : (
              <div className={styles.matchList}>
                {team.upcomingMatches.map((match) => (
                  <MatchCard key={`upcoming-${match.id}`} match={match} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className={styles.sidebar}>
          {/* Ad Slot */}
          <div className={styles.adWrapper}>
            <AdBanner size="rectangle" />
          </div>

          {/* Standings Table sidebar card */}
          <section className={styles.sidebarCard} aria-label="League Table Standings">
            <h2 className={styles.sidebarTitle}>
              <Trophy size={16} className={styles.titleIcon} />
              League Table
            </h2>
            <StandingsTable standings={standings} activeTeamId={team.id} />
          </section>
        </aside>
      </div>
    </div>
  );
}

// Static fallback icons
const History = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size || 18}
    height={size || 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const Trophy = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size || 18}
    height={size || 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3.58a6 6 0 0 1-6 5.42 6 6 0 0 1-6-5.42V8a6 6 0 0 1 6-6z" />
  </svg>
);
