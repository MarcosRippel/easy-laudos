'use client';

import { useState, useEffect } from 'react';
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import type { AdminSetting } from '@prisma/client';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [settings, setSettings] = useState<AdminSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingText}>Carregando...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.error}>
        <div className={styles.errorText}>Erro ao carregar configurações</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h2 className={styles.title}>
          👨‍💼 Painel do Inspetor
        </h2>

        {/* Seção de Equipamentos */}
        <div className={styles.equipmentSection}>
          <h3 className={styles.sectionTitle}>
            🔧 Gerenciamento de Equipamentos
          </h3>
          <p className={styles.sectionDescription}>
            Gerencie todos os equipamentos utilizados nas inspeções, incluindo calibrações e certificações.
          </p>
          <a href="/admin/equipments" className={styles.equipmentLink}>
            🔧 Gerenciar Equipamentos
          </a>
        </div>

        {/* Configurações da Empresa */}
        <div className={styles.settingsSection}>
          <h3 className={styles.settingsTitle}>
            🏢 Configurações da Empresa
          </h3>
          <AdminSettingsForm initialSettings={settings} />
        </div>
      </div>
    </div>
  );
}