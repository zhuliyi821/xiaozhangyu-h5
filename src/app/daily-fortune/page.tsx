"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ChevronLeft, Sparkles, Flame, TrendingUp, MapPin, Clock, Bot } from "lucide-react";
import { API_BASE } from "@/config/api";

// ── Types ──
interface FortuneToday {
  score: number; tag: string; trend: string;
  advice: { do: string[]; dont: string[] };
  best_hour: { name: string; range: string; score: number; bonus: number };
  lucky: { color: string; color_hex: string; numbers: number[]; direction: string };
  body_use: string; body_use_label: string;
}

interface Hexagram { name: string; gua_ci: string; body_trigram: string; use_trigram: string; body_use: string; }
interface DimItem { score: number; level: string; advice: string; }
interface HourlyItem { hour: string; time_range: string; zhi_shi_door: string; score: number; label: string; bonus: number; advice: string; }

interface FortuneDetail {
  total_score: number;
  hexagram: Hexagram;
  dimensions: Record<string, DimItem>;
  hourly: HourlyItem[];
  recommendation: { prediction_bonus: number; rooms: {name:string;type:string}[]; stores: {name:string;direction:string;distance:string}[] };
}

const FORTUNE_TOOLS = [
  { icon: "💰", label: "财运", href: "/ai?tab=lottery", color: "from-amber-400 to-amber-600", desc: "偏财气场推演" },
  { icon: "❤️", label: "感情", href: "/ai?tab=zodiac", color: "from-pink-400 to-pink-600", desc: "情感运势分析" },
  { icon: "💼", label: "事业", href: "/ai?tab=zodiac", color: "from-blue-400 to-blue-600", desc: "职场发展指引" },
  { icon: "🔮", label: "抽签", href: "/ai?tab=zodiac", color: "from-purple-400 to-purple-600", desc: "随心快速起卦" },
  { icon: "🎯", label: "预测加成", href: "/ai?tab=lottery", color: "from-brand-teal to-brand-teal-dark", desc: "AI智能推演" },
  { icon: "📤", label: "分享", href: "", color: "from-brand-gold to-brand-coral", desc: "分享给好友" },
];

const DIM_ICONS: Record<string, string> = {
  wealth: "💰", love: "❤️", career: "💼", health: "🏥", social: "👥",
};
const DIM_LABELS: Record<string, string> = {
  wealth: "财运", love: "感情", career: "事业", health: "健康", social: "社交",
};

const WEEK_DAYS = ["日","一","二","三","四","五","六"];

function scoreColor(s: number): string {
  if (s >= 85) return "text-emerald-600";
  if (s >= 70) return "text-brand-teal-dark";
  if (s >= 55) return "text-amber-600";
  return "text-red-500";
}
function scoreBg(s: number): string {
  if (s >= 85) return "bg-gradient-to-r from-emerald-400 to-emerald-300";
  if (s >= 70) return "bg-gradient-to-r from-brand-teal to-brand-teal-dark";
  if (s >= 55) return "bg-gradient-to-r from-amber-400 to-amber-300";
  return "bg-gradient-to-r from-red-400 to-red-300";
}
function scoreLevel(s: number): string {
  if (s >= 85) return "上吉";
  if (s >= 70) return "中吉";
  if (s >= 55) return "中平";
  return "小凶";
}

const GUACI_EMOJI: Record<string, string> = {
  "乾": "☰", "坤": "☷", "震": "☳", "巽": "☴", "坎": "☵", "离": "☲", "艮": "☶", "兑": "☱",
};

