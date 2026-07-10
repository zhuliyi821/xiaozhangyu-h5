"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA", green: "#10B981" };

export default function MerchantPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState({ goods: 0, orders: 0, revenue: 0 });

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0 && d.data.is_merchant) setMerchant(d.data); })
      .catch(() => {});
    fetch(`/api/v2/merchant/store-goods?store_id=10001`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setStats(s => ({ ...s, goods: d.data.length })); })
      .catch(() => {});
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;
  if (!merchant) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><p className="text-sm text-gray-400">您还不是商户</p></div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>商户管理</h1>
            <p className="text-[11px] text-gray-400">{merchant.merchant_name}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-[10px] p-3.5 text-center shadow-sm">
          <div className="text-xl font-bold" style={{color:C.coral}}>{stats.goods}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">门店商品</div>
        </div>
        <div className="bg-white rounded-[10px] p-3.5 text-center shadow-sm">
          <div className="text-xl font-bold" style={{color:C.teal}}>{stats.orders}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">本月订单</div>
        </div>
        <div className="bg-white rounded-[10px] p-3.5 text-center shadow-sm">
          <div className="text-xl font-bold" style={{color:C.gold}}>¥{stats.revenue}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">本月收入</div>
        </div>
      </div>

      {/* Menu */}
      <div className="mx-4 mt-4 space-y-2">
        <MenuItem icon="📦" label="门店商品管理" desc="上架/下架 · 游戏豆赠送比例" href="/merchant/goods" color={C.coral} />
        <MenuItem icon="📋" label="门店订单" desc="查看订单列表与详情" href="/merchant/orders" color={C.teal} />
        <MenuItem icon="💰" label="收入统计" desc="查看营收数据与提现" href="/merchant/revenue" color={C.gold} />
        <MenuItem icon="🤖" label="AI员工报告" desc="经营日报 · 财务分析 · 定价建议" href="/merchant/ai-reports" color="#8B5CF6" />
        <MenuItem icon="💬" label="AI员工对话" desc="与AI店长/财务/增长/客服对话" href="/merchant/ai-chat" color="#45CCD5" />
        <MenuItem icon="⚙️" label="AI订阅配置" desc="订阅管理 · 定时推送 · 功能配置" href="/merchant/ai-config" color="#F2B631" />
        <MenuItem icon="🏪" label="门店设置" desc="营业状态 · 装修配置 · 店员管理" href="/merchant/settings" color="#10B981" />
      </div>

      {/* Stores */}
      {merchant.stores?.length > 0 && (
        <div className="mx-4 mt-6">
          <h2 className="text-[12px] font-medium text-gray-400 mb-2 px-0.5">我的门店</h2>
          <div className="space-y-2">
            {merchant.stores.map((s: any) => (
              <div key={s.id} className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0" style={{backgroundColor:`${C.teal}15`}}>🏪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{s.store_name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.address || "暂无地址"}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{backgroundColor: s.operating_state ? `${C.green}15` : `${C.coral}15`, color: s.operating_state ? "#10B981" : C.coral}}>
                  {s.operating_state ? "营业中" : "未营业"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

function MenuItem({ icon, label, desc, href, color }: { icon: string; label: string; desc: string; href: string; color: string }) {
  return (
    <div onClick={() => window.location.href = href}
      className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0" style={{backgroundColor:`${color}15`}}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>
      </div>
      <span className="text-gray-300 text-sm">→</span>
    </div>
  );
}
