"use client";

import { useState, useEffect } from "react";
import { API_BASE, apiFetch, ApiError } from "@/config/api";
import { useAuth } from "@/lib/auth-context";

interface WalletData {
  uid: number; nickname: string;
  credit1: number; credit2: number; credit3: number;
  credit4: number; credit5: number;
  credit1_label: string; credit2_label: string;
  credit3_label: string; credit4_label: string;
  credit5_label: string;
}

const assetList = [
  { key: "credit1", icon: "🎮", color: "from-brand-teal to-brand-teal-dark" },
  { key: "credit5", icon: "⛏️", color: "from-brand-coral to-brand-coral-dark" },
  { key: "credit3", icon: "🔮", color: "from-brand-teal/60 to-brand-gold" },
  { key: "credit4", icon: "💰", color: "from-brand-gold to-brand-gold-dark" },
  { key: "credit2", icon: "🏪", color: "from-brand-teal to-brand-gold" },
];

export default function AssetsPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const uid = user?.uid || 0;
    if (!uid) { setLoading(false); return; }
    
    apiFetch<any>("/wallet_api.php", {
      params: { uid: String(uid), action: "balance" },
    })
      .then((data) => {
        if (!cancelled) {
          setWallet(data);
          setError(null);
        }
      })
      .catch((err: ApiError) => {
        if (!cancelled) {
          setError(err.message);
          console.warn("Assets load failed:", err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const w = wallet;
  const getVal = (k: string) => {
    if (!w) return 0;
    if (k === "credit4") return `¥${w.credit4.toFixed(2)}`;
    return String(Math.floor((w as any)[k] ?? 0));
  };
  const getLabel = (k: string) => {
    if (!w) return "";
    return (w as any)[`${k}_label`] ?? k;
  };
  const getDesc = (k: string) => {
    const descs: Record<string, string> = {
      credit1: "投注 / 投票 / AI会话消耗",
      credit5: "PK竞技赢得，注册豆赢得100%冻结",
      credit3: "荣誉值，享有赢家盈利分红",
      credit4: "消费 / 购物 / 兑换游戏豆",
      credit2: "物资/服务置换获得，仅商城使用",
    };
    return descs[k] || "";
  };

  // 错误状态
  if (!loading && error) {
    return (
      <main className="min-h-screen bg-bg pb-24">
        <div className="flex items-center px-4 h-12 border-b border-[rgba(69,204,213,0.08)]">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">我的资产</h1>
        </div>
        <div className="mx-4 mt-8 p-6 bg-surface rounded-[20px] text-center">
          <div className="text-3xl mb-3">😅</div>
          <p className="text-sm text-text-secondary">加载失败</p>
          <p className="text-xs text-text-tertiary mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-5 py-2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm rounded-xl"
          >
            重新加载
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">我的资产</h1>
        </div>
      </div>

      {!loading && w && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[20px] p-5 text-white">
          <div className="text-[11px] opacity-80">总览</div>
          <div className="text-2xl font-bold mt-1">
            🎮 {Math.floor(w.credit1).toLocaleString()} 游戏豆
          </div>
          <div className="text-[11px] opacity-70 mt-1">
            水晶石 {Math.floor(w.credit5).toLocaleString()} · 水晶球 {Math.floor(w.credit3)} · 余额 ¥{w.credit4.toFixed(2)}
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-surface rounded-[16px] animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {assetList.map(a => {
            const val = getVal(a.key);
            const label = getLabel(a.key);
            const desc = getDesc(a.key);
            return (
              <div key={a.key} className="bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)] flex items-center gap-3">
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-r ${a.color} flex items-center justify-center text-lg text-white shadow-sm shrink-0`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px] text-text-tertiary">{desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{val}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
