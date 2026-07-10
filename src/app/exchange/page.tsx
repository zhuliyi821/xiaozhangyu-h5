"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { API_BASE, apiFetch, ApiError } from "@/config/api";
import { useAuth } from "@/lib/auth-context";

interface ExchangeData {
  uid: number;
  credit1: number; credit2: number; credit3: number; credit4: number; credit5: number;
  credit1_label: string; credit2_label: string; credit3_label: string;
  credit4_label: string; credit5_label: string;
}

const RATES = {
  credit5: { to: "credit1", rate: 1, icon: "⛏️", label: "水晶石", desc: "PK奖励 · 1:1 兑换游戏豆" },
  credit3: { to: "credit1", rate: 100, icon: "🔮", label: "水晶球", desc: "荣誉值 · 1:100 兑换游戏豆" },
  credit4: { to: "credit1", rate: 100, icon: "💰", label: "余额", desc: "现金 · ¥1:100 兑换游戏豆" },
};

type ExchangeKey = "credit5" | "credit3" | "credit4";

const CARD_COLORS: Record<ExchangeKey, { bar: string; input: string; result: string }> = {
  credit5: { bar: "bg-brand-coral", input: "border-brand-coral focus:ring-brand-coral/20", result: "bg-brand-coral/5 text-brand-coral-dark" },
  credit3: { bar: "bg-brand-gold", input: "border-brand-gold focus:ring-brand-gold/20", result: "bg-brand-gold/5 text-brand-gold-dark" },
  credit4: { bar: "bg-brand-teal", input: "border-brand-teal focus:ring-brand-teal/20", result: "bg-brand-teal/5 text-brand-teal-dark" },
};

