// ─── PKCreator 创建流程专用类型定义 ───
// 扩展自 pk-hall/types.ts 的 PKFormData，增加向导状态和模板系统

import type { PKMode, CharityMode, PoolMode, PKTopic } from "@/app/pk-hall/types";

// ─── 创建向导步骤 ───
export type CreatorStep = "template" | "basic" | "settings" | "preview";

export const STEP_LABELS: Record<CreatorStep, { label: string; desc: string; icon: string }> = {
  template: { label: "选类型", desc: "模板或自定义", icon: "📋" },
  basic:    { label: "写话题", desc: "标题和选项", icon: "✍️" },
  settings: { label: "设规则", desc: "PK形态与奖池", icon: "⚙️" },
  preview:  { label: "预览发", desc: "确认并发布", icon: "🚀" },
};

// ─── 创建模式 ───
export type CreateMode = "quick" | "advanced";

// ─── PK模板 ───
export interface PKTemplate {
  id: string;
  title: string;
  options: string[];
  category: string;
  icon: string;
  difficulty: "quick" | "standard";
  usageHint: string;       // 使用场景提示
  defaultMode: PKMode;
  defaultPool: PoolMode;
  defaultCharity: CharityMode;
  defaultEndTime: string;
  defaultMinBet: number;
  defaultMaxBet: number;
}

// ─── 模板分组 ───
export interface TemplateGroup {
  name: string;
  icon: string;
  templates: PKTemplate[];
}

// ─── 创建表单扩展数据 ───
export interface PKCreateFormData {
  title: string;
  options: string[];
  category: string;
  mode: PKMode;
  charity: CharityMode;
  charity_ratio: number;
  charity_project: string;
  pool_distribution: PoolMode;
  end_time: string;
  min_bet: string;
  max_bet: string;
  challenger_limit: number;
  challenger_pool_limit: number;
  invite_user: string;
  platform_fee_ratio: number;
  creator_fee_ratio: number;
}

export const DEFAULT_CREATE_FORM: PKCreateFormData = {
  title: "",
  options: ["", ""],
  category: "sports",
  mode: "NvN",
  charity: "none",
  charity_ratio: 10,
  charity_project: "",
  pool_distribution: "winner_takes_all",
  end_time: "tomorrow",
  min_bet: "10",
  max_bet: "10000",
  challenger_limit: 100,
  challenger_pool_limit: 10000,
  invite_user: "",
  platform_fee_ratio: 5,
  creator_fee_ratio: 0,
};

// ─── 草稿 ───
export interface PKDraft {
  form: PKCreateFormData;
  step: CreatorStep;
  mode: CreateMode;
  savedAt: number;     // Date.now()
}

// ─── 创建结果 ───
export interface PKCreateResult {
  success: boolean;
  topicId?: number;
  msg?: string;
}

// ─── 庆祝配置 ───
export interface CelebrationConfig {
  topicTitle: string;
  topicId: number;
  category: string;
  mode: PKMode;
  poolTotal: number;
}

// ─── 创建流程埋点 ───
export interface PKCreateAnalytics {
  entryPoint: "fab" | "bottom_cta" | "category_page" | "template" | "empty_state";
  templateUsed: string | null;
  createMode: CreateMode;
  steps: { step: CreatorStep; durationMs: number; abandoned?: boolean }[];
  abandonedAt: CreatorStep | null;
  published: boolean;
  sharedAfterPublish: boolean;
}
