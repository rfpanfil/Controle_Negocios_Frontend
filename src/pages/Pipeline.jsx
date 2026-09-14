import { useState, useEffect } from 'react';
import { MessageCircle, PhoneCall, Calendar, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import PropostaDetalhe from './PropostaDetalhe';

const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const colunasConfig = [
  { id: 'Em Elaboração', title: 'Em Elaboração', colorClass: 'col-gray' },
  { id: 'Enviada', title: 'Enviada', colorClass: 'col-blue' },
  { id: 'Em Negociação', title: 'Em Negociação', colorClass: 'col-yellow' },
  { id: 'Fechada (Ganha)', title: 'Ganha', colorClass: 'col-green' },
  { id: 'Perdida', title: 'Perdida', colorClass: 'col-red' }
];

const Pipeline = () => {
  const [propostas, setPropostas] = useState([]);
  const [motivosPerda, setMotivosPerda] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [categoriaId, setCategoriaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const navigate = useNavigate();
  const [detalheModalOpen, setDetalheModalOpen] = useState(false);
  const [selectedPropostaId, setSelectedPropostaId] = useState(null);

  // Modal Perda
  const [perdaModalOpen, setPerdaModalOpen] = useState(false);
  const [perdaData, setPerdaData] = useState({ id: null, motivo_perda_id: '', observacao_perda: '' });

  useEffect(() => {
    fetchData();
  }, [categoriaId, dataInicio, dataFim]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoriaId) params.categoria_id = categoriaId;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;

      const [propRes, motivosRes, catRes] = await Promise.all([
        api.get('/propostas/', { params }),
        api.get('/configuracoes/motivos-perda'),
        api.get('/configuracoes/categorias/')
      ]);
      setPropostas(propRes.data.filter(p => p.status !== 'Cancelada'));
      setMotivosPerda(motivosRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      toast.error('Erro ao carregar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('proposta_id', id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, novoStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('proposta_id');
    const proposta = propostas.find(p => p.id === parseInt(id));

    if (!proposta || proposta.status === novoStatus) return;

    if (novoStatus === 'Perdida') {
      setPerdaData({ id: proposta.id, motivo_perda_id: '', observacao_perda: '' });
      setPerdaModalOpen(true);
      return;
    }

    // Optimistic update
    const propostasAnteriores = [...propostas];
    setPropostas(propostas.map(p => p.id === parseInt(id) ? { ...p, status: novoStatus } : p));

    try {
      await api.patch(`/propostas/${id}/status`, { status: novoStatus });
      toast.success('Status atualizado');
    } catch (error) {
      setPropostas(propostasAnteriores); // rollback
      toast.error(error.response?.data?.detail || 'Erro ao atualizar status');
    }
  };

  const confirmarPerda = async (e) => {
    e.preventDefault();
    const { id, motivo_perda_id, observacao_perda } = perdaData;
    
    // Optimistic update
    const propostasAnteriores = [...propostas];
    setPropostas(propostas.map(p => p.id === parseInt(id) ? { ...p, status: 'Perdida' } : p));
    setPerdaModalOpen(false);

    try {
      await api.patch(`/propostas/${id}/status`, { 
        status: 'Perdida', 
        motivo_perda_id, 
        observacao_perda 
      });
      toast.success('Status atualizado para Perdida');
    } catch (error) {
      setPropostas(propostasAnteriores); // rollback
      toast.error(error.response?.data?.detail || 'Erro ao atualizar status');
    }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Pipeline de Vendas</h2>
      </div>

      <div className="card">
        <div className="filters-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '16px' }}>
          <select className="form-control" value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
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
        </div>
      </div>

      <div className="kanban-board">
        {colunasConfig.map(col => {
          const cards = propostas.filter(p => p.status === col.id);
          const totalValor = cards.reduce((acc, p) => acc + Number(p.valor_total || 0), 0);

          return (
            <div 
              key={col.id} 
              className="kanban-column"
            >
              <div className={`kanban-header ${col.colorClass}`}>
                <span>{col.title} ({cards.length})</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{formatCurrency(totalValor)}</span>
              </div>
              <div className="kanban-cards">
                {cards.map(card => {
                  const dias = Math.floor((new Date() - new Date(card.data_criacao)) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={card.id} 
                      className="kanban-card"
                      onClick={() => { setSelectedPropostaId(card.id); setDetalheModalOpen(true); }}
                    >
                      <div className="kanban-card-title">{card.titulo}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {card.lead?.nome}
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                        {formatCurrency(card.valor_total)}
                      </div>
                      <div className="kanban-card-info">
                        <span>#{card.numero_proposta}</span>
                        <span>{dias} dias</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Perda */}
      {perdaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)' }}>Motivo da Perda</h3>
              <button className="modal-close" onClick={() => setPerdaModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={confirmarPerda}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Motivo *</label>
                  <select className="form-control" required value={perdaData.motivo_perda_id} onChange={(e) => setPerdaData({...perdaData, motivo_perda_id: e.target.value})}>
                    <option value="">Selecione um motivo...</option>
                    {motivosPerda.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-control" rows="3" value={perdaData.observacao_perda} onChange={(e) => setPerdaData({...perdaData, observacao_perda: e.target.value})}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPerdaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detalheModalOpen && (
        <PropostaDetalhe 
          propostaId={selectedPropostaId} 
          onClose={() => setDetalheModalOpen(false)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

export default Pipeline;
