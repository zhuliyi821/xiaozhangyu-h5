"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchant } from "@/lib/merchant-context";
import { C } from "@/lib/brand-colors";
import LocationPicker from "@/components/merchant/location-picker";


export default function MerchantSettingsPage() {
  const { user, loading } = useAuth();
  const { stores, activeStoreId } = useMerchant();
  const [showLogin, setShowLogin] = useState(false);
  const [operating, setOperating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showEditInfo, setShowEditInfo] = useState(false);

  // 可编辑信息
  const [info, setInfo] = useState({ store_name: "", address: "", phone: "", intro: "", latitude: "", longitude: "" });
  const [editInfo, setEditInfo] = useState({ store_name: "", address: "", phone: "", intro: "", latitude: "", longitude: "" });
  const [locating, setLocating] = useState(false);

  // 当前门店
  const currentStore = stores.find(s => s.store_id === activeStoreId) || stores[0] || null;

  useEffect(() => {
    if (!user || !currentStore) return;
    setOperating(currentStore.operating_state === 1);
    setInfo({ store_name: currentStore.store_name || "", address: currentStore.address || "", phone: currentStore.phone || "", intro: currentStore.intro || "", latitude: currentStore.latitude || "", longitude: currentStore.longitude || "" });
  }, [user, currentStore]);

  const toggleOperating = async () => {
    if (!activeStoreId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/v2/merchant/store-status?store_id=${activeStoreId}&status=${operating ? 0 : 1}`, { method: "PUT" });
      const d = await r.json();
      if (d.code === 0) { setOperating(!operating); setMsg("✅ 营业状态已更新"); }
      else { setMsg("❌ 更新失败"); }
    } catch { setMsg("❌ 网络错误"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const saveInfo = async () => {
    if (!activeStoreId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/v2/merchant/store-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: activeStoreId, ...editInfo }),
      });
      const d = await r.json();
      if (d.code === 0) { setInfo({ ...editInfo }); setShowEditInfo(false); setMsg("✅ 信息已保存"); }
      else { setMsg("❌ 保存失败"); }
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
        <p className="text-[10px] text-gray-400 mt-1 ml-8">营业状态 · 基础信息 · 店员管理</p>
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
            <button onClick={toggleOperating} disabled={saving || !activeStoreId}
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

      {/* 基础信息（可编辑） */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.purple}15`}}>
                <span className="text-base">ℹ️</span>
              </div>
              <div>
                <div className="text-[13px] font-medium">基础信息</div>
                <div className="text-[10px] text-gray-400">门店名称 · 地址 · 联系方式</div>
              </div>
            </div>
            <button onClick={() => { setEditInfo({ ...info }); setShowEditInfo(true); }}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer active:scale-90 transition-all"
              style={{backgroundColor: `${C.teal}12`, color: C.teal}}>
              编辑
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">门店名称</span>
              <span className="font-medium">{info.store_name || "—"}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">门店地址</span>
              <span className="font-medium text-right max-w-[200px] truncate">{info.address || "—"}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">📍 导航定位</span>
              <span className={`font-medium ${info.latitude ? 'text-green-600' : 'text-amber-600'}`}>
                {info.latitude ? `已定位 (${parseFloat(info.latitude).toFixed(4)}, ${parseFloat(info.longitude).toFixed(4)})` : "⚠️ 未设置"}
              </span>
            </div>
            {info.latitude && (
              <div className="mt-1">
                <LocationPicker
                  latitude={info.latitude}
                  longitude={info.longitude}
                  storeName={info.store_name}
                  height={140}
                />
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">联系电话</span>
              <span className="font-medium">{info.phone || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 店员管理 → 快捷跳转至员工管理 */}
      <div className="mx-4 mt-3">
        <div onClick={() => window.location.href = "/merchant/staff"}
          className="bg-white rounded-[10px] p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.gold}15`}}>
              <span className="text-base">👥</span>
            </div>
            <div>
              <div className="text-[13px] font-medium">员工管理</div>
              <div className="text-[10px] text-gray-400">添加 · 编辑 · 权限管理 →</div>
            </div>
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
            <button onClick={() => window.location.href = "/merchant/decoration"}
              className="text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer active:scale-90 transition-all"
              style={{backgroundColor: `${C.teal}12`, color: C.teal}}>
              去装修
            </button>
          </div>
        </div>
      </div>

      {/* 编辑信息弹窗 */}
      {showEditInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEditInfo(false)}>
          <div className="bg-white rounded-[12px] w-full max-w-[360px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4">编辑基础信息</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">门店名称</label>
                <input value={editInfo.store_name} onChange={e => setEditInfo(p => ({ ...p, store_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5]" placeholder="输入门店名称" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">门店地址</label>
                <input value={editInfo.address} onChange={e => setEditInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5]" placeholder="输入门店地址" />
              </div>
              {/* 门店定位 */}
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">📍 门店定位</label>
                <div className="flex flex-col gap-2">
                  {/* 交互地图 */}
                  <LocationPicker
                    latitude={editInfo.latitude || "39.9042"}
                    longitude={editInfo.longitude || "116.4074"}
                    storeName={editInfo.store_name}
                    onLocationChange={(lat, lng) => setEditInfo(p => ({ ...p, latitude: lat, longitude: lng }))}
                    interactive
                    height={220}
                  />
                  {/* 第1行：定位按钮 */}
                  <div className="flex gap-2">
                    <button onClick={() => {
                      if (!navigator.geolocation) { setMsg("❌ 浏览器不支持定位"); return; }
                      setLocating(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setEditInfo(p => ({ ...p, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() }));
                          setLocating(false);
                          setMsg("✅ 定位成功");
                          setTimeout(() => setMsg(""), 2000);
                        },
                        () => { setLocating(false); setMsg("❌ 定位失败，请检查GPS权限"); setTimeout(() => setMsg(""), 3000); },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }} disabled={locating}
                      className="flex-1 py-2 rounded-[8px] text-[11px] font-medium text-white active:scale-95 transition-all"
                      style={{background: locating ? "#999" : C.teal}}>
                      {locating ? "📍 定位中..." : "📍 获取当前位置"}
                    </button>
                    {editInfo.latitude && editInfo.longitude && (
                      <a href={`https://uri.amap.com/marker?position=${editInfo.longitude},${editInfo.latitude}&name=${encodeURIComponent(editInfo.store_name || "我的门店")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3 py-2 rounded-[8px] text-[11px] font-medium text-center"
                        style={{backgroundColor: `${C.gold}20`, color: "#B8860B"}}>
                        查看地图
                      </a>
                    )}
                  </div>
                  {/* 第2行：根据地址自动定位 */}
                  <button onClick={async () => {
                    if (!editInfo.address) { setMsg("❌ 请先输入门店地址"); setTimeout(() => setMsg(""), 2000); return; }
                    setLocating(true);
                    try {
                      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editInfo.address)}&limit=1&countrycodes=cn`);
                      const j = await r.json();
                      if (j.length > 0) {
                        setEditInfo(p => ({ ...p, latitude: j[0].lat, longitude: j[0].lon }));
                        setMsg("✅ 地址定位成功");
                      } else {
                        setMsg("❌ 未找到该地址，请手动定位");
                      }
                    } catch { setMsg("❌ 定位服务异常"); }
                    setLocating(false);
                    setTimeout(() => setMsg(""), 2000);
                  }} disabled={locating}
                    className="w-full py-1.5 rounded-[8px] text-[10px] font-medium text-center"
                    style={{backgroundColor: `${C.purple}10`, color: C.purple}}>
                    {locating ? "⏳ 解析地址中..." : "🔍 根据输入地址自动定位"}
                  </button>
                </div>
                {editInfo.latitude && editInfo.longitude ? (
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-green-600">
                    <span>✅ 已定位</span>
                    <span className="text-gray-400">{parseFloat(editInfo.latitude).toFixed(4)}, {parseFloat(editInfo.longitude).toFixed(4)}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-600 mt-1">⚠️ 未设置位置，顾客将无法导航到店</div>
                )}
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">联系电话</label>
                <input value={editInfo.phone} onChange={e => setEditInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5]" placeholder="输入联系电话" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">门店简介</label>
                <textarea value={editInfo.intro} onChange={e => setEditInfo(p => ({ ...p, intro: e.target.value }))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5] resize-none h-20" placeholder="输入门店简介" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowEditInfo(false)} className="flex-1 py-2.5 rounded-[8px] bg-gray-100 text-[12px] font-medium">取消</button>
              <button onClick={saveInfo} disabled={saving}
                className="flex-1 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95 transition-transform"
                style={{background: C.teal}}>{saving ? "保存中..." : "保存"}</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
