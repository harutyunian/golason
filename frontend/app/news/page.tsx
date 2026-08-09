import React from "react";
import Link from "next/link";
import styles from "./news.module.css";

export const dynamic = "force-dynamic";

interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

const getFallbackArticles = (): NewsArticle[] => [
  {
    id: 1,
    title: "Arsenal vs Chelsea: Momentum, Stats, and Tactical Preview",
    slug: "arsenal-vs-chelsea-momentum-stats-and-tactical-preview",
    summary: "A deep dive into the London Derby as both teams gear up for a crucial clash at the Emirates Stadium. We analyze match momentum, tactical lineups, and key match-ups.",
    content: "The London Derby is always one of the most anticipated fixtures on the football calendar...",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Real Madrid Dominate Barcelona in Epic El Clasico Battle",
    slug: "real-madrid-dominate-barcelona-in-epic-el-clasico-battle",
    summary: "Real Madrid secured all three points at the Bernabéu. Tactical analysis reveals how Madrid's midfield pressing neutralized Barcelona's passing waves and wing threat.",
    content: "Real Madrid produced a tactical masterclass to defeat Barcelona...",
    imageUrl: "https://images.unsplash.com/photo-1540747737956-378723c02953?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 3,
    title: "Champions League Power Rankings: Manchester City Leads the Pack",
    slug: "champions-league-power-rankings-manchester-city-leads-the-pack",
    summary: "As the knockout stages approach, we rank the top contenders for the Champions League crown. Manchester City and Real Madrid lead, followed closely by Bayern Munich.",
    content: "The race for European glory heating up as the knockout phases loom...",
    imageUrl: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

export default async function NewsPage() {
  let articles: NewsArticle[] = [];
  let isFallback = false;

  try {
    const apiBase = process.env.BACKEND_INTERNAL_URL || "http://golason-backend:3001";
    const res = await fetch(`${apiBase}/football/news`, {
      next: { revalidate: 60 }, // Revalidate cache every 60 seconds
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      articles = await res.json();
    } else {
      throw new Error(`Failed to fetch news: status ${res.status}`);
    }
  } catch (err) {
    console.warn("NestJS API offline. Falling back to local high-fidelity mock news articles.", err);
    articles = getFallbackArticles();
    isFallback = true;
  }

  const formatPublishDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Football News & Insights</h1>
      
      {isFallback && (
        <div style={{
          backgroundColor: "rgba(2, 184, 117, 0.05)",
          border: "1px dashed var(--color-primary)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "2rem",
          fontSize: "0.9rem",
          color: "var(--color-primary-dark)",
          fontWeight: 500,
          textAlign: "center"
        }}>
          💡 Preview Mode: Currently displaying offline preview articles.
        </div>
      )}

      {articles.length === 0 ? (
        <div className={styles.errorWrapper}>
          <p>No news articles found at this time. Please check back later!</p>
        </div>
      ) : (
        <div className={styles.feedGrid}>
          {articles.map((article) => {
            const displayImage = article.imageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800";
            return (
              <article key={article.id} className={styles.newsCard}>
                <div className={styles.cardImageContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt={article.title}
                    className={styles.cardImage}
                    loading="lazy"
                  />
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.cardTitle}>{article.title}</h2>
                  <p className={styles.cardSummary}>{article.summary}</p>
                  <div className={styles.cardMeta}>
                    <span>{formatPublishDate(article.createdAt)}</span>
                    <Link href={`/news/${article.slug}`} className={styles.readMoreLink}>
                      Read Article ➔
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
