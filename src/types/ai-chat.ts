export type TabId = 'zodiac' | 'lottery' | 'stock' | 'crypto';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
