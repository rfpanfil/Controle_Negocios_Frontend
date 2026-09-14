import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ReactECharts from 'echarts-for-react';
import { 
  FileText, 
  DollarSign, 
  Percent, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  
  const [ano, setAno] = useState(new Date().getFullYear());
  const [anosDisponiveis, setAnosDisponiveis] = useState([new Date().getFullYear()]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    const fetchAnos = async () => {
      try {
        const res = await api.get('/dashboard/anos');
        if (res.data && res.data.length > 0) {
          setAnosDisponiveis(res.data);
          if (!res.data.includes(ano)) setAno(res.data[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar anos', error);
      }
    };
    fetchAnos();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [ano, dataInicio, dataFim]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (ano) params.ano = ano;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      
      const response = await api.get('/dashboard/comercial', { params });
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  const cards = data?.cards || {};
  const funil = data?.funil || [];
  const evolucao = data?.evolucao_mensal || [];
  const origens = data?.origens_lead || [];
  const motivos = data?.motivos_perda || [];
  const ranking = data?.ranking_vendedores || [];
  const alertas = data?.alertas_followup || [];

  // --- Gráficos ECharts ---
  const funilOptions = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { 
      type: 'category', 
      data: funil.map(item => item.status),
      inverse: true
    },
    series: [
      {
        name: 'Quantidade',
        type: 'bar',
        data: funil.map(item => item.quantidade),
        itemStyle: { 
          color: (params) => {
            const colors = {
              'Em Elaboração': '#6c757d',
              'Enviada': '#5bc0de',
              'Em Negociação': '#f0ad4e',
              'Fechada (Ganha)': '#1EB341',
              'Perdida': '#dc3545',
              'Cancelada': '#363435',
            };
            return colors[funil[params.dataIndex]?.status] || '#B82328';
          }
        },
        label: { show: true, position: 'right', formatter: '{c}' }
      }
    ]
  };

  const evolucaoOptions = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Valor Proposto', 'Valor Fechado'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      boundaryGap: false, 
      data: evolucao.map(item => item.mes)
    },
    yAxis: { 
      type: 'value',
      axisLabel: {
        formatter: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v
      }
    },
    series: [
      {
        name: 'Valor Proposto',
        type: 'line',
        data: evolucao.map(item => item.valor_proposto),
        itemStyle: { color: '#5bc0de' },
        areaStyle: { opacity: 0.1 }
      },
      {
        name: 'Valor Fechado',
        type: 'line',
        data: evolucao.map(item => item.valor_fechado),
        itemStyle: { color: '#1EB341' },
        areaStyle: { opacity: 0.1 }
      }
    ]
  };

  const origensOptions = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { top: 'bottom' },
    series: [
      {
        name: 'Origem',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: origens.map(item => ({ value: item.value, name: item.name }))
      }
    ]
  };

  const perdasOptions = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { top: 'bottom' },
    color: ['#dc3545', '#f0ad4e', '#6c757d', '#5bc0de', '#363435'],
    series: [
      {
        name: 'Motivo de Perda',
        type: 'pie',
        radius: '60%',
        data: motivos.map(item => ({ value: item.value, name: item.name })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }
    ]
  };

  return (
    <div>
      {/* Filtros */}
      <div className="page-header">
        <div>
          <h2>Visão Geral do Comercial</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto' }}
            value={ano}
            onChange={(e) => setAno(e.target.value)}
          >
            {[...new Set([...anosDisponiveis, new Date().getFullYear()])].sort().reverse().map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: 'auto' }}
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <input 
            type="date" 
            className="form-control" 
            style={{ width: 'auto' }}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><FileText size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total de Propostas</div>
            <div className="kpi-value">{cards.total_propostas || 0}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Valor Fechado</div>
            <div className="kpi-value">{formatCurrency(cards.valor_fechado)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon yellow"><Percent size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Taxa de Conversão</div>
            <div className="kpi-value">{(cards.taxa_conversao || 0).toFixed(1)}%</div>
          </div>
        </div>
        <div 
          className="kpi-card" 
          style={{ cursor: 'pointer', ...(cards.followups_atrasados > 0 ? { border: '2px solid var(--danger)' } : {}) }}
          onClick={() => navigate('/leads?filtro=atrasados')}
        >
          <div className="kpi-icon red"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Follow-ups Atrasados</div>
            <div className="kpi-value" style={cards.followups_atrasados > 0 ? { color: 'var(--danger)' } : {}}>
              {cards.followups_atrasados || 0}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row 2 */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon green"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Propostas Ganhas</div>
            <div className="kpi-value">{cards.propostas_ganhas || 0}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><BarChart2 size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Ticket Médio</div>
            <div className="kpi-value">{formatCurrency(cards.ticket_medio)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><TrendingDown size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Propostas Perdidas</div>
            <div className="kpi-value">{cards.propostas_perdidas || 0}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon yellow"><PieChart size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Margem Total</div>
            <div className="kpi-value">{formatCurrency(cards.margem_total)}</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Funil de Vendas</h3>
          {funil.length > 0 ? (
            <ReactECharts option={funilOptions} style={{ height: '300px' }} />
          ) : (
            <p className="empty-state">Sem dados de propostas no período.</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Evolução Mensal</h3>
          <ReactECharts option={evolucaoOptions} style={{ height: '300px' }} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Origens dos Leads</h3>
          {origens.length > 0 ? (
            <ReactECharts option={origensOptions} style={{ height: '300px' }} />
          ) : (
            <p className="empty-state">Sem dados de origens.</p>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Motivos de Perda</h3>
          {motivos.length > 0 ? (
            <ReactECharts option={perdasOptions} style={{ height: '300px' }} />
          ) : (
            <p className="empty-state">Nenhuma proposta perdida no período.</p>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="charts-grid">
        <div className="card" style={{ overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Ranking de Vendedores</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vendedor</th>
                  <th>Ganhos</th>
                  <th>Valor Fechado</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length > 0 ? (
                  ranking.map((v, i) => (
                    <tr key={i}>
                      <td><strong>{i + 1}º</strong></td>
                      <td>{v.nome}</td>
                      <td>{v.propostas_ganhas}</td>
                      <td style={{ fontWeight: '600', color: 'var(--success)' }}>{formatCurrency(v.valor_fechado)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">Nenhum dado disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card" style={{ overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', color: 'var(--text-secondary)' }}>Alertas de Follow-Up</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Proposta</th>
                  <th>Dias Atrasado</th>
                  <th>Próxima Ação</th>
                </tr>
              </thead>
              <tbody>
                {alertas.length > 0 ? (
                  alertas.map((a, i) => (
                    <tr 
                      key={i} 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => navigate(`/leads?filtro=atrasados&leadId=${a.lead_id}`)}
                    >
                      <td>{a.lead_nome}</td>
                      <td>{a.proposta_titulo}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '600' }}>
                        {a.dias_sem_contato} dia{a.dias_sem_contato !== 1 ? 's' : ''}
                      </td>
                      <td>{a.proxima_acao}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">Sem follow-ups atrasados! 🎉</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
