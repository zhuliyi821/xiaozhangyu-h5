"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchantStores } from "../components/use-merchant-stores";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA" };

const PLATFORMS = [
  { key: "xiaozhangyu", label: "🐙 小章鱼商城", color: C.coral },
  { key: "youdianxian", label: "🔄 有点闲·置换", color: C.teal },
  { key: "store", label: "🏪 门店收银台", color: C.gold },
];

interface StoreGoods {
  id: number; goods_id: number; store_id: number; status: number;
  game_coin_ratio: number; listed_by_store: number; platform: string;
  title: string; thumb: string; market_price: number; stock: number; real_sales: number;
}

export default function MerchantGoodsPage() {
  const { user, loading } = useAuth();
  const { activeStoreId } = useMerchantStores();
  const [showLogin, setShowLogin] = useState(false);
  const [goods, setGoods] = useState<StoreGoods[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const loadGoods = () => {
    if (!user || !activeStoreId) return;
    let url = `/api/v2/merchant/store-goods?store_id=${activeStoreId}`;
    if (filterStatus !== null) url += `&status=${filterStatus}`;
    fetch(url).then(r => r.json()).then(d => { if (d.code === 0) setGoods(d.data); }).catch(() => {});
  };

  useEffect(() => { loadGoods(); }, [user, filterStatus, activeStoreId]);

  const updateGoods = async (goodsId: number, updates: Record<string, any>) => {
    setSavingId(goodsId);
    try {
      const params = new URLSearchParams({ store_id: String(activeStoreId || ""), ...Object.fromEntries(Object.entries(updates).map(([k,v]) => [k, String(v)])) });
      const r = await fetch(`/api/v2/merchant/store-goods/${goodsId}?${params}`, { method: "PUT" });
      const d = await r.json();
      setMessage(d.code === 0 ? "✅ 已更新" : `❌ ${d.msg}`);
      loadGoods();
    } catch { setMessage("❌ 更新失败"); }
    setSavingId(null);
    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <Loading />;
  if (!user) return <RequireLogin onLogin={() => setShowLogin(true)} />;
  if (showLogin) return <LoginModal onClose={() => setShowLogin(false)} />;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店商品管理</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">上架/下架商品 · 设置游戏豆赠送比例</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mx-4 mt-3 flex gap-2">
        {[
          { label: "全部", value: null },
          { label: "已上架", value: 1 },
          { label: "已下架", value: 0 },
        ].map(t => (
          <button key={t.label} onClick={() => setFilterStatus(t.value)}
            className="text-[11px] px-3.5 py-1.5 rounded-full font-medium transition-all"
            style={{
              backgroundColor: filterStatus === t.value ? C.coral : "#fff",
              color: filterStatus === t.value ? "#fff" : "#666",
              boxShadow: filterStatus === t.value ? "none" : "0 1px 2px rgba(0,0,0,0.04)"
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Message Toast */}
      {message && (
        <div className="mx-4 mt-2 text-[11px] text-center py-1.5 rounded-[8px]" style={{backgroundColor:`${C.coral}10`, color: C.coral}}>
          {message}
        </div>
      )}

      {/* Goods List */}
      <div className="mx-4 mt-3 space-y-3">
        {goods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-[12px] text-gray-400">暂无商品，请联系平台分配</p>
          </div>
        ) : goods.map((g) => (
          <GoodsCard key={g.id} goods={g} onUpdate={updateGoods} saving={savingId === g.id} />
        ))}
      </div>
    </main>
  );
}

function GoodsCard({ goods, onUpdate, saving }: { goods: StoreGoods; onUpdate: (id: number, u: any) => void; saving: boolean }) {
  const [ratio, setRatio] = useState(goods.game_coin_ratio);
  const [editingRatio, setEditingRatio] = useState(false);
  const curPlatform = PLATFORMS.find(p => p.key === goods.platform) || PLATFORMS[2];

  return (
    <div className="bg-white rounded-[10px] p-3.5 shadow-sm">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-[8px] bg-gray-100 flex items-center justify-center text-2xl shrink-0">
          {goods.thumb ? <img src={goods.thumb} className="w-full h-full rounded-[8px] object-cover" alt="" /> : "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium truncate">{goods.title}</h3>
          <div className="text-[13px] font-semibold mt-1" style={{color:C.coral}}>¥{goods.market_price}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-400">库存:{goods.stock}</span>
            <span className="text-[10px] text-gray-400">销量:{goods.real_sales || 0}</span>
          </div>
        </div>
      </div>

      {/* Platform selector */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-50">
        {PLATFORMS.map(p => (
          <button key={p.key} onClick={() => onUpdate(goods.id, { platform: p.key })}
            disabled={saving || p.key === goods.platform}
            className="text-[10px] px-2 py-1 rounded-full transition-all disabled:opacity-100"
            style={{
              backgroundColor: goods.platform === p.key ? p.color + "20" : "#f5f5f5",
              color: goods.platform === p.key ? p.color : "#999",
              fontWeight: goods.platform === p.key ? 600 : 400,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Status + Game coin ratio */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
        {/* 上架/下架 开关 */}
        <button onClick={() => onUpdate(goods.id, { status: goods.status ? 0 : 1 })}
          className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all"
          style={{
            backgroundColor: goods.status ? `${C.teal}15` : `${C.coral}10`,
            color: goods.status ? C.teal : C.coral,
          }}>
          {saving ? "..." : goods.status ? "🟢 已上架" : "🔴 已下架"}
        </button>

        {/* 游戏豆比例 */}
        <div className="flex-1 flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">🎮送:</span>
          {editingRatio ? (
            <div className="flex items-center gap-1">
              <input type="number" step="0.5" min="0" max="100" value={ratio}
                onChange={e => setRatio(parseFloat(e.target.value) || 0)}
                className="w-14 text-[11px] px-1.5 py-0.5 border rounded-[4px] text-center" />
              <button onClick={() => { onUpdate(goods.id, { game_coin_ratio: ratio }); setEditingRatio(false); }}
                className="text-[10px] px-2 py-0.5 rounded-[4px] text-white" style={{backgroundColor:C.coral}}>✓</button>
              <button onClick={() => { setRatio(goods.game_coin_ratio); setEditingRatio(false); }}
                className="text-[10px] px-2 py-0.5 rounded-[4px] text-gray-500 bg-gray-100">✕</button>
            </div>
          ) : (
            <button onClick={() => setEditingRatio(true)}
              className="text-[11px] font-medium" style={{color:C.gold}}>
              1元送{ratio}豆
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]">
    <div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" />
  </div>;
}

function RequireLogin({ onLogin }: { onLogin: () => void }) {
  return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]">
    <button onClick={onLogin} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>
  </div>;
}
