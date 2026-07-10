"use client";

/**
 * 🏠 彩票行业首页模板
 *
 * 不同行业可替换为不同模板（如：餐饮行业首页模板、零售行业首页模板）
 * 模板化设计使首页与行业解耦，更换行业仅需切换模板组件
 */
import { HeroSection } from "@/components/home/hero-section";
import { NewsGrid } from "@/components/home/news-grid";

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
  return (
    <main className="pb-20">
      <HeroSection />
      <NewsGrid />
      <div className="px-4 pt-6 pb-4 text-center text-[10px] text-text-tertiary/60">
        AI趣预测 · 仅娱乐参考 · 理性参与
      </div>
    </main>
  );
}
