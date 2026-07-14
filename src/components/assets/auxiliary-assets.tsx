"use client";

// ─── 统一资产中心 · 闲豆辅助资产 ───
// 单行小卡片，指向商城

import { AUXILIARY_KEYS, ASSET_METAS, fmtNum, type WalletData } from "./asset-types";

interface Props {
  wallet: WalletData | null;
  loading?: boolean;
}

export default function AuxiliaryAssets({ wallet, loading }: Props) {
  if (loading || !wallet) return null;

  const key = "credit2";
  const meta = ASSET_METAS[key];
  const raw = (wallet as any)[key] as number;
  if (raw <= 0) return null; // 无闲豆时隐藏

  return (
    <div className="mx-4 mt-2">
      <a href="/store"
        className="flex items-center gap-3 bg-surface rounded-[12px] px-4 py-2.5 border border-gray-100 active:scale-[0.98] transition-transform">
        <div className={`w-8 h-8 rounded-[8px] bg-gradient-to-r ${meta.color} flex items-center justify-center text-sm text-white shrink-0`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold">闲豆</div>
          <div className="text-[9px] text-text-tertiary">{meta.desc}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-brand-gold-dark">{fmtNum(raw)}</div>
          <div className="text-[9px] text-brand-teal-dark font-medium">去商城 ›</div>
        </div>
      </a>
    </div>
  );
}
