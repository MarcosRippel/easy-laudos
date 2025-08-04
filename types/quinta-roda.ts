// Tipos para o formulário de Laudo Quinta Roda

// Tipos para valores de campos de seleção
export type SimNao = 'SIM' | 'NÃO';
export type AprovaReprovado = 'APROVADO' | 'REPROVADO';

// Interface principal para os dados da Quinta Roda
export interface QuintaRodaData {
  // Seção 1: Cabeçalho e Dados Básicos
  equipmentId: string;
  dataValidadeInspecao: string; // formato DD/MM/AAAA
  
  // Seção 2: Dados da Quinta Roda
  fabricanteMarca: string;
  modelo: string;
  numeroIdentificacao: string;
  
  // Seção 3: 12 Itens de Exame Visual (Boolean SIM/NÃO)
  seloIdentificacao: SimNao;        // Apresenta Selo de Identificação da Conformidade?
  presencaTrincas: SimNao;          // Apresenta algum tipo de trinca, rachadura ou reparo?
  integraFixada: SimNao;            // Apresenta-se íntegra, devidamente fixada?
  pinosIntegros: SimNao;            // Os pinos de articulação estão íntegros?
  mancaisOvalados: SimNao;          // Os mancais apresentam-se ovalados? Há folga excessiva?
  mecanismoTravamento: SimNao;      // O mecanismo de travamento e segurança do engate está operando corretamente?
  pinosPressos: SimNao;             // Os pinos estão devidamente presos, fixados por grampos ou outra forma adequada?
  desgastesCanais: SimNao;          // Apresenta desgastes nos canais de lubrificação da quinta Roda?
  apoiosSapatas: SimNao;            // Os apoios ou sapatas apresentam trincas, folgas e/ou reparos?
  cantoneirasFixadas: SimNao;       // As cantoneiras e placas de montagem (mesa da 5ª roda) estão bem fixadas?
  aterramentoFixado: SimNao;        // Possui Aterramento e está devidamente fixado?
  ensaioComplementar: SimNao;       // Efetuado outro ensaio Complementar?
  
  // Seção 4: Resultado Final
  resultadoFinal: AprovaReprovado;
  
  // Seção 5: Registro Fotográfico (3 fotos conforme layout)
  fotoQuintaRoda1Url?: string;  // Primeira foto do registro fotográfico
  fotoQuintaRoda2Url?: string;  // Segunda foto do registro fotográfico
  fotoChassiUrl?: string;       // Foto do chassi
  
  // Seção 6: Observações e Normas
  observacoes?: string;
  normasAplicaveis: string;
  inspetorResponsavel: string;
}

