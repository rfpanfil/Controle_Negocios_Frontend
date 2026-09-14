import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Kanban, 
  UserCog, 
  Settings, 
  LogOut,
  Menu,
  Shield,
  ShieldAlert
} from 'lucide-react';

const Layout = () => {
  const { user, logout, can } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/leads')) return 'Leads';
    if (path.startsWith('/propostas')) return 'Propostas';
    if (path.startsWith('/pipeline')) return 'Pipeline';
    if (path.startsWith('/usuarios')) return 'Usuários';
    if (path.startsWith('/permissoes')) return 'Permissões';
    if (path.startsWith('/configuracoes')) return 'Configurações';
    return '';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0].toUpperCase();
  };

  const toggleSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (Mobile) */}
      {mobileOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Controle de Negócios</div>
          <div className="sidebar-subtitle">CSB Engenharia</div>
        </div>

        <nav className="sidebar-nav">
          {can('dash.ver') && (
            <NavLink to="/" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={20} /> Dashboard
            </NavLink>
          )}
          {can('leads.ver') && (
            <NavLink to="/leads" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <Users size={20} /> Leads
            </NavLink>
          )}
          {can('propostas.ver') && (
            <NavLink to="/propostas" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <FileText size={20} /> Propostas
            </NavLink>
          )}
          {can('propostas.ver') && (
            <NavLink to="/pipeline" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <Kanban size={20} /> Pipeline
            </NavLink>
          )}
          {can('usuarios.gerenciar') && (
            <NavLink to="/usuarios" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <UserCog size={20} /> Usuários
            </NavLink>
          )}
          {can('usuarios.gerenciar') && (
            <NavLink to="/permissoes" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <Shield size={20} /> Permissões
            </NavLink>
          )}
          {can('config.gerenciar') && (
            <NavLink to="/configuracoes" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <Settings size={20} /> Configurações
            </NavLink>
          )}
          {can('auditoria.ver') && (
            <NavLink to="/auditoria" className="sidebar-link" onClick={() => setMobileOpen(false)}>
              <ShieldAlert size={20} /> Auditoria
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.nome}</span>
            <span className="user-role">{user?.cargo}</span>
          </div>
          <button onClick={logout} className="btn-logout">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-icon" style={{ display: 'none' }} onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h1 className="header-title">{getPageTitle()}</h1>
          </div>
          <div className="header-actions">
            <div className="avatar-circle">
              {getInitials(user?.nome)}
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
      
      <style>{`
        @media (max-width: 768px) {
          .top-header .btn-icon {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
