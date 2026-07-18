"use client";

/**
 * 🏪 商户门店全局 Context
 * 统一管理门店列表、活跃门店切换、商户状态
 * 所有 /merchant/* 页面共用同一门店数据源
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";

export interface StoreItem {
  store_id: number;
  store_name: string;
  operating_state: number;
  address: string;
  thumb: string;
  mobile: string;
  phone?: string;
  intro?: string;
  latitude?: string;
  longitude?: string;
}

interface MerchantContextType {
  /** 门店列表 */
  stores: StoreItem[];
  /** 当前活跃门店 ID */
  activeStoreId: number | null;
  /** 切换活跃门店 */
  setActiveStore: (storeId: number) => void;
  /** 当前门店对象 */
  currentStore: StoreItem | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 手动刷新门店列表 */
  refreshStores: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType>(null!);

export function MerchantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStores = useCallback(async () => {
    if (!user) {
      setStores([]);
      setActiveStoreId(null);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/v2/merchant/stores?member_id=${user.uid}`);
      const d = await r.json();
      if (d.code === 0 && Array.isArray(d.data) && d.data.length > 0) {
        setStores(d.data);
        // 保留当前活跃门店，如果不存在则选第一个
        setActiveStoreId(prev => {
          if (prev && d.data.some((s: StoreItem) => s.store_id === prev)) return prev;
          return d.data[0].store_id;
        });
      } else {
        setStores([]);
        setActiveStoreId(null);
      }
    } catch {
      setStores([]);
    }
    setLoading(false);
  }, [user]);

  // 用户登录后首次加载
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const currentStore = stores.find(s => s.store_id === activeStoreId) || stores[0] || null;

  const setActiveStore = useCallback((storeId: number) => {
    if (stores.some(s => s.store_id === storeId)) {
      setActiveStoreId(storeId);
    }
  }, [stores]);

  return (
    <MerchantContext.Provider value={{
      stores,
      activeStoreId: currentStore?.store_id ?? null,
      setActiveStore,
      currentStore,
      loading,
      refreshStores: fetchStores,
    }}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  return useContext(MerchantContext);
}
