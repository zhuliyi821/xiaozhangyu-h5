"use client";

/**
 * 🏪 加豆站 — 资产聚合中心
 *
 * 五层递进: 品牌头卡 | 资产概览 | 兑换中心 | 互动赚豆 | 近期流水
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
import NewcomerTasks from "./newcomer-tasks";
import { shareToWeChat, buildShareText, getShareOrigin } from "@/lib/share-to-wechat";

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

const CRYSTAL_FROZEN_RATIO = 0.7;

function formatAsset(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(Math.floor(n));
}

// ─── 组件 ───

/** 一、品牌头卡 */
function BrandHeader({ credits, gameBeans }: { credits: WalletBrief; gameBeans: number }) {
  const totalValuation = Math.floor(credits.credit1) + Math.floor(credits.credit5) + Math.floor(credits.credit3) + credits.credit4;
  return (
    <div>
      <div className="bg-gradient-to-br from-brand-teal to-brand-teal-dark px-4 pt-6 pb-5 relative overflow-hidden">
        <div className="absolute -top-7 -right-7 w-[120px] h-[120px] rounded-full bg-white/8" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl">🐙</div>
          <div className="flex-1">
            <div className="text-white text-base font-bold">加豆站</div>
            <div className="text-white/75 text-[11px] mt-0.5">资产 · 兑换 · 赚豆</div>
          </div>
          <span className="text-white text-xs bg-white/15 px-3 py-1.5 rounded-full font-semibold">
            🎮 {formatAsset(gameBeans)}
          </span>
        </div>
      </div>
      <div className="bg-brand-teal-light/50 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-brand-teal-dark font-medium">总资产估值</span>
        <span className="text-sm font-bold text-brand-teal-dark">≈ {formatAsset(totalValuation)} 🎮</span>
      </div>
    </div>
  );
}

/** 二、资产概览 — 5列灰色格子 */
function AssetGrid({ credits }: { credits: WalletBrief }) {
  const totalCrystal = Math.floor(credits.credit5);
  const frozen = Math.floor(totalCrystal * CRYSTAL_FROZEN_RATIO);
  return (
    <section className="mx-4 mt-4">
      <div className="bg-white rounded-[8px] p-4 shadow-sm border border-brand-teal/10">
        <div className="grid grid-cols-5 gap-2">
          <AssetCell icon="🎮" value={formatAsset(credits.credit1)} label="游戏豆" />
          <AssetCell icon="⛏️" value={formatAsset(totalCrystal)} label="水晶石" sub={frozen > 0 ? `🔒${frozen}冻结` : ""} subColor="text-brand-coral" />
          <AssetCell icon="🔮" value={formatAsset(credits.credit3)} label="水晶球" sub="享分红" subColor="text-brand-teal-dark" />
          <AssetCell icon="💰" value={`¥${credits.credit4.toFixed(2)}`} label="余额" />
          <AssetCell icon="🫘" value={formatAsset(credits.credit2)} label="闲豆" sub="商城" subColor="text-brand-gold-dark" />
        </div>
      </div>
    </section>
  );
}

function AssetCell({ icon, value, label, sub, subColor }: { icon: string; value: string; label: string; sub?: string; subColor?: string }) {
  return (
    <div className="text-center bg-bg rounded-[10px] py-2.5 px-1">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-sm font-bold text-text">{value}</div>
      <div className="text-[10px] text-text-tertiary mt-0.5">{label}</div>
      {sub && <div className={`text-[8px] mt-0.5 ${subColor || "text-text-tertiary"}`}>{sub}</div>}
    </div>
  );
}

/** 三、兑换中心 — 独立青色淡底卡片 */
function ExchangeHub({ onClick }: { onClick: () => void }) {
  return (
    <section className="mx-4 mt-3">
      <div className="bg-brand-teal-light/30 rounded-[8px] p-4 border border-brand-teal-light/50">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-4 h-4 text-brand-teal-dark" />
          <span className="text-sm font-bold text-brand-teal-dark">兑换中心</span>
          <span className="ml-auto text-[10px] text-brand-teal-dark/70">游戏豆↔水晶石↔余额</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ExchangeDir icon="⛏️→🎮" label="水晶石" rate="1:1" />
          <ExchangeDir icon="💰→🎮" label="余额" rate="1:100" />
          <ExchangeDir icon="🔒→🎮" label="激活冻结" rate="消耗豆" />
        </div>
        <button onClick={onClick}
          className="mt-3 w-full bg-brand-teal text-white rounded-[8px] py-2.5 text-xs font-bold active:scale-[0.98] transition-transform">
          去兑换 →
        </button>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-brand-teal-dark/70">1 游戏豆 ≈ 1 水晶石 · 1 元余额 = 100 游戏豆</span>
        </div>
      </div>
    </section>
  );
}

