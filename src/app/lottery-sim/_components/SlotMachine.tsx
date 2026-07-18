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
  const totalBalls = totalFront + totalBack;
  const allRevealed = revealedNumbers.length >= totalBalls;
  const [shuffleVals, setShuffleVals] = useState<number[]>([]);
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [celebration, setCelebration] = useState(false);

  // ── Shuffle animation (CSS-timer-based, no rAF) ──
  useEffect(() => {
    if (!isRolling) {
      if (shuffleTimer.current) clearInterval(shuffleTimer.current);
      return;
    }
    // Cycle numbers rapidly during rolling
    shuffleTimer.current = setInterval(() => {
      setShuffleVals(
        Array.from({ length: totalBalls }, (_, i) => {
          if (i < revealedNumbers.length) return revealedNumbers[i];
          return Math.floor(Math.random() * (i < totalFront ? 33 : 16)) + 1;
        })
      );
    }, 80); // ~12 fps, smooth enough
    return () => { if (shuffleTimer.current) clearInterval(shuffleTimer.current); };
  }, [isRolling, revealedNumbers.length]);

  // ── Celebration on completion ──
  useEffect(() => {
    if (allRevealed || isComplete) {
      setCelebration(true);
      const t = setTimeout(() => setCelebration(false), 800);
      return () => clearTimeout(t);
    }
  }, [allRevealed, isComplete]);

  const isCurrentBall = (idx: number) => idx === revealedNumbers.length && (isRolling || !isComplete);
  const isRevealedBall = (idx: number) => idx < revealedNumbers.length;
  const isFutureBall = (idx: number) => idx > revealedNumbers.length && !isComplete;

  return (
    <div className="bg-white rounded-[12px] shadow-sm p-4 mx-4 mb-3">
      <style>{`
        .ball-card {
          perspective: 200px;
          width: 44px;
          height: 44px;
        }
        .ball-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .ball-inner.flipped {
          transform: rotateY(180deg);
        }
        .ball-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 700;
          color: white;
        }
        .ball-back {
          z-index: 2;
        }
        .ball-front {
          transform: rotateY(180deg);
        }
        @keyframes shufflePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes celebratePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes futurePulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        .celebration-bounce {
          animation: celebratePop 0.6s ease-out;
        }
        .future-ball {
          animation: futurePulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Title */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold" style={{color: "#1C1C1E"}}>🎰 摇奖机</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {isAuto ? "⏰ 系统自动摇奖中..." : isRolling ? "🎲 正在摇号..." : allRevealed ? "✅ 开奖完成" : "👆 点击摇奖按钮"}
        </p>
      </div>

      {/* Ball row */}
      <div className="flex justify-center items-center gap-2 min-h-[100px] py-3">
        {Array.from({ length: totalBalls }).map((_, idx) => {
          const revealed = isRevealedBall(idx);
          const current = isCurrentBall(idx);
          const future = isFutureBall(idx);
          const isFront = idx < totalFront;
          const color = isFront ? C.coral : C.teal;
          const shuffleVal = shuffleVals[idx];
          const showRevealed = revealed && revealedNumbers[idx] !== undefined;
          const showShuffle = current && isRolling && shuffleVal !== undefined;
          const showFuture = future || (!revealed && !current);
          const isFlipped = revealed || (current && !isRolling && currentNumber !== null);

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className="ball-card" style={{width: '44px', height: '44px'}}>
                <div
                  className={`ball-inner ${isFlipped ? 'flipped' : ''} ${celebration ? 'celebration-bounce' : ''}`}
                  style={{animationDelay: `${idx * 0.08}s`}}
                >
                  {/* Back face: shows ? or shuffle number */}
                  <div
                    className="ball-face ball-back"
                    style={{
                      backgroundColor: color,
                      boxShadow: current && isRolling ? `0 0 14px ${color}80` : 'none',
                      animation: current && isRolling ? 'shufflePulse 0.3s ease-in-out infinite' : 'none',
                    }}
                  >
                    {showShuffle ? (
                      <span style={{fontSize: '11px'}}>{shuffleVal}</span>
                    ) : showFuture ? (
                      <span style={{fontSize: '14px', opacity: 0.6}}>?</span>
                    ) : !revealed && !current ? (
                      <span style={{fontSize: '14px', opacity: 0.3}}>?</span>
                    ) : (
                      <span style={{fontSize: '14px'}}>?</span>
                    )}
                  </div>
                  {/* Front face: revealed number */}
                  <div
                    className="ball-face ball-front"
                    style={{backgroundColor: color}}
                  >
                    {showRevealed ? (
                      <span style={{fontSize: '11px'}}>{revealedNumbers[idx]}</span>
                    ) : current && !isRolling && currentNumber !== null ? (
                      <span style={{fontSize: '11px'}}>{currentNumber}</span>
                    ) : (
                      <span style={{fontSize: '11px'}}>{revealedNumbers[idx]}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Position label */}
              <span className="text-[8px] text-gray-400" style={{marginTop: '4px'}}>
                {isFront ? `${idx + 1}` : "蓝"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-2">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-400">
            {revealedNumbers.length} / {totalBalls} 已出
          </div>
          {/* Progress dots */}
          <div className="flex gap-0.5">
            {Array.from({ length: totalBalls }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < revealedNumbers.length
                    ? (i < totalFront ? C.coral : C.teal)
                    : i === revealedNumbers.length && isRolling
                      ? '#FFD600'
                      : '#E5E5E5',
                  transform: i === revealedNumbers.length && isRolling ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
          </div>
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
            {isRolling ? "摇号中..." : isAuto ? "⏰ 自动摇奖" : "🎲 摇一下"}
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
