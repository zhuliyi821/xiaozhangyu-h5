/**
 * 🎨 多元头像工具函数
 *
 * 用户可以从 8 个多元化 emoji 中选择代表自己的头像。
 * 存储在 localStorage 中，所有头像展示点统一读取。
 */

const AVATAR_KEY = "xiaozhangyu_avatar";

/** 8 个多元头像选项 */
export const AVATAR_OPTIONS = [
  { emoji: "🧑‍💼", label: "上班族" },
  { emoji: "👨‍🌾", label: "务农" },
  { emoji: "👴", label: "退休" },
  { emoji: "🧑‍🦽", label: "自强" },
  { emoji: "👩‍🍳", label: "餐饮" },
  { emoji: "👷", label: "建筑" },
  { emoji: "🧑‍🎓", label: "学生" },
  { emoji: "👩‍👧‍👦", label: "宝妈" },
  { emoji: "🧑‍💻", label: "技术" },
  { emoji: "🧓", label: "长辈" },
  { emoji: "👩‍💼", label: "白领" },
  { emoji: "👨‍🔧", label: "技工" },
] as const;

/** 获取用户选择的头像 emoji，若无则返回 🐙 默认 */
export function getUserAvatar(): string {
  if (typeof window === "undefined") return "🐙";
  return localStorage.getItem(AVATAR_KEY) || "🐙";
}

/** 设置用户头像 emoji */
export function setUserAvatar(emoji: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVATAR_KEY, emoji);
  // 触发自定义事件，通知其他组件更新
  window.dispatchEvent(new CustomEvent("avatar-changed", { detail: emoji }));
}
