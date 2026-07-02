"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, Zap, Trophy, History, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://surplus.hi.cn";

interface Quote { price: number; change_pct: number }
interface Round { round_id: string; round_no: number; status: string; remaining: number }
interface SimPosition {
  id: string; side: 1 | 2; entry_price: number; mark_price: number;
  margin: number; leverage: number; quantity: number;
  unrealized_pnl: number; liquidation_price: number; open_time: string;
}

export default function BTCGamePage() {
  const [tab, setTab] = useState<"predict" | "fast" | "positions" | "orders">("fast");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [priceFlash, setPriceFlash] = useState<boolean | null>(null);
  const [simPositions, setSimPositions] = useState<SimPosition[]>([]);

  // Predict form (futures trading)
  const [direction, setDirection] = useState<1 | 2>(1);
  const [leverage, setLeverage] = useState(1);
  const [marginAmount, setMarginAmount] = useState("100");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  // Fast game
  const [betType, setBetType] = useState("risefall");
  const [betPoints, setBetPoints] = useState("100");
  const [fastDirection, setFastDirection] = useState("涨"); // 涨/跌 for risefall
  const [bsDirection, setBsDirection] = useState("大"); // 大/小 for big/small
  const [oeDirection, setOeDirection] = useState("单"); // 单/双 for odd/even
  const [tailNumber, setTailNumber] = useState<number | null>(null); // 0-9 for tail
  const [countdown, setCountdown] = useState(0); // per-bet countdown in seconds

  const api = async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API}/api/backend/${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts?.headers },
    });
    return res.json();
  };

  const loadData = async () => {
    const [q, r] = await Promise.all([api("btc-game/quote"), api("btc-game/fast-status").catch(() => null)]);
    if (q?.result === 1) {
      const oldPrice = quote?.price || 0;
      const newPrice = q.data.price;
      if (oldPrice > 0 && newPrice !== oldPrice) {
        setPriceFlash(newPrice > oldPrice);
        setTimeout(() => setPriceFlash(null), 800);
      }
      setQuote(q.data);
      // Update sim positions unrealized P&L
      setSimPositions(prev => prev.map(p => {
        const priceDiff = p.side === 1 ? newPrice - p.entry_price : p.entry_price - newPrice;
        const pnl = (priceDiff / p.entry_price) * p.margin * p.leverage;
        return { ...p, mark_price: newPrice, unrealized_pnl: Math.round(pnl * 100) / 100 };
      }));
    }
    if (r?.result === 1) setRound(r.data);
  };

  useEffect(() => { loadData(); const iv = setInterval(loadData, 5000); return () => clearInterval(iv); }, []);

  // Per-bet countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const iv = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [countdown > 0]);

  const openPosition = async () => {
    const pts = parseInt(marginAmount);
    if (pts < 100) { setMessage("❌ 最少100保证金"); return; }
    setLoading(true); setMessage("");
    const res = await api("btc-game/open", { method: "POST", body: JSON.stringify({ direction, period: 1, leverage, points: pts }) });
    setLoading(false);
    if (res?.result === 1) {
      setMessage("✅ 开仓成功! 方向:" + (direction === 1 ? "做多" : "做空") + " 杠杆:" + leverage + "x");
      // Add to local positions simulation
      const entryPrice = cp;
      const posValue = pts * leverage;
      const liqPrice = direction === 1
        ? entryPrice * (1 - 0.005 / leverage)
        : entryPrice * (1 + 0.005 / leverage);
      const newPos: SimPosition = {
        id: "POS" + Date.now(),
        side: direction as 1 | 2,
        entry_price: entryPrice,
        mark_price: entryPrice,
        margin: pts,
        leverage,
        quantity: posValue / entryPrice,
        unrealized_pnl: 0,
        liquidation_price: liqPrice,
        open_time: new Date().toISOString(),
      };
      setSimPositions(prev => [newPos, ...prev]);
      loadData();
    } else {
      setMessage("❌ " + (res?.msg || "开仓失败"));
    }
  };

  const closePosition = (posId: string) => {
    const pos = simPositions.find(p => p.id === posId);
    if (!pos) return;
    const priceDiff = pos.side === 1 ? cp - pos.entry_price : pos.entry_price - cp;
    const pnl = (priceDiff / pos.entry_price) * pos.margin * pos.leverage;
    const totalReturn = pos.margin + pnl;
    setMessage(`✅ 已平仓! 盈亏: ${pnl >= 0 ? "+" : ""}${Math.round(pnl)}豆 (返还 ${Math.round(totalReturn)}豆)`);
    setSimPositions(prev => prev.filter(p => p.id !== posId));
  };

  const placeFastBet = async () => {
    setLoading(true); setMessage(""); setCountdown(0);

    let choice = betType;
    if (betType === "risefall") choice = fastDirection;
    else if (betType === "big") choice = bsDirection;
    else if (betType === "odd") choice = oeDirection;
    else if (betType === "tail") {
      if (tailNumber === null) { setMessage("❌ 请选择尾号 (0-9)"); setLoading(false); return; }
      choice = String(tailNumber);
    }

    const res = await api("btc-game/open", {
      method: "POST",
      body: JSON.stringify({ direction: choice === "涨" || choice === "大" || choice === "单" ? 1 : 2, period: 1, leverage: 1, points: parseInt(betPoints) }),
    });
    setLoading(false);
    if (res?.result === 1) {
      setMessage("✅ 投注成功! " + choice);
      setCountdown(180);
      loadData();
    } else {
      setMessage("❌ " + (res?.msg || "投注失败"));
    }
  };

  const cp = quote?.price || 0;
  const cpChange = quote?.change_pct || 0;

  return (
    <main className="pb-24 min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-border-tertiary">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => window.history.back()} className="text-text-tertiary active:scale-90">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl">₿</span>
          <span className="text-sm font-semibold">BTC试玩</span>
          <span className="text-[10px] text-text-tertiary hidden sm:inline">/ 市场预测</span>
          {quote && (
            <span className={`ml-auto text-sm font-bold ${cpChange >= 0 ? "text-red-500" : "text-green-500"}`}>
              {cp.toLocaleString()} {cpChange >= 0 ? "▲" : "▼"} {Math.abs(cpChange).toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* BTC Real-Time Price Banner */}
        {cp > 0 && (
          <div className={`bg-gradient-to-r from-orange-500 to-amber-500 rounded-[16px] p-3 mb-3 flex items-center justify-between shadow-sm transition-all duration-300 ${
            priceFlash === true ? "scale-[1.02] ring-2 ring-green-300/50" : priceFlash === false ? "scale-[1.02] ring-2 ring-red-300/50" : ""
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-[10px] text-white/80 font-medium">BTC 实时价格</span>
                <span className="text-[8px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full">LIVE</span>
              </div>
              <div className={`text-xl font-bold text-white tracking-tight transition-colors duration-500 ${
                priceFlash === true ? "text-green-200" : priceFlash === false ? "text-red-200" : ""
              }`}>${cp.toLocaleString()}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-sm font-bold ${cpChange >= 0 ? "text-green-200" : "text-red-200"}`}>
                {cpChange >= 0 ? "▲" : "▼"} {Math.abs(cpChange).toFixed(2)}%
              </div>
              <div className="text-[9px] text-white/60">24h 涨跌</div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-3 flex items-center justify-between rounded-xl p-3 text-xs font-medium ${
            message.includes("✅") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="opacity-40 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-[14px] bg-bg p-0.5 mb-4 overflow-x-auto">
          {[
            { k: "fast" as const, l: "🎲 快节奏" },
            { k: "predict" as const, l: "📈 合约交易" },
            { k: "positions" as const, l: "📋 持有" },
            { k: "orders" as const, l: "📜 订单" },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`flex-1 whitespace-nowrap rounded-[12px] px-3 py-2 text-center text-xs font-medium transition ${
                tab === t.k ? "bg-surface text-text-primary shadow-sm" : "text-text-tertiary hover:text-text-secondary"
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Futures Trading Tab ── */}
        {tab === "predict" && (
          <div className="bg-surface rounded-[20px] p-4 shadow-sm border border-border-tertiary">
            {/* Mark Price */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-tertiary/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] text-text-tertiary">标记价格 Mark Price</span>
              </div>
              <div className={`text-lg font-bold tracking-tight ${direction === 1 ? "text-red-500" : "text-green-500"}`}>
                ${cp ? cp.toLocaleString() : "—"}
              </div>
            </div>

            {/* Direction */}
            <div className="mb-4">
              <label className="text-[10px] text-text-tertiary mb-1.5 block">方向</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection(1)}
                  className={`flex-1 rounded-[14px] py-3 text-xs font-bold transition-all ${
                    direction === 1 ? "bg-red-500 text-white shadow-sm ring-2 ring-red-300" : "bg-bg text-text-secondary border border-border-tertiary"
                  }`}>
                  <div className="text-lg">📈</div>
                  <div>做多</div>
                </button>
                <button onClick={() => setDirection(2)}
                  className={`flex-1 rounded-[14px] py-3 text-xs font-bold transition-all ${
                    direction === 2 ? "bg-green-500 text-white shadow-sm ring-2 ring-green-300" : "bg-bg text-text-secondary border border-border-tertiary"
                  }`}>
                  <div className="text-lg">📉</div>
                  <div>做空</div>
                </button>
              </div>
            </div>

            {/* Leverage */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-text-tertiary">杠杆</label>
                <span className="text-[10px] text-text-tertiary">建议 ≤ 10x</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5, 10, 20, 50].map(l => (
                  <button key={l} onClick={() => setLeverage(l)}
                    className={`flex-1 rounded-[10px] py-2 text-xs font-medium transition ${
                      leverage === l
                        ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-sm"
                        : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>{l}x</button>
                ))}
              </div>
            </div>

            {/* Margin */}
            <div className="mb-4">
              <label className="text-[10px] text-text-tertiary mb-1.5 block">保证金 (游戏豆)</label>
              <div className="flex gap-2 mb-2">
                {[100, 500, 1000, 5000].map(v => (
                  <button key={v} onClick={() => setMarginAmount(String(v))}
                    className={`flex-1 rounded-[10px] py-2 text-xs font-medium transition ${
                      marginAmount === String(v) ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>{v.toLocaleString()}</button>
                ))}
              </div>
              <input type="number" min="100" value={marginAmount} onChange={e => setMarginAmount(e.target.value)}
                className="w-full rounded-[12px] border border-border-tertiary bg-bg p-2.5 text-sm outline-none focus:border-brand-teal" placeholder="自定义金额 (≥100)" />
            </div>

            {/* Position Info */}
            {cp > 0 && (
              <div className="bg-bg rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-text-tertiary">名义价值: </span>
                  <span className="font-semibold">{(parseInt(marginAmount || "0") * leverage).toLocaleString()} 🪙</span>
                </div>
                <div>
                  <span className="text-text-tertiary">强平价格: </span>
                  <span className="font-semibold text-red-500">
                    ${direction === 1
                      ? (cp * (1 - 0.005 / Math.max(leverage, 1))).toLocaleString(undefined, { maximumFractionDigits: 1 })
                      : (cp * (1 + 0.005 / Math.max(leverage, 1))).toLocaleString(undefined, { maximumFractionDigits: 1 })
                    }
                  </span>
                </div>
                <div>
                  <span className="text-text-tertiary">维持保证金率: </span>
                  <span className="font-semibold">{Math.min(0.5 * leverage, 10)}%</span>
                </div>
                <div>
                  <span className="text-text-tertiary">盈亏 1%: </span>
                  <span className={`font-semibold ${direction === 1 ? "text-red-500" : "text-green-500"}`}>
                    {direction === 1 ? "+" : "-"}{(parseInt(marginAmount || "0") * leverage * 0.01).toFixed(1)} 🪙
                  </span>
                </div>
              </div>
            )}

            {/* SL/TP (Optional) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-[10px] text-text-tertiary mb-1 block">止损价 (可选)</label>
                <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)}
                  className="w-full rounded-[10px] border border-border-tertiary bg-bg p-2 text-xs outline-none focus:border-red-400" placeholder="如: 59000" />
              </div>
              <div>
                <label className="text-[10px] text-text-tertiary mb-1 block">止盈价 (可选)</label>
                <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)}
                  className="w-full rounded-[10px] border border-border-tertiary bg-bg p-2 text-xs outline-none focus:border-green-400" placeholder="如: 62000" />
              </div>
            </div>

            <button onClick={openPosition} disabled={loading}
              className={`w-full rounded-[14px] py-3.5 text-sm font-bold text-white transition-all active:scale-[0.97] ${
                loading ? "bg-text-tertiary" : direction === 1
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-sm"
                  : "bg-gradient-to-r from-green-500 to-green-600 shadow-sm"
              }`}>
              {loading ? "⏳ 开仓中..." : direction === 1 ? "🚀 做多开仓" : "🚀 做空开仓"}
            </button>

            {/* Funding Rate Info */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-text-tertiary pt-3 border-t border-border-tertiary/40">
              <span>资金费率: <span className="font-semibold text-brand-teal-dark">+0.0025%</span></span>
              <span>下次结算: <span className="font-semibold">~2h</span></span>
              <span>Max 杠杆: <span className="font-semibold">50x</span></span>
            </div>
          </div>
        )}

        {/* ── Fast Game Tab ── */}
        {tab === "fast" && (
          <div className="space-y-3">
            {/* BTC Exchange Price Card */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[16px] p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <div>
                  <div className="text-[10px] text-white/80 font-medium">交易所实时价格</div>
                  <div className="text-lg font-bold text-white tracking-tight">${cp ? cp.toLocaleString() : "—"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${cpChange >= 0 ? "text-green-200" : "text-red-200"}`}>
                  {cpChange >= 0 ? "▲" : "▼"} {Math.abs(cpChange).toFixed(2)}%
                </div>
                <div className="text-[9px] text-white/60">24h 涨跌</div>
              </div>
            </div>

            {/* 60s Countdown Bar */}
            <div className="bg-surface rounded-[14px] px-4 py-3 shadow-sm border border-border-tertiary">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary">本轮倒计时</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    countdown > 0 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                  }`}>{countdown > 0 ? "进行中" : "等待开始"}</span>
                </div>
                <span className={`text-lg font-bold ${countdown > 20 ? "text-brand-teal-dark" : countdown > 5 ? "text-brand-gold-dark" : countdown > 0 ? "text-red-500" : "text-text-tertiary"}`}>
                  {countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "—"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{
                  width: `${countdown > 0 ? (countdown / 60) * 100 : 0}%`,
                  background: countdown > 20
                    ? "linear-gradient(90deg, #45CCD5, #1D9E75)"
                    : countdown > 0
                      ? "linear-gradient(90deg, #F2B631, #DC2626)"
                      : "#E5E7EB",
                }} />
              </div>
            </div>

            {/* Bet Panel */}
            <div className="bg-surface rounded-[20px] p-4 shadow-sm border border-border-tertiary">
            {/* Countdown if betting */}
            {countdown > 0 && (
              <div className="bg-bg rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-xs text-text-secondary">本轮结算倒计时</span>
                <span className={`text-lg font-bold ${countdown > 60 ? "text-brand-teal-dark" : countdown > 20 ? "text-brand-gold-dark" : "text-red-500"}`}>
                  {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                </span>
              </div>
            )}

            {/* Game Type Tabs - 4 types */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[
                { k: "risefall", l: "📈 涨跌", odds: "0.8" },
                { k: "big", l: "🔴 大小", odds: "0.8" },
                { k: "odd", l: "🔵 单双", odds: "0.8" },
                { k: "tail", l: "🎯 尾号", odds: "8" },
              ].map(g => (
                <button key={g.k} onClick={() => setBetType(g.k)}
                  className={`rounded-[12px] py-2.5 text-center active:scale-95 transition-all ${
                    betType === g.k ? "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                  }`}>
                  <div className="text-[17px]">{g.l.split(" ")[0]}</div>
                  <div className="text-[10px] font-semibold">{g.l.split(" ")[1]}</div>
                  <div className="text-[8px] opacity-70">赔率 {g.odds}</div>
                </button>
              ))}
            </div>

            {/* Direction Selector (for risefall) */}
            {betType === "risefall" && (
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary mb-1.5 block">方向选择</label>
                <div className="flex gap-2">
                  <button onClick={() => setFastDirection("涨")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      fastDirection === "涨" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>📈 看涨</button>
                  <button onClick={() => setFastDirection("跌")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      fastDirection === "跌" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>📉 看跌</button>
                </div>
              </div>
            )}

            {/* Direction Selector (for big/small) */}
            {betType === "big" && (
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary mb-1.5 block">方向选择</label>
                <div className="flex gap-2">
                  <button onClick={() => setBsDirection("大")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      bsDirection === "大" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🔴 大 (50-99)</button>
                  <button onClick={() => setBsDirection("小")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      bsDirection === "小" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🟢 小 (00-49)</button>
                </div>
              </div>
            )}

            {/* Direction Selector (for odd/even) */}
            {betType === "odd" && (
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary mb-1.5 block">方向选择</label>
                <div className="flex gap-2">
                  <button onClick={() => setOeDirection("单")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      oeDirection === "单" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🔵 单 (1,3,5,7,9)</button>
                  <button onClick={() => setOeDirection("双")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      oeDirection === "双" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🟢 双 (0,2,4,6,8)</button>
                </div>
              </div>
            )}

            {/* Tail Number Picker (for tail) */}
            {betType === "tail" && (
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary mb-1.5 block">选择尾号 (0-9)</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i).map(n => (
                    <button key={n} onClick={() => setTailNumber(n)}
                      className={`w-full aspect-square rounded-[12px] text-sm font-bold flex items-center justify-center active:scale-90 transition-all ${
                        tailNumber === n ? "bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Rule hint */}
            <div className="mb-3 text-[10px] text-text-tertiary text-center bg-bg rounded-xl py-2">
              {betType === "big" ? "以平仓价最后两位数字判定 · 大(50-99) 小(00-49)" :
               betType === "odd" ? "以平仓价最后一位数字判定 · 单(1,3,5,7,9) 双(0,2,4,6,8)" :
               betType === "tail" ? "以平仓价最后一位数字判定 · 0-9 选1" :
               "平仓价 > 开仓价 = 涨 · 平仓价 < 开仓价 = 跌 · 持平全输"}
            </div>

            {/* Bet Points */}
            <div className="mb-2">
              <label className="text-[10px] text-text-tertiary">投注金额 (游戏豆)</label>
              <div className="mt-1.5 flex gap-2">
                {[100, 500, 1000, 5000].map(v => (
                  <button key={v} onClick={() => setBetPoints(String(v))}
                    className={`flex-1 rounded-[12px] py-2 text-xs font-medium transition ${
                      betPoints === String(v) ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>{v.toLocaleString()}</button>
                ))}
              </div>
            </div>

            {/* Odds & Expected Win */}
            <div className="flex items-center justify-between bg-bg rounded-xl px-3 py-2 mb-4">
              <span className="text-xs text-text-tertiary">
                赔率 <span className="font-bold text-text-primary">{betType === "tail" ? "8" : "0.8"}</span>
              </span>
              <span className="text-xs text-text-tertiary">
                预计收益 <span className="font-bold text-brand-teal-dark">
                  {betType === "tail"
                    ? (parseInt(betPoints) * 8 + parseInt(betPoints)).toLocaleString()
                    : (parseInt(betPoints) * 0.8 + parseInt(betPoints)).toLocaleString()
                  } 🪙
                </span>
              </span>
            </div>

            <button onClick={placeFastBet} disabled={loading}
              className={`w-full rounded-[14px] py-3 text-sm font-semibold text-white transition ${
                loading ? "bg-text-tertiary" : "bg-gradient-to-r from-brand-teal to-brand-teal-dark shadow-sm active:scale-[0.97]"
              }`}>
              {loading ? "⏳" : countdown > 0 ? `⏳ ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "开始"}
            </button>
          </div>
          </div>
        )}

        {/* ── Positions Tab ── */}
        {tab === "positions" && (
          <div className="bg-surface rounded-[20px] overflow-hidden shadow-sm border border-border-tertiary">
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-semibold">持有仓位 ({simPositions.length})</span>
              <span className="text-[11px] text-text-tertiary">实时盈亏</span>
            </div>
            {simPositions.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-4xl opacity-50 mb-2">📋</div>
                <p className="text-xs text-text-tertiary">暂无持仓，去合约交易开仓</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg">
                      <th className="text-left py-2.5 px-3 font-medium text-text-tertiary">方向</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">开仓价</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">标记价</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">保证金</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">杠杆</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">未实现盈亏</th>
                      <th className="text-center py-2.5 px-2 font-medium text-text-tertiary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simPositions.map(pos => {
                      const pnlColor = pos.unrealized_pnl >= 0 ? "text-red-500" : "text-green-500";
                      const isLiquidated = pos.side === 1 ? cp <= pos.liquidation_price : cp >= pos.liquidation_price;
                      return (
                        <tr key={pos.id} className={`border-t border-border-tertiary/40 ${isLiquidated ? "bg-red-50" : ""}`}>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pos.side === 1 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                              {pos.side === 1 ? "多" : "空"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">${pos.entry_price.toLocaleString()}</td>
                          <td className="py-3 px-2 text-right font-medium">{cp ? "$" + cp.toLocaleString() : "—"}</td>
                          <td className="py-3 px-2 text-right">{pos.margin}</td>
                          <td className="py-3 px-2 text-right">{pos.leverage}x</td>
                          <td className={`py-3 px-2 text-right font-bold ${pnlColor}`}>
                            {pos.unrealized_pnl >= 0 ? "+" : ""}{pos.unrealized_pnl.toFixed(1)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {isLiquidated ? (
                              <span className="text-[10px] text-red-500 font-bold">⚠️ 爆仓</span>
                            ) : (
                              <button onClick={() => closePosition(pos.id)}
                                className="px-2.5 py-1 rounded-full bg-bg border border-border-tertiary text-[10px] text-text-secondary active:scale-90">平仓</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <div className="bg-surface rounded-[20px] overflow-hidden shadow-sm border border-border-tertiary">
            {(() => {
              // Demo orders for visual alignment
              const demoOrders = [
                { id: "BET88421", type: "small", amount: 500, pnl: 400, win: true },
                { id: "BET88415", type: "rise", amount: 1000, pnl: -1000, win: false },
                { id: "BET88409", type: "tail-3", amount: 200, pnl: 1800, win: true },
              ];
              return (
                <>
                  <div className="flex items-center justify-between p-4 pb-2">
                    <span className="text-sm font-semibold">我的订单</span>
                    <span className="text-[11px] text-text-tertiary">近3条</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-bg">
                          <th className="text-left py-2.5 px-4 font-medium text-text-tertiary">订单号</th>
                          <th className="text-left py-2.5 px-2 font-medium text-text-tertiary">类型</th>
                          <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">金额</th>
                          <th className="text-right py-2.5 px-4 font-medium text-text-tertiary">盈亏</th>
                        </tr>
                      </thead>
                      <tbody>
                        {demoOrders.map((o, i) => (
                          <tr key={i} className="border-t border-border-tertiary/40">
                            <td className="py-3 px-4 font-medium text-text-primary">{o.id}</td>
                            <td className="py-3 px-2 text-text-secondary">{o.type}</td>
                            <td className="py-3 px-2 text-right text-text-primary">{o.amount.toLocaleString()}</td>
                            <td className={`py-3 px-4 text-right font-bold ${o.win ? "text-red-500" : "text-green-500"}`}>
                              {o.pnl >= 0 ? "+" : ""}{o.pnl.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </main>
  );
}
