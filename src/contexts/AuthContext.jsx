import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissoes, setPermissoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const userRes = await api.get('/usuarios/me');
      setUser(userRes.data);
      const permsRes = await api.get('/usuarios/me/permissoes');
      setPermissoes(permsRes.data);
    } catch (error) {
      setUser(null);
      setPermissoes([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData, senha) => {
    try {
      const response = await api.post('/usuarios/login', { login: loginData, senha });
      const { user: userData } = response.data;
      setUser(userData);
      const permsRes = await api.get('/usuarios/me/permissoes');
      setPermissoes(permsRes.data);
      localStorage.removeItem('cn_token');
      localStorage.removeItem('cn_user');
      localStorage.removeItem('cn_perms');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao realizar login');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/usuarios/logout');
    } catch (e) {}
    localStorage.removeItem('cn_token');
    localStorage.removeItem('cn_user');
    localStorage.removeItem('cn_perms');
    setUser(null);
    setPermissoes([]);
  };

  const can = (slug) => {
    if (!user) return false;
    if (['superadmin', 'admin', 'Diretor', 'manutenção', 'Manutenção'].includes(user.cargo)) return true;
    return permissoes.includes(slug);
  };

  return (
    <AuthContext.Provider value={{ user, permissoes, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
