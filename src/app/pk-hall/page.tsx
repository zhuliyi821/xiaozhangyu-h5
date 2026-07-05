"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const categories = [
  { key: "sports",    name: "体育赛事", icon: "⚽", desc: "球赛·电竞·田径", color: "from-brand-coral to-brand-coral-dark", bg: "bg-[rgba(242,113,82,0.08)]" },
  { key: "social",    name: "社会热点", icon: "🌐", desc: "民生·经济·科技", color: "from-brand-teal to-brand-teal-dark", bg: "bg-[rgba(69,204,213,0.08)]" },
  { key: "event",     name: "突发事件", icon: "⚡", desc: "快讯·突发·新发现", color: "from-brand-gold to-brand-gold-dark", bg: "bg-[rgba(242,182,49,0.08)]" },
  { key: "general",   name: "一言不合", icon: "💬", desc: "日常·娱乐·随便聊", color: "from-purple-400 to-purple-600", bg: "bg-[rgba(147,51,234,0.08)]" },
];

const categoryNames: Record<string, string> = { sports: "体育赛事", social: "社会热点", event: "突发事件", general: "一言不合" };
const categoryIcons: Record<string, string> = { sports: "⚽", social: "🌐", event: "⚡", general: "💬" };

export default function PKHallPage() {
  const router = useRouter();
  const [pkTopics, setPkTopics] = useState<any[]>([]);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://h5.ws.hi.cn";

  useEffect(() => {
    fetch(`${API_BASE}/api/pk?action=list`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setPkTopics(j.data || []); })
      .catch(() => {});
  }, [API_BASE]);

  const getCount = (cat: string) => pkTopics.filter((p: any) => p.category === cat).length;
  const getPool = (cat: string) => pkTopics.filter((p: any) => p.category === cat).reduce((s: number, p: any) => s + (p.total_pool || 0), 0);

  return (
    <main className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-gold px-6 pt-8 pb-8 text-center relative overflow-hidden">
        <div className="absolute -top-8 -right-5 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.2),transparent_70%)] blur-[16px]" />
        <h1 className="text-2xl font-bold text-white relative z-10">⚔️ PK大厅</h1>
        <p className="text-sm text-white/85 mt-1.5 relative z-10">选择方向，发起PK对战</p>
      </div>

      {/* 统计总览 */}
      <div className="mx-4 -mt-4 relative z-20 bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)] flex justify-around mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-brand-teal">{pkTopics.length}</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">总话题</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="text-center">
          <div className="text-xl font-bold text-brand-gold">{getPool("sports") + getPool("social") + getPool("event") + getPool("general")}</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">总奖池 💰</div>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="text-center">
          <div className="text-xl font-bold text-brand-coral">{pkTopics.reduce((s: number, p: any) => s + (p.total_votes || 0), 0)}</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">总参与</div>
        </div>
      </div>

      {/* 4个方向入口 */}
      <div className="px-4 space-y-3">
        {categories.map((cat) => {
          const count = getCount(cat.key);
          const pool = getPool(cat.key);
          const activeCount = pkTopics.filter((p: any) => p.category === cat.key && p.status === 1).length;
          return (
            <div key={cat.key}
              onClick={() => router.push(`/pk-hall/${cat.key}`)}
              className={`rounded-[20px] p-4 shadow-sm border border-[rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform cursor-pointer ${cat.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0`}>
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold flex items-center gap-2">
                    {cat.name}
                    {activeCount > 0 && (
                      <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">{activeCount}场进行中</span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">{cat.desc}</div>
                  <div className="flex gap-3 mt-1.5 text-[10px] text-text-tertiary">
                    <span>{count}个话题</span>
                    <span>💰{pool}豆奖池</span>
                  </div>
                </div>
                <div className="text-text-tertiary text-lg">›</div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
