'use client';

import React, { useState, useRef, useCallback } from 'react';
import styles from './BatchVehicleProcessor.module.css';

interface ParsedVehicleData {
  placa: string;
  numeroChassi: string;
  especieTipo: string;
  marcaModelo: string;
  anoFabricacaoModelo: string;
}

type RowStatus = 'pending' | 'processing' | 'ok' | 'error' | 'saving' | 'saved' | 'duplicate';

interface BatchRow {
  id: string;               // uuid for React key
  fileName: string;
  data: ParsedVehicleData;
  status: RowStatus;
  errorMsg: string;
  selected: boolean;
}

interface Props {
  clientId: string;
}

let rowIdCounter = 0;
function nextId() {
  return `batch-${Date.now()}-${rowIdCounter++}`;
}

const emptyVehicle: ParsedVehicleData = {
  placa: '',
  numeroChassi: '',
  especieTipo: '',
  marcaModelo: '',
  anoFabricacaoModelo: '',
};

export default function BatchVehicleProcessor({ clientId }: Props) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [saveResult, setSaveResult] = useState<{ saved: number; duplicates: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── OCR one file via /api/process-document ───
  const ocrFile = async (file: File): Promise<{ data: ParsedVehicleData; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (result.resposta) {
        const jsonMatch =
          result.resposta.match(/```json\s*([\s\S]*?)\s*```/) ||
          result.resposta.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const extractedData = JSON.parse(jsonStr);
          const firstKey = Object.keys(extractedData)[0];
          const v = extractedData[firstKey];

          return {
            data: {
              placa: v.placa || firstKey || '',
              numeroChassi: v.nro_chassi || '',
              especieTipo: v.especie_tipo || '',
              marcaModelo: v.marca_modelo || '',
              anoFabricacaoModelo:
                v.ano_fabricacao && v.ano_modelo
                  ? `${v.ano_fabricacao}/${v.ano_modelo}`
                  : '',
            },
          };
        }
      }

      return { data: emptyVehicle, error: 'Nenhum JSON encontrado na resposta' };
    } catch (err) {
      return { data: emptyVehicle, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  };

  // ─── Process multiple files sequentially ───
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalFiles(files.length);
    setSaveResult(null);

    // Create initial rows as pending
    const initialRows: BatchRow[] = files.map(f => ({
      id: nextId(),
      fileName: f.name,
      data: { ...emptyVehicle },
      status: 'pending' as RowStatus,
      errorMsg: '',
      selected: true,
    }));

    setRows(prev => [...prev, ...initialRows]);

    // Process each sequentially
    for (let i = 0; i < files.length; i++) {
      const rowId = initialRows[i].id;

      // Mark as processing
      setRows(prev =>
        prev.map(r => (r.id === rowId ? { ...r, status: 'processing' as RowStatus } : r))
      );

      const { data, error } = await ocrFile(files[i]);

      // Update row with result
      setRows(prev =>
        prev.map(r =>
          r.id === rowId
            ? {
                ...r,
                data,
                status: error ? ('error' as RowStatus) : ('ok' as RowStatus),
                errorMsg: error || '',
                selected: !error,
              }
            : r
        )
      );

      setProcessedCount(i + 1);

      // Small delay between requests to avoid rate-limit
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setIsProcessing(false);
  };

  // ─── File input handler ───
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) processFiles(files);
    event.target.value = '';
  };

  // ─── Drag & Drop ───
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (isProcessing || isSaving) return;

      const files = Array.from(e.dataTransfer.files).filter(f =>
        /\.(pdf|png|jpe?g)$/i.test(f.name)
      );
      if (files.length > 0) processFiles(files);
    },
    [isProcessing, isSaving]
  );

  // ─── Edit cell ───
  const updateCell = (rowId: string, field: keyof ParsedVehicleData, value: string) => {
    setRows(prev =>
      prev.map(r =>
        r.id === rowId ? { ...r, data: { ...r.data, [field]: value } } : r
      )
    );
  };

  // ─── Toggle selection ───
  const toggleRow = (rowId: string) => {
    setRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleAll = () => {
    const editableRows = rows.filter(r => r.status !== 'saved');
    const allSelected = editableRows.every(r => r.selected);
    setRows(prev =>
      prev.map(r => (r.status === 'saved' ? r : { ...r, selected: !allSelected }))
    );
  };

  // ─── Remove row ───
  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
  };

  // ─── Clear all ───
  const clearAll = () => {
    setRows([]);
    setSaveResult(null);
    setProcessedCount(0);
    setTotalFiles(0);
  };

  // ─── Save all selected ───
  const saveAll = async () => {
    const toSave = rows.filter(r => r.selected && r.status !== 'saved');
    if (toSave.length === 0) return;

    setIsSaving(true);
    setSaveResult(null);
    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const row of toSave) {
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, status: 'saving' as RowStatus } : r))
      );

      try {
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...row.data,
            clientId,
          }),
        });

        if (response.status === 409) {
          duplicates++;
          setRows(prev =>
            prev.map(r =>
              r.id === row.id
                ? { ...r, status: 'duplicate' as RowStatus, errorMsg: 'Placa ou chassi já cadastrado', selected: false }
                : r
            )
          );
        } else if (!response.ok) {
          errors++;
          const errData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
          setRows(prev =>
            prev.map(r =>
              r.id === row.id
                ? { ...r, status: 'error' as RowStatus, errorMsg: errData.message || 'Falha ao salvar' }
                : r
            )
          );
        } else {
          saved++;
          setRows(prev =>
            prev.map(r =>
              r.id === row.id
                ? { ...r, status: 'saved' as RowStatus, selected: false }
                : r
            )
          );
        }
      } catch {
        errors++;
        setRows(prev =>
          prev.map(r =>
            r.id === row.id
              ? { ...r, status: 'error' as RowStatus, errorMsg: 'Erro de rede' }
              : r
          )
        );
      }
    }

    setSaveResult({ saved, duplicates, errors });
    setIsSaving(false);
  };

  // ─── Derived state ───
  const selectedCount = rows.filter(r => r.selected && r.status !== 'saved').length;
  const hasRows = rows.length > 0;

  // ─── Render helpers ───
  const statusBadge = (row: BatchRow) => {
    const map: Record<RowStatus, { className: string; label: string }> = {
      pending: { className: '', label: '⏳ Aguardando' },
      processing: { className: '', label: '🔄 Extraindo...' },
      ok: { className: styles.statusOk, label: '✅ OK' },
      error: { className: styles.statusError, label: `❌ ${row.errorMsg || 'Erro'}` },
      saving: { className: '', label: '💾 Salvando...' },
      saved: { className: styles.statusSaved, label: '✅ Salvo' },
      duplicate: { className: styles.statusDuplicate, label: '⚠️ Duplicado' },
    };
    const s = map[row.status];
    return <span className={`${styles.statusBadge} ${s.className}`}>{s.label}</span>;
  };

  const rowClassName = (row: BatchRow) => {
    if (row.status === 'saved') return styles.rowSaved;
    if (row.status === 'duplicate') return styles.rowDuplicate;
    if (row.status === 'error') return styles.rowError;
    return '';
  };

  return (
    <div className={styles.container}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''} ${
          isProcessing || isSaving ? styles.dropZoneDisabled : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && !isSaving && fileInputRef.current?.click()}
      >
        <div className={styles.dropZoneIcon}>📄</div>
        <div className={styles.dropZoneTitle}>
          {isProcessing
            ? '⏳ Processando documentos...'
            : 'Arraste CRLVs aqui ou clique para selecionar'}
        </div>
        <div className={styles.dropZoneSubtitle}>
          PDF, PNG, JPG — selecione múltiplos arquivos de uma vez
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isProcessing || isSaving}
        />
      </div>

      {/* Progress */}
      {isProcessing && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressTitle}>⚡ Extraindo dados com IA</span>
            <span className={styles.progressCount}>
              {processedCount}/{totalFiles}
            </span>
          </div>
          <div className={styles.progressBarOuter}>
            <div
              className={styles.progressBarInner}
              style={{ width: `${(processedCount / totalFiles) * 100}%` }}
            />
          </div>
          <div className={styles.progressFileList}>
            {rows.slice(-totalFiles).map(row => (
              <div
                key={row.id}
                className={`${styles.progressFileItem} ${
                  row.status === 'ok'
                    ? styles.progressFileItem + ' ' + 'success'
                    : row.status === 'error'
                    ? styles.progressFileItem + ' ' + 'error'
                    : row.status === 'processing'
                    ? styles.progressFileItem + ' ' + 'processing'
                    : styles.progressFileItem + ' ' + 'pending'
                }`}
                style={{
                  color:
                    row.status === 'ok'
                      ? '#a7f3d0'
                      : row.status === 'error'
                      ? '#fca5a5'
                      : row.status === 'processing'
                      ? '#93c5fd'
                      : '#777',
                }}
              >
                {row.status === 'ok'
                  ? '✅'
                  : row.status === 'error'
                  ? '❌'
                  : row.status === 'processing'
                  ? '🔄'
                  : '⏳'}{' '}
                {row.fileName}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Table */}
      {hasRows && !isProcessing && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewTitle}>
              📋 Revisão — {rows.length} veículo{rows.length !== 1 ? 's' : ''} extraído
              {rows.length !== 1 ? 's' : ''}
            </span>
            <div className={styles.reviewActions}>
              <button
                className={styles.btnSuccess}
                disabled={selectedCount === 0 || isSaving}
                onClick={saveAll}
              >
                {isSaving
                  ? '💾 Salvando...'
                  : `💾 Salvar ${selectedCount > 0 ? selectedCount : ''} Selecionado${
                      selectedCount !== 1 ? 's' : ''
                    }`}
              </button>
              <button className={styles.btnOutline} onClick={clearAll} disabled={isSaving}>
                🗑 Limpar Tudo
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.reviewTable}>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={
                        rows.filter(r => r.status !== 'saved').length > 0 &&
                        rows.filter(r => r.status !== 'saved').every(r => r.selected)
                      }
                      onChange={toggleAll}
                      disabled={isSaving}
                    />
                  </th>
                  <th>Arquivo</th>
                  <th>Placa</th>
                  <th>Chassi</th>
                  <th>Espécie/Tipo</th>
                  <th>Marca/Modelo</th>
                  <th>Ano</th>
                  <th>Status</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const disabled = row.status === 'saved' || row.status === 'saving' || isSaving;
                  return (
                    <tr key={row.id} className={rowClassName(row)}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={row.selected}
                          onChange={() => toggleRow(row.id)}
                          disabled={disabled}
                        />
                      </td>
                      <td>
                        <div className={styles.fileName} title={row.fileName}>
                          {row.fileName}
                        </div>
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={row.data.placa}
                          onChange={e => updateCell(row.id, 'placa', e.target.value)}
                          disabled={disabled}
                          placeholder="Placa"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={row.data.numeroChassi}
                          onChange={e => updateCell(row.id, 'numeroChassi', e.target.value)}
                          disabled={disabled}
                          placeholder="Chassi"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={row.data.especieTipo}
                          onChange={e => updateCell(row.id, 'especieTipo', e.target.value)}
                          disabled={disabled}
                          placeholder="Tipo"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={row.data.marcaModelo}
                          onChange={e => updateCell(row.id, 'marcaModelo', e.target.value)}
                          disabled={disabled}
                          placeholder="Marca"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.cellInput}
                          value={row.data.anoFabricacaoModelo}
                          onChange={e => updateCell(row.id, 'anoFabricacaoModelo', e.target.value)}
                          disabled={disabled}
                          placeholder="Ano"
                          style={{ width: 100 }}
                        />
                      </td>
                      <td>{statusBadge(row)}</td>
                      <td>
                        {row.status !== 'saved' && (
                          <button
                            onClick={() => removeRow(row.id)}
                            disabled={isSaving}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              fontSize: '1.1rem',
                              color: '#888',
                              padding: '0.2rem',
                            }}
                            title="Remover"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save Summary */}
          {saveResult && (
            <div className={styles.summary}>
              <div className={styles.summaryTitle}>📊 Resultado do Cadastro</div>
              <div className={styles.summaryStats}>
                <span className={`${styles.summaryStat} ${styles.statSuccess}`}>
                  ✅ {saveResult.saved} salvo{saveResult.saved !== 1 ? 's' : ''}
                </span>
                {saveResult.duplicates > 0 && (
                  <span className={`${styles.summaryStat} ${styles.statDuplicate}`}>
                    ⚠️ {saveResult.duplicates} duplicado{saveResult.duplicates !== 1 ? 's' : ''}
                  </span>
                )}
                {saveResult.errors > 0 && (
                  <span className={`${styles.summaryStat} ${styles.statError}`}>
                    ❌ {saveResult.errors} erro{saveResult.errors !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
