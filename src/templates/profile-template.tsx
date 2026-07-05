"use client";

/**
 * 👤 我的模板（接入真实登录+资产）
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCoupons } from "@/lib/api";
import LoginModal from "@/components/ui/login-modal";

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
  { icon: "📊", label: "购彩记录" },
  { icon: "⚙️", label: "设置" },
];

export default function ProfileTemplate() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const credits = user?.balance ?? { credit1: 0, credit2: 0, credit3: 0, credit4: 0, credit5: 0, credit6: 0, granted_game_coins: 0 };
  const [couponCount, setCouponCount] = useState(0);

  // 查卡券数
  useEffect(() => {
    if (!user) return;
    getCoupons(user.uid).then(r => setCouponCount(r.available)).catch(() => {});
  }, [user]);

  function handleActivate() {
    if (!user) { setShowLogin(true); return; }
    window.location.href = "/assets";
  }

  function handleInvite() {
    if (!user) { setShowLogin(true); return; }
    const inviteUrl = `https://h5.ws.hi.cn?ref=${user.uid}`;
    const shareText = `🎮 小章鱼 · AI趣预测\n邀请你一起玩！注册即送 150,000 游戏豆 🎉\n${inviteUrl}`;

    if (navigator.share) {
      navigator.share({ title: "小章鱼 · AI趣预测", text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
      }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = shareText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 2000);
      });
    }
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
              className="text-[10px] bg-white/15 px-3 py-1 rounded-[20px]"
            >
              退出
            </button>
          )}
        </div>

        {/* Assets - click to view all */}
        <div className="grid grid-cols-5 gap-1.5 cursor-pointer" onClick={() => window.location.href = "/assets"}>
          <AssetTile icon="🎮" value={String(Math.floor(credits.credit1))} label="游戏豆" />
          <AssetTile icon="⛏️" value={String(Math.floor(credits.credit5))} label="水晶石" />
          <AssetTile icon="🔮" value={String(Math.floor(credits.credit3))} label="水晶球" />
          <AssetTile icon="¥" value={credits.credit4.toFixed(2)} label="余额" />
          <AssetTile icon="🏪" value={String(Math.floor(credits.credit2))} label="闲豆" />
        </div>
        {user && (
          <div className="mt-2 flex justify-end">
            <span className="text-[10px] opacity-60">资产同步 · 实时更新</span>
          </div>
        )}
        {/* Frozen Beans */}
        {user && credits.credit6 > 0 && (
          <div className="mt-2 flex items-center justify-between bg-white/10 rounded-[12px] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] opacity-80">🧊 冻结豆</span>
              <span className="text-sm font-bold">{Math.floor(credits.credit6)}</span>
            </div>
            <button
              onClick={() => alert("激活功能开发中，请前往资产页操作")}
              className="text-[10px] bg-white/20 px-3 py-1 rounded-[20px] active:scale-95 transition-transform"
            >
              激活
            </button>
          </div>
        )}
      </div>

      {/* Invite Card */}
      <div className="mx-4 mt-4">
        <div
          onClick={handleInvite}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[20px] p-4 text-white shadow-md active:scale-[0.98] transition-transform cursor-pointer"
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
              "卡券包": "/coupons", "我的收藏": "/favorites", "购彩记录": "/orders",
              "设置": "/settings",
            };
            window.location.href = routes[m.label] || "/";
          }}
            className="flex items-center gap-3 bg-surface rounded-[20px] py-3.5 px-4 shadow-sm border border-[rgba(69,204,213,0.06)] active:scale-[0.98] transition-transform cursor-pointer">
            <div className="w-9 h-9 rounded-[10px] bg-bg flex items-center justify-center text-lg">{m.icon}</div>
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

      {/* Login Modal */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {/* Logout Confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[24px] w-[300px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium mb-4">确定退出登录？</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-gray-100 rounded-[14px] text-sm">取消</button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-[14px] text-sm">退出</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function AssetTile({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-white/15 rounded-[12px] py-2 px-1 text-center backdrop-blur-sm">
      <div className="text-xs mb-0.5">{icon}</div>
      <div className="text-[13px] font-bold leading-tight">{value}</div>
      <div className="text-[9px] opacity-80 mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

/** 🏆 用户等级徽章 */
function UserLevelBadge({ uid }: { uid: number }) {
  const [level, setLevel] = useState<{
    rank: string; progress: number; xp: number; stats: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ws.hi.cn";
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
