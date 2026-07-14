"use client";

/** 💬 消息中心 v2 — 真实API + 标记已读 + 品牌色统一 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface MessageItem {
  id: number;
  icon: string;
  type: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [msgs, setMsgs] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMsgs = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/messages/list?action=list&uid=${user.uid}`).then(r => r.json());
      if (r.code === 0) setMsgs(r.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { fetchMsgs(); }, [fetchMsgs]);

  const markRead = async (id: number) => {
    try {
      await fetch(`${API_BASE}/api/messages/read?action=read`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMsgs(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m));
    } catch {}
  };

  const markAllRead = async () => {
    if (!user?.uid) return;
    try {
      await fetch(`${API_BASE}/api/messages/read-all?action=read-all&uid=${user.uid}`, { method: "POST" });
      setMsgs(prev => prev.map(m => ({ ...m, unread: false })));
    } catch {}
  };

  const unread = msgs.filter(m => m.unread).length;

  if (authLoading) return <main className="min-h-screen bg-bg" />;

  if (!user) {
    return (
      <main className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-sm font-medium mb-1">登录后查看消息</p>
        <p className="text-[11px] text-text-tertiary mb-4">系统通知与活动消息</p>
        <button onClick={() => setShowLogin(true)}
          className="bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] px-8 py-2.5 text-sm font-medium">
          立即登录
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-10">
      {/* Header — 品牌色 */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-5 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => window.history.back()} className="text-lg leading-none">&lt;</button>
          <span className="text-base font-medium">消息中心</span>
          {unread > 0 ? (
            <button onClick={markAllRead} className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full active:scale-90">
              全部已读
            </button>
          ) : (
            <span className="text-[10px] opacity-60">已读 {msgs.length}</span>
          )}
        </div>
        {unread > 0 && (
          <div className="text-[11px] opacity-80">{unread} 条未读消息</div>
        )}
      </div>

      {/* Message list */}
      <div className="px-4 mt-3 space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-[10px] p-3.5 animate-pulse border border-gray-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-gray-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-20 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-50 rounded" />
              </div>
            </div>
          ))
        ) : msgs.length === 0 ? (
          <div className="text-center py-16 text-text-tertiary text-[12px]">
            <div className="text-4xl mb-3">💬</div>
            暂无消息
          </div>
        ) : (
          msgs.map(msg => (
            <div key={msg.id} onClick={() => { if (msg.unread) markRead(msg.id); }}
              className={`rounded-[10px] p-3.5 flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-all ${
                msg.unread ? 'bg-brand-teal/5 border border-brand-teal/10' : 'bg-white border border-gray-100'
              }`}>
              <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[16px] shrink-0 ${
                msg.unread ? 'bg-brand-teal/10' : 'bg-gray-100'
              }`}>
                {msg.icon}
              </div>
              <div className="flex-1 min-w-0" onClick={() => { if (msg.unread) markRead(msg.id); }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium">{msg.title}</span>
                  {msg.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-coral shrink-0" />}
                </div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{msg.desc}</div>
                <div className="text-[9px] text-text-tertiary/60 mt-1">{msg.time}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
