import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const GenericCrudTab = ({ title, endpoint }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [nome, setNome] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (error) {
      toast.error(`Erro ao carregar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      if (editingItem) {
        await api.put(`${endpoint}${editingItem.id}`, { nome });
        toast.success(`${title} atualizado(a)`);
      } else {
        await api.post(endpoint, { nome });
        toast.success(`${title} criado(a)`);
      }
      setEditingItem(null);
      setNome('');
      fetchItems();
    } catch (error) {
      toast.error(`Erro ao salvar ${title.toLowerCase()}`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNome(item.nome);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setNome('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este registro?')) {
      try {
        await api.delete(`${endpoint}${id}`);
        toast.success('Registro excluído');
        fetchItems();
      } catch (error) {
        toast.error('Erro ao excluir registro (pode estar em uso)');
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder={`Nome da ${title}...`}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ maxWidth: '400px' }}
        />
        <button type="submit" className="btn btn-primary">
          {editingItem ? 'Atualizar' : 'Adicionar'}
        </button>
        {editingItem && (
          <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner"></div></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map(item => (
                <tr key={item.id}>
                  <td>{item.nome}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => handleEdit(item)}><Edit size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="2" className="empty-state">Nenhum registro encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ItensPadraoTab = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/configuracoes/itens-padrao/');
      setItems(res.data);
    } catch (error) {
      toast.error('Erro ao carregar itens padrão');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    try {
      const payload = { descricao, valor_unitario: parseFloat(valorUnitario) || 0 };
      if (editingItem) {
        await api.put(`/configuracoes/itens-padrao/${editingItem.id}`, payload);
        toast.success('Item atualizado');
      } else {
        await api.post('/configuracoes/itens-padrao/', payload);
        toast.success('Item criado');
      }
      setEditingItem(null);
      setDescricao('');
      setValorUnitario('');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setDescricao(item.descricao);
    setValorUnitario(item.valor_unitario);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setDescricao('');
    setValorUnitario('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir este item padrão?')) {
      try {
        await api.delete(`/configuracoes/itens-padrao/${id}`);
        toast.success('Item excluído');
        fetchItems();
      } catch (error) {
        toast.error('Erro ao excluir item');
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Descrição do item..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          style={{ flex: 2 }}
        />
        <input 
          type="number" 
          className="form-control" 
          placeholder="Valor Unitário (R$)"
          value={valorUnitario}
          onChange={(e) => setValorUnitario(e.target.value)}
          step="0.01"
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          {editingItem ? 'Atualizar' : 'Adicionar'}
        </button>
        {editingItem && (
          <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner"></div></div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor Unitário</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map(item => (
                <tr key={item.id}>
                  <td>{item.descricao}</td>
                  <td>{Number(item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => handleEdit(item)}><Edit size={16} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="empty-state">Nenhum item padrão encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState('categorias');

  return (
    <div>
      <div className="page-header">
        <h2>Configurações</h2>
      </div>

      <div className="card">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'categorias' ? 'active' : ''}`}
            onClick={() => setActiveTab('categorias')}
          >
            Categorias de Proposta
          </button>
          <button 
            className={`tab-btn ${activeTab === 'motivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('motivos')}
          >
            Motivos de Perda
          </button>
          <button 
            className={`tab-btn ${activeTab === 'origens' ? 'active' : ''}`}
            onClick={() => setActiveTab('origens')}
          >
            Origens de Lead
          </button>
          <button 
            className={`tab-btn ${activeTab === 'itens_padrao' ? 'active' : ''}`}
            onClick={() => setActiveTab('itens_padrao')}
          >
            Itens Padrão
          </button>
        </div>

        {activeTab === 'categorias' && <GenericCrudTab title="Categoria" endpoint="/configuracoes/categorias/" />}
        {activeTab === 'motivos' && <GenericCrudTab title="Motivo de Perda" endpoint="/configuracoes/motivos-perda/" />}
        {activeTab === 'origens' && <GenericCrudTab title="Origem de Lead" endpoint="/configuracoes/origens-lead/" />}
        {activeTab === 'itens_padrao' && <ItensPadraoTab />}
      </div>
    </div>
  );
};

export default Configuracoes;
