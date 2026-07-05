"use client";

/**
 * 🦞 小龙虾 — 餐饮外卖/到店消费
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { Store, MapPin, ShoppingCart, ChevronRight, Star } from "lucide-react";

interface MenuItem {
  name: string;
  price: string;
  sales: string;
  tag?: string;
}

const popularItems: MenuItem[] = [
  { name: "麻辣小龙虾 (大份)", price: "¥88", sales: "月售 2,356", tag: "🔥 招牌" },
  { name: "蒜蓉小龙虾 (大份)", price: "¥88", sales: "月售 1,892", tag: "人气" },
  { name: "十三香小龙虾", price: "¥78", sales: "月售 1,568", tag: "" },
  { name: "油焖大虾", price: "¥98", sales: "月售 968", tag: "新品" },
  { name: "麻辣田螺", price: "¥28", sales: "月售 1,234", tag: "" },
  { name: "毛豆花生拼盘", price: "¥18", sales: "月售 2,012", tag: "" },
];

export default function LobsterPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-5 pt-6 pb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15),transparent_70%)] blur-[20px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white mb-1">
            <Store className="w-5 h-5" />
            <h1 className="text-lg font-bold">小龙虾</h1>
          </div>
          <p className="text-white/80 text-[12px] mb-3">门店优选的招牌美食, 到店/外卖都送游戏豆</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-white/20 backdrop-blur-sm rounded-[12px] py-2.5 text-white text-xs font-medium active:scale-95 transition-transform">
              🛵 外卖点单
            </button>
            <button className="flex-1 bg-white/20 backdrop-blur-sm rounded-[12px] py-2.5 text-white text-xs font-medium active:scale-95 transition-transform">
              🏪 到店消费
            </button>
          </div>
        </div>
      </div>

      {/* 门店卡片 */}
      <section className="mx-4 -mt-4">
        <div className="bg-surface rounded-[16px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)] flex items-center gap-3">
          <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xl">
            🦞
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">山房烤肉·小龙虾馆</div>
            <div className="flex items-center gap-2 text-[10px] text-text-tertiary mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">北京市朝阳区三里屯路19号</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-medium">4.8</span>
              </div>
              <span className="text-[10px] text-text-tertiary">月售 3,256</span>
              <span className="text-[10px] text-green-600">营业中 10:00-02:00</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
        </div>
      </section>

      {/* 活动Banner */}
      <section className="mx-4 mt-3">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[16px] p-4 border border-amber-200/50">
          <div className="text-xs font-semibold text-amber-700">🎮 限时活动</div>
          <div className="text-[11px] text-amber-600 mt-1">到店消费满 ¥100 送 1000 游戏豆 · 外卖满 ¥80 送 500 游戏豆</div>
        </div>
      </section>

      {/* 热门推荐 */}
      <section className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <span className="w-1 h-4 rounded-sm bg-gradient-to-b from-orange-400 to-red-500" />
            热门推荐
          </h2>
          <span className="text-[10px] text-brand-teal-dark">查看全部 →</span>
        </div>
        <div className="space-y-2.5">
          {popularItems.map((item, i) => (
            <div key={i} className="bg-surface rounded-[14px] p-3.5 flex items-center gap-3 shadow-sm border border-[rgba(69,204,213,0.06)] active:scale-[0.98] transition-transform cursor-pointer">
              <div className="w-14 h-14 rounded-[10px] bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl">
                🦞
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">{item.name}</span>
                  {item.tag && (
                    <span className="shrink-0 text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">{item.tag}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-brand-coral">{item.price}</span>
                  <span className="text-[9px] text-text-tertiary">{item.sales}</span>
                </div>
              </div>
              <button className="shrink-0 w-8 h-8 rounded-full bg-brand-coral/10 flex items-center justify-center active:scale-90 transition-transform">
                <ShoppingCart className="w-4 h-4 text-brand-coral" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 未登录提示 */}
      {!user && (
        <div className="mx-4 mt-4 p-4 bg-surface rounded-[16px] text-center border border-[rgba(69,204,213,0.08)]">
          <p className="text-xs text-text-tertiary mb-2">登录后可使用余额支付, 消费送游戏豆</p>
          <button onClick={() => setShowLogin(true)} className="px-5 py-2 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium rounded-[10px] active:scale-95 transition-transform">
            登录 / 注册
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      )}
    </main>
  );
}
