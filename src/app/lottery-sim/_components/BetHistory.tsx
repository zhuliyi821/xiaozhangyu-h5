"use client";

import { History as HistoryIcon, ChevronDown } from "lucide-react";

interface BetResult {
  bet_id: string; lottery_name: string; total_bet: number; total_win: number; net_result: number;
  tickets: Array<{ ticket: any; prize: any }>;
  draw: any; draw_id: string; balance_after: number;
}

interface BetHistoryProps {
  history: BetResult[];
  onHistoryView: () => void;
}

export default function BetHistory({ history, onHistoryView }: BetHistoryProps) {
  return (
    <details className="bg-surface rounded-[8px] overflow-hidden shadow-sm border border-border-tertiary mb-3"
      onToggle={(e) => { if ((e.target as HTMLDetailsElement).open) onHistoryView(); }}>
      <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-text-tertiary" />
          <span>参与历史</span>
          {history.length > 0 && <span className="text-[9px] text-text-tertiary font-normal">({history.length})</span>}
        </div>
        <ChevronDown className="w-4 h-4 text-text-tertiary" />
      </summary>
      <div className="px-4 pb-4 max-h-72 overflow-y-auto space-y-2">
        {history.length === 0 && <div className="text-xs text-text-tertiary text-center py-4">暂无参与记录</div>}
        {history.map((h, i) => {
          const drawFront = h.draw?.front || [];
          const drawBack = h.draw?.back || [];
          return (
            <div key={i} className={`p-2.5 rounded-[8px] border ${h.net_result > 0 ? 'bg-[#FFF9EB] border-[#F2B631]/20' : 'bg-bg border-border-tertiary/60'}`}>
              {/* 头部信息 */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold">{h.lottery_name}</span>
                  <span className="text-[8px] text-text-tertiary">#{h.bet_id.slice(-6)}</span>
                </div>
                <div className={`text-[10px] font-bold ${h.net_result > 0 ? 'text-brand-coral' : 'text-text-tertiary'}`}>
                  {h.net_result > 0 ? `+${h.net_result}🎮` : h.net_result === 0 ? '0🎮' : `${h.net_result}🎮`}
                </div>
              </div>
              {/* 号码比对 */}
              {h.tickets?.slice(0, 1).map((t, ti) => (
                <div key={ti} className="flex items-start gap-1">
                  <span className="text-[8px] text-text-tertiary mt-1 w-4 shrink-0">选</span>
                  <div className="flex gap-0.5 flex-wrap">
                    {(t.ticket?.front || []).map((fn: number, fi: number) => {
                      const matched = drawFront.includes(fn);
                      return <span key={fi} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold ${matched ? 'bg-[#F27152] text-white' : 'bg-gray-100 text-text-tertiary'}`}>{String(fn).padStart(2,"0")}</span>;
                    })}
                    {(t.ticket?.back || []).map((bn: number, bi: number) => {
                      const matched = drawBack.includes(bn);
                      return <span key={"b"+bi} className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-bold ${matched ? 'bg-[#45CCD5] text-white' : 'bg-gray-100 text-text-tertiary'}`}>{String(bn).padStart(2,"0")}</span>;
                    })}
                  </div>
                </div>
              ))}
              {/* 开奖号码 */}
              {drawFront.length > 0 && (
                <div className="flex items-start gap-1 mt-1">
                  <span className="text-[8px] text-text-tertiary mt-1 w-4 shrink-0">开</span>
                  <div className="flex gap-0.5 flex-wrap">
                    {drawFront.map((fn: number, fi: number) => (
                      <span key={fi} className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[7px] font-bold bg-gray-50 text-text-tertiary border border-gray-200">{String(fn).padStart(2,"0")}</span>
                    ))}
                    {drawBack.map((bn: number, bi: number) => (
                      <span key={"b"+bi} className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[7px] font-bold bg-gray-50 text-text-tertiary border border-gray-200">{String(bn).padStart(2,"0")}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* 中奖信息 */}
              {h.tickets?.slice(0, 1).map((t, ti) => (
                t.prize?.won && (
                  <div key={`p${ti}`} className="mt-1 text-[9px] font-medium text-brand-gold-dark flex items-center gap-1">
                    <span>🎉</span> {t.prize.name} +{Number(t.prize.amount || 0).toLocaleString()}✨
                  </div>
                )
              ))}
            </div>
          );
        })}
      </div>
    </details>
  );
}
