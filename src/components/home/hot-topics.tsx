"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";

interface HotTopic {
  icon: string;
  title: string;
  tag: string;
  tagColor: string;
  desc: string;
  participants: number;
  href: string;
  badge?: string;
}

// 硬编码备选（API无数据时展示）
const FALLBACK_TOPICS: HotTopic[] = [
  { icon: "⚽", title: "贵州村超 vs 广东村BA", tag: "🔥 超热", tagColor: "bg-brand-coral text-white", desc: "谁才是乡村第一联赛？", participants: 8723, href: "/pk-hall", badge: "全民热议" },
  { icon: "💬", title: "周杰伦 vs 林俊杰 谁是华语天花板？", tag: "🔥 热议", tagColor: "bg-brand-coral text-white", desc: "8090后的青春之争", participants: 12839, href: "/pk-hall", badge: "1.2万人吵翻" },
  { icon: "🏡", title: "2026房价走势：涨还是跌？", tag: "焦心", tagColor: "bg-brand-gold text-white", desc: "你的选择决定你的钱包", participants: 9834, href: "/pk-hall" },
  { icon: "🌾", title: "今年玉米价格能到1块5吗？", tag: "乡村", tagColor: "bg-brand-teal text-white", desc: "种地的老乡来唠唠", participants: 2134, href: "/pk-hall" },
];

const CAT_TABS = [
  { key: "hot", label: "🔥 热门话题" },
  { key: "sports", label: "⚽ 体育PK" },
  { key: "social", label: "❤️ 公益生活" },
  { key: "general", label: "💬 综合" },
] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HotTopics() {
  const [activeTab, setActiveTab] = useState<string>("hot");
  const [apiTopics, setApiTopics] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/pk?action=list&limit=8`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.length > 0) {
          setApiTopics(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // 从API数据转换
  const realTopics: HotTopic[] = apiTopics.map((t: any) => ({
    icon: t.category === "sports" ? "⚽" : t.category === "social" ? "❤️" : t.category === "general" ? "💬" : "🔥",
    title: t.title || "未命名话题",
    tag: t.status_label || (t.category === "sports" ? "🔥 热门" : "热门"),
    tagColor: t.category === "sports" ? "bg-brand-coral text-white" : "bg-brand-teal text-white",
    desc: `${(t.vote_a || 0) + (t.vote_b || 0)}人参与`,
    participants: (t.vote_a || 0) + (t.vote_b || 0) + (t.spectator_count || 0),
    href: `/pk-hall?topic=${t.id}`,
    badge: t.time_label || undefined,
  }));

  const topicPool = loaded && realTopics.length > 0 ? realTopics : FALLBACK_TOPICS;

  const getFiltered = () => {
    if (activeTab === "hot") return shuffleArray(topicPool).slice(0, 4);
    return topicPool.filter(t => {
      const cat = t.tag?.includes("体育") || t.tag?.includes("超热") || t.tag?.includes("热门") ? "sports" :
        t.tag?.includes("公益") || t.tag?.includes("生活") || t.tag?.includes("焦心") ? "social" : "general";
      return cat === activeTab || activeTab === "hot";
    }).slice(0, 4);
  };

  const filtered = getFiltered();

  return (
    <div className="bg-white rounded-xl border border-brand-teal/10 shadow-sm overflow-hidden">
      {/* ── 标题行 ── */}
      <div className="px-4 pt-3.5 pb-1.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-text-primary">⚡ 全民PK</h2>
            {loaded && apiTopics.length > 0 ? (
              <span className="text-[9px] bg-brand-teal text-white px-2 py-[1px] rounded-full font-medium">动态</span>
            ) : (
              <span className="text-[9px] bg-brand-teal-light/30 text-brand-teal-dark px-2 py-[1px] rounded-full font-medium">热门</span>
            )}
          </div>
          <Link href="/pk-hall" className="text-[11px] text-brand-teal font-medium flex items-center gap-1">
            去PK大厅 →
          </Link>
        </div>

        {/* ── 加油标语条 ── */}
        <div className="bg-gradient-to-r from-brand-teal/10 via-brand-gold/10 to-brand-coral/10 rounded-lg px-3 py-2 mb-2.5 border border-brand-teal/10">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[16px]">📣</span>
            <span className="text-[13px] font-semibold text-text-primary">为他们加油 · </span>
            <span className="text-[13px] font-bold text-brand-coral">他们PK你也有奖励哦</span>
            <span className="text-[16px]">🎁</span>
          </div>
          <div className="text-center text-[10px] text-text-tertiary mt-0.5">
            围观分享奖-5% · 门店奖-5% · 招商奖-3%
          </div>
        </div>

        {/* 分类 Tab */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CAT_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-brand-teal text-white font-medium" : "bg-gray-50 text-text-tertiary"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 话题列表 ── */}
      <div className="px-4 pb-2 flex flex-col gap-2">
        {filtered.map((topic, i) => (
          <Link key={i} href={topic.href}
            className="flex items-center gap-3 bg-gradient-to-r from-gray-50/50 to-white rounded-lg px-3 py-2.5 border border-brand-teal/5 active:scale-[0.98] transition-transform">
            <div className="w-9 h-9 rounded-lg bg-brand-teal-light/20 flex items-center justify-center text-[18px] flex-shrink-0">
              {topic.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-text-primary truncate">{topic.title}</span>
                {topic.badge && (
                  <span className="text-[8px] bg-brand-coral/10 text-brand-coral-dark px-1.5 py-[1px] rounded-full font-medium whitespace-nowrap">{topic.badge}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[9px] px-1.5 py-[1px] rounded-full ${topic.tagColor}`}>{topic.tag}</span>
                <span className="text-[10px] text-text-tertiary">{topic.desc}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-[13px] font-bold text-text-secondary">{topic.participants.toLocaleString()}</div>
              <div className="text-[8px] text-text-tertiary">人参与</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── CTA ── */}
      <Link href="/pk-hall"
        className="block mx-4 mb-3.5 rounded-[10px] bg-gradient-to-r from-brand-teal to-brand-teal-dark py-2.5 text-center active:scale-[0.98] transition-transform shadow-sm">
        <div className="text-[13px] font-semibold text-white">🔥 去PK大厅 · 发起话题赢奖励</div>
        <div className="text-[10px] text-white/70 mt-0.5">
          围观分享奖-5% · 门店奖-5% · 招商奖-3%
        </div>
      </Link>
    </div>
  );
}
