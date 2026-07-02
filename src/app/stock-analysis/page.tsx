"use client";

import StockPredictor from "@/components/stock-predictor";
import { ArrowLeft } from "lucide-react";

export default function StockAnalysisPage() {
  return (
    <main className="pb-20 min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-gold px-5 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => window.history.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">股市预测</h1>
            <p className="text-[11px] text-white/80">多模型量化分析 · 实时行情</p>
          </div>
        </div>
      </div>

      <StockPredictor />
    </main>
  );
}
