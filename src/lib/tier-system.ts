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

export interface TierDef {
  id: string;
  emoji: string;
  label: string;
  xpRequired: number;  // 进入此段位所需最小XP
  reward: number;      // 升到此段位的奖励🎮
  color: string;       // Tailwind text color class
  barColor: string;    // 进度条样式
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

/** 本地存储的XP读写 */
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

export function addXp(delta: number): number {
  const current = loadXp();
  const newXp = current + delta;
  saveXp(newXp);
  return newXp;
}

export function loadClaimed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]"); }
  catch { return []; }
}

export function markClaimed(tierId: string): void {
  const claimed = loadClaimed();
  if (!claimed.includes(tierId)) {
    claimed.push(tierId);
    try { localStorage.setItem(CLAIMED_KEY, JSON.stringify(claimed)); }
    catch {}
  }
}
