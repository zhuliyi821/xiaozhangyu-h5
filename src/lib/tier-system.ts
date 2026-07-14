/**
 * 7段位系统
 *
 * 段位     XP门槛
 * 🌱 初心   0
 * 🥉 青铜   50
 * 🥈 白银   200
 * 🥇 黄金   500
 * ⭐ 星耀   1000
 * 💎 钻石   2000
 * 👑 王者   5000
 */

import { API_BASE } from "@/config/api";

export interface TierDef {
  id: string;
  emoji: string;
  label: string;
  xpRequired: number;
  reward: number;
  color: string;
  barColor: string;
}

export const TIERS: TierDef[] = [
  { id: "seedling",  emoji: "🌱", label: "初心",  xpRequired: 0,    reward: 0,    color: "text-text-tertiary",        barColor: "bg-brand-teal/30" },
  { id: "bronze",   emoji: "🥉", label: "青铜",  xpRequired: 50,   reward: 50,   color: "text-brand-teal-dark",     barColor: "bg-brand-teal/50" },
  { id: "silver",   emoji: "🥈", label: "白银",  xpRequired: 200,  reward: 200,  color: "text-brand-teal",          barColor: "bg-brand-teal" },
  { id: "gold",     emoji: "🥇", label: "黄金",  xpRequired: 500,  reward: 500,  color: "text-brand-gold",          barColor: "bg-gradient-to-r from-brand-gold to-amber-400" },
  { id: "star",     emoji: "⭐", label: "星耀",  xpRequired: 1000, reward: 1000, color: "text-brand-coral-dark",    barColor: "bg-gradient-to-r from-brand-teal to-brand-coral" },
  { id: "diamond",  emoji: "💎", label: "钻石",  xpRequired: 2000, reward: 2000, color: "text-brand-coral",         barColor: "bg-gradient-to-r from-brand-coral to-brand-coral-dark" },
  { id: "king",     emoji: "👑", label: "王者",  xpRequired: 5000, reward: 5000, color: "text-brand-gold-dark",     barColor: "bg-gradient-to-r from-brand-gold-dark to-brand-gold" },
];

/** 根据XP获取当前段位 */
export function getCurrentTier(xp: number): TierDef {
  let current = TIERS[0];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].xpRequired) {
      current = TIERS[i];
      break;
    }
  }
  return current;
}

/** 获取下一个段位（已满级返回 null） */
export function getNextTier(xp: number): TierDef | null {
  const current = getCurrentTier(xp);
  const idx = TIERS.indexOf(current);
  if (idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

/** 当前段位内的进度 (0~1) */
export function getTierProgress(xp: number): number {
  const current = getCurrentTier(xp);
  const next = getNextTier(xp);
  if (!next) return 1;
  const range = next.xpRequired - current.xpRequired;
  if (range <= 0) return 1;
  return Math.min(1, (xp - current.xpRequired) / range);
}

/** 通过API读取段位数据 */
export interface TierStats {
  xp: number;
  current_tier: string;
  current_label: string;
  next_tier: string | null;
  next_label: string | null;
  next_xp_required: number | null;
  claimed_tiers: string[];
  claimable: { id: string; label: string; reward: number }[];
}

export async function fetchTierStats(uid: number): Promise<TierStats | null> {
  try {
    const r = await fetch(`${API_BASE}/api/tier/stats?action=stats&uid=${uid}`);
    const d = await r.json();
    if (d.code === 0) return d.data;
  } catch {}
  return null;
}

/** 通过API添加经验值 */
export async function addXpApi(uid: number, delta: number, source: string = ""): Promise<number | null> {
  try {
    const r = await fetch(`${API_BASE}/api/tier/add-xp?action=add-xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, delta, source }),
    });
    const d = await r.json();
    if (d.code === 0) return d.data.xp;
  } catch {}
  return null;
}

/** 通过API领取段位奖励 */
export async function claimTierRewardApi(uid: number, tierId: string): Promise<{ reward: number } | null> {
  try {
    const r = await fetch(`${API_BASE}/api/tier/claim?action=claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, tier_id: tierId }),
    });
    const d = await r.json();
    if (d.code === 0) return d.data;
  } catch {}
  return null;
}

/** 本地存储的XP读写（离线fallback） */
const XP_KEY = "xiaozhangyu_tier_xp";
const CLAIMED_KEY = "xiaozhangyu_tier_claimed";

export function loadXp(): number {
  if (typeof window === "undefined") return 0;
  try { return parseInt(localStorage.getItem(XP_KEY) || "0", 10); }
  catch { return 0; }
}

export function saveXp(xp: number): void {
  try { localStorage.setItem(XP_KEY, String(xp)); }
  catch {}
}

export function loadClaimed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]"); }
  catch { return []; }
}
