"use client";

/**
 * 🏪 门店模板
 *
 * 从供应链 API 获取真实商品数据，点击商品跳转芸众收银台购买
 * "消费"Tab 跳转到 /store-services 门店服务页
 */

import { useState, useEffect } from "react";
import { getStoreProducts, getSwapProducts } from "@/lib/api";
import type { StoreProduct as ApiProduct, SwapProduct } from "@/lib/api";
import { ImageOff } from "lucide-react";
import ShareButton from "@/components/ui/share-button";
import SharePanel from "@/components/ui/share-panel";
import SwapPurchaseModal from "@/components/ui/swap-purchase-modal";
import { getShareOrigin } from "@/lib/share-to-wechat";

export interface StoreProduct {
  emoji: string;
  name: string;
  price: string;
  reward: string;
  bgGradient?: string;
}

export interface StoreInfo {
  emoji: string;
  name: string;
  distance: string;
  hours: string;
  phone: string;
  category: string;
  status: "open" | "closed" | "pending";
  address?: string;
}

export interface StoreConfig {
  /** 轮播活动列表 */
  carousels: Array<{ icon: string; title: string; subtitle: string; desc: string }>;
  /** 门店分类 */
  categories: Array<{ key: string; icon: string; name: string }>;
  /** 商品列表 */
  products: StoreProduct[];
  /** 附近门店列表 */
  stores: StoreInfo[];
}

export interface StoreTemplateProps {
  config?: Partial<StoreConfig>;
  storeId?: number;
}

const defaultConfig: StoreConfig = {
  carousels: [
    { icon: "🎮", title: "购物消费 送游戏豆", subtitle: "限时活动", desc: "最高 1元=100 游戏豆" },
    { icon: "🔥", title: "到店消费 双倍积分", subtitle: "每日福利", desc: "全场通用·每日上限500积分" },
    { icon: "🤖", title: "AI预测·中奖即送", subtitle: "AI推荐", desc: "用AI选号买彩票·额外送50游戏豆" },
  ],
  categories: [
    { key: "all", icon: "🏪", name: "全部门店" },
    { key: "food", icon: "🍜", name: "美食餐饮" },
    { key: "tea", icon: "☕", name: "茶饮咖啡" },
    { key: "fun", icon: "🎮", name: "娱乐休闲" },
    { key: "life", icon: "🛠️", name: "生活服务" },
    { key: "shop", icon: "🏪", name: "零售便利" },
  ],
  products: [
    { emoji: "🎫", name: "大乐透套餐 A", price: "18.00", reward: "赠100" },
    { emoji: "🎫", name: "双色球精选套餐", price: "12.00", reward: "赠50" },
    { emoji: "🎟️", name: "排列3 套餐", price: "6.00", reward: "赠30" },
    { emoji: "☕", name: "门店饮品兑换券", price: "8.00", reward: "赠40" },
  ],
  stores: [
    { emoji: "🍜", name: "粤味轩·茶餐厅", distance: "300m", hours: "08:00-22:00", phone: "0755-86268888", category: "food", status: "open", address: "科技园南区A栋" },
    { emoji: "☕", name: "奈雪の茶（科技园店）", distance: "600m", hours: "09:00-22:30", phone: "0755-86538888", category: "tea", status: "open", address: "高新南一道8号" },
    { emoji: "🎮", name: "电竞蜂·网咖", distance: "1.2km", hours: "10:00-02:00", phone: "0755-86668888", category: "fun", status: "open", address: "万象天地B1" },
    { emoji: "🛠️", name: "顺丰速运·科技园站", distance: "800m", hours: "08:00-20:00", phone: "0755-86238888", category: "life", status: "open", address: "科技园中区B栋" },
  ],
};

const carouselBg = [
  "from-brand-gold to-brand-coral",
  "from-brand-teal to-brand-teal-dark",
  "from-purple-400 to-brand-coral",
];

