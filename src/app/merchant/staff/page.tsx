"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { C } from "@/lib/brand-colors";


export default function StaffPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [staff, setStaff] = useState<any[]>([
    { id: 1, name: "店主", role: "owner", phone: "-", status: "active", desc: "全部权限" },
  ]);
  const [newStaff, setNewStaff] = useState({ name: "", phone: "", role: "staff" });

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/staff?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setStaff(d.data || []); })
      .catch(() => {});
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>店员管理</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">添加 · 编辑 · 权限管理</p>
          </div>
          <div onClick={() => setShowAdd(true)} className="text-[11px] font-medium px-3 py-1.5 rounded-full text-white active:scale-90 transition-transform cursor-pointer" style={{background: C.coral}}>
            + 添加
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 space-y-2">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{backgroundColor: s.role === "owner" ? C.gold : C.teal}}>
              {s.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{s.name}</span>
                {s.role === "owner" && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{backgroundColor: `${C.gold}15`, color: C.gold}}>店主</span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.phone || s.desc || "-"}</div>
            </div>
            <span className={`text-[10px] ${s.status === "active" ? "text-[#10B981]" : "text-gray-300"}`}>
              {s.status === "active" ? "正常" : "已禁用"}
            </span>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[13px] font-medium mb-2">权限说明</div>
          <div className="text-[10px] text-gray-400 space-y-1.5">
            <p>👑 <strong>店主</strong> — 全部权限，不可编辑</p>
            <p>🔧 <strong>管理员</strong> — 商品管理、订单查看、装修配置</p>
            <p>🔍 <strong>店员</strong> — 仅查看订单和营业数据</p>
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setNewStaff({ name: "", phone: "", role: "staff" }); }}>
          <div className="bg-white rounded-[12px] w-full max-w-[320px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4">添加店员</h3>
            <div className="space-y-3">
              <input value={newStaff.name} onChange={e => setNewStaff(p => ({...p, name: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-brand-teal" placeholder="店员姓名" />
              <input value={newStaff.phone} onChange={e => setNewStaff(p => ({...p, phone: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-brand-teal" placeholder="手机号" type="tel" />
              <select value={newStaff.role} onChange={e => setNewStaff(p => ({...p, role: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-brand-teal appearance-none bg-white">
                <option value="admin">管理员</option>
                <option value="staff">店员</option>
              </select>
              <button onClick={() => {
                if (!newStaff.name || !newStaff.phone) return;
                setStaff(p => [...p, { id: Date.now(), name: newStaff.name, phone: newStaff.phone, role: newStaff.role, status: "active", desc: newStaff.role === "admin" ? "商品/订单/装修" : "仅订单查看" }]);
                setShowAdd(false);
                setNewStaff({ name: "", phone: "", role: "staff" });
              }} className="w-full py-2.5 rounded-[8px] text-[12px] font-medium text-white active:scale-95 transition-transform" style={{background: C.coral}}>
                确认添加
              </button>
            </div>
            <button onClick={() => { setShowAdd(false); setNewStaff({ name: "", phone: "", role: "staff" }); }}
              className="w-full mt-2 py-2 rounded-[8px] text-[11px] text-gray-400 active:scale-95 transition-transform">
              取消
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
