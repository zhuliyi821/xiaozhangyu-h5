"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFuturesQuote } from "@/components/futures/use-futures-quote";
import { useFuturesWallet } from "@/components/futures/use-futures-wallet";
import { useFuturesPositions } from "@/components/futures/use-futures-positions";
import { useFuturesTrading } from "@/components/futures/use-futures-trading";
import { IndexTabs } from "@/components/futures/index-tabs";
import { PricePanel } from "@/components/futures/price-panel";
import { PriceChart } from "@/components/futures/price-chart";
import { TradingPanel } from "@/components/futures/trading-panel";
import { PositionList } from "@/components/futures/position-list";
import { AiAnalysis } from "@/components/futures/ai-analysis";
import { TradeStats } from "@/components/futures/trade-stats";
import { TradingTip } from "@/components/futures/trading-tip";
import { ErrorMessage } from "@/components/futures/error-message";

export default function FuturesPage() {
  const { user } = useAuth();
  const quote = useFuturesQuote();
  const wallet = useFuturesWallet(user?.uid);
  const positions = useFuturesPositions(quote.idx.multiplier);
  const trading = useFuturesTrading({
    uid: user?.uid,
    contract: quote.idx.contract,
    contractName: quote.idx.name,
    multiplier: quote.idx.multiplier,
    currentPrice: quote.price,
  });
  const [showTip, setShowTip] = useState(true);

  // 仅显示当前指数的持仓
  const currentPositions = positions.positions.filter(p => p.indexCode === quote.idx.contract);
  const currentFloatingPnl = currentPositions.reduce((s, p) => s + p.pnl, 0);
  useEffect(() => {
    positions.updatePositions(quote.price, quote.idx.multiplier);
  }, [quote.price, quote.idx.multiplier]);

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
            <h1 className="text-lg font-bold text-white">📈 沪深期货模拟盘</h1>
            <p className="text-[11px] text-white/80">100%模拟教学 · 零风险学习期货交易</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-3">
        <IndexTabs
          activeIndex={quote.activeIndex}
          onSwitch={quote.switchIndex}
          onClearError={() => { trading.setError(""); positions.setError(""); }}
        />

        <PricePanel
          name={quote.idx.name}
          contract={quote.idx.contract}
          desc={quote.idx.desc}
          price={quote.price}
          change={quote.change}
          changePct={quote.changePct}
          open={quote.open}
          high={quote.high}
          low={quote.low}
          preClose={quote.preClose}
        />

        <PriceChart
          chartData={quote.chartData}
          change={quote.change}
          multiplier={quote.idx.multiplier}
          leverage={trading.leverage}
          marginPct={trading.marginPct}
        />

        {quote.loading && (
          <div className="flex items-center justify-center py-6 text-text-tertiary">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">获取行情数据...</span>
          </div>
        )}

        <ErrorMessage message={trading.error || positions.error} />

        {trading.lastSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-xs border border-green-200 animate-slide-down">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {trading.lastSuccess}
          </div>
        )}

        <TradingPanel
          user={user}
          direction={trading.direction}
          lots={trading.lots}
          leverage={trading.leverage}
          marginNeeded={trading.marginNeeded}
          realBalance={wallet.realBalance}
          usedMargin={positions.usedMargin}
          availableCapital={wallet.realBalance - positions.usedMargin}
          price={quote.price}
          operating={trading.operating}
          isLoggedIn={!!user}
          contract={quote.idx.contract}
          multiplier={quote.idx.multiplier}
          contractName={quote.idx.name}
          onDirectionChange={trading.setDirection}
          onLotsChange={trading.setLots}
          onLeverageChange={trading.setLeverage}
          onOpen={() => trading.openPosition(
            wallet.realBalance, positions.usedMargin,
            positions.addPosition, positions.addTrade,
            wallet.fetchBalance,
          )}
          onRefreshBalance={wallet.fetchBalance}
        />

        <PositionList
          positions={currentPositions}
          floatingPnl={currentFloatingPnl}
          operating={trading.operating}
          onClose={(pos) => trading.closePosition(
            pos, quote.price,
            positions.removePosition, positions.addTrade,
            wallet.fetchBalance,
          )}
        />

        <TradingTip
          visible={showTip}
          contract={quote.idx.contract}
          multiplier={quote.idx.multiplier}
          leverage={trading.leverage}
          marginPct={trading.marginPct}
          marginNeeded={trading.marginNeeded}
          contractName={quote.idx.name}
          onDismiss={() => setShowTip(false)}
        />

        <AiAnalysis data={quote.analysisData} />

        <TradeStats
          realizedPnl={positions.realizedPnl}
          floatingPnl={positions.floatingPnl}
          usedMargin={positions.usedMargin}
          realBalance={wallet.realBalance}
          trades={positions.trades}
          onReset={positions.reset}
        />
      </div>
    </main>
  );
}
