"use client";

interface AssetBarProps {
  credit1: number;
  credit5: number;
  credit3: number;
}

export function AssetBar({ credit1, credit5, credit3 }: AssetBarProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-brand-teal-light/30 rounded-[10px] py-2 px-2 text-center border border-brand-teal/20">
        <div className="text-[9px] text-brand-teal-dark font-medium">🎮 游戏豆</div>
        <div className="text-[16px] font-bold text-brand-teal-darkest mt-0.5">{credit1.toLocaleString()}</div>
      </div>
      <div className="bg-brand-gold-light/30 rounded-[10px] py-2 px-2 text-center border border-brand-gold/20">
        <div className="text-[9px] text-brand-gold-dark font-medium">⛏️ 水晶石</div>
        <div className="text-[16px] font-bold text-brand-gold-dark mt-0.5">{credit5.toLocaleString()}</div>
      </div>
      <div className="bg-brand-coral-light/30 rounded-[10px] py-2 px-2 text-center border border-brand-coral/20">
        <div className="text-[9px] text-brand-coral-dark font-medium">🔮 水晶球</div>
        <div className="text-[16px] font-bold text-brand-coral-darkest mt-0.5">{credit3.toLocaleString()}</div>
      </div>
    </div>
  );
}
