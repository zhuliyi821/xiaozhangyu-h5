"use client";

import { useState, useCallback, useEffect } from "react";
import { API_BASE } from "@/config/api";

// ─── 指数配置 ───
export const INDEXES = [
  { code: "sh000300", name: "沪深300", contract: "IF", multiplier: 300, marginRate: 0.12, desc: "沪深交易所规模最大、流动性最好的300只股票" },
  { code: "sh000016", name: "上证50", contract: "IH", multiplier: 300, marginRate: 0.12, desc: "上交所规模最大、流动性最好的50只股票" },
  { code: "sh000905", name: "中证500", contract: "IC", multiplier: 200, marginRate: 0.14, desc: "剔除沪深300后市值最大的500只中盘股" },
];

export interface KLineData {
  date: string;
  o: number;
  c: number;
  h: number;
  l: number;
  v: number;
}

export interface AnalysisData {
  score: number;
  confidence: number;
  signal: string;
  rsi: number;
  macd: number;
  support: number;
  resistance: number;
}

const BASE_PRICES = [3800, 2600, 5600];

function generateChartData(basePrice: number, volatility = 0.015): KLineData[] {
  const data: KLineData[] = [];
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
}

export function useFuturesQuote() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePct, setChangePct] = useState(0);
  const [open, setOpen] = useState(0);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);
  const [preClose, setPreClose] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<KLineData[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const idx = INDEXES[activeIndex];

  const fetchData = useCallback(async (code: string) => {
    setLoading(true);
    const basePrice = BASE_PRICES[activeIndex];
    try {
      const [analysisRes] = await Promise.all([
        fetch(`${API_BASE}/api/stock/analysis?code=${code}`).catch(() => null),
      ]);

      const now = new Date();
      const seed = now.getHours() * 100 + now.getMinutes();
      const simChange = ((seed % 31 - 15) / 1000) * basePrice;
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

      if (analysisRes) {
        const json = await analysisRes.json();
        if (json.code === 0 && json.data) {
          const d = json.data;
          const score = d.total_score || 50;
          const signal = d.signal || "neutral";
          const confidence = Math.round(Math.min(95, Math.max(40, score + (Math.random() - 0.5) * 20)));
          const rsi = Math.round((score / 100) * 40 + 30 + (Math.random() - 0.5) * 10);
          const macdHist = score > 55 ? Math.random() * 15 : score < 40 ? -Math.random() * 15 : (Math.random() - 0.5) * 10;
          const support = Math.round(basePrice * (0.95 + Math.random() * 0.02));
          const resistance = Math.round(basePrice * (1.03 + Math.random() * 0.02));

          setAnalysisData({ score, confidence, signal, rsi, macd: parseFloat(macdHist.toFixed(1)), support, resistance });
        }
      }
    } catch {
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
  }, [activeIndex]);

  useEffect(() => { fetchData(idx.code); }, [idx.code]);

  const switchIndex = useCallback((i: number) => {
    setActiveIndex(i);
  }, []);

  return {
    activeIndex, switchIndex,
    idx,
    price, change, changePct, open, high, low, preClose,
    loading, chartData, analysisData,
    fetchData,
  };
}
