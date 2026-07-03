import { useState } from "react";
import ShareButton from "@/components/ui/share-button";
import SharePanel from "@/components/ui/share-panel";

export function HeroSection() {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="relative mx-4 mt-2 bg-gradient-to-br from-brand-teal via-[#5DD9E2] to-brand-gold rounded-[28px] p-6 shadow-soft overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.35)_0%,transparent_70%)] blur-[20px]" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-full px-3 py-1 text-white text-[11px] font-medium mb-2">
          <span className="w-[7px] h-[7px] rounded-full bg-brand-gold shadow-[0_0_8px_rgba(242,182,49,0.6)]" />
          AI 智能预测
        </div>
        <h1 className="text-[24px] font-bold text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
          小章鱼
        </h1>
        <p className="text-[14px] text-white/90 mt-1 flex items-center gap-1.5">
          AI趣预测 · 门店优选
        </p>
      </div>
      {/* Share button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowShare(true)}
          className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 flex items-center justify-center transition-all"
          aria-label="分享"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
        </button>
      </div>

      {showShare && (
        <SharePanel
          data={{ title: "小章鱼 · AI趣预测", desc: "AI驱动 · 全民预测 · 有奖PK", brand: "小章鱼", url: "https://h5.ws.hi.cn" }}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
