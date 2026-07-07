"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Target, Scan, Calculator, Flame } from "lucide-react";
import Link from "next/link";
import { getTrend, TrendData } from "@/lib/api";

// ── 运势数据 ──
const SCORE_TAGS = [
  { min: 85, label: "大吉", emoji: "🌟", text: "text-green-600" },
  { min: 70, label: "吉", emoji: "✨", text: "text-amber-600" },
  { min: 55, label: "中平", emoji: "🌊", text: "text-amber-600/70" },
  { min: 0,  label: "小凶", emoji: "🌧", text: "text-red-500" },
];

const DO_TODOS = ["下注","约会","吃火锅","投资","面试","出行","签约","表白","健身","学习","社交","购物"];
const DONT_TODOS = ["冲动消费","熬夜","吵架","借贷","冒险","裸辞","暴饮暴食"];
const LUCKY_COLORS = ["琥珀金","青瓷绿","珊瑚红","水晶紫","珍珠白","曜石黑","玫瑰金","天空蓝"];
const LUCKY_NUMBERS = [[3,7,9],[1,6,8],[2,5,9],[4,7,8],[6,8,2],[1,3,5],[7,9,4],[2,6,3]];
const LUCKY_DIRECTIONS = ["东南","正南","正西","正北","东北","西南","西北","东方"];

const TOOLS = [
  { icon: Target, label: "开奖查询", sub: "实时更新", href: "/draw", color: "var(--color-brand-teal)" },
  { icon: Scan, label: "扫码验奖", sub: "秒查结果", href: "/scan", color: "var(--color-brand-coral)" },
  { icon: Calculator, label: "计算器", sub: "复式/胆拖", href: "/calculator", color: "var(--color-brand-gold)" },
];

