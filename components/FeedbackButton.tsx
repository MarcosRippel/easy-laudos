'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MAX_RECORD_SECONDS = 90;
const MAX_TEXT = 4000;

type RecordingState = 'idle' | 'recording' | 'recorded';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<RecordingState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [submit, setSubmit] = useState<SubmitState>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (tickRef.current) clearInterval(tickRef.current);
      stopMic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const stopMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const resetForm = () => {
    setText('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording('idle');
    setSeconds(0);
    setSubmit('idle');
    setErrMsg(null);
  };

  const close = () => {
    setOpen(false);
    setTimeout(resetForm, 300);
  };

  const startRecording = async () => {
    try {
      setErrMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording('recorded');
        stopMic();
        if (tickRef.current) clearInterval(tickRef.current);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording('recording');
      setSeconds(0);
      tickRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) {
            stopRecording();
            return MAX_RECORD_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      setErrMsg('Não foi possível acessar o microfone. Verifique a permissão.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const discardAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording('idle');
    setSeconds(0);
  };

  const onSubmit = async () => {
    if (!text.trim() && !audioBlob) {
      setErrMsg('Escreva um texto ou grave um áudio.');
      return;
    }
    setSubmit('submitting');
    setErrMsg(null);
    try {
      const fd = new FormData();
      fd.set('text', text.trim());
      fd.set('page', pathname || '');
      if (audioBlob) {
        const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
        fd.set('audio', audioBlob, `feedback.${ext}`);
      }
      const res = await fetch('/api/feedback', { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Falha ao enviar');
      }
      setSubmit('success');
      setToast('Obrigado! Seu feedback foi salvo — o dev vai analisar.');
      setTimeout(close, 1200);
    } catch (e) {
      const err = e as Error;
      setSubmit('error');
      setErrMsg(err.message || 'Erro inesperado.');
    }
  };

  // Não mostrar nas rotas públicas
  if (pathname?.startsWith('/login') || pathname?.startsWith('/verificar')) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback ao desenvolvedor"
        title="Enviar feedback"
        style={{
          position: 'fixed',
          right: 18,
          bottom: 18,
          zIndex: 9998,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(138,164,152,0.95), rgba(110,140,128,0.95))',
          color: '#0b0b0d',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.55)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)';
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12c0 4.418-4.03 8-9 8a9.7 9.7 0 0 1-3.85-.78L3 20l1.05-3.93A7.6 7.6 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Enviar feedback"
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, fontFamily: FONT,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(17,17,20,0.96)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 28,
              maxWidth: 460,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              color: '#ececec',
              boxShadow: '0 30px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 30, height: 30, borderRadius: '50%',
                background: 'transparent', color: 'rgba(236,236,236,0.7)',
                border: '1px solid rgba(255,255,255,0.14)',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}>
                Manda sua opinião
              </h3>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(236,236,236,0.65)', lineHeight: 1.55 }}>
                O que você acha que falta fazer ou está errado? Pode escrever, gravar áudio, ou os dois.
              </p>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
              placeholder="Coloque aqui o que você acha que falta ou que está errado…"
              rows={5}
              maxLength={MAX_TEXT}
              disabled={submit === 'submitting'}
              style={{
                width: '100%', padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#ececec', fontSize: 14,
                fontFamily: FONT, resize: 'vertical', minHeight: 120,
                outline: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(138,164,152,0.6)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />
            <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(236,236,236,0.4)', textAlign: 'right' }}>
              {text.length} / {MAX_TEXT}
            </div>

            {/* AUDIO */}
            <div style={{
              marginTop: 16, padding: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
            }}>
              {recording === 'idle' && !audioUrl && (
                <button
                  type="button" onClick={startRecording} disabled={submit === 'submitting'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', justifyContent: 'center',
                    padding: '11px', borderRadius: 8,
                    background: 'rgba(138,164,152,0.15)',
                    border: '1px solid rgba(138,164,152,0.4)',
                    color: '#ececec', fontSize: 13.5, fontWeight: 500,
                    cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1.75a3.25 3.25 0 0 0-3.25 3.25v6a3.25 3.25 0 0 0 6.5 0V5A3.25 3.25 0 0 0 12 1.75zM5 11a7 7 0 0 0 14 0M12 18v3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  Gravar áudio
                </button>
              )}

              {recording === 'recording' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 0 4px rgba(239,68,68,0.25)',
                    animation: 'pulse 1.4s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 13.5, color: '#fecaca', fontVariantNumeric: 'tabular-nums' }}>
                    Gravando · {formatTime(seconds)} <span style={{ color: 'rgba(236,236,236,0.45)' }}>/ {formatTime(MAX_RECORD_SECONDS)}</span>
                  </span>
                  <button
                    type="button" onClick={stopRecording}
                    style={{
                      marginLeft: 'auto', padding: '8px 14px', borderRadius: 8,
                      background: '#ececec', color: '#0b0b0d',
                      border: '1px solid #ececec', cursor: 'pointer',
                      fontSize: 13, fontWeight: 600, fontFamily: FONT,
                    }}
                  >
                    Parar
                  </button>
                </div>
              )}

              {audioUrl && recording !== 'recording' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <audio controls src={audioUrl} style={{ width: '100%', filter: 'invert(0.85) hue-rotate(180deg)' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button" onClick={discardAudio}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: 'transparent', color: 'rgba(236,236,236,0.7)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                      }}
                    >
                      Descartar áudio
                    </button>
                    <button
                      type="button" onClick={() => { discardAudio(); startRecording(); }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        background: 'rgba(138,164,152,0.15)',
                        border: '1px solid rgba(138,164,152,0.4)',
                        color: '#ececec', cursor: 'pointer',
                        fontSize: 13, fontFamily: FONT,
                      }}
                    >
                      Regravar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errMsg && (
              <div style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#fecaca', fontSize: 13,
              }}>
                {errMsg}
              </div>
            )}

            <button
              type="button" onClick={onSubmit}
              disabled={submit === 'submitting' || (!text.trim() && !audioBlob)}
              style={{
                width: '100%', marginTop: 18, padding: '13px',
                background: '#ececec', color: '#0b0b0d',
                border: '1px solid #ececec', borderRadius: 10,
                cursor: submit === 'submitting' ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, fontFamily: FONT,
                opacity: (!text.trim() && !audioBlob) || submit === 'submitting' ? 0.55 : 1,
              }}
            >
              {submit === 'submitting' ? 'Enviando…' : submit === 'success' ? '✓ Enviado' : 'Enviar feedback'}
            </button>
          </div>

          <style>{`
            @keyframes pulse {
              0%,100% { box-shadow: 0 0 0 4px rgba(239,68,68,0.25); }
              50% { box-shadow: 0 0 0 8px rgba(239,68,68,0.05); }
            }
          `}</style>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed', bottom: 90, right: 18, zIndex: 10002,
            maxWidth: 320,
            background: 'rgba(17,17,20,0.95)',
            backdropFilter: 'blur(20px) saturate(140%)',
            WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            color: '#ececec', fontFamily: FONT,
            border: '1px solid rgba(138,164,152,0.4)',
            borderRadius: 12, padding: '12px 16px',
            boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
            fontSize: 13.5, lineHeight: 1.55,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'toastIn 0.3s ease-out',
          }}
        >
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(138,164,152,0.25)', color: '#b6c9bf',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, flexShrink: 0,
          }}>✓</span>
          {toast}
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
