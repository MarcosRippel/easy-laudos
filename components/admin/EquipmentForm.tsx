'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Equipment, CreateEquipmentData } from '@/types/equipment';
import styles from './EquipmentForm.module.css';

interface EquipmentFormProps {
  equipment?: Equipment | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type ExtractStatus = 'idle' | 'analyzing' | 'success' | 'partial' | 'error';

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

  // Upload / extração IA
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractStatus, setExtractStatus] = useState<ExtractStatus>('idle');
  const [extractMessage, setExtractMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (equipment) {
      const formatDate = (d: string | Date | null | undefined): string => {
        if (!d) return '';
        try {
          const date = typeof d === 'string' ? new Date(d) : d;
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      setFormData({
        name: equipment.name,
        model: equipment.model,
        certificateNumber: equipment.certificateNumber,
        calibrationDate: formatDate(equipment.calibrationDate),
        expirationDate: formatDate(equipment.expirationDate),
        equipmentType: equipment.equipmentType,
        isActive: equipment.isActive,
      });
    }
  }, [equipment]);

  const extractCertificate = useCallback(async (file: File) => {
    setUploadedFile(file);
    setExtractStatus('analyzing');
    setExtractMessage('🤖 Analisando certificado com IA...');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/equipments/extract-certificate', {
        method: 'POST',
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        setExtractStatus('error');
        setExtractMessage(json.error || 'Erro ao analisar o certificado. Preencha manualmente.');
        return;
      }

      const data = json.data;
      let filledFields = 0;
      const total = 6;

      setFormData(prev => {
        const next = { ...prev };
        if (data.name) { next.name = data.name; filledFields++; }
        if (data.model) { next.model = data.model; filledFields++; }
        if (data.certificateNumber) { next.certificateNumber = data.certificateNumber; filledFields++; }
        if (data.equipmentType) { next.equipmentType = data.equipmentType; filledFields++; }
        if (data.calibrationDate) { next.calibrationDate = data.calibrationDate; filledFields++; }
        if (data.expirationDate) { next.expirationDate = data.expirationDate; filledFields++; }
        return next;
      });

      // Contar campos preenchidos após update (usando os valores extraídos direto)
      const filled = [data.name, data.model, data.certificateNumber, data.equipmentType, data.calibrationDate, data.expirationDate].filter(Boolean).length;

      if (filled === total) {
        setExtractStatus('success');
        setExtractMessage('✅ Todos os dados foram extraídos com sucesso! Revise e salve.');
      } else if (filled > 0) {
        setExtractStatus('partial');
        setExtractMessage(`⚠️ ${filled} de ${total} campos extraídos. Complete os campos em branco antes de salvar.`);
      } else {
        setExtractStatus('error');
        setExtractMessage('❌ Não foi possível extrair dados. Verifique o arquivo e preencha manualmente.');
      }
    } catch (err) {
      console.error(err);
      setExtractStatus('error');
      setExtractMessage('❌ Erro de conexão ao analisar o certificado. Preencha manualmente.');
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowed = allowed.includes(file.type) || ['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

    if (!isAllowed) {
      setExtractStatus('error');
      setExtractMessage('❌ Formato não suportado. Use PDF, JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setExtractStatus('error');
      setExtractMessage('❌ Arquivo muito grande. Máximo 10MB.');
      return;
    }

    extractCertificate(file);
  }, [extractCertificate]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractStatus('idle');
    setExtractMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.model.trim()) newErrors.model = 'Modelo é obrigatório';
    if (!formData.certificateNumber.trim()) newErrors.certificateNumber = 'Número do certificado é obrigatório';
    if (!formData.calibrationDate) newErrors.calibrationDate = 'Data de calibração é obrigatória';
    if (!formData.expirationDate) newErrors.expirationDate = 'Data de vencimento é obrigatória';

    if (formData.calibrationDate && formData.expirationDate) {
      if (new Date(formData.expirationDate) <= new Date(formData.calibrationDate)) {
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
        headers: { 'Content-Type': 'application/json' },
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
      setTimeout(() => onSuccess(), 1000);
    } catch (error) {
      console.error('Error saving equipment:', error);
      showMessage(error instanceof Error ? error.message : 'Erro ao salvar equipamento', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>

      {/* ─── Zona de upload de certificado ─── */}
      {!equipment && (
        <div className={styles.uploadSection}>
          <p className={styles.uploadSectionLabel}>📄 Upload do Certificado <span className={styles.uploadOptional}>(opcional — preenche automaticamente)</span></p>

          {extractStatus === 'analyzing' ? (
            <div className={styles.uploadZoneAnalyzing}>
              <div className={styles.spinner} />
              <span>Analisando certificado com IA...</span>
            </div>
          ) : uploadedFile ? (
            <div className={styles.uploadPreview}>
              <span className={styles.uploadPreviewIcon}>📄</span>
              <span className={styles.uploadPreviewName}>{uploadedFile.name}</span>
              <button type="button" className={styles.removeFileBtn} onClick={handleRemoveFile} title="Remover arquivo">✕</button>
            </div>
          ) : (
            <div
              className={`${styles.uploadZone} ${isDragOver ? styles.uploadZoneDragover : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            >
              <div className={styles.uploadZoneContent}>
                <span className={styles.uploadIcon}>📋</span>
                <p className={styles.uploadTitle}>Arraste o certificado aqui</p>
                <p className={styles.uploadSubtitle}>ou clique para selecionar</p>
                <span className={styles.uploadFormats}>PDF, JPG, PNG — máx. 10MB</span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className={styles.hiddenInput}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {extractMessage && (
            <div className={`${styles.extractBadge} ${styles[`extract_${extractStatus}`]}`}>
              {extractMessage}
            </div>
          )}

          {(extractStatus === 'success' || extractStatus === 'partial') && (
            <p className={styles.reviewHint}>⬇️ Verifique os campos abaixo antes de salvar</p>
          )}
        </div>
      )}

      {/* ─── Campos do formulário ─── */}
      <div className={styles.inputGroup}>
        <label htmlFor="name" className={styles.label}>Nome do Equipamento *</label>
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
        <label htmlFor="model" className={styles.label}>Modelo *</label>
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
        <label htmlFor="certificateNumber" className={styles.label}>Número do Certificado *</label>
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
        <label htmlFor="equipmentType" className={styles.label}>Tipo de Equipamento *</label>
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
          <option value="PAQUIMETRO">Paquímetro</option>
          <option value="OUTROS">Outros</option>
        </select>
      </div>

      <div className={styles.dateRow}>
        <div className={styles.inputGroup}>
          <label htmlFor="calibrationDate" className={styles.label}>Data de Calibração *</label>
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
          <label htmlFor="expirationDate" className={styles.label}>Data de Vencimento *</label>
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
        <button type="button" onClick={onCancel} className={styles.cancelButton} disabled={isSubmitting}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting || extractStatus === 'analyzing'} className={styles.submitButton}>
          {isSubmitting ? 'Salvando...' : equipment ? 'Atualizar' : 'Criar Equipamento'}
        </button>
      </div>
    </form>
  );
}