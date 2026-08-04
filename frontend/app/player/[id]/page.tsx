import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Shield, Award, Activity, FileText } from "lucide-react";
import TeamLogo from "@/components/TeamLogo";
import AdBanner from "@/components/AdBanner";
import styles from "./player.module.css";

// Forces server-side dynamic rendering on runtime (vital for live scores and SEO!)
export const dynamic = "force-dynamic";

interface PlayerProfile {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birthDate: string | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  position: string | null;
  teamId: number | null;
  teamName: string | null;
  teamLogo?: string | null;
  rating: number | null;
  stats: {
    matches: {
      played: number;
      starts: number;
      minutes: number;
    };
    goals: {
      total: number;
      assists: number;
    };
    passes: {
      total: number;
      accuracyPercent: number;
      key: number;
    };
    cards: {
      yellow: number;
      red: number;
    };
  };
}

interface PlayerPageProps {
  params: Promise<{ id: string }> | { id: string };
}

// Graceful fallback mock player profile in case NestJS backend is offline during compilation/renders
const getFallbackPlayerProfile = (idStr: string): PlayerProfile => {
  const playerId = Number(idStr) || 1468;
  const isSaka = playerId === 1468;

  return {
    id: playerId,
    name: isSaka ? "Bukayo Saka" : "Martin Ødegaard",
    firstname: isSaka ? "Bukayo" : "Martin",
    lastname: isSaka ? "Saka" : "Ødegaard",
    age: isSaka ? 24 : 27,
    birthDate: isSaka ? "2001-09-05" : "1998-12-17",
    nationality: isSaka ? "England" : "Norway",
    height: isSaka ? "178 cm" : "178 cm",
    weight: isSaka ? "72 kg" : "68 kg",
    photo: isSaka ? "https://media.api-sports.io/football/players/1468.png" : "https://media.api-sports.io/football/players/1460.png",
    position: isSaka ? "Attacker" : "Midfielder",
    teamId: 42,
    teamName: "Arsenal",
    teamLogo: "https://media.api-sports.io/football/teams/42.png",
    rating: isSaka ? 7.6 : 7.8,
    stats: {
      matches: {
        played: isSaka ? 32 : 30,
        starts: isSaka ? 29 : 28,
        minutes: isSaka ? 2540 : 2400,
      },
      goals: {
        total: isSaka ? 16 : 8,
        assists: isSaka ? 9 : 12,
      },
      passes: {
        total: isSaka ? 820 : 1240,
        accuracyPercent: isSaka ? 82 : 87,
        key: isSaka ? 28 : 45,
      },
      cards: {
        yellow: 2,
        red: 0,
      },
    }
  };
};

