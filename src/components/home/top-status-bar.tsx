"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { API_BASE } from "@/config/api";
import Link from "next/link";

interface WalletData {
  credit1: number;
}

export function TopStatusBar() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>({ credit1: 0 });
  const [streak, setStreak] = useState(0);
  const [todaySigned, setTodaySigned] = useState(false);
  const [showNewUserBonus, setShowNewUserBonus] = useState(false);
  const uid = (user as any)?.uid || 0;

  useEffect(() => {
    // 检查是否有未领取的新人礼包
    if (typeof window !== "undefined" && uid) {
      const skipped = localStorage.getItem("onboarding_skipped") === "1";
      const done = localStorage.getItem("onboarding_done") === "1";
      setShowNewUserBonus(skipped && !done);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/wallet_api.php?uid=${uid}&action=balance`)
      .then(r => r.json())
      .then(d => { if (d.code === 0 && d.data) setWallet(d.data); })
      .catch(() => {});

    fetch(`${API_BASE}/api/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(r => r.json())
      .then(d => { if (d.code === 0) { setStreak(d.data?.current_streak || 0); setTodaySigned(d.data?.is_signed || false); } })
      .catch(() => {});
  }, [uid]);

  const coins = wallet.credit1 || 0;

  return (
    <div className="bg-white border-b border-brand-teal/10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/octopus-avatar.png" alt="小章鱼" className="w-5 h-5 object-contain" />
            </div>
            <h1 className="text-[14px] font-semibold text-text-primary">小章鱼</h1>
          </div>
          <div className="flex items-center gap-2">
            {uid ? (
              <Link href="/assets"
                aria-label={`资产中心，当前 ${coins.toLocaleString()} 游戏豆`}
                className="flex items-center gap-1.5 bg-brand-teal-light/30 px-3 py-1.5 rounded-full text-[12px] font-medium text-brand-teal-dark active:scale-95 transition-transform">
                <span className="font-semibold">{coins.toLocaleString()}</span>
                <span className="text-[9px] bg-brand-teal text-white px-1.5 py-[1px] rounded-full">获取</span>
              </Link>
            ) : (
              <Link href="/profile"
                aria-label="登录，领取150,000游戏豆"
                className="flex items-center gap-1.5 bg-brand-teal text-white px-3 py-1.5 rounded-full text-[12px] font-medium active:scale-95 transition-transform">
                登录领150000豆
              </Link>
            )}
            {/* 未领取的新人礼包入口 */}
            {showNewUserBonus && (
              <Link href="/assets"
                aria-label="领取150,000游戏豆新人礼包"
                className="flex items-center gap-1 bg-brand-gold px-2.5 py-1.5 rounded-full text-[11px] font-medium text-white active:scale-95 transition-transform relative animate-pulse">
                🎁 领150000豆
              </Link>
            )}
            <Link href="/tasks"
              aria-label={`签到，${todaySigned ? "已签到" : "未签到"}${streak > 0 ? `，连续${streak}天` : ""}`}
              className="flex items-center gap-1 bg-brand-gold-light/40 px-3 py-1.5 rounded-full text-[11px] font-medium text-brand-gold-dark active:scale-95 transition-transform relative">
              {todaySigned ? "✅" : "📅"} 
              {todaySigned ? "已签" : "签到"}
              {streak > 0 && streak >= 30 && <span className="ml-0.5">💎</span>}
              {streak > 0 && streak >= 7 && streak < 30 && <span className="ml-0.5">🔥</span>}
              {streak > 0 && <span className="text-[9px] text-brand-coral font-semibold ml-0.5">{streak}天</span>}
              {!todaySigned && streak > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-brand-coral rounded-full animate-ping" />
              )}
              {/* 里程碑提示 */}
              {todaySigned && streak === 7 && <span className="text-[7px] text-brand-gold-dark ml-0.5">🎉7日</span>}
              {todaySigned && streak === 30 && <span className="text-[7px] text-purple-600 ml-0.5">🎉月签</span>}
              {!todaySigned && streak > 0 && (
                <span className="text-[7px] text-brand-coral ml-0.5">明日归零</span>
              )}
            </Link>
          </div>
        </div>
      </div>
      {/* 品牌标语条 — 可点击跳转PK大厅 */}
      <Link href="/pk-hall" aria-label="去PK大厅，人人可发起，万事皆可预测" className="block mx-4 mb-3 bg-gradient-to-r from-brand-teal/10 via-brand-gold/10 to-brand-coral/10 rounded-[10px] px-3 py-2 text-center border border-brand-teal/10 active:scale-[0.98] transition-transform">
        <div className="text-[13px] font-medium text-text-primary">人人可发起 · 万事皆可预测</div>
        <div className="text-[10px] text-text-tertiary mt-0.5">为他们加油 · 他们pk你也有奖励</div>
      </Link>
    </div>
  );
}
