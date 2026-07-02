"use client";

import { useState, useEffect } from "react";
import {
  getDecoratePage, getStoreCategories, getStoreList, getStoreProductsList,
  DecorateComponent, StoreCategory, StoreInfo, StoreProduct
} from "@/lib/api";
import { MapPin, ChevronRight, Store } from "lucide-react";

export default function StoreServicesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decorate, setDecorate] = useState<DecorateComponent[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [activeCat, setActiveCat] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [d, c, p] = await Promise.all([
        getDecoratePage(),
        getStoreCategories(),
        getStoreProductsList(20),
      ]);
      setDecorate(d);
      setCategories(c);
      setProducts(p);

      // 默认加载第一个分类的门店
      if (c.length > 0) {
        const s = await getStoreList(c[0].id);
        setStores(s);
        setActiveCat(c[0].id);
      }
    } catch (e: any) {
      setError(e.message || "加载失败");
    }
    setLoading(false);
  };

  const switchCategory = async (catId: number) => {
    setActiveCat(catId);
    setLoading(true);
    try {
      const s = await getStoreList(catId);
      setStores(s);
    } catch (e: any) {
      setStores([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* 顶部定位栏 */}
      <div className="sticky top-0 z-30 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
          <MapPin className="w-4 h-4 text-brand-coral shrink-0" />
          <span className="text-xs font-medium text-text-tertiary flex-1 truncate">附近商家商品</span>
          <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            定位中
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 rounded-xl text-xs text-red-500 text-center">
          {error}
          <button onClick={load} className="ml-2 underline">重试</button>
        </div>
      )}

      {!error && (
        <>
          {/* 一、附近商品 */}
          <section className="mt-4 px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span className="w-1 h-4 rounded-sm bg-gradient-to-b from-brand-gold to-brand-coral" />
                附近商品
              </h2>
              <span className="text-[10px] text-brand-teal-dark">更多 →</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {products.slice(0, 6).map((p) => (
                <a key={p.id} href={`/store-services/product/${p.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform block">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-3xl">
                    {p.thumb ? (
                      <img src={p.thumb.startsWith("http") ? p.thumb : `https://surplus.hi.cn${p.thumb}`} alt={p.title} className="w-full h-full object-cover" />
                    ) : "📦"}
                  </div>
                  <div className="p-2.5">
                    <div className="text-[12px] font-medium truncate">{p.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-brand-coral">¥{p.price}</span>
                      <button className="text-[10px] bg-brand-coral text-white px-2.5 py-1 rounded-full">立即购买</button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* 二、精选商品 */}
          <section className="mt-5 px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span className="w-1 h-4 rounded-sm bg-gradient-to-b from-brand-teal to-brand-gold" />
                精选商品
              </h2>
              <span className="text-[10px] text-brand-teal-dark">更多 →</span>
            </div>
            <div className="space-y-2.5">
              {products.slice(6, 16).map((p) => (
                <a key={p.id} href={`/store-services/product/${p.id}`} className="bg-white rounded-xl p-3 flex gap-3 shadow-sm active:scale-[0.98] transition-transform block">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-2xl overflow-hidden">
                    {p.thumb ? (
                      <img src={p.thumb.startsWith("http") ? p.thumb : `https://surplus.hi.cn${p.thumb}`} alt={p.title} className="w-full h-full object-cover" />
                    ) : "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{p.title}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-brand-coral font-bold">¥{p.price}</span>
                      <span className="text-[10px] text-text-tertiary line-through">¥{String(Number(p.price) * 1.2).slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] bg-red-50 text-brand-coral px-2 py-0.5 rounded">店内优惠</span>
                      <button className="text-[10px] bg-brand-teal text-white px-2.5 py-1 rounded-full">立即购买</button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* 三、门店（选择分类才显示列表） */}
          <section className="mt-5 px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <span className="w-1 h-4 rounded-sm bg-gradient-to-b from-brand-coral to-brand-gold" />
                门店
              </h2>
              <span className="text-[10px] text-text-tertiary">选择分类查看门店</span>
            </div>

            {/* 分类 tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => switchCategory(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeCat === cat.id
                      ? "bg-brand-teal text-white shadow-sm"
                      : "bg-white text-text-secondary border border-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* 门店列表 */}
            <div className="mt-3 space-y-2.5">
              {loading && stores.length === 0 && (
                <div className="text-center py-8 text-xs text-text-tertiary">加载中...</div>
              )}
              {!loading && stores.length === 0 && (
                <div className="text-center py-8 text-xs text-text-tertiary">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  该分类暂无门店
                </div>
              )}
              {stores.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white flex items-center justify-center text-lg shrink-0">
                    🏪
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{s.store_name}</div>
                    {s.address && <div className="text-[10px] text-text-tertiary mt-0.5 truncate">{s.address}</div>}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-tertiary">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> 查看位置</span>
                      <span className="text-brand-teal">营业中</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
