"use client";

import { useState } from "react";
import { Match, MOCK_MATCHES } from "@/app/sports-betting/types";

export type FilterTab = "open" | "upcoming" | "finished";

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [activeTab, setActiveTab] = useState<FilterTab>("open");

  const filteredMatches = matches.filter(m => {
    if (activeTab === "open") return m.status === "open" || m.status === "live";
    if (activeTab === "upcoming") return m.status === "upcoming";
    return m.status === "finished" || m.status === "settled";
  });

  const tabCounts = {
    open: matches.filter(m => m.status === "open" || m.status === "live").length,
    upcoming: matches.filter(m => m.status === "upcoming").length,
    finished: matches.filter(m => m.status === "finished" || m.status === "settled").length,
  };

  const TAB_LABELS: Record<FilterTab, string> = {
    open: "进行中",
    upcoming: "即将开始",
    finished: "已结束",
  };

  return { matches, filteredMatches, activeTab, setActiveTab, tabCounts, TAB_LABELS };
}
