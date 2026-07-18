"use client";

import { Trophy, Share2 } from "lucide-react";
import { C } from "@/lib/brand-colors";

interface TicketData {
  front: number[];
  back: number[];
  matched_front: number;
  matched_back: number;
  prize?: {
    won: boolean;
    name: string;
    amount: number;
    matched_front: number;
    matched_back: number;
    tier?: number;
  } | null;
}

interface LastGameResult {
  tickets: TicketData[];
  totalWin: number;
  netResult: number;
  settled: boolean;
}

interface DrawNumbers {
  front: number[];
  back: number[];
}

interface TicketComparisonProps {
  drawNumbers: DrawNumbers;
  tickets: TicketData[];
  totalWin: number;
  netResult: number;
  totalBet: number;
  lotteryName: string;
  onRebet: () => void;
  onShare?: () => void;
}

function DrawBall({ num, isFront, small }: { num: number; isFront: boolean; small?: boolean }) {
  const size = small ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold text-white shadow-sm`}
      style={{ backgroundColor: isFront ? C.coral : C.teal }}
    >
      {String(num).padStart(2, "0")}
    </div>
  );
}

function UserBall({ num, matched, isFront, small }: { num: number; matched: boolean; isFront: boolean; small?: boolean }) {
  const size = small ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[11px]";
  return (
    <span
      className={`inline-flex items-center justify-center ${size} rounded-full font-bold transition-all ${
        matched
          ? "text-white shadow-sm"
          : "text-text-tertiary border border-border-tertiary"
      }`}
      style={{
        backgroundColor: matched ? (isFront ? C.coral : C.teal) : undefined,
      }}
    >
      {String(num).padStart(2, "0")}
    </span>
  );
}

export default function TicketComparison({
  drawNumbers, tickets, totalWin, netResult, totalBet,
  lotteryName, onRebet, onShare,
}: TicketComparisonProps) {
  const isWin = totalWin > 0;
  const winCount = tickets.filter(t => t.prize?.won).length;

  const shareResult = () => {
    const text = `🎯 ${lotteryName} · 投注 ${totalBet}🎮 · 中奖 ${totalWin}🎮 · 净盈亏 ${netResult > 0 ? "+" : ""}${netResult}🎮`;
    if (onShare) { onShare(); return; }
    if (navigator.share) {
      navigator.share({ title: "数字碰", text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  return (
    <div className="mx-4 mb-3">
      {/* ── Draw numbers header ── */}
      <div className="bg-white rounded-t-[12px] p-4 pb-3 border-b border-border-tertiary/40">
        <div className="flex items-center justify-center gap-1.5 mb-3">
          <Trophy className="w-4 h-4" style={{color: C.gold}} />
          <span className="text-[13px] font-semibold" style={{color: "#1C1C1E"}}>开奖号码</span>
        </div>
        <div className="flex justify-center gap-2">
          {drawNumbers.front.map((n, i) => (
            <DrawBall key={`f${i}`} num={n} isFront />
          ))}
          {drawNumbers.back.map((n, i) => (
            <DrawBall key={`b${i}`} num={n} isFront={false} />
          ))}
        </div>
      </div>

      {/* ── Ticket comparisons ── */}
      <div className="bg-white px-4 py-2">
        {tickets.map((t, idx) => {
          const ticketWin = t.prize?.won;
          const matchCount = t.matched_front + t.matched_back;

          return (
            <div
              key={idx}
              className="py-3 border-b border-border-tertiary/30 last:border-b-0"
            >
              {/* Ticket header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium" style={{color: "#1C1C1E"}}>
                  第 {idx + 1} 注
                </span>
                {/* Match badge */}
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: ticketWin ? `${C.teal}15` : "#F5F5F5",
                    color: ticketWin ? C.teal : "#888780",
                  }}
                >
                  <span>命中 {matchCount} 个</span>
                </div>
              </div>

              {/* User numbers row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <span className="text-[9px] text-text-tertiary w-5 shrink-0">前区</span>
                {t.front.map((fn, fi) => {
                  const matched = drawNumbers.front.includes(fn);
                  return (
                    <UserBall key={`tf${fi}`} num={fn} matched={matched} isFront />
                  );
                })}
              </div>

              {t.back.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  <span className="text-[9px] text-text-tertiary w-5 shrink-0">后区</span>
                  {t.back.map((bn, bi) => {
                    const matched = drawNumbers.back.includes(bn);
                    return (
                      <UserBall key={`tb${bi}`} num={bn} matched={matched} isFront={false} />
                    );
                  })}
                </div>
              )}

              {/* Prize result */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-text-tertiary">
                  {t.matched_front}前 + {t.matched_back}后
                </span>
                {ticketWin && t.prize ? (
                  <span className="text-xs font-bold flex items-center gap-1" style={{color: C.coral}}>
                    🎉 {t.prize.name}
                    <span className="text-sm">+{t.prize.amount.toLocaleString()}🎮</span>
                  </span>
                ) : (
                  <span className="text-[10px]" style={{color: "#B4B2A9"}}>未中奖</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Summary ── */}
      <div
        className="bg-white rounded-b-[12px] p-4"
        style={{backgroundColor: isWin ? `${C.teal}08` : undefined}}
      >
        {/* Summary bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-text-tertiary">投注 {totalBet} 🎮</span>
          <span className="text-[10px] text-text-tertiary">中奖 {totalWin} 🎮</span>
          <span
            className="text-sm font-bold"
            style={{color: netResult > 0 ? C.coral : netResult === 0 ? "#888780" : "#B4B2A9"}}
          >
            {netResult > 0 ? "+" : ""}{netResult.toLocaleString()} 🎮
          </span>
        </div>

        {/* Win rate bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${tickets.length > 0 ? (winCount / tickets.length) * 100 : 0}%`,
              backgroundColor: isWin ? C.coral : "#D3D1C7",
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-text-tertiary mb-3">
          <span>{winCount}/{tickets.length} 注中奖</span>
          <span>{lotteryName}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onRebet}
            className="flex-1 py-2.5 rounded-[8px] text-[12px] font-bold text-white active:scale-[0.97] transition-all"
            style={{backgroundColor: C.coral}}
          >
            🔄 再来一注
          </button>
          <button
            onClick={shareResult}
            className="flex items-center justify-center gap-1 py-2.5 px-4 rounded-[8px] text-[12px] font-medium active:scale-[0.97] transition-all"
            style={{
              backgroundColor: "white",
              border: `0.5px solid #D3D1C7`,
              color: "#444441",
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            分享
          </button>
        </div>
        {winCount > 0 && (
          <p className="text-[9px] text-text-tertiary text-center mt-2">
            太棒了！中奖 {winCount} 注，继续加油！
          </p>
        )}
      </div>
    </div>
  );
}
