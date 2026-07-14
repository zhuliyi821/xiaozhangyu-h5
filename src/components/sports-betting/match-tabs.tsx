"use client";

import type { FilterTab } from "./use-matches";

interface MatchTabsProps {
  activeTab: FilterTab;
  tabCounts: Record<FilterTab, number>;
  labels: Record<FilterTab, string>;
  onTabChange: (tab: FilterTab) => void;
}

export function MatchTabs({ activeTab, tabCounts, labels, onTabChange }: MatchTabsProps) {
  const tabs: FilterTab[] = ["open", "upcoming", "finished"];

  const icons: Record<FilterTab, string> = {
    open: "🔥",
    upcoming: "📅",
    finished: "🏁",
  };

  return (
    <div className="flex gap-2 px-4 mt-3" role="tablist" aria-label="比赛状态筛选">
      {tabs.map(tab => (
        <button key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-2 rounded-[8px] text-xs font-medium transition-all ${
            activeTab === tab
              ? "bg-brand-teal text-white shadow-sm"
              : "bg-surface text-text-secondary border border-border-tertiary"
          }`}>
          {icons[tab]} {labels[tab]}
          <span className={`ml-1 text-[9px] ${activeTab === tab ? "text-white/70" : "text-text-tertiary"}`}>
            {tabCounts[tab]}
          </span>
        </button>
      ))}
    </div>
  );
}
