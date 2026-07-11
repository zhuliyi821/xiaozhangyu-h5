import Link from "next/link";

export function DivinationEntry() {
  return (
    <Link href="/divination"
      className="flex items-center justify-between bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm px-4 py-3.5 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-brand-gold-light/50 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#D99A0F" strokeWidth="1.5" fill="none" />
            <path d="M12 4v16M4 12h16" stroke="#D99A0F" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-brand-gold-dark">遇事起一卦</div>
          <div className="text-[11px] text-text-tertiary">心中有事？起一卦寻个方向</div>
        </div>
      </div>
      <span className="text-[11px] font-medium text-brand-gold-dark flex items-center gap-1">
        起卦 <span className="text-base leading-none">→</span>
      </span>
    </Link>
  );
}
