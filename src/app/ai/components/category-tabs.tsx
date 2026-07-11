import type { TabId } from '@/types/ai-chat';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'zodiac', icon: '🔮', label: '周易' },
  { id: 'lottery', icon: '🎱', label: '彩运' },
  { id: 'stock', icon: '📈', label: '股市' },
  { id: 'crypto', icon: '₿', label: '加密' },
];

interface Props {
  current: TabId;
  onChange: (id: TabId) => void;
}

export default function CategoryTabs({ current, onChange }: Props) {
  return (
    <div className="sticky top-[52px] z-20 bg-white border-b border-border-tertiary">
      <div className="flex px-2 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex-1 whitespace-nowrap py-2.5 px-1 text-[11px] font-medium text-center transition-all relative ${
              current === t.id ? 'text-brand-teal-dark font-semibold' : 'text-text-tertiary'
            }`}>
            {t.icon} {t.label}
            {current === t.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-teal rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  );
}
