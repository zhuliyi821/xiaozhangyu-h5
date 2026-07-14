"use client";

/**
 * 🏪 门店聚合页 — 展示所有门店
 *
 * 从 api_store_services.php?action=stores 获取门店列表
 * 支持分类筛选，卡片式展示
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { apiFetch } from "@/config/api";
import {
  Store, MapPin, ChevronRight,
} from "lucide-react";

// ─── 接口 ───
interface StoreItem {
  id: number;
  store_name: string;
  thumb: string;
  address: string;
  latitude: string;
  longitude: string;
}

// ─── 组件 ───

/** 生成导航链接：优先坐标(高德)，兜底地址搜索 */
function getNavUrl(lat: string, lng: string, address: string, name: string): string {
  if (lat && lng) {
    return `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&coordinate=gaode`;
  }
  if (address) {
    return `https://uri.amap.com/search?keyword=${encodeURIComponent(name + ' ' + address)}`;
  }
  return "";
}

/** 门店卡片 */
function StoreCard({ store }: { store: StoreItem }) {
  const navUrl = getNavUrl(store.latitude, store.longitude, store.address, store.store_name);
  return (
    <div className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-brand-teal/10">
      <a href={`/store/${store.id}`} className="block active:scale-[0.98] transition-transform">
        {/* 门店缩略图 */}
        <div className="h-32 bg-gradient-to-br from-brand-teal-light/30 to-brand-gold-light/30 flex items-center justify-center overflow-hidden">
          {store.thumb ? (
            <img src={store.thumb} alt={store.store_name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-brand-teal-dark/50">
              <Store className="w-10 h-10" />
              <span className="text-[10px] font-medium">{store.store_name}</span>
            </div>
          )}
        </div>
        {/* 门店信息 */}
        <div className="p-3">
          <h3 className="text-sm font-bold text-text truncate">{store.store_name}</h3>
          {store.address && (
            <div className="flex items-start gap-1 mt-1.5">
              <MapPin className="w-3 h-3 text-text-tertiary shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-tertiary leading-relaxed line-clamp-2">{store.address}</p>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-brand-teal font-medium flex items-center gap-1">
              查看门店 <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </a>
      {/* 导航到店 */}
      {navUrl && (
        <a href={navUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="block mx-3 mb-3 py-2 rounded-[8px] text-center text-[11px] font-medium bg-brand-teal text-white active:scale-[0.97] transition-transform">
          导航到店
        </a>
      )}
    </div>
  );
}

/** 骨架屏 */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-[12px] overflow-hidden shadow-sm border border-brand-teal/10 animate-pulse">
          <div className="h-32 bg-gray-100" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-50 rounded w-full" />
            <div className="h-3 bg-gray-50 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 主页面 ───

export default function StoresPage() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    apiFetch("/api/store-services?action=stores")
      .then((data: StoreItem[]) => {
        setStores(data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    apiFetch("/api/store-services?action=stores")
      .then((data: StoreItem[]) => setStores(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  if (!user && !authLoading) {
    return (
      <main className="min-h-screen bg-bg">
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-4 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">📍</div>
            <div>
              <div className="text-white text-base font-bold">门店聚合</div>
              <div className="text-white/70 text-[11px] mt-0.5">发现附近的合作门店</div>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-8 p-8 text-center bg-white rounded-[12px] border border-brand-teal/10">
          <div className="text-4xl mb-3">🏪</div>
          <p className="text-sm text-text-secondary mb-1">登录后查看合作门店</p>
          <p className="text-[11px] text-text-tertiary mb-4">到店消费即可获得游戏豆</p>
          <button onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium rounded-[8px] active:scale-95 transition-transform">
            登录 / 注册
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* 头部 */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-4 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute -top-7 -right-7 w-[120px] h-[120px] rounded-full bg-white/8" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🏪</div>
          <div className="flex-1">
            <div className="text-white text-base font-bold">合作门店</div>
            <div className="text-white/70 text-[11px] mt-0.5">发现门店 · 到店送豆</div>
          </div>
          <span className="text-white text-xs bg-white/15 px-3 py-1.5 rounded-full font-semibold">
            {stores.length} 家门店
          </span>
        </div>
      </div>

      {/* 列表区域 */}
      <div className="px-4 mt-4">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-[12px] border border-gray-100">
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-sm text-text-secondary mb-1">加载失败</p>
            <p className="text-[11px] text-text-tertiary mb-4">请检查网络连接后重试</p>
            <button onClick={handleRetry}
              className="px-5 py-2 bg-brand-teal text-white text-xs font-medium rounded-[8px] active:scale-95 transition-transform">
              重新加载
            </button>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[12px] border border-gray-100">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-sm text-text-secondary mb-1">暂无可用的门店</p>
            <p className="text-[11px] text-text-tertiary">新门店正在入驻中，敬请期待</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
