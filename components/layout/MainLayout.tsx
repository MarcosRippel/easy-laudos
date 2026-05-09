'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { ReactNode, useState, useEffect } from 'react';
import styles from './MainLayout.module.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthWrapper';
import TutorialProvider from '../tutorial/TutorialProvider';
import TutorialButton from '../tutorial/TutorialButton';
import PWAInstallButton from '../PWAInstallButton';
import FeedbackButton from '../FeedbackButton';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navItems = [
    { href: '/', label: '🏠 Home', emoji: '🏠', color: '#007bff' },
    { href: '/admin', label: '👨‍💼 Painel do Inspetor', emoji: '👨‍💼', color: '#6f42c1' },
    { href: '/clients/create', label: '👥 Gestão de Clientes', emoji: '👥', color: '#28a745' },
    { href: '/vehicles', label: '➕ Veículo', emoji: '🚛', color: '#ffc107' },
    { href: '/emitirlaudo', label: '📋 Emitir Laudo', emoji: '📋', color: '#007bff' },
  ];

  const adminItems = [
    { href: '/admin/users', label: '🔧 Admin Users', emoji: '🔧', color: '#dc3545' },
  ];

  const isActive = (href: string) => pathname === href;

  const getNavStyle = (href: string, color: string) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontWeight: '600' as const,
    fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
    background: isActive(href) ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'transparent',
    color: isActive(href) ? (color === '#ffc107' ? '#000' : 'white') : '#e9ecef',
    border: isActive(href) ? 'none' : '2px solid transparent',
    boxShadow: isActive(href) ? `0 4px 15px ${color}66` : 'none',
  });

  return (
    <>
      <header className={styles.header} style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        borderBottom: '3px solid #444',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        padding: '0.75rem 1.5rem'
      }}>
        {/* Hamburger Button - Mobile Only */}
        <button
          className={`${styles.hamburgerButton} ${isMenuOpen ? styles.open : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

        <h1 className={styles.title} style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Image
              src="/logo.png"
              alt="GTS Logo"
              width={160}
              height={160}
              className={styles.headerLogo}
              style={{ objectFit: 'contain' }}
            />
            <span style={{
              color: 'white',
              fontWeight: '700',
              fontSize: 'clamp(0.6rem, 1.2vw, 1rem)',
              textShadow: '0 2px 10px rgba(255,255,255,0.3)'
            }}>
              INSPETOR
            </span>
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav data-tutorial="nav" className={styles.nav} style={{
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.activeLink : ''}`}
              style={getNavStyle(item.href, item.color)}
              onMouseOver={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = `${item.color}1a`;
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {item.label}
            </Link>
          ))}

          {/* Admin-only link */}
          {user?.role === 'admin' && adminItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.activeLink : ''}`}
              style={getNavStyle(item.href, item.color)}
              onMouseOver={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = `${item.color}1a`;
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {item.label}
            </Link>
          ))}

          {/* Desktop User Info */}
          <div className={styles.desktopUserInfo} style={{ color: '#e9ecef', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PWAInstallButton />
            <span style={{
              fontSize: 'clamp(0.8rem, 1.2vw, 0.9rem)',
              fontWeight: '500'
            }}>
              👤 {user?.username} ({user?.role})
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: 'clamp(0.8rem, 1.2vw, 0.9rem)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.3)';
              }}
            >
              🚪 Sair
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Backdrop */}
      <div
        className={`${styles.mobileBackdrop} ${isMenuOpen ? styles.visible : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside className={`${styles.mobileSidebar} ${isMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogoArea} onClick={() => setIsMenuOpen(false)}>
            <Image
              src="/logo.png"
              alt="GTS Logo"
              width={48}
              height={48}
              style={{ objectFit: 'contain', borderRadius: '8px' }}
            />
            <span className={styles.sidebarLogoText}>INSPETOR</span>
          </Link>
          <button
            className={styles.sidebarCloseButton}
            onClick={() => setIsMenuOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sidebarLink} ${isActive(item.href) ? styles.active : ''}`}
              onClick={() => setIsMenuOpen(false)}
              style={isActive(item.href) ? { borderLeftColor: item.color, background: `${item.color}15` } : {}}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
              {item.label.replace(/^[^\s]+\s/, '')}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className={styles.sidebarDivider} />
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.sidebarLink} ${isActive(item.href) ? styles.active : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                  style={isActive(item.href) ? { borderLeftColor: item.color, background: `${item.color}15` } : {}}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                  {item.label.replace(/^[^\s]+\s/, '')}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUserInfo}>
            👤 {user?.username} ({user?.role})
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
            <PWAInstallButton />
          </div>
          <button
            className={styles.sidebarLogoutButton}
            onClick={() => { logout(); setIsMenuOpen(false); }}
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <TutorialProvider>
          {children}
          <TutorialButton />
        </TutorialProvider>
      </main>
      <FeedbackButton />
    </>
  );
};

export default MainLayout;