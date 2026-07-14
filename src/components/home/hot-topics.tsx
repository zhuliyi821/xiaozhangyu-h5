"use client";

import Link from "next/link";
import { useState } from "react";

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

const HOT_TOPICS: HotTopic[] = [
  // ⚽ 家乡球队 · 村超村BA
  { icon: "⚽", title: "贵州村超 vs 广东村BA", tag: "🔥 超热", tagColor: "bg-brand-coral text-white", desc: "谁才是乡村第一联赛？", participants: 8723, href: "/pk-hall?category=sports", badge: "全民热议" },
  { icon: "🏆", title: "四川足球 vs 云南足球", tag: "家乡", tagColor: "bg-brand-teal text-white", desc: "你为哪个省队呐喊？", participants: 5631, href: "/pk-hall?category=sports", badge: "省队PK" },
  { icon: "🏀", title: "村BA 总决赛谁夺冠？", tag: "🔥 热门", tagColor: "bg-brand-coral text-white", desc: "2026村BA全国总决赛预测", participants: 12056, href: "/pk-hall?category=sports", badge: "万人参与" },
  { icon: "🌾", title: "山东 vs 河南 小麦大省之争", tag: "村超", tagColor: "bg-brand-gold text-white", desc: "种地我们是专业的！", participants: 3412, href: "/pk-hall?category=sports" },
  { icon: "🐉", title: "广东龙舟 vs 湖南龙舟", tag: "民间", tagColor: "bg-brand-teal text-white", desc: "端午龙王争霸赛", participants: 4892, href: "/pk-hall?category=sports", badge: "端午特辑" },

  // 🌐 公益投票
  { icon: "📚", title: "乡村小学图书角", tag: "❤️ 公益", tagColor: "bg-purple-600 text-white", desc: "每投一票，平台配捐1元", participants: 3825, href: "/pk-hall?category=social", badge: "配捐中" },
  { icon: "🌊", title: "长江生态保护计划", tag: "❤️ 公益", tagColor: "bg-purple-600 text-white", desc: "保护母亲河，从我投一票开始", participants: 2156, href: "/pk-hall?category=social" },
  { icon: "🐾", title: "流浪动物救助站", tag: "❤️ 公益", tagColor: "bg-purple-600 text-white", desc: "选择你最想支持的救助项目", participants: 1689, href: "/pk-hall?category=social", badge: "爱心接力" },

  // ⚡ 全民热点
  { icon: "💬", title: "周杰伦 vs 林俊杰 谁是华语天花板？", tag: "🔥 热议", tagColor: "bg-brand-coral text-white", desc: "8090后的青春之争", participants: 12839, href: "/pk-hall?category=general", badge: "1.2万人吵翻" },
  { icon: "🏡", title: "2026房价走势：涨还是跌？", tag: "焦心", tagColor: "bg-brand-gold text-white", desc: "你的选择决定你的钱包", participants: 9834, href: "/pk-hall?category=social" },
  { icon: "🤖", title: "AI会不会取代程序员？", tag: "职场", tagColor: "bg-brand-teal text-white", desc: "2026年的终极之问", participants: 7241, href: "/pk-hall?category=general" },

  // 🌈 多元话题：老年 · 乡村 · 职业 · 家庭 · 独居 · 残障
  { icon: "👴", title: "退休金涨了200块，够用吗？", tag: "老年", tagColor: "bg-brand-gold text-white", desc: "爸妈的生活你了解吗", participants: 3245, href: "/pk-hall?category=social", badge: "长辈热议" },
  { icon: "🌾", title: "今年玉米价格能到1块5吗？", tag: "乡村", tagColor: "bg-brand-teal text-white", desc: "种地的老乡来唠唠", participants: 2134, href: "/pk-hall?category=social" },
  { icon: "🛵", title: "外卖小哥月入过万，你觉得合理吗？", tag: "职业", tagColor: "bg-brand-coral text-white", desc: "每一单都不容易", participants: 4671, href: "/pk-hall?category=social", badge: "大家怎么看" },
  { icon: "👨‍👩‍👧‍👦", title: "爷爷奶奶带大的孩子，会和父母不亲吗？", tag: "家庭", tagColor: "bg-brand-gold text-white", desc: "隔代养育的得与失", participants: 3892, href: "/pk-hall?category=general", badge: "引人深思" },
  { icon: "🏡", title: "一个人生活，月薪1万够花吗？", tag: "独居", tagColor: "bg-brand-teal text-white", desc: "独居的快乐与账单", participants: 5723, href: "/pk-hall?category=general" },
  { icon: "🤝", title: "无障碍设施到位了吗？大家怎么看", tag: "共融", tagColor: "bg-purple-600 text-white", desc: "让城市对每个人都友好", participants: 1876, href: "/pk-hall?category=event", badge: "公益关注" },
];

