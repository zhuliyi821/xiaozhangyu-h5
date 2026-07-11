"use client";

/**
 * 🏠 首页新模板
 *
 * 7 个模块:
 * ① TopStatusBar    — 品牌 + 游戏豆余额 + 签到
 * ② FortuneCard     — 今日运势（五行穿衣/整体/奇门）
 * ③ AiTeaser        — AI 预测日报摘要
 * ④ DivinationEntry — 遇事起一卦
 * ⑤ CrayfishEntry   — 人人养小龙虾（AI对话入口）
 * ⑥ DailyTasks      — 每日任务
 * ⑦ ToolStrip       — 工具与服务（商城/门店/开奖/扫码/计算）
 */

import { TopStatusBar } from "@/components/home/top-status-bar";
import { FortuneCard } from "@/components/home/fortune-card";
import { AiTeaser } from "@/components/home/ai-teaser";
import { DivinationEntry } from "@/components/home/divination-entry";
import { CrayfishEntry } from "@/components/home/crayfish-entry";
import { DailyTasks } from "@/components/home/daily-tasks";
import { ToolStrip } from "@/components/home/tool-strip";

export default function HomeTemplate() {
  return (
    <main className="pb-20">
      {/* ① 顶部状态栏 */}
      <TopStatusBar />

      <div className="px-4 pt-3 flex flex-col gap-3">
        {/* ② 今日运势 */}
        <FortuneCard />

        {/* ③ AI 预测日报 */}
        <AiTeaser />

        {/* ④ 遇事起一卦 */}
        <DivinationEntry />

        {/* ⑤ 人人养小龙虾 */}
        <CrayfishEntry />

        {/* ⑥ 每日任务 */}
        <DailyTasks />
      </div>

      {/* ⑦ 工具与服务条 */}
      <ToolStrip />

      <div className="px-4 pt-6 pb-4 text-center text-[10px] text-text-tertiary/60">
        AI趣预测 · 仅娱乐参考 · 理性参与
      </div>
    </main>
  );
}
