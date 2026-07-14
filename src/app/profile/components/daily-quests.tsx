"use client";

/** 📋 今日任务：从后端动态渲染前3项 + 宝箱进度 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/config/api";

interface BackendTask {
  id: number;
  task_key: string;
  name_zh: string;
  reward_coins: number;
  reward_beans: number;
  reward_crystal: number;
  target_action: string;
  target_count: number;
  user_progress: number;
  is_claimed: number;
}

interface Props {
  uid: number;
  onRefreshBalance: () => void;
}

/** 任务→跳转路径映射 */
const TASK_LINKS: Record<string, string> = {
  first_bet: "/ai-predictions",
  first_win: "/ai-predictions",
  pk_beginner: "/pk-hall",
  create_event: "/pk-hall",
  social_butterfly: "/feed",
};

/** 格式化奖励文案 */
function formatReward(t: BackendTask): string {
  const parts: string[] = [];
  if (t.reward_coins > 0) parts.push(`+${t.reward_coins}🎮`);
  if (t.reward_beans > 0) parts.push(`+${t.reward_beans}🏪`);
  if (t.reward_crystal > 0) parts.push(`+${t.reward_crystal}🔮`);
  return parts.join(" · ");
}

export default function DailyQuests({ uid, onRefreshBalance }: Props) {
  const [allTasks, setAllTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedMsgs, setClaimedMsgs] = useState<Record<string, string>>({});
  const [chestMsg, setChestMsg] = useState("");

  // ── 拉取任务数据 ──
  const fetchTasks = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const d = await apiFetch<{ tasks: BackendTask[] }>(`/api/tasks?uid=${uid}`);
      setAllTasks(d.tasks || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // 取前 3 项展示（按 sort_order）
  const displayTasks = allTasks.slice(0, 3);
  const doneTasks = displayTasks.filter(t => t.user_progress >= t.target_count);
  const doneCount = doneTasks.length;
  const total = displayTasks.length;
  const chestReady = doneCount >= 2;

  // ── 领取奖励 ──
  const handleClaim = async (taskKey: string) => {
    if (claiming) return;
    setClaiming(taskKey);
    try {
      const res = await fetch("/api/tasks/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, task_key: taskKey }),
      });
      const json = await res.json();
      if (json.code === 0) {
        const msg = json.data?.rewards || "领取成功";
        setClaimedMsgs(prev => ({ ...prev, [taskKey]: msg }));
        onRefreshBalance();
        await fetchTasks(); // re-fetch to update claimed status
      }
    } catch {} finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-4 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium">📋 今日任务</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2.5 bg-white rounded-[10px] p-2.5 mb-1.5 border border-gray-100 animate-pulse">
            <div className="w-[18px] h-[18px] rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-text-primary">📋 今日任务</span>
        <span className="text-[9px] text-text-tertiary">{doneCount}/{total} 完成</span>
      </div>

      {/* ── 3 Task Items ── */}
      {displayTasks.map(t => {
        const done = t.user_progress >= t.target_count;
        const claimed = t.is_claimed === 1;
        const msg = claimedMsgs[t.task_key];
        const link = TASK_LINKS[t.task_key];

        return (
          <div
            key={t.task_key}
            className="flex items-center gap-2.5 bg-white rounded-[10px] px-3 py-2.5 mb-1.5 border border-gray-100 transition-all"
            style={{ opacity: done ? 0.65 : 1 }}
          >
            {/* Check circle */}
            <div className="w-[18px] h-[18px] rounded-full border-2 border-brand-teal flex items-center justify-center shrink-0"
              style={{ background: done ? 'var(--brand-teal, #45CCD5)' : 'transparent' }}>
              {done && <span className="text-white text-[9px]">✓</span>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-text-primary truncate">{t.name_zh}</div>
              <div className="text-[9px] text-text-tertiary mt-0.5">{formatReward(t)}</div>
            </div>

            {/* Action */}
            {!done ? (
              // 未完成 → 引导去做
              <a href={link || "#"}
                className="text-[9px] text-brand-teal-dark font-medium shrink-0 active:scale-95 transition-transform"
                onClick={(e) => { if (!link) e.preventDefault(); }}>
                去做 →
              </a>
            ) : claimed ? (
              // 已完成已领取
              <span className="text-[9px] text-text-tertiary shrink-0">
                {msg ? `+${msg}` : "已领取 ✓"}
              </span>
            ) : (
              // 已完成未领取
              <button
                onClick={(e) => { e.stopPropagation(); handleClaim(t.task_key); }}
                disabled={claiming === t.task_key}
                className="text-[9px] bg-brand-teal text-white px-2.5 py-1 rounded-[6px] font-medium shrink-0 active:scale-95 transition-transform disabled:opacity-50"
              >
                {claiming === t.task_key ? "领取中..." : "领取奖励"}
              </button>
            )}
          </div>
        );
      })}

      {/* ── Chest Bottom Bar ── */}
      <div className="flex items-center justify-between bg-white rounded-[10px] px-3 py-2.5 border border-gray-100 mt-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px]">📦</span>
          <span className="text-[10px] text-text-primary font-medium">每日宝箱</span>
          <div className="w-[72px] h-[4px] bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-gold to-amber-300 rounded-full transition-all duration-500"
              style={{ width: `${Math.round(doneCount / total * 100)}%` }} />
          </div>
          <span className="text-[9px] text-text-tertiary">{doneCount}/{total}</span>
        </div>
        <button
          onClick={async () => {
            if (!chestReady) return;
            try {
              // 宝箱开启：尝试领取 daily_checkin 奖励（若有）
              const res = await fetch("/api/tasks/claim", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid, task_key: "daily_checkin" }),
              });
              const json = await res.json();
              if (json.code === 0) {
                setChestMsg(`🎉 宝箱开启！获得 ${json.data?.rewards || "奖励"}！`);
                onRefreshBalance();
                await fetchTasks();
              } else if (json.code === 3) {
                setChestMsg("今日宝箱已开启 ✨");
              } else {
                setChestMsg("🎁 宝箱开启成功！明日继续加油~");
              }
            } catch {
              setChestMsg("🎁 宝箱已开！");
            }
            setTimeout(() => setChestMsg(""), 3000);
          }}
          disabled={!chestReady}
          className="text-[9px] px-3 py-1 rounded-[8px] font-medium transition-all disabled:opacity-40 disabled:cursor-default"
          style={{
            background: chestReady
              ? 'linear-gradient(135deg, #F2B631, #D99A0F)'
              : '#E5E5EA',
            color: chestReady ? '#fff' : '#8E8E93',
          }}
        >
          🎁 {chestReady ? '开启宝箱' : '进行中'}
        </button>
      </div>

      {/* ── Chest success message ── */}
      {chestMsg && (
        <div className="mt-1.5 text-center text-[9px] text-brand-gold-dark font-medium animate-pulse">
          {chestMsg}
        </div>
      )}

      {/* ── Link to full task center ── */}
      <div className="mt-1.5 text-center">
        <span
          onClick={() => window.location.href = '/tasks'}
          className="text-[9px] text-brand-teal cursor-pointer inline-block"
        >
          查看全部任务 →
        </span>
      </div>
    </div>
  );
}
