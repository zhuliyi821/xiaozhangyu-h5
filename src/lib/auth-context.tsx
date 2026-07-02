"use client";

/**
 * 🔐 用户认证 Context
 * 管理登录状态、token、用户信息
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, type LoginResult } from "@/lib/api";

interface UserInfo {
  uid: number;
  nickname: string;
  avatar: string;
  token: string;
  balance: {
    credit1: number;
    credit2: number;
    credit3: number;
    credit4: number;
    sim_coin: number;
  };
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  register: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

const STORAGE_KEY = "xiaozhangyu_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserInfo;
        if (parsed.token && parsed.uid) {
          setUser(parsed);
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  const saveUser = useCallback((u: UserInfo) => {
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  const login = useCallback(async (mobile: string, password: string) => {
    const result = await apiLogin(mobile, password);
    saveUser({
      uid: result.uid,
      nickname: result.nickname,
      avatar: result.avatar,
      token: result.token,
      balance: result.balance,
    });
  }, [saveUser]);

  const register = useCallback(async (mobile: string, password: string) => {
    await apiRegister(mobile, password);
    // 注册成功后自动登录
    await login(mobile, password);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`https://surplus.hi.cn/api/member/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: user.nickname, token: user.token }),
      });
      const json = await res.json();
      if (json.code === 0 && json.data?.balance) {
        saveUser({ ...user, balance: json.data.balance });
      }
    } catch {}
  }, [user, saveUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
