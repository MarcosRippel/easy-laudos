'use client';

import { useState, useEffect, useRef } from 'react';
import type { Client, Vehicle, Laudo, AdminSetting } from '@prisma/client';
import { companyHeaderLine } from '@/lib/companyIdentity';
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
  initialClientId?: string;
  initialPlaca?: string;
}

export default function ChecklistForm({ clients, nextOrdemServico, temporalCode, initialClientId, initialPlaca }: ChecklistFormProps) {
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
  const [tapCount, setTapCount] = useState(0);
  const tapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 5 toques rápidos em área vazia = mesmo efeito de "///"
  const handleEmptyAreaTap = (e: React.PointerEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, select, textarea, button, label, a, [role="button"]')) {
      return;
    }
    setTapCount(prev => {
      const next = prev + 1;
      if (tapResetTimer.current) {
        clearTimeout(tapResetTimer.current);
        tapResetTimer.current = null;
      }
      if (next >= 5) {
        markAllAsOk();
        return 0;
      }
      tapResetTimer.current = setTimeout(() => setTapCount(0), 1200);
      return next;
    });
  };

  useEffect(() => () => {
    if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
  }, []);

  // Auto-selecionar cliente e veículo quando vindo da lista de veículos
  useEffect(() => {
    if (initialClientId) {
      setSelectedClient(initialClientId);
      setChecklistData(prev => ({ ...prev, clientId: initialClientId }));
      setIsVehicleLoading(true);
      fetch(`/api/vehicles?clientId=${initialClientId}`)
        .then(res => res.ok ? res.json() : [])
        .then((vehiclesData: Vehicle[]) => {
          setVehicles(vehiclesData);
          if (initialPlaca) {
            const match = vehiclesData.find((v: Vehicle) => v.placa === initialPlaca);
            if (match) setSelectedVehicle(match.id);
          }
        })
        .catch(console.error)
        .finally(() => setIsVehicleLoading(false));
    }
  }, [initialClientId, initialPlaca]);

  const handleClientChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = event.target.value;
    console.log('ðŸ¢ [CHECKLIST] Cliente selecionado:', clientId);

    setSelectedClient(clientId);
    setSelectedVehicle('');
    setVehicles([]);
    setChecklistData(prev => ({ ...prev, clientId }));

    if (clientId) {
      console.log('ðŸšš [CHECKLIST] Carregando veículos para cliente:', clientId);
      setIsVehicleLoading(true);
      try {
        const response = await fetch(`/api/vehicles?clientId=${clientId}`);
        console.log('ðŸ“¡ [CHECKLIST] Resposta de veículos:', {
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) throw new Error('Failed to fetch vehicles');

        const vehiclesData = await response.json();
        console.log('âœ… [CHECKLIST] Veículos carregados:', vehiclesData.length);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('âŒ [CHECKLIST] Erro ao carregar veículos:', error);
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
    console.log('ðŸŽ¯ [ATALHO] Marcando todos os campos como OK');
    const updatedData = { ...checklistData };
    checklistFields.forEach(field => {
      updatedData[field] = 'OK';
    });
    setChecklistData(updatedData);

    // Mostrar feedback visual
    setShowShortcutFeedback(true);
    setTimeout(() => setShowShortcutFeedback(false), 2000);
    console.log('âœ… [ATALHO] Todos os campos marcados como OK');
  };

  // Effect para detectar o atalho "///"
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detecta apenas a tecla "/"
      if (event.key === '/') {
        console.log('ðŸ” [ATALHO] Tecla "/" detectada');
        event.preventDefault();

        setKeySequence(prev => {
          const newSequence = prev + '/';
          console.log('ðŸ”¢ [ATALHO] Sequência atual:', newSequence);

          // Se chegou a "///", marcar todos como OK e resetar a sequência
          if (newSequence === '///') {
            console.log('ðŸŽ‰ [ATALHO] Sequência completa detectada!');
            markAllAsOk();
            setTimeout(() => setKeySequence(''), 100); // Reset após marcar
            return '';
          }

          // Limpar sequência após 1 segundo se não completar
          setTimeout(() => {
            console.log('â° [ATALHO] Timeout - limpando sequência');
            setKeySequence('');
          }, 1000);

          return newSequence;
        });
      } else {
        // Qualquer outra tecla reseta a sequência
        setKeySequence('');
      }
    };

    console.log('ðŸŽ§ [ATALHO] Event listener adicionado');
    // Adicionar listener quando o componente estiver ativo
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      console.log('ðŸ”¥ [ATALHO] Event listener removido');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ðŸš€ [CHECKLIST] Iniciando handleSubmit');
    console.log('ðŸ“‹ [CHECKLIST] selectedClient:', selectedClient);
    console.log('ðŸšš [CHECKLIST] selectedVehicle:', selectedVehicle);

    if (!selectedClient || !selectedVehicle) {
      console.log('âŒ [CHECKLIST] Erro: Cliente ou veículo não selecionado');
      setMessage('Por favor, selecione um cliente e um veículo.');
      return;
    }

    console.log('âœ… [CHECKLIST] Cliente e veículo válidos, prosseguindo...');
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

      console.log('ðŸ“¦ [CHECKLIST] Dados de submissão preparados:', {
        ordemServico: submissionData.ordemServico,
        clientId: selectedClient,
        vehicleId: selectedVehicle,
        laudoType: submissionData.laudoType,
        dataEmissao: submissionData.dataEmissao,
        totalFields: Object.keys(submissionData).length
      });

      console.log('ðŸŒ [CHECKLIST] Fazendo requisição para /api/laudos/checklist');
      const response = await fetch('/api/laudos/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      console.log('ðŸ“¡ [CHECKLIST] Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('âŒ [CHECKLIST] Erro na resposta da API:', errorData);
        throw new Error(errorData.message || 'Falha ao criar laudo.');
      }

      const newLaudo = await response.json();
      console.log('âœ… [CHECKLIST] Laudo criado com sucesso:', {
        id: newLaudo.id,
        ordemServico: newLaudo.ordemServico
      });

      setMessage('Laudo CHECKLIST criado com sucesso! Gerando PDF...');

      // Gerar HTML automaticamente
      console.log('ðŸ“„ [CHECKLIST] Iniciando geração de PDF para laudo ID:', newLaudo.id);
      await generateChecklistHtmlToPdf(newLaudo.id);

      // Reset form after success
      setTimeout(() => {
        console.log('ðŸ”„ [CHECKLIST] Resetando formulário');
        setMessage('');
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);
        setChecklistData(getExpandedInitialData(nextOrdemServico, temporalCode));
      }, 2000);

    } catch (error) {
      console.error('ðŸ’¥ [CHECKLIST] Erro no handleSubmit:', error);
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
               {option === 'OK' ? '\u2713' : option === 'NA' ? 'N.A' : '\u2717'}
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
      console.log('ðŸŒ [CHECKLIST-HTML] Iniciando geração de HTML via servidor para ID:', laudoId);
      setMessage('Gerando HTML...');

      // Usar a API route server-side para gerar HTML completo com QR code e hash
      const response = await fetch('/api/laudos/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laudoId, format: 'html' }),
      });

      console.log('ðŸ“¡ [CHECKLIST-HTML] Resposta da API:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('âŒ [CHECKLIST-HTML] Erro na resposta:', errorText);
        throw new Error('Falha ao gerar HTML no servidor.');
      }

      // Baixar o HTML retornado pela API
      const htmlBlob = await response.blob();
      const url = URL.createObjectURL(htmlBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-checklist-${laudoId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('âœ… [CHECKLIST-HTML] HTML baixado com sucesso');
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
          drawText('âœ“', x + 1, y + 1, 6);
        } else if (value === 'NOK') {
          drawText('âœ—', x + 1, y + 1, 6);
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
      drawText(companyHeaderLine(adminSettings), 110, height - 30, 7);
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

      // === HASH DE AUTENTICIDADE ===
      currentY -= 75;

      // Gerar hash SHA-256 do laudo para verificação de autenticidade
      const laudoContent = JSON.stringify({
        id: fullLaudo.id,
        ordemServico: fullLaudo.ordemServico,
        codTemporal: fullLaudo.codTemporal,
        dataEmissao: fullLaudo.dataEmissao,
        cliente: fullLaudo.client.name,
        veiculo: fullLaudo.vehicle.placa,
        tipo: 'CHECKLIST'
      });
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(laudoContent));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Desenhar seção de hash/autenticidade no rodapé
      drawRect(40, currentY - 45, 520, 45, false, 0.95);
      drawText('VERIFICAÇÃO DE AUTENTICIDADE', 200, currentY - 12, 9);
      drawText(`SHA-256: ${documentHash.substring(0, 32)}...`, 50, currentY - 25, 7);
      drawText(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Laudo ${fullLaudo.ordemServico}`, 50, currentY - 38, 7);
      drawText('Documento gerado eletronicamente pelo Sistema Easy Laudos', 300, currentY - 38, 6);

      const pdfBytes = await pdfDoc.save();
      download(pdfBytes, `laudo-checklist-${fullLaudo.ordemServico}.pdf`, 'application/pdf');

    } catch (e) {
      console.error('Falha ao gerar PDF', e);
      setMessage('Erro: Não foi possível gerar o PDF.');
    }
  };

  const generateChecklistHtmlToPdf = async (laudoId: string) => {
    try {
      console.log('ðŸ“„ [CHECKLIST-PDF] Iniciando geração de PDF para ID:', laudoId);
      setMessage('Gerando PDF...');

      // Fazer chamada para API route server-side
      console.log('ðŸŒ [CHECKLIST-PDF] Fazendo requisição para /api/laudos/pdf');
      const response = await fetch('/api/laudos/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ laudoId }),
      });

      console.log('ðŸ“¡ [CHECKLIST-PDF] Resposta da API PDF:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('âŒ [CHECKLIST-PDF] Erro na resposta:', errorText);
        throw new Error('Falha ao gerar PDF no servidor');
      }

      // Baixar o PDF retornado pela API
      console.log('ðŸ“¥ [CHECKLIST-PDF] Processando blob do PDF');
      const pdfBlob = await response.blob();
      console.log('ðŸ“¥ [CHECKLIST-PDF] Blob gerado:', {
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

      console.log('âœ… [CHECKLIST-PDF] PDF baixado com sucesso');
      setMessage('PDF gerado com sucesso!');

    } catch (e) {
      console.error('ðŸ’¥ [CHECKLIST-PDF] Erro ao gerar PDF:', e);
      setMessage('Erro: Não foi possível gerar o PDF.');
    }
  };

  return (
    <form onSubmit={handleSubmit} onPointerDown={handleEmptyAreaTap} className={styles.checklistForm}>
      {showShortcutFeedback && (
         <div className={styles.shortcutFeedback}>
           ✅ Todos os itens marcados como OK!
         </div>
      )}
      {tapCount > 0 && tapCount < 5 && (
        <div className={styles.tapProgress} aria-hidden="true">
          {'•'.repeat(tapCount)}{'○'.repeat(5 - tapCount)}
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
            <label className={styles.label}>Código Temporal ðŸŽ²</label>
            <input
              type="text"
              value={checklistData.codTemporal || ''}
              onChange={(e) => handleInputChange('codTemporal', e.target.value)}
              className={styles.input}
              placeholder="Código gerado automaticamente"
              title="Gerado pelo último sorteio da Loteria Federal. Você pode alterar manualmente."
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
          {renderCheckboxGroup('Ã“leo Hidraul., Vazamentos, Tubulação', 'motor_oleoHidraulico')}
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

          {/* LINHA 2 - Eixo 2 dianteiro (PAR - duplo) */}
          <div className={styles.medicaoLabel}>eixo 2 esquerdo dianteiro do caminhão</div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha2_esquerdo1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha2_esquerdo1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha2_esquerdo2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha2_esquerdo2', e.target.value)}
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
                  value={(checklistData.medicao_linha2_direito1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha2_direito1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha2_direito2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha2_direito2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 2 direito dianteiro do caminhão</div>

          {/* LINHA 6 - Eixo D3 dianteiro (PAR - duplo) */}
          <div className={styles.medicaoLabel}>eixo 3 esquerdo dianteiro do caminhão (D3)</div>
          <div className={styles.medicaoCampoPar}>
            <div className={styles.parContainer}>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha6_esquerdo1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha6_esquerdo1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha6_esquerdo2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha6_esquerdo2', e.target.value)}
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
                  value={(checklistData.medicao_linha6_direito1 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha6_direito1', e.target.value)}
                  placeholder="mm"
                />
              </div>
              <div className={styles.pneuField}>
                <input
                  type="text"
                  value={(checklistData.medicao_linha6_direito2 as string) || ''}
                  onChange={(e) => handleInputChange('medicao_linha6_direito2', e.target.value)}
                  placeholder="mm"
                />
              </div>
            </div>
          </div>
          <div className={styles.medicaoLabel}>eixo 3 direito dianteiro do caminhão (D3)</div>

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
          {renderCheckboxGroup('Lanterna Lateral Ã  Ré', 'iluminacao_lanternaLateralRe')}
          {renderCheckboxGroup('Lanterna de Neblina Traseira', 'iluminacao_lanternaNeblina')}
          {renderCheckboxGroup('Lanterna de Projeção', 'iluminacao_lanternaProjecao')}
          {renderCheckboxGroup('Retrorefletores', 'iluminacao_retrorefletores')}
          {/* âœ¨ NOVOS CAMPOS DE ILUMINAÇÃO */}
          {renderCheckboxGroup('Lanternas Delimitadoras Dianteira', 'iluminacao_delimitadoraDianteira')}
          {renderCheckboxGroup('Lanternas Delimitadoras Traseira', 'iluminacao_delimitadoraTraseira')}
          {renderCheckboxGroup('Lanternas de Direção Dianteira', 'iluminacao_direcaoDianteira')}
          {renderCheckboxGroup('Lanternas de Direção Traseira', 'iluminacao_direcaoTraseira')}
          {renderCheckboxGroup('Lanternas Intermitentes de Direção', 'iluminacao_intermitenteDirecao')}
          {renderCheckboxGroup('Lanternas Intermitentes de Advertência', 'iluminacao_intermitenteAdvertencia')}
          {renderCheckboxGroup('Luz de Marcha-Ã -Ré', 'iluminacao_marchaRe')}
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

      {/* âœ¨ NOVAS SEÇÃ•ES */}

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
          {renderCheckboxGroup('Atendimento Ã  Res. Contran 725/18', 'chassiContainer_atendimentoRes725')}
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
          {renderCheckboxGroup('Fixação Vertical Ã  Mesa', 'pinoRei_fixacaoVertical')}
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