/** 商品 emoji 映射（基于名称/品类） */
function productEmoji(name: string): string {
  if (/米|粮|五常/i.test(name)) return "🌾";
  if (/木耳|菌菇/i.test(name)) return "🍄";
  if (/蜂蜜|蜜/i.test(name)) return "🍯";
  if (/牛肉|面|餐/i.test(name)) return "🍜";
  if (/饮料|饮|茶|咖啡/i.test(name)) return "☕";
  if (/彩票|券|套餐/i.test(name)) return "🎫";
  return "📦";
}

/** 商品渐变背景 */
const productBg = [
  "linear-gradient(135deg,var(--color-brand-coral-light),var(--color-brand-gold-light))",
  "linear-gradient(135deg,var(--color-brand-teal-light),var(--color-brand-gold-light))",
  "linear-gradient(135deg,#fef3c7,#fde68a)",
  "linear-gradient(135deg,#dbeafe,#93c5fd)",
];

/** 获取商品图片（兼容字符串/数组/无图） */
function getProductImage(images: string[] | string | undefined): string | null {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) {
    const url = images[0];
    if (!url || url === "null" || url === "undefined") return null;
    return url.startsWith("http") ? url : `https://ws.hi.cn${url.startsWith("/") ? "" : "/"}${url}`;
  }
  if (typeof images === "string" && images) {
    if (images === "null" || images === "undefined" || images === "[]") return null;
    // 可能是 JSON 字符串
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const url = parsed[0];
        return url.startsWith("http") ? url : `https://ws.hi.cn${url.startsWith("/") ? "" : "/"}${url}`;
      }
    } catch {}
    // 直接当 URL
    return images.startsWith("http") ? images : `https://ws.hi.cn/${images.replace(/^\/+/, "")}`;
  }
  return null;
}

