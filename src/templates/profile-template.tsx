"use client";

/**
 * 👤 我的模板（游戏化 v3）
 *
 * 布局：
 *   ① ProfileHeader → 头像/昵称/等级/签到/退出
 *   ② CrystalCard  → 🔮 水晶球精英资产（分红+档位）
 *   ③ AssetOverview → 3项流通资产（游戏豆/水晶石/余额）
 *   ④ DailyQuests  → 今日任务 + 宝箱
 *   ⑤ QuickActions → 消息中心/订单/卡券
 *   ⑥ ServiceList  → 资产中心/社区/收藏/商户/设置
 *   ⑦ InviteBanner → 邀请好友（弱化）
 *
 * 状态：
 *   - loading → ProfileSkeleton
 *   - !user   → LoginPrompt
 *   - user    → 完整游戏化信息页
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCoupons } from "@/lib/api";
import LoginModal from "@/components/ui/login-modal";
import ProfileHeader from "@/app/profile/components/profile-header";
import CrystalCard from "@/app/profile/components/crystal-card";
import AssetOverview from "@/app/profile/components/asset-overview";
import DailyQuests from "@/app/profile/components/daily-quests";
import QuickActions from "@/app/profile/components/quick-actions";
import ServiceList from "@/app/profile/components/service-list";
import InviteBanner from "@/app/profile/components/invite-banner";
import ProfileSkeleton from "@/app/profile/components/skeleton-loader";
import LoginPrompt from "@/app/profile/components/login-prompt";

export default function ProfileTemplate() {
  const { user, loading, logout, refreshBalance } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [liveCredits, setLiveCredits] = useState<{
    credit1: number; credit2: number; credit3: number; credit4: number; credit5: number;
  } | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<{
    isMerchant: boolean; paid: boolean; pendingPay: boolean; hasApply: boolean;
  }>({ isMerchant: false, paid: false, pendingPay: false, hasApply: false });
  const [couponCount, setCouponCount] = useState(0);

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

  // ── 卡券数量 ──
  useEffect(() => {
    if (!user) return;
    getCoupons(user.uid).then(r => setCouponCount(r.available)).catch(() => {});
  }, [user]);

  // ── 商户状态 ──
  useEffect(() => {
    if (!user) return;
    fetch(`/api/store-services?action=apply_status&member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0) {
          setMerchantStatus({
            isMerchant: d.data.has_merchant || false,
            paid: d.data.paid || false,
            pendingPay: d.data.pending_pay || false,
            hasApply: !!d.data.merchant_apply,
          });
        }
      })
      .catch(() => {});
  }, [user]);

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

  // ── 已登录: 游戏化页面 ──
  return (
    <main className="pb-20">
      {/* ① 用户头（含签到） */}
      <ProfileHeader user={user} loading={false} onLogin={() => setShowLogin(true)} onLogout={logout} />

      {/* ② 水晶球精英资产 */}
      <CrystalCard uid={user.uid} />

      {/* ③ 流通资产 */}
      <AssetOverview credits={credits} />

      {/* ④ 今日任务 */}
      <DailyQuests uid={user.uid} onRefreshBalance={handleRefreshBalance} />

      {/* ⑤ 快捷操作 */}
      <QuickActions couponCount={couponCount} isLoggedIn={true} onLogin={() => setShowLogin(true)} />

      {/* ⑥ 服务列表 */}
      <ServiceList isLoggedIn={true} merchantStatus={merchantStatus} onLogin={() => setShowLogin(true)} />

      {/* ⑦ 邀请 */}
      <InviteBanner isLoggedIn={true} uid={user.uid} onLogin={() => setShowLogin(true)} />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
