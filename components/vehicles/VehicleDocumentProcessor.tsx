'use client';

import React, { useState } from 'react';
import styles from './VehicleForm.module.css';

interface ParsedVehicleData {
  placa?: string;
  numeroChassi?: string;
  especieTipo?: string;
  marcaModelo?: string;
  anoFabricacaoModelo?: string;
}

interface Props {
  onDataParsed: (data: ParsedVehicleData) => void;
  clientId?: string;
}

export default function VehicleDocumentProcessor({ onDataParsed, clientId }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!clientId) {
      setStatus('Erro: Selecione um cliente antes de processar o documento.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    // Criar preview URL antes de processar
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);

    setIsProcessing(true);
    setStatus('Extraindo dados com IA...');

    try {
      console.log('🚀 INICIANDO PROCESSAMENTO...');
      console.log('📁 Arquivo:', file.name, file.type, file.size);
      console.log('👤 Cliente ID:', clientId);

      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 ENVIANDO REQUISIÇÃO para /api/process-document...');

      const response = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      });

      console.log('📨 RESPOSTA RECEBIDA:');
      console.log('  - Status:', response.status);
      console.log('  - OK:', response.ok);

      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.status}`);
      }

      const result = await response.json();

      console.log('📥 RESPOSTA RECEBIDA DA API:');
      console.log(JSON.stringify(result, null, 2));

      if (result.error) {
        throw new Error(result.error);
      }

      // Processar resposta do Gemini
      let parsedData: ParsedVehicleData = {};

      if (result.resposta) {
        console.log('📝 Processando result.resposta...');

        const jsonMatch = result.resposta.match(/```json\s*([\s\S]*?)\s*```/) || result.resposta.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const extractedData = JSON.parse(jsonStr);
            const firstKey = Object.keys(extractedData)[0];
            const vehicleData = extractedData[firstKey];

            parsedData = {
              placa: vehicleData.placa || firstKey,
              numeroChassi: vehicleData.nro_chassi || '',
              especieTipo: vehicleData.especie_tipo || '',
              marcaModelo: vehicleData.marca_modelo || '',
              anoFabricacaoModelo: vehicleData.ano_fabricacao && vehicleData.ano_modelo
                ? `${vehicleData.ano_fabricacao}/${vehicleData.ano_modelo}`
                : '',
            };

            console.log('📋 DADOS FINAIS PARA FORMULÁRIO:', parsedData);
          } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError);
            throw new Error('Erro ao processar resposta da IA');
          }
        } else {
          throw new Error('Nenhum JSON válido encontrado na resposta');
        }
      } else {
        throw new Error('Resposta inválida da API');
      }

      onDataParsed(parsedData);
      setStatus('✅ Dados extraídos! Confira o documento abaixo e corrija se necessário.');

    } catch (error) {
      console.error('Error processing document:', error);
      setStatus(`Erro ao processar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <label
        htmlFor="document-upload"
        className={`${styles.button} ${isProcessing ? styles.disabled : ''}`}
        style={{
          background: isProcessing
            ? '#6c757d'
            : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          boxShadow: isProcessing
            ? 'none'
            : '0 4px 8px rgba(0, 123, 255, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {isProcessing ? '⏳ Extraindo com IA...' : 'Importar Documento (PDF/Imagem) 🤖'}
      </label>
      <input
        type="file"
        id="document-upload"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '6px',
          backgroundColor: status.includes('Erro') ? '#dc3545' : '#28a745',
          color: 'white',
          fontSize: '0.9rem',
          fontWeight: '500',
        }}>
          {status}
        </div>
      )}

      {isProcessing && (
        <div style={{
          marginTop: '1rem',
          color: '#bbb',
          fontSize: '0.85rem',
        }}>
          ⚡ Extraindo dados com IA — isso pode levar alguns segundos...
        </div>
      )}

      {/* Preview do documento após extração */}
      {previewUrl && !isProcessing && (
        <div style={{
          marginTop: '1.5rem',
          border: '2px solid #444',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#1a1a2e',
        }}>
          <div style={{
            padding: '0.6rem 1rem',
            background: '#0f3460',
            color: '#e2e2e2',
            fontSize: '0.85rem',
            fontWeight: '600',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            📄 Documento processado — confira se os dados foram extraídos corretamente
          </div>
          <iframe
            src={previewUrl}
            style={{
              width: '100%',
              height: '500px',
              border: 'none',
              display: 'block',
            }}
            title="Preview do documento"
          />
        </div>
      )}
    </div>
  );
}