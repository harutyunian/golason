'use client';

import React, { useState, useEffect } from "react";
import { User, Shield, Trophy, Star, Globe } from "lucide-react";
import Image from "next/image";
import styles from "./SearchResultItem.module.css";

// Helper to resolve flag SVG URLs from country code or country name
export function getFlagUrl(countryCode?: string | null, countryName?: string | null): string | null {
  if (countryCode && countryCode.trim()) {
    return `https://media.api-sports.io/flags/${countryCode.trim().toLowerCase()}.svg`;
  }
  if (!countryName) return null;
  
  const name = countryName.toLowerCase().trim();
  
  const countryNameToCode: Record<string, string> = {
    england: "gb",
    spain: "es",
    italy: "it",
    germany: "de",
    france: "fr",
    portugal: "pt",
    brazil: "br",
    argentina: "ar",
    usa: "us",
    "united states": "us",
    netherlands: "nl",
    belgium: "be",
    croatia: "hr",
    uruguay: "uy",
    mexico: "mx",
    world: "world",
    ukraine: "ua",
    poland: "pl",
    turkey: "tr",
    greece: "gr",
    scotland: "gb-sct",
    wales: "gb-wls",
    switzerland: "ch",
    austria: "at",
    denmark: "dk",
    sweden: "se",
    norway: "no",
    finland: "fi",
    japan: "jp",
    china: "cn",
    "south korea": "kr",
    australia: "au",
    canada: "ca",
  };

  const code = countryNameToCode[name];
  if (code) {
    return `https://media.api-sports.io/flags/${code}.svg`;
  }
  
  return null;
}

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
  countryCode?: string | null;
  followers?: string;
  teamName?: string | null;
  teamLogo?: string | null;
}

interface SearchResultItemProps {
  item: SearchItem;
  isSelected?: boolean;
  onClick: () => void;
}

export default function SearchResultItem({ item, isSelected = false, onClick }: SearchResultItemProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Sync favorited state from localStorage on load
  useEffect(() => {
    try {
      const favorites = JSON.parse(localStorage.getItem("golason_favorites") || "[]");
      const favorited = favorites.some((fav: any) => fav.type === item.type && fav.id === item.id);
      setIsFavorited(favorited);
    } catch (e) {
      console.error("Failed to load favorites from localStorage", e);
    }
  }, [item.id, item.type]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const favorites = JSON.parse(localStorage.getItem("golason_favorites") || "[]");
      let updatedFavorites;
      if (isFavorited) {
        updatedFavorites = favorites.filter((fav: any) => !(fav.type === item.type && fav.id === item.id));
        setIsFavorited(false);
      } else {
        updatedFavorites = [...favorites, { 
          id: item.id, 
          type: item.type, 
          name: item.type === "match" ? `${item.homeTeam} vs ${item.awayTeam}` : item.name,
          logo: item.type === "player" ? item.photo : item.logo
        }];
        setIsFavorited(true);
      }
      localStorage.setItem("golason_favorites", JSON.stringify(updatedFavorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  };

  const renderMedia = () => {
    if (item.type === "player") {
      return (
        <div className={`${styles.mediaWrapper} ${styles.circular}`}>
          {item.photo ? (
            <Image
              src={item.photo}
              alt={item.name || "Player"}
              width={38}
              height={38}
              className={styles.avatar}
              unoptimized
            />
          ) : (
            <User className={styles.fallbackIcon} size={20} />
          )}
        </div>
      );
    } else if (item.type === "team") {
      return (
        <div className={`${styles.mediaWrapper} ${styles.rounded}`}>
          {item.logo ? (
            <Image
              src={item.logo}
              alt={item.name || "Team"}
              width={38}
              height={38}
              className={styles.logo}
              unoptimized
            />
          ) : (
            <Shield className={styles.fallbackIcon} size={20} />
          )}
        </div>
      );
    } else if (item.type === "competition") {
      return (
        <div className={`${styles.mediaWrapper} ${styles.rounded}`}>
          {item.logo ? (
            <Image
              src={item.logo}
              alt={item.name || "Competition"}
              width={38}
              height={38}
              className={styles.logo}
              unoptimized
            />
          ) : (
            <Trophy className={styles.fallbackIcon} size={20} />
          )}
        </div>
      );
    } else {
      // Fallback or Match
      return (
        <div className={`${styles.mediaWrapper} ${styles.rounded}`}>
          <Trophy className={styles.fallbackIcon} size={20} />
        </div>
      );
    }
  };

  const renderSubtitle = () => {
    if (item.type === "player") {
      const currentTeamLogo = item.teamLogo;
      const currentTeamName = item.teamName || "Free Agent";
      return (
        <div className={styles.subtitleRow}>
          {currentTeamLogo ? (
            <Image
              src={currentTeamLogo}
              alt={currentTeamName}
              width={16}
              height={16}
              className={styles.teamLogo}
              unoptimized
            />
          ) : (
            <Shield className={styles.fallbackIconSmall} size={14} />
          )}
          <span className={styles.metaText}>{currentTeamName}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.sportName}>Football</span>
        </div>
      );
    } else {
      // Teams and Competitions/Leagues
      const flagUrl = getFlagUrl(item.countryCode, item.country);
      const countryName = item.country || "World";
      return (
        <div className={styles.subtitleRow}>
          {flagUrl ? (
            <Image
              src={flagUrl}
              alt={`${countryName} flag`}
              width={16}
              height={12}
              className={styles.flagIcon}
              unoptimized
            />
          ) : (
            <Globe className={styles.fallbackIconSmall} size={14} />
          )}
          <span className={styles.metaText}>{countryName}</span>
          <span className={styles.separator}>•</span>
          <span className={styles.sportName}>Football</span>
        </div>
      );
    }
  };

  return (
    <div 
      className={`${styles.itemContainer} ${isSelected ? styles.selectedItem : ""}`}
      onClick={onClick}
    >
      <div className={styles.leftSegment}>
        {renderMedia()}
        <div className={styles.centerSegment}>
          <div className={styles.nameRow}>
            <span className={styles.itemName}>
              {item.type === "match" ? `${item.homeTeam} vs ${item.awayTeam}` : item.name}
            </span>
            {item.followers && (
              <span className={styles.followerBadge}>{item.followers}</span>
            )}
          </div>
          {renderSubtitle()}
        </div>
      </div>
      <div className={styles.rightSegment}>
        <button
          type="button"
          className={styles.favoriteButton}
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            size={18}
            fill={isFavorited ? "currentColor" : "none"}
            className={isFavorited ? styles.favoritedStar : styles.outlineStar}
          />
        </button>
      </div>
    </div>
  );
}
