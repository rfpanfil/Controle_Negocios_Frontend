import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, Edit, Plus, Phone, Mail, Building, 
  MapPin, Calendar, User, MessageCircle, FileText, X, Eye, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const LeadDetalhe = ({ leadId, onClose }) => {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [lead, setLead] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [fupEditId, setFupEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('followups');

  // Modal de Follow-Up
  const [fupModalOpen, setFupModalOpen] = useState(false);
  const [fupFormData, setFupFormData] = useState({
    tipo: 'Ligação', descricao: '', proxima_acao: '', data_proxima_acao: '', encerrar_lead: false
  });

  useEffect(() => {
    fetchData();
  }, [leadId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadRes, propRes, fupRes] = await Promise.all([
        api.get(`/leads/${leadId}`),
        api.get('/propostas/', { params: { lead_id: leadId } }),
        api.get('/followups/', { params: { lead_id: leadId } })
      ]);
      setLead(leadRes.data);
      setPropostas(propRes.data);
      setFollowups(fupRes.data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes');
      onClose();
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

  const getPropStatusBadge = (statusStr) => {
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

  const handleEditFup = (fup) => {
    setFupEditId(fup.id);
    setFupFormData({
      tipo: fup.tipo,
      descricao: fup.descricao,
      proxima_acao: fup.proxima_acao || '',
      data_proxima_acao: fup.data_proxima_acao ? fup.data_proxima_acao.split('T')[0] : '',
      encerrar_lead: false
    });
    setFupModalOpen(true);
  };

  const handleDeleteFup = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este follow-up?')) return;
    try {
      await api.delete(`/followups/${id}`);
      toast.success('Follow-up excluído');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir follow-up');
    }
  };

  const handleFupSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...fupFormData,
        lead_id: parseInt(leadId)
      };
      
      if (payload.data_proxima_acao) {
        payload.data_proxima_acao = new Date(payload.data_proxima_acao).toISOString();
      } else {
        delete payload.data_proxima_acao;
      }
      
      if (fupEditId) {
        await api.put(`/followups/${fupEditId}`, payload);
        toast.success('Follow-up atualizado com sucesso');
      } else {
        payload.data_contato = new Date().toISOString();
        await api.post('/followups/', payload);
        toast.success('Follow-up registrado com sucesso');
      }
      
      setFupModalOpen(false);
      setFupEditId(null);
      setFupFormData({ tipo: 'Ligação', descricao: '', proxima_acao: '', data_proxima_acao: '', encerrar_lead: false });
      fetchData(); // Reload
    } catch (error) {
      toast.error('Erro ao salvar follow-up');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading || !lead) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
      <div className="page-header" style={{ paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {lead.nome} {getStatusBadge(lead.status)}
            </h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {lead.empresa_nome || 'Sem empresa vinculada'}
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} /> Informações de Contato
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--text-secondary)" /> {lead.email || '-'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="var(--text-secondary)" /> {lead.telefone || '-'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={16} color="var(--text-secondary)" /> CNPJ/CPF: {lead.cnpj_cpf || '-'}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Detalhes
          </h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Responsável:</span> {lead.responsavel?.nome || 'Nenhum'}</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Origem:</span> {lead.origem?.nome || 'Não informada'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--text-secondary)" /> 
              Cadastrado em: {format(new Date(lead.data_cadastro), 'dd/MM/yyyy')}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            Follow-Ups
          </button>
          <button 
            className={`tab-btn ${activeTab === 'propostas' ? 'active' : ''}`}
            onClick={() => setActiveTab('propostas')}
          >
            Propostas ({propostas.length})
          </button>
        </div>

        {activeTab === 'followups' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => {
                setFupEditId(null);
                setFupFormData({ tipo: 'Ligação', descricao: '', proxima_acao: '', data_proxima_acao: '', encerrar_lead: false });
                setFupModalOpen(true);
              }}>
                <Plus size={16} /> Novo Follow-Up
              </button>
            </div>
            
            {followups.length > 0 ? (
              <div className="timeline">
                {followups.map(fup => (
                  <div key={fup.id} className="timeline-item">
                    <div className="timeline-icon">
                      <MessageCircle size={14} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{fup.tipo}</strong>
                        <span>
                          {format(new Date(fup.data_contato), 'dd/MM/yyyy HH:mm')} por {fup.usuario?.nome}
                          <div style={{ display: 'inline-flex', gap: '8px', marginLeft: '12px' }}>
                            {can('followup.editar') && (
                              <button type="button" className="btn-icon" onClick={() => handleEditFup(fup)} title="Editar" style={{ padding: '2px', color: 'var(--text-secondary)' }}>
                                <Edit size={14} />
                              </button>
                            )}
                            {can('followup.excluir') && (
                              <button type="button" className="btn-icon" onClick={() => handleDeleteFup(fup.id)} title="Excluir" style={{ padding: '2px', color: 'var(--danger)' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </span>
                      </div>
                      <div className="timeline-desc">{fup.descricao}</div>
                      {fup.proxima_acao && (
                        <div className="timeline-footer">
                          <strong>Próxima ação:</strong> {fup.proxima_acao}
                          {fup.data_proxima_acao && (
                            <span style={{ marginLeft: 'auto' }}>
                              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                              {format(new Date(fup.data_proxima_acao), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Nenhum histórico de follow-up.</div>
            )}
          </div>
        )}

        {activeTab === 'propostas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/propostas')}>
                <Plus size={16} /> Ir para Propostas
              </button>
            </div>
            
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {propostas.length > 0 ? propostas.map(prop => (
                    <tr key={prop.id}>
                      <td>{prop.numero_proposta}</td>
                      <td>{prop.titulo}</td>
                      <td>{prop.categoria?.nome || '-'}</td>
                      <td>{formatCurrency(prop.valor_total)}</td>
                      <td>{getPropStatusBadge(prop.status)}</td>
                      <td>
                        <button className="btn-icon" onClick={() => navigate(`/propostas/${prop.id}`)}>
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="empty-state">Nenhuma proposta vinculada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Follow-Up Modal */}
      {fupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{fupEditId ? 'Editar Follow-Up' : 'Registrar Follow-Up'}</h3>
              <button className="modal-close" onClick={() => setFupModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFupSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de Contato</label>
                  <select className="form-control" value={fupFormData.tipo} onChange={(e) => setFupFormData({...fupFormData, tipo: e.target.value})}>
                    <option>Ligação</option>
                    <option>E-mail</option>
                    <option>Reunião Presencial</option>
                    <option>Reunião Online</option>
                    <option>WhatsApp</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição (O que foi conversado?) *</label>
                  <textarea className="form-control" rows="4" required value={fupFormData.descricao} onChange={(e) => setFupFormData({...fupFormData, descricao: e.target.value})}></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Próxima Ação</label>
                    <input type="text" className="form-control" placeholder="Ex: Enviar proposta, ligar novamente" value={fupFormData.proxima_acao} onChange={(e) => setFupFormData({...fupFormData, proxima_acao: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data da Próxima Ação</label>
                    <input type="date" className="form-control" value={fupFormData.data_proxima_acao} onChange={(e) => setFupFormData({...fupFormData, data_proxima_acao: e.target.value})} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="encerrarLead" checked={fupFormData.encerrar_lead} onChange={(e) => setFupFormData({...fupFormData, encerrar_lead: e.target.checked})} />
                  <label htmlFor="encerrarLead" style={{ margin: 0, color: 'var(--danger)', fontWeight: 'bold' }}>Desativar Lead e Cancelar Propostas Abertas</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFupModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetalhe;
