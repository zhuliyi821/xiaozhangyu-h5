"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";

interface Wallet {
  credit1: number;
  credit5: number;
  credit3: number;
}

export function useBtcWallet(uid: number) {
  const [wallet, setWallet] = useState<Wallet>({ credit1: 0, credit5: 0, credit3: 0 });

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/wallet_api.php?uid=${uid}&action=balance`);
      const json = await res.json();
      if (json.code === 0 && json.data) setWallet(json.data);
    } catch {}
  }, [uid]);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 10000);
    return () => clearInterval(iv);
  }, [refresh]);

  return { wallet, refresh };
}
