"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, TrendingUp, AlertTriangle, ChevronDown, BarChart3, Activity, Shield, Zap, DollarSign, RefreshCw, Clock, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import { API_BASE } from "@/config/api";

interface PredictionData {
  current_price: number; signal: string; score: number; confidence: number;
  target_up: number; target_down: number; support: number; resistance: number;
  indicators: { rsi_14: number; macd_hist: number; bb_upper: number; bb_lower: number; ma_7: number; ma_25: number; ma_99: number; funding_rate: number; long_short_ratio: number; vol_ratio_1h: number; volatility: number; oi_billion_usd: number };
  returns: { "6h": number; "12h": number; "24h": number };
  model_breakdown: Record<string, number>;
  market_data: { price: number; high_24h: number; low_24h: number; change_24h_pct: number; volume_24h: number; market_cap: number; funding_rate: number; open_interest_usd: number; long_short_ratio: number };
}

function getSignalInfo(signal: string) {
  const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    bullish: { label: "看涨", color: "#DC2626", bg: "rgba(220,38,38,0.1)", icon: "🚀" },
    cautious_bullish: { label: "谨慎看涨", color: "#EA580C", bg: "rgba(234,88,12,0.1)", icon: "📈" },
    neutral: { label: "中性观望", color: "#6B7280", bg: "rgba(107,114,128,0.1)", icon: "⏳" },
    cautious_bearish: { label: "谨慎看跌", color: "#CA8A04", bg: "rgba(202,138,4,0.1)", icon: "📉" },
    bearish: { label: "看跌", color: "#059669", bg: "rgba(5,150,105,0.1)", icon: "🛑" },
  };
  return map[signal] || map.neutral;
}

