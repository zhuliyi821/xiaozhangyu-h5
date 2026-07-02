/**
 * 🔮 预测页
 *
 * 使用 PredictTemplate 模板渲染，集成实时 AI 彩票预测
 */
"use client";

import { useState, useEffect } from "react";
import { PredictTemplate } from "@/templates";
import { getTrend } from "@/lib/api";
import { predict } from "@/lib/ai-models";

export default function PredictPage() {
  const [lotteryPred, setLotteryPred] = useState<{ top5: number[]; top3Back?: number[]; score: number } | null>(null);

  useEffect(() => {
    getTrend("dlt").then(trend => {
      if (!trend || trend.data.length === 0) return;
      const frontData = trend.data.map(d => d.front || []);
      const backData = trend.data.map(d => d.back || []);
      const result = predict(
        { front: frontData, back: backData },
        { frontMax: 35, backMax: 12, totalPeriods: 50 }
      );
      setLotteryPred({
        top5: result.ensemble.top5,
        top3Back: result.ensemble.top3Back,
        score: Math.round(result.stats.weightedAccuracy),
      });
    }).catch(() => {});
  }, []);

  return <PredictTemplate lotteryPrediction={lotteryPred} />;
}