const REGIONS = [
  { name: "四川", emoji: "🐼", color: "bg-brand-teal-light/30 text-brand-teal-dark" },
  { name: "广东", emoji: "🐉", color: "bg-brand-coral-light/30 text-brand-coral-dark" },
  { name: "贵州", emoji: "⛰️", color: "bg-brand-gold-light/30 text-brand-gold-dark" },
  { name: "湖南", emoji: "🌶️", color: "bg-brand-coral-light/30 text-brand-coral-dark" },
  { name: "山东", emoji: "⛵", color: "bg-brand-teal-light/30 text-brand-teal-dark" },
  { name: "云南", emoji: "🌸", color: "bg-brand-gold-light/30 text-brand-gold-dark" },
  { name: "河南", emoji: "🏮", color: "bg-brand-coral-light/30 text-brand-coral-dark" },
  { name: "浙江", emoji: "🎋", color: "bg-brand-teal-light/30 text-brand-teal-dark" },
];

const CAT_TABS = [
  { key: "hot", label: "🔥 热门话题", icon: "🔥" },
  { key: "home", label: "🏠 家乡球队", icon: "🏆" },
  { key: "charity", label: "❤️ 公益投票", icon: "🤝" },
  { key: "sports", label: "⚽ 村超村BA", icon: "⚽" },
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

  const getFiltered = () => {
    if (activeTab === "hot") return shuffleArray(HOT_TOPICS).slice(0, 4);
    if (activeTab === "home") return HOT_TOPICS.filter(t => t.tag === "家乡" || t.tag === "民间" || t.badge === "省队PK");
    if (activeTab === "charity") return HOT_TOPICS.filter(t => t.tag === "❤️ 公益");
    if (activeTab === "sports") return HOT_TOPICS.filter(t => t.tag === "🔥 超热" || t.tag === "🔥 热门" || t.tag === "村超" || t.badge === "全民热议" || t.badge === "万人参与" || t.badge === "端午特辑");
    return HOT_TOPICS.slice(0, 4);
  };

  const filtered = getFiltered();

  return (
    <div className="bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm overflow-hidden">
      {/* ── 标题行 ── */}
      <div className="px-4 pt-3.5 pb-1.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-text-primary">⚡ 全民PK</h2>
            <span className="text-[9px] bg-brand-teal-light/30 text-brand-teal-dark px-2 py-[1px] rounded-full font-medium">热门</span>
          </div>
          <Link href="/pk-hall" className="text-[11px] text-brand-teal font-medium flex items-center gap-1">
            去PK大厅 →
          </Link>
        </div>

        {/* ── 加油标语条 ── */}
        <div className="bg-gradient-to-r from-brand-teal/10 via-brand-gold/10 to-brand-coral/10 rounded-[8px] px-3 py-2 mb-2.5 border border-[rgba(69,204,213,0.10)]">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[16px]">📣</span>
            <span className="text-[13px] font-semibold text-text-primary">
              为他们加油 ·
            </span>
            <span className="text-[13px] font-bold text-brand-coral">
              他们PK你也有奖励哦
            </span>
            <span className="text-[16px]">🎁</span>
          </div>
          <div className="text-center text-[10px] text-text-tertiary mt-0.5">
            围观分享奖-5% · 门店奖-5% · 招商奖-3%
          </div>
        </div>

        {/* 分类 Tab */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CAT_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-brand-teal text-white font-medium"
                  : "bg-gray-50 text-text-tertiary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 区域矩阵（仅 home 和 sports Tab 显示） ── */}
      {(activeTab === "home" || activeTab === "sports") && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {REGIONS.map(r => (
              <Link key={r.name} href="/pk-hall?category=sports"
                className={`flex-shrink-0 ${r.color} rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium flex items-center gap-1 active:scale-95 transition-transform`}>
                <span>{r.emoji}</span>
                <span>{r.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 话题列表 ── */}
      <div className="px-4 pb-2 flex flex-col gap-2">
        {filtered.map((topic, i) => (
          <Link key={i} href={topic.href}
            className="flex items-center gap-3 bg-gradient-to-r from-gray-50/50 to-white rounded-[10px] px-3 py-2.5 border border-[rgba(69,204,213,0.06)] active:scale-[0.98] transition-transform"
          >
            {/* 图标 */}
            <div className="w-9 h-9 rounded-[9px] bg-brand-teal-light/20 flex items-center justify-center text-[18px] flex-shrink-0">
              {topic.icon}
            </div>

            {/* 内容 */}
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

            {/* 参与数 */}
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
