"use client";

/**
 * 🏪 全网门店聚合页 — 发现所有合作门店
 *
 * 统一入口，展示所有门店。支持搜索、分类筛选。
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { apiFetch } from "@/config/api";
import { Search, Store, MapPin, ChevronRight } from "lucide-react";

interface StoreItem {
  id: number;
  store_name: string;
  thumb: string;
  address: string;
  latitude: string;
  longitude: string;
  theme_color?: string;
}

function StoreCard({ store }: { store: StoreItem }) {
  const color = store.theme_color || "#45CCD5";
  const navUrl = store.latitude && store.longitude
    ? `https://uri.amap.com/navigation?to=${store.longitude},${store.latitude},${encodeURIComponent(store.store_name)}&mode=car&coordinate=gaode`
    : store.address
    ? `https://uri.amap.com/search?keyword=${encodeURIComponent(store.store_name + ' ' + store.address)}`
    : "";

  return (
    <div className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-[rgba(69,204,213,0.08)]">
      <a href={`/store/${store.id}`} className="flex active:scale-[0.98] transition-transform">
        {/* 左侧缩略图 - 品牌色渐变背景 */}
        <div className="w-[100px] shrink-0 flex items-center justify-center overflow-hidden" style={{background:`linear-gradient(135deg,${color}22,${color}44)`}}>
          {store.thumb ? (
            <img src={store.thumb} alt={store.store_name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1" style={{color:`${color}88`}}>
              <Store className="w-8 h-8" />
              <span className="text-[8px] font-medium px-1 text-center leading-tight">{store.store_name}</span>
            </div>
          )}
        </div>
        {/* 右侧信息 */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-sm font-bold text-text truncate flex items-center gap-1.5">
              {store.store_name}
              <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: color}} />
            </h3>
            {store.address && (
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="w-3 h-3 text-text-tertiary shrink-0 mt-[2px]" />
                <p className="text-[10px] text-text-tertiary leading-relaxed line-clamp-2">{store.address}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] font-medium flex items-center gap-0.5" style={{color}}>
              查看详情 <ChevronRight className="w-3 h-3" />
            </span>
            {navUrl && (
              <span onClick={e => { e.preventDefault(); window.open(navUrl, '_blank'); }}
                className="text-[9px] text-white px-2 py-1 rounded-full" style={{background: color}}>
                导航
              </span>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 mt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-[rgba(69,204,213,0.08)] animate-pulse flex">
          <div className="w-[100px] h-[100px] bg-gray-100 shrink-0" />
          <div className="flex-1 p-3 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-50 rounded w-full" />
            <div className="h-3 bg-gray-50 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StorePage() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiFetch("/api/store-services?action=stores")
      .then((data: StoreItem[]) => setStores(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? stores.filter(s => s.store_name.includes(search) || s.address?.includes(search))
    : stores;

  return (
    <main className="min-h-screen bg-bg pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-4 pt-6 pb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🏪</div>
          <div>
            <div className="text-white text-base font-bold">合作门店</div>
            <div className="text-white/70 text-[11px] mt-0.5">{stores.length} 家门店 · 持续入驻中</div>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索门店名称或地址..."
            className="w-full pl-9 pr-4 py-2.5 rounded-[10px] bg-white/15 text-white text-[13px] placeholder:text-white/40 outline-none focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-3 relative z-10">
        {!user && !authLoading ? (
          <div className="p-8 text-center bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm mt-1">
            <div className="text-4xl mb-3">🏪</div>
            <p className="text-sm text-text-secondary mb-1">登录后查看合作门店</p>
            <p className="text-[11px] text-text-tertiary mb-4">发现附近门店 · 消费送游戏豆</p>
            <button onClick={() => setShowLogin(true)}
              className="px-5 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium active:scale-95 transition-transform">
              登录查看
            </button>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm mt-1">
            <div className="text-4xl mb-3">😅</div>
            <p className="text-sm text-text-secondary mb-1">加载失败</p>
            <p className="text-[11px] text-text-tertiary mb-4">请检查网络后重试</p>
            <button onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium active:scale-95 transition-transform">
              重新加载
            </button>
          </div>
        ) : (
          <>
            {filtered.length === 0 && !loading ? (
              <div className="p-8 text-center bg-white rounded-[12px] border border-[rgba(69,204,213,0.08)] shadow-sm mt-1">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm text-text-secondary">未找到匹配的门店</p>
                <p className="text-[11px] text-text-tertiary mt-1">试试其他关键词</p>
              </div>
            ) : loading ? (
              <SkeletonGrid />
            ) : (
              <>
                <div className="text-[11px] text-text-tertiary mt-4 mb-2 px-0.5">
                  {search ? `找到 ${filtered.length} 家门店` : `共 ${stores.length} 家合作门店`}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {filtered.map(store => <StoreCard key={store.id} store={store} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
