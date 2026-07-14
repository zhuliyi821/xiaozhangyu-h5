"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchantStores } from "../components/use-merchant-stores";
import { C } from "@/lib/brand-colors";


const PLATFORMS = [
  { key: "xiaozhangyu", label: "🐙 小章鱼商城", color: C.coral },
  { key: "youdianxian", label: "🔄 有点闲·置换", color: C.teal },
  { key: "store", label: "🏪 门店收银台", color: C.gold },
];

interface GoodsItem {
  goods_id: number; title: string; price: number; market_price: number; thumb: string;
  stock: number; real_sales: number; content: string; status: number; created_at: number;
  link_id: number; game_coin_ratio: number; platform: string; listed_by_store: number; listed_status: number;
}

export default function MerchantGoodsPage() {
  const { user, loading } = useAuth();
  const { activeStoreId } = useMerchantStores();
  const [showLogin, setShowLogin] = useState(false);
  const [goods, setGoods] = useState<GoodsItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 新增商品表单
  const [newForm, setNewForm] = useState({
    title: "", price: 0, stock: 1, thumb: "", content: "",
    game_coin_ratio: 0, platform: "xiaozhangyu", images: [] as string[],
  });

  // 处理 ?action=add 参数 → 打开添加弹窗
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add") setShowAddModal(true);
    window.history.replaceState({}, "", "/merchant/goods");
  }, []);

  const filteredGoods = goods.filter(g =>
    (filterStatus === null || g.listed_status === filterStatus) &&
    (!searchTerm || g.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── 加载商品(使用新API) ──
  useEffect(() => {
    if (!user || !activeStoreId) return;
    const url = `/api/store-services?action=merchant_my_goods&store_id=${activeStoreId}${filterStatus !== null ? `&status=${filterStatus}` : ""}`;
    fetch(url).then(r => r.json()).then(d => { if (d.code === 0) setGoods(d.data || []); }).catch(() => {});
  }, [user, activeStoreId, filterStatus]);

  // ── 添加商品 ──
  const handleAdd = async () => {
    if (!user || !activeStoreId) return;
    if (!newForm.title || newForm.price <= 0) { setMessage("❌ 请填写商品名称和价格"); setTimeout(() => setMessage(""), 2000); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/store-services?action=merchant_add_goods", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: activeStoreId, member_id: user.uid, ...newForm }),
      });
      const d = await r.json();
      if (d.code === 0) {
        setMessage("✅ 商品发布成功");
        setShowAddModal(false);
        setNewForm({ title: "", price: 0, stock: 1, thumb: "", content: "", game_coin_ratio: 0, platform: "xiaozhangyu", images: [] });
        // Reload
        fetch(`/api/store-services?action=merchant_my_goods&store_id=${activeStoreId}`).then(r => r.json()).then(d2 => { if (d2.code === 0) setGoods(d2.data || []); });
      } else { setMessage(`❌ ${d.msg || "发布失败"}`); }
    } catch { setMessage("❌ 网络错误"); }
    setSubmitting(false);
    setTimeout(() => setMessage(""), 2000);
  };

  // ── 更新商品 ──
  const updateGoods = async (goodsId: number, updates: Record<string, any>) => {
    setSavingId(goodsId);
    try {
      const r = await fetch("/api/store-services?action=merchant_update_goods", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goods_id: goodsId, ...updates }),
      });
      const d = await r.json();
      setMessage(d.code === 0 ? "✅ 已更新" : `❌ ${d.msg}`);
      fetch(`/api/store-services?action=merchant_my_goods&store_id=${activeStoreId}`).then(r => r.json()).then(d2 => { if (d2.code === 0) setGoods(d2.data || []); });
    } catch { setMessage("❌ 更新失败"); }
    setSavingId(null);
    setTimeout(() => setMessage(""), 2000);
  };

  // ── 删除商品 ──
  const deleteGoods = async (goodsId: number) => {
    if (!confirm("确定删除此商品？")) return;
    try {
      const r = await fetch(`/api/store-services?action=merchant_delete_goods&goods_id=${goodsId}`, { method: "GET" });
      const d = await r.json();
      setMessage(d.code === 0 ? "✅ 已删除" : `❌ ${d.msg}`);
      fetch(`/api/store-services?action=merchant_my_goods&store_id=${activeStoreId}`).then(r => r.json()).then(d2 => { if (d2.code === 0) setGoods(d2.data || []); });
    } catch { setMessage("❌ 删除失败"); }
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <Loading />;
  if (!user) return <RequireLogin onLogin={() => setShowLogin(true)} />;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店商品管理</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">发布/管理门店商品</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full text-white active:scale-90 transition-all"
            style={{background: C.coral}}>+ 发布商品</button>
        </div>
      </div>

      {/* Filter */}
      <div className="mx-4 mt-3 flex gap-2">
        {[
          { label: "全部", value: null },
          { label: "已上架", value: 1 },
          { label: "已下架", value: 0 },
        ].map(t => (
          <button key={t.label} onClick={() => setFilterStatus(t.value)}
            className="text-[11px] px-3.5 py-1.5 rounded-full font-medium transition-all"
            style={{backgroundColor: filterStatus === t.value ? C.coral : "#fff", color: filterStatus === t.value ? "#fff" : "#666"}}>
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="mx-4 mt-2 text-[11px] text-center py-1.5 rounded-[8px]" style={{backgroundColor:`${C.coral}10`, color: C.coral}}>{message}</div>}

      {/* Search */}
      <div className="mx-4 mt-3">
        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          placeholder="🔍 搜索商品名称..." className="w-full text-[12px] px-3 py-2 rounded-[8px] border border-gray-200 bg-white outline-none focus:border-brand-coral transition-colors" />
      </div>

      {/* Goods list */}
      <div className="mx-4 mt-3 space-y-3">
        {filteredGoods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-[12px] text-gray-400">{searchTerm ? "未找到匹配商品" : "暂无商品"}</p>
            <button onClick={() => setShowAddModal(true)} className="mt-3 text-[11px] text-brand-coral underline">发布第一个商品</button>
          </div>
        ) : filteredGoods.map((g) => (
          <GoodsCard key={g.goods_id} goods={g} onUpdate={updateGoods} onDelete={deleteGoods} saving={savingId === g.goods_id} />
        ))}
      </div>

      {/* ── 发布商品弹窗 ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[12px] w-full max-w-[400px] p-5 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4" style={{color:C.coral}}>📦 发布新商品</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">商品名称 *</label>
                <input value={newForm.title} onChange={e => setNewForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" placeholder="输入商品名称" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">价格 (元) *</label>
                  <input type="number" min="0" step="0.01" value={newForm.price || ""} onChange={e => setNewForm(f => ({...f, price: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">库存</label>
                  <input type="number" min="1" value={newForm.stock} onChange={e => setNewForm(f => ({...f, stock: parseInt(e.target.value) || 1}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">商品图片 (URL)</label>
                <input value={newForm.thumb} onChange={e => setNewForm(f => ({...f, thumb: e.target.value}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" placeholder="主图链接地址" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">更多图片 (URL, 每行一个)</label>
                <textarea value={newForm.images.join("\n")} onChange={e => setNewForm(f => ({...f, images: e.target.value.split("\n").map(s => s.trim()).filter(Boolean)}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152] resize-none h-16" placeholder="https://..." />
                {newForm.images.length > 0 && <p className="text-[10px] text-gray-400 mt-1">已添加 {newForm.images.length} 张图片</p>}
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">商品描述</label>
                <textarea value={newForm.content} onChange={e => setNewForm(f => ({...f, content: e.target.value}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152] resize-none h-16" placeholder="可选" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">游戏豆赠送比例</label>
                  <input type="number" min="0" step="0.5" value={newForm.game_coin_ratio || ""} onChange={e => setNewForm(f => ({...f, game_coin_ratio: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" placeholder="0" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">所属平台</label>
                  <select value={newForm.platform} onChange={e => setNewForm(f => ({...f, platform: e.target.value}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none bg-white">
                    {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-[8px] bg-gray-100 text-[12px] font-medium">取消</button>
              <button onClick={handleAdd} disabled={submitting}
                className="flex-1 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95 transition-transform"
                style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
                {submitting ? "发布中..." : "确认发布"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

// ── 商品卡片 ──
function GoodsCard({ goods, onUpdate, onDelete, saving }: {
  goods: GoodsItem; onUpdate: (id: number, u: any) => void; onDelete: (id: number) => void; saving: boolean;
}) {
  const [ratio, setRatio] = useState(goods.game_coin_ratio);
  const [editingRatio, setEditingRatio] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: goods.title, price: goods.price, stock: goods.stock, content: goods.content });

  const curPlatform = PLATFORMS.find(p => p.key === goods.platform) || PLATFORMS[2];
  const isMerchantCreated = goods.listed_by_store === 1;

  return (
    <>
      <div className="bg-white rounded-[10px] p-3.5 shadow-sm">
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-[8px] bg-gray-100 flex items-center justify-center text-2xl shrink-0">
            {goods.thumb ? <img src={goods.thumb} className="w-full h-full rounded-[8px] object-cover" alt="" /> : "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-[13px] font-medium truncate flex-1">{goods.title}</h3>
              {isMerchantCreated && (
                <div className="flex gap-1 ml-2">
                  <button onClick={() => { setEditForm({ title: goods.title, price: goods.price, stock: goods.stock, content: goods.content }); setShowEdit(true); }}
                    className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-gray-100 text-gray-500 active:scale-90">✎</button>
                  <button onClick={() => onDelete(goods.goods_id)}
                    className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-red-50 text-red-400 active:scale-90">🗑</button>
                </div>
              )}
            </div>
            <div className="text-[13px] font-semibold mt-1" style={{color:C.coral}}>¥{goods.price}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-gray-400">库存:{goods.stock}</span>
              <span className="text-[10px] text-gray-400">销量:{goods.real_sales || 0}</span>
              {isMerchantCreated && <span className="text-[9px] px-1 py-0.5 rounded-[3px] bg-purple-50 text-purple-400">自营</span>}
            </div>
          </div>
        </div>

        {/* Platform */}
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-50">
          {PLATFORMS.map(p => (
            <button key={p.key} onClick={() => onUpdate(goods.goods_id, { platform: p.key })}
              disabled={saving || p.key === goods.platform}
              className="text-[10px] px-2 py-1 rounded-full transition-all disabled:opacity-100"
              style={{backgroundColor: goods.platform === p.key ? p.color + "20" : "#f5f5f5", color: goods.platform === p.key ? p.color : "#999"}}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Status + Ratio */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
          <button onClick={() => onUpdate(goods.goods_id, { listed_status: goods.listed_status ? 0 : 1 })}
            className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all"
            style={{backgroundColor: goods.listed_status ? `${C.teal}15` : `${C.coral}10`, color: goods.listed_status ? C.teal : C.coral}}>
            {saving ? "..." : goods.listed_status ? "🟢 已上架" : "🔴 已下架"}
          </button>

          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">🎮送:</span>
            {editingRatio ? (
              <div className="flex items-center gap-1">
                <input type="number" step="0.5" min="0" value={ratio} onChange={e => setRatio(parseFloat(e.target.value) || 0)}
                  className="w-14 text-[11px] px-1.5 py-0.5 border rounded-[4px] text-center" />
                <button onClick={() => { onUpdate(goods.goods_id, { game_coin_ratio: ratio }); setEditingRatio(false); }}
                  className="text-[10px] px-2 py-0.5 rounded-[4px] text-white" style={{backgroundColor:C.coral}}>✓</button>
                <button onClick={() => { setRatio(goods.game_coin_ratio); setEditingRatio(false); }}
                  className="text-[10px] px-2 py-0.5 rounded-[4px] text-gray-500 bg-gray-100">✕</button>
              </div>
            ) : (
              <button onClick={() => setEditingRatio(true)} className="text-[11px] font-medium" style={{color:C.gold}}>
                1元送{ratio}豆
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 编辑弹窗 ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-[12px] w-full max-[400px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-4">编辑商品</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">商品名称</label>
                <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">价格 (元)</label>
                  <input type="number" step="0.01" value={editForm.price || ""} onChange={e => setEditForm(f => ({...f, price: parseFloat(e.target.value) || 0}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">库存</label>
                  <input type="number" min="1" value={editForm.stock} onChange={e => setEditForm(f => ({...f, stock: parseInt(e.target.value) || 1}))}
                    className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152]" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">商品描述</label>
                <textarea value={editForm.content} onChange={e => setEditForm(f => ({...f, content: e.target.value}))}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#F27152] resize-none h-16" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-[8px] bg-gray-100 text-[12px] font-medium">取消</button>
              <button onClick={() => { onUpdate(goods.goods_id, editForm); setShowEdit(false); }}
                className="flex-1 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95"
                style={{background: C.teal}}>保存</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Loading() { return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>; }
function RequireLogin({ onLogin }: { onLogin: () => void }) { return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={onLogin} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button></div>; }
