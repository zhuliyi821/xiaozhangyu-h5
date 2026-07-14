"use client";

/**
 * 🏠 首页模板 v3 — 6模块精简架构
 *
 * ① TopStatusBar  — 品牌（小章鱼LOGO）+ 标语条 + 余额 + 签到
 * ② FortuneCard   — 今日运势（五行穿衣+整体并排, 遇事起卦内嵌）
 * ③ HotTopics     — ⚡ 热门PK（3条热点话题+投票+分佣CTA）
 * ④ QuickActions  — 🔮 快捷工具（AI预测/开奖查询/我的AI）
 * ⑤ DailyTasks    — 每日任务（签到/参与/PK/消费）
 * ⑥ PartnerGrid   — 合作条（区域合伙/招商/供应/门店）
 * ⑦ OnboardingModal — 新用户3步引导弹窗
 */

import { TopStatusBar } from "@/components/home/top-status-bar";
import { FortuneCard } from "@/components/home/fortune-card";
import { HotTopics } from "@/components/home/hot-topics";
import { QuickActions } from "@/components/home/quick-actions";
import { DailyTasks } from "@/components/home/daily-tasks";
import { PartnerGrid } from "@/components/home/partner-grid";
import { OnboardingModal } from "@/components/home/onboarding-modal";
import Link from "next/link";

export default function HomeTemplate() {
  return (
    <main className="pb-20">
      {/* ♿ 跳过导航链接 (WCAG 2.4.1) */}
      <a href="#home-content" className="skip-nav">
        跳到主要内容
      </a>

      {/* 新用户引导弹窗 */}
      <OnboardingModal />

      {/* ① 顶栏 + 标语条 */}
      <TopStatusBar />

      <div id="home-content" className="px-4 pt-3 flex flex-col gap-3">
        {/* ② 今日运势（含遇事起卦内嵌） */}
        <FortuneCard />

        {/* ③ 热门PK */}
        <HotTopics />

        {/* ④ 快捷工具 */}
        <QuickActions />

        {/* 公益资金池入口（独立板块） */}
        <Link href="/charity-fund"
          aria-label="公益资金池，当前284,560豆"
          className="block bg-gradient-to-r from-brand-coral to-brand-coral-dark rounded-[10px] py-2.5 px-4 text-center active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[13px] font-semibold text-white">❤️ 公益资金池</span>
            <span className="text-[9px] bg-white/20 text-white px-2 py-[1px] rounded-full">284,560豆</span>
          </div>
          <div className="text-[10px] text-white/70 mt-0.5">
            公益PK · 民众捐赠 · 赞助 · 你来决定资金分配
          </div>
        </Link>

        {/* ⚽ 省超足球竞猜入口 */}
        <Link href="/sports-betting"
          aria-label="省超足球竞猜，12种玩法"
          className="block bg-gradient-to-r from-brand-gold to-amber-600 rounded-[10px] py-2.5 px-4 text-center active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[13px] font-semibold text-white">⚽ 省超足球竞猜</span>
            <span className="text-[9px] bg-white/20 text-white px-2 py-[1px] rounded-full">12种玩法</span>
          </div>
          <div className="text-[10px] text-white/70 mt-0.5">
            胜平负 · 让球 · 进球 · 瓜分奖池 · 赢⛏️水晶石
          </div>
        </Link>

        {/* ⑤ 每日任务 */}
        <DailyTasks />

        {/* ⑥ 合作条 */}
        <PartnerGrid />
      </div>

      <div className="px-4 pt-6 pb-4 text-center text-[10px] text-text-tertiary/60">
        AI趣预测 · 仅娱乐参考 · 理性参与
      </div>
    </main>
  );
}
