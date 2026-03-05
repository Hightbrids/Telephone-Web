import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const API_BASE = 'http://nindam.sytes.net:3010/api';

export type Role = 'admin' | 'user';
export type User = { id: number; username: string; email: string; role: Role };

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  register: (p: { username: string; email: string; password: string }) => Promise<void>;
  login: (p: { id: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType>({} as any);
const TOKEN_KEY = 'auth_token';

/** ----- Storage helper: ใช้ SecureStore บน native และใช้ localStorage บน web ----- */
const storage = {
  getItem: async (k: string) => {
    if (Platform.OS === 'web') return Promise.resolve(window.localStorage.getItem(k));
    return SecureStore.getItemAsync(k);
  },
  setItem: async (k: string, v: string) => {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(k, v);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(k, v);
  },
  deleteItem: async (k: string) => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(k);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(k);
  },
};

async function saveToken(t: string | null) {
  if (t) await storage.setItem(TOKEN_KEY, t);
  else await storage.deleteItem(TOKEN_KEY);
}
async function loadToken() {
  try { return await storage.getItem(TOKEN_KEY); } catch { return null; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (t) {
        setToken(t);
        try {
          const res = await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${t}` } });
          if (res.ok) setUser(await res.json());
        } catch { /* ignore */ }
      }
      setLoading(false);
    })();
  }, []);

  const register: AuthContextType['register'] = async ({ username, email, password }) => {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'สมัครสมาชิกไม่สำเร็จ');
  };

  const login: AuthContextType['login'] = async ({ id, password }) => {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'เข้าสู่ระบบล้มเหลว');
    setUser(data.user || null);
    setToken(data.token);
    await saveToken(data.token);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await saveToken(null); // ← ตอนนี้บน web จะวิ่ง localStorage.removeItem แทน
  };

  const authFetch: AuthContextType['authFetch'] = (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const value = useMemo(
    () => ({ user, token, loading, register, login, logout, authFetch }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
