"use client";

/**
 * 🔗 分享按钮组件
 *
 * 使用 Web Share API（移动端原生分享），不支持时自动降级到剪贴板复制
 */

import { Share2, Check, Copy } from "lucide-react";
import { useState } from "react";

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

interface ShareButtonProps {
  /** 分享内容 */
  data: ShareData;
  /** 按钮大小 */
  size?: "sm" | "md";
  /** 自定义样式 */
  className?: string;
  /** 分享成功后回调 */
  onShared?: () => void;
}

export default function ShareButton({ data, size = "sm", className = "", onShared }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const shareUrl = data.url || (typeof window !== "undefined" ? window.location.href : "");

  function toast(msg: string) {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();

    // Web Share API (iOS Safari / Android Chrome)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.text, url: shareUrl });
        onShared?.();
        return;
      } catch (err: any) {
        // 用户取消分享不视为错误
        if (err.name !== "AbortError") {
          console.warn("Share failed:", err);
        }
        return;
      }
    }

    // 降级：复制链接到剪贴板
    try {
      const fullText = `${data.title}\n${data.text}\n${shareUrl}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast("✅ 链接已复制");
      onShared?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级：手动复制
      const textarea = document.createElement("textarea");
      textarea.value = `${data.title}\n${data.text}\n${shareUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast("✅ 链接已复制");
      onShared?.();
    }
  }

  const btnSize = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <>
      <button
        onClick={handleShare}
        className={`${btnSize} rounded-full flex items-center justify-center transition-all active:scale-90 ${className || "bg-white/80 text-text-secondary hover:bg-brand-teal hover:text-white"}`}
        aria-label="分享"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      </button>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] bg-black/80 text-white text-xs px-4 py-2 rounded-[20px] shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </>
  );
}
