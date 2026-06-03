import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    console.log('🚀 [API-CHECKLIST] Iniciando POST request');

    const body = await request.json();
    console.log('📦 [API-CHECKLIST] Body recebido:', {
      clientId: body.clientId,
      vehicleId: body.vehicleId,
      ordemServico: body.ordemServico,
      dataEmissao: body.dataEmissao,
      laudoType: body.laudoType,
      codTemporal: body.codTemporal,
      totalKeys: Object.keys(body).length
    });

    // Validações básicas
    if (!body.clientId || !body.vehicleId) {
      console.log('❌ [API-CHECKLIST] Erro: clientId ou vehicleId ausente');
      return new NextResponse(
        JSON.stringify({ message: 'clientId e vehicleId são obrigatórios' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.ordemServico) {
      console.log('❌ [API-CHECKLIST] Erro: ordemServico ausente');
      return new NextResponse(
        JSON.stringify({ message: 'ordemServico é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [API-CHECKLIST] Validações básicas aprovadas');

    // Serializar todos os dados do checklist como JSON
    const checklistData = {
      // Dados básicos já existentes no schema
      clientId: body.clientId,
      vehicleId: body.vehicleId,
      ordemServico: body.ordemServico,
      dataEmissao: new Date(body.dataEmissao),
      laudoType: 'CHECKLIST',
      codTemporal: body.codTemporal,
      observacoes: body.observacoes,

      // Campos específicos do checklist serão armazenados em observacoes como JSON estruturado
      fabricanteEquipamento: 'N.A',
      mesAnoFabricEquip: 'N.A',
      diametroPinoRei: 'N.A',
      dataVerifPinoRei: '',

      // URLs de fotos (vazias para checklist)
      fotoDianteiraUrl: '',
      fotoTraseiraUrl: '',
      fotoChassiUrl: '',
    };

    console.log('📋 [API-CHECKLIST] checklistData preparado:', {
      clientId: checklistData.clientId,
      vehicleId: checklistData.vehicleId,
      ordemServico: checklistData.ordemServico,
      laudoType: checklistData.laudoType,
      dataEmissao: checklistData.dataEmissao
    });

    // Criar objeto com todos os dados específicos do checklist expandido
    const checklistDetails = {
      // Cabina
      cabina_estadoGeral: body.cabina_estadoGeral,
      cabina_estadoDegraus: body.cabina_estadoDegraus,
      cabina_portas: body.cabina_portas,
      cabina_integridadeFuncionamento: body.cabina_integridadeFuncionamento,
      cabina_bancosEstadoGeral: body.cabina_bancosEstadoGeral,
      cabina_bancosFixacao: body.cabina_bancosFixacao,

      // Equipamentos de Segurança
      seguranca_cintoSeguranca: body.seguranca_cintoSeguranca,
      seguranca_extintorCabine: body.seguranca_extintorCabine,
      seguranca_extintorTanque: body.seguranca_extintorTanque,
      seguranca_triangulo: body.seguranca_triangulo,
      seguranca_espelhosRetrovisores: body.seguranca_espelhosRetrovisores,

      // Pedais (expandido)
      pedais_embragemFreio: body.pedais_embragemFreio,
      pedais_superficiePisomante: body.pedais_superficiePisomante,
      pedais_trincas: body.pedais_trincas, // ✨ NOVO

      // Para-Brisa
      paraBrisa_integridadeVisibilidade: body.paraBrisa_integridadeVisibilidade,
      paraBrisa_trincas: body.paraBrisa_trincas,

      // Para-Sol
      paraSol_integridadeFixacao: body.paraSol_integridadeFixacao,

      // Reservatório Combustível
      reservatorio_integridadeFixacao: body.reservatorio_integridadeFixacao,
      reservatorio_vazamento: body.reservatorio_vazamento,
      reservatorio_material: body.reservatorio_material,
      reservatorio_suplementar: body.reservatorio_suplementar,

      // Motor/Caixa Mudanças
      motor_ancoragem: body.motor_ancoragem,
      motor_protecao: body.motor_protecao,
      motor_sistemaOperacao: body.motor_sistemaOperacao,
      motor_funcionamentoFolgas: body.motor_funcionamentoFolgas,
      motor_oleoHidraulico: body.motor_oleoHidraulico,
      motor_alinhamentoDirecao: body.motor_alinhamentoDirecao,
      motor_transmissao: body.motor_transmissao,
      motor_eixoCarda: body.motor_eixoCarda,
      motor_cruzetasMancais: body.motor_cruzetasMancais,
      motor_sistemaEscapamento: body.motor_sistemaEscapamento,
      motor_integridade: body.motor_integridade,
      motor_contraSeguranca: body.motor_contraSeguranca,
      motor_protecaoPino: body.motor_protecaoPino,
      motor_limiteOperacidade: body.motor_limiteOperacidade,
      motor_chassi: body.motor_chassi,
      motor_estadoArticulacao: body.motor_estadoArticulacao,
      motor_estacionamento: body.motor_estacionamento,
      motor_rastreamento: body.motor_rastreamento,
      motor_posicaoFixacao: body.motor_posicaoFixacao,

      // Eixos
      eixos_trincasSoldas: body.eixos_trincasSoldas,
      eixos_integridadeDirecional: body.eixos_integridadeDirecional,
      eixos_mecanismoElevacao: body.eixos_mecanismoElevacao,
      eixos_integridadeOperacionalidade: body.eixos_integridadeOperacionalidade,

      // Suspensão
      suspensao_amortecedor: body.suspensao_amortecedor,
      suspensao_balancins: body.suspensao_balancins,
      suspensao_barraEstabilizadora: body.suspensao_barraEstabilizadora,
      suspensao_feixesMolas: body.suspensao_feixesMolas,
      suspensao_bracoTensor: body.suspensao_bracoTensor,
      suspensao_pneumaticaMangueiras: body.suspensao_pneumaticaMangueiras,

      // Rodas
      rodas_elementosFixacao: body.rodas_elementosFixacao,
      rodas_integridadeAros: body.rodas_integridadeAros,
      rodas_existenciaEstado: body.rodas_existenciaEstado,
      rodas_integridadeAneis: body.rodas_integridadeAneis,
      rodas_estadoRolos: body.rodas_estadoRolos,

      // Pneus
      pneus_dianteiro: body.pneus_dianteiro,
      pneus_sulcosProfundidade: body.pneus_sulcosProfundidade,
      pneus_paridadeMesmoEixo: body.pneus_paridadeMesmoEixo,
      pneus_flancos: body.pneus_flancos,
      pneus_bandaRodagem: body.pneus_bandaRodagem,
      pneus_sobresalente: body.pneus_sobresalente,

      // Sistema Iluminação (expandido)
      iluminacao_farolPrincipal: body.iluminacao_farolPrincipal,
      iluminacao_farolPenetrador: body.iluminacao_farolPenetrador,
      iluminacao_farolNeblina: body.iluminacao_farolNeblina,
      iluminacao_lanternaPlaca: body.iluminacao_lanternaPlaca,
      iluminacao_lanternaLuz: body.iluminacao_lanternaLuz,
      iluminacao_sinalizacao: body.iluminacao_sinalizacao,
      iluminacao_lanternaDelimitadora: body.iluminacao_lanternaDelimitadora,
      iluminacao_lanternaFreio: body.iluminacao_lanternaFreio,
      iluminacao_lanternaIndicadora: body.iluminacao_lanternaIndicadora,
      iluminacao_lanternaIndicadoraLateral: body.iluminacao_lanternaIndicadoraLateral,
      iluminacao_lanternaAdvertencia: body.iluminacao_lanternaAdvertencia,
      iluminacao_lanternaLaterais: body.iluminacao_lanternaLaterais,
      iluminacao_lanternaLateralRe: body.iluminacao_lanternaLateralRe,
      iluminacao_lanternaNeblina: body.iluminacao_lanternaNeblina,
      iluminacao_lanternaProjecao: body.iluminacao_lanternaProjecao,
      iluminacao_retrorefletores: body.iluminacao_retrorefletores,
      // ✨ NOVOS CAMPOS DE ILUMINAÇÃO
      iluminacao_delimitadoraDianteira: body.iluminacao_delimitadoraDianteira,
      iluminacao_delimitadoraTraseira: body.iluminacao_delimitadoraTraseira,
      iluminacao_direcaoDianteira: body.iluminacao_direcaoDianteira,
      iluminacao_direcaoTraseira: body.iluminacao_direcaoTraseira,
      iluminacao_intermitenteDirecao: body.iluminacao_intermitenteDirecao,
      iluminacao_intermitenteAdvertencia: body.iluminacao_intermitenteAdvertencia,
      iluminacao_marchaRe: body.iluminacao_marchaRe,
      iluminacao_identificacao: body.iluminacao_identificacao,
      iluminacao_emergencia: body.iluminacao_emergencia,

      // Bateria Elétrica
      bateria_integridadeFixacao: body.bateria_integridadeFixacao,
      bateria_alteracaoProtecao: body.bateria_alteracaoProtecao,

      // Cronotacógrafo
      cronografo_laces: body.cronografo_laces,
      cronografo_funcionamento: body.cronografo_funcionamento,

      // Buzina Elétrica
      buzina_existenciaFuncionamento: body.buzina_existenciaFuncionamento,

      // Instalação Elétrica
      eletrica_estadoCabosEletrica: body.eletrica_estadoCabosEletrica,
      eletrica_isolamento: body.eletrica_isolamento,

      // Limpador Para-Brisa (expandido)
      limpador_operacionalidade: body.limpador_operacionalidade,
      limpador_integridadeOperacionalidade: body.limpador_integridadeOperacionalidade, // ✨ NOVO

      // ✨ TODAS AS SEÇÕES NOVAS

      // Sistema de Comunicação e Elétricos
      comunicacao_retrorefletores: body.comunicacao_retrorefletores,
      eletricos_bateriaIntegridade: body.eletricos_bateriaIntegridade,
      eletricos_fiacaoIntegridade: body.eletricos_fiacaoIntegridade,
      eletricos_fiacaoFixacao: body.eletricos_fiacaoFixacao,
      eletricos_largura: body.eletricos_largura,
      eletricos_funcionamento: body.eletricos_funcionamento,
      eletricos_ligacaoEletrica: body.eletricos_ligacaoEletrica,
      eletricos_estadoFiacao: body.eletricos_estadoFiacao,

      // Sistema de Alarme de Ré
      alarmeRe_funcionamento: body.alarmeRe_funcionamento,
      alarmeRe_estadoFiacao: body.alarmeRe_estadoFiacao,

      // Para-Choque Traseiro
      paraChoque_listas: body.paraChoque_listas,
      paraChoque_furos: body.paraChoque_furos,
      paraChoque_integridade: body.paraChoque_integridade,
      paraChoque_visibilidadePlaca: body.paraChoque_visibilidadePlaca,

      // Para-Lama
      paraLama_integridade: body.paraLama_integridade,

      // Dispositivos Refletivos de Segurança
      refletivos_existencia: body.refletivos_existencia,
      refletivos_integridade: body.refletivos_integridade,
      refletivos_conservacao: body.refletivos_conservacao,

      // Veículo Chassi Porta-Contêiner
      chassiContainer_atendimentoRes725: body.chassiContainer_atendimentoRes725,
      chassiContainer_dispositivosFixacao: body.chassiContainer_dispositivosFixacao,

      // Dolly
      dolly_estadoCambio: body.dolly_estadoCambio,

      // Pinos de Ação do Semi-Reboque
      pinosSemi_integridade: body.pinosSemi_integridade,
      pinosSemi_operacionalidade: body.pinosSemi_operacionalidade,
      pinosSemi_vazamentos: body.pinosSemi_vazamentos,
      pinosSemi_fixacao: body.pinosSemi_fixacao,

      // Quinta-Roda
      quintaRoda_integridade: body.quintaRoda_integridade,
      quintaRoda_fixacao: body.quintaRoda_fixacao,
      quintaRoda_estadoApoios: body.quintaRoda_estadoApoios,
      quintaRoda_funcionamentoEngate: body.quintaRoda_funcionamentoEngate,

      // Pino-Rei
      pinoRei_fixacaoVertical: body.pinoRei_fixacaoVertical,
      pinoRei_diametroMm: body.pinoRei_diametroMm,
      pinoRei_trincas: body.pinoRei_trincas,
      pinoRei_deformado: body.pinoRei_deformado,
      pinoRei_recuperadoSolda: body.pinoRei_recuperadoSolda,

      // Conjunto de Engate
      engate_estadoRotula: body.engate_estadoRotula,
      engate_travaSeguranca: body.engate_travaSeguranca,
      engate_integridadePinos: body.engate_integridadePinos,
      engate_travaPinos: body.engate_travaPinos,

      // Sistema de Freio (expandido)
      freio_estacionamento: body.freio_estacionamento,
      freio_servico: body.freio_servico,
      freio_estadoCompressor: body.freio_estadoCompressor,
      freio_correiasCompressor: body.freio_correiasCompressor,
      freio_fixacaoConexoes: body.freio_fixacaoConexoes,
      freio_vazamentos: body.freio_vazamentos,
      freio_lonasFreio: body.freio_lonasFreio,
      freio_condicaoLonas: body.freio_condicaoLonas,
      freio_fixacaoLona: body.freio_fixacaoLona,
      freio_espessuraLonas: body.freio_espessuraLonas,
      freio_indicadorPressao: body.freio_indicadorPressao,

      // Campos do Compressor (NOVOS)
      compressor_tempoRecuperacao: body.checklistData?.compressor_tempoRecuperacao || body.compressor_tempoRecuperacao,
      compressor_pressaoInicial: body.checklistData?.compressor_pressaoInicial || body.compressor_pressaoInicial,
      compressor_pressaoFinal: body.checklistData?.compressor_pressaoFinal || body.compressor_pressaoFinal,
      compressor_perdaAr: body.checklistData?.compressor_perdaAr || body.compressor_perdaAr,

      // Reservatório de Ar (TOTALMENTE NOVA)
      reservatorioAr_integridade: body.reservatorioAr_integridade,
      reservatorioAr_fixacao: body.reservatorioAr_fixacao,
      reservatorioAr_vazamentos: body.reservatorioAr_vazamentos,
      reservatorioAr_valvulas: body.reservatorioAr_valvulas,
      reservatorioAr_pressaoOperacional: body.reservatorioAr_pressaoOperacional,
      reservatorioAr_dreno: body.reservatorioAr_dreno,

      // Medição Pneus - Campos corretos do formulário
      medicao_tipoPneu: body.medicao_tipoPneu,
      medicao_modelo: body.medicao_modelo,
      medicao_tipo: body.medicao_tipo,
      medicao_linha1_esquerdo: body.medicao_linha1_esquerdo,
      medicao_linha1_direito: body.medicao_linha1_direito,
      medicao_linha2_esquerdo: body.medicao_linha2_esquerdo,
      medicao_linha2_direito: body.medicao_linha2_direito,
      medicao_linha2_esquerdo1: body.medicao_linha2_esquerdo1,
      medicao_linha2_esquerdo2: body.medicao_linha2_esquerdo2,
      medicao_linha2_direito1: body.medicao_linha2_direito1,
      medicao_linha2_direito2: body.medicao_linha2_direito2,
      medicao_linha3_esquerdo1: body.medicao_linha3_esquerdo1,
      medicao_linha3_esquerdo2: body.medicao_linha3_esquerdo2,
      medicao_linha3_direito1: body.medicao_linha3_direito1,
      medicao_linha3_direito2: body.medicao_linha3_direito2,
      medicao_linha4_esquerdo1: body.medicao_linha4_esquerdo1,
      medicao_linha4_esquerdo2: body.medicao_linha4_esquerdo2,
      medicao_linha4_direito1: body.medicao_linha4_direito1,
      medicao_linha4_direito2: body.medicao_linha4_direito2,
      medicao_linha5_esquerdo1: body.medicao_linha5_esquerdo1,
      medicao_linha5_esquerdo2: body.medicao_linha5_esquerdo2,
      medicao_linha5_direito1: body.medicao_linha5_direito1,
      medicao_linha5_direito2: body.medicao_linha5_direito2,
      medicao_linha6_esquerdo1: body.medicao_linha6_esquerdo1,
      medicao_linha6_esquerdo2: body.medicao_linha6_esquerdo2,
      medicao_linha6_direito1: body.medicao_linha6_direito1,
      medicao_linha6_direito2: body.medicao_linha6_direito2,
      medicao_estadoGeral: body.medicao_estadoGeral,
      medicao_observacoes: body.medicao_observacoes,
    };

    console.log('🔧 [API-CHECKLIST] checklistDetails processados, total de campos:', Object.keys(checklistDetails).length);

    // Anexar dados do checklist às observações como JSON estruturado
    const observacoesCompletas = body.observacoes + '\n\n--- DADOS CHECKLIST ---\n' + JSON.stringify(checklistDetails, null, 2);
    checklistData.observacoes = observacoesCompletas;

    console.log('📝 [API-CHECKLIST] Observações preparadas, tamanho:', observacoesCompletas.length);

    console.log('💾 [API-CHECKLIST] Criando laudo no banco de dados...');
    const newLaudo = await prisma.laudo.create({
      data: checklistData,
    });

    console.log('✅ [API-CHECKLIST] Laudo criado com sucesso:', {
      id: newLaudo.id,
      ordemServico: newLaudo.ordemServico,
      clientId: newLaudo.clientId,
      vehicleId: newLaudo.vehicleId
    });

    return new NextResponse(JSON.stringify(newLaudo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 [API-CHECKLIST] Erro ao criar laudo checklist:', error);

    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('💥 [API-CHECKLIST] Error message:', error.message);
      console.error('💥 [API-CHECKLIST] Error stack:', error.stack);
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.log('⚠️ [API-CHECKLIST] Erro de duplicação P2002');
      return new NextResponse(
        JSON.stringify({ message: 'Um laudo com esta Ordem de Serviço já existe.' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'Falha ao criar laudo checklist', error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}