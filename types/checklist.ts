export type CheckStatus = 'OK' | 'NA' | 'NOK' | '';

export interface ExpandedChecklistData {
  // ============= DADOS BÁSICOS =============
  clientId: string;
  vehicleId: string;
  ordemServico: string;
  dataEmissao: string;
  codTemporal: string;
  validade: string;
  
  // ============= SEÇÕES EXISTENTES (mantidas) =============
  
  // Cabina
  cabina_estadoGeral: CheckStatus;
  cabina_estadoDegraus: CheckStatus;
  cabina_portas: CheckStatus;
  cabina_integridadeFuncionamento: CheckStatus;
  cabina_bancosEstadoGeral: CheckStatus;
  cabina_bancosFixacao: CheckStatus;
  
  // Equipamentos de Segurança
  seguranca_cintoSeguranca: CheckStatus;
  seguranca_extintorCabine: CheckStatus;
  seguranca_extintorTanque: CheckStatus;
  seguranca_triangulo: CheckStatus;
  seguranca_espelhosRetrovisores: CheckStatus;
  
  // Pedais (expandido)
  pedais_embragemFreio: CheckStatus;
  pedais_superficiePisomante: CheckStatus;
  pedais_trincas: CheckStatus; // ✨ NOVO
  
  // Para-Brisa
  paraBrisa_integridadeVisibilidade: CheckStatus;
  paraBrisa_trincas: CheckStatus;
  
  // Para-Sol
  paraSol_integridadeFixacao: CheckStatus;
  
  // Reservatório Combustível
  reservatorio_integridadeFixacao: CheckStatus;
  reservatorio_vazamento: CheckStatus;
  reservatorio_material: CheckStatus;
  reservatorio_suplementar: CheckStatus;
  
  // Motor/Caixa Mudanças
  motor_ancoragem: CheckStatus;
  motor_protecao: CheckStatus;
  motor_sistemaOperacao: CheckStatus;
  motor_funcionamentoFolgas: CheckStatus;
  motor_oleoHidraulico: CheckStatus;
  motor_alinhamentoDirecao: CheckStatus;
  motor_transmissao: CheckStatus;
  motor_eixoCarda: CheckStatus;
  motor_cruzetasMancais: CheckStatus;
  motor_sistemaEscapamento: CheckStatus;
  motor_integridade: CheckStatus;
  motor_contraSeguranca: CheckStatus;
  motor_protecaoPino: CheckStatus;
  motor_limiteOperacidade: CheckStatus;
  motor_chassi: CheckStatus;
  motor_estadoArticulacao: CheckStatus;
  motor_estacionamento: CheckStatus;
  motor_rastreamento: CheckStatus;
  motor_posicaoFixacao: CheckStatus;
  
  // Eixos
  eixos_trincasSoldas: CheckStatus;
  eixos_integridadeDirecional: CheckStatus;
  eixos_mecanismoElevacao: CheckStatus;
  eixos_integridadeOperacionalidade: CheckStatus;
  
  // Suspensão
  suspensao_amortecedor: CheckStatus;
  suspensao_balancins: CheckStatus;
  suspensao_barraEstabilizadora: CheckStatus;
  suspensao_feixesMolas: CheckStatus;
  suspensao_bracoTensor: CheckStatus;
  suspensao_pneumaticaMangueiras: CheckStatus;
  
  // Rodas
  rodas_elementosFixacao: CheckStatus;
  rodas_integridadeAros: CheckStatus;
  rodas_existenciaEstado: CheckStatus;
  rodas_integridadeAneis: CheckStatus;
  rodas_estadoRolos: CheckStatus;
  
  // Pneus
  pneus_dianteiro: CheckStatus;
  pneus_sulcosProfundidade: string;
  pneus_paridadeMesmoEixo: CheckStatus;
  pneus_flancos: CheckStatus;
  pneus_bandaRodagem: CheckStatus;
  pneus_sobresalente: string;
  
