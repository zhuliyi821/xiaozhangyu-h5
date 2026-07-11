import { AlertTriangle, Shield } from 'lucide-react';

interface Props {
  type: 'disclaimer' | 'confirm';
  message: string;
  cost?: number;
  accepted?: boolean;
  onAcceptChange?: (v: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Modal({ type, message, cost, accepted, onAcceptChange, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
      <div className="bg-white rounded-[8px] p-5 max-w-sm w-full shadow-xl">
        <div className="text-center mb-4">
          {type === 'disclaimer' ? (
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          ) : (
            <Shield className="w-10 h-10 text-brand-teal mx-auto mb-2" />
          )}
          <h3 className="text-sm font-bold">
            {type === 'disclaimer' ? '风险提示' : '确认咨询'}
          </h3>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed mb-4 text-center">{message}</p>
        {type === 'disclaimer' && (
          <label className="flex items-start gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={accepted} onChange={e => onAcceptChange?.(e.target.checked)}
              className="mt-0.5 accent-brand-teal" />
            <span className="text-[10px] text-text-tertiary leading-relaxed">
              我已阅读并理解以上提示，确认仅用于传统文化娱乐参考
            </span>
          </label>
        )}
        {type === 'confirm' && cost && (
          <p className="text-xs text-text-secondary text-center mb-4">
            本次测算将扣除 <span className="font-bold text-brand-teal-dark">{cost}</span> 🎮，确认发起咨询？
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 rounded-[8px] py-2.5 text-sm font-semibold text-text-secondary bg-gray-100 transition">
            取消
          </button>
          <button onClick={onConfirm}
            disabled={type === 'disclaimer' && !accepted}
            className={`flex-1 rounded-[8px] py-2.5 text-sm font-semibold text-white transition ${
              type === 'disclaimer' && !accepted
                ? 'bg-gray-200 text-gray-400'
                : 'bg-gradient-to-r from-brand-teal to-brand-teal-dark'
            }`}>
            确认{type === 'disclaimer' ? '进入' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
