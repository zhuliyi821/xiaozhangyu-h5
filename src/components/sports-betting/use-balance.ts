"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/config/api";

export function useBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/lotto-bet-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "balance" }),
      });
      const d = await res.json();
      if (d.code === 0) setBalance(Math.floor(d.data?.game_coins || 0));
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  return { balance, loading, fetchBalance };
}
