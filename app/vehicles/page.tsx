'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import VehicleForm from "@/components/vehicles/VehicleForm";
import VehicleDocumentProcessor from "@/components/vehicles/VehicleDocumentProcessor";
import BatchVehicleProcessor from "@/components/vehicles/BatchVehicleProcessor";

interface ParsedVehicleData {
  placa?: string;
  numeroChassi?: string;
  especieTipo?: string;
  marcaModelo?: string;
  anoFabricacaoModelo?: string;
}

interface Client {
  id: string;
  name: string;
  cnpj: string;
}

export default function VehiclesPage() {
  const searchParams = useSearchParams();
  const [prefillData, setPrefillData] = useState<ParsedVehicleData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState<'individual' | 'lote'>('individual');

  // Carregar clientes ao montar o componente
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        if (response.ok) {
          const clientsData = await response.json();
          setClients(clientsData);
        } else {
          console.error('Erro ao carregar clientes');
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Auto-select client from URL param (e.g. /vehicles?clientId=123)
  useEffect(() => {
    const clientIdParam = searchParams.get('clientId');
    if (clientIdParam && clients.length > 0) {
      const exists = clients.some(c => c.id === clientIdParam);
      if (exists) {
        setSelectedClientId(clientIdParam);
      }
    }
  }, [searchParams, clients]);

  const handleDocumentDataParsed = (data: ParsedVehicleData) => {
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente antes de processar o documento.');
      return;
    }

    setPrefillData(data);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
      minHeight: '100vh',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: uploadMode === 'lote' ? '1100px' : '800px',
        transition: 'max-width 0.3s ease',
        margin: '0 auto',
        backgroundColor: 'rgba(42, 42, 46, 0.8)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#f1f1f1',
          fontSize: '1.8rem',
          fontWeight: '600'
        }}>
          ➕ Adicionar Veículo
        </h2>

        {/* Tab Toggle: Individual vs Lote */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          marginBottom: '1.5rem',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #555',
          maxWidth: '400px',
          margin: '0 auto 1.5rem',
        }}>
          <button
            onClick={() => setUploadMode('individual')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              background: uploadMode === 'individual'
                ? 'linear-gradient(135deg, #007bff, #0056b3)'
                : 'rgba(55, 65, 81, 0.6)',
              color: uploadMode === 'individual' ? '#fff' : '#aaa',
            }}
          >
            📄 Individual
          </button>
          <button
            onClick={() => setUploadMode('lote')}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              background: uploadMode === 'lote'
                ? 'linear-gradient(135deg, #17a2b8, #117a8b)'
                : 'rgba(55, 65, 81, 0.6)',
              color: uploadMode === 'lote' ? '#fff' : '#aaa',
            }}
          >
            📚 Lote (Múltiplos CRLVs)
          </button>
        </div>

        {/* Seletor de Cliente */}
        <div data-tutorial="client-select" style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: 'rgba(55, 65, 81, 0.8)',
          borderRadius: '12px',
          border: '1px solid #444'
        }}>
          <h3 style={{
            color: '#f1f1f1',
            marginBottom: '1rem',
            fontSize: '1.2rem',
            textAlign: 'center'
          }}>
            Selecione o Cliente
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#bbb' }}>
              Carregando clientes...
            </div>
          ) : (
            <>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  const clientId = e.target.value;
                  console.log('🔄 SELECIONANDO CLIENTE:', clientId);
                  setSelectedClientId(clientId);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#374151',
                  border: '1px solid #6b7280',
                  borderRadius: '6px',
                  color: '#f1f1f1',
                  fontSize: '1rem'
                }}
              >
                <option value="">Escolha um cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - CNPJ: {client.cnpj}
                  </option>
                ))}
              </select>
            </>
          )}

          {selectedClientId && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#065f46',
              borderRadius: '4px',
              color: '#d1fae5',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              ✓ Cliente selecionado! Agora você pode processar documentos.
            </div>
          )}
        </div>

        {/* Mode: Individual */}
        {uploadMode === 'individual' && (
          <>
            <VehicleDocumentProcessor data-tutorial="doc-processor" onDataParsed={handleDocumentDataParsed} clientId={selectedClientId} />

            <p style={{
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#bbb',
              fontSize: '1rem'
            }}>
              {selectedClientId
                ? 'Importe um documento de veículo (PDF/Imagem) para preencher os campos, ou preencha manualmente.'
                : 'Selecione um cliente acima antes de importar documentos.'
              }
            </p>

            <hr style={{
              borderColor: '#444',
              margin: '2rem 0',
              border: 'none',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #444, transparent)'
            }} />

            <div data-tutorial="vehicle-form">
              <VehicleForm initialData={prefillData} clientId={selectedClientId} />
            </div>
          </>
        )}

        {/* Mode: Lote (Batch) */}
        {uploadMode === 'lote' && (
          <>
            {selectedClientId ? (
              <BatchVehicleProcessor clientId={selectedClientId} />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#f87171',
                fontSize: '1rem',
                border: '1px dashed #555',
                borderRadius: '12px',
                background: 'rgba(220, 53, 69, 0.05)',
              }}>
                ⚠️ Selecione um cliente acima para habilitar o upload em lote.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}