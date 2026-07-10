"use client";

import { useState, useRef, useEffect } from "react";
import { TrendingUp, Search, RefreshCw, AlertTriangle, ChevronDown, BarChart3, Activity, Target, Shield, Building2, Coins, Sparkles } from "lucide-react";

import { API_V2 } from '@/config/api';

interface PredictionResult {
  code: string;
  name: string;
  price: { price: number; open: number; high: number; low: number; pre_close: number; volume: number; change: number; change_pct: number };
  prediction: {
    signal: string; score: number; confidence: number;
    current_price: number; target_up: number; target_down: number;
    support: number; resistance: number;
    indicators: { ma5: number; ma10: number; ma20: number; ma60: number; rsi: number; macd_hist: number; bb_upper: number; bb_lower: number; kdj_k: number; kdj_d: number; vol_ratio: number };
    returns: { "5d": number; "20d": number; "60d": number };
    volatility: number;
    model_breakdown: Record<string, number>;
  };
  chart: Array<{ date: string; o: number; c: number; h: number; l: number; v: number }>;
}

// 多源综合评分数据类型
interface ComprehensiveScore {
  stock_code: string;
  stock_name: string;
  total_score: number;
  signal: string;
  breakdown: {
    institutional: { score: number; buy_orgs: number; total_orgs: number };
    fund_flow: { score: number; net: number; consecutive: number; net_pct: number };
    fundamentals: { score: number; pe: number | null; pb: number | null; roe: number | null; rev_growth: number | null; profit_growth: number | null };
    wuxing: { score: number; element: string; trigram: string; reason: string; relation: string; god_relation: string };
  };
}

const PRESET_CODES = [
  { code: "sh600519", name: "贵州茅台" },
  { code: "sz300750", name: "宁德时代" },
  { code: "sh601318", name: "中国平安" },
  { code: "sz000858", name: "五粮液" },
  { code: "sh600036", name: "招商银行" },
  { code: "sz002594", name: "比亚迪" },
  { code: "sh600900", name: "长江电力" },
  { code: "sz300059", name: "东方财富" },
];

