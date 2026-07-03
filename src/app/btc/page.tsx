"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { API_BASE } from "@/config/api";

interface Quote { price: number; change_pct: number }
interface Round { round_id: number; round_no: string; status: string; remaining: number; lucky_number?: number | null }
interface BetRecord {
  id: number; round_id: number; bet_type: string; choice: string;
  points: number; multiplier: number; is_win: number | null;
  settle_points: number; settle_status: number;
  created_at: string; lucky_number?: number;
  round_no?: string; round_status?: string;
}
interface PositionRecord {
  id: number; order_sn: string; direction: number; period: number;
  leverage: number; open_price: number; points: number;
  current_price?: number; floating_pl?: number;
  direction_label?: string; profit_rate?: number; remaining_days?: number;
  expire_at: number; created_at: number;
}
interface OrderRecord {
  id: number; order_sn: string; direction: number;
  open_price: number; close_price: number; points: number;
  profit_loss_points: number; is_win?: boolean;
  direction_label?: string; close_type: string;
  created_at: number; closed_at: number;
}

export default function BTCGamePage() {
  const [tab, setTab] = useState<"predict" | "fast" | "positions" | "orders">("fast");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [message, setMessage] = useState("");
  const [priceFlash, setPriceFlash] = useState<boolean | null>(null);

  // Backend data
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [fastBets, setFastBets] = useState<BetRecord[]>([]);

  // Predict form (futures trading)
  const [direction, setDirection] = useState<1 | 2>(1);
  const [leverage, setLeverage] = useState(1);
  const [marginAmount, setMarginAmount] = useState("100");

  // Fast game
  const [betType, setBetType] = useState("risefall");
  const [betPoints, setBetPoints] = useState("100");
  const [fastDirection, setFastDirection] = useState("涨");
  const [bsDirection, setBsDirection] = useState("大");
  const [oeDirection, setOeDirection] = useState("单");
  const [tailNumber, setTailNumber] = useState<number | null>(null);
  const [localCountdown, setLocalCountdown] = useState(0); // 投注后60s本地倒计时
  const [activeBetId, setActiveBetId] = useState<number | null>(null); // 当前待结算的bet

  const api = async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${API_BASE}/api/backend/${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts?.headers },
    });
    return res.json();
  };

  const loadData = useCallback(async () => {
    const [q, r] = await Promise.all([
      api("btc-game/quote"),
      api("btc-game/fast-status").catch(() => null),
    ]);
    if (q?.result === 1) {
      const oldPrice = quote?.price || 0;
      const newPrice = q.data.price;
      if (oldPrice > 0 && newPrice !== oldPrice) {
        setPriceFlash(newPrice > oldPrice);
        setTimeout(() => setPriceFlash(null), 800);
      }
      setQuote(q.data);
    }
    if (r?.result === 1) {
      setRound(r.data);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    const res = await api("btc-game/positions");
    if (res?.result === 1) setPositions(res.data?.list || []);
  }, []);

  const loadOrders = useCallback(async () => {
    const res = await api("btc-game/history");
    if (res?.result === 1) setOrders(res.data?.list || []);
  }, []);

  const loadFastBets = useCallback(async () => {
    const res = await api("btc-game/fast-my-bets");
    if (res?.result === 1) setFastBets(res.data?.list || []);
  }, []);

  // 定时轮询报价+轮次
  useEffect(() => { loadData(); const iv = setInterval(loadData, 5000); return () => clearInterval(iv); }, [loadData]);

  // 切Tab时加载数据
  useEffect(() => {
    if (tab === "positions") loadPositions();
    if (tab === "orders") loadOrders();
    if (tab === "fast") loadFastBets();
  }, [tab, loadPositions, loadOrders, loadFastBets]);

  // 投注后60秒本地倒计时 → 到0自动结算
  useEffect(() => {
    if (localCountdown <= 0) return;
    const iv = setInterval(() => setLocalCountdown(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [localCountdown > 0]);

  // 倒计时归零 → 自动结算
  useEffect(() => {
    if (localCountdown > 0 || !activeBetId || settling) return;
    const doSettle = async () => {
      setSettling(true);
      try {
        const res = await api("btc-game/fast-settle", {
          method: "POST",
          body: JSON.stringify({ bet_id: activeBetId }),
        });
        if (res?.result === 1) {
          const isWin = res.data?.is_win;
          const points = res.data?.profit || 0;
          setMessage(isWin ? `✅ 赢了! +${points} ✨` : `❌ 输了 -${betPoints} 🎮`);
          setActiveBetId(null);
          loadFastBets();
        } else {
          setMessage("❌ " + (res?.msg || "结算失败"));
        }
      } catch { setMessage("❌ 结算出错"); }
      setSettling(false);
    };
    const t = setTimeout(doSettle, 500);
    return () => clearTimeout(t);
  }, [localCountdown, activeBetId]);

  const openPosition = async () => {
    const pts = parseInt(marginAmount);
    if (pts < 100) { setMessage("❌ 最少100保证金"); return; }
    setLoading(true); setMessage("");
    const res = await api("btc-game/open", { method: "POST", body: JSON.stringify({ direction, period: 1, leverage, points: pts }) });
    setLoading(false);
    if (res?.result === 1) {
      setMessage("✅ 开仓成功! 方向:" + (direction === 1 ? "做多" : "做空") + " 杠杆:" + leverage + "x");
      loadPositions();
    } else {
      setMessage("❌ " + (res?.msg || "开仓失败"));
    }
  };

  const closePosition = async (tradeId: number) => {
    setLoading(true);
    const res = await api("btc-game/close", { method: "POST", body: JSON.stringify({ trade_id: tradeId }) });
    setLoading(false);
    if (res?.result === 1) {
      setMessage(`✅ 已平仓! 盈亏: ${res.data?.pl_points >= 0 ? "+" : ""}${res.data?.pl_points ?? 0} (🎮本金+✨盈利)`);
      loadPositions();
    } else {
      setMessage("❌ " + (res?.msg || "平仓失败"));
    }
  };

  const closeFastBet = async (tradeId: number) => {
    setLoading(true);
    const res = await api("btc-game/close", { method: "POST", body: JSON.stringify({ trade_id: tradeId }) });
    setLoading(false);
    setMessage(res?.result === 1 ? "✅ 平仓成功" : "❌ " + (res?.msg || "平仓失败"));
    loadPositions();
  };

  const placeFastBet = async () => {
    setLoading(true); setMessage(""); setLocalCountdown(0);

    // 映射前端类型 → 后端 bet_type + choice
    // risefall: 涨/跌(比价格) | big: 大/小(比尾号) | odd: 单/双(比尾号) | tail: 尾号
    let backendBetType = "";
    let backendChoice = "";
    let label = "";
    if (betType === "risefall") {
      backendBetType = "risefall";
      backendChoice = fastDirection;
      label = fastDirection;
    } else if (betType === "big") {
      backendBetType = "bigsmall";
      backendChoice = bsDirection;
      label = bsDirection;
    } else if (betType === "odd") {
      backendBetType = "oddeven";
      backendChoice = oeDirection;
      label = oeDirection;
    } else if (betType === "tail") {
      if (tailNumber === null) { setMessage("❌ 请选择尾号 (0-9)"); setLoading(false); return; }
      backendBetType = "tail";
      backendChoice = String(tailNumber);
      label = `尾号 ${tailNumber}`;
    }

    const res = await api("btc-game/fast-bet", {
      method: "POST",
      body: JSON.stringify({
        bet_type: backendBetType,
        choice: backendChoice,
        points: parseInt(betPoints),
      }),
    });
    setLoading(false);
    if (res?.result === 1) {
      setMessage(`✅ 投注成功! ${label} · 60秒后开奖`);
      setActiveBetId(res.data?.bet_id || 0);
      setLocalCountdown(60);
      loadFastBets();
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
            <span className={`ml-auto text-sm font-bold ${cpChange > 0 ? "text-red-500" : cpChange < 0 ? "text-green-500" : "text-text-tertiary"}`}>
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
              <div className={`text-sm font-bold ${cpChange > 0 ? "text-green-200" : cpChange < 0 ? "text-red-200" : "text-white/60"}`}>
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
                  <span className="font-semibold">{(parseInt(marginAmount || "0") * leverage).toLocaleString()} 🎮</span>
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
                    {direction === 1 ? "+" : "-"}{(parseInt(marginAmount || "0") * leverage * 0.01).toFixed(1)} 🎮
                  </span>
                </div>
              </div>
            )}

            <button onClick={openPosition} disabled={loading}
              className={`w-full rounded-[14px] py-3.5 text-sm font-bold text-white transition-all active:scale-[0.97] ${
                loading ? "bg-text-tertiary" : direction === 1
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-sm"
                  : "bg-gradient-to-r from-green-500 to-green-600 shadow-sm"
              }`}>
              {loading ? "⏳ 开仓中..." : direction === 1 ? "🚀 做多开仓" : "🚀 做空开仓"}
            </button>

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
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[16px] p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <div>
                  <div className="text-[10px] text-white/80 font-medium">交易所实时价格</div>
                  <div className="text-lg font-bold text-white tracking-tight">${cp ? cp.toLocaleString() : "—"}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${cpChange > 0 ? "text-green-200" : cpChange < 0 ? "text-red-200" : "text-white/50"}`}>
                  {cp > 0 ? (cpChange >= 0 ? "▲" : "▼") + " " + Math.abs(cpChange).toFixed(2) + "%" : "—"}
                </div>
                <div className="text-[9px] text-white/60">24h 涨跌</div>
              </div>
            </div>

            {/* Countdown Bar */}
            <div className="bg-surface rounded-[14px] px-4 py-3 shadow-sm border border-border-tertiary">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-secondary">本轮倒计时</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    localCountdown > 0 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                  }`}>{localCountdown > 0 ? "进行中" : settling ? "结算中..." : "等待开始"}</span>
                </div>
                <span className={`text-lg font-bold ${localCountdown > 20 ? "text-brand-teal-dark" : localCountdown > 5 ? "text-brand-gold-dark" : localCountdown > 0 ? "text-red-500" : "text-text-tertiary"}`}>
                  {localCountdown > 0 ? `${Math.floor(localCountdown / 60)}:${String(localCountdown % 60).padStart(2, "0")}` : "—"}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{
                  width: `${localCountdown > 0 ? (localCountdown / 60) * 100 : 0}%`,
                  background: localCountdown > 20
                    ? "linear-gradient(90deg, #45CCD5, #1D9E75)"
                    : localCountdown > 0
                      ? "linear-gradient(90deg, #F2B631, #DC2626)"
                      : "#E5E7EB",
                }} />
              </div>
            </div>

            {/* Bet Panel */}
            <div className="bg-surface rounded-[20px] p-4 shadow-sm border border-border-tertiary">
            {/* Game Type Tabs */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[
                { k: "risefall", l: "📈 涨跌", odds: "1.8" },
                { k: "big", l: "🔴 大小", odds: "1.8" },
                { k: "odd", l: "🔵 单双", odds: "1.8" },
                { k: "tail", l: "🎯 尾号", odds: "8.5" },
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

            {/* Direction Selectors */}
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
            {betType === "big" && (
              <div className="mb-4">
                <label className="text-[10px] text-text-tertiary mb-1.5 block">方向选择</label>
                <div className="flex gap-2">
                  <button onClick={() => setBsDirection("大")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      bsDirection === "大" ? "bg-red-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🔴 大 (5-9)</button>
                  <button onClick={() => setBsDirection("小")}
                    className={`flex-1 rounded-[14px] py-2.5 text-xs font-semibold transition ${
                      bsDirection === "小" ? "bg-green-500 text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
                    }`}>🟢 小 (0-4)</button>
                </div>
              </div>
            )}
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
              {betType === "big" ? "以BTC价格尾号数字判定 · 大(5-9) 小(0-4)" :
               betType === "odd" ? "以BTC价格尾号数字判定 · 单(1,3,5,7,9) 双(0,2,4,6,8)" :
               betType === "tail" ? "以BTC价格尾号数字判定 · 中奖赔率8.5倍" :
               "BTC价格尾号 ≥5 = 涨, <5 = 跌 · 60秒一轮"}
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
                赔率 <span className="font-bold text-text-primary">{betType === "tail" ? "8.5" : "1.8"}</span>
              </span>
              <span className="text-xs text-text-tertiary">
                预计收益 <span className="font-bold text-brand-teal-dark">
                  {betType === "tail"
                    ? (parseInt(betPoints) * 8.5).toLocaleString()
                    : (parseInt(betPoints) * 1.8).toLocaleString()
                  } ✨
                </span>
              </span>
            </div>

            <button onClick={placeFastBet} disabled={loading || settling || localCountdown <= 0}
              className={`w-full rounded-[14px] py-3 text-sm font-semibold text-white transition ${
                loading || settling ? "bg-text-tertiary" : localCountdown <= 0 ? "bg-text-tertiary/50" : "bg-gradient-to-r from-brand-teal to-brand-teal-dark shadow-sm active:scale-[0.97]"
              }`}>
              {settling ? "⏳ 结算中..." : loading ? "⏳" : localCountdown <= 0 ? "⏳ 等待开奖" : "🎲 投注"}
            </button>
          </div>

            {/* My Fast Bets */}
            {fastBets.length > 0 && (
              <div className="bg-surface rounded-[20px] p-4 shadow-sm border border-border-tertiary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">本轮投注</span>
                  <span className="text-[10px] text-text-tertiary">{fastBets.length} 注</span>
                </div>
                <div className="space-y-1.5">
                  {fastBets.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-bg rounded-xl px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-text-tertiary">
                          {b.bet_type === "big" ? (b.choice === "big" ? "📈涨" : "📉跌") :
                           b.bet_type === "small" ? (b.choice === "big" ? "🔴大" : "🟢小") :
                           b.bet_type === "odd" ? (b.choice === "odd" ? "🔵单" : "🟢双") :
                           `🎯尾号${b.choice}`}
                        </span>
                        <span className="font-medium">{b.points} 🎮</span>
                      </div>
                      <span className={b.is_win === 1 ? "text-red-500 font-bold" : b.is_win === 0 ? "text-green-600" : "text-text-tertiary"}>
                        {b.is_win === 1 ? "✅ 赢" : b.is_win === 0 ? "❌ 输" : "⏳ 待开奖"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Positions Tab ── */}
        {tab === "positions" && (
          <div className="bg-surface rounded-[20px] overflow-hidden shadow-sm border border-border-tertiary">
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-semibold">持有仓位 ({positions.length})</span>
              <button onClick={loadPositions} className="text-[11px] text-brand-teal-dark">🔄 刷新</button>
            </div>
            {positions.length === 0 ? (
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
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">保证金</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">杠杆</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">浮动盈亏</th>
                      <th className="text-center py-2.5 px-2 font-medium text-text-tertiary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(p => (
                      <tr key={p.id} className="border-t border-border-tertiary/40">
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.direction === 1 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {p.direction === 1 ? "多" : "空"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">${p.open_price.toLocaleString()}</td>
                        <td className="py-3 px-2 text-right">{p.points}</td>
                        <td className="py-3 px-2 text-right">{p.leverage}x</td>
                        <td className={`py-3 px-2 text-right font-bold ${(p.floating_pl || 0) >= 0 ? "text-red-500" : "text-green-500"}`}>
                          {(p.floating_pl || 0) >= 0 ? "+" : ""}{p.floating_pl ?? 0}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button onClick={() => closePosition(p.id)}
                            className="px-2.5 py-1 rounded-full bg-bg border border-border-tertiary text-[10px] text-text-secondary active:scale-90">
                            平仓
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <div className="bg-surface rounded-[20px] overflow-hidden shadow-sm border border-border-tertiary">
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-semibold">历史订单 ({orders.length})</span>
              <button onClick={loadOrders} className="text-[11px] text-brand-teal-dark">🔄 刷新</button>
            </div>
            {orders.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-4xl opacity-50 mb-2">📜</div>
                <p className="text-xs text-text-tertiary">暂无订单记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bg">
                      <th className="text-left py-2.5 px-3 font-medium text-text-tertiary">方向</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">开仓</th>
                      <th className="text-right py-2.5 px-2 font-medium text-text-tertiary">金额</th>
                      <th className="text-right py-2.5 px-3 font-medium text-text-tertiary">盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} className="border-t border-border-tertiary/40">
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.direction === 1 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {o.direction === 1 ? "多" : "空"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">${(o.open_price || 0).toLocaleString()}</td>
                        <td className="py-3 px-2 text-right text-text-primary">{o.points}</td>
                        <td className={`py-3 px-3 text-right font-bold ${(o.profit_loss_points || 0) >= 0 ? "text-red-500" : "text-green-500"}`}>
                          {o.profit_loss_points >= 0 ? "+" : ""}{o.profit_loss_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
