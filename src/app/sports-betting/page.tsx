"use client";

/**
 * ⚽ 省超足球竞猜 — 主页面 (架构重构版)
 *
 * 重构要点:
 * - 状态管理: useBettingState 状态机
 * - 组件拆分: 12个独立组件
 * - 新增: 投注单 + Tab筛选
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { MOCK_MATCHES } from "./types";
import { AlertTriangle } from "lucide-react";

// Hooks
import { useBalance } from "@/components/sports-betting/use-balance";
import { useMatches } from "@/components/sports-betting/use-matches";
import { useBettingState } from "@/components/sports-betting/use-betting-state";

// Components
import { BettingHeader } from "@/components/sports-betting/betting-header";
import { MatchTabs } from "@/components/sports-betting/match-tabs";
import { MatchCard } from "@/components/sports-betting/match-card";
import { PlayTypeGrid } from "@/components/sports-betting/play-type-grid";
import { PlayTypeDetail } from "@/components/sports-betting/play-type-detail";
import { BettingSlip } from "@/components/sports-betting/betting-slip";
import { CelebrationModal } from "@/components/sports-betting/celebration-modal";
import { MyBetsPanel } from "@/components/sports-betting/my-bets-panel";
import { ConfirmBetModal } from "@/components/sports-betting/confirm-bet-modal";

// 常量
const MIN_BET = 100;
const BET_AMOUNTS: number[] = [100, 500, 1000, 5000];
const LIVE_STATS = { totalPlayers: 1847, totalBets: 3250000, ongoingMatches: 3 };

export default function SportsBettingPage() {
  const { user } = useAuth();
  const { balance, fetchBalance } = useBalance();
  const { filteredMatches, activeTab, setActiveTab, tabCounts, TAB_LABELS } = useMatches();

  // 我的参与
  const [myBets, setMyBets] = useState<any[]>([]);
  const [myBetsOpen, setMyBetsOpen] = useState(false);

  // 投注状态机
  const betState = useBettingState((newBets) => {
    setMyBets(prev => [...newBets, ...prev]);
    fetchBalance();
  });

  // 比赛卡片展开状态管理（独立于状态机）
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const toggleMatch = (matchId: string) => {
    setExpandedMatchId(prev => prev === matchId ? null : matchId);
    betState.expandMatch(matchId);
  };

  const handlePlayTypeSelect = (playType: string) => {
    betState.selectPlayType(playType as any);
    betState.setBetAmount(MIN_BET);
  };

  const handleAddToSlip = () => {
    const match = MOCK_MATCHES.find(m => m.id === betState.currentMatchId);
    if (!match || !betState.selectedPlayType || !betState.selectedOption) return;
    const item = betState.addToSlip(match, betState.selectedPlayType, betState.selectedOption, betState.betAmount);
    if (item) {
      setSlipOpen(true);
      // 按钮反馈标记
      setLastAddKey(`${betState.selectedPlayType}_${betState.selectedOption}`);
      setTimeout(() => setLastAddKey(""), 1500);
    }
  };

  const handleSubmitSlip = async () => {
    setShowConfirm(false);
    // 存储本次投注的统计信息
    const count = betState.slipItems.length;
    const amount = betState.totalSlipAmount;
    setLastBatchInfo({ count, totalAmount: amount });

    const ok = await betState.submitSlip(balance);
    if (ok) {
      setMyBetsOpen(true);
      fetchBalance();
    }
  };

  const requestConfirm = () => {
    if (betState.slipItems.length === 0) return;
    setShowConfirm(true);
  };

  // 计算预估收益
  const calcReward = () => {
    if (!betState.selectedPlayType || !betState.selectedOption) return 0;
    return betState.calcEstimatedReward(betState.selectedPlayType, betState.selectedOption, betState.betAmount);
  };

  // 投注单展开/折叠
  const [slipOpen, setSlipOpen] = useState(false);

  // 投注单变空时自动关闭
  useEffect(() => {
    if (betState.slipItems.length === 0) setSlipOpen(false);
  }, [betState.slipItems.length]);

  // 二次确认弹窗
  // 最后一次添加的key（用于按钮反馈）
  const [lastAddKey, setLastAddKey] = useState("");
  // 二次确认弹窗
  const [showConfirm, setShowConfirm] = useState(false);

  // 最后一次投注的统计（用于庆祝弹窗显示）
  const [lastBatchInfo, setLastBatchInfo] = useState({ count: 0, totalAmount: 0 });

  return (
    <main className="pb-24 bg-bg min-h-screen">
      <a href="#sports-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:text-brand-teal focus:px-4 focus:py-2 focus:rounded-[8px] focus:shadow-lg focus:text-sm focus:font-medium">
        跳转到竞猜内容
      </a>

      <BettingHeader
        totalPlayers={LIVE_STATS.totalPlayers}
        totalBets={LIVE_STATS.totalBets}
        ongoingMatches={LIVE_STATS.ongoingMatches}
        balance={balance}
        user={user}
        onRefreshBalance={fetchBalance}
      />

      <div id="sports-content" className="px-4 mt-3 space-y-3">
        {/* Tab筛选 */}
        <MatchTabs
          activeTab={activeTab}
          tabCounts={tabCounts}
          labels={TAB_LABELS}
          onTabChange={setActiveTab}
        />

        {/* 我的参与 */}
        <MyBetsPanel
          bets={myBets}
          isOpen={myBetsOpen}
          onToggle={() => setMyBetsOpen(!myBetsOpen)}
        />

        {/* 错误提示 */}
        {betState.error && (
          <div role="alert" aria-live="assertive" className="flex items-center gap-2 p-3 rounded-[8px] bg-brand-coral/5 text-brand-coral text-xs border border-brand-coral/20">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{betState.error}</span>
          </div>
        )}

        {/* 比赛列表 */}
        {filteredMatches.map(match => {
          const isExpanded = expandedMatchId === match.id;
          const hasBetOnMatch = myBets.some(b => b.matchId === match.id);

          // 热门推荐
          const hotPicks = match.status === "open" ? [
            { label: "🔥 主胜", playType: "1X2", option: "home" },
            { label: "⚽ 大球", playType: "over_under", option: "over" },
            { label: "⚡ 双方进球", playType: "both_score", option: "yes" },
          ] : undefined;

          return (
            <div key={match.id}>
              <MatchCard
                match={match}
                isExpanded={isExpanded}
                hasBet={hasBetOnMatch}
                hotPicks={hotPicks}
                onQuickBet={(playType, option, amount) => {
                  const matchObj = MOCK_MATCHES.find(m => m.id === match.id);
                  if (!matchObj) return;
                  betState.addToSlip(matchObj, playType as any, option, amount);
                  setSlipOpen(true);
                }}
                betSummary={(() => {
                  const bets = myBets.filter(b => b.matchId === match.id);
                  if (bets.length === 0) return "";
                  const total = bets.reduce((s: number, b: any) => s + b.amount, 0);
                  return `${bets.length}注 · ${total.toLocaleString()}🎮`;
                })()}
                onToggle={() => toggleMatch(match.id)}
              />

              {/* 展开内容 */}
              {isExpanded && (
                <div className="bg-surface px-4 pb-4 space-y-2 border-x border-b border-border-tertiary rounded-b-[12px] -mt-px">
                  <PlayTypeGrid
                    onSelect={handlePlayTypeSelect}
                    selectedPlayType={betState.selectedPlayType}
                  />

                  {/* 玩法详情 */}
                  {betState.selectedPlayType && betState.currentMatchId === match.id && (
                    <PlayTypeDetail
                      match={match}
                      playType={betState.selectedPlayType}
                      selectedOption={betState.selectedOption}
                      betAmount={betState.betAmount}
                      estimatedReward={calcReward()}
                      MIN_BET={MIN_BET}
                      BET_AMOUNTS={BET_AMOUNTS}
                      onSelectOption={betState.selectOption}
                      onAmountChange={betState.setBetAmount}
                      onCancel={() => betState.selectPlayType(betState.selectedPlayType!)}
                      onAddToSlip={handleAddToSlip}
                      justAddedKey={lastAddKey}
                      betOptionKeys={new Set(myBets.map(b => `${b.playType}_${b.option}`))}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 规则说明 */}
        <details className="bg-surface rounded-[10px] p-3 shadow-sm border border-border-tertiary">
          <summary className="flex items-center justify-between text-xs text-text-secondary cursor-pointer">
            <span>📖 竞猜规则</span>
          </summary>
          <div className="mt-2 text-[10px] text-text-tertiary leading-relaxed space-y-1">
            <p>• 参与消耗🎮游戏豆(credit1)，猜对奖励⛏️水晶石(credit5)</p>
            <p>• 猜对：退回参与🎮 + 从即时奖池赔付⛏️</p>
            <p>• 猜错：参与🎮消耗，不退回</p>
            <p>• 奖池来自输家参与的80% → 按赢家参与比例瓜分</p>
            <p>• 难度⭐×1 / ⭐⭐×2 / ⭐⭐⭐×4（额外倍数）</p>
            <p>• 最低参与 <b>{MIN_BET} 🎮</b> • 单注上限 = 即时奖池1%</p>
            <p>• 参与截止：比赛开始前5分钟</p>
            <p>• 比赛延期/取消：全额退回</p>
          </div>
        </details>
      </div>

      {/* 投注单 */}
      <BettingSlip
        items={betState.slipItems}
        totalAmount={betState.totalSlipAmount}
        totalReward={betState.totalSlipReward}
        balance={balance}
        isOpen={slipOpen}
        submitting={betState.submitting}
        hasError={!!betState.error}
        onToggle={() => setSlipOpen(!slipOpen)}
        onRemove={betState.removeFromSlip}
        onClear={betState.clearSlip}
        onSubmit={requestConfirm}
      />

      {/* 二次确认弹窗 */}
      {showConfirm && (
        <ConfirmBetModal
          totalAmount={betState.totalSlipAmount}
          totalReward={betState.totalSlipReward}
          itemCount={betState.slipItems.length}
          balance={balance}
          submitting={betState.submitting}
          onConfirm={handleSubmitSlip}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* 庆祝弹窗 */}
      {betState.phase === "success" && betState.lastBet && (
        <CelebrationModal
          lastBet={betState.lastBet}
          matches={MOCK_MATCHES}
          totalBets={lastBatchInfo.count}
          totalAmount={lastBatchInfo.totalAmount}
          onDismiss={betState.dismissSuccess}
          onBetAgain={betState.betAgain}
          onViewMyBets={() => setMyBetsOpen(true)}
        />
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes bounceIn { 0%{opacity:0;transform:scale(0.8)} 60%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
        .animate-bounce-in { animation: bounceIn 0.4s ease-out; }
      `}</style>
    </main>
  );
}
