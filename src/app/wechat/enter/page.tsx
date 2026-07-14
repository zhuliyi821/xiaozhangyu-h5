"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const FEATURES = [
  { href: "/ai-predictions", icon: "🤖", name: "AI趣预测", desc: "AI驱动 · 全民预测", color: "from-brand-teal to-brand-teal-dark" },
  { href: "/pk-hall", icon: "🔥", name: "全民PK", desc: "发起话题赢奖励", color: "from-brand-coral to-brand-coral-dark" },
  { href: "/sports-betting", icon: "⚽", name: "省超竞猜", desc: "12种玩法赢水晶石", color: "from-brand-gold to-amber-600" },
  { href: "/assets", icon: "💰", name: "我的资产", desc: "游戏豆 · 水晶石 · 余额", color: "from-emerald-500 to-teal-600" },
  { href: "/tasks", icon: "📋", name: "每日签到", desc: "签到得游戏豆", color: "from-violet-500 to-purple-600" },
  { href: "/daily-fortune", icon: "🔮", name: "今日运势", desc: "每日幸运指南", color: "from-rose-500 to-pink-600" },
  { href: "/stock-analysis", icon: "📈", name: "股票期指", desc: "AI量化分析", color: "from-blue-500 to-indigo-600" },
  { href: "/btc", icon: "₿", name: "BTC试玩", desc: "模拟交易赢水晶石", color: "from-amber-500 to-orange-600" },
];

export default function WechatEnterPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("xiaozhangyu_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-teal/5 via-white to-white">
      {/* 头卡 */}
      <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-6 pt-10 pb-8 text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-3 rounded-[18px] bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
            <img src="/octopus-avatar.png" alt="小章鱼" className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">小章鱼</h1>
          <p className="text-white/80 text-sm">AI趣预测 · 有奖PK · 赢水晶石</p>
        </div>
      </div>

      {/* 用户信息 */}
      {user && (
        <div className="mx-4 -mt-5 bg-white rounded-xl shadow-sm border border-border-tertiary px-4 py-3 relative z-10 flex items-center gap-3">
          <img src={user.avatar || "/octopus-avatar.png"} className="w-10 h-10 rounded-full border-2 border-brand-teal/30" alt="" />
          <div className="flex-1">
            <div className="text-sm font-semibold">{user.nickname || "微信用户"}</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">🎮 {(user.credit1 || 0).toLocaleString()} 游戏豆</div>
          </div>
          <Link href="/profile" className="text-xs text-brand-teal font-medium">个人中心 →</Link>
        </div>
      )}

      {/* 功能网格 */}
      <div className="px-4 mt-5">
        <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-teal rounded-full inline-block" />
          功能入口
        </h2>
        <div className="grid grid-cols-4 gap-2.5">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href}
              className="bg-white rounded-xl shadow-sm border border-border-tertiary p-3 text-center active:scale-[0.95] transition-transform hover:shadow-md">
              <div className={`w-10 h-10 mx-auto mb-1.5 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-lg shadow-sm`}>
                {f.icon}
              </div>
              <div className="text-[11px] font-semibold text-text-primary">{f.name}</div>
              <div className="text-[8px] text-text-tertiary mt-0.5 leading-tight">{f.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="px-4 mt-5 space-y-2.5">
        <Link href="/merchant/cooperation"
          className="flex items-center gap-3 bg-gradient-to-r from-brand-teal/5 to-white rounded-xl px-4 py-3 border border-brand-teal/10 active:scale-[0.98] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-lg">🏪</div>
          <div>
            <div className="text-sm font-semibold">门店合作</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">区域合伙人 · 门店入驻 · 供应厂商</div>
          </div>
        </Link>
        <Link href="/charity-fund"
          className="flex items-center gap-3 bg-gradient-to-r from-brand-coral/5 to-white rounded-xl px-4 py-3 border border-brand-coral/10 active:scale-[0.98] transition-transform">
          <div className="w-10 h-10 rounded-xl bg-brand-coral/10 flex items-center justify-center text-lg">❤️</div>
          <div>
            <div className="text-sm font-semibold">公益资金池</div>
            <div className="text-[10px] text-text-tertiary mt-0.5">公益PK · 民众捐赠 · 赞助</div>
          </div>
        </Link>
      </div>

      {/* 底部帮助 */}
      <div className="px-4 mt-6 mb-8">
        <details className="bg-gray-50 rounded-xl px-4 py-3">
          <summary className="text-xs font-medium text-text-secondary cursor-pointer">💬 回复关键词获取帮助</summary>
          <div className="mt-2 space-y-1 text-[11px] text-text-tertiary">
            <p>• <b>预测/开奖</b> — AI预测 · 省超竞猜</p>
            <p>• <b>PK</b> — 全民PK · 发起话题</p>
            <p>• <b>资产/余额</b> — 查看资产</p>
            <p>• <b>签到</b> — 每日签到</p>
            <p>• <b>运势</b> — 每日运势</p>
          </div>
        </details>
      </div>

      {/* 底部版权 */}
      <div className="pb-6 text-center text-[10px] text-text-tertiary/50">
        AI趣预测 · 仅娱乐参考 · 理性参与
      </div>
    </div>
  );
}
