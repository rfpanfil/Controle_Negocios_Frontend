import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetalhe from './pages/LeadDetalhe';
import Propostas from './pages/Propostas';
import PropostaDetalhe from './pages/PropostaDetalhe';
import Pipeline from './pages/Pipeline';
import Usuarios from './pages/Usuarios';
import Permissoes from './pages/Permissoes';
import Configuracoes from './pages/Configuracoes';
import Auditoria from './pages/Auditoria';

const HomeRedirect = () => {
  const { can } = useAuth();
  if (can('dash.ver')) return <Dashboard />;
  if (can('leads.ver')) return <Navigate to="/leads" replace />;
  return <div style={{ padding: 24, textAlign: 'center', color: '#6c757d' }}>Bem-vindo ao Controle de Negócios</div>;
};

const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, can } = useAuth();

  if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        } />
        
        <Route path="leads" element={
          <ProtectedRoute permission="leads.ver">
            <Leads />
          </ProtectedRoute>
        } />
        <Route path="leads/:id" element={
          <ProtectedRoute permission="leads.ver">
            <LeadDetalhe />
          </ProtectedRoute>
        } />

        <Route path="propostas" element={
          <ProtectedRoute permission="propostas.ver">
            <Propostas />
          </ProtectedRoute>
        } />
        <Route path="propostas/:id" element={
          <ProtectedRoute permission="propostas.ver">
            <PropostaDetalhe />
          </ProtectedRoute>
        } />

        <Route path="pipeline" element={
          <ProtectedRoute permission="propostas.ver">
            <Pipeline />
          </ProtectedRoute>
        } />

        <Route path="usuarios" element={
          <ProtectedRoute permission="usuarios.gerenciar">
            <Usuarios />
          </ProtectedRoute>
        } />

        <Route path="permissoes" element={
          <ProtectedRoute permission="usuarios.gerenciar">
            <Permissoes />
          </ProtectedRoute>
        } />

        <Route path="configuracoes" element={
          <ProtectedRoute permission="config.gerenciar">
            <Configuracoes />
          </ProtectedRoute>
        } />

        <Route path="auditoria" element={
          <ProtectedRoute permission="auditoria.ver">
            <Auditoria />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
