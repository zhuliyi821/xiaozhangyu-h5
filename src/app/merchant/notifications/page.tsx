"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const C = { coral: "#F27152", teal: "#45CCD5", gold: "#F2B631", bg: "#F5F6FA", green: "#10B981", purple: "#8B5CF6" };

interface Notice {
  id: number;
  type: "system" | "order" | "audit" | "revenue";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const ICON_MAP: Record<string, string> = {
  system: "💬", order: "📦", audit: "📝", revenue: "💰",
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/notifications?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.length > 0) setNotices(d.data);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const markRead = (id: number) => {
    setNotices(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotices(p => p.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notices.filter(n => !n.read).length;

  return (
    <main className="min-h-screen bg-[#F5F6FA] pb-24">
      <div className="bg-white px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-lg">←</button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">
              {unreadCount > 0 ? `通知 (${unreadCount})` : "通知"}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-[#45CCD5] font-medium">全部已读</button>
          )}
        </div>
      </div>

      <div className="mx-4 mt-4 space-y-2">
        {notices.length === 0 ? (
          <div className="bg-white rounded-[12px] p-8 text-center shadow-sm">
            <p className="text-3xl mb-2">🔔</p>
            <p className="text-[12px] text-gray-400">暂无通知</p>
          </div>
        ) : (
          notices.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              className="bg-white rounded-[10px] p-3.5 shadow-sm flex items-start gap-3 active:scale-[0.99] transition-transform cursor-pointer"
              style={{ opacity: n.read ? 0.6 : 1 }}>
              <span className="text-lg flex-shrink-0 mt-0.5">{ICON_MAP[n.type] || "💬"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium">{n.title}</span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-[#F27152] flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{n.desc}</p>
                <p className="text-[9px] text-gray-300 mt-1">{n.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
