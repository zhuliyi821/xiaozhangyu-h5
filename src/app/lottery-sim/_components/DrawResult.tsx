"use client";

import { Trophy } from "lucide-react";

interface BetResult {
  bet_id: string; lottery_name: string; total_bet: number; total_win: number; net_result: number;
  tickets: Array<{ ticket: any; prize: any }>;
  draw: any; draw_id: string; balance_after: number;
}

interface DrawResultProps {
  result: BetResult | null;
  rollDisplay: number;
  lastTickets: Array<{ front: number[]; back: number[] }>;
  onRebet: () => void;
}

export default function DrawResult({ result, rollDisplay, lastTickets, onRebet }: DrawResultProps) {
  if (!result) return null;
  return (
    <div className="bg-surface rounded-[8px] p-5 shadow-sm border border-border-tertiary mb-3 text-center animate-in">
      
      {/* 🏆 开奖号码 */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <Trophy className="w-4 h-4 text-brand-gold" />
        <span className="text-[13px] font-medium">开奖号码</span>
        <span className="text-[8px] text-text-tertiary ml-1">第{result.bet_id?.slice(-6) || "—"}期</span>
      </div>
      
      <div className="flex justify-center gap-2 mb-3">
        {result.draw.front?.map((n: number, i: number) => (
          <div key={"f"+i}
            className="w-10 h-10 rounded-full bg-[#F27152] text-white flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ animation: `ballDrop 0.4s ease-out ${i * 0.08}s both` }}>
            {String(n).padStart(2, "0")}
          </div>
        ))}
        {result.draw.back?.map((n: number, i: number) => (
          <div key={"b"+i}
            className="w-10 h-10 rounded-full bg-[#45CCD5] text-white flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ animation: `ballDrop 0.4s ease-out ${(result.draw.front?.length || 0) * 0.08 + i * 0.08}s both` }}>
            {String(n).padStart(2, "0")}
          </div>
        ))}
        {result.draw.digits?.map((n: number, i: number) => (
          <div key={"d"+i}
            className="w-9 h-10 rounded-lg bg-gradient-to-br from-brand-gold to-brand-gold-dark text-white flex items-center justify-center text-sm font-bold shadow-sm"
            style={{ animation: `ballDrop 0.4s ease-out ${i * 0.08}s both` }}>
            {n}
          </div>
        ))}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border-tertiary to-transparent my-3" />

      <div className="flex items-center justify-center gap-1 mb-3">
        <span className="text-[13px] font-medium">参与比对</span>
      </div>

      {/* 每注比对结果 */}
      {result.tickets.map((t, i) => {
        const isWin = t.prize?.won;
        return (
          <div key={i} className={`p-3 rounded-[8px] mb-2 text-left ${isWin ? "bg-[#FFF9EB] border border-[#F2B631]/30" : "bg-bg"}`}>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[9px] text-text-tertiary w-6 shrink-0">选号</span>
              <div className="flex gap-1 flex-wrap">
                {(t.ticket?.front || []).map((fn: number, fi: number) => {
                  const matched = (result.draw.front || []).includes(fn);
                  return (
                    <span key={fi} className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
                      matched ? "bg-[#F27152] text-white" : "bg-gray-100 text-text-tertiary"
                    }`}>
                      {String(fn).padStart(2, "0")}
                    </span>
                  );
                })}
                {(t.ticket?.back || []).map((bn: number, bi: number) => {
                  const matched = (result.draw.back || []).includes(bn);
                  return (
                    <span key={"b"+bi} className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold ${
                      matched ? "bg-[#45CCD5] text-white" : "bg-gray-100 text-text-tertiary"
                    }`}>
                      {String(bn).padStart(2, "0")}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-tertiary">
                匹配 {t.prize?.matched_front || 0}前+{t.prize?.matched_back || 0}后
              </span>
              <span className={`text-xs font-bold ${isWin ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                {isWin ? `🎉 ${t.prize.name}` : "😅 未中奖"}
              </span>
            </div>
            {isWin && (
              <div className="mt-1 text-right text-sm font-bold text-brand-coral">
                +{Number(t.prize.amount || 0).toLocaleString()} ✨
              </div>
            )}
          </div>
        );
      })}
      
      {/* 盈亏汇总 */}
      <div className="mt-3 pt-2 border-t border-border-tertiary/40">
        {result.net_result > 0 ? (
          <span className="text-brand-coral font-bold text-lg">
            +{Number(rollDisplay || result.net_result).toLocaleString()}✨ 🎉
          </span>
        ) : result.net_result === 0 ? (
          <span className="text-text-tertiary text-sm">收支平衡</span>
        ) : (
          <span className="text-text-tertiary text-sm">{result.net_result}🎮</span>
        )}
      </div>
      
      {/* 再来一注 */}
      {lastTickets.length > 0 && (
        <button onClick={onRebet}
          className="mt-3 w-full py-3 rounded-[8px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-sm font-bold active:scale-[0.97] transition-all shadow-sm">
          🔄 再来一注 (同号)
        </button>
      )}
    </div>
  );
}
