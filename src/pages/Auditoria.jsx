import { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Search, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

function RenderJSON({ str }) {
  if (!str || str === 'null') return <span style={{ color: 'var(--text-secondary)' }}>-</span>;
  try {
    const obj = JSON.parse(str);
    return (
      <div style={{ fontSize: '0.78rem', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '4px' }}>
        {Object.entries(obj)
          .filter(([key]) => key !== 'senha_hash')
          .map(([key, val]) => (
            <div key={key} style={{ wordBreak: 'break-all' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>{key}:</strong> {String(val)}
            </div>
          ))}
      </div>
    );
  } catch (e) {
    return <span style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{str}</span>;
  }
}

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [filtrosOpcoes, setFiltrosOpcoes] = useState({ usuarios: [], tabelas: [], acoes: [] });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [tabela, setTabela] = useState('');
  const [acao, setAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchFiltros();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [usuarioId, tabela, acao, dataInicio, dataFim, limit, page]);

  const fetchFiltros = async () => {
    try {
      const res = await api.get('/auditoria/filtros');
      setFiltrosOpcoes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: limit === 'Todos' ? 10000 : limit
      };
      if (search) params.search = search;
      if (usuarioId) params.usuario_id = usuarioId;
      if (tabela) params.tabela = tabela;
      if (acao) params.acao = acao;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;

      const res = await api.get('/auditoria/', { params });
      setLogs(res.data.items || []);
      if (res.data.total !== undefined) {
        setPagination({
          total: res.data.total,
          page: res.data.page,
          pages: Math.ceil(res.data.total / res.data.limit)
        });
      } else {
        // Fallback if no pagination data
        setPagination({ total: (res.data.items || []).length, page: 1, pages: 1 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchLogs();
    }
  };

  const getAcaoBadge = (acaoStr) => {
    switch (acaoStr) {
      case 'CRIAR': return <span className="badge badge-green">CRIAR</span>;
      case 'EDITAR': return <span className="badge badge-yellow">EDITAR</span>;
      case 'EXCLUIR': return <span className="badge badge-red">EXCLUIR</span>;
      default: return <span className="badge badge-gray">{acaoStr}</span>;
    }
  };

  const startRecord = (pagination.page - 1) * limit + 1;
  const endRecord = Math.min(pagination.page * limit, pagination.total);

  return (
    <div>
      <div className="page-header">
        <h2><ShieldAlert size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }}/> Auditoria (Log de Atividades)</h2>
      </div>

      <div className="card">
        <div className="filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Busca..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          
          <select className="form-control" value={usuarioId} onChange={(e) => {setUsuarioId(e.target.value); setPage(1);}}>
            <option value="">Usuário (Todos)</option>
            {filtrosOpcoes.usuarios?.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          
          <select className="form-control" value={tabela} onChange={(e) => {setTabela(e.target.value); setPage(1);}}>
            <option value="">Tabela (Todas)</option>
            {filtrosOpcoes.tabelas?.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="form-control" value={acao} onChange={(e) => {setAcao(e.target.value); setPage(1);}}>
            <option value="">Ação (Todas)</option>
            {filtrosOpcoes.acoes?.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <input 
            type="date" 
            className="form-control" 
            title="Data Inicial"
            value={dataInicio}
            onChange={(e) => {setDataInicio(e.target.value); setPage(1);}}
          />
          <input 
            type="date" 
            className="form-control" 
            title="Data Final"
            value={dataFim}
            onChange={(e) => {setDataFim(e.target.value); setPage(1);}}
          />
          <select className="form-control" value={limit} onChange={(e) => {setLimit(e.target.value); setPage(1);}}>
            <option value="50">50 registros</option>
            <option value="100">100 registros</option>
            <option value="500">500 registros</option>
            <option value="Todos">Todos</option>
          </select>
        </div>

        <div className="table-responsive" style={{ marginTop: '20px' }}>
          {loading ? (
            <div className="loading-container"><div className="loading-spinner"></div></div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Usuário</th>
                    <th>Ação</th>
                    <th>Tabela</th>
                    <th>ID</th>
                    <th>Dados Anteriores</th>
                    <th>Dados Novos</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(log.data_hora), 'dd/MM/yyyy HH:mm:ss')}</td>
                      <td>{log.usuario_nome || '-'}</td>
                      <td>{getAcaoBadge(log.acao)}</td>
                      <td>{log.tabela}</td>
                      <td>{log.registro_id}</td>
                      <td style={{ maxWidth: '250px' }}><RenderJSON str={log.dados_antigos} /></td>
                      <td style={{ maxWidth: '250px' }}><RenderJSON str={log.dados_novos} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="empty-state">Nenhum registro encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {pagination.total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 8px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Mostrando {startRecord} a {endRecord} de {pagination.total} registros
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      style={{ padding: '6px 12px' }}
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      disabled={page >= pagination.pages}
                      onClick={() => setPage(page + 1)}
                      style={{ padding: '6px 12px' }}
                    >
                      Próximo <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
