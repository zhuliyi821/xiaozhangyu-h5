"use client";

/** 🤖 AI 预测 — 7模块紧凑架构 + 品牌色统一
 *
 * 布局:
 *   ① 品牌Header (brand-teal渐变)
 *   ② 资产速览 (3项紧凑)
 *   ③ 分类标签 (珊瑚/青/金三段式)
 *   ④ AI预测卡片 (核心内容)
 *   ⑤ 游戏入口 (紧凑)
 *   ⑥ 奖池 (2列)
 *   ⑦ 底部模块 (AI灵感·公益·参与进度)
 */

import { useState, useEffect, useMemo } from "react";
import { Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import AiPredictionsHeader from "./_components/AiPredictionsHeader";
import AssetOverview from "./_components/AssetOverview";

interface PredictionItem {
  id: number;
  category: string;
  title: string;
  confidence: number;
  direction: string;
  odds: string;
  source: string;
  source_url: string;
  summary: string;
  content: string;
  tags: string[];
}

interface CategoryGroup {
  category: string;
  category_name: string;
  icon: string;
  items: any[];
}

interface ReportData {
  report: { id: number; date: string; summary: string; published_at: number };
  categories: CategoryGroup[];
  predictions: PredictionItem[];
  latest_date: string;
}

const CATEGORY_STYLE: Record<string, { color: string; accent: string; gradient: string }> = {
  sports_domestic: { color: "#F27152", accent: "#FDE8E4", gradient: "from-brand-coral to-brand-coral-dark" },
  lottery:          { color: "#45CCD5", accent: "#E1F5EE", gradient: "from-brand-teal to-brand-teal-dark" },
  stock_index:      { color: "#F2B631", accent: "#FEF3C7", gradient: "from-brand-gold to-brand-gold-dark" },
  btc:              { color: "#2BAAAF", accent: "#A0EDF2", gradient: "from-brand-teal-dark to-brand-teal" },
  sports_global:    { color: "#D45435", accent: "#FABAA8", gradient: "from-brand-coral-dark to-brand-coral" },
};

const DIRECTION_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  up:     { label: "看涨", icon: "📈", color: "#F27152", bg: "rgba(242,113,82,0.1)" },
  down:   { label: "看跌", icon: "📉", color: "#45CCD5", bg: "rgba(69,204,213,0.1)" },
  win:    { label: "看好", icon: "🏆", color: "#F2B631", bg: "rgba(242,182,49,0.1)" },
  draw:   { label: "平局", icon: "🤝", color: "#2BAAAF", bg: "rgba(43,170,175,0.1)" },
};

function getConfidenceColor(c: number): { text: string; bar: string } {
  if (c >= 80) return { text: "text-brand-teal-dark", bar: "bg-brand-teal" };
  if (c >= 65) return { text: "text-brand-gold-dark", bar: "bg-brand-gold" };
  return { text: "text-text-tertiary", bar: "bg-gray-400" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${["日","一","二","三","四","五","六"][d.getDay()]}`;
}

const GAME_LINKS: Record<string, string> = {
  sports_domestic: "/pk-hall?category=sports",
  lottery: "/lottery-sim",
  stock_index: "/stock-analysis",
  btc: "/btc",
  sports_global: "/pk-hall?category=sports",
};

const GAME_NAMES: Record<string, { name: string; desc: string; cost: string; icon: string; bg: string }> = {
  btc: { name: "BTC快节奏", desc: "60秒一轮·涨跌预测", cost: "10豆起", icon: "₿", bg: "bg-brand-gold-light/30" },
  stock_index: { name: "股指期货", desc: "大盘走势预测", cost: "10豆起", icon: "📈", bg: "bg-[#EDE9FE]" },
  lottery: { name: "数字碰", desc: "猜数字赢大奖池", cost: "2豆起", icon: "🎲", bg: "bg-brand-teal-light/30" },
  sports_domestic: { name: "体育PK", desc: "投票赢水晶石", cost: "100豆起", icon: "⚽", bg: "bg-brand-coral-light/30" },
  sports_global: { name: "体育PK", desc: "投票赢水晶石", cost: "100豆起", icon: "⚽", bg: "bg-brand-coral-light/30" },
};

const REWARD_EGGS = [
  "今天巨蟹座运气最佳 🦀", "🔥 热门推荐：村BA今晚开打！",
  "已有 1,284 人在PK大厅互怼", "💡 连续签到7天额外送10,000豆",
  "📊 今日彩票预测准确率高达82%", "悄悄告诉你…BTC目前看涨信号最强 📈",
  "✨ 已有 34 位用户今天发起过PK", "🎲 数字碰奖池已累积 2,450 水晶石",
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-[8px] ${className}`} />;
}

