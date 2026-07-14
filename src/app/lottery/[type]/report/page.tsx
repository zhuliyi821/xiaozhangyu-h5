"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getTrend, getHistory, TrendData } from "@/lib/api";
import { predict, PredictionResult, ModelResult } from "@/lib/ai-models";
import * as echarts from "echarts/core";
import { RadarChart, BarChart, LineChart, PieChart, ScatterChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  RadarComponent, VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  RadarChart, BarChart, LineChart, PieChart, ScatterChart,
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  RadarComponent, VisualMapComponent, CanvasRenderer,
]);

const LOTTERY_TYPES: Record<string, { name: string; front: number; back: number }> = {
  dlt: { name: "大乐透", front: 35, back: 12 },
  ssq: { name: "双色球", front: 33, back: 16 },
  pl3: { name: "排列3", front: 10, back: 0 },
  fc3d: { name: "3D", front: 10, back: 0 },
  qxc: { name: "七星彩", front: 10, back: 0 },
};

const MODEL_LABELS: Record<string, string> = {
  freqScore: "频率分析", bayesScore: "贝叶斯", markovScore: "马尔可夫", patternScore: "模式识别", monteCarloScore: "蒙特卡洛"
};
const MODEL_COLORS: Record<string, string> = {
  freqScore: "#F27152", bayesScore: "#3B82F6", markovScore: "#8B5CF6", patternScore: "#10B981", monteCarloScore: "#F59E0B"
};

