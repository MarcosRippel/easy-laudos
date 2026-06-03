'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EquipmentNotification } from '@/types/equipment';
import styles from './EquipmentNotifications.module.css';

export default function EquipmentNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<EquipmentNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/equipments/notifications');
      if (!response.ok) throw new Error('Erro ao buscar notificações');

      const data = await response.json();
      setNotifications(data);
      setDismissed(new Set()); // limpa dismiss ao recarregar
    } catch (err) {
      setError('Erro ao carregar notificações de equipamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const handleDismissAll = () => {
    const allIds = notifications.map(n => n.id);
    setDismissed(new Set(allIds));
  };

  const handleGoToEquipments = () => {
    router.push('/admin/equipments');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'expired': return '❌';
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '📟';
    }
  };

  const getSeverityText = (severity: string, days: number) => {
    switch (severity) {
      case 'expired': return 'Vencido';
      case 'critical': return `${days} dias`;
      case 'warning': return `${days} dias`;
      default: return 'OK';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'expired': return '#ff4757';
      case 'critical': return '#ff6b00';
      case 'warning': return '#ffa502';
      default: return '#2ed573';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>📟 Equipamentos</h3>
        </div>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>📟 Equipamentos</h3>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>📟 Equipamentos</h3>
        </div>
        <div className={styles.noNotifications}>
          <div className={styles.successIcon}>✅</div>
          <p>Todos os equipamentos estão em dia!</p>
        </div>
      </div>
    );
  }

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  if (visibleNotifications.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>📟 Equipamentos</h3>
          <button onClick={fetchNotifications} className={styles.refreshButton} title="Recarregar">
            🔄
          </button>
        </div>
        <div className={styles.noNotifications}>
          <div className={styles.successIcon}>✅</div>
          <p>Alertas dispensados. <button className={styles.linkButton} onClick={fetchNotifications}>Recarregar</button></p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📟 Equipamentos ({visibleNotifications.length})</h3>
        <div className={styles.headerActions}>
          <button
            onClick={handleGoToEquipments}
            className={styles.manageButton}
            title="Ir para gerenciamento de equipamentos"
          >
            🔧 Gerenciar
          </button>
          <button
            onClick={handleDismissAll}
            className={styles.dismissAllButton}
            title="Fechar todas as notificações"
          >
            ✕ Fechar todas
          </button>
          <button onClick={fetchNotifications} className={styles.refreshButton} title="Recarregar">
            🔄
          </button>
        </div>
      </div>

      <div className={styles.notificationsList}>
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={styles.notificationCard}
            style={{ borderLeftColor: getSeverityColor(notification.severity) }}
          >
            <div className={styles.notificationHeader}>
              <span className={styles.icon}>
                {getSeverityIcon(notification.severity)}
              </span>
              <div className={styles.equipmentInfo}>
                <h4>{notification.name} {notification.model}</h4>
                <p className={styles.certificate}>{notification.certificateNumber}</p>
              </div>
              <div
                className={styles.badge}
                style={{ backgroundColor: getSeverityColor(notification.severity) }}
              >
                {getSeverityText(notification.severity, notification.daysUntilExpiration)}
              </div>
            </div>

            <div className={styles.expirationInfo}>
              <span className={styles.label}>Vencimento:</span>
              <span className={styles.date}>
                {new Date(notification.expirationDate).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Botões de ação por card */}
            <div className={styles.cardActions}>
              <button
                className={styles.actionButtonPrimary}
                onClick={handleGoToEquipments}
                title="Ir para equipamentos para renovar ou excluir"
              >
                🔧 Gerenciar equipamento
              </button>
              <button
                className={styles.actionButtonSecondary}
                onClick={() => handleDismiss(notification.id)}
                title="Fechar esta notificação"
              >
                ✕ Fechar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}