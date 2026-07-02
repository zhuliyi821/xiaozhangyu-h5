"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getFavorites, removeFavorite } from "@/lib/api";
import type { FavoriteItem } from "@/lib/api";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    if (!user) { setLoading(false); return; }
    getFavorites(user.uid)
      .then(r => setItems(r.list))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleRemove = async (id: number) => {
    if (!user) return;
    const r = await removeFavorite(user.uid, id);
    if (r.code === 0) setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <main className="min-h-screen bg-bg pb-24">
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">我的收藏</h1>
        </div>
      </div>

      {loading && (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-[20px] p-4 animate-pulse">
              <div className="h-4 bg-bg rounded w-1/3 mb-3" /><div className="h-3 bg-bg rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-8 p-4 bg-red-50 rounded-[20px] text-center">
          <div className="text-red-500 text-sm mb-2">加载失败</div>
          <button onClick={() => { setError(""); setLoading(true); if (user) getFavorites(user.uid).then(r => setItems(r.list)).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
            className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-[10px]">重试</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="mx-4 mt-12 p-8 text-center">
          <div className="text-4xl mb-3">❤️</div>
          <div className="text-text-secondary text-sm mb-1">暂无收藏</div>
          <div className="text-text-tertiary text-xs">去门店逛逛，收藏心仪商品</div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-surface rounded-[20px] p-4 shadow-sm border border-[rgba(69,204,213,0.06)] flex items-center gap-3">
              <div className="w-14 h-14 rounded-[12px] bg-gradient-to-br from-brand-gold-light to-brand-coral-light flex items-center justify-center text-xl shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{item.product_name}</div>
                <div className="text-sm font-bold text-brand-coral mt-0.5">¥{item.selling_price}</div>
                {item.local_stock > 0 && item.local_stock <= 5 && (
                  <div className="text-[10px] text-red-500">仅剩 {item.local_stock} 件</div>
                )}
              </div>
              <button onClick={() => handleRemove(item.id)}
                className="text-[11px] text-red-400 bg-red-50 px-3 py-1.5 rounded-[10px] hover:bg-red-100 transition-colors">
                取消收藏
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
