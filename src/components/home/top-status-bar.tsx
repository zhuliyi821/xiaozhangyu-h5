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
  const uid = (user as any)?.uid || 0;

  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/api/wallet/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(r => r.json())
      .then(d => { if (d.code === 0) setWallet(d.data); })
      .catch(() => {});

    fetch(`${API_BASE}/api/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    })
      .then(r => r.json())
      .then(d => { if (d.code === 0) setStreak(d.data?.current_streak || 0); })
      .catch(() => {});
  }, [uid]);

  const coins = wallet.credit1 || 0;

  return (
    <div className="bg-white border-b border-[rgba(69,204,213,0.12)] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[13px]">Z</span>
          </div>
          <span className="text-[14px] font-semibold text-text-primary">小章鱼</span>
        </div>
        <div className="flex items-center gap-2">
          {uid ? (
            <Link href="/jiadouzhan"
              className="flex items-center gap-1.5 bg-brand-teal-light/30 px-3 py-1.5 rounded-full text-[12px] font-medium text-brand-teal-dark active:scale-95 transition-transform">
              <span className="font-semibold">{coins.toLocaleString()}</span>
              <span className="text-[9px] bg-brand-teal text-white px-1.5 py-[1px] rounded-full">获取</span>
            </Link>
          ) : (
            <Link href="/profile"
              className="flex items-center gap-1.5 bg-brand-teal text-white px-3 py-1.5 rounded-full text-[12px] font-medium active:scale-95 transition-transform">
              登录领 15 万豆
            </Link>
          )}
          <Link href="/tasks"
            className="flex items-center gap-1 bg-brand-gold-light/40 px-3 py-1.5 rounded-full text-[11px] font-medium text-brand-gold-dark active:scale-95 transition-transform">
            📅 签到
            {streak > 0 && <span className="text-[9px] text-brand-coral font-semibold">第{streak}天</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}
