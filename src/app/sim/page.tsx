"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, TrendingUp, AlertTriangle } from "lucide-react";

import { API_BASE } from '@/config/api';

interface Quote { symbol: string; price: number; open: number; high: number; low: number; pre_close: number; change_pct: number; volume: number; is_mock?: boolean; }
interface Kline { t: number; o: number; c: number; h: number; l: number; v: number; }
interface Position { id: number; order_sn: string; direction_label: string; leverage: number; open_price: number; points: number; current_price: number; floating_pl: number; }
interface Trade { id: number; order_sn: string; direction_label: string; leverage: number; open_price: number; close_price: number; points: number; profit_loss_points: number; win: boolean; }

const api = (path: string, opts?: RequestInit) =>
  fetch(API_BASE + "/api/backend/" + path, { ...opts, headers: { "Content-Type": "application/json", ...opts?.headers } }).then(r => r.json());

function Sparkline({ klines }: { klines: Kline[] }) {
  if (!klines?.length) return <div className="h-28 w-full rounded-xl bg-bg animate-pulse" />;
  const prices = klines.slice(-60).map(k => k.c);
  const mn = Math.min(...prices), mx = Math.max(...prices), range = mx - mn || 1;
  const w = 680, h = 120, pad = 4;
  const xS = (w - pad * 2) / (prices.length - 1);
  const yS = (p: number) => h - pad - ((p - mn) / range) * (h - pad * 2);
  const pts = prices.map((p, i) => `${pad + i * xS},${yS(p)}`).join(" ");
  const up = prices[prices.length - 1] >= prices[0];
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
      <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0.01" /></linearGradient></defs>
      <path d={`M${pts} L${pad + (prices.length - 1) * xS},${h - pad} L${pad},${h - pad} Z`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SimPage() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [klines, setKlines] = useState<Kline[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tab, setTab] = useState<"trade" | "positions" | "history">("trade");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [direction, setDirection] = useState<1 | 2>(1);
  const [leverage, setLeverage] = useState(1);
  const [points, setPoints] = useState("100");
  const [showGuide, setShowGuide] = useState(true);

  const loadData = useCallback(async () => {
    const [q, k, p, h] = await Promise.all([api("sim/quote"), api("sim/kline"), api("sim/positions"), api("sim/history")]);
    if (q?.result === 1) setQuote(q.data);
    if (k?.result === 1) setKlines(k.data?.list || []);
    if (p?.result === 1) setPositions(p.data?.list || []);
    if (h?.result === 1) setTrades(h.data?.list || []);
  }, []);

  useEffect(() => { loadData(); const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }, [loadData]);

  const openPosition = async () => {
    const pts = parseInt(points);
    if (pts < 10) { setMessage("❌ 最少10🎮"); return; }
    setLoading(true); setMessage("");
    const res = await api("sim/open", { method: "POST", body: JSON.stringify({ direction, leverage, points: pts }) });
    setLoading(false);
    if (res?.result === 1) { setMessage("✅ 开仓成功"); loadData(); }
    else { setMessage("❌ " + (res?.msg || "游戏豆不足")); }
  };

  const closePosition = async (tradeId: number) => {
    setLoading(true);
    const res = await api("sim/close", { method: "POST", body: JSON.stringify({ trade_id: tradeId }) });
    setLoading(false);
    if (res?.result === 1) { setMessage(res.data.win ? "✅ 盈利 +" + res.data.points_returned + "🎮 +" + Math.floor(res.data.pl_points_int * 0.8) + "⛏️" : "❌ 亏损"); loadData(); }
    else { setMessage("❌ " + (res?.msg || "平仓失败")); }
  };

  const cp = quote?.price || 0;
  const chg = quote?.change_pct || 0;
  const isUp = chg >= 0;

  return (
    <main className="pb-24 min-h-screen bg-bg">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button onClick={() => window.history.back()} className="text-text-tertiary active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold">沪深期货</span>
          {quote && (
            <div className="ml-auto flex items-baseline gap-2">
              <span className={`text-lg font-bold ${isUp ? "text-red-500" : "text-green-500"}`}>{cp.toFixed(1)}</span>
              <span className={`text-[11px] font-medium ${isUp ? "text-red-500" : "text-green-500"}`}>{isUp ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Guide Banner */}
        {showGuide && (
          <div className="bg-gradient-to-r from-brand-teal/10 to-brand-teal/5 rounded-[16px] border border-brand-teal/20 p-3 mb-3 flex items-start gap-3">
            <span className="text-lg">📖</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-brand-teal-dark">欢迎使用沪深股指模拟</p>
              <ol className="mt-1 space-y-0.5 text-[10px] text-text-tertiary">
                <li>1. 选择看涨/看跌方向</li>
                <li>2. 选择杠杆倍数 (1x-10x)</li>
                <li>3. 输入积分数量</li>
                <li>4. 点击开仓，盘价涨跌都能盈利</li>
              </ol>
            </div>
            <button onClick={() => setShowGuide(false)} className="text-text-tertiary hover:text-text-primary text-xs">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-[14px] bg-bg p-0.5 mb-4">
          {[
            { key: "trade" as const, label: "📊 交易", badge: 0 },
            { key: "positions" as const, label: "📋 持仓", badge: positions.length },
            { key: "history" as const, label: "📜 记录", badge: 0 },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex-1 rounded-[12px] px-3 py-2 text-center text-xs font-medium transition ${
                tab === t.key ? "bg-surface text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              }`}>
              {t.label}
              {t.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-3 flex items-center justify-between rounded-xl p-3 text-xs font-medium ${
            message.includes("✅") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="opacity-40 hover:opacity-100">✕</button>
          </div>
        )}

        {/* ── Trade Tab ── */}
        {tab === "trade" && (
          <div className="space-y-4">
            {/* Price Chart */}
            <div className="bg-surface rounded-[20px] p-3 shadow-sm border border-border-tertiary">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-text-primary">沪深300主力 (IF9999)</span>
                <span className="text-[9px] text-text-tertiary">15秒刷新</span>
              </div>
              {klines.length > 0 ? <Sparkline klines={klines} /> : <div className="h-28 w-full rounded-xl bg-bg animate-pulse" />}
              {quote && (
                <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border-tertiary/40 pt-3 text-center">
                  {[
                    { l: "今开", v: quote.open.toFixed(1) },
                    { l: "最高", v: quote.high.toFixed(1) },
                    { l: "最低", v: quote.low.toFixed(1) },
                    { l: "成交量", v: (quote.volume / 10000).toFixed(1) + "万" },
                  ].map(s => (
                    <div key={s.l}>
                      <div className="text-[9px] text-text-tertiary">{s.l}</div>
                      <div className="text-xs font-semibold text-text-primary">{s.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Open Position Form */}
            <div className="bg-surface rounded-[20px] p-4 shadow-sm border border-border-tertiary">
              <h2 className="text-sm font-semibold mb-4">开仓</h2>

              {/* Direction */}
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary">方向</label>
                <div className="mt-1.5 flex gap-2">
                  <button onClick={() => setDirection(1)}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-medium transition ${
                      direction === 1 ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>📈 看涨</button>
                  <button onClick={() => setDirection(2)}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-medium transition ${
                      direction === 2 ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>📉 看跌</button>
                </div>
              </div>

              {/* Leverage */}
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary">杠杆 <span className="text-red-400/70">⚠️ 高杠杆高风险</span></label>
                <div className="mt-1.5 flex gap-2">
                  {[1, 2, 5, 10].map(l => (
                    <button key={l} onClick={() => setLeverage(l)}
                      className={`flex-1 rounded-[12px] py-2.5 text-xs font-medium transition ${
                        leverage === l ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                      }`}>{l}x</button>
                  ))}
                </div>
              </div>

              {/* Risk warning */}
              <div className="mb-4 rounded-xl bg-red-50 p-2.5">
                <p className="text-[9px] text-red-600/80 leading-relaxed">
                  注意：杠杆越高，风险越大。当盘价反向运动超过 1/杠杆 时，会被强制平仓（爆仓）。请合理控制仓位。
                </p>
              </div>

              {/* Points */}
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary">游戏豆 🎮 (最少10)</label>
                <div className="mt-1.5 flex gap-2 mb-2">
                  {[100, 500, 1000, 5000].map(v => (
                    <button key={v} onClick={() => setPoints(String(v))}
                      className={`flex-1 rounded-[10px] py-1.5 text-[10px] font-medium transition ${
                        points === String(v) ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30" : "bg-bg text-text-secondary border border-border-tertiary"
                      }`}>{v}</button>
                  ))}
                </div>
                <input type="number" min="10" value={points} onChange={e => setPoints(e.target.value)}
                  className="w-full rounded-[12px] border border-border-tertiary bg-bg p-2.5 text-sm outline-none focus:border-brand-teal" placeholder="自定义金额" />
              </div>

              <button onClick={openPosition} disabled={loading}
                className={`w-full rounded-[14px] py-3 text-sm font-semibold text-white transition active:scale-[0.97] ${
                  loading ? "bg-text-tertiary" : "bg-gradient-to-r from-brand-teal to-brand-teal-dark shadow-sm"
                }`}>
                {loading ? "⏳ 开仓中..." : "🚀 确认开仓"}
              </button>
            </div>
          </div>
        )}

        {/* ── Positions Tab ── */}
        {tab === "positions" && (
          <div className="space-y-2">
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl opacity-50 mb-2">📋</div>
                <p className="text-xs text-text-tertiary">暂无持仓</p>
                <button onClick={() => setTab("trade")} className="mt-3 rounded-[12px] bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 py-2 text-xs font-medium text-white shadow-sm active:scale-95 transition-transform">
                  去开仓
                </button>
              </div>
            ) : (
              positions.map(p => (
                <div key={p.id} className="bg-surface rounded-[16px] p-3 shadow-sm border border-border-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs ${p.direction_label === "多" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {p.direction_label === "多" ? "📈" : "📉"}
                      </span>
                      <span className="text-xs font-medium">{p.direction_label} · {p.leverage}x</span>
                    </div>
                    <span className={`text-xs font-bold ${p.floating_pl >= 0 ? "text-red-500" : "text-green-500"}`}>
                      {p.floating_pl >= 0 ? "+" : ""}{p.floating_pl}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-text-tertiary">
                    <span>开: {p.open_price.toFixed(1)} / 现: {p.current_price.toFixed(1)}</span>
                    <span className="rounded-full bg-bg px-2 py-0.5">{p.points}🎮</span>
                  </div>
                  <button onClick={() => closePosition(p.id)} disabled={loading}
                    className="mt-2 w-full rounded-[12px] border border-border-tertiary py-1.5 text-[10px] text-text-secondary transition hover:bg-bg active:scale-[0.98]">
                    {loading ? "⏳" : "平仓"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {tab === "history" && (
          <div className="space-y-2">
            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl opacity-50 mb-2">📜</div>
                <p className="text-xs text-text-tertiary">暂无交易记录</p>
              </div>
            ) : (
              trades.map(t => (
                <div key={t.id} className="bg-surface rounded-[16px] p-3 shadow-sm border border-border-tertiary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs ${t.direction_label === "多" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                        {t.direction_label === "多" ? "📈" : "📉"}
                      </span>
                      <span className={`text-xs font-medium ${t.win ? "text-red-500" : "text-green-500"}`}>
                        {t.win ? "✅ 盈利" : "❌ 亏损"}
                      </span>
                      <span className="text-[10px] text-text-tertiary">{t.leverage}x</span>
                    </div>
                    <span className={`text-xs font-bold ${t.win ? "text-red-500" : "text-green-500"}`}>
                      {t.profit_loss_points >= 0 ? "+" : ""}{t.profit_loss_points}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-text-tertiary">
                    {t.open_price.toFixed(1)} → {t.close_price.toFixed(1)} · {t.points}🎮
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
