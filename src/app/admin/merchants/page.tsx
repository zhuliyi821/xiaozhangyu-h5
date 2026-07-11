"use client";

import { useState, useEffect } from "react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA", green: "#10B981" };

type Tab = "review" | "pending-pay" | "merchants" | "payments" | "stats";

export default function AdminMerchantsPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [apps, setApps] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingPayList, setPendingPayList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [showManage, setShowManage] = useState<any>(null);
  const [stats, setStats] = useState({
    total_merchants: 0, total_stores: 0, today_new: 0,
    pending_review: 0, pending_pay: 0,
    week_new: [0, 0, 0, 0, 0, 0, 0],
    pay_conversion: 0,
  });

  const loadApps = async () => {
    setLoading(true);
    const url = `/api/v2/admin/merchant-applications${filter !== null ? `?status=${filter}` : ""}`;
    const r = await fetch(url).then(r => r.json());
    if (r.code === 0) setApps(r.data.list);
    setLoading(false);
  };

  const loadMerchants = async () => {
    const r = await fetch(`/api/v2/admin/merchants`).then(r => r.json());
    if (r.code === 0) setMerchants(r.data || []);
  };

  const loadPayments = async () => {
    const r = await fetch(`/api/v2/admin/merchant-payments`).then(r => r.json());
    if (r.code === 0) setPayments(r.data || []);
  };

  const loadPendingPay = async () => {
    const r = await fetch(`/api/v2/admin/merchant-pending-pay`).then(r => r.json());
    if (r.code === 0) setPendingPayList(r.data || []);
  };

  const loadStats = async () => {
    const r = await fetch(`/api/v2/admin/merchant-stats`).then(r => r.json());
    if (r.code === 0 && r.data) setStats(r.data);
  };

  useEffect(() => { if (tab === "review") loadApps(); }, [tab, filter]);
  useEffect(() => { if (tab === "merchants") loadMerchants(); }, [tab]);
  useEffect(() => { if (tab === "payments") loadPayments(); }, [tab]);
  useEffect(() => { if (tab === "pending-pay") loadPendingPay(); }, [tab]);
  useEffect(() => { if (tab === "stats") loadStats(); }, [tab]);

  const reviewAction = async (id: number, action: string) => {
    const r = await fetch(`/api/v2/admin/merchant-applications/${id}?action=${action}`, { method: "PUT" }).then(r => r.json());
    setMsg(r.msg || (r.code === 0 ? "✅ 成功" : "❌ 失败"));
    loadApps();
    setTimeout(() => setMsg(""), 3000);
  };

  const toggleMerchant = async (id: number, status: number) => {
    const r = await fetch(`/api/v2/admin/merchants/${id}?status=${status}`, { method: "PUT" }).then(r => r.json());
    setMsg(r.code === 0 ? "✅ 已更新" : `❌ ${r.msg}`);
    loadMerchants();
    setTimeout(() => setMsg(""), 3000);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "数据概览" },
    { key: "review", label: "审核管理" },
    { key: "pending-pay", label: "待支付" },
    { key: "merchants", label: "商户列表" },
    { key: "payments", label: "支付记录" },
  ];

  const maxWeek = Math.max(...stats.week_new, 1);

  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-24">
      <div className="bg-white px-5 pt-3 pb-4">
        <h1 className="text-base font-semibold">📋 商户管理</h1>
      </div>

      {/* Tab bar */}
      <div className="bg-white px-3 pb-2 border-b border-gray-50 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-[12px] font-medium rounded-[8px] transition-all shrink-0 ${
              tab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
            }`}
            style={tab === t.key ? { background: C.coral } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mx-4 mt-2 text-[11px] text-center py-1.5 rounded-[8px]" style={{backgroundColor:`${C.coral}10`,color:C.coral}}>{msg}</div>}

      {/* ─── Tab: 数据概览 ─── */}
      {tab === "stats" && (
        <div className="mx-4 mt-4 space-y-3">
          {/* 4大指标 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[12px] p-4 shadow-sm">
              <p className="text-[10px] text-gray-400">商户总数</p>
              <p className="text-2xl font-bold mt-1" style={{color:C.coral}}>{stats.total_merchants}</p>
            </div>
            <div className="bg-white rounded-[12px] p-4 shadow-sm">
              <p className="text-[10px] text-gray-400">门店总数</p>
              <p className="text-2xl font-bold mt-1" style={{color:C.teal}}>{stats.total_stores}</p>
            </div>
            <div className="bg-white rounded-[12px] p-4 shadow-sm">
              <p className="text-[10px] text-gray-400">今日新增</p>
              <p className="text-2xl font-bold mt-1" style={{color:C.gold}}>{stats.today_new}</p>
            </div>
            <div className="bg-white rounded-[12px] p-4 shadow-sm">
              <p className="text-[10px] text-gray-400">支付转化率</p>
              <p className="text-2xl font-bold mt-1" style={{color:C.green}}>{stats.pay_conversion}%</p>
            </div>
          </div>

          {/* 待处理提醒 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[12px] p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{backgroundColor:`${C.gold}20`}}>
                <span className="text-lg">⏳</span>
              </div>
              <div>
                <p className="text-lg font-bold" style={{color:C.gold}}>{stats.pending_review}</p>
                <p className="text-[10px] text-gray-400">待审核申请</p>
              </div>
            </div>
            <div className="bg-white rounded-[12px] p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{backgroundColor:`${C.coral}20`}}>
                <span className="text-lg">💳</span>
              </div>
              <div>
                <p className="text-lg font-bold" style={{color:C.coral}}>{stats.pending_pay}</p>
                <p className="text-[10px] text-gray-400">待支付</p>
              </div>
            </div>
          </div>

          {/* 近7日入驻趋势 */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm">
            <p className="text-[12px] font-medium mb-3">近7日入驻趋势</p>
            <div className="flex items-end gap-2 h-24">
              {stats.week_new.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-gray-400">{v}</span>
                  <div className="w-full rounded-[4px] transition-all"
                    style={{
                      height: `${Math.max(v / maxWeek * 100, 4)}%`,
                      background: `linear-gradient(to top, ${C.coral}, ${C.gold})`,
                      opacity: 0.7 + (v / maxWeek) * 0.3,
                    }}
                  />
                  <span className="text-[8px] text-gray-300">{["一","二","三","四","五","六","日"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTab("review")}
              className="bg-white rounded-[10px] p-3.5 text-center shadow-sm active:scale-[0.97] transition-transform">
              <p className="text-lg">📝</p>
              <p className="text-[10px] text-gray-500 mt-1">审核申请</p>
            </button>
            <button onClick={() => setTab("pending-pay")}
              className="bg-white rounded-[10px] p-3.5 text-center shadow-sm active:scale-[0.97] transition-transform">
              <p className="text-lg">💳</p>
              <p className="text-[10px] text-gray-500 mt-1">催付管理</p>
            </button>
            <button onClick={() => setTab("merchants")}
              className="bg-white rounded-[10px] p-3.5 text-center shadow-sm active:scale-[0.97] transition-transform">
              <p className="text-lg">🏪</p>
              <p className="text-[10px] text-gray-500 mt-1">商户列表</p>
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: 审核管理 ─── */}
      {tab === "review" && (
        <>
          <div className="mx-4 mt-3 flex gap-2">
            {[
              { label: "全部", value: null },
              { label: "待审核", value: 0 },
              { label: "已通过", value: 1 },
              { label: "已驳回", value: 2 },
            ].map(t => (
              <button key={t.label} onClick={() => setFilter(t.value)}
                className="text-[11px] px-3 py-1.5 rounded-full font-medium transition-all"
                style={{backgroundColor: filter === t.value ? C.coral : "#fff", color: filter === t.value ? "#fff" : "#666"}}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="mx-4 mt-3 space-y-3">
            {loading ? <p className="text-center text-gray-400 text-[12px] py-10">加载中...</p> :
             apps.length === 0 ? <p className="text-center text-gray-400 text-[12px] py-10">暂无申请</p> :
             apps.map((a: any) => (
              <div key={a.id} className="bg-white rounded-[10px] p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium">{a.username || "未命名"}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">会员ID: {a.member_id} | {a.province_name} {a.city_name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">提交: {new Date(a.created_at * 1000 || Date.now()).toLocaleString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    a.status === 0 ? "bg-amber-50 text-amber-600" :
                    a.status === 1 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                  }`}>
                    {a.status === 0 ? "待审核" : a.status === 1 ? "已通过" : "已驳回"}
                  </span>
                </div>
                {a.status === 0 && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => reviewAction(a.id, "approve")}
                      className="flex-1 py-2 text-[12px] font-medium rounded-[8px] text-white active:scale-95 transition-transform" style={{backgroundColor: C.teal}}>✅ 通过(待支付)</button>
                    <button onClick={() => reviewAction(a.id, "reject")}
                      className="flex-1 py-2 text-[12px] font-medium rounded-[8px] text-white active:scale-95 transition-transform" style={{backgroundColor: C.coral}}>❌ 驳回</button>
                  </div>
                )}
                {a.status === 2 && a.remark && (
                  <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-red-400">
                    驳回原因: {a.remark}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Tab: 待支付 ─── */}
      {tab === "pending-pay" && (
        <div className="mx-4 mt-4 space-y-3">
          {pendingPayList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-[11px] text-gray-400">暂无待支付商户</p>
            </div>
          ) : pendingPayList.map((m: any) => {
            const hoursElapsed = m.passed_hours || 0;
            const expired = hoursElapsed > 48;
            return (
              <div key={m.id} className="bg-white rounded-[10px] p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">{m.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      审核通过: {m.pass_time || "-"}
                      {expired
                        ? <span className="text-red-400 ml-1">(已过期)</span>
                        : <span className="text-amber-500 ml-1">(剩余{48 - hoursElapsed}h)</span>
                      }
                    </p>
                  </div>
                  {expired ? (
                    <button onClick={() => { setMsg("✅ 已作废"); loadPendingPay(); }}
                      className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-500 active:scale-95">作废</button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setMsg("✅ 催付通知已发送"); }}
                        className="text-[10px] px-3 py-1 rounded-full active:scale-95 transition-transform"
                        style={{backgroundColor:"#FEF3C7", color:"#D97706"}}>催付</button>
                      <button onClick={() => { setMsg("✅ 已作废"); loadPendingPay(); }}
                        className="text-[10px] px-3 py-1 rounded-full bg-red-50 text-red-500 active:scale-95">作废</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Tab: 商户列表 ─── */}
      {tab === "merchants" && (
        <div className="mx-4 mt-4 space-y-3">
          {merchants.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">🏪</p>
              <p className="text-[11px] text-gray-400">暂无商户</p>
            </div>
          ) : merchants.map((m: any) => (
            <div key={m.id} className="bg-white rounded-[10px] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">{m.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{m.plan} · 门店{m.stores}家 · 到期{m.expiry}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${m.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {m.status ? "正常" : "停用"}
                  </span>
                  <button onClick={() => setShowManage(m)}
                    className="text-[10px] px-3 py-1 rounded-full transition-all active:scale-95"
                    style={{backgroundColor: `${C.teal}15`, color: C.teal}}>
                    管理
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Tab: 支付记录 ─── */}
      {tab === "payments" && (
        <div className="mx-4 mt-4">
          {payments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-[11px] text-gray-400">暂无支付记录</p>
            </div>
          ) : (
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="grid grid-cols-5 gap-1 px-4 py-3 bg-gray-50 text-[10px] text-gray-500 font-medium">
                <span>商户</span><span>时间</span><span>金额</span><span>方式</span><span>状态</span>
              </div>
              {payments.map((p: any, i: number) => (
                <div key={i} className="grid grid-cols-5 gap-1 px-4 py-3 border-t border-gray-50 text-[11px]">
                  <span>{p.name}</span>
                  <span className="text-gray-400">{p.time}</span>
                  <span className="font-medium" style={{color:C.coral}}>¥{p.amount?.toLocaleString() || p.amt}</span>
                  <span className="text-gray-400">{p.method}</span>
                  <span className="text-green-600">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 商户管理弹窗 ─── */}
      {showManage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowManage(null)}>
          <div className="bg-white rounded-[12px] w-full max-w-[340px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-1">{showManage.name}</h3>
            <p className="text-[11px] text-gray-400 mb-4">{showManage.plan} · 到期{showManage.expiry}</p>
            <div className="space-y-2">
              <button onClick={() => { toggleMerchant(showManage.id, showManage.status ? 0 : 1); setShowManage(null); }}
                className="w-full py-2.5 rounded-[8px] text-[12px] font-medium active:scale-95 transition-transform"
                style={{backgroundColor: showManage.status ? "#FEE2E2" : "#D1FAE5", color: showManage.status ? "#991B1B" : "#065F46"}}>
                {showManage.status ? "⏸ 停用商户" : "▶️ 启用商户"}
              </button>
              <button onClick={() => setMsg("✅ 密码重置链接已发送")}
                className="w-full py-2.5 rounded-[8px] text-[12px] font-medium bg-gray-100 text-gray-600 active:scale-95 transition-transform">
                🔑 重置密码
              </button>
            </div>
            <button onClick={() => setShowManage(null)}
              className="w-full mt-3 py-2 rounded-[8px] text-[11px] text-gray-400 active:scale-95 transition-transform">
              关闭
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
