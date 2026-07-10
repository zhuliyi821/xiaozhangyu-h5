"use client";

/**
 * 👤 我的模板（接入真实登录+资产）
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCoupons } from "@/lib/api";
import LoginModal from "@/components/ui/login-modal";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

export interface ProfileMenuItem {
  icon: string;
  label: string;
  sub?: string;
}

const menuItems: ProfileMenuItem[] = [
  { icon: "💰", label: "我的资产" },
  { icon: "💬", label: "社区动态" },
  { icon: "📋", label: "我的订单" },
  { icon: "🎟️", label: "卡券包" },
  { icon: "❤️", label: "我的收藏" },
  { icon: "⚙️", label: "设置" },
];

export default function ProfileTemplate() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [liveCredits, setLiveCredits] = useState<Record<string, number> | null>(null);
  const [isMerchant, setIsMerchant] = useState(false);

  const credits = liveCredits ?? user?.balance ?? { credit1: 0, credit2: 0, credit3: 0, credit4: 0, credit5: 0 };
  const [couponCount, setCouponCount] = useState(0);

  // 从 wallet API 拉取实时资产
  useEffect(() => {
    if (!user) return;
    fetch(`/api/wallet-data?uid=${user.uid}&action=balance`)
      .then(r => r.json())
      .then(d => { if (d.code === 0) setLiveCredits(d.data); })
      .catch(() => {});
  }, [user]);

  // 查卡券数
  useEffect(() => {
    if (!user) return;
    getCoupons(user.uid).then(r => setCouponCount(r.available)).catch(() => {});
  }, [user]);

  // 查商户状态
  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/merchant/status?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => { if (d.code === 0 && d.data.is_merchant) setIsMerchant(true); })
      .catch(() => {});
  }, [user]);

  function handleActivate() {
    if (!user) { setShowLogin(true); return; }
    window.location.href = "/assets";
  }

  function handleInvite() {
    if (!user) { setShowLogin(true); return; }
    const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn"}?ref=${user.uid}`;
    const text = buildShareText("小章鱼 · AI趣预测", "邀请你一起玩！注册即送 150,000 游戏豆 🎉", inviteUrl);
    shareToWeChat(text);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  }

  return (
    <main className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 pt-3 pb-8 text-white rounded-b-[28px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[52px] h-[52px] rounded-full bg-white/20 flex items-center justify-center text-[26px] border-2 border-white/30 shrink-0">
            {user ? "🐙" : "👤"}
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
            ) : (
              <>
                <button
                  onClick={() => { if (!user) setShowLogin(true); }}
                  className="text-base font-semibold text-left"
                >
                  {user ? user.nickname : "点击登录"}
                </button>
                <div className="text-xs opacity-80">
                  {user ? `UID: ${user.uid}` : "登录同步账户资产"}
                </div>
                {user && <UserLevelBadge uid={user.uid} />}
              </>
            )}
          </div>
          {user && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-[10px] bg-white/15 px-3 py-1 rounded-[8px]"
            >
              退出
            </button>
          )}
        </div>
      </div>

      {/* Assets 5格 */}
      <div className="mx-4 -mt-4">
        <div className="grid grid-cols-5 gap-1.5">
          <AssetTile icon="🎮" value={formatAsset(credits.credit1)} label="游戏豆" href="/assets?tab=credit1" />
          <AssetTile icon="⛏️" value={formatAsset(credits.credit5)} label="水晶石" href="/assets?tab=credit5" />
          <AssetTile icon="🔮" value={formatAsset(credits.credit3)} label="水晶球" href="/assets?tab=credit3" />
          <AssetTile icon="💰" value={credits.credit4.toFixed(2)} label="余额" href="/assets?tab=credit4" />
          <AssetTile icon="🫘" value={formatAsset(credits.credit2)} label="闲豆" href="/assets?tab=credit2" />
        </div>
      </div>

      {/* 消息卡片 */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 rounded-[8px] px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer shadow-sm"
          onClick={() => window.location.href = "/messages"}>
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm">💬</div>
          <div className="flex-1">
            <div className="text-xs font-medium text-blue-800">消息中心</div>
            <div className="text-[10px] text-blue-500/70">查看系统通知与活动消息</div>
          </div>
          <span className="text-blue-400 text-xs">→</span>
        </div>
      </div>

      {/* Invite Card */}
      <div className="mx-4 mt-4">
        <div
          onClick={handleInvite}
          className="bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-[8px] p-4 text-white shadow-md active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🎁</div>
            <div className="flex-1">
              <div className="text-sm font-bold">邀请好友赚游戏豆</div>
              <div className="text-[11px] text-white/80 mt-0.5">每邀请 1 人得 1,000 游戏豆 · 好友得 150,000</div>
            </div>
            <div className="bg-white/20 rounded-full px-3 py-1 text-[11px] font-medium">
              {inviteCopied ? "✅ 已复制" : "立即邀请"}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mt-4 px-4 space-y-2">
        {menuItems.map((m, i) => (
          <div key={i} onClick={() => {
            const routes: Record<string, string> = {
              "我的资产": "/assets", "社区动态": "/feed", "我的订单": "/orders",
              "卡券包": "/coupons", "我的收藏": "/favorites",
              "设置": "/settings",
            };
            window.location.href = routes[m.label] || "/";
          }}
            className="flex items-center gap-3 bg-surface rounded-[8px] py-3.5 px-4 shadow-sm border border-[rgba(69,204,213,0.06)] active:scale-[0.98] transition-transform cursor-pointer">
            <div className="w-9 h-9 rounded-[10px] bg-brand-teal/10 flex items-center justify-center text-lg">{m.icon}</div>
            <div className="flex-1 text-[13px] font-medium">
              {m.label}
              {m.label === "卡券包" && couponCount > 0 && (
                <span className="text-[11px] text-brand-gold font-normal ml-1">({couponCount}张可用)</span>
              )}
            </div>
            <span className="text-text-tertiary text-sm">{">"}</span>
          </div>
        ))}
      </div>

      {/* Merchant Entry (仅入驻通过后显示) */}
      {isMerchant && (
        <div className="mt-4 px-4">
          <div onClick={() => window.location.href = "/merchant"}
            className="bg-gradient-to-r from-brand-coral to-brand-coral-dark rounded-[8px] p-4 text-white shadow-md active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🏪</div>
              <div className="flex-1">
                <div className="text-sm font-bold">商户管理</div>
                <div className="text-[11px] text-white/80 mt-0.5">商品上架 · 订单管理 · AI员工报告</div>
              </div>
              <div className="bg-white/20 rounded-full px-3 py-1 text-[11px] font-medium">进入 →</div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[8px] w-[300px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium mb-4">确定退出登录？</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-gray-100 rounded-[8px] text-sm">取消</button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-[8px] text-sm">退出</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** 资产格式化: >=1000 显示 k */
function formatAsset(n: number): string {
  if (n >= 100000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.floor(n));
}

function AssetTile({ icon, value, label, href, action }: { icon: string; value: string; label: string; href?: string; action?: string }) {
  return (
    <div className="bg-white rounded-[8px] py-3 px-1 text-center shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
      onClick={() => { if (href) window.location.href = href; }}>
      <div className="text-base mb-0.5">{icon}</div>
      <div className="text-sm font-bold text-text-primary leading-tight">{value}</div>
      <div className="text-[10px] text-text-tertiary mt-0.5">{label}</div>
      {action && (
        <div className="text-[9px] text-brand-gold-dark mt-1.5 bg-brand-gold-light/40 rounded-full py-0.5 px-2 inline-block font-medium">{action}</div>
      )}
    </div>
  );
}

/** 🏆 用户等级徽章 */
function UserLevelBadge({ uid }: { uid: number }) {
  const [level, setLevel] = useState<{
    rank: string; progress: number; xp: number; stats: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn");
    fetch(`${API_BASE}/api/user/level?uid=${uid}`)
      .then(r => r.json())
      .then(j => { if (j.code === 0) setLevel(j.data); })
      .catch(() => {});
  }, [uid]);

  if (!level) return <div className="h-4 w-20 bg-white/10 rounded animate-pulse mt-1" />;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-[10px] bg-white/20 rounded-[6px] px-1.5 py-0.5 font-medium">
        {level.rank}
      </span>
      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden max-w-[80px]">
        <div className="h-full bg-gradient-to-r from-brand-gold to-amber-300 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(level.progress, 100)}%` }} />
      </div>
      <span className="text-[9px] opacity-70">{level.xp}EXP</span>
    </div>
  );
}