  // Sistema Iluminação (expandido)
  iluminacao_farolPrincipal: CheckStatus;
  iluminacao_farolPenetrador: CheckStatus;
  iluminacao_farolNeblina: CheckStatus;
  iluminacao_lanternaPlaca: CheckStatus;
  iluminacao_lanternaLuz: CheckStatus;
  iluminacao_sinalizacao: CheckStatus;
  iluminacao_lanternaDelimitadora: CheckStatus;
  iluminacao_lanternaFreio: CheckStatus;
  iluminacao_lanternaIndicadora: CheckStatus;
  iluminacao_lanternaIndicadoraLateral: CheckStatus;
  iluminacao_lanternaAdvertencia: CheckStatus;
  iluminacao_lanternaLaterais: CheckStatus;
  iluminacao_lanternaLateralRe: CheckStatus;
  iluminacao_lanternaNeblina: CheckStatus;
  iluminacao_lanternaProjecao: CheckStatus;
  iluminacao_retrorefletores: CheckStatus;
  // ✨ NOVOS CAMPOS DE ILUMINAÇÃO
  iluminacao_delimitadoraDianteira: CheckStatus;
  iluminacao_delimitadoraTraseira: CheckStatus;
  iluminacao_direcaoDianteira: CheckStatus;
  iluminacao_direcaoTraseira: CheckStatus;
  iluminacao_intermitenteDirecao: CheckStatus;
  iluminacao_intermitenteAdvertencia: CheckStatus;
  iluminacao_marchaRe: CheckStatus;
  iluminacao_identificacao: CheckStatus;
  iluminacao_emergencia: CheckStatus;
  
  // Bateria Elétrica
  bateria_integridadeFixacao: CheckStatus;
  bateria_alteracaoProtecao: CheckStatus;
  
  // Cronotacógrafo
  cronografo_laces: CheckStatus;
  cronografo_funcionamento: CheckStatus;
  
  // Buzina Elétrica
  buzina_existenciaFuncionamento: CheckStatus;
  
  // Instalação Elétrica
  eletrica_estadoCabosEletrica: CheckStatus;
  eletrica_isolamento: CheckStatus;
  
  // Limpador Para-Brisa (expandido)
  limpador_operacionalidade: CheckStatus;
  limpador_integridadeOperacionalidade: CheckStatus; // ✨ NOVO
  
  // ============= SEÇÕES COMPLETAMENTE NOVAS =============
  
  // 🆕 SEÇÃO: Sistema de Comunicação e Elétricos
  comunicacao_retrorefletores: CheckStatus;
  eletricos_bateriaIntegridade: CheckStatus;
  eletricos_fiacaoIntegridade: CheckStatus;
  eletricos_fiacaoFixacao: CheckStatus;
  eletricos_largura: string;
  eletricos_funcionamento: CheckStatus;
  eletricos_ligacaoEletrica: CheckStatus;
  eletricos_estadoFiacao: CheckStatus;
  
  // 🆕 SEÇÃO: Sistema de Alarme de Ré
  alarmeRe_funcionamento: CheckStatus;
  alarmeRe_estadoFiacao: CheckStatus;
  
  // 🆕 SEÇÃO: Para-Choque Traseiro
  paraChoque_listas: CheckStatus;
  paraChoque_furos: CheckStatus;
  paraChoque_integridade: CheckStatus;
  paraChoque_visibilidadePlaca: CheckStatus;
  
  // 🆕 SEÇÃO: Para-Lama
  paraLama_integridade: CheckStatus;
  
  // 🆕 SEÇÃO: Dispositivos Refletivos de Segurança
  refletivos_existencia: CheckStatus;
  refletivos_integridade: CheckStatus;
  refletivos_conservacao: CheckStatus;
  
  // 🆕 SEÇÃO: Veículo Chassi Porta-Contêiner
  chassiContainer_atendimentoRes725: CheckStatus;
  chassiContainer_dispositivosFixacao: CheckStatus;
  
  // 🆕 SEÇÃO: Dolly
  dolly_estadoCambio: CheckStatus;
  
  // 🆕 SEÇÃO: Pinos de Ação do Semi-Reboque
  pinosSemi_integridade: CheckStatus;
  pinosSemi_operacionalidade: CheckStatus;
  pinosSemi_vazamentos: CheckStatus;
  pinosSemi_fixacao: CheckStatus;
  
