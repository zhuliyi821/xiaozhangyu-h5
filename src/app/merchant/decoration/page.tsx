"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { API_BASE } from "@/config/api";
import { C } from "@/lib/brand-colors";

const COLORS = ["#F27152","#45CCD5","#F2B631","#8B5CF6","#10B981","#3B82F6","#E85D3A","#6BA3A3"];

export default function DecorationPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [sid, setSid] = useState(0);
  const [themeColor, setThemeColor] = useState("#45CCD5");
  const [modules, setModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data.stores?.length > 0) {
          const id = d.data.stores[0].id;
          setSid(id);
          return id;
        }
      })
      .then(id => {
        if (!id) return;
        fetch(`${API_BASE}/plugins/api-store-decoration.php?api=decoration&store_id=${id}`)
          .then(r => r.json())
          .then(j => {
            if (j.code === 0) {
              setThemeColor(j.data.theme_color || "#45CCD5");
              setModules(j.data.modules || []);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [user]);

  const toggleModule = (type: string) => {
    setModules(prev => prev.map(m =>
      m.type === type ? { ...m, enabled: m.enabled === false } : m
    ));
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/plugins/api-store-decoration.php?api=save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: sid, theme_color: themeColor, modules, status: 1 }),
      });
      const d = await r.json();
      if (d.code === 0) setMsg("✅ 装修配置已保存");
      else setMsg("❌ 保存失败");
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
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店装修</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">装修门店聚合详情页展示效果</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

      {/* 品牌色 */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[13px] font-medium">品牌主题色</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-200" style={{backgroundColor: themeColor}} />
              <span className="text-[10px] text-gray-400 font-mono">{themeColor}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map(c => (
              <div key={c} onClick={() => setThemeColor(c)}
                className={`w-7 h-7 rounded-full cursor-pointer active:scale-90 transition-all ${themeColor === c ? "ring-2 ring-offset-2" : "border border-gray-100"}`}
                style={{backgroundColor: c}} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-gray-400">自定义:</span>
            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent" />
          </div>
        </div>
      </div>

      {/* 模块列表 */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[13px] font-medium mb-3">展示模块</div>
          <div className="space-y-2">
            {[
              { type: "banner", icon: "🖼️", label: "轮播图", desc: "展示门店形象图片" },
              { type: "coupon", icon: "🎫", label: "优惠券", desc: "展示可领取优惠券" },
              { type: "notice", icon: "📢", label: "公告", desc: "展示门店公告信息" },
              { type: "product-grid", icon: "📦", label: "商品推荐", desc: "展示精选推荐商品" },
              { type: "store-intro", icon: "📝", label: "门店介绍", desc: "展示门店详细描述" },
            ].map(t => {
              const mod = modules.find((m:any) => m.type === t.type);
              const enabled = mod ? mod.enabled !== false : true;
              return (
                <div key={t.type} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-base" style={{backgroundColor: `${enabled ? themeColor : "#ccc"}15`}}>
                      {t.icon}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium">{t.label}</div>
                      <div className="text-[9px] text-gray-400">{t.desc}</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enabled} onChange={() => toggleModule(t.type)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                      style={{backgroundColor: enabled ? themeColor : undefined}} />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="mx-4 mt-4">
        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-[10px] text-sm font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
          style={{background: themeColor}}>
          {saving ? "保存中..." : "💾 保存装修配置"}
        </button>
      </div>

      {/* Preview */}
      {sid > 0 && (
        <div className="mx-4 mt-3">
          <div onClick={() => window.open(`/store/${sid}`, "_blank")}
            className="bg-white rounded-[10px] p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.97] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${themeColor}15`}}>
                <span className="text-base">👁️</span>
              </div>
              <div>
                <div className="text-[13px] font-medium">预览门店详情页</div>
                <div className="text-[10px] text-gray-400">新标签页打开</div>
              </div>
            </div>
            <span className="text-lg">→</span>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