function formatPrice(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
function formatLarge(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toFixed(0);
}

export default function BTCPredictPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/v2/btc/predict");
      const json = await res.json();
      if (json.code !== 0) throw new Error(json.msg || "请求失败");
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrediction(); }, []);

  // Auto refresh every 60s
  useEffect(() => {
    const iv = setInterval(fetchPrediction, 60000);
    return () => clearInterval(iv);
  }, []);

  // Draw mini price chart
  useEffect(() => {
    if (!data || !chartRef.current) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const pad = 4, drawW = w - pad*2, drawH = h - pad*2;
    ctx.clearRect(0,0,w,h);
    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 0.5;
    for (let i=0; i<4; i++) { const y=pad+(drawH/3)*i; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
    // Simulated price path for demo
    const price = data.current_price;
    const points = 60;
    const closes = [];
    let p = price * 0.98;
    for (let i=0; i<points; i++) {
      p += (Math.random() - 0.48) * price * 0.01;
      closes.push(p);
    }
    closes[closes.length-1] = price;
    const mn = Math.min(...closes), mx = Math.max(...closes), range = mx - mn || 1;
    ctx.strokeStyle = "#F7931A"; ctx.lineWidth = 2; ctx.beginPath();
    closes.forEach((c, i) => { const x=pad+(i/(points-1))*drawW, y=pad+drawH-((c-mn)/range)*drawH; i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
    ctx.stroke();
    const grad = ctx.createLinearGradient(0,pad,0,pad+drawH);
    grad.addColorStop(0, "rgba(247,147,26,0.15)"); grad.addColorStop(1, "rgba(247,147,26,0.01)");
    ctx.lineTo(pad+drawW, pad+drawH); ctx.lineTo(pad, pad+drawH); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  }, [data]);

  const sigInfo = data ? getSignalInfo(data.signal) : null;

  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-5 pt-6 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[20px]" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">₿</span>
              <h1 className="text-lg font-bold text-white">BTC 预测</h1>
            </div>
            <p className="text-[11px] text-white/80">7模型融合 · 实时数据 · 60s自动刷新</p>
          </div>
          <button onClick={fetchPrediction} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform" disabled={loading}>
            <RefreshCw className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {/* Price */}
        {data && (
          <div className="mt-4 text-center relative z-10">
            <div className="text-3xl font-bold text-white tracking-tight">${formatPrice(data.current_price)}</div>
            <div className={`mt-1 text-sm font-medium ${data.market_data.change_24h_pct >= 0 ? "text-green-200" : "text-red-200"}`}>
              {data.market_data.change_24h_pct >= 0 ? "▲" : "▼"} {Math.abs(data.market_data.change_24h_pct).toFixed(2)}%（24h）
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 relative z-20">
        {/* Signal Card */}
        {sigInfo && (
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-semibold">AI 策略研判</span>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1" style={{ background: sigInfo.bg, color: sigInfo.color }}>
                {sigInfo.icon} {sigInfo.label}
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-tertiary mb-1">
                <span>综合评分</span>
                <span className="font-bold" style={{ color: data!.score >= 62 ? "#DC2626" : data!.score >= 38 ? "#6B7280" : "#059669" }}>{data!.score} / 100</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${data!.score}%`,
                  background: data!.score >= 62 ? "linear-gradient(90deg, #F7931A, #DC2626)" : data!.score >= 38 ? "#9CA3AF" : "linear-gradient(90deg, #10B981, #059669)"
                }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary mb-0.5">置信度</div>
                <div className="text-base font-bold text-brand-teal-dark">{data!.confidence}%</div>
              </div>
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary mb-0.5">目标上</div>
                <div className="text-sm font-bold text-red-500">${formatPrice(data!.target_up)}</div>
              </div>
              <div className="bg-bg rounded-xl p-2.5 text-center">
                <div className="text-[10px] text-text-tertiary mb-0.5">目标下</div>
                <div className="text-sm font-bold text-green-500">${formatPrice(data!.target_down)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Mini Chart */}
        <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold">价格趋势</span>
          </div>
          <canvas ref={chartRef} className="w-full" style={{ height: "100px" }} />
        </div>

        {/* Market Data Grid */}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "24h 高点", val: `$${formatPrice(data.market_data.high_24h)}`, color: "#DC2626" },
                { label: "24h 低点", val: `$${formatPrice(data.market_data.low_24h)}`, color: "#10B981" },
                { label: "24h 成交量", val: formatLarge(data.market_data.volume_24h) + " BTC", color: "#6B7280" },
                { label: "市值", val: "$" + formatLarge(data.market_data.market_cap), color: "#6B7280" },
              ].map((item, i) => (
                <div key={i} className="bg-surface rounded-[8px] p-3 shadow-sm border border-border-tertiary">
                  <div className="text-[10px] text-text-tertiary">{item.label}</div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>

            {/* Derivatives Data */}
            <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-semibold">衍生品市场</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "资金费率", val: data.indicators.funding_rate + "%", status: data.indicators.funding_rate > 0.01 ? "偏高" : data.indicators.funding_rate < -0.01 ? "偏低" : "正常", color: data.indicators.funding_rate > 0.01 ? "#DC2626" : data.indicators.funding_rate < -0.01 ? "#10B981" : "#6B7280", desc: "永续合约多空持仓成本" },
                  { label: "多空比", val: data.indicators.long_short_ratio.toFixed(2), status: data.indicators.long_short_ratio > 1.5 ? "多头拥挤" : data.indicators.long_short_ratio < 0.8 ? "空头拥挤" : "均衡", color: data.indicators.long_short_ratio > 1.5 ? "#DC2626" : data.indicators.long_short_ratio < 0.8 ? "#10B981" : "#6B7280", desc: "多头 vs 空头账户数比" },
                  { label: "未平仓合约", val: "$" + data.indicators.oi_billion_usd.toFixed(2) + "B", status: data.indicators.oi_billion_usd > 25 ? "高位" : data.indicators.oi_billion_usd < 15 ? "低位" : "正常", color: data.indicators.oi_billion_usd > 25 ? "#DC2626" : data.indicators.oi_billion_usd < 15 ? "#10B981" : "#6B7280", desc: "合约总持仓量，反映资金参与度" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-tertiary/40 last:border-0">
                    <div>
                      <div className="text-xs text-text-secondary">{item.label}</div>
                      <div className="text-[10px] text-text-tertiary">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{item.val}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: item.color + "15", color: item.color }}>{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-semibold">技术指标</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "RSI (14)", val: data.indicators.rsi_14.toFixed(1), status: data.indicators.rsi_14 < 30 ? "超卖 🟢" : data.indicators.rsi_14 > 70 ? "超买 🔴" : "中性 ⚪", color: data.indicators.rsi_14 < 30 ? "#10B981" : data.indicators.rsi_14 > 70 ? "#DC2626" : "#6B7280" },
                  { label: "MACD柱", val: data.indicators.macd_hist.toFixed(1), status: data.indicators.macd_hist > 0 ? "多头 🔴" : "空头 🟢", color: data.indicators.macd_hist > 0 ? "#DC2626" : "#10B981" },
                  { label: "布林带上轨", val: "$" + formatPrice(data.indicators.bb_upper), status: "", color: "#6B7280" },
                  { label: "布林带下轨", val: "$" + formatPrice(data.indicators.bb_lower), status: "", color: "#6B7280" },
                  { label: "MA7", val: "$" + formatPrice(data.indicators.ma_7), status: data.current_price > data.indicators.ma_7 ? "上方 🔴" : "下方 🟢", color: data.current_price > data.indicators.ma_7 ? "#DC2626" : "#10B981" },
                  { label: "MA25", val: "$" + formatPrice(data.indicators.ma_25), status: data.current_price > data.indicators.ma_25 ? "上方 🔴" : "下方 🟢", color: data.current_price > data.indicators.ma_25 ? "#DC2626" : "#10B981" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-tertiary/40 last:border-0">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{item.val}</span>
                      {item.status && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: item.color + "15", color: item.color }}>{item.status}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Returns */}
            <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary mb-3">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-semibold">区间涨跌</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "6h", val: data.returns["6h"] },
                  { label: "12h", val: data.returns["12h"] },
                  { label: "24h", val: data.returns["24h"] },
                ].map((r, i) => (
                  <div key={i} className="bg-bg rounded-xl p-3 text-center">
                    <div className="text-[10px] text-text-tertiary">{r.label}</div>
                    <div className={`text-base font-bold ${r.val >= 0 ? "text-red-500" : "text-green-500"}`}>{r.val >= 0 ? "+" : ""}{r.val.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Breakdown */}
            <details className="bg-surface rounded-[8px] overflow-hidden shadow-sm border border-border-tertiary mb-3">
              <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold">
                <span>7模型评分明细</span>
                <ChevronDown className="w-4 h-4 text-text-tertiary" />
              </summary>
              <div className="px-4 pb-4 space-y-2">
                {[
                  { key: "technical", label: "技术分析" },
                  { key: "funding", label: "资金费率" },
                  { key: "long_short", label: "多空比" },
                  { key: "volume", label: "成交量/OI" },
                  { key: "momentum", label: "动量" },
                  { key: "volatility", label: "波动率" },
                  { key: "structure", label: "市场结构" },
                ].map((m) => {
                  const val = data.model_breakdown[m.key] || 50;
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary w-14">{m.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{
                          width: `${val}%`,
                          background: val >= 62 ? "linear-gradient(90deg, #F7931A, #DC2626)" : val >= 38 ? "#9CA3AF" : "linear-gradient(90deg, #10B981, #059669)",
                        }} />
                      </div>
                      <span className={`text-[11px] font-bold w-8 text-right ${val >= 62 ? "text-red-500" : val >= 38 ? "text-text-tertiary" : "text-green-500"}`}>{Math.round(val)}</span>
                    </div>
                  );
                })}
              </div>
            </details>

            {/* Data Sources */}
            <div className="text-center py-4">
              <div className="text-[10px] text-text-tertiary">
                数据来源: Binance · CoinGecko · 7模型融合预测
              </div>
              <div className="text-[9px] text-text-tertiary mt-1">
                本数据仅供参考，不构成投资建议 · 60s自动刷新
              </div>
            </div>
          </>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex flex-col items-center py-20 text-text-tertiary">
            <RefreshCw className="w-10 h-10 animate-spin mb-3 text-orange-500" />
            <div className="text-sm">加载 BTC 市场数据 + 模型计算...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={fetchPrediction} className="ml-auto text-xs underline">重试</button>
          </div>
        )}
      </div>

      {/* ── 下注面板 ── */}
      <div className="px-4 mt-4">
        <BTCBetPanel />
      </div>

    </main>
  );
}

/** BTC 下注面板组件 */
function BTCBetPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"predict" | "record">("predict");
  const [direction, setDirection] = useState<"up" | "down" | "flat" | null>(null);
  const [amount, setAmount] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const AMOUNTS = [100, 200, 500, 1000];
  const MULTIPLIERS: Record<string, number> = { up: 1.8, down: 1.8, flat: 3.2 };

  // ── 获取余额 ──
  const fetchBalance = useCallback(() => {
    if (!user) return;
    fetch(`/api/wallet-data?uid=${user.uid}&action=balance`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setBalance(d.data?.credit1 || 0); })
      .catch(() => {});
  }, [user]);
  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // ── 倒计时 ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { fetchBalance(); return 60; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchBalance]);

  // ── 获取参与记录 ──
  const fetchRecords = useCallback(() => {
    if (!user) return;
    setRecordsLoading(true);
    fetch(`/api/backend/btc-game/fast-status?uid=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.bets) setRecords(d.data.bets.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setRecordsLoading(false));
  }, [user]);
  useEffect(() => { if (tab === "record") fetchRecords(); }, [tab, fetchRecords]);

  // ── 参与 ──
  const handleBet = async () => {
    if (!user) { setMsg("请先登录"); setTimeout(() => setMsg(""), 1500); return; }
    if (!direction) { setMsg("请选择方向"); setTimeout(() => setMsg(""), 1500); return; }
    if (balance !== null && amount > balance) { setMsg(`🎮游戏豆不足 (余额: ${balance})`); setTimeout(() => setMsg(""), 2500); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/backend/btc-game/fast-bet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniacid: 7,
          bet_type: "risefall",
          choice: direction === "up" ? "涨" : direction === "down" ? "跌" : "横",
          points: amount,
        }),
      });
      const json = await res.json();
      if (json.result === 1) {
        setMsg(`✅ 参与成功! 60s后结算 · ⛏️${Math.floor(amount * MULTIPLIERS[direction] * 0.8)}石`);
        setDirection(null);
        fetchBalance();
      } else {
        setMsg(`❌ ${json.msg || "参与失败"}`);
      }
    } catch { setMsg("❌ 网络错误"); }
    setSubmitting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const canBet = !!direction && !!user;

  return (
    <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab */}
      <div className="flex border-b border-gray-50">
        <button onClick={() => setTab("predict")}
          className={`flex-1 py-2.5 text-[12px] font-medium text-center transition-colors ${tab === "predict" ? "text-brand-teal-dark border-b-2 border-brand-teal" : "text-text-tertiary"}`}>
          本轮预测
        </button>
        <button onClick={() => setTab("record")}
          className={`flex-1 py-2.5 text-[12px] font-medium text-center transition-colors ${tab === "record" ? "text-brand-teal-dark border-b-2 border-brand-teal" : "text-text-tertiary"}`}>
          我的记录
        </button>
      </div>

      {tab === "predict" ? (
        <div className="px-4 py-4">
          {/* 余额 + 倒计时 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins size={14} className="text-brand-gold-dark" />
              <span className="text-[12px] font-semibold text-text-primary">
                🎮 {balance !== null ? balance.toLocaleString() : "—"}
              </span>
              {!user && <span className="text-[10px] text-text-tertiary">登录显示余额</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-brand-coral" />
              <span className="text-[13px] font-bold text-brand-coral">{timeLeft}s</span>
            </div>
          </div>

          {/* 方向选择 */}
          <div className="text-[11px] text-text-secondary mb-2">选择方向</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { key: "up" as const, label: "看涨", mult: "1.8x", color: "bg-red-50 border-red-300 text-red-600", usual: "bg-gray-50 border-gray-100 text-text-secondary" },
              { key: "flat" as const, label: "横盘", mult: "3.2x", color: "bg-gray-50 border-gray-300 text-text-primary", usual: "bg-gray-50 border-gray-100 text-text-secondary" },
              { key: "down" as const, label: "看跌", mult: "1.8x", color: "bg-green-50 border-green-300 text-green-600", usual: "bg-gray-50 border-gray-100 text-text-secondary" },
            ].map(d => (
              <button key={d.key} onClick={() => setDirection(d.key)}
                className={`py-3 rounded-[10px] text-[13px] font-semibold border transition-all active:scale-95 ${direction === d.key ? d.color : d.usual}`}>
                {d.label}<br /><span className="text-[10px] font-normal">{d.mult}</span>
              </button>
            ))}
          </div>

          {/* 参与额 */}
          <div className="text-[11px] text-text-secondary mb-2">参与数量</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(a)}
                disabled={balance !== null && a > balance}
                className={`py-2.5 rounded-[8px] text-[13px] font-semibold border transition-all active:scale-95 ${amount === a ? "bg-brand-teal-light/50 border-brand-teal text-brand-teal-dark" : "bg-gray-50 border-gray-100 text-text-secondary"} ${balance !== null && a > balance ? "opacity-30 cursor-not-allowed" : ""}`}>
                {a}🎮
              </button>
            ))}
          </div>

          {/* 确认按钮 */}
          <button onClick={handleBet} disabled={submitting || !canBet}
            className="w-full py-3 rounded-[10px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed">
            {!user ? "请先登录"
              : submitting ? "参与中..."
              : direction ? `消耗🎮${amount} · 赢⛏️${Math.floor(amount * MULTIPLIERS[direction] * 0.8)}石`
              : "请先选择方向"}
          </button>

          {msg && <div className={`mt-2 text-[11px] text-center ${msg.includes("❌") ? "text-brand-coral" : "text-brand-teal-dark"}`}>{msg}</div>}

          {/* 余额不足提示 */}
          {user && balance !== null && balance < 10 && (
            <div className="mt-3 p-2.5 rounded-[8px] bg-red-50 border border-red-100 text-[10px] text-red-500 text-center">
              🎮游戏豆不足 · <a href="/marketplace" className="underline font-medium">去购物得豆 →</a>
            </div>
          )}
        </div>
      ) : (
        /* ── 我的记录 Tab ── */
        <div className="px-4 py-3">
          {!user ? (
            <div className="py-8 text-center text-[12px] text-text-tertiary">登录后可查看参与记录</div>
          ) : recordsLoading ? (
            <div className="py-8 text-center text-[12px] text-text-tertiary">加载中...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-2xl mb-2">🎲</p>
              <p className="text-[12px] text-text-tertiary">暂无参与记录</p>
              <button onClick={() => setTab("predict")} className="mt-2 text-[11px] text-brand-teal-dark underline">去参与</button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {records.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded-[8px]">
                  <div className="text-[11px]">
                    <span className="font-medium">{r.choice || "—"}</span>
                    <span className="text-text-tertiary ml-1">{r.points}🎮</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.is_win === 1
                      ? <span className="text-[10px] text-green-600">+⛏️{r.settle_points || 0}</span>
                      : r.is_win === 0
                      ? <span className="text-[10px] text-red-400">已结算</span>
                      : <span className="text-[10px] text-amber-500">进行中</span>}
                    <span className="text-[9px] text-text-tertiary">{new Date(r.created_at * 1000).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
