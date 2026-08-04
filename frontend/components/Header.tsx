'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sun, Moon, Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

export default function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  // Synchronize theme with localStorage and document element
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    let initialTheme: "light" | "dark" = "dark";
    if (savedTheme) {
      initialTheme = savedTheme;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      initialTheme = prefersDark ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", initialTheme);

    // Update state asynchronously on mount to avoid synchronous setState cascades
    const timer = setTimeout(() => {
      setTheme(initialTheme);
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: "Scores", href: "/scores" },
    { label: "Leagues", href: "/leagues" },
    { label: "Favorites", href: "/favorites" },
    { label: "Predictor", href: "/predictor" },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo Section */}
        <Link href="/" className={styles.logoSection} onClick={closeMobileMenu}>
          <Image
            src="/assets/golason_logo.png"
            alt="Golason Logo"
            width={36}
            height={36}
            priority
            className={styles.logoImage}
          />
          <span className={styles.logoText}>
            Gola<span className={styles.logoHighlight}>son</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <div className={styles.desktopSearch}>
          <SearchBar />
        </div>

        {/* Desktop Actions Section */}
        <div className={styles.desktopActions}>
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <Moon size={20} className={styles.icon} />
              ) : (
                <Sun size={20} className={styles.icon} />
              )}
            </button>
          )}

          {/* Auth Buttons */}
          <div className={styles.authGroup}>
            {isAuthenticated && user ? (
              <div className={styles.userProfileGroup}>
                <span className={styles.userName} title={user.email}>
                  <UserIcon size={14} style={{ marginRight: '4px' }} />
                  {user.name || user.email.split('@')[0]}
                </span>
                <button onClick={logout} className={styles.logoutBtn} aria-label="Log Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.loginBtn}>
                  Login
                </Link>
                <Link href="/register" className={styles.registerBtn}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Control Section */}
        <div className={styles.mobileControls}>
          {/* Theme Toggle (Mobile) */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? (
                <Moon size={20} className={styles.icon} />
              ) : (
                <Sun size={20} className={styles.icon} />
              )}
            </button>
          )}

          {/* Hamburger Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className={styles.hamburger}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-nav-menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobile-nav-menu"
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          <div className={styles.mobileSearch}>
            <SearchBar />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.mobileNavLink}
              onClick={closeMobileMenu}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileAuthGroup}>
            {isAuthenticated && user ? (
              <div className={styles.mobileUserProfileGroup}>
                <span className={styles.mobileUserName}>
                  <UserIcon size={16} style={{ marginRight: '6px' }} />
                  {user.name || user.email.split('@')[0]}
                </span>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className={styles.mobileLogoutBtn}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  <LogOut size={16} style={{ marginRight: '6px' }} />
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={styles.mobileLoginBtn}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={styles.mobileRegisterBtn}
                  onClick={closeMobileMenu}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
