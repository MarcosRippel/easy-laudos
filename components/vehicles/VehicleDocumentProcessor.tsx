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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se cliente foi selecionado
    if (!clientId) {
      setStatus('Erro: Selecione um cliente antes de processar o documento.');
      setTimeout(() => setStatus(''), 3000);
      return;
    }

    setIsProcessing(true);
    setStatus('Processando documento com IA...');

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
      console.log('  - Headers:', [...response.headers.entries()]);

      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('📥 RESPOSTA RECEBIDA DA API:');
      console.log(JSON.stringify(result, null, 2));
      
      // 🐛 DEBUG: Verificar estrutura da resposta
      console.log('🔍 DIAGNÓSTICO DETALHADO:');
      console.log('  - typeof result:', typeof result);
      console.log('  - result.data existe?:', result.data !== undefined);
      console.log('  - result.resposta existe?:', result.resposta !== undefined);
      console.log('  - Chaves do result:', Object.keys(result));
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Processar resposta do OpenAI
      let parsedData: ParsedVehicleData = {};
      
      if (result.resposta) {
        console.log('📝 Processando result.resposta...');
        
        // Extrair JSON da resposta markdown
        const jsonMatch = result.resposta.match(/```json\s*([\s\S]*?)\s*```/) || result.resposta.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            console.log('🔍 JSON extraído:', jsonStr);
            
            const extractedData = JSON.parse(jsonStr);
            console.log('✅ JSON parseado:', extractedData);
            
            // Pegar o primeiro veículo (chave dinâmica)
            const firstKey = Object.keys(extractedData)[0];
            const vehicleData = extractedData[firstKey];
            
            console.log('🚗 Dados do veículo:', vehicleData);
            
            // Converter para formato esperado pelo formulário
            parsedData = {
              placa: vehicleData.placa || firstKey,
              numeroChassi: vehicleData.nro_chassi || '',
              especieTipo: vehicleData.especie_tipo || '',
              marcaModelo: vehicleData.marca_modelo || '',
              anoFabricacaoModelo: vehicleData.ano_fabricacao && vehicleData.ano_modelo
                ? `${vehicleData.ano_fabricacao}/${vehicleData.ano_modelo}`
                : ''
            };
            
            console.log('📋 DADOS FINAIS PARA FORMULÁRIO:', parsedData);
            
          } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError);
            throw new Error('Erro ao processar resposta do OpenAI');
          }
        } else {
          console.error('❌ Nenhum JSON encontrado na resposta');
          throw new Error('Nenhum JSON válido encontrado na resposta');
        }
      } else {
        console.error('❌ result.resposta não existe');
        throw new Error('Resposta inválida da API');
      }

      console.log('📊 DADOS PROCESSADOS PARA CALLBACK:');
      console.log(JSON.stringify(parsedData, null, 2));
      console.log('🔄 CHAMANDO onDataParsed...');
      
      onDataParsed(parsedData);
      
      console.log('✅ onDataParsed EXECUTADO!');
      
      setStatus('Documento processado com sucesso! Verifique os dados no formulário.');

    } catch (error) {
      console.error('Error processing document:', error);
      setStatus(`Erro ao processar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
      // Reset input
      event.target.value = '';
      
      // Clear status message after 5 seconds
      setTimeout(() => setStatus(''), 5000);
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
          transition: 'all 0.3s ease'
        }}
      >
        {isProcessing ? 'Processando...' : 'Import from Document (PDF/Image) 🤖'}
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
          fontWeight: '500'
        }}>
          {status}
        </div>
      )}
      
      {isProcessing && (
        <div style={{
          marginTop: '1rem',
          color: '#bbb',
          fontSize: '0.85rem'
        }}>
          ⚡ Powered by OpenAI Assistant - Aguarde enquanto processamos seu documento...
        </div>
      )}
    </div>
  );
}