import type { TabId, Message } from '@/types/ai-chat';

// 简单全局状态, 不依赖zustand, 用React Context即可
// 这里只封装纯数据和逻辑函数

const STORAGE_KEY = 'ai_chat_sessions';

export function createInitialSessions(): Record<TabId, Message[]> {
  return {
    zodiac: [],
    lottery: [],
    stock: [],
    crypto: [],
  };
}

// 本地存储(可选, Phase2用于历史记录)
export function saveSessions(sessions: Record<TabId, Message[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

export function loadSessions(): Record<TabId, Message[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
