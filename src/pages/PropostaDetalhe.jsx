import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Plus, Trash2, CheckCircle, 
  XCircle, Send, AlertCircle, FileText, Edit,
  DollarSign, BarChart2, Calendar, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const PropostaDetalhe = ({ propostaId, onClose, onUpdate }) => {
  const { can } = useAuth();
  const [proposta, setProposta] = useState(null);
  const [motivosPerda, setMotivosPerda] = useState([]);
  const [itensPadrao, setItensPadrao] = useState([]);
  const [loading, setLoading] = useState(true);

  // New states for editing gerais
  const [isEditingGerais, setIsEditingGerais] = useState(false);
  const [geraisData, setGeraisData] = useState({});
  const [options, setOptions] = useState({ leads: [], users: [], categorias: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemData, setItemData] = useState({ descricao: '', quantidade: 1, valor_unitario: 0 });
  
  const [perdaModalOpen, setPerdaModalOpen] = useState(false);
  const [perdaData, setPerdaData] = useState({ motivo_perda_id: '', observacao_perda: '' });

  const [editCusto, setEditCusto] = useState(false);
  const [novoCusto, setNovoCusto] = useState('');

  useEffect(() => {
    if (propostaId) fetchData();
  }, [propostaId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, motivosRes, itensPadraoRes] = await Promise.all([
        api.get(`/propostas/${propostaId}`),
        api.get('/configuracoes/motivos-perda/'),
        api.get('/configuracoes/itens-padrao/')
      ]);
      setProposta(propRes.data);
      setMotivosPerda(motivosRes.data);
      setItensPadrao(itensPadraoRes.data);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da proposta');
      if (onClose) onClose();
    } finally {
      setLoading(false);
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

  const changeStatus = async (newStatus, extraData = {}) => {
    try {
      await api.patch(`/propostas/${propostaId}/status`, { status: newStatus, ...extraData });
      toast.success(`Status alterado para ${newStatus}`);
      if (newStatus === 'Perdida') setPerdaModalOpen(false);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao alterar status');
    }
  };

  const handleSaveCusto = async () => {
    try {
      await api.put(`/propostas/${propostaId}`, { 
        ...proposta, 
        lead_id: proposta.lead_id || proposta.lead?.id,
        custo_material: Number(novoCusto) 
      });
      toast.success('Custo atualizado');
      setEditCusto(false);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar custo');
    }
  };

  const handleEditGerais = async () => {
    setIsEditingGerais(true);
    setGeraisData({
      titulo: proposta.titulo || '',
      categoria_id: proposta.categoria_id || '',
      data_validade: proposta.data_validade ? proposta.data_validade.substring(0, 10) : '',
      lead_id: proposta.lead_id || proposta.lead?.id || '',
      responsavel_id: proposta.responsavel_id || proposta.responsavel?.id || ''
    });
    
    if (options.leads.length === 0) {
      setLoadingOptions(true);
      try {
        const [leadsRes, usersRes, catRes] = await Promise.all([
          api.get('/leads/'),
          api.get('/usuarios/'),
          api.get('/configuracoes/categorias/')
        ]);
        setOptions({
          leads: leadsRes.data,
          users: usersRes.data,
          categorias: catRes.data
        });
      } catch (err) {
        toast.error('Erro ao carregar opções para edição');
      } finally {
        setLoadingOptions(false);
      }
    }
  };

  const handleUpdateGerais = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/propostas/${propostaId}`, {
        ...proposta,
        lead_id: geraisData.lead_id,
        titulo: geraisData.titulo,
        categoria_id: geraisData.categoria_id,
        data_validade: geraisData.data_validade || null,
        responsavel_id: geraisData.responsavel_id,
      });
      toast.success('Informações gerais atualizadas com sucesso');
      setIsEditingGerais(false);
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar informações gerais');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemData,
        quantidade: Number(itemData.quantidade),
        valor_unitario: Number(itemData.valor_unitario)
      };
      await api.post(`/propostas/${propostaId}/itens`, payload);
      toast.success('Item adicionado');
      setItemModalOpen(false);
      setItemData({ descricao: '', quantidade: 1, valor_unitario: 0 });
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remover este item?')) return;
    try {
      await api.delete(`/propostas/${propostaId}/itens/${itemId}`);
      toast.success('Item removido');
      fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  if (!propostaId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        {loading || !proposta ? (
          <div className="loading-container"><div className="loading-spinner"></div></div>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>
                  Proposta #{proposta.numero}
                </div>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  {proposta.titulo} {getPropStatusBadge(proposta.status)}
                </h3>
              </div>
              <button className="modal-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{ backgroundColor: 'var(--bg-page)' }}>
              {(() => {
                const margemBruta = proposta.valor_total - (proposta.custo_material || 0);
                const margemPercentual = proposta.valor_total > 0 ? (margemBruta / proposta.valor_total) * 100 : 0;
                return (
                  <>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {proposta.status === 'Em Elaboração' && (
                  <button className="btn btn-primary" onClick={() => changeStatus('Enviada')}>
                    <Send size={16} /> Marcar como Enviada
                  </button>
                )}
                {proposta.status === 'Enviada' && (
                  <button className="btn" style={{ backgroundColor: 'var(--warning)', color: '#fff' }} onClick={() => changeStatus('Em Negociação')}>
                    <AlertCircle size={16} /> Em Negociação
                  </button>
                )}
                {['Enviada', 'Em Negociação'].includes(proposta.status) && (
                  <>
                    <button className="btn btn-success" onClick={() => changeStatus('Fechada (Ganha)')}>
                      <CheckCircle size={16} /> Fechar como Ganha
                    </button>
                    <button className="btn btn-danger" onClick={() => setPerdaModalOpen(true)}>
                      <XCircle size={16} /> Marcar como Perdida
                    </button>
                  </>
                )}
                
                <button 
                  className="btn btn-outline" 
                  title="Gerar Contra-proposta (Duplicar)"
                  onClick={async () => {
                    try {
                      const res = await api.post(`/propostas/${proposta.id}/duplicar`);
                      toast.success('Contra-proposta gerada com sucesso!');
                      onClose();
                      if (onUpdate) onUpdate();
                    } catch (error) {
                      toast.error('Erro ao duplicar proposta');
                    }
                  }}
                >
                  <Plus size={16} /> Duplicar / Contra-proposta
                </button>
              </div>

      <div className="charts-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} /> Informações Gerais
            </h3>
            {!isEditingGerais && can('propostas.editar') && (
              <button className="btn-icon" onClick={handleEditGerais} title="Editar Informações Gerais">
                <Edit size={16} />
              </button>
            )}
          </div>
          
          {isEditingGerais ? (
            loadingOptions ? (
              <div className="loading-container" style={{ minHeight: '150px' }}><div className="loading-spinner"></div></div>
            ) : (
              <form onSubmit={handleUpdateGerais}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                    <label className="form-label">Título da Proposta *</label>
                    <input type="text" className="form-control" required value={geraisData.titulo} onChange={e => setGeraisData({...geraisData, titulo: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Lead *</label>
                    <select className="form-control" required value={geraisData.lead_id} onChange={e => setGeraisData({...geraisData, lead_id: e.target.value})}>
                      <option value="">Selecione...</option>
                      {options.leads.map(l => <option key={l.id} value={l.id}>{l.nome} {l.empresa_nome ? `(${l.empresa_nome})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Responsável *</label>
                    <select className="form-control" required value={geraisData.responsavel_id} onChange={e => setGeraisData({...geraisData, responsavel_id: e.target.value})} disabled={!can('propostas.atribuir')}>
                      <option value="">Selecione...</option>
                      {options.users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Categoria *</label>
                    <select className="form-control" required value={geraisData.categoria_id} onChange={e => setGeraisData({...geraisData, categoria_id: e.target.value})}>
                      <option value="">Selecione...</option>
                      {options.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Validade (Opcional)</label>
                    <input type="date" className="form-control" value={geraisData.data_validade} onChange={e => setGeraisData({...geraisData, data_validade: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditingGerais(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Save size={16} /> Salvar
                  </button>
                </div>
              </form>
            )
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-secondary)' }}>Título:</span><br/><strong>{proposta.titulo}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Lead:</span><br/><strong>{proposta.lead?.nome}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Empresa:</span><br/>{proposta.lead?.empresa_nome || '-'}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Responsável:</span><br/>{proposta.responsavel?.nome || '-'}</div>
              <div><span style={{ color: 'var(--text-secondary)' }}>Categoria:</span><br/>{proposta.categoria?.nome || '-'}</div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Data Criação:</span><br/>
                <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                {format(new Date(proposta.data_criacao), 'dd/MM/yyyy')}
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Validade:</span><br/>
                {proposta.data_validade ? (
                  <><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>{format(new Date(proposta.data_validade), 'dd/MM/yyyy')}</>
                ) : '-'}
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} /> Valores e Margem
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Valor Total da Proposta</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)' }}>{formatCurrency(proposta.valor_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Custo de Material
                {!editCusto && ['Em Elaboração', 'Enviada', 'Em Negociação'].includes(proposta.status) && (
                  <button className="btn-icon" style={{ padding: 2 }} onClick={() => { setNovoCusto(proposta.custo_material); setEditCusto(true); }}>
                    <Edit size={14} />
                  </button>
                )}
              </span>
              {editCusto ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="number" step="0.01" className="form-control" style={{ width: '100px', padding: '4px 8px' }} value={novoCusto} onChange={(e) => setNovoCusto(e.target.value)} />
                  <button className="btn-icon" style={{ color: 'var(--success)', padding: 4 }} onClick={handleSaveCusto}>
                    <CheckCircle size={16} />
                  </button>
                  <button className="btn-icon" style={{ color: 'var(--danger)', padding: 4 }} onClick={() => setEditCusto(false)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <span style={{ fontWeight: '500' }}>{formatCurrency(proposta.custo_material)}</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Margem Bruta (R$)</span>
              <span style={{ fontWeight: '500', color: margemBruta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(margemBruta)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Margem (%)</span>
              <span style={{ fontWeight: '600', color: margemPercentual >= 30 ? 'var(--success)' : (margemPercentual >= 15 ? 'var(--warning)' : 'var(--danger)') }}>
                {margemPercentual.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {proposta.status === 'Perdida' && proposta.motivo_perda && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', backgroundColor: '#fff5f5' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--danger)', marginBottom: '8px' }}>Motivo da Perda</h3>
          <p><strong>{proposta.motivo_perda.nome}</strong>: {proposta.observacao_perda || 'Nenhuma observação informada.'}</p>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Itens da Proposta</h3>
          {['Em Elaboração', 'Enviada', 'Em Negociação'].includes(proposta.status) && (
            <button className="btn btn-outline" onClick={() => setItemModalOpen(true)}>
              <Plus size={16} /> Adicionar Item
            </button>
          )}
        </div>
        
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th style={{ textAlign: 'center' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Valor Unitário</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                {['Em Elaboração', 'Enviada', 'Em Negociação'].includes(proposta.status) && <th style={{ width: '60px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {proposta.itens && proposta.itens.length > 0 ? (
                proposta.itens.map(item => (
                  <tr key={item.id}>
                    <td>{item.descricao}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.valor_unitario)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.valor_total)}</td>
                    {['Em Elaboração', 'Enviada', 'Em Negociação'].includes(proposta.status) && (
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 size={18} color="var(--danger)" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">Nenhum item adicionado à proposta.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Item */}
      {itemModalOpen && (
        <div className="modal-overlay" onClick={() => setItemModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Adicionar Item</h3>
              <button className="modal-close" onClick={() => setItemModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Item Padrão (Opcional)</label>
                  <select 
                    className="form-control"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const item = itensPadrao.find(i => i.id === parseInt(selectedId));
                      if (item) {
                        setItemData({ ...itemData, descricao: item.descricao, valor_unitario: item.valor_unitario });
                      }
                    }}
                  >
                    <option value="">Selecione um item padrão para preencher...</option>
                    {itensPadrao.map(i => <option key={i.id} value={i.id}>{i.descricao} - {formatCurrency(i.valor_unitario)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input type="text" className="form-control" required value={itemData.descricao} onChange={(e) => setItemData({...itemData, descricao: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Quantidade *</label>
                    <input type="number" step="0.01" className="form-control" required min="0.01" value={itemData.quantidade} onChange={(e) => setItemData({...itemData, quantidade: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor Unitário (R$) *</label>
                    <input type="number" step="0.01" className="form-control" required min="0" value={itemData.valor_unitario} onChange={(e) => setItemData({...itemData, valor_unitario: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setItemModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Perda */}
      {perdaModalOpen && (
        <div className="modal-overlay" onClick={() => setPerdaModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Marcar Proposta como Perdida</h3>
              <button className="modal-close" onClick={() => setPerdaModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); changeStatus('Perdida', perdaData); }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Motivo da Perda *</label>
                  <select className="form-control" required value={perdaData.motivo_perda_id} onChange={(e) => setPerdaData({...perdaData, motivo_perda_id: e.target.value})}>
                    <option value="">Selecione um motivo...</option>
                    {motivosPerda.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações Adicionais</label>
                  <textarea className="form-control" rows="3" value={perdaData.observacao_perda} onChange={(e) => setPerdaData({...perdaData, observacao_perda: e.target.value})} placeholder="Detalhe o motivo da perda se necessário..."></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPerdaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Confirmar Perda</button>
              </div>
            </form>
          </div>
        </div>
      )}
                  </>
                );
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PropostaDetalhe;