/** 商品卡片组件 */
function ProductCard({ p, i, onBuy, onShare }: {
  p: ApiProduct; i: number;
  onBuy: (p: ApiProduct) => void;
  onShare: (p: ApiProduct) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const imgUrl = getProductImage(p.images);

  return (
    <div onClick={() => onBuy(p)}
      className="bg-surface rounded-sm pb-3.5 pt-0 overflow-hidden shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-96 transition-transform cursor-pointer relative">
      <div className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); onShare(p); }}>
        <ShareButton data={{ title: `小章鱼 - ${p.name}`, text: `¥${p.selling_price} · ${p.brand || ""}`, url: `${getShareOrigin()}/store` }} />
      </div>
      {/* 商品图片 */}
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden mb-2">
        {imgUrl && !imgErr ? (
          <img
            src={imgUrl}
            alt={p.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1"
            style={{ background: productBg[i % productBg.length] }}>
            <span className="text-4xl">{productEmoji(p.name)}</span>
            <span className="text-[9px] text-text-tertiary/60">暂无图片</span>
          </div>
        )}
      </div>
      <div className="px-3">
        <div className="text-xs font-semibold mb-0.5 line-clamp-2 min-h-[2em]">{p.name}</div>
        {p.description && (
          <div className="text-[9px] text-text-tertiary mb-1 line-clamp-1">{p.description}</div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-brand-coral">¥{p.selling_price}</span>
          {p.sales_count > 0 && (
            <span className="text-[9px] text-text-tertiary">已售{p.sales_count}</span>
          )}
        </div>
        <div className="text-[10px] text-brand-gold-dark mt-1 bg-[rgba(242,182,49,0.1)] px-2 py-0.5 rounded-[8px] inline-block">
          赠游戏豆
        </div>
        {p.local_stock > 0 && p.local_stock <= 10 && (
          <div className="text-[9px] text-brand-coral mt-1">仅剩 {p.local_stock} 件</div>
        )}
        {p.brand && (
          <div className="text-[8px] text-text-tertiary mt-1 truncate">{p.brand}</div>
        )}
      </div>
    </div>
  );
}

export default function StoreTemplate({ config: userConfig, storeId = 10001 }: StoreTemplateProps) {
  const cfg = { ...defaultConfig, ...userConfig };
  const [activeTab, setActiveTab] = useState(0);
  const [activeCat, setActiveCat] = useState("all");
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [swapProducts, setSwapProducts] = useState<SwapProduct[]>([]);
  const [swapLoading, setSwapLoading] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; subtitle?: string; desc?: string; brand?: string; url: string; imageUrl?: string } | null>(null);
  const [swapBuyProduct, setSwapBuyProduct] = useState<SwapProduct | null>(null);
  const [swapBuyMsg, setSwapBuyMsg] = useState("");

  useEffect(() => {
    getStoreProducts(storeId)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [storeId]);

  // 处理 BFCache 后退时样式不一致
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // 重新加载数据确保样式最新
        getStoreProducts(storeId)
          .then(setProducts)
          .catch((e) => setError(e.message));
      }
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [storeId]);

  useEffect(() => {
    if (activeTab === 2) {
      setSwapLoading(true);
      getSwapProducts()
        .then(setSwapProducts)
        .catch(() => {})
        .finally(() => setSwapLoading(false));
    }
  }, [activeTab]);

  const filteredStores = activeCat === "all"
    ? cfg.stores
    : cfg.stores.filter((s) => s.category === activeCat);

  /** 点击购买 → 跳转芸众收银台 */
  function handleBuy(product: ApiProduct) {
    const goodsId = product.yz_goods_id || product.product_id;
    const buyUrl = `https://ws.hi.cn/app/index.php?i=7&c=entry&m=yun_shop&do=mobile&r=store.cashier.goods.buy&goods_id=${goodsId}&store_id=${storeId}`;
    window.location.href = buyUrl;
  }

  return (
    <main className="pb-20">
      {/* Carousel */}
      <div className="mx-4 mt-2 rounded-[8px] overflow-hidden shadow-soft" onClick={() => setCarouselIdx((carouselIdx + 1) % cfg.carousels.length)}>
        <div className={`bg-gradient-to-r ${carouselBg[carouselIdx]} p-5 relative cursor-pointer active:scale-[0.98] transition-transform`}>
          <div className="relative z-10">
            <div className="text-[11px] text-white/80 mb-1">{cfg.carousels[carouselIdx].subtitle}</div>
            <div className="text-xl font-bold text-white">{cfg.carousels[carouselIdx].title}</div>
            <div className="text-sm text-white/90 mt-1">{cfg.carousels[carouselIdx].desc}</div>
          </div>
          <span className="absolute right-4 bottom-3 text-5xl opacity-30">{cfg.carousels[carouselIdx].icon}</span>
          {/* Dots */}
          <div className="flex gap-1.5 justify-center mt-3 relative z-10">
            {cfg.carousels.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === carouselIdx ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex mx-4 mt-3 bg-bg rounded-sm p-[3px]">
        {["商品", "消费", "闲豆"].map((tab, i) => (
          <button key={i} onClick={() => {
            if (i === 1) { window.location.href = "/store-services"; return; }
            setActiveTab(i);
          }}
            className={`flex-1 py-2 text-center rounded-[8px] text-xs font-medium transition-colors ${activeTab===i?'bg-surface shadow-sm font-semibold':'text-text-secondary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === 0 && (
        <>
          <SectionTitle title="本店商品" link={loading ? "" : `共 ${products.length} 件`} />
          {loading ? (
            /* Loading skeleton */
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-surface rounded-sm py-3.5 px-3 text-center shadow-sm animate-pulse">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-1" />
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <div className="mx-4 p-8 text-center">
              <span className="text-4xl">😵</span>
              <p className="text-sm text-text-tertiary mt-2">加载失败，请稍后重试</p>
              <button onClick={() => { setLoading(true); setError(""); getStoreProducts(storeId).then(setProducts).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
                className="mt-3 text-xs bg-brand-teal text-white px-4 py-2 rounded-sm">
                重新加载
              </button>
            </div>
          ) : products.length === 0 ? (
            /* Empty state */
            <div className="mx-4 p-8 text-center">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-text-tertiary mt-2">暂无商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  i={i}
                  onBuy={handleBuy}
                  onShare={(product) => setShareData({ title: product.name, subtitle: `¥${product.selling_price}`, brand: product.brand || "小章鱼", url: `${getShareOrigin()}/store` })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Idle Bean (闲豆) Tab */}
      {activeTab === 2 && (
        <>
          <SectionTitle title="闲豆商城" link={swapLoading ? "" : `共 ${swapProducts.length} 件`} />
          {swapLoading ? (
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-surface rounded-sm py-3.5 px-3 text-center shadow-sm animate-pulse">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 mx-auto mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-1" />
                  <div className="h-5 bg-gray-200 rounded w-1/2 mx-auto mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
                </div>
              ))}
            </div>
          ) : swapProducts.length === 0 ? (
            <div className="mx-4 p-8 text-center">
              <span className="text-4xl">🫘</span>
              <p className="text-sm text-text-tertiary mt-2">暂无闲豆商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {swapProducts.map((p) => (
                <div key={p.id} onClick={() => setSwapBuyProduct(p)}
                  className="bg-gradient-to-br from-brand-gold-light/30 to-brand-coral-light/30 rounded-sm py-3.5 px-3 text-center shadow-sm border border-brand-gold/20 active:scale-96 transition-transform cursor-pointer relative">
                  <div className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); setShareData({ title: p.product_name, subtitle: `¥${p.price}`, brand: "闲豆商城", url: `${getShareOrigin()}/store` }); }}>
                    <ShareButton data={{ title: `闲豆 - ${p.product_name}`, text: `¥${p.price} · 闲豆抵扣 ${p.max_idle_bean_ratio}x`, url: `${getShareOrigin()}/store` }} className="bg-brand-gold-light/20 text-brand-gold-dark hover:bg-brand-gold hover:text-white" />
                  </div>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2"
                    style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)" }}>
                    🫘
                  </div>
                  <div className="text-xs font-semibold mb-1 line-clamp-2">{p.product_name}</div>
                  <div className="text-base font-bold text-brand-gold-dark">¥{p.price}</div>
                  <div className="text-[10px] text-brand-gold mt-1 bg-brand-gold-light/20 px-2 py-0.5 rounded-[8px] inline-block">
                    闲豆抵扣 {p.max_idle_bean_ratio}x
                  </div>
                  {Number(p.bonus_sim_coin) > 0 && (
                    <div className="text-[10px] text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded-[8px] inline-block">
                      🎮 送 {Number(p.bonus_sim_coin).toLocaleString()} 游戏豆
                    </div>
                  )}
                  {p.stock > 0 && p.stock <= 20 && (
                    <div className="text-[9px] text-red-500 mt-1">仅剩 {p.stock} 件</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Swap Purchase Modal */}
      {swapBuyProduct && (
        <SwapPurchaseModal
          product={swapBuyProduct}
          onClose={() => setSwapBuyProduct(null)}
          onSuccess={(msg) => { setSwapBuyMsg(msg); setTimeout(() => setSwapBuyMsg(""), 3000); }}
        />
      )}

      {/* Success toast */}
      {swapBuyMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-green-600 text-white px-5 py-2.5 rounded-[8px] text-xs shadow-lg animate-bounce">
          {swapBuyMsg}
        </div>
      )}

      {/* Share Panel */}
      {shareData && (
        <SharePanel data={shareData} onClose={() => setShareData(null)} />
      )}
    </main>
  );
}

function SectionTitle({ title, link }: { title: string; link: string }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
      <h2 className="text-base font-bold flex items-center gap-2 before:content-[''] before:w-1 before:h-[17px] before:rounded-sm before:bg-gradient-to-b from-brand-gold to-brand-coral">
        {title}
      </h2>
      {link && <span className="text-xs text-brand-teal-dark font-medium">{link}</span>}
    </div>
  );
}
