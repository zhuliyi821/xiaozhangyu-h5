"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA" };

const STEPS = [
  { id: "form", label: "填写信息", icon: "📝" },
  { id: "review", label: "平台审核", icon: "⏳" },
  { id: "activate", label: "开通账号", icon: "✅" },
  { id: "decorate", label: "装修门店", icon: "🎨" },
  { id: "launch", label: "正式上线", icon: "🚀" },
];

/** 5步进度条 */
function ProgressBar({ current, status }: { current: number; status?: number }) {
  return (
    <div className="flex items-start justify-between px-2 pt-4 pb-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const rejected = i === current && status === 2;
        return (
          <div key={s.id} className="flex flex-col items-center flex-1 relative">
            {/* 连线 */}
            {i > 0 && <div className={`absolute top-2.5 right-[50%] w-full h-[2px] ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
            {/* 圆点 */}
            <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${done ? 'bg-green-400 text-white' : rejected ? 'bg-red-400 text-white' : active ? 'w-6 h-6 border-2 border-brand-coral text-brand-coral bg-white' : 'bg-gray-200 text-gray-400'}`}>
              {done ? '✓' : rejected ? '✗' : active ? '●' : ''}
            </div>
            {/* 标签 */}
            <div className={`text-[8px] mt-1 text-center leading-tight ${done ? 'text-green-600' : active ? 'text-brand-coral font-semibold' : 'text-gray-400'}`}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MerchantApplyPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<"form" | "submitted" | "status">("form");
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    merchant_name: "", contact_name: "", mobile: "",
    province: "", city: "", district: "",
    store_name: "", address: "",
  });

  // Load existing status
  useEffect(() => {
    if (!user) return;
    fetch(`/api/store-services?action=apply_status&member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data) {
          setStatus(d.data);
          if (d.data.has_merchant) setStep("status");
          else if (d.data.merchant_apply) setStep("submitted");
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSubmit = async () => {
    if (!user) { setShowLogin(true); return; }
    if (!form.merchant_name || !form.mobile) { setError("请填写商户名称和手机号"); return; }
    setSubmitting(true); setError("");
    try {
      const r = await fetch("/api/store-services?action=apply_merchant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, member_id: user.uid }),
      });
      const d = await r.json();
      if (d.code === 0) setStep("submitted");
      else setError(d.msg || "提交失败");
    } catch { setError("网络错误"); }
    setSubmitting(false);
  };

  const StatusBadge = ({ s }: { s: number }) => {
    if (s === 0) return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">待审核</span>;
    if (s === 1) return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">已通过 ✓</span>;
    return <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">已驳回</span>;
  };

  if (loading) return <Loading />;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]">
    <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后申请</button>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
  </div>;

  // Already a merchant
  if (step === "status" && status?.has_merchant) {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="bg-white px-5 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">入驻状态</h1>
          </div>
          <ProgressBar current={5} />
        </div>
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-[10px] p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-sm font-medium">您已是商户</p>
            <p className="text-[11px] text-gray-400 mt-1">可进入商户管理查看门店数据</p>
            <button onClick={() => window.location.href = "/merchant"}
              className="mt-4 px-5 py-2 rounded-[8px] text-white text-sm" style={{background:C.coral}}>进入商户管理</button>
          </div>
        </div>
      </main>
    );
  }

  // Submitted
  if (step === "submitted") {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="bg-white px-5 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">入驻申请</h1>
          </div>
          <ProgressBar current={1} />
        </div>
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-[10px] p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium">申请已提交</p>
            <p className="text-[11px] text-gray-400 mt-2">平台正在审核中，请耐心等待</p>
            <p className="text-[10px] text-gray-300 mt-1">预计 1-3 个工作日完成审核</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[11px] text-amber-600">审核中</span>
            </div>
            {status?.merchant_apply && (
              <div className="mt-4 text-left bg-gray-50 rounded-[8px] p-3">
                <p className="text-[11px] text-gray-500">申请信息</p>
                <p className="text-[12px] mt-1">商户名: {status.merchant_apply.username}</p>
                <p className="text-[10px] text-gray-400 mt-1">提交时间: {new Date(status.merchant_apply.created_at * 1000).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Form
  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <div className="bg-white px-5 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold">商户入驻申请</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">完成以下信息，提交后等待审核</p>
          </div>
        </div>
        <ProgressBar current={0} />
      </div>

      {error && (
        <div className="mx-4 mt-3 text-[11px] text-center py-2 rounded-[6px]" style={{backgroundColor:`${C.coral}10`, color: C.coral}}>
          {error}
        </div>
      )}

      <div className="mx-4 mt-4 space-y-4">
        {/* 商户信息 */}
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.coral}}>📋 商户信息</h2>
          <Field label="商户名称" value={form.merchant_name} onChange={v => setForm(f=>({...f,merchant_name:v}))} placeholder="如：老王烧烤店" />
          <Field label="联系人" value={form.contact_name} onChange={v => setForm(f=>({...f,contact_name:v}))} placeholder="联系人姓名" />
          <Field label="手机号" value={form.mobile} onChange={v => setForm(f=>({...f,mobile:v}))} placeholder="手机号码" type="tel" />
        </div>

        {/* 区域信息 */}
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.teal}}>📍 区域信息</h2>
          <Field label="省份" value={form.province} onChange={v => setForm(f=>({...f,province:v}))} placeholder="如：广东省" />
          <Field label="城市" value={form.city} onChange={v => setForm(f=>({...f,city:v}))} placeholder="如：深圳市" />
          <Field label="区/县" value={form.district} onChange={v => setForm(f=>({...f,district:v}))} placeholder="如：南山区" />
        </div>

        {/* 门店信息 */}
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.gold}}>🏪 门店信息（可选）</h2>
          <Field label="门店名称" value={form.store_name} onChange={v => setForm(f=>({...f,store_name:v}))} placeholder="如：山房烤肉·科技园店" />
          <Field label="门店地址" value={form.address} onChange={v => setForm(f=>({...f,address:v}))} placeholder="详细地址" />
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full py-3 rounded-[10px] text-white text-sm font-medium active:scale-[0.98] transition-all disabled:opacity-60"
          style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
          {submitting ? "提交中..." : "提交入驻申请"}
        </button>

        <p className="text-[9px] text-gray-300 text-center pb-4">提交后平台将在1-3个工作日内审核</p>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="text-[11px] text-gray-500 mb-1 block">{label}</label>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-[13px] px-3 py-2.5 rounded-[8px] border border-gray-200 bg-gray-50 outline-none focus:border-[#F27152] transition-colors"
      />
    </div>
  );
}

function Loading() {
  return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]">
    <div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" />
  </div>;
}
