"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getMemberOrders } from "@/lib/api";
import type { OrderItem } from "@/lib/api";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMemberOrders(user.uid)
      .then((res) => setOrders(res.list))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const statusColors: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50",
    paid: "text-green-600 bg-green-50",
    shipped: "text-blue-600 bg-blue-50",
    received: "text-teal-600 bg-teal-50",
    cancelled: "text-gray-500 bg-gray-50",
    completed: "text-green-700 bg-green-100",
  };

  const typeColors: Record<string, string> = {
    "商城": "bg-brand-teal text-white",
    "闲豆": "bg-amber-500 text-white",
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">我的订单</h1>
        </div>
      </div>

      {loading && (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-[4px] p-4 animate-pulse">
              <div className="h-4 bg-bg rounded w-1/3 mb-3" />
              <div className="h-3 bg-bg rounded w-2/3 mb-2" />
              <div className="h-3 bg-bg rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-8 p-4 bg-red-50 rounded-[4px] text-center">
          <div className="text-red-500 text-sm mb-2">加载失败</div>
          <div className="text-[11px] text-red-400">{error}</div>
          <button onClick={() => { setLoading(true); setError(""); getMemberOrders(user?.uid ?? 0).then(r => setOrders(r.list)).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
            className="mt-3 px-4 py-1.5 bg-red-500 text-white text-xs rounded-[10px]">重试</button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mx-4 mt-12 p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-text-secondary text-sm mb-1">暂无订单</div>
          <div className="text-text-tertiary text-xs">去门店逛逛，发现好商品</div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {orders.map((o) => (
            <div key={o.order_sn} className="bg-surface rounded-[4px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)]">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-[8px] font-medium ${typeColors[o.order_type] || "bg-gray-500 text-white"}`}>
                  {o.order_type}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-[8px] font-medium ${statusColors[o.status] || "text-gray-500 bg-gray-50"}`}>
                  {o.status_label}
                </span>
              </div>
              {/* Product info */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-[4px] bg-bg flex items-center justify-center text-xl shrink-0 border border-[rgba(69,204,213,0.08)]">
                  {o.order_type === "闲豆" ? "🫘" : "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{o.title}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">{o.order_sn}</div>
                  <div className="text-[11px] text-text-tertiary">{o.created_at}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand-coral">¥{o.price}</div>
                  <div className="text-[10px] text-text-tertiary">×{o.quantity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
