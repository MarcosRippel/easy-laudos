'use client';

import { useState, useEffect } from 'react';
import type { Client, Vehicle } from '@prisma/client';
import type { Equipment } from '@/types/equipment';
import type {
  CreatePinoReiData,
  SimNao,
  AprovaReprovado,
  TipoFixacaoPino,
  TipoFixacaoMesa
} from '@/types/pino-rei';
import {
  initialPinoReiData,
  validateRequiredFields,
  validateDateFormat,
  isValidDiametro
} from '@/types/pino-rei';
import styles from './PinoReiForm.module.css';

interface PinoReiFormProps {
  clients: Client[];
  nextOrdemServico: string;
  temporalCode: string;
  nomeResponsavel?: string;
  initialClientId?: string;
  initialPlaca?: string;
}

export default function PinoReiForm({ clients, nextOrdemServico, temporalCode, nomeResponsavel = '', initialClientId, initialPlaca }: PinoReiFormProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);

  const [pinoReiData, setPinoReiData] = useState({
    ...initialPinoReiData,
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
        setPinoReiData(prev => ({
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
        setPinoReiData(prev => ({ ...prev, placaVeiculo: vehicle.placa }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validações específicas
    if (name === 'diametroRegistrado') {
      if (value === '') {
        // Campo vazio - não definir valor
        return;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      if (!isValidDiametro(numValue)) return;

      setPinoReiData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'dataValidadeInspecao') {
      // Para input type="date", o valor já vem no formato correto YYYY-MM-DD
      setPinoReiData(prev => ({ ...prev, [name]: value }));
    } else {
      setPinoReiData(prev => ({ ...prev, [name]: value }));
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
    setMessage('Fazendo upload da imagem...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      const result = await response.json();
      setPinoReiData(prev => ({ ...prev, [fieldName]: result.url }));
      setMessage('Imagem enviada com sucesso!');

    } catch (error) {
      console.error('Erro no upload:', error);
      setMessage('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadingFiles(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const generateHTML = async (laudoPinoReiId: string) => {
    try {
      setMessage('Gerando HTML...');

      const response = await fetch(`/api/laudos/pino-rei/pdf?id=${laudoPinoReiId}&format=html`);

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

  const generatePDF = async (laudoPinoReiId: string) => {
    try {
      setMessage('Gerando PDF...');

      const response = await fetch(`/api/laudos/pino-rei/pdf?id=${laudoPinoReiId}`);

      if (!response.ok) {
        throw new Error('Falha ao gerar PDF');
      }

      // Download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-pino-rei-${laudoPinoReiId}.pdf`;
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

    // Validação básica sem usar validateRequiredFields (que valida formato de data)
    if (!selectedClient || !selectedVehicle) {
      setMessage('Por favor, selecione cliente e veículo.');
      return;
    }

    if (!pinoReiData.equipmentId) {
      setMessage('Por favor, selecione um equipamento.');
      return;
    }

    if (!pinoReiData.dataValidadeInspecao) {
      setMessage('Por favor, selecione a data de validade da inspeção.');
      return;
    }

    if (!pinoReiData.inspetorResponsavel) {
      setMessage('Por favor, informe o inspetor responsável.');
      return;
    }

    if (!pinoReiData.normasAplicaveis) {
      setMessage('Por favor, informe as normas aplicáveis.');
      return;
    }

    if (pinoReiData.diametroRegistrado <= 0) {
      setMessage('Por favor, informe um diâmetro registrado válido (maior que 0).');
      return;
    }

    // Preparar dados com data convertida para API
    const validationData: CreatePinoReiData = {
      ...pinoReiData,
      clientId: selectedClient,
      vehicleId: selectedVehicle,
      dataValidadeInspecao: formatDateForAPI(pinoReiData.dataValidadeInspecao),
    };

    setIsSubmitting(true);
    setMessage('Criando laudo de Pino Rei...');

    // Converter valores SIM/NÃO para boolean (data já foi convertida em validationData)
    const apiData = {
      ...validationData,
      // Converter strings para booleans conforme esperado pela API
      posicaoVertical: pinoReiData.posicaoVertical === 'SIM',
      presencaTrincas: pinoReiData.presencaTrincas === 'SIM',
      integridadeFixacao: pinoReiData.integridadeFixacao === 'SIM',
      seloIdentificacao: pinoReiData.seloIdentificacao === 'SIM',
      estadoConservacao: pinoReiData.estadoConservacao === 'SIM',
      mesaBemFixada: pinoReiData.mesaBemFixada === 'SIM',
      mesaReparoSolda: pinoReiData.mesaReparoSolda === 'SIM',
      ensaioComplementar: pinoReiData.ensaioComplementar === 'SIM',
    };

    try {
      console.log('🔍 DEBUG: Dados sendo enviados para API:', apiData);

      const response = await fetch('/api/laudos/pino-rei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      console.log('🔍 DEBUG: Status da resposta:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 DEBUG: Erro da API:', errorData);
        throw new Error(`API Error ${response.status}: ${errorData.error || errorData.message || 'Falha ao criar laudo de Pino Rei.'}`);
      }

      const result = await response.json();
      const laudoPinoReiId = result.laudoPinoRei.id;
      setMessage('Laudo de Pino Rei criado com sucesso! Gerando PDF...');
      setCreatedLaudoId(laudoPinoReiId);

      // Gerar PDF automaticamente após criar o laudo
      try {
        await generatePDF(laudoPinoReiId);
        setMessage('Laudo criado e PDF baixado com sucesso! 🎉');
      } catch (pdfError) {
        console.error('Erro ao gerar PDF automaticamente:', pdfError);
        setMessage('Laudo criado com sucesso! Erro ao gerar PDF - use o botão manual.');
        setShowPdfButton(true); // Mostrar botão manual em caso de erro
      }

      // Reset form after 8 segundos
      setTimeout(() => {
        setMessage('');
        setShowPdfButton(false);
        setCreatedLaudoId(null);
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);
        setPinoReiData({
          ...initialPinoReiData,
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
              value={pinoReiData.placaVeiculo}
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
              value={pinoReiData.ordemServico}
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
              value={pinoReiData.dataEmissao}
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
              value={pinoReiData.codigoTemporal}
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
              value={pinoReiData.equipmentId}
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
              value={pinoReiData.dataValidadeInspecao}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 2: Exame Visual do Pino Rei */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Exame Visual do Pino Rei</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Posição Vertical*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="posicaoVertical"
                  value="SIM"
                  checked={pinoReiData.posicaoVertical === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="posicaoVertical"
                  value="NÃO"
                  checked={pinoReiData.posicaoVertical === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Presença de Trincas*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="presencaTrincas"
                  value="SIM"
                  checked={pinoReiData.presencaTrincas === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="presencaTrincas"
                  value="NÃO"
                  checked={pinoReiData.presencaTrincas === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Integridade da Fixação*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="integridadeFixacao"
                  value="SIM"
                  checked={pinoReiData.integridadeFixacao === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="integridadeFixacao"
                  value="NÃO"
                  checked={pinoReiData.integridadeFixacao === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Selo de Identificação*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="seloIdentificacao"
                  value="SIM"
                  checked={pinoReiData.seloIdentificacao === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="seloIdentificacao"
                  value="NÃO"
                  checked={pinoReiData.seloIdentificacao === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
        </div>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de Fixação do Pino*</label>
            <select
              name="tipoFixacaoPino"
              value={pinoReiData.tipoFixacaoPino}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="SOLDA">SOLDA</option>
              <option value="FLANGEADO">FLANGEADO</option>
              <option value="APARAFUSADA">APARAFUSADA</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Diâmetro Registrado (mm)*</label>
            <input
              type="number"
              name="diametroRegistrado"
              value={pinoReiData.diametroRegistrado}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="999.9"
              required
              className={styles.input}
              placeholder="0.0"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Estado de Conservação*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="estadoConservacao"
                  value="SIM"
                  checked={pinoReiData.estadoConservacao === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="estadoConservacao"
                  value="NÃO"
                  checked={pinoReiData.estadoConservacao === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resultado Pino Rei*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoPinoRei"
                  value="APROVADO"
                  checked={pinoReiData.resultadoPinoRei === 'APROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                APROVADO
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoPinoRei"
                  value="REPROVADO"
                  checked={pinoReiData.resultadoPinoRei === 'REPROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                REPROVADO
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 3: Inspeção Visual da Mesa */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Inspeção Visual da Mesa</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Tipo de Fixação da Mesa*</label>
            <select
              name="tipoFixacaoMesa"
              value={pinoReiData.tipoFixacaoMesa}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="SOLDA">SOLDA</option>
              <option value="APARAFUSADA">APARAFUSADA</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Mesa Bem Fixada*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mesaBemFixada"
                  value="SIM"
                  checked={pinoReiData.mesaBemFixada === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mesaBemFixada"
                  value="NÃO"
                  checked={pinoReiData.mesaBemFixada === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Mesa com Reparo de Solda*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mesaReparoSolda"
                  value="SIM"
                  checked={pinoReiData.mesaReparoSolda === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mesaReparoSolda"
                  value="NÃO"
                  checked={pinoReiData.mesaReparoSolda === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resultado Mesa*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoMesa"
                  value="APROVADO"
                  checked={pinoReiData.resultadoMesa === 'APROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                APROVADO
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoMesa"
                  value="REPROVADO"
                  checked={pinoReiData.resultadoMesa === 'REPROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                REPROVADO
              </label>
            </div>
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 4: Ensaios Complementares */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Ensaios Complementares</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ensaio Complementar*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="ensaioComplementar"
                  value="SIM"
                  checked={pinoReiData.ensaioComplementar === 'SIM'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                SIM
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="ensaioComplementar"
                  value="NÃO"
                  checked={pinoReiData.ensaioComplementar === 'NÃO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                NÃO
              </label>
            </div>
          </div>
          {pinoReiData.ensaioComplementar === 'SIM' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Qual Ensaio?</label>
              <input
                type="text"
                name="qualEnsaio"
                value={pinoReiData.qualEnsaio || ''}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Descreva o ensaio complementar"
              />
            </div>
          )}
        </div>
      </fieldset>

      {/* SEÇÃO 5: Registro Fotográfico */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Registro Fotográfico</legend>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Foto do Chassi</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'fotoChassiUrl')}
              className={styles.input}
              disabled={uploadingFiles}
            />
            {pinoReiData.fotoChassiUrl && (
              <div className={styles.imagePreview}>
                <img src={pinoReiData.fotoChassiUrl} alt="Foto Chassi" className={styles.previewImage} />
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Foto do Pino Rei</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'fotoPinoReiUrl')}
              className={styles.input}
              disabled={uploadingFiles}
            />
            {pinoReiData.fotoPinoReiUrl && (
              <div className={styles.imagePreview}>
                <img src={pinoReiData.fotoPinoReiUrl} alt="Foto Pino Rei" className={styles.previewImage} />
              </div>
            )}
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Foto da Mesa</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'fotoMesaUrl')}
              className={styles.input}
              disabled={uploadingFiles}
            />
            {pinoReiData.fotoMesaUrl && (
              <div className={styles.imagePreview}>
                <img src={pinoReiData.fotoMesaUrl} alt="Foto Mesa" className={styles.previewImage} />
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* SEÇÃO 6: Resultado Final e Observações */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>6. Resultado Final e Observações</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resultado Geral*</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoGeral"
                  value="APROVADO"
                  checked={pinoReiData.resultadoGeral === 'APROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                APROVADO
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="resultadoGeral"
                  value="REPROVADO"
                  checked={pinoReiData.resultadoGeral === 'REPROVADO'}
                  onChange={handleInputChange}
                  className={styles.radio}
                />
                REPROVADO
              </label>
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Normas Aplicáveis*</label>
            <input
              type="text"
              name="normasAplicaveis"
              value={pinoReiData.normasAplicaveis}
              onChange={handleInputChange}
              required
              className={styles.input}
              placeholder="Portaria nº457/08, Portaria nº70/2008"
            />
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Inspetor Responsável*</label>
            <input
              type="text"
              name="inspetorResponsavel"
              value={pinoReiData.inspetorResponsavel}
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
            value={pinoReiData.observacoes || ''}
            onChange={handleInputChange}
            className={styles.textarea}
            rows={4}
            placeholder="Observações sobre a inspeção do Pino Rei..."
          />
        </div>
      </fieldset>

      <div className={styles.submitSection}>
        <button
          type="submit"
          disabled={isSubmitting || uploadingFiles}
          className={styles.button}
        >
          {isSubmitting ? '🔧 Criando Laudo...' : '🔧 Criar Laudo de Pino Rei'}
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