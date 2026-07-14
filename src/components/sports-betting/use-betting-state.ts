"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";
import {
  Match, PlayTypeId, SportsBet, PlayOption,
  PLAY_TYPE_CONFIGS,
} from "@/app/sports-betting/types";

// ─── 投注状态机阶段 ───
export type BettingPhase =
  | "browsing"
  | "selecting"
  | "slip_open"
  | "submitting"
  | "success"
  | "error";

// ─── 投注单项 ───
export interface SlipItem {
  id: string;
  matchId: string;
  matchLabel: string;
  playType: PlayTypeId;
  playTypeName: string;
  option: string;
  optionLabel: string;
  amount: number;
  estimatedReward: number;
  multiplier: number;
}

// ─── 投注状态 ───
export interface BettingState {
  phase: BettingPhase;
  currentMatchId: string | null;
  selectedPlayType: PlayTypeId | null;
  selectedOption: string | null;
  betAmount: number;
  slipItems: SlipItem[];
  lastBet: SportsBet | null;
  error: string;
}

const MIN_BET = 100;
const BET_AMOUNTS = [100, 500, 1000, 5000];

export function useBettingState(onSuccess?: (bets: SportsBet[]) => void) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<BettingPhase>("browsing");
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [selectedPlayType, setSelectedPlayType] = useState<PlayTypeId | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(MIN_BET);
  const [slipItems, setSlipItems] = useState<SlipItem[]>([]);
  const [lastBet, setLastBet] = useState<SportsBet | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ─── 展开比赛 ───
  const expandMatch = useCallback((matchId: string) => {
    if (currentMatchId === matchId) {
      setCurrentMatchId(null);
      setSelectedPlayType(null);
      setSelectedOption(null);
      setPhase("browsing");
    } else {
      setCurrentMatchId(matchId);
      setSelectedPlayType(null);
      setSelectedOption(null);
      setPhase("selecting");
    }
    setError("");
  }, [currentMatchId]);

  // ─── 选择玩法 ───
  const selectPlayType = useCallback((playType: PlayTypeId) => {
    setSelectedPlayType(playType);
    setSelectedOption(null);
    setBetAmount(MIN_BET);
    setError("");
  }, []);

  // ─── 选择选项 ───
  const selectOption = useCallback((option: string) => {
    setSelectedOption(option);
    setBetAmount(MIN_BET);
    setError("");
  }, []);

  // ─── 添加到投注单 ───
  const addToSlip = useCallback((match: Match, playType: PlayTypeId, optionKey: string, amount: number) => {
    const config = PLAY_TYPE_CONFIGS[playType];
    const opt = config.defaultOptions.find(o => o.key === optionKey);
    if (!opt) return;

    const total = config.defaultOptions.reduce((s, o) => s + o.betAmount, 0);
    const newTotal = total + amount;
    const newMyPool = opt.betAmount + amount;
    const losers = newTotal - newMyPool;
    const losers80 = losers * 0.8;
    const share = amount / newMyPool;
    const reward = Math.floor(losers80 * share * config.multiplier);

    const item: SlipItem = {
      id: `${match.id}_${playType}_${optionKey}_${Date.now()}`,
      matchId: match.id,
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      playType,
      playTypeName: config.name,
      option: optionKey,
      optionLabel: opt.label,
      amount,
      estimatedReward: reward,
      multiplier: config.multiplier,
    };

    setSlipItems(prev => [...prev, item]);
    setBetAmount(MIN_BET);
    setPhase("slip_open");

    return item;
  }, []);

  // ─── 从投注单移除 ───
  const removeFromSlip = useCallback((itemId: string) => {
    setSlipItems(prev => {
      const next = prev.filter(i => i.id !== itemId);
      if (next.length === 0) setPhase("selecting");
      return next;
    });
  }, []);

  // ─── 清空投注单 ───
  const clearSlip = useCallback(() => {
    setSlipItems([]);
    setPhase("browsing");
  }, []);

  // ─── 提交投注单 ───
  const submitSlip = useCallback(async (balance: number): Promise<boolean> => {
    if (!user?.uid) { setError("请先登录"); return false; }
    if (slipItems.length === 0) { setError("投注单为空"); return false; }

    const totalAmount = slipItems.reduce((s, i) => s + i.amount, 0);
    if (totalAmount > balance) {
      setError(`余额不足！需要 ${totalAmount.toLocaleString()}🎮，当前 ${balance.toLocaleString()}🎮`);
      return false;
    }

    setPhase("submitting");
    setSubmitting(true);
    setError("");

    try {
      // 批量提交
      const results: SportsBet[] = [];
      for (const item of slipItems) {
        const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            action: "bet",
            amount: item.amount,
            lottery: `sport_${item.matchId}_${item.playType}_${item.option}`,
          }),
        });
        const d = await res.json();
        if (d.code !== 0) {
          setError(`"${item.matchLabel}" 参与失败: ${d.msg || "未知错误"}`);
          setSubmitting(false);
          return false;
        }

        results.push({
          id: item.id,
          matchId: item.matchId,
          playType: item.playType,
          option: item.option,
          amount: item.amount,
          estimatedReward: item.estimatedReward,
          status: "pending",
        });
      }

      // 全部成功
      const lastResult = results[results.length - 1];
      setLastBet(lastResult);
      setSlipItems([]);
      setCurrentMatchId(null);
      setSelectedPlayType(null);
      setSelectedOption(null);
      setPhase("success");
      onSuccess?.(results);
      setSubmitting(false);
      return true;
    } catch {
      setError("网络错误");
      setSubmitting(false);
      return false;
    }
  }, [user, slipItems, onSuccess]);

  // ─── 参与成功后续操作 ───
  const dismissSuccess = useCallback(() => {
    setPhase("browsing");
    setLastBet(null);
  }, []);

  const betAgain = useCallback(() => {
    setPhase("selecting");
    setLastBet(null);
    setBetAmount(MIN_BET);
  }, []);

  // ─── 预估收益计算 ───
  const calcEstimatedReward = useCallback((playType: PlayTypeId, optionKey: string, amount: number): number => {
    const config = PLAY_TYPE_CONFIGS[playType];
    const opt = config.defaultOptions.find(o => o.key === optionKey);
    if (!opt) return 0;
    const total = config.defaultOptions.reduce((s, o) => s + o.betAmount, 0);
    const newTotal = total + amount;
    const newMyPool = opt.betAmount + amount;
    const losers = newTotal - newMyPool;
    const losers80 = losers * 0.8;
    const share = amount / newMyPool;
    return Math.floor(losers80 * share * config.multiplier);
  }, []);

  const totalSlipAmount = slipItems.reduce((s, i) => s + i.amount, 0);
  const totalSlipReward = slipItems.reduce((s, i) => s + i.estimatedReward, 0);

  return {
    // 状态
    phase, currentMatchId, selectedPlayType, selectedOption,
    betAmount, slipItems, lastBet, error, submitting, MIN_BET, BET_AMOUNTS,
    totalSlipAmount, totalSlipReward,

    // 操作
    expandMatch, selectPlayType, selectOption, setBetAmount,
    addToSlip, removeFromSlip, clearSlip, submitSlip,
    dismissSuccess, betAgain, calcEstimatedReward,
    setError,
  };
}
