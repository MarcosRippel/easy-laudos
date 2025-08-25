'use client';

import { useState, useEffect } from 'react';
import type { Client, Vehicle, Laudo, AdminSetting } from '@prisma/client';
import { PDFDocument, rgb } from 'pdf-lib';
import { download } from '@/lib/download';
import { format } from 'date-fns';
import fontkit from '@pdf-lib/fontkit';
import styles from './ChecklistForm.module.css';
import { ExpandedChecklistData, getExpandedInitialData, CheckStatus } from '@/types/checklist';

interface ChecklistFormProps {
  clients: Client[];
  nextOrdemServico: string;
  temporalCode: string;
}

export default function ChecklistForm({ clients, nextOrdemServico, temporalCode }: ChecklistFormProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [checklistData, setChecklistData] = useState<ExpandedChecklistData>(
    getExpandedInitialData(nextOrdemServico, temporalCode)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [downloadLaudoId, setDownloadLaudoId] = useState('');
  const [keySequence, setKeySequence] = useState('');
  const [showShortcutFeedback, setShowShortcutFeedback] = useState(false);

  const handleClientChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = event.target.value;
    console.log('🏢 [CHECKLIST] Cliente selecionado:', clientId);
    
    setSelectedClient(clientId);
    setSelectedVehicle('');
    setVehicles([]);
    setChecklistData(prev => ({ ...prev, clientId }));

    if (clientId) {
      console.log('🚚 [CHECKLIST] Carregando veículos para cliente:', clientId);
      setIsVehicleLoading(true);
      try {
        const response = await fetch(`/api/vehicles?clientId=${clientId}`);
        console.log('📡 [CHECKLIST] Resposta de veículos:', {
          status: response.status,
          ok: response.ok
        });
        
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        
        const vehiclesData = await response.json();
        console.log('✅ [CHECKLIST] Veículos carregados:', vehiclesData.length);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('❌ [CHECKLIST] Erro ao carregar veículos:', error);
      } finally {
        setIsVehicleLoading(false);
      }
    }
  };

  const handleVehicleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = event.target.value;
    setSelectedVehicle(vehicleId);
    setChecklistData(prev => ({ ...prev, vehicleId }));
  };

  const handleInputChange = (field: keyof ExpandedChecklistData, value: string | CheckStatus) => {
    setChecklistData(prev => ({ ...prev, [field]: value }));
  };

  // Lista dos campos de checklist que podem ser marcados como "OK"
  const checklistFields = [
    'cabina_estadoGeral', 'cabina_estadoDegraus', 'cabina_portas', 'cabina_integridadeFuncionamento',
    'cabina_bancosEstadoGeral', 'cabina_bancosFixacao', 'seguranca_cintoSeguranca', 'seguranca_extintorCabine',
    'seguranca_extintorTanque', 'seguranca_triangulo', 'seguranca_espelhosRetrovisores', 'pedais_embragemFreio',
    'pedais_superficiePisomante', 'pedais_trincas', 'paraBrisa_integridadeVisibilidade', 'paraBrisa_trincas',
    'paraSol_integridadeFixacao', 'reservatorio_integridadeFixacao', 'reservatorio_vazamento', 'reservatorio_material',
    'reservatorio_suplementar', 'motor_ancoragem', 'motor_protecao', 'motor_sistemaOperacao', 'motor_funcionamentoFolgas',
    'motor_oleoHidraulico', 'motor_alinhamentoDirecao', 'motor_transmissao', 'motor_eixoCarda', 'motor_cruzetasMancais',
    'motor_sistemaEscapamento', 'motor_integridade', 'motor_contraSeguranca', 'motor_protecaoPino', 'motor_limiteOperacidade',
    'motor_chassi', 'motor_estadoArticulacao', 'motor_estacionamento', 'motor_rastreamento', 'motor_posicaoFixacao',
    'eixos_trincasSoldas', 'eixos_integridadeDirecional', 'eixos_mecanismoElevacao', 'eixos_integridadeOperacionalidade',
    'suspensao_amortecedor', 'suspensao_balancins', 'suspensao_barraEstabilizadora', 'suspensao_feixesMolas',
    'suspensao_bracoTensor', 'suspensao_pneumaticaMangueiras', 'rodas_elementosFixacao', 'rodas_integridadeAros',
    'rodas_existenciaEstado', 'rodas_integridadeAneis', 'rodas_estadoRolos', 'pneus_dianteiro', 'pneus_paridadeMesmoEixo',
    'pneus_flancos', 'pneus_bandaRodagem',
    // Sistema de Iluminação
    'iluminacao_farolPrincipal', 'iluminacao_farolPenetrador', 'iluminacao_farolNeblina', 'iluminacao_lanternaPlaca',
    'iluminacao_lanternaLuz', 'iluminacao_sinalizacao', 'iluminacao_lanternaDelimitadora', 'iluminacao_lanternaFreio',
    'iluminacao_lanternaIndicadora', 'iluminacao_lanternaIndicadoraLateral', 'iluminacao_lanternaAdvertencia',
    'iluminacao_lanternaLaterais', 'iluminacao_lanternaLateralRe', 'iluminacao_lanternaNeblina', 'iluminacao_lanternaProjecao',
    'iluminacao_retrorefletores', 'iluminacao_delimitadoraDianteira', 'iluminacao_delimitadoraTraseira',
    'iluminacao_direcaoDianteira', 'iluminacao_direcaoTraseira', 'iluminacao_intermitenteDirecao',
    'iluminacao_intermitenteAdvertencia', 'iluminacao_marchaRe', 'iluminacao_identificacao', 'iluminacao_emergencia',
    // Sistema de Freio
    'freio_estacionamento', 'freio_servico', 'freio_estadoCompressor', 'freio_correiasCompressor',
    'freio_fixacaoConexoes', 'freio_vazamentos', 'freio_lonasFreio', 'freio_condicaoLonas',
    'freio_fixacaoLona', 'freio_espessuraLonas', 'freio_indicadorPressao',
    // Reservatório de Ar
    'reservatorioAr_integridade', 'reservatorioAr_fixacao', 'reservatorioAr_vazamentos', 'reservatorioAr_valvulas',
    'reservatorioAr_dreno',
    // Bateria Elétrica
    'bateria_integridadeFixacao', 'bateria_alteracaoProtecao',
    // Cronotacógrafo
    'cronografo_laces', 'cronografo_funcionamento',
    // Buzina Elétrica
    'buzina_existenciaFuncionamento',
    // Limpador de Para-Brisa
    'limpador_operacionalidade', 'limpador_integridadeOperacionalidade',
    // Sistema de Comunicação e Elétricos
    'comunicacao_retrorefletores', 'eletricos_bateriaIntegridade', 'eletricos_fiacaoIntegridade',
    'eletricos_fiacaoFixacao', 'eletricos_funcionamento', 'eletricos_ligacaoEletrica', 'eletricos_estadoFiacao',
    // Sistema de Alarme de Ré
    'alarmeRe_funcionamento', 'alarmeRe_estadoFiacao',
    // Para-Choque Traseiro
    'paraChoque_listas', 'paraChoque_integridade', 'paraChoque_furos', 'paraChoque_visibilidadePlaca',
    // Para-Lama
    'paraLama_integridade',
    // Dispositivos Refletivos de Segurança
    'refletivos_existencia', 'refletivos_integridade', 'refletivos_conservacao',
    // Veículo Chassi Porta-Contêiner
    'chassiContainer_atendimentoRes725', 'chassiContainer_dispositivosFixacao',
    // Dolly
    'dolly_estadoCambio',
    // Pinos de Ação do Semi-Reboque
    'pinosSemi_integridade', 'pinosSemi_operacionalidade', 'pinosSemi_vazamentos', 'pinosSemi_fixacao',
    // Quinta-Roda
    'quintaRoda_integridade', 'quintaRoda_fixacao', 'quintaRoda_estadoApoios', 'quintaRoda_funcionamentoEngate',
    // Pino-Rei
    'pinoRei_fixacaoVertical', 'pinoRei_trincas', 'pinoRei_deformado', 'pinoRei_recuperadoSolda',
    // Conjunto de Engate
    'engate_estadoRotula', 'engate_travaSeguranca', 'engate_integridadePinos', 'engate_travaPinos'
  ] as const;

  // Função para marcar todos os checkboxes como "OK" (verde)
  const markAllAsOk = () => {
    console.log('🎯 [ATALHO] Marcando todos os campos como OK');
    const updatedData = { ...checklistData };
    checklistFields.forEach(field => {
      updatedData[field] = 'OK';
    });
    setChecklistData(updatedData);
    
    // Mostrar feedback visual
    setShowShortcutFeedback(true);
    setTimeout(() => setShowShortcutFeedback(false), 2000);
    console.log('✅ [ATALHO] Todos os campos marcados como OK');
  };

  // Effect para detectar o atalho "///"
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detecta apenas a tecla "/"
      if (event.key === '/') {
        console.log('🔍 [ATALHO] Tecla "/" detectada');
        event.preventDefault();
        
        setKeySequence(prev => {
          const newSequence = prev + '/';
          console.log('🔢 [ATALHO] Sequência atual:', newSequence);
          
          // Se chegou a "///", marcar todos como OK e resetar a sequência
          if (newSequence === '///') {
            console.log('🎉 [ATALHO] Sequência completa detectada!');
            markAllAsOk();
            setTimeout(() => setKeySequence(''), 100); // Reset após marcar
            return '';
          }
          
          // Limpar sequência após 1 segundo se não completar
          setTimeout(() => {
            console.log('⏰ [ATALHO] Timeout - limpando sequência');
            setKeySequence('');
          }, 1000);
          
          return newSequence;
        });
      } else {
        // Qualquer outra tecla reseta a sequência
        setKeySequence('');
      }
    };

    console.log('🎧 [ATALHO] Event listener adicionado');
    // Adicionar listener quando o componente estiver ativo
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      console.log('🔥 [ATALHO] Event listener removido');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [CHECKLIST] Iniciando handleSubmit');
    console.log('📋 [CHECKLIST] selectedClient:', selectedClient);
    console.log('🚚 [CHECKLIST] selectedVehicle:', selectedVehicle);
    
    if (!selectedClient || !selectedVehicle) {
      console.log('❌ [CHECKLIST] Erro: Cliente ou veículo não selecionado');
      setMessage('Por favor, selecione um cliente e um veículo.');
      return;
    }

    console.log('✅ [CHECKLIST] Cliente e veículo válidos, prosseguindo...');
    setIsSubmitting(true);
    setMessage('Criando laudo CHECKLIST...');

    try {
      const submissionData = {
        ...checklistData,
        clientId: selectedClient,
        vehicleId: selectedVehicle,
        laudoType: 'CHECKLIST',
        dataEmissao: checklistData.dataEmissao || new Date().toISOString().split('T')[0],
      };
      
      console.log('📦 [CHECKLIST] Dados de submissão preparados:', {
        ordemServico: submissionData.ordemServico,
        clientId: selectedClient,
        vehicleId: selectedVehicle,
        laudoType: submissionData.laudoType,
        dataEmissao: submissionData.dataEmissao,
        totalFields: Object.keys(submissionData).length
      });

      console.log('🌐 [CHECKLIST] Fazendo requisição para /api/laudos/checklist');
      const response = await fetch('/api/laudos/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      console.log('📡 [CHECKLIST] Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ [CHECKLIST] Erro na resposta da API:', errorData);
        throw new Error(errorData.message || 'Falha ao criar laudo.');
      }

      const newLaudo = await response.json();
      console.log('✅ [CHECKLIST] Laudo criado com sucesso:', {
        id: newLaudo.id,
        ordemServico: newLaudo.ordemServico
      });
      
      setMessage('Laudo CHECKLIST criado com sucesso! Gerando HTML...');

      // Gerar HTML automaticamente
      console.log('📄 [CHECKLIST] Iniciando geração de PDF para laudo ID:', newLaudo.id);
      await generateChecklistHtmlToPdf(newLaudo.id);

      // Reset form after success
      setTimeout(() => {
        console.log('🔄 [CHECKLIST] Resetando formulário');
        setMessage('');
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);
        setChecklistData(getExpandedInitialData(nextOrdemServico, temporalCode));
      }, 2000);

    } catch (error) {
      console.error('💥 [CHECKLIST] Erro no handleSubmit:', error);
      setMessage(error instanceof Error ? `Erro: ${error.message}` : 'Erro desconhecido.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const renderCheckboxGroup = (label: string, field: keyof ExpandedChecklistData) => (
    <div className={styles.checkboxGroup}>
      <label className={styles.checkboxLabel}>{label}</label>
      <div className={styles.checkboxOptions}>
        {['OK', 'NA', 'NOK'].map(option => (
          <label key={option} className={styles.option}>
            <input
              type="radio"
              name={field as string}
              value={option}
              checked={(checklistData[field] || '') === option}
              onChange={(e) => handleInputChange(field, e.target.value as CheckStatus)}
            />
            <span className={`${styles.optionText} ${styles[option.toLowerCase()]}`}>
              {option === 'OK' ? '✓' : option === 'NA' ? 'N.A' : '✗'}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderInputField = (label: string, field: keyof ExpandedChecklistData, placeholder?: string) => (
    <div className={styles.inputGroup}>
      <label className={styles.inputLabel}>{label}</label>
      <input
        type="text"
        value={(checklistData[field] as string) || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );

  const generateChecklistHtml = async (laudoId: string) => {
    try {
      console.log('🌐 [CHECKLIST-HTML] Iniciando geração de HTML para ID:', laudoId);
      
      console.log('📡 [CHECKLIST-HTML] Buscando dados do laudo e configurações admin');
      const [laudoDetailsRes, adminSettingsRes] = await Promise.all([
        fetch(`/api/laudos/${laudoId}`),
        fetch('/api/admin/settings')
      ]);

      console.log('📡 [CHECKLIST-HTML] Respostas recebidas:', {
        laudoDetailsStatus: laudoDetailsRes.status,
        adminSettingsStatus: adminSettingsRes.status,
        laudoDetailsOk: laudoDetailsRes.ok,
        adminSettingsOk: adminSettingsRes.ok
      });

      if (!laudoDetailsRes.ok || !adminSettingsRes.ok) {
        console.log('❌ [CHECKLIST-HTML] Erro ao buscar dados');
        throw new Error('Falha ao buscar dados para geração do HTML.');
      }

      const fullLaudo: Laudo & { client: Client; vehicle: Vehicle } = await laudoDetailsRes.json();
      const adminSettings: AdminSetting = await adminSettingsRes.json();
      
      console.log('✅ [CHECKLIST-HTML] Dados carregados:', {
        laudoId: fullLaudo.id,
        ordemServico: fullLaudo.ordemServico,
        clientName: fullLaudo.client.name,
        vehiclePlaca: fullLaudo.vehicle.placa,
        hasLogo: !!adminSettings.companyLogoUrl
      });
      
      // 🔧 CORREÇÃO: Converter logo para base64 para funcionar no HTML baixado
      let logoBase64 = '';
      if (adminSettings.companyLogoUrl) {
        try {
          const logoResponse = await fetch(adminSettings.companyLogoUrl);
          if (logoResponse.ok) {
            const logoBlob = await logoResponse.blob();
            const logoArrayBuffer = await logoBlob.arrayBuffer();
            const logoBytes = new Uint8Array(logoArrayBuffer);
            
            // Determinar o tipo MIME da imagem
            const logoType = adminSettings.companyLogoUrl.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
            
            // Converter para base64
            const logoBase64String = btoa(String.fromCharCode(...logoBytes));
            logoBase64 = `data:${logoType};base64,${logoBase64String}`;
            
            console.log('✅ Logo convertido para base64 com sucesso');
          } else {
            console.warn('⚠️ Falha ao buscar logo:', adminSettings.companyLogoUrl);
          }
        } catch (e) {
          console.error('❌ Erro ao converter logo para base64:', e);
        }
      }
      
      console.log('🔍 DEBUG - Logo Status:', {
        companyLogoUrl: adminSettings.companyLogoUrl,
        hasLogo: !!adminSettings.companyLogoUrl,
        logoBase64Length: logoBase64.length
      });
      
      // Parse dos dados do checklist das observações
      const observacoes = fullLaudo.observacoes || '';
      let checklistData: any = {};
      
      try {
        const checklistStart = observacoes.indexOf('--- DADOS CHECKLIST ---');
        if (checklistStart !== -1) {
          const jsonStart = observacoes.indexOf('{', checklistStart);
          if (jsonStart !== -1) {
            const jsonData = observacoes.substring(jsonStart);
            checklistData = JSON.parse(jsonData);
          }
        }
      } catch (e) {
        console.error('Erro ao parse dos dados do checklist:', e);
      }

      // Função helper para mapeamento com fallback
      const mapMedicaoValue = (value: string, defaultType: 'NA' | 'X' = 'NA') => {
        return value && value.trim() ? value : defaultType;
      };

      // SVG do pneu convertido para base64 para compatibilidade com HTML standalone
      const pneuSvgBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIENpcmN1bG8gZXh0ZXJubyBkbyBwbmV1IC0tPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjI4IiBmaWxsPSIjMWExYTFhIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiIvPgogIDwhLS0gQ2lyY3VsbyBpbnRlcm5vIC0tPgogIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIyIiBmaWxsPSIjMmEyYTJhIiBzdHJva2U9IiM0NDQiIHN0cm9rZS13aWR0aD0iMSIvPgogIDwhLS0gUGFkcsOjbyBkZSBzdWxjb3MgZG8gcG5ldSAtLT4KICA8ZyBzdHJva2U9IiM1NTUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSI+CiAgICA8cGF0aCBkPSJNIDEwIDMwIFEgMzAgMjAgNTAgMzAiLz4KICAgIDxwYXRoIGQ9Ik0gMTAgMzAgUSAzMCA0MCA1MCAzMCIvPgogICAgPHBhdGggZD0iTSAzMCA4IFEgMjAgMzAgMzAgNTIiLz4KICAgIDxwYXRoIGQ9Ik0gMzAgOCBRIDQwIDMwIDMwIDUyIi8+CiAgPC9nPgogIDwhLS0gQ2VudHJvIGRvIHBuZXUgLS0+CiAgPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMzMzMiIHN0cm9rZT0iIzU1NSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==';

      // Função para renderizar checkbox no HTML
      const renderCheckbox = (value: string) => {
        if (value === 'OK') return '✓';
        if (value === 'NOK') return '✗';
        if (value === 'NA') return 'N.A';
        return '';
      };

      // Helper para renderizar campo com checkbox GRUDADA no texto
      const renderField = (label: string, field: string) => {
        const value = checklistData[field] || '';
        const cssClass = value === 'OK' ? 'ok' : value === 'NOK' ? 'nok' : 'na';
        return `
          <div class="field">
            ${label} <span class="checkbox ${cssClass}">${renderCheckbox(value)}</span>
          </div>
        `;
      };

      // Helper para renderizar campo de texto
      const renderTextField = (label: string, field: string, defaultValue = '') => {
        const value = checklistData[field] || defaultValue;
        return `
          <div class="field-text">
            <span class="label">${label}:</span>
            <span class="value">${value}</span>
          </div>
        `;
      };

      // Gerar HTML completo com TODAS as 33 seções
      const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laudo CHECKLIST - ${fullLaudo.ordemServico}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.2;
            color: #000;
            background: white;
            padding: 2.5px;
        }
        
        .page {
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2.2px;
            border-bottom: 0.5px solid #000;
            padding-bottom: 0.7px;
            position: relative;
        }
        
        .company-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            margin-bottom: 1.5px;
        }
        
        .header-logo {
            max-height: 40px;
            max-width: 120px;
            object-fit: contain;
        }
        
        .company-info {
            font-size: 8px;
            margin-bottom: 0.8px;
        }
        
        .title {
            font-size: 10px;
            font-weight: bold;
            margin: 0.8px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.7px;
            margin-bottom: 2.2px;
        }
        
        .info-box {
            border: 0.3px solid #000;
            padding: 0.8px;
            font-size: 8px;
        }
        
        .client-vehicle-section {
            border: 0.3px solid #000;
            margin-bottom: 2.2px;
            padding: 1.5px;
        }
        
        .section-header {
            font-weight: bold;
            font-size: 10px;
            background: #f0f0f0;
            padding: 1.6px;
            margin-bottom: 2.4px;
        }

        /* LAYOUT DE 3 COLUNAS SUPER COMPACTO */
        .items-container {
            border: 0.3px solid #000;
            padding: 0.7px;
        }
        
        .items-title {
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 0.8px;
            border-bottom: 0.3px solid #000;
            padding-bottom: 0.4px;
        }
        
        .items-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 0.4px;
            font-size: 7.5px;
        }
        
        .column {
            border: 0.2px solid #ccc;
            padding: 0.35px;
        }
        
        .field {
            margin-bottom: 0.5px;
            padding: 0.5px;
            font-size: 8px;
            line-height: 1.2;
        }
        
        .field .label {
            display: inline;
            font-size: 8px;
        }
        
        .field .checkbox {
            display: inline;
            width: 14px;
            height: 14px;
            font-size: 9px;
            line-height: 12px;
            margin-left: 2px;
            vertical-align: middle;
        }
        
        .field-text {
            margin-bottom: 0.45px;
            padding: 0.45px;
        }
        
        .field-text .value {
            font-weight: bold;
            font-size: 9px;
        }
        
        .label {
            flex-grow: 1;
            font-size: 8px;
            line-height: 1.2;
        }
        
        .checkbox {
            width: 14px;
            height: 14px;
            border: 0.3px solid #000;
            display: inline-block;
            text-align: center;
            font-size: 9px;
            line-height: 12px;
            margin-left: 1px;
        }
        
        .ok { background: #90EE90; }
        .nok { background: #FFB6C1; }
        .na { background: #E6E6FA; }
        
        .subsection-title {
            font-weight: bold;
            font-size: 7px;
            text-decoration: underline;
            margin: 0.45px 0 0.45px 0;
            line-height: 1.0;
        }
        
        /* MEDIÇÃO DOS PNEUS - AUMENTADA SIGNIFICATIVAMENTE */
        .measurement-section {
          border: 1px solid #000;
          margin: 3px 0;
          padding: 8px;
          font-size: 12px;
          background: #f8f8f8;
        }

        .measurement-title {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
          border-bottom: 2px solid #000;
          padding-bottom: 4px;
          color: #000;
        }

        .measurement-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          margin-bottom: 8px;
          font-size: 10px;
        }

        .header-field {
          border: 1px solid #000;
          padding: 4px;
          text-align: center;
          background: #e0e0e0;
          font-weight: bold;
        }

        /* GRID PRINCIPAL - 4 COLUNAS EXPANDIDO */
        .measurement-grid-4col {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 2fr;
          gap: 2px;
          border: 2px solid #000;
          font-size: 10px;
          background: white;
          padding: 4px;
        }

        .measurement-grid-4col .label {
          padding: 6px;
          font-style: italic;
          text-align: center;
          border: 1px solid #ccc;
          background: #f5f5f5;
          font-size: 9px;
          line-height: 1.2;
          font-weight: 500;
        }

        .measurement-grid-4col .header {
          background: #d0d0d0;
          border: 1px solid #000;
          padding: 6px;
          font-weight: bold;
          font-size: 11px;
          text-align: center;
        }

        .measurement-grid-4col .value {
          border: 1px solid #ccc;
          padding: 4px;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          background: white;
        }

        /* Estilos para pneus GRANDES */
        .pneu-value {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background-image: url('${pneuSvgBase64}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
          color: #000;
          margin: 2px;
          position: relative;
          border: 1px solid #333;
        }

        .pneu-value::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          z-index: 1;
        }

        .pneu-value span {
          position: relative;
          z-index: 2;
          font-weight: bold;
          color: #000;
          font-size: 8px;
        }

        .par-values {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          padding: 4px;
        }

        .single-value {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          padding: 4px;
        }

        .measurement-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
          font-size: 10px;
        }

        .footer-field {
          border: 1px solid #000;
          padding: 6px;
          background: #f0f0f0;
        }
        
        /* SEÇÃO FINAL UNIFICADA - LAYOUT 2 COLUNAS EXPANDIDA */
        .final-unified-section {
            border: 2px solid #000;
            margin: 8px 0;
            padding: 12px;
            min-height: 120px;
            background: #f8f8f8;
        }
        
        .final-grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            height: 100%;
        }
        
        .left-column, .right-column {
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
        }
        
        .section-block {
            flex: 1;
            min-height: 40px;
        }
        
        .section-subtitle {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 6px;
            border-bottom: 1px solid #333;
            padding-bottom: 4px;
            text-align: center;
            color: #000;
        }
        
        .section-content {
            font-size: 10px;
            line-height: 1.3;
            color: #333;
        }
        
        /* SISTEMA DE MARCA D'ÁGUA IGUAL AO LIT - 3 LOGOS */
        .logo-watermark-main {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            z-index: -1;
            pointer-events: none;
            width: 500px;
            height: 200px;
        }
        
        .logo-watermark-secondary {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.06;
            z-index: -2;
            pointer-events: none;
            width: 300px;
            height: 120px;
        }
        
        .logo-watermark-tertiary {
            position: fixed;
            bottom: 15%;
            right: 10%;
            opacity: 0.05;
            z-index: -3;
            pointer-events: none;
            width: 200px;
            height: 80px;
        }
        
        .logo-watermark-main img,
        .logo-watermark-secondary img,
        .logo-watermark-tertiary img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: grayscale(100%);
        }
        
        @media print {
            body { padding: 5px; }
            .page { margin: 0; }
            * { break-inside: avoid; }
            /* MARCA D'ÁGUA PARA IMPRESSÃO - PADRÃO LIT */
            .logo-watermark-main {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                opacity: 0.08 !important;
                z-index: -1 !important;
                pointer-events: none !important;
                width: 500px !important;
                height: 200px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-secondary {
                position: fixed !important;
                top: 30% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                opacity: 0.06 !important;
                z-index: -2 !important;
                pointer-events: none !important;
                width: 300px !important;
                height: 120px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-tertiary {
                position: fixed !important;
                bottom: 15% !important;
                right: 10% !important;
                opacity: 0.05 !important;
                z-index: -3 !important;
                pointer-events: none !important;
                width: 200px !important;
                height: 80px !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .logo-watermark-main img,
            .logo-watermark-secondary img,
            .logo-watermark-tertiary img {
                width: 100% !important;
                height: 100% !important;
                object-fit: contain !important;
                filter: grayscale(100%) !important;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        
        <div class="header">
            ${logoBase64 ? `
                <div class="company-header">
                    <img src="${logoBase64}" alt="Logo" class="header-logo">
                    <div class="company-info">
                        EMPRESA EXEMPLO INSPEÇÕES LTDA - Rua Exemplo 100 - Cidade Exemplo /RS - Fone: (11) 90000-0000
                    </div>
                </div>
            ` : `
                <div class="company-info" style="text-align: center; margin-bottom: 2px;">
                    EMPRESA EXEMPLO INSPEÇÕES LTDA - Rua Exemplo 100 - Cidade Exemplo /RS - Fone: (11) 90000-0000
                </div>
            `}
            <div class="title">Laudo CHECKLIST - Relatório de Preventiva</div>
            <div style="font-size: 6px;">DATA: ${format(new Date(fullLaudo.dataEmissao), 'dd/MM/yyyy')}</div>
            ${checklistData.validade ? `<div style="font-size: 6px;">VALIDADE: ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}</div>` : ''}
        </div>

        <div class="info-grid">
            <div class="info-box">
                <strong>Cód. Temporal:</strong> ${fullLaudo.codTemporal || ''}
            </div>
            <div class="info-box">
                <strong>Ordem de Serviço N°:</strong> ${fullLaudo.ordemServico}
            </div>
            ${checklistData.validade ? `<div class="info-box">
                <strong>Validade:</strong> ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}
            </div>` : ''}
        </div>

        <div class="client-vehicle-section">
            <div class="section-header">1 - CLIENTE</div>
            <div style="font-size: 6px;">
                <strong>${fullLaudo.client.name || ''}</strong><br>
                <strong>CNPJ/CPF:</strong> ${fullLaudo.client.cnpj || ''}<br>
                <strong>Endereço:</strong> ${fullLaudo.client.addressStreet || ''}, ${fullLaudo.client.addressNumber || ''}
            </div>
        </div>

        <div class="client-vehicle-section">
            <div class="section-header">2 - VEÍCULO</div>
            <div style="font-size: 6px;">
                <strong>Marca/Modelo:</strong> ${fullLaudo.vehicle.marcaModelo || ''} |
                <strong>Chassi:</strong> ${fullLaudo.vehicle.numeroChassi || ''} |
                <strong>Placa:</strong> ${fullLaudo.vehicle.placa || ''} |
                <strong>Ano:</strong> ${fullLaudo.vehicle.anoFabricacaoModelo || ''}
            </div>
        </div>

        <div class="items-container">
            <div class="items-title">ITENS INSPECIONADOS</div>
            
            <div class="items-grid">
                <!-- COLUNA 1: Estrutura Física -->
                <div class="column">
                    <div class="subsection-title">Cabina</div>
                    ${renderField('Estado Geral', 'cabina_estadoGeral')}
                    ${renderField('Estado Degraus de Acesso', 'cabina_estadoDegraus')}
                    ${renderField('Portas', 'cabina_portas')}
                    ${renderField('Integridade e Funcionamento', 'cabina_integridadeFuncionamento')}
                    
                    <div class="subsection-title">Bancos</div>
                    ${renderField('Estado Geral', 'cabina_bancosEstadoGeral')}
                    ${renderField('Fixação', 'cabina_bancosFixacao')}
                    
                    <div class="subsection-title">Equipamentos de Segurança</div>
                    ${renderField('Cinto de Segurança', 'seguranca_cintoSeguranca')}
                    ${renderField('Extintor de Incêndio da Cabine', 'seguranca_extintorCabine')}
                    ${renderField('Extintor de Incêndio do Tanque', 'seguranca_extintorTanque')}
                    ${renderField('Triângulo', 'seguranca_triangulo')}
                    ${renderField('Integridade dos Espelhos Retrov.', 'seguranca_espelhosRetrovisores')}
                    
                    <div class="subsection-title">Pedais de Embreagem e Freio</div>
                    ${renderField('Operacionalidade', 'pedais_embragemFreio')}
                    ${renderField('Superfície de Pisomante', 'pedais_superficiePisomante')}
                    ${renderField('Trincas', 'pedais_trincas')}
                    
                    <div class="subsection-title">Para-Brisa</div>
                    ${renderField('Integridade, Visibilidade', 'paraBrisa_integridadeVisibilidade')}
                    ${renderField('Trincas', 'paraBrisa_trincas')}
                    
                    <div class="subsection-title">Para-Sol</div>
                    ${renderField('Integridade, Fixação, Estado', 'paraSol_integridadeFixacao')}
                    
                    <div class="subsection-title">Reservatório de Combustível</div>
                    ${renderField('Integridade, Fixação, Tubulação', 'reservatorio_integridadeFixacao')}
                    ${renderField('Vazamento', 'reservatorio_vazamento')}
                    ${renderField('Material', 'reservatorio_material')}
                    ${renderField('Reservatório de Comb. Suplementar', 'reservatorio_suplementar')}
                </div>

                <!-- COLUNA 2: Sistemas Mecânicos -->
                <div class="column">
                    <div class="subsection-title">Conjunto Motor/Caixa de Mudanças</div>
                    ${renderField('Ancoragem', 'motor_ancoragem')}
                    ${renderField('Proteção do Motor', 'motor_protecao')}
                    ${renderField('Sistema de Direção', 'motor_sistemaOperacao')}
                    ${renderField('Funcionamento, Folgas, Soldas', 'motor_funcionamentoFolgas')}
                    ${renderField('Óleo Hidraul., Vazamentos, Tubulação', 'motor_oleoHidraulico')}
                    ${renderField('Alinhamento de Direção', 'motor_alinhamentoDirecao')}
                    ${renderField('Transmissão', 'motor_transmissao')}
                    ${renderField('Eixo Cardã, Integridade, Cinta', 'motor_eixoCarda')}
                    ${renderField('Cruzetas e Mancais', 'motor_cruzetasMancais')}
                    
                    <div class="subsection-title">Sistema de Escapamento</div>
                    ${renderField('Integridade', 'motor_sistemaEscapamento')}
                    ${renderField('Silenciosos (Produtos da Classe 3)', 'motor_integridade')}
                    
                    <div class="subsection-title">Chassi</div>
                    ${renderField('Estacionamento, Freios, Reparo', 'motor_estacionamento')}
                    ${renderField('Proteção Pino do Arlinhão, do Chassi', 'motor_protecaoPino')}
                    ${renderField('Limite de Operacidade', 'motor_limiteOperacidade')}
                    
                    <div class="subsection-title">Sistema de Iluminação</div>
                    ${renderField('Farol Principal', 'iluminacao_farolPrincipal')}
                    ${renderField('Farol Penetrador', 'iluminacao_farolPenetrador')}
                    ${renderField('Lanterna da Placa', 'iluminacao_lanternaPlaca')}
                    ${renderField('Sistema de Sinalização', 'iluminacao_sinalizacao')}
                    ${renderField('Lanterna de Freio', 'iluminacao_lanternaFreio')}
                    ${renderField('Retrorefletores', 'iluminacao_retrorefletores')}
                    ${renderField('Delimitadoras Dianteira', 'iluminacao_delimitadoraDianteira')}
                    ${renderField('Delimitadoras Traseira', 'iluminacao_delimitadoraTraseira')}
                    ${renderField('Direção Dianteira', 'iluminacao_direcaoDianteira')}
                    ${renderField('Direção Traseira', 'iluminacao_direcaoTraseira')}
                    ${renderField('Intermitente Direção', 'iluminacao_intermitenteDirecao')}
                    ${renderField('Intermitente Advertência', 'iluminacao_intermitenteAdvertencia')}
                    ${renderField('Luz Marcha-à-Ré', 'iluminacao_marchaRe')}
                    ${renderField('Luz de Identificação', 'iluminacao_identificacao')}
                    ${renderField('Luz de Emergência', 'iluminacao_emergencia')}
                </div>

                <!-- COLUNA 3: Eixos, Suspensão, Rodas, Pneus e Sistemas Especiais -->
                <div class="column">
                    <div class="subsection-title">Eixos</div>
                    ${renderField('Trincas ou Soldas Observáveis', 'eixos_trincasSoldas')}
                    ${renderField('Integridade do Eixo Direcional', 'eixos_integridadeDirecional')}
                    ${renderField('Mecanismo de Elevação do Eixo', 'eixos_mecanismoElevacao')}
                    ${renderField('Integridade e Operacionalidade', 'eixos_integridadeOperacionalidade')}
                    
                    <div class="subsection-title">Suspensão</div>
                    ${renderField('Amortecedor', 'suspensao_amortecedor')}
                    ${renderField('Balancins', 'suspensao_balancins')}
                    ${renderField('Barra Estabilizadora', 'suspensao_barraEstabilizadora')}
                    ${renderField('Feixes de Molas', 'suspensao_feixesMolas')}
                    ${renderField('Braço Tensor', 'suspensao_bracoTensor')}
                    
                    <div class="subsection-title">Suspensão Pneumática</div>
                    ${renderField('Integridade e Vazamentos', 'suspensao_pneumaticaMangueiras')}
                    
                    <div class="subsection-title">Rodas</div>
                    ${renderField('Elementos de Fixação', 'rodas_elementosFixacao')}
                    ${renderField('Integridade dos Aros e Rodas', 'rodas_integridadeAros')}
                    ${renderField('Existência e Estado de Elementos', 'rodas_existenciaEstado')}
                    ${renderField('Integridade dos Anéis de Fixação', 'rodas_integridadeAneis')}
                    ${renderField('Estado dos Rolos, Substâncias', 'rodas_estadoRolos')}
                    
                    <div class="subsection-title">Pneus</div>
                    ${renderField('Pneu Dianteiro (Recondição)', 'pneus_dianteiro')}
                    ${renderTextField('Sulcos (Profund.m.m.)', 'pneus_sulcosProfundidade', '12.2')}
                    ${renderField('Paridade de Pneus no Mesmo Eixo', 'pneus_paridadeMesmoEixo')}
                    ${renderField('Flancos (Raspos ou Cortes)', 'pneus_flancos')}
                    ${renderField('Banda Rodagem (Raspos, Cortes)', 'pneus_bandaRodagem')}
                    ${renderTextField('Pneu Sobresalente m.m.', 'pneus_sobresalente', '5.8')}
                    
                    <div class="subsection-title">Sistema de Freio</div>
                    ${renderField('Freio Estacionamento', 'freio_estacionamento')}
                    ${renderField('Freio de Serviço', 'freio_servico')}
                    ${renderField('Estado Compressor', 'freio_estadoCompressor')}
                    ${renderField('Correias Compressor', 'freio_correiasCompressor')}
                    ${renderField('Fixação/Conexões', 'freio_fixacaoConexoes')}
                    ${renderField('Vazamentos', 'freio_vazamentos')}
                    ${renderField('Lonas de Freio', 'freio_lonasFreio')}
                    ${renderField('Condição das Lonas', 'freio_condicaoLonas')}
                    ${renderField('Fixação da Lona', 'freio_fixacaoLona')}
                    ${renderField('Espessura das Lonas', 'freio_espessuraLonas')}
                    ${renderField('Indicador Pressão', 'freio_indicadorPressao')}
                    <div class="subsection-title">Reservatório de Ar</div>
                    ${renderField('Integridade', 'reservatorioAr_integridade')}
                    ${renderField('Fixação', 'reservatorioAr_fixacao')}
                    ${renderField('Vazamentos', 'reservatorioAr_vazamentos')}
                    ${renderField('Válvulas', 'reservatorioAr_valvulas')}
                    ${renderTextField('Pressão Op.', 'reservatorioAr_pressaoOperacional')}
                    ${renderField('Sistema de Dreno', 'reservatorioAr_dreno')}
                </div>
            </div>
        </div>

        <!-- NOVA SEÇÃO: COMPRESSOR DE AR -->
        <div style="margin: 0.5px 0; font-size: 6px; border: 0.3px solid #000; padding: 1px;">
            <div class="subsection-title" style="text-align: center; font-weight: bold; margin-bottom: 1px;">Compressor de ar</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5px;">
                ${renderTextField('Tempo Recuperação Compressor (seg)', 'compressor_tempoRecuperacao', '29 S')}
                ${renderTextField('Pressão Inicial (Bar)', 'compressor_pressaoInicial', '9')}
                ${renderTextField('Pressão Final (Bar)', 'compressor_pressaoFinal', '8')}
                ${renderTextField('Perda ar %', 'compressor_perdaAr', '11.1%')}
            </div>
        </div>

        <!-- SISTEMAS ELÉTRICOS E ESPECIAIS ULTRA COMPACTOS -->
        <div style="margin: 0.5px 0; font-size: 4.5px;">
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5px;">
                ${renderField('Cronotacógrafo', 'cronografo_funcionamento')}
                ${renderField('Buzina', 'buzina_existenciaFuncionamento')}
                ${renderField('Limpador Para-Brisa', 'limpador_operacionalidade')}
                ${renderField('Integridade Limpador', 'limpador_integridadeOperacionalidade')}
            </div>
        </div>

        <!-- SEÇÕES ESPECIAIS EM GRADE ULTRA COMPACTA -->
        <div style="margin: 0.5px 0; font-size: 4.5px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5px;">
            ${renderField('Sistema Alarme Ré', 'alarmeRe_funcionamento')}
            ${renderField('Para-Choque Traseiro', 'paraChoque_integridade')}
            ${renderField('Para-Lama', 'paraLama_integridade')}
            ${renderField('Dispositivos Refletivos', 'refletivos_integridade')}
            ${renderField('Chassi Porta-Contêiner', 'chassiContainer_atendimentoRes725')}
            ${renderField('Dolly', 'dolly_estadoCambio')}
            ${renderField('Pinos Semi-Reboque', 'pinosSemi_integridade')}
            ${renderField('Quinta-Roda', 'quintaRoda_integridade')}
            ${renderField('Pino-Rei', 'pinoRei_fixacaoVertical')}
            ${renderField('Conjunto de Engate', 'engate_estadoRotula')}
        </div>

        <!-- CAMPOS DE TEXTO ADICIONAIS -->
        <div style="margin: 0.5px 0; font-size: 4.5px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5px;">
            ${renderTextField('Largura Elétrico', 'eletricos_largura')}
            ${renderTextField('Diâmetro Pino-Rei (mm)', 'pinoRei_diametroMm')}
        </div>

        <!-- MEDIÇÃO DOS PNEUS - ESQUEMA COMPACTO -->
        <div class="measurement-section">
          <div class="measurement-title">Medição dos Pneus</div>
          
          <!-- Campos superiores compactados -->
          <div class="measurement-header">
            <div>Tipo: ${checklistData.medicao_tipoPneu || '(T) Traseiro | (L) Lado'}</div>
            <div>Modelo: ${checklistData.medicao_modelo || '275/80 R 22.5'}</div>
            <div>Tipo: ${checklistData.medicao_tipo || 'LISO'}</div>
          </div>
          
          <!-- Grid 4 colunas EXATO -->
          <div class="measurement-grid-4col">
            <!-- Cabeçalhos -->
            <div></div>
            <div class="header">lado esquerdo</div>
            <div class="header">lado direito</div>
            <div></div>
            
            <!-- LINHA 1 - Visual de pneu -->
            <div class="label">eixo 1 esquerdo dianteiro do caminhão</div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha1_esquerdo)}</span>
              </div>
            </div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha1_direito)}</span>
              </div>
            </div>
            <div class="label">eixo 1 direito dianteiro do caminhão</div>
            
            <!-- LINHA 2 - Visual de pneu -->
            <div class="label">eixo 2 esquerdo dianteiro do caminhão</div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha2_esquerdo, 'X')}</span>
              </div>
            </div>
            <div class="single-value">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha2_direito, 'X')}</span>
              </div>
            </div>
            <div class="label">eixo 2 direito dianteiro do caminhão</div>
            
            <!-- LINHA 3 - PARES com visual de pneu -->
            <div class="label">eixo 1 traseiro do caminhão lado esquerdo</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha3_direito2)}</span>
              </div>
            </div>
            <div class="label">eixo 1 traseiro do caminhão lado direito</div>
            
            <!-- LINHA 4 - PARES com visual de pneu -->
            <div class="label">eixo 2 traseiro do caminhão lado esquerdo</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha4_direito2)}</span>
              </div>
            </div>
            <div class="label">eixo 2 traseiro do caminhão lado direito</div>
            
            <!-- LINHA 5 - PARES com visual de pneu -->
            <div class="label">eixo 3 traseiro do caminhão lado esquerdo</div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_esquerdo1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_esquerdo2)}</span>
              </div>
            </div>
            <div class="par-values">
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_direito1)}</span>
              </div>
              <div class="pneu-value">
                <span>${mapMedicaoValue(checklistData.medicao_linha5_direito2)}</span>
              </div>
            </div>
            <div class="label">eixo 3 traseiro do caminhão lado direito</div>
          </div>
          
          <!-- Campos inferiores -->
          <div class="measurement-footer">
            <div>Estado Geral: ${checklistData.medicao_estadoGeral || 'Bom | Regular | Ruim'}</div>
            <div>Observações: ${checklistData.medicao_observacoes || ''}</div>
          </div>
        </div>

        <!-- SEÇÃO FINAL UNIFICADA - 2 COLUNAS -->
        <div class="final-unified-section">
            <div class="final-grid-2col">
                <div class="left-column">
                    <div class="section-block">
                        <div class="section-subtitle">Observações</div>
                        <div class="section-content">
                            ${observacoes.split('--- DADOS CHECKLIST ---')[0] || observacoes || 'Nenhuma observação específica.'}
                        </div>
                    </div>
                    <div class="section-block">
                        <div class="section-subtitle">Normas Aplicáveis</div>
                        <div class="section-content">
                            Portaria nº457/08, POP-OP001/0418
                        </div>
                    </div>
                </div>
                <div class="right-column">
                    <div class="section-block">
                        <div class="section-subtitle">RESULTADO INSPEÇÃO</div>
                        <div class="section-content">
                            <strong>Marcação:</strong> ✓ Aprovado | R Reprovado | ✗ Não Aplicável<br>
                            <strong>APROVADO APÓS REINSPEÇÃO EM:</strong> _______________
                        </div>
                    </div>
                    <div class="section-block">
                        <div class="section-subtitle">Inspetor Emissor</div>
                        <div class="section-content">
                            _________________________________<br>
                            Nome: ______________________________<br>
                            Assinatura: _________________________
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div style="text-align: center; font-size: 4px; margin-top: 2px;">
            Documento gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')} - Sistema GTS
        </div>
    </div>
