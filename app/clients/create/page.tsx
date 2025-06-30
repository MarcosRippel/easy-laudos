// app/clients/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ClientForm, { ClientFormData } from '@/components/clients/ClientForm';
import styles from './ClientCreatePage.module.css';

interface Client extends ClientFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
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

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleFetchCnpj = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClientData(null);
    setSaveMessage(''); // Reset save message on new fetch

    const cleanedCnpj = cnpj.replace(/\D/g, '');
    if (cleanedCnpj.length !== 14) {
      setError('Invalid CNPJ. Please enter 14 digits.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://open.cnpja.com/office/${cleanedCnpj}`);
      if (!response.ok) throw new Error(`Failed to fetch CNPJ data. Status: ${response.status}`);
      const data = await response.json();

      const formattedData: ClientFormData = {
        name: data.company.name,
        cnpj: data.taxId,
        addressStreet: data.address.street,
        addressNumber: data.address.number,
        addressCity: data.address.city,
        addressState: data.address.state,
        addressZip: data.address.zip,
        addressDistrict: data.address.district,
        phone: data.phones.map((p: any) => `(${p.area}) ${p.number}`).join(' / '),
      };
      setClientData(formattedData);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
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

      setSaveMessage('Client saved successfully!');
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

      setSaveMessage('Client updated successfully!');
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
      setSaveMessage('Client deleted successfully!');

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
    setEditingVehicle(vehicle);
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
          {editingClient ? '✏️ Editar Cliente' : '👥 Gestão de Clientes'}
        </h2>
        
        {!editingClient && (
          <>
            <p className={styles.subtitle} style={{
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
              textAlign: 'center',
              marginBottom: '2rem',
              color: '#adb5bd',
              lineHeight: '1.5'
            }}>
              Digite um CNPJ para buscar os dados da empresa automaticamente.
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
                  📋 CNPJ
                </label>
                <input
                  type="text" id="cnpj" name="cnpj" value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="Digite 14 dígitos"
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
                minWidth: '140px'
              }}>
                {loading ? '🔄 Buscando...' : '🔍 Buscar Dados'}
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
                    {isSaving ? 'Updating...' : 'Update Client'}
                  </button>
                  <button onClick={handleCancelEdit} disabled={isSaving} className={`${styles.button} ${styles.cancelButton}`} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={handleSaveClient} disabled={loading || isSaving} className={styles.button}>
                  {isSaving ? 'Saving...' : 'Save Client to Database'}
                </button>
              )}
              {saveMessage && <span className={`${styles.message} ${saveMessage.includes('Error') ? styles.error : styles.success}`}>{saveMessage}</span>}
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
            <div className={styles.tableContainer} style={{
              overflowX: 'auto',
              backgroundColor: '#2a2a2e',
              borderRadius: '12px',
              border: '2px solid #444',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              width: '100%',
              maxWidth: 'none',
              margin: '0 auto'
            }}>
              <table className={styles.clientsTable} style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                minWidth: '1200px'
              }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#3a3a3e',
                  zIndex: 10
                }}>
                  <tr>
                    <th style={{
                      padding: '1.25rem 1rem',
                      textAlign: 'left',
                      borderBottom: '3px solid #555',
                      fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                      fontWeight: '600',
                      color: '#f8f9fa',
                      width: '35%',
                      background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                    }}>
                      🏢 Nome
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
                      📋 CNPJ
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
                      🏙️ Cidade
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
                      📞 Telefone
                    </th>
                    <th style={{
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      borderBottom: '3px solid #555',
                      fontSize: 'clamp(0.8rem, 1.5vw, 0.95rem)',
                      fontWeight: '600',
                      color: '#f8f9fa',
                      width: '15%',
                      background: 'linear-gradient(135deg, #3a3a3e, #454549)'
                    }}>
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.id} style={{
                      backgroundColor: index % 2 === 0 ? '#2a2a2e' : '#323236',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#404040'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#2a2a2e' : '#323236'}
                    >
                      <td style={{
                        padding: '1.25rem 1rem',
                        borderBottom: '1px solid #444',
                        color: '#f8f9fa',
                        fontSize: 'clamp(0.8rem, 1.4vw, 0.95rem)',
                        fontWeight: '500',
                        wordBreak: 'break-word'
                      }}>
                        {client.name}
                      </td>
                      <td style={{
                        padding: '1.25rem 1rem',
                        borderBottom: '1px solid #444',
                        color: '#adb5bd',
                        fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        {client.cnpj}
                      </td>
                      <td style={{
                        padding: '1.25rem 1rem',
                        borderBottom: '1px solid #444',
                        color: '#f8f9fa',
                        fontSize: 'clamp(0.8rem, 1.4vw, 0.9rem)',
                        wordBreak: 'break-word'
                      }}>
                        {client.addressCity || 'N/A'}
                      </td>
                      <td style={{
                        padding: '1.25rem 1rem',
                        borderBottom: '1px solid #444',
                        color: '#f8f9fa',
                        fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-word'
                      }}>
                        {client.phone || 'N/A'}
                      </td>
                      <td style={{
                        padding: '0.875rem 0.5rem',
                        borderBottom: '1px solid #444',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <div className={styles.actionsContainer} style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexWrap: 'nowrap',
                          width: '100%'
                        }}>
                          <button
                            onClick={() => handleShowVehicles(client)}
                            disabled={!!editingClient || !!deletingClient}
                            className={styles.vehiclesButton}
                            style={{
                              background: 'linear-gradient(135deg, #28a745, #1e7e34)',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.75rem, 1.1vw, 0.85rem)',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(40,167,69,0.3)',
                              minWidth: '65px',
                              maxWidth: '75px',
                              opacity: (!!editingClient || !!deletingClient) ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)')}
                          >
                            🚗 Ver
                          </button>
                          <button
                            onClick={() => handleEditClient(client)}
                            disabled={!!editingClient || !!deletingClient}
                            className={styles.editButton}
                            style={{
                              background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                              color: '#000',
                              border: 'none',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.75rem, 1.1vw, 0.85rem)',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(255,193,7,0.3)',
                              minWidth: '65px',
                              maxWidth: '75px',
                              opacity: (!!editingClient || !!deletingClient) ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)')}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            disabled={!!editingClient || deletingClient === client.id}
                            className={styles.deleteButton}
                            style={{
                              background: 'linear-gradient(135deg, #dc3545, #c82333)',
                              color: 'white',
                              border: 'none',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: 'clamp(0.75rem, 1.1vw, 0.85rem)',
                              fontWeight: '600',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 6px rgba(220,53,69,0.3)',
                              minWidth: '65px',
                              maxWidth: '75px',
                              opacity: (!!editingClient || deletingClient === client.id) ? 0.7 : 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onMouseOver={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseOut={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)')}
                          >
                            {deletingClient === client.id ? '⏳' : '🗑️ Del'}
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
                        💡 Adicione veículos através da página de <strong style={{color: '#ffc107'}}>🚗➕ Veículo</strong>
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
                                gap: '0.75rem',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={() => handleEditVehicle(vehicle)}
                                  disabled={!!editingVehicle || !!deletingVehicle}
                                  style={{
                                    background: 'linear-gradient(135deg, #ffc107, #e0a800)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.625rem 1.125rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)',
                                    fontWeight: '600',
                                    opacity: (!!editingVehicle || !!deletingVehicle) ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(255,193,7,0.3)',
                                    minWidth: '80px'
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
                                    padding: '0.625rem 1.125rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.75rem, 1.3vw, 0.85rem)',
                                    fontWeight: '600',
                                    opacity: (!!editingVehicle || deletingVehicle === vehicle.id) ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(220,53,69,0.3)',
                                    minWidth: '80px'
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

              {editingVehicle && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.75rem 2rem',
                  background: 'linear-gradient(135deg, #3a3a3e, #454549)',
                  borderRadius: '12px',
                  border: '2px solid #666',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                    color: '#f8f9fa',
                    fontWeight: '600'
                  }}>
                    ✏️ Editando Veículo: <span style={{color: '#28a745'}}>{editingVehicle.placa}</span>
                  </h4>
                  <p style={{
                    color: '#adb5bd',
                    fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                    lineHeight: '1.5',
                    margin: '0 0 1.5rem 0',
                    padding: '1rem',
                    backgroundColor: '#2a2a2e',
                    borderRadius: '8px',
                    border: '1px solid #555'
                  }}>
                    💡 Para editar este veículo, acesse a página de <strong style={{color: '#ffc107'}}>🚗➕ Veículo</strong>.
                  </p>
                  <button
                    onClick={() => setEditingVehicle(null)}
                    style={{
                      background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(108,117,125,0.3)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(108,117,125,0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,117,125,0.3)';
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}