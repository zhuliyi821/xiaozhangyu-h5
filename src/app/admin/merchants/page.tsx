"use client";

import { useState, useEffect } from "react";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA" };

export default function AdminMerchantsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const url = `/api/v2/admin/merchant-applications${filter !== null ? `?status=${filter}` : ""}`;
    const r = await fetch(url).then(r => r.json());
    if (r.code === 0) setApps(r.data.list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: number, action: string) => {
    const r = await fetch(`/api/v2/admin/merchant-applications/${id}?action=${action}`, { method: "PUT" }).then(r => r.json());
    setMsg(r.msg || (r.code === 0 ? "✅ 成功" : "❌ 失败"));
    load();
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <main className="min-h-screen bg-[#F5F6FA]">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold">📋 入驻审核</h1>
        </div>
      </div>

      {msg && <div className="mx-4 mt-2 text-[11px] text-center py-1.5 rounded-[8px]" style={{backgroundColor:`${C.coral}10`,color:C.coral}}>{msg}</div>}

      <div className="mx-4 mt-3 flex gap-2">
        {[
          { label: "全部", value: null },
          { label: "待审核", value: 0 },
          { label: "已通过", value: 1 },
          { label: "已驳回", value: 2 },
        ].map(t => (
          <button key={t.label} onClick={() => setFilter(t.value)}
            className="text-[11px] px-3 py-1.5 rounded-full font-medium"
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
                <button onClick={() => review(a.id, "approve")}
                  className="flex-1 py-2 text-[12px] font-medium rounded-[8px] text-white" style={{backgroundColor: C.teal}}>✅ 通过</button>
                <button onClick={() => review(a.id, "reject")}
                  className="flex-1 py-2 text-[12px] font-medium rounded-[8px] text-white" style={{backgroundColor: C.coral}}>❌ 驳回</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
