"use client";

/**
 * 🎭 头像选择器弹窗
 *
 * 12 个多元头像选项，覆盖职业/年龄/家庭/残障群体。
 * 用户点击选择后存储到 localStorage，立刻全局生效。
 */
import { useState } from "react";
import { AVATAR_OPTIONS, getUserAvatar, setUserAvatar } from "@/lib/avatar-utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AvatarPicker({ open, onClose }: Props) {
  const [current, setCurrent] = useState(getUserAvatar());
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSelect = (emoji: string) => {
    setCurrent(emoji);
    setUserAvatar(emoji);
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[16px] w-full max-w-[360px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="text-[15px] font-semibold text-text-primary mb-1">选一个代表你的头像</div>
          <div className="text-[11px] text-text-tertiary">每个人都是独一无二的</div>
        </div>

        {/* Current preview */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-gold/20 flex items-center justify-center text-[32px] border-2 border-brand-teal/30">
            {current}
          </div>
        </div>

        {/* Avatar grid */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.map((opt) => (
              <button key={opt.emoji}
                onClick={() => handleSelect(opt.emoji)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-[12px] transition-all active:scale-95 ${
                  current === opt.emoji
                    ? "bg-brand-teal/10 border border-brand-teal/30"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
                aria-label={`选择${opt.label}头像`}
              >
                <span className="text-[24px]">{opt.emoji}</span>
                <span className="text-[9px] text-text-tertiary">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save feedback */}
        {saved && (
          <div className="pb-4 text-center text-[12px] text-brand-teal-dark font-medium">
            ✅ 已更新头像
          </div>
        )}

        {/* Close */}
        <div className="px-5 pb-4">
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-50 text-text-secondary rounded-[10px] text-[12px] font-medium hover:bg-gray-100 transition-colors"
            aria-label="关闭头像选择器"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
