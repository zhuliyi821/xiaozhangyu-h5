"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { useMerchantStores } from "./components/use-merchant-stores";
import { C } from "@/lib/brand-colors";


export default function MerchantPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [merchantStatus, setMerchantStatus] = useState<any>(null);
  const [stats, setStats] = useState({ goods: 0, orders: 0, revenue: 0, today_orders: 0 });
  const { stores, activeStoreId, setActiveStoreId } = useMerchantStores();

  // ── 加载商户全状态 ──
  useEffect(() => {
    if (!user) return;
    fetch(`/api/store-services?action=apply_status&member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setMerchantStatus(d.data); })
      .catch(() => {});
  }, [user]);

  // ── 加载实时数据 ──
  useEffect(() => {
    if (!activeStoreId) return;
    fetch(`/api/v2/merchant/store-goods?store_id=${activeStoreId}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setStats(s => ({ ...s, goods: d.data.length })); })
      .catch(() => {});
    if (!user) return;
    fetch(`/api/v2/merchant/revenue?member_id=${user.uid}&period=day`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0) setStats(s => ({
          ...s,
          today_orders: d.data.orders || 0,
          revenue: d.data.today || 0,
          month: d.data.month || 0,
        }));
      })
      .catch(() => {});
  }, [activeStoreId]);

  const isPaidMerchant = merchantStatus?.paid || merchantStatus?.has_merchant;
  const isPendingPay = merchantStatus?.pending_pay;
  const hasApply = merchantStatus?.hasApply || !!merchantStatus?.merchant_apply;
  const merchantName = merchantStatus?.merchant_apply?.username || "商户";

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  // ── 未申请入驻 ──
  if (!isPaidMerchant && !isPendingPay && !hasApply) {
    return (
      <main className="min-h-screen bg-[#F5F6FA] pb-24">
        <div className="bg-white px-5 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">商户管理</h1>
          </div>
        </div>
        <div className="mx-4 mt-12 text-center">
          <p className="text-5xl mb-4">🏪</p>
          <p className="text-[15px] font-medium">还不是商户？</p>
          <p className="text-[12px] text-gray-400 mt-2">成为商户后可管理门店、商品、员工，<br/>享受AI员工报告和自媒体推广功能</p>
          <button onClick={() => window.location.href = "/merchant/apply"}
            className="mt-6 px-8 py-3 rounded-[10px] text-white text-sm font-semibold active:scale-[0.97] transition-all"
            style={{background: `linear-gradient(135deg, ${C.coral}, #E06050)`}}>
            申请入驻 →
          </button>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </main>
    );
  }

  // ── 审核通过待支付 ──
  if (isPendingPay && !isPaidMerchant) {
    return (
      <main className="min-h-screen bg-[#F5F6FA] pb-24">
        <div className="bg-white px-5 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-lg">←</button>
            <h1 className="text-base font-semibold">商户管理</h1>
          </div>
        </div>
        <div className="mx-4 mt-12 text-center">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-[15px] font-medium">审核已通过！</p>
          <p className="text-[12px] text-gray-400 mt-2">请支付 ¥9,800 开通商户管理权限</p>
          <button onClick={() => window.location.href = "/merchant/purchase"}
            className="mt-6 px-8 py-3 rounded-[10px] text-white text-sm font-semibold active:scale-[0.97] transition-all"
            style={{background: `linear-gradient(135deg, ${C.gold}, #D4940F)`}}>
            立即支付 ¥9,800 →
          </button>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </main>
    );
  }

  // ── 已付费商户：完整后台 ──
  return (
    <main className="pb-28 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = "/profile"} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>商户管理</h1>
            <p className="text-[11px] text-gray-400">{merchantName}</p>
          </div>
          {/* 门店切换 */}
          {stores.length > 1 && (
            <select value={activeStoreId || ""} onChange={e => setActiveStoreId(Number(e.target.value))}
              className="text-[11px] px-2 py-1 rounded-[6px] border border-gray-200 bg-gray-50 outline-none">
              {stores.map(s => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 数据概览 */}
      <div className="mx-4 mt-4 grid grid-cols-4 gap-2">
        <div className="bg-white rounded-[10px] p-3 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.coral}}>{stats.goods}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">商品</div>
        </div>
        <div className="bg-white rounded-[10px] p-3 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.teal}}>{stats.today_orders}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">今日订单</div>
        </div>
        <div className="bg-white rounded-[10px] p-3 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.gold}}>¥{stats.revenue}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">今日收入</div>
        </div>
        <div className="bg-white rounded-[10px] p-3 text-center shadow-sm">
          <div className="text-lg font-bold" style={{color:C.purple}}>{stores.length}</div>
          <div className="text-[9px] text-gray-400 mt-0.5">门店</div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mx-4 mt-4">
        <p className="text-[11px] text-gray-400 mb-2 px-0.5">⚡ 快捷操作</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "📦", label: "添加商品", href: "/merchant/goods?action=add", color: C.coral },
            { icon: "📋", label: "查看订单", href: "/merchant/orders", color: C.teal },
            { icon: "🎨", label: "门店装修", href: "/merchant/decoration", color: C.purple },
            { icon: "👥", label: "添加店员", href: "/merchant/staff", color: C.gold },
          ].map((q, i) => (
            <div key={i} onClick={() => window.location.href = q.href}
              className="bg-white rounded-[10px] p-3 text-center shadow-sm active:scale-95 transition-transform cursor-pointer">
              <p className="text-xl mb-1">{q.icon}</p>
              <p className="text-[10px] font-medium" style={{color: q.color}}>{q.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="mx-4 mt-4 space-y-1.5">
        <MenuItem icon="📦" label="门店商品管理" desc="上架/下架 · 游戏豆赠送比例" href="/merchant/goods" color={C.coral} />
        <MenuItem icon="📋" label="门店订单" desc="查看订单列表与详情" href="/merchant/orders" color={C.teal} />
        <MenuItem icon="💰" label="收入统计 & 提现" desc="查看营收数据与提现" href="/merchant/revenue" color={C.gold} />
        <MenuItem icon="🤖" label="AI员工报告" desc="经营日报 · 财务分析 · 定价建议" href="/merchant/ai-reports" color={C.purple} />
        <MenuItem icon="💬" label="AI员工对话" desc="与AI店长/财务/增长/客服对话" href="/merchant/ai-chat" color={C.teal} />
        <MenuItem icon="📱" label="自媒体运营" desc="AI生成 · 审核 · 发布" href="/merchant/media" color={C.green} />
        <MenuItem icon="⚙️" label="AI订阅配置" desc="订阅管理 · 定时推送" href="/merchant/ai-config" color={C.gold} />
        <MenuItem icon="🏪" label="门店设置" desc="营业状态 · 基础信息 · 店员管理" href="/merchant/settings" color={C.green} />
        <MenuItem icon="🎨" label="门店装修" desc="自定义门店详情页" href="/merchant/decoration" color={C.purple} />
      </div>

      {/* 门店列表 */}
      {stores.length > 0 && (
        <div className="mx-4 mt-6">
          <p className="text-[11px] text-gray-400 mb-2 px-0.5">🏪 我的门店</p>
          <div className="space-y-2">
            {stores.map((s: any) => (
              <div key={s.store_id} className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg shrink-0" style={{backgroundColor:`${C.teal}15`}}>🏪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{s.store_name || "未命名门店"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.address || "暂无地址"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.operating_state ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
                    {s.operating_state ? "营业中" : "休息"}
                  </span>
                  <span onClick={() => window.location.href = `/merchant/settings`}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 active:scale-95 transition-transform cursor-pointer">设置</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 退出商户 */}
      <div className="mx-4 mt-6 space-y-1">
        <div onClick={() => window.location.href = "/profile"}
          className="text-center py-2 text-[11px] text-gray-300 active:scale-95 transition-transform cursor-pointer">
          返回「我的」个人中心 →
        </div>
        <div onClick={() => window.location.href = "/merchant/cancel"}
          className="text-center py-2 text-[11px] active:scale-95 transition-transform cursor-pointer"
          style={{color: `${C.coral}90`}}>
          注销商户
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

function MenuItem({ icon, label, desc, href, color }: { icon: string; label: string; desc: string; href: string; color: string }) {
  return (
    <div onClick={() => window.location.href = href}
      className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base shrink-0" style={{backgroundColor:`${color}15`}}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{desc}</div>
      </div>
      <span className="text-gray-300 text-sm">→</span>
    </div>
  );
}
