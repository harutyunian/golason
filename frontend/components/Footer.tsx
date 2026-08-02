import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import styles from "./Footer.module.css";

// Inline Custom SVGs for Social Icons (High-Fidelity, Zero Dependency)
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Footer() {
  const quickLinks = [
    { label: "Scores", href: "/scores" },
    { label: "Leagues", href: "/leagues" },
    { label: "Favorites", href: "/favorites" },
    { label: "Predictor", href: "/predictor" },
  ];

  const contactLinks = [
    { label: "Contact Us", href: "/contact" },
    { label: "Support", href: "/support" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Branding Section */}
          <div className={styles.branding}>
            <Link href="/" className={styles.logoSection}>
              <Image
                src="/assets/golason_logo.png"
                alt="Golason Logo"
                width={36}
                height={36}
                className={styles.logoImage}
              />
              <span className={styles.logoText}>
                Gola<span className={styles.logoHighlight}>son</span>
              </span>
            </Link>
            <p className={styles.motto}>
              Your ultimate companion for real-time live sports scores, comprehensive statistics, and interactive match prediction polls.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className={styles.sectionTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials / Contact Section */}
          <div>
            <h3 className={styles.sectionTitle}>Connect</h3>
            <ul className={styles.linkList} style={{ marginBottom: "1rem" }}>
              {contactLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.socialsGroup}>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Follow Golason on Twitter"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Follow Golason on Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialIcon}
                aria-label="Follow Golason on Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:contact@golason.com"
                className={styles.socialIcon}
                aria-label="Email Golason"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Bottom copyright and legal section */}
        <div className={styles.bottomSection}>
          <p className={styles.copyright}>
            © 2026 Golason. All sports rights reserved.
          </p>
          <div className={styles.legalLinks}>
            <Link href="/privacy" className={styles.legalLink}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={styles.legalLink}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
