'use client';

import { useState, useEffect } from 'react';
import { Equipment } from '@/types/equipment';
import EquipmentForm from '@/components/admin/EquipmentForm';
import styles from './EquipmentsPage.module.css';

interface EquipmentStats {
  total: number;
  active: number;
  nearExpiration: number;
  expired: number;
}

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [stats, setStats] = useState<EquipmentStats>({ total: 0, active: 0, nearExpiration: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchEquipments = async () => {
    try {
      const response = await fetch('/api/equipments');
      if (!response.ok) throw new Error('Failed to fetch equipments');
      const data = await response.json();
      setEquipments(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching equipments:', error);
      showMessage('Erro ao carregar equipamentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (equipmentList: Equipment[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    const stats = equipmentList.reduce((acc, equipment) => {
      acc.total++;
      if (equipment.isActive) acc.active++;
      
      const expirationDate = new Date(equipment.expirationDate);
      if (expirationDate < now) {
        acc.expired++;
      } else if (expirationDate < thirtyDaysFromNow) {
        acc.nearExpiration++;
      }
      
      return acc;
    }, { total: 0, active: 0, nearExpiration: 0, expired: 0 });

    setStats(stats);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este equipamento?')) return;

    try {
      const response = await fetch(`/api/equipments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete equipment');
      
      await fetchEquipments();
      showMessage('Equipamento excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      showMessage('Erro ao excluir equipamento', 'error');
    }
  };

  const handleToggleActive = async (equipment: Equipment) => {
    try {
      const response = await fetch(`/api/equipments/${equipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...equipment, isActive: !equipment.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update equipment');
      
      await fetchEquipments();
      showMessage(
        `Equipamento ${!equipment.isActive ? 'ativado' : 'desativado'} com sucesso!`,
        'success'
      );
    } catch (error) {
      console.error('Error updating equipment:', error);
      showMessage('Erro ao atualizar equipamento', 'error');
    }
  };

  const getEquipmentStatus = (equipment: Equipment) => {
    if (!equipment.isActive) return 'inactive';
    
    const now = new Date();
    const expirationDate = new Date(equipment.expirationDate);
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    if (expirationDate < now) return 'expired';
    if (expirationDate < thirtyDaysFromNow) return 'near-expiration';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'near-expiration': return '#ffc107';
      case 'expired': return '#dc3545';
      case 'inactive': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'near-expiration': return 'Vencendo';
      case 'expired': return 'Vencido';
      case 'inactive': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || equipment.equipmentType === filterType;
    
    const status = getEquipmentStatus(equipment);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && equipment.isActive) ||
                         (filterStatus === 'inactive' && !equipment.isActive) ||
                         (filterStatus === 'expired' && status === 'expired') ||
                         (filterStatus === 'near-expiration' && status === 'near-expiration');
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedEquipments = [...filteredEquipments].sort((a, b) => {
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  useEffect(() => {
    fetchEquipments();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando equipamentos...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🔧 Gerenciar Equipamentos</h1>
        <button
          onClick={() => {
            setEditingEquipment(null);
            setShowForm(true);
          }}
          className={styles.addButton}
        >
          + Novo Equipamento
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}

      {/* Estatísticas */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: '#28a745' }}>{stats.active}</div>
          <div className={styles.statLabel}>Ativos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: '#ffc107' }}>{stats.nearExpiration}</div>
          <div className={styles.statLabel}>Vencendo</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber} style={{ color: '#dc3545' }}>{stats.expired}</div>
          <div className={styles.statLabel}>Vencidos</div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome, modelo ou certificado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Todos os tipos</option>
          <option value="DECIBELIMETRO">Decibelímetro</option>
          <option value="RUIDO">Equipamento de Ruído</option>
          <option value="CALIBRADOR">Calibrador</option>
          <option value="OUTROS">Outros</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="near-expiration">Vencendo</option>
          <option value="expired">Vencidos</option>
        </select>
      </div>

      {/* Lista de Equipamentos */}
      <div className={styles.equipmentsList}>
        {sortedEquipments.length === 0 ? (
          <div className={styles.noData}>Nenhum equipamento encontrado</div>
        ) : (
          sortedEquipments.map((equipment) => {
            const status = getEquipmentStatus(equipment);
            return (
              <div key={equipment.id} className={styles.equipmentCard}>
                <div className={styles.equipmentInfo}>
                  <div className={styles.equipmentHeader}>
                    <h3 className={styles.equipmentName}>{equipment.name}</h3>
                    <div
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {getStatusText(status)}
                    </div>
                  </div>
                  
                  <div className={styles.equipmentDetails}>
                    <p><strong>Modelo:</strong> {equipment.model}</p>
                    <p><strong>Certificado:</strong> {equipment.certificateNumber}</p>
                    <p><strong>Tipo:</strong> {equipment.equipmentType}</p>
                    <p><strong>Calibração:</strong> {new Date(equipment.calibrationDate).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Vencimento:</strong> {new Date(equipment.expirationDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className={styles.equipmentActions}>
                  <button
                    onClick={() => handleEdit(equipment)}
                    className={styles.editButton}
                  >
                    ✏️ Editar
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(equipment)}
                    className={`${styles.toggleButton} ${equipment.isActive ? styles.deactivate : styles.activate}`}
                  >
                    {equipment.isActive ? '🚫 Desativar' : '✅ Ativar'}
                  </button>
                  
                  <button
                    onClick={() => handleDelete(equipment.id)}
                    className={styles.deleteButton}
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEquipment(null);
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            <EquipmentForm
              equipment={editingEquipment}
              onSuccess={() => {
                setShowForm(false);
                setEditingEquipment(null);
                fetchEquipments();
                showMessage(
                  editingEquipment ? 'Equipamento atualizado com sucesso!' : 'Equipamento criado com sucesso!',
                  'success'
                );
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingEquipment(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}