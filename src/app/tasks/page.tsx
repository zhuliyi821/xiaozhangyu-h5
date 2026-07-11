"use client";

/** 📋 任务中心 — 真实数据版 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import LoginModal from "@/components/ui/login-modal";

interface TaskItem {
  id: number;
  task_key: string;
  name_zh: string;
  icon: string;
  reward_coins: number;
  reward_beans: number;
  reward_crystal: number;
  target_count: number;
  user_progress: number;
  is_claimed: number;
  sort_order: number;
}

interface TasksData {
  tasks: TaskItem[];
  daily_stats: { bet_today: number; win_today: number };
}

export default function TasksPage() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [data, setData] = useState<TasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedMsg, setClaimedMsg] = useState<Record<string, string>>({});

  const fetchTasks = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const d = await apiFetch<TasksData>(`/api/tasks?uid=${user.uid}`);
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [user?.uid]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleClaim = async (taskKey: string) => {
    if (!user || claiming) return;
    setClaiming(taskKey);
    try {
      const r = await apiFetch<{ rewards: string }>("/api/tasks/claim", {
        method: "POST",
        body: JSON.stringify({ uid: user.uid, task_key: taskKey }),
      });
      setClaimedMsg(p => ({...p, [taskKey]: `✅ 领取 ${r.rewards}`}));
      fetchTasks();
    } catch (err: any) {
      setClaimedMsg(p => ({...p, [taskKey]: `❌ ${err?.msg || "领取失败"}`}));
    } finally { setClaiming(null); }
  };

  const rewardStr = (t: TaskItem) => {
    const parts: string[] = [];
    if (t.reward_coins > 0) parts.push(`${t.reward_coins}🎮`);
    if (t.reward_beans > 0) parts.push(`${t.reward_beans}🏪`);
    if (t.reward_crystal > 0) parts.push(`${t.reward_crystal}🔮`);
    return parts.join("+") || "奖励";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-5xl mb-3">📋</div>
          <div className="text-[15px] font-medium mb-1">任务中心</div>
          <div className="text-[11px] text-text-tertiary mb-4">登录后查看任务进度</div>
          <button onClick={() => setShowLogin(true)}
            className="bg-brand-teal text-white text-[12px] px-6 py-2 rounded-[10px] font-medium">立即登录</button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1D9E75] to-[#167A5A] text-white px-5 pt-4 pb-6 rounded-b-[24px]">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold">📋 任务中心</h1>
          <span className="text-[10px] bg-white/15 px-2.5 py-1 rounded-[8px]">
            今日 {data?.daily_stats?.bet_today || 0} 次预测
          </span>
        </div>
        <p className="text-[11px] opacity-80">完成任务赢取游戏豆和水晶球</p>
      </div>

      {/* Task List */}
      <div className="mx-4 mt-4 space-y-2">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[12px] p-4 animate-pulse border border-gray-100">
              <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-40 bg-gray-50 rounded" />
            </div>
          ))
        ) : (
          data?.tasks?.map(task => {
            const done = task.user_progress >= task.target_count;
            const claimed = task.is_claimed === 1;
            const progress = Math.min(100, Math.round((task.user_progress / task.target_count) * 100));

            return (
              <div key={task.task_key}
                className={`bg-white rounded-[12px] p-4 shadow-sm border transition-all ${
                  done && !claimed ? 'border-green-200' : 'border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                  {/* Check circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] shrink-0 ${
                    claimed ? 'bg-green-100 text-green-600' :
                    done ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {claimed ? '✓' : (done ? '✓' : (task.sort_order))}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{task.name_zh}</div>
                    <div className="text-[10px] text-text-tertiary">
                      {done ? (claimed ? '✅ 已领取' : '🎉 完成！') : `进度 ${task.user_progress}/${task.target_count}`}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        claimed ? 'bg-green-400' : done ? 'bg-green-400' : 'bg-brand-teal'
                      }`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-text-tertiary">奖励</div>
                    <div className="text-[11px] font-medium">{rewardStr(task)}</div>
                  </div>
                </div>

                {/* Claim button */}
                {done && !claimed && (
                  <button onClick={() => handleClaim(task.task_key)} disabled={claiming === task.task_key}
                    className="w-full mt-2 bg-gradient-to-r from-[#1D9E75] to-[#167A5A] text-white text-[10px] font-medium py-2 rounded-[8px] active:scale-[0.98] transition-transform disabled:opacity-50">
                    {claiming === task.task_key ? "领取中..." : "领取奖励"}
                  </button>
                )}

                {claimedMsg[task.task_key] && (
                  <div className="mt-1 text-[10px] text-center">{claimedMsg[task.task_key]}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
