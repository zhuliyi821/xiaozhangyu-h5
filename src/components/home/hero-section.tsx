import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import ShareButton from "@/components/ui/share-button";
import SharePanel from "@/components/ui/share-panel";

export function HeroSection() {
  const [showShare, setShowShare] = useState(false);
  const { user } = useAuth();
  const gameBeans = user?.balance?.credit1 || 0;
  const formatAsset = (n: number) => n >= 10000 ? (n/10000).toFixed(1)+"w" : n >= 1000 ? (n/1000).toFixed(1)+"k" : String(Math.floor(n));

  return (
    <div className="relative mx-4 mt-2 bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-gold rounded-[28px] p-6 shadow-lg shadow-brand-teal/20 overflow-hidden">
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(242,182,49,0.25)_0%,transparent_70%)]" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
      <div className="relative z-10">
        {/* 门店信息 */}
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-3 py-1 text-white text-[11px] font-medium mb-2">
          <span className="w-[7px] h-[7px] rounded-full bg-brand-gold shadow-[0_0_8px_rgba(242,182,49,0.5)]" />
          小章鱼AI趣预测
        </div>
        <h1 className="text-[24px] font-bold text-white leading-tight">
          小章鱼
        </h1>
        <p className="text-[14px] text-white/85 mt-1 flex items-center gap-1.5">
          AI趣预测 · 门店优选 · 到店消费送游戏豆
        </p>
        {user && (
          <div className="flex gap-2 mt-3.5">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-[10px] px-3 py-1.5 text-white text-xs">
              <span>🎮</span>
              <span>{formatAsset(gameBeans)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-[10px] px-3 py-1.5 text-white text-xs">
              <span>🏪</span>
              <span>到店消费</span>
            </div>
          </div>
        )}
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
