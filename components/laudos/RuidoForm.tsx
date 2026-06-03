'use client';

import { useState, useEffect, useRef } from 'react';
import type { Client, Vehicle } from '@prisma/client';
import type { Equipment } from '@/types/equipment';
import type { CreateRuidoData } from '@/types/ruido';
import { validateAllRuidoValues, RUIDO_MIN_VALUE, RUIDO_MAX_VALUE } from '@/types/ruido';
import styles from './RuidoForm.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RuidoFormProps {
  clients: Client[];
  nextOrdemServico: string;
  temporalCode: string;
  initialClientId?: string;
  initialPlaca?: string;
}

const initialRuidoData: Omit<CreateRuidoData, 'clientId' | 'vehicleId'> = {
  ordemServico: '',
  dataEmissao: '',
  codTemporal: '',
  dataVencimento: '',
  observacoes: 'Ensaio realizado conforme INSTRUÇÃO NORMATIVA IBAMA Nº 6, DE 8 DE JUNHO DE 2010. NBR 9714 - Veículo rodoviário automotor - Ruído emitido na condição parado',
  equipmentId: '',
  aceleracao1: 0,
  aceleracao2: 0,
  aceleracao3: 0,
  aceleracao4: 0,
  aceleracao5: 0,
  aceleracao6: 0,
  marchaLenta1: 0,
  marchaLenta2: 0,
  marchaLenta3: 0,
  marchaLenta4: 0,
  marchaLenta5: 0,
  marchaLenta6: 0,
  ruidoMaximoMedido: undefined,
  resultado: 'APROVADO',
  inspetorResponsavel: '',
};

