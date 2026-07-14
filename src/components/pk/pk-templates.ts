// ─── PK模板推荐引擎 ───
// 提供热门模板 + 按品类筛选，降低用户创建门槛

import type { PKTemplate, TemplateGroup } from "./pk-creator-types";

// ─── 预设热门模板池 ───
export const PK_TEMPLATES: PKTemplate[] = [
  {
    id: "weekend-eat",
    title: "周末去哪吃？",
    options: ["火锅", "烤肉", "日料"],
    category: "consumption",
    icon: "🍽️",
    difficulty: "quick",
    usageHint: "不知道吃什么的时候，让网友帮你选",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "none",
    defaultEndTime: "3d",
    defaultMinBet: 10,
    defaultMaxBet: 500,
  },
  {
    id: "house-price",
    title: "下半年房价会涨还是跌？",
    options: ["会涨，刚需还在", "会跌，调控不放松", "横盘震荡"],
    category: "social",
    icon: "🏠",
    difficulty: "quick",
    usageHint: "社会热点话题，参与度高",
    defaultMode: "NvN",
    defaultPool: "principal_return",
    defaultCharity: "none",
    defaultEndTime: "7d",
    defaultMinBet: 100,
    defaultMaxBet: 5000,
  },
  {
    id: "summer-hot",
    title: "今年夏天会比去年更热吗？",
    options: ["会更热", "不会，去年已是峰值"],
    category: "social",
    icon: "🌡️",
    difficulty: "quick",
    usageHint: "人人都有发言权的天气话题",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "none",
    defaultEndTime: "3d",
    defaultMinBet: 50,
    defaultMaxBet: 1000,
  },
  {
    id: "football-match",
    title: "明天中国队能赢吗？",
    options: ["中国队必胜", "对手太强了", "平局收场"],
    category: "sports",
    icon: "⚽",
    difficulty: "quick",
    usageHint: "体育迷最爱，比赛结果即结算",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "none",
    defaultEndTime: "1h",
    defaultMinBet: 10,
    defaultMaxBet: 1000,
  },
  {
    id: "major-choice",
    title: "高考选专业，兴趣还是就业？",
    options: ["兴趣第一", "就业优先"],
    category: "general",
    icon: "📚",
    difficulty: "quick",
    usageHint: "家长和孩子都关心的话题",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "percentage",
    defaultEndTime: "7d",
    defaultMinBet: 10,
    defaultMaxBet: 500,
  },
  {
    id: "phone-war",
    title: "下一部手机买哪个？",
    options: ["华为，支持国产", "iPhone，生态好用", "小米，性价比高"],
    category: "consumption",
    icon: "📱",
    difficulty: "quick",
    usageHint: "数码爱好者各抒己见",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "none",
    defaultEndTime: "5d",
    defaultMinBet: 10,
    defaultMaxBet: 500,
  },
  {
    id: "retirement-living",
    title: "退休后跟子女住还是自己住？",
    options: ["跟子女住", "自己住自在"],
    category: "general",
    icon: "👴",
    difficulty: "standard",
    usageHint: "家庭关系热门话题",
    defaultMode: "NvN",
    defaultPool: "principal_return",
    defaultCharity: "percentage",
    defaultEndTime: "7d",
    defaultMinBet: 10,
    defaultMaxBet: 1000,
  },
  {
    id: "btc-tomorrow",
    title: "明天BTC涨还是跌？",
    options: ["涨📈", "跌📉", "横盘"],
    category: "sports",
    icon: "₿",
    difficulty: "quick",
    usageHint: "币圈玩家每日必争",
    defaultMode: "NvN",
    defaultPool: "winner_takes_all",
    defaultCharity: "none",
    defaultEndTime: "1h",
    defaultMinBet: 100,
    defaultMaxBet: 10000,
  },
];

// ─── 按难度分组 ───
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    name: "🔥 热门推荐",
    icon: "🔥",
    templates: PK_TEMPLATES.filter(t => t.difficulty === "quick").slice(0, 5),
  },
  {
    name: "📊 深度讨论",
    icon: "📊",
    templates: PK_TEMPLATES.filter(t => t.difficulty === "standard"),
  },
];

// ─── 按品类筛选模板 ───
export function getTemplatesByCategory(category?: string): PKTemplate[] {
  if (!category) return PK_TEMPLATES;
  return PK_TEMPLATES.filter(t => t.category === category);
}

// ─── 按ID获取模板 ───
export function getTemplateById(id: string): PKTemplate | undefined {
  return PK_TEMPLATES.find(t => t.id === id);
}

// ─── 用模板填充表单 ───
export function applyTemplate(template: PKTemplate) {
  return {
    title: template.title,
    options: [...template.options],
    category: template.category,
    mode: template.defaultMode,
    pool_distribution: template.defaultPool,
    charity: template.defaultCharity,
    end_time: template.defaultEndTime,
    min_bet: template.defaultMinBet.toString(),
    max_bet: template.defaultMaxBet.toString(),
  };
}
