"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface SwapPurchaseModalProps {
  product: {
    id: number;
    product_name: string;
    price: string;
    max_idle_bean_ratio: string;
    bonus_sim_coin: string;
    stock: number;
  };
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function SwapPurchaseModal({ product, onClose, onSuccess }: SwapPurchaseModalProps) {
  const { user } = useAuth();
  const [payMode, setPayMode] = useState<"cash" | "idle_bean" | "mixed">("idle_bean");
  const [idleBeanAmount, setIdleBeanAmount] = useState(Number(product.price));
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState("");

  const price = Number(product.price);
  const cashAmount = payMode === "cash" ? price : payMode === "mixed" ? price - idleBeanAmount : 0;
  const idleUsed = payMode === "idle_bean" ? price : payMode === "mixed" ? idleBeanAmount : 0;

  const handleBuy = async () => {
    if (!user) { setErr("请先登录"); return; }
    setBuying(true); setErr("");
    try {
      const params = new URLSearchParams({
        user_id: String(user.uid),
        zone_product_id: String(product.id),
        amount: String(price),
        idle_bean: String(idleUsed),
      });
      const res = await fetch("https://surplus.hi.cn/addons/addon_xiaozhangyu_swap/api.php?action=purchase", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const d = await res.json();
      if (d.code !== 0) throw new Error(d.msg);
      let msg = "✅ 购买成功！";
      if (product.bonus_sim_coin && Number(product.bonus_sim_coin) > 0) {
        msg += ` 🎮 获得 ${Number(product.bonus_sim_coin).toLocaleString()} 游戏豆`;
      }
      onSuccess(msg);
      onClose();
    } catch (e: any) {
      setErr(e.message || "购买失败");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/60 flex items-end sm:items-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm sm:mx-auto rounded-t-[28px] sm:rounded-[28px] p-5 pb-8" onClick={(e) => e.stopPropagation()}>

        {/* Product Info */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center text-3xl mx-auto mb-2">🫘</div>
          <div className="text-sm font-bold">{product.product_name}</div>
          <div className="text-xl font-bold text-amber-600 mt-1">¥{product.price}</div>
          {Number(product.bonus_sim_coin) > 0 && (
            <div className="text-[11px] text-green-600 mt-1">🎮 送 {Number(product.bonus_sim_coin).toLocaleString()} 游戏豆</div>
          )}
        </div>

        {/* Payment Mode */}
        <div className="bg-amber-50 rounded-[16px] p-3 mb-4">
          <div className="text-[11px] text-text-secondary mb-2">支付方式</div>
          <div className="flex gap-2">
            {[
              { key: "idle_bean" as const, label: "纯闲豆", desc: "全部用闲豆" },
              { key: "cash" as const, label: "纯现金", desc: "全额支付" },
              { key: "mixed" as const, label: "混合支付", desc: "闲豆+现金" },
            ].map(m => (
              <button key={m.key} onClick={() => { setPayMode(m.key); setIdleBeanAmount(Math.min(price, price * Number(product.max_idle_bean_ratio))); }}
                className={`flex-1 py-2 rounded-[12px] text-xs transition-all ${payMode === m.key ? "bg-amber-500 text-white shadow-sm" : "bg-white text-text-secondary border border-amber-200"}`}>
                <div className="font-semibold">{m.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mixed payment slider */}
        {payMode === "mixed" && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>闲豆支付</span>
              <span>¥{idleBeanAmount}</span>
            </div>
            <input type="range" min={0} max={price} step={1} value={idleBeanAmount}
              onChange={e => setIdleBeanAmount(Number(e.target.value))}
              className="w-full accent-amber-500" />
            <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
              <span>现金: ¥{cashAmount.toFixed(2)}</span>
              <span>闲豆: ¥{idleUsed.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-bg rounded-[12px] p-3 text-xs text-text-secondary mb-4 space-y-1">
          <div className="flex justify-between"><span>商品金额</span><span className="font-semibold">¥{price.toFixed(2)}</span></div>
          {idleUsed > 0 && <div className="flex justify-between"><span>闲豆抵扣</span><span className="text-amber-600">-¥{idleUsed.toFixed(2)}</span></div>}
          {cashAmount > 0 && <div className="flex justify-between"><span>实付现金</span><span className="font-semibold">¥{cashAmount.toFixed(2)}</span></div>}
        </div>

        {err && <div className="text-center text-xs text-red-500 mb-3">{err}</div>}

        {/* Buy Button */}
        <button onClick={handleBuy} disabled={buying}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-[16px] text-sm disabled:opacity-50 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-transform">
          {buying ? "购买中..." : "确认购买"}
        </button>
        <button onClick={onClose} className="w-full py-2 text-text-tertiary text-xs mt-2">取消</button>
      </div>
    </div>
  );
}
