"use client";

/** 📋 任务中心 — 三层式架构 + 品牌色统一 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/config/api";
import { ErrorState } from "@/components/layout/error-state";
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

/* ─── 任务分组配置 ─── */
const GROUP_CONFIG = [
  {
    key: "新手必做",
    keys: ["first_bet", "first_win", "pk_beginner"],
    icon: "⭐",
    border: "border-brand-gold/30",
    bg: "bg-amber-50/40",
    badge: "bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white",
  },
  {
    key: "进阶挑战",
    keys: ["create_event", "social_butterfly"],
    icon: "🎯",
    border: "border-brand-teal/25",
    bg: "bg-cyan-50/30",
    badge: "bg-gradient-to-r from-brand-teal to-brand-teal-dark text-white",
  },
  {
    key: "日常挑战",
    keys: ["daily_checkin", "all_complete"],
    icon: "🔄",
    border: "border-gray-200",
    bg: "bg-white",
    badge: "bg-gradient-to-r from-gray-400 to-gray-500 text-white",
  },
];

/* ─── 成就里程碑台阶 ─── */
const MILESTONES = [
  { count: 3, icon: "🎖️", label: "小试牛刀" },
  { count: 7, icon: "🏆", label: "游刃有余" },
  { count: 15, icon: "🗿", label: "任务达人" },
  { count: 30, icon: "👑", label: "巅峰王者" },
];

function rewardStr(task: TaskItem): string {
  const parts: string[] = [];
  if (task.reward_coins > 0) parts.push(`${task.reward_coins}🎮`);
  if (task.reward_beans > 0) parts.push(`${task.reward_beans}🏪`);
  if (task.reward_crystal > 0) parts.push(`${task.reward_crystal}🔮`);
  return parts.join("+") || "奖励";
}

