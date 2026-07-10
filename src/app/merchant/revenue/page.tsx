"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", purple: "#8B5CF6", bg: "#F5F6FA", green: "#10B981" };

export default function MerchantRevenuePage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, orders: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [tab, setTab] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/revenue?member_id=${user.uid}&period=${tab}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0) {
          setStats({ today: d.data.today || 0, week: d.data.week || 0, month: d.data.month || 0, orders: d.data.orders || 0 });
          setRecords(d.data.records || []);
        }
      })
      .catch(() => {});
  }, [user, tab]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      {/* Header */}
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>收入统计</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">查看营收数据与提现</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] text-gray-400">今日收入</div>
          <div className="text-xl font-bold mt-1" style={{color:C.coral}}>¥{stats.today.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] text-gray-400">本月收入</div>
          <div className="text-xl font-bold mt-1" style={{color:C.gold}}>¥{stats.month.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] text-gray-400">本周收入</div>
          <div className="text-xl font-bold mt-1" style={{color:C.teal}}>¥{stats.week.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-[10px] p-4 shadow-sm">
          <div className="text-[10px] text-gray-400">本月订单</div>
          <div className="text-xl font-bold mt-1" style={{color:C.purple}}>{stats.orders}</div>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-1.5 shadow-sm flex">
          {[
            { key: "day" as const, label: "日" },
            { key: "week" as const, label: "周" },
            { key: "month" as const, label: "月" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 text-[11px] font-medium rounded-[8px] transition-all"
              style={{
                backgroundColor: tab === t.key ? C.coral : "transparent",
                color: tab === t.key ? "#fff" : "#666",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Records */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center">
            <span className="text-[12px] font-medium">收入明细</span>
            <span className="text-[9px] text-gray-400">共 {records.length} 条</span>
          </div>
          {records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">💰</p>
              <p className="text-[11px] text-gray-400">暂无收入记录</p>
            </div>
          ) : records.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-[12px] font-medium">{r.source || "门店收款"}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{r.created_at || "-"}</div>
              </div>
              <span className="text-[13px] font-bold" style={{color:C.coral}}>+¥{r.amount?.toFixed(2) || "0.00"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-[10px] p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{backgroundColor: `${C.green}15`}}>
              <span className="text-base">💳</span>
            </div>
            <div>
              <div className="text-[13px] font-medium">提现</div>
              <div className="text-[10px] text-gray-400">可提现余额: ¥{(stats.month * 0.7).toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[11px] font-medium px-4 py-1.5 rounded-full text-white active:scale-90 transition-transform cursor-pointer"
            style={{background: C.gold}}>
            去提现
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
