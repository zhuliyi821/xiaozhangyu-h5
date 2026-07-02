/**
 * 🏠 首页 — 彩票行业门店模板
 *
 * 不同行业可切换不同首页模板：
 * - lottery-home-template → 彩票行业（默认）
 * - retail-home-template  → 零售行业
 * - food-home-template    → 餐饮行业
 * 只需将下面的 LotteryHomeTemplate 替换为对应行业模板即可
 */
import { LotteryHomeTemplate } from "@/templates";

export default function HomePage() {
  return <LotteryHomeTemplate />;
}
