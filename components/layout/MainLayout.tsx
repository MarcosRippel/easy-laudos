'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { ReactNode } from 'react';
import styles from './MainLayout.module.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthWrapper';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      <header className={styles.header} style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        borderBottom: '3px solid #444',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        padding: '0.75rem 1.5rem'
      }}>
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
        <nav className={styles.nav} style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.activeLink : ''}`}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              background: pathname === '/' ? 'linear-gradient(135deg, #007bff, #0056b3)' : 'transparent',
              color: pathname === '/' ? 'white' : '#e9ecef',
              border: pathname === '/' ? 'none' : '2px solid transparent',
              boxShadow: pathname === '/' ? '0 4px 15px rgba(0,123,255,0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (pathname !== '/') {
                e.currentTarget.style.background = 'rgba(0,123,255,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (pathname !== '/') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            🏠 Home
          </Link>
          
          <Link href="/admin" className={`${styles.navLink} ${pathname === '/admin' ? styles.activeLink : ''}`}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              background: pathname === '/admin' ? 'linear-gradient(135deg, #6f42c1, #5a2d91)' : 'transparent',
              color: pathname === '/admin' ? 'white' : '#e9ecef',
              border: pathname === '/admin' ? 'none' : '2px solid transparent',
              boxShadow: pathname === '/admin' ? '0 4px 15px rgba(111,66,193,0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (pathname !== '/admin') {
                e.currentTarget.style.background = 'rgba(111,66,193,0.1)';
                e.currentTarget.style.borderColor = '#6f42c1';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (pathname !== '/admin') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            👨‍💼 Painel do Inspetor
          </Link>
          
          <Link href="/clients/create" className={`${styles.navLink} ${pathname === '/clients/create' ? styles.activeLink : ''}`}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              background: pathname === '/clients/create' ? 'linear-gradient(135deg, #28a745, #1e7e34)' : 'transparent',
              color: pathname === '/clients/create' ? 'white' : '#e9ecef',
              border: pathname === '/clients/create' ? 'none' : '2px solid transparent',
              boxShadow: pathname === '/clients/create' ? '0 4px 15px rgba(40,167,69,0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (pathname !== '/clients/create') {
                e.currentTarget.style.background = 'rgba(40,167,69,0.1)';
                e.currentTarget.style.borderColor = '#28a745';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (pathname !== '/clients/create') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            👥 Gestão de Clientes
          </Link>
          
          <Link href="/vehicles" className={`${styles.navLink} ${pathname === '/vehicles' ? styles.activeLink : ''}`}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              background: pathname === '/vehicles' ? 'linear-gradient(135deg, #ffc107, #e0a800)' : 'transparent',
              color: pathname === '/vehicles' ? '#000' : '#e9ecef',
              border: pathname === '/vehicles' ? 'none' : '2px solid transparent',
              boxShadow: pathname === '/vehicles' ? '0 4px 15px rgba(255,193,7,0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (pathname !== '/vehicles') {
                e.currentTarget.style.background = 'rgba(255,193,7,0.1)';
                e.currentTarget.style.borderColor = '#ffc107';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (pathname !== '/vehicles') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            ➕ Veículo
          </Link>
          
          <Link href="/emitirlaudo" className={`${styles.navLink} ${pathname === '/emitirlaudo' ? styles.activeLink : ''}`}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              background: pathname === '/emitirlaudo' ? 'linear-gradient(135deg, #007bff, #0056b3)' : 'transparent',
              color: pathname === '/emitirlaudo' ? 'white' : '#e9ecef',
              border: pathname === '/emitirlaudo' ? 'none' : '2px solid transparent',
              boxShadow: pathname === '/emitirlaudo' ? '0 4px 15px rgba(0,123,255,0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (pathname !== '/emitirlaudo') {
                e.currentTarget.style.background = 'rgba(0,123,255,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (pathname !== '/emitirlaudo') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            📋 Emitir Laudo
          </Link>
          
          {/* Link de administração de usuários - apenas para admin */}
          {user?.role === 'admin' && (
            <Link href="/admin/users" className={`${styles.navLink} ${pathname === '/admin/users' ? styles.activeLink : ''}`}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                background: pathname === '/admin/users' ? 'linear-gradient(135deg, #dc3545, #c82333)' : 'transparent',
                color: pathname === '/admin/users' ? 'white' : '#e9ecef',
                border: pathname === '/admin/users' ? 'none' : '2px solid transparent',
                boxShadow: pathname === '/admin/users' ? '0 4px 15px rgba(220,53,69,0.4)' : 'none'
              }}
              onMouseOver={(e) => {
                if (pathname !== '/admin/users') {
                  e.currentTarget.style.background = 'rgba(220,53,69,0.1)';
                  e.currentTarget.style.borderColor = '#dc3545';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseOut={(e) => {
                if (pathname !== '/admin/users') {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              🔧 Admin Users
            </Link>
          )}
          
          {/* Informações do usuário e logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginLeft: 'auto',
            color: '#e9ecef'
          }}>
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
      <main className={styles.mainContent}>
        {children}
      </main>
    </>
  );
};

export default MainLayout;