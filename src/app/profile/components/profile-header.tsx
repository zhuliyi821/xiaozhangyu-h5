"use client";

/** 👤 用户头部：头像、昵称、UID、等级经验条 */
import { useState, useEffect } from "react";
import LoginModal from "@/components/ui/login-modal";
import { apiFetch } from "@/config/api";
import AvatarPicker from "@/components/avatar-picker";
import { getUserAvatar } from "@/lib/avatar-utils";

interface Props {
  user: { uid: number; nickname: string; avatar: string } | null;
  loading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export default function ProfileHeader({ user, loading, onLogin, onLogout }: Props) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  // 兼容 WeChat X5 浏览器：useState + custom event 替代 useSyncExternalStore
  const [avatar, setAvatar] = useState("🐙");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setAvatar(getUserAvatar());
    const onAvatarChange = () => setAvatar(getUserAvatar());
    window.addEventListener("avatar-changed", onAvatarChange);
    return () => window.removeEventListener("avatar-changed", onAvatarChange);
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 pt-3 pb-8 text-white rounded-b-[28px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[52px] h-[52px] rounded-full bg-white/20 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/15 rounded animate-pulse" />
            <div className="h-3 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark px-5 pt-4 pb-9 text-white rounded-b-[28px]">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative w-[52px] h-[52px] shrink-0">
          <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-[26px] border-2 border-white/30 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user ? avatar : "👤"
            )}
          </div>
          {/* 编辑按钮 — 点击选择多元头像 */}
          {user && !user.avatar && (
            <button onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-[8px]"
              aria-label="选择头像">
              ✏️
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => { if (!user) onLogin(); }}
            className="text-base font-semibold text-left truncate w-full"
          >
            {user ? user.nickname : "点击登录"}
          </button>
          <div className="text-xs opacity-80">
            {user ? `UID: ${user.uid}` : "登录同步账户资产"}
          </div>
          {user && <UserLevelBadge uid={user.uid} />}
        </div>

        {/* Logout (仅登录后) */}
        {user && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-[10px] bg-white/15 px-3 py-1 rounded-[8px] hover:bg-white/25 active:bg-white/20"
          >
            退出
          </button>
        )}
      </div>

      {/* Streak row (已登录) */}
      {user && <StreakRow uid={user.uid} />}

      {/* 🎭 多元头像选择器 */}
      <AvatarPicker open={showAvatarPicker} onClose={() => setShowAvatarPicker(false)} />

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[998] bg-black/70 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-[8px] w-[300px] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium text-text-primary mb-4">确定退出登录？</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 rounded-[8px] text-sm text-text-primary">取消</button>
              <button onClick={() => { onLogout(); setShowLogoutConfirm(false); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-[8px] text-sm">退出</button>
            </div>
          </div>
        </div>
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

  if (!level) return <div className="h-3 w-28 bg-white/10 rounded animate-pulse mt-1" />;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-[10px] bg-white/20 rounded-[6px] px-1.5 py-0.5 font-medium">{level.rank}</span>
      <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden max-w-[80px]">
        <div className="h-full bg-gradient-to-r from-brand-gold to-amber-300 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(level.progress, 100)}%` }} />
      </div>
      <span className="text-[9px] opacity-70">{level.xp} EXP</span>
    </div>
  );
}

/** 🔥 连续签到行 */
function StreakRow({ uid }: { uid: number }) {
  const [streak, setStreak] = useState(0);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    apiFetch<{ signed_today: boolean; current_streak: number }>(`/api/sign?uid=${uid}`)
      .then(d => { setSigned(d.signed_today); setStreak(d.current_streak); })
      .catch(() => {});
  }, [uid]);

  const handleSign = async () => {
    if (signing || signed) return;
    setSigning(true);
    try {
      await apiFetch("/api/sign", { method: "POST", body: JSON.stringify({ uid }) });
      setSigned(true);
      setStreak(s => s + 1);
    } catch {} finally { setSigning(false); }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex items-center gap-1 bg-white/15 rounded-[8px] px-2.5 py-1">
        <span className="text-[11px]">🔥</span>
        <span className="text-[10px]">连续 <strong>{streak}</strong> 天</span>
      </div>
      <button
        onClick={handleSign}
        disabled={signed || signing}
        className="text-[9px] bg-brand-gold text-white rounded-[8px] px-3 py-1 font-medium disabled:opacity-50 disabled:cursor-default active:scale-95 transition-transform"
      >
        {signing ? '...' : signed ? '已签到' : '✋ 签到'}
      </button>
      {streak >= 6 && (
        <span className="text-[9px] text-amber-200 ml-auto">明日双倍 🎉</span>
      )}
    </div>
  );
}
