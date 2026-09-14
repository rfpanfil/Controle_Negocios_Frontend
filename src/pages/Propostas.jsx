import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye, Edit, Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PropostaDetalhe from './PropostaDetalhe';
import { format } from 'date-fns';
import Select from 'react-select';

const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Propostas = () => {
  const [propostas, setPropostas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [leads, setLeads] = useState([]);
  const [itensPadrao, setItensPadrao] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limit, setLimit] = useState('100');

  const [detalheModalOpen, setDetalheModalOpen] = useState(false);
  const [selectedPropostaId, setSelectedPropostaId] = useState(null);
  const [selectedLeadData, setSelectedLeadData] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    lead_id: null, titulo: '', descricao: '', categoria_id: '', 
    data_validade: ''
  });
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState({ item_padrao_id: '', descricao: '', valor_unitario: 0, quantidade: 1, tipo: 'Produto' });

  const navigate = useNavigate();

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchPropostas();
  }, [search, status, categoria, dataInicio, dataFim, limit]);

  const fetchBaseData = async () => {
    try {
      const [catRes, leadsRes, propRes, itensRes] = await Promise.all([
        api.get('/configuracoes/categorias'),
        api.get('/leads/?status=Ativo'),
        api.get('/propostas/'),
        api.get('/configuracoes/itens-padrao/')
      ]);
      setCategorias(catRes.data);
      setItensPadrao(itensRes.data);
      
      const leadsComProposta = new Set(
        propRes.data
          .filter(p => !['Cancelada', 'Perdida'].includes(p.status))
          .map(p => p.lead?.id)
      );
      
      const availableLeads = leadsRes.data.filter(l => !leadsComProposta.has(l.id));
      setLeads(availableLeads.map(l => ({ value: l.id, label: `${l.nome} - ${l.empresa_nome || 'S/ Empresa'}` })));
    } catch (error) {
      toast.error('Erro ao carregar dados base');
    }
  };

  const fetchPropostas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (categoria) params.categoria_id = categoria;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      if (limit !== 'Todos') params.limit = limit;

      const response = await api.get('/propostas/', { params });
      setPropostas(response.data);
    } catch (error) {
      toast.error('Erro ao carregar propostas');
      setPropostas([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'Em Elaboração': return <span className="badge badge-gray">Em Elaboração</span>;
      case 'Enviada': return <span className="badge badge-blue">Enviada</span>;
      case 'Em Negociação': return <span className="badge badge-yellow">Em Negociação</span>;
      case 'Fechada (Ganha)': return <span className="badge badge-green">Fechada (Ganha)</span>;
      case 'Perdida': return <span className="badge badge-red">Perdida</span>;
      case 'Cancelada': return <span className="badge badge-dark-gray">Cancelada</span>;
      default: return <span className="badge badge-gray">{statusStr}</span>;
    }
  };

  const openModal = () => {
    setFormData({
      lead_id: null, titulo: '', descricao: '', categoria_id: '', 
      data_validade: ''
    });
    setItens([]);
    setNovoItem({ item_padrao_id: '', descricao: '', valor_unitario: 0, quantidade: 1, tipo: 'Produto' });
    setSelectedLeadData(null);
    setModalOpen(true);
  };

  const handleAddItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0 || novoItem.valor_unitario < 0) {
      toast.error('Preencha os dados do item corretamente');
      return;
    }
    const valor_total = Number(novoItem.quantidade) * Number(novoItem.valor_unitario);
    setItens([...itens, { ...novoItem, valor_total }]);
    setNovoItem({ item_padrao_id: '', descricao: '', valor_unitario: 0, quantidade: 1, tipo: 'Produto' });
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lead_id) {
      toast.error('Selecione um lead');
      return;
    }

    try {
      const valor_total = itens.reduce((acc, item) => acc + Number(item.valor_total), 0);
      const payload = {
        ...formData,
        lead_id: formData.lead_id.value,
        valor_total: valor_total,
        itens: itens
      };
      if (!payload.data_validade) delete payload.data_validade;
      
      const res = await api.post('/propostas/', payload);
      toast.success('Proposta criada com sucesso');
      setModalOpen(false);
      fetchPropostas();
      setSelectedPropostaId(res.data.id);
      setDetalheModalOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar proposta');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Propostas</h2>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} /> Nova Proposta
        </button>
      </div>

      <div className="card">
        <div className="filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar título, número, lead..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status (Todos)</option>
            <option value="Em Elaboração">Em Elaboração</option>
            <option value="Enviada">Enviada</option>
            <option value="Em Negociação">Em Negociação</option>
            <option value="Fechada (Ganha)">Fechada (Ganha)</option>
            <option value="Perdida">Perdida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
          <select className="form-control" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Categoria (Todas)</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input 
            type="date" 
            className="form-control" 
            title="Data Inicial"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <input 
            type="date" 
            className="form-control" 
            title="Data Final"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          <select className="form-control" value={limit} onChange={(e) => setLimit(e.target.value)}>
            <option value="50">50 registros</option>
            <option value="100">100 registros</option>
            <option value="200">200 registros</option>
            <option value="Todos">Todos</option>
          </select>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div className="loading-container"><div className="loading-spinner"></div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Título</th>
                  <th>Lead</th>
                  <th>Categoria</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th>Data Criação</th>
                  <th>Validade</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {propostas.length > 0 ? propostas.map(prop => {
                  let validadeColor = 'var(--text-primary)';
                  if (prop.data_validade) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const valDate = new Date(prop.data_validade);
                    const diffTime = valDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) validadeColor = 'var(--danger)'; // Vencida
                    else if (diffDays <= 3) validadeColor = 'var(--warning)'; // Vence em breve
                    else validadeColor = 'var(--success)';
                  }
                  
                  return (
                  <tr key={prop.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedPropostaId(prop.id); setDetalheModalOpen(true); }}>
                    <td style={{ fontWeight: '500' }}>{prop.numero}</td>
                    <td>{prop.titulo}</td>
                    <td>{prop.lead?.nome}</td>
                    <td>{prop.categoria?.nome || '-'}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(prop.valor_total)}</td>
                    <td>{getStatusBadge(prop.status)}</td>
                    <td>{format(new Date(prop.data_criacao), 'dd/MM/yyyy')}</td>
                    <td style={{ color: validadeColor, fontWeight: '500' }}>
                      {prop.data_validade ? format(new Date(prop.data_validade), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" title="Ver Detalhes" onClick={() => { setSelectedPropostaId(prop.id); setDetalheModalOpen(true); }}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-icon" title="Editar Proposta" onClick={() => { setSelectedPropostaId(prop.id); setDetalheModalOpen(true); }}>
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan="8" className="empty-state">Nenhuma proposta encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nova Proposta */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Proposta</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Lead (Cliente) *</label>
                  <Select 
                    options={leads}
                    value={formData.lead_id}
                    onChange={async (val) => {
                      setFormData({...formData, lead_id: val});
                      if (val) {
                        try {
                          const res = await api.get('/leads/' + val.value);
                          setSelectedLeadData(res.data);
                        } catch(e) {
                          setSelectedLeadData(null);
                        }
                      } else {
                        setSelectedLeadData(null);
                      }
                    }}
                    placeholder="Selecione ou busque um lead..."
                    isSearchable
                  />
                  {selectedLeadData && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '4px' }}><strong>Empresa:</strong> {selectedLeadData.empresa_nome || '-'}</div>
                      <div style={{ marginBottom: '4px' }}><strong>Telefone:</strong> {selectedLeadData.telefone || '-'}</div>
                      <div style={{ marginBottom: '4px' }}><strong>Responsável:</strong> {selectedLeadData.responsavel_nome || '-'}</div>
                      <div style={{ marginBottom: '4px' }}><strong>Origem:</strong> {selectedLeadData.origem_nome || '-'}</div>
                      <div style={{ marginBottom: '4px' }}><strong>Categoria:</strong> {categorias.find(c => c.id === selectedLeadData.categoria_id)?.nome || '-'}</div>
                      <div><strong>Observações:</strong> {selectedLeadData.observacoes || '-'}</div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Título da Proposta *</label>
                  <input type="text" className="form-control" required value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} placeholder="Ex: Projeto Elétrico Residencial" />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição Base</label>
                  <textarea className="form-control" rows="3" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})}></textarea>
                </div>
                <div className="card" style={{ padding: '16px', marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Itens da Proposta</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Item Padrão</label>
                      <select 
                        className="form-control"
                        value={novoItem.item_padrao_id}
                        onChange={(e) => {
                          const itemStr = e.target.value;
                          if (!itemStr) {
                            setNovoItem({ ...novoItem, item_padrao_id: '', descricao: '', valor_unitario: 0 });
                            return;
                          }
                          const item = itensPadrao.find(i => i.id === parseInt(itemStr));
                          if (item) {
                            setNovoItem({ ...novoItem, item_padrao_id: item.id, descricao: item.descricao, valor_unitario: item.valor_unitario || 0 });
                          }
                        }}
                      >
                        <option value="">Selecione...</option>
                        {itensPadrao.map(ip => <option key={ip.id} value={ip.id}>{ip.descricao}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Qtd</label>
                      <input type="number" step="0.01" className="form-control" value={novoItem.quantidade} onChange={e => setNovoItem({...novoItem, quantidade: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">V. Unit.</label>
                      <input type="number" step="0.01" className="form-control" value={novoItem.valor_unitario} onChange={e => setNovoItem({...novoItem, valor_unitario: e.target.value})} />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ height: '42px', padding: '0 16px' }}>
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  {itens.length > 0 && (
                    <table style={{ width: '100%', fontSize: '0.9rem', marginTop: '12px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Descrição</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Qtd</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>V. Unit.</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((it, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '8px' }}>{it.descricao}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{it.quantidade}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{formatCurrency(it.valor_unitario)}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>{formatCurrency(it.valor_total)}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>
                              <button type="button" className="btn-icon" onClick={() => handleRemoveItem(idx)} style={{ color: 'var(--danger)' }}>
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>Total da Proposta:</td>
                          <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {formatCurrency(itens.reduce((acc, it) => acc + Number(it.valor_total), 0))}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Validade</label>
                  <input type="date" className="form-control" value={formData.data_validade} onChange={(e) => setFormData({...formData, data_validade: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar Proposta</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detalheModalOpen && (
        <PropostaDetalhe 
          propostaId={selectedPropostaId} 
          onClose={() => setDetalheModalOpen(false)}
          onUpdate={fetchPropostas}
        />
      )}
    </div>
  );
};

export default Propostas;
