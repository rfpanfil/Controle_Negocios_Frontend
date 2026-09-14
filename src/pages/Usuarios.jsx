import { useState, useEffect } from 'react';
import api from '../services/api';
import { Edit, UserX, UserCheck, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', sobrenome: '', email: '', login: '', senha: '', cargo: 'Vendedor', status: 'Ativo'
  });

  const cargosDisponiveis = ['Diretor', 'Gerente Comercial', 'Vendedor', 'Auxiliar de Vendas'];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios/');
      setUsuarios(response.data);
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        login: user.login || '',
        senha: '', // Não preenche a senha na edição
        cargo: user.cargo || 'Vendedor',
        status: user.status || 'Ativo'
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '', sobrenome: '', email: '', login: '', senha: '', cargo: 'Vendedor', status: 'Ativo'
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (editingUser && !payload.senha) {
        delete payload.senha; // Remove senha se não foi alterada
      }

      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, payload);
        toast.success('Usuário atualizado');
      } else {
        await api.post('/usuarios/', payload);
        toast.success('Usuário criado');
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (window.confirm(`Deseja ${currentStatus === 'Ativo' ? 'inativar' : 'ativar'} este usuário?`)) {
      try {
        await api.delete(`/usuarios/${id}`); // Assumindo que DELETE faz soft delete / toggle
        toast.success(`Usuário ${currentStatus === 'Ativo' ? 'inativado' : 'ativado'}`);
        fetchUsuarios();
      } catch (error) {
        toast.error('Erro ao alterar status do usuário');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Usuários</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          {loading ? (
            <div className="loading-container"><div className="loading-spinner"></div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Login</th>
                  <th>Cargo</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.length > 0 ? usuarios.map(user => (
                  <tr key={user.id} style={{ opacity: user.status === 'Ativo' ? 1 : 0.6 }}>
                    <td>{user.nome} {user.sobrenome}</td>
                    <td>{user.email}</td>
                    <td>{user.login}</td>
                    <td>{user.cargo}</td>
                    <td>
                      {user.status === 'Ativo' ? 
                        <span className="badge badge-green">Ativo</span> : 
                        <span className="badge badge-gray">Inativo</span>
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => openModal(user)} title="Editar">
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon" onClick={() => toggleStatus(user.id, user.status)} title={user.status === 'Ativo' ? 'Inativar' : 'Ativar'}>
                        {user.status === 'Ativo' ? <UserX size={18} color="var(--danger)" /> : <UserCheck size={18} color="var(--success)" />}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="empty-state">Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input type="text" className="form-control" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sobrenome</label>
                    <input type="text" className="form-control" value={formData.sobrenome} onChange={(e) => setFormData({...formData, sobrenome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail *</label>
                    <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Login *</label>
                    <input type="text" className="form-control" required value={formData.login} onChange={(e) => setFormData({...formData, login: e.target.value})} autoComplete="new-login" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Senha {editingUser && '(Deixe em branco para manter)'}</label>
                    <input type="password" className="form-control" required={!editingUser} value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} autoComplete="new-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo *</label>
                    <select className="form-control" required value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})}>
                      {cargosDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
