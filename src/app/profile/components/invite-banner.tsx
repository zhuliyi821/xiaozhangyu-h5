"use client";

/** 🎁 邀请好友（强化版：金色卡片 + 奖励展示） */
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";
import { useState } from "react";

interface Props {
  isLoggedIn: boolean;
  uid?: number;
  onLogin: () => void;
}

export default function InviteBanner({ isLoggedIn, uid, onLogin }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!isLoggedIn || !uid) { onLogin(); return; }
    const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn"}?ref=${uid}`;
    const text = buildShareText("小章鱼 · AI趣预测", "邀请你一起玩！注册即送 150,000 游戏豆 🎉", inviteUrl);
    shareToWeChat(text);
  };

  const handleCopy = () => {
    if (!isLoggedIn || !uid) { onLogin(); return; }
    const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://ws.hi.cn"}?ref=${uid}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-4 mt-3">
      <div className="bg-gradient-to-r from-brand-gold/15 via-amber-50 to-brand-gold/10 rounded-[12px] border border-brand-gold/20 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎁</span>
          <div>
            <div className="text-[13px] font-bold text-brand-gold-dark">邀请好友</div>
            <div className="text-[10px] text-text-tertiary">每邀请1人得 <strong className="text-brand-gold-dark">1,000 游戏豆</strong></div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShare}
            className="flex-1 py-2 bg-gradient-to-r from-brand-gold to-amber-400 text-white rounded-[8px] text-[11px] font-medium active:scale-[0.97] transition-transform shadow-sm">
            分享邀请
          </button>
          <button onClick={handleCopy}
            className="flex-1 py-2 bg-white border border-brand-gold/30 text-brand-gold-dark rounded-[8px] text-[11px] font-medium active:scale-[0.97] transition-transform">
            {copied ? "✅ 已复制" : "复制链接"}
          </button>
        </div>
      </div>
    </div>
  );
}
