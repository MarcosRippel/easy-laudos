'use client';

import { useState, useEffect } from 'react';
import VehicleForm from "@/components/vehicles/VehicleForm";
import VehicleDocumentProcessor from "@/components/vehicles/VehicleDocumentProcessor";

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
  const [prefillData, setPrefillData] = useState<ParsedVehicleData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loading, setLoading] = useState(true);

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
        maxWidth: '800px',
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

        {/* Seletor de Cliente */}
        <div style={{
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

        <VehicleDocumentProcessor onDataParsed={handleDocumentDataParsed} clientId={selectedClientId} />
        
        <p style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#bbb',
          fontSize: '1rem'
        }}>
          {selectedClientId
            ? 'Import a vehicle document (PDF/Image) to pre-fill the fields, or enter them manually below.'
            : 'Select a client above before importing documents.'
          }
        </p>
        
        <hr style={{
          borderColor: '#444',
          margin: '2rem 0',
          border: 'none',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #444, transparent)'
        }} />

        <VehicleForm initialData={prefillData} clientId={selectedClientId} />
      </div>
    </div>
  );
}