  // 🆕 SEÇÃO: Quinta-Roda
  quintaRoda_integridade: CheckStatus;
  quintaRoda_fixacao: CheckStatus;
  quintaRoda_estadoApoios: CheckStatus;
  quintaRoda_funcionamentoEngate: CheckStatus;
  
  // 🆕 SEÇÃO: Pino-Rei
  pinoRei_fixacaoVertical: CheckStatus;
  pinoRei_diametroMm: string;
  pinoRei_trincas: CheckStatus;
  pinoRei_deformado: CheckStatus;
  pinoRei_recuperadoSolda: CheckStatus;
  
  // 🆕 SEÇÃO: Conjunto de Engate
  engate_estadoRotula: CheckStatus;
  engate_travaSeguranca: CheckStatus;
  engate_integridadePinos: CheckStatus;
  engate_travaPinos: CheckStatus;
  
  // 🆕 SEÇÃO: Sistema de Freio (expandido)
  freio_estacionamento: CheckStatus;
  freio_servico: CheckStatus;
  freio_estadoCompressor: CheckStatus;
  freio_correiasCompressor: CheckStatus;
  freio_fixacaoConexoes: CheckStatus;
  freio_vazamentos: CheckStatus;
  freio_lonasFreio: CheckStatus;
  freio_condicaoLonas: CheckStatus;
  freio_fixacaoLona: CheckStatus;
  freio_espessuraLonas: CheckStatus;
  freio_indicadorPressao: CheckStatus;
  
  // 🆕 CAMPOS DO COMPRESSOR (adicionados na seção Sistema de Freio)
  compressor_tempoRecuperacao: string;
  compressor_pressaoInicial: string;
  compressor_pressaoFinal: string;
  compressor_perdaAr: string;
  
  // 🆕 SEÇÃO: Reservatório de Ar (TOTALMENTE NOVA)
  reservatorioAr_integridade: CheckStatus;
  reservatorioAr_fixacao: CheckStatus;
  reservatorioAr_vazamentos: CheckStatus;
  reservatorioAr_valvulas: CheckStatus;
  reservatorioAr_pressaoOperacional: string;
  reservatorioAr_dreno: CheckStatus;
  
  // ============= MEDIÇÃO DOS PNEUS - ESQUEMA SIMPLES CORRETO =============

  // Campos superiores
  medicao_tipoPneu: string; // "(T) Traseiro | (L) Lado"
  medicao_modelo: string; // "275/80 R 22.5"
  medicao_tipo: string; // "LISO" | "MISTO" | "BORRACHUDO"

  // Grid principal - 5 linhas x 2 colunas de medição SIMPLES
  medicao_linha1_esquerdo: string; // eixo 1 dianteiro esquerdo
  medicao_linha1_direito: string;  // eixo 1 dianteiro direito

  medicao_linha2_esquerdo: string; // eixo 2 dianteiro esquerdo
  medicao_linha2_direito: string;  // eixo 2 dianteiro direito

  medicao_linha3_esquerdo1: string; // eixo 1 traseiro esquerdo (par 1)
  medicao_linha3_esquerdo2: string; // eixo 1 traseiro esquerdo (par 2)
  medicao_linha3_direito1: string;  // eixo 1 traseiro direito (par 1)
  medicao_linha3_direito2: string;  // eixo 1 traseiro direito (par 2)

  medicao_linha4_esquerdo1: string; // eixo 2 traseiro esquerdo (par 1)
  medicao_linha4_esquerdo2: string; // eixo 2 traseiro esquerdo (par 2)
  medicao_linha4_direito1: string;  // eixo 2 traseiro direito (par 1)
  medicao_linha4_direito2: string;  // eixo 2 traseiro direito (par 2)

  medicao_linha5_esquerdo1: string; // eixo 3 traseiro esquerdo (par 1)
  medicao_linha5_esquerdo2: string; // eixo 3 traseiro esquerdo (par 2)
  medicao_linha5_direito1: string;  // eixo 3 traseiro direito (par 1)
  medicao_linha5_direito2: string;  // eixo 3 traseiro direito (par 2)