function ExchangeDir({ icon, label, rate }: { icon: string; label: string; rate: string }) {
  return (
    <div className="bg-white rounded-[8px] py-2.5 px-2 text-center border border-gray-100">
      <div className="text-base mb-1">{icon}</div>
      <div className="text-[11px] font-medium text-text">{label}</div>
      <div className="text-[10px] text-text-tertiary mt-0.5">{rate}</div>
    </div>
  );
}

/** 激活引导 — 珊瑚色 */
function ActivationCard({ frozenCount, onExchangeClick }: { frozenCount: number; onExchangeClick: () => void }) {
  if (frozenCount <= 0) return null;
  return (
    <section className="mx-4 mt-3">
      <div className="bg-brand-coral-light/60 rounded-[8px] p-4 border border-brand-coral/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">💎</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-brand-coral-dark">{frozenCount} 颗水晶石待激活</div>
            <div className="text-[11px] text-brand-coral-dark/80 mt-1 leading-relaxed">
              消费获得 100 游戏豆即可激活 100 颗水晶石<br/>
              激活后可兑换余额或继续下注
            </div>
            <div className="flex gap-2 mt-3">
              <a href="/store"
                className="inline-flex items-center gap-1 px-4 py-2 bg-brand-gold text-white text-[11px] font-medium rounded-[10px] active:scale-95 transition-transform">
                🛒 去消费赚豆
              </a>
              <button onClick={onExchangeClick}
                className="inline-flex items-center gap-1 px-4 py-2 bg-white text-brand-coral text-[11px] font-medium rounded-[10px] border border-brand-coral/30 active:scale-95 transition-transform">
                🔄 去兑换
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 邀请好友 — 金色主题 */
function InviteCard() {
  const { user } = useAuth();
  const inviteUrl = user ? `${getShareOrigin()}?ref=${user.uid}` : getShareOrigin();
  const handleCopy = () => shareToWeChat(inviteUrl);
  return (
    <section className="mx-4 mt-3">
      <div className="bg-brand-gold-light/80 rounded-[8px] p-4 border border-brand-gold/30">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-brand-gold-dark mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-bold text-brand-gold-dark">邀请好友</div>
            <p className="text-[11px] text-brand-gold-dark/80 mt-1">
              好友注册立得 <strong>150,000</strong> 游戏豆<br/>
              你同时获得 <strong>1,000</strong> 游戏豆
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={handleCopy}
                className="bg-white/60 rounded-[10px] py-2 text-[11px] text-brand-gold-dark font-medium active:scale-95 transition-transform">
                🔗 复制链接
              </button>
              <button onClick={() => {
                const text = buildShareText("小章鱼", "邀请你一起玩！注册即送 150,000 游戏豆 🎉", inviteUrl);
                shareToWeChat(text);
              }}
                className="bg-white/60 rounded-[10px] py-2 text-[11px] text-brand-gold-dark font-medium active:scale-95 transition-transform">
                📤 分享好友
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 快捷入口 — 横排带色块图标 */
function QuickLinks() {
  return (
    <section className="mx-4 mt-3">
      <div className="grid grid-cols-2 gap-2">
        <a href="/marketplace"
          className="bg-surface rounded-[8px] p-3 shadow-sm border border-brand-teal/10 text-center active:scale-[0.98] transition-transform">
          <div className="w-8 h-8 rounded-[10px] bg-brand-gold-light/60 flex items-center justify-center mx-auto mb-1.5 text-base">🏪</div>
          <div className="text-[11px] font-semibold text-text">全网商品</div>
          <div className="text-[9px] text-text-tertiary mt-0.5">平台·置换·附近</div>
        </a>
        <a href="/store"
          className="bg-surface rounded-[8px] p-3 shadow-sm border border-brand-teal/10 text-center active:scale-[0.98] transition-transform">
          <div className="w-8 h-8 rounded-[10px] bg-brand-coral-light/60 flex items-center justify-center mx-auto mb-1.5 text-base">📍</div>
          <div className="text-[11px] font-semibold text-text">合作门店</div>
          <div className="text-[9px] text-text-tertiary mt-0.5">到店送豆</div>
        </a>
      </div>
    </section>
  );
}

/** 近期流水 */
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
    exchange: "🔄", exchange_beans_to: "🔄", exchange_to_game: "🔄",
    register: "🎁", bet: "⚽", settle: "⚽", invite: "🎁", shop: "🛒", sign: "📋", swap_bonus: "🫘",
  };

  return (
    <section className="mx-4 mt-3 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold flex items-center gap-1 text-text">
          <ArrowDownUp className="w-3.5 h-3.5 text-text-tertiary" />
          近期流水
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={loadFlows} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <RefreshCw className="w-3 h-3 text-text-tertiary" />
          </button>
          <a href="/orders" className="text-[10px] text-brand-teal-dark flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="bg-surface rounded-[8px] border border-brand-teal/10 overflow-hidden">
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
          <div className="divide-y divide-brand-teal/5">
            {flows.slice(0, 5).map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{flowIcon[f.biz_type] || "💎"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-text truncate">{f.remark || f.biz_type}</div>
                  <div className="text-[9px] text-text-tertiary">{f.created_at}</div>
                </div>
                <span className={`text-xs font-bold ${f.amount >= 0 ? "text-brand-teal" : "text-brand-coral"}`}>
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

  const totalCrystal = Math.floor(credits.credit5);
  const frozenCrystal = Math.floor(totalCrystal * CRYSTAL_FROZEN_RATIO);

  useEffect(() => {
    if (!user) return;
    const b = user.balance;
    if (b) {
      setCredits({
        credit1: b.credit1 ?? 0, credit5: b.credit5 ?? 0,
        credit3: b.credit3 ?? 0, credit4: b.credit4 ?? 0,
        credit2: b.credit2 ?? 0,
      });
    }
  }, [user]);

  const handleExchangeSuccess = useCallback(() => {
    if (user?.balance) {
      setCredits({
        credit1: user.balance.credit1 ?? 0, credit5: user.balance.credit5 ?? 0,
        credit3: user.balance.credit3 ?? 0, credit4: user.balance.credit4 ?? 0,
        credit2: user.balance.credit2 ?? 0,
      });
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-bg pb-24">
      {/* ─── 已登录 ─── */}
      {authLoading ? (
        <div className="p-8 text-center animate-pulse">
          <div className="h-6 w-24 bg-gray-200 rounded mx-auto mb-3" />
          <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
        </div>
      ) : !user ? (
        <div className="mx-4 mt-8 p-8 text-center bg-surface rounded-[8px] border border-brand-teal/10">
          <div className="text-4xl mb-3">🐙</div>
          <p className="text-sm text-text-secondary mb-1">来啦! 先登录解锁全部玩法</p>
          <p className="text-[11px] text-text-tertiary mb-4">游戏豆送新用户哦</p>
          <button onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-xs font-medium rounded-[8px] active:scale-95 transition-transform">
            登录 / 注册
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      ) : (
        <>
          {/* 一、品牌头卡 */}
          <BrandHeader credits={credits} gameBeans={credits.credit1} />

          {/* 二、资产概览 — 5列 */}
          <AssetGrid credits={credits} />

          {/* 三、兑换中心 — 独立青色卡片 */}
          <ExchangeHub onClick={() => setShowExchange(true)} />

          {/* 四、激活引导 — 珊瑚色 */}
          <ActivationCard frozenCount={frozenCrystal} onExchangeClick={() => setShowExchange(true)} />

          {/* 五、邀请好友 — 金色 */}
          <InviteCard />

          {/* 六、快捷入口 */}
          <QuickLinks />

          {/* 新手成长任务 — 注册奖励5步拆分 */}
          <NewcomerTasks uid={user.uid} onBalanceRefresh={() => refreshBalance()} />

          {/* 七、日常任务 */}
          <DailyTasks uid={user.uid} onBalanceRefresh={() => refreshBalance()} />

          {/* 八、近期流水 */}
          <RecentFlow uid={user.uid} />

          {/* 兑换弹窗 */}
          {showExchange && (
            <ExchangeModal
              open={showExchange}
              onClose={() => setShowExchange(false)}
              onSuccess={handleExchangeSuccess}
            />
          )}
        </>
      )}
    </main>
  );
}
