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
}

interface ClientFormProps {
  clientData: ClientFormData;
  onDataChange?: (data: ClientFormData) => void;
}

export default function ClientForm({ clientData, onDataChange }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>(clientData);

  // Update local state when clientData changes
  useEffect(() => {
    setFormData(clientData);
  }, [clientData]);

  // Notify parent component when data changes
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

  const renderInput = (label: string, field: keyof ClientFormData, value: string | undefined) => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={styles.input}
        placeholder={`Digite ${label.toLowerCase()}`}
      />
    </div>
  );

  const renderAddressInput = () => (
    <div className={styles.inputGroup}>
      <label className={styles.label}>Endereço</label>
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
          placeholder="Número"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.resultsContainer}>
      <h3 style={{ marginTop: 0 }}>Client Details</h3>
      <div className={styles.grid}>
        {renderInput('Proprietário', 'name', formData.name)}
        {renderInput('CNPJ/CPF', 'cnpj', formData.cnpj)}
        {renderAddressInput()}
        {renderInput('Município', 'addressCity', formData.addressCity)}
        {renderInput('UF', 'addressState', formData.addressState)}
        {renderInput('CEP', 'addressZip', formData.addressZip)}
        {renderInput('Bairro', 'addressDistrict', formData.addressDistrict)}
        {renderInput('Telefones', 'phone', formData.phone)}
      </div>
    </div>
  );
}