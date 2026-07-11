"use client";

/** 🎫 赛季通行证 — 免费/付费双路线，活跃度驱动等级 */
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

const SEASON_LABEL = "S1 · 盛夏启航";

// 20 级奖励表
const PASS_LEVELS = [
  { level: 1, free: "200🎮", premium: "500🎮+5EXP" },
  { level: 2, free: "50⛏️", premium: "150⛏️" },
  { level: 3, free: "300🎮", premium: "800🎮+10EXP" },
  { level: 4, free: "🔮 水晶球碎片×1", premium: "🔮 水晶球×1" },
  { level: 5, free: "500🎮", premium: "1000🎮+💎神秘宝箱" },
  { level: 6, free: "80⛏️", premium: "200⛏️" },
  { level: 7, free: "600🎮", premium: "1200🎮+15EXP" },
  { level: 8, free: "🔮 水晶球碎片×2", premium: "🔮 水晶球×2" },
  { level: 9, free: "800🎮", premium: "1500🎮" },
  { level: 10, free: "🏆 限定头像框", premium: "🏆 限定头像框+100⛏️" },
  { level: 11, free: "200🎮", premium: "600🎮+10EXP" },
  { level: 12, free: "100⛏️", premium: "300⛏️" },
  { level: 13, free: "500🎮", premium: "1200🎮" },
  { level: 14, free: "🔮 水晶球碎片×3", premium: "🔮 水晶球×3" },
  { level: 15, free: "🎁 神秘礼盒", premium: "🎁 高级神秘礼盒" },
  { level: 16, free: "800🎮", premium: "2000🎮+15EXP" },
  { level: 17, free: "150⛏️", premium: "400⛏️" },
  { level: 18, free: "1000🎮", premium: "2500🎮" },
  { level: 19, free: "🔮 水晶球碎片×5", premium: "🔮 水晶球×5" },
  { level: 20, free: "🏆 S1限定称号", premium: "👑 S1限定称号+5000🎮" },
];

// 每级所需活跃度 (递增)
const XP_PER_LEVEL = (lvl: number) => 100 + lvl * 20;

