import Link from "next/link";

export function CrayfishEntry() {
  return (
    <Link href="/agent"
      className="flex items-center justify-between bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm px-4 py-3.5 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-brand-coral-light/50 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <ellipse cx="24" cy="17" rx="6" ry="4" fill="#D45435" opacity="0.3" />
            <circle cx="21.5" cy="17" r="1.5" fill="#D45435" />
            <circle cx="26.5" cy="17" r="1.5" fill="#D45435" />
            <ellipse cx="24" cy="28" rx="7" ry="9" fill="#D45435" opacity="0.2" />
            <path d="M20 15C16 8 12 6 8 10C4 14 6 20 12 22C16 23 19 19 20 15Z" fill="#D45435" opacity="0.2" />
            <path d="M28 15C32 8 36 6 40 10C44 14 42 20 36 22C32 23 29 19 28 15Z" fill="#D45435" opacity="0.2" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-brand-coral-dark">我的 Agent</div>
          <div className="text-[11px] text-text-tertiary">探索你的 AI 私人助理</div>
        </div>
      </div>
      <span className="text-[11px] font-medium text-brand-coral flex items-center gap-1">
        去对话 <span className="text-base leading-none">→</span>
      </span>
    </Link>
  );
}
