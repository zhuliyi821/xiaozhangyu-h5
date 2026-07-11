"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

/** 获取当前商户的所有门店列表 */
export function useMerchantStores() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`/api/v2/merchant/stores?member_id=${user.uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.code === 0 && d.data?.length > 0) setStores(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const activeStoreId = stores.length > 0 ? stores[0].store_id : null;

  return { stores, activeStoreId, loading };
}
