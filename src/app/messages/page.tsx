"use client";

/**
 * 💬 消息中心
 *
 * 系统通知与活动消息
 */

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";

const MOCK_MSGS = [
  { id: 1, icon: "🎉", title: "签到成功", desc: "连续签到 3 天，获得 300 游戏豆", time: "2 小时前", unread: false },
  { id: 2, icon: "🏆", title: "成就解锁", desc: "恭喜达成「首战告捷」成就", time: "昨天", unread: false },
  { id: 3, icon: "💰", title: "分红到账", desc: "水晶球今日分红 +25.3 ⛏️ 已到账", time: "昨天", unread: false },
  { id: 4, icon: "🔥", title: "连胜提醒", desc: "你已经 3 连胜了！再来一局", time: "2 天前", unread: true },
  { id: 5, icon: "🎁", title: "优惠券即将到期", desc: "你有 2 张优惠券将在 3 天后过期", time: "3 天前", unread: true },
  { id: 6, icon: "🤝", title: "好友邀请", desc: "你邀请的好友已注册，获得 1,000🎮", time: "5 天前", unread: false },
];

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) return <main className="min-h-screen bg-bg" />;

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

  const unread = MOCK_MSGS.filter(m => m.unread).length;

  return (
    <main className="min-h-screen bg-bg pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 pt-4 pb-5 text-white rounded-b-[28px]">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => window.history.back()} className="text-lg">&lt;</button>
          <span className="text-base font-medium">消息中心</span>
          {unread > 0 && (
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{unread} 条未读</span>
          )}
        </div>
        <div className="text-[11px] opacity-80">系统通知与活动消息</div>
      </div>

      {/* Message list */}
      <div className="px-4 mt-3 space-y-2">
        {MOCK_MSGS.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: msg.unread ? 'rgba(69,204,213,0.03)' : '#fff',
            borderRadius: 10, padding: '11px 14px',
            border: msg.unread ? '1px solid rgba(69,204,213,0.15)' : '1px solid #E5E5EA',
            cursor: 'pointer',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: msg.unread ? 'rgba(69,204,213,0.1)' : '#F1EFE8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>
              {msg.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{msg.title}</div>
                {msg.unread && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#F27152', flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{ fontSize: 10, color: '#636366', marginTop: 1 }}>{msg.desc}</div>
              <div style={{ fontSize: 9, color: '#8E8E93', marginTop: 2 }}>{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
