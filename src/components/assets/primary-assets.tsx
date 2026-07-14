"use client";

// ─── 统一资产中心 · 3列主力资产 ───
// 均衡卡片布局：余额/水晶石/水晶球

import { fmtNum, fmtMoney, crystalAvailable, crystalFrozen, PRIMARY_KEYS, ASSET_METAS, type WalletData } from "./asset-types";

interface Props {
  wallet: WalletData | null;
  loading?: boolean;
  onAction: (key: string, action: string) => void;
}

export default function PrimaryAssets({ wallet, loading, onAction }: Props) {
  if (loading) {
    return (
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-surface rounded-[12px] p-3 animate-pulse border border-gray-100">
            <div className="h-3 w-12 bg-gray-100 rounded mb-2" />
            <div className="h-5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!wallet) return null;

  const getActions = (key: string): { label: string; action: string }[] => {
    switch (key) {
      case "credit4": return [{ label: "充值", action: "topup" }, { label: "兑换", action: "exchange" }];
      case "credit5": return [{ label: "激活", action: "activate" }, { label: "兑换", action: "exchange" }];
      case "credit3": return [{ label: "分红", action: "dividend" }, { label: "兑换", action: "exchange" }];
      default: return [];
    }
  };

  return (
    <div className="mx-4 mt-3">
      <div className="grid grid-cols-3 gap-2">
        {PRIMARY_KEYS.map(key => {
          const meta = ASSET_METAS[key];
          const raw = (wallet as any)[key] as number;
          const value = key === "credit4" ? fmtMoney(raw) : fmtNum(raw);

          // 水晶石额外信息
          const showFrozen = key === "credit5" && raw > 0;
          const available = key === "credit5" ? crystalAvailable(raw) : raw;

          return (
            <div key={key}
              className="bg-surface rounded-[14px] p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow active:scale-[0.97] cursor-pointer"
              onClick={() => onAction(key, "view")}>
              {/* 图标+标签 */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-[10px] font-medium text-text-secondary">
                  {key === "credit4" ? "余额" : key === "credit5" ? "水晶石" : "水晶球"}
                </span>
              </div>

              {/* 数值 */}
              <div className={`text-[16px] font-bold ${key === "credit4" ? "text-brand-gold-dark" : key === "credit5" ? "text-brand-coral-dark" : "text-brand-teal-dark"}`}>
                {key === "credit4" ? value : fmtNum(available)}
              </div>

              {/* 冻结提示 */}
              {showFrozen && (
                <div className="text-[8px] text-amber-500 mt-0.5">
                  🔒{fmtNum(crystalFrozen(raw))}冻结
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                {getActions(key).map(act => (
                  <button key={act.action}
                    onClick={(e) => { e.stopPropagation(); onAction(key, act.action); }}
                    className="flex-1 py-1 rounded-[6px] bg-gray-50 text-[9px] text-text-secondary font-medium hover:bg-brand-teal/10 hover:text-brand-teal-dark active:scale-95 transition-all">
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
