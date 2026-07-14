"use client";

import { SportsBet, PLAY_TYPE_CONFIGS } from "@/app/sports-betting/types";
import { Match } from "@/app/sports-betting/types";

interface CelebrationModalProps {
  lastBet: SportsBet;
  matches: Match[];
  totalBets: number;
  totalAmount: number;
  onDismiss: () => void;
  onBetAgain: () => void;
  onViewMyBets: () => void;
}

export function CelebrationModal({ lastBet, matches, totalBets, totalAmount, onDismiss, onBetAgain, onViewMyBets }: CelebrationModalProps) {
  const match = matches.find(m => m.id === lastBet.matchId);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4"
      onClick={onDismiss}>
      <div className="bg-white rounded-[16px] p-6 max-w-[320px] w-full text-center shadow-2xl animate-bounce-in"
        onClick={e => e.stopPropagation()}>
        <div className="text-[48px] mb-2">🎉</div>
        <h2 className="text-[17px] font-bold text-text-primary mb-1">
          {totalBets > 1 ? `全部参与成功！` : `参与成功！`}
        </h2>
        <p className="text-[11px] text-text-tertiary mb-4">
          {totalBets > 1
            ? `共 ${totalBets} 项竞猜已提交 · ${totalAmount}🎮`
            : `${PLAY_TYPE_CONFIGS[lastBet.playType].name} · ${lastBet.amount}🎮`}
        </p>

        <div className="bg-brand-gold/5 rounded-[10px] p-3 mb-4 border border-brand-gold/15">
          <div className="flex items-center justify-between text-[12px] mb-1.5">
            <span className="text-text-secondary">🏆 猜对赢得</span>
            <span className="font-bold text-brand-gold-dark text-[15px]">+{lastBet.estimatedReward.toLocaleString()} ⛏️</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-tertiary">💸 猜错损失</span>
            <span className="font-bold text-text-tertiary">-{lastBet.amount.toLocaleString()} 🎮</span>
          </div>
        </div>

        {match && (
          <div className="text-[10px] text-text-tertiary mb-4">
            {match.homeTeam} vs {match.awayTeam}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button onClick={onDismiss}
              className="flex-1 py-2.5 bg-gray-100 rounded-[8px] text-xs font-medium text-gray-500 active:scale-[0.97] transition-transform">
              继续浏览
            </button>
            <button onClick={onBetAgain}
              className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[8px] text-xs font-bold text-white active:scale-[0.97] transition-transform shadow-sm">
              再来一注
            </button>
          </div>
          <button onClick={() => { onDismiss(); onViewMyBets(); }}
            className="w-full py-2 rounded-[6px] text-[10px] text-brand-teal font-medium bg-brand-teal/5 active:scale-[0.97] transition-transform">
            📋 查看我的参与 ({totalBets}项)
          </button>
        </div>
      </div>
    </div>
  );
}
