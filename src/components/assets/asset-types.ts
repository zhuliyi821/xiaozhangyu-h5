// ─── 统一资产中心类型定义 ───

// ─── 5种资产元数据 ───
export interface AssetMeta {
  key: string;        // credit1 ~ credit5
  label: string;      // 中文名（从后端获取）
  icon: string;       // emoji
  color: string;      // tailwind gradient
  desc: string;       // 简短用途说明
  order: number;      // 显示顺序 1-5
  tier: "primary" | "secondary" | "auxiliary";  // 资产层级
}

export const ASSET_METAS: Record<string, AssetMeta> = {
  credit1: { key: "credit1", label: "游戏豆", icon: "🎮", color: "from-brand-teal to-brand-teal-dark", desc: "流通币·参与/投票/AI会话", order: 1, tier: "primary" },
  credit5: { key: "credit5", label: "水晶石", icon: "⛏️", color: "from-brand-coral to-brand-coral-dark", desc: "PK奖励·可1:1兑换游戏豆", order: 2, tier: "secondary" },
  credit3: { key: "credit3", label: "水晶球", icon: "🔮", color: "from-brand-teal/60 to-brand-gold", desc: "荣誉值·享赢家盈利分红", order: 3, tier: "secondary" },
  credit4: { key: "credit4", label: "余额", icon: "💰", color: "from-brand-gold to-brand-gold-dark", desc: "现金·消费/购物/兑换", order: 4, tier: "secondary" },
  credit2: { key: "credit2", label: "闲豆", icon: "🏪", color: "from-brand-teal to-brand-gold", desc: "商城券·仅限商城消费", order: 5, tier: "auxiliary" },
};

export const PRIMARY_KEYS = ["credit4", "credit5", "credit3"]; // 3列主力
export const AUXILIARY_KEYS = ["credit2"];

// ─── 钱包数据 ───
export interface WalletData {
  uid: number; nickname: string;
  credit1: number; credit2: number; credit3: number;
  credit4: number; credit5: number;
  credit1_label: string; credit2_label: string;
  credit3_label: string; credit4_label: string;
  credit5_label: string;
}

// ─── 流水条目 ───
export interface FlowItem {
  id: number;
  biz_type: string;
  asset_type: string;
  amount: number;
  remark: string;
  created_at: string;
}

// ─── 工具函数 ───
export function fmtNum(n: number): string {
  if (n >= 100000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return Math.floor(n).toLocaleString();
}

export function fmtFull(n: number): string {
  return Math.floor(n).toLocaleString();
}

export function fmtMoney(n: number): string {
  return `¥${n.toFixed(2)}`;
}

// 水晶石冻结比例
export const CRYSTAL_FROZEN_RATIO = 0.7;

export function crystalAvailable(total: number): number {
  return Math.floor(total * (1 - CRYSTAL_FROZEN_RATIO));
}

export function crystalFrozen(total: number): number {
  return Math.floor(total * CRYSTAL_FROZEN_RATIO);
}

// 业务类型图标映射
export const BIZ_ICONS: Record<string, string> = {
  exchange: "🔄",
  exchange_to_game: "🔄",
  exchange_beans_to: "🔄",
  register: "🎁",
  sign: "📋",
  invite: "🎁",
  bet: "⚽",
  settle: "🏆",
  ai_chat: "🤖",
  shop: "🛒",
  swap_bonus: "🫘",
  activate_crystal: "🔓",
};

export const BIZ_LABELS: Record<string, string> = {
  exchange: "兑换",
  exchange_to_game: "兑换游戏豆",
  exchange_beans_to: "水晶石拆分",
  register: "注册奖励",
  sign: "签到",
  invite: "邀请奖励",
  bet: "PK参与",
  settle: "PK结算",
  ai_chat: "AI会话",
  shop: "商城消费",
  swap_bonus: "闲豆置换",
  activate_crystal: "激活水晶石",
};
