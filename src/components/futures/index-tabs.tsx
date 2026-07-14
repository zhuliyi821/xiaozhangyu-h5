"use client";

import { INDEXES } from "./use-futures-quote";

interface IndexTabsProps {
  activeIndex: number;
  onSwitch: (i: number) => void;
  onClearError: () => void;
}

export function IndexTabs({ activeIndex, onSwitch, onClearError }: IndexTabsProps) {
  return (
    <div className="flex gap-2">
      {INDEXES.map((item, i) => (
        <button key={item.code}
          onClick={() => { onSwitch(i); onClearError(); }}
          className={`flex-1 py-3 rounded-[8px] text-sm font-bold transition-all ${
            activeIndex === i
              ? "bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white shadow-sm"
              : "bg-bg text-text-secondary border border-border-tertiary"
          }`}>
          <div className="text-[11px] opacity-80">{item.contract}</div>
          <div>{item.name}</div>
        </button>
      ))}
    </div>
  );
}
