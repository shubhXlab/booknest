import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { setToken, getToken, removeToken, setUser, getUser, removeUser } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken() && !user) {
      api
        .get('/auth/me')
        .then((res) => {
          setUserState(res.data);
          setUser(res.data);
        })
        .catch(() => {
          removeToken();
          removeUser();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (data) => {
    setToken(data.token);
    setUserState(data);
    setUser(data);
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
