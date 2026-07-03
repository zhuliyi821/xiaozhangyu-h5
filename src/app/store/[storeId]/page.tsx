"use client";

import { useState, useEffect, use } from "react";
import { MapPin, ShoppingCart, Phone, ChevronRight, Star, Clock } from "lucide-react";
import { API_BASE } from "@/config/api";
import { apiFetch } from "@/config/api";

/** 门店配置 */
interface StoreConfig {
  id: number;
  name: string;
  logo: string;
  cover: string;
  brand_primary: string;
  brand_secondary: string;
  address: string;
  phone: string;
  hours: string;
  intro: string;
  rating: number;
}

/** 默认门店配置（回退） */
function defaultStore(id: string): StoreConfig {
  return {
    id: parseInt(id),
    name: "门店",
    logo: "",
    cover: "",
    brand_primary: "#6BA3A3",
    brand_secondary: "#C9A96E",
    address: "",
    phone: "",
    hours: "08:00-22:00",
    intro: "",
    rating: 4.5,
  };
}

export default function StoreH5Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const [store, setStore] = useState<StoreConfig>(defaultStore(storeId));
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadStore() {
      try {
        // 1. 获取门店信息
        const storeRes = await fetch(
          `${API_BASE}/api/store-services?action=store_detail&store_id=${storeId}`
        );
        const storeJson = await storeRes.json();
        if (storeJson.code === 0 && storeJson.data) {
          const s = storeJson.data;
          setStore((prev) => ({
            ...prev,
            name: s.store_name || prev.name,
            logo: s.thumb || prev.logo,
            address: s.address || prev.address,
            intro: s.store_introduce || prev.intro,
            brand_primary: s.brand_color || prev.brand_primary,
            brand_secondary: s.brand_color2 || prev.brand_secondary,
          }));
        }

        // 2. 获取门店商品
        const prodRes = await fetch(
          `${API_BASE}/api/store-services?action=products_by_store&store_id=${storeId}`
        );
        const prodJson = await prodRes.json();
        if (prodJson.code === 0) {
          setProducts(prodJson.data || []);
        }
      } catch (e) {
        console.error("Failed to load store:", e);
      }
      setLoading(false);
    }
    loadStore();
  }, [storeId, API_BASE]);

  const primary = store.brand_primary || "#6BA3A3";
  const secondary = store.brand_secondary || "#C9A96E";

  return (
    <main style={{ "--brand-primary": primary, "--brand-secondary": secondary } as React.CSSProperties}
      className="min-h-screen pb-24">

      {/* 门店封面 */}
      <div className="relative h-52 bg-gray-100 overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}22, ${secondary}22)` }}>
        {store.cover ? (
          <img src={store.cover} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
            <MapPin className="w-16 h-16" style={{ color: primary }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white">{store.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-white/80 text-xs">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span>{store.rating}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <Clock className="w-3 h-3" />
            <span>{store.hours}</span>
          </div>
        </div>
      </div>

      {/* 门店信息卡片 */}
      <div className="mx-4 -mt-6 relative z-10">
        <div className="bg-white rounded-sm shadow-sm p-4">
          {store.address && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: primary }} />
              <span className="truncate">{store.address}</span>
            </div>
          )}
          {store.phone && (
            <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: primary }} />
              <span>{store.phone}</span>
              <ChevronRight className="w-3 h-3 ml-auto text-gray-300" />
            </a>
          )}
          {store.intro && (
            <p className="text-[11px] text-gray-500 leading-relaxed mt-2 border-t border-gray-100 pt-2">
              {store.intro}
            </p>
          )}
        </div>
      </div>

      {/* 门店商品 */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-sm" style={{ background: `linear-gradient(to bottom, ${primary}, ${secondary})` }} />
            本店商品
          </h2>
          <span className="text-[10px]" style={{ color: primary }}>共 {products.length} 件</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-sm overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">暂无商品</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-sm overflow-hidden shadow-sm active:scale-[0.97] transition-transform cursor-pointer">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.thumb ? (
                    <img src={p.thumb.startsWith("http") ? p.thumb : `${API_BASE}/${p.thumb}`} alt={p.title || p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl opacity-30">📦</span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="text-[12px] font-medium truncate">{p.title || p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold" style={{ color: primary === "#6BA3A3" ? "#E85D3A" : primary }}>
                      ¥{p.selling_price || p.price}
                    </span>
                    <button className="text-[10px] text-white px-2.5 py-1 rounded-full" style={{ background: primary }}>
                      立即购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[20px] border-t border-gray-100 h-[64px] flex items-center justify-around z-50">
        <a href={`/store/${storeId}`} className="flex flex-col items-center gap-0.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${primary}20` }}>
            <div className="w-3 h-3 rounded-sm" style={{ background: primary }} />
          </div>
          <span className="text-[10px]" style={{ color: primary }}>首页</span>
        </a>
        <a href={`/store/${storeId}/products`} className="flex flex-col items-center gap-0.5">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-[10px] text-gray-500">商品</span>
        </a>
        <a href={`/store/${storeId}/about`} className="flex flex-col items-center gap-0.5">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-[10px] text-gray-500">门店</span>
        </a>
        <a href={`tel:${store.phone}`} className="flex flex-col items-center gap-0.5">
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-[10px] text-gray-500">联系</span>
        </a>
      </nav>
    </main>
  );
}