const HOT_LOTTERY_TYPES = [
  { key: "dlt", name: "大乐透" },
  { key: "ssq", name: "双色球" },
  { key: "pl3", name: "排列3" },
  { key: "fc3d", name: "3D" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFortune(seed: number) {
  const rand = seededRandom(seed);
  const score = Math.floor(70 + rand() * 28);
  const tag = SCORE_TAGS.find(t => score >= t.min)!;
  return {
    score, tag,
    do: DO_TODOS[Math.floor(rand() * DO_TODOS.length)],
    dont: DONT_TODOS[Math.floor(rand() * DONT_TODOS.length)],
    luckyColor: LUCKY_COLORS[Math.floor(rand() * LUCKY_COLORS.length)],
    luckyNumbers: LUCKY_NUMBERS[Math.floor(rand() * LUCKY_NUMBERS.length)],
    luckyDirection: LUCKY_DIRECTIONS[Math.floor(rand() * LUCKY_DIRECTIONS.length)],
    tip: ["保持积极心态，好运自然来","今天适合主动出击，抓住机会","多与人交流，好机会在路上","放慢脚步，静心思考再做决定","顺其自然，一切都会好起来","今天宜果断，不宜犹豫"][Math.floor(rand() * 6)],
  };
}

export function NewsGrid() {
  const { user } = useAuth();
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [loadingHot, setLoadingHot] = useState(true);

  // 并行拉取各彩种热号
  useEffect(() => {
    Promise.all(
      HOT_LOTTERY_TYPES.map(t => getTrend(t.key).catch(() => null))
    ).then(results => {
      const map: Record<string, TrendData> = {};
      HOT_LOTTERY_TYPES.forEach((t, i) => {
        if (results[i]) map[t.key] = results[i]!;
      });
      setTrends(map);
    }).finally(() => setLoadingHot(false));
  }, []);

  const today = new Date();
  const seed = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) + (user?.uid || 0);
  const fortune = useMemo(() => generateFortune(seed), [seed]);

  return (
    <section className="mt-4 px-4">

      {/* ════════ 1. 每日运势 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-teal to-brand-teal-dark">
          🐙 每日运势
        </h2>
        <Link href="/daily-fortune" className="text-xs text-brand-teal font-medium">完整运势 &gt;</Link>
      </div>

      <Link href="/daily-fortune" className="block bg-white rounded-[20px] p-4 shadow-sm border border-gray-100 mb-5 active:scale-[0.98] transition-transform">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal to-brand-gold flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xl">🐙</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold">{fortune.score}</span>
              <span className="text-[10px] text-text-tertiary">分</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-brand-teal-light/20 ${fortune.tag.text}`}>
                {fortune.tag.emoji} {fortune.tag.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-text-tertiary mt-0.5">
              <span>宜 {fortune.do}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>忌 {fortune.dont}</span>
            </div>
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1.5">
          <div className="flex gap-3 text-[10px] text-text-secondary">
            <span>🎨 幸运色 <strong className="text-text-primary">{fortune.luckyColor}</strong></span>
            <span>🔢 数字 <strong className="text-text-primary">{fortune.luckyNumbers.join(" ")}</strong></span>
            <span>📍 方位 <strong className="text-text-primary">{fortune.luckyDirection}</strong></span>
          </div>
          <div className="flex items-start gap-1.5 text-[10px] text-text-secondary">
            <Sparkles className="w-3 h-3 text-brand-teal mt-0.5 shrink-0" />
            <span className="line-clamp-1">{fortune.tip} —— 小章鱼</span>
          </div>
        </div>
      </Link>

      {/* ════════ 2. 彩票工具 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-gold to-brand-gold-dark">
          彩票工具 💰
        </h2>
        <span className="text-xs text-brand-teal font-medium">更多</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {TOOLS.map((item, i) => (
          <Link key={i} href={item.href}
            className="bg-white rounded-[20px] px-2 py-3.5 text-center shadow-sm border border-gray-100 relative overflow-hidden active:scale-95 transition-transform cursor-pointer block">
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[3px]"
              style={{ background: i % 3 === 0 ? "linear-gradient(90deg, #45CCD5, #2BAAAF)" : i % 3 === 1 ? "linear-gradient(90deg, #F27152, #D45435)" : "linear-gradient(90deg, #F2B631, #D99A0F)" }} />
            <item.icon className="w-6 h-6 mx-auto mb-1.5 text-brand-teal" />
            <div className="text-[12px] font-medium">{item.label}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* ════════ 3. 热号预测 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-coral to-brand-coral-dark">
          🔥 热号预测
        </h2>
      </div>

      {loadingHot ? (
        <div className="space-y-2 mb-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[60px] bg-gray-100 rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {Object.entries(trends).map(([key, data]) => {
            const info = HOT_LOTTERY_TYPES.find(t => t.key === key);
            if (!info || data.hot_front.length === 0) return null;
            return (
              <Link key={key} href={`/lottery/${key}/chart`}
                className="block bg-white rounded-[14px] p-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{info.name}</span>
                    <Flame className="w-3 h-3 text-brand-coral" />
                  </div>
                  <span className="text-[9px] text-text-tertiary">近{data.periods}期热号</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {data.hot_front.map((n, i) => (
                    <span key={i}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-coral to-brand-coral-dark text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {String(n).padStart(2, '0')}
                    </span>
                  ))}
                  {data.hot_back.length > 0 && (
                    <>
                      <span className="text-text-tertiary text-[10px] mx-0.5">+</span>
                      {data.hot_back.map((n, i) => (
                        <span key={i}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                          {String(n).padStart(2, '0')}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
          {Object.keys(trends).length === 0 && !loadingHot && (
            <div className="text-center py-6 text-[11px] text-text-tertiary bg-white rounded-[14px] border border-dashed border-gray-200">
              暂无数据，请稍后再试
            </div>
          )}
        </div>
      )}

      {/* ════════ 4. AI瞎猜 ════════ */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-teal to-brand-coral">
          🤖 AI瞎猜
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Link href="/lottery/dlt/chart"
          className="bg-white rounded-[20px] p-3.5 text-center shadow-sm border border-gray-100 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-teal to-brand-gold rounded-t-[3px]" />
          <div className="text-lg mb-1">🎱</div>
          <div className="text-[13px] font-bold">彩票乱说</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI随机生成<br />纯属娱乐</div>
        </Link>

        <Link href="/stock-analysis"
          className="bg-white rounded-[20px] p-3.5 text-center shadow-sm border border-gray-100 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-gold to-brand-coral rounded-t-[3px]" />
          <div className="text-lg mb-1">📈</div>
          <div className="text-[13px] font-bold">股市瞎猜</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI盲猜涨跌<br />不准别打</div>
        </Link>

        <Link href="/btc-predict"
          className="bg-white rounded-[20px] p-3.5 text-center shadow-sm border border-gray-100 relative overflow-hidden active:scale-95 transition-transform block">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-coral to-brand-teal rounded-t-[3px]" />
          <div className="text-lg mb-1">₿</div>
          <div className="text-[13px] font-bold">BTC胡判</div>
          <div className="text-[9px] text-text-tertiary mt-1 leading-relaxed">AI胡说走势<br />不准别打</div>
        </Link>
      </div>

    </section>
  );
}