function getDailyParticipation(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().split("T")[0];
  try {
    const stored = JSON.parse(localStorage.getItem("ai_pred_participation") || "{}");
    return stored.date === today ? stored.count : 0;
  } catch { return 0; }
}
function setDailyParticipation(count: number) {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  localStorage.setItem("ai_pred_participation", JSON.stringify({ date: today, count }));
}

export default function AiPredictionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("btc");
  const [refreshing, setRefreshing] = useState(false);
  const [showAllReports, setShowAllReports] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [wallet, setWallet] = useState({ credit1: 0, credit5: 0, credit3: 0 });
  const [poolData, setPoolData] = useState<{ instant_pool: number; cumulative_pool: number } | null>(null);
  const [dailyCount, setDailyCount] = useState(getDailyParticipation());
  const [recentWinMsg, setRecentWinMsg] = useState<string | null>(null);
  const [eggMessage] = useState(() => REWARD_EGGS[Math.floor(Math.random() * REWARD_EGGS.length)]);

  const fetchPool = async () => {
    try { const res = await fetch("/api/pool/status"); const json = await res.json(); if (json.code === 0) setPoolData(json.data); } catch {}
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/ai-report");
      const json = await res.json();
      if (json.code === 0) {
        setData(json.data);
        if (json.data.categories?.length > 0) setActiveCategory(json.data.categories[0].category);
      } else setError(json.msg || "暂无数据");
    } catch { setError("网络异常"); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchRecentReports = async () => {
    try { const res = await fetch("/api/ai-report/all"); const json = await res.json(); if (json.code === 0) setRecentReports(json.data); } catch {}
  };

  useEffect(() => { fetchData(); fetchRecentReports(); fetchWallet(); fetchPool(); }, []);

  const fetchWallet = async () => {
    const uid = (user as any)?.uid || 0;
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/wallet_api.php?uid=${uid}&action=balance`);
      const json = await res.json();
      if (json.code === 0 && json.data) setWallet(json.data);
    } catch {}
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const win = localStorage.getItem("recent_ai_win");
      if (win) {
        const parsed = JSON.parse(win);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) setRecentWinMsg(`🎉 你刚赢了 ${parsed.amount.toLocaleString()} 豆！继续看下一场预测？`);
        localStorage.removeItem("recent_ai_win");
      }
    } catch {}
  }, []);

  const trackParticipation = () => { const n = dailyCount + 1; setDailyCount(n); setDailyParticipation(n); };

  const activePredictions = useMemo(() => data?.predictions.filter(p => p.category === activeCategory) || [], [data, activeCategory]);
  const activeCategoryInfo = useMemo(() => data?.categories.find(c => c.category === activeCategory) || null, [data, activeCategory]);
  const { isToday } = useMemo(() => {
    if (!data) return { todayStr: "", isToday: false };
    return { todayStr: new Date().toISOString().split("T")[0], isToday: data.latest_date === new Date().toISOString().split("T")[0] };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg px-4 py-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-40 w-full mb-3" />
        <Skeleton className="h-40 w-full mb-3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-3 px-6">
        <div className="text-4xl">🤖</div>
        <p className="text-text-tertiary text-[13px] text-center">{error || "暂无预测数据"}</p>
        <button onClick={fetchData} className="px-5 py-2 bg-brand-teal text-white text-[12px] font-medium rounded-[8px]">重试</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-20">

      {/* ① 品牌Header + ② 资产速览 */}
      <AiPredictionsHeader
        isToday={isToday}
        data={data}
        refreshing={refreshing}
        onRefresh={fetchData}
        recentWinMsg={recentWinMsg}
      />
      <AssetOverview wallet={wallet} />

      {/* 彩蛋消息 */}
      <div className="px-4 mb-3">
        <div className="text-[10px] text-text-tertiary flex items-center gap-1.5 bg-white/50 rounded-[8px] px-3 py-1.5 border border-gray-50">
          <span className="text-[12px]">✨</span><span>{eggMessage}</span>
        </div>
      </div>

      {/* ════════════════════ ③ 分类标签 ════════════════════ */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {data.categories.map((cat) => {
            const cs = CATEGORY_STYLE[cat.category] || CATEGORY_STYLE.btc;
            const active = activeCategory === cat.category;
            return (
              <button key={cat.category} onClick={() => setActiveCategory(cat.category)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-medium transition-all
                  ${active ? "text-white shadow-sm" : "text-text-secondary bg-surface border border-border hover:bg-gray-50"}`}
                style={active ? { background: cs.color } : {}}>
                <span className="text-[13px]">{cat.icon}</span>
                <span>{cat.category_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════ ④ AI预测卡片（核心） ════════════════════ */}
      <div className="px-4 space-y-3 mb-4">
        {activePredictions.length === 0 && (
          <div className="text-center py-10 text-text-tertiary text-[12px]">该分类暂无预测</div>
        )}
        {activePredictions.map((pred) => {
          const cc = getConfidenceColor(pred.confidence);
          const dir = DIRECTION_MAP[pred.direction] || null;
          const cs = CATEGORY_STYLE[activeCategory] || CATEGORY_STYLE.btc;
          const gameLink = GAME_LINKS[activeCategory] || "/pk-hall";
          const game = GAME_NAMES[activeCategory] || GAME_NAMES.btc;

          return (
            <div key={pred.id} className="bg-surface rounded-[14px] border border-border shadow-card overflow-hidden">
              {/* 标题 + 方向标签 */}
              <div className="px-4 pt-3.5 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-text-primary leading-snug flex-1">{pred.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {pred.confidence >= 80 && (
                      <span className="text-[9px] bg-brand-teal-light/30 text-brand-teal-dark px-1.5 py-0.5 rounded-full font-medium">🔥 AI高把握</span>
                    )}
                    {pred.confidence < 65 && (
                      <span className="text-[9px] bg-gray-50 text-text-tertiary px-1.5 py-0.5 rounded-full">🔄 仅供参考</span>
                    )}
                    {dir && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ color: dir.color, background: dir.bg }}>
                        {dir.icon} {dir.label}
                      </span>
                    )}
                  </div>
                </div>
                {pred.summary && (
                  <p className="text-[11px] text-text-tertiary mt-1.5 leading-relaxed">{pred.summary}</p>
                )}
              </div>

              {/* 置信度条 */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cc.bar}`} style={{ width: `${pred.confidence}%` }} />
                  </div>
                  <span className={`text-[10px] font-semibold ${cc.text} shrink-0`}>{pred.confidence}%</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-text-tertiary">置信度</span>
                  {pred.odds && <span className="text-[9px] text-text-tertiary">{pred.odds}</span>}
                </div>
              </div>

              {/* 来源 + 标签 */}
              <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
                {pred.source && (
                  <a href={pred.source_url || "#"} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[9px] text-text-tertiary hover:text-brand-teal">
                    <ExternalLink size={10} /> {pred.source}
                  </a>
                )}
                {pred.tags?.map((tag, i) => (
                  <span key={i} className="text-[9px] text-text-tertiary bg-gray-50 px-1.5 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>

              {/* CTA：关联游戏 */}
              <Link href={gameLink} onClick={trackParticipation}
                className="block bg-gradient-to-r from-brand-teal via-brand-teal-dark to-brand-teal-darkest px-4 py-3 active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-[8px] ${game.bg} flex items-center justify-center text-[16px]`}>{game.icon}</div>
                    <div>
                      <div className="text-[11px] font-semibold text-white">{game.name}</div>
                      <div className="text-[9px] text-white/70">{game.desc} · {game.cost}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-brand-gold-light">🔥 去参与</div>
                    <div className="text-[8px] text-white/50">👇 点击开始</div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* ════════════════════ ⑤ 游戏入口（紧凑） ════════════════════ */}
      <div className="px-4 mb-4">
        <div className="bg-surface rounded-[14px] border border-border shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-text-primary flex items-center gap-1">🎮 热门游戏</span>
            <span className="text-[9px] text-brand-teal font-medium">3连胜 +5%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/lottery-sim"
              className="rounded-[10px] border-2 border-brand-teal/40 py-3 px-3 text-center active:scale-95 transition-shadow relative overflow-hidden">
              <div className="absolute -top-3 -right-8 bg-brand-teal text-white text-[8px] font-bold py-1 px-8 rotate-45">⭐ 推荐</div>
              <div className="text-[14px] font-bold text-brand-teal-dark">数字碰</div>
              <div className="text-[10px] text-text-tertiary mt-1">奖池</div>
              <div className="text-[16px] font-bold text-brand-gold-dark">2,450</div>
              <div className="mt-2 bg-brand-teal rounded-[6px] py-1 text-[10px] text-white font-medium">消耗 2 豆 · 最低门槛</div>
            </Link>
            <Link href="/btc"
              className="rounded-[10px] border border-border py-3 px-3 text-center active:scale-95 transition-shadow">
              <div className="text-[14px] font-bold text-brand-gold-dark">BTC快节奏</div>
              <div className="text-[10px] text-text-tertiary mt-1">在线 132 人</div>
              <div className="text-[16px] font-bold text-brand-gold-dark">实时</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 10 豆</div>
            </Link>
            <Link href="/stock-analysis"
              className="rounded-[10px] border border-border py-3 px-3 text-center active:scale-95 transition-shadow">
              <div className="text-[14px] font-bold text-brand-teal-dark">股指期货</div>
              <div className="text-[10px] text-text-tertiary mt-1">今日 +2.03%</div>
              <div className="text-[16px] font-bold text-brand-teal-darkest">模拟</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 10 豆</div>
            </Link>
            <Link href="/sports-betting"
              className="rounded-[10px] border border-border py-3 px-3 text-center active:scale-95 transition-shadow">
              <div className="text-[14px] font-bold text-brand-coral-dark">体育投票</div>
              <div className="text-[10px] text-text-tertiary mt-1">🔥 10 场进行中</div>
              <div className="text-[16px] font-bold text-brand-coral-darkest">1,284人</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">100豆起投</div>
            </Link>
          </div>
        </div>
      </div>

      {/* ════════════════════ ⑥ 奖池（2列紧凑） ════════════════════ */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-brand-teal-darkest to-brand-teal-dark rounded-[12px] py-3 px-3 text-center shadow-sm">
            <div className="text-[9px] text-white/70">⚡ 即时奖池</div>
            <div className="text-[22px] font-bold text-white mt-0.5 tracking-wider">
              {poolData ? (poolData.instant_pool || 0).toLocaleString() : "—"}
            </div>
            <div className="text-[9px] text-brand-gold mt-1">水晶石 · 可提取</div>
          </div>
          <div className="bg-gradient-to-br from-brand-gold-dark to-brand-coral-dark rounded-[12px] py-3 px-3 text-center shadow-sm">
            <div className="text-[9px] text-white/70">🏆 累积奖池</div>
            <div className="text-[22px] font-bold text-white mt-0.5 tracking-wider">
              {poolData ? (poolData.cumulative_pool || 0).toLocaleString() : "—"}
            </div>
            <div className="text-[9px] text-brand-gold mt-1">水晶石 · 大奖累积</div>
          </div>
        </div>
      </div>

      {/* ════════════════════ ⑦ 底部模块 ════════════════════ */}
      <div className="px-4 space-y-3">
        {/* AI灵感 */}
        <div className="bg-surface rounded-[14px] border border-border shadow-card p-4">
          <span className="text-[12px] font-bold text-text-primary flex items-center gap-1 mb-3">💡 AI灵感</span>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/lottery/dlt/chart" className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-brand-teal-dark">彩票推测</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI大数据分析</div>
            </Link>
            <Link href="/stock-analysis" className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-brand-gold-dark">股市参考</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI大数据分析</div>
            </Link>
            <Link href="/btc-predict" className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-brand-coral-dark">BTC分析</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI大数据分析</div>
            </Link>
          </div>
        </div>

        {/* 公益资金池 */}
        <Link href="/charity-fund"
          className="block bg-gradient-to-r from-brand-teal-dark to-brand-coral rounded-[12px] p-3.5 active:scale-[0.98] transition-transform shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">❤️</span>
              <span className="text-[12px] font-semibold text-white">公益资金池</span>
            </div>
            <span className="text-[11px] text-white/80 font-medium">284,560豆 →</span>
          </div>
        </Link>

        {/* 参与进度 */}
        <div className="bg-surface rounded-[14px] border border-border shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-text-primary">🔥 今日参与 {dailyCount}/5 次</span>
            {dailyCount >= 5 ? (
              <span className="text-[9px] bg-brand-teal-light/30 text-brand-teal-dark px-1.5 py-0.5 rounded-full font-medium">🎉 已完成!</span>
            ) : (
              <span className="text-[9px] text-text-tertiary">明日重置</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${dailyCount >= 5 ? "bg-brand-teal" : "bg-gradient-to-r from-brand-teal to-brand-gold"}`}
              style={{ width: `${Math.min(100, (dailyCount / 5) * 100)}%` }} />
          </div>
          {dailyCount >= 3 && dailyCount < 5 && (
            <div className="text-[9px] text-brand-gold-dark mt-1 font-medium animate-pulse">⚡ 还差 {5 - dailyCount} 次，全勤额外奖励 5,000 豆!</div>
          )}
          {/* 游戏豆兜底 */}
          {(wallet.credit1 || 0) < 500 && (
            <div className="mt-3 bg-brand-coral-light/30 rounded-[8px] border border-brand-coral/30 px-3 py-2">
              <div className="text-[11px] font-semibold text-brand-coral-dark mb-1.5">游戏豆不够了?</div>
              <div className="flex gap-2">
                <Link href="/marketplace" className="text-[10px] bg-white px-2.5 py-1 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">购物得豆</Link>
                <Link href="/tasks" className="text-[10px] bg-white px-2.5 py-1 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">任务得豆</Link>
                <Link href="/store" className="text-[10px] bg-white px-2.5 py-1 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">到店得豆</Link>
              </div>
            </div>
          )}
        </div>

        {/* 历史报告 */}
        {recentReports.length > 1 && (
          <div>
            <button onClick={() => setShowAllReports(!showAllReports)}
              className="w-full flex items-center justify-between text-[12px] font-medium text-text-secondary bg-surface rounded-[10px] border border-border px-3.5 py-2.5">
              <span className="flex items-center gap-2"><Calendar size={13} /> 历史报告</span>
              <span className="text-text-tertiary">{recentReports.length} 期</span>
            </button>
            {showAllReports && (
              <div className="mt-2 bg-surface rounded-[10px] border border-border divide-y divide-gray-50 overflow-hidden">
                {recentReports.slice(1).map((r: any) => (
                  <div key={r.id} onClick={() => setShowAllReports(false)}
                    className="flex items-center justify-between px-3.5 py-2.5 active:bg-gray-50 cursor-pointer">
                    <span className="text-[12px] flex items-center gap-2">
                      <span className="text-[10px] text-text-tertiary bg-gray-50 px-1.5 py-0.5 rounded">📄</span>
                      {formatDate(r.date)}
                    </span>
                    <span className="text-[10px] text-text-tertiary">{r.summary?.slice(0, 20)}...</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 免责 */}
        <div className="text-center pb-4">
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            AI 预测仅供参考，不构成投资建议。<br />
            预测结果基于历史数据与多源分析。
          </p>
        </div>
      </div>

    </div>
  );
}
