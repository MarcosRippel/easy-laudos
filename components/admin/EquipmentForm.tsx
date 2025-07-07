'use client';

import { useState, useEffect } from 'react';
import { Equipment, CreateEquipmentData } from '@/types/equipment';
import styles from './EquipmentForm.module.css';

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EquipmentForm({ equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState<CreateEquipmentData>({
    name: '',
    model: '',
    certificateNumber: '',
    calibrationDate: '',
    expirationDate: '',
    equipmentType: 'DECIBELIMETRO',
    isActive: true,
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        model: equipment.model,
        certificateNumber: equipment.certificateNumber,
        calibrationDate: equipment.calibrationDate.toISOString().split('T')[0],
        expirationDate: equipment.expirationDate.toISOString().split('T')[0],
        equipmentType: equipment.equipmentType,
        isActive: equipment.isActive,
      });
    }
  }, [equipment]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.certificateNumber.trim()) {
      newErrors.certificateNumber = 'Número do certificado é obrigatório';
    }

    if (!formData.calibrationDate) {
      newErrors.calibrationDate = 'Data de calibração é obrigatória';
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = 'Data de vencimento é obrigatória';
    }

    if (formData.calibrationDate && formData.expirationDate) {
      const calibrationDate = new Date(formData.calibrationDate);
      const expirationDate = new Date(formData.expirationDate);
      
      if (expirationDate <= calibrationDate) {
        newErrors.expirationDate = 'Data de vencimento deve ser posterior à data de calibração';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = equipment ? `/api/equipments/${equipment.id}` : '/api/equipments';
      const method = equipment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Certificate number already exists') {
          setErrors({ certificateNumber: 'Número do certificado já existe' });
          showMessage('Número do certificado já está em uso', 'error');
          return;
        }
        throw new Error(errorData.error || 'Erro ao salvar equipamento');
      }

      showMessage(
        equipment ? 'Equipamento atualizado com sucesso!' : 'Equipamento criado com sucesso!',
        'success'
      );
      
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (error) {
      console.error('Error saving equipment:', error);
      showMessage(
        error instanceof Error ? error.message : 'Erro ao salvar equipamento',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="name" className={styles.label}>
          Nome do Equipamento *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          placeholder="Ex: Decibelímetro Digital"
        />
        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="model" className={styles.label}>
          Modelo *
        </label>
        <input
          type="text"
          id="model"
          name="model"
          value={formData.model}
          onChange={handleChange}
          className={`${styles.input} ${errors.model ? styles.inputError : ''}`}
          placeholder="Ex: DEC-490"
        />
        {errors.model && <span className={styles.errorText}>{errors.model}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="certificateNumber" className={styles.label}>
          Número do Certificado *
        </label>
        <input
          type="text"
          id="certificateNumber"
          name="certificateNumber"
          value={formData.certificateNumber}
          onChange={handleChange}
          className={`${styles.input} ${errors.certificateNumber ? styles.inputError : ''}`}
          placeholder="Ex: CERT-2024-001"
        />
        {errors.certificateNumber && <span className={styles.errorText}>{errors.certificateNumber}</span>}
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="equipmentType" className={styles.label}>
          Tipo de Equipamento *
        </label>
        <select
          id="equipmentType"
          name="equipmentType"
          value={formData.equipmentType}
          onChange={handleChange}
          className={styles.select}
        >
          <option value="DECIBELIMETRO">Decibelímetro</option>
          <option value="RUIDO">Equipamento de Ruído</option>
          <option value="CALIBRADOR">Calibrador</option>
          <option value="OUTROS">Outros</option>
        </select>
      </div>

      <div className={styles.dateRow}>
        <div className={styles.inputGroup}>
          <label htmlFor="calibrationDate" className={styles.label}>
            Data de Calibração *
          </label>
          <input
            type="date"
            id="calibrationDate"
            name="calibrationDate"
            value={formData.calibrationDate}
            onChange={handleChange}
            className={`${styles.input} ${errors.calibrationDate ? styles.inputError : ''}`}
          />
          {errors.calibrationDate && <span className={styles.errorText}>{errors.calibrationDate}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="expirationDate" className={styles.label}>
            Data de Vencimento *
          </label>
          <input
            type="date"
            id="expirationDate"
            name="expirationDate"
            value={formData.expirationDate}
            onChange={handleChange}
            className={`${styles.input} ${errors.expirationDate ? styles.inputError : ''}`}
          />
          {errors.expirationDate && <span className={styles.errorText}>{errors.expirationDate}</span>}
        </div>
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>Equipamento ativo</span>
        </label>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Salvando...' : equipment ? 'Atualizar' : 'Criar Equipamento'}
        </button>
      </div>
    </form>
  );
}