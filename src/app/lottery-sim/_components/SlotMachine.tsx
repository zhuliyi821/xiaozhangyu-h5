"use client";

import { useState, useEffect, useRef } from "react";
import { C } from "@/lib/brand-colors";

interface SlotMachineProps {
  totalFront: number;
  totalBack: number;
  revealedNumbers: number[];
  isComplete: boolean;
  isRolling: boolean;
  isAuto: boolean;
  currentNumber: number | null;
  currentZone: "front" | "back" | null;
  currentPosition: number;
  onRoll: () => void;
  expiresIn: number;
}

export default function SlotMachine({
  totalFront, totalBack, revealedNumbers, isComplete,
  isRolling, isAuto, currentNumber, currentZone,
  currentPosition, onRoll, expiresIn,
}: SlotMachineProps) {
  const [animBalls, setAnimBalls] = useState<number[]>([]);
  const totalBalls = totalFront + totalBack;
  const allRevealed = revealedNumbers.length >= totalBalls;
  const animFrame = useRef(0);
  const rollingRef = useRef(false);

  // Rolling animation: show random numbers cycling
  useEffect(() => {
    if (!isRolling) {
      rollingRef.current = false;
      cancelAnimationFrame(animFrame.current);
      return;
    }
    rollingRef.current = true;
    const cycle = () => {
      if (!rollingRef.current) return;
      setAnimBalls(Array.from({ length: totalBalls }, (_, i) => {
        if (i < revealedNumbers.length) return revealedNumbers[i];
        return Math.floor(Math.random() * (i < totalFront ? 33 : 16)) + 1;
      }));
      animFrame.current = requestAnimationFrame(cycle);
    };
    cycle();
    return () => { cancelAnimationFrame(animFrame.current); };
  }, [isRolling]);

  // Clear animation when complete
  useEffect(() => {
    if (allRevealed || isComplete) {
      rollingRef.current = false;
      cancelAnimationFrame(animFrame.current);
    }
  }, [allRevealed, isComplete]);

  return (
    <div className="bg-white rounded-[12px] shadow-sm p-4 mx-4 mb-3">
      {/* Title */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold" style={{color: "#1C1C1E"}}>🎰 摇奖机</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {isAuto ? "⏰ 系统自动摇奖中..." : isRolling ? "🎲 正在摇号..." : allRevealed ? "✅ 开奖完成" : "👆 点击摇奖按钮"}
        </p>
      </div>

      {/* Drum machine visual */}
      <div className="flex justify-center items-end gap-1.5 min-h-[100px] py-3">
        {Array.from({ length: totalBalls }).map((_, idx) => {
          const isRevealed = idx < revealedNumbers.length;
          const isCurrent = idx === revealedNumbers.length && isRolling;
          const value = isRevealed ? revealedNumbers[idx] : (isCurrent && currentNumber !== null ? currentNumber : null);
          const isFront = idx < totalFront;

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              {/* Ball */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  text-xs font-bold text-white transition-all duration-500
                  ${isRevealed ? "scale-100 opacity-100" : isCurrent ? "scale-110 animate-bounce" : "scale-75 opacity-30"}
                `}
                style={{
                  backgroundColor: isFront ? C.coral : C.teal,
                  boxShadow: isCurrent ? `0 0 12px ${isFront ? C.coral : C.teal}60` : "none",
                }}
              >
                {isRevealed ? value : isCurrent ? "?" : ""}
              </div>
              {/* Label */}
              <span className="text-[8px] text-gray-400">
                {isFront ? `${idx + 1}` : "蓝"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Roll button */}
      <div className="flex items-center justify-between mt-2">
        {/* Progress */}
        <div className="text-[10px] text-gray-400">
          {revealedNumbers.length} / {totalBalls} 已出
        </div>

        {/* Timer */}
        {!allRevealed && !isComplete && (
          <div className="text-[10px]" style={{color: expiresIn < 30 ? "#E24B4A" : "#888780"}}>
            ⏱ {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, "0")}
          </div>
        )}

        {/* Action button */}
        {!allRevealed && !isComplete && (
          <button
            onClick={onRoll}
            disabled={isRolling}
            className={`
              text-[11px] font-medium px-4 py-1.5 rounded-full
              active:scale-95 transition-all
              ${isRolling
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "text-white shadow-sm"
              }
            `}
            style={{backgroundColor: isRolling ? undefined : C.coral}}
          >
            {isRolling ? "摇号中..." : isAuto ? "⏰ 自动摇奖" : allRevealed ? "🎲 摇一下" : "🎲 开始摇奖"}
          </button>
        )}

        {allRevealed && (
          <span className="text-[11px] font-medium" style={{color: C.teal}}>✅ 已完成</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(revealedNumbers.length / totalBalls) * 100}%`,
            backgroundColor: C.coral,
          }}
        />
      </div>
    </div>
  );
}
