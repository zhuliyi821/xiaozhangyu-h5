"use client";

// ─── 统一资产中心 /assets ───
// 替代分散的 /assets + /jiadouzhan + /exchange + /exchange/[asset]
// 头卡(游戏豆) → 3列主力(余额/水晶石/水晶球) → 闲豆 → 智能推荐 → 流水

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE, apiFetch, ApiError } from "@/config/api";
import { PageShell } from "@/components/layout/page-shell";
import { Skeleton, CardSkeleton } from "@/components/layout/skeleton";
import { ErrorState } from "@/components/layout/error-state";
import LoginModal from "@/components/ui/login-modal";
import AssetHeader from "@/components/assets/asset-header";
import PrimaryAssets from "@/components/assets/primary-assets";
import AuxiliaryAssets from "@/components/assets/auxiliary-assets";
import SmartRecommendations from "@/components/assets/smart-recommend";
import RecentFlow from "@/components/assets/recent-flow";
import type { WalletData } from "@/components/assets/asset-types";
import { ASSET_METAS } from "@/components/assets/asset-types";

export default function UnifiedAssetsPage() {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid || 0;
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "exchange">("overview");

  // 加载钱包（等 auth 就绪后才调用 API）
  const loadWallet = useCallback(() => {
    if (authLoading) return; // 等 auth 加载完
    if (!uid) { setLoading(false); return; }
    apiFetch<any>("/wallet_api.php", {
      params: { uid: String(uid), action: "balance" },
    })
      .then(data => {
        setWallet(data);
        setError(null);
      })
      .catch((err: ApiError) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [uid, authLoading]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  // ── 入口检查（等 auth 就绪后再判定未登录） ──
  if (!uid && !authLoading && !loading) {
    return (
      <main className="min-h-screen bg-bg pb-24">
        <div className="flex items-center px-4 h-12 border-b border-gray-100">
          <button onClick={() => window.history.back()} className="text-text-secondary text-lg mr-3">‹</button>
          <h1 className="text-base font-semibold">资产中心</h1>
        </div>
        <div className="mx-4 mt-16 text-center">
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-sm text-text-secondary">登录后查看资产</p>
          <button onClick={() => setShowLogin(true)}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-[10px] text-sm font-semibold">
            立即登录
          </button>
        </div>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </main>
    );
  }

  // ── 错误状态 ──
  if (!loading && error) {
    return (
      <ErrorState
        title="资产加载失败"
        message={error}
        onRetry={() => window.location.reload()}
        className="mt-16"
      />
    );
  }

  // ── 资产操作回调 ──
  const handlePrimaryAction = (key: string, action: string) => {
    switch (action) {
      case "exchange":
        window.location.href = `/exchange?focus=${key}`;
        break;
      case "activate":
        window.location.href = "/jiadouzhan?tab=activate";
        break;
      case "topup":
        window.location.href = "/store";
        break;
      case "dividend":
        window.location.href = `/exchange/credit3`;
        break;
      default:
        window.location.href = `/exchange/${key}`;
    }
  };

  const handleSmartAction = (action: string) => {
    switch (action) {
      case "activate":
        window.location.href = "/jiadouzhan?tab=activate";
        break;
      case "exchange_crystal":
        window.location.href = "/exchange?focus=credit5";
        break;
      case "exchange_balance":
        window.location.href = "/exchange?focus=credit4";
        break;
      case "dividend":
        window.location.href = "/exchange/credit3";
        break;
      case "get_coins":
        window.location.href = "/jiadouzhan";
        break;
    }
  };

  return (
    <main className="min-h-screen bg-bg pb-28">
      {/* ─── 顶部导航 ─── */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="text-text-secondary text-lg">‹</button>
            <h1 className="text-base font-semibold">资产中心</h1>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-[8px] p-0.5">
            <button onClick={() => setActiveTab("overview")}
              className={`px-3 py-1 rounded-[6px] text-[10px] font-medium transition-all ${activeTab === "overview" ? "bg-white text-brand-teal-dark shadow-sm" : "text-gray-400"}`}>
              总览
            </button>
            <button onClick={() => setActiveTab("exchange")}
              className={`px-3 py-1 rounded-[6px] text-[10px] font-medium transition-all ${activeTab === "exchange" ? "bg-white text-brand-teal-dark shadow-sm" : "text-gray-400"}`}>
              兑换
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ 总览 Tab ═══════ */}
      {activeTab === "overview" && (
        <>
          {/* ① 品牌头卡 */}
          <AssetHeader
            gameCoins={Math.floor(wallet?.credit1 || 0)}
            dailyChange={undefined}
            loading={loading}
            onGetCoins={() => window.location.href = "/jiadouzhan"}
            onViewFlow={() => window.location.href = "/orders"}
            onViewGoals={() => window.location.href = "/tasks"}
          />

          {/* ② 3列主力资产 */}
          <PrimaryAssets
            wallet={wallet}
            loading={loading}
            onAction={handlePrimaryAction}
          />

          {/* ③ 闲豆辅助 */}
          <AuxiliaryAssets wallet={wallet} loading={loading} />

          {/* ④ 智能推荐 */}
          <SmartRecommendations wallet={wallet} onAction={handleSmartAction} />

          {/* ⑤ 快捷入口 */}
          <div className="mx-4 mt-3">
            <div className="grid grid-cols-2 gap-2">
              <a href="/jiadouzhan" className="bg-surface rounded-[12px] p-3 border border-gray-100 flex items-center gap-2 active:scale-[0.98] transition-transform">
                <span className="text-lg">📅</span>
                <div>
                  <div className="text-[11px] font-semibold">每日签到</div>
                  <div className="text-[9px] text-text-tertiary">领游戏豆</div>
                </div>
              </a>
              <a href="/tasks" className="bg-surface rounded-[12px] p-3 border border-gray-100 flex items-center gap-2 active:scale-[0.98] transition-transform">
                <span className="text-lg">🎯</span>
                <div>
                  <div className="text-[11px] font-semibold">每日任务</div>
                  <div className="text-[9px] text-text-tertiary">做任务赚豆</div>
                </div>
              </a>
              <a href="/store" className="bg-surface rounded-[12px] p-3 border border-gray-100 flex items-center gap-2 active:scale-[0.98] transition-transform">
                <span className="text-lg">🛒</span>
                <div>
                  <div className="text-[11px] font-semibold">消费赚豆</div>
                  <div className="text-[9px] text-text-tertiary">门店消费赠送</div>
                </div>
              </a>
              <a href="/invite" className="bg-surface rounded-[12px] p-3 border border-gray-100 flex items-center gap-2 active:scale-[0.98] transition-transform">
                <span className="text-lg">🤝</span>
                <div>
                  <div className="text-[11px] font-semibold">邀请好友</div>
                  <div className="text-[9px] text-text-tertiary">得1000豆/人</div>
                </div>
              </a>
            </div>
          </div>

          {/* ⑥ 近期流水 */}
          <RecentFlow uid={uid} limit={5} />
        </>
      )}

      {/* ═══════ 兑换 Tab ═══════ */}
      {activeTab === "exchange" && (
        <div className="mx-4 mt-3">
          {/* 页面内嵌兑换中心 */}
          <iframe
            src="/exchange"
            className="w-full border-0 rounded-[12px]"
            style={{ height: "80vh" }}
            title="兑换中心"
          />
        </div>
      )}

      {/* 登录弹窗 */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </main>
  );
}
