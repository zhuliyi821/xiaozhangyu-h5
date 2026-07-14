"use client";

import { Match, PlayTypeId, PLAY_TYPE_CONFIGS } from "@/app/sports-betting/types";

interface PlayTypeDetailProps {
  match: Match;
  playType: PlayTypeId;
  selectedOption: string | null;
  betAmount: number;
  estimatedReward: number;
  MIN_BET: number;
  BET_AMOUNTS: number[];
  onSelectOption: (option: string) => void;
  onAmountChange: (amount: number) => void;
  onCancel: () => void;
  onAddToSlip: () => void;
  justAddedKey?: string;
  betOptionKeys?: Set<string>;  // 已参与过的选项集合 "playType_option"
}

const starColors = ["text-amber-400", "text-brand-gold", "text-brand-coral"];

export function PlayTypeDetail({
  match, playType, selectedOption, betAmount, estimatedReward,
  MIN_BET, BET_AMOUNTS, justAddedKey, betOptionKeys,
  onSelectOption, onAmountChange, onCancel, onAddToSlip,
}: PlayTypeDetailProps) {
  const config = PLAY_TYPE_CONFIGS[playType];

  return (
    <div className="bg-bg rounded-[10px] p-3 border border-border-tertiary">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-text-primary">{config.name}</span>
          <span className={`text-[9px] ${starColors[config.stars - 1]}`}>
            {"⭐".repeat(config.stars)}
          </span>
          <span className="text-[9px] text-brand-gold-dark font-bold">×{config.multiplier}</span>
        </div>
        {selectedOption && (
          <button onClick={onCancel}
            className="text-[10px] text-text-tertiary hover:text-brand-coral transition-colors">
            取消选择
          </button>
        )}
      </div>

      {/* 让球/大小球配置 */}
      {playType === "handicap" && (
        <div className="text-[10px] text-text-tertiary mb-2 bg-bg p-1.5 rounded-[6px]">
          让球线：<span className="font-bold text-brand-teal-dark">[-1]</span>
        </div>
      )}
      {playType === "over_under" && (
        <div className="text-[10px] text-text-tertiary mb-2 bg-bg p-1.5 rounded-[6px]">
          界线：<span className="font-bold text-brand-teal-dark">[2.5]</span>
        </div>
      )}

      {/* 选项按钮 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {config.defaultOptions.map(opt => {
          const isSelected = selectedOption === opt.key;
          const isAlreadyBet = betOptionKeys?.has(`${playType}_${opt.key}`);
          return (
            <button key={opt.key}
              onClick={() => onSelectOption(opt.key)}
              aria-pressed={isSelected}
              className={`flex-1 p-2.5 rounded-[8px] text-center transition-all border min-w-[80px] ${
                isSelected
                  ? "bg-brand-coral/10 border-brand-coral/30 text-brand-coral font-bold ring-2 ring-brand-coral/30"
                  : "bg-surface border-border-tertiary text-text-secondary hover:border-brand-teal/20"
              } ${isAlreadyBet ? "ring-1 ring-brand-teal/20" : ""}`}>
              {isAlreadyBet && <div className="text-[7px] text-brand-teal font-medium mb-0.5">✅ 已参与</div>}
              <div className="text-[12px] font-medium">{opt.label}</div>
              {opt.subLabel && <div className="text-[8px] opacity-60">{opt.subLabel}</div>}
              <div className="text-[8px] mt-1 text-text-tertiary">
                {opt.betCount}人 · {opt.betAmount.toLocaleString()}🎮
              </div>
              <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-brand-teal/40 rounded-full" style={{ width: `${opt.pct || 0}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* 参与区域 */}
      {selectedOption && (
        <div className="space-y-3">
          {/* 金额选择 */}
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-text-secondary" id="bet-amount-label">参与🎮</label>
            <div className="flex gap-1.5">
              {BET_AMOUNTS.map(amt => (
                <button key={amt}
                  onClick={() => onAmountChange(amt)}
                  className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold transition-all ${
                    betAmount === amt
                      ? "bg-brand-teal/10 text-brand-teal-dark border border-brand-teal/30"
                      : "bg-bg text-text-secondary border border-border-tertiary"
                  }`}>
                  {amt.toLocaleString()}
                </button>
              ))}
              <input type="number" value={betAmount}
                onChange={e => onAmountChange(Math.max(MIN_BET, parseInt(e.target.value) || MIN_BET))}
                className="w-16 px-2 py-1 bg-bg rounded-[6px] text-[10px] text-center outline-none border border-border-tertiary focus:border-brand-teal/30"
                min={MIN_BET}
                aria-labelledby="bet-amount-label" />
            </div>
          </div>

          {/* 预估收益 */}
          <div className="bg-brand-gold/5 rounded-[8px] p-2.5 border border-brand-gold/15">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-text-secondary">🏆 猜对赢得</span>
              <span className="font-bold text-brand-gold-dark">{estimatedReward.toLocaleString()} ⛏️</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-tertiary">💸 猜错损失</span>
              <span className="font-bold text-text-tertiary">-{betAmount.toLocaleString()} 🎮</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-text-tertiary mt-1">
              <span>{match.homeTeam} vs {match.awayTeam}</span>
              <span>倍率 ×{config.multiplier}</span>
            </div>
          </div>

          {/* CTA */}
          {selectedOption === justAddedKey ? (
            <div className="w-full py-2.5 rounded-[8px] text-xs font-bold text-brand-teal bg-brand-teal/5 border border-brand-teal/20 text-center">
              ✅ 已加入投注单
            </div>
          ) : (
            <button onClick={onAddToSlip}
              className="w-full py-2.5 rounded-[8px] text-xs font-bold text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark active:scale-[0.97] transition-all shadow-sm">
              + 加入投注单 ({betAmount}🎮)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
