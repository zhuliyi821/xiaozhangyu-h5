import Link from "next/link";

/**
 * 共建邀请卡片 — 首页独立入口
 */
export function InvitationCard() {
  return (
    <Link href="/ai-predictions"
      className="flex items-center justify-between bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm px-4 py-3.5 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-brand-gold-light/50 flex items-center justify-center">
          <span className="text-[18px]">🤝</span>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-brand-gold-dark">共建邀请</div>
          <div className="text-[11px] text-text-tertiary">邀请好友，一起玩</div>
        </div>
      </div>
      <span className="text-[11px] font-medium text-brand-gold flex items-center gap-1">
        去看看 <span className="text-base leading-none">→</span>
      </span>
    </Link>
  );
}
