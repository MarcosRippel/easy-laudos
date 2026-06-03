'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface LaudoData {
    valid: boolean;
    hash: string;
    companyName: string;
    logoBase64: string | null;
    vehiclePlate: string;
    vehicleBrand: string;
    clientName: string;
    dataEmissao: string;
    laudoType: string;
    laudoTypeRaw: string;
    ordemServico: string;
    codTemporal: string;
    resultado: string | null;
    dataVencimento: string | null;
}

export default function VerificarPage() {
    const params = useParams();
    const hash = params?.hash as string;

    const [data, setData] = useState<LaudoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCheck, setShowCheck] = useState(false);

    useEffect(() => {
        if (!hash) return;
        fetch(`/api/laudos/verify/${hash}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.error) {
                    setError('Laudo não encontrado ou hash inválido.');
                } else {
                    setData(d);
                    setTimeout(() => setShowCheck(true), 400);
                }
            })
            .catch(() => setError('Erro ao verificar documento.'))
            .finally(() => setLoading(false));
    }, [hash]);

    const isAprovado = data?.resultado ? data.resultado === 'APROVADO' : true;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .container {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .card {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }

        .badge-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .badge-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          margin-bottom: 4px;
        }

        .badge-subtitle {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }

        /* ===== CHECK ANIMATION ===== */
        .check-wrapper {
          display: flex;
          justify-content: center;
          margin: 8px 0 24px;
        }

        .check-circle {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.4s ease;
        }

        .check-circle.aprovado {
          background: linear-gradient(135deg, #00c853, #69f0ae);
          box-shadow: 0 0 40px rgba(0, 200, 83, 0.5), 0 0 80px rgba(0, 200, 83, 0.2);
          animation: pulse-green 2s infinite;
        }

        .check-circle.reprovado {
          background: linear-gradient(135deg, #d32f2f, #ef5350);
          box-shadow: 0 0 40px rgba(211, 47, 47, 0.5), 0 0 80px rgba(211, 47, 47, 0.2);
          animation: pulse-red 2s infinite;
        }

        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 30px rgba(0, 200, 83, 0.5); }
          50% { box-shadow: 0 0 60px rgba(0, 200, 83, 0.8), 0 0 100px rgba(0, 200, 83, 0.3); }
        }

        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 30px rgba(211, 47, 47, 0.5); }
          50% { box-shadow: 0 0 60px rgba(211, 47, 47, 0.8), 0 0 100px rgba(211, 47, 47, 0.3); }
        }

        .check-svg {
          width: 52px;
          height: 52px;
          opacity: 0;
          transform: scale(0.3);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .check-svg.visible {
          opacity: 1;
          transform: scale(1);
        }

        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          transition: stroke-dashoffset 0.6s ease 0.3s;
        }

        .check-path.draw {
          stroke-dashoffset: 0;
        }

        .status-text {
          text-align: center;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }

        .status-text.aprovado { color: #69f0ae; }
        .status-text.reprovado { color: #ef5350; }
        .status-text.sem-resultado { color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; letter-spacing: 0; }

        /* ===== COMPANY SECTION ===== */
        .company-section {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .company-logo {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          object-fit: contain;
          background: white;
          padding: 4px;
          flex-shrink: 0;
        }

        .company-logo-placeholder {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .company-info .label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2px;
        }

        .company-info .name {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        /* ===== DATA GRID ===== */
        .data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .data-item {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 14px;
        }

        .data-item.full {
          grid-column: 1 / -1;
        }

        .data-item .label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          margin-bottom: 4px;
        }

        .data-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }

        .data-item .value.plate {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #82b1ff;
        }

        /* ===== HASH FOOTER ===== */
        .hash-footer {
          margin-top: 20px;
          padding: 12px 14px;
          background: rgba(0,0,0,0.3);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .hash-footer .label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 3px;
        }

        .hash-footer .value {
          font-size: 9px;
          font-family: 'Courier New', monospace;
          color: rgba(255,255,255,0.4);
          word-break: break-all;
        }

        /* ===== LOADING / ERROR ===== */
        .center-msg {
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-size: 16px;
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top: 3px solid #82b1ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .powered-by {
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          text-align: center;
          letter-spacing: 0.5px;
        }

        .powered-by span {
          color: rgba(255,255,255,0.35);
          font-weight: 600;
        }
      `}</style>

            <div className="container">
                {loading && (
                    <div className="card center-msg">
                        <div className="spinner" />
                        Verificando documento...
                    </div>
                )}

                {!loading && error && (
                    <div className="card center-msg">
                        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                        <div style={{ color: '#ef5350', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Documento Inválido</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{error}</div>
                    </div>
                )}

                {!loading && data && (
                    <>
                        <div className="card">
                            <div className="badge-header">
                                <div className="badge-title">Verificação de Autenticidade</div>
                                <div className="badge-subtitle">Laudo Inspecionado</div>
                            </div>

                            {/* Animação de Conformidade */}
                            <div className="check-wrapper">
                                <div className={`check-circle ${isAprovado ? 'aprovado' : 'reprovado'}`}>
                                    {isAprovado ? (
                                        <svg className={`check-svg ${showCheck ? 'visible' : ''}`} viewBox="0 0 52 52" fill="none">
                                            <path
                                                className={`check-path ${showCheck ? 'draw' : ''}`}
                                                d="M12 26L22 36L40 16"
                                                stroke="white"
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    ) : (
                                        <svg className={`check-svg ${showCheck ? 'visible' : ''}`} viewBox="0 0 52 52" fill="none">
                                            <path
                                                className={`check-path ${showCheck ? 'draw' : ''}`}
                                                d="M16 16L36 36M36 16L16 36"
                                                stroke="white"
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Status */}
                            {data.resultado ? (
                                <div className={`status-text ${data.resultado === 'APROVADO' ? 'aprovado' : 'reprovado'}`}>
                                    {data.resultado}
                                </div>
                            ) : (
                                <div className="status-text sem-resultado">
                                    Documento autêntico e verificado
                                </div>
                            )}

                            {/* Empresa Emissora */}
                            <div className="company-section">
                                {data.logoBase64 ? (
                                    <img src={data.logoBase64} alt="Logo da empresa" className="company-logo" />
                                ) : (
                                    <div className="company-logo-placeholder">🏢</div>
                                )}
                                <div className="company-info">
                                    <div className="label">Empresa Emissora</div>
                                    <div className="name">{data.companyName}</div>
                                </div>
                            </div>

                            {/* Grid de dados */}
                            <div className="data-grid">
                                <div className="data-item">
                                    <div className="label">Placa</div>
                                    <div className="value plate">{data.vehiclePlate}</div>
                                </div>
                                <div className="data-item">
                                    <div className="label">OS Nº</div>
                                    <div className="value">{data.ordemServico}</div>
                                </div>
                                <div className="data-item full">
                                    <div className="label">Tipo de Laudo</div>
                                    <div className="value">{data.laudoType}</div>
                                </div>
                                <div className="data-item full">
                                    <div className="label">Empresa / Cliente</div>
                                    <div className="value">{data.clientName}</div>
                                </div>
                                <div className="data-item full">
                                    <div className="label">Data de Emissão</div>
                                    <div className="value">{data.dataEmissao}</div>
                                </div>
                                {data.dataVencimento && (
                                    <div className="data-item full">
                                        <div className="label">Validade</div>
                                        <div className="value">{data.dataVencimento}</div>
                                    </div>
                                )}
                            </div>

                            {/* Hash */}
                            <div className="hash-footer">
                                <div className="label">Hash SHA-256</div>
                                <div className="value">{data.hash}</div>
                            </div>
                        </div>

                        <div className="powered-by">
                            Verificado por <span>General Inspetor</span> · generalinspetor.terpens.com.br
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
