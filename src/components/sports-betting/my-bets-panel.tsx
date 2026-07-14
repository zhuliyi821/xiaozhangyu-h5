"use client";

import { ChevronDown } from "lucide-react";
import { SportsBet, PLAY_TYPE_CONFIGS } from "@/app/sports-betting/types";

interface MyBetsPanelProps {
  bets: SportsBet[];
  isOpen: boolean;
  onToggle: () => void;
}

export function MyBetsPanel({ bets, isOpen, onToggle }: MyBetsPanelProps) {
  if (bets.length === 0) return null;

  return (
    <details open={isOpen}
      className="bg-surface rounded-[10px] p-3 shadow-sm border border-border-tertiary">
      <summary onClick={(e) => { e.preventDefault(); onToggle(); }}
        className="flex items-center justify-between text-xs text-text-secondary cursor-pointer select-none">
        <span className="flex items-center gap-1.5">
          📋 我的参与
          <span className="bg-brand-teal text-white text-[9px] px-1.5 py-[1px] rounded-full font-medium">{bets.length}</span>
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </summary>
      <div className="mt-2 space-y-1.5">
        {bets.map(bet => (
          <div key={bet.id} className="flex items-center justify-between text-[10px] py-1.5 border-b border-border-tertiary/30 last:border-0">
            <div className="flex items-center gap-2">
              <span className={bet.status === "won" ? "text-brand-coral" : bet.status === "lost" ? "text-text-tertiary" : "text-text-primary"}>
                {bet.status === "won" ? "🏆" : bet.status === "lost" ? "❌" : "⏳"}
              </span>
              <span className="text-text-secondary">{PLAY_TYPE_CONFIGS[bet.playType].name}</span>
              <span className="font-medium">{bet.amount}🎮</span>
            </div>
            <span className={bet.status === "won" ? "text-brand-coral" : "text-text-tertiary"}>
              {bet.status === "won" ? `+${bet.reward}⛏️` : bet.status === "lost" ? "已消耗" : `预估${bet.estimatedReward}⛏️`}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
