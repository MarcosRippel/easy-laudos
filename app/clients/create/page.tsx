// app/clients/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import styles from './ClientCreatePage.module.css';

interface Client extends ClientFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  _count?: { vehicles: number; laudos: number };
  contactWhatsapp?: string;
}

interface LaudoAlert {
  placa: string;
  tipo: string;
  vencimento: string;
  status: 'vencido' | 'vencendo';
}

interface ClientAlertInfo {
  total: number;
  hasExpired: boolean;
  laudos: LaudoAlert[];
}

interface Vehicle {
  id: string;
  placa: string;
  especieTipo: string;
  marcaModelo: string;
  numeroChassi: string;
  anoFabricacaoModelo: string;
  clientId: string;
}

export default function CreateClientPage() {
  const router = useRouter();
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [editedClientData, setEditedClientData] = useState<ClientFormData | null>(null);

  // Add new state for the save operation
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // States for client list
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);

  // States for vehicles management
  const [selectedClientForVehicles, setSelectedClientForVehicles] = useState<Client | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<string | null>(null);

  // State for Emitir Laudo dropdown
  const [laudoDropdownVehicleId, setLaudoDropdownVehicleId] = useState<string | null>(null);

  // Alertas de laudos vencidos/vencendo por cliente
  const [laudoAlerts, setLaudoAlerts] = useState<Record<string, ClientAlertInfo>>({});

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const [clientsRes, alertsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/clients/expiring-laudos'),
      ]);
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setLaudoAlerts(alerts);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const buildWhatsAppLink = (client: Client, alerts: ClientAlertInfo): string => {
    // Remove não-dígitos e strip de 55 inicial se já presente, para evitar 5555...
    let numero = (client.contactWhatsapp ?? '').replace(/\D/g, '');
    if (numero.startsWith('55') && numero.length >= 13) numero = numero.slice(2);
    const lines = alerts.laudos.map(l => {
      const statusText = l.status === 'vencido' ? `venceu ${l.vencimento}` : `vence em ${l.vencimento}`;
      return `\ud83d\ude97 ${l.placa} \u2014 Laudo ${l.tipo} (${statusText})`;
    }).join('\n');
    const text = `Ol\u00e1! \ud83d\udd14 Aviso sobre laudos da empresa *${client.name}*:\n\n\u26a0\ufe0f Laudos vencidos ou pr\u00f3ximos ao vencimento:\n\n${lines}\n\nEntre em contato para renovar! \ud83d\udccb`;
    return `https://wa.me/55${numero}?text=${encodeURIComponent(text)}`;
  };

  const handleFetchCnpj = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClientData(null);
    setSaveMessage('');

    const cleanedCnpj = cnpj.replace(/\D/g, '');
    if (cleanedCnpj.length !== 14) {
      setError('⚠️ CNPJ inválido. Por favor, digite exatamente 14 dígitos.');
      setLoading(false);
      return;
    }

    try {
      // Usar proxy server-side para evitar CORS
      const response = await fetch(`/api/cnpj/${cleanedCnpj}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `❌ Falha ao buscar CNPJ (código ${response.status}).`);
      }

      const formattedData: ClientFormData = {
        name: data.name || '',
        cnpj: data.cnpj || cleanedCnpj,
        addressStreet: data.addressStreet || '',
        addressNumber: data.addressNumber || '',
        addressCity: data.addressCity || '',
        addressState: data.addressState || '',
        addressZip: data.addressZip || '',
        addressDistrict: data.addressDistrict || '',
        phone: data.phone || '',
      };

      setClientData(formattedData);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '❌ Erro desconhecido ao buscar CNPJ.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form data changes
  const handleClientDataChange = (updatedData: ClientFormData) => {
    setEditedClientData(updatedData);
  };

  // Add a new function to handle saving the client
  const handleSaveClient = async () => {
    const dataToSave = editedClientData || clientData;
    if (!dataToSave) return;

    setIsSaving(true);
    setSaveMessage('Saving...');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        // Try to get a specific error message from our API
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save client.');
      }

      setSaveMessage('✅ Cliente cadastrado com sucesso!');
      // Reload clients list after successful save
      await loadClients();
      // Reset form
      setClientData(null);
      setEditedClientData(null);
      setCnpj('');

    } catch (err) {
      console.error(err);
      setSaveMessage(err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle editing client
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setClientData({
      name: client.name,
      cnpj: client.cnpj,
      addressStreet: client.addressStreet,
      addressNumber: client.addressNumber,
      addressCity: client.addressCity,
      addressState: client.addressState,
      addressZip: client.addressZip,
      addressDistrict: client.addressDistrict,
      phone: client.phone,
      contactWhatsapp: client.contactWhatsapp,
    });
    setEditedClientData(null);
    setSaveMessage('');
  };

  // Handle updating client
  const handleUpdateClient = async () => {
    if (!editingClient || !editedClientData) return;

    setIsSaving(true);
    setSaveMessage('Updating...');

    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingClient.id,
          ...editedClientData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update client.');
      }

      setSaveMessage('✅ Cliente atualizado com sucesso!');
      await loadClients();
      setEditingClient(null);
      setClientData(null);
      setEditedClientData(null);

    } catch (err) {
      console.error(err);
      setSaveMessage(err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting client
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingClient(clientId);

    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete client.');
      }

      await loadClients();
      setSaveMessage('✅ Cliente deletado com sucesso!');

    } catch (err) {
      console.error(err);
      setSaveMessage(err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setDeletingClient(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingClient(null);
    setClientData(null);
    setEditedClientData(null);
    setSaveMessage('');
  };

  // Vehicle management functions
  const loadVehicles = async (clientId: string) => {
    try {
      setLoadingVehicles(true);
      const response = await fetch(`/api/vehicles?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      setSaveMessage('Erro ao carregar veículos');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleShowVehicles = (client: Client) => {
    setSelectedClientForVehicles(client);
    loadVehicles(client.id);
  };

  const handleCloseVehicles = () => {
    setSelectedClientForVehicles(null);
    setVehicles([]);
    setEditingVehicle(null);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    // Navegar para a página de veículos com o cliente selecionado
    router.push(`/vehicles?edit=${vehicle.id}`);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja deletar este veículo? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingVehicle(vehicleId);

    try {
      const response = await fetch(`/api/vehicles?id=${vehicleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao deletar veículo.');
      }

      if (selectedClientForVehicles) {
        await loadVehicles(selectedClientForVehicles.id);
      }
      setSaveMessage('Veículo deletado com sucesso!');

    } catch (err) {
      console.error(err);
      setSaveMessage(err instanceof Error ? `Erro: ${err.message}` : 'Erro desconhecido.');
    } finally {
      setDeletingVehicle(null);
    }
  };

  return (
    <div className={styles.pageContainer} style={{
      padding: '0 1rem',
      maxWidth: 'none',
      width: '100%'
    }}>
      <div className={styles.contentWrapper} style={{
        maxWidth: 'none',
        width: '100%',
        padding: '0 1rem'
      }}>
        <h2 className={styles.title} style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#f8f9fa'
        }}>
          {editingClient ? '✏️ Editar Cliente' : '➕ Cadastrar Novo Cliente'}
        </h2>

        {!editingClient && (
          <>
            <p className={styles.subtitle} style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              textAlign: 'center',
              marginBottom: '0.5rem',
              color: '#adb5bd',
              lineHeight: '1.5'
            }}>
              Passo 1: Digite o CNPJ para buscar automaticamente os dados da empresa.
            </p>
            <p style={{
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#6c757d',
              lineHeight: '1.5'
            }}>
              Passo 2: Confira e complete os dados, adicione o contato WhatsApp e salve.
            </p>
            <form onSubmit={handleFetchCnpj} className={styles.fetchForm} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div className={styles.inputGroup} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                maxWidth: '400px'
              }}>
                <label htmlFor="cnpj" className={styles.label} style={{
                  fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                  fontWeight: '600',
                  color: '#f8f9fa'
                }}>
                  📋 CNPJ da Empresa
                </label>
                <input
                  type="text" id="cnpj" name="cnpj" value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="Digite os 14 dígitos do CNPJ"
                  className={styles.input}
                  style={{
                    width: '100%',
                    maxWidth: '350px',
                    padding: '0.875rem 1rem',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    borderRadius: '8px',
                    border: '2px solid #444',
                    backgroundColor: '#2a2a2e',
                    color: '#f8f9fa',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.button} style={{
                padding: '0.875rem 2rem',
                fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
                fontWeight: '600',
                borderRadius: '8px',
                background: loading ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
                minWidth: '160px'
              }}>
                {loading ? '🔄 Buscando...' : '🔍 Buscar Dados do CNPJ'}
              </button>
            </form>
          </>
        )}

        {saveMessage && !clientData && <p className={`${styles.message} ${saveMessage.includes('Error') ? styles.error : styles.success}`}>{saveMessage}</p>}

        {clientData && (
          <>
            <ClientForm
              clientData={clientData}
              onDataChange={handleClientDataChange}
            />
            <div className={styles.submitSection}>
              {editingClient ? (
                <>
                  <button onClick={handleUpdateClient} disabled={loading || isSaving} className={styles.button}>
                    {isSaving ? '🔄 Atualizando...' : '💾 Atualizar Cliente'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={isSaving} className={`${styles.button} ${styles.cancelButton}`} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>
                    ✕ Cancelar
                  </button>
                </>
              ) : (
                <button onClick={handleSaveClient} disabled={loading || isSaving} className={styles.button}>
                  {isSaving ? '🔄 Salvando...' : '💾 Cadastrar Cliente'}
                </button>
              )}
              {saveMessage && <span className={`${styles.message} ${saveMessage.includes('Erro') || saveMessage.includes('Error') ? styles.error : styles.success}`}>{saveMessage}</span>}
            </div>
          </>
        )}

        {/* Clients List Section */}
        <div className={styles.clientsList} style={{
          marginTop: '3rem',
          width: '100%',
          maxWidth: 'none'
        }}>
          <h3 className={styles.title} style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#f8f9fa',
            borderBottom: '2px solid #444',
            paddingBottom: '1rem'
          }}>
            👥 Clientes Existentes
          </h3>

          {loadingClients ? (
            <div className={styles.loadingState} style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              color: '#6c757d'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                <p>Carregando clientes...</p>
              </div>
            </div>
          ) : clients.length === 0 ? (
            <div className={styles.emptyState} style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '300px',
              textAlign: 'center',
              backgroundColor: '#2a2a2e',
              borderRadius: '12px',
              border: '2px dashed #555',
              margin: '2rem 0'
            }}>
              <div style={{ padding: '2rem' }}>
                <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '1rem', opacity: 0.6 }}>👥</div>
                <h4 style={{
                  color: '#f8f9fa',
                  marginBottom: '0.5rem',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)'
                }}>
                  Nenhum cliente encontrado
                </h4>
                <p style={{ color: '#6c757d', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                  Adicione seu primeiro cliente usando o formulário acima.
                </p>
              </div>
            </div>
          ) : (
            <div className={styles.clientsGrid}>
              {clients.map((client) => (
                <div key={client.id} className={styles.clientCard}>
                  <div className={styles.clientCardHeader}>
                    <h4 className={styles.clientName}>🏢 {client.name}</h4>
                    <div className={styles.clientBadges}>
                      <span className={styles.badgeVehicle}>🚗 {client._count?.vehicles ?? 0} veíc.</span>
                      <span className={styles.badgeLaudo}>📋 {client._count?.laudos ?? 0} laudos</span>
                      {laudoAlerts[client.id] && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: laudoAlerts[client.id].hasExpired ? 'rgba(220,53,69,0.18)' : 'rgba(255,193,7,0.18)',
                            color: laudoAlerts[client.id].hasExpired ? '#ff6b6b' : '#ffc107',
                            border: `1px solid ${laudoAlerts[client.id].hasExpired ? '#dc3545' : '#ffc107'}`,
                          }}
                          title={laudoAlerts[client.id].laudos.map(l => `${l.placa} – ${l.tipo} (${l.vencimento})`).join(', ')}
                        >
                          {laudoAlerts[client.id].hasExpired ? '🔴' : '🟡'}
                          {laudoAlerts[client.id].total} {laudoAlerts[client.id].hasExpired ? 'vencido(s)' : 'alerta(s)'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.clientCardBody}>
                    <p className={styles.clientDetail}><strong>CNPJ:</strong> <span className={styles.mono}>{client.cnpj}</span></p>
                    <p className={styles.clientDetail}><strong>Cidade:</strong> {client.addressCity || 'N/A'} {client.addressState ? `- ${client.addressState}` : ''}</p>
                    <p className={styles.clientDetail}><strong>Telefone:</strong> {client.phone || 'N/A'}</p>
                    <div className={styles.clientWhatsappRow}>
                      {client.contactWhatsapp ? (
                        <a
                          href={`https://wa.me/55${client.contactWhatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.whatsappCardBtn}
                          title="Abrir conversa no WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          {' '}{client.contactWhatsapp}
                        </a>
                      ) : (
                        <span className={styles.noWhatsapp}>📱 Sem contato WhatsApp</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.clientCardActions}>
                    <button
                      onClick={() => handleShowVehicles(client)}
                      disabled={!!editingClient || !!deletingClient}
                      className={styles.btnVehicles}
                    >
                      🚗 Ver Veículos
                    </button>
                    <button
                      onClick={() => router.push(`/vehicles?clientId=${client.id}`)}
                      disabled={!!editingClient || !!deletingClient}
                      className={styles.btnAddVehicle}
                    >
                      ➕ Cadastrar Veículo
                    </button>
                    {laudoAlerts[client.id] && client.contactWhatsapp && (
                      <a
                        href={buildWhatsAppLink(client, laudoAlerts[client.id])}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.9rem',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: '600',
                          backgroundColor: '#25d366',
                          color: '#fff',
                          textDecoration: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                        title="Enviar aviso via WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Avisar no WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => handleEditClient(client)}
                      disabled={!!editingClient || !!deletingClient}
                      className={styles.btnEdit}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      disabled={!!editingClient || deletingClient === client.id}
                      className={styles.btnDelete}
                    >
                      {deletingClient === client.id ? '⏳ Deletando...' : '🗑️ Excluir'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicles Management Modal/Section */}
        {selectedClientForVehicles && (
          <div className={styles.vehiclesModal} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '0.5rem'
          }}>
            <div style={{
              backgroundColor: '#1e1e1e',
              padding: '0',
              borderRadius: '16px',
              width: 'min(98vw, 1400px)',
              height: 'min(95vh, 900px)',
              display: 'flex',
              flexDirection: 'column',
              color: 'white',
              border: '2px solid #555',
              boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem 1.25rem 2rem',
                borderBottom: '3px solid #444',
                backgroundColor: '#252529',
                borderRadius: '16px 16px 0 0'
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    color: '#f8f9fa',
                    fontWeight: '600',
                    lineHeight: '1.2'
                  }}>
                    🚗 Veículos de {selectedClientForVehicles.name}
                  </h2>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    color: '#adb5bd',
                    fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                    fontFamily: 'monospace'
                  }}>
                    📋 CNPJ: {selectedClientForVehicles.cnpj}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={() => router.push(`/vehicles?clientId=${selectedClientForVehicles.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #17a2b8, #117a8b)',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(23,162,184,0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(23,162,184,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(23,162,184,0.3)';
                  }}
                >
                  ➕ Cadastrar Veículo
                </button>
                <button
                  onClick={handleCloseVehicles}
                  style={{
                    background: 'linear-gradient(135deg, #dc3545, #c82333)',
                    color: 'white',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,53,69,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,53,69,0.3)';
                  }}
                >
                  ✕ Fechar
                </button>
                </div>
              </div>

              {/* Content Area */}
              <div style={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 2rem'
              }}>
                {loadingVehicles ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    fontSize: '1.1rem',
                    color: '#6c757d'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
                      <p>Carregando veículos...</p>
                    </div>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flex: 1,
                    textAlign: 'center',
                    backgroundColor: '#2a2a2e',
                    borderRadius: '12px',
                    border: '2px dashed #555',
                    minHeight: '300px'
                  }}>
                    <div style={{ padding: '2rem' }}>
                      <div style={{
                        fontSize: 'clamp(3rem, 8vw, 4.5rem)',
                        marginBottom: '1.5rem',
                        opacity: 0.6,
                        filter: 'grayscale(0.3)'
                      }}>🚗</div>
                      <h3 style={{
                        color: '#f8f9fa',
                        marginBottom: '1rem',
                        fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                        fontWeight: '500'
                      }}>
                        Nenhum veículo encontrado
                      </h3>
                      <p style={{
                        color: '#6c757d',
                        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                        margin: '0 0 0.75rem 0',
                        lineHeight: '1.5'
                      }}>
                        Este cliente ainda não possui veículos cadastrados.
                      </p>
                      <p style={{
                        color: '#adb5bd',
                        fontSize: 'clamp(0.8rem, 1.8vw, 0.95rem)',
                        marginTop: '0.5rem',
                        padding: '1rem',
                        backgroundColor: '#3a3a3e',
                        borderRadius: '8px',
                        border: '1px solid #555'
                      }}>
                        💡 Adicione veículos através da página de <strong style={{ color: '#ffc107' }}>🚗➕ Veículo</strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    overflow: 'auto',
                    backgroundColor: '#2a2a2e',
                    borderRadius: '12px',
                    border: '2px solid #444',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed'
                    }}>
                      <thead style={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#3a3a3e',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}>
                        <tr>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'left',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '12%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            🚗 Placa
                          </th>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'left',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '20%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            🏭 Marca/Modelo
                          </th>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'left',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '18%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            🔢 Chassi
                          </th>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'left',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '15%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            📋 Tipo
                          </th>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'left',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '15%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            📅 Ano Fabric./Modelo
                          </th>
                          <th style={{
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            borderBottom: '3px solid #555',
                            fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                            fontWeight: '600',
                            color: '#f8f9fa',
                            width: '20%',
                            background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                          }}>
                            ⚙️ Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicles.map((vehicle, index) => (
                          <tr
                            key={vehicle.id}
                            style={{
                              backgroundColor: index % 2 === 0 ? '#2a2a2e' : '#323236',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#2a2a2e' : '#323236'}
                          >
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              fontWeight: 'bold',
                              color: '#28a745',
                              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                              wordBreak: 'break-word'
                            }}>
                              {vehicle.placa}
                            </td>
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              color: '#f8f9fa',
                              fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
                              wordBreak: 'break-word'
                            }}>
                              {vehicle.marcaModelo}
                            </td>
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)',
                              color: '#adb5bd',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all'
                            }}>
                              {vehicle.numeroChassi}
                            </td>
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              color: '#f8f9fa',
                              fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
                              wordBreak: 'break-word'
                            }}>
                              {vehicle.especieTipo}
                            </td>
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              color: '#f8f9fa',
                              fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
                              textAlign: 'center'
                            }}>
                              {vehicle.anoFabricacaoModelo}
                            </td>
                            <td style={{
                              padding: '1.25rem 1rem',
                              borderBottom: '1px solid #444',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                                alignItems: 'center'
                              }}>
                                {/* Emitir Laudo Button + Dropdown */}
                                <div style={{ position: 'relative' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLaudoDropdownVehicleId(
                                        laudoDropdownVehicleId === vehicle.id ? null : vehicle.id
                                      );
                                    }}
                                    style={{
                                      background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                                      color: 'white',
                                      border: 'none',
                                      padding: '0.625rem 1rem',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
                                      fontWeight: '600',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 2px 6px rgba(40,167,69,0.3)',
                                      minWidth: '110px',
                                      whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                  >
                                    📋 Emitir Laudo ▾
                                  </button>

                                  {laudoDropdownVehicleId === vehicle.id && (
                                    <>
                                      {/* Overlay to close dropdown on outside click */}
                                      <div
                                        onClick={() => setLaudoDropdownVehicleId(null)}
                                        style={{
                                          position: 'fixed',
                                          top: 0,
                                          left: 0,
                                          width: '100vw',
                                          height: '100vh',
                                          zIndex: 998,
                                          cursor: 'default'
                                        }}
                                      />
                                      <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '4px',
                                        backgroundColor: '#2a2a2e',
                                        border: '1px solid #555',
                                        borderRadius: '8px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                        zIndex: 999,
                                        minWidth: '200px',
                                        overflow: 'hidden'
                                      }}>
                                        {[
                                          { tipo: 'CHECKLIST', label: '✅ Laudo Checklist', color: '#28a745' },
                                          { tipo: 'LIT', label: '📝 Laudo LIT', color: '#007bff' },
                                          { tipo: 'RUIDO', label: '🔊 Laudo Ruído', color: '#fd7e14' },
                                          { tipo: 'PINO_REI', label: '🔧 Laudo Pino Rei', color: '#6f42c1' },
                                          { tipo: 'QUINTA_RODA', label: '🔧 Laudo Quinta Roda', color: '#dc3545' },
                                        ].map((item, idx) => (
                                          <button
                                            key={item.tipo}
                                            onClick={() => {
                                              setLaudoDropdownVehicleId(null);
                                              const params = new URLSearchParams({
                                                tipo: item.tipo,
                                                clientId: vehicle.clientId,
                                                placa: vehicle.placa,
                                              });
                                              router.push(`/emitirlaudo?${params.toString()}`);
                                            }}
                                            style={{
                                              display: 'block',
                                              width: '100%',
                                              padding: '0.7rem 1rem',
                                              background: 'none',
                                              border: 'none',
                                              borderBottom: idx < 4 ? '1px solid #444' : 'none',
                                              color: '#f1f1f1',
                                              fontSize: '0.85rem',
                                              fontWeight: '500',
                                              textAlign: 'left',
                                              cursor: 'pointer',
                                              transition: 'background 0.15s ease',
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                                            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                                          >
                                            <span style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: '8px' }}>
                                              {item.label}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleEditVehicle(vehicle)}
                                  disabled={!!editingVehicle || !!deletingVehicle}
                                  style={{
                                    background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.625rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
                                    fontWeight: '600',
                                    opacity: (!!editingVehicle || !!deletingVehicle) ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(255,193,7,0.3)',
                                    minWidth: '70px'
                                  }}
                                  onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                                  onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                  disabled={!!editingVehicle || deletingVehicle === vehicle.id}
                                  style={{
                                    background: 'linear-gradient(135deg, #dc3545, #c82333)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.625rem 1rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
                                    fontWeight: '600',
                                    opacity: (!!editingVehicle || deletingVehicle === vehicle.id) ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(220,53,69,0.3)',
                                    minWidth: '70px'
                                  }}
                                  onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                                  onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                  {deletingVehicle === vehicle.id ? '⏳ Deletando...' : '🗑️ Excluir'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>


            </div>
          </div>
        )}
      </div>
    </div>
  );
}