"use client";

/**
 * 🎯 数字碰 — 未登录预览页
 * 展示品牌头+玩法说明+登录按钮，登录后进入选号区
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  onLogin: () => void;
}

export default function GuestPreview({ onLogin }: Props) {
  return (
    <main className="pb-20 min-h-screen bg-gradient-to-b from-brand-teal/[0.04] to-bg">
      {/* 简易头部 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/service" className="w-7 h-7 flex items-center justify-center text-text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-[13px] font-semibold text-text-primary">数字碰</span>
        <div className="w-7 h-7" />
      </div>

      {/* 品牌头 */}
      <div className="px-4 pt-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-coral to-brand-coral-dark mx-auto flex items-center justify-center text-3xl shadow-lg mb-4">
          🎯
        </div>
        <h1 className="text-xl font-bold text-text-primary mb-1">数字碰</h1>
        <p className="text-[12px] text-text-tertiary mb-6 max-w-[260px] mx-auto">
          选号碰运气，最高赢 500,000 🎮 水晶石！
        </p>
      </div>

      {/* 玩法说明卡片 */}
      <div className="mx-4 bg-white rounded-[12px] border border-brand-teal/10 p-4 shadow-sm mb-4">
        <h3 className="text-[12px] font-semibold text-text-primary mb-3">🎮 玩法说明</h3>
        <div className="space-y-2.5">
          {[
            { step: "①", text: "从红区(1-33)选6个号码 + 蓝区(1-16)选1个号码", icon: "🔴🔵" },
            { step: "②", text: "确认投注，系统自动模拟开奖", icon: "🎲" },
            { step: "③", text: "中奖可得 10🎮 ~ 10,000,000🎮 水晶石", icon: "🏆" },
            { step: "④", text: "支持机选、追热、搏冷等多种策略", icon: "🤖" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="text-[11px] text-text-secondary leading-relaxed">
                <span className="font-semibold text-text-primary">{item.step}</span> {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 号码预览 */}
      <div className="mx-4 bg-white rounded-[12px] border border-brand-teal/10 p-4 shadow-sm mb-6">
        <h3 className="text-[12px] font-semibold text-text-primary mb-3">🔢 号码预览</h3>
        <div className="flex flex-wrap gap-1.5 justify-center mb-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-300 flex items-center justify-center text-[11px] font-bold text-red-600">
              {String(Math.floor(Math.random() * 33) + 1).padStart(2, "0")}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-[11px] font-bold text-blue-600">
            {String(Math.floor(Math.random() * 16) + 1).padStart(2, "0")}
          </div>
        </div>
        <p className="text-[9px] text-text-tertiary text-center">登录后可自由选号和投注</p>
      </div>

      {/* 登录按钮 */}
      <div className="px-4">
        <button onClick={onLogin}
          className="w-full py-3 rounded-[12px] bg-gradient-to-r from-brand-coral to-brand-coral-dark text-white text-sm font-semibold active:scale-[0.97] transition-transform shadow-md">
          登录开始游戏 →
        </button>
        <p className="text-[10px] text-text-tertiary text-center mt-2">登录即送 150,000 🎮 游戏豆</p>
      </div>
    </main>
  );
}
