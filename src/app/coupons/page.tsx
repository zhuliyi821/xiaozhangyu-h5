"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCoupons } from "@/lib/api";
import type { CouponItem } from "@/lib/api";

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  full_reduce: { label: "满减券", icon: "💰", color: "from-rose-400 to-pink-500" },
  discount: { label: "折扣券", icon: "🏷️", color: "from-violet-400 to-purple-500" },
  exchange: { label: "兑换券", icon: "🎁", color: "from-amber-400 to-orange-500" },
};

export default function CouponsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CouponItem[]>([]);
  const [available, setAvailable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getCoupons(user.uid)
      .then(r => { setItems(r.list); setAvailable(r.available); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const isExpired = (end: string) => end && new Date(end) < new Date();

  return (
    <main className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-brand-teal/10">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">卡券包</h1>
        </div>
      </div>

      {/* 可用数量 */}
      {!loading && !error && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[8px] p-5 text-white">
          <div className="text-[11px] opacity-80">可用卡券</div>
          <div className="text-3xl font-bold mt-1">{available}</div>
          <div className="text-[11px] opacity-70 mt-1">共 {items.length} 张 · 点击使用</div>
        </div>
      )}

      {loading && (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface rounded-[8px] animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-8 p-4 bg-red-50 rounded-[8px] text-center">
          <div className="text-red-500 text-sm mb-2">加载失败</div>
          <button onClick={() => { setError(""); setLoading(true); if (user) getCoupons(user.uid).then(r => { setItems(r.list); setAvailable(r.available); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
            className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-[10px]">重试</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mx-4 mt-12 p-8 text-center">
          <div className="text-4xl mb-3">🎟️</div>
          <div className="text-text-secondary text-sm mb-1">暂无卡券</div>
          <div className="text-text-tertiary text-xs">去门店消费获取优惠券</div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {items.map(c => {
            const cfg = typeConfig[c.coupon_type] || { label: "优惠券", icon: "🎫", color: "from-gray-400 to-gray-500" };
            const expired = c.expired || isExpired(c.end_at);
            return (
              <div key={c.id}
                className={`bg-surface rounded-[8px] overflow-hidden shadow-sm border ${c.used ? "opacity-40" : expired ? "opacity-50" : "border-brand-teal/10"}`}>

                {/* 券头 */}
                <div className={`bg-gradient-to-r ${cfg.color} p-4 text-white flex items-center gap-3`}>
                  <span className="text-2xl">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] opacity-80">{cfg.label}</div>
                    <div className="text-sm font-bold">{c.name}</div>
                  </div>
                  {c.used ? (
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-[8px]">已使用</span>
                  ) : expired ? (
                    <span className="text-[10px] bg-white/20 px-2 py-1 rounded-[8px]">已过期</span>
                  ) : (
                    <span className="text-[10px] bg-white/30 px-2 py-1 rounded-[8px]">可用</span>
                  )}
                </div>

                {/* 券内容 */}
                <div className="p-3 flex items-center justify-between text-xs">
                  <div className="text-text-secondary">
                    {c.coupon_type === "full_reduce" && `满 ¥${c.min_amount} 减 ¥${c.value}`}
                    {c.coupon_type === "discount" && `全场 ${(100 - c.value)} 折`}
                    {c.coupon_type === "exchange" && "免费兑换"}
                    {c.description && <span className="block text-[10px] text-text-tertiary mt-0.5">{c.description}</span>}
                  </div>
                  <div className="text-[10px] text-text-tertiary text-right">
                    {c.end_at ? `至 ${new Date(c.end_at).toLocaleDateString("zh-CN")}` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
