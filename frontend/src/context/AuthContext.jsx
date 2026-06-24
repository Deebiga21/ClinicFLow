import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../config';

const AuthContext = createContext(null);
const STORAGE_KEY = 'cqm.auth';

// Wraps fetch + JSON parsing so that "backend isn't running" and
// "backend returned bad/empty JSON" produce one clear message instead of
// a cryptic "Unexpected end of JSON input" crash.
async function apiFetch(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    throw new Error("Can't reach the server. Make sure the backend is running (npm start in /backend).");
  }

  let data = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch (parseErr) {
    throw new Error('The server sent back an unreadable response. Check the backend terminal for errors.');
  }

  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  }, [auth]);

  const login = useCallback(async (username, password) => {
    const data = await apiFetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    setAuth(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiFetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setAuth(data);
    return data;
  }, []);

  const logout = useCallback(() => setAuth(null), []);

  const linkToken = useCallback(async (tokenNumber) => {
    if (!auth) return;
    const data = await apiFetch(`${API_BASE}/auth/link-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ tokenNumber })
    });
    setAuth({ ...auth, user: { ...auth.user, linkedTokenNumber: data.linkedTokenNumber } });
  }, [auth]);

  // Update profile fields (display name, contact info, bio, preferences)
  const updateProfile = useCallback(async (updates) => {
    if (!auth) return;
    const data = await apiFetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(updates)
    });
    setAuth({ ...auth, user: data });
    return data;
  }, [auth]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!auth) return;
    return apiFetch(`${API_BASE}/auth/me/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }, [auth]);

  return (
    <AuthContext.Provider value={{
      auth, user: auth?.user || null, token: auth?.token || null,
      login, register, logout, linkToken, updateProfile, changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Helper for authenticated fetch
export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
