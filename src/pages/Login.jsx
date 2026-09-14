import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login || !senha) return;
    
    setLoading(true);
    const success = await doLogin(login, senha);
    if (success) {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Controle de Negócios</h1>
        <p className="login-subtitle">CSB Engenharia</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuário</label>
            <input 
              type="text" 
              className="form-control" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Digite seu login"
              autoComplete="username"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: 1, fontSize: '0.8rem', padding: '4px' }}
              onClick={() => { setLogin('admin'); setSenha('admin123'); }}
            >
              Demo Admin
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: 1, fontSize: '0.8rem', padding: '4px' }}
              onClick={() => { setLogin('vendedor1'); setSenha('csb2026'); }}
            >
              Demo Vendedor
            </button>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
