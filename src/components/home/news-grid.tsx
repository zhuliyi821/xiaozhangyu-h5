"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import { Sparkles, Target, Scan, Calculator } from "lucide-react";
import Link from "next/link";
import LotteryHotCard from "@/components/home/lottery-hot-card";

// ── 运势等级映射 ──
const SCORE_TAGS = [
  { min: 85, label: "大吉", emoji: "🌟", text: "text-green-600" },
  { min: 70, label: "吉", emoji: "✨", text: "text-amber-600" },
  { min: 55, label: "中平", emoji: "🌊", text: "text-amber-600/70" },
  { min: 0,  label: "小凶", emoji: "🌧", text: "text-brand-coral" },
];

function getTag(score: number) {
  return SCORE_TAGS.find(t => score >= t.min) || SCORE_TAGS[3];
}

const TIPS = [
  "保持积极心态，好运自然来","今天适合主动出击，抓住机会",
  "多与人交流，好机会在路上","放慢脚步，静心思考再做决定",
  "顺其自然，一切都会好起来","今天宜果断，不宜犹豫",
];

const TOOLS = [
  { icon: Target, label: "开奖查询", sub: "实时更新", href: "/draw", color: "var(--color-brand-teal)" },
  { icon: Scan, label: "扫码验奖", sub: "秒查结果", href: "/scan", color: "var(--color-brand-coral)" },
  { icon: Calculator, label: "计算器", sub: "复式/胆拖", href: "/calculator", color: "var(--color-brand-gold)" },
];

