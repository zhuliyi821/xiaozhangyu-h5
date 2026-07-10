"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const C = { coral: "#F27152", teal: "#45CCD5", bg: "#F5F6FA" };

export default function MerchantOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/orders?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setOrders(d.data.list || []); })
      .catch(() => {});
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F5F6FA]"><div className="animate-spin w-6 h-6 border-2 border-[#F27152] border-t-transparent rounded-full" /></div>;

  return (
    <main className="pb-24 bg-[#F5F6FA] min-h-screen">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold" style={{color:"#1C1C1E"}}>门店订单</h1>
          </div>
        </div>
      </div>
      <div className="mx-4 mt-4">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-[12px] text-gray-400">暂无订单</p>
            <p className="text-[10px] text-gray-300 mt-1">收银台开通后订单将在此展示</p>
          </div>
        ) : orders.map((o, i) => (
          <div key={i} className="bg-white rounded-[10px] p-3.5 shadow-sm mb-2">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium">订单 #{o.order_id}</span>
              <span className="text-[11px] font-medium" style={{color:C.coral}}>¥{o.amount}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-1">{o.created_at}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