function totalCoinsEstimate(tasks: TaskItem[]): number {
  return tasks
    .filter(t => t.task_key !== "all_complete")
    .reduce((s, t) => s + t.reward_coins + t.reward_beans * 5 + t.reward_crystal * 200, 0);
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

  /* ─── 计算数据 ─── */
  const tasks = data?.tasks || [];
  const doneTasks = tasks.filter(t => t.user_progress >= t.target_count);
  const doneCount = doneTasks.length;
  const totalCount = tasks.filter(t => t.task_key !== "all_complete").length;
  const allDone = doneCount >= totalCount;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // 今日预估收益（已完成任务的reward之和）
  const earnedCoins = tasks
    .filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete")
    .reduce((s, t) => s + t.reward_coins, 0);
  const earnedBeans = tasks
    .filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete")
    .reduce((s, t) => s + t.reward_beans, 0);
  const earnedCrystal = tasks
    .filter(t => t.user_progress >= t.target_count && t.task_key !== "all_complete")
    .reduce((s, t) => s + t.reward_crystal, 0);

  // 累计完成任务数（从all_complete取或本地算）
  const lifetimeDone = tasks.find(t => t.task_key === "all_complete")
    ?.user_progress || 0;

  // 签到连续天数
  const checkinTask = tasks.find(t => t.task_key === "daily_checkin");
  const checkinStreak = checkinTask?.user_progress || 0;

  /* ─── 未登录状态 ─── */
  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">📋</div>
          <div className="text-lg font-bold mb-1 text-text-primary">任务中心</div>
          <div className="text-sm text-text-tertiary mb-6">登录后查看今日任务和奖励</div>
          <button onClick={() => setShowLogin(true)}
            className="bg-brand-teal text-white text-sm font-medium px-8 py-3 rounded-xl shadow-float active:scale-[0.97] transition-transform">
            立即登录
          </button>
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-8">
      {/* ═════════════════════════════ ① 品牌色 Header ═══════════════════════════ */}
      {/* ═══ 品牌色 Header（紧凑版） ═══ */}
      <div className="bg-gradient-to-br from-brand-teal via-brand-teal-dark to-brand-teal-darkest text-white px-5 pt-4 pb-5 rounded-b-[28px] shadow-soft">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">📋 任务中心</h1>
          <span className="text-[10px] bg-white/15 backdrop-blur px-2.5 py-1.5 rounded-lg">
            今日 {data?.daily_stats?.bet_today || 0} 次预测
          </span>
        </div>
      </div>

      {/* ═══ ① 今日收益看板（独立卡片，悬停在Header下方） ═══ */}
      <div className="px-4 -mt-4 relative z-10 mb-3.5">
        <div className="bg-surface rounded-2xl shadow-card border border-brand-teal/10 p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1">
              📈 今日收益
            </span>
            <span className="text-[10px] text-text-tertiary">
              {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-4 mb-2.5">
            {earnedCoins > 0 && (
              <span className="text-base font-bold text-brand-teal-dark">+{earnedCoins}🎮</span>
            )}
            {earnedBeans > 0 && (
              <span className="text-sm font-bold text-brand-gold-dark">+{earnedBeans}🏪</span>
            )}
            {earnedCrystal > 0 && (
              <span className="text-sm font-bold text-brand-coral">+{earnedCrystal}🔮</span>
            )}
            {earnedCoins === 0 && earnedBeans === 0 && earnedCrystal === 0 && (
              <span className="text-xs text-text-tertiary">今天还没完成任务哦</span>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-text-tertiary mb-1">
            <span>完成 {doneCount}/{totalCount} 个</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-teal to-brand-gold rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }} />
          </div>
          {checkinStreak > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-text-tertiary">
              <span>🔥 连续签到</span>
              <span className="font-bold text-brand-teal-dark">{checkinStreak} 天</span>
              <span className="text-text-tertiary">· 明天奖励翻倍</span>
            </div>
          )}
        </div>
      </div>

      {/* ═════════════════════════════ ② 任务分组 ═══════════════════════════ */}
      <div className="px-4 -mt-4 space-y-3.5 relative z-10">
        {loading ? (
          // 骨架屏
          <div className="space-y-3">
            {[1, 2, 3].map(g => (
              <div key={g} className="bg-surface rounded-2xl p-4 shadow-card animate-pulse border border-border">
                <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
                {[1, 2].map(i => (
                  <div key={i} className="h-14 bg-gray-50 rounded-xl mb-2" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          GROUP_CONFIG.map(group => {
            const groupTasks = group.keys
              .map(key => tasks.find(t => t.task_key === key))
              .filter(Boolean) as TaskItem[];
            if (groupTasks.length === 0) return null;

            const groupDone = groupTasks.filter(t => t.user_progress >= t.target_count).length;

            return (
              <div key={group.key}
                className={`bg-surface rounded-2xl shadow-card border ${group.border} overflow-hidden`}>
                {/* 组标题 */}
                <div className={`flex items-center justify-between px-4 pt-3.5 pb-2 ${group.bg}`}>
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    {group.icon} {group.key}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${group.badge}`}>
                    {groupDone}/{groupTasks.length}
                  </span>
                </div>

                {/* 任务列表 */}
                <div className="px-3 pb-3 space-y-2">
                  {groupTasks.map(task => {
                    const done = task.user_progress >= task.target_count;
                    const claimed = task.is_claimed === 1;
                    const progress = Math.min(100, Math.round((task.user_progress / task.target_count) * 100));

                    return (
                      <div key={task.task_key}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          done && !claimed
                            ? "bg-gradient-to-r from-amber-50 to-amber-100/60 border border-brand-gold/20"
                            : claimed
                            ? "bg-green-50/50 border border-green-100"
                            : "bg-bg/50 border border-transparent"
                        }`}>

                        {/* 状态圆标 */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                          claimed
                            ? "bg-green-100 text-green-600"
                            : done
                            ? "bg-brand-gold-light text-brand-gold-dark"
                            : "bg-gray-100 text-text-tertiary"
                        }`}>
                          {claimed ? "✓" : done ? "⭐" : task.icon || (task.sort_order)}
                        </div>

                        {/* 任务信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-text-primary">{task.name_zh}</span>
                            {done && !claimed && (
                              <span className="text-[9px] bg-brand-gold/15 text-brand-gold-dark font-medium px-1.5 py-0.5 rounded-md">可领取</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] ${
                              done ? "text-brand-teal-dark font-medium" : "text-text-tertiary"
                            }`}>
                              {done
                                ? (claimed ? "✅ 已领取" : "🎉 任务完成！")
                                : `进度 ${task.user_progress}/${task.target_count}`
                              }
                            </span>
                            {/* 进度条（未完成时） */}
                            {!done && (
                              <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-teal rounded-full transition-all"
                                  style={{ width: `${Math.max(progress, 5)}%` }} />
                              </div>
                            )}
                          </div>

                          {/* 领取消息 */}
                          {claimedMsg[task.task_key] && (
                            <div className="mt-0.5 text-[10px] font-medium"
                              style={{ color: claimedMsg[task.task_key].startsWith("✅") ? "#16a34a" : "#dc2626" }}>
                              {claimedMsg[task.task_key]}
                            </div>
                          )}
                        </div>

                        {/* 右侧：奖励 + CTA */}
                        <div className="shrink-0 text-right">
                          <div className="text-[11px] font-bold text-text-primary">{rewardStr(task)}</div>
                          {done && !claimed && (
                            <button onClick={() => handleClaim(task.task_key)}
                              disabled={claiming === task.task_key}
                              className="mt-1.5 w-full min-w-[68px] bg-gradient-to-r from-brand-gold to-brand-gold-dark text-white text-[10px] font-semibold py-2 px-3 rounded-lg active:scale-95 transition-all disabled:opacity-50 shadow-sm">
                              {claiming === task.task_key ? "..." : "领取"}
                            </button>
                          )}
                          {!done && (
                            <div className="mt-1 text-[10px] text-brand-teal font-medium">去完成 →</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═════════════════════════════ ③ 成就里程碑 ═══════════════════════════ */}
      <div className="mx-4 mt-4 bg-surface rounded-2xl shadow-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🏅</span>
          <span className="text-xs font-bold text-text-primary">成就里程碑</span>
          <span className="text-[10px] text-text-tertiary ml-auto">累计 {lifetimeDone} 个任务</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MILESTONES.map(m => {
            const reached = lifetimeDone >= m.count;
            return (
              <div key={m.count} className={`text-center py-3 px-1 rounded-xl transition-all ${
                reached ? "bg-gradient-to-b from-brand-gold-light/60 to-amber-50/80 border border-brand-gold/20" : "bg-gray-50/60 border border-gray-100"
              }`}>
                <div className={`text-xl mb-1 ${reached ? "" : "opacity-30 grayscale"}`}>{m.icon}</div>
                <div className={`text-[11px] font-semibold ${reached ? "text-brand-gold-dark" : "text-text-tertiary"}`}>
                  {m.count}个
                </div>
                <div className={`text-[9px] ${reached ? "text-brand-gold-dark/70" : "text-text-tertiary"}`}>{m.label}</div>
              </div>
            );
          })}
        </div>
        {/* 连续7天额外标签 */}
        <div className="mt-3 flex items-center justify-between bg-gradient-to-r from-brand-teal/10 to-cyan-50/60 rounded-xl px-3.5 py-2.5 border border-brand-teal/10">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <div>
              <div className="text-[11px] font-semibold text-text-primary">连续 7 天勋章</div>
              <div className="text-[10px] text-text-tertiary">连续完成每日任务 7 天即可获得</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-brand-teal">{checkinStreak}/7 天</div>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-brand-teal to-brand-teal-dark rounded-full"
                style={{ width: `${Math.min(100, (checkinStreak / 7) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════ ④ 底部提示 ═══════════════════════════ */}
      {allDone && (
        <div className="mx-4 mt-4 bg-gradient-to-r from-brand-gold/10 to-brand-teal/10 rounded-2xl border border-brand-gold/20 p-4 text-center animate-fade-in">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-sm font-bold text-brand-gold-dark mb-0.5">今日任务全部完成！</div>
          <div className="text-xs text-text-tertiary">明天还有新奖励等着你</div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
