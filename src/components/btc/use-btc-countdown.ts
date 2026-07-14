"use client";

import { useState, useEffect, useCallback } from "react";

export function useBtcCountdown() {
  const [remaining, setRemaining] = useState(0);

  // 从服务器同步剩余时间
  const syncFromServer = useCallback((serverRemaining: number) => {
    if (serverRemaining > 0 && serverRemaining < 120) {
      setRemaining(serverRemaining);
    }
  }, []);

  // 每秒递减
  useEffect(() => {
    if (remaining <= 0) return;
    const iv = setInterval(() => setRemaining(c => c - 1), 1000);
    return () => clearInterval(iv);
  }, [remaining]);

  // 归零后等待服务端同步，不再硬编码重置
  // 页面层通过 syncFromServer(r.data.remaining) 从服务端获取真实剩余时间

  const reset = useCallback(() => setRemaining(0), []);

  return { remaining, syncFromServer, reset };
}
