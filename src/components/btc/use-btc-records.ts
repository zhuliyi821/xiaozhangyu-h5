"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(`${API_BASE}/api/backend/${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  return res.json();
};

export interface BetRecord {
  id: number; round_id: number; bet_type: string; choice: string;
  points: number; multiplier: number; is_win: number | null;
  settle_points: number; settle_status: number;
  created_at: string; lucky_number?: number;
  round_no?: string; round_status?: string;
}

export function useBtcRecords(uid: number, tab: string) {
  const [records, setRecords] = useState<BetRecord[]>([]);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const res = await api(`btc-game/fast-my-bets?uid=${uid}`);
    if (res?.code === 0) setRecords(res.data?.list || []);
  }, [uid]);

  useEffect(() => { refresh(); }, [tab, refresh]);
  useEffect(() => {
    const iv = setInterval(refresh, 10000);
    return () => clearInterval(iv);
  }, [refresh]);

  return { records, refresh };
}