export default function PredictionReportPage() {
  const params = useParams();
  const router = useRouter();
  const type = (params.type as string) || "dlt";
  const cfg = LOTTERY_TYPES[type] || LOTTERY_TYPES.dlt;

  const [trend, setTrend] = useState<TrendData | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState(50);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);

  const radarRef = useRef<HTMLDivElement>(null);
  const radarInst = useRef<echarts.ECharts | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const detailInst = useRef<echarts.ECharts | null>(null);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const d = await getTrend(type);
      setTrend(d);
    } catch (e) {
      console.error("预测报告数据刷新失败", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(false), 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Run prediction
  useEffect(() => {
    if (!trend || trend.data.length === 0) return;
    const frontData = trend.data.map(d => d.front || []);
    const backData = cfg.back > 0 ? trend.data.map(d => d.back || []) : undefined;
    const result = predict(
      { front: frontData, back: backData },
      { frontMax: cfg.front, backMax: cfg.back, totalPeriods: periods }
    );
    setPrediction(result);
  }, [trend, periods, cfg.front, cfg.back]);

  // Radar chart (模型对比雷达图)
  useEffect(() => {
    if (!prediction || !radarRef.current) return;
    if (radarInst.current) radarInst.current.dispose();
    const chart = echarts.init(radarRef.current);

    const topNum = prediction.front[0];
    if (!topNum) return;

    const indicators = [
      { name: "频率分析", max: 100 },
      { name: "贝叶斯", max: 100 },
      { name: "马尔可夫", max: 100 },
      { name: "模式识别", max: 100 },
      { name: "蒙特卡洛", max: 100 },
    ];
    const top5 = prediction.front.slice(0, 5);

    chart.setOption({
      tooltip: { trigger: "item" },
      legend: { bottom: 0, data: top5.map(n => `#${String(n.number).padStart(2, "0")}`), textStyle: { fontSize: 10 } },
      radar: { indicator: indicators, center: ["50%", "45%"], radius: "60%", axisName: { fontSize: 10 } },
      series: [{
        type: "radar",
        data: top5.map(n => ({
          name: `#${String(n.number).padStart(2, "0")}`,
          value: [n.freqScore, n.bayesScore, n.markovScore, n.patternScore, n.monteCarloScore],
          areaStyle: { opacity: 0.15 },
          lineStyle: { width: 2 },
        })),
      }],
    });

    radarInst.current = chart;
    return () => { chart.dispose(); };
  }, [prediction]);

  // Detail bar chart
  useEffect(() => {
    if (!prediction || !detailRef.current) return;
    if (detailInst.current) detailInst.current.dispose();
    const chart = echarts.init(detailRef.current);

    const nums = selectedNum
      ? [prediction.front.find(n => n.number === selectedNum)!].filter(Boolean)
      : prediction.front.slice(0, 8);

    const labels = nums.map(n => `#${String(n.number).padStart(2, "0")}`);
    const data = nums.map(n => ({
      name: `#${String(n.number).padStart(2, "0")}`,
      value: [n.freqScore, n.bayesScore, n.markovScore, n.patternScore, n.monteCarloScore],
    }));

    chart.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { bottom: 0, data: Object.values(MODEL_LABELS), textStyle: { fontSize: 9 }, icon: "roundRect" },
      grid: { left: "8%", right: "3%", top: "5%", bottom: "22%" },
      xAxis: { type: "category", data: labels, axisLabel: { fontSize: 10, rotate: 30 } },
      yAxis: { type: "value", max: 100, splitLine: { lineStyle: { type: "dashed" } } },
      series: Object.entries(MODEL_LABELS).map(([key, label], i) => ({
        name: label,
        type: "bar",
        data: data.map(d => ({ value: d.value[i], itemStyle: { color: Object.values(MODEL_COLORS)[i], borderRadius: [3, 3, 0, 0] } })),
        barWidth: 12,
      })),
    });

    detailInst.current = chart;
    return () => { chart.dispose(); };
  }, [prediction, selectedNum]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12 gap-2">
          <button onClick={() => router.back()} className="text-text-secondary"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-semibold flex-1">{cfg.name} 预测报告</h1>
          <button onClick={() => window.print()} className="text-[11px] bg-brand-teal text-white px-3 py-1.5 rounded-[10px] flex items-center gap-1">
            <Download className="w-3 h-3" /> 导出
          </button>
        </div>
      </div>

      {loading || !prediction ? (
        <div className="p-4 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface rounded-[8px] animate-pulse" />)}</div>
      ) : (
        <div className="px-4 mt-3 space-y-3">

          {/* ═══════════ 1. 预测摘要 ═══════════ */}
          <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[8px] p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[11px] opacity-80">{cfg.name} 预测报告</div>
                <div className="text-lg font-bold mt-0.5">AI多模型集成预测</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{prediction.stats.weightedAccuracy}%</div>
                <div className="text-[10px] opacity-70">综合置信度</div>
              </div>
            </div>
            <div className="flex gap-4 text-[11px] opacity-80">
              <span>📊 分析 {prediction.stats.totalPeriods} 期</span>
              <span>🧠 5个数学模型</span>
              <span>🎯 Top5 推荐</span>
            </div>
          </div>

          {/* ═══════════ 2. 推荐组合 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-[rgba(69,204,213,0.06)] text-center">
            <div className="text-[11px] text-text-tertiary mb-2">🎯 AI 推荐组合</div>
            <div className="text-xl font-bold tracking-widest mb-2">
              {prediction.ensemble.top5.map(n => (
                <span key={n} className="inline-block mx-0.5 w-9 h-9 leading-9 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white text-sm">
                  {String(n).padStart(2, "0")}
                </span>
              ))}
              {prediction.ensemble.top3Back && (
                <span className="ml-2">
                  {prediction.ensemble.top3Back.map(n => (
                    <span key={n} className="inline-block mx-0.5 w-9 h-9 leading-9 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white text-sm">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <div className="text-[10px] text-text-tertiary">综合置信度 {prediction.stats.weightedAccuracy}% · {prediction.stats.hotZones}</div>
          </div>

          {/* ═══════════ 3. 模型雷达图 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">📡 模型对比雷达图</span>
              <span className="text-[9px] text-text-tertiary">Top5号码 · 5维度评分</span>
            </div>
            <div ref={radarRef} style={{ height: 280 }} />
            <div className="flex flex-wrap gap-2 mt-1">
              {Object.entries(MODEL_COLORS).map(([key, color]) => (
                <span key={key} className="flex items-center gap-1 text-[9px] text-text-tertiary">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {MODEL_LABELS[key]}
                </span>
              ))}
            </div>
          </div>

          {/* ═══════════ 4. 模型贡献度 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="text-xs font-semibold mb-3">📊 模型贡献度分析</div>
            <div className="space-y-2">
              {Object.entries(prediction.stats.modelContributions)
                .sort(([, a], [, b]) => b - a)
                .map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-[11px] mb-0.5">
                    <span style={{ color: MODEL_COLORS[key] }}>{MODEL_LABELS[key] || key}</span>
                    <span className="font-semibold">{val}%</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${val}%`, background: `linear-gradient(90deg, ${MODEL_COLORS[key]}, ${MODEL_COLORS[key]}88)` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ 5. 号码详情条形图 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold">📈 各号码多模型评分</span>
              <select value={selectedNum ?? ""} onChange={e => setSelectedNum(e.target.value ? Number(e.target.value) : null)}
                className="text-[10px] bg-bg rounded-[8px] px-2 py-1 border border-[rgba(69,204,213,0.1)]">
                <option value="">Top 8 综合</option>
                {prediction.front.slice(0, 15).map(r => (
                  <option key={r.number} value={r.number}>#{String(r.number).padStart(2, "0")} ({Math.round(r.confidence)}%)</option>
                ))}
              </select>
            </div>
            <div ref={detailRef} style={{ height: 260 }} />
          </div>

          {/* ═══════════ 6. 号码详细表格 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="text-xs font-semibold mb-3">📋 完整排名（前区）</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-text-tertiary border-b border-[rgba(69,204,213,0.1)]">
                    <th className="py-1.5 text-left">排名</th>
                    <th className="py-1.5">号码</th>
                    <th className="py-1.5">综合</th>
                    <th className="py-1.5" style={{ color: MODEL_COLORS.freqScore }}>频率</th>
                    <th className="py-1.5" style={{ color: MODEL_COLORS.bayesScore }}>贝叶斯</th>
                    <th className="py-1.5" style={{ color: MODEL_COLORS.markovScore }}>马尔可夫</th>
                    <th className="py-1.5" style={{ color: MODEL_COLORS.patternScore }}>模式</th>
                    <th className="py-1.5" style={{ color: MODEL_COLORS.monteCarloScore }}>蒙特卡洛</th>
                    <th className="py-1.5">遗漏</th>
                    <th className="py-1.5">置信度</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.front.slice(0, 20).map((r, i) => (
                    <tr key={r.number} className={`${i < 5 ? "bg-amber-50/50" : ""} border-b border-[rgba(69,204,213,0.05)] cursor-pointer hover:bg-bg/50`}
                      onClick={() => setSelectedNum(r.number)}>
                      <td className="py-1.5 font-semibold">{i + 1}</td>
                      <td className="py-1.5 text-center">
                        <span className={`inline-block w-7 h-7 leading-7 rounded-full text-white text-[9px] font-bold ${i < 5 ? "bg-gradient-to-br from-brand-coral to-brand-coral-dark" : "bg-gray-400"}`}>
                          {String(r.number).padStart(2, "0")}
                        </span>
                      </td>
                      <td className="py-1.5 text-center font-semibold">{Math.round(r.score)}</td>
                      <td className="py-1.5 text-center" style={{ color: MODEL_COLORS.freqScore }}>{Math.round(r.freqScore)}</td>
                      <td className="py-1.5 text-center" style={{ color: MODEL_COLORS.bayesScore }}>{Math.round(r.bayesScore)}</td>
                      <td className="py-1.5 text-center" style={{ color: MODEL_COLORS.markovScore }}>{Math.round(r.markovScore)}</td>
                      <td className="py-1.5 text-center" style={{ color: MODEL_COLORS.patternScore }}>{Math.round(r.patternScore)}</td>
                      <td className="py-1.5 text-center" style={{ color: MODEL_COLORS.monteCarloScore }}>{Math.round(r.monteCarloScore)}</td>
                      <td className="py-1.5 text-center">{r.missValue}<span className="text-red-500">{r.missValue > 10 ? " 🔥" : ""}</span></td>
                      <td className="py-1.5 text-center">
                        <div className="inline-flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-bg rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.confidence}%`, background: r.confidence > 70 ? "#10B981" : r.confidence > 50 ? "#F59E0B" : "#EF4444" }} />
                          </div>
                          <span className="text-[9px]">{Math.round(r.confidence)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════ 7. 后区推荐 ═══════════ */}
          {cfg.back > 0 && prediction.back.length > 0 && (
            <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
              <div className="text-xs font-semibold mb-3">🎯 后区推荐</div>
              <div className="flex gap-3 flex-wrap">
                {prediction.back.slice(0, 6).map(r => (
                  <div key={r.number} className="flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {String(r.number).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-text-tertiary mt-0.5">{Math.round(r.confidence)}%</span>
                    <span className="text-[8px] text-text-tertiary">遗漏{r.missValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ 8. 区间分析 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="text-xs font-semibold mb-3">📐 区间分析</div>
            <div className="grid grid-cols-5 gap-2">
              {["01-07", "08-14", "15-21", "22-28", "29-35"].map((zone, idx) => {
                const hits = prediction.front.slice(0, 10).filter(r => {
                  const min = idx * 7 + 1;
                  const max = Math.min((idx + 1) * 7, cfg.front);
                  return r.number >= min && r.number <= max;
                }).length;
                return (
                  <div key={zone} className="text-center bg-bg rounded-[8px] p-2">
                    <div className="text-[9px] text-text-tertiary">{zone}</div>
                    <div className="text-lg font-bold" style={{ color: hits > 2 ? "#F27152" : hits > 0 ? "#6BA3A3" : "#93C5FD" }}>{hits}</div>
                    <div className="text-[8px] text-text-tertiary">{hits > 2 ? "热区 🔥" : hits > 0 ? "温区" : "冷区"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════ 9. 模型权重 ═══════════ */}
          <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
            <div className="text-xs font-semibold mb-2">⚙️ 模型权重配置</div>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              {Object.entries(prediction.ensemble.modelWeights).map(([key, val]) => (
                <div key={key}>
                  <div className="text-text-tertiary">{MODEL_LABELS[key] || key}</div>
                  <div className="font-semibold" style={{ color: MODEL_COLORS[key] }}>{(val * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════ Disclaimer ═══════════ */}
          <div className="text-center text-[10px] text-text-tertiary px-4 py-3">
            预测结果基于历史数据的数学模型计算，仅供参考。<br />
            彩票有风险，参与需谨慎。理性购彩，量力而行。
          </div>

        </div>
      )}
    </main>
  );
}