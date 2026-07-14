"use client";

import { PlayTypeId, PLAY_TYPE_CONFIGS } from "@/app/sports-betting/types";

interface PlayTypeGridProps {
  onSelect: (playType: PlayTypeId) => void;
  selectedPlayType: PlayTypeId | null;
}

const WIN_TYPES: PlayTypeId[] = ["1X2", "handicap", "half_time", "double_chance", "draw_refund", "advance"];
const GOAL_TYPES: PlayTypeId[] = ["total_goals", "over_under", "both_score", "home_goals", "away_goals", "team_scores"];

export function PlayTypeGrid({ onSelect, selectedPlayType }: PlayTypeGridProps) {
  const renderButton = (pt: PlayTypeId) => {
    const config = PLAY_TYPE_CONFIGS[pt];
    const isSelected = selectedPlayType === pt;
    return (
      <button key={pt}
        onClick={() => onSelect(pt)}
        className={`p-2 rounded-[8px] text-center transition-all border ${
          isSelected
            ? "bg-brand-teal/10 border-brand-teal/30 text-brand-teal-dark"
            : "bg-bg border-border-tertiary text-text-secondary hover:border-brand-teal/20"
        }`}
        aria-pressed={isSelected}>
        <div className="text-[10px] font-medium">{config.name}</div>
        <div className={`text-[8px] ${isSelected ? "text-brand-teal" : "text-text-tertiary"}`}>
          {"⭐".repeat(config.stars)} ×{config.multiplier}
        </div>
      </button>
    );
  };

  return (
    <div>
      <h3 className="text-[11px] font-semibold text-text-secondary mb-2">选择玩法</h3>

      <div role="group" aria-label="胜负类玩法">
        <div className="text-[10px] text-text-tertiary mb-1">胜负类</div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {WIN_TYPES.map(renderButton)}
        </div>
      </div>

      <div role="group" aria-label="进球类玩法">
        <div className="text-[10px] text-text-tertiary mb-1">进球类</div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {GOAL_TYPES.map(renderButton)}
        </div>
      </div>
    </div>
  );
}
