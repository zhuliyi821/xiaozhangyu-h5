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

// 品牌色 tokens — 金青珊瑚体系
export const BRAND = {
  teal: "from-teal-400 to-teal-500",
  tealDark: "text-teal-600",
  gold: "from-amber-400 to-amber-500",
  goldDark: "text-amber-600",
  coral: "from-orange-400 to-orange-500",
  coralDark: "text-orange-600",
  bgSurface: "bg-white",
  borderSoft: "border-gray-100",
} as const;

// 品类配置
export const CATEGORY_CONFIG: Record<string, CatConfig> = {
  sports:  { name: "体育赛事", icon: "⚽", color: "from-teal-400 to-teal-500", desc: "球赛·电竞·田径" },
  social:  { name: "社会热点", icon: "🌐", color: "from-amber-400 to-amber-500", desc: "民生·经济·科技" },
  event:   { name: "突发事件", icon: "⚡", color: "from-orange-400 to-orange-500", desc: "快讯·突发·新发现" },
  general: { name: "一言不合", icon: "💬", color: "from-purple-400 to-purple-600", desc: "日常·娱乐·随便聊" },
};
