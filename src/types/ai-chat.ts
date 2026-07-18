export type TabId = 'zodiac' | 'lottery' | 'stock' | 'crypto';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  _tempId?: string;
  status?: 'sending' | 'sent' | 'failed';
  error?: string;
  _type?: 'cost-confirm';      // 内联成本确认卡片
  _cost?: number;               // 待扣豆数
  _pendingContent?: string;     // 待发送消息
}

export interface TabConfig {
  id: TabId;
  label: string;
  cost: number;
  icon: string;
  subtitle: string;
  disclaimer: string;
}

export interface CostOption {
  label: string;
  cost: number;
}

export interface ZodiacConfig extends TabConfig {
  cost_map: CostOption[];
}

export interface AIChatState {
  tab: TabId;
  sessions: Record<TabId, Message[]>;
  subCategory: string;
  cost: number;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  balance: number;
}
