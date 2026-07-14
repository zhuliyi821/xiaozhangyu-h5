"use client";

import { useState, useCallback } from "react";
import { API_BASE } from "@/config/api";

function getToken(): string {
  if (typeof window === "undefined") return "";
  try { const u = localStorage.getItem("xiaozhangyu_user"); if (u) return JSON.parse(u).token || ""; } catch {}
  return "";
}

const API = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}/api/backend/${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  }).then(r => r.json());

export type BetType = "risefall" | "big" | "odd" | "tail";
export type BettingPhase = "idle" | "ready" | "betting" | "pending" | "settling" | "result" | "error";

export interface BetResult {
  id: number;
  isWin: boolean;
  profit: number;
  luckyTail: number;
  label: string;
  amount: number;
}

export function useBtcBetting(uid: number, onSettled?: (result: BetResult) => void) {
  const [betType, setBetType] = useState<BetType>("risefall");
  const [fastDirection, setFastDirection] = useState<"涨" | "跌">("涨");
  const [bsDirection, setBsDirection] = useState<"大" | "小">("大");
  const [oeDirection, setOeDirection] = useState<"单" | "双">("单");
  const [tailNumber, setTailNumber] = useState<number | null>(null);
  const [betPoints, setBetPoints] = useState("100");
  const [loading, setLoading] = useState(false);
  const [activeBetIds, setActiveBetIds] = useState<number[]>(() => {
    try { const s = sessionStorage.getItem("btc_bet_ids"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [lastResult, setLastResult] = useState<BetResult | null>(null);

  const getBetInfo = useCallback((): { backendType: string; choice: string; label: string } | null => {
    switch (betType) {
      case "risefall": return { backendType: "risefall", choice: fastDirection, label: fastDirection };
      case "big": return { backendType: "bigsmall", choice: bsDirection, label: bsDirection };
      case "odd": return { backendType: "oddeven", choice: oeDirection, label: oeDirection };
      case "tail":
        if (tailNumber === null) return null;
        return { backendType: "tail", choice: String(tailNumber), label: `尾号${tailNumber}` };
    }
  }, [betType, fastDirection, bsDirection, oeDirection, tailNumber]);

  const placeBet = async (balance: number): Promise<boolean> => {
    const pts = parseInt(betPoints);
    if (!uid) return false;
    if (pts > balance) return false;
    if (pts < 100) return false;
    const info = getBetInfo();
    if (!info) return false;

    setLoading(true);
    const res = await API("btc-game/fast-bet", {
      method: "POST", body: JSON.stringify({ bet_type: info.backendType, choice: info.choice, points: pts, uid, token: getToken() }),
    });
    setLoading(false);

    if (res?.code === 0) {
      const bid = res.data?.bet_id || 0;
      setActiveBetIds(prev => {
        const next = [...prev, bid];
        sessionStorage.setItem("btc_bet_ids", JSON.stringify(next));
        return next;
      });
      return true;
    }
    return false;
  };

  const settleAll = async () => {
    if (activeBetIds.length === 0) return;
    setActiveBetIds([]);
    sessionStorage.removeItem("btc_bet_ids");
    for (const bid of activeBetIds) {
      try {
        const res = await API("btc-game/fast-settle", { method: "POST", body: JSON.stringify({ bet_id: bid }) });
        if (res?.code === 0) {
          const r: BetResult = { id: bid, isWin: res.data?.is_win ?? false, profit: res.data?.profit || 0, luckyTail: res.data?.lucky_tail ?? 0, label: "", amount: 0 };
          setLastResult(r);
          onSettled?.(r);
        }
      } catch {}
    }
  };

  const dismissResult = () => setLastResult(null);
  const resetActiveBetIds = () => { setActiveBetIds([]); sessionStorage.removeItem("btc_bet_ids"); };

  return {
    betType, setBetType,
    fastDirection, setFastDirection,
    bsDirection, setBsDirection,
    oeDirection, setOeDirection,
    tailNumber, setTailNumber,
    betPoints, setBetPoints,
    loading,
    activeBetIds, setActiveBetIds, resetActiveBetIds,
    placeBet, settleAll,
    lastResult, dismissResult,
    estimatedReward: parseInt(betPoints) * 1.8,
  };
}
