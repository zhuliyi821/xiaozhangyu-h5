"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA", green: "#10B981", purple: "#8B5CF6" };

const PLAN_PRICE = 9800;

// 模拟代金券数据
const MOCK_VOUCHERS = [
  { id: 1, amount: 2000, label: "新商户专享券 ¥2,000", expired: "2026-12-31" },
  { id: 2, amount: 1000, label: "早鸟优惠券 ¥1,000", expired: "2026-09-30" },
  { id: 3, amount: 500, label: "推荐有礼券 ¥500", expired: "2026-08-15" },
];

interface PaymentRes {
  success: boolean;
  account: string;
  password: string;
  order_sn: string;
}

export default function MerchantPurchasePage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PaymentRes | null>(null);
  const [agreed, setAgreed] = useState(false);

  // 支付
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay" | "transfer">("wechat");
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);

  const voucherAmount = selectedVoucher ? (vouchers.find(v => v.id === selectedVoucher)?.amount || 0) : 0;
  const finalPrice = Math.max(0, PLAN_PRICE - voucherAmount);

  // 加载真实代金券
  useEffect(() => {
    if (!user) return;
    fetch(`/api/store-services?action=vouchers&member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.length > 0) setVouchers(d.data);
      })
      .catch(() => {});
  }, [user]);

  const handlePayment = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!agreed) { setError("请先阅读并同意《商户服务协议》"); return; }
    setSubmitting(true); setError("");
    try {
      const r = await fetch("/api/store-services?action=purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: user.uid,
          plan: "basic",
          amount: finalPrice,
          voucher_id: selectedVoucher,
          payment_method: paymentMethod,
          agreement_signed: true,
        }),
      });
      const d = await r.json();
      if (d.code === 0) {
        setResult({
          success: true,
          account: d.data.account || `merchant_${user.uid}`,
          password: d.data.password || "******",
          order_sn: d.data.order_sn || `ORD${Date.now()}`,
        });
      } else {
        setError(d.msg || "支付失败，请重试");
      }
    } catch { setError("网络错误，请重试"); }
    setSubmitting(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后购买</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  // ── Payment success ──
  if (result) {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="mx-4 mt-12">
          <div className="bg-white rounded-[16px] p-6 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-lg font-semibold mt-4" style={{color:"#1C1C1E"}}>支付成功！</p>
            <p className="text-[11px] text-gray-400 mt-1">商户后台已自动开通</p>

            <div className="mt-6 bg-gray-50 rounded-[10px] p-4 text-left space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">商户账号</span>
                <span className="font-mono font-medium">{result.account}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">登录密码</span>
                <span className="font-mono font-medium">{result.password}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">订单编号</span>
                <span className="font-mono text-[10px]">{result.order_sn}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">登录地址</span>
                <span className="font-medium" style={{color:C.teal}}>ws.hi.cn/merchant</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-300 mt-4">账号密码已发送至你的注册手机号</p>

            <button onClick={() => window.location.href = "/merchant"}
              className="w-full mt-6 py-3.5 rounded-[10px] text-white text-sm font-semibold active:scale-[0.98] transition-all"
              style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
              进入商户管理后台 →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Purchase form ──
  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>购买商户管理权限</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">一次性付费，永久使用</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 text-[11px] text-center py-2 rounded-[6px]" style={{backgroundColor:`${C.coral}10`, color: C.coral}}>
          {error}
        </div>
      )}

      <div className="mx-4 mt-4 space-y-3">
        {/* 套餐卡片 */}
        <div className="bg-white rounded-[12px] p-4 shadow-sm border-2" style={{borderColor:C.gold}}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{backgroundColor:`${C.gold}20`}}>
              <span className="text-lg">🏪</span>
            </div>
            <div>
              <p className="text-[14px] font-semibold">小章鱼商户系统 · 基础版</p>
              <p className="text-[10px] text-gray-400 mt-0.5">¥9,800 — 一次性付费，永久使用</p>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px] text-gray-500">
            <p>✅ 门店管理（商品/订单/装修/员工）</p>
            <p>✅ AI员工报告 + AI智能对话</p>
            <p>✅ 自媒体运营（公众号/小红书/抖音）</p>
            <p>✅ 收入统计 + 提现</p>
            <p>✅ 合作门店聚合页展示</p>
          </div>
        </div>

        {/* 代金券 */}
        <div className="bg-white rounded-[12px] p-4 shadow-sm">
          <p className="text-[12px] font-medium mb-2">🎟️ 代金券</p>
          <div className="relative">
            <div onClick={() => setVoucherOpen(!voucherOpen)}
              className="w-full text-[12px] px-3 py-2.5 rounded-[8px] border border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer">
              <span className={selectedVoucher ? "" : "text-gray-400"}>
                {selectedVoucher ? vouchers.find(v => v.id === selectedVoucher)?.label : "选择代金券（可选）"}
              </span>
              <span className="text-gray-300 text-[10px]">{voucherOpen ? "▲" : "▼"}</span>
            </div>
            {voucherOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-[8px] shadow-sm overflow-hidden">
                <div onClick={() => { setSelectedVoucher(null); setVoucherOpen(false); }}
                  className="px-3 py-2.5 text-[12px] text-gray-400 border-b border-gray-50 active:bg-gray-50">
                  不使用代金券
                </div>
                {vouchers.map(v => (
                  <div key={v.id} onClick={() => { setSelectedVoucher(v.id); setVoucherOpen(false); }}
                    className="px-3 py-2.5 text-[12px] border-b border-gray-50 last:border-0 flex items-center justify-between active:bg-gray-50 cursor-pointer">
                    <span>{v.label}</span>
                    <span className="text-[10px] text-gray-300">至 {v.expired}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedVoucher && (
            <p className="text-[10px] mt-1.5" style={{color:C.green}}>
              已抵扣 ¥{voucherAmount.toLocaleString()}，节省 {Math.round(voucherAmount / PLAN_PRICE * 100)}%
            </p>
          )}
        </div>

        {/* 支付方式 */}
        <div className="bg-white rounded-[12px] p-4 shadow-sm">
          <p className="text-[12px] font-medium mb-3">💳 支付方式</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "wechat" as const, label: "微信支付", icon: "💚" },
              { key: "alipay" as const, label: "支付宝", icon: "💙" },
              { key: "transfer" as const, label: "银行转账", icon: "🏦" },
            ].map(pm => (
              <div key={pm.key} onClick={() => setPaymentMethod(pm.key)}
                className={`py-3 rounded-[8px] text-center text-[11px] font-medium cursor-pointer transition-all active:scale-[0.97] ${
                  paymentMethod === pm.key
                    ? "border-2 text-white" : "border border-gray-200 text-gray-500 bg-gray-50"
                }`}
                style={paymentMethod === pm.key ? { borderColor: C.coral, backgroundColor: C.coral } : {}}>
                <p>{pm.icon}</p>
                <p className="mt-0.5">{pm.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 协议 */}
        <div className="bg-white rounded-[12px] p-4 shadow-sm">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[#F27152]" />
            <span className="text-[11px] text-gray-500 leading-relaxed">
              我已阅读并同意
              <span className="font-medium" style={{color:C.coral}}>《小章鱼商户服务协议》</span>
              ，包括费用说明、服务条款与终止条件
            </span>
          </label>
        </div>

        {/* Total + Pay */}
        <div className="bg-white rounded-[12px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-gray-400">商品总额</span>
            <span className="text-[12px]">¥{PLAN_PRICE.toLocaleString()}</span>
          </div>
          {voucherAmount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px]" style={{color:C.green}}>代金券抵扣</span>
              <span className="text-[12px]" style={{color:C.green}}>-¥{voucherAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-[13px] font-semibold">还需支付</span>
            <span className="text-xl font-bold" style={{color:C.coral}}>¥{finalPrice.toLocaleString()}</span>
          </div>
        </div>

        <button onClick={handlePayment} disabled={submitting}
          className="w-full py-3.5 rounded-[10px] text-white text-sm font-semibold active:scale-[0.98] transition-all disabled:opacity-60"
          style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
          {submitting ? "支付处理中..." : `确认支付 ¥${finalPrice.toLocaleString()}`}
        </button>

        <p className="text-[9px] text-gray-300 text-center pb-4">支付成功后商户后台自动开通，无需等待</p>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
