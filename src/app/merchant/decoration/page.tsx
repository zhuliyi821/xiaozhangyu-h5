"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchant } from "@/lib/merchant-context";
import { API_BASE } from "@/config/api";
import { C } from "@/lib/brand-colors";

const COLORS = ["#F27152","#45CCD5","#F2B631","#8B5CF6","#10B981","#3B82F6","#E85D3A","#6BA3A3"];

interface ModuleDef { type: string; icon: string; label: string; desc: string; hasConfig: boolean; }

const MODULE_DEFS: ModuleDef[] = [
  { type: "banner", icon: "🖼️", label: "轮播图", desc: "展示门店形象图片", hasConfig: true },
  { type: "coupon", icon: "🎫", label: "优惠券", desc: "展示可领取优惠券", hasConfig: true },
  { type: "notice", icon: "📢", label: "公告", desc: "展示门店公告信息", hasConfig: true },
  { type: "product-grid", icon: "📦", label: "商品推荐", desc: "展示精选推荐商品", hasConfig: true },
  { type: "store-intro", icon: "📝", label: "门店介绍", desc: "展示门店详细描述", hasConfig: true },
];

/** 配置弹窗组件 */
function ConfigModal({ mod, onSave, onClose, themeColor }: {
  mod: any; onSave: (updated: any) => void; onClose: () => void; themeColor: string;
}) {
  const [form, setForm] = useState<any>(mod.config || {});
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(`${API_BASE}/plugins/api-store-decoration.php?api=upload`, {
          method: "POST", body: fd,
        });
        const d = await r.json();
        if (d.code === 0) {
          const imgs = [...(form.images || []), d.data.url];
          setForm({ ...form, images: imgs });
        }
      } catch {}
      setUploading(false);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="bg-white rounded-t-[16px] sm:rounded-[16px] w-full max-w-sm p-5 max-h-[70vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">配置: {MODULE_DEFS.find(m => m.type === mod.type)?.label || mod.type}</div>
          <button onClick={onClose} className="text-gray-400 text-lg">✕</button>
        </div>

        {/* Banner配置 */}
        {mod.type === "banner" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-gray-500">轮播图片 ({form.images?.length || 0}张)</div>
              <button onClick={uploadFile} disabled={uploading}
                className="text-[10px] px-3 py-1.5 rounded-full text-white font-medium"
                style={{background: themeColor}}>
                {uploading ? "上传中..." : "上传图片"}
              </button>
            </div>
            {form.images?.map((url: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-[8px] p-2">
                <img src={url} alt="" className="w-10 h-10 rounded-[6px] object-cover bg-gray-100" />
                <span className="text-[10px] text-gray-500 flex-1 truncate">{url.split("/").pop()}</span>
                <button onClick={() => setForm({...form, images: form.images.filter((_:any, j:number) => j !== i)})}
                  className="text-red-400 text-xs">删除</button>
              </div>
            ))}
            {(!form.images || form.images.length === 0) && (
              <p className="text-[10px] text-gray-300 text-center py-4">点击上方按钮上传图片</p>
            )}
          </div>
        )}

        {/* 优惠券配置 */}
        {mod.type === "coupon" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">标题</label>
              <input value={form.title || ""} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]" placeholder="领优惠券" />
            </div>
            {form.coupons?.map((c: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-[8px] p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-medium">优惠券 #{i+1}</span>
                  <button onClick={() => setForm({...form, coupons: form.coupons.filter((_:any, j:number) => j !== i)})}
                    className="text-[10px] text-red-400">删除</button>
                </div>
                <input value={c.discount || ""} onChange={e => { const nc = [...form.coupons]; nc[i] = {...nc[i], discount: e.target.value}; setForm({...form, coupons: nc}); }}
                  className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]" placeholder="面额 如 ¥5" />
                <input value={c.label || ""} onChange={e => { const nc = [...form.coupons]; nc[i] = {...nc[i], label: e.target.value}; setForm({...form, coupons: nc}); }}
                  className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]" placeholder="描述 如 满减优惠券" />
                <input value={c.condition || ""} onChange={e => { const nc = [...form.coupons]; nc[i] = {...nc[i], condition: e.target.value}; setForm({...form, coupons: nc}); }}
                  className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]" placeholder="条件 如 满50元可用" />
              </div>
            ))}
            <button onClick={() => setForm({...form, coupons: [...(form.coupons||[]), {discount:"",label:"",condition:""}]})}
              className="w-full py-2 rounded-[8px] text-[11px] font-medium text-gray-500 border border-dashed border-gray-300">
              + 添加优惠券
            </button>
          </div>
        )}

        {/* 公告配置 */}
        {mod.type === "notice" && (
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">公告内容</label>
            <textarea value={form.text || ""} onChange={e => setForm({...form, text: e.target.value})}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px] h-24" placeholder="输入公告内容..." />
          </div>
        )}

        {/* 商品推荐配置 */}
        {mod.type === "product-grid" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">标题</label>
              <input value={form.title || ""} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]" placeholder="商品推荐" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">列数</label>
              <select value={form.columns || 2} onChange={e => setForm({...form, columns: parseInt(e.target.value)})}
                className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px]">
                <option value={2}>2列</option>
                <option value={3}>3列</option>
              </select>
            </div>
            <p className="text-[10px] text-gray-300">商品将自动从门店商品列表选取</p>
          </div>
        )}

        {/* 门店介绍配置 */}
        {mod.type === "store-intro" && (
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">介绍内容</label>
            <textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full rounded-[8px] border border-gray-200 px-3 py-2 text-[12px] h-32" placeholder="输入门店介绍..." />
          </div>
        )}

        <button onClick={() => onSave({...mod, config: form})}
          className="w-full mt-4 py-2.5 rounded-[10px] text-xs font-bold text-white"
          style={{background: themeColor}}>
          确认
        </button>
      </div>
    </div>
  );
}

