"use client";

/** 🎁 邀请好友（弱化、紧凑） */
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import { useState } from "react";

interface Props {
  isLoggedIn: boolean;
  uid?: number;
  onLogin: () => void;
}

export default function InviteBanner({ isLoggedIn, uid, onLogin }: Props) {
  const [copied, setCopied] = useState(false);

  const handleInvite = () => {
    if (!isLoggedIn || !uid) { onLogin(); return; }
    const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn"}?ref=${uid}`;
    const text = buildShareText("小章鱼 · AI趣预测", "邀请你一起玩！注册即送 150,000 游戏豆 🎉", inviteUrl);
    shareToWeChat(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={handleInvite}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-gold/10 rounded-[8px] text-[11px] text-brand-gold-dark active:scale-[0.98] transition-transform cursor-pointer"
      >
        <span>🎁</span>
        <span>邀请好友 · 赚 1,000 游戏豆</span>
        {copied && <span className="text-green-600">✅ 已复制</span>}
      </button>
    </div>
  );
}
