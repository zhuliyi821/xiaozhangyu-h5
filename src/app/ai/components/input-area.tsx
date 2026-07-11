import { Send } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
}

export default function InputArea({ value, onChange, onSend, disabled, placeholder }: Props) {
  return (
    <div className="sticky bottom-[64px] bg-white border-t border-border-tertiary px-4 py-3"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center gap-2 bg-bg rounded-[8px] border border-border-tertiary px-3 py-2">
        <input value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder={placeholder || '输入你的问题...'}
          className="flex-1 text-sm outline-none bg-transparent py-1" disabled={disabled} />
        <button onClick={onSend} disabled={disabled || !value.trim()}
          className="w-8 h-8 rounded-full bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-50">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
