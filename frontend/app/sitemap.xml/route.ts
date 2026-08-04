import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export async function GET() {
  const domain = 'https://golason.com';
  const currentDate = new Date().toISOString().split('T')[0];

  // A Map to maintain deduplicated URLs with their properties
  const sitemapMap = new Map<string, SitemapUrl>();

  // Helper to add/update URL entries safely
  const addUrl = (
    path: string,
    changefreq: SitemapUrl['changefreq'],
    priority: number
  ) => {
    const loc = `${domain}${path}`;
    sitemapMap.set(loc, {
      loc,
      lastmod: currentDate,
      changefreq,
      priority: priority.toFixed(1),
    });
  };

  // 1. Initialize with Core required urls from the brief
  addUrl('/', 'daily', 1.0);

  // Core Matches (Priority: 0.8, Changefreq: hourly)
  const coreMatches = [101, 102, 103, 104, 105];
  coreMatches.forEach((id) => addUrl(`/match/${id}`, 'hourly', 0.8));

  // Core Teams (Priority: 0.7, Changefreq: weekly)
  const coreTeams = [42, 49];
  coreTeams.forEach((id) => addUrl(`/team/${id}`, 'weekly', 0.7));

  // Core Players (Priority: 0.7, Changefreq: weekly)
  const corePlayers = [1468, 1460];
  corePlayers.forEach((id) => addUrl(`/player/${id}`, 'weekly', 0.7));

  // 2. Attempt to dynamically fetch and enrich from backend APIs
  try {
    const apiBase = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:3001";

    const fetchWithTimeout = async (url: string, timeout = 1500) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    // Fetch live/active fixtures from backend
    try {
      const fixturesRes = await fetchWithTimeout(`${apiBase}/football/fixtures`);
      if (fixturesRes.ok) {
        const fixtures = await fixturesRes.json();
        if (Array.isArray(fixtures)) {
          fixtures.forEach((match: any) => {
            if (match && match.id) {
              addUrl(`/match/${match.id}`, 'hourly', 0.8);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[Sitemap] Failed to fetch dynamic fixtures from backend, using core fallback', e);
    }

    // Fetch standings to get active team profiles
    try {
      const standingsRes = await fetchWithTimeout(`${apiBase}/football/standings?league=39&season=2026`);
      if (standingsRes.ok) {
        const standings = await standingsRes.json();
        if (Array.isArray(standings)) {
          standings.forEach((row: any) => {
            const teamId = row.teamId || (row.team && row.team.id);
            if (teamId) {
              addUrl(`/team/${teamId}`, 'weekly', 0.7);
            }
          });
        }
      }
    } catch (e) {
      console.warn('[Sitemap] Failed to fetch dynamic standings from backend, using core fallback', e);
    }
  } catch (e) {
    console.error('[Sitemap] Failed to enrich sitemap with dynamic backend data', e);
  }

  // 3. Build the XML string conforming strictly to sitemaps schema 0.9
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const urlEntry of sitemapMap.values()) {
    xml += '  <url>\n';
    xml += `    <loc>${urlEntry.loc}</loc>\n`;
    xml += `    <lastmod>${urlEntry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${urlEntry.changefreq}</changefreq>\n`;
    xml += `    <priority>${urlEntry.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  // Return standard Response with Content-Type: text/xml
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
