// Tipos para o formulário de Laudo Pino Rei

// Tipos para valores de campos de seleção
export type SimNao = 'SIM' | 'NÃO';
export type AprovaReprovado = 'APROVADO' | 'REPROVADO';
export type TipoFixacaoPino = 'SOLDA' | 'FLANGEADO' | 'APARAFUSADA';
export type TipoFixacaoMesa = 'SOLDA' | 'APARAFUSADA';

// Interface principal para os dados do Pino Rei
export interface PinoReiData {
  // Seção 1: Cabeçalho e Dados Básicos
  equipmentId: string;
  dataValidadeInspecao: string; // formato DD/MM/AAAA
  
  // Seção 2: Exame Visual do Pino Rei
  posicaoVertical: SimNao;
  presencaTrincas: SimNao;
  integridadeFixacao: SimNao;
  seloIdentificacao: SimNao;
  tipoFixacaoPino: TipoFixacaoPino;
  diametroRegistrado: number;
  estadoConservacao: SimNao;
  resultadoPinoRei: AprovaReprovado;
  
  // Seção 3: Inspeção Visual da Mesa
  tipoFixacaoMesa: TipoFixacaoMesa;
  mesaBemFixada: SimNao;
  mesaReparoSolda: SimNao;
  resultadoMesa: AprovaReprovado;
  
  // Seção 4: Ensaios Complementares
  ensaioComplementar: SimNao;
  qualEnsaio?: string;
  
  // Seção 5: Registro Fotográfico
  fotoChassiUrl?: string;
  fotoPinoReiUrl?: string;
  fotoMesaUrl?: string;
  
  // Seção 6: Resultado Final e Observações
  resultadoGeral: AprovaReprovado;
  observacoes?: string;
  normasAplicaveis: string;
  inspetorResponsavel: string;
}

// Interface completa do Laudo Pino Rei (com dados do banco)
export interface LaudoPinoReiComplete extends PinoReiData {
  id: string;
  laudoId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para criação de novo laudo
export interface CreatePinoReiData extends PinoReiData {
  // Dados básicos do laudo
  clientId: string;
  vehicleId: string;
  placaVeiculo: string;
  ordemServico: string;
  dataEmissao: string;
  codigoTemporal: string;
}

// Dados iniciais para o formulário
export const initialPinoReiData: Omit<CreatePinoReiData, 'clientId' | 'vehicleId'> = {
  // Seção 1: Cabeçalho e Dados Básicos
  placaVeiculo: '',
  ordemServico: '',
  dataEmissao: '',
  codigoTemporal: '',
  equipmentId: '',
  dataValidadeInspecao: '',
  
  // Seção 2: Exame Visual do Pino Rei
  posicaoVertical: 'SIM',
  presencaTrincas: 'NÃO',
  integridadeFixacao: 'SIM',
  seloIdentificacao: 'SIM',
  tipoFixacaoPino: 'SOLDA',
  diametroRegistrado: 0.0,
  estadoConservacao: 'SIM',
  resultadoPinoRei: 'APROVADO',
  
  // Seção 3: Inspeção Visual da Mesa
  tipoFixacaoMesa: 'SOLDA',
  mesaBemFixada: 'SIM',
  mesaReparoSolda: 'NÃO',
  resultadoMesa: 'APROVADO',
  
  // Seção 4: Ensaios Complementares
  ensaioComplementar: 'NÃO',
  qualEnsaio: '',
  
  // Seção 5: Registro Fotográfico
  fotoChassiUrl: '',
  fotoPinoReiUrl: '',
  fotoMesaUrl: '',
  
  // Seção 6: Resultado Final e Observações
  resultadoGeral: 'APROVADO',
  observacoes: '',
  normasAplicaveis: 'Portaria nº457/08, Portaria nº70/2008',
  inspetorResponsavel: '',
};

// Utilitários para validação
export const DIAMETRO_MIN_VALUE = 0.0;
export const DIAMETRO_MAX_VALUE = 999.9;

export const isValidDiametro = (value: number): boolean => {
  return value >= DIAMETRO_MIN_VALUE && value <= DIAMETRO_MAX_VALUE;
};

// Validação de formato de data DD/MM/AAAA
export const validateDateFormat = (dateString: string): boolean => {
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  const [day, month, year] = dateString.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
};

// Validação de campos obrigatórios
export const validateRequiredFields = (data: Partial<CreatePinoReiData>): string[] => {
  const errors: string[] = [];
  
  if (!data.clientId) errors.push('Cliente é obrigatório');
  if (!data.vehicleId) errors.push('Veículo é obrigatório'); 
  if (!data.placaVeiculo) errors.push('Placa do veículo é obrigatória');
  if (!data.ordemServico) errors.push('Ordem de serviço é obrigatória');
  if (!data.dataEmissao) errors.push('Data de emissão é obrigatória');
  if (!data.equipmentId) errors.push('Equipamento é obrigatório');
  if (!data.dataValidadeInspecao) errors.push('Data de validade da inspeção é obrigatória');
  if (!data.inspetorResponsavel) errors.push('Inspetor responsável é obrigatório');
  
  // Validar formato da data de validade
  if (data.dataValidadeInspecao && !validateDateFormat(data.dataValidadeInspecao)) {
    errors.push('Data de validade deve estar no formato DD/MM/AAAA');
  }
  
  // Validar diâmetro
  if (data.diametroRegistrado !== undefined && !isValidDiametro(data.diametroRegistrado)) {
    errors.push(`Diâmetro deve estar entre ${DIAMETRO_MIN_VALUE} e ${DIAMETRO_MAX_VALUE}`);
  }
  
  return errors;
};

// Função para verificar se algum campo obrigatório está vazio
export const hasRequiredFieldErrors = (data: Partial<CreatePinoReiData>): boolean => {
  return validateRequiredFields(data).length > 0;
};