export default function DailyFortunePage() {
  const { user } = useAuth();
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;
  const weekDay = WEEK_DAYS[today.getDay()];

  const [todayData, setTodayData] = useState<FortuneToday | null>(null);
  const [detailData, setDetailData] = useState<FortuneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const uid = (user as any)?.uid || 0;
        // Register birth if needed (use defaults for demo)
        await fetch(`${API_BASE}/api/v1/fortune/birth`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: uid || 1, birth_date: "1990-06-15", birth_hour: 12, gender: 1 }),
        }).catch(() => {});

        const [todayRes, detailRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/fortune/today`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uid || 1 }),
          }).then(r => r.json()),
          fetch(`${API_BASE}/api/v1/fortune/detail`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: uid || 1 }),
          }).then(r => r.json()),
        ]);

        if (todayRes.code === 0) setTodayData(todayRes.data);
        if (detailRes.code === 0) setDetailData(detailRes.data);
      } catch (e) {
        setError("加载失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  // Current hour index
  const currentHourIndex = useMemo(() => {
    const h = today.getHours();
    return Math.floor(h / 2) % 12;
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50/70 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-2xl mb-3 animate-bounce">🐙</div>
          <div className="text-xs text-purple-400 animate-pulse">正在为你推演今日运势…</div>
        </div>
      </main>
    );
  }

  const td = todayData;
  const dd = detailData;
  if (!td || !dd) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-purple-50/70 via-white to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-2">😅</div>
          <div className="text-xs text-purple-400">{error || "暂无数据，请先设置出生信息"}</div>
          <Link href="/" className="mt-3 inline-block text-xs text-brand-teal-dark font-medium">返回首页</Link>
        </div>
      </main>
    );
  }

  const hexagram = dd.hexagram;
  const dims = dd.dimensions;
  const hourly = dd.hourly || [];
  const nowHour = hourly[currentHourIndex] || hourly[0] || null;
  const rec = dd.recommendation;

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50/70 via-white to-white pb-28">
      {/* ─── 顶部导航 ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-purple-600" />
          </Link>
          <div className="flex-1 text-center text-sm font-bold text-purple-800 -ml-8">小章鱼今日运势</div>
        </div>
      </div>

      <div className="px-4 pt-5">

        {/* ═══════ Hero 区 ═══════ */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 rounded-[24px] p-6 mb-5 text-white shadow-lg shadow-purple-200/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-purple-200/80">{dateStr} 星期{weekDay}</div>
              <div className="text-lg font-bold mt-0.5">小章鱼今日运势</div>
            </div>
            <div className="text-3xl">🐙</div>
          </div>

          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-5xl font-bold tracking-tight">{td.score}<span className="text-lg font-normal text-purple-200 ml-1">分</span></div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-white/20 rounded-full px-3 py-0.5 font-medium">{td.tag}</span>
                <span className="text-[10px] text-purple-200">{td.body_use}·{td.body_use_label}</span>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`text-base ${i <= Math.round(td.score/20) ? "text-yellow-300" : "text-white/30"}`}>⭐</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 rounded-[14px] px-3.5 py-2.5">
              <div className="text-[9px] text-green-300 font-medium mb-0.5">✅ 今日宜</div>
              <div className="text-xs font-bold">{td.advice.do.join(" · ")}</div>
            </div>
            <div className="flex-1 bg-white/10 rounded-[14px] px-3.5 py-2.5">
              <div className="text-[9px] text-red-300 font-medium mb-0.5">❌ 今日忌</div>
              <div className="text-xs font-bold">{td.advice.dont.join(" · ")}</div>
            </div>
          </div>
        </div>

        {/* ═══════ 卦象区 ═══════ */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-purple-800">今日卦象</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-2xl font-bold text-purple-700 shadow-sm">
              {GUACI_EMOJI[hexagram.use_trigram]}{GUACI_EMOJI[hexagram.body_trigram]}
            </div>
            <div>
              <div className="text-sm font-bold text-purple-800">{hexagram.name}</div>
              <div className="text-[10px] text-purple-400/70 mt-0.5 italic">&ldquo;{hexagram.gua_ci}&rdquo;</div>
              <div className="text-[10px] text-purple-500 mt-1 bg-purple-50 inline-block rounded-full px-2.5 py-0.5">
                {hexagram.body_use}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ 5维度 ═══════ */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-100 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-purple-800">运势维度</span>
          </div>
          <div className="space-y-3.5">
            {Object.entries(dims).map(([key, dim]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{DIM_ICONS[key] || "📊"}</span>
                    <span className="text-[11px] font-medium text-purple-800">{DIM_LABELS[key] || key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${scoreColor(dim.score)}`}>{dim.score}分</span>
                    <span className="text-[9px] text-purple-400">{dim.level}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-purple-50 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBg(dim.score)} transition-all duration-700`} style={{ width: `${dim.score}%` }} />
                </div>
                <div className="text-[9px] text-purple-400/60 mt-0.5">{dim.advice}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ 幸运信息 ═══════ */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-purple-800">幸运指南</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50/60 rounded-[14px] p-3">
              <div className="text-[9px] text-purple-400 mb-1">🎨 幸运色</div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ background: td.lucky.color_hex }} />
                <span className="text-xs font-bold text-purple-800">{td.lucky.color}</span>
              </div>
              <div className="text-[8px] text-purple-400/60 mt-0.5">{td.lucky.color_hex}</div>
            </div>
            <div className="bg-purple-50/60 rounded-[14px] p-3">
              <div className="text-[9px] text-purple-400 mb-1">🔢 幸运数字</div>
              <div className="flex items-center gap-2">
                {td.lucky.numbers.map((n, i) => (
                  <span key={i} className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">{n}</span>
                ))}
              </div>
            </div>
            <div className="bg-purple-50/60 rounded-[14px] p-3">
              <div className="text-[9px] text-purple-400 mb-1">📍 幸运方位</div>
              <div className="text-xs font-bold text-purple-800">{td.lucky.direction}</div>
            </div>
            <div className="bg-purple-50/60 rounded-[14px] p-3">
              <div className="text-[9px] text-purple-400 mb-1">⏰ 最佳时段</div>
              <div className="text-xs font-bold text-purple-800">{td.best_hour.name} ({td.best_hour.range})</div>
              <div className="text-[9px] text-purple-500 mt-0.5">加成 +{td.best_hour.bonus}%</div>
            </div>
          </div>
        </div>

        {/* ═══════ 当前时辰 ═══════ */}
        {nowHour && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[20px] p-5 shadow-sm mb-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/80" />
                <span className="text-xs font-bold">当前时辰 · {nowHour.hour} ({nowHour.time_range})</span>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-0.5 text-[10px] font-medium">{nowHour.zhi_shi_door}</div>
            </div>
            <div className="flex items-end justify-between mb-2">
              <div className="text-3xl font-bold">{nowHour.score}<span className="text-base font-normal text-white/70 ml-1">分</span></div>
              <div className="text-right">
                <div className="text-xs font-medium">{nowHour.label}</div>
                {nowHour.bonus > 0 && <div className="text-[10px] text-yellow-300">预测加成 +{nowHour.bonus}%</div>}
              </div>
            </div>
            <div className="text-xs text-white/80">{nowHour.advice}</div>
          </div>
        )}

        {/* ═══════ 12时辰走势 ═══════ */}
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-100 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-purple-800">今日时辰运势走势</span>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-1">
            <div className="flex gap-2 min-w-max px-1">
              {hourly.map((h, i) => {
                const isNow = i === currentHourIndex;
                return (
                  <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-[12px] min-w-[52px] transition-all ${isNow ? "bg-purple-100 ring-2 ring-purple-400 ring-offset-1" : "bg-purple-50/50"}`}>
                    <div className="text-[9px] text-purple-500 font-medium">{h.hour}</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${scoreBg(h.score)}`}>
                      {h.score}
                    </div>
                    <div className="text-[8px] text-purple-400">{h.zhi_shi_door}</div>
                    {h.bonus > 0 && <div className="text-[7px] text-amber-500 font-bold">+{h.bonus}%</div>}
                    {isNow && <div className="text-[7px] text-purple-600 font-bold">← 现在</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-purple-50 text-[9px] text-purple-400">
            <span>🟣 上吉</span><span>🟢 中吉</span><span>🟡 中平</span><span>🔴 小凶</span>
          </div>
        </div>

        {/* ═══════ 平台推荐 ═══════ */}
        {rec && (
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-purple-100 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-brand-teal" />
              <span className="text-xs font-bold text-purple-800">平台推荐</span>
              {rec.prediction_bonus > 0 && (
                <span className="text-[9px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium">今日加成 +{rec.prediction_bonus}%</span>
              )}
            </div>

            {rec.rooms && rec.rooms.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] text-purple-400 mb-2">🎯 推荐PK房间</div>
                {rec.rooms.map((room, i) => (
                  <div key={i} className="flex items-center justify-between bg-purple-50/60 rounded-[12px] px-3.5 py-2.5 mb-1.5">
                    <span className="text-xs font-medium text-purple-800">{room.name}</span>
                    <span className="text-[9px] text-purple-400">{room.type}</span>
                  </div>
                ))}
              </div>
            )}

            {rec.stores && rec.stores.length > 0 && (
              <div>
                <div className="text-[10px] text-purple-400 mb-2">📍 附近门店</div>
                {rec.stores.map((store, i) => (
                  <div key={i} className="flex items-center justify-between bg-purple-50/60 rounded-[12px] px-3.5 py-2.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-brand-coral" />
                      <span className="text-xs font-medium text-purple-800">{store.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-purple-400">
                      <span>{store.direction}</span>
                      <span>{store.distance}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ 运势工具 6格 ═══════ */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-xs font-bold text-purple-800">运势工具</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {FORTUNE_TOOLS.map((tool, i) => (
              tool.label === "分享" ? (
                <button key={i} onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                    .then(() => { const el = document.createElement('div'); el.className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-800 text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-bounce'; el.textContent='✅ 链接已复制！'; document.body.appendChild(el); setTimeout(()=>el.remove(),2000); })
                    .catch(() => {});
                }}
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
          本运势由 AI 基于八字命理 · 奇门遁甲 · 六十四卦算法综合生成，仅供娱乐参考。<br />
          事在人为，保持积极心态方能顺势而行。
        </div>

      </div>
    </main>
  );
}
