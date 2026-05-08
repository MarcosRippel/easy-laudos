'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PWAState = {
  canInstall: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  install: () => Promise<void>;
  dismissBanner: () => void;
};

const PWAContext = createContext<PWAState>({
  canInstall: false,
  isIOS: false,
  isStandalone: false,
  install: async () => {},
  dismissBanner: () => {},
});

export const usePWA = () => useContext(PWAContext);

const DISMISS_KEY = 'gts-pwa-dismiss-until';
const PUBLIC_PREFIXES = ['/login', '/verificar'];

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

export default function PWAProvider({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [iosFlag, setIosFlag] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Falha ao registrar service worker', err);
        });
      });
    }

    const standalone = isInStandaloneMode();
    setIsStandalone(standalone);
    setIosFlag(isIOSDevice());

    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Banner só aparece em rota autenticada e quando o usuário não dispensou
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStandalone) {
      setBannerVisible(false);
      return;
    }
    const isPublic = PUBLIC_PREFIXES.some((p) => pathname?.startsWith(p));
    if (isPublic) {
      setBannerVisible(false);
      return;
    }
    const dismissUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() <= dismissUntil) {
      setBannerVisible(false);
      return;
    }
    if (canInstall || iosFlag) setBannerVisible(true);
  }, [pathname, canInstall, iosFlag, isStandalone]);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferred(null);
      setBannerVisible(false);
    }
  }, [deferred]);

  const dismissBanner = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 1000 * 60 * 60 * 24 * 14));
    setBannerVisible(false);
  }, []);

  return (
    <PWAContext.Provider value={{ canInstall, isIOS: iosFlag, isStandalone, install, dismissBanner }}>
      {children}
      {bannerVisible && (iosFlag ? <IosBanner onDismiss={dismissBanner} /> : <InstallBanner onInstall={install} onDismiss={dismissBanner} />)}
    </PWAContext.Provider>
  );
}

const cardStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 9999,
  left: 16,
  right: 16,
  bottom: 16,
  maxWidth: 480,
  margin: '0 auto',
  background: 'rgba(17, 17, 20, 0.92)',
  backdropFilter: 'blur(24px) saturate(140%)',
  WebkitBackdropFilter: 'blur(24px) saturate(140%)',
  color: '#ececec',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 14,
  boxShadow: '0 25px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
  padding: 16,
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

function InstallBanner({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  return (
    <div role="dialog" aria-label="Instalar General Inspetor" style={cardStyle}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <strong style={{ fontSize: 14, letterSpacing: '0.005em' }}>Instalar General Inspetor</strong>
        <div style={{ fontSize: 12.5, color: 'rgba(236,236,236,0.65)', marginTop: 4, lineHeight: 1.5 }}>
          Use como app na tela inicial — abre rápido e funciona offline.
        </div>
      </div>
      <button
        onClick={onInstall}
        style={{
          background: '#ececec',
          color: '#0b0b0d',
          border: '1px solid #ececec',
          padding: '10px 18px',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Instalar
      </button>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          color: 'rgba(236,236,236,0.62)',
          border: '1px solid rgba(255,255,255,0.14)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 12.5,
          cursor: 'pointer',
        }}
      >
        Agora não
      </button>
    </div>
  );
}

function IosBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div role="dialog" aria-label="Instalar General Inspetor" style={cardStyle}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <strong style={{ fontSize: 14 }}>Instalar General Inspetor</strong>
        <div style={{ fontSize: 12.5, color: 'rgba(236,236,236,0.65)', marginTop: 4, lineHeight: 1.5 }}>
          Toque em{' '}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 4,
            padding: '1px 6px',
            fontWeight: 600,
            color: '#ececec',
          }}>
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
              <path d="M6.5 1v8M3 4l3.5-3.5L10 4" stroke="#8aa498" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1 9v3.5h11V9" stroke="#8aa498" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Compartilhar
          </span>{' '}
          e depois <strong style={{ color: '#ececec' }}>&quot;Adicionar à Tela Início&quot;</strong>.
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          color: 'rgba(236,236,236,0.7)',
          border: '1px solid rgba(255,255,255,0.14)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 12.5,
          cursor: 'pointer',
        }}
      >
        OK
      </button>
    </div>
  );
}
