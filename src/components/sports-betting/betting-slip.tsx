"use client";

import { X, ChevronUp, ChevronDown, ShoppingCart } from "lucide-react";
import { SlipItem } from "./use-betting-state";

interface BettingSlipProps {
  items: SlipItem[];
  totalAmount: number;
  totalReward: number;
  balance: number;
  isOpen: boolean;
  submitting: boolean;
  hasError: boolean;
  onToggle: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

export function BettingSlip({
  items, totalAmount, totalReward, balance, isOpen, submitting, hasError,
  onToggle, onRemove, onClear, onSubmit,
}: BettingSlipProps) {
  if (items.length === 0 && !isOpen) return null;

  const count = items.length;
  const canSubmit = count > 0 && !submitting && totalAmount <= balance && !hasError;

  return (
    <>
      {/* 浮动按钮 */}
      {count > 0 && (
        <button onClick={onToggle}
          className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all active:scale-95 ${
            isOpen ? "bg-brand-teal-dark text-white" : "bg-white text-text-primary border border-border-tertiary"
          }`}
          aria-label={`投注单，${count}项`}>
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          <span className="text-xs font-bold">{count}</span>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      )}

      {/* 投注单面板 */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 left-4 z-50 max-w-[400px] mx-auto"
          style={{ maxHeight: 'calc(60vh)' }}>
          <div className="bg-white rounded-[12px] shadow-2xl border border-border-tertiary overflow-hidden flex flex-col max-h-full">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-tertiary bg-gray-50/50">
              <span className="text-[13px] font-bold text-text-primary">📋 投注单</span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <button onClick={onClear} className="text-[10px] text-text-tertiary hover:text-brand-coral transition-colors">
                    清空
                  </button>
                )}
                <button onClick={onToggle} className="text-text-tertiary hover:text-text-primary transition-colors text-[16px] leading-none">✕</button>
              </div>
            </div>

            {/* 列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {count === 0 && (
                <div className="text-center py-6 text-[11px] text-text-tertiary">
                  投注单为空，选择竞猜选项后加入
                </div>
              )}
              {items.map(item => (
                <div key={item.id} className="bg-bg rounded-[8px] p-2.5 border border-border-tertiary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-text-tertiary truncate">{item.matchLabel}</div>
                      <div className="text-[11px] font-semibold text-text-primary mt-0.5">
                        {item.playTypeName} · {item.optionLabel}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-text-tertiary">
                        <span>{item.amount}🎮</span>
                        <span>→ 预估 +{item.estimatedReward.toLocaleString()}⛏️</span>
                        <span>×{item.multiplier}</span>
                      </div>
                    </div>
                    <button onClick={() => onRemove(item.id)}
                      className="text-text-tertiary hover:text-brand-coral transition-colors p-0.5 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 底部统计 + 提交 */}
            {count > 0 && (
              <div className="px-4 py-3 border-t border-border-tertiary bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">总计</span>
                  <span className="font-bold text-text-primary">{totalAmount.toLocaleString()} 🎮</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-tertiary">预估赢得</span>
                  <span className="font-bold text-brand-gold-dark">+{totalReward.toLocaleString()} ⛏️</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-text-tertiary">
                  <span>余额: {balance.toLocaleString()}🎮</span>
                  {totalAmount > balance && (
                    <span className="text-brand-coral">余额不足</span>
                  )}
                </div>
                <button onClick={onSubmit} disabled={!canSubmit}
                  className="w-full py-2.5 rounded-[8px] text-xs font-bold text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark disabled:opacity-40 active:scale-[0.97] transition-all shadow-sm">
                  {submitting ? "提交中..." : `✅ 确认参与 ${totalAmount.toLocaleString()} 🎮`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
