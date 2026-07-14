"use client";

import Link from "next/link";

interface AssetOverviewProps {
  wallet: { credit1: number; credit5: number; credit3: number };
}

export default function AssetOverview({ wallet }: AssetOverviewProps) {
  return (
    <div className="px-4 mt-3 mb-3 relative z-20">
      <div className="grid grid-cols-3 gap-2">
        <Link href="/assets" className="block bg-brand-teal-light/30 rounded-[10px] py-2.5 px-2 text-center border border-brand-teal/20 active:scale-[0.97] transition-transform">
          <div className="text-[9px] text-brand-teal-dark font-medium">🎮 游戏豆</div>
          <div className="text-[17px] font-bold text-brand-teal-darkest mt-0.5">{(wallet.credit1 || 0).toLocaleString()}</div>
        </Link>
        <Link href="/exchange?focus=credit5" className="block bg-brand-gold-light/30 rounded-[10px] py-2.5 px-2 text-center border border-brand-gold/20 active:scale-[0.97] transition-transform">
          <div className="text-[9px] text-brand-gold-dark font-medium">⛏️ 水晶石</div>
          <div className="text-[17px] font-bold text-brand-gold-dark mt-0.5">{(wallet.credit5 || 0).toLocaleString()}</div>
        </Link>
        <Link href="/exchange/credit3" className="block bg-brand-coral-light/30 rounded-[10px] py-2.5 px-2 text-center border border-brand-coral/20 active:scale-[0.97] transition-transform">
          <div className="text-[9px] text-brand-coral-dark font-medium">🔮 水晶球</div>
          <div className="text-[17px] font-bold text-brand-coral-darkest mt-0.5">{(wallet.credit3 || 0).toLocaleString()}</div>
        </Link>
      </div>
    </div>
  );
}