export default function DecorationPage() {
  const { user, loading } = useAuth();
  const { stores: merchantStores, currentStore, setActiveStore } = useMerchant();
  const [showLogin, setShowLogin] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [themeColor, setThemeColor] = useState("#45CCD5");
  const [modules, setModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [configMod, setConfigMod] = useState<any>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 从全局 context 获取当前门店 ID（同步）
  const sid = currentStore?.store_id ?? 0;

  // 当门店切换时加载装修
  useEffect(() => {
    if (sid && user) {
      setStoreName(currentStore?.store_name || "");
      loadDecoration(sid);
    }
  }, [sid, user]);

  const loadDecoration = async (storeId: number) => {
    try {
      const r = await fetch(`${API_BASE}/plugins/api-store-decoration.php?api=decoration&store_id=${storeId}`);
      const j = await r.json();
      if (j.code === 0) {
        setThemeColor(j.data.theme_color || "#45CCD5");
        setModules(j.data.modules || []);
      }
    } catch {}
  };

  const switchStore = (id: number, name: string) => {
    setActiveStore(id);
    setStoreName(name);
    loadDecoration(id);
  };

  const moveMod = (from: number, to: number) => {
    if (to < 0 || to >= modules.length) return;
    const arr = [...modules];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setModules(arr.map((m, i) => ({ ...m, sort_order: i + 1 })));
  };

  const toggleModule = (type: string) => {
    setModules(prev => prev.map(m =>
      m.type === type ? { ...m, enabled: m.enabled === false } : m
    ));
  };

  const updateModuleConfig = (updated: any) => {
    setModules(prev => prev.map(m =>
      m.id === updated.id ? updated : m
    ));
    setConfigMod(null);
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
            <p className="text-[10px] text-gray-400 mt-0.5">{storeName ? `装修: ${storeName}` : "装修门店聚合详情页展示效果"}</p>
          </div>
        </div>
      </div>

      {/* 多门店切换 */}
      {merchantStores.length > 1 && (
        <div className="mx-4 mt-3">
          <div className="bg-white rounded-[10px] p-3 shadow-sm">
            <div className="text-[10px] text-gray-400 mb-2">选择门店</div>
            <div className="flex flex-wrap gap-1.5">
              {merchantStores.map(s => (
                <button key={s.store_id} onClick={() => switchStore(s.store_id, s.store_name || "")}
                  className={`text-[10px] px-2.5 py-1.5 rounded-full font-medium transition-all ${
                    sid === s.store_id ? "text-white" : "text-gray-500 bg-gray-100"
                  }`} style={sid === s.store_id ? {background: themeColor} : {}}>
                  📍 {s.store_name || `门店#${s.store_id}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

      {/* 实时预览（可折叠） */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
          <div onClick={() => setShowPreview(!showPreview)}
            className="flex items-center justify-between p-3 cursor-pointer active:bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-base">👁️</span>
              <span className="text-[12px] font-medium">实时预览</span>
            </div>
            <span className={`text-[10px] text-gray-400 transition-transform ${showPreview ? "rotate-180" : ""}`}>▾</span>
          </div>
          {showPreview && (
            <div className="px-4 pb-4">
              <div className="bg-gray-100 rounded-[16px] p-2 max-w-[200px] mx-auto">
                <div className="bg-white rounded-[14px] overflow-hidden shadow-sm">
                  {/* 状态栏 */}
                  <div className="h-4 flex items-center justify-center" style={{background: themeColor}}>
                    <span className="text-[6px] text-white font-medium">公众号</span>
                  </div>
                  {/* 封面 */}
                  <div className="h-20 flex items-center justify-center" style={{background: `${themeColor}10`}}>
                    <div className="text-center">
                      <span className="text-xl">🏪</span>
                      <p className="text-[8px] font-medium mt-0.5" style={{color: themeColor}}>{storeName || "门店名称"}</p>
                    </div>
                  </div>
                  {/* 模块列表 */}
                  <div className="px-2 py-1.5 space-y-1">
                    {modules.filter(m => m.enabled !== false).sort((a,b) => (a.sort_order||0)-(b.sort_order||0)).map(mod => {
                      const def = MODULE_DEFS.find(d => d.type === mod.type);
                      const hasContent = mod.config && Object.keys(mod.config).length > 0;
                      return (
                        <div key={mod.id} className="flex items-center gap-1.5 p-1.5 rounded-md" style={{background: `${themeColor}08`}}>
                          <span className="text-xs">{def?.icon || "📦"}</span>
                          <span className="text-[7px] font-medium flex-1">{def?.label || mod.type}</span>
                          <span className="text-[5px] px-1 py-0.5 rounded-full" style={{background: `${themeColor}15`, color: themeColor}}>#{mod.sort_order}</span>
                          {hasContent && <span className="text-[5px] text-green-500">✓</span>}
                        </div>
                      );
                    })}
                    {modules.filter(m => m.enabled !== false).length === 0 && (
                      <p className="text-[7px] text-gray-300 text-center py-3">暂无启用模块</p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[8px] text-gray-300 text-center mt-1.5">编辑实时同步 · 保存后正式生效</p>
            </div>
          )}
        </div>
      </div>

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
          <div className="text-[13px] font-medium mb-3">展示模块 <span className="text-[10px] text-gray-400 font-normal ml-1">点击配置内容</span></div>
          <div className="space-y-2">
              {MODULE_DEFS.map((t, idx) => {
              const mod = modules.find((m:any) => m.type === t.type);
              const enabled = mod ? mod.enabled !== false : true;
              const hasContent = mod?.config && Object.keys(mod.config).length > 0;
              return (
                <div key={t.type} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-300 cursor-grab text-sm" draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => { if (dragIdx !== null && dragIdx !== idx) { const arr=[...modules]; const [it]=arr.splice(dragIdx,1); arr.splice(idx,0,it); setModules(arr.map((m,i)=>({...m,sort_order:i+1}))); setDragIdx(null); } }}>
                      ⋮⋮
                    </div>
                    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center text-base" style={{backgroundColor: `${enabled ? themeColor : "#ccc"}15`}}>
                      {t.icon}
                    </div>
                    <div>
                      <div className="text-[12px] font-medium">{t.label}</div>
                      <div className="text-[9px] text-gray-400">{t.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.hasConfig && mod && (
                      <button onClick={() => setConfigMod(mod)}
                        className="text-[9px] px-2 py-1 rounded-full font-medium"
                        style={{color: themeColor, backgroundColor: `${themeColor}10`}}>
                        {hasContent ? "编辑" : "配置"}
                      </button>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={enabled} onChange={() => toggleModule(t.type)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                        style={{backgroundColor: enabled ? themeColor : undefined}} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 配置弹窗 */}
      {configMod && (
        <ConfigModal mod={configMod} onSave={updateModuleConfig} onClose={() => setConfigMod(null)} themeColor={themeColor} />
      )}

      {/* Save & Preview */}
      <div className="mx-4 mt-4 space-y-2">
        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-[10px] text-sm font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
          style={{background: themeColor}}>
          {saving ? "保存中..." : "💾 保存装修配置"}
        </button>
        {sid > 0 && (
          <div onClick={() => window.open(`/store/${sid}`, "_blank")}
            className="bg-white rounded-[10px] p-3 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.97] transition-transform">
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
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
