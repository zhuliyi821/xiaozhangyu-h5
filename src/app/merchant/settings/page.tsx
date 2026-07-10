"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA", green: "#10B981" };

export default function MerchantSettingsPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [operating, setOperating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          setOperating(d.data.stores[0].operating_state === 1);
        }
      })
      .catch(() => {});
  }, [user]);

  const toggleOperating = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/v2/merchant/store-status?store_id=10001&status=${operating ? 0 : 1}`, { method: "PUT" });
      const d = await r.json();
      if (d.code === 0) {
        setOperating(!operating);
        setMsg("✅ 营业状态已更新");
      } else {
        setMsg("❌ 更新失败");
      }
    } catch { setMsg("❌ 网络错误"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店设置</h1>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 ml-8">营业状态 · 装修配置 · 店员管理</p>
      </div>

      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

      {/* 营业状态 */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">营业状态</div>
              <div className="text-[10px] text-gray-400 mt-0.5">控制门店在聚合页的显示状态</div>
            </div>
            <button onClick={toggleOperating} disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-all ${operating ? "bg-[#10B981]" : "bg-gray-200"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${operating ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${operating ? "bg-[#10B981]" : "bg-gray-300"}`} />
            <span className="text-[11px]" style={{color: operating ? "#10B981" : "#999"}}>
              {operating ? "营业中 · 顾客可在聚合页找到您的门店" : "未营业 · 门店暂不对顾客展示"}
            </span>
          </div>
        </div>
      </div>

      {/* 装修配置 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.teal}15`}}>
                <span className="text-base">🎨</span>
              </div>
              <div>
                <div className="text-[13px] font-medium">装修配置</div>
                <div className="text-[10px] text-gray-400">门店详情页 · 轮播图 · 优惠券</div>
              </div>
            </div>
            <div onClick={() => window.location.href = "/merchant/decoration"}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer active:scale-90 transition-all"
              style={{backgroundColor: `${C.teal}12`, color: C.teal}}>
              去装修
            </div>
          </div>
        </div>
      </div>

      {/* 店员管理 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.gold}15`}}>
              <span className="text-base">👥</span>
            </div>
            <div>
              <div className="text-[13px] font-medium">店员管理</div>
              <div className="text-[10px] text-gray-400">添加 · 编辑 · 权限管理</div>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 border-t border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium">店</div>
              <div>
                <div className="text-[12px] font-medium">店主</div>
                <div className="text-[9px] text-gray-400">全部权限</div>
              </div>
            </div>
            <span className="text-[10px] text-gray-300">不可编辑</span>
          </div>
          <div onClick={() => window.location.href = "/merchant/staff"}
            className="mt-2 py-2.5 rounded-[8px] text-center text-[11px] font-medium active:scale-[0.97] transition-transform cursor-pointer"
            style={{backgroundColor: `${C.coral}10`, color: C.coral}}>
            + 添加店员
          </div>
        </div>
      </div>

      {/* 基础信息 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.purple}15`}}>
              <span className="text-base">ℹ️</span>
            </div>
            <div>
              <div className="text-[13px] font-medium">基础信息</div>
              <div className="text-[10px] text-gray-400">门店名称 · 地址 · 联系方式</div>
            </div>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">门店名称</span>
              <span className="font-medium">—</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">门店地址</span>
              <span className="font-medium">—</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">联系电话</span>
              <span className="font-medium">—</span>
            </div>
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
