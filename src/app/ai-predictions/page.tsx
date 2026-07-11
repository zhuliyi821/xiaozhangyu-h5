"use client";

/** 🤖 AI 预测日报
 *
 * 展示5大分类（国内体育/彩票/股指/BTC/体育竞技）的 AI 预测
 * 实时从 /api/ai-report 获取最新日报数据
 * 每类预测含置信度、方向、来源、赔率信息
 */

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Zap, RefreshCw, ChevronRight, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";

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

// ── Category colors and icons ──
const CATEGORY_STYLE: Record<string, { color: string; bg: string; accent: string; gradient: string }> = {
  sports_domestic: { color: "#D85A30", bg: "rgba(216,90,48,0.08)", accent: "#FDE8E4", gradient: "from-[#D85A30] to-[#F15A40]" },
  lottery:          { color: "#1D9E75", bg: "rgba(29,158,117,0.08)", accent: "#E1F5EE", gradient: "from-[#1D9E75] to-[#28B883]" },
  stock_index:      { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", accent: "#EDE9FE", gradient: "from-[#7C3AED] to-[#8B5CF6]" },
  btc:              { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", accent: "#FEF3C7", gradient: "from-[#F59E0B] to-[#FBBF24]" },
  sports_global:    { color: "#2563EB", bg: "rgba(37,99,235,0.08)", accent: "#DBEAFE", gradient: "from-[#2563EB] to-[#3B82F6]" },
};

const DIRECTION_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  up:     { label: "看涨", icon: "📈", color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  down:   { label: "看跌", icon: "📉", color: "#059669", bg: "rgba(5,150,105,0.1)" },
  win:    { label: "看好", icon: "🏆", color: "#D85A30", bg: "rgba(216,90,48,0.1)" },
  draw:   { label: "平局", icon: "🤝", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

function getConfidenceColor(c: number): { text: string; bar: string; bg: string } {
  if (c >= 80) return { text: "text-red-600", bar: "bg-red-500", bg: "bg-red-50" };
  if (c >= 65) return { text: "text-amber-600", bar: "bg-amber-500", bg: "bg-amber-50" };
  return { text: "text-gray-500", bar: "bg-gray-400", bg: "bg-gray-50" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${month}月${day}日 周${weekdays[d.getDay()]}`;
}

// ── Game link map ──
const GAME_LINKS: Record<string, string> = {
  sports_domestic: "/lottery/sports",
  lottery: "/lotto",
  stock_index: "/stock",
  btc: "/btc-predict",
  sports_global: "/pk-hall",
};

// ── Skeleton ──
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-[8px] ${className}`} />;
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

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/ai-report");
      const json = await res.json();
      if (json.code === 0) {
        setData(json.data);
        if (json.data.categories?.length > 0) {
          setActiveCategory(json.data.categories[0].category);
        }
      } else {
        setError(json.msg || "暂无数据");
      }
    } catch {
      setError("网络异常");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const res = await fetch("/api/ai-report/all");
      const json = await res.json();
      if (json.code === 0) setRecentReports(json.data);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchRecentReports(); fetchWallet(); }, []);

  const fetchWallet = async () => {
    const uid = (user as any)?.uid || 0;
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/api/wallet/brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const json = await res.json();
      if (json.code === 0) setWallet(json.data);
    } catch {}
  };

  // ── Active category predictions ──
  const activePredictions = useMemo(() => {
    if (!data) return [];
    return data.predictions.filter(p => p.category === activeCategory);
  }, [data, activeCategory]);

  const activeCategoryInfo = useMemo(() => {
    if (!data) return null;
    return data.categories.find(c => c.category === activeCategory) || null;
  }, [data, activeCategory]);

  const { todayStr, isToday } = useMemo(() => {
    if (!data) return { todayStr: "", isToday: false };
    const today = new Date();
    const todayStrFormatted = today.toISOString().split("T")[0];
    return { todayStr: todayStrFormatted, isToday: data.latest_date === todayStrFormatted };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-40 w-full mb-3" />
        <Skeleton className="h-40 w-full mb-3" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-6">
        <div className="text-4xl">🤖</div>
        <p className="text-text-tertiary text-[13px] text-center">{error || "暂无预测数据"}</p>
        <button onClick={fetchData}
          className="px-5 py-2 bg-brand-teal text-white text-[12px] font-medium rounded-[8px]">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[6px] bg-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-[9px]">AI</span>
            </div>
            <div>
              <div className="text-[14px] font-semibold text-text-primary">
                AI 预测
                {isToday && <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium ml-1.5">今日</span>}
              </div>
              <div className="text-[10px] text-text-tertiary">{formatDate(data.latest_date)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/jiadouzhan"
              className="text-[10px] text-brand-teal font-medium flex items-center gap-1">
              获取游戏豆 →
            </Link>
            <button onClick={fetchData} disabled={refreshing}
              className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
              <RefreshCw size={13} className={`text-text-tertiary ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        {/* Summary */}
        {data.report.summary && (
          <div className="px-4 pb-3">
            <div className="text-[11px] text-text-tertiary leading-relaxed bg-gray-50 rounded-[8px] px-3 py-2">
              {data.report.summary}
            </div>
          </div>
        )}
      </div>

      {/* ── 资产格 + 双奖池 ── */}
      <div className="px-4 pt-3">
        {/* 3 资产格 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-brand-teal-light/30 rounded-[10px] py-3 px-2 text-center border border-brand-teal/20">
            <div className="text-[10px] text-brand-teal-dark font-medium">游戏豆</div>
            <div className="text-[18px] font-bold text-brand-teal-darkest mt-1">{(wallet.credit1 || 0).toLocaleString()}</div>
          </div>
          <div className="bg-blue-50 rounded-[10px] py-3 px-2 text-center border border-blue-200">
            <div className="text-[10px] text-blue-700 font-medium">水晶石</div>
            <div className="text-[18px] font-bold text-blue-800 mt-1">{(wallet.credit5 || 0).toLocaleString()}</div>
          </div>
          <div className="bg-brand-coral-light/30 rounded-[10px] py-3 px-2 text-center border border-brand-coral/20">
            <div className="text-[10px] text-brand-coral-dark font-medium">水晶球</div>
            <div className="text-[18px] font-bold text-brand-coral-darkest mt-1">{(wallet.credit3 || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* 双奖池 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-[10px] border border-gray-100 py-3.5 px-3 text-center shadow-sm">
            <div className="text-[10px] text-text-tertiary">总奖励池</div>
            <div className="text-[22px] font-bold text-brand-teal-dark mt-1">3,850</div>
            <div className="text-[10px] text-text-tertiary">水晶石</div>
            <div className="text-[10px] text-purple-600 mt-1.5">今日已开奖 89 次</div>
          </div>
          <div className="bg-gradient-to-br from-brand-teal-darkest to-purple-800 rounded-[10px] py-3.5 px-3 text-center">
            <div className="text-[10px] text-white/75">累积奖励池</div>
            <div className="text-[24px] font-bold text-white mt-1 tracking-wider">12,580</div>
            <div className="text-[10px] text-white/60">水晶石</div>
            <div className="text-[10px] text-brand-gold mt-1.5">+380 今日增加</div>
            <div className="text-[9px] text-white/50">距上次中奖 3,420 次</div>
          </div>
        </div>

        {/* AI瞎猜 */}
        <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm px-4 py-3.5 mb-3">
          <div className="text-[13px] font-bold text-text-primary mb-3">AI瞎猜</div>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/lottery/dlt/chart"
              className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-text-secondary">彩票乱说</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI随机生成 纯属娱乐</div>
            </Link>
            <Link href="/stock-analysis"
              className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-text-secondary">股市瞎猜</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI盲猜涨跌 不准别打</div>
            </Link>
            <Link href="/btc-predict"
              className="bg-gray-50 rounded-[10px] py-2.5 px-2 text-center active:scale-95 transition-transform">
              <div className="text-[12px] font-semibold text-text-secondary">BTC胡判</div>
              <div className="text-[9px] text-text-tertiary mt-1">AI胡说走势 不准别打</div>
            </Link>
          </div>
        </div>

        {/* 游戏中心 */}
        <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm px-4 py-3.5 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] font-bold text-text-primary">游戏中心</span>
            <span className="text-[10px] font-semibold text-brand-coral">3连胜 +5%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/lottery-sim"
              className="rounded-[10px] border border-gray-100 py-3.5 px-3 text-center active:scale-95 transition-transform shadow-sm">
              <div className="text-[14px] font-bold text-blue-700">数字碰</div>
              <div className="text-[10px] text-text-tertiary mt-1">奖池</div>
              <div className="text-[16px] font-bold text-blue-800">2,450</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 2 豆</div>
            </Link>
            <Link href="/btc"
              className="rounded-[10px] border border-gray-100 py-3.5 px-3 text-center active:scale-95 transition-transform shadow-sm">
              <div className="text-[14px] font-bold text-brand-gold-dark">BTC快节奏</div>
              <div className="text-[10px] text-text-tertiary mt-1">在线</div>
              <div className="text-[16px] font-bold text-amber-800">132 人</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 10 豆</div>
            </Link>
            <Link href="/sim"
              className="rounded-[10px] border border-gray-100 py-3.5 px-3 text-center active:scale-95 transition-transform shadow-sm">
              <div className="text-[14px] font-bold text-brand-teal-dark">股指期货</div>
              <div className="text-[10px] text-text-tertiary mt-1">今日</div>
              <div className="text-[16px] font-bold text-brand-teal-darkest">+2.03%</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 10 豆</div>
            </Link>
            <Link href="/btc-predict"
              className="rounded-[10px] border border-gray-100 py-3.5 px-3 text-center active:scale-95 transition-transform shadow-sm">
              <div className="text-[14px] font-bold text-brand-coral-dark">BTC预测</div>
              <div className="text-[10px] text-text-tertiary mt-1">7模型分析</div>
              <div className="text-[16px] font-bold text-brand-coral-darkest">看涨72%</div>
              <div className="mt-2 bg-brand-teal-light/50 rounded-[6px] py-1 text-[10px] text-brand-teal-dark font-medium">消耗 10 豆</div>
            </Link>
          </div>
        </div>

        {/* 游戏豆不足兜底 */}
        <div className="bg-brand-coral-light/30 rounded-[10px] border border-brand-coral/30 px-4 py-3 mb-3">
          <div className="text-[12px] font-semibold text-brand-coral-dark mb-2">游戏豆不够了?</div>
          <div className="flex gap-2">
            <Link href="/marketplace" className="text-[11px] bg-white px-3 py-1.5 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">购物得豆</Link>
            <Link href="/tasks" className="text-[11px] bg-white px-3 py-1.5 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">任务得豆</Link>
            <Link href="/store" className="text-[11px] bg-white px-3 py-1.5 rounded-full text-brand-coral-dark font-medium active:scale-95 transition-transform">到店得豆</Link>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="sticky top-[108px] z-10 bg-white/90 backdrop-blur-sm border-b border-gray-50 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {data.categories.map((cat) => {
            const cs = CATEGORY_STYLE[cat.category] || CATEGORY_STYLE.btc;
            const active = activeCategory === cat.category;
            return (
              <button key={cat.category} onClick={() => setActiveCategory(cat.category)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-medium transition-all
                  ${active ? "text-white shadow-sm" : "text-text-secondary bg-gray-50 hover:bg-gray-100"}`}
                style={active ? { background: cs.color } : {}}>
                <span className="text-[13px]">{cat.icon}</span>
                <span>{cat.category_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Predictions for Active Category ── */}
      <div className="px-4 pt-3 space-y-3">
        {activePredictions.length === 0 && (
          <div className="text-center py-10 text-text-tertiary text-[12px]">
            该分类暂无预测
          </div>
        )}

        {activePredictions.map((pred) => {
          const cc = getConfidenceColor(pred.confidence);
          const dir = DIRECTION_MAP[pred.direction] || null;
          const cs = CATEGORY_STYLE[activeCategory] || CATEGORY_STYLE.btc;
          const gameLink = GAME_LINKS[activeCategory] || "/";

          return (
            <div key={pred.id} className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden">
              {/* Top: title + direction */}
              <div className="px-3.5 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-medium text-text-primary leading-snug flex-1">{pred.title}</h3>
                  {dir && (
                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: dir.color, background: dir.bg }}>
                      {dir.icon} {dir.label}
                    </span>
                  )}
                </div>
                {pred.summary && (
                  <p className="text-[11px] text-text-tertiary mt-1 leading-relaxed">{pred.summary}</p>
                )}
              </div>

              {/* Confidence bar */}
              <div className="px-3.5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${cc.bar}`}
                      style={{ width: `${pred.confidence}%` }} />
                  </div>
                  <span className={`text-[10px] font-semibold ${cc.text} shrink-0`}>
                    {pred.confidence}%
                  </span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px] text-text-tertiary">置信度</span>
                  {pred.odds && <span className="text-[9px] text-text-tertiary">{pred.odds}</span>}
                </div>
              </div>

              {/* Source + tags */}
              <div className="px-3.5 pb-2 flex flex-wrap items-center gap-2">
                {pred.source && (
                  <a href={pred.source_url || "#"} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[9px] text-text-tertiary hover:text-brand-teal">
                    <ExternalLink size={10} /> {pred.source}
                  </a>
                )}
                {pred.tags?.map((tag: string, i: number) => (
                  <span key={i} className="text-[9px] text-text-tertiary bg-gray-50 px-1.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link href={gameLink}
                className="block border-t border-gray-50 px-3.5 py-2.5 flex items-center justify-between active:bg-gray-50 transition-colors"
                style={{ color: cs.color }}>
                <span className="text-[11px] font-medium">基于此预测参与 →</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* ── Recent Reports ── */}
      {recentReports.length > 1 && (
        <div className="mt-6 px-4">
          <button onClick={() => setShowAllReports(!showAllReports)}
            className="w-full flex items-center justify-between text-[12px] font-medium text-text-secondary bg-white rounded-[10px] border border-gray-100 px-3.5 py-2.5">
            <span className="flex items-center gap-2">
              <Calendar size={13} />
              历史报告
            </span>
            <span className="text-text-tertiary">{recentReports.length} 期</span>
          </button>
          {showAllReports && (
            <div className="mt-2 bg-white rounded-[10px] border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {recentReports.slice(1).map((r: any) => (
                <div key={r.id} onClick={() => { setShowAllReports(false); }}
                  className="flex items-center justify-between px-3.5 py-2.5 active:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary bg-gray-50 px-1.5 py-0.5 rounded">📄</span>
                    <span className="text-[12px]">{formatDate(r.date)}</span>
                  </div>
                  <span className="text-[10px] text-text-tertiary">{r.summary?.slice(0, 20)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom info ── */}
      <div className="mt-8 px-4 text-center">
        <p className="text-[10px] text-text-tertiary leading-relaxed">
          AI 预测仅供参考，不构成投资建议。<br />
          预测结果基于历史数据与多源分析，实际走势可能有所不同。
        </p>
      </div>
    </div>
  );
}
