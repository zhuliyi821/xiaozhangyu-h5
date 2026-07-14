"use client";

// ─── PK发布庆祝弹窗 ───
// 火箭动画 + 分享引导 + 后续动作，营造仪式感

import { useEffect, useState } from "react";
import { shareToWeChat } from "@/lib/share-to-wechat";
import type { CelebrationConfig } from "./pk-creator-types";

interface Props {
  config: CelebrationConfig;
  onViewTopic: () => void;
  onAnotherOne: () => void;
  onClose: () => void;
}

export default function PKCelebration({ config, onViewTopic, onAnotherOne, onClose }: Props) {
  const [phase, setPhase] = useState<"rocket" | "show" | "done">("rocket");
  const [copied, setCopied] = useState(false);

  // 火箭动画阶段
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 600);
    const t2 = setTimeout(() => setPhase("done"), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const shareUrl = `${window.location.origin}/pk-hall/${config.category}/${config.topicId}`;
  const shareText = `⚔️ PK挑战：${config.topicTitle} 💰 奖池${config.poolTotal}豆！来参与吧！`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleShareWx = () => {
    shareToWeChat(shareText);
  };

  // 底部卡片动画
  const cardSlideIn = phase === "rocket"
    ? "translate-y-full opacity-0"
    : phase === "show"
    ? "translate-y-0 opacity-100"
    : "translate-y-0 opacity-100";

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/80 animate-fade-in"
      onClick={onClose}>
      {/* 火箭 / 烟花区域 */}
      <div className="relative h-32 mb-4">
        {phase === "rocket" ? (
          <div className="text-6xl animate-bounce">🚀</div>
        ) : (
          <div className="flex gap-2 text-3xl">
            <span className="animate-ping">✨</span>
            <span>🎉</span>
            <span className="animate-ping delay-100">✨</span>
          </div>
        )}
      </div>

      {/* 卡片 */}
      <div className={`bg-white rounded-[16px] w-[340px] p-6 shadow-2xl transition-all duration-500 ${cardSlideIn}`}
        onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div className="text-center mb-4">
          <div className="text-xs text-brand-teal-dark font-semibold mb-1">🎯 发布成功</div>
          <div className="text-sm font-bold leading-snug">{config.topicTitle}</div>
        </div>

        {/* 分享区 */}
        <div className="bg-gradient-to-r from-brand-teal/5 to-brand-gold/5 rounded-[12px] p-4 mb-4">
          <div className="text-[11px] text-gray-500 mb-2">邀请好友来应战</div>
          <div className="flex gap-2">
            <button onClick={handleCopy}
              className="flex-1 py-2.5 bg-white rounded-[8px] text-xs font-medium border border-gray-200 active:scale-95 transition-transform">
              {copied ? "✅ 已复制" : "📋 复制链接"}
            </button>
            <button onClick={handleShareWx}
              className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-xs font-medium active:scale-95 transition-transform">
              💬 分享企微
            </button>
          </div>
        </div>

        {/* 激励信息 */}
        <div className="bg-amber-50 rounded-[8px] px-3 py-2 mb-4 flex items-center gap-2">
          <span className="text-sm">🏆</span>
          <span className="text-[10px] text-amber-700">
            发起人可获得总奖池5%的奖励 · 分享越多参与越多
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button onClick={onViewTopic}
            className="flex-1 py-2.5 bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white rounded-[10px] text-xs font-semibold active:scale-95 transition-transform shadow-sm">
            👀 去看看
          </button>
          <button onClick={onAnotherOne}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-[10px] text-xs font-medium active:scale-95 transition-transform">
            📝 再来一个
          </button>
        </div>
      </div>
    </div>
  );
}
