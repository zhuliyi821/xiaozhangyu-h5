"use client";

import { useState, useCallback } from "react";
import { API_BASE } from "@/config/api";
import type { Position, TradeRecord } from "./use-futures-positions";

interface TradingConfig {
  uid: number | undefined;
  contract: string;
  contractName: string;
  multiplier: number;
  currentPrice: number;
}

export function useFuturesTrading(config: TradingConfig) {
  const { uid, contract, contractName, multiplier, currentPrice } = config;
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [lots, setLots] = useState(1);
  const [leverage, setLeverage] = useState(10);
  const [operating, setOperating] = useState(false);
  const [error, setError] = useState("");
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const calcMargin = useCallback((price: number, lot: number, lev: number) => {
    return Math.round(price * multiplier * lot / lev);
  }, [multiplier]);

  const marginNeeded = calcMargin(currentPrice || 4000, lots, leverage);
  const marginPct = Math.round(100 / leverage);

  // 扣保证金
  const deductMargin = async (amount: number): Promise<boolean> => {
    if (!uid) { setError("请先登录"); return false; }
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, action: "bet", amount, lottery: `futures_${contract}` }),
      });
      const d = await res.json();
      if (d.code !== 0) { setError(d.msg || "扣豆失败"); return false; }
      return true;
    } catch {
      setError("扣豆请求失败");
      return false;
    }
  };

  // 结算（平仓）
  const settlePosition = async (returnAmount: number, winAmount: number): Promise<boolean> => {
    if (!uid) return false;
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid, action: "settle",
          return_amount: returnAmount,
          win_amount: winAmount,
          lottery: `futures_${contract}_settle`,
        }),
      });
      const d = await res.json();
      return d.code === 0;
    } catch { return false; }
  };

  const openPosition = useCallback(async (
    realBalance: number,
    usedMargin: number,
    onAddPosition: (pos: Position) => void,
    onAddTrade: (t: TradeRecord) => void,
    onRefreshBalance: () => void,
  ): Promise<boolean> => {
    if (!uid) { setError("请先登录"); return false; }
    if (currentPrice <= 0) { setError("行情数据尚未加载"); return false; }

    setOperating(true);
    setError("");

    const margin = calcMargin(currentPrice, lots, leverage);

    if (realBalance < margin + usedMargin) {
      setError(`⚠️ 游戏豆不足！需要 ${(margin + usedMargin).toLocaleString()}🎮，当前仅 ${realBalance.toLocaleString()}🎮`);
      setOperating(false);
      return false;
    }

    const ok = await deductMargin(margin);
    if (!ok) { setOperating(false); return false; }

    const newPos: Position = {
      id: Date.now(),
      indexCode: contract,
      indexName: contractName,
      direction,
      lots,
      leverage,
      openPrice: currentPrice,
      currentPrice,
      margin,
      pnl: 0,
      pnlPct: 0,
      multiplier,  // 记录开仓时的合约乘数
    };

    onAddPosition(newPos);
    onAddTrade({
      time: new Date().toLocaleTimeString(),
      action: "开仓",
      indexName: contractName,
      direction: direction === "long" ? `做多${leverage}x` : `做空${leverage}x`,
      lots,
      price: currentPrice,
      pnl: 0,
    });

    await onRefreshBalance();
    setLastSuccess(`✅ 开仓成功! ${direction === "long" ? "做多" : "做空"} ${contractName} ${lots}手 · 冻结${margin.toLocaleString()}🎮`);
    setTimeout(() => setLastSuccess(null), 4000);
    setOperating(false);
    return true;
  }, [uid, contract, contractName, currentPrice, direction, lots, leverage, calcMargin]);

  const closePosition = useCallback(async (
    pos: Position,
    currentPriceVal: number,
    onRemove: (id: number, margin: number, pnl: number) => void,
    onAddTrade: (t: TradeRecord) => void,
    onRefreshBalance: () => void,
  ): Promise<boolean> => {
    if (!uid) return false;
    setOperating(true);

    const pnl = pos.direction === "long"
      ? Math.round((currentPriceVal - pos.openPrice) * pos.multiplier * pos.lots)
      : Math.round((pos.openPrice - currentPriceVal) * pos.multiplier * pos.lots);

    const returnAmount = pos.margin;
    const winAmount = pnl > 0 ? pnl : 0;

    const ok = await settlePosition(returnAmount, winAmount);
    if (!ok) { setError("结算失败，请联系客服"); setOperating(false); return false; }

    onRemove(pos.id, pos.margin, pnl);
    onAddTrade({
      time: new Date().toLocaleTimeString(),
      action: "平仓",
      indexName: pos.indexName,
      direction: pos.direction === "long" ? "平多" : "平空",
      lots: pos.lots,
      price: currentPriceVal,
      pnl,
    });

    await onRefreshBalance();
    setLastSuccess(`✅ 平仓成功! ${pos.indexName} ${pnl >= 0 ? `+${pnl.toLocaleString()}⛏️` : `${pnl.toLocaleString()}🎮损失`}`);
    setTimeout(() => setLastSuccess(null), 4000);
    setOperating(false);
    return true;
  }, [uid]);

  return {
    direction, setDirection,
    lots, setLots,
    leverage, setLeverage,
    operating, error, setError,
    lastSuccess,
    marginNeeded, marginPct,
    calcMargin,
    openPosition, closePosition,
  };
}
