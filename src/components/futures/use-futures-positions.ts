"use client";

import { useState, useCallback, useEffect } from "react";

export interface Position {
  id: number;
  indexCode: string;
  indexName: string;
  direction: "long" | "short";
  lots: number;
  leverage: number;
  openPrice: number;
  currentPrice: number;
  margin: number;
  pnl: number;
  pnlPct: number;
  multiplier: number;  // 开仓时的合约乘数（平仓时必须用这个值）
}

export interface TradeRecord {
  time: string;
  action: string;
  indexName: string;
  direction: string;
  lots: number;
  price: number;
  pnl: number;
}

export function useFuturesPositions(multiplier: number) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [usedMargin, setUsedMargin] = useState(0);
  const [realizedPnl, setRealizedPnl] = useState(0);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [error, setError] = useState("");

  // 更新持仓当前价（外部调用，传入最新price）
  const updatePositions = useCallback((price: number, multiplierVal: number) => {
    if (price <= 0 || positions.length === 0) return;
    setPositions(prev => prev.map(p => ({
      ...p,
      currentPrice: price,
      pnl: p.direction === "long"
        ? Math.round((price - p.openPrice) * multiplierVal * p.lots)
        : Math.round((p.openPrice - price) * multiplierVal * p.lots),
      pnlPct: p.openPrice > 0
        ? parseFloat((((p.direction === "long" ? price - p.openPrice : p.openPrice - price) / p.openPrice) * 100).toFixed(2))
        : 0,
    })));
  }, [positions.length]);

  const addPosition = useCallback((pos: Position) => {
    setPositions(prev => [...prev, pos]);
    setUsedMargin(prev => prev + pos.margin);
  }, []);

  const addTrade = useCallback((trade: TradeRecord) => {
    setTrades(prev => [trade, ...prev]);
  }, []);

  const removePosition = useCallback((posId: number, margin: number, pnl: number) => {
    setPositions(prev => prev.filter(p => p.id !== posId));
    setUsedMargin(prev => prev - margin);
    setRealizedPnl(prev => prev + pnl);
  }, []);

  const reset = useCallback(() => {
    setPositions([]);
    setUsedMargin(0);
    setRealizedPnl(0);
    setTrades([]);
  }, []);

  const floatingPnl = positions.reduce((s, p) => s + p.pnl, 0);

  return {
    positions, usedMargin, realizedPnl, trades,
    floatingPnl, error, setError,
    addPosition, addTrade, removePosition, updatePositions,
    setPositions, setUsedMargin, setRealizedPnl,
    reset,
  };
}
