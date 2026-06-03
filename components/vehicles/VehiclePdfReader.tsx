// components/vehicles/VehiclePdfReader.tsx
'use client';

import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
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
}

export default function VehiclePdfReader({ onDataParsed }: Props) {
  const [ocrProgress, setOcrProgress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setOcrProgress('Processing...');

    try {
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log("--- TEXT RECOGNIZED BY TESSERACT.JS ---");
      console.log(text);
      console.log("---------------------------------------");

      const parsedData: ParsedVehicleData = {};
      let match;

      // --- FINAL, DEFINITIVE PARSING LOGIC ---

      // Chassi: Confirmed working. Looks for a 17-character alphanumeric string.
      match = text.match(/\b([A-Z0-9]{17})\b/);
      if (match) parsedData.numeroChassi = match[0];

      // Placa: Confirmed working. Looks for the plate number after "PLACA EXERCICIO".
      match = text.match(/PLACA\s+EXERCICIO\s+.*?\s+([A-Z]{3}\d[A-Z\d]{3})/i);
      if (match) parsedData.placa = match[1];

      // Espécie/Tipo: UPDATED to be more flexible and find the value even with junk text in between.
      match = text.match(/ESP[ÉE]CIE\s*\/\s*TIPO\s+(.*?TRACAO CAMINHAO TRATOR)/i);
      if (match) parsedData.especieTipo = match[1].trim();

      // Marca/Modelo: UPDATED to handle newlines and capture text between the label and the vertical bar |.
      match = text.match(/MARCA\s*\/\s*MODELO\s*\/\s*VERS[ÃA]O\s*:\s*(.*?)\s*\|/is); // 's' flag allows '.' to match newlines
      if (match) parsedData.marcaModelo = match[1].replace(/\s+/g, ' ').trim();

      // Ano/Modelo: UPDATED to more reliably find two consecutive 4-digit years after the label.
      match = text.match(/ANO FABRICA[CÇ][AÃ]O\s*.*?(\d{4})\s*(\d{4})/i);
      if (match) {
        parsedData.anoFabricacaoModelo = `${match[1]}/${match[2]}`;
      }

      onDataParsed(parsedData);
      alert('Document parsed successfully! Please verify the data in the form.');

    } catch (error) {
      console.error('Error during OCR processing:', error);
      alert('Failed to process the document with OCR.');
    } finally {
      setIsLoading(false);
      setOcrProgress('');
      event.target.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
      <label htmlFor="pdf-upload-tesseract" className={`${styles.button} ${isLoading ? styles.disabled : ''}`}>
        {isLoading ? ocrProgress : 'Importar Documento (Imagem/PNG/JPG)'}
      </label>
      <input
        type="file"
        id="pdf-upload-tesseract"
        accept=".png, .jpg, .jpeg"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isLoading}
      />
    </div>
  );
}