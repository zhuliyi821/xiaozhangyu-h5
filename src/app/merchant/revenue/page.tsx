"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { C } from "@/lib/brand-colors";


export default function MerchantRevenuePage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, orders: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [tab, setTab] = useState<"day" | "week" | "month">("day");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("wechat");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [msg, setMsg] = useState("");

  const withdrawable = stats.month * 0.7;

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

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmt);
    if (!amt || amt <= 0) { setMsg("❌ 请输入有效金额"); setTimeout(() => setMsg(""), 2000); return; }
    if (amt > withdrawable) { setMsg("❌ 超出可提现余额"); setTimeout(() => setMsg(""), 2000); return; }
    if (!withdrawAccount) { setMsg("❌ 请输入到账账户"); setTimeout(() => setMsg(""), 2000); return; }
    setWithdrawing(true);
    try {
      const r = await fetch(`/api/v2/merchant/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: user?.uid, amount: amt, method: withdrawMethod, account: withdrawAccount }),
      });
      const d = await r.json();
      if (d.code === 0) { setMsg("✅ 提现申请已提交"); setShowWithdraw(false); setWithdrawAmt(""); }
      else { setMsg(`❌ ${d.msg || "提现失败"}`); }
    } catch { setMsg("❌ 网络错误"); }
    setWithdrawing(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;
  if (!user) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><button onClick={() => setShowLogin(true)} className="px-6 py-2.5 rounded-[10px] text-white text-sm font-medium" style={{background:C.coral}}>登录后查看</button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div>
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>收入统计</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">查看营收数据与提现</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mx-4 mt-3 p-2.5 rounded-[8px] text-[11px] text-center font-medium"
          style={{backgroundColor: msg.startsWith("✅") ? "#D1FAE5" : "#FEE2E2", color: msg.startsWith("✅") ? "#065F46" : "#991B1B"}}>
          {msg}
        </div>
      )}

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
              <div className="text-[10px] text-gray-400">可提现余额: ¥{withdrawable.toFixed(2)}</div>
            </div>
          </div>
          <button onClick={() => { setWithdrawAmt(""); setWithdrawMethod("wechat"); setWithdrawAccount(""); setShowWithdraw(true); }}
            className="text-[11px] font-medium px-4 py-1.5 rounded-full text-white active:scale-90 transition-transform"
            style={{background: C.gold}}>
            去提现
          </button>
        </div>
      </div>

      {/* 提现弹窗 */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-white rounded-[12px] w-full max-w-[360px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-[14px] font-semibold mb-1">提现</h3>
            <p className="text-[11px] text-gray-400 mb-4">可提现余额: ¥{withdrawable.toFixed(2)}</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">提现金额（元）</label>
                <input type="number" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5]" placeholder="0.00" max={withdrawable} />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">到账方式</label>
                <div className="flex gap-2">
                  {[
                    { key: "wechat", label: "微信" },
                    { key: "alipay", label: "支付宝" },
                    { key: "bank", label: "银行卡" },
                  ].map(m => (
                    <button key={m.key} onClick={() => setWithdrawMethod(m.key)}
                      className={`flex-1 py-2 rounded-[8px] text-[12px] font-medium transition-all ${withdrawMethod === m.key ? "text-white" : "bg-gray-100 text-gray-400"}`}
                      style={withdrawMethod === m.key ? { background: C.teal } : {}}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">到账账户</label>
                <input value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] border border-gray-200 text-[13px] outline-none focus:border-[#45CCD5]" placeholder={withdrawMethod === "wechat" ? "微信号" : withdrawMethod === "alipay" ? "支付宝账号" : "银行卡号"} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowWithdraw(false)} className="flex-1 py-2.5 rounded-[8px] bg-gray-100 text-[12px] font-medium">取消</button>
              <button onClick={handleWithdraw} disabled={withdrawing}
                className="flex-1 py-2.5 rounded-[8px] text-white text-[12px] font-medium active:scale-95 transition-transform"
                style={{background: C.gold}}>{withdrawing ? "提交中..." : "提交提现申请"}</button>
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
