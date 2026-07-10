"use client";

/**
 * 🏠 彩票行业首页模板
 *
 * 不同行业可替换为不同模板（如：餐饮行业首页模板、零售行业首页模板）
 * 模板化设计使首页与行业解耦，更换行业仅需切换模板组件
 */
import { HeroSection } from "@/components/home/hero-section";
import { NewsGrid } from "@/components/home/news-grid";
import { useState, useEffect } from "react";
import { Store } from "lucide-react";

export interface LotteryHomeProps {
  /** 站点名称 */
  siteName?: string;
  /** 站点标语 */
  slogan?: string;
  /** 是否显示AI预测入口 */
  showAiEntry?: boolean;
  /** 主题色覆盖 */
  theme?: {
    primary?: string;
    secondary?: string;
  };
}

export default function LotteryHomeTemplate({
  siteName = "小章鱼",
  slogan = "AI趣预测 · 门店优选",
  showAiEntry = true,
}: LotteryHomeProps) {
  const [storeCount, setStoreCount] = useState(0);

  useEffect(() => {
    fetch("/api/store-services?action=stores")
      .then(r => r.json())
      .then(d => { if (d.code === 0) setStoreCount(d.data?.length || 0); })
      .catch(() => {});
  }, []);

  return (
    <main className="pb-20">
      <HeroSection />
      {/* 🏪 门店快捷入口 */}
      {storeCount > 0 && (
        <div className="px-4 mt-3">
          <a href="/store"
            className="flex items-center gap-3 bg-white rounded-[12px] p-3.5 shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-[0.97] transition-transform">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg bg-gradient-to-br from-brand-teal/20 to-brand-gold/20">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold">合作门店</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">{storeCount} 家门店 · 到店消费赚游戏豆</div>
            </div>
            <span className="text-[11px] font-medium flex items-center gap-0.5" style={{color:"#45CCD5"}}>
              去看看 <span className="text-base leading-none">→</span>
            </span>
          </a>
        </div>
      )}
      <NewsGrid />
      <div className="px-4 pt-6 pb-4 text-center text-[10px] text-text-tertiary/60">
        AI趣预测 · 仅娱乐参考 · 理性参与
      </div>
    </main>
  );
}
