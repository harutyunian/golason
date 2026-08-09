import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Tag, User, Shield } from 'lucide-react';
import NewsComments from './NewsComments';
import styles from '../news.module.css';

// Forces server-side dynamic rendering on runtime (vital for live comments and SEO!)
export const dynamic = 'force-dynamic';

interface ArticleDetails {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  imageUrl?: string | null;
  matchId?: number | null;
  playerId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ArticlePageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

// Graceful fallback mock article details in case NestJS is offline during build
const getFallbackArticle = (slug: string): ArticleDetails => {
  return {
    id: 999,
    title: 'Arsenal vs Chelsea: Real-Time Tactical Preview & Key Player Clashes',
    slug: slug,
    summary: 'A detailed look into the highly anticipated clash between London giants. Analyze tactical shapes, expected lineups, and live SofaScore momentum pressure graphs.',
    content: `
# Match Preview: London Derby Under the Lights

This Sunday, **Arsenal** hosts **Chelsea** at the Emirates Stadium in what promises to be a spectacular tactical battle. Both managers have structured highly organized shapes, making this London derby a showcase of elite football strategy.

## Tactical Overview

Mikel Arteta's side is expected to deploy their typical **4-3-3 formation** with a high-pressing block, relying heavily on Bukayo Saka's creative threat from the right wing and Martin Ødegaard's tempo orchestration.

On the other hand, Chelsea's counter-attacking setup focuses on rapid transitions and overload creation in the final third.

> " Derby matches are won in the small margins. Lineup discipline and defensive transitions will decide who takes home the three points this Sunday. "

## Key Player Clashes

*   **Bukayo Saka vs. Marc Cucurella**: The isolated 1v1 on the flank will be critical for Arsenal to break Chelsea's low block.
*   **Enzo Fernández vs. Martin Ødegaard**: The battle in the central engine room to control the pace of play.

Make sure to monitor Golason's live match center for real-time statistical updates, live momentum waves, and prediction polls!
    `,
    imageUrl: 'https://media.api-sports.io/football/teams/42.png',
    matchId: 101,
    playerId: 1468,
    createdAt: '2026-08-09T18:00:00.000Z',
    updatedAt: '2026-08-09T18:00:00.000Z',
  };
};

const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Formatting Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Formatting Bold & Italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Formatting Code and Lists
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/^\s*>\s*(.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li>$1</li>');

  const lines = html.split('\n');
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return '<br />';
    if (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<block') ||
      trimmed.startsWith('</')
    ) {
      return line;
    }
    return `<p>${line}</p>`;
  });

  return processedLines.join('\n');
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let title = 'Football News | Golason';
  let description = 'Read the latest live football match previews, career bios, and news.';

  try {
    const apiBase = process.env.BACKEND_INTERNAL_URL || 'http://golason-backend:3001';
    const res = await fetch(`${apiBase}/football/news/${slug}`);
    if (res.ok) {
      const article = await res.json();
      title = `${article.title} | Golason`;
      description = article.summary;
    }
  } catch (err) {
    const fallback = getFallbackArticle(slug);
    title = `${fallback.title} | Golason`;
    description = fallback.summary;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `/news/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://golason.com/news/${slug}`,
      type: 'article',
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  let article: ArticleDetails;

  try {
    const apiBase = process.env.BACKEND_INTERNAL_URL || 'http://golason-backend:3001';
    const res = await fetch(`${apiBase}/football/news/${slug}`, {
      next: { revalidate: 60 }, // Cache articles for 1 minute
    });

    if (res.ok) {
      article = await res.json();
    } else {
      throw new Error(`Article not found: status ${res.status}`);
    }
  } catch (err) {
    console.warn(`NestJS API offline for article slug: ${slug}. Using local fallback.`, err);
    article = getFallbackArticle(slug);
  }

  const articleHtml = parseMarkdownToHtml(article.content);

  // Injects Search Engine Schema.org Article Structured Data (SEO booster)
  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.summary,
    'image': article.imageUrl || 'https://golason.com/assets/golason_logo.png',
    'datePublished': article.createdAt,
    'dateModified': article.updatedAt,
    'author': {
      '@type': 'Organization',
      'name': 'Golason Sports Editorial',
      'url': 'https://golason.com',
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Golason',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://golason.com/assets/golason_logo.png',
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

      {/* Back navigation */}
      <Link href="/news" className={styles.backNav} role="button" aria-label="Go back to News Feed">
        <ArrowLeft size={16} />
        Back to News Feed
      </Link>

      {/* Main Grid Workspace */}
      <div className={styles.articleContainer}>
        <article className={styles.articleCard}>
          <header className={styles.articleHeader}>
            <h1 className={styles.articleTitle}>{article.title}</h1>
            <div className={styles.articleMetadata}>
              <span className={styles.metadataItem}>
                <Calendar size={14} />
                {new Date(article.createdAt).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className={styles.metadataItem}>
                <User size={14} />
                Golason Sports Editorial
              </span>

              {/* Tag links for SofaScore contextual linkages */}
              {article.matchId && (
                <Link href={`/match/${article.matchId}`} className={styles.tagBadge}>
                  <Tag size={12} />
                  Match Center
                </Link>
              )}
              {article.playerId && (
                <Link href={`/player/${article.playerId}`} className={styles.tagBadge}>
                  <User size={12} />
                  Player Profile
                </Link>
              )}
            </div>
          </header>

          {/* Article Cover Image */}
          {article.imageUrl && (
            <div className={styles.coverWrapper}>
              <img
                src={article.imageUrl}
                alt={article.title}
                className={styles.articleCover}
              />
            </div>
          )}

          {/* Article body summary */}
          <p className={styles.articleSummary}>{article.summary}</p>

          <hr className={styles.divider} />

          {/* Markdown Compiled HTML Content Canvas */}
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />
        </article>

        {/* Live Recursive WebSocket Comments Section */}
        <NewsComments articleId={article.id} />
      </div>
    </div>
  );
}
