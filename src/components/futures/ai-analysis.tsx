"use client";

import { Activity, RefreshCw } from "lucide-react";
import type { AnalysisData } from "./use-futures-quote";

interface AiAnalysisProps {
  data: AnalysisData | null;
}

export function AiAnalysis({ data }: AiAnalysisProps) {
  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-semibold">AI行情研判（决策参考）</span>
      </div>
      <p className="text-[10px] text-text-tertiary mb-3">
        基于多模型量化分析，以下研判仅作为模拟交易决策参考
      </p>
      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-bg rounded-xl p-3">
              <div className="text-[10px] text-text-tertiary">综合评分</div>
              <div className={`text-lg font-bold ${data.score >= 60 ? "text-brand-coral" : data.score >= 40 ? "text-amber-500" : "text-brand-teal"}`}>
                {data.score}/100
              </div>
            </div>
            <div className="bg-bg rounded-xl p-3">
              <div className="text-[10px] text-text-tertiary">模型置信度</div>
              <div className="text-lg font-bold text-brand-teal-dark">{data.confidence}%</div>
            </div>
          </div>
          <div className="bg-bg rounded-xl p-3 mb-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-text-secondary">
                信号:{" "}
                <strong className={data.signal === "buy" ? "text-brand-coral" : "text-text-primary"}>
                  {data.signal === "buy" ? "🚀 买入" : data.signal === "sell" ? "🛑 卖出" : "⏳ 持有观望"}
                </strong>
              </span>
              <span className="text-text-tertiary">RSI {data.rsi.toFixed(1)}</span>
              <span className="text-text-tertiary">MACD {data.macd >= 0 ? "📈多头" : "📉空头"}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-tertiary">
              <span>🛡 支撑: <b>{data.support.toFixed(0)}</b></span>
              <span>🎯 压力: <b>{data.resistance.toFixed(0)}</b></span>
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
  );
}
