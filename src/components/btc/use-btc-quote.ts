"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "@/config/api";

interface Quote {
  price: number;
  changePct: number;
  priceFlash: "up" | "down" | null;
}

export function useBtcQuote() {
  const [quote, setQuote] = useState<Quote>({ price: 0, changePct: 0, priceFlash: null });

  const loadQuote = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/btc/overview`).then(r => r.json());
      if (res?.code === 0 && res?.data) {
        setQuote(prev => {
          const oldPrice = prev.price;
          const newPrice = res.data.price;
          const flash = oldPrice > 0 && newPrice !== oldPrice ? (newPrice > oldPrice ? "up" : "down") : null;
          if (flash) setTimeout(() => setQuote(q => ({ ...q, priceFlash: null })), 800);
          return { price: newPrice, changePct: res.data.change_24h_pct || 0, priceFlash: flash };
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadQuote();
    const iv = setInterval(loadQuote, 5000);
    return () => clearInterval(iv);
  }, [loadQuote]);

  return quote;
}
