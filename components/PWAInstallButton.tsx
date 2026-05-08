'use client';

import { useState } from 'react';
import { usePWA } from './PWAProvider';

export default function PWAInstallButton() {
  const { canInstall, isIOS, isStandalone, install } = usePWA();
  const [showIosHint, setShowIosHint] = useState(false);

  if (isStandalone) return null;
  if (!canInstall && !isIOS) return null;

  const handleClick = () => {
    if (canInstall) install();
    else if (isIOS) setShowIosHint(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Instalar app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'rgba(138, 164, 152, 0.18)',
          color: '#ececec',
          border: '1px solid rgba(138, 164, 152, 0.45)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(138, 164, 152, 0.28)';
          e.currentTarget.style.borderColor = 'rgba(138, 164, 152, 0.7)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(138, 164, 152, 0.18)';
          e.currentTarget.style.borderColor = 'rgba(138, 164, 152, 0.45)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1v9M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12v2.5h12V12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Instalar app
      </button>

      {showIosHint && (
        <div
          role="dialog"
          aria-label="Como instalar no iOS"
          onClick={() => setShowIosHint(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(17, 17, 20, 0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 14,
              padding: 28,
              maxWidth: 380,
              color: '#ececec',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              Instalar no iOS
            </h3>
            <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: 'rgba(236,236,236,0.7)' }}>
              No Safari, toque em{' '}
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
              e em seguida <strong style={{ color: '#ececec' }}>&quot;Adicionar à Tela Início&quot;</strong>.
            </p>
            <button
              onClick={() => setShowIosHint(false)}
              style={{
                marginTop: 20,
                width: '100%',
                background: '#ececec',
                color: '#0b0b0d',
                border: 'none',
                padding: '12px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
