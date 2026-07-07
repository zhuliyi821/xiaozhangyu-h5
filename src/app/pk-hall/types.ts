// ⚔️ PK 大厅类型定义
// 金青珊瑚品牌色体系: Gold #F2B631 / Teal #45CCD5 / Coral #F27152

// ─── PK 形态 ───
export type PKMode = "1v1" | "1vN" | "NvN";
export const PK_MODE_LABELS: Record<PKMode, string> = {
  "1v1": "⚔️ 1对1单挑",
  "1vN": "🥊 1对多打擂",
  "NvN": "👥 多对多阵营",
};
export const PK_MODE_DESCS: Record<PKMode, string> = {
  "1v1": "@好友应战，其他人观战不可投",
  "1vN": "擂主vs全员，挑战者选反向",
  "NvN": "自由加入阵营，全民参与",
};

// ─── 奖池分配模式 ───
export type PoolMode = "winner_takes_all" | "principal_return" | "dealer" | "physical_equity";
export const POOL_MODE_LABELS: Record<PoolMode, string> = {
  winner_takes_all: "🏆 赢家通吃",
  principal_return: "🔄 本金返还制",
  dealer: "🎲 发起人坐庄",
  physical_equity: "🎁 实物/权益奖池",
};
export const POOL_MODE_DESCS: Record<PoolMode, string> = {
  winner_takes_all: "赢家按投注比例瓜分输家奖池（平台抽水5%）",
  principal_return: "赢家仅退回本金，输家消耗豆进平台基金",
  dealer: "发起人自行赔付或吃掉挑战者投注",
  physical_equity: "奖池为实物/服务/优惠券，猜对者抽取",
};
export const POOL_MODE_SCOPES: Record<PoolMode, PKMode[]> = {
  winner_takes_all: ["1v1", "1vN", "NvN"],
  principal_return: ["1v1", "1vN"],
  dealer: ["1vN"],
  physical_equity: ["1vN", "NvN"],
};

// ─── 公益模式 ───
export type CharityMode = "none" | "all_donate" | "percentage" | "brand_match";
export const CHARITY_LABELS: Record<CharityMode, string> = {
  none: "普通PK",
  all_donate: "❤️ 赢家回本·全捐",
  percentage: "❤️ 奖池抽成捐赠",
  brand_match: "❤️ 品牌配捐",
};
export const CHARITY_DESCS: Record<CharityMode, string> = {
  none: "无公益属性",
  all_donate: "赢家仅退本金，输家消耗豆全捐公益基金",
  percentage: "从总奖池中抽出固定比例捐赠",
  brand_match: "商家按投注额配捐实物/优惠券",
};

// ─── PK话题数据模型 ───
export interface PKTopic {
  id: number;
  title: string;
  category: string;           // 品类

  // 选项（支持多选项）
  options: string[];
  // 兼容旧版A/B字段（后端可能还返回）
  option_a?: string;
  option_b?: string;

  // PK 形态
  mode: PKMode;

  // 公益
  charity: CharityMode;
  charity_ratio: number;      // 抽成比例（percentage模式）
  charity_project: string;    // 受益项目名称

  // 奖池分配
  pool_distribution: PoolMode;
  platform_fee_ratio: number;  // 平台抽水 0-100
  creator_fee_ratio: number;   // 发起人抽成 0-10

  // 擂台赛配置
  challenger_limit: number;    // 挑战人数上限
  challenger_pool_limit: number; // 挑战总豆数上限

  // 1v1 应战
  invited_user_id?: number;    // @邀请的用户ID
  challenger_id?: number;      // 应战用户ID

  // 投注数据
  vote_counts: number[];       // 每个选项的投票数
  pools: number[];             // 每个选项的奖池
  total_pool: number;
  total_votes: number;

  // 选项A/B数据（兼容旧版）
  vote_a?: number;
  vote_b?: number;
  pool_a?: number;
  pool_b?: number;

