import type { Message, TabId } from '@/types/ai-chat';
import OctopusIcon from './octopus-icon';

interface Props {
  messages: Message[];
  loading: boolean;
  tab: TabId;
  onQuickQuestion: (q: string, cost: number) => void;
  onFeedback: (index: number, feedback: number) => void;
  onRetry?: (msg: Message) => void;
  onCostConfirm?: (cost: number, content: string) => void;
  onCostCancel?: () => void;
}

const QUICK_QUESTIONS: Record<string, { q: string; cost: number; recommended?: boolean }[]> = {
  lottery: [
    { q: '近期偏财气场如何', cost: 5, recommended: true },
    { q: '如何调整购彩心态', cost: 5 },
    { q: '随机起一卦看看', cost: 5 },
  ],
  stock: [
    { q: '这只股票短期气场如何', cost: 8, recommended: true },
    { q: '我账户最近财运如何', cost: 8 },
    { q: '现在适合操作吗', cost: 8 },
  ],
  crypto: [
    { q: '短期行情怎么看', cost: 10, recommended: true },
    { q: '有什么风险需要注意', cost: 10 },
    { q: '如何调整投资心态', cost: 10 },
  ],
  zodiac: [],
};

export default function ChatArea({ messages, loading, tab, onQuickQuestion, onFeedback, onRetry, onCostConfirm, onCostCancel }: Props) {
  const qq = QUICK_QUESTIONS[tab] || [];

  return (
    <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
      {/* 欢迎卡片 - 仅空状态 */}
      {messages.length === 0 && !loading && (
        <div className="mb-3 bg-white rounded-[8px] border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shrink-0">
              <OctopusIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[13px] font-medium text-text-primary">你好！🐙</div>
              <div className="text-[10px] text-text-tertiary">
                {tab === 'zodiac' ? '选择下方咨询类型，开始推演' : '今天有什么想了解的？'}
              </div>
            </div>
          </div>
          {qq.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {qq.map((item, i) => (
                <button key={i} onClick={() => onQuickQuestion(item.q, item.cost)}
                  className="relative text-[10px] bg-brand-teal/10 text-brand-teal-dark rounded-[8px] px-3 py-1.5 active:scale-95 transition-transform hover:bg-brand-teal/20">
                  {item.recommended && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-coral text-white text-[7px] px-1 rounded-full leading-tight font-medium">推荐</span>
                  )}
                  {item.q}
                  <span className="ml-1 opacity-60">{item.cost}豆</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 消息气泡 */}
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {msg.role === 'assistant' && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center mr-2 mt-0.5 shrink-0">
              <OctopusIcon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white rounded-br-md'
                : 'bg-surface border border-border-tertiary shadow-sm rounded-bl-md'
            } ${msg.status === 'failed' ? 'opacity-70' : ''}`}>
              {msg.content}
              {msg.role === 'user' && msg.status === 'sending' && <span className="ml-1.5 inline-block text-[9px] opacity-70">⟳</span>}
              {msg.role === 'user' && msg.status === 'failed' && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[9px] text-red-300">{msg.error || '发送失败'}</span>
                  {onRetry && (
                    <button onClick={() => onRetry(msg)} className="text-[9px] text-white/80 underline">重试</button>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'assistant' && i > 0 && !msg.content.startsWith('早安') && !msg.content.startsWith('午后') && !msg.content.startsWith('夜幕') && (
              <div className="flex gap-3 mt-1.5 ml-1">
                <button onClick={() => onFeedback(i, 1)}
                  className="text-[9px] text-text-tertiary hover:text-brand-teal transition-colors">👍 准</button>
                <button onClick={() => onFeedback(i, 0)}
                  className="text-[9px] text-text-tertiary hover:text-brand-coral transition-colors">👎 不准</button>
                <button onClick={() => { navigator.clipboard.writeText(msg.content); }}
                  className="text-[9px] text-text-tertiary hover:text-text-primary transition-colors">📋 复制</button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 加载中 */}
      {loading && (
        <div className="flex justify-start items-end gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-teal-dark flex items-center justify-center shrink-0">
            <OctopusIcon className="w-4 h-4" />
          </div>
          <div className="bg-surface border border-border-tertiary shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-text-tertiary">小章鱼正在思考...</span>
          </div>
        </div>
      )}
    </div>
  );
}
