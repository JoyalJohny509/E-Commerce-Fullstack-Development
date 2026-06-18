'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store';
import styles from './Header.module.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const itemCount = useCartStore((s) => s.getItemCount());
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.headerInner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>◆</span>
          <span className={styles.logoText}>LUXE</span>
        </Link>

        {/* Navigation */}
        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link href="/shop" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Shop
          </Link>
          <Link href="/shop?category=electronics" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Electronics
          </Link>
          <Link href="/shop?category=accessories" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Accessories
          </Link>
          <Link href="/shop?category=fashion" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>
            Fashion
          </Link>
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            {searchOpen && (
              <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </form>
            )}
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Toggle search"
              id="search-toggle"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <div className={styles.profileWrapper} ref={profileRef}>
              <button
                className={styles.profileBtn}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                id="profile-menu-btn"
              >
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </button>
              {profileMenuOpen && (
                <div className={styles.profileMenu}>
                  <div className={styles.profileHeader}>
                    <span className={styles.profileName}>{user?.name}</span>
                    <span className={styles.profileEmail}>{user?.email}</span>
                  </div>
                  <div className={styles.profileDivider} />
                  <Link href="/orders" className={styles.profileMenuItem} onClick={() => setProfileMenuOpen(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    My Orders
                  </Link>
                  <button className={styles.profileMenuItem} onClick={() => { logout(); setProfileMenuOpen(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth" className={styles.iconBtn} aria-label="Sign in" id="sign-in-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          )}

          {/* Cart */}
          <Link href="/cart" className={styles.cartBtn} id="cart-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className={styles.menuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen1 : ''}`} />
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen2 : ''}`} />
            <span className={`${styles.menuBar} ${mobileMenuOpen ? styles.menuBarOpen3 : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
