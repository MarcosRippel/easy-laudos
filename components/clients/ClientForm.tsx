'use client';

import { useState, useEffect } from 'react';
import styles from '@/app/clients/create/ClientCreatePage.module.css';

export interface ClientFormData {
  name: string;
  cnpj: string;
  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressDistrict?: string;
  phone?: string;
  contactWhatsapp?: string;
}

interface ClientFormProps {
  clientData: ClientFormData;
  onDataChange?: (data: ClientFormData) => void;
}

export default function ClientForm({ clientData, onDataChange }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(clientData);

  useEffect(() => {
    setFormData(clientData);
  }, [clientData]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderInput = (label: string, field: keyof ClientFormData, value: string | undefined, options?: { placeholder?: string; icon?: string }) => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{options?.icon ? `${options.icon} ` : ''}{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={styles.input}
        placeholder={options?.placeholder || `Digite ${label.toLowerCase()}`}
      />
    </div>
  );

  const renderAddressInput = () => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>📍 Endereço</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={formData.addressStreet || ''}
          onChange={(e) => handleInputChange('addressStreet', e.target.value)}
          className={styles.input}
          placeholder="Rua"
          style={{ flex: 2 }}
        />
        <input
          type="text"
          value={formData.addressNumber || ''}
          onChange={(e) => handleInputChange('addressNumber', e.target.value)}
          className={styles.input}
          placeholder="Nº"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.resultsContainer}>
      <h3 className={styles.formSectionTitle}>📝 Dados do Cliente</h3>
      <div className={styles.grid}>
        {renderInput('Razão Social / Proprietário', 'name', formData.name, { icon: '🏢' })}
        {renderInput('CNPJ/CPF', 'cnpj', formData.cnpj, { icon: '📋' })}
        {renderAddressInput()}
        {renderInput('Município', 'addressCity', formData.addressCity, { icon: '🏙️' })}
        {renderInput('UF', 'addressState', formData.addressState, { icon: '🗺️' })}
        {renderInput('CEP', 'addressZip', formData.addressZip, { icon: '📮' })}
        {renderInput('Bairro', 'addressDistrict', formData.addressDistrict, { icon: '📍' })}
        {renderInput('Telefones da Empresa', 'phone', formData.phone, { icon: '📞' })}
      </div>

      <div className={styles.whatsappSection}>
        <h4 className={styles.whatsappTitle}>📱 Contato do Responsável pelos Laudos</h4>
        <p className={styles.whatsappHint}>
          Informe o WhatsApp ou telefone da pessoa responsável pela inspeção/laudos neste cliente.
        </p>
        <div className={styles.whatsappInputRow}>
          <input
            type="text"
            value={formData.contactWhatsapp || ''}
            onChange={(e) => handleInputChange('contactWhatsapp', e.target.value)}
            className={`${styles.input} ${styles.whatsappInput}`}
            placeholder="Ex: (11) 90000-0000"
          />
          {formData.contactWhatsapp && (
            <a
              href={`https://wa.me/55${formData.contactWhatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappLink}
              title="Abrir conversa no WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}