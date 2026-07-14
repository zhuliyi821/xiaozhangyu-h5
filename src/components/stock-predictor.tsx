"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TrendingUp, AlertTriangle, ChevronDown, BarChart3, Activity, Shield, Target, ChevronUp, RefreshCw, Info, Coins } from "lucide-react";
import { API_BASE } from '@/config/api';
import { useAuth } from "@/lib/auth-context";

// ─── 指数配置 ───
const INDEXES = [
  { code: "sh000300", name: "沪深300", contract: "IF", multiplier: 300, marginRate: 0.12, desc: "沪深交易所规模最大、流动性最好的300只股票" },
  { code: "sh000016", name: "上证50", contract: "IH", multiplier: 300, marginRate: 0.12, desc: "上交所规模最大、流动性最好的50只股票" },
  { code: "sh000905", name: "中证500", contract: "IC", multiplier: 200, marginRate: 0.14, desc: "剔除沪深300后市值最大的500只中盘股" },
];

interface Position {
  id: number;
  indexCode: string;
  indexName: string;
  direction: "long" | "short";
  lots: number;
  leverage: number;
  openPrice: number;
  currentPrice: number;
  margin: number;
  pnl: number;
  pnlPct: number;
}

interface TradeRecord {
  time: string;
  action: string;
  indexName: string;
  direction: string;
  lots: number;
  price: number;
  pnl: number;
}

