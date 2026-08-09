'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApiBaseUrl } from '@/utils/api';
import { 
  PenSquare, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  BookOpen,
  PlusCircle
} from 'lucide-react';
import styles from './admin.module.css';

/**
 * Clean, lightweight, regex-based Markdown parser to render article previews
 * with zero heavy external dependencies. Supports headings, bold, italic,
 * inline code, list items, and blockquotes.
 */
const parseMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';

  // 1. Escape HTML for client-side XSS safety
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Format Headings (from H3 to H1)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 3. Format Bold & Italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 4. Format Inline Code Blocks
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // 5. Format Blockquotes
  html = html.replace(/^\s*>\s*(.*$)/gim, '<blockquote>$1</blockquote>');

  // 6. Format Unordered List Items
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li>$1</li>');

  // 7. Process remaining blocks as paragraphs
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

export default function AdminDashboardPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  // Form Field States
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [matchId, setMatchId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [content, setContent] = useState('');

  // UI Flow and Interaction States
  const [previewMode, setPreviewMode] = useState<'write' | 'preview' | 'split'>('split');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [redirectCount, setRedirectCount] = useState(3);

  // Derive authorization status
  const isAdmin = user && ((user as any).role === 'ADMIN' || user.isAdmin === true);

  // Guard redirection logic for unauthorized visitors
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      const interval = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isAdmin, router]);

  // If Auth Loading state is active, render loading indicator
  if (isLoading) {
    return (
      <div className={styles.centeredState}>
        <div className={styles.spinnerCard}>
          <div className={styles.spinner} />
          <p className={styles.subtitle}>Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // If Unauthorized, render access denied card with automatic redirect count
  if (!isAdmin) {
    return (
      <div className={styles.centeredState}>
        <div className={styles.deniedCard}>
          <AlertCircle size={48} className={styles.successIcon} style={{ color: 'var(--color-red-card)' }} />
          <h1>Access Denied</h1>
          <p className={styles.subtitle}>
            You do not have administrative privileges to access this control dashboard.
          </p>
          <p className={styles.redirectText}>
            Redirecting to home page in {redirectCount} seconds...
          </p>
          <button onClick={() => router.push('/')} className={styles.actionBtnSecondary}>
            Return Home Immediately
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError('Required Fields Missing: Title, Summary, and Article Content are mandatory.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const apiBase = getApiBaseUrl();
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || null,
        matchId: matchId.trim() ? parseInt(matchId.trim(), 10) : null,
        playerId: playerId.trim() ? parseInt(playerId.trim(), 10) : null,
      };

      // Ensure parsed tag IDs are valid numbers if input is provided
      if (payload.matchId !== null && isNaN(payload.matchId)) {
        throw new Error('Validation Error: Match Tag ID must be a numeric ID.');
      }
      if (payload.playerId !== null && isNaN(payload.playerId)) {
        throw new Error('Validation Error: Player Tag ID must be a numeric ID.');
      }

      const res = await fetch(`${apiBase}/football/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit article payload.');
      }

      setSuccess(true);
      // Clean form inputs
      setTitle('');
      setSummary('');
      setImageUrl('');
      setMatchId('');
      setPlayerId('');
      setContent('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while publishing the article.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render dynamic success completion panel
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successContainer}>
          <CheckCircle2 size={56} className={styles.successIcon} />
          <h1 className={styles.title}>Article Published!</h1>
          <p className={styles.subtitle} style={{ marginTop: '0.5rem' }}>
            Your news article has been parsed, slugified, and published to the Golason database feed.
          </p>
          <div className={styles.successActions}>
            <button onClick={() => setSuccess(false)} className={styles.actionBtnPrimary}>
              <PlusCircle size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
              Write Another Article
            </button>
            <Link href="/" className={styles.actionBtnSecondary}>
              <ArrowLeft size={16} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
              Return to Scores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Primary Workspace View
  return (
    <div className={styles.container}>
      {/* Dashboard Page Header */}
      <div className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Publisher Studio</h1>
          <p className={styles.subtitle}>Compose, tag, and publish dynamic soccer news articles</p>
        </div>

        {/* Live Preview Modes Toggle Buttons */}
        <div className={styles.controls}>
          <span className={styles.toggleLabel}>Workspace:</span>
          <div className={styles.toggleGroup}>
            <button
              onClick={() => setPreviewMode('write')}
              className={`${styles.toggleBtn} ${previewMode === 'write' ? styles.activeToggle : ''}`}
            >
              Write
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`${styles.toggleBtn} ${previewMode === 'preview' ? styles.activeToggle : ''}`}
            >
              Preview
            </button>
            <button
              onClick={() => setPreviewMode('split')}
              className={`${styles.toggleBtn} ${previewMode === 'split' ? styles.activeToggle : ''}`}
            >
              Split View
            </button>
          </div>
        </div>
      </div>

      {/* Warning / Error Banners */}
      {error && (
        <div className={`${styles.notification} ${styles.errorNotify}`}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Editor & Preview Split Screen Workspace Grid */}
      <div className={`${styles.workspace} ${previewMode === 'split' ? styles.splitView : ''}`}>
        
        {/* Editor Form Panel */}
        {(previewMode === 'write' || previewMode === 'split') && (
          <div className={styles.editorPanel}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                {/* Article Title */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label htmlFor="title" className={styles.label}>
                    Article Title <span style={{ color: 'var(--color-red-card)' }}>*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g., Erling Haaland Scores Sensational Hattrick vs Bayern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Cover Image URL */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label htmlFor="imageUrl" className={styles.label}>
                    Cover Image URL (Optional)
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    className={styles.input}
                    placeholder="https://example.com/images/haaland-celebration.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Match Tag ID */}
                <div className={styles.inputGroup}>
                  <label htmlFor="matchId" className={styles.label}>
                    Associated Match Tag ID (Optional)
                  </label>
                  <input
                    id="matchId"
                    type="text"
                    className={styles.input}
                    placeholder="e.g., 101"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Player Tag ID */}
                <div className={styles.inputGroup}>
                  <label htmlFor="playerId" className={styles.label}>
                    Associated Player Tag ID (Optional)
                  </label>
                  <input
                    id="playerId"
                    type="text"
                    className={styles.input}
                    placeholder="e.g., 42"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Summary Intro */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label htmlFor="summary" className={styles.label}>
                    Article Summary <span style={{ color: 'var(--color-red-card)' }}>*</span>
                  </label>
                  <textarea
                    id="summary"
                    required
                    rows={3}
                    className={styles.textarea}
                    placeholder="Write a brief, catchy introduction or summary of the news report..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Markdown Content Editor */}
                <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                  <label htmlFor="content" className={styles.label}>
                    Article Content (Markdown Supported) <span style={{ color: 'var(--color-red-card)' }}>*</span>
                  </label>
                  <textarea
                    id="content"
                    required
                    className={`${styles.textarea} ${styles.markdownTextarea}`}
                    placeholder="# Match Analysis&#10;&#10;Use standard markdown structure:&#10;- Use `##` for sub-headings&#10;- Use `**` for **bold highlights**&#10;- Use `>` to start custom blockquotes"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Article Button */}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px' }} />
                    Publishing Article...
                  </>
                ) : (
                  <>
                    <PenSquare size={18} />
                    Publish Article Feed
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Live Preview HTML Compilation Panel */}
        {(previewMode === 'preview' || previewMode === 'split') && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <Eye size={16} />
              <span>Live Render Studio</span>
            </div>
            {title || summary || content ? (
              <article className={styles.previewContent}>
                {title && <h1 style={{ marginTop: 0 }}>{title}</h1>}
                
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={imageUrl} 
                    alt="Cover preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} 
                  />
                )}

                {summary && (
                  <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 500, fontStyle: 'italic' }}>
                    {summary}
                  </p>
                )}

                {summary && <hr />}

                <div 
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(content) }} 
                />
              </article>
            ) : (
              <div className={styles.emptyPreview}>
                <div>
                  <BookOpen size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
                  <p>Begin typing your article in the composer to view live formatted renderings.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