export default async function PlayerProfilePage({ params }: PlayerPageProps) {
  // 1. Resolve unified route parameters supporting both Next.js 14 & 15 architectures
  const resolvedParams = await params;
  const playerId = resolvedParams.id;

  let player: PlayerProfile;

  try {
    // 2. Fetch player profile details server-side from NestJS API endpoint
    const apiBase = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3001";
    const res = await fetch(`${apiBase}/football/players/${playerId}`, {
      cache: "no-store",
    });

    if (res.ok) {
      player = await res.json();
    } else {
      throw new Error(`Failed to fetch player profile: status ${res.status}`);
    }
  } catch (err) {
    console.warn(`NestJS API offline for PlayerID ${playerId}. Using local fallback mock profiles.`, err);
    player = getFallbackPlayerProfile(playerId);
  }

  // 3. Structure dynamic JSON-LD metadata schema for Person crawlers (SEO target)
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": player.name,
    "givenName": player.firstname || undefined,
    "familyName": player.lastname || undefined,
    "birthDate": player.birthDate || undefined,
    "nationality": {
      "@type": "Country",
      "name": player.nationality,
    },
    "jobTitle": "Professional Athlete",
    "memberOf": player.teamName ? {
      "@type": "SportsOrganization",
      "name": player.teamName,
      "logo": player.teamLogo || undefined,
    } : undefined,
    "image": player.photo || undefined,
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

      {/* Visual Player Branding Header Card */}
      <header className={styles.headerCard} aria-label={`${player.name} Branding`}>
        <div className={styles.photoWrapper}>
          <TeamLogo logo={player.photo} name={player.name} size={110} className={styles.playerPhoto} />
        </div>
        <div className={styles.playerMeta}>
          <span className={styles.positionBadge}>{player.position}</span>
          <h1 className={styles.playerName}>{player.name}</h1>
          {player.firstname && player.lastname && (
            <span className={styles.fullname}>
              Full Name: {player.firstname} {player.lastname}
            </span>
          )}
          
          {/* Current Team link */}
          {player.teamId && player.teamName && (
            <div className={styles.infoRow}>
              <Link href={`/team/${player.teamId}`} className={styles.teamLink} aria-label={`View current team: ${player.teamName}`}>
                <TeamLogo logo={player.teamLogo} name={player.teamName} size={20} />
                {player.teamName}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Two-Column Scrum Layout Grid */}
      <div className={styles.mainGrid}>
        {/* Main Feed Column */}
        <div className={styles.feedColumn}>
          {/* Biographical Details Card */}
          <section className={styles.profileCard} aria-label="Biographical details">
            <h2 className={styles.cardTitle}>
              <Shield size={18} className={styles.titleIcon} />
              Biographical Details
            </h2>
            <div className={styles.bioGrid}>
              {player.birthDate && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Date of Birth</span>
                  <span className={styles.bioValue}>{player.birthDate}</span>
                </div>
              )}
              {player.age && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Age</span>
                  <span className={styles.bioValue}>{player.age} Years Old</span>
                </div>
              )}
              {player.nationality && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Nationality</span>
                  <span className={styles.bioValue}>{player.nationality}</span>
                </div>
              )}
              {player.height && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Height</span>
                  <span className={styles.bioValue}>{player.height}</span>
                </div>
              )}
              {player.weight && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Weight</span>
                  <span className={styles.bioValue}>{player.weight}</span>
                </div>
              )}
              {player.position && (
                <div className={styles.bioItem}>
                  <span className={styles.bioLabel}>Active Position</span>
                  <span className={styles.bioValue}>{player.position}</span>
                </div>
              )}
            </div>
          </section>

          {/* Seasonal Performance Statistics Card */}
          <section className={styles.profileCard} aria-label="Seasonal statistics metrics">
            <h2 className={styles.cardTitle}>
              <Activity size={18} className={styles.titleIcon} />
              Seasonal Statistics (2026)
            </h2>
            <div className={styles.statsGrid}>
              {/* Rating Box */}
              {player.rating && (
                <div className={styles.metricBox}>
                  <span className={`${styles.metricValue} ${styles.metricValueHighlighted}`}>
                    {Number(player.rating).toFixed(1)}
                  </span>
                  <span className={styles.metricLabel}>SofaRating</span>
                </div>
              )}

              {/* Goals Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.goals.total}</span>
                <span className={styles.metricLabel}>Goals</span>
              </div>

              {/* Assists Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.goals.assists}</span>
                <span className={styles.metricLabel}>Assists</span>
              </div>

              {/* Matches Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.matches.played}</span>
                <span className={styles.metricLabel}>Played (Starts)</span>
              </div>

              {/* Minutes Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.matches.minutes}&apos;</span>
                <span className={styles.metricLabel}>Min Played</span>
              </div>

              {/* Pass % Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.passes.accuracyPercent}%</span>
                <span className={styles.metricLabel}>Pass Accuracy</span>
              </div>

              {/* Yellow Cards Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.cards.yellow}</span>
                <span className={styles.metricLabel}>Yellow Cards</span>
              </div>

              {/* Red Cards Box */}
              <div className={styles.metricBox}>
                <span className={styles.metricValue}>{player.stats.cards.red}</span>
                <span className={styles.metricLabel}>Red Cards</span>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className={styles.sidebar}>
          {/* Ad Slot */}
          <div className={styles.adWrapper}>
            <AdBanner size="rectangle" />
          </div>

          {/* Player history panel card */}
          <section className={styles.sidebarCard} aria-label="Career history">
            <h2 className={styles.sidebarTitle}>
              <Award size={16} className={styles.titleIcon} />
              Career Trophies
            </h2>
            <div className={styles.placeholderSection}>
              <FileText size={36} className={styles.placeholderIcon} />
              <h3>Career Milestones</h3>
              <p>
                Dynamic, historical club transfer details, career contract milestones, and international match records will load dynamically here in future tasks!
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
