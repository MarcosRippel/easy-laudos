'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Client } from '@prisma/client';
import styles from './EmitirLaudo.module.css';
import ChecklistForm from '@/components/laudos/ChecklistForm';
import CreateLaudoForm from '@/components/laudos/CreateLaudoForm';
import RuidoForm from '@/components/laudos/RuidoForm';
import PinoReiForm from '@/components/laudos/PinoReiForm';
import QuintaRodaForm from '@/components/laudos/QuintaRodaForm';

interface CardType {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export default function EmitirLaudoPage() {
  const searchParams = useSearchParams();
  const urlTipo = searchParams.get('tipo');
  const urlClientId = searchParams.get('clientId');
  const urlPlaca = searchParams.get('placa');

  const [activeCard, setActiveCard] = useState<string | null>(urlTipo || null);
  const [clients, setClients] = useState<Client[]>([]);
  const [nextOrdemServico, setNextOrdemServico] = useState('');
  const [temporalCode, setTemporalCode] = useState('');
  const [loading, setLoading] = useState(true);

  const cards: CardType[] = [
    { id: 'CHECKLIST', title: 'Laudo CHECKLIST', icon: '✅', color: 'green' },
    { id: 'LIT', title: 'Laudo LIT', icon: '📝', color: 'blue' },
    { id: 'RUIDO', title: 'Laudo Ruído', icon: '🔊', color: 'orange' },
    { id: 'PINO_REI', title: 'Laudo Pino Rei', icon: '🔧', color: 'purple' },
    { id: 'QUINTA_RODA', title: 'Laudo Quinta Roda', icon: '🔧', color: 'red' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [clientsResponse, osResponse, temporalResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/laudos/next-os'),
        fetch('/api/temporal-code')
      ]);

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }

      if (osResponse.ok) {
        const osData = await osResponse.json();
        setNextOrdemServico(osData.nextOrdemServico);
      }

      if (temporalResponse.ok) {
        const temporalData = await temporalResponse.json();
        setTemporalCode(temporalData.code);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    setActiveCard(activeCard === cardId ? null : cardId);
  };

  const renderDynamicContent = () => {
    if (!activeCard) return null;

    switch (activeCard) {
      case 'CHECKLIST':
        return (
          <div className={styles.inlineComponent}>
            <ChecklistForm
              clients={clients}
              nextOrdemServico={nextOrdemServico}
              temporalCode={temporalCode}
              initialClientId={urlClientId || undefined}
              initialPlaca={urlPlaca || undefined}
            />
          </div>
        );

      case 'LIT':
        return (
          <div className={styles.inlineComponent}>
            <CreateLaudoForm
              clients={clients}
              nextOrdemServico={nextOrdemServico}
              temporalCode={temporalCode}
              initialClientId={urlClientId || undefined}
              initialPlaca={urlPlaca || undefined}
            />
          </div>
        );

      case 'RUIDO':
        return (
          <div className={styles.inlineComponent}>
            <RuidoForm
              clients={clients}
              nextOrdemServico={nextOrdemServico}
              temporalCode={temporalCode}
              initialClientId={urlClientId || undefined}
              initialPlaca={urlPlaca || undefined}
            />
          </div>
        );

      case 'PINO_REI':
        return (
          <div className={styles.inlineComponent}>
            <PinoReiForm
              clients={clients}
              nextOrdemServico={nextOrdemServico}
              temporalCode={temporalCode}
              initialClientId={urlClientId || undefined}
              initialPlaca={urlPlaca || undefined}
            />
          </div>
        );


      case 'QUINTA_RODA':
        return (
          <div className={styles.inlineComponent}>
            <QuintaRodaForm
              clients={clients}
              nextOrdemServico={nextOrdemServico}
              temporalCode={temporalCode}
              initialClientId={urlClientId || undefined}
              initialPlaca={urlPlaca || undefined}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📋 Emitir Laudo</h1>
        <p className={styles.pageSubtitle}>
          Selecione o tipo de laudo que deseja emitir
        </p>
      </div>

      {/* Cards de tipos de laudos */}
      <div data-tutorial="laudo-cards" className={styles.cardsGrid}>
        {cards.map(card => (
          <div key={card.id} className={styles.cardWrapper}>
            <div
              data-tutorial={`laudo-${card.id.toLowerCase().replace('_', '-')}`}
              className={`${styles.card} ${activeCard === card.id ? styles.active : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={styles.cardIcon}>{card.icon}</div>
              <div className={styles.cardTitle}>{card.title}</div>
              {activeCard === card.id && (
                <div className={styles.activeIndicator}></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Área dinâmica */}
      {activeCard && (
        <div data-tutorial="active-form" className={styles.dynamicArea}>
          {renderDynamicContent()}
        </div>
      )}
    </div>
  );
}