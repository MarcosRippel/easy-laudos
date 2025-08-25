'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Client, Vehicle, Laudo } from '@prisma/client';
import EquipmentNotifications from '@/components/equipments/EquipmentNotifications';
import styles from './HomePage.module.css';

type StatData = { clients: number; vehicles: number; laudos: number; };
type LaudoWithRelations = Laudo & { client: Client; vehicle: Vehicle; };

interface FilterState {
  type: string;
  clientId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Home() {
  const [stats, setStats] = useState<StatData>({ clients: 0, vehicles: 0, laudos: 0 });
  const [laudos, setLaudos] = useState<LaudoWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  const [filters, setFilters] = useState<FilterState>({
    type: '',
    clientId: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const laudoTypes = [
    { value: '', label: 'Todos os tipos' },
    { value: 'CHECKLIST', label: 'CHECKLIST' },
    { value: 'LIT', label: 'LIT' },
    { value: 'RUIDO', label: 'RUÍDO' },
    { value: 'PINO_REI', label: 'PINO REI' },
    { value: 'QUINTA_RODA', label: 'QUINTA RODA' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchLaudos();
  }, [filters, currentPage]);

  const fetchInitialData = async () => {
    try {
      const [statsResponse, clientsResponse] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/clients')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLaudos = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.type && { type: filters.type }),
        ...(filters.clientId && { clientId: filters.clientId }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/laudos/paginated?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLaudos(data.laudos);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar laudos:', error);
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Reset para primeira página ao aplicar filtros
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      clientId: '',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDeleteLaudo = async (laudoId: string, ordemServico: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o laudo da OS ${ordemServico}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingIds(prev => [...prev, laudoId]);
    
    try {
      const response = await fetch(`/api/laudos/${laudoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Atualizar a lista local removendo o laudo excluído
        setLaudos(prev => prev.filter(laudo => laudo.id !== laudoId));
        
        // Atualizar stats
        setStats(prev => ({
          ...prev,
          laudos: prev.laudos - 1
        }));
        
        // Recarregar a página se ficou vazia
        if (laudos.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchLaudos();
        }
        
        alert('Laudo excluído com sucesso!');
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir laudo: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erro ao excluir laudo:', error);
      alert('Erro ao excluir laudo');
    } finally {
      setDeletingIds(prev => prev.filter(id => id !== laudoId));
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Notificações de Equipamentos */}
      <section>
        <EquipmentNotifications />
      </section>

      {/* Stats Cards */}
      <section>
        <div className={styles.statsGrid}>
          <StatCard label="Total Clients" value={stats.clients} />
          <StatCard label="Total Vehicles" value={stats.vehicles} />
          <StatCard label="Total Laudos" value={stats.laudos} />
        </div>
      </section>

      {/* Histórico de Laudos */}
      <section className={styles.laudosSection}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>📊 Histórico de Laudos</h2>
          <p className={styles.pageSubtitle}>
            Consulte e gerencie todos os laudos emitidos
          </p>
        </div>

        {/* Filtros */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersGrid}>
            {/* Tipo de Laudo */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tipo de Laudo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className={styles.filterSelect}
              >
                {laudoTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Cliente</label>
              <select
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data De */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data De</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Data Até */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data Até</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            {/* Busca */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Buscar</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="OS, Placa ou Cliente"
                className={styles.filterInput}
              />
            </div>

            {/* Botão Limpar */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>&nbsp;</label>
              <button
                onClick={clearFilters}
                className={styles.clearButton}
              >
                🗑️ Limpar
              </button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className={styles.resultsCount}>
            <span>
              Mostrando <strong>{laudos.length}</strong> de <strong>{pagination.totalCount}</strong> laudos
              {pagination.totalPages > 1 && (
                <> - Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Tabela */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ordem Serviço</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Data Emissão</th>
                <th>Data Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {laudos.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.noData}>
                    {pagination.totalCount === 0 
                      ? 'Nenhum laudo encontrado no sistema'
                      : 'Nenhum laudo encontrado com os filtros aplicados'
                    }
                  </td>
                </tr>
              ) : (
                laudos.map((laudo) => (
                  <tr key={laudo.id}>
                    <td className={styles.ordemServico}>{laudo.ordemServico}</td>
                    <td>{laudo.client.name}</td>
                    <td>
                      <span className={styles.placa}>{laudo.vehicle.placa}</span>
                      <br />
                      <small className={styles.modelo}>{laudo.vehicle.marcaModelo}</small>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[laudo.laudoType.toLowerCase()]}`}>
                        {laudo.laudoType}
                      </span>
                    </td>
                    <td>{format(new Date(laudo.dataEmissao), 'dd/MM/yyyy')}</td>
                    <td>{laudo.dataVencimento || 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteLaudo(laudo.id, laudo.ordemServico)}
                        disabled={deletingIds.includes(laudo.id)}
                        className={styles.deleteButton}
                      >
                        {deletingIds.includes(laudo.id) ? (
                          <>⏳ Excluindo...</>
                        ) : (
                          <>🗑️ Excluir</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className={styles.paginationButton}
            >
              ← Anterior
            </button>
            
            <div className={styles.paginationInfo}>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`${styles.paginationNumber} ${currentPage === pageNum ? styles.active : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className={styles.paginationButton}
            >
              Próxima →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}