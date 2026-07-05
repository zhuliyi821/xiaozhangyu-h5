"use client";

import { useState, useEffect } from "react";
import { API_BASE, apiFetch, ApiError } from "@/config/api";

interface WalletData {
  uid: number; nickname: string;
  credit1: number; credit2: number; credit3: number;
  credit4: number; credit5: number; credit6: number;
  sim_coin: number; granted_game_coins: number;
  credit1_label: string; credit2_label: string;
  credit3_label: string; credit4_label: string;
  credit5_label: string; credit6_label: string;
}

const assetList = [
  { key: "credit1", icon: "🎮", color: "from-indigo-400 to-purple-500" },
  { key: "credit5", icon: "⛏️", color: "from-amber-400 to-orange-500" },
  { key: "credit6", icon: "❄️", color: "from-cyan-400 to-blue-500", sub: "冻结豆" },
  { key: "credit3", icon: "🔮", color: "from-violet-400 to-pink-500" },
  { key: "credit4", icon: "💰", color: "from-green-400 to-emerald-500" },
  { key: "credit2", icon: "🏪", color: "from-amber-400 to-orange-500" },
];

export default function AssetsPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    apiFetch<any>("/wallet_api.php", {
      params: { uid: "1", action: "balance" },
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
    if (k === "credit6") return `${Math.floor(w.credit6)} (冻结)`;
    return String(Math.floor((w as any)[k] ?? 0));
  };
  const getLabel = (k: string) => {
    if (!w) return "";
    if (k === "credit6") return `${w.credit6_label} (注册投注赢得)`;
    return (w as any)[`${k}_label`] ?? k;
  };
  const getDesc = (k: string) => {
    const descs: Record<string, string> = {
      credit1: "用于投注预测",
      credit5: "投注赢得的奖励",
      credit6: "注册赠送游戏豆投注赢得",
      credit3: "荣誉值/权益",
      credit4: "可消费/购物",
      credit2: "仅有点闲商城使用",
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
