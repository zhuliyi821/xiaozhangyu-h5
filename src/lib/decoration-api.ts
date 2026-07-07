import { API_BASE } from "@/config/api";
import type { DecorationConfig, ModuleConfig } from "./store-context";

/** Fetch decoration config for a store */
export async function fetchDecoration(storeId: number): Promise<DecorationConfig | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/store-decoration?store_id=${storeId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 0) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** Save decoration config (from merchant admin) */
export async function saveDecoration(
  storeId: number,
  data: {
    industry: string;
    theme_color: string;
    logo: string;
    modules: ModuleConfig[];
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/store-decoration/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: storeId, ...data }),
    });
    const json = await res.json();
    return json.code === 0;
  } catch {
    return false;
  }
}
