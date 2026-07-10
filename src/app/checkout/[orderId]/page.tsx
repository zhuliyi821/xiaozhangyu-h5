"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Wallet, ShieldCheck } from "lucide-react";
import { API_BASE } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

/** 订单详情（前端展示） */
interface OrderDetail {
  order_id: number;
  order_sn: string;
  total_price: number;
  goods_title: string;
  goods_thumb: string;
  goods_price: number;
  quantity: number;
  store_name: string;
  game_coin_ratio: number;
}

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<"balance" | "xiandou">("balance");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadOrder();
  }, [user, orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      // Fetch order + goods detail
      const r = await fetch(`${API_BASE}/api/store-services?action=product_detail&goods_id=${orderId.split("_")[0] || orderId}`);
      const j = await r.json();
      if (j.code !== 0) throw new Error(j.msg || "加载失败");
      
      // Also try to get the order info
      const oid = parseInt(orderId);
      if (!isNaN(oid)) {
        // We'll set what we know from the order creation response
        setOrder({
          order_id: oid,
          order_sn: "加载中...",
          total_price: 0,
          goods_title: j.data?.goods?.title || "商品",
          goods_thumb: j.data?.goods?.thumb || "",
          goods_price: parseFloat(j.data?.goods?.price || "0"),
          quantity: 1,
          store_name: "门店",
          game_coin_ratio: 5.5,
        });
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const doPay = async () => {
    if (!user?.uid) { setShowLogin(true); return; }
    setPaying(true);
    try {
      const r = await fetch(
        `${API_BASE}/api/store-services?action=pay_order&member_id=${user.uid}&order_id=${orderId}&payment=${payment}`
      );
      const j = await r.json();
      if (j.code !== 0) throw new Error(j.msg);
      setPaid(true);
      setPayResult(j.data);
    } catch (e: any) {
      alert("支付失败: " + e.message);
    }
    setPaying(false);
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-4xl mb-3">🔐</div>
          <div className="text-sm text-gray-500 mb-4">请先登录后结算</div>
          <button onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#F27152] to-[#E06050] text-white text-xs rounded-full">
            立即登录
          </button>
          {showLogin && (
            <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
          )}
        </div>
      </main>
    );
  }

  if (paid && payResult) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
          </div>
          <div className="text-lg font-bold text-gray-800 mb-2">支付成功</div>
          <div className="text-xs text-gray-500 mb-1">订单 #{payResult.order_sn}</div>
          <div className="text-sm text-brand-coral font-bold mb-1">支付 ¥{payResult.paid}</div>
          {payResult.game_coins_granted > 0 && (
            <div className="text-xs text-brand-teal mb-4">
              🎮 获得 {payResult.game_coins_granted} 游戏豆
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <a href="/orders"
              className="px-5 py-2.5 border border-brand-teal text-brand-teal text-xs rounded-full">
              查看订单
            </a>
            <a href="/stores"
              className="px-5 py-2.5 bg-gradient-to-r from-[#F27152] to-[#E06050] text-white text-xs rounded-full">
              继续逛逛
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center px-4 h-12">
          <button onClick={() => window.history.back()} className="text-gray-600 text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">确认订单</h1>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mx-4 mt-8 p-4 bg-red-50 rounded-sm text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-400 mb-2" />
          <div className="text-sm text-red-500">{error}</div>
          <button onClick={loadOrder} className="mt-3 px-4 py-1.5 bg-red-500 text-white text-xs rounded-full">重试</button>
        </div>
      ) : order ? (
        <>
          {/* 商品信息 */}
          <div className="bg-white mx-4 mt-4 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-sm bg-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                {order.goods_thumb ? (
                  <img src={order.goods_thumb.startsWith("http") ? order.goods_thumb : `${API_BASE}/${order.goods_thumb}`}
                    alt={order.goods_title} className="w-full h-full object-cover" />
                ) : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{order.goods_title}</div>
                <div className="text-xs text-gray-500 mt-0.5">× {order.quantity}</div>
                <div className="text-sm font-bold text-brand-coral mt-1">¥{order.goods_price}</div>
              </div>
            </div>
            {order.game_coin_ratio > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-brand-teal flex items-center gap-1">
                <span>🎮 赠送游戏豆 (×{order.game_coin_ratio})</span>
                <span className="text-gray-400">≈ ¥{order.goods_price} × {order.game_coin_ratio} = {(order.goods_price * order.game_coin_ratio).toFixed(2)} 豆</span>
              </div>
            )}
          </div>

          {/* 支付方式 */}
          <div className="bg-white mx-4 mt-3 rounded-sm p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              支付方式
            </h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                payment === "balance" ? "border-brand-coral bg-red-50" : "border-gray-200"
              }`}>
                <input type="radio" name="payment" value="balance" checked={payment === "balance"}
                  onChange={() => setPayment("balance")} className="accent-brand-coral" />
                <div className="flex-1">
                  <div className="text-xs font-medium">余额支付</div>
                  <div className="text-[10px] text-gray-500">
                    可用余额: ¥{user?.balance?.credit4?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-coral">¥{order.goods_price}</span>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                payment === "xiandou" ? "border-amber-400 bg-amber-50" : "border-gray-200"
              }`}>
                <input type="radio" name="payment" value="xiandou" checked={payment === "xiandou"}
                  onChange={() => setPayment("xiandou")} className="accent-amber-500" />
                <div className="flex-1">
                  <div className="text-xs font-medium">🫘 闲豆支付</div>
                  <div className="text-[10px] text-gray-500">
                    可用闲豆: {user?.balance?.credit2?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500">{order.goods_price} 豆</span>
              </label>
            </div>
          </div>

          {/* 金额汇总 */}
          <div className="bg-white mx-4 mt-3 rounded-sm p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">实付金额</span>
              <span className="text-lg font-bold text-brand-coral">¥{order.goods_price}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
              <span>预计获得游戏豆</span>
              <span>≈ {(order.goods_price * order.game_coin_ratio).toFixed(2)}</span>
            </div>
          </div>

          {/* 确认支付按钮 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
            <button
              onClick={doPay}
              disabled={paying}
              className="w-full py-3 text-sm font-medium rounded-full bg-gradient-to-r from-[#F27152] to-[#E06050] text-white shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 支付中...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> 确认支付 ¥{order.goods_price}</>
              )}
            </button>
          </div>
        </>
      ) : null}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      )}
    </main>
  );
}
