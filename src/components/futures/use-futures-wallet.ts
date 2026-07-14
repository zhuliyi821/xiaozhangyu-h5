"use client";

import { useState, useCallback, useEffect } from "react";
import { API_BASE } from "@/config/api";

export function useFuturesWallet(uid: number | undefined) {
  const [realBalance, setRealBalance] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/wallet_api.php?uid=${uid}&action=balance`);
      const d = await res.json();
      if (d.code === 0) setRealBalance(Math.floor(d.data?.credit1 || 0));
    } catch { /* silent */ }
  }, [uid]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // 每30秒自动刷新余额
  useEffect(() => {
    if (!uid) return;
    const iv = setInterval(fetchBalance, 30000);
    return () => clearInterval(iv);
  }, [uid, fetchBalance]);

  return { realBalance, fetchBalance, setRealBalance };
}
