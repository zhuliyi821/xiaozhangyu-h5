"use client";

// ─── 统一资产中心 · 智能推荐 ───
// 根据用户资产状况推荐下一步最佳操作

import { type WalletData, fmtNum, crystalAvailable, crystalFrozen } from "./asset-types";

interface ActionTip {
  icon: string;
  text: string;
  action: string;
  priority: number;  // 1=高 2=中 3=低
}

interface Props {
  wallet: WalletData | null;
  onAction: (action: string) => void;
}

export default function SmartRecommendations({ wallet, onAction }: Props) {
  if (!wallet) return null;

  const tips: ActionTip[] = [];

  // 水晶石推荐
  const c5 = wallet.credit5 || 0;
  const frozen = crystalFrozen(c5);
  const available = crystalAvailable(c5);
  if (frozen > 0) {
    tips.push({
      icon: "🔓",
      text: `你有 ${fmtNum(frozen)} 水晶石未激活，消耗游戏豆可激活使用`,
      action: "activate",
      priority: 1,
    });
  } else if (c5 > 1000) {
    tips.push({
      icon: "🔄",
      text: `你有 ${fmtNum(c5)} 水晶石可用，可兑换为游戏豆参与PK`,
      action: "exchange_crystal",
      priority: 2,
    });
  }

  // 余额推荐
  const c4 = wallet.credit4 || 0;
  if (c4 > 500) {
    tips.push({
      icon: "💰",
      text: `余额 ¥${c4.toFixed(0)} 可用，兑换游戏豆享1:100`,
      action: "exchange_balance",
      priority: 2,
    });
  }

  // 水晶球分红推荐
  const c3 = wallet.credit3 || 0;
  if (c3 > 0) {
    tips.push({
      icon: "🔮",
      text: `你持有 ${c3} 颗水晶球，享有赢家盈利分红`,
      action: "dividend",
      priority: 3,
    });
  }

  // 游戏豆不足推荐
  const c1 = wallet.credit1 || 0;
  if (c1 < 100 && (c4 > 0 || c5 > 0 || frozen > 0)) {
    tips.push({
      icon: "⚡",
      text: `游戏豆仅 ${fmtNum(c1)}，建议兑换补充`,
      action: "get_coins",
      priority: 1,
    });
  }

  if (tips.length === 0) return null;

  // 按优先级排序
  tips.sort((a, b) => a.priority - b.priority);

  return (
    <div className="mx-4 mt-3">
      <div className="text-[11px] font-semibold text-text-primary mb-2">💡 智能推荐</div>
      <div className="space-y-1.5">
        {tips.slice(0, 2).map((tip, i) => (
          <button key={i}
            onClick={() => onAction(tip.action)}
            className="w-full text-left flex items-center gap-2 bg-amber-50 rounded-[10px] px-3 py-2.5 border border-amber-100 active:scale-[0.98] transition-transform">
            <span className="text-sm">{tip.icon}</span>
            <span className="text-[10px] text-amber-800 flex-1">{tip.text}</span>
            <span className="text-amber-400 text-[16px]">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
