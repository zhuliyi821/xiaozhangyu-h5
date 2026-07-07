"use client";

/**
 * 🔗 分享按钮 — 微信专属
 *
 * 点击 → 复制内容到剪贴板 → 提示去微信粘贴
 * 尝试通过 URL Scheme 打开微信
 */

import { Share2 } from "lucide-react";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

interface ShareButtonProps {
  data: ShareData;
  size?: "sm" | "md";
  className?: string;
  onShared?: () => void;
}

export default function ShareButton({ data, size = "sm", className = "", onShared }: ShareButtonProps) {
  const shareUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const content = buildShareText(data.title, data.text, shareUrl);
    await shareToWeChat(content);
    onShared?.();
  }

  const btnSize = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <button
      onClick={handleShare}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all active:scale-90 ${className || "bg-white/80 text-text-secondary hover:bg-brand-teal hover:text-white"}`}
      aria-label="分享到微信"
    >
      <Share2 className="w-3.5 h-3.5" />
    </button>
  );
}
