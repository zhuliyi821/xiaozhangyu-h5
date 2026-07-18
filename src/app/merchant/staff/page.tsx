"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchant } from "@/lib/merchant-context";
import { C } from "@/lib/brand-colors";


export default function StaffPage() {
  const { user, loading } = useAuth();
  const { activeStoreId } = useMerchant();
  const [showLogin, setShowLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);  // staff object or null
  const [showDelete, setShowDelete] = useState<any>(null); // staff object or null
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ name: "", phone: "", role: "staff" });
  const [editStaff, setEditStaff] = useState({ name: "", phone: "", role: "staff" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  // 加载店员列表
  const loadStaff = () => {
    if (!user) return;
    fetch(`/api/v2/merchant/staff?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0 && Array.isArray(d.data)) setStaff(d.data); })
      .catch(() => showMsg("❌ 加载失败"));
  };

  useEffect(() => {
    loadStaff();
  }, [user]);

  // 添加店员
  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone) { showMsg("❌ 请填写完整信息"); return; }
    if (!activeStoreId) { showMsg("❌ 请先选择门店"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/v2/merchant/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: activeStoreId,
          member_id: user?.uid,
          name: newStaff.name,
          mobile: newStaff.phone,
          role: newStaff.role,
        }),
      });
      const d = await r.json();
      if (d.code === 0) {
        showMsg("✅ 店员添加成功");
        setShowAdd(false);
        setNewStaff({ name: "", phone: "", role: "staff" });
        loadStaff();
      } else {
        showMsg(`❌ ${d.msg || "添加失败"}`);
      }
    } catch { showMsg("❌ 网络错误"); }
    setSaving(false);
  };

  // 编辑店员
  const handleEditStaff = async () => {
    if (!showEdit) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/v2/merchant/staff/${showEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStaff),
      });
      const d = await r.json();
      if (d.code === 0) {
        showMsg("✅ 更新成功");
        setShowEdit(null);
        loadStaff();
      } else {
        showMsg(`❌ ${d.msg || "更新失败"}`);
      }
    } catch { showMsg("❌ 网络错误"); }
    setSaving(false);
  };

  // 删除店员
  const handleDeleteStaff = async () => {
    if (!showDelete) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/v2/merchant/staff/${showDelete.id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.code === 0) {
        showMsg("✅ 删除成功");
        setShowDelete(null);
        loadStaff();
      } else {
        showMsg(`❌ ${d.msg || "删除失败"}`);
      }
    } catch { showMsg("❌ 网络错误"); }
    setSaving(false);
  };

  const roleLabel = (r: string) => ({ admin: "管理员", staff: "店员", operator: "操作员", owner: "店主" }[r] || r);
  const roleDesc = (r: string) => ({
    owner: "全部权限",
    admin: "商品/订单/装修",
    staff: "仅查看订单",
    operator: "订单处理",
  }[r] || "仅查看");

  if (loading) return <div className="h-screen flex items-center justify-center" style={{backgroundColor: C.pageBg}}><div className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full" style={{borderColor: C.coral, borderTopColor: "transparent"}} /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      {/* 顶栏 */}
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

      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

      {/* 店员列表 */}
      <div className="mx-4 mt-4 space-y-2">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-[10px] p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{backgroundColor: s.role === "owner" ? C.gold : C.teal}}>
                {(s.name || "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{s.name || `店员#${s.id}`}</span>
                  {s.role && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{backgroundColor: s.role === "owner" ? `${C.gold}15` : `${C.teal}15`, color: s.role === "owner" ? C.gold : C.teal}}>
                      {roleLabel(s.role)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{s.mobile || roleDesc(s.role)}</div>
              </div>
              <span className="text-[10px]" style={{color: s.status === "active" ? C.green : "#999"}}>
                {s.status === "active" ? "正常" : "禁用"}
              </span>
            </div>
            {s.role !== "owner" && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                <button onClick={() => { setEditStaff({ name: s.name || "", phone: s.mobile || "", role: s.role || "staff" }); setShowEdit(s); }}
                  className="flex-1 py-1.5 rounded-[6px] text-[10px] font-medium active:scale-95 transition-transform"
                  style={{backgroundColor: `${C.teal}10`, color: C.teal}}>
                  ✏️ 编辑
                </button>
                <button onClick={() => setShowDelete(s)}
                  className="flex-1 py-1.5 rounded-[6px] text-[10px] font-medium active:scale-95 transition-transform"
                  style={{backgroundColor: "#FEE2E2", color: "#DC2626"}}>
                  🗑️ 删除
                </button>
              </div>
            )}
          </div>
        ))}
        {staff.length === 0 && (
          <div className="text-center py-10 text-gray-300 text-[12px]">暂无店员，点击右上角添加</div>
        )}
      </div>

      {/* 权限说明 */}
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

      {/* 添加弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); setNewStaff({ name: "", phone: "", role: "staff" }); }}>
          <div className="bg-white rounded-[12px] w-full max-w-[320px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4">添加店员</h3>
            <div className="space-y-3">
              <input value={newStaff.name} onChange={e => setNewStaff(p => ({...p, name: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none" placeholder="店员姓名" />
              <input value={newStaff.phone} onChange={e => setNewStaff(p => ({...p, phone: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none" placeholder="手机号" type="tel" />
              <select value={newStaff.role} onChange={e => setNewStaff(p => ({...p, role: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-[8px] border border-gray-200 text-[13px] outline-none appearance-none bg-white">
                <option value="admin">管理员</option>
                <option value="staff">店员</option>
              </select>
              <button onClick={handleAddStaff} disabled={saving}
                className="w-full py-2.5 rounded-[8px] text-[12px] font-medium text-white active:scale-95 transition-transform"
                style={{background: saving ? "#999" : C.coral}}>
                {saving ? "添加中..." : "确认添加"}
              </button>
            </div>
            <button onClick={() => { setShowAdd(false); setNewStaff({ name: "", phone: "", role: "staff" }); }}
              className="w-full mt-2 py-2 rounded-[8px] text-[11px] text-gray-400 active:scale-95 transition-transform">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEdit(null)}>
          <div className="bg-white rounded-[12px] w-full max-w-[320px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4">编辑店员</h3>
            <div className="space-y-3">
              <input value={editStaff.name} onChange={e => setEditStaff(p => ({...p, name: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none" placeholder="店员姓名" />
              <input value={editStaff.phone} onChange={e => setEditStaff(p => ({...p, phone: e.target.value}))}
                className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none" placeholder="手机号" type="tel" />
              <select value={editStaff.role} onChange={e => setEditStaff(p => ({...p, role: e.target.value}))}
                className="w-full px-3 py-2.5 rounded-[8px] border border-gray-200 text-[13px] outline-none appearance-none bg-white">
                <option value="admin">管理员</option>
                <option value="staff">店员</option>
                <option value="operator">操作员</option>
              </select>
              <button onClick={handleEditStaff} disabled={saving}
                className="w-full py-2.5 rounded-[8px] text-[12px] font-medium text-white active:scale-95 transition-transform"
                style={{background: saving ? "#999" : C.teal}}>
                {saving ? "保存中..." : "保存修改"}
              </button>
            </div>
            <button onClick={() => setShowEdit(null)}
              className="w-full mt-2 py-2 rounded-[8px] text-[11px] text-gray-400 active:scale-95 transition-transform">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowDelete(null)}>
          <div className="bg-white rounded-[12px] w-full max-w-[300px] p-5 shadow-xl text-center" onClick={e => e.stopPropagation()}>
            <div className="text-2xl mb-3">⚠️</div>
            <h3 className="text-[14px] font-semibold mb-2">确认删除</h3>
            <p className="text-[11px] text-gray-400 mb-4">确定移除店员 <strong>{showDelete.name}</strong> 吗？此操作不可撤销。</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(null)}
                className="flex-1 py-2.5 rounded-[8px] bg-gray-100 text-[12px] font-medium active:scale-95 transition-transform">
                取消
              </button>
              <button onClick={handleDeleteStaff} disabled={saving}
                className="flex-1 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95 transition-transform"
                style={{background: saving ? "#999" : "#DC2626"}}>
                {saving ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
