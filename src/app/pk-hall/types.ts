// ⚔️ PK 大厅类型定义
// 金青珊瑚品牌色体系: Gold #F2B631 / Teal #45CCD5 / Coral #F27152

export interface PKTopic {
  id: number;
  title: string;
  option_a: string;
  option_b: string;
  category: string;
  mode: string;
  vote_a: number;
  vote_b: number;
  pool_a: number;
  pool_b: number;
  total_pool: number;
  total_votes: number;
  comment_count: number;
  spectator_count: number;
  end_time: number;
  time_remaining: number;
  time_label: string;
  min_bet: number;
  status: number;
  status_label: string;
  winner: string | null;
  platform_fee_ratio: number;
  creator_name: string;
  creator_id: number;
  created_at: string;
  time_ago: string;
  estimated_reward_a: number;
  estimated_reward_b: number;
}

export interface PKFormData {
  title: string;
  option_a: string;
  option_b: string;
  end_time: string;
  min_bet: string;
}

export interface VoteConfirmData {
  pk: PKTopic;
  choice: string;
  betAmount: number;
  estimatedReward: number;
}

export interface APIResponse<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
}

export interface CatConfig {
  name: string;
  icon: string;
  color: string;
  desc: string;
}

// 品牌色 tokens — 金青珊瑚体系 (改用项目 CSS 变量 brand-*)
export const BRAND = {
  teal: "from-brand-teal to-brand-teal-dark",
  tealDark: "text-brand-teal-dark",
  gold: "from-brand-gold to-brand-gold-dark",
  goldDark: "text-brand-gold-dark",
  coral: "from-brand-coral to-brand-coral-dark",
  coralDark: "text-brand-coral-dark",
  bgSurface: "bg-white",
  borderSoft: "border-gray-100",
} as const;

// 品类配置 — 品牌色
export const CATEGORY_CONFIG: Record<string, CatConfig> = {
  sports:  { name: "体育赛事", icon: "⚽", color: "from-brand-teal to-brand-teal-dark", desc: "球赛·电竞·田径" },
  social:  { name: "社会热点", icon: "🌐", color: "from-brand-gold to-brand-gold-dark", desc: "民生·经济·科技" },
  event:   { name: "突发事件", icon: "⚡", color: "from-brand-coral to-brand-coral-dark", desc: "快讯·突发·新发现" },
  general: { name: "一言不合", icon: "💬", color: "from-brand-teal to-brand-coral", desc: "日常·娱乐·随便聊" },
};