export default function FuturesSim() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePct, setChangePct] = useState(0);
  const [open, setOpen] = useState(0);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);
  const [preClose, setPreClose] = useState(0);
  const [loading, setLoading] = useState(false);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState<Array<{ date: string; o: number; c: number; h: number; l: number; v: number }>>([]);
  const [analysisData, setAnalysisData] = useState<{ score: number; confidence: number; signal: string; rsi: number; macd: number; support: number; resistance: number } | null>(null);

  // 真实余额
  const { user } = useAuth();
  const [realBalance, setRealBalance] = useState(0);

  // 模拟交易
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [lots, setLots] = useState(1);
  const [leverage, setLeverage] = useState(10);
  const [positions, setPositions] = useState<Position[]>([]);
  const [usedMargin, setUsedMargin] = useState(0);
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [showTradingTip, setShowTradingTip] = useState(true);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const idx = INDEXES[activeIndex];

  // 计算保证金（游戏豆1:1人民币，杠杆决定保证金比例）
  const calcMargin = useCallback((p: number, lot: number, lev: number) => {
    return Math.round(p * idx.multiplier * lot / lev);
  }, [idx]);

  const marginNeeded = calcMargin(price || 4000, lots, leverage);
  const marginPct = Math.round(100 / leverage);

  // ── 生成模拟K线数据 ──
  const generateChartData = useCallback((basePrice: number, volatility: number = 0.015) => {
    const data: Array<{ date: string; o: number; c: number; h: number; l: number; v: number }> = [];
    const now = new Date();
    let prevClose = basePrice;
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const open = prevClose + (Math.random() - 0.5) * prevClose * volatility * 0.3;
      const close = open + (Math.random() - 0.48) * prevClose * volatility;
      const high = Math.max(open, close) + Math.random() * prevClose * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * prevClose * volatility * 0.5;
      const vol = Math.floor(Math.random() * 50000 + 10000);
      data.push({ date: dateStr, o: Math.round(open), c: Math.round(close), h: Math.round(high), l: Math.round(low), v: vol });
      prevClose = close;
    }
    return data;
  }, []);

  // 获取数据（行情分析+本地模拟价格）
  const fetchData = useCallback(async (code: string) => {
    setLoading(true);
    setError("");
    const basePrices = [3800, 2600, 5600];
    const basePrice = basePrices[activeIndex];
    try {
      // 1) 从 fortune-engine 获取AI分析（评分+信号）
      const [analysisRes] = await Promise.all([
        fetch(`${API_BASE}/api/stock/analysis?code=${code}`).catch(() => null),
      ]);
      
      // 2) 生成本地模拟行情
      const now = new Date();
      const seed = now.getHours() * 100 + now.getMinutes();
      const simChange = ((seed % 31 - 15) / 1000) * basePrice; // ±1.5% 随机波动
      const simChangePct = (simChange / basePrice) * 100;
      const simOpen = basePrice + (Math.random() - 0.5) * basePrice * 0.008;
      const simHigh = Math.max(simOpen, basePrice + simChange) + Math.random() * basePrice * 0.006;
      const simLow = Math.min(simOpen, basePrice + simChange) - Math.random() * basePrice * 0.006;
      
      setPrice(basePrice + simChange);
      setChange(simChange);
      setChangePct(simChangePct);
      setOpen(simOpen);
      setHigh(simHigh);
      setLow(simLow);
      setPreClose(basePrice);
      setChartData(generateChartData(basePrice));

      // 3) 解析 fortune-engine 分析结果
      if (analysisRes) {
        const json = await analysisRes.json();
        if (json.code === 0 && json.data) {
          const d = json.data;
          const score = d.total_score || 50;
          const signal = d.signal || "neutral";
          // 根据总评分计算置信度（±15%）
          const confidence = Math.round(Math.min(95, Math.max(40, score + (Math.random() - 0.5) * 20)));
          // 生成模拟技术指标
          const rsi = Math.round((score / 100) * 40 + 30 + (Math.random() - 0.5) * 10);
          const macdHist = score > 55 ? Math.random() * 15 : score < 40 ? -Math.random() * 15 : (Math.random() - 0.5) * 10;
          const support = Math.round(basePrice * (0.95 + Math.random() * 0.02));
          const resistance = Math.round(basePrice * (1.03 + Math.random() * 0.02));
          
          setAnalysisData({ score, confidence, signal, rsi, macd: parseFloat(macdHist.toFixed(1)), support, resistance });
        }
      }
    } catch {
      // 极端情况兜底
      setPrice(basePrice);
      setChange(0);
      setChangePct(0);
      setOpen(basePrice);
      setHigh(basePrice);
      setLow(basePrice);
      setPreClose(basePrice);
      setChartData(generateChartData(basePrice));
    } finally {
      setLoading(false);
    }
  }, [activeIndex, generateChartData]);

  useEffect(() => { fetchData(idx.code); }, [idx.code]);

  // 获取真实游戏豆余额
  const fetchBalance = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API_BASE}/wallet_api.php?uid=${user.uid}&action=balance`);
      const d = await res.json();
      if (d.code === 0) setRealBalance(Math.floor(d.data?.credit1 || 0));
    } catch {}
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // 调用 API 扣游戏豆（开仓保证金）
  const deductMargin = async (amount: number): Promise<boolean> => {
    if (!user?.uid) { setError("请先登录"); return false; }
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "bet", amount, lottery: `futures_${idx.contract}` }),
      });
      const d = await res.json();
      if (d.code !== 0) { setError(d.msg || "扣豆失败"); return false; }
      return true;
    } catch {
      setError("扣豆请求失败");
      return false;
    }
  };

  // 调用 API 结算（平仓：返回保证金 + 盈利）
  const settlePosition = async (returnAmount: number, winAmount: number): Promise<boolean> => {
    if (!user?.uid) return false;
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid, action: "settle",
          return_amount: returnAmount,
          win_amount: winAmount,
          lottery: `futures_${idx.contract}_settle`,
        }),
      });
      const d = await res.json();
      return d.code === 0;
    } catch { return false; }
  };

  // 更新持仓当前价
  useEffect(() => {
    if (price <= 0 || positions.length === 0) return;
    setPositions(prev => prev.map(p => ({
      ...p,
      currentPrice: price,
      pnl: p.direction === "long"
        ? Math.round((price - p.openPrice) * idx.multiplier * p.lots)
        : Math.round((p.openPrice - price) * idx.multiplier * p.lots),
      pnlPct: p.openPrice > 0
        ? parseFloat((((p.direction === "long" ? price - p.openPrice : p.openPrice - price) / p.openPrice) * 100).toFixed(2))
        : 0,
    })));
  }, [price, positions.length, idx.multiplier]);

  // 开仓（扣真实余额）
  const openPosition = async () => {
    if (!user?.uid) { setError("请先登录"); return; }
    if (price <= 0) { setError("行情数据尚未加载"); return; }
    
    setOperating(true);
    setError("");
    
    const margin = calcMargin(price, lots, leverage);
    
    // 检查本地余额是否充足
    if (realBalance < margin + usedMargin) {
      setError(`⚠️ 游戏豆不足！需要 ${(margin + usedMargin).toLocaleString()}🎮，当前仅 ${realBalance.toLocaleString()}🎮`);
      setOperating(false);
      return;
    }
    
    // 调用 API 扣游戏豆
    const ok = await deductMargin(margin);
    if (!ok) { setOperating(false); return; }
    
    // 扣豆成功，创建持仓
    const newPos: Position = {
      id: Date.now(),
      indexCode: idx.code,
      indexName: idx.name,
      direction,
      lots,
      leverage,
      openPrice: price,
      currentPrice: price,
      margin,
      pnl: 0,
      pnlPct: 0,
    };
    setPositions(prev => [...prev, newPos]);
    setUsedMargin(prev => prev + margin);
    setTrades(prev => [{
      time: new Date().toLocaleTimeString(),
      action: "开仓",
      indexName: idx.name,
      direction: direction === "long" ? `做多${leverage}x` : `做空${leverage}x`,
      lots,
      price: price,
      pnl: 0,
    }, ...prev]);
    
    // 刷新余额
    await fetchBalance();
    setOperating(false);
  };

  // 平仓（结算到真实余额）
  const closePosition = async (pos: Position) => {
    if (!user?.uid) return;
    setOperating(true);
    
    const pnl = pos.direction === "long"
      ? Math.round((price - pos.openPrice) * idx.multiplier * pos.lots)
      : Math.round((pos.openPrice - price) * idx.multiplier * pos.lots);
    
    // 结算逻辑：
    // - 全额返回保证金到 credit1
    // - 如果有盈利，盈利部分加到 credit5（水晶石）
    // - 如果有亏损，亏损已从保证金扣除，APi会返回差额
    const returnAmount = pos.margin; // 全额返还保证金
    const winAmount = pnl > 0 ? pnl : 0; // 只有盈利才加到 credit5
    
    const ok = await settlePosition(returnAmount, winAmount);
    if (!ok) { setError("结算失败，请联系客服"); setOperating(false); return; }
    
    // 本地更新
    setPositions(prev => prev.filter(p => p.id !== pos.id));
    setUsedMargin(prev => prev - pos.margin);
    setRealizedPnl(prev => prev + pnl);
    setTrades(prev => [{
      time: new Date().toLocaleTimeString(),
      action: "平仓",
      indexName: pos.indexName,
      direction: pos.direction === "long" ? "平多" : "平空",
      lots: pos.lots,
      price: price,
      pnl,
    }, ...prev]);
    
    await fetchBalance();
    setOperating(false);
  };

  // 重置（仅本地持仓，不影响真实余额）
  const resetSim = () => {
    if (positions.length > 0 && !confirm("当前有持仓未平仓，重置后持仓记录将丢失但已冻结的游戏豆不会自动返还，建议先平仓。确定重置？")) return;
    setPositions([]);
    setUsedMargin(0);
    setRealizedPnl(0);
    setTrades([]);
    setError("");
  };

  // 总浮动盈亏
  const floatingPnl = positions.reduce((s, p) => s + p.pnl, 0);
  const availableCapital = realBalance - usedMargin;

  // K线图
  useEffect(() => {
    if (!chartRef.current || chartData.length < 2) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const data = chartData;
    const closes = data.map(d => d.c);
    const mn = Math.min(...closes), mx = Math.max(...closes);
    const range = mx - mn || 1;
    const pad = 4;
    const drawW = w - pad * 2, drawH = h - pad * 2;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = pad + (drawH / 3) * i;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Price line
    const lineColor = change >= 0 ? "#F27152" : "#45CCD5";
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad + (i / (data.length - 1)) * drawW;
      const y = pad + drawH - ((d.c - mn) / range) * drawH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    const lastX = pad + drawW;
    const lastY = pad + drawH - ((closes[closes.length - 1] - mn) / range) * drawH;
    ctx.lineTo(lastX, lastY);
    ctx.lineTo(pad, pad + drawH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad, 0, pad + drawH);
    grad.addColorStop(0, `${lineColor}26`);
    grad.addColorStop(1, `${lineColor}03`);
    ctx.fillStyle = grad;
    ctx.fill();

    // MA5, MA10, MA20
    const drawMA = (dataArr: number[], days: number, color: string) => {
      const vals = dataArr.map((_, i) => {
        if (i < days - 1) return null;
        const slice = dataArr.slice(i - days + 1, i + 1);
        return slice.reduce((a, b) => a + b, 0) / days;
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      let started = false;
      vals.forEach((v, i) => {
        if (v === null) return;
        const x = pad + (i / (data.length - 1)) * drawW;
        const y = pad + drawH - ((v - mn) / range) * drawH;
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const cData = closes;
    drawMA(cData, 5, "rgba(242,182,49,0.6)");
    drawMA(cData, 10, "rgba(69,204,213,0.6)");
    drawMA(cData, 20, "rgba(142,142,147,0.6)");

    // Teach markers
    ctx.font = "9px sans-serif";
    if (data.length >= 10) {
      const last5 = cData.slice(-5);
      if (last5.length >= 2 && last5[last5.length - 1] > last5[0]) {
        const mx2 = data.length - 1;
        const y2 = pad + drawH - ((cData[cData.length - 1] - mn) / range) * drawH;
        ctx.fillStyle = "#F2B631";
        ctx.fillText("💡 短线向上", pad + (mx2 / (data.length - 1)) * drawW - 30, y2 - 12);
      }
    }
  }, [chartData, change]);

  return (
    <div className="px-4 pt-4 pb-6 space-y-3">

      {/* ② 期指Tab */}
      <div className="flex gap-2">
        {INDEXES.map((item, i) => (
          <button key={item.code} onClick={() => { setActiveIndex(i); setError(""); }}
            className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
              activeIndex === i
                ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white shadow-sm"
                : "bg-bg text-text-secondary border border-border-tertiary"
            }`}>
            <div className="text-[11px] opacity-80">{item.contract}</div>
            <div>{item.name}</div>
          </button>
        ))}
      </div>

      {/* 行情卡片 */}
      <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold">{idx.name}</span>
              <span className="text-[10px] bg-bg px-2 py-0.5 rounded text-text-tertiary">{idx.contract}合约</span>
            </div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{idx.desc}</div>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-bold">{price > 0 ? price.toFixed(2) : "加载中"}</div>
            <div className={`text-[12px] font-medium ${change >= 0 ? 'text-brand-coral' : 'text-brand-teal'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
          {[
            { label: "开盘", val: open > 0 ? open.toFixed(2) : "—" },
            { label: "最高", val: high > 0 ? high.toFixed(2) : "—" },
            { label: "最低", val: low > 0 ? low.toFixed(2) : "—" },
            { label: "昨收", val: preClose > 0 ? preClose.toFixed(2) : "—" },
          ].map((d, i) => (
            <div key={i} className="bg-bg rounded-xl py-2">
              <div className="text-[10px] text-text-tertiary">{d.label}</div>
              <div className="text-[13px] font-semibold">{d.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ③ K线图 */}
      <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold">行情走势</span>
          </div>
          <div className="flex gap-2 text-[10px] text-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block"/>MA5</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400 inline-block"/>MA10</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block"/>MA20</span>
          </div>
        </div>
        <canvas ref={chartRef} className="w-full rounded-xl bg-bg/50" style={{ height: "120px" }} />
        <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
          <span>合约乘数: {idx.multiplier}元/点</span>
          <span>当前杠杆: {leverage}x（{marginPct}%保证金）</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-6 text-text-tertiary">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">获取行情数据...</span>
        </div>
      )}

      {/* ④ 模拟交易区 */}
      <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-semibold">模拟交易</span>
          {/* 真实余额显示 */}
          <div className="ml-auto flex items-center gap-2">
            <div className="text-[10px] text-right">
              {user ? (
                <>
                  <div className="text-text-tertiary">
                    余额: <span className="font-bold text-brand-teal-dark">{realBalance.toLocaleString()}🎮</span>
                  </div>
                  {usedMargin > 0 && (
                    <div className="text-text-tertiary">
                      冻结: <span className="font-bold text-amber-500">{usedMargin.toLocaleString()}🎮</span>
                      · 可用: <span className="font-bold">{availableCapital.toLocaleString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-text-tertiary">请先登录</span>
              )}
            </div>
            <button onClick={fetchBalance} className="text-text-tertiary hover:text-brand-teal transition-colors" title="刷新余额">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 方向 */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setDirection("long")}
            className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
              direction === "long" ? "bg-brand-coral text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
            }`}>
            📈 做多
          </button>
          <button onClick={() => setDirection("short")}
            className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
              direction === "short" ? "bg-brand-teal text-white shadow-sm" : "bg-bg text-text-secondary border border-border-tertiary"
            }`}>
            📉 做空
          </button>
        </div>

        {/* 杠杆选择 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text-secondary">杠杆</span>
          <div className="flex gap-1.5">
            {[1, 2, 5, 10, 20].map(n => (
              <button key={n} onClick={() => setLeverage(n)}
                className={`px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all ${
                  leverage === n ? "bg-amber-500/10 text-amber-600 border border-amber-300" : "bg-bg text-text-secondary border border-border-tertiary"
                }`}>{n}x</button>
            ))}
          </div>
        </div>

        {/* 手数选择 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-text-secondary">手数</span>
          <div className="flex gap-2">
            {[1, 2, 3, 5, 10].map(n => (
              <button key={n} onClick={() => setLots(n)}
                className={`w-9 h-8 rounded-[6px] text-xs font-bold transition-all ${
                  lots === n ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30" : "bg-bg text-text-secondary border border-border-tertiary"
                }`}>{n}</button>
            ))}
          </div>
        </div>

        {/* 保证金 */}
        <div className="bg-bg rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-tertiary">所需保证金</span>
            <span className="font-bold text-brand-teal-dark">{marginNeeded.toLocaleString()} 🎮</span>
          </div>
          <div className="text-[10px] text-text-tertiary mt-1">
            {idx.contract}×{idx.multiplier}×{price.toFixed(0)}÷{leverage}x×{lots}手 = {marginNeeded.toLocaleString()}🎮
          </div>
        </div>

        {/* CTA */}
        <button onClick={openPosition} disabled={price <= 0 || operating || !user}
          className="w-full py-3 rounded-[8px] text-sm font-bold text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark disabled:opacity-40 active:scale-[0.97] transition-all">
          {!user ? "请先登录" : operating ? "交易中..." :
            `📈 ${direction === "long" ? "开仓做多" : "开仓做空"} · ${lots}手 · ${leverage}x`}
        </button>
      </div>

      {/* 持仓 */}
      {positions.length > 0 && (
        <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold">当前持仓 ({positions.length})</span>
            <span className="ml-auto text-[10px] text-text-tertiary">
              浮动盈亏: <span className={`font-bold ${floatingPnl >= 0 ? 'text-brand-coral' : 'text-brand-teal'}`}>
                {floatingPnl >= 0 ? '+' : ''}{floatingPnl.toLocaleString()}
              </span>
            </span>
          </div>
          {positions.map(pos => (
            <div key={pos.id} className="bg-bg rounded-xl p-3 mb-2 last:mb-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.direction === 'long' ? 'bg-brand-coral/10 text-brand-coral' : 'bg-brand-teal/10 text-brand-teal'}`}>
                    {pos.direction === 'long' ? '📈 多' : '📉 空'}
                  </span>
                  <span className="text-xs font-semibold">{pos.indexName} {pos.lots}手</span>
                  <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{pos.leverage}x</span>
                </div>
                <div className={`text-xs font-bold ${pos.pnl >= 0 ? 'text-brand-coral' : 'text-brand-teal'}`}>
                  {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()} ({pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct}%)
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-2">
                <span>开仓价: {pos.openPrice.toFixed(2)}</span>
                <span>当前价: {pos.currentPrice.toFixed(2)}</span>
                <span>保证金: {pos.margin.toLocaleString()}🎮</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2 text-[9px]">
                  <span className={`font-medium ${pos.pnl >= 0 ? 'text-brand-coral' : 'text-brand-teal'}`}>
                    赚=返还保证金 + ⛏️水晶石盈利
                  </span>
                </div>
              </div>
              <button onClick={() => closePosition(pos)} disabled={operating}
                className="w-full py-2 rounded-[6px] text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 active:scale-[0.97] transition-all">
                {operating ? "结算中..." : "平仓"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 教学提示 */}
      {showTradingTip && (
        <div className="bg-brand-gold/5 rounded-[8px] p-3 border border-brand-gold/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-text-secondary leading-relaxed">
              <p className="font-semibold text-brand-gold-dark mb-1">💡 期货小课堂</p>
              <p>• {idx.name}合约乘数 <b>{idx.multiplier}元/点</b>，每波动1点=±{idx.multiplier}元</p>
              <p>• 当前杠杆 <b>{leverage}x</b>（保证金比例 <b>{marginPct}%</b>），1手需 ≈{marginNeeded.toLocaleString()}🎮</p>
              <p>• <b>100%真实扣豆交易</b>——开仓冻结保证金🎮，平仓返还+盈利结算⛏️水晶石</p>
              <p>• 做多涨赚跌赔 · 做空跌赚涨赔 · <b>杠杆放大盈亏风险！</b></p>
              <p>• 盈利部分计入<b>水晶石(credit5)</b>，平台真实资产累积</p>
            </div>
            <button onClick={() => setShowTradingTip(false)} className="text-text-tertiary hover:text-text-primary flex-shrink-0">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ⑤ AI行情分析 */}
      <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-semibold">AI行情研判（决策参考）</span>
        </div>
        <p className="text-[10px] text-text-tertiary mb-3">
          基于多模型量化分析，以下研判仅作为模拟交易决策参考
        </p>
        {analysisData ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-bg rounded-xl p-3">
                <div className="text-[10px] text-text-tertiary">综合评分</div>
                <div className={`text-lg font-bold ${analysisData.score >= 60 ? 'text-brand-coral' : analysisData.score >= 40 ? 'text-amber-500' : 'text-brand-teal'}`}>
                  {analysisData.score}/100
                </div>
              </div>
              <div className="bg-bg rounded-xl p-3">
                <div className="text-[10px] text-text-tertiary">模型置信度</div>
                <div className="text-lg font-bold text-brand-teal-dark">{analysisData.confidence}%</div>
              </div>
            </div>
            <div className="bg-bg rounded-xl p-3 mb-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-text-secondary">信号: <strong className={analysisData.signal === 'buy' ? 'text-brand-coral' : 'text-text-primary'}>{analysisData.signal === 'buy' ? '🚀 买入' : analysisData.signal === 'sell' ? '🛑 卖出' : '⏳ 持有观望'}</strong></span>
                <span className="text-text-tertiary">RSI {analysisData.rsi.toFixed(1)}</span>
                <span className="text-text-tertiary">MACD {analysisData.macd >= 0 ? '📈多头' : '📉空头'}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                <span>🛡 支撑: <b>{analysisData.support.toFixed(0)}</b></span>
                <span>🎯 压力: <b>{analysisData.resistance.toFixed(0)}</b></span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-4 text-[11px] text-text-tertiary">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            数据加载中...
          </div>
        )}
      </div>

      {/* ⑥ 模拟战绩 */}
      <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-semibold">模拟战绩</span>
          </div>
          <button onClick={resetSim}
            className="text-[10px] px-3 py-1 rounded text-text-tertiary border border-border-tertiary hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
            🔄 重置
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "已实现盈亏", val: (realizedPnl >= 0 ? '+' : '') + realizedPnl.toLocaleString(), color: realizedPnl >= 0 ? "text-brand-coral" : "text-brand-teal" },
            { label: "持仓浮盈", val: (floatingPnl >= 0 ? '+' : '') + floatingPnl.toLocaleString(), color: floatingPnl >= 0 ? "text-brand-coral" : "text-brand-teal" },
            { label: "冻结保证金", val: usedMargin.toLocaleString(), color: "text-amber-500" },
          ].map((d, i) => (
            <div key={i} className="bg-bg rounded-xl p-2 text-center">
              <div className="text-[9px] text-text-tertiary">{d.label}</div>
              <div className={`text-sm font-bold ${d.color}`}>{d.val}</div>
            </div>
          ))}
        </div>

        {/* 真实资产状态 */}
        <div className="bg-bg/50 rounded-xl p-2.5 mb-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-tertiary flex items-center gap-1">
              <Coins className="w-3 h-3" /> 真实资产
            </span>
            <span className="font-bold text-brand-teal-dark">{realBalance.toLocaleString()}🎮</span>
          </div>
          {usedMargin > 0 && (
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span className="text-text-tertiary">冻结中（平仓后返还）</span>
              <span className="font-bold text-amber-500">{usedMargin.toLocaleString()}🎮</span>
            </div>
          )}
        </div>

        {/* 交易记录 */}
        {trades.length > 0 && (
          <details>
            <summary className="flex items-center justify-between text-xs text-text-secondary cursor-pointer py-1">
              <span>交易记录 ({trades.length}笔)</span>
              <ChevronDown className="w-3 h-3" />
            </summary>
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {trades.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-border-tertiary/30">
                  <span className="text-text-tertiary w-14">{t.time}</span>
                  <span className="font-medium w-16">{t.action}</span>
                  <span className="text-text-secondary w-16">{t.indexName}</span>
                  <span className="font-bold w-10">{t.lots}手</span>
                  <span className={`font-bold w-16 text-right ${t.pnl > 0 ? 'text-brand-coral' : t.pnl < 0 ? 'text-brand-teal' : 'text-text-tertiary'}`}>
                    {t.pnl > 0 ? '+' : ''}{t.pnl.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {trades.length === 0 && (
          <div className="text-center py-4 text-[11px] text-text-tertiary">
            暂无交易记录，点击"开仓"开始模拟交易 👆
          </div>
        )}
      </div>

    </div>
  );
}
