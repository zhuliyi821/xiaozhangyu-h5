"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import { Search, Store, ShoppingBag, RefreshCw, ArrowLeft, Filter } from "lucide-react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA" };

const PLATFORM_MAP: Record<string, { label: string; icon: string; color: string }> = {
  xiaozhangyu: { label: "平台商品", icon: "🐙", color: C.coral },
  youdianxian: { label: "置换商品", icon: "🔄", color: C.teal },
  store: { label: "附近商品", icon: "🏪", color: C.gold },
};

interface Product {
  link_id: number;
  store_id: number;
  store_name: string;
  goods_id: number;
  title: string;
  price: number;
  thumb: string;
  game_coin_ratio: number;
  platform: string;
  has_reward: number;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [stores, setStores] = useState<any[]>([]);
  const [storeFilter, setStoreFilter] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { loadProducts(); loadStores(); }, [platformFilter, storeFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/store-services?action=all_products&limit=50`;
      if (platformFilter) url += `&platform=${platformFilter}`;
      if (storeFilter > 0) url += `&store_id=${storeFilter}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j.code === 0) {
        setProducts(j.data.list || []);
        setTotal(j.data.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  const loadStores = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/store-services?action=stores`);
      const j = await r.json();
      if (j.code === 0) setStores(j.data || []);
    } catch {}
  };

  const filtered = products.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  const getBadge = (p: Product) => {
    const info = PLATFORM_MAP[p.platform] || { label: p.platform, icon: "📦", color: "#999" };
    return info;
  };

  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-12">
          <button onClick={() => window.history.back()} className="text-gray-600 text-lg">←</button>
          <h1 className="text-base font-semibold flex-1">全网商品</h1>
          <button onClick={() => setShowFilter(!showFilter)}
            className="text-[11px] flex items-center gap-1 px-2.5 py-1.5 rounded-full border"
            style={{ borderColor: C.coral, color: C.coral }}>
            <Filter className="w-3 h-3" />
            筛选
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3.5 py-2">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索商品名称..." className="text-[12px] bg-transparent outline-none flex-1 placeholder:text-gray-300" />
            {loading && <RefreshCw className="w-3 h-3 animate-spin text-gray-300" />}
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
          <button onClick={() => setPlatformFilter("")}
            className={`text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium ${
              !platformFilter ? "text-white" : "text-gray-500 bg-white border border-gray-100"
            }`} style={!platformFilter ? { backgroundColor: C.coral } : {}}>
            全部 ({total})
          </button>
          {Object.entries(PLATFORM_MAP).map(([key, info]) => (
            <button key={key} onClick={() => setPlatformFilter(key)}
              className={`text-[11px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium ${
                platformFilter === key ? "text-white" : "text-gray-500 bg-white border border-gray-100"
              }`} style={platformFilter === key ? { backgroundColor: info.color } : {}}>
              {info.icon} {info.label}
            </button>
          ))}
        </div>

        {/* Store filter dropdown */}
        {showFilter && (
          <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
            <button onClick={() => setStoreFilter(0)}
              className={`text-[10px] px-2.5 py-1 rounded-full ${!storeFilter ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>
              所有门店
            </button>
            {stores.map(s => (
              <button key={s.id} onClick={() => setStoreFilter(s.id)}
                className={`text-[10px] px-2.5 py-1 rounded-full ${storeFilter === s.id ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>
              {s.realname || s.store_name || `门店#${s.id}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="px-4 mt-3">
        <div className="text-[11px] text-gray-400 mb-2 flex items-center gap-1.5">
          <ShoppingBag className="w-3 h-3" />
          共 {filtered.length} 件商品
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-[12px] overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <div className="text-[12px] text-gray-400">暂无商品</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => {
              const badge = getBadge(p);
              return (
                <a key={p.link_id}
                  href={p.platform === "xiaozhangyu" ? `/store-services/product/${p.goods_id}` : `https://youdianxian.com/goods/${p.goods_id}`}
                  className="bg-white rounded-[12px] overflow-hidden shadow-sm active:scale-[0.97] transition-transform block">
                  {/* Thumb */}
                  <div className="h-32 bg-gray-50 flex items-center justify-center text-3xl overflow-hidden">
                    {p.thumb ? (
                      <img src={p.thumb.startsWith("http") ? p.thumb : `${API_BASE}/${p.thumb}`}
                        alt={p.title} className="w-full h-full object-cover" />
                    ) : "📦"}
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <div className="text-[13px] font-medium text-gray-800 line-clamp-1">{p.title}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-sm font-bold" style={{ color: C.coral }}>¥{p.price}</span>
                      {p.game_coin_ratio > 0 && (
                        <span className="text-[9px] text-brand-teal">🎮×{p.game_coin_ratio}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-gray-400 truncate max-w-[100px]">
                        <Store className="w-2.5 h-2.5 inline mr-0.5" />
                        {p.store_name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: badge.color }}>
                        {badge.icon} {badge.label}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
