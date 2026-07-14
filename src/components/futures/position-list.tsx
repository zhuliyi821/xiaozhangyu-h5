"use client";

import { Shield } from "lucide-react";
import type { Position } from "./use-futures-positions";
import { PositionCard } from "./position-card";

interface PositionListProps {
  positions: Position[];
  floatingPnl: number;
  operating: boolean;
  onClose: (pos: Position) => void;
}

export function PositionList({ positions, floatingPnl, operating, onClose }: PositionListProps) {
  if (positions.length === 0) return null;

  return (
    <div className="bg-surface rounded-[8px] p-4 shadow-sm border border-border-tertiary">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-semibold">当前持仓 ({positions.length})</span>
        <span className="ml-auto text-[10px] text-text-tertiary">
          浮动盈亏:{" "}
          <span className={`font-bold ${floatingPnl >= 0 ? "text-brand-coral" : "text-brand-teal"}`}>
            {floatingPnl >= 0 ? "+" : ""}{floatingPnl.toLocaleString()}
          </span>
        </span>
      </div>
      {positions.map(pos => (
        <PositionCard key={pos.id} pos={pos} operating={operating} onClose={onClose} />
      ))}
    </div>
  );
}
