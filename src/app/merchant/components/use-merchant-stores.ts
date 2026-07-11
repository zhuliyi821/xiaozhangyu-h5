"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

/** 获取当前商户的所有门店列表 */
export function useMerchantStores() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`/api/v2/merchant/stores?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.length > 0) {
          setStores(d.data);
          if (!activeStoreId) setActiveStoreId(d.data[0].store_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return { stores, activeStoreId, setActiveStoreId, loading };
}