  // Campos inferiores
  medicao_estadoGeral: string; // "Bom" | "Regular" | "Ruim"
  medicao_observacoes: string; // Texto livre
  
  // ============= OBSERVAÇÕES =============
  observacoes: string;
}

// Função helper para criar dados iniciais expandidos
export const getExpandedInitialData = (ordemServico = '', codTemporal = ''): ExpandedChecklistData => ({
  // Dados básicos
  clientId: '',
  vehicleId: '',
  ordemServico: ordemServico || '',
  dataEmissao: '',
  codTemporal: codTemporal || '',
  validade: '',
  
  // Seções existentes (mantidas)
  cabina_estadoGeral: '',
  cabina_estadoDegraus: '',
  cabina_portas: '',
  cabina_integridadeFuncionamento: '',
  cabina_bancosEstadoGeral: '',
  cabina_bancosFixacao: '',
  
  seguranca_cintoSeguranca: '',
  seguranca_extintorCabine: '',
  seguranca_extintorTanque: '',
  seguranca_triangulo: '',
  seguranca_espelhosRetrovisores: '',
  
  pedais_embragemFreio: '',
  pedais_superficiePisomante: '',
  pedais_trincas: '', // ✨ NOVO
  
  paraBrisa_integridadeVisibilidade: '',
  paraBrisa_trincas: '',
  
  paraSol_integridadeFixacao: '',
  
  reservatorio_integridadeFixacao: '',
  reservatorio_vazamento: '',
  reservatorio_material: '',
  reservatorio_suplementar: '',
  
  motor_ancoragem: '',
  motor_protecao: '',
  motor_sistemaOperacao: '',
  motor_funcionamentoFolgas: '',
  motor_oleoHidraulico: '',
  motor_alinhamentoDirecao: '',
  motor_transmissao: '',
  motor_eixoCarda: '',
  motor_cruzetasMancais: '',
  motor_sistemaEscapamento: '',
  motor_integridade: '',
  motor_contraSeguranca: '',
  motor_protecaoPino: '',
  motor_limiteOperacidade: '',
  motor_chassi: '',
  motor_estadoArticulacao: '',
  motor_estacionamento: '',
  motor_rastreamento: '',
  motor_posicaoFixacao: '',
  
  eixos_trincasSoldas: '',
  eixos_integridadeDirecional: '',
  eixos_mecanismoElevacao: '',
  eixos_integridadeOperacionalidade: '',
  
  suspensao_amortecedor: '',
  suspensao_balancins: '',
  suspensao_barraEstabilizadora: '',
  suspensao_feixesMolas: '',
  suspensao_bracoTensor: '',
  suspensao_pneumaticaMangueiras: '',
  
  rodas_elementosFixacao: '',
  rodas_integridadeAros: '',
  rodas_existenciaEstado: '',
  rodas_integridadeAneis: '',
  rodas_estadoRolos: '',
  
  pneus_dianteiro: '',
  pneus_sulcosProfundidade: '',
  pneus_paridadeMesmoEixo: '',
  pneus_flancos: '',
  pneus_bandaRodagem: '',
  pneus_sobresalente: '',
  
  iluminacao_farolPrincipal: '',
  iluminacao_farolPenetrador: '',
  iluminacao_farolNeblina: '',
  iluminacao_lanternaPlaca: '',
  iluminacao_lanternaLuz: '',
  iluminacao_sinalizacao: '',
  iluminacao_lanternaDelimitadora: '',
  iluminacao_lanternaFreio: '',
  iluminacao_lanternaIndicadora: '',
  iluminacao_lanternaIndicadoraLateral: '',
  iluminacao_lanternaAdvertencia: '',
  iluminacao_lanternaLaterais: '',
  iluminacao_lanternaLateralRe: '',
  iluminacao_lanternaNeblina: '',
  iluminacao_lanternaProjecao: '',
  iluminacao_retrorefletores: '',
  // ✨ NOVOS CAMPOS DE ILUMINAÇÃO
  iluminacao_delimitadoraDianteira: '',
  iluminacao_delimitadoraTraseira: '',
  iluminacao_direcaoDianteira: '',
  iluminacao_direcaoTraseira: '',
  iluminacao_intermitenteDirecao: '',
  iluminacao_intermitenteAdvertencia: '',
  iluminacao_marchaRe: '',
  iluminacao_identificacao: '',
  iluminacao_emergencia: '',
  
  bateria_integridadeFixacao: '',
  bateria_alteracaoProtecao: '',
  
  cronografo_laces: '',
  cronografo_funcionamento: '',
  
  buzina_existenciaFuncionamento: '',
  
  eletrica_estadoCabosEletrica: '',
  eletrica_isolamento: '',
  
  limpador_operacionalidade: '',
  limpador_integridadeOperacionalidade: '', // ✨ NOVO
  
  // ✨ TODAS AS SEÇÕES NOVAS
  comunicacao_retrorefletores: '',
  eletricos_bateriaIntegridade: '',
  eletricos_fiacaoIntegridade: '',
  eletricos_fiacaoFixacao: '',
  eletricos_largura: '',
  eletricos_funcionamento: '',
  eletricos_ligacaoEletrica: '',
  eletricos_estadoFiacao: '',
  
  alarmeRe_funcionamento: '',
  alarmeRe_estadoFiacao: '',
  
  paraChoque_listas: '',
  paraChoque_furos: '',
  paraChoque_integridade: '',
  paraChoque_visibilidadePlaca: '',
  
  paraLama_integridade: '',
  
  refletivos_existencia: '',
  refletivos_integridade: '',
  refletivos_conservacao: '',
  
  chassiContainer_atendimentoRes725: '',
  chassiContainer_dispositivosFixacao: '',
  
  dolly_estadoCambio: '',
  
  pinosSemi_integridade: '',
  pinosSemi_operacionalidade: '',
  pinosSemi_vazamentos: '',
  pinosSemi_fixacao: '',
  
  quintaRoda_integridade: '',
  quintaRoda_fixacao: '',
  quintaRoda_estadoApoios: '',
  quintaRoda_funcionamentoEngate: '',
  
  pinoRei_fixacaoVertical: '',
  pinoRei_diametroMm: '',
  pinoRei_trincas: '',
  pinoRei_deformado: '',
  pinoRei_recuperadoSolda: '',
  
  engate_estadoRotula: '',
  engate_travaSeguranca: '',
  engate_integridadePinos: '',
  engate_travaPinos: '',
  
  freio_estacionamento: '',
  freio_servico: '',
  freio_estadoCompressor: '',
  freio_correiasCompressor: '',
  freio_fixacaoConexoes: '',
  freio_vazamentos: '',
  freio_lonasFreio: '',
  freio_condicaoLonas: '',
  freio_fixacaoLona: '',
  freio_espessuraLonas: '',
  freio_indicadorPressao: '',
  
  // ✨ CAMPOS DO COMPRESSOR (valores iniciais)
  compressor_tempoRecuperacao: '',
  compressor_pressaoInicial: '',
  compressor_pressaoFinal: '',
  compressor_perdaAr: '',
  
  reservatorioAr_integridade: '',
  reservatorioAr_fixacao: '',
  reservatorioAr_vazamentos: '',
  reservatorioAr_valvulas: '',
  reservatorioAr_pressaoOperacional: '',
  reservatorioAr_dreno: '',
  
  // Medição Pneus - Campos Simplificados (esquema correto)
  medicao_tipoPneu: '',
  medicao_modelo: '',
  medicao_tipo: '',
  
  // Grid principal - 5 linhas simples
  medicao_linha1_esquerdo: '',
  medicao_linha1_direito: '',
  
  medicao_linha2_esquerdo: '',
  medicao_linha2_direito: '',
  
  medicao_linha3_esquerdo1: '',
  medicao_linha3_esquerdo2: '',
  medicao_linha3_direito1: '',
  medicao_linha3_direito2: '',
  
  medicao_linha4_esquerdo1: '',
  medicao_linha4_esquerdo2: '',
  medicao_linha4_direito1: '',
  medicao_linha4_direito2: '',
  
  medicao_linha5_esquerdo1: '',
  medicao_linha5_esquerdo2: '',
  medicao_linha5_direito1: '',
  medicao_linha5_direito2: '',
  
  medicao_estadoGeral: '',
  medicao_observacoes: '',
  
  observacoes: 'Este relatório não pressupõe qualquer garantia explícita ou implícita dada pela EMPRESA EXEMPLO INSPEÇÕES LTDA, relativo ao Veículo inspecionado. Não isentando o fabricante e proprietário de suas responsabilidades quanto aos danos pessoais, materiais e ambientais ou quaisquer perdas provocadas por problemas de instalação, construção, manutenção e operação incorreta do veículo e seus acessórios.'
});

