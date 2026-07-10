"use client";

import { useState } from "react";
import Link from "next/link";
import SharePanel from "@/components/ui/share-panel";

/** 红龙虾 SVG 图标 */
function CrayfishIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={{ flexShrink: 0 }}>
      <ellipse cx="26" cy="30" rx="8" ry="10" fill="rgba(242,113,82,0.2)" stroke="rgba(242,113,82,0.6)" strokeWidth="1.2"/>
      <ellipse cx="26" cy="18" rx="7" ry="5.5" fill="rgba(242,113,82,0.25)" stroke="rgba(242,113,82,0.6)" strokeWidth="1.2"/>
      <circle cx="22" cy="17" r="2.5" fill="white" stroke="rgba(242,113,82,0.4)" strokeWidth="0.8"/>
      <circle cx="30" cy="17" r="2.5" fill="white" stroke="rgba(242,113,82,0.4)" strokeWidth="0.8"/>
      <circle cx="22.5" cy="17.5" r="1.2" fill="#4A1B0C"/>
      <circle cx="30.5" cy="17.5" r="1.2" fill="#4A1B0C"/>
      <path d="M21 13C19 7 16 4 14 3" stroke="rgba(242,113,82,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M31 13C33 7 36 4 38 3" stroke="rgba(242,113,82,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      <path d="M17 20C12 14 8 12 8 16C6 20 8 26 12 28C15 29 17 27 18 24C19 22 18 21 17 20Z" fill="rgba(242,113,82,0.25)" stroke="rgba(242,113,82,0.7)" strokeWidth="1.5"/>
      <path d="M35 20C40 14 44 12 44 16C46 20 44 26 40 28C37 29 35 27 34 24C33 22 34 21 35 20Z" fill="rgba(242,113,82,0.25)" stroke="rgba(242,113,82,0.7)" strokeWidth="1.5"/>
      <path d="M14 45Q26 41 38 45" stroke="rgba(242,113,82,0.35)" strokeWidth="1" fill="none"/>
      <path d="M13 47Q26 43 39 47Q40 48 39 49Q26 52 13 49Q12 48 13 47Z" fill="rgba(242,113,82,0.15)" stroke="rgba(242,113,82,0.4)" strokeWidth="1"/>
    </svg>
  );
}

export function HeroSection() {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="relative mx-4 mt-2 bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-gold rounded-[28px] p-6 shadow-lg shadow-brand-teal/20 overflow-hidden">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(242,182,49,0.25)_0%,transparent_70%)]" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
      <div className="relative z-10">
        {/* 主标题 */}
        <h1 className="text-[24px] font-bold text-white leading-tight mb-1">
          AI趣预测
        </h1>
        {/* 副标题 — 比主标题小3号 */}
        <p className="text-[14px] text-white/80 mb-4">
          小章鱼
        </p>

        {/* 我要养小龙虾 — 指向我的Agent */}
        <Link href="/agent"
          className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-[12px] px-4 py-3 active:scale-[0.97] transition-transform group">
          <CrayfishIcon size={34} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white">我要养小龙虾</div>
            <div className="text-[10px] text-white/60 mt-0.5">我的AI助手 · 随时陪聊</div>
          </div>
          <span className="text-base text-white/40 group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* Share button */}
      <div className="absolute top-4 right-4 z-10">
        <button onClick={() => setShowShare(true)}
          className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 flex items-center justify-center transition-all"
          aria-label="分享">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
        </button>
      </div>

      {showShare && (
        <SharePanel
          data={{ title: "小章鱼 · AI趣预测", desc: "AI驱动 · 全民预测 · 有奖PK", brand: "小章鱼", url: typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn" }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
