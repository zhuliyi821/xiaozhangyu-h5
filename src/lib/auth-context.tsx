"use client";

/**
 * 🔐 用户认证 Context
 * 管理登录状态、token、用户信息
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { login as apiLogin, register as apiRegister, loginByUsername as apiLoginByUsername, type LoginResult } from "@/lib/api";
import { apiFetch, API_BASE, setOnUnauthorized } from "@/config/api";
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
    credit5: number;  // ✨ 水晶石(可用)
    credit6: number;  // ❄️ 冻结豆
    granted_game_coins?: number;  // 📊 已赠游戏豆额度
  };
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  login: (mobile: string, password: string) => Promise<void>;
  loginByUsername: (username: string, password: string) => Promise<void>;
  register: (mobile: string, password: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  loginWithToken: (token: string, data: any) => void;
}

const AuthContext = createContext<AuthContextType>(null!);

const STORAGE_KEY = "xiaozhangyu_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：从 localStorage 恢复登录状态
  useEffect(() => {
    try {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }
      const saved = window.localStorage?.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as UserInfo;
        if (parsed && parsed.token && parsed.uid) {
          setUser(parsed);
        }
      }
    } catch (e) {
      // 微信浏览器可能 localStorage 访问异常或数据损坏
      console.warn("Failed to restore auth state:", e);
      try { window.localStorage?.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUser = useCallback((u: UserInfo) => {
    try {
      setUser(u);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      }
    } catch (e) {
      console.warn("Failed to save user:", e);
    }
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
    const result = await apiRegister(mobile, password);
    await login(mobile, password);
    // 初始化新手成长任务（步骤①自动完成+发放10000）
    try {
      await fetch("/api/newcomer/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", uid: result.uid }),
      });
    } catch {}
  }, [login]);

  const loginByUsername = useCallback(async (username: string, password: string) => {
    const result = await apiLoginByUsername(username, password);
    saveUser({
      uid: result.uid,
      nickname: result.nickname,
      avatar: result.avatar,
      token: result.token,
      balance: result.balance,
    });
  }, [saveUser]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 注册 401 全局回调：API 返回 401 时自动退出
  useEffect(() => {
    setOnUnauthorized(logout);
    return () => { setOnUnauthorized(null); };
  }, [logout]);

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

  /** 微信 OAuth 登录：直接用后端返回的 token + 用户信息 */
  const loginWithToken = useCallback((token: string, data: any) => {
    // 防御：清理 + 兜底，避免 null/undefined 字段破坏下游
    const balance = data?.balance && typeof data.balance === "object" ? {
      credit1: Number(data.balance.credit1) || 0,
      credit2: Number(data.balance.credit2) || 0,
      credit3: Number(data.balance.credit3) || 0,
      credit4: Number(data.balance.credit4) || 0,
      credit5: Number(data.balance.credit5) || 0,
      credit6: Number(data.balance.credit6) || 0,
      granted_game_coins: Number(data.balance.granted_game_coins) || 0,
    } : { credit1: 0, credit2: 0, credit3: 0, credit4: 0, credit5: 0, credit6: 0, granted_game_coins: 0 };

    saveUser({
      uid: Number(data?.uid) || 0,
      nickname: data?.nickname || "微信用户",
      avatar: data?.avatar || "",
      token: String(token || ""),
      balance,
    });
  }, [saveUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginByUsername, register, logout, refreshBalance, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
