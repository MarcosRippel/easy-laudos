export interface RuidoData {
  equipmentId: string;
  aceleracao1: number;
  aceleracao2: number;
  aceleracao3: number;
  aceleracao4: number;
  aceleracao5: number;
  aceleracao6: number;
  marchaLenta1: number;
  marchaLenta2: number;
  marchaLenta3: number;
  marchaLenta4: number;
  marchaLenta5: number;
  marchaLenta6: number;
  ruidoMaximoMedido?: number;
  resultado: 'APROVADO' | 'REPROVADO';
  inspetorResponsavel: string;
}

export interface RuidoCalculations {
  medianaAceleracao: number;
  maxAceleracao: number;
  medianaMarchaLenta: number;
  maxMarchaLenta: number;
}

export interface LaudoRuidoComplete extends RuidoData, RuidoCalculations {
  id: string;
  laudoId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRuidoData extends RuidoData {
  // Dados básicos do laudo
  clientId: string;
  vehicleId: string;
  ordemServico: string;
  dataEmissao: string;
  codTemporal: string;
  dataVencimento?: string;
  observacoes?: string;
}

// Utilitários para validação
export const RUIDO_MIN_VALUE = 0;
export const RUIDO_MAX_VALUE = 120;

export const isValidRuidoValue = (value: number): boolean => {
  return value >= RUIDO_MIN_VALUE && value <= RUIDO_MAX_VALUE;
};

export const validateAllRuidoValues = (data: Omit<RuidoData, 'equipmentId' | 'resultado' | 'inspetorResponsavel'>): boolean => {
  const values = [
    data.aceleracao1, data.aceleracao2, data.aceleracao3, data.aceleracao4, data.aceleracao5, data.aceleracao6,
    data.marchaLenta1, data.marchaLenta2, data.marchaLenta3, data.marchaLenta4, data.marchaLenta5, data.marchaLenta6
  ];
  
  return values.every(isValidRuidoValue);
};