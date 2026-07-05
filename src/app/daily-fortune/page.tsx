"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Sparkles, ChevronLeft, Flame } from "lucide-react";

// ── 运势数据 ──
const SCORE_TAGS = [
  { min: 85, label: "大吉", emoji: "🌟", text: "text-green-600", stars: 5 },
  { min: 70, label: "吉", emoji: "✨", text: "text-brand-teal-dark", stars: 4 },
  { min: 55, label: "中平", emoji: "🌊", text: "text-amber-600", stars: 3 },
  { min: 0,  label: "小凶", emoji: "🌧", text: "text-red-500", stars: 2 },
];

const DO_TODOS = ["下注","约会","吃火锅","投资","面试","出行","签约","表白","健身","学习","社交","购物"];
const DONT_TODOS = ["冲动消费","熬夜","吵架","借贷","冒险","裸辞","暴饮暴食"];
const LUCKY_COLORS = ["琥珀金","青瓷绿","珊瑚红","水晶紫","珍珠白","曜石黑","玫瑰金","天空蓝"];
const LUCKY_COLORS_HEX = ["#F5A623","#45CCD5","#F27152","#7C3AED","#FFFFFF","#333333","#E8A0BF","#87CEEB"];
const LUCKY_NUMBERS = [[3,7,9],[1,6,8],[2,5,9],[4,7,8],[6,8,2],[1,3,5],[7,9,4],[2,6,3]];
const LUCKY_DIRECTIONS = ["东南","正南","正西","正北","东北","西南","西北","东方"];

const FORTUNE_TOOLS = [
  { icon: "💰", label: "财运", href: "/ai?tab=lottery", color: "from-amber-400 to-amber-500", desc: "偏财气场推演" },
  { icon: "❤️", label: "感情", href: "/ai?tab=zodiac", color: "from-pink-400 to-pink-500", desc: "情感运势分析" },
  { icon: "💼", label: "事业", href: "/ai?tab=zodiac", color: "from-blue-400 to-blue-500", desc: "职场发展指引" },
  { icon: "🔮", label: "抽签", href: "/ai?tab=zodiac", color: "from-purple-400 to-purple-500", desc: "随心快速起卦" },
  { icon: "🎯", label: "预测加成", href: "/ai?tab=lottery", color: "from-brand-teal to-brand-teal-dark", desc: "AI智能推演" },
  { icon: "📤", label: "分享", href: "", color: "from-brand-gold to-brand-coral", desc: "分享给好友" },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function generateFortune(seed: number) {
  const rand = seededRandom(seed);
  const score = Math.floor(70 + rand() * 28);
  const tag = SCORE_TAGS.find(t => score >= t.min)!;
  const ci = Math.floor(rand() * LUCKY_COLORS.length);
  return {
    score, tag,
    do: DO_TODOS[Math.floor(rand() * DO_TODOS.length)],
    dont: DONT_TODOS[Math.floor(rand() * DONT_TODOS.length)],
    luckyColor: LUCKY_COLORS[ci],
    luckyColorHex: LUCKY_COLORS_HEX[ci],
    luckyNumbers: LUCKY_NUMBERS[Math.floor(rand() * LUCKY_NUMBERS.length)],
    luckyDirection: LUCKY_DIRECTIONS[Math.floor(rand() * LUCKY_DIRECTIONS.length)],
    tip: ["保持积极心态，好运自然来","今天适合主动出击，抓住机会","多与人交流，好机会在路上","放慢脚步，静心思考再做决定","顺其自然，一切都会好起来","今天宜果断，不宜犹豫"][Math.floor(rand() * 6)],
  };
}

export default function DailyFortunePage() {
  const { user } = useAuth();
  const today = new Date();
  const seed = (today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()) + (user?.uid || 0);
  const fortune = useMemo(() => generateFortune(seed), [seed]);

  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ["日","一","二","三","四","五","六"];
  const weekDay = weekDays[today.getDay()];

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50/70 via-white to-white pb-24">
      {/* ─── 顶部导航 ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-purple-600" />
          </Link>
          <div className="flex-1 text-center text-sm font-bold text-purple-800 -ml-8">小章鱼今日运势</div>
        </div>
      </div>

      {/* ─── 页面内容 ─── */}
      <div className="px-4 pt-5">

        {/* 标题区 */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🐙</div>
          <h1 className="text-lg font-bold text-purple-800">小章鱼今日运势</h1>
          <p className="text-xs text-purple-400/70 mt-1">用八只触手，抓住今天的好运气</p>
        </div>

        {/* 综合运势卡片 */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-purple-100 mb-5">
          {/* 评分行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-lg shadow-sm">
                🐙
              </div>
              <div>
                <div className="text-xs font-bold text-purple-800">综合运势</div>
                <div className="text-[10px] text-purple-400/60">{dateStr} 星期{weekDay}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-700">{fortune.score}<span className="text-xs font-normal text-purple-400">分</span></div>
              <div className="flex items-center gap-0.5 mt-0.5 justify-end">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-[10px] ${i < fortune.tag.stars ? "text-amber-400" : "text-gray-200"}`}>⭐</span>
                ))}
              </div>
            </div>
          </div>

          {/* 宜忌行 */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-green-50 rounded-[12px] px-3.5 py-2.5">
              <div className="text-[9px] text-green-500 font-medium mb-0.5">今日宜</div>
              <div className="text-xs font-bold text-green-700">{fortune.do}</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-[12px] px-3.5 py-2.5">
              <div className="text-[9px] text-red-400 font-medium mb-0.5">今日忌</div>
              <div className="text-xs font-bold text-red-500">{fortune.dont}</div>
            </div>
          </div>

          {/* 幸运信息 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs">
              <span className="w-16 text-[10px] text-purple-400">🎨 幸运色</span>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: fortune.luckyColorHex }} />
                <span className="font-medium text-purple-800">{fortune.luckyColor}</span>
                <span className="text-[9px] text-gray-400">{fortune.luckyColorHex}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-16 text-[10px] text-purple-400">🔢 幸运数字</span>
              <span className="font-medium text-purple-800">{fortune.luckyNumbers.join("、")}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="w-16 text-[10px] text-purple-400">📍 幸运方位</span>
              <span className="font-medium text-purple-800">{fortune.luckyDirection}</span>
            </div>
          </div>

          {/* 开运锦囊 */}
          <div className="mt-3 pt-3 border-t border-purple-50 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-purple-500/70 leading-relaxed">
              {fortune.tip} —— 小章鱼
            </div>
          </div>
        </div>

        {/* 运势工具 6格 */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Flame className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-xs font-bold text-purple-800">运势工具</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {FORTUNE_TOOLS.map((tool, i) => (
              tool.label === "分享" ? (
                <button key={i} onClick={() => { navigator.clipboard.writeText(window.location.href).then(() => alert("链接已复制！")).catch(() => {}); }}
                  className="bg-white rounded-[16px] p-3.5 text-center shadow-sm border border-purple-100 active:scale-95 transition-transform">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${tool.color} flex items-center justify-center mx-auto mb-1.5 text-white text-sm shadow-sm`}>
                    {tool.icon}
                  </div>
                  <div className="text-[11px] font-bold text-purple-800">{tool.label}</div>
                  <div className="text-[8px] text-purple-400/60 mt-0.5">{tool.desc}</div>
                </button>
              ) : (
                <Link key={i} href={tool.href}
                  className="bg-white rounded-[16px] p-3.5 text-center shadow-sm border border-purple-100 active:scale-95 transition-transform block">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${tool.color} flex items-center justify-center mx-auto mb-1.5 text-white text-sm shadow-sm`}>
                    {tool.icon}
                  </div>
                  <div className="text-[11px] font-bold text-purple-800">{tool.label}</div>
                  <div className="text-[8px] text-purple-400/60 mt-0.5">{tool.desc}</div>
                </Link>
              )
            ))}
          </div>
        </div>

        {/* 免责声明 */}
        <div className="p-3.5 rounded-[16px] bg-purple-50/50 border border-purple-100/50 text-[9px] text-purple-400/60 text-center leading-relaxed">
          本运势由 AI 基于传统文化娱乐推演生成，仅供娱乐参考。<br />事在人为，保持积极心态方能顺势而行。
        </div>

      </div>
    </main>
  );
}
