"use client";
import { createContext, useContext, ReactNode } from "react";
import { C } from "@/lib/brand-colors";

export interface StoreTheme {
  color: string;
  logo: string;
}

export interface ModuleConfig {
  id: string;
  type: string;
  enabled: boolean;
  sort_order: number;
  config: Record<string, any>;
}

export interface DecorationConfig {
  store_id: number;
  industry: string;
  theme_color: string;
  logo: string;
  modules: ModuleConfig[];
  status: number;
}

export type IndustryType = "food" | "retail" | "service" | "entertainment" | "lifestyle";

export interface StoreContextValue {
  storeId: number;
  industry: IndustryType;
  decoration: DecorationConfig | null;
  loading: boolean;
  theme: StoreTheme;
}

const StoreContext = createContext<StoreContextValue>({
  storeId: 0,
  industry: "food",
  decoration: null,
  loading: true,
  theme: { color: C.teal, logo: "" },
});

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: StoreContextValue;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
