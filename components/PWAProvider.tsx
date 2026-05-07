'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'gts-pwa-dismiss-until';

function isIOS(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPad OS 13+ reporta como MacIntel mas tem touchpoints
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore iOS Safari
    window.navigator.standalone === true
  );
}

export default function PWAProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[PWA] Falha ao registrar service worker', err);
        });
      });
    }

    if (isInStandaloneMode()) return;

    const dismissUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() <= dismissUntil) return;

    if (isIOS()) {
      // iOS Safari: não tem beforeinstallprompt — mostra instrução manual
      setIosMode(true);
      setVisible(true);
      return;
    }

    // Chrome / Edge / Android: usa beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferred(null);
    }
  };

  const onDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 1000 * 60 * 60 * 24 * 7));
    setVisible(false);
  };

  if (!visible) return null;

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    left: 12,
    right: 12,
    bottom: 12,
    background: '#1f2937',
    color: '#f1f1f1',
    border: '1px solid #374151',
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
    padding: 14,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  // Banner iOS — instrução manual com ícone de compartilhar
  if (iosMode) {
    return (
      <div role="dialog" aria-label="Instalar GTS Inspetor" style={bannerStyle}>
        {/* Seta apontando para baixo (para o botão Share na barra do Safari) */}
        <div style={{
          position: 'absolute',
          bottom: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid #374151',
        }} />
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <strong style={{ fontSize: 15 }}>Instalar GTS Inspetor</strong>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.5 }}>
            Toque em{' '}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              background: '#374151',
              borderRadius: 4,
              padding: '1px 6px',
              fontWeight: 600,
            }}>
              {/* Ícone share do iOS — seta para cima com base */}
              <svg width="13" height="14" viewBox="0 0 13 14" fill="none" style={{ verticalAlign: 'middle' }}>
                <path d="M6.5 1v8M3 4l3.5-3.5L10 4" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 9v3.5h11V9" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Compartilhar
            </span>{' '}
            e depois <strong>"Adicionar à Tela Início"</strong>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            color: '#9ca3af',
            border: '1px solid #4b5563',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          OK
        </button>
      </div>
    );
  }

  // Banner Chrome / Android — prompt nativo
  return (
    <div role="dialog" aria-label="Instalar GTS Inspetor" style={bannerStyle}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <strong style={{ fontSize: 15 }}>Instalar GTS Inspetor</strong>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Use o sistema como aplicativo na tela inicial — abre rápido e funciona offline.
        </div>
      </div>
      <button
        onClick={onInstall}
        style={{
          background: '#007bff',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Instalar
      </button>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          color: '#9ca3af',
          border: '1px solid #4b5563',
          padding: '10px 12px',
          borderRadius: 8,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Agora não
      </button>
    </div>
  );
}
