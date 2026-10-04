import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'cqm.auth';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  }, [auth]);

  const login = useCallback((userData) => {
    setAuth({ user: userData });
  }, []);

  const logout = useCallback(() => setAuth(null), []);

  return (
    <AuthContext.Provider value={{
      auth, user: auth?.user || null, token: auth?.token || null,
      login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
