"use client";

/**
 * 👤 我的页面 v4 — 5模块紧凑架构
 *
 * 布局：
 *   ① ProfileHeader → 头像/昵称/等级/签到/退出
 *   ② AssetOverview → 4项流通资产（游戏豆/水晶石/水晶球/余额）
 *   ③ DailyQuests  → 今日任务 + 宝箱
 *   ④ QuickGrid     → 8项快捷入口（4×2网格）
 *   ⑤ InviteBanner  → 邀请好友（强化版）
 *
 * 状态：
 *   - loading → ProfileSkeleton
 *   - !user   → LoginPrompt
 *   - user    → 完整页面
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ProfileHeader from "@/app/profile/components/profile-header";
import AssetOverview from "@/app/profile/components/asset-overview";
import DailyQuests from "@/app/profile/components/daily-quests";
import InviteBanner from "@/app/profile/components/invite-banner";
import ProfileSkeleton from "@/app/profile/components/skeleton-loader";
import LoginPrompt from "@/app/profile/components/login-prompt";

export default function ProfileTemplate() {
  const { user, loading, logout, refreshBalance } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [liveCredits, setLiveCredits] = useState<{
    credit1: number; credit2: number; credit3: number; credit4: number; credit5: number;
  } | null>(null);

  const credits = liveCredits ?? user?.balance ?? { credit1: 0, credit2: 0, credit3: 0, credit4: 0, credit5: 0 };

  // ── 拉取实时资产 ──
  const fetchBalance = useCallback(() => {
    if (!user) return;
    fetch(`/api/wallet-data?uid=${user.uid}&action=balance`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setLiveCredits(d.data); })
      .catch(() => {});
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleRefreshBalance = () => {
    fetchBalance();
    refreshBalance();
  };

  // ── Loading: 骨架屏 ──
  if (loading) {
    return <ProfileSkeleton />;
  }

  // ── 未登录: 引导登录 ──
  if (!user) {
    return (
      <main className="pb-20">
        <ProfileHeader user={null} loading={false} onLogin={() => setShowLogin(true)} onLogout={() => {}} />
        <LoginPrompt onLogin={() => setShowLogin(true)} />
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </main>
    );
  }

  // ── 已登录: 5模块页面 ──
  return (
    <main className="pb-20">
      {/* ① 用户头（集成版） */}
      <ErrorBoundary label="用户头">
        <ProfileHeader user={user} loading={false} onLogin={() => setShowLogin(true)} onLogout={logout} />
      </ErrorBoundary>

      {/* ② 资产卡片（4项紧凑版） */}
      <ErrorBoundary label="资产">
        <AssetOverview credits={credits} />
      </ErrorBoundary>

      {/* ③ 今日任务（已修复） */}
      <ErrorBoundary label="任务">
        <DailyQuests uid={user.uid} onRefreshBalance={handleRefreshBalance} />
      </ErrorBoundary>

      {/* ④ 快捷入口（4×2网格） */}
      <ErrorBoundary label="快捷入口">
        <QuickGrid isLoggedIn={true} onLogin={() => setShowLogin(true)} />
      </ErrorBoundary>

      {/* ⑤ 邀请好友（强化版） */}
      <ErrorBoundary label="邀请">
        <InviteBanner isLoggedIn={true} uid={user.uid} onLogin={() => setShowLogin(true)} />
      </ErrorBoundary>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}

/** ⚡ 4×2 快捷入口网格（替代 QuickActions + ServiceList） */
function QuickGrid({ isLoggedIn, onLogin }: { isLoggedIn: boolean; onLogin: () => void }) {
  const items = [
    { icon: "🎮", label: "资产中心", href: "/assets" },
    { icon: "📋", label: "我的订单", href: "/orders" },
    { icon: "🎟️", label: "卡券包", href: "/coupons" },
    { icon: "💬", label: "消息中心", href: "/messages" },
    { icon: "🏆", label: "排行榜", href: "/rank" },
    { icon: "🏅", label: "成就墙", href: "/achievements" },
    { icon: "❤️", label: "我的收藏", href: "/favorites" },
    { icon: "⚙️", label: "设置", href: "/settings" },
  ];

  const handleClick = (href: string) => {
    if (!isLoggedIn) { onLogin(); return; }
    window.location.href = href;
  };

  return (
    <div className="mx-4 mt-3">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => handleClick(item.href)}
            className={`bg-white rounded-[10px] py-3 text-center shadow-sm border border-gray-100 active:scale-[0.96] transition-transform cursor-pointer ${
              !isLoggedIn ? 'opacity-50' : ''
            }`}
          >
            <div className="text-lg mb-0.5">{item.icon}</div>
            <div className="text-[10px] font-medium text-text-primary">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
