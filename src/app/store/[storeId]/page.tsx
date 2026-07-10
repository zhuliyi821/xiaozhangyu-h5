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
  const [mediaPosts, setMediaPosts] = useState<any[]>([]);
  const [detailPost, setDetailPost] = useState<any>(null);
  const [decoration, setDecoration] = useState<{ theme_color: string; modules: any[]; logo: string } | null>(null);
  const [buyProduct, setBuyProduct] = useState<any>(null);
  const [buySuccess, setBuySuccess] = useState<{ product: any; earned: number } | null>(null);

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

        // 3. 获取门店动态（已发布的媒体内容）
        const mediaRes = await fetch(
          `${API_BASE}/api/store-media?action=contents&store_id=${storeId}&status=published&limit=10`
        );
        const mediaJson = await mediaRes.json();
        if (mediaJson.code === 0) {
          setMediaPosts(mediaJson.data.list || []);
        }

        // 3. 获取装修配置（覆盖品牌色）
        const decoRes = await fetch(
          `${API_BASE}/plugins/api-store-decoration.php?api=decoration&store_id=${storeId}`
        );
        const decoJson = await decoRes.json();
        if (decoJson.code === 0 && decoJson.data) {
          const d = decoJson.data;
          setDecoration({ theme_color: d.theme_color, modules: d.modules || [], logo: d.logo || "" });
          if (d.theme_color) {
            setStore(prev => ({ ...prev, brand_primary: d.theme_color }));
          }
        }
      } catch (e) {
        console.error("Failed to load store:", e);
      }
      setLoading(false);
    }
    loadStore();
  }, [storeId, API_BASE]);

  const primary = store.brand_primary || "#6BA3A3";

  // 加载状态
  if (loading) {
    return (
      <main className="min-h-screen bg-white pb-24">
        <div className="h-52 bg-gray-100 animate-pulse" />
        <div className="mx-4 -mt-6 relative z-10">
          <div className="bg-white rounded-[12px] shadow-sm p-4 animate-pulse space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-50 rounded w-1/2" />
          </div>
        </div>
        <div className="px-4 mt-4">
          <div className="grid grid-cols-2 gap-2.5 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-[12px] overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100" />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24" style={{'--brand-primary':primary} as React.CSSProperties}>

      {/* 门店封面 */}
      <div className="relative h-48 bg-gray-100 overflow-hidden" style={{background:`linear-gradient(135deg,${primary}22,#C9A96E22)`}}>
        {store.cover ? (
          <img src={store.cover} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
            <span className="text-6xl">🏪</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white">{store.name}</h1>
          {store.address && <p className="text-[11px] text-white/70 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{store.address}</p>}
        </div>
      </div>

      {/* 门店信息条 */}
      <div className="mx-4 -mt-5 relative z-10">
        <div className="bg-white rounded-[12px] shadow-sm px-4 py-3 flex items-center justify-between">
          <a href={`tel:${store.phone}`} className="flex items-center gap-2 text-[11px] text-gray-500">
            <Phone className="w-3.5 h-3.5" style={{color:primary}} />
            {store.phone || "暂无电话"}
          </a>
          <a href={store.address ? `https://uri.amap.com/search?keyword=${encodeURIComponent(store.name+' '+store.address)}` : '#'}
            target="_blank" rel="noopener noreferrer"
            className="text-[10px] px-2.5 py-1 rounded-full text-white" style={{background:primary}}>
            导航
          </a>
        </div>
      </div>

      {/* 装修模块 */}
      {decoration && decoration.modules.filter(m => m.enabled !== false).length > 0 && (
        <div className="px-4 mt-4 space-y-3">
          {decoration.modules.filter(m => m.enabled !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0)).map(mod => {
            if (mod.type === 'banner' && mod.config?.images?.length > 0) {
              return (
                <div key={mod.id} className="rounded-[12px] overflow-hidden shadow-sm">
                  <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none">
                    {mod.config.images.map((img:string,i:number) => (
                      <div key={i} className="snap-start shrink-0 w-full h-36 bg-gray-50">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (mod.type === 'coupon' && mod.config?.coupons?.length > 0) {
              return (
                <div key={mod.id} className="bg-white rounded-[12px] p-3.5 shadow-sm border border-gray-50">
                  <div className="text-[11px] font-semibold mb-2.5">{mod.config.title || "领优惠券"}</div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none">
                    {mod.config.coupons.map((c:any,i:number) => (
                      <div key={i} className="shrink-0 w-28 p-2.5 rounded-[10px] text-center" style={{background:`${primary}10`}}>
                        <div className="text-base font-bold" style={{color:primary}}>{c.discount || c.amount}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{c.label || "优惠券"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            if (mod.type === 'notice' && mod.config?.text) {
              return (
                <div key={mod.id} className="bg-white rounded-[12px] p-3 shadow-sm border border-gray-50 flex items-center gap-2.5">
                  <span className="text-base shrink-0">📢</span>
                  <div className="w-full overflow-hidden">
                    <p className="text-[11px] text-gray-600 whitespace-nowrap animate-marquee">{mod.config.text}</p>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* 门店商品 */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">本店商品</h2>
          <span className="text-[10px] text-gray-400">{products.length}件</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-xs">暂无商品上架</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {products.map((p:any) => (
              <div key={p.id} className="bg-white rounded-[12px] overflow-hidden shadow-sm active:scale-[0.97] transition-transform">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {p.thumb ? (
                    <img src={p.thumb.startsWith("http") ? p.thumb : `${API_BASE}/${p.thumb}`} alt={p.title||p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl opacity-20">📦</span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="text-[12px] font-medium truncate">{p.title||p.name}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm font-bold" style={{color:primary}}>¥{p.selling_price||p.price}</span>
                    <button onClick={() => setBuyProduct(p)} className="text-[10px] text-white px-2.5 py-1 rounded-full active:scale-90 transition-transform" style={{background:primary}}>
                      购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 门店动态 — 已发布的自媒体内容 */}
      {mediaPosts.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-sm" style={{background:`linear-gradient(to bottom, ${primary}, ${primary}88)`}} />
              门店动态
            </h2>
            <span className="text-[10px] text-text-tertiary">近期 {mediaPosts.length} 条</span>
          </div>
          <div className="space-y-2">
            {mediaPosts.map((post: any) => (
              <div key={post.id} onClick={() => setDetailPost(post)}
                className="bg-white rounded-[10px] p-3 shadow-sm border border-gray-50 flex items-start gap-3 active:scale-[0.98] transition-transform cursor-pointer">
                <span className="text-lg shrink-0 mt-0.5">
                  {post.platform === "wechat" ? "📰" : post.platform === "xiaohongshu" ? "📕" : post.platform === "douyin" ? "🎬" : "🎙️"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold truncate">{post.title}</div>
                  {post.content && (
                    <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                      {(() => {
                        try { const p = JSON.parse(post.content); return p.topics?.join(", ") || p.text || ""; }
                        catch { return post.content.slice(0, 100); }
                      })()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400">
                      {post.platform === "wechat" ? "公众号" : post.platform === "xiaohongshu" ? "小红书" : post.platform === "douyin" ? "抖音" : "数字人"}
                    </span>
                    <span className="text-[9px] text-gray-300 ml-auto flex items-center gap-0.5">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString("zh-CN") : ""}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 内容详情弹窗 */}
      {detailPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailPost(null)}>
          <div className="bg-white rounded-[16px] w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">
                  {detailPost.platform === "wechat" ? "📰" : detailPost.platform === "xiaohongshu" ? "📕" : detailPost.platform === "douyin" ? "🎬" : "🎙️"}
                </span>
                <div>
                  <div className="text-[13px] font-bold">{detailPost.title}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {detailPost.platform === "wechat" ? "公众号" : detailPost.platform === "xiaohongshu" ? "小红书" : detailPost.platform === "douyin" ? "抖音" : "数字人"}
                    {detailPost.published_at && ` · ${new Date(detailPost.published_at).toLocaleDateString("zh-CN")}`}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                {(() => {
                  try {
                    const parsed = JSON.parse(detailPost.content);
                    if (parsed.topics) return <div className="flex flex-wrap gap-1.5 mb-3">{parsed.topics.map((t: string, i: number) => <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">{t}</span>)}</div>;
                    if (parsed.text) return <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{parsed.text}</p>;
                    if (parsed.content) return <p className="text-[11px] text-gray-600 leading-relaxed">{parsed.content}</p>;
                    return <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{detailPost.content.replace(/\\n/g, "\n")}</p>;
                  } catch {
                    return <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{detailPost.content}</p>;
                  }
                })()}
              </div>
            </div>
            <div className="border-t border-gray-100 p-4">
              <button onClick={() => setDetailPost(null)}
                className="w-full py-2.5 rounded-[10px] text-xs font-medium text-white active:scale-[0.97] transition-transform"
                style={{background: primary}}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[12px] border-t border-gray-100 h-14 flex items-center justify-around z-50">
        <div onClick={() => window.location.href=`/store/${storeId}`} className="flex flex-col items-center gap-0.5 cursor-pointer active:scale-90 transition-transform">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{background:`${primary}20`}}>
            <div className="w-2.5 h-2.5 rounded-sm" style={{background:primary}} />
          </div>
          <span className="text-[9px]" style={{color:primary}}>首页</span>
        </div>
        <div onClick={() => window.location.href='/store'} className="flex flex-col items-center gap-0.5 cursor-pointer active:scale-90 transition-transform">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-[9px] text-gray-500">门店</span>
        </div>
        <a href={`tel:${store.phone}`} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-[9px] text-gray-500">联系</span>
        </a>
        <div onClick={() => window.history.back()} className="flex flex-col items-center gap-0.5 cursor-pointer active:scale-90 transition-transform">
          <span className="text-lg leading-none text-gray-400">←</span>
          <span className="text-[9px] text-gray-500">返回</span>
        </div>
      </nav>

      {/* 购买浮层 */}
      {buyProduct && !buySuccess && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setBuyProduct(null)}>
          <div className="bg-white rounded-t-[20px] sm:rounded-[20px] w-full max-w-[400px] p-5 mx-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-[12px] bg-gray-50 flex items-center justify-center overflow-hidden">
                {buyProduct.thumb ? (
                  <img src={buyProduct.thumb.startsWith("http") ? buyProduct.thumb : `${API_BASE}/${buyProduct.thumb}`} alt={buyProduct.title || buyProduct.name} className="w-full h-full object-cover" />
                ) : <span className="text-2xl">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{buyProduct.title || buyProduct.name}</div>
                <div className="text-lg font-bold mt-1" style={{color: primary}}>¥{buyProduct.selling_price || buyProduct.price}</div>
              </div>
            </div>

            {/* 支付方式 */}
            <div className="mt-4 space-y-2">
              <div className="text-[11px] font-medium text-gray-500 mb-2">选择支付方式</div>
              {[
                { id: "balance", label: "余额支付", desc: `可用余额 ¥--`, icon: "💰" },
                { id: "wechat", label: "微信支付", desc: "推荐使用微信支付", icon: "💳" },
              ].map(pm => (
                <button key={pm.id} onClick={() => {
                  const earned = Math.floor((buyProduct.selling_price || buyProduct.price) * 100);
                  setBuySuccess({ product: buyProduct, earned });
                  setBuyProduct(null);
                }}
                  className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-gray-100 active:scale-[0.98] transition-transform hover:border-gray-200">
                  <span className="text-xl">{pm.icon}</span>
                  <div className="text-left flex-1">
                    <div className="text-xs font-semibold">{pm.label}</div>
                    <div className="text-[10px] text-gray-400">{pm.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>

            <button onClick={() => setBuyProduct(null)}
              className="w-full mt-4 py-2.5 rounded-[10px] text-xs font-medium bg-gray-50 text-gray-500 active:scale-[0.98] transition-transform">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 购买成功动画 */}
      {buySuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setBuySuccess(null)}>
          <div className="bg-white rounded-[20px] p-6 text-center mx-4 max-w-[300px] shadow-2xl"
            style={{animation: 'celebrate-pop 0.6s ease-out'}}
            onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-base font-bold mb-1">购买成功！</div>
            <div className="text-[12px] text-gray-500 mb-3">{buySuccess.product.title || buySuccess.product.name}</div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[12px] p-3 mb-4">
              <div className="text-[10px] text-gray-500">获得游戏豆</div>
              <div className="text-2xl font-bold" style={{color: primary}}>+{buySuccess.earned.toLocaleString()} 🎮</div>
            </div>
            <button onClick={() => setBuySuccess(null)}
              className="w-full py-2.5 rounded-[10px] text-xs font-bold text-white" style={{background: primary}}>
              继续逛逛
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