export default function ExchangePage() {
  const { user } = useAuth();
  const [data, setData] = useState<ExchangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({ credit5: "", credit3: "", credit4: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadBalance = () => {
    const uid = user?.uid || 0;
    if (!uid) { setLoading(false); return; }
    apiFetch<any>("/wallet_api.php", { params: { uid: String(uid), action: "balance" } })
      .then(d => { setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBalance(); }, [user]);

  const handleAmount = (key: ExchangeKey, val: string) => {
    if (val === "" || /^\d+$/.test(val)) {
      setAmounts(prev => ({ ...prev, [key]: val }));
    }
  };

  const setAll = (key: ExchangeKey) => {
    if (!data) return;
    const val = key === "credit4" ? Math.floor(data.credit4).toString() : String(Math.floor((data as any)[key] ?? 0));
    setAmounts(prev => ({ ...prev, [key]: val }));
  };

  const totalBeans = useMemo(() => {
    let total = 0;
    for (const [key, val] of Object.entries(amounts)) {
      if (val) {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n > 0) {
          const rate = RATES[key as ExchangeKey]?.rate || 1;
          total += n * rate;
        }
      }
    }
    return total;
  }, [amounts]);

  const hasAnyInput = Object.values(amounts).some(v => v && parseInt(v, 10) > 0);

  const submitExchange = async () => {
    if (!hasAnyInput || !data) return;
    setSubmitting(true);
    try {
      const params: Record<string, string> = { uid: String(data.uid), action: "exchange" };
      for (const [key, val] of Object.entries(amounts)) {
        if (val && parseInt(val, 10) > 0) params[key] = val;
      }
      const res = await apiFetch<any>("/wallet_api.php", { params });
      if (res.code === 0) {
        setShowConfirm(false);
        setAmounts({ credit5: "", credit3: "", credit4: "" });
        loadBalance();
      } else {
        alert(res.message || "兑换失败");
      }
    } catch (e: any) {
      alert(e.message || "兑换失败");
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold text-text-primary">兑换中心</span>
          </Link>
          <button onClick={loadBalance} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ═══ Loading ═══ */}
      {loading && (
        <div className="px-4 py-6 space-y-4">
          <div className="h-24 bg-gray-100 rounded-[12px] animate-pulse" />
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-[12px] animate-pulse" />)}
        </div>
      )}

      {/* ═══ No login ═══ */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-sm text-text-secondary mb-2">请先登录</p>
          <p className="text-[10px] text-text-tertiary">登录后即可查看资产并进行兑换</p>
        </div>
      )}

      {/* ═══ Main content ═══ */}
      {!loading && data && (
        <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

          {/* ── Hero: 游戏豆总览 ── */}
          <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark rounded-[12px] p-5 text-white shadow-soft">
            <div className="text-[10px] text-white/70 font-medium tracking-wider">可用资产</div>
            <div className="text-[28px] font-bold mt-1 tracking-tight">
              {Math.floor(data.credit1).toLocaleString()}
            </div>
            <div className="text-[11px] text-white/80 font-medium">游戏豆</div>

            <div className="flex gap-2 mt-3.5 flex-wrap">
              <Link href="/exchange/credit5" className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] flex items-center gap-1 hover:bg-white/25 transition-colors active:scale-95">
                <span>⛏️</span> {Math.floor(data.credit5).toLocaleString()} 水晶石
              </Link>
              <Link href="/exchange/credit3" className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] flex items-center gap-1 hover:bg-white/25 transition-colors active:scale-95">
                <span>🔮</span> {Math.floor(data.credit3).toLocaleString()} 水晶球
              </Link>
              <Link href="/exchange/credit4" className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] flex items-center gap-1 hover:bg-white/25 transition-colors active:scale-95">
                <span>💰</span> ¥{data.credit4.toFixed(2)}
              </Link>
              <Link href="/exchange/credit2" className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] flex items-center gap-1 hover:bg-white/25 transition-colors active:scale-95">
                <span>🫘</span> {Math.floor(data.credit2).toLocaleString()} 闲豆<span className="text-white/50">·商城</span>
              </Link>
            </div>
          </div>

          {/* ── 兑换标题 ── */}
          <div className="flex items-center gap-2 px-0.5">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-[13px] font-bold text-text-primary">兑换到游戏豆</span>
          </div>

          {/* ── 兑换卡片 ── */}
          {(Object.keys(RATES) as ExchangeKey[]).map((key) => {
            const r = RATES[key];
            const colors = CARD_COLORS[key];
            const balance = key === "credit4" ? data.credit4 : (data as any)[key] ?? 0;
            const inputVal = amounts[key];
            const numVal = inputVal ? parseInt(inputVal, 10) : 0;
            const resultBeans = numVal > 0 ? numVal * r.rate : 0;

            return (
              <div key={key} className="bg-white rounded-[12px] border border-brand-teal/10 shadow-soft overflow-hidden">
                <div className="flex">
                  <div className={`w-1 shrink-0 ${colors.bar}`} />
                  <div className="flex-1 p-4">
                    {/* 标题行 */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{r.icon}</span>
                        <span className="text-[12px] font-bold text-text-primary">{r.label}</span>
                        <span className="text-[9px] text-text-tertiary">→ 游戏豆</span>
                      </div>
                      <span className="text-[10px] text-text-tertiary">
                        可用 <strong className="text-text-primary font-semibold">
                          {key === "credit4" ? `¥${balance.toFixed(2)}` : Math.floor(balance).toLocaleString()}
                        </strong>
                      </span>
                    </div>

                    {/* 汇率 + 输入行 */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-text-tertiary shrink-0">
                        汇率：{r.icon} {r.rate > 1 ? `1:${r.rate}` : "1:1"}
                      </span>
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          value={inputVal}
                          onChange={e => handleAmount(key, e.target.value)}
                          placeholder={key === "credit4" ? "输入金额" : "输入数量"}
                          className={`flex-1 w-0 bg-gray-50 rounded-[8px] px-3 py-1.5 text-[11px] text-right border outline-none transition-all ${colors.input}`}
                        />
                        <button onClick={() => setAll(key)}
                          className="text-[10px] font-medium text-brand-coral hover:text-brand-coral-dark shrink-0 px-1.5">
                          全部
                        </button>
                      </div>
                    </div>

                    {/* 计算结果 */}
                    {resultBeans > 0 && (
                      <div className={`mt-2 ${colors.result} rounded-[6px] px-3 py-1.5 text-[11px] font-medium text-center`}>
                        + {resultBeans.toLocaleString()} 游戏豆
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── 闲豆提示 ── */}
          <div className="bg-brand-gold-light/10 border border-brand-gold/20 rounded-[10px] px-4 py-2.5 text-[10px] text-text-tertiary leading-relaxed">
            🏪 闲豆 ({Math.floor(data.credit2).toLocaleString()}) 仅限商城消费，不可兑换为游戏豆
          </div>

          {/* ── 底部操作区 ── */}
          <div className="sticky bottom-0 bg-white rounded-[12px] border border-brand-teal/10 shadow-soft-lg p-4 -mx-4 px-4"
            style={{ maxWidth: "calc(100vw - 2rem)", marginLeft: "auto", marginRight: "auto" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-text-secondary">本次兑换总计</span>
              <span className="text-[18px] font-bold text-brand-teal-dark">
                {totalBeans.toLocaleString()} <span className="text-[11px] font-medium">游戏豆</span>
              </span>
            </div>
            <button
              onClick={() => hasAnyInput && setShowConfirm(true)}
              disabled={!hasAnyInput || submitting}
              className="w-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] py-3 text-[13px] font-bold active:scale-[0.98] transition-transform disabled:opacity-40 shadow-sm"
            >
              {submitting ? "兑换中..." : "确认兑换"}
            </button>
            <div className="text-[9px] text-text-tertiary text-center mt-2">
              兑换后不可撤销 · 游戏豆不可反向兑换
            </div>
          </div>

        </div>
      )}

      {/* ═══ 确认弹窗 ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-white rounded-t-[16px] w-full max-w-[430px] p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold">确认兑换</span>
              <button onClick={() => setShowConfirm(false)} className="text-text-tertiary text-lg">✕</button>
            </div>

            <div className="space-y-2.5 mb-4">
              {(Object.keys(RATES) as ExchangeKey[]).map((key) => {
                const val = amounts[key];
                const numVal = val ? parseInt(val, 10) : 0;
                if (numVal <= 0) return null;
                const r = RATES[key];
                return (
                  <div key={key} className="flex items-center justify-between text-[12px] bg-gray-50 rounded-[8px] px-3.5 py-2.5">
                    <span className="text-text-secondary">{r.icon} {r.label}</span>
                    <span>{numVal.toLocaleString()} → <strong className="text-brand-teal-dark">{(numVal * r.rate).toLocaleString()}</strong> 游戏豆</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between py-2.5 border-t border-gray-100 mb-4">
              <span className="text-[12px] font-bold">总计</span>
              <span className="text-[18px] font-bold text-brand-teal-dark">{totalBeans.toLocaleString()} 游戏豆</span>
            </div>

            <button onClick={submitExchange} disabled={submitting}
              className="w-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[12px] py-3 text-[13px] font-bold active:scale-[0.98] transition-transform disabled:opacity-50 shadow-sm">
              {submitting ? "兑换中..." : "确认兑换"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
