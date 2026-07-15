"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";
import { useAuth } from "@/lib/auth-context";
import { useBtcQuote } from "@/components/btc/use-btc-quote";
import { useBtcWallet } from "@/components/btc/use-btc-wallet";
import { useBtcRecords } from "@/components/btc/use-btc-records";
import { useBtcCountdown } from "@/components/btc/use-btc-countdown";
import { useBtcBetting } from "@/components/btc/use-btc-betting";
import { BtcHeader } from "@/components/btc/btc-header";
import { AssetBar } from "@/components/btc/asset-bar";
import { GameTabs } from "@/components/btc/game-tabs";
import { PricePanel } from "@/components/btc/price-panel";
import { DirectionButtons } from "@/components/btc/direction-buttons";
import { AdvancedPlayPanel } from "@/components/btc/advanced-play-panel";
import { MyBetsPanel } from "@/components/btc/my-bets-panel";
import { RecordTab } from "@/components/btc/record-tab";
import { Toast } from "@/components/btc/toast";

const BTC_API = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}/api/backend/${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  }).then(r => r.json());

export default function BTCGamePage() {
  const { user } = useAuth();
  const uid = (user as any)?.uid || 0;

  const [tab, setTab] = useState("fast");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [poolData, setPoolData] = useState<{ instant_pool: number; cumulative_pool: number } | null>(null);

  const quote = useBtcQuote();
  const { wallet, refresh: refreshWallet } = useBtcWallet(uid);
  const { records, refresh: refreshRecords } = useBtcRecords(uid, tab);
  const { remaining, syncFromServer, reset: resetCountdown } = useBtcCountdown();

  const bet = useBtcBetting(uid);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 行情+轮次数据轮询
  const loadData = useCallback(async () => {
    try {
      const r = await BTC_API("btc-game/fast-status");
      if (r?.code === 0 && r?.data) syncFromServer(r.data.remaining);
    } catch {}
    try {
      const pool = await fetch("/api/pool/status").then(r => r.json());
      if (pool.code === 0) setPoolData(pool.data);
    } catch {}
  }, [syncFromServer]);

  useEffect(() => { loadData(); const iv = setInterval(loadData, 5000); return () => clearInterval(iv); }, [loadData]);

  // 倒计时归零结算
  useEffect(() => {
    if (remaining > 0) return;
    if (bet.activeBetIds.length > 0) {
      bet.settleAll().then(() => { refreshRecords(); refreshWallet(); loadData(); });
    }
  }, [remaining]);

  // Toast 监听 settlement 结果
  useEffect(() => {
    if (bet.lastResult) {
      showToast(
        bet.lastResult.isWin ? `🎉 赢了! +${bet.lastResult.profit} ⛏️ (尾号${bet.lastResult.luckyTail})` : `😅 输了 (尾号${bet.lastResult.luckyTail})`,
        bet.lastResult.isWin ? "success" : "error"
      );
      bet.dismissResult();
    }
  }, [bet.lastResult?.id]);

  const handlePlaceBet = async () => {
    const pts = parseInt(bet.betPoints);
    if (!uid) { showToast("请先登录", "error"); return; }
    if (pts > (wallet.credit1 || 0)) { showToast(`游戏豆不足! 仅 ${(wallet.credit1 || 0).toLocaleString()}🎮`, "error"); return; }
    if (pts < 100) { showToast("最少 100🎮", "error"); return; }

    const ok = await bet.placeBet(wallet.credit1);
    if (ok) {
      showToast(`✅ 投注成功! 60秒后开奖`, "success");
      resetCountdown();
      refreshRecords(); refreshWallet(); loadData();
    } else {
      showToast("投注失败", "error");
    }
  };

  return (
    <main className="pb-24 min-h-screen bg-bg">
      <BtcHeader price={quote.price} symbol="₿ BTC试玩" gameBeans={wallet.credit1 || 0} />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="px-4 pt-3 space-y-3">
        <AssetBar credit1={wallet.credit1 || 0} credit5={wallet.credit5 || 0} credit3={wallet.credit3 || 0} />
        <GameTabs active={tab} onChange={setTab} />

        {tab === "fast" && (
          <div className="space-y-3">
            <PricePanel price={quote.price} changePct={quote.changePct} countdown={remaining}
              poolData={poolData} priceFlash={quote.priceFlash} />

            <div className="bg-surface rounded-[14px] border border-border shadow-card overflow-hidden">
              <DirectionButtons betType={bet.betType} fastDirection={bet.fastDirection}
                onSelectDirection={(dir) => { bet.setBetType("risefall"); bet.setFastDirection(dir); }} />

              {/* 金额选择 + CTA */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-text-tertiary font-medium">参与金额</span>
                  <span className="text-[10px] text-text-tertiary">预计赢 {bet.estimatedReward.toLocaleString()} ⛏️</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {[100, 500, 1000, 5000].map(v => (
                    <button key={v} onClick={() => bet.setBetPoints(String(v))}
                      className={`flex-1 rounded-[8px] py-2 text-xs font-medium transition ${
                        bet.betPoints === String(v) ? "bg-brand-gold/10 text-brand-gold-dark border border-brand-gold/30" : "bg-bg text-text-secondary border border-border"
                      }`}>{v.toLocaleString()}</button>
                  ))}
                </div>

                <button onClick={handlePlaceBet} disabled={bet.loading}
                  className={`w-full rounded-[10px] py-3.5 text-sm font-bold text-white transition-all active:scale-[0.97] shadow-sm ${
                    bet.loading ? "bg-text-tertiary" : "bg-gradient-to-r from-brand-gold to-brand-gold-dark"
                  }`}>
                  {bet.loading ? "⏳ 参与中..." : `🚀 投${parseInt(bet.betPoints).toLocaleString()}豆·赢${bet.estimatedReward.toLocaleString()}⛏️`}
                </button>

                <div className="mt-2 text-[9px] text-text-tertiary text-center">
                  BTC价格尾号 ≥5 = 涨, &lt;5 = 跌 · 60秒一轮
                </div>
              </div>

              <AdvancedPlayPanel betType={bet.betType} bsDirection={bet.bsDirection}
                oeDirection={bet.oeDirection} tailNumber={bet.tailNumber}
                onSelectType={bet.setBetType}
                onSelectBs={bet.setBsDirection}
                onSelectOe={bet.setOeDirection}
                onSelectTail={bet.setTailNumber} />
            </div>

            <MyBetsPanel records={records} activeBetIds={bet.activeBetIds} />

            <div className="bg-surface rounded-[14px] border border-border shadow-card p-3">
              <div className="flex items-center justify-center gap-4 text-[10px] text-text-tertiary">
                <span>👥 {Math.floor(Math.random() * 500) + 800}人正在玩</span>
                <span>⚡ 今日开奖 {Math.floor(Math.random() * 800) + 200}次</span>
                <span>⛏️ 奖池 {(poolData ? (poolData.instant_pool || 0) : 2450).toLocaleString()}</span>
              </div>
            </div>

            {(wallet.credit1 || 0) < 500 && (
              <div className="bg-brand-coral-light/30 rounded-[10px] border border-brand-coral/30 px-3 py-2.5">
                <div className="text-[10px] font-semibold text-brand-coral-dark text-center">🎮 游戏豆不够了? 去做任务赚豆</div>
              </div>
            )}
          </div>
        )}

        {tab === "positions" && (
          <RecordTab records={records} onRefresh={refreshRecords} />
        )}
      </div>
    </main>
  );
}
