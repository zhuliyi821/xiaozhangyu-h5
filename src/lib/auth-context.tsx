"use client";

/**
 * 🔐 用户认证 Context
 * 管理登录状态、token、用户信息
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, type LoginResult } from "@/lib/api";
import { apiFetch, API_BASE } from "@/config/api";
import { ApiError } from "@/config/api";

interface UserInfo {
  uid: number;
  nickname: string;
  avatar: string;
  token: string;
  balance: {
    credit1: number;  // 🎮 游戏豆
    credit2: number;  // 🏪 闲豆
    credit3: number;  // 🔮 水晶球
    credit4: number;  // 💰 余额
    credit5: number;  // ⛏️ 水晶石
    credit6: number;  // ❄️ 冻结豆
    granted_game_coins: number;
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
    } catch (e) {
      console.warn("Failed to restore auth state:", e);
    }
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
    await login(mobile, password);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      // 使用钱包余额接口替代登录接口
      const json = await apiFetch<any>(`/wallet_api.php`, {
        params: { action: "balance", uid: String(user.uid) },
      });
      if (json?.data) {
        saveUser({ ...user, balance: json.data });
      }
    } catch (err) {
      // 余额刷新失败不阻断用户体验，仅输出警告
      console.warn("Balance refresh failed:", err instanceof ApiError ? err.message : err);
    }
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
