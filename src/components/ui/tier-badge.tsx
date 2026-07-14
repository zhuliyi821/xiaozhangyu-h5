"use client";

import { getCurrentTier, getNextTier, getTierProgress, loadXp, loadClaimed, TIERS } from "@/lib/tier-system";
import { useMemo } from "react";

interface TierBadgeProps {
  /** 自定义XP（不传则读localStorage） */
  xp?: number;
  /** 显示模式 */
  mode?: "badge" | "progress" | "full" | "tiny";
  /** 是否可领取奖励的回调 */
  onClaim?: (tierId: string, reward: number) => void;
}

export default function TierBadge({ xp: customXp, mode = "full", onClaim }: TierBadgeProps) {
  const xp = customXp ?? loadXp();
  const currentTier = useMemo(() => getCurrentTier(xp), [xp]);
  const nextTier = useMemo(() => getNextTier(xp), [xp]);
  const progress = useMemo(() => getTierProgress(xp), [xp]);
  const claimed = useMemo(() => loadClaimed(), []);

  // Tiny: 纯徽章 - 用于底部栏
  if (mode === "tiny") {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[13px]">{currentTier.emoji}</span>
        <span className={`text-[10px] font-medium ${currentTier.color}`}>{currentTier.label}</span>
      </div>
    );
  }

  // Badge: 徽章+段位名 - 用于卡片头部
  if (mode === "badge") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg border border-border-tertiary">
        <span className="text-[14px]">{currentTier.emoji}</span>
        <span className={`text-[11px] font-medium ${currentTier.color}`}>{currentTier.label}</span>
        <span className="text-[9px] text-text-tertiary">· {xp} XP</span>
      </div>
    );
  }

  // Full: 完整进度条 - 用于个人中心/段位页
  return (
    <div className="bg-surface rounded-[10px] p-3 border border-border-tertiary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">{currentTier.emoji}</span>
          <div>
            <span className={`text-[13px] font-bold ${currentTier.color}`}>{currentTier.label}</span>
            {nextTier && (
              <span className="text-[10px] text-text-tertiary ml-1.5">
                · 下一段位：{nextTier.emoji} {nextTier.label}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-text-tertiary">{xp} XP</span>
      </div>
      {/* Progress bar */}
      {nextTier && (
        <>
          <div className="h-2 bg-bg rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${nextTier.barColor}`}
              style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[9px] text-text-tertiary">{currentTier.label} {currentTier.xpRequired}XP</span>
            <span className="text-[9px] text-text-tertiary font-medium">
              {nextTier.xpRequired - xp} XP 达 {nextTier.emoji}{nextTier.label}
            </span>
            <span className="text-[9px] text-text-tertiary">{nextTier.xpRequired}XP</span>
          </div>
        </>
      )}
      {/* Claimable tiers */}
      {TIERS.filter(t => t.reward > 0 && xp >= t.xpRequired).slice(-3).map(t => {
        const isClaimed = claimed.includes(t.id);
        return !isClaimed ? (
          <button key={t.id} onClick={() => onClaim?.(t.id, t.reward)}
            className="mt-2 w-full py-1.5 rounded-[6px] bg-gradient-to-r from-brand-gold to-amber-400 text-white text-[10px] font-medium active:scale-95 transition-transform">
            🎉 领取 {t.emoji}{t.label} 奖励 +{t.reward}🎮
          </button>
        ) : null;
      })}
    </div>
  );
}
