'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminUsers.module.css';
import { ROLE_LABELS, roleLabel } from '@/lib/roles';

interface User {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    clients: number;
    equipments: number;
  };
}

interface NewUser {
  username: string;
  password: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    password: '',
    role: 'client_a'
  });
  const [newPassword, setNewPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else if (response.status === 403) {
        router.push('/');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setNewUser({ username: '', password: '', role: 'client_a' });
        setShowCreateForm(false);
        loadUsers();
        alert('Usuário criado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar usuário');
      }
    } catch (error) {
      alert('Erro ao criar usuário');
    }
  };

  const updateUser = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        loadUsers();
        return true;
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar usuário');
        return false;
      }
    } catch (error) {
      alert('Erro ao atualizar usuário');
      return false;
    }
  };

  const toggleUserStatus = async (user: User) => {
    const success = await updateUser(user.id, { isActive: !user.isActive });
    if (success) {
      alert(`Usuário ${!user.isActive ? 'ativado' : 'desativado'} com sucesso!`);
    }
  };

  const changePassword = async (userId: string) => {
    if (!newPassword) {
      alert('Digite uma nova senha');
      return;
    }

    const success = await updateUser(userId, { password: newPassword });
    if (success) {
      setNewPassword('');
      setEditingUser(null);
      alert('Senha alterada com sucesso!');
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário "${user.username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadUsers();
        alert('Usuário deletado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao deletar usuário');
      }
    } catch (error) {
      alert('Erro ao deletar usuário');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando usuários...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔧 Administração de Usuários</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className={styles.createButton}
        >
          + Criar Usuário
        </button>
      </div>

      {showCreateForm && (
        <div className={styles.createForm}>
          <h3>Criar Novo Usuário</h3>
          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              className={styles.input}
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className={styles.select}
            >
              <option value="admin">Admin</option>
              <option value="client_a">{ROLE_LABELS.client_a}</option>
              <option value="client_b">{ROLE_LABELS.client_b}</option>
            </select>
          </div>
          <div className={styles.formActions}>
            <button onClick={createUser} className={styles.saveButton}>Criar</button>
            <button onClick={() => setShowCreateForm(false)} className={styles.cancelButton}>Cancelar</button>
          </div>
        </div>
      )}

      <div className={styles.usersTable}>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Clientes</th>
              <th>Equipamentos</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className={!user.isActive ? styles.inactiveRow : ''}>
                <td>
                  <strong>{user.username}</strong>
                </td>
                <td>
                  <span className={`${styles.role} ${styles[user.role]}`}>
                    {roleLabel(user.role).toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}>
                    {user.isActive ? '🟢 Ativo' : '🔴 Inativo'}
                  </span>
                </td>
                <td>{user._count.clients}</td>
                <td>{user._count.equipments}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => toggleUserStatus(user)}
                      className={user.isActive ? styles.blockButton : styles.activateButton}
                      title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                    >
                      {user.isActive ? '🚫' : '✅'}
                    </button>
                    
                    {editingUser === user.id ? (
                      <div className={styles.passwordEdit}>
                        <input
                          type="password"
                          placeholder="Nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className={styles.passwordInput}
                        />
                        <button onClick={() => changePassword(user.id)} className={styles.savePasswordButton}>💾</button>
                        <button onClick={() => {setEditingUser(null); setNewPassword('')}} className={styles.cancelPasswordButton}>❌</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingUser(user.id)}
                        className={styles.passwordButton}
                        title="Alterar senha"
                      >
                        🔑
                      </button>
                    )}
                    
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(user)}
                        className={styles.deleteButton}
                        title="Deletar usuário"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}