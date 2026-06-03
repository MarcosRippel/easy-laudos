'use client';

import { useState, useEffect } from 'react';
import type { Client, Vehicle } from '@prisma/client';
import type { Equipment } from '@/types/equipment';
import type {
  CreateQuintaRodaData,
  SimNao,
  AprovaReprovado,
  CampoExameVisual
} from '@/types/quinta-roda';
import {
  initialQuintaRodaData,
  validateRequiredFields,
  validateDateFormat,
  descricoesCampos,
  camposExameVisual,
  calculateResultadoFinal
} from '@/types/quinta-roda';
import styles from './QuintaRodaForm.module.css';

interface QuintaRodaFormProps {
  clients: Client[];
  nextOrdemServico: string;
  temporalCode: string;
  nomeResponsavel?: string;
  initialClientId?: string;
  initialPlaca?: string;
}

export default function QuintaRodaForm({ clients, nextOrdemServico, temporalCode, nomeResponsavel = '', initialClientId, initialPlaca }: QuintaRodaFormProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);

  const [quintaRodaData, setQuintaRodaData] = useState({
    ...initialQuintaRodaData,
    ordemServico: nextOrdemServico,
    codigoTemporal: temporalCode,
    dataEmissao: new Date().toISOString().split('T')[0],
    inspetorResponsavel: nomeResponsavel, // Pré-preenchido do perfil do inspetor
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [createdLaudoId, setCreatedLaudoId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Carregar equipamentos do tipo PAQUIMETRO e código temporal real
  useEffect(() => {
    fetchEquipments();
    fetchTemporalCode();

    // Restaurar URLs das imagens do localStorage (para sobreviver ao Hot Reload)
    const savedImages = localStorage.getItem('quinta-roda-images');
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        console.log('🔄 RECUPERANDO imagens do localStorage:', parsedImages);
        setQuintaRodaData(prev => ({
          ...prev,
          fotoQuintaRoda1Url: parsedImages.fotoQuintaRoda1Url || '',
          fotoQuintaRoda2Url: parsedImages.fotoQuintaRoda2Url || '',
          fotoChassiUrl: parsedImages.fotoChassiUrl || ''
        }));
      } catch (error) {
        console.error('Erro ao restaurar imagens do localStorage:', error);
        localStorage.removeItem('quinta-roda-images');
      }
    }
  }, []);

  // Auto-selecionar cliente e veículo quando vindo da lista de veículos
  useEffect(() => {
    if (initialClientId) {
      setSelectedClient(initialClientId);
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

  // Função para buscar código temporal real da loteria
  const fetchTemporalCode = async () => {
    try {
      const response = await fetch('/api/temporal-code');
      if (response.ok) {
        const data = await response.json();
        setQuintaRodaData(prev => ({
          ...prev,
          codigoTemporal: data.code
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar código temporal:', error);
      // Manter valor padrão em caso de erro
    }
  };

  // Função para calcular status do equipamento
  const getEquipmentStatus = (expirationDate: string) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffDays = Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'expired';
    if (diffDays <= 15) return 'critical';
    if (diffDays <= 30) return 'warning';
    return 'valid';
  };

  // Função para gerar emoji de status
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'expired': return '❌';
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const fetchEquipments = async () => {
    setIsEquipmentLoading(true);
    try {
      const response = await fetch('/api/equipments?type=PAQUIMETRO');
      if (response.ok) {
        const data = await response.json();
        setEquipments(data);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setIsEquipmentLoading(false);
    }
  };

  const handleClientChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = event.target.value;
    setSelectedClient(clientId);
    setSelectedVehicle('');
    setVehicles([]);

    if (clientId) {
      setIsVehicleLoading(true);
      try {
        const response = await fetch(`/api/vehicles?clientId=${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        const vehicleData = await response.json();
        setVehicles(vehicleData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsVehicleLoading(false);
      }
    }
  };

  const handleVehicleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = event.target.value;
    setSelectedVehicle(vehicleId);

    // Auto-preencher placa do veículo
    if (vehicleId) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setQuintaRodaData(prev => ({ ...prev, placaVeiculo: vehicle.placa }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'dataValidadeInspecao') {
      // Para input type="date", o valor já vem no formato correto YYYY-MM-DD
      setQuintaRodaData(prev => ({ ...prev, [name]: value }));
    } else {
      setQuintaRodaData(prev => ({ ...prev, [name]: value }));
    }

    // Auto-calcular resultado final quando campos de exame visual mudarem
    if (camposExameVisual.includes(name as CampoExameVisual)) {
      const updatedData = { ...quintaRodaData, [name]: value };
      const calculatedResult = calculateResultadoFinal(updatedData);
      setQuintaRodaData(prev => ({ ...prev, [name]: value, resultadoFinal: calculatedResult }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setMessage('Apenas arquivos de imagem são aceitos.');
      return;
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploadingFiles(true);
    setMessage(`Fazendo upload da imagem para ${fieldName}...`);

    console.log('🖼️ DEBUG UPLOAD - Iniciando:', {
      fieldName,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('🔄 DEBUG UPLOAD - Enviando para /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('📡 DEBUG UPLOAD - Resposta recebida:', {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const result = await response.json();
      console.log('✅ DEBUG UPLOAD - Resultado:', {
        fieldName,
        resultUrl: result.url,
        urlLength: result.url?.length || 0,
        isValidUrl: !!result.url && result.url.trim() !== ''
      });

      // Atualizar estado e salvar no localStorage para persistir durante Hot Reload
      setQuintaRodaData(prev => {
        const newData = { ...prev, [fieldName]: result.url };
        console.log('🔄 DEBUG UPLOAD - Estado atualizado:', {
          fieldName,
          oldValue: prev[fieldName as keyof typeof prev],
          newValue: result.url,
          allImageUrls: {
            fotoQuintaRoda1Url: newData.fotoQuintaRoda1Url || 'EMPTY',
            fotoQuintaRoda2Url: newData.fotoQuintaRoda2Url || 'EMPTY',
            fotoChassiUrl: newData.fotoChassiUrl || 'EMPTY'
          },
          hasAnyImageAfterUpdate: !!(newData.fotoQuintaRoda1Url || newData.fotoQuintaRoda2Url || newData.fotoChassiUrl)
        });

        // Persistir URLs no localStorage para sobreviver ao Hot Reload
        localStorage.setItem('quinta-roda-images', JSON.stringify({
          fotoQuintaRoda1Url: newData.fotoQuintaRoda1Url || '',
          fotoQuintaRoda2Url: newData.fotoQuintaRoda2Url || '',
          fotoChassiUrl: newData.fotoChassiUrl || ''
        }));

        return newData;
      });

      setMessage(`Imagem ${fieldName} enviada com sucesso!`);

    } catch (error) {
      console.error('❌ DEBUG UPLOAD - Erro:', error);
      setMessage(`Erro ao enviar imagem ${fieldName}. Tente novamente.`);
    } finally {
      setUploadingFiles(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateHTML = async (laudoQuintaRodaId: string) => {
    try {
      setMessage('Gerando HTML...');

      const response = await fetch(`/api/laudos/quinta-roda/pdf?id=${laudoQuintaRodaId}&format=html`);

      if (!response.ok) {
        throw new Error('Falha ao gerar HTML');
      }

      const htmlContent = await response.text();

      // Abrir HTML em nova aba
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      }

      setMessage('HTML gerado e aberto em nova aba!');

    } catch (error) {
      console.error('Erro ao gerar HTML:', error);
      setMessage('Erro ao gerar HTML. Tente novamente.');
    }
  };

  const generatePDF = async (laudoQuintaRodaId: string) => {
    try {
      setMessage('Gerando PDF...');

      const response = await fetch(`/api/laudos/quinta-roda/pdf?id=${laudoQuintaRodaId}`);

      if (!response.ok) {
        throw new Error('Falha ao gerar PDF');
      }

      // Download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-quinta-roda-${laudoQuintaRodaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('PDF gerado e baixado com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setMessage('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient || !selectedVehicle) {
      setMessage('Por favor, selecione cliente e veículo.');
      return;
    }

    // Converter data de YYYY-MM-DD para DD/MM/AAAA
    const formatDateForAPI = (dateStr: string): string => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    // Validação básica
    if (!selectedClient || !selectedVehicle) {
      setMessage('Por favor, selecione cliente e veículo.');
      return;
    }

    if (!quintaRodaData.equipmentId) {
      setMessage('Por favor, selecione um equipamento.');
      return;
    }

    if (!quintaRodaData.dataValidadeInspecao) {
      setMessage('Por favor, selecione a data de validade da inspeção.');
      return;
    }

    if (!quintaRodaData.inspetorResponsavel) {
      setMessage('Por favor, informe o inspetor responsável.');
      return;
    }

    if (!quintaRodaData.normasAplicaveis) {
      setMessage('Por favor, informe as normas aplicáveis.');
      return;
    }

    if (!quintaRodaData.fabricanteMarca) {
      setMessage('Por favor, informe o fabricante/marca da quinta roda.');
      return;
    }

    if (!quintaRodaData.modelo) {
      setMessage('Por favor, informe o modelo da quinta roda.');
      return;
    }

    if (!quintaRodaData.numeroIdentificacao) {
      setMessage('Por favor, informe o número de identificação da quinta roda.');
      return;
    }

    // Preparar dados com data convertida para API
    const validationData: CreateQuintaRodaData = {
      ...quintaRodaData,
      clientId: selectedClient,
      vehicleId: selectedVehicle,
      dataValidadeInspecao: formatDateForAPI(quintaRodaData.dataValidadeInspecao),
    };

    setIsSubmitting(true);
    setMessage('Criando laudo de Quinta Roda...');

    try {
      // LOG DETALHADO DOS DADOS ANTES DO ENVIO
      console.log('🚀 DEBUG SUBMIT - Estado atual das imagens:', {
        fotoQuintaRoda1Url: quintaRodaData.fotoQuintaRoda1Url || 'EMPTY',
        fotoQuintaRoda2Url: quintaRodaData.fotoQuintaRoda2Url || 'EMPTY',
        fotoChassiUrl: quintaRodaData.fotoChassiUrl || 'EMPTY',
        hasAnyImage: !!(quintaRodaData.fotoQuintaRoda1Url || quintaRodaData.fotoQuintaRoda2Url || quintaRodaData.fotoChassiUrl),
        imageUrlLengths: {
          foto1: quintaRodaData.fotoQuintaRoda1Url?.length || 0,
          foto2: quintaRodaData.fotoQuintaRoda2Url?.length || 0,
          fotoChassi: quintaRodaData.fotoChassiUrl?.length || 0
        }
      });

      console.log('📤 DEBUG SUBMIT - Dados completos sendo enviados para API:');
      console.log('- fotoQuintaRoda1Url:', validationData.fotoQuintaRoda1Url || 'EMPTY');
      console.log('- fotoQuintaRoda2Url:', validationData.fotoQuintaRoda2Url || 'EMPTY');
      console.log('- fotoChassiUrl:', validationData.fotoChassiUrl || 'EMPTY');
      console.log('- ordemServico:', validationData.ordemServico);
      console.log('- hasAnyImageInValidationData:', !!(validationData.fotoQuintaRoda1Url || validationData.fotoQuintaRoda2Url || validationData.fotoChassiUrl));

      const response = await fetch('/api/laudos/quinta-roda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationData),
      });

      console.log('📡 DEBUG SUBMIT - Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ DEBUG SUBMIT - Erro da API:', errorData);
        throw new Error(`API Error ${response.status}: ${errorData.error || errorData.message || 'Falha ao criar laudo de Quinta Roda.'}`);
      }

      const result = await response.json();
      console.log('✅ DEBUG SUBMIT - Resposta da API:', {
        laudoId: result.laudo?.id,
        quintaRodaId: result.laudoQuintaRoda?.id,
        imageFieldsCreated: {
          fotoQuintaRoda1Url: result.laudoQuintaRoda?.fotoQuintaRoda1Url,
          fotoQuintaRoda2Url: result.laudoQuintaRoda?.fotoQuintaRoda2Url,
          fotoChassiUrl: result.laudoQuintaRoda?.fotoChassiUrl
        }
      });

      const laudoQuintaRodaId = result.laudoQuintaRoda.id;
      setMessage('Laudo de Quinta Roda criado com sucesso! Gerando PDF...');
      setCreatedLaudoId(laudoQuintaRodaId);

      // Gerar PDF automaticamente após criar o laudo
      try {
        await generatePDF(laudoQuintaRodaId);
        setMessage('Laudo criado e PDF baixado com sucesso! 🎉');
      } catch (pdfError) {
        console.error('Erro ao gerar PDF automaticamente:', pdfError);
        setMessage('Laudo criado com sucesso! Erro ao gerar PDF - use o botão manual.');
        setShowPdfButton(true); // Mostrar botão manual em caso de erro
      }

      // Limpar localStorage das imagens após sucesso
      localStorage.removeItem('quinta-roda-images');
      console.log('🧹 LIMPEZA: localStorage das imagens removido após sucesso');

      // Reset form after 8 segundos
      setTimeout(() => {
        setMessage('');
        setShowPdfButton(false);
        setCreatedLaudoId(null);
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);
        setQuintaRodaData({
          ...initialQuintaRodaData,
          ordemServico: nextOrdemServico,
          codigoTemporal: temporalCode,
          dataEmissao: new Date().toISOString().split('T')[0],
        });
        // Atualizar código temporal real após reset
        fetchTemporalCode();
      }, 8000);

    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? `Erro: ${error.message}` : 'Erro desconhecido ocorreu.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      {/* SEÇÃO 1: Cabeçalho e Dados Básicos */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Cabeçalho e Dados Básicos</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cliente*</label>
            <select value={selectedClient} onChange={handleClientChange} required className={styles.select}>
              <option value="">-- Selecionar Cliente --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Veículo*</label>
            <select
              value={selectedVehicle}
              onChange={handleVehicleChange}
              disabled={!selectedClient || isVehicleLoading}
              required
              className={styles.select}
            >
              {isVehicleLoading ? (
                <option>Carregando...</option>
              ) : vehicles.length > 0 ? (
                <>
                  <option value="">-- Selecionar Veículo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.placa} - {v.marcaModelo}</option>
                  ))}
                </>
              ) : (
                <option>-- Selecionar Cliente Primeiro --</option>
              )}
            </select>
          </div>
        </div>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Placa do Veículo*</label>
            <input
              type="text"
              name="placaVeiculo"
              value={quintaRodaData.placaVeiculo}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="ABC-1234"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ordem de Serviço*</label>
            <input
              type="text"
              name="ordemServico"
              value={quintaRodaData.ordemServico}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Digite a OS"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Data de Emissão*</label>
            <input
              type="date"
              name="dataEmissao"
              value={quintaRodaData.dataEmissao}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Código Temporal (Loteria Federal) 🎲</label>
            <input
              type="text"
              name="codigoTemporal"
              value={quintaRodaData.codigoTemporal}
              onChange={handleInputChange}
              className={styles.input}
              placeholder="Código gerado automaticamente"
              title="Gerado pelo último sorteio da Loteria Federal. Você pode alterar manualmente."
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Equipamento*</label>
            <select
              name="equipmentId"
              value={quintaRodaData.equipmentId}
              onChange={handleInputChange}
              required
              className={styles.select}
              disabled={isEquipmentLoading}
            >
              {isEquipmentLoading ? (
                <option>Carregando equipamentos...</option>
              ) : (
                <>
                  <option value="">-- Selecionar Equipamento --</option>
                  {equipments.map(equipment => {
                    const status = getEquipmentStatus(equipment.expirationDate.toString());
                    const emoji = getStatusEmoji(status);
                    const daysToExpire = Math.ceil((new Date(equipment.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <option key={equipment.id} value={equipment.id}>
                        {emoji} {equipment.name} {equipment.model} - {equipment.certificateNumber}
                        {status !== 'valid' ? ` (${daysToExpire} dias)` : ''}
                      </option>
                    );
                  })}
                </>
              )}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Data Validade Inspeção*</label>
            <input
              type="date"
              name="dataValidadeInspecao"
              value={quintaRodaData.dataValidadeInspecao}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 2: Dados da Quinta Roda */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Dados da Quinta Roda</legend>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Fabricante/Marca*</label>
            <input
              type="text"
              name="fabricanteMarca"
              value={quintaRodaData.fabricanteMarca}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Ex: Jost, SAF, etc."
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Modelo*</label>
            <input
              type="text"
              name="modelo"
              value={quintaRodaData.modelo}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Ex: JSK37C, etc."
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nº Identificação*</label>
            <input
              type="text"
              name="numeroIdentificacao"
              value={quintaRodaData.numeroIdentificacao}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Número de identificação da quinta roda"
            />
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 3: Exame Visual (12 itens) */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Exame Visual da Quinta Roda (12 itens)</legend>
        <div className={styles.grid}>
          {camposExameVisual.map((campo, index) => (
            <div key={campo} className={styles.inputGroup}>
              <label className={styles.label}>
                {index + 1}. {descricoesCampos[campo]}*
              </label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={campo}
                    value="SIM"
                    checked={quintaRodaData[campo] === 'SIM'}
                    onChange={handleInputChange}
                    className={styles.radio}
                  />
                  SIM
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name={campo}
                    value="NÃO"
                    checked={quintaRodaData[campo] === 'NÃO'}
                    onChange={handleInputChange}
                    className={styles.radio}
                  />
                  NÃO
                </label>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* SEÇÃO 4: Resultado Final */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Resultado Final</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resultado Final*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoFinal"
                  value="APROVADO"
                  checked={quintaRodaData.resultadoFinal === 'APROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                APROVADO
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoFinal"
                  value="REPROVADO"
                  checked={quintaRodaData.resultadoFinal === 'REPROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                REPROVADO
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 5: Registro Fotográfico (3 fotos conforme layout) */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Registro Fotográfico</legend>

        {/* REGISTRO FOTOGRÁFICO DA QUINTA RODA - 2 fotos lado a lado */}
        <div className={styles.photoSection}>
          <h4 className={styles.photoSectionTitle}>REGISTRO FOTOGRÁFICO DA QUINTA RODA</h4>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Primeira Foto da Quinta Roda</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'fotoQuintaRoda1Url')}
                className={styles.input}
                disabled={uploadingFiles}
              />
              {quintaRodaData.fotoQuintaRoda1Url && (
                <div className={styles.imagePreview}>
                  <img src={quintaRodaData.fotoQuintaRoda1Url} alt="Primeira Foto Quinta Roda" className={styles.previewImage} />
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Segunda Foto da Quinta Roda</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'fotoQuintaRoda2Url')}
                className={styles.input}
                disabled={uploadingFiles}
              />
              {quintaRodaData.fotoQuintaRoda2Url && (
                <div className={styles.imagePreview}>
                  <img src={quintaRodaData.fotoQuintaRoda2Url} alt="Segunda Foto Quinta Roda" className={styles.previewImage} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOTO DO CHASSI - 1 foto centralizada */}
        <div className={styles.photoSection}>
          <h4 className={styles.photoSectionTitle}>FOTO DO CHASSI</h4>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Foto do Chassi</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'fotoChassiUrl')}
              className={styles.input}
              disabled={uploadingFiles}
            />
            {quintaRodaData.fotoChassiUrl && (
              <div className={styles.imagePreview}>
                <img src={quintaRodaData.fotoChassiUrl} alt="Foto do Chassi" className={styles.previewImage} />
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 6: Observações Finais */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>6. Observações Finais</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Normas Aplicáveis*</label>
            <input
              type="text"
              name="normasAplicaveis"
              value={quintaRodaData.normasAplicaveis}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Portaria nº457/08, Portaria nº70/2008, NBR 8160"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Inspetor Responsável*</label>
            <input
              type="text"
              name="inspetorResponsavel"
              value={quintaRodaData.inspetorResponsavel}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Nome do inspetor responsável"
            />
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Observações</label>
          <textarea
            name="observacoes"
            value={quintaRodaData.observacoes || ''}
            onChange={handleInputChange}
            className={styles.textarea}
            rows={4}
            placeholder="Observações sobre a inspeção da Quinta Roda..."
          />
        </div>
      </fieldset>

      <div className={styles.submitSection}>
        <button
          type="submit"
          disabled={isSubmitting || uploadingFiles}
          className={styles.button}
        >
          {isSubmitting ? '🔧 Criando Laudo...' : '🔧 Criar Laudo de Quinta Roda'}
        </button>

        {showPdfButton && createdLaudoId && (
          <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
            <button
              type="button"
              onClick={() => generateHTML(createdLaudoId)}
              className={styles.button}
              style={{
                background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                border: 'none'
              }}
            >
              🌐 Visualizar HTML
            </button>
            <button
              type="button"
              onClick={() => generatePDF(createdLaudoId)}
              className={styles.button}
              style={{
                background: 'linear-gradient(135deg, #007bff, #0056b3)',
                border: 'none'
              }}
            >
              📄 Gerar PDF
            </button>
          </div>
        )}

        {message && (
          <span className={`${styles.message} ${message.includes('Erro') ? styles.error : styles.success}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}