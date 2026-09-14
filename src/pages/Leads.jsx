import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Eye, Edit, Trash2, Plus, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import LeadDetalhe from './LeadDetalhe';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [origens, setOrigens] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [origem, setOrigem] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limit, setLimit] = useState('100');

  const [detalheModalOpen, setDetalheModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', empresa_nome: '', 
    cnpj_cpf: '', origem_id: '', categoria_id: '', responsavel_id: '', observacoes: '',
    proxima_acao: '', data_proxima_acao: ''
  });

  const { can, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtro = searchParams.get('filtro');
  const leadId = searchParams.get('leadId');

  useEffect(() => {
    fetchSupportData();
  }, []);

  useEffect(() => {
    if (leadId) {
      setSelectedLeadId(leadId);
      setDetalheModalOpen(true);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeads();
  }, [search, status, origem, responsavel, dataInicio, dataFim, limit]);

  const fetchSupportData = async () => {
    try {
      const [origensRes, usuariosRes, categoriasRes] = await Promise.all([
        api.get('/configuracoes/origens-lead/'),
        api.get('/usuarios/'),
        api.get('/configuracoes/categorias/')
      ]);
      setOrigens(origensRes.data);
      setUsuarios(usuariosRes.data);
      setCategorias(categoriasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados auxiliares');
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (origem) params.origem_id = origem;
      if (responsavel) params.responsavel_id = responsavel;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      if (limit !== 'Todos') params.limit = limit;

      const response = await api.get('/leads/', { params });
      let loadedLeads = response.data;
      if (filtro === 'atrasados') {
        loadedLeads = loadedLeads.filter(l => l.tem_followup_atrasado);
      }
      setLeads(loadedLeads);
    } catch (error) {
      toast.error('Erro ao carregar leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case 'Ativo': return <span className="badge badge-green">Ativo</span>;
      case 'Inativo': return <span className="badge badge-gray">Inativo</span>;
      case 'Convertido': return <span className="badge badge-blue">Convertido</span>;
      default: return <span className="badge badge-gray">{statusStr}</span>;
    }
  };

  const openModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        nome: lead.nome || '',
        email: lead.email || '',
        telefone: lead.telefone || '',
        empresa_nome: lead.empresa_nome || '',
        cnpj_cpf: lead.cnpj_cpf || '',
        origem_id: lead.origem_id || '',
        categoria_id: lead.categoria_id || '',
        responsavel_id: lead.responsavel_id || '',
        observacoes: lead.observacoes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({
        nome: '', email: '', telefone: '', empresa_nome: '', 
        cnpj_cpf: '', origem_id: '', categoria_id: '', responsavel_id: user?.id || '', observacoes: '',
        proxima_acao: '', data_proxima_acao: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, formData);
        toast.success('Lead atualizado com sucesso');
      } else {
        await api.post('/leads/', formData);
        toast.success('Lead criado com sucesso');
      }
      setModalOpen(false);
      fetchLeads();
    } catch (error) {
      let msg = 'Erro ao salvar lead';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          msg = error.response.data.detail[0].msg;
        } else if (typeof error.response.data.detail === 'string') {
          msg = error.response.data.detail;
        }
      }
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja inativar este lead?')) {
      try {
        await api.delete(`/leads/${id}`);
        toast.success('Lead inativado com sucesso');
        fetchLeads();
      } catch (error) {
        toast.error('Erro ao inativar lead');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Leads</h2>
        {can('leads.criar') && (
          <button className="btn btn-primary" onClick={() => openModal()}>
            <Plus size={18} /> Novo Lead
          </button>
        )}
      </div>

      <div className="card">
        <div className="filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar nome, e-mail, telefone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status (Todos)</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Convertido">Convertido</option>
          </select>
          <select className="form-control" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="">Origem (Todas)</option>
            {origens.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <select className="form-control" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
            <option value="">Responsável (Todos)</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
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
                  <th>Nome</th>
                  <th>Empresa</th>
                  <th>Telefone</th>
                  <th>Origem</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Última Interação</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.length > 0 ? leads.map(lead => (
                  <tr 
                    key={lead.id} 
                    style={{ borderLeft: lead.tem_followup_atrasado ? '4px solid var(--danger)' : 'none', cursor: 'pointer' }}
                    onClick={() => { setSelectedLeadId(lead.id); setDetalheModalOpen(true); }}
                  >
                    <td>
                      {lead.nome}
                      {lead.tem_followup_atrasado && <span style={{ marginLeft: '8px', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>• Atrasado</span>}
                    </td>
                    <td>{lead.empresa_nome || '-'}</td>
                    <td>{lead.telefone || '-'}</td>
                    <td>{lead.origem?.nome || '-'}</td>
                    <td>{lead.responsavel?.nome || '-'}</td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td>
                      {lead.ultima_interacao_data 
                        ? format(new Date(lead.ultima_interacao_data), 'dd/MM/yyyy') 
                        : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" title="Ver Detalhes" onClick={() => { setSelectedLeadId(lead.id); setDetalheModalOpen(true); }}>
                        <Eye size={18} />
                      </button>
                      <button className="btn-icon" title="Editar" onClick={() => openModal(lead)}>
                        <Edit size={18} />
                      </button>
                      <button className="btn-icon" title="Excluir" onClick={() => handleDelete(lead.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="empty-state">Nenhum lead encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingLead ? 'Editar Lead' : 'Novo Lead'}</h3>
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
                    <label className="form-label">E-mail</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input type="text" className="form-control" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome da Empresa</label>
                    <input type="text" className="form-control" value={formData.empresa_nome} onChange={(e) => setFormData({...formData, empresa_nome: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ/CPF</label>
                    <input type="text" className="form-control" value={formData.cnpj_cpf} onChange={(e) => setFormData({...formData, cnpj_cpf: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Origem</label>
                    <select className="form-control" value={formData.origem_id} onChange={(e) => setFormData({...formData, origem_id: e.target.value})}>
                      <option value="">Selecione...</option>
                      {origens.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoria de Interesse</label>
                    <select className="form-control" value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}>
                      <option value="">Selecione...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Responsável</label>
                    <select className="form-control" value={formData.responsavel_id} onChange={(e) => setFormData({...formData, responsavel_id: e.target.value})} disabled={!can('leads.atribuir')}>
                      <option value="">Selecione...</option>
                      {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows="3" value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})}></textarea>
                </div>
                
                {!editingLead && (
                  <>
                    <h4 style={{ margin: '16px 0 8px 0', fontSize: '1rem', color: 'var(--primary)' }}>Primeiro Follow-up</h4>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Ação / Resumo Inicial</label>
                        <input type="text" className="form-control" placeholder="Ex: Ligar na sexta-feira..." value={formData.proxima_acao} onChange={(e) => setFormData({...formData, proxima_acao: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Data de Retorno</label>
                        <input type="date" className="form-control" value={formData.data_proxima_acao} onChange={(e) => setFormData({...formData, data_proxima_acao: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalheModalOpen && (
        <LeadDetalhe 
          leadId={selectedLeadId} 
          onClose={() => {
            setDetalheModalOpen(false);
            fetchLeads();
          }} 
        />
      )}
    </div>
  );
};

export default Leads;
