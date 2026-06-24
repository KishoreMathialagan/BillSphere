import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
  sub: string;
  tenant_id: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  tenantState: string | null;
  login: (access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      try {
        return jwtDecode<User>(token);
      } catch (err) {
        return null;
      }
    }
    return null;
  });
  const [tenantState, setTenantState] = useState<string | null>(null);

  const fetchTenantConfig = async (token: string) => {
    try {
      const res = await api.get('/setup/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenantState(res.data.state || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser(decoded);
        fetchTenantConfig(token);
      } catch (err) {
        logout();
      }
    }
  }, []);

  const login = (access: string, refresh: string) => {
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);
    const decoded = jwtDecode<User>(access);
    setUser(decoded);
    fetchTenantConfig(access);
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    setUser(null);
    setTenantState(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenantState, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
