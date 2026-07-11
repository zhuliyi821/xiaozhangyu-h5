import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CostOption } from '@/types/ai-chat';

interface Props {
  costOptions: CostOption[];
  subCategory: string;
  zodiacCost: number;
  onSelect: (label: string, cost: number) => void;
}

export default function ZodiacSubSelector({ costOptions, subCategory, zodiacCost, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 py-2 bg-white border-b border-border-tertiary">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-brand-teal-light/10 rounded-[8px] px-3 py-2 text-xs border border-brand-teal-light/20">
        <span className="text-text-primary font-medium">{subCategory || '选择咨询类型'}</span>
        <span className="flex items-center gap-1 text-text-tertiary">
          <span className="font-semibold text-brand-teal-dark">{zodiacCost}豆</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="mt-1.5 space-y-0.5">
          {costOptions.map(item => (
            <button key={item.label} onClick={() => { onSelect(item.label, item.cost); setOpen(false); }}
              className={`w-full flex items-center justify-between rounded-[10px] px-3 py-2 text-[11px] transition ${
                subCategory === item.label ? 'bg-brand-teal/10 text-brand-teal-dark font-medium' : 'bg-bg text-text-secondary'
              }`}>
              <span>{item.label}</span>
              <span className="font-semibold">{item.cost}豆</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