  // 评论/围观
  comment_count: number;
  spectator_count: number;

  // 时间
  end_time: number;
  time_remaining: number;
  time_label: string;

  // 投注限制
  min_bet: number;
  max_bet: number;             // 单人最高投注

  // 状态
  status: number;              // 0=草稿 1=进行中 2=已结束 3=已结算
  status_label: string;
  winner: string | null;

  // 发起人
  creator_name: string;
  creator_id: number;
  created_at: string;
  time_ago: string;

  // 预估收益
  estimated_rewards: number[]; // 每个选项的预估收益
  estimated_reward_a?: number;
  estimated_reward_b?: number;

  // 多选项显示控制
  max_choices?: number;        // 每人最多可选几项
}

// ─── 发起PK表单数据 ───
export interface PKFormData {
  title: string;

  // 选项（动态数组）
  options: string[];

  // PK 形态
  mode: PKMode;

  // 公益
  charity: CharityMode;
  charity_ratio: number;
  charity_project: string;

  // 奖池分配
  pool_distribution: PoolMode;

  // 擂台限制
  challenger_limit: number;
  challenger_pool_limit: number;

  // 1v1 邀请
  invite_user: string;

  // 通用
  category: string;
  end_time: string;
  min_bet: string;
  max_bet: string;
}

export const DEFAULT_PK_FORM: PKFormData = {
  title: "",
  options: ["", ""],
  mode: "NvN",
  charity: "none",
  charity_ratio: 10,
  charity_project: "",
  pool_distribution: "winner_takes_all",
  challenger_limit: 100,
  challenger_pool_limit: 10000,
  invite_user: "",
  category: "sports",
  end_time: "tomorrow",
  min_bet: "10",
  max_bet: "10000",
};

// ─── 投注确认弹窗数据 ───
export interface VoteConfirmData {
  pk: PKTopic;
  choiceIndex?: number;         // 选项索引
  choice: string;              // 选项文本
  betAmount: number;
  estimatedReward: number;
}

// ─── API响应 ───
export interface APIResponse<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
}

// ─── 品类配置 ───
export interface CatConfig {
  name: string;
  icon: string;
  color: string;
  desc: string;
}

// ─── 品牌色 tokens（仅保留，后续统一引用 CSS 变量） ───
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

// ─── 品类配置映射 ───
export const CATEGORY_CONFIG: Record<string, CatConfig> = {
  sports:  { name: "体育赛事", icon: "⚽", color: "from-brand-teal to-brand-teal-dark", desc: "球赛·电竞·田径" },
  social:  { name: "社会热点", icon: "🌐", color: "from-brand-gold to-brand-gold-dark", desc: "民生·经济·科技" },
  event:   { name: "突发事件", icon: "⚡", color: "from-brand-coral to-brand-coral-dark", desc: "快讯·突发·新发现" },
  general: { name: "一言不合", icon: "💬", color: "from-brand-teal to-brand-coral", desc: "日常·娱乐·随便聊" },
};

// ─── 品类列表（创建用） ───
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
  key,
  label: `${cfg.icon} ${cfg.name}`,
}));

// ─── 时间选项 ───
export const TIME_OPTIONS = [
  { label: "1小时", value: "1h" },
  { label: "3小时", value: "3h" },
  { label: "今天截止", value: "today" },
  { label: "明天截止", value: "tomorrow" },
  { label: "3天", value: "3d" },
  { label: "7天", value: "7d" },
  { label: "30天", value: "30d" },
];

// ─── 公益项目预设 ───
export const CHARITY_PROJECTS = [
  { label: "🌱 平台公益基金", value: "platform_fund" },
  { label: "📚 乡村教育", value: "rural_education" },
  { label: "🏥 医疗援助", value: "medical_aid" },
  { label: "🌊 环保行动", value: "environment" },
  { label: "🐾 动物保护", value: "animal_protection" },
];
