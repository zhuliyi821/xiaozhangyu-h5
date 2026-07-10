"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTrend, getHistory, TrendData, HistoryItem } from "@/lib/api";
import { predict, PredictionResult } from "@/lib/ai-models";
import DrawFreshnessBar from "@/components/ui/draw-freshness-bar";
import { DRAW_SCHEDULES } from "@/lib/draw-schedule";
import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart, HeatmapChart, GraphChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  VisualMapComponent, DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart, LineChart, ScatterChart, HeatmapChart, GraphChart,
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  VisualMapComponent, DataZoomComponent, CanvasRenderer,
]);

const LOTTERY_TYPES: Record<string, { name: string; front: number; back: number; color: string }> = {
  dlt: { name: "大乐透", front: 35, back: 12, color: "#F27152" },
  ssq: { name: "双色球", front: 33, back: 16, color: "#3B82F6" },
  pl3: { name: "排列3", front: 10, back: 0, color: "#10B981" },
  fc3d: { name: "3D", front: 10, back: 0, color: "#8B5CF6" },
  qxc: { name: "七星彩", front: 10, back: 0, color: "#F59E0B" },
};

export default function ProChartPage() {
  const params = useParams();
  const router = useRouter();
  const type = (params.type as string) || "dlt";
  const cfg = LOTTERY_TYPES[type] || LOTTERY_TYPES.dlt;

  const [trend, setTrend] = useState<TrendData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState(5);
  const [activeTab, setActiveTab] = useState<"trend" | "freq" | "miss" | "predict">("trend");
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInst = useRef<echarts.ECharts | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [trendData, historyData] = await Promise.all([
        getTrend(type),
        getHistory(type, 1, 100),
      ]);
      setTrend(trendData);
      setHistory(historyData.list || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("彩票数据加载失败", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [type]);

  // 首次加载 + 彩种切换
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 定时轮询：每 60 秒静默刷新一次；开奖日开奖后 5 分钟内每 10 秒刷新
  useEffect(() => {
    let intervalMs = 60000;
    const now = new Date();
    const schedule = DRAW_SCHEDULES[type];
    if (schedule) {
      const [drawHour, drawMin] = schedule.drawTime.split(":").map(Number);
      const curMin = now.getHours() * 60 + now.getMinutes();
      const drawMin_ = drawHour * 60 + drawMin;
      const isDrawDay = schedule.drawDays.includes(now.getDay());
      if (isDrawDay && curMin >= drawMin_ && curMin <= drawMin_ + 5) {
        intervalMs = 10000;
      }
    }
    const interval = setInterval(() => loadData(false), intervalMs);
    return () => clearInterval(interval);
  }, [loadData, type]);

  // Run AI prediction using real history data
  useEffect(() => {
    if (history.length === 0) return;
    // Convert history (string[]) to trend format (number[][])
    const frontData = history.slice(0, periods).map(h => h.front.map(n => parseInt(n)).filter(n => !isNaN(n)));
    const backData = cfg.back > 0 ? history.slice(0, periods).map(h => h.back?.map(n => parseInt(n)).filter(n => !isNaN(n)) ?? []) : undefined;
    const result = predict(
      { front: frontData, back: backData },
      { frontMax: cfg.front, backMax: cfg.back, totalPeriods: periods }
    );
    setPrediction(result);
  }, [history, periods, cfg.front, cfg.back]);

  // Render chart when data or tab changes (uses layoutEffect for immediate render)
  useLayoutEffect(() => {
    if (!trend || !chartRef.current) return;
    if (chartInst.current) chartInst.current.dispose();

    const chart = echarts.init(chartRef.current);
    chartInst.current = chart;

    // Force a resize to ensure the container is laid out
    chart.resize();

    const raw = trend.data.slice(-periods);

    if (activeTab === "trend") {
      renderTrendChart(chart, raw, cfg);
    } else if (activeTab === "freq") {
      renderFreqChart(chart, raw, cfg);
    } else if (activeTab === "miss") {
      renderMissChart(chart, raw, cfg);
    }

    // Re-resize after chart is rendered
    setTimeout(() => chart.resize(), 50);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [trend, activeTab, periods]);

  // ── 从真实历史数据计算热号 ──
  const realHotFront = useMemo(() => {
    if (history.length === 0) return [];
    const freq: number[] = new Array(cfg.front).fill(0);
    history.slice(0, 50).forEach(h => {
      h.front.forEach(n => { const v = parseInt(n); if (v >= 1 && v <= cfg.front) freq[v - 1]++; });
    });
    return freq.map((v, i) => ({ num: i + 1, freq: v }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 5)
      .map(x => x.num);
  }, [history, cfg.front]);

  const realHotBack = useMemo(() => {
    if (history.length === 0 || cfg.back === 0) return [];
    const freq: number[] = new Array(cfg.back).fill(0);
    history.slice(0, 50).forEach(h => {
      if (h.back) h.back.forEach(n => { const v = parseInt(n); if (v >= 1 && v <= cfg.back) freq[v - 1]++; });
    });
    return freq.map((v, i) => ({ num: i + 1, freq: v }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 3)
      .map(x => x.num);
  }, [history, cfg.back]);

  // ── AI 模型推荐的 Top 热号 ──
  const aiHotFront = useMemo(() => {
    if (!prediction) return [];
    return prediction.front.slice(0, 5).map(r => r.number);
  }, [prediction]);

  const aiHotBack = useMemo(() => {
    if (!prediction || cfg.back === 0) return [];
    return prediction.back.slice(0, 3).map(r => r.number);
  }, [prediction, cfg.back]);

  const { lastPeriod, lastDrawDate } = useMemo(() => {
    // 从 history 取最新一期（history[0] 是最新的）
    const latest = history[0];
    return { lastPeriod: latest?.period, lastDrawDate: latest?.date };
  }, [history]);

  return (
    <main className="pb-24 min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => router.back()} className="text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-semibold flex-1">{cfg.name} 专业分析</h1>
          {/* Type selector */}
          <select value={type} onChange={e => router.push(`/lottery/${e.target.value}/chart`)}
            className="text-xs bg-surface rounded-[10px] px-2 py-1 border border-[rgba(69,204,213,0.1)]">
            {Object.entries(LOTTERY_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-surface rounded-[8px] animate-pulse" />)}
        </div>
      )}

      {/* Content: always rendered so chartRef is never null */}
      <div className={`px-4 mt-3 space-y-3 ${loading ? 'hidden' : ''}`}>
          {/* 数据新鲜度 */}
          <DrawFreshnessBar
            type={type}
            lastPeriod={lastPeriod}
            lastDrawDate={lastDrawDate}
            onRefresh={() => loadData(true)}
            loading={loading}
          />

          {/* 热冷号卡片：实际数据 vs AI 模型 */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold">📊 数据对比</span>
              <span className="text-[10px] text-text-tertiary">
                {lastUpdated ? `更新于 ${lastUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : cfg.name}
              </span>
            </div>
            {/* 实际数据热号 */}
            <div className="mb-3 pb-3 border-b border-[rgba(69,204,213,0.08)]">
              <div className="text-[10px] font-semibold text-brand-teal-dark mb-2">📈 实际热号（近50期开奖数据）</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[9px] text-text-tertiary mb-1">前区</div>
                  <div className="flex gap-1.5">
                    {realHotFront.map(n => (
                      <span key={n} className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                    {realHotFront.length === 0 && <span className="text-[10px] text-text-tertiary">加载中...</span>}
                  </div>
                </div>
                {cfg.back > 0 && (
                  <div>
                    <div className="text-[9px] text-text-tertiary mb-1">后区</div>
                    <div className="flex gap-1.5">
                      {realHotBack.map(n => (
                        <span key={n} className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* AI 模型热号 */}
            <div>
              <div className="text-[10px] font-semibold text-purple-600 mb-2">🤖 AI 模型推荐</div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-[9px] text-text-tertiary mb-1">前区</div>
                  <div className="flex gap-1.5">
                    {aiHotFront.map(n => (
                      <span key={n} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                    {aiHotFront.length === 0 && <span className="text-[10px] text-text-tertiary">加载中...</span>}
                  </div>
                </div>
                {cfg.back > 0 && (
                  <div>
                    <div className="text-[9px] text-text-tertiary mb-1">后区</div>
                    <div className="flex gap-1.5">
                      {aiHotBack.map(n => (
                        <span key={n} className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-surface rounded-[8px] p-[3px] shadow-sm border border-[rgba(69,204,213,0.06)]">
            {[
              { key: "trend" as const, label: "走势图" },
              { key: "freq" as const, label: "频率分析" },
              { key: "miss" as const, label: "遗漏分析" },
              { key: "predict" as const, label: "AI 荐号" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-center rounded-[8px] text-xs font-medium transition-colors ${
                  activeTab === tab.key ? "bg-brand-teal text-white shadow-sm" : "text-text-secondary"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2 text-[11px] text-text-secondary">
            <span>分析周期:</span>
            {[5, 20, 50, 100].map(n => (
              <button key={n} onClick={() => setPeriods(n)}
                className={`px-3 py-1 rounded-[10px] ${periods === n ? "bg-brand-teal text-white" : "bg-surface border border-[rgba(69,204,213,0.1)]"}`}>
                {n}期
              </button>
            ))}
          </div>

          {/* Chart area for trend/freq/miss */}
          {(activeTab !== "predict") && (
            <div ref={chartRef} className="bg-surface rounded-[8px] p-3 shadow-sm border border-[rgba(69,204,213,0.06)]" style={{ height: 480 }} />
          )}

          {/* AI Predict — 多模型集成 */}
          {activeTab === "predict" && prediction && (
            <div className="space-y-3">

              {/* 模型贡献度 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">🧠 多模型集成预测</span>
                  <span className="text-[10px] text-text-tertiary">综合置信度 {prediction.stats.weightedAccuracy}%</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {Object.entries(prediction.stats.modelContributions).map(([key, val]) => {
                    const labels: Record<string, string> = { freq: "频率", bayes: "贝叶斯", markov: "马尔可夫", pattern: "模式", monte: "蒙特卡洛" };
                    const colors: Record<string, string> = { freq: "from-brand-coral to-brand-coral-dark", bayes: "from-blue-400 to-blue-600", markov: "from-purple-400 to-purple-600", pattern: "from-green-400 to-green-600", monte: "from-amber-400 to-amber-600" };
                    return (
                      <div key={key} className="flex-1 text-center">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${colors[key] || "from-gray-400 to-gray-500"}`} style={{ width: `${val}%`, minWidth: 8 }} />
                        <div className="text-[8px] text-text-tertiary mt-0.5">{labels[key] || key}</div>
                        <div className="text-[9px] font-semibold">{val}%</div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-text-tertiary">基于 {prediction.stats.totalPeriods} 期历史数据 · {Object.keys(prediction.stats.modelContributions).length} 个数学模型</div>
              </div>

              {/* 前区推荐 */}
              <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
                <div className="text-[11px] font-semibold mb-2">前区推荐（按综合得分排序）</div>
                <div className="flex gap-2 flex-wrap">
                  {prediction.front.slice(0, 10).map(r => (
                    <div key={r.number} className="flex flex-col items-center w-[52px]">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                        ${r.confidence > 80 ? 'bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white' :
                          r.confidence > 60 ? 'bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white' :
                          'bg-gradient-to-br from-gray-300 to-gray-400 text-white'}`}>
                        {String(r.number).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] text-text-tertiary mt-0.5">{Math.round(r.confidence)}%</span>
                      <div className="flex gap-[2px] mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${r.freqScore > 60 ? 'bg-brand-coral' : 'bg-gray-200'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${r.bayesScore > 60 ? 'bg-blue-400' : 'bg-gray-200'}`} />
                        <div className={`w-1.5 h-1.5 rounded-full ${r.markovScore > 60 ? 'bg-purple-400' : 'bg-gray-200'}`} />
                      </div>
                      <span className="text-[7px] text-text-tertiary">遗漏{r.missValue}期</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2 text-[9px] text-text-tertiary">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-coral" />频率</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />贝叶斯</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" />马尔可夫</span>
                </div>
              </div>

              {/* 后区推荐 */}
              {cfg.back > 0 && prediction.back.length > 0 && (
                <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
                  <div className="text-[11px] font-semibold mb-2">后区推荐</div>
                  <div className="flex gap-2 flex-wrap">
                    {prediction.back.slice(0, 5).map(r => (
                      <div key={r.number} className="flex flex-col items-center">
                        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {String(r.number).padStart(2, "0")}
                        </span>
                        <span className="text-[8px] text-text-tertiary mt-0.5">{Math.round(r.confidence)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 推荐组合 */}
              <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[8px] p-5 text-white shadow-lg">
                <div className="text-[11px] opacity-80 mb-2">🎯 AI 推荐组合</div>
                <div className="text-base font-bold tracking-wider">
                  {prediction.ensemble.top5.map(n => String(n).padStart(2, "0")).join(" ")}
                  {cfg.back > 0 && prediction.ensemble.top3Back && (
                    <span className="text-brand-gold"> + {prediction.ensemble.top3Back.map(n => String(n).padStart(2, "0")).join(" ")}</span>
                  )}
                </div>
                <div className="flex gap-3 mt-2 text-[10px] opacity-70">
                  <span>综合置信度 {prediction.stats.weightedAccuracy}%</span>
                  <span>区间: {prediction.stats.hotZones}</span>
                </div>
              </div>

              {/* 各号码详情 */}
              <details className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
                <summary className="text-[11px] font-semibold cursor-pointer">📊 各模型详细评分</summary>
                <div className="mt-3 space-y-1 text-[10px]">
                  <div className="grid grid-cols-8 gap-1 text-text-tertiary pb-1 border-b border-[rgba(69,204,213,0.1)]">
                    <span>号码</span><span>综合</span><span>频率</span><span>贝叶斯</span><span>马尔可夫</span><span>模式</span><span>蒙特卡洛</span><span>遗漏</span>
                  </div>
                  {prediction.front.slice(0, 15).map(r => (
                    <div key={r.number} className="grid grid-cols-8 gap-1">
                      <span className="font-semibold">{String(r.number).padStart(2, "0")}</span>
                      <span>{Math.round(r.score)}</span>
                      <span className={r.freqScore > 50 ? "text-brand-coral" : ""}>{Math.round(r.freqScore)}</span>
                      <span className={r.bayesScore > 50 ? "text-blue-500" : ""}>{Math.round(r.bayesScore)}</span>
                      <span className={r.markovScore > 50 ? "text-purple-500" : ""}>{Math.round(r.markovScore)}</span>
                      <span className={r.patternScore > 50 ? "text-green-500" : ""}>{Math.round(r.patternScore)}</span>
                      <span className={r.monteCarloScore > 50 ? "text-amber-500" : ""}>{Math.round(r.monteCarloScore)}</span>
                      <span className={r.missValue > 10 ? "text-red-500 font-bold" : ""}>{r.missValue}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
    </main>
  );
}

/* ────────── Chart Renderers ────────── */

function renderTrendChart(chart: echarts.ECharts, data: TrendData["data"], cfg: typeof LOTTERY_TYPES[string]) {
  const labels = data.map(d => String(d.period).slice(-4));
  const isMulti = cfg.back > 0;

  const series: any[] = [];
  const colors = ["#F27152", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  // Front number trend lines
  for (let i = 0; i < Math.min(cfg.front, 5); i++) {
    const values = data.map(d => d.front?.[i] ?? null);
    series.push({
      name: `位${i + 1}`,
      type: "line" as const,
      data: values,
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2, color: colors[i % colors.length] },
      itemStyle: { color: colors[i % colors.length] },
    });
  }

  // Back numbers if multi-zone
  if (isMulti) {
    for (let i = 0; i < Math.min(cfg.back, 2); i++) {
      const values = data.map(d => d.back?.[i] ?? null);
      series.push({
        name: `后区${i + 1}`,
        type: "line" as const,
        data: values,
        smooth: true,
        symbol: "diamond",
        symbolSize: 8,
        lineStyle: { width: 2, type: "dashed" as const, color: colors[(i + 3) % colors.length] },
        itemStyle: { color: colors[(i + 3) % colors.length] },
      });
    }
  }

  chart.setOption({
    tooltip: { trigger: "axis", backgroundColor: "rgba(255,255,255,0.95)", borderColor: "#e5e7eb" },
    legend: { bottom: 0, textStyle: { fontSize: 10 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { left: "8%", right: "5%", top: "5%", bottom: "18%" },
    dataZoom: [{ type: "inside" as const }, { type: "slider" as const, bottom: 30, height: 20 }],
    xAxis: { type: "category", data: labels, axisLabel: { rotate: 45, fontSize: 9 } },
    yAxis: { type: "value", min: 0, max: cfg.front + 2, splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } } },
    series,
  });
}

function renderFreqChart(chart: echarts.ECharts, data: TrendData["data"], cfg: typeof LOTTERY_TYPES[string]) {
  const freq: number[] = new Array(cfg.front).fill(0);
  data.forEach(d => d.front?.forEach((n: number) => { if (n <= cfg.front) freq[n - 1]++; }));

  const backFreq = cfg.back > 0 ? new Array(cfg.back).fill(0) : null;
  if (backFreq) {
    data.forEach(d => d.back?.forEach((n: number) => { if (n <= cfg.back) backFreq[n - 1]++; }));
  }

  const labels = freq.map((_, i) => String(i + 1).padStart(2, "0"));

  chart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: "8%", right: "5%", top: "5%", bottom: "15%" },
    dataZoom: [{ type: "inside" as const }, { type: "slider" as const, bottom: 25, height: 20 }],
    xAxis: { type: "category", data: labels, axisLabel: { fontSize: 9 } },
    yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } } },
    series: [
      {
        name: "前区出现次数",
        type: "bar",
        data: freq.map((v, i) => ({
          value: v,
          itemStyle: {
            color: v >= Math.max(...freq) * 0.8 ? "#F27152" :
                   v <= Math.min(...freq) + 1 ? "#93C5FD" : "#6BA3A3",
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: "60%",
      },
      ...(backFreq ? [{
        name: "后区出现次数",
        type: "bar",
        data: backFreq.map((v, i) => ({
          value: v,
          itemStyle: {
            color: v >= Math.max(...backFreq) * 0.8 ? "#F59E0B" :
                   v <= Math.min(...backFreq) + 1 ? "#FDE68A" : "#C9A96E",
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: "40%",
      }] : []),
    ],
  });
}

function renderMissChart(chart: echarts.ECharts, data: TrendData["data"], cfg: typeof LOTTERY_TYPES[string]) {
  // Calculate missing values (遗漏值)
  const misses: number[] = new Array(cfg.front).fill(0);
  for (let i = data.length - 1; i >= 0; i--) {
    const drawn = new Set(data[i].front || []);
    for (let n = 1; n <= cfg.front; n++) {
      if (!drawn.has(n)) misses[n - 1]++;
      else misses[n - 1] = 0;
    }
  }
  // Back misses
  const backMisses = cfg.back > 0 ? new Array(cfg.back).fill(0) : null;
  if (backMisses) {
    for (let i = data.length - 1; i >= 0; i--) {
      const drawn = new Set(data[i].back || []);
      for (let n = 1; n <= cfg.back; n++) {
        if (!drawn.has(n)) backMisses[n - 1]++;
        else backMisses[n - 1] = 0;
      }
    }
  }

  const labels = misses.map((_, i) => String(i + 1).padStart(2, "0"));
  const maxMiss = Math.max(...misses, 1);

  chart.setOption({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const p = params[0];
        return `号码 ${p.name}<br/>遗漏值: ${p.value} 期${p.value > 10 ? " 🔥 大遗漏" : ""}`;
      }
    },
    grid: { left: "8%", right: "5%", top: "5%", bottom: "15%" },
    dataZoom: [{ type: "inside" as const }, { type: "slider" as const, bottom: 25, height: 20 }],
    xAxis: { type: "category", data: labels, axisLabel: { fontSize: 9 } },
    yAxis: { type: "value", max: maxMiss + 5, splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } } },
    visualMap: {
      min: 0, max: maxMiss, dimension: 1,
      inRange: { color: ["#6BA3A3", "#FDE68A", "#F27152"] },
      show: false,
    },
    series: [
      {
        name: "遗漏值",
        type: "bar",
        data: misses.map((v, i) => ({
          value: v,
          itemStyle: {
            color: v > 10 ? "#F27152" : v > 5 ? "#FDE68A" : "#6BA3A3",
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barWidth: "60%",
        markLine: {
          data: [{ yAxis: 10, label: { formatter: "大遗漏线", fontSize: 10 } }],
          lineStyle: { color: "#F27152", type: "dashed" },
          label: { fontSize: 10 },
          silent: true,
        },
      },
      ...(backMisses ? [{
        name: "后区遗漏",
        type: "bar",
        data: backMisses.map(v => ({
          value: v,
          itemStyle: { color: v > 8 ? "#F59E0B" : v > 4 ? "#FDE68A" : "#C9A96E", borderRadius: [4, 4, 0, 0] },
        })),
        barWidth: "30%",
      }] : []),
    ],
  });
}
