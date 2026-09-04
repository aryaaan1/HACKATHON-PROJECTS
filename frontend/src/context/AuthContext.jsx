import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { login as loginRequest } from '../api/auth';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '../config';

const AuthContext = createContext(null);

function readStoredAuth() {
  const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const userJson = sessionStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!token || !userJson) return null;
  try {
    return { token, ...JSON.parse(userJson) };
  } catch {
    return null;
  }
}

function clearStoredAuth() {
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    function handleUnauthorized() {
      clearStoredAuth();
      setAuth(null);
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password);
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);
    sessionStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify({ username: data.username, role: data.role }));
    setAuth({ token: data.access_token, username: data.username, role: data.role });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
  }, []);

  const value = {
    isAuthenticated: !!auth,
    isAdmin: auth?.role === 'admin',
    username: auth?.username ?? null,
    role: auth?.role ?? null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