// Interface completa do Laudo Quinta Roda (com dados do banco)
export interface LaudoQuintaRodaComplete extends QuintaRodaData {
  id: string;
  laudoId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para criação de novo laudo
export interface CreateQuintaRodaData extends QuintaRodaData {
  // Dados básicos do laudo
  clientId: string;
  vehicleId: string;
  placaVeiculo: string;
  ordemServico: string;
  dataEmissao: string;
  codigoTemporal: string;
}

// Dados iniciais para o formulário
export const initialQuintaRodaData: Omit<CreateQuintaRodaData, 'clientId' | 'vehicleId'> = {
  // Seção 1: Cabeçalho e Dados Básicos
  placaVeiculo: '',
  ordemServico: '',
  dataEmissao: '',
  codigoTemporal: '',
  equipmentId: '',
  dataValidadeInspecao: '',
  
  // Seção 2: Dados da Quinta Roda
  fabricanteMarca: '',
  modelo: '',
  numeroIdentificacao: '',
  
  // Seção 3: 12 Itens de Exame Visual (padrão SIM para aprovação)
  seloIdentificacao: 'SIM',
  presencaTrincas: 'NÃO',         // NÃO é positivo (não tem trincas)
  integraFixada: 'SIM',
  pinosIntegros: 'SIM',
  mancaisOvalados: 'NÃO',         // NÃO é positivo (não estão ovalados)
  mecanismoTravamento: 'SIM',
  pinosPressos: 'SIM',
  desgastesCanais: 'NÃO',         // NÃO é positivo (não tem desgastes)
  apoiosSapatas: 'NÃO',           // NÃO é positivo (não tem trincas/folgas)
  cantoneirasFixadas: 'SIM',
  aterramentoFixado: 'SIM',
  ensaioComplementar: 'NÃO',
  
  // Seção 4: Resultado Final
  resultadoFinal: 'APROVADO',
  
  // Seção 5: Registro Fotográfico (3 fotos com valores padrão definidos)
  fotoQuintaRoda1Url: '',
  fotoQuintaRoda2Url: '',
  fotoChassiUrl: '',
  
  // Seção 6: Observações e Normas
  observacoes: '',
  normasAplicaveis: 'Portaria nº457/08, Portaria nº70/2008, NBR 8160',
  inspetorResponsavel: '',
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
export const validateRequiredFields = (data: Partial<CreateQuintaRodaData>): string[] => {
  const errors: string[] = [];
  
  if (!data.clientId) errors.push('Cliente é obrigatório');
  if (!data.vehicleId) errors.push('Veículo é obrigatório'); 
  if (!data.placaVeiculo) errors.push('Placa do veículo é obrigatória');
  if (!data.ordemServico) errors.push('Ordem de serviço é obrigatória');
  if (!data.dataEmissao) errors.push('Data de emissão é obrigatória');
  if (!data.equipmentId) errors.push('Equipamento é obrigatório');
  if (!data.dataValidadeInspecao) errors.push('Data de validade da inspeção é obrigatória');
  if (!data.inspetorResponsavel) errors.push('Inspetor responsável é obrigatório');
  
  // Validar dados da quinta roda
  if (!data.fabricanteMarca) errors.push('Fabricante/Marca é obrigatório');
  if (!data.modelo) errors.push('Modelo é obrigatório');
  if (!data.numeroIdentificacao) errors.push('Número de identificação é obrigatório');
  
  // Validar formato da data de validade
  if (data.dataValidadeInspecao && !validateDateFormat(data.dataValidadeInspecao)) {
    errors.push('Data de validade deve estar no formato DD/MM/AAAA');
  }
  
  return errors;
};

// Função para verificar se algum campo obrigatório está vazio
export const hasRequiredFieldErrors = (data: Partial<CreateQuintaRodaData>): boolean => {
  return validateRequiredFields(data).length > 0;
};

// Função para calcular resultado final baseado nos itens de exame
export const calculateResultadoFinal = (data: QuintaRodaData): AprovaReprovado => {
  // Itens que devem ser SIM para aprovação
  const itemsSimPositivos = [
    data.seloIdentificacao,
    data.integraFixada,
    data.pinosIntegros,
    data.mecanismoTravamento,
    data.pinosPressos,
    data.cantoneirasFixadas,
    data.aterramentoFixado
  ];
  
  // Itens que devem ser NÃO para aprovação (problemas)
  const itemsNaoPositivos = [
    data.presencaTrincas,
    data.mancaisOvalados,
    data.desgastesCanais,
    data.apoiosSapatas
  ];
  
  // Verifica se todos os itens SIM são positivos
  const simOk = itemsSimPositivos.every(item => item === 'SIM');
  
  // Verifica se todos os itens NÃO são positivos (sem problemas)
  const naoOk = itemsNaoPositivos.every(item => item === 'NÃO');
  
  return (simOk && naoOk) ? 'APROVADO' : 'REPROVADO';
};

// Descrições dos itens de exame para exibição no formulário
export const descricoesCampos = {
  seloIdentificacao: 'Apresenta Selo de Identificação da Conformidade?',
  presencaTrincas: 'Apresenta algum tipo de trinca, rachadura ou reparo?',
  integraFixada: 'Apresenta-se íntegra, devidamente fixada?',
  pinosIntegros: 'Os pinos de articulação estão íntegros?',
  mancaisOvalados: 'Os mancais apresentam-se ovalados? Há folga excessiva?',
  mecanismoTravamento: 'O mecanismo de travamento e segurança do engate está operando corretamente?',
  pinosPressos: 'Os pinos estão devidamente presos, fixados por grampos ou outra forma adequada?',
  desgastesCanais: 'Apresenta desgastes nos canais de lubrificação da quinta Roda?',
  apoiosSapatas: 'Os apoios ou sapatas apresentam trincas, folgas e/ou reparos?',
  cantoneirasFixadas: 'As cantoneiras e placas de montagem (mesa da 5ª roda) estão bem fixadas?',
  aterramentoFixado: 'Possui Aterramento e está devidamente fixado?',
  ensaioComplementar: 'Efetuado outro ensaio Complementar?'
} as const;

// Lista dos campos de exame visual na ordem correta
export const camposExameVisual = [
  'seloIdentificacao',
  'presencaTrincas', 
  'integraFixada',
  'pinosIntegros',
  'mancaisOvalados',
  'mecanismoTravamento',
  'pinosPressos',
  'desgastesCanais',
  'apoiosSapatas',
  'cantoneirasFixadas',
  'aterramentoFixado',
  'ensaioComplementar'
] as const;

export type CampoExameVisual = typeof camposExameVisual[number];