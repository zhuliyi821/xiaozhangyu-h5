"use client";

// ─── 统一资产中心 · 近期流水 ───
// 展示最近5条真实流水，可展开查看全部

import { useEffect, useState } from "react";
import { API_BASE } from "@/config/api";
import { BIZ_ICONS, BIZ_LABELS, fmtFull, type FlowItem } from "./asset-types";

interface Props {
  uid: number;
  limit?: number;
}

export default function RecentFlow({ uid, limit = 5 }: Props) {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetch(`${API_BASE}/api/wallet/flow?uid=${uid}&limit=${limit}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data) setItems(d.data.list || d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid, limit]);

  if (loading) {
    return (
      <div className="mx-4 mt-4">
        <div className="text-[11px] font-semibold text-text-primary mb-2">📊 近期流水</div>
        <div className="bg-surface rounded-[12px] p-4 border border-gray-100">
          {[1,2,3].map(i => <div key={i} className="h-6 bg-gray-50 rounded mb-2 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-text-primary">📊 近期流水</span>
        <a href="/orders" className="text-[9px] text-brand-teal-dark font-medium">查看全部 ›</a>
      </div>
      <div className="bg-surface rounded-[12px] border border-gray-100 overflow-hidden">
        {items.map((item, i) => {
          const isIn = item.amount >= 0;
          const icon = BIZ_ICONS[item.biz_type] || "💫";
          const label = BIZ_LABELS[item.biz_type] || item.biz_type;
          const time = item.created_at?.slice(11, 16) || "";
          return (
            <div key={item.id || i}
              className={`flex items-center gap-3 px-4 py-2.5 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm w-6 text-center">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate">{label}</div>
                <div className="text-[9px] text-text-tertiary">{item.remark || time}</div>
              </div>
              <div className={`text-[12px] font-bold ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                {isIn ? "+" : ""}{fmtFull(item.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