// Seções do formulário para navegação
export const CHECKLIST_SECTIONS = [
  { id: 'dados-basicos', title: '1. Cliente e Veículo', subsections: [] },
  { id: 'cabina', title: '2. Cabina', subsections: [] },
  { id: 'equipamentos-seguranca', title: '3. Equipamentos de Segurança', subsections: [] },
  { id: 'pedais', title: '4. Pedais de Embreagem e Freio', subsections: ['Operacionalidade', 'Superfície', 'Trincas'] },
  { id: 'para-brisa', title: '5. Para-Brisa', subsections: [] },
  { id: 'para-sol', title: '6. Para-Sol', subsections: [] },
  { id: 'reservatorio-combustivel', title: '7. Reservatório de Combustível', subsections: [] },
  { id: 'motor', title: '8. Conjunto Motor/Caixa de Mudanças', subsections: [] },
  { id: 'eixos', title: '9. Eixos', subsections: [] },
  { id: 'suspensao', title: '10. Suspensão', subsections: [] },
  { id: 'rodas', title: '11. Rodas', subsections: [] },
  { id: 'pneus', title: '12. Pneus', subsections: [] },
  { id: 'medicao-pneus', title: '13. Medição dos Pneus', subsections: [] },
  { id: 'iluminacao', title: '14. Sistema de Iluminação', subsections: ['Faróis', 'Lanternas', 'Sinalizações'] },
  { id: 'bateria', title: '15. Bateria Elétrica', subsections: [] },
  { id: 'cronografo', title: '16. Cronotacógrafo', subsections: [] },
  { id: 'buzina', title: '17. Buzina Elétrica', subsections: [] },
  { id: 'eletrica', title: '18. Instalação Elétrica', subsections: [] },
  { id: 'limpador', title: '19. Limpador de Para-Brisa', subsections: ['Operacionalidade', 'Integridade'] },
  // 🆕 NOVAS SEÇÕES
  { id: 'comunicacao-eletricos', title: '20. Sistema de Comunicação e Elétricos', subsections: ['Retrorefletores', 'Bateria', 'Fiação'] },
  { id: 'alarme-re', title: '21. Sistema de Alarme de Ré', subsections: [] },
  { id: 'para-choque', title: '22. Para-Choque Traseiro', subsections: [] },
  { id: 'para-lama', title: '23. Para-Lama', subsections: [] },
  { id: 'refletivos', title: '24. Dispositivos Refletivos de Segurança', subsections: [] },
  { id: 'chassi-container', title: '25. Veículo Chassi Porta-Contêiner', subsections: [] },
  { id: 'dolly', title: '26. Dolly', subsections: [] },
  { id: 'pinos-semi', title: '27. Pinos de Ação do Semi-Reboque', subsections: [] },
  { id: 'quinta-roda', title: '28. Quinta-Roda', subsections: [] },
  { id: 'pino-rei', title: '29. Pino-Rei', subsections: [] },
  { id: 'engate', title: '30. Conjunto de Engate', subsections: [] },
  { id: 'freio-expandido', title: '31. Sistema de Freio', subsections: ['Estacionamento', 'Serviço', 'Compressor', 'Lonas'] },
  { id: 'reservatorio-ar', title: '32. Reservatório de Ar', subsections: [] },
  { id: 'observacoes', title: '33. Observações', subsections: [] }
] as const;

export type SectionId = (typeof CHECKLIST_SECTIONS)[number]['id'];