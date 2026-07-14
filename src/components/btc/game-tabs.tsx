"use client";

interface GameTabsProps {
  active: string;
  onChange: (tab: string) => void;
}

const TABS = [
  { k: "fast", l: "🎲 快节奏" },
  { k: "positions", l: "📋 记录" },
];

export function GameTabs({ active, onChange }: GameTabsProps) {
  return (
    <div className="flex gap-1 rounded-[10px] bg-surface p-0.5 mb-3 shadow-card border border-border">
      {TABS.map(t => (
        <button key={t.k} onClick={() => onChange(t.k)}
          className={`flex-1 whitespace-nowrap rounded-[8px] px-2 py-2 text-center text-[10px] font-semibold transition ${
            active === t.k ? "bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white shadow-sm" : "text-text-tertiary hover:text-text-secondary"
          }`}>
          {t.l}
        </button>
      ))}
    </div>
  );
}
