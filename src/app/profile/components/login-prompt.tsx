"use client";

/** 🔑 未登录状态提示：大号登录CTA + 功能说明 */
import LoginModal from "@/components/ui/login-modal";
import { useState } from "react";

interface Props {
  onLogin: () => void;
}

export default function LoginPrompt({ onLogin }: Props) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-[10px] p-6 text-center shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">🐙</div>
          <div className="text-sm font-medium text-text-primary mb-1">登录后体验完整功能</div>
          <div className="text-[11px] text-text-tertiary mb-4">查看资产、管理订单、参与活动</div>
          <button
            onClick={() => setShowLogin(true)}
            className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[8px] text-sm font-medium active:scale-[0.98] transition-transform shadow-sm"
          >
            立即登录
          </button>
        </div>
      </div>

      {/* 快速引导列表 */}
      <div className="mt-3 px-4 space-y-2">
        {[
          { icon: "🎮", text: "查资产 · 兑好礼" },
          { icon: "📋", text: "看订单 · 查物流" },
          { icon: "🎟️", text: "领卡券 · 享优惠" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/60 rounded-[8px] py-3 px-4 border border-gray-100">
            <div className="w-8 h-8 rounded-[8px] bg-brand-teal/5 flex items-center justify-center text-base">{item.icon}</div>
            <div className="text-[12px] text-text-tertiary">{item.text}</div>
          </div>
        ))}
      </div>

      {showLogin && <LoginModal onClose={() => { setShowLogin(false); onLogin(); }} />}
    </>
  );
}
