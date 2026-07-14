"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { C } from "@/lib/brand-colors";


export default function CancelPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<"confirm" | "reason" | "done">("confirm");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleCancel = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    try {
      // 调用后端注销 API
      const r = await fetch("/api/v2/merchant/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: user.uid, reason }),
      });
      const d = await r.json();
      if (d.code === 0) {
        setStep("done");
      } else {
        setMsg(d.msg || "注销失败");
      }
    } catch {
      setMsg("网络错误");
    }
    setSubmitting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后操作</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <h1 className="text-base font-semibold">注销商户</h1>
        </div>
      </div>

      {msg && (
        <div className="mx-4 mt-2 text-[11px] text-center py-1.5 rounded-[8px]" style={{backgroundColor:`${C.coral}10`,color:C.coral}}>
          {msg}
        </div>
      )}

      {step === "done" ? (
        <div className="mx-4 mt-8">
          <div className="bg-white rounded-[12px] p-8 text-center shadow-sm">
            <p className="text-5xl mb-4">🙏</p>
            <p className="text-sm font-semibold mb-2">注销申请已提交</p>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              您的商户注销已提交审核。<br />
              平台将在 3 个工作日内处理。<br />
              如欲恢复，请联系客服。
            </p>
            <button onClick={() => window.location.href = "/merchant"}
              className="mt-6 px-6 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95 transition-transform"
              style={{background: C.coral}}>
              返回商户
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-4 space-y-4">
          <div className="bg-white rounded-[12px] p-4 shadow-sm">
            <p className="text-[12px] font-semibold mb-3">⚠️ 注销须知</p>
            <ul className="text-[11px] text-gray-500 space-y-2">
              <li>• 注销后所有门店数据将停止运营</li>
              <li>• 未提现余额需在 30 天内完成提现</li>
              <li>• 注销后 7 天内可联系客服恢复</li>
              <li>• 注销后 30 天后无法恢复</li>
            </ul>
          </div>

          <div className="bg-white rounded-[12px] p-4 shadow-sm">
            <p className="text-[12px] font-semibold mb-3">请选择注销原因</p>
            <div className="space-y-2.5">
              {["不再经营", "平台不适用", "费用问题", "其他原因"].map(r => (
                <label key={r} className="flex items-center gap-2.5 cursor-pointer" onClick={() => setReason(r)}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${reason === r ? "border-[#F27152]" : "border-gray-300"}`}>
                    {reason === r && <div className="w-2 h-2 rounded-full bg-[#F27152]" />}
                  </div>
                  <span className="text-[12px] text-gray-600">{r}</span>
                </label>
              ))}
              {reason === "其他原因" && (
                <textarea value={reason === "其他原因" ? "" : reason} onChange={e => setReason(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-[8px] border border-gray-200 text-[12px] outline-none focus:border-[#F27152] h-20 resize-none" placeholder="请详细描述..." />
              )}
            </div>
          </div>

          <button onClick={handleCancel} disabled={!reason || submitting}
            className="w-full py-3 rounded-[10px] text-white text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-50"
            style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
            {submitting ? "提交中..." : "确认注销商户"}
          </button>

          <p className="text-[9px] text-gray-300 text-center pb-4">提交后平台将在3个工作日内审核</p>
        </div>
      )}
    </main>
  );
}