export default function RuidoForm({ clients, nextOrdemServico, temporalCode, initialClientId, initialPlaca }: RuidoFormProps) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isEquipmentLoading, setIsEquipmentLoading] = useState(false);

  const [ruidoData, setRuidoData] = useState({
    ...initialRuidoData,
    ordemServico: nextOrdemServico,
    codTemporal: temporalCode,
    observacoes: 'Ensaio realizado conforme INSTRUÇÃO NORMATIVA IBAMA Nº 6, DE 8 DE JUNHO DE 2010. NBR 9714 - Veículo rodoviário automotor - Ruído emitido na condição parado',
  });

  const [calculations, setCalculations] = useState({
    medianaAceleracao: 0,
    maxAceleracao: 0,
    medianaMarchaLenta: 0,
    maxMarchaLenta: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [createdLaudoId, setCreatedLaudoId] = useState<string | null>(null);

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

  // Configuração do gráfico
  const chartData = {
    labels: ['Medição 1', 'Medição 2', 'Medição 3', 'Medição 4', 'Medição 5', 'Medição 6'],
    datasets: [
      {
        label: 'Aceleração (dB)',
        data: [
          ruidoData.aceleracao1,
          ruidoData.aceleracao2,
          ruidoData.aceleracao3,
          ruidoData.aceleracao4,
          ruidoData.aceleracao5,
          ruidoData.aceleracao6
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Marcha Lenta (dB)',
        data: [
          ruidoData.marchaLenta1,
          ruidoData.marchaLenta2,
          ruidoData.marchaLenta3,
          ruidoData.marchaLenta4,
          ruidoData.marchaLenta5,
          ruidoData.marchaLenta6
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#fff',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'Medições de Ruído em Tempo Real',
        color: '#fff',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#666',
        borderWidth: 1,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} dB`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: 120,
        ticks: {
          color: '#ccc',
          font: {
            size: 12
          },
          callback: function (value: any) {
            return value + ' dB';
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        title: {
          display: true,
          text: 'Nível de Ruído (dB)',
          color: '#fff',
          font: {
            size: 14
          }
        }
      },
      x: {
        ticks: {
          color: '#ccc',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const
    }
  };

  // Carregar equipamentos de ruído e código temporal real
  useEffect(() => {
    fetchEquipments();
    fetchTemporalCode();
  }, []);

  // Função para buscar código temporal real da loteria
  const fetchTemporalCode = async () => {
    try {
      const response = await fetch('/api/temporal-code');
      if (response.ok) {
        const data = await response.json();
        setRuidoData(prev => ({
          ...prev,
          codTemporal: data.code
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar código temporal:', error);
      // Manter valor padrão em caso de erro
    }
  };

  // Recalcular estatísticas quando medições mudarem
  useEffect(() => {
    calculateStatistics();
  }, [
    ruidoData.aceleracao1, ruidoData.aceleracao2, ruidoData.aceleracao3,
    ruidoData.aceleracao4, ruidoData.aceleracao5, ruidoData.aceleracao6,
    ruidoData.marchaLenta1, ruidoData.marchaLenta2, ruidoData.marchaLenta3,
    ruidoData.marchaLenta4, ruidoData.marchaLenta5, ruidoData.marchaLenta6,
  ]);

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
      // Buscar apenas equipamentos ativos e não vencidos
      const response = await fetch('/api/equipments');
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
        setVehicles(await response.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsVehicleLoading(false);
      }
    }
  };

  const handleRuidoDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validar valores numéricos de ruído
    if (name.includes('aceleracao') || name.includes('marchaLenta') || name === 'ruidoMaximoMedido') {
      // Permitir string vazia para limpeza do campo
      if (value === '') {
        setRuidoData(prev => ({ ...prev, [name]: name === 'ruidoMaximoMedido' ? undefined : 0 }));
        return;
      }

      const numValue = parseFloat(value);
      // Verificar se é um número válido
      if (isNaN(numValue)) {
        return; // Não atualizar se não for um número válido
      }

      // Validar range
      if (numValue < RUIDO_MIN_VALUE || numValue > RUIDO_MAX_VALUE) {
        return; // Não atualizar se valor fora do range
      }

      setRuidoData(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'dataVencimento') {
      // Validar formato DD/MM/AAAA para data de vencimento
      const dateRegex = /^\d{0,2}\/?\d{0,2}\/?\d{0,4}$/;
      if (value === '' || dateRegex.test(value)) {
        setRuidoData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setRuidoData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Função para validar data no formato DD/MM/AAAA
  const validateDateFormat = (dateString: string) => {
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

  const calculateMedian = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const calculateStatistics = () => {
    const aceleracaoValues = [
      ruidoData.aceleracao1, ruidoData.aceleracao2, ruidoData.aceleracao3,
      ruidoData.aceleracao4, ruidoData.aceleracao5, ruidoData.aceleracao6
    ];

    const marchaLentaValues = [
      ruidoData.marchaLenta1, ruidoData.marchaLenta2, ruidoData.marchaLenta3,
      ruidoData.marchaLenta4, ruidoData.marchaLenta5, ruidoData.marchaLenta6
    ];

    setCalculations({
      medianaAceleracao: calculateMedian(aceleracaoValues),
      maxAceleracao: Math.max(...aceleracaoValues),
      medianaMarchaLenta: calculateMedian(marchaLentaValues),
      maxMarchaLenta: Math.max(...marchaLentaValues),
    });
  };

  const generateHTML = async (laudoRuidoId: string) => {
    try {
      setMessage('Gerando HTML...');

      const response = await fetch('/api/laudos/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laudoId: laudoRuidoId,
          type: 'ruido',
          format: 'html'
        }),
      });

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

  const generatePDF = async (laudoRuidoId: string, attempt = 1) => {
    const maxAttempts = 3;

    try {
      setMessage(`Gerando PDF... ${attempt > 1 ? `(Tentativa ${attempt})` : ''}`);
      console.log(`🔊 Gerando PDF - Tentativa ${attempt}/${maxAttempts} - Laudo ID: ${laudoRuidoId}`);

      // Pequena pausa antes de tentar gerar PDF (evitar problemas de timing)
      if (attempt === 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const response = await fetch('/api/laudos/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laudoId: laudoRuidoId,
          type: 'ruido'
        }),
      });

      console.log(`📊 PDF Response Status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ PDF Error Response:`, errorText);

        // Retry automático para erros temporários
        if (attempt < maxAttempts && (response.status >= 500 || response.status === 404)) {
          console.log(`🔄 Tentando novamente em 2 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return generatePDF(laudoRuidoId, attempt + 1);
        }

        throw new Error(`Falha ao gerar PDF (${response.status}): ${errorText}`);
      }

      // Download do PDF
      const blob = await response.blob();
      console.log(`✅ PDF Blob Size: ${blob.size} bytes`);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-ruido-${laudoRuidoId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('PDF gerado e baixado com sucesso!');
      console.log('✅ PDF baixado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);

      if (attempt < maxAttempts) {
        console.log(`🔄 Tentando novamente em 3 segundos...`);
        setMessage(`Erro na tentativa ${attempt}. Tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generatePDF(laudoRuidoId, attempt + 1);
      }

      setMessage(`Erro ao gerar PDF após ${maxAttempts} tentativas. Verifique o console para detalhes.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient || !selectedVehicle || !ruidoData.equipmentId) {
      setMessage('Por favor, selecione cliente, veículo e equipamento.');
      return;
    }

    if (!validateAllRuidoValues(ruidoData)) {
      setMessage('Valores de ruído devem estar entre 0 e 120 dB.');
      return;
    }

    // Validar data de vencimento se preenchida
    if (ruidoData.dataVencimento && !validateDateFormat(ruidoData.dataVencimento)) {
      setMessage('Data de vencimento deve estar no formato DD/MM/AAAA e ser uma data válida.');
      return;
    }

    setIsSubmitting(true);
    setMessage('Criando laudo de ruído...');

    try {
      const submissionData: CreateRuidoData = {
        ...ruidoData,
        clientId: selectedClient,
        vehicleId: selectedVehicle,
      };

      const response = await fetch('/api/laudos/ruido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar laudo de ruído.');
      }

      const result = await response.json();
      const laudoId = result.laudo.id; // CORREÇÃO: usar laudo.id ao invés de laudoRuido.id
      setMessage('Laudo de ruído criado com sucesso!');
      setCreatedLaudoId(laudoId);
      setShowPdfButton(true);

      // Reset form after 10 segundos
      setTimeout(async () => {
        setMessage('');
        setShowPdfButton(false);
        setCreatedLaudoId(null);
        setSelectedClient('');
        setSelectedVehicle('');
        setVehicles([]);

        // Buscar novo número de OS do servidor para evitar duplicatas
        let newOS = nextOrdemServico;
        try {
          const osResponse = await fetch('/api/laudos/next-os');
          if (osResponse.ok) {
            const osData = await osResponse.json();
            newOS = osData.nextOrdemServico;
          }
        } catch (error) {
          console.error('Erro ao buscar próximo OS:', error);
        }

        setRuidoData({
          ...initialRuidoData,
          ordemServico: newOS,
          codTemporal: temporalCode,
          observacoes: 'Ensaio realizado conforme INSTRUÇÃO NORMATIVA IBAMA Nº 6, DE 8 DE JUNHO DE 2010. NBR 9714 - Veículo rodoviário automotor - Ruído emitido na condição parado',
        });
        // Atualizar código temporal real após reset
        fetchTemporalCode();
      }, 10000);

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
      {/* Cliente e Veículo */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>1. Cliente & Veículo</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Cliente</label>
            <select value={selectedClient} onChange={handleClientChange} required className={styles.select}>
              <option value="">-- Selecionar Cliente --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Veículo</label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
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
      </fieldset>

      {/* Dados do Laudo */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>2. Dados do Laudo</legend>
        <div className={styles.grid3col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ordem de Serviço</label>
            <input
              type="text"
              name="ordemServico"
              value={ruidoData.ordemServico}
              onChange={handleRuidoDataChange}
              required
              className={styles.input}
              placeholder="Digite a OS"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Código Temporal (Loteria Federal) 🎲</label>
            <input
              type="text"
              name="codTemporal"
              value={ruidoData.codTemporal}
              onChange={handleRuidoDataChange}
              className={styles.input}
              placeholder="Código gerado automaticamente"
              title="Gerado pelo último sorteio da Loteria Federal. Você pode alterar manualmente."
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Data de Emissão</label>
            <input
              type="date"
              name="dataEmissao"
              value={ruidoData.dataEmissao}
              onChange={handleRuidoDataChange}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Data de Vencimento</label>
            <input
              type="text"
              name="dataVencimento"
              placeholder="DD/MM/AAAA"
              value={ruidoData.dataVencimento}
              onChange={handleRuidoDataChange}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Equipamento</label>
            <select
              name="equipmentId"
              value={ruidoData.equipmentId}
              onChange={handleRuidoDataChange}
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
            <label className={styles.label}>Espaço para Assinatura Digital</label>
            <input
              type="text"
              name="inspetorResponsavel"
              value={ruidoData.inspetorResponsavel}
              onChange={handleRuidoDataChange}
              className={styles.input}
              placeholder="Campo reservado para assinatura digital"
              style={{ backgroundColor: '#555', color: '#999' }}
              readOnly
            />
          </div>
        </div>
      </fieldset>

      {/* Medições de Aceleração */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>3. Medições de Aceleração (dB)</legend>
        <div className={styles.grid6col}>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className={styles.inputGroup}>
              <label className={styles.label}>Medição {num}</label>
              <input
                type="number"
                name={`aceleracao${num}`}
                value={ruidoData[`aceleracao${num}` as keyof typeof ruidoData]}
                onChange={handleRuidoDataChange}
                min={RUIDO_MIN_VALUE}
                max={RUIDO_MAX_VALUE}
                step="0.1"
                required
                className={styles.input}
                placeholder="0.0"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Medições de Marcha Lenta */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>4. Medições de Marcha Lenta (dB)</legend>
        <div className={styles.grid6col}>
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className={styles.inputGroup}>
              <label className={styles.label}>Medição {num}</label>
              <input
                type="number"
                name={`marchaLenta${num}`}
                value={ruidoData[`marchaLenta${num}` as keyof typeof ruidoData]}
                onChange={handleRuidoDataChange}
                min={RUIDO_MIN_VALUE}
                max={RUIDO_MAX_VALUE}
                step="0.1"
                required
                className={styles.input}
                placeholder="0.0"
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Gráfico de Barras */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>🔊 Visualização das Medições</legend>
        <div className={styles.chartContainer}>
          <Bar data={chartData} options={chartOptions} height={400} />
        </div>
      </fieldset>

      {/* Cálculos Automáticos */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>5. Cálculos Automáticos</legend>
        <div className={styles.grid4col}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Mediana Aceleração</label>
            <input
              type="number"
              value={calculations.medianaAceleracao.toFixed(1)}
              readOnly
              className={styles.input}
              style={{ backgroundColor: '#444', color: '#ccc' }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Máximo Aceleração</label>
            <input
              type="number"
              value={calculations.maxAceleracao.toFixed(1)}
              readOnly
              className={styles.input}
              style={{ backgroundColor: '#444', color: '#ccc' }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Mediana Marcha Lenta</label>
            <input
              type="number"
              value={calculations.medianaMarchaLenta.toFixed(1)}
              readOnly
              className={styles.input}
              style={{ backgroundColor: '#444', color: '#ccc' }}
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Máximo Marcha Lenta</label>
            <input
              type="number"
              value={calculations.maxMarchaLenta.toFixed(1)}
              readOnly
              className={styles.input}
              style={{ backgroundColor: '#444', color: '#ccc' }}
            />
          </div>
        </div>
      </fieldset>

      {/* Resultado e Observações */}
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>6. Resultado Final</legend>
        <div className={styles.grid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Ruído Máximo Medido (dB) - Manual</label>
            <input
              type="number"
              name="ruidoMaximoMedido"
              value={ruidoData.ruidoMaximoMedido ?? ''}
              onChange={handleRuidoDataChange}
              className={styles.input}
              step="0.1"
              min={RUIDO_MIN_VALUE}
              max={RUIDO_MAX_VALUE}
              placeholder="Ex: 78.5"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Resultado</label>
            <select
              name="resultado"
              value={ruidoData.resultado}
              onChange={handleRuidoDataChange}
              required
              className={styles.select}
            >
              <option value="APROVADO">APROVADO</option>
              <option value="REPROVADO">REPROVADO</option>
            </select>
          </div>
        </div>
        <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
          <label className={styles.label}>Observações</label>
          <textarea
            name="observacoes"
            value={ruidoData.observacoes}
            onChange={handleRuidoDataChange}
            className={styles.textarea}
            rows={4}
            placeholder="Observações sobre o laudo de ruído..."
          />
        </div>
      </fieldset>

      <div className={styles.submitSection}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.button}
        >
          {isSubmitting ? '🔊 Criando Laudo...' : '🔊 Criar Laudo de Ruído'}
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