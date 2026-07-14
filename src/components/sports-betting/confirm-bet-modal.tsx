"use client";

interface ConfirmBetModalProps {
  totalAmount: number;
  totalReward: number;
  itemCount: number;
  balance: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBetModal({
  totalAmount, totalReward, itemCount, balance, submitting,
  onConfirm, onCancel,
}: ConfirmBetModalProps) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}>
      <div className="bg-white rounded-[16px] p-5 max-w-[340px] w-full shadow-2xl animate-bounce-in"
        onClick={e => e.stopPropagation()}>

        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-2">
            <span className="text-xl">⚡</span>
          </div>
          <h2 className="text-[15px] font-bold text-text-primary">确认参与</h2>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            您将参与 <b className="text-text-primary">{itemCount}</b> 项竞猜
          </p>
        </div>

        {/* 提交内容汇总 */}
        <div className="bg-bg rounded-[10px] p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">🎮 参与总计</span>
            <span className="font-bold text-text-primary">{totalAmount.toLocaleString()} 🎮</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-text-secondary">⛏️ 预估赢得</span>
            <span className="font-bold text-brand-gold-dark">+{totalReward.toLocaleString()} ⛏️</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-tertiary">
            <span>余额</span>
            <span className={totalAmount <= balance ? "text-brand-teal-dark" : "text-brand-coral"}>
              {balance.toLocaleString()}🎮
              {totalAmount > balance && " ⚠️ 不足"}
            </span>
          </div>
        </div>

        {/* Loss Aversion 框架 */}
        <div className="bg-gradient-to-r from-brand-coral/5 to-brand-gold/5 rounded-[10px] p-3 mb-3 border border-brand-gold/10">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="flex items-center gap-1 text-text-secondary">
              <span>🏆</span> 全部猜对
            </span>
            <span className="font-bold text-brand-coral text-[13px]">+{totalReward.toLocaleString()} ⛏️</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-text-tertiary">
              <span>💸</span> 全部猜错
            </span>
            <span className="font-bold text-text-tertiary">-{totalAmount.toLocaleString()} 🎮</span>
          </div>
        </div>

        {/* 勾选确认 */}
        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input type="checkbox" id="agree-rules"
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal" />
          <span className="text-[10px] text-text-tertiary leading-relaxed">
            我已阅读并同意 <span className="text-brand-teal">竞猜规则</span>，了解参与消耗🎮且猜错不退回
          </span>
        </label>

        {/* CTA */}
        <button onClick={onConfirm} disabled={submitting}
          className="w-full py-2.5 rounded-[8px] text-xs font-bold text-white bg-gradient-to-r from-brand-teal to-brand-teal-dark disabled:opacity-40 active:scale-[0.97] transition-all shadow-sm">
          {submitting ? "提交中..." : `✅ 确认参与 ${totalAmount.toLocaleString()} 🎮`}
        </button>
        <button onClick={onCancel}
          className="w-full py-2 mt-1.5 rounded-[8px] text-xs font-medium text-text-tertiary active:scale-[0.97] transition-all">
          取消
        </button>
      </div>
    </div>
  );
}
