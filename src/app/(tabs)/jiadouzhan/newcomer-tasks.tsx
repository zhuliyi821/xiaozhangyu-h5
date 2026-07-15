"use client";

/**
 * 🎯 新手成长任务 — 注册奖励5步拆分
 *
 * 步骤②-⑤ 采用"分享即完成(auto-claim)"模式：
 *   点击"去完成" → 跳转对应功能页 → 完成动作+分享 → auto-claim
 */

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/config/api";
import { ChevronRight, Loader2, Gift, Sparkles } from "lucide-react";
import Link from "next/link";

interface NewcomerStep {
  step: number;
  status: number; // 0=未完成 1=已完成待领取 2=已领奖
  reward: number;
  action: string;
  need_share: boolean;
  completed_at: string | null;
  claimed_at: string | null;
}

interface Props {
  uid: number;
  onBalanceRefresh?: () => void;
}

const STEP_LINKS: Record<number, string> = {
  2: "/daily-fortune",
  3: "/pk-hall",
  4: "/pk-hall",
  5: "/service",
};

const STEP_ICONS: Record<number, string> = {
  1: "🎁",
  2: "🔮",
  3: "🎮",
  4: "⚔️",
  5: "📢",
};

export default function NewcomerTasks({ uid, onBalanceRefresh }: Props) {
  const [steps, setSteps] = useState<NewcomerStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReward, setTotalReward] = useState(150000);
  const [claimed, setClaimed] = useState(0);
  const [completing, setCompleting] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/newcomer/tasks?action=tasks&uid=${uid}`);
      const json = await res.json();
      if (json.code === 0) {
        setSteps(json.data.steps);
        setTotalReward(json.data.total_reward);
        setClaimed(json.data.claimed);
      }
    } catch {}
    setLoading(false);
  }, [uid]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleClaim = async (step: number) => {
    setCompleting(step);
    try {
      const res = await fetch("/api/newcomer/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", uid, step }),
      });
      const json = await res.json();
      if (json.code === 0) {
        await fetchTasks();
        onBalanceRefresh?.();
      }
    } catch {}
    setCompleting(null);
  };

  // 如果全部已完成，不显示（用户已完成入职流程）
  const allDone = steps.length > 0 && steps.every(s => s.status === 2);
  if (allDone) return null;

  const completedCount = steps.filter(s => s.status > 0).length;

  return (
    <section className="mx-4 mt-3 mb-3">
      <div className="bg-white rounded-[12px] border border-brand-teal/10 p-3.5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            <span className="text-[12px] font-semibold text-text-primary">🎯 新手成长</span>
          </div>
          <span className="text-[9px] text-text-tertiary">
            已领 <span className="text-brand-teal-dark font-semibold">{claimed.toLocaleString()}</span> / {totalReward.toLocaleString()} 🎮
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-brand-gold to-brand-coral rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 5) * 100}%` }} />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {steps.map((s) => {
            const isDone = s.status === 2;
            const isReady = s.status === 1;
            const isLocked = s.status === 0;

            return (
              <div key={s.step}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] transition-colors ${
                  isDone ? "bg-green-50" : isReady ? "bg-amber-50" : "bg-gray-50"
                }`}>
                {/* Icon */}
                <span className="text-base shrink-0">{STEP_ICONS[s.step]}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium ${isDone ? "text-green-700" : isReady ? "text-amber-700" : "text-text-secondary"}`}>
                    {isDone ? "✅ " : isReady ? "🔓 " : "🔒 "}
                    步{s.step} · {s.action}
                  </div>
                  <div className="text-[9px] text-text-tertiary mt-0.5">
                    +{s.reward.toLocaleString()} 🎮
                    {s.need_share && !isDone && " · 需分享"}
                    {isDone && ` ✓ 已领`}
                  </div>
                </div>

                {/* Action button */}
                {!isDone && (
                  isReady ? (
                    <button onClick={() => handleClaim(s.step)} disabled={completing === s.step}
                      className="shrink-0 px-2.5 py-1 rounded-[6px] bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white text-[9px] font-medium active:scale-95 transition-transform disabled:opacity-50">
                      {completing === s.step ? "..." : "领取"}
                    </button>
                  ) : (
                    <Link href={STEP_LINKS[s.step] || "/pk-hall"}
                      className="shrink-0 px-2.5 py-1 rounded-[6px] bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white text-[9px] font-medium active:scale-95 transition-transform inline-flex items-center gap-0.5">
                      去完成 <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  )
                )}
              </div>
            );
          })}
        </div>

        {/* All done message */}
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-brand-teal" />
          </div>
        )}
      </div>
    </section>
  );
}
