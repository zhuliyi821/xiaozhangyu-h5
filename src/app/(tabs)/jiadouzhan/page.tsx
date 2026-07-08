"use client";

/**
 * 🏪 加豆站 — 资产聚合中心
 *
 * 七大模块: 资产卡片(含冻结) | 激活引导 | 邀请好友 | 兑换中心 | 快捷入口 | 日常任务 | 游戏豆流水
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginModal from "@/components/ui/login-modal";
import { apiFetch } from "@/config/api";
import {
  Gift, ShoppingBag, MapPin,
  ChevronRight, ArrowDownUp, RefreshCw, ArrowRightLeft,
} from "lucide-react";
import ExchangeModal from "./exchange-modal";
import DailyTasks from "./daily-tasks";
import { shareToWeChat, buildShareText } from "@/lib/share-to-wechat";

// ─── 接口 ───
interface WalletBrief {
  credit1: number;
  credit2: number;
  credit3: number;
  credit4: number;
  credit5: number;
}

interface FlowItem {
  id: number;
  biz_type: string;
  asset_type: string;
  amount: number;
  remark: string;
  created_at: string;
}

// 冻结比例（后续从后端API获取）
const CRYSTAL_FROZEN_RATIO = 0.7;

// ─── 组件 ───

function AssetCard({ credits, frozenRatio, onExchangeClick }: { credits: WalletBrief; frozenRatio: number; onExchangeClick: () => void }) {
  const totalCrystal = Math.floor(credits.credit5);
  // 冻结比例由父组件决定，统一来源
  const totalBall = Math.floor(credits.credit3);
  const totalIdle = Math.floor(credits.credit2);
  const frozen = Math.floor(totalCrystal * frozenRatio);
  const active = totalCrystal - frozen;
  const frozenPct = totalCrystal > 0 ? Math.round((frozen / totalCrystal) * 100) : 0;
  const totalValuation = Math.floor(credits.credit1) + totalCrystal + totalBall + credits.credit4;

  return (
    <section className="mx-4 mt-4">
      <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text text-sm font-semibold">💰 我的资产</h2>
          <span className="text-text-tertiary text-[10px]">总估值 ≈ {totalValuation.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {/* 游戏豆 */}
          <div className="bg-bg rounded-[12px] p-3 text-center">
            <div className="text-2xl mb-1">🎮</div>
            <div className="text-text text-sm font-bold">{credits.credit1.toLocaleString()}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">游戏豆</div>
          </div>

          {/* 水晶石 — 拆分冻结/可用 */}
          <div className="bg-bg rounded-[12px] p-3 text-center">
            <div className="text-2xl mb-1">⛏️</div>
            <div className="text-text text-sm font-bold">{totalCrystal.toLocaleString()}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">水晶石</div>
            {frozen > 0 && (
              <div className="mt-1.5 space-y-0.5">
                <div className="flex justify-center gap-2 text-[9px]">
                  <span className="text-brand-coral">🔒 {frozen}冻结</span>
                  <span className="text-brand-teal">✅ {active}可用</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mx-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-coral to-brand-gold"
                    style={{ width: `${totalCrystal > 0 ? (active / totalCrystal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 水晶球 */}
          <div className="bg-bg rounded-[12px] p-3 text-center">
            <div className="text-2xl mb-1">🔮</div>
            <div className="text-text text-sm font-bold">{totalBall.toLocaleString()}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">水晶球</div>
            <div className="text-[8px] text-text-tertiary mt-0.5">享分红</div>
          </div>
        </div>

        {/* 第二行: 余额 + 闲豆 */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* 余额 */}
          <div className="bg-bg rounded-[12px] p-3 text-center">
            <div className="text-2xl mb-1">💵</div>
            <div className="text-text text-sm font-bold">¥{credits.credit4.toFixed(2)}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">余额</div>
          </div>
          {/* 闲豆 */}
          <div className="bg-bg rounded-[12px] p-3 text-center">
            <div className="text-2xl mb-1">🫘</div>
            <div className="text-text text-sm font-bold">{totalIdle.toLocaleString()}</div>
            <div className="text-text-tertiary text-[10px] mt-0.5">闲豆</div>
            <div className="text-[8px] text-text-tertiary mt-0.5">商城专用</div>
          </div>
        </div>

        {/* 兑换入口按钮 */}
        <button
          onClick={onExchangeClick}
          className="mt-3 w-full bg-surface hover:bg-gray-50 rounded-[12px] px-4 py-2.5 flex items-center justify-between transition-colors active:scale-[0.98] border border-[rgba(69,204,213,0.08)]"
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-brand-teal-dark" />
            <span className="text-text text-[11px] font-medium">兑换中心</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-[9px]">游戏豆↔水晶石↔余额</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
          </div>
        </button>

        {/* 兑换参考 */}
        <div className="mt-2 bg-bg rounded-[10px] px-3 py-2 text-center">
          <span className="text-text-tertiary text-[10px]">💡 1 游戏豆 ≈ 1 水晶石 · 1 元余额 = 100 游戏豆</span>
        </div>
      </div>
    </section>
  );
}

// ─── 激活引导卡片（新增） ───
function ActivationCard({ frozenCount, onExchangeClick }: { frozenCount: number; onExchangeClick: () => void }) {
  if (frozenCount <= 0) return null;
  return (
    <section className="mx-4 mt-3">
      <div className="bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-[20px] p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="text-3xl leading-none mt-1">💎</div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">{frozenCount} 颗水晶石待激活</div>
            <div className="text-white/80 text-[11px] mt-1 leading-relaxed">
              消费获得 100 游戏豆即可激活 100 颗水晶石<br/>
              激活后可兑换余额或继续下注
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href="/store-services"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-gold text-white text-[11px] font-medium rounded-[10px] active:scale-95 transition-transform"
              >
                🛒 去消费赚豆
              </a>
              <button
                onClick={onExchangeClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-[11px] rounded-[10px] active:scale-95 transition-transform"
              >
                🔄 去兑换
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InviteCard() {
  const { user } = useAuth();
  const inviteUrl = user
    ? `https://h5.ws.hi.cn?ref=${user.uid}`
    : "https://h5.ws.hi.cn";

  const handleCopy = () => {
    shareToWeChat(inviteUrl);
  };

  return (
    <section className="mx-4 mt-3">
      <div className="bg-gradient-to-r from-brand-gold to-brand-gold-dark rounded-[20px] p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">邀请好友</span>
          </div>
          <p className="text-white/80 text-[10px] mb-1">好友注册立得 <strong className="text-white">150,000 游戏豆</strong></p>
          <p className="text-white/80 text-[10px] mb-3">你同时获得 <strong className="text-white">1,000 游戏豆</strong></p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-[10px] py-2.5 text-white text-xs font-medium active:scale-95 transition-transform"
            >
              🔗 复制链接
            </button>
            <button
              onClick={() => {
                const text = buildShareText("小章鱼", "邀请你一起玩！注册即送 150,000 游戏豆 🎉", inviteUrl);
                shareToWeChat(text);
              }}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-[10px] py-2.5 text-white text-xs font-medium active:scale-95 transition-transform"
            >
              📤 分享好友
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className="mx-4 mt-3">
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href="/store-services"
          className="bg-surface rounded-[16px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-95 transition-transform block"
        >
          <ShoppingBag className="w-6 h-6 text-brand-teal-dark mb-2" />
          <div className="text-xs font-semibold">购物商城</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">现金/余额支付 · 购物即送豆</div>
        </a>
        <a
          href="/store"
          className="bg-surface rounded-[16px] p-4 shadow-sm border border-[rgba(69,204,213,0.08)] active:scale-95 transition-transform block"
        >
          <MapPin className="w-6 h-6 text-brand-coral mb-2" />
          <div className="text-xs font-semibold">附近消费</div>
          <div className="text-[10px] text-text-tertiary mt-0.5">到店消费送豆 · 扫码领豆</div>
        </a>
      </div>
    </section>
  );
}

function RecentFlow({ uid }: { uid: number }) {
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadFlows = useCallback(() => {
    setLoading(true);
    setError(false);
    apiFetch(`/api/wallet/flow?uid=${uid}&limit=5`)
      .then((d: any) => setFlows(d.list || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => { loadFlows(); }, [loadFlows]);

  const flowIcon: Record<string, string> = {
    exchange: "🔄",
    exchange_beans_to: "🔄",
    exchange_to_game: "🔄",
    register: "🎁",
    bet: "⚽",
    settle: "⚽",
    invite: "🎁",
    shop: "🛒",
    sign: "📋",
    swap_bonus: "🫘",
  };

  return (
    <section className="mx-4 mt-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold flex items-center gap-1">
          <ArrowDownUp className="w-3.5 h-3.5" />
          近期流水
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={loadFlows} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <RefreshCw className="w-3 h-3 text-gray-400" />
          </button>
          <a href="/orders" className="text-[10px] text-brand-teal-dark flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="bg-surface rounded-[16px] border border-[rgba(69,204,213,0.08)] overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-[11px] text-text-tertiary animate-pulse">加载中...</div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-[11px] text-brand-coral">加载失败</div>
            <button onClick={loadFlows} className="mt-2 text-[10px] text-brand-teal-dark underline">点击重试</button>
          </div>
        ) : flows.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-2xl mb-2">📭</div>
            <div className="text-[11px] text-text-tertiary">还没有流水记录</div>
            <div className="text-[10px] text-text-tertiary mt-1">去玩一局预测? 或者逛逛商城?</div>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(69,204,213,0.06)]">
            {flows.slice(0, 5).map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{flowIcon[f.biz_type] || "💎"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate">{f.remark || f.biz_type}</div>
                  <div className="text-[9px] text-text-tertiary">{f.created_at}</div>
                </div>
                <span className={`text-xs font-bold ${f.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {f.amount >= 0 ? "+" : ""}{f.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── 主页面 ───

export default function JiadouzhanPage() {
  const { user, loading: authLoading, refreshBalance } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [credits, setCredits] = useState<WalletBrief>({
    credit1: 0, credit5: 0, credit3: 0, credit4: 0, credit2: 0,
  });
  // 水晶石冻结 — 统一使用全局变量 CRYSTAL_FROZEN_RATIO
  const totalCrystal = Math.floor(credits.credit5);
  const frozenCrystal = Math.floor(totalCrystal * CRYSTAL_FROZEN_RATIO);
  const activeCrystal = totalCrystal - frozenCrystal;

  useEffect(() => {
    if (!user) return;
    const b = user.balance;
    if (b) {
      setCredits({
        credit1: b.credit1 ?? 0,
        credit5: b.credit5 ?? 0,
        credit3: b.credit3 ?? 0,
        credit4: b.credit4 ?? 0,
        credit2: b.credit2 ?? 0,
      });
    }
  }, [user]);

  const handleExchangeSuccess = useCallback(() => {
    if (user?.balance) {
      setCredits({
        credit1: user.balance.credit1 ?? 0,
        credit5: user.balance.credit5 ?? 0,
        credit3: user.balance.credit3 ?? 0,
        credit4: user.balance.credit4 ?? 0,
        credit2: user.balance.credit2 ?? 0,
      });
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-[rgba(69,204,213,0.08)]">
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-base font-semibold">➕ 加豆站</h1>
          <a href="/rules" className="text-[10px] text-text-tertiary flex items-center gap-0.5">
            📋 规则说明 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* 未登录提示 */}
      {authLoading ? (
        <div className="mx-4 mt-8 p-8 text-center animate-pulse">
          <div className="h-6 w-24 bg-gray-200 rounded mx-auto mb-3" />
          <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
        </div>
      ) : !user ? (
        <div className="mx-4 mt-8 p-8 text-center bg-surface rounded-[20px] border border-[rgba(69,204,213,0.08)]">
          <div className="text-4xl mb-3">🐙</div>
          <p className="text-sm text-text-secondary mb-1">来啦! 先登录解锁全部玩法</p>
          <p className="text-[11px] text-text-tertiary mb-4">游戏豆送新用户哦</p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium rounded-[12px] active:scale-95 transition-transform"
          >
            登录 / 注册
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      ) : (
        <>
          {/* 模块一: 资产卡片(含冻结+水晶球+闲豆) + 兑换入口 */}
          <AssetCard credits={credits} frozenRatio={CRYSTAL_FROZEN_RATIO} onExchangeClick={() => setShowExchange(true)} />

          {/* 模块二: 激活引导（新增） */}
          <ActivationCard frozenCount={frozenCrystal} onExchangeClick={() => setShowExchange(true)} />

          {/* 模块三: 邀请好友 */}
          <InviteCard />

          {/* 模块三: 兑换中心 (弹窗) */}
          {showExchange && (
            <ExchangeModal
              open={showExchange}
              onClose={() => setShowExchange(false)}
              onSuccess={handleExchangeSuccess}
            />
          )}

          {/* 模块四: 快捷入口 */}
          <QuickLinks />

          {/* 模块五: 日常任务 */}
          <DailyTasks uid={user.uid} onBalanceRefresh={() => refreshBalance()} />

          {/* 模块六: 游戏豆流水 */}
          <RecentFlow uid={user.uid} />
        </>
      )}
    </main>
  );
}