export function NewsGrid() {
  const { user } = useAuth();
  const [fortune, setFortune] = useState<{
    score: number; tag: { label: string; emoji: string; text: string };
    do: string; dont: string; luckyDirection: string; tip: string;
  } | null>(null);
  const [loadingFortune, setLoadingFortune] = useState(true);
  const [hotCardData, setHotCardData] = useState<any>(null);
  const [loadingHotCard, setLoadingHotCard] = useState(true);

  // 从 fortune-engine 获取真实运势数据
  useEffect(() => {
    const uid = (user as any)?.uid || 0;
    fetch(`${API_BASE}/api/v1/fortune/today`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data) {
          const data = d.data;
          const tag = getTag(data.score);
          setFortune({
            score: data.score,
            tag,
            do: data.advice?.do?.[0] || "好好生活",
            dont: data.advice?.dont?.[0] || "冲动决策",
            luckyDirection: data.lucky?.direction || "正南",
            tip: TIPS[data.score % TIPS.length],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFortune(false));
  }, [user]);

  // 拉取热号推荐卡片
  useEffect(() => {
    fetch("/api/v2/lottery/hot-card")
      .then(r => r.json())
      .then(d => setHotCardData(d?.data || null))
      .catch(() => setHotCardData(null))
      .finally(() => setLoadingHotCard(false));
  }, []);

  return (
    <section className="mt-4 px-4">

      {/* ════════ 1. 每日一卦 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-[2px] before:bg-gradient-to-b from-brand-teal to-brand-teal-dark">
          🐙 每日一卦
        </h2>
        <Link href="/daily-fortune" className="text-xs text-brand-teal font-medium">完整运势 &gt;</Link>
      </div>

      {/* ── 遇事起一卦：突出 CTA ── */}
      <Link href="/divination"
        className="flex items-center justify-between bg-gradient-to-r from-brand-gold via-brand-gold-dark to-brand-gold rounded-[10px] px-5 py-3.5 mb-3 active:scale-[0.97] transition-transform shadow-[0_4px_16px_rgba(242,182,49,0.3)] group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg backdrop-blur-sm shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-2"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L3.36 16.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
          </div>
          <div>
            <div className="text-[15px] font-bold text-white leading-tight">遇事起一卦</div>
            <div className="text-[11px] text-white/75 leading-tight mt-0.5">心中有事？起一卦寻个方向</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/90 text-sm font-medium group-hover:gap-1.5 transition-all">
          开始 <span className="text-base">→</span>
        </div>
      </Link>

      {/* ── 每日一卦 卡片（真实推演数据） ── */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-white to-brand-teal-light/[0.08] border border-brand-teal/10 shadow-soft mb-5 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal/60 via-brand-teal to-brand-gold/60" />

        <Link href="/daily-fortune" className="block p-5 active:scale-[0.98] transition-transform">

          {loadingFortune ? (
            /* ── 骨架屏 ── */
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200/60 rounded w-20 mb-4" />
              <div className="h-px bg-gray-200/40 mb-4" />
              <div className="flex gap-1.5 mb-4">
                {[1,2,3].map(i => <div key={i} className="w-[30px] h-[30px] rounded-full bg-gray-200/50" />)}
              </div>
              <div className="h-3 bg-gray-200/30 rounded w-48" />
            </div>
          ) : fortune && (
            <>
              {/* 得分 */}
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[34px] font-bold leading-none tracking-tight">{fortune.score}</span>
                  <span className="text-[11px] text-text-tertiary font-medium ml-0.5">分</span>
                </div>
                <span className="text-[11px] font-medium text-brand-teal-dark bg-brand-teal-light/20 px-3 py-1 rounded-full">
                  {fortune.tag.emoji} {fortune.tag.label}
                </span>
              </div>

              <div className="h-px bg-gradient-to-r from-brand-teal/20 via-brand-teal/5 to-transparent mb-4" />

              {/* 宜忌 + 方位 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <div className="text-[10px] text-text-tertiary font-medium mb-0.5 tracking-wider">宜</div>
                  <div className="text-[14px] font-semibold text-text">{fortune.do}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-tertiary font-medium mb-0.5 tracking-wider">忌</div>
                  <div className="text-[14px] font-semibold text-text">{fortune.dont}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-text-tertiary font-medium mb-0.5 tracking-wider">方位</div>
                  <div className="text-[14px] font-semibold text-brand-teal">{fortune.luckyDirection}</div>
                </div>
              </div>

              {/* tip */}
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary/80">
                <Sparkles className="w-3 h-3 text-brand-gold shrink-0" />
                <span className="truncate">{fortune.tip}</span>
              </div>
            </>
          )}

        </Link>
      </div>

      {/* ════════ 热号推荐卡片 ════════ */}
      <LotteryHotCard data={hotCardData} loading={loadingHotCard} />

      {/* ── AI小龙虾 ── */}
      <Link
        href="/ai?tab=chat"
        className="flex items-center justify-between bg-brand-teal-light/30 border border-brand-teal/20 rounded-[12px] px-4 py-4 mb-5 active:scale-[0.98] transition-transform group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-coral-dark to-brand-coral flex items-center justify-center shadow-sm shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7" xmlns="http://www.w3.org/2000/svg">
              {/* 头部 */}
              <ellipse cx="24" cy="17" rx="6" ry="4" fill="white" opacity="0.95"/>
              {/* 眼睛 */}
              <circle cx="21.5" cy="17" r="1.5" fill="#D45435"/>
              <circle cx="26.5" cy="17" r="1.5" fill="#D45435"/>
              {/* 大钳子（左） */}
              <path d="M20 15C16 8 12 6 8 10C4 14 6 20 12 22C16 23 19 19 20 15Z" fill="white" opacity="0.9"/>
              <path d="M14 12C12 11 10 12 9 14" stroke="#D45435" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              {/* 大钳子（右） */}
              <path d="M28 15C32 8 36 6 40 10C44 14 42 20 36 22C32 23 29 19 28 15Z" fill="white" opacity="0.9"/>
              <path d="M34 12C36 11 38 12 39 14" stroke="#D45435" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
              {/* 触须 */}
              <path d="M22 14C21 9 19 6 16 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
              <path d="M26 14C27 9 29 6 32 5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
              {/* 身体 */}
              <ellipse cx="24" cy="28" rx="7" ry="9" fill="white" opacity="0.9"/>
              {/* 身体分节 */}
              <path d="M17 24Q24 26 31 24" stroke="#D45435" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/>
              <path d="M17 29Q24 31 31 29" stroke="#D45435" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/>
              {/* 尾巴 */}
              <path d="M18 36Q24 34 30 36Q32 40 30 43Q24 46 18 43Q16 40 18 36Z" fill="white" opacity="0.9"/>
              <path d="M19 40Q24 39 29 40" stroke="#D45435" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary">AI小龙虾</div>
            <div className="text-[10px] text-text-tertiary">跟你的AI助理聊聊今日运势</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-brand-teal font-semibold group-hover:gap-1.5 transition-all">
          有事问AI <span className="text-xs">→</span>
        </div>
      </Link>

      {/* ════════ 2. 工具与服务 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-[2px] before:bg-gradient-to-b from-brand-gold to-brand-gold-dark">
          工具与服务
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {TOOLS.map((item, i) => (
          <Link key={i} href={item.href}
            className="bg-white rounded-[12px] px-2 py-3.5 text-center shadow-sm border border-brand-teal/10 relative overflow-hidden active:scale-95 transition-transform cursor-pointer block">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[3px]"
              style={{ background: i % 3 === 0 ? "linear-gradient(90deg, #45CCD5, #2BAAAF)" : i % 3 === 1 ? "linear-gradient(90deg, #F27152, #D45435)" : "linear-gradient(90deg, #F2B631, #D99A0F)" }} />
            <item.icon className="w-6 h-6 mx-auto mb-1.5" style={{ color: item.color }} />
            <div className="text-[12px] font-medium">{item.label}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* ════════ 3. AI瞎猜 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-[2px] before:bg-gradient-to-b from-brand-teal to-brand-coral">
          AI瞎猜
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Link href="/lottery/dlt/chart"
          className="bg-white rounded-[12px] p-3.5 text-center shadow-sm border border-brand-teal/10 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal to-brand-gold rounded-t-[3px]" />
          <div className="text-lg mb-1">🎱</div>
          <div className="text-[13px] font-bold">彩票乱说</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI随机生成<br />纯属娱乐</div>
        </Link>

        <Link href="/stock-analysis"
          className="bg-white rounded-[12px] p-3.5 text-center shadow-sm border border-brand-teal/10 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gold to-brand-coral rounded-t-[3px]" />
          <div className="text-lg mb-1">📈</div>
          <div className="text-[13px] font-bold">股市瞎猜</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI盲猜涨跌<br />不准别打</div>
        </Link>

        <Link href="/btc-predict"
          className="bg-white rounded-[12px] p-3.5 text-center shadow-sm border border-brand-teal/10 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-coral to-brand-teal rounded-t-[3px]" />
          <div className="text-lg mb-1">₿</div>
          <div className="text-[13px] font-bold">BTC胡判</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI胡说走势<br />不准别打</div>
        </Link>
      </div>

    </section>
  );
}
