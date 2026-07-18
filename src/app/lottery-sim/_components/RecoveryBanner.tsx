"use client";

interface RecoveryBannerProps {
  hasRecovery: boolean;
  isRolling: boolean;
  revealedCount: number;
  totalBalls: number;
  drawPhase: string;
  onDismiss: () => void;
  onResume: () => void;
}

export default function RecoveryBanner({
  hasRecovery, isRolling, revealedCount, totalBalls, drawPhase,
  onDismiss, onResume,
}: RecoveryBannerProps) {
  if (!hasRecovery) return null;

  return (
    <div className="mx-4 mb-3 bg-amber-50 border border-amber-200/60 rounded-[12px] p-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">🔄</span>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-amber-800">
            检测到未完成的摇奖
          </p>
          <p className="text-[10px] text-amber-600 mt-0.5">
            {isRolling
              ? `正在摇号中 (${revealedCount}/${totalBalls})...`
              : drawPhase === "complete"
                ? `已完成 (${revealedCount}/${totalBalls})，查看结果`
                : `已揭示 ${revealedCount}/${totalBalls} 个号码`}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onResume}
              className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-500 text-white active:scale-95 transition-all"
            >
              继续摇奖
            </button>
            <button
              onClick={onDismiss}
              className="text-[11px] font-medium px-3 py-1 rounded-full bg-white text-amber-700 border border-amber-200 active:scale-95 transition-all"
            >
              放弃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
