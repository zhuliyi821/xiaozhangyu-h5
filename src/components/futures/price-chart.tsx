"use client";

import { useRef, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import type { KLineData } from "./use-futures-quote";
import { C, getBrandRGB } from "@/lib/brand-colors";

interface PriceChartProps {
  chartData: KLineData[];
  change: number;
  multiplier: number;
  leverage: number;
  marginPct: number;
}

export function PriceChart({ chartData, change, multiplier, leverage, marginPct }: PriceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

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
    const lineColor = change >= 0 ? C.coral : C.teal;
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

    // MA lines
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

    drawMA(closes, 5, `rgba(${getBrandRGB("gold").r},${getBrandRGB("gold").g},${getBrandRGB("gold").b},0.6)`);
    drawMA(closes, 10, `rgba(${getBrandRGB("teal").r},${getBrandRGB("teal").g},${getBrandRGB("teal").b},0.6)`);
    drawMA(closes, 20, "rgba(142,142,147,0.6)");

    // Teach marker
    ctx.font = "9px sans-serif";
    if (data.length >= 10) {
      const last5 = closes.slice(-5);
      if (last5.length >= 2 && last5[last5.length - 1] > last5[0]) {
        const y2 = pad + drawH - ((closes[closes.length - 1] - mn) / range) * drawH;
        ctx.fillStyle = "#F2B631";
        ctx.fillText("💡 短线向上", pad + (closes.length / (data.length - 1)) * drawW - 30, y2 - 12);
      }
    }
  }, [chartData, change]);

  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm font-semibold">行情走势</span>
        </div>
        <div className="flex gap-2 text-[10px] text-text-tertiary">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" />MA5</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400 inline-block" />MA10</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gray-400 inline-block" />MA20</span>
        </div>
      </div>
      <canvas ref={chartRef} className="w-full rounded-xl bg-bg/50" style={{ height: "120px" }} />
      <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
        <span>合约乘数: {multiplier}元/点</span>
        <span>当前杠杆: {leverage}x（{marginPct}%保证金）</span>
      </div>
    </div>
  );
}