function getSignalInfo(signal: string) {
  const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    buy: { label: "买入", color: "#F27152", bg: "rgba(242,113,82,0.1)", icon: "🚀" },
    cautious_buy: { label: "谨慎买入", color: "#F2B631", bg: "rgba(242,182,49,0.1)", icon: "📈" },
    neutral: { label: "持有观望", color: "#8E8E93", bg: "rgba(142,142,147,0.1)", icon: "⏳" },
    cautious_sell: { label: "谨慎卖出", color: "#D99A0F", bg: "rgba(217,154,15,0.1)", icon: "📉" },
    sell: { label: "卖出", color: "#45CCD5", bg: "rgba(69,204,213,0.1)", icon: "🛑" },
  };
  return map[signal] || map.neutral;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80, h = 24;
  if (data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function StockPredictor({ onData }: { onData?: (data: PredictionResult) => void }) {
  const [code, setCode] = useState("sh600519");
  const [input, setInput] = useState("sh600519");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [compScore, setCompScore] = useState<ComprehensiveScore | null>(null);
  const [stockAccuracy, setStockAccuracy] = useState<number | null>(null);
  const [accuracyDays, setAccuracyDays] = useState(30);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const fetchAnalysis = async (stockCode: string) => {
    setLoading(true);
    setError("");
    try {
      // 调用新平台 API (统一分析)
      const res1 = await fetch(`${API_V2}/stock/analysis?code=${stockCode}`);
      const json1 = await res1.json();
      if (json1.code !== 0) throw new Error(json1.msg || "分析失败");
      setResult(json1.data);
      
      onData?.(json1.data);
      setCode(stockCode);
    } catch (e: any) {
      setError(e.message || "网络错误");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalysis("sh600519"); }, []);

  // Draw mini chart when result changes
  useEffect(() => {
    if (!result || !chartRef.current) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const data = result.chart;
    const closes = data.map(d => d.c);
    const mn = Math.min(...closes), mx = Math.max(...closes);
    const range = mx - mn || 1;
    const pad = 4;
    const drawW = w - pad * 2, drawH = h - pad * 2;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = pad + (drawH / 3) * i;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Price line
    ctx.strokeStyle = "#45CCD5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad + (i / (data.length - 1)) * drawW;
      const y = pad + drawH - ((d.c - mn) / range) * drawH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area
    const lastX = pad + drawW;
    const lastY = pad + drawH - ((closes[closes.length - 1] - mn) / range) * drawH;
    ctx.lineTo(lastX, lastY);
    ctx.lineTo(pad, pad + drawH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad, 0, pad + drawH);
    grad.addColorStop(0, "rgba(69,204,213,0.15)");
    grad.addColorStop(1, "rgba(69,204,213,0.01)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Volume bars
    const volData = data.slice(-20);
    const maxVol = Math.max(...volData.map(d => d.v));
    volData.forEach((d, i) => {
      const x = pad + (i / volData.length) * (w - pad * 2);
      const barW = (w - pad * 2) / volData.length * 0.7;
      const barH = (d.v / maxVol) * drawH * 0.3;
      ctx.fillStyle = d.c >= (data[data.length - volData.length + i]?.o || d.c) ? "rgba(220,38,38,0.2)" : "rgba(5,150,105,0.2)";
      ctx.fillRect(x, pad + drawH - barH, barW, barH);
    });
  }, [result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    // Auto-detect: if it's digits only, add sh prefix for 6xx, sz for 0xx/3xx
    let stockCode = trimmed;
    if (/^\d{6}$/.test(trimmed)) {
      if (trimmed.startsWith("6")) stockCode = "sh" + trimmed;
      else if (trimmed.startsWith("0") || trimmed.startsWith("3")) stockCode = "sz" + trimmed;
      else stockCode = "sh" + trimmed;
    }
    fetchAnalysis(stockCode);
  };

  const signalInfo = result ? getSignalInfo(result.prediction.signal) : null;

  // 股票名称降级：API name为空时从预设映射取
  const stockName = result?.name || PRESET_CODES.find(p => p.code === code)?.name || code;

  // 今日涨跌幅降级：price.change为0时使用目标价推算
  const hasPriceData = result && (result.price.change !== 0 || result.price.open !== 0);
  const displayChange = result?.price?.change ?? 0;
  const displayChangePct = result?.price?.change_pct ?? 0;

  // OHLC: 数据为0时显示 --
  const fmtPrice = (val: number) => val > 0 ? val.toFixed(2) : "—";

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-[15px] font-semibold">股市预测</div>
          <div className="text-[11px] text-text-tertiary">多模型量化分析 · 每日更新</div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入股票代码/名称 (如 sh600519)"
              className="w-full h-10 pl-9 pr-3 text-sm rounded-[8px] bg-bg border-0 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-5 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "分析"}
          </button>
        </div>
      </form>

      {/* Preset chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none -mx-1 px-1">
        {PRESET_CODES.map(p => (
          <button
            key={p.code}
            onClick={() => { setInput(p.code); fetchAnalysis(p.code); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-colors ${
              code === p.code
                ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30"
                : "bg-bg text-text-secondary border border-border-tertiary"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12 text-text-tertiary">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand-teal" />
          <div className="text-sm">获取数据 + 模型计算中...</div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-3">

          {/* Price + Signal Card */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[17px] font-bold">{stockName}</div>
                <div className="text-[11px] text-text-tertiary">{result.code}</div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-bold">¥{result.prediction.current_price.toFixed(2)}</div>
                <div className={`text-[12px] font-medium ${hasPriceData ? (displayChange >= 0 ? 'text-red-500' : 'text-green-500') : 'text-text-tertiary'}`}>
                  {hasPriceData
                    ? `${displayChange >= 0 ? '+' : ''}${displayChange.toFixed(2)} (${displayChangePct >= 0 ? '+' : ''}${displayChangePct.toFixed(2)}%)`
                    : '今日数据加载中'}
                </div>
              </div>
            </div>

            {/* Mini chart */}
            <canvas ref={chartRef} className="w-full h-24 rounded-xl bg-bg/50" style={{ height: "100px" }} />

            {/* OHLC */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[
                { label: "开盘", val: fmtPrice(result.price.open) },
                { label: "最高", val: fmtPrice(result.price.high) },
                { label: "最低", val: fmtPrice(result.price.low) },
                { label: "昨收", val: fmtPrice(result.price.pre_close) },
              ].map((d, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-text-tertiary">{d.label}</div>
                  <div className="text-[13px] font-semibold">{d.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Card */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-text-tertiary" />
                <span className="text-sm font-semibold">模型研判</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold`} style={{ background: signalInfo!.bg, color: signalInfo!.color }}>
                {signalInfo!.icon} {signalInfo!.label}
              </div>
            </div>

            {/* Score bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-tertiary mb-1">
                <span>综合评分</span>
                <span className="font-bold" style={{ color: result.prediction.score >= 60 ? "#DC2626" : result.prediction.score >= 45 ? "#6B7280" : "#059669" }}>
                  {result.prediction.score} / 100
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${result.prediction.score}%`,
                    background: result.prediction.score >= 60
                      ? "linear-gradient(90deg, #F27152, #DC2626)"
                      : result.prediction.score >= 45
                        ? "linear-gradient(90deg, #9CA3AF, #6B7280)"
                        : "linear-gradient(90deg, #10B981, #059669)",
                  }}
                />
              </div>
            </div>

            {/* Confidence & Target */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-bg rounded-xl p-3">
                <div className="text-[10px] text-text-tertiary mb-0.5">模型置信度</div>
                <div className="text-lg font-bold text-brand-teal-dark">{result.prediction.confidence}%</div>
              </div>
              <div className="bg-bg rounded-xl p-3">
                <div className="text-[10px] text-text-tertiary mb-0.5">目标区间</div>
                <div className="flex gap-2 text-xs">
                  <span className="text-red-500 font-bold">↑{result.prediction.target_up.toFixed(2)}</span>
                  <span className="text-text-tertiary">|</span>
                  <span className="text-green-500 font-bold">↓{result.prediction.target_down.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Support/Resistance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-3 h-3 text-green-500" />
                <span className="text-text-tertiary">支撑位</span>
                <span className="font-bold">¥{result.prediction.support.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Target className="w-3 h-3 text-red-500" />
                <span className="text-text-tertiary">压力位</span>
                <span className="font-bold">¥{result.prediction.resistance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-semibold">技术指标</span>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "RSI (14)", val: result.prediction.indicators.rsi, status: result.prediction.indicators.rsi < 30 ? "超卖" : result.prediction.indicators.rsi > 70 ? "超买" : "中性", color: result.prediction.indicators.rsi < 30 ? "#10B981" : result.prediction.indicators.rsi > 70 ? "#DC2626" : "#6B7280" },
                { label: "MACD 柱", val: result.prediction.indicators.macd_hist, status: result.prediction.indicators.macd_hist > 0 ? "多头" : "空头", color: result.prediction.indicators.macd_hist > 0 ? "#DC2626" : "#10B981" },
                { label: "KDJ-K", val: result.prediction.indicators.kdj_k, status: result.prediction.indicators.kdj_k < 30 ? "超卖" : result.prediction.indicators.kdj_k > 80 ? "超买" : "中性", color: result.prediction.indicators.kdj_k < 30 ? "#10B981" : result.prediction.indicators.kdj_k > 80 ? "#DC2626" : "#6B7280" },
                { label: "成交量比", val: result.prediction.indicators.vol_ratio, status: result.prediction.indicators.vol_ratio > 1.5 ? "放量" : result.prediction.indicators.vol_ratio < 0.5 ? "缩量" : "正常", color: result.prediction.indicators.vol_ratio > 1.5 ? "#F27152" : "#6B7280" },
                { label: "波动率", val: result.prediction.volatility, status: result.prediction.volatility < 1 ? "低波" : result.prediction.volatility > 3 ? "高波" : "中波", color: result.prediction.volatility < 1 ? "#10B981" : result.prediction.volatility > 3 ? "#DC2626" : "#6B7280" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border-tertiary/40 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-secondary">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{typeof item.val === 'number' ? item.val.toFixed(2) : item.val}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${item.color}15`, color: item.color }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returns */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm font-semibold">涨跌表现</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "5日", val: result.prediction.returns["5d"] },
                { label: "20日", val: result.prediction.returns["20d"] },
                { label: "60日", val: result.prediction.returns["60d"] },
              ].map((r, i) => (
                <div key={i} className="bg-bg rounded-xl p-3 text-center">
                  <div className="text-[10px] text-text-tertiary">{r.label}</div>
                  <div className={`text-base font-bold ${r.val >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {r.val >= 0 ? '+' : ''}{r.val.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model breakdown */}
          <details className="bg-surface rounded-[8px] overflow-hidden shadow-sm border border-border-tertiary">
            <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold">
              <span>8模型评分明细</span>
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
            </summary>
            <div className="px-4 pb-4 space-y-2">
              {Object.entries(result.prediction.model_breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary w-16">{key}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${val}%`, background: val >= 60 ? "linear-gradient(90deg, #F27152, #DC2626)" : val >= 45 ? "#9CA3AF" : "linear-gradient(90deg, #10B981, #059669)" }} />
                  </div>
                  <span className={`text-[11px] font-bold w-8 text-right ${val >= 60 ? "text-red-500" : val >= 45 ? "text-text-tertiary" : "text-green-500"}`}>{Math.round(val)}</span>
                </div>
              ))}
            </div>
          </details>

          {/* ─────── 多源综合评分 ─────── */}
          {compScore && (
            <>
              {/* 准确率 */}
              {stockAccuracy !== null && (
                <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">📊 近{accuracyDays}日本模型准确率</span>
                    {stockAccuracy > 0 && (
                      <span className={`text-sm font-bold ${stockAccuracy >= 60 ? 'text-green-600' : stockAccuracy >= 45 ? 'text-amber-600' : 'text-red-500'}`}>
                        {stockAccuracy}%
                      </span>
                    )}
                  </div>
                  {stockAccuracy === null && <div className="text-[10px] text-text-tertiary">数据收集中，还需{accuracyDays}天</div>}
                  <div className="w-full h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                    {stockAccuracy !== null && (
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${stockAccuracy}%`,
                        background: stockAccuracy >= 60 ? 'linear-gradient(90deg, #10B981, #059669)' : stockAccuracy >= 45 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #EF4444, #DC2626)'
                      }} />
                    )}
                  </div>
                </div>
              )}

              {/* 机构观点 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-semibold">机构观点</span>
                  <span className="ml-auto text-[10px] text-text-tertiary">{compScore.breakdown.institutional.buy_orgs}/{compScore.breakdown.institutional.total_orgs}家看多</span>
                </div>
                <div className="space-y-2">
                  {(compScore as any).raw_ratings?.length > 0 ? (
                    (compScore as any).raw_ratings.map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border-tertiary/40 last:border-0">
                        <span className="text-text-secondary">{r.org_name}</span>
                        <span className={`font-medium ${r.rating.includes("买入") ? "text-red-500" : r.rating.includes("增持") ? "text-orange-500" : "text-text-tertiary"}`}>
                          {r.rating}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-text-tertiary text-center py-2">暂无近期机构评级数据</div>
                  )}
                </div>
              </div>

              {/* 资金流向 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-semibold">资金流向</span>
                </div>
                {(compScore as any).raw_fund_flow?.main_force_net !== undefined ? (
                  <div className="space-y-2">
                    {[
                      { label: "主力资金", val: (compScore as any).raw_fund_flow.main_force_net },
                      { label: "中单资金", val: (compScore as any).raw_fund_flow.mid_net },
                      { label: "散户资金", val: (compScore as any).raw_fund_flow.retail_net },
                    ].map((item, i) => {
                      const v = item.val || 0;
                      return (
                        <div key={i} className="flex items-center justify-between text-xs py-1">
                          <span className="text-text-secondary">{item.label}</span>
                          <span className={`font-bold ${v > 0 ? "text-red-500" : v < 0 ? "text-green-500" : "text-text-tertiary"}`}>
                            {v > 0 ? "+" : ""}{v.toFixed(0)}万
                          </span>
                        </div>
                      );
                    })}
                    {(compScore as any).raw_fund_flow.consecutive_inflow > 1 && (
                      <div className="text-[10px] text-brand-teal-dark mt-1">
                        🔥 主力连续{(compScore as any).raw_fund_flow.consecutive_inflow}日净流入
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-text-tertiary text-center py-2">暂无资金流向数据</div>
                )}
              </div>

              {/* 基本面 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-semibold">基本面</span>
                  <span className={`ml-auto text-[10px] font-medium ${compScore.breakdown.fundamentals.score >= 60 ? 'text-green-600' : compScore.breakdown.fundamentals.score >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {compScore.breakdown.fundamentals.score}分
                  </span>
                </div>
                <div className="space-y-2">
                  {compScore.breakdown.fundamentals.pe !== null ? (
                    <>
                      {[
                        { label: "市盈率 PE", val: compScore.breakdown.fundamentals.pe, unit: "" },
                        { label: "市净率 PB", val: compScore.breakdown.fundamentals.pb, unit: "" },
                        { label: "净资产收益率 ROE", val: compScore.breakdown.fundamentals.roe, unit: "%" },
                        { label: "营收增长率", val: compScore.breakdown.fundamentals.rev_growth, unit: "%" },
                        { label: "利润增长率", val: compScore.breakdown.fundamentals.profit_growth, unit: "%" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border-tertiary/40 last:border-0">
                          <span className="text-text-secondary">{item.label}</span>
                          <span className="font-semibold">{item.val !== null ? `${item.val.toFixed(2)}${item.unit}` : '--'}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-[11px] text-text-tertiary text-center py-2">暂无基本面数据</div>
                  )}
                </div>
              </div>

              {/* 玄学视角 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-text-tertiary" />
                  <span className="text-sm font-semibold">玄学视角</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">股票五行</span>
                    <span className="font-medium">{compScore.breakdown.wuxing.element}（{compScore.breakdown.wuxing.trigram}卦）</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">五行理法</span>
                    <span className="font-medium">{compScore.breakdown.wuxing.reason}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-text-secondary">与用神关系</span>
                    <span className={`font-medium ${
                      compScore.breakdown.wuxing.god_relation.includes("生") ? "text-green-600" :
                      compScore.breakdown.wuxing.god_relation.includes("克") ? "text-red-500" : "text-text-tertiary"
                    }`}>{compScore.breakdown.wuxing.god_relation}</span>
                  </div>
                  {compScore.breakdown.wuxing.god_relation.includes("生") && (
                    <div className="bg-green-50 rounded-xl p-2.5 text-[11px] text-green-700 mt-1">
                      ✨ 此股票五行生扶用神，运势契合度较高
                    </div>
                  )}
                  {compScore.breakdown.wuxing.god_relation.includes("克") && (
                    <div className="bg-red-50 rounded-xl p-2.5 text-[11px] text-red-600 mt-1">
                      ⚠️ 此股票五行克制用神，运势存在冲突
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