export default function PassPage() {
  const { user, loading: authLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [hasPremium, setHasPremium] = useState(false);
  const [currentXP, setCurrentXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [xpInLevel, setXpInLevel] = useState(0);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Season end: 30 days from now
  const seasonEnd = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 29); return d;
  }, []);

  // Countdown
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const left = seasonEnd.getTime() - now;
      if (left <= 0) { setCountdown("已结束"); return; }
      const d = Math.floor(left / 86400000);
      const h = Math.floor((left % 86400000) / 3600000);
      setCountdown(`${d}天${h}小时`);
    };
    tick();
    const iv = setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [seasonEnd]);

  // Load pass data from API
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    setLoading(true);
    apiFetch<{
      season_id: string; xp: number; current_level: number;
      xp_in_level: number; xp_for_next: number;
      has_premium: number; claimed_levels: number[];
    }>(`/api/pass?uid=${user.uid}`)
      .then(d => {
        setCurrentXP(d.xp);
        setCurrentLevel(d.current_level);
        setXpInLevel(d.xp_in_level);
        setHasPremium(d.has_premium === 1);
        setClaimed(d.claimed_levels || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // Level rewards table
  const xpForNext = XP_PER_LEVEL(currentLevel);
  const progressPct = currentLevel >= PASS_LEVELS.length ? 100
    : Math.round((xpInLevel / xpForNext) * 100);

  const canClaim = (lvl: number) => lvl <= currentLevel && !claimed.includes(lvl);

  const handleBuyPremium = async () => {
    if (!user || isBuying) return;
    setIsBuying(true);
    try {
      await apiFetch("/api/pass/buy", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid }),
      });
      setHasPremium(true);
    } catch (err: any) { alert(err?.msg || "购买失败"); }
    finally { setIsBuying(false); }
  };

  const handleClaimReward = async (lvl: number) => {
    if (!user) return;
    try {
      await apiFetch("/api/pass/claim", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, level: lvl }),
      });
      setClaimed(p => [...p, lvl]);
    } catch (err: any) { alert(err?.msg || "领取失败"); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Season Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white px-5 pt-5 pb-8 rounded-b-[24px]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">🎫 赛季通行证</h1>
          <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-[8px]">{SEASON_LABEL}</span>
        </div>
        <div className="text-[11px] opacity-80 flex items-center gap-1.5">
          <span>⏱️ 赛季剩余</span>
          <span className="text-amber-200 font-medium">{countdown}</span>
        </div>

        {/* Season Progress Card */}
        <div className="mt-3 bg-white/10 rounded-[14px] p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium">等级 {currentLevel}/{PASS_LEVELS.length}</span>
            <span className="text-[11px] opacity-80">{currentXP} 活跃度</span>
          </div>
          <div className="h-2 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] opacity-60">{xpInLevel}/{xpForNext} EXP</span>
            <span className="text-[9px] opacity-60">{progressPct}%</span>
          </div>
        </div>
      </div>

      {/* Premium Status */}
      <div className="mx-4 -mt-4 relative z-10">
        {user ? (
          hasPremium ? (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-[12px] p-3 flex items-center gap-3">
              <span className="text-[20px]">👑</span>
              <div className="flex-1">
                <div className="text-[12px] font-medium text-amber-800">高级通行证已激活</div>
                <div className="text-[10px] text-amber-600">免费奖励×2，水晶球加倍</div>
              </div>
              <span className="text-[10px] bg-amber-200 text-amber-700 px-2 py-1 rounded-[6px]">已激活</span>
            </div>
          ) : (
            <div className="bg-white rounded-[12px] p-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <span className="text-[20px]">🔓</span>
              <div className="flex-1">
                <div className="text-[12px] font-medium">解锁高级通行证</div>
                <div className="text-[10px] text-text-tertiary">免费奖励×2 · 水晶球加倍 · 限定称号</div>
              </div>
              <button onClick={handleBuyPremium} disabled={isBuying}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-medium px-4 py-1.5 rounded-[8px] active:scale-95 transition-transform">
                {isBuying ? "处理中..." : "5,000🎮 解锁"}
              </button>
            </div>
          )
        ) : (
          <button onClick={() => setShowLogin(true)}
            className="w-full bg-white/10 rounded-[12px] py-3 text-center text-[12px] backdrop-blur-sm">
            🔑 登录解锁赛季通行证
          </button>
        )}
      </div>

      {/* Level List */}
      <div className="mx-4 mt-4 pb-6 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-text-tertiary">全部 {PASS_LEVELS.length} 级</span>
        </div>
        {PASS_LEVELS.map((item) => {
          const isClaimed = claimed.includes(item.level) || false;
          const isUnlocked = canClaim(item.level);
          const isCurrent = item.level === currentLevel;

          return (
            <div key={item.level}
              className={`bg-white rounded-[10px] p-3 shadow-sm border transition-all ${
                isCurrent ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'
              } ${!isUnlocked ? 'opacity-50' : ''}`}>
              {/* Level Header */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isClaimed ? 'bg-green-100 text-green-600' :
                  isUnlocked ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isClaimed ? '✓' : item.level}
                </div>
                <div className="flex-1 text-[11px] font-medium">
                  {isClaimed ? '已领取' : isUnlocked ? '可领取' : `等级 ${item.level}`}
                </div>
                {isCurrent && <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-[4px]">当前</span>}
              </div>

              {/* Rewards */}
              <div className="flex gap-2">
                {/* Free Reward */}
                <div className="flex-1 bg-gray-50 rounded-[8px] p-2">
                  <div className="text-[8px] text-text-tertiary mb-0.5">🎁 免费</div>
                  <div className="text-[10px] font-medium">{item.free}</div>
                </div>
                {/* Premium Reward */}
                <div className={`flex-1 rounded-[8px] p-2 ${
                  hasPremium ? 'bg-amber-50' : 'bg-gray-50'
                }`}>
                  <div className={`text-[8px] mb-0.5 ${hasPremium ? 'text-amber-600' : 'text-text-tertiary'}`}>
                    👑 {hasPremium ? '高级' : '锁定'}
                  </div>
                  <div className={`text-[10px] ${hasPremium ? 'font-medium text-amber-800' : 'text-text-tertiary'}`}>
                    {hasPremium ? item.premium : '🔒'}
                  </div>
                </div>
              </div>

              {/* Claim Button */}
              {isUnlocked && !isClaimed && (
                <button onClick={() => handleClaimReward(item.level)}
                  className="w-full mt-1.5 bg-purple-500 text-white text-[10px] font-medium py-1.5 rounded-[8px] active:scale-95 transition-transform">
                  领取奖励
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
