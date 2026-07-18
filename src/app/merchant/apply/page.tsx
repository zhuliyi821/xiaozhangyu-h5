"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import regions from "@/lib/regions";
import { C } from "@/lib/brand-colors";

const STEPS = [
  { id: "form", label: "填写信息", icon: "📝" },
  { id: "review", label: "平台审核", icon: "⏳" },
  { id: "pay", label: "支付开通", icon: "💳" },
];

/** 3步进度条 */
function ProgressBar({ current, rejected }: { current: number; rejected?: boolean }) {
  return (
    <div className="flex items-start justify-between px-2 pt-4 pb-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.id} className="flex flex-col items-center flex-1 relative">
            {i > 0 && <div className={`absolute top-2.5 right-[50%] w-full h-[2px] ${done ? 'bg-green-400' : 'bg-gray-200'}`} />}
            <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${done ? 'bg-green-400 text-white' : rejected && active ? 'bg-red-400 text-white' : active ? 'w-6 h-6 border-2 border-brand-coral text-brand-coral bg-white' : 'bg-gray-200 text-gray-400'}`}>
              {done ? '✓' : rejected && active ? '✗' : active ? '●' : ''}
            </div>
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
  const [step, setStep] = useState<"form" | "submitted" | "approved" | "paid" | "rejected">("form");
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    merchant_name: "", contact_name: "", mobile: "",
    province: "", city: "", district: "",
    store_name: "", address: "", latitude: "", longitude: "",
  });
  const [locating, setLocating] = useState(false);

  // Load existing status
  useEffect(() => {
    if (!user) return;
    fetch(`/api/store-services?action=apply_status&member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data) {
          setStatus(d.data);
          if (d.data.has_merchant && d.data.paid) {
            setStep("paid");
          } else if (d.data.has_merchant) {
            setStep("paid");
          } else if (d.data.merchant_apply?.status === 1) {
            setStep("approved");
          } else if (d.data.merchant_apply?.status === 2) {
            setStep("rejected");
          } else if (d.data.merchant_apply) {
            setStep("submitted");
          }
        }
      })
      .catch(() => console.warn("请求 失败"));
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

  if (loading) return <Loading />;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]">
    <button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后申请</button>
    {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
  </div>;

  // ── Already paid ──
  if (step === "paid") {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="bg-white px-5 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">入驻状态</h1>
          </div>
          <ProgressBar current={3} />
        </div>
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-[10px] p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-sm font-medium">您已是商户</p>
            <p className="text-[11px] text-gray-400 mt-1">可进入商户管理查看门店数据与经营状况</p>
            <button onClick={() => window.location.href = "/merchant"}
              className="mt-4 px-5 py-2 rounded-[8px] text-white text-sm" style={{background:C.coral}}>进入商户管理后台 →</button>
          </div>
        </div>
      </main>
    );
  }

  // ── Approved (pending payment) ──
  if (step === "approved") {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="bg-white px-5 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">入驻状态</h1>
          </div>
          <ProgressBar current={2} />
        </div>
        <div className="mx-4 mt-4 space-y-3">
          {/* 审核通过卡片 */}
          <div className="bg-white rounded-[10px] p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-sm font-medium">审核通过！</p>
            <p className="text-[11px] text-gray-400 mt-1">恭喜，你的入驻申请已通过审核</p>
            <p className="text-[11px] text-gray-400">请支付 ¥9,800 开通商户管理权限</p>
          </div>

          {/* 套餐卡片 */}
          <div className="bg-white rounded-[10px] p-4 shadow-sm border-2" style={{borderColor:C.gold}}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[13px] font-semibold">小章鱼商户系统 · 基础版</p>
                <p className="text-[10px] text-gray-400 mt-1">门店管理 · AI员工 · 自媒体 · 收入提现</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold" style={{color:C.coral}}>¥9,800</p>
                <p className="text-[9px] text-gray-300">一次性付费</p>
              </div>
            </div>
          </div>

          <button onClick={() => window.location.href = "/merchant/purchase"}
            className="w-full py-3.5 rounded-[10px] text-white text-sm font-semibold active:scale-[0.98] transition-all"
            style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
            立即开通 · ¥9,800
          </button>

          <p className="text-[9px] text-gray-300 text-center">支付后自动开通，发送登录账号密码</p>
        </div>
      </main>
    );
  }

  // ── Submitted ──
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

  // ── Rejected ──
  if (step === "rejected") {
    return (
      <main className="min-h-screen bg-[#F5F6FA]">
        <div className="bg-white px-5 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">入驻申请</h1>
          </div>
          <ProgressBar current={1} rejected />
        </div>
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-[10px] p-6 text-center shadow-sm">
            <p className="text-4xl mb-3">😔</p>
            <p className="text-sm font-medium">审核未通过</p>
            {status?.merchant_apply?.remark ? (
              <p className="text-[11px] text-red-500 mt-2">原因: {status.merchant_apply.remark}</p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-2">请联系平台获取详情</p>
            )}
            <p className="text-[10px] text-gray-300 mt-2">可修改信息后重新提交</p>
            <button onClick={() => setStep("form")}
              className="mt-4 px-5 py-2 rounded-[8px] text-white text-sm" style={{background:C.coral}}>重新提交</button>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ──
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
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.coral}}>📋 商户信息</h2>
          <Field label="商户名称" value={form.merchant_name} onChange={v => setForm(f=>({...f,merchant_name:v}))} placeholder="如：老王烧烤店" />
          <Field label="联系人" value={form.contact_name} onChange={v => setForm(f=>({...f,contact_name:v}))} placeholder="联系人姓名" />
          <Field label="手机号" value={form.mobile} onChange={v => setForm(f=>({...f,mobile:v}))} placeholder="手机号码" type="tel" />
        </div>

        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.teal}}>📍 区域信息</h2>
          <Cascader
            value={{ province: form.province, city: form.city, district: form.district }}
            onChange={({ province, city, district }) => setForm(f => ({...f, province, city, district }))}
          />
        </div>

        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <h2 className="text-[12px] font-medium mb-3" style={{color:C.gold}}>🏪 门店信息（可选）</h2>
          <Field label="门店名称" value={form.store_name} onChange={v => setForm(f=>({...f,store_name:v}))} placeholder="如：山房烤肉·科技园店" />
          <Field label="门店地址" value={form.address} onChange={v => setForm(f=>({...f,address:v}))} placeholder="详细地址" />
          {/* 📍 门店定位 */}
          <div className="mt-3">
            <label className="text-[10px] text-gray-400 block mb-1.5">📍 门店定位（用于导航到店，可选）</label>
            <div className="flex gap-2">
              <button onClick={() => {
                if (!navigator.geolocation) return;
                setLocating(true);
                navigator.geolocation.getCurrentPosition(
                  (pos) => { setForm(f=>({...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString()})); setLocating(false); },
                  () => { setLocating(false); },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              }} disabled={locating}
                className="flex-1 py-1.5 rounded-[8px] text-[10px] font-medium text-white"
                style={{background: locating ? "#999" : C.teal}}>
                {locating ? "定位中..." : "📍 当前位置"}
              </button>
              <button onClick={async () => {
                if (!form.address) return;
                setLocating(true);
                try {
                  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}&limit=1&countrycodes=cn`);
                  const j = await r.json();
                  if (j.length > 0) setForm(f=>({...f, latitude: j[0].lat, longitude: j[0].lon}));
                } catch {}
                setLocating(false);
              }} disabled={locating}
                className="flex-1 py-1.5 rounded-[8px] text-[10px] font-medium"
                style={{backgroundColor: `${C.purple}10`, color: C.purple}}>
                📌 地址定位
              </button>
            </div>
            {form.latitude && form.longitude ? (
              <div className="text-[9px] text-green-600 mt-1">✅ 已定位 ({parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)})</div>
            ) : (
              <div className="text-[9px] text-gray-300 mt-1">可选，设置后顾客可直接导航到店</div>
            )}
          </div>
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

/** 省市区三级联动选择器 */
function Cascader({ value, onChange }: {
  value: { province: string; city: string; district: string };
  onChange: (v: { province: string; city: string; district: string }) => void;
}) {
  const provinces = Object.keys(regions).sort();
  const cities = value.province ? Object.keys(regions[value.province]).sort() : [];
  const districts = value.city && value.province ? (regions[value.province][value.city] || []) : [];

  const selClass = "w-full text-[13px] px-3 py-2.5 rounded-[8px] border border-gray-200 bg-gray-50 outline-none focus:border-[#45CCD5] transition-colors appearance-none";

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 block mb-1">省份</label>
          <select value={value.province} onChange={e => onChange({ province: e.target.value, city: "", district: "" })}
            className={selClass}>
            <option value="">请选择省份</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-gray-400 block mb-1">城市</label>
          <select value={value.city} onChange={e => onChange({ ...value, city: e.target.value, district: "" })}
            className={selClass} disabled={!value.province}>
            <option value="">请选择城市</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-gray-400 block mb-1">区/县</label>
        <select value={value.district} onChange={e => onChange({ ...value, district: e.target.value })}
          className={selClass} disabled={!value.city}>
          <option value="">请选择区/县</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
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
