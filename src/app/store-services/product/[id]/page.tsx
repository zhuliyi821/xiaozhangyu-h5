"use client";

import { useState, useEffect, use } from "react";
import { getProductDetail, ProductDetail } from "@/lib/api";
import { ArrowLeft, ShoppingCart, Share2, AlertTriangle, Loader2 } from "lucide-react";
import { normalizeImageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";

/** 解码 HTML 实体编码（如 &lt; → <） */
function decodeHtmlEntities(str: string): string {
  if (typeof document === "undefined") return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [buying, setBuying] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<"buy" | "cart" | null>(null);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    if (pendingAction === "buy") {
      setPendingAction(null);
      doBuy();
    } else if (pendingAction === "cart") {
      setPendingAction(null);
      doAddToCart();
    }
  };

  const doBuy = async () => {
    if (!user?.uid) { setPendingAction("buy"); setShowLogin(true); return; }
    setBuying(true);
    try {
      const r = await fetch(`${API_BASE}/api/store-services?action=create_order&goods_id=${id}&member_id=${user.uid}&quantity=${qty}`);
      const j = await r.json();
      if (j.code !== 0) throw new Error(j.msg);
      window.location.href = "/orders";
    } catch (e: any) {
      alert("下单失败: " + e.message);
    }
    setBuying(false);
  };

  const doAddToCart = () => {
    if (!user?.uid) { setPendingAction("cart"); setShowLogin(true); return; }
    alert("已加入购物车（功能开发中）");
  };

  const load = async () => {
    setLoading(true);
    try {
      const d = await getProductDetail(Number(id));
      setData(d);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  // 处理 BFCache 后退问题
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) load();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-white">
      <div className="animate-pulse p-4 space-y-4">
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-6 w-3/4 bg-gray-100 rounded" />
        <div className="h-8 w-1/3 bg-gray-100 rounded" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-4xl mb-3">📦</div>
        <div className="text-sm text-gray-500 mb-3">{error || "商品不存在"}</div>
        <button onClick={load} className="text-xs bg-brand-teal text-white px-4 py-2 rounded-full">重试</button>
      </div>
    </main>
  );

  const { goods } = data;
  const thumbUrl = normalizeImageUrl(goods.thumb);
  const originalPrice = (Number(goods.price) * 1.3).toFixed(2);

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => window.history.back()} className="p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium">商品详情</span>
        <button className="ml-auto p-1">
          <Share2 className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* 主图 */}
      <div className="bg-white">
        <div className="w-full aspect-square flex items-center justify-center bg-gray-50 relative overflow-hidden">
          {thumbUrl && !imgError ? (
            <img src={thumbUrl} alt={goods.title} className="w-full h-full object-cover"
              onError={() => setImgError(true)} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-300">
              <AlertTriangle className="w-10 h-10" />
              <span className="text-xs">暂无图片</span>
            </div>
          )}
        </div>
      </div>

      {/* 价格信息 */}
      <div className="bg-white px-4 py-4 mt-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-coral">¥{goods.price}</span>
          <span className="text-xs text-gray-400 line-through">¥{originalPrice}</span>
          <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded ml-auto">门店直供</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">已售 {goods.stock > 100 ? "1000+" : goods.stock} 件 · 库存 {goods.stock} 件</div>
      </div>

      {/* 标题 */}
      <div className="bg-white px-4 py-3 mt-[1px]">
        <h1 className="text-sm font-semibold leading-relaxed">{goods.title}</h1>
      </div>

      {/* 数量选择 */}
      <div className="bg-white px-4 py-4 mt-[1px] flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">数量</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-sm">-</button>
          <span className="w-6 text-center text-sm font-medium">{qty}</span>
          <button onClick={() => setQty(Math.min(goods.stock, qty + 1))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-sm">+</button>
        </div>
      </div>

      {/* 商品详情 */}
      {goods.content && (
        <div className="bg-white px-4 py-4 mt-[1px]">
          <div className="text-xs font-medium text-gray-500 mb-2">商品描述</div>
          <div
            className="prose prose-xs max-w-none text-xs text-gray-700 leading-relaxed [&_img]:max-w-full [&_img]:rounded-lg [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(goods.content) }}
          />
        </div>
      )}

      {/* 底部操作栏 - 上移 64px 避开 TabBar */}
      <div className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-40">
        <a href="/orders" className="flex flex-col items-center gap-0.5 px-2">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-[10px] text-gray-400">我的订单</span>
        </a>
        <div className="flex-1 flex gap-2">
          <button className="flex-1 py-2.5 text-xs font-medium rounded-full border border-brand-teal text-brand-teal" onClick={doAddToCart}>加入购物车</button>
          <button onClick={doBuy} disabled={buying}
            className="flex-1 py-2.5 text-xs font-medium rounded-full bg-gradient-to-r from-brand-coral to-red-500 text-white shadow-sm flex items-center justify-center gap-1">
            {buying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {buying ? "下单中..." : "立即购买"}
          </button>
        </div>
      </div>

      {/* 登录弹窗 */}
      {showLogin && (
        <LoginModal
          onClose={() => { setShowLogin(false); setPendingAction(null); }}
          onSuccess={handleLoginSuccess}
        />
      )}
    </main>
  );
}
