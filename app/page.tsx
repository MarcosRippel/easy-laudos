'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Client, Vehicle, Laudo } from '@prisma/client';
import EquipmentNotifications from '@/components/equipments/EquipmentNotifications';
import LaudosCharts, { type ChartsData } from '@/components/dashboard/LaudosCharts';
import styles from './HomePage.module.css';

type StatData = {
  clients: number;
  vehicles: number;
  laudos: number;
  byType: Record<string, number>;
  byMonth: { month: string; count: number }[];
};

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
  const [stats, setStats] = useState<StatData>({ clients: 0, vehicles: 0, laudos: 0, byType: {}, byMonth: [] });
  const [laudos, setLaudos] = useState<LaudoWithRelations[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [generatingPdfIds, setGeneratingPdfIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadingZip, setDownloadingZip] = useState(false);
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

  // Limpar seleção ao mudar de página ou filtros
  useEffect(() => {
    setSelectedIds(new Set());
  }, [laudos]);

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
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', clientId: '', dateFrom: '', dateTo: '', search: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === laudos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(laudos.map(l => l.id)));
    }
  };

  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setDownloadingZip(true);
    try {
      const payload = laudos
        .filter(l => selectedIds.has(l.id))
        .map(l => ({ id: l.id, type: l.laudoType, ordemServico: l.ordemServico }));

      const response = await fetch('/api/laudos/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laudos: payload }),
      });

      if (!response.ok) throw new Error('Erro ao gerar ZIP');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudos-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSelectedIds(new Set());
    } catch {
      alert('Erro ao gerar ZIP. Tente novamente.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDeleteLaudo = async (laudoId: string, ordemServico: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o laudo da OS ${ordemServico}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingIds(prev => [...prev, laudoId]);

    try {
      const response = await fetch(`/api/laudos/${laudoId}`, { method: 'DELETE' });

      if (response.ok) {
        setLaudos(prev => prev.filter(laudo => laudo.id !== laudoId));
        setStats(prev => ({ ...prev, laudos: prev.laudos - 1 }));

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

  const handleDownloadPdf = async (laudoId: string, laudoType: string, ordemServico: string) => {
    setGeneratingPdfIds(prev => [...prev, laudoId]);
    try {
      let response: Response;

      if (laudoType === 'PINO_REI') {
        response = await fetch(`/api/laudos/pino-rei/pdf?id=${laudoId}`);
      } else if (laudoType === 'QUINTA_RODA') {
        response = await fetch(`/api/laudos/quinta-roda/pdf?id=${laudoId}`);
      } else {
        response = await fetch('/api/laudos/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ laudoId, type: laudoType.toLowerCase() }),
        });
      }

      if (!response.ok) throw new Error(`Erro ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laudo-${laudoType.toLowerCase()}-${ordemServico}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF do laudo ${ordemServico}. Tente novamente.`);
    } finally {
      setGeneratingPdfIds(prev => prev.filter(id => id !== laudoId));
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Carregando...</div>
      </div>
    );
  }

  const chartsData: ChartsData = { byType: stats.byType ?? {}, byMonth: stats.byMonth ?? [] };

  return (
    <div className={styles.dashboard}>
      {/* Notificações de Equipamentos */}
      <section>
        <EquipmentNotifications />
      </section>

      {/* Stats Cards */}
      <section data-tutorial="stats">
        <div className={styles.statsGrid}>
          <StatCard label="Total Clientes" value={stats.clients} />
          <StatCard label="Total Veículos" value={stats.vehicles} />
          <StatCard label="Total Laudos" value={stats.laudos} />
        </div>
      </section>

      {/* Gráficos */}
      <LaudosCharts data={chartsData} />

      {/* Histórico de Laudos */}
      <section className={styles.laudosSection}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>📊 Histórico de Laudos</h2>
          <p className={styles.pageSubtitle}>
            Consulte e gerencie todos os laudos emitidos
          </p>
        </div>

        {/* Filtros */}
        <div data-tutorial="filters" className={styles.filtersSection}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Tipo de Laudo</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className={styles.filterSelect}
              >
                {laudoTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Cliente</label>
              <select
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos os clientes</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data De</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data Até</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className={styles.filterInput}
              />
            </div>

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

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>&nbsp;</label>
              <button onClick={clearFilters} className={styles.clearButton}>
                🗑️ Limpar
              </button>
            </div>
          </div>

          <div className={styles.resultsCount}>
            <span>
              Mostrando <strong>{laudos.length}</strong> de <strong>{pagination.totalCount}</strong> laudos
              {pagination.totalPages > 1 && (
                <> - Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong></>
              )}
            </span>
          </div>
        </div>

        {/* Barra de seleção / ZIP */}
        {selectedIds.size > 0 && (
          <div className={styles.zipBar}>
            <span className={styles.zipCount}>{selectedIds.size} laudo(s) selecionado(s)</span>
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className={styles.zipButton}
            >
              {downloadingZip ? '⏳ Gerando ZIP...' : `📦 Baixar ${selectedIds.size} PDF(s) em ZIP`}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className={styles.clearSelectionButton}>
              ✕ Desmarcar
            </button>
          </div>
        )}

        {/* Tabela */}
        <div data-tutorial="table" className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCol}>
                  <input
                    type="checkbox"
                    checked={laudos.length > 0 && selectedIds.size === laudos.length}
                    onChange={toggleSelectAll}
                    title="Selecionar todos"
                  />
                </th>
                <th>Ordem Serviço</th>
                <th className={styles.hideOnMobile}>Cliente</th>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Data Emissão</th>
                <th className={styles.hideOnMobile}>Data Vencimento</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {laudos.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    {pagination.totalCount === 0
                      ? 'Nenhum laudo encontrado no sistema'
                      : 'Nenhum laudo encontrado com os filtros aplicados'
                    }
                  </td>
                </tr>
              ) : (
                laudos.map((laudo) => (
                  <tr key={laudo.id} className={selectedIds.has(laudo.id) ? styles.rowSelected : ''}>
                    <td className={styles.checkboxCol}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(laudo.id)}
                        onChange={() => toggleSelect(laudo.id)}
                      />
                    </td>
                    <td className={styles.ordemServico}>{laudo.ordemServico}</td>
                    <td className={styles.hideOnMobile}>{laudo.client.name}</td>
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
                    <td className={styles.hideOnMobile}>{laudo.dataVencimento || 'N/A'}</td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          data-tutorial="pdf-btn"
                          onClick={() => handleDownloadPdf(laudo.id, laudo.laudoType, laudo.ordemServico)}
                          disabled={generatingPdfIds.includes(laudo.id)}
                          className={styles.pdfButton}
                        >
                          {generatingPdfIds.includes(laudo.id) ? '⏳' : '📄 PDF'}
                        </button>
                        <button
                          data-tutorial="delete-btn"
                          onClick={() => handleDeleteLaudo(laudo.id, laudo.ordemServico)}
                          disabled={deletingIds.includes(laudo.id)}
                          className={styles.deleteButton}
                        >
                          {deletingIds.includes(laudo.id) ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div data-tutorial="pagination" className={styles.paginationContainer}>
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