</body>
</html>`;

      // Criar e baixar o arquivo HTML
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-checklist-${fullLaudo.ordemServico}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage('HTML completo gerado com sucesso!');

    } catch (e) {
      console.error('Falha ao gerar HTML', e);
      setMessage('Erro: Não foi possível gerar o HTML.');
    }
  };

  const generateChecklistPdf = async (laudoId: string) => {
    try {
      const [laudoDetailsRes, adminSettingsRes, fontBytesRes] = await Promise.all([
        fetch(`/api/laudos/${laudoId}`),
        fetch('/api/admin/settings'),
        fetch('/DejaVuSans.ttf')
      ]);

      if (!laudoDetailsRes.ok || !adminSettingsRes.ok || !fontBytesRes.ok) {
        throw new Error('Falha ao buscar dados para geração do PDF.');
      }

      const fullLaudo: Laudo & { client: Client; vehicle: Vehicle } = await laudoDetailsRes.json();
      const adminSettings: AdminSetting = await adminSettingsRes.json();
      const fontBytes = await fontBytesRes.arrayBuffer();
      
      // Parse dos dados do checklist das observações
      const observacoes = fullLaudo.observacoes || '';
      let checklistData: any = {};
      
      try {
        const checklistStart = observacoes.indexOf('--- DADOS CHECKLIST ---');
        if (checklistStart !== -1) {
          const jsonStart = observacoes.indexOf('{', checklistStart);
          if (jsonStart !== -1) {
            const jsonData = observacoes.substring(jsonStart);
            checklistData = JSON.parse(jsonData);
          }
        }
      } catch (e) {
        console.error('Erro ao parse dos dados do checklist:', e);
      }

      let logoImageData = null;
      if (adminSettings.companyLogoUrl) {
        try {
          const logoResponse = await fetch(adminSettings.companyLogoUrl);
          if (logoResponse.ok) {
            logoImageData = await logoResponse.arrayBuffer();
          }
        } catch (e) {
          console.error('Erro ao buscar logo:', e);
        }
      }

      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(fontBytes);

      const drawText = (text: string, x: number, y: number, size: number = 8, isBold: boolean = false) => {
        page.drawText(text || '', {
          x,
          y,
          font,
          size,
          color: rgb(0, 0, 0)
        });
      };

      const drawRect = (x: number, y: number, w: number, h: number, filled: boolean = false, fillColor: number = 0.9, borderWidth: number = 0.5) => {
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          borderColor: rgb(0, 0, 0),
          borderWidth: borderWidth,
          color: filled ? rgb(fillColor, fillColor, fillColor) : undefined
        });
      };

      const drawCheckbox = (x: number, y: number, value: string, size: number = 8) => {
        const boxSize = 8;
        drawRect(x, y, boxSize, boxSize, false, 0.9, 0.5);
        
        if (value === 'OK') {
          drawText('✓', x + 1, y + 1, 6);
        } else if (value === 'NOK') {
          drawText('✗', x + 1, y + 1, 6);
        } else if (value === 'NA') {
          drawText('N', x + 0.5, y + 1, 5);
        }
      };

      // Logo da empresa e marca d'água
      if (logoImageData) {
        try {
          let logoImage;
          const logoUrl = adminSettings.companyLogoUrl?.toLowerCase() || '';
          
          if (logoUrl.includes('.png')) {
            logoImage = await pdfDoc.embedPng(logoImageData);
          } else if (logoUrl.includes('.jpg') || logoUrl.includes('.jpeg')) {
            logoImage = await pdfDoc.embedJpg(logoImageData);
          } else {
            logoImage = await pdfDoc.embedPng(logoImageData);
          }
          
          // Logo pequeno no cabeçalho
          page.drawImage(logoImage, {
            x: 40,
            y: height - 40,
            width: 60,
            height: 20
          });

          // MARCA D'ÁGUA - Logo grande no centro com transparência
          page.drawImage(logoImage, {
            x: width / 2 - 120, // Centralizado horizontalmente
            y: height / 2 - 60, // Centralizado verticalmente
            width: 240,
            height: 120,
            opacity: 0.08 // Transparência bem sutil para não atrapalhar a leitura
          });

          // MARCA D'ÁGUA - Segundo logo menor no canto inferior direito
          page.drawImage(logoImage, {
            x: width - 150,
            y: 100,
            width: 100,
            height: 50,
            opacity: 0.06 // Ainda mais transparente
          });
          
        } catch (e) {
          console.error('Erro ao incorporar logo da empresa:', e);
        }
      }

      // Cabeçalho
      drawText('EMPRESA EXEMPLO INSPEÇÕES LTDA - Rua Exemplo 100 - Cidade Exemplo /RS - Fone: (11) 90000-0000', 110, height - 30, 7);
      drawText('Laudo CHECKLIST - Relatório de Preventiva', 220, height - 45, 12);
      drawText(`DATA: ${format(new Date(fullLaudo.dataEmissao), 'dd/MM/yyyy')}`, 480, height - 30, 8);
      
      // Adicionar VALIDADE se disponível
      if (checklistData.validade) {
        drawText(`VALIDADE: ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}`, 480, height - 45, 8);
      }

      // Código, Ordem de Serviço e Validade (ajustando layout)
      const boxWidth = checklistData.validade ? 173 : 180;
      const boxCount = checklistData.validade ? 3 : 2;
      
      drawRect(40, height - 70, boxWidth, 15);
      drawText(`Cód. Temporal: ${fullLaudo.codTemporal || ''}`, 42, height - 62, 8);

      drawRect(40 + boxWidth + 5, height - 70, boxWidth, 15);
      drawText(`Ordem de Serviço N°: ${fullLaudo.ordemServico}`, 42 + boxWidth + 7, height - 62, 8);
      
      if (checklistData.validade) {
        drawRect(40 + (boxWidth + 5) * 2, height - 70, boxWidth, 15);
        drawText(`Validade: ${format(new Date(checklistData.validade), 'dd/MM/yyyy')}`, 42 + (boxWidth + 5) * 2 + 2, height - 62, 8);
      }

      let currentY = height - 85;

      // Seção 1 - CLIENTE
      drawRect(40, currentY - 40, 520, 40, false, 0.85);
      drawText('1 - CLIENTE', 42, currentY - 12, 9);
      
      // Dados do cliente
      drawText(`${fullLaudo.client.name || ''}`, 42, currentY - 25, 8);
      drawText(`CNPJ/CPF: ${fullLaudo.client.cnpj || ''}`, 350, currentY - 25, 8);
      drawText(`${fullLaudo.client.addressStreet || ''}, ${fullLaudo.client.addressNumber || ''}`, 42, currentY - 37, 8);
      
      currentY -= 50;

      // Seção 2 - VEÍCULO
      drawRect(40, currentY - 40, 520, 40, false, 0.85);
      drawText('2 - VEÍCULO', 42, currentY - 12, 9);
      
      // Dados do veículo
      drawText(`${fullLaudo.vehicle.marcaModelo || ''}`, 42, currentY - 25, 8);
      drawText(`${fullLaudo.vehicle.numeroChassi || ''}`, 200, currentY - 25, 8);
      drawText(`${fullLaudo.vehicle.placa || ''}`, 400, currentY - 25, 8);
      drawText(`${fullLaudo.vehicle.anoFabricacaoModelo || ''}`, 480, currentY - 25, 8);
      drawText('N.A', 42, currentY - 37, 8);
      drawText('N.A', 120, currentY - 37, 8);
      drawText('N.A', 200, currentY - 37, 8);
      drawText(`${fullLaudo.dataVerifPinoRei ? format(new Date(fullLaudo.dataVerifPinoRei), 'dd/MM/yyyy') : ''}`, 300, currentY - 37, 8);

      currentY -= 60;

      // Seção 3 - ITENS INSPECIONADOS (Principal)
      drawRect(40, currentY - 380, 520, 15, false, 0.7);
      drawText('ITENS INSPECIONADOS', 250, currentY - 10, 10);
      
      currentY -= 25;

      // Definir colunas com alinhamento perfeito dos checkboxes
      const col1X = 42;
      const col2X = 200; // Ajustado para melhor alinhamento
      const col3X = 358; // Ajustado para melhor alinhamento
      const checkboxOffset = 140; // Espaço otimizado para alinhamento vertical perfeito

      // COLUNA 1 - Cabina e Equipamentos
      let col1Y = currentY;
      
      // Cabina
      drawText('Cabina', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Estado Geral', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_estadoGeral || '');
      col1Y -= 9;
      drawText('Estado Degraus de Acesso', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_estadoDegraus || '');
      col1Y -= 9;
      drawText('Portas', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_portas || '');
      col1Y -= 9;
      drawText('Integridade e Funcionamento', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_integridadeFuncionamento || '');
      col1Y -= 12;
      
      // Bancos
      drawText('Bancos', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Estado Geral', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_bancosEstadoGeral || '');
      col1Y -= 9;
      drawText('Fixação', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.cabina_bancosFixacao || '');
      col1Y -= 12;

      // Equipamentos de Segurança
      drawText('Equipamentos de Segurança', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Cinto de Segurança', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.seguranca_cintoSeguranca || '');
      col1Y -= 9;
      drawText('Extintor de Incêndio da Cabine', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.seguranca_extintorCabine || '');
      col1Y -= 9;
      drawText('Extintor de Incêndio do Tanque', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.seguranca_extintorTanque || '');
      col1Y -= 9;
      drawText('Triângulo', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.seguranca_triangulo || '');
      col1Y -= 9;
      drawText('Integridade dos Espelhos Retrov.', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.seguranca_espelhosRetrovisores || '');
      col1Y -= 12;

      // Para-Brisa
      drawText('Para-Brisa', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Integridade, Visibilidade', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.paraBrisa_integridadeVisibilidade || '');
      col1Y -= 9;
      drawText('Trincas', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.paraBrisa_trincas || '');
      col1Y -= 12;

      // Para-Sol
      drawText('Para-Sol', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Integridade, Fixação, Estado', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.paraSol_integridadeFixacao || '');
      col1Y -= 12;

      // Reservatório de Combustível
      drawText('Reservatório de Combustível', col1X, col1Y, 7);
      col1Y -= 12;
      drawText('Integridade, Fixação, Tubulação', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.reservatorio_integridadeFixacao || '');
      col1Y -= 9;
      drawText('Vazamento', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.reservatorio_vazamento || '');
      col1Y -= 9;
      drawText('Material', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.reservatorio_material || '');
      col1Y -= 9;
      drawText('Reservatório de Comb. Suplementar', col1X, col1Y, 6);
      drawCheckbox(col1X + checkboxOffset, col1Y - 2, checklistData.reservatorio_suplementar || '');

      // COLUNA 2 - Motor e Sistemas
      let col2Y = currentY;
      
      // Conjunto Motor/Caixa de Mudanças
      drawText('Conjunto Motor/Caixa de Mudanças', col2X, col2Y, 7);
      col2Y -= 12;
      drawText('Ancoragem', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_ancoragem || '');
      col2Y -= 9;
      drawText('Proteção do Motor', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_protecao || '');
      col2Y -= 9;
      drawText('Sistema de Direção', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_sistemaOperacao || '');
      col2Y -= 9;
      drawText('Funcionamento, Folgas, Soldas', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_funcionamentoFolgas || '');
      col2Y -= 9;
      drawText('Óleo Hidraul., Vazamentos, Tubulação', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_oleoHidraulico || '');
      col2Y -= 9;
      drawText('Alinhamento de Direção', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_alinhamentoDirecao || '');
      col2Y -= 9;
      drawText('Transmissão', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_transmissao || '');
      col2Y -= 9;
      drawText('Eixo Cardã, Integridade, Cinta', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_eixoCarda || '');
      col2Y -= 9;
      drawText('Cruzetas e Mancais', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_cruzetasMancais || '');
      col2Y -= 12;

      // Sistema de Escapamento
      drawText('Sistema de Escapamento', col2X, col2Y, 7);
      col2Y -= 12;
      drawText('Integridade', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_sistemaEscapamento || '');
      col2Y -= 9;
      drawText('Silenciosos (Produtos da Classe 3)', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_integridade || '');
      col2Y -= 12;

      // Chassi
      drawText('Chassi', col2X, col2Y, 7);
      col2Y -= 12;
      drawText('Estacionamento, Freios, Reparo', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_estacionamento || '');
      col2Y -= 9;
      drawText('Proteção Pino do Arlinhão, do Chassi', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_protecaoPino || '');
      col2Y -= 9;
      drawText('Limite de Operacidade', col2X, col2Y, 6);
      drawCheckbox(col2X + checkboxOffset, col2Y - 2, checklistData.motor_limiteOperacidade || '');

      // COLUNA 3 - Eixos, Suspensão, Rodas
      let col3Y = currentY;
      
      // Eixos
      drawText('Eixos', col3X, col3Y, 7);
      col3Y -= 12;
      drawText('Trincas ou Soldas Observáveis', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.eixos_trincasSoldas || '');
      col3Y -= 9;
      drawText('Integridade do Eixo Direcional', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.eixos_integridadeDirecional || '');
      col3Y -= 9;
      drawText('Mecanismo de Elevação do Eixo', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.eixos_mecanismoElevacao || '');
      col3Y -= 9;
      drawText('Integridade e Operacionalidade', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.eixos_integridadeOperacionalidade || '');
      col3Y -= 12;

      // Suspensão
      drawText('Suspensão', col3X, col3Y, 7);
      col3Y -= 12;
      drawText('Amortecedor', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_amortecedor || '');
      col3Y -= 9;
      drawText('Balancins', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_balancins || '');
      col3Y -= 9;
      drawText('Barra Estabilizadora', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_barraEstabilizadora || '');
      col3Y -= 9;
      drawText('Feixes de Molas', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_feixesMolas || '');
      col3Y -= 9;
      drawText('Braço Tensor', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_bracoTensor || '');
      col3Y -= 12;

      // Suspensão Pneumática
      drawText('Suspensão Pneumática', col3X, col3Y, 7);
      col3Y -= 12;
      drawText('Integridade e Vazamentos', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.suspensao_pneumaticaMangueiras || '');
      col3Y -= 12;

      // Rodas
      drawText('Rodas', col3X, col3Y, 7);
      col3Y -= 12;
      drawText('Elementos de Fixação', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.rodas_elementosFixacao || '');
      col3Y -= 9;
      drawText('Integridade dos Aros e Rodas', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.rodas_integridadeAros || '');
      col3Y -= 9;
      drawText('Existência e Estado de Elementos', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.rodas_existenciaEstado || '');
      col3Y -= 9;
      drawText('Integridade dos Anéis de Fixação', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.rodas_integridadeAneis || '');
      col3Y -= 9;
      drawText('Estado dos Rolos, Substâncias', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.rodas_estadoRolos || '');
      col3Y -= 12;

      // Pneus
      drawText('Pneus', col3X, col3Y, 7);
      col3Y -= 12;
      drawText('Pneu Dianteiro (Recondição)', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.pneus_dianteiro || '');
      col3Y -= 9;
      drawText('Sulcos (Profund.m.m.)', col3X, col3Y, 6);
      drawText(checklistData.pneus_sulcosProfundidade || '12.2', col3X + checkboxOffset, col3Y, 6);
      col3Y -= 9;
      drawText('Paridade de Pneus no Mesmo Eixo', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.pneus_paridadeMesmoEixo || '');
      col3Y -= 9;
      drawText('Flancos (Raspos ou Cortes)', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.pneus_flancos || '');
      col3Y -= 9;
      drawText('Banda Rodagem (Raspos, Cortes)', col3X, col3Y, 6);
      drawCheckbox(col3X + checkboxOffset, col3Y - 2, checklistData.pneus_bandaRodagem || '');
      col3Y -= 9;
      drawText('Pneu Sobresalente m.m.', col3X, col3Y, 6);
      drawText(checklistData.pneus_sobresalente || '5.8', col3X + checkboxOffset, col3Y, 6);

      currentY = Math.min(col1Y, col2Y, col3Y) - 25;

      // ===== TODAS AS NOVAS SEÇÕES DO PDF =====
      
      // SEÇÃO: Pedais Expandido (adicionar Trincas)
      currentY -= 15;
      drawText('Pedais - Trincas', col1X, currentY, 6);
      drawCheckbox(col1X + checkboxOffset, currentY - 2, checklistData.pedais_trincas || '');
      currentY -= 15;

      // SEÇÃO: Sistema de Iluminação EXPANDIDO
      const ilumHeight = 120; // Aumentado para acomodar todos os campos
      drawRect(40, currentY - ilumHeight, 520, ilumHeight, false, 0.9, 1);
      drawText('Sistema de Iluminação COMPLETO', 200, currentY - 10, 8);
      currentY -= 25;
      
      // Iluminação em 3 colunas para acomodar todos os campos
      let ilumCol1Y = currentY;
      // Coluna 1 - Faróis e Lanternas Básicas
      drawText('Farol Principal', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_farolPrincipal || '');
      ilumCol1Y -= 9;
      drawText('Farol Penetrador', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_farolPenetrador || '');
      ilumCol1Y -= 9;
      drawText('Lanterna da Placa', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_lanternaPlaca || '');
      ilumCol1Y -= 9;
      drawText('Sistema de Sinalização', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_sinalizacao || '');
      ilumCol1Y -= 9;
      drawText('Lanterna de Freio', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_lanternaFreio || '');
      ilumCol1Y -= 9;
      drawText('Retrorefletores', col1X, ilumCol1Y, 6);
      drawCheckbox(col1X + 120, ilumCol1Y - 2, checklistData.iluminacao_retrorefletores || '');
      
      let ilumCol2Y = currentY;
      // Coluna 2 - Lanternas Delimitadoras e Direção
      drawText('Delimitadoras Dianteira', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_delimitadoraDianteira || '');
      ilumCol2Y -= 9;
      drawText('Delimitadoras Traseira', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_delimitadoraTraseira || '');
      ilumCol2Y -= 9;
      drawText('Direção Dianteira', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_direcaoDianteira || '');
      ilumCol2Y -= 9;
      drawText('Direção Traseira', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_direcaoTraseira || '');
      ilumCol2Y -= 9;
      drawText('Intermitente Direção', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_intermitenteDirecao || '');
      ilumCol2Y -= 9;
      drawText('Intermitente Advertência', col2X, ilumCol2Y, 6);
      drawCheckbox(col2X + 120, ilumCol2Y - 2, checklistData.iluminacao_intermitenteAdvertencia || '');
      
      let ilumCol3Y = currentY;
      // Coluna 3 - Luzes Especiais
      drawText('Luz Marcha-à-Ré', col3X, ilumCol3Y, 6);
      drawCheckbox(col3X + 120, ilumCol3Y - 2, checklistData.iluminacao_marchaRe || '');
      ilumCol3Y -= 9;
      drawText('Luz de Identificação', col3X, ilumCol3Y, 6);
      drawCheckbox(col3X + 120, ilumCol3Y - 2, checklistData.iluminacao_identificacao || '');
      ilumCol3Y -= 9;
      drawText('Luz de Emergência', col3X, ilumCol3Y, 6);
      drawCheckbox(col3X + 120, ilumCol3Y - 2, checklistData.iluminacao_emergencia || '');
      
      currentY = Math.min(ilumCol1Y, ilumCol2Y, ilumCol3Y) - 20;

      // SEÇÃO: Sistema de Comunicação e Elétricos
      const eletricosHeight = 70;
      drawRect(40, currentY - eletricosHeight, 520, eletricosHeight, false, 0.9, 1);
      drawText('Sistema de Comunicação e Elétricos', 200, currentY - 10, 8);
      currentY -= 25;
      
      let eletCol1Y = currentY;
      drawText('Retrorefletores', col1X, eletCol1Y, 6);
      drawCheckbox(col1X + 120, eletCol1Y - 2, checklistData.comunicacao_retrorefletores || '');
      eletCol1Y -= 9;
      drawText('Bateria: Integridade', col1X, eletCol1Y, 6);
      drawCheckbox(col1X + 120, eletCol1Y - 2, checklistData.eletricos_bateriaIntegridade || '');
      eletCol1Y -= 9;
      drawText('Fiação: Integridade', col1X, eletCol1Y, 6);
      drawCheckbox(col1X + 120, eletCol1Y - 2, checklistData.eletricos_fiacaoIntegridade || '');
      eletCol1Y -= 9;
      drawText('Fiação: Fixação', col1X, eletCol1Y, 6);
      drawCheckbox(col1X + 120, eletCol1Y - 2, checklistData.eletricos_fiacaoFixacao || '');
      
      let eletCol2Y = currentY;
      drawText('Largura: ' + (checklistData.eletricos_largura || 'N/A'), col2X, eletCol2Y, 6);
      eletCol2Y -= 9;
      drawText('Funcionamento', col2X, eletCol2Y, 6);
      drawCheckbox(col2X + 120, eletCol2Y - 2, checklistData.eletricos_funcionamento || '');
      eletCol2Y -= 9;
      drawText('Ligação Elétrica', col2X, eletCol2Y, 6);
      drawCheckbox(col2X + 120, eletCol2Y - 2, checklistData.eletricos_ligacaoEletrica || '');
      eletCol2Y -= 9;
      drawText('Estado da Fiação', col2X, eletCol2Y, 6);
      drawCheckbox(col2X + 120, eletCol2Y - 2, checklistData.eletricos_estadoFiacao || '');
      
      currentY = Math.min(eletCol1Y, eletCol2Y) - 20;

      // SEÇÃO: Sistema de Alarme de Ré
      currentY -= 15;
      drawText('Sistema de Alarme de Ré', 200, currentY, 8);
      currentY -= 15;
      drawText('Funcionamento', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.alarmeRe_funcionamento || '');
      drawText('Estado Fiação', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.alarmeRe_estadoFiacao || '');
      currentY -= 20;

      // SEÇÃO: Para-Choque Traseiro
      drawText('Para-Choque Traseiro', 200, currentY, 8);
      currentY -= 15;
      drawText('Listas (Zebradas)', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.paraChoque_listas || '');
      drawText('Integridade', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.paraChoque_integridade || '');
      currentY -= 10;
      drawText('Furos', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.paraChoque_furos || '');
      drawText('Visibilidade Placa', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.paraChoque_visibilidadePlaca || '');
      currentY -= 20;

      // SEÇÃO: Para-Lama
      drawText('Para-Lama', 200, currentY, 8);
      currentY -= 15;
      drawText('Integridade', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.paraLama_integridade || '');
      currentY -= 20;

      // SEÇÃO: Dispositivos Refletivos de Segurança
      drawText('Dispositivos Refletivos de Segurança', 180, currentY, 8);
      currentY -= 15;
      drawText('Existência', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.refletivos_existencia || '');
      drawText('Integridade', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.refletivos_integridade || '');
      drawText('Conservação', col3X, currentY, 6);
      drawCheckbox(col3X + 120, currentY - 2, checklistData.refletivos_conservacao || '');
      currentY -= 20;

      // SEÇÃO: Veículo Chassi Porta-Contêiner
      drawText('Veículo Chassi Porta-Contêiner', 180, currentY, 8);
      currentY -= 15;
      drawText('Atend. Res. Contran 725/18', col1X, currentY, 6);
      drawCheckbox(col1X + 140, currentY - 2, checklistData.chassiContainer_atendimentoRes725 || '');
      drawText('Dispositivos Fixação', col2X + 20, currentY, 6);
      drawCheckbox(col2X + 160, currentY - 2, checklistData.chassiContainer_dispositivosFixacao || '');
      currentY -= 20;

      // SEÇÃO: Dolly
      drawText('Dolly', 200, currentY, 8);
      currentY -= 15;
      drawText('Estado do Câmbio', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.dolly_estadoCambio || '');
      currentY -= 20;

      // SEÇÃO: Pinos de Ação do Semi-Reboque
      drawText('Pinos de Ação do Semi-Reboque', 180, currentY, 8);
      currentY -= 15;
      drawText('Integridade', col1X, currentY, 6);
      drawCheckbox(col1X + 80, currentY - 2, checklistData.pinosSemi_integridade || '');
      drawText('Operacionalidade', col2X, currentY, 6);
      drawCheckbox(col2X + 100, currentY - 2, checklistData.pinosSemi_operacionalidade || '');
      currentY -= 10;
      drawText('Vazamentos', col1X, currentY, 6);
      drawCheckbox(col1X + 80, currentY - 2, checklistData.pinosSemi_vazamentos || '');
      drawText('Fixação', col2X, currentY, 6);
      drawCheckbox(col2X + 100, currentY - 2, checklistData.pinosSemi_fixacao || '');
      currentY -= 20;

      // SEÇÃO: Quinta-Roda
      drawText('Quinta-Roda', 200, currentY, 8);
      currentY -= 15;
      drawText('Integridade', col1X, currentY, 6);
      drawCheckbox(col1X + 80, currentY - 2, checklistData.quintaRoda_integridade || '');
      drawText('Fixação', col2X, currentY, 6);
      drawCheckbox(col2X + 80, currentY - 2, checklistData.quintaRoda_fixacao || '');
      currentY -= 10;
      drawText('Estado dos Apoios', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.quintaRoda_estadoApoios || '');
      drawText('Func. Mec. Engate', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.quintaRoda_funcionamentoEngate || '');
      currentY -= 20;

      // SEÇÃO: Pino-Rei
      drawText('Pino-Rei', 200, currentY, 8);
      currentY -= 15;
      drawText('Fixação Vertical', col1X, currentY, 6);
      drawCheckbox(col1X + 100, currentY - 2, checklistData.pinoRei_fixacaoVertical || '');
      drawText('Diâmetro: ' + (checklistData.pinoRei_diametroMm || 'N/A') + 'mm', col2X, currentY, 6);
      currentY -= 10;
      drawText('Trincas', col1X, currentY, 6);
      drawCheckbox(col1X + 60, currentY - 2, checklistData.pinoRei_trincas || '');
      drawText('Deformado', col2X, currentY, 6);
      drawCheckbox(col2X + 80, currentY - 2, checklistData.pinoRei_deformado || '');
      drawText('Recuperado Solda', col3X, currentY, 6);
      drawCheckbox(col3X + 120, currentY - 2, checklistData.pinoRei_recuperadoSolda || '');
      currentY -= 20;

      // SEÇÃO: Conjunto de Engate
      drawText('Conjunto de Engate', 200, currentY, 8);
      currentY -= 15;
      drawText('Estado da Rótula', col1X, currentY, 6);
      drawCheckbox(col1X + 120, currentY - 2, checklistData.engate_estadoRotula || '');
      drawText('Trava de Segurança', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.engate_travaSeguranca || '');
      currentY -= 10;
      drawText('Integridade dos Pinos', col1X, currentY, 6);
      drawCheckbox(col1X + 140, currentY - 2, checklistData.engate_integridadePinos || '');
      drawText('Trava dos Pinos', col2X, currentY, 6);
      drawCheckbox(col2X + 120, currentY - 2, checklistData.engate_travaPinos || '');
      currentY -= 20;

      // SEÇÃO: Sistema de Freio EXPANDIDO
      const freioHeight = 100;
      drawRect(40, currentY - freioHeight, 520, freioHeight, false, 0.9, 1);
      drawText('Sistema de Freio EXPANDIDO', 200, currentY - 10, 8);
      currentY -= 25;
      
      let freioCol1Y = currentY;
      drawText('Freio Estacionamento', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_estacionamento || '');
      freioCol1Y -= 9;
      drawText('Freio de Serviço', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_servico || '');
      freioCol1Y -= 9;
      drawText('Estado Compressor', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_estadoCompressor || '');
      freioCol1Y -= 9;
      drawText('Correias Compressor', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_correiasCompressor || '');
      freioCol1Y -= 9;
      drawText('Fixação/Conexões', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_fixacaoConexoes || '');
      freioCol1Y -= 9;
      drawText('Vazamentos', col1X, freioCol1Y, 6);
      drawCheckbox(col1X + 130, freioCol1Y - 2, checklistData.freio_vazamentos || '');
      
      let freioCol2Y = currentY;
      drawText('Lonas de Freio', col2X, freioCol2Y, 6);
      drawCheckbox(col2X + 130, freioCol2Y - 2, checklistData.freio_lonasFreio || '');
      freioCol2Y -= 9;
      drawText('Condição das Lonas', col2X, freioCol2Y, 6);
      drawCheckbox(col2X + 130, freioCol2Y - 2, checklistData.freio_condicaoLonas || '');
      freioCol2Y -= 9;
      drawText('Fixação da Lona', col2X, freioCol2Y, 6);
      drawCheckbox(col2X + 130, freioCol2Y - 2, checklistData.freio_fixacaoLona || '');
      freioCol2Y -= 9;
      drawText('Espessura das Lonas', col2X, freioCol2Y, 6);
      drawCheckbox(col2X + 130, freioCol2Y - 2, checklistData.freio_espessuraLonas || '');
      freioCol2Y -= 9;
      drawText('Indicador Pressão', col2X, freioCol2Y, 6);
      drawCheckbox(col2X + 130, freioCol2Y - 2, checklistData.freio_indicadorPressao || '');
      
      currentY = Math.min(freioCol1Y, freioCol2Y) - 20;

      // SEÇÃO: Reservatório de Ar - TOTALMENTE NOVA
      const reservatorioHeight = 60;
      drawRect(40, currentY - reservatorioHeight, 520, reservatorioHeight, false, 0.85, 1);
      drawText('RESERVATÓRIO DE AR', 220, currentY - 10, 8);
      currentY -= 25;
      
      let resCol1Y = currentY;
      drawText('Integridade', col1X, resCol1Y, 6);
      drawCheckbox(col1X + 80, resCol1Y - 2, checklistData.reservatorioAr_integridade || '');
      resCol1Y -= 9;
      drawText('Fixação', col1X, resCol1Y, 6);
      drawCheckbox(col1X + 80, resCol1Y - 2, checklistData.reservatorioAr_fixacao || '');
      resCol1Y -= 9;
      drawText('Vazamentos', col1X, resCol1Y, 6);
      drawCheckbox(col1X + 80, resCol1Y - 2, checklistData.reservatorioAr_vazamentos || '');
      
      let resCol2Y = currentY;
      drawText('Válvulas', col2X, resCol2Y, 6);
      drawCheckbox(col2X + 80, resCol2Y - 2, checklistData.reservatorioAr_valvulas || '');
      resCol2Y -= 9;
      drawText('Pressão Op.: ' + (checklistData.reservatorioAr_pressaoOperacional || 'N/A'), col2X, resCol2Y, 6);
      resCol2Y -= 9;
      drawText('Sistema de Dreno', col2X, resCol2Y, 6);
      drawCheckbox(col2X + 120, resCol2Y - 2, checklistData.reservatorioAr_dreno || '');
      
      currentY = Math.min(resCol1Y, resCol2Y) - 25;

      // Sistemas Elétricos Básicos (mantidos)
      drawText('Cronotacógrafo', 42, currentY, 6);
      drawCheckbox(165, currentY - 2, checklistData.cronografo_funcionamento || '');
      drawText('Buzina', 205, currentY, 6);
      drawCheckbox(255, currentY - 2, checklistData.buzina_existenciaFuncionamento || '');
      drawText('Limpador Para-Brisa', 295, currentY, 6);
      drawCheckbox(435, currentY - 2, checklistData.limpador_operacionalidade || '');
      currentY -= 15;
      
      drawText('Integridade Limpador', 42, currentY, 6);
      drawCheckbox(165, currentY - 2, checklistData.limpador_integridadeOperacionalidade || '');
      currentY -= 20;

      // ===== SEÇÃO MEDIÇÃO DOS PNEUS - LAYOUT EXPANDIDO =====
      const medicaoHeight = 180;
      drawRect(40, currentY - medicaoHeight, 520, medicaoHeight, false, 0.85, 2);
      drawText('MEDIÇÃO DOS PNEUS', 250, currentY - 15, 14);
      currentY -= 35;
      
      // Cabeçalho da medição com fontes maiores
      drawText(`Tipo: ${checklistData.medicao_tipoPneu || '(T) Traseiro | (L) Lado'} | Modelo: ${checklistData.medicao_modelo || '275/80 R 22.5'} | Tipo: ${checklistData.medicao_tipo || 'LISO'}`, 42, currentY, 9);
      currentY -= 25;
      
      // Layout de 4 colunas expandido
      const medicaoCol1X = 42;
      const medicaoCol2X = 180;
      const medicaoCol3X = 340;
      const medicaoCol4X = 460;
      const medicaoBoxWidth = 80;
      const medicaoBoxHeight = 18;
      
      // Cabeçalhos maiores
      drawText('POSIÇÃO', medicaoCol1X + 20, currentY, 9);
      drawText('LADO ESQUERDO', medicaoCol2X, currentY, 9);
      drawText('LADO DIREITO', medicaoCol3X, currentY, 9);
      drawText('POSIÇÃO', medicaoCol4X, currentY, 9);
      currentY -= 25;
      
      // Função para desenhar caixa expandida
      const drawExpandedBox = (x: number, y: number, value: string) => {
        drawRect(x, y, medicaoBoxWidth, medicaoBoxHeight, false, 0.9, 1);
        drawText(value || '', x + 6, y + 8, 10);
      };
      
      // LINHA 1 - Eixo 1 dianteiro
      drawText('EIXO 1 DIANTEIRO', medicaoCol1X - 20, currentY + 8, 8);
      drawExpandedBox(medicaoCol2X, currentY, checklistData.medicao_linha1_esquerdo || '');
      drawExpandedBox(medicaoCol3X, currentY, checklistData.medicao_linha1_direito || '');
      drawText('EIXO 1 DIANTEIRO', medicaoCol4X - 20, currentY + 8, 8);
      currentY -= 25;
      
      // LINHA 2 - Eixo 2 dianteiro
      drawText('EIXO 2 DIANTEIRO', medicaoCol1X - 20, currentY + 8, 8);
      drawExpandedBox(medicaoCol2X, currentY, checklistData.medicao_linha2_esquerdo || 'X');
      drawExpandedBox(medicaoCol3X, currentY, checklistData.medicao_linha2_direito || 'X');
      drawText('EIXO 2 DIANTEIRO', medicaoCol4X - 20, currentY + 8, 8);
      currentY -= 25;
      
      // LINHA 3 - Eixo 1 traseiro (pares)
      drawText('EIXO 1 TRASEIRO', medicaoCol1X - 20, currentY + 8, 8);
      drawExpandedBox(medicaoCol2X - 20, currentY, checklistData.medicao_linha3_esquerdo1 || '');
      drawExpandedBox(medicaoCol2X + 20, currentY, checklistData.medicao_linha3_esquerdo2 || '');
      drawExpandedBox(medicaoCol3X - 20, currentY, checklistData.medicao_linha3_direito1 || '');
      drawExpandedBox(medicaoCol3X + 20, currentY, checklistData.medicao_linha3_direito2 || '');
      drawText('EIXO 1 TRASEIRO', medicaoCol4X - 20, currentY + 8, 8);
      currentY -= 25;
      
      // LINHA 4 - Eixo 2 traseiro (pares)
      drawText('EIXO 2 TRASEIRO', medicaoCol1X - 20, currentY + 8, 8);
      drawExpandedBox(medicaoCol2X - 20, currentY, checklistData.medicao_linha4_esquerdo1 || '');
      drawExpandedBox(medicaoCol2X + 20, currentY, checklistData.medicao_linha4_esquerdo2 || '');
      drawExpandedBox(medicaoCol3X - 20, currentY, checklistData.medicao_linha4_direito1 || '');
      drawExpandedBox(medicaoCol3X + 20, currentY, checklistData.medicao_linha4_direito2 || '');
      drawText('EIXO 2 TRASEIRO', medicaoCol4X - 20, currentY + 8, 8);
      currentY -= 25;
      
      // LINHA 5 - Eixo 3 traseiro (pares)
      drawText('EIXO 3 TRASEIRO', medicaoCol1X - 20, currentY + 8, 8);
      drawExpandedBox(medicaoCol2X - 20, currentY, checklistData.medicao_linha5_esquerdo1 || '');
      drawExpandedBox(medicaoCol2X + 20, currentY, checklistData.medicao_linha5_esquerdo2 || '');
      drawExpandedBox(medicaoCol3X - 20, currentY, checklistData.medicao_linha5_direito1 || '');
      drawExpandedBox(medicaoCol3X + 20, currentY, checklistData.medicao_linha5_direito2 || '');
      drawText('EIXO 3 TRASEIRO', medicaoCol4X - 20, currentY + 8, 8);
      currentY -= 25;
      
      // Campos inferiores expandidos
      drawText(`ESTADO GERAL: ${checklistData.medicao_estadoGeral || 'Bom | Regular | Ruim'}`, 42, currentY, 9);
      drawText(`OBSERVAÇÕES: ${checklistData.medicao_observacoes || ''}`, 300, currentY, 9);
      
      currentY -= 40;

      // Seção Observações EXPANDIDA com retângulo demarcador
      const obsHeight = 120;
      drawRect(40, currentY - obsHeight, 520, obsHeight, false, 0.85, 2);
      drawText('OBSERVAÇÕES', 250, currentY - 15, 12);

      // Processamento das observações
      const basicObs = observacoes.split('--- DADOS CHECKLIST ---')[0] || observacoes;
      const obsLines = [];
      const maxLineLength = 75;
      
      // Quebra de linha inteligente
      const sentences = basicObs.split(/[.!?]+/).filter(s => s.trim());
      let currentLine = '';
      
      for (const sentence of sentences) {
        const cleanSentence = sentence.trim();
        if (!cleanSentence) continue;
        
        const fullSentence = cleanSentence + (cleanSentence.match(/[.!?]$/) ? '' : '.');
        const words = fullSentence.split(' ');
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          
          if (testLine.length <= maxLineLength) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              obsLines.push(currentLine);
              currentLine = word;
            } else {
              obsLines.push(word);
              currentLine = '';
            }
          }
        }
        
        if (currentLine && currentLine.trim().endsWith('.')) {
          obsLines.push(currentLine);
          currentLine = '';
        }
      }
      
      if (currentLine) obsLines.push(currentLine);

      // Renderizar texto das observações expandido
      const lineHeight = 12;
      const startY = currentY - 40;
      
      obsLines.slice(0, 8).forEach((line, index) => {
        const yPos = startY - (index * lineHeight);
        drawText(line.trim(), 50, yPos, 9);
      });

      currentY -= 130;

      // Seção Resultado Inspeção EXPANDIDA com retângulo demarcador
      const resultadoHeight = 60;
      drawRect(40, currentY - resultadoHeight, 520, resultadoHeight, false, 0.85, 2);
      drawText('RESULTADO DA INSPEÇÃO', 250, currentY - 15, 12);
      
      // Linha superior com opções
      drawText('MARCAÇÃO:', 50, currentY - 35, 9);
      drawText('✓ APROVADO', 140, currentY - 35, 9);
      drawText('R REPROVADO', 230, currentY - 35, 9);
      drawText('✗ NÃO APLICÁVEL', 330, currentY - 35, 9);
      
      // Linha inferior
      drawText('APROVADO APÓS REINSPEÇÃO EM: ______________________', 50, currentY - 50, 9);
      
      // Linha para assinatura
      drawText('INSPETOR: ________________________________', 280, currentY - 50, 9);

      const pdfBytes = await pdfDoc.save();
      download(pdfBytes, `laudo-checklist-${fullLaudo.ordemServico}.pdf`, 'application/pdf');

    } catch (e) {
      console.error('Falha ao gerar PDF', e);
      setMessage('Erro: Não foi possível gerar o PDF.');
    }
  };

  const generateChecklistHtmlToPdf = async (laudoId: string) => {
    try {
      console.log('📄 [CHECKLIST-PDF] Iniciando geração de PDF para ID:', laudoId);
      setMessage('Gerando PDF...');

      // Fazer chamada para API route server-side
      console.log('🌐 [CHECKLIST-PDF] Fazendo requisição para /api/laudos/pdf');
      const response = await fetch('/api/laudos/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ laudoId }),
      });

      console.log('📡 [CHECKLIST-PDF] Resposta da API PDF:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ [CHECKLIST-PDF] Erro na resposta:', errorText);
        throw new Error('Falha ao gerar PDF no servidor');
      }

      // Baixar o PDF retornado pela API
      console.log('📥 [CHECKLIST-PDF] Processando blob do PDF');
      const pdfBlob = await response.blob();
      console.log('📥 [CHECKLIST-PDF] Blob gerado:', {
        size: pdfBlob.size,
        type: pdfBlob.type
      });
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-checklist-${laudoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ [CHECKLIST-PDF] PDF baixado com sucesso');
      setMessage('PDF gerado com sucesso!');

    } catch (e) {
      console.error('💥 [CHECKLIST-PDF] Erro ao gerar PDF:', e);
      setMessage('Erro: Não foi possível gerar o PDF.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checklistForm}>
      {showShortcutFeedback && (
        <div className={styles.shortcutFeedback}>
          ✅ Todos os itens marcados como OK!
        </div>
      )}
      {/* Seleção Cliente e Veículo */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>1. Cliente e Veículo</h3>
        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cliente</label>
            <select 
              value={selectedClient} 
              onChange={handleClientChange} 
              required 
              className={styles.select}
            >
              <option value="">-- Selecione um Cliente --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Veículo</label>
            <select 
              value={selectedVehicle} 
              onChange={handleVehicleChange} 
              disabled={!selectedClient || isVehicleLoading} 
              required 
              className={styles.select}
            >
              {isVehicleLoading ? <option>Carregando...</option> : vehicles.length > 0 ?
                <><option value="">-- Selecione um Veículo --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.marcaModelo}</option>)}</> :
                <option>-- Selecione um Cliente Primeiro --</option>}
            </select>
          </div>
        </div>
        
        <div className={styles.grid4}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ordem de Serviço</label>
            <input
              type="text"
              value={checklistData.ordemServico || ''}
              onChange={(e) => handleInputChange('ordemServico', e.target.value)}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Data de Emissão</label>
            <input
              type="date"
              value={checklistData.dataEmissao || ''}
              onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Validade</label>
            <input
              type="date"
              value={checklistData.validade || ''}
              onChange={(e) => handleInputChange('validade', e.target.value)}
              className={styles.input}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Código Temporal</label>
            <input
              type="text"
              value={checklistData.codTemporal || ''}
              onChange={(e) => handleInputChange('codTemporal', e.target.value)}
              readOnly
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Cabina */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>2. Cabina</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Estado Geral', 'cabina_estadoGeral')}
          {renderCheckboxGroup('Estado Degraus de Acesso', 'cabina_estadoDegraus')}
          {renderCheckboxGroup('Portas', 'cabina_portas')}
          {renderCheckboxGroup('Integridade e Funcionamento', 'cabina_integridadeFuncionamento')}
          {renderCheckboxGroup('Bancos - Estado Geral', 'cabina_bancosEstadoGeral')}
          {renderCheckboxGroup('Bancos - Fixação', 'cabina_bancosFixacao')}
        </div>
      </div>

      {/* Equipamentos de Segurança */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>3. Equipamentos de Segurança</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Cinto de Segurança', 'seguranca_cintoSeguranca')}
          {renderCheckboxGroup('Extintor de Incêndio de Cabine', 'seguranca_extintorCabine')}
          {renderCheckboxGroup('Extintor de Incêndio do Tanque', 'seguranca_extintorTanque')}
          {renderCheckboxGroup('Triângulo', 'seguranca_triangulo')}
          {renderCheckboxGroup('Integridade dos Espelhos Retrovisores', 'seguranca_espelhosRetrovisores')}
        </div>
      </div>

      {/* Pedais */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>4. Pedais de Embreagem e Freio</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Operacionalidade', 'pedais_embragemFreio')}
          {renderCheckboxGroup('Superfície de Pisomante', 'pedais_superficiePisomante')}
          {renderCheckboxGroup('Trincas', 'pedais_trincas')}
        </div>
      </div>

      {/* Para-Brisa */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>5. Para-Brisa</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade, Visibilidade', 'paraBrisa_integridadeVisibilidade')}
          {renderCheckboxGroup('Trincas', 'paraBrisa_trincas')}
        </div>
      </div>

      {/* Para-Sol */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>6. Para-Sol</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade, Fixação, Estado Geral', 'paraSol_integridadeFixacao')}
        </div>
      </div>

      {/* Reservatório de Combustível */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>7. Reservatório de Combustível</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade, Fixação, Tubulação', 'reservatorio_integridadeFixacao')}
          {renderCheckboxGroup('Vazamento', 'reservatorio_vazamento')}
          {renderCheckboxGroup('Material', 'reservatorio_material')}
          {renderCheckboxGroup('Reservatório de Comb. Suplementar', 'reservatorio_suplementar')}
        </div>
      </div>

      {/* Conjunto Motor/Caixa de Mudanças */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>8. Conjunto Motor/Caixa de Mudanças</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Ancoragem', 'motor_ancoragem')}
          {renderCheckboxGroup('Proteção do Motor', 'motor_protecao')}
          {renderCheckboxGroup('Sistema de Direção', 'motor_sistemaOperacao')}
          {renderCheckboxGroup('Funcionamento, Folgas, Solda', 'motor_funcionamentoFolgas')}
          {renderCheckboxGroup('Óleo Hidraul., Vazamentos, Tubulação', 'motor_oleoHidraulico')}
          {renderCheckboxGroup('Alinhamento de Direção', 'motor_alinhamentoDirecao')}
          {renderCheckboxGroup('Transmissão', 'motor_transmissao')}
          {renderCheckboxGroup('Eixo Cardã, Integridade, Cinta', 'motor_eixoCarda')}
          {renderCheckboxGroup('Cruzetas e Mancais', 'motor_cruzetasMancais')}
          {renderCheckboxGroup('Sistema de Escapamento', 'motor_sistemaEscapamento')}
          {renderCheckboxGroup('Integridade', 'motor_integridade')}
          {renderCheckboxGroup('Contra de Segurança (Proteção de Classe A)', 'motor_contraSeguranca')}
          {renderCheckboxGroup('Proteção Pino do Arlinhão, do Chassi', 'motor_protecaoPino')}
          {renderCheckboxGroup('Limite de Operacidade', 'motor_limiteOperacidade')}
          {renderCheckboxGroup('Chassi', 'motor_chassi')}
          {renderCheckboxGroup('Estado da Articulação, Configuração', 'motor_estadoArticulacao')}
          {renderCheckboxGroup('Estacionamento, Freios, Reparo', 'motor_estacionamento')}
          {renderCheckboxGroup('Rastreamento', 'motor_rastreamento')}
          {renderCheckboxGroup('Posição de Fixação', 'motor_posicaoFixacao')}
        </div>
      </div>

      {/* Eixos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>9. Eixos</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Trincas ou Soldas Observáveis', 'eixos_trincasSoldas')}
          {renderCheckboxGroup('Integridade do Eixo Direcional', 'eixos_integridadeDirecional')}
          {renderCheckboxGroup('Mecanismo de Elevação do Eixo', 'eixos_mecanismoElevacao')}
          {renderCheckboxGroup('Integridade e Operacionalidade', 'eixos_integridadeOperacionalidade')}
        </div>
      </div>

      {/* Suspensão */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>10. Suspensão</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Amortecedor', 'suspensao_amortecedor')}
          {renderCheckboxGroup('Balancins', 'suspensao_balancins')}
          {renderCheckboxGroup('Barra Estabilizadora', 'suspensao_barraEstabilizadora')}
          {renderCheckboxGroup('Feixes de Molas', 'suspensao_feixesMolas')}
          {renderCheckboxGroup('Braço Tensor', 'suspensao_bracoTensor')}
          {renderCheckboxGroup('Suspensão Pneumática - Integridade de Mangueiras', 'suspensao_pneumaticaMangueiras')}
        </div>
      </div>

      {/* Rodas */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>11. Rodas</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Elementos de Fixação', 'rodas_elementosFixacao')}
          {renderCheckboxGroup('Integridade dos Aros e Rodas, Trincas', 'rodas_integridadeAros')}
          {renderCheckboxGroup('Existência e Estado de Elementos', 'rodas_existenciaEstado')}
          {renderCheckboxGroup('Integridade dos Anéis de Fixação', 'rodas_integridadeAneis')}
          {renderCheckboxGroup('Estado dos Rolos, Substâncias', 'rodas_estadoRolos')}
        </div>
      </div>

      {/* Pneus */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>12. Pneus</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Pneu Dianteiro (Recondição)', 'pneus_dianteiro')}
          {renderInputField('Sulcos (Profund.m.m.)', 'pneus_sulcosProfundidade', '12.2')}
          {renderCheckboxGroup('Paridade de Pneus no Mesmo Eixo', 'pneus_paridadeMesmoEixo')}
          {renderCheckboxGroup('Flancos (Raspos ou Cortes)', 'pneus_flancos')}
          {renderCheckboxGroup('Banda Rodagem (Raspos, Cortes)', 'pneus_bandaRodagem')}
          {renderInputField('Pneu Sobresalente m.m.', 'pneus_sobresalente', '5.8')}
        </div>
      </div>

      {/* Medição dos Pneus - ESQUEMA COM VISUAL DE PNEU */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>13. Medição dos Pneus</h3>
        
        {/* Campos superiores */}
        <div className={styles.grid3}>
          {renderInputField('Tipo de Pneu', 'medicao_tipoPneu', '(T) Traseiro | (L) Lado')}
          {renderInputField('Modelo', 'medicao_modelo', '275/80 R 22.5')}
          {renderInputField('Tipo', 'medicao_tipo', 'LISO')}
        </div>

        {/* Grid principal com visual de pneu */}
        <div className={styles.medicaoGrid}>
          
          {/* Cabeçalhos */}
          <div className={styles.medicaoLabel}></div>
          <div className={styles.medicaoHeader}>lado esquerdo</div>
          <div className={styles.medicaoHeader}>lado direito</div>
          <div className={styles.medicaoLabel}></div>
          
          {/* LINHA 1 - Eixo 1 dianteiro */}
          <div className={styles.medicaoLabel}>eixo 1 esquerdo dianteiro do caminhão</div>
          <div className={styles.medicaoCampoSimples}>
            <div className={styles.pneuField}>
              <input
                type="text"
                value={(checklistData.medicao_linha1_esquerdo as string) || ''}
                onChange={(e) => handleInputChange('medicao_linha1_esquerdo', e.target.value)}
                placeholder="mm"
              />
            </div>
          </div>
          <div className={styles.medicaoCampoSimples}>
            <div className={styles.pneuField}>
              <input
                type="text"
                value={(checklistData.medicao_linha1_direito as string) || ''}
                onChange={(e) => handleInputChange('medicao_linha1_direito', e.target.value)}
                placeholder="mm"
              />
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 1 direito dianteiro do caminhão</div>
          
          {/* LINHA 2 - Eixo 2 dianteiro */}
          <div className={styles.medicaoLabel}>eixo 2 esquerdo dianteiro do caminhão</div>
          <div className={styles.medicaoCampoSimples}>
            <div className={styles.pneuField}>
              <input
                type="text"
                value={(checklistData.medicao_linha2_esquerdo as string) || ''}
                onChange={(e) => handleInputChange('medicao_linha2_esquerdo', e.target.value)}
                placeholder="mm"
              />
            </div>
          </div>
          <div className={styles.medicaoCampoSimples}>
            <div className={styles.pneuField}>
              <input
                type="text"
                value={(checklistData.medicao_linha2_direito as string) || ''}
                onChange={(e) => handleInputChange('medicao_linha2_direito', e.target.value)}
                placeholder="mm"
              />
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 2 direito dianteiro do caminhão</div>
          
          {/* LINHA 3 - Eixo 1 traseiro (PARES) */}
          <div className={styles.medicaoLabel}>eixo 1 traseiro do caminhão lado esquerdo</div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha3_esquerdo1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha3_esquerdo1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha3_esquerdo2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha3_esquerdo2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha3_direito1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha3_direito1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha3_direito2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha3_direito2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 1 traseiro do caminhão lado direito</div>
          
          {/* LINHA 4 - Eixo 2 traseiro (PARES) */}
          <div className={styles.medicaoLabel}>eixo 2 traseiro do caminhão lado esquerdo</div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha4_esquerdo1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha4_esquerdo1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha4_esquerdo2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha4_esquerdo2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha4_direito1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha4_direito1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha4_direito2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha4_direito2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 2 traseiro do caminhão lado direito</div>
          
          {/* LINHA 5 - Eixo 3 traseiro (PARES) */}
          <div className={styles.medicaoLabel}>eixo 3 traseiro do caminhão lado esquerdo</div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha5_esquerdo1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha5_esquerdo1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha5_esquerdo2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha5_esquerdo2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha5_direito1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha5_direito1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha5_direito2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha5_direito2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 3 traseiro do caminhão lado direito</div>
        </div>

        {/* Campos inferiores */}
        <div className={styles.grid2}>
          {renderInputField('Estado Geral', 'medicao_estadoGeral', 'Bom | Regular | Ruim')}
          {renderInputField('Observações', 'medicao_observacoes')}
        </div>
      </div>

      {/* Sistema de Iluminação */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>14. Sistema de Iluminação</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Farol Principal Integricidade e Fixação', 'iluminacao_farolPrincipal')}
          {renderCheckboxGroup('Farol Penetrador (Proteção)', 'iluminacao_farolPenetrador')}
          {renderCheckboxGroup('Farol de Neblina', 'iluminacao_farolNeblina')}
          {renderCheckboxGroup('Lanterna da Placa', 'iluminacao_lanternaPlaca')}
          {renderCheckboxGroup('Lanterna de Luz/Cor Branca', 'iluminacao_lanternaLuz')}
          {renderCheckboxGroup('Sistema de Sinalização Luminosa', 'iluminacao_sinalizacao')}
          {renderCheckboxGroup('Lanterna Delimitadora Dianteira', 'iluminacao_lanternaDelimitadora')}
          {renderCheckboxGroup('Lanterna de Freio', 'iluminacao_lanternaFreio')}
          {renderCheckboxGroup('Lanterna Indicadora de Direção', 'iluminacao_lanternaIndicadora')}
          {renderCheckboxGroup('Lanterna Indicadora de Direção Lateral', 'iluminacao_lanternaIndicadoraLateral')}
          {renderCheckboxGroup('Lanterna de Advertência', 'iluminacao_lanternaAdvertencia')}
          {renderCheckboxGroup('Lanterna Laterais', 'iluminacao_lanternaLaterais')}
          {renderCheckboxGroup('Lanterna Lateral à Ré', 'iluminacao_lanternaLateralRe')}
          {renderCheckboxGroup('Lanterna de Neblina Traseira', 'iluminacao_lanternaNeblina')}
          {renderCheckboxGroup('Lanterna de Projeção', 'iluminacao_lanternaProjecao')}
          {renderCheckboxGroup('Retrorefletores', 'iluminacao_retrorefletores')}
          {/* ✨ NOVOS CAMPOS DE ILUMINAÇÃO */}
          {renderCheckboxGroup('Lanternas Delimitadoras Dianteira', 'iluminacao_delimitadoraDianteira')}
          {renderCheckboxGroup('Lanternas Delimitadoras Traseira', 'iluminacao_delimitadoraTraseira')}
          {renderCheckboxGroup('Lanternas de Direção Dianteira', 'iluminacao_direcaoDianteira')}
          {renderCheckboxGroup('Lanternas de Direção Traseira', 'iluminacao_direcaoTraseira')}
          {renderCheckboxGroup('Lanternas Intermitentes de Direção', 'iluminacao_intermitenteDirecao')}
          {renderCheckboxGroup('Lanternas Intermitentes de Advertência', 'iluminacao_intermitenteAdvertencia')}
          {renderCheckboxGroup('Luz de Marcha-à-Ré', 'iluminacao_marchaRe')}
          {renderCheckboxGroup('Luz de Identificação', 'iluminacao_identificacao')}
          {renderCheckboxGroup('Luz de Emergência', 'iluminacao_emergencia')}
        </div>
      </div>

      {/* Bateria Elétrica */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>15. Bateria Elétrica</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade e Fixação', 'bateria_integridadeFixacao')}
          {renderCheckboxGroup('Alteração da Proteção', 'bateria_alteracaoProtecao')}
        </div>
      </div>

      {/* Cronotacógrafo */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>16. Cronotacógrafo</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Laces', 'cronografo_laces')}
          {renderCheckboxGroup('Funcionamento, Ligação Elétrica', 'cronografo_funcionamento')}
        </div>
      </div>

      {/* Buzina Elétrica */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>17. Buzina Elétrica</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Existência e Funcionamento', 'buzina_existenciaFuncionamento')}
        </div>
      </div>

      {/* Instalação Elétrica */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>18. Instalação Elétrica</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Estado dos Cabos Elétrica', 'eletrica_estadoCabosEletrica')}
          {renderCheckboxGroup('Isolamento da Fiação Elétrica', 'eletrica_isolamento')}
        </div>
      </div>

      {/* Limpador Para-Brisa */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>19. Limpador de Para-Brisa</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Operacionalidade', 'limpador_operacionalidade')}
          {renderCheckboxGroup('Integridade e Operacionalidade', 'limpador_integridadeOperacionalidade')}
        </div>
      </div>

      {/* ✨ NOVAS SEÇÕES */}

      {/* Sistema de Comunicação e Elétricos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>20. Sistema de Comunicação e Elétricos</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Retrorefletores', 'comunicacao_retrorefletores')}
          {renderCheckboxGroup('Bateria: Integridade', 'eletricos_bateriaIntegridade')}
          {renderCheckboxGroup('Fiação: Integridade', 'eletricos_fiacaoIntegridade')}
          {renderCheckboxGroup('Fiação: Fixação', 'eletricos_fiacaoFixacao')}
          {renderInputField('Largura', 'eletricos_largura')}
          {renderCheckboxGroup('Funcionamento', 'eletricos_funcionamento')}
          {renderCheckboxGroup('Ligação Elétrica', 'eletricos_ligacaoEletrica')}
          {renderCheckboxGroup('Estado da Fiação Elétrica', 'eletricos_estadoFiacao')}
        </div>
      </div>

      {/* Sistema de Alarme de Ré */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>21. Sistema de Alarme de Ré</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Funcionamento', 'alarmeRe_funcionamento')}
          {renderCheckboxGroup('Estado da Fiação Elétrica', 'alarmeRe_estadoFiacao')}
        </div>
      </div>

      {/* Para-Choque Traseiro */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>22. Para-Choque Traseiro</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Listas (Zebradas), Furos', 'paraChoque_listas')}
          {renderCheckboxGroup('Furos', 'paraChoque_furos')}
          {renderCheckboxGroup('Integridade', 'paraChoque_integridade')}
          {renderCheckboxGroup('Visibilidade da Placa de Licença', 'paraChoque_visibilidadePlaca')}
        </div>
      </div>

      {/* Para-Lama */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>23. Para-Lama</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade', 'paraLama_integridade')}
        </div>
      </div>

      {/* Dispositivos Refletivos de Segurança */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>24. Dispositivos Refletivos de Segurança</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Existência', 'refletivos_existencia')}
          {renderCheckboxGroup('Integridade', 'refletivos_integridade')}
          {renderCheckboxGroup('Conservação', 'refletivos_conservacao')}
        </div>
      </div>

      {/* Veículo Chassi Porta-Contêiner */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>25. Veículo Chassi Porta-Contêiner</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Atendimento à Res. Contran 725/18', 'chassiContainer_atendimentoRes725')}
          {renderCheckboxGroup('Dispositivos de Fixação Operacionais', 'chassiContainer_dispositivosFixacao')}
        </div>
      </div>

      {/* Dolly */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>26. Dolly</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Estado do Câmbio', 'dolly_estadoCambio')}
        </div>
      </div>

      {/* Pinos de Ação do Semi-Reboque */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>27. Pinos de Ação do Semi-Reboque</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade', 'pinosSemi_integridade')}
          {renderCheckboxGroup('Operacionalidade', 'pinosSemi_operacionalidade')}
          {renderCheckboxGroup('Vazamentos', 'pinosSemi_vazamentos')}
          {renderCheckboxGroup('Fixação', 'pinosSemi_fixacao')}
        </div>
      </div>

      {/* Quinta-Roda */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>28. Quinta-Roda</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade', 'quintaRoda_integridade')}
          {renderCheckboxGroup('Fixação', 'quintaRoda_fixacao')}
          {renderCheckboxGroup('Estado dos Apoios', 'quintaRoda_estadoApoios')}
          {renderCheckboxGroup('Funcionamento Mecânico do Engate', 'quintaRoda_funcionamentoEngate')}
        </div>
      </div>

      {/* Pino-Rei */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>29. Pino-Rei</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Fixação Vertical à Mesa', 'pinoRei_fixacaoVertical')}
          {renderInputField('Diâmetro em mm', 'pinoRei_diametroMm')}
          {renderCheckboxGroup('Trincas Observáveis', 'pinoRei_trincas')}
          {renderCheckboxGroup('Deformado', 'pinoRei_deformado')}
          {renderCheckboxGroup('Recuperado por Solda', 'pinoRei_recuperadoSolda')}
        </div>
      </div>

      {/* Conjunto de Engate */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>30. Conjunto de Engate</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Estado da Rótula', 'engate_estadoRotula')}
          {renderCheckboxGroup('Trava de Segurança', 'engate_travaSeguranca')}
          {renderCheckboxGroup('Integridade dos Pinos', 'engate_integridadePinos')}
          {renderCheckboxGroup('Trava dos Pinos', 'engate_travaPinos')}
        </div>
      </div>

      {/* Sistema de Freio Expandido */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>31. Sistema de Freio</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Freio de Estacionamento', 'freio_estacionamento')}
          {renderCheckboxGroup('Freio de Serviço', 'freio_servico')}
          {renderCheckboxGroup('Estado do Compressor', 'freio_estadoCompressor')}
          {renderCheckboxGroup('Correias do Compressor', 'freio_correiasCompressor')}
          {renderCheckboxGroup('Fixação, Conexões e Fixação', 'freio_fixacaoConexoes')}
          {renderCheckboxGroup('Vazamentos (Tubo/Flexíveis/Válvulas)', 'freio_vazamentos')}
          {renderCheckboxGroup('Lonas de Freio', 'freio_lonasFreio')}
          {renderCheckboxGroup('Condição das Lonas de Freio', 'freio_condicaoLonas')}
          {renderCheckboxGroup('Fixação da Lona', 'freio_fixacaoLona')}
          {renderCheckboxGroup('Espessura das Lonas de Freio', 'freio_espessuraLonas')}
          {renderCheckboxGroup('Indicador de Pressão Operacional', 'freio_indicadorPressao')}
          {renderInputField('Tempo Recuperação Compressor (seg)', 'compressor_tempoRecuperacao')}
          {renderInputField('Pressão Inicial (Bar)', 'compressor_pressaoInicial')}
          {renderInputField('Pressão Final (Bar)', 'compressor_pressaoFinal')}
          {renderInputField('Perda ar %', 'compressor_perdaAr')}
        </div>
      </div>

      {/* Reservatório de Ar - NOVA SEÇÃO COMPLETA */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>32. Reservatório de Ar</h3>
        <div className={styles.checklistGrid}>
          {renderCheckboxGroup('Integridade', 'reservatorioAr_integridade')}
          {renderCheckboxGroup('Fixação', 'reservatorioAr_fixacao')}
          {renderCheckboxGroup('Vazamentos', 'reservatorioAr_vazamentos')}
          {renderCheckboxGroup('Válvulas', 'reservatorioAr_valvulas')}
          {renderInputField('Pressão Operacional', 'reservatorioAr_pressaoOperacional')}
          {renderCheckboxGroup('Sistema de Dreno', 'reservatorioAr_dreno')}
        </div>
      </div>

      {/* Observações */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>33. Observações</h3>
        <div className={styles.inputGroup}>
          <textarea
            value={checklistData.observacoes || ''}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            className={styles.textarea}
            rows={6}
          />
        </div>
      </div>

      {/* Botão Submit */}
      <div className={styles.submitSection}>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={styles.submitButton}
        >
          {isSubmitting ? '⏳ Criando Laudo...' : '📋 Criar Laudo CHECKLIST'}
        </button>
        {message && (
          <span className={`${styles.message} ${message.includes('Erro') ? styles.error : styles.success}`}>
            {message}
          </span>
        )}
      </div>

      {/* SEÇÃO DE DOWNLOADS - DUPLA FUNCIONALIDADE */}
      <div className={styles.downloadSection}>
        <h3>Downloads de Laudos Existentes</h3>
        <div className={styles.downloadInputGroup}>
          <input
            type="text"
            placeholder="ID do Laudo para download"
            value={downloadLaudoId}
            onChange={(e) => setDownloadLaudoId(e.target.value)}
            className={styles.downloadInput}
          />
          <div className={styles.downloadButtons}>
            <button
              type="button"
              onClick={() => downloadLaudoId && generateChecklistHtmlToPdf(downloadLaudoId)}
              className={styles.downloadPdfButton}
              disabled={!downloadLaudoId}
            >
              📄 Download PDF
            </button>
            <button
              type="button"
              onClick={() => downloadLaudoId && generateChecklistHtml(downloadLaudoId)}
              className={styles.downloadHtmlButton}
              disabled={!downloadLaudoId}
            >
              🔗 Download HTML
